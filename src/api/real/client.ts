/**
 * Real API Client with authentication and error handling
 */

import { parseApiError, ApiError } from '../errors';
import { navigationService } from '../../utils/navigationService';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

/**
 * Circuit Breaker to prevent cascading failures
 * Note: Disabled by default to prevent blocking legitimate requests
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly failureThreshold = 100; // Very high threshold - essentially disabled
  private readonly resetTimeout = 5000; // 5 seconds - short cooldown

  /**
   * Execute a function with circuit breaker protection
   * Circuit breaker is effectively disabled with very high threshold
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Circuit breaker is essentially disabled - just execute and track failures for monitoring
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.failures > 0) {
      logger.debug('Request succeeded after failures', {
        previousFailures: this.failures,
      });
    }
    
    // Reset failure count
    this.failures = 0;
    this.state = 'closed';
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();

    // Just log for monitoring - don't block requests
    if (this.failures % 10 === 0) {
      logger.warn('Multiple request failures detected', {
        failures: this.failures,
        note: 'Circuit breaker disabled - requests will continue',
      });
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): { state: 'closed' | 'open' | 'half-open'; failures: number } {
    return {
      state: this.state,
      failures: this.failures,
    };
  }

  /**
   * Manually reset circuit breaker (for testing/admin purposes)
   */
  reset(): void {
    this.failures = 0;
    this.lastFailTime = 0;
    this.state = 'closed';
    logger.info('Circuit breaker manually reset');
  }
}

// Global circuit breaker instance (effectively disabled)
const circuitBreaker = new CircuitBreaker();

const getAuthHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};

const handleUnauthorized = () => {
  // Redirect to login using navigation service (React Router)
  navigationService.redirectToLogin();
};

/**
 * Map to track pending requests for deduplication
 */
const pendingRequests = new Map<string, Promise<Response>>();

/**
 * Sleep function for retry delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if error is retryable (network errors, 5xx, timeout)
 */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    // Network errors (fetch failures, connection refused)
    return true;
  }
  if (error instanceof Error) {
    // Timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return true;
    }
  }
  if (error instanceof ApiError) {
    // 5xx server errors are retryable
    return error.statusCode >= 500 && error.statusCode < 600;
  }
  return false;
};

/**
 * Real API fetch with retry logic, timeout, circuit breaker, request deduplication, and proper error handling
 */
export const realApiFetch = async (
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<Response> => {
  // Create deduplication key from method and URL
  // Note: We don't include body in the key to keep it simple, but you could hash it for POST/PUT requests
  const requestKey = `${options.method || 'GET'}:${url}`;
  
  // Check if identical request is already pending
  if (pendingRequests.has(requestKey)) {
    logger.debug('Deduplicating concurrent request', { method: options.method || 'GET', url });
    return pendingRequests.get(requestKey)!;
  }
  
  // Create the request promise and store it for deduplication
  const requestPromise = circuitBreaker.execute(async () => {
    const startTime = performance.now();
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let timeoutId: number | undefined;
      let timeoutController: AbortController | undefined;
      let mergedController: AbortController | undefined;
      const abortHandlers: Array<{ signal: AbortSignal; handler: () => void }> = [];

      try {
        // Create AbortController for timeout if not provided
        timeoutController = new AbortController();
        timeoutId = setTimeout(() => timeoutController!.abort(), env.apiTimeout);
        
        // Merge signals if one is provided
        const signal = options.signal 
          ? (() => {
              // If provided signal is already aborted, use it
              if (options.signal.aborted) {
                return options.signal;
              }
              // Otherwise, create a merged signal that aborts if either aborts
              mergedController = new AbortController();
              
              // Track handlers for cleanup
              const optionsHandler = () => mergedController!.abort();
              const timeoutHandler = () => mergedController!.abort();
              
              options.signal.addEventListener('abort', optionsHandler);
              timeoutController.signal.addEventListener('abort', timeoutHandler);
              
              abortHandlers.push(
                { signal: options.signal, handler: optionsHandler },
                { signal: timeoutController.signal, handler: timeoutHandler }
              );
              
              return mergedController.signal;
            })()
          : timeoutController.signal;

        // Check if aborted before attempting request
        if (signal.aborted) {
          throw new DOMException('Request aborted', 'AbortError');
        }

        const response = await fetch(url, {
          ...options,
          credentials: 'include', // Important: include cookies in all requests
          cache: 'no-store', // Disable browser caching - always fetch fresh data
          headers: {
            ...getAuthHeaders(),
            ...options.headers,
          },
          signal,
        });

        const duration = performance.now() - startTime;

        // Log API call
        logger.api(options.method || 'GET', url, response.status, duration);

        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
          handleUnauthorized();
          throw new ApiError(401, 0, 'Unauthorized');
        }

        // Handle other error status codes
        if (!response.ok) {
          const apiError = await parseApiError(response);
          
          // Don't retry on last attempt or non-retryable errors
          if (attempt === maxRetries - 1 || !isRetryableError(apiError)) {
            throw apiError;
          }
          
          lastError = apiError;
          
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn(`Retrying API request (${attempt + 1}/${maxRetries})`, {
            url,
            method: options.method || 'GET',
            status: response.status,
            delay,
          });

          await sleep(delay);
          continue;
        }

        return response;

      } catch (error) {
        const duration = performance.now() - startTime;
        logger.api(options.method || 'GET', url, undefined, duration);

        // Don't retry on abort
        if (error instanceof DOMException && error.name === 'AbortError') {
          logger.debug('API request aborted', { url, method: options.method || 'GET' });
          throw error;
        }

        // Don't retry non-retryable errors or on last attempt
        if (attempt === maxRetries - 1 || !isRetryableError(error)) {
          logger.error('API request failed', error as Error, {
            url,
            method: options.method || 'GET',
            attempt: attempt + 1,
          });
          throw error;
        }

        lastError = error;

        // Exponential backoff for network errors: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn(`Retrying API request after error (${attempt + 1}/${maxRetries})`, {
          url,
          method: options.method || 'GET',
          delay,
          error: error instanceof Error ? error.message : String(error),
        });

        await sleep(delay);
      } finally {
        // Always clear timeout to prevent memory leak
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
        
        // Remove event listeners to prevent memory leaks
        abortHandlers.forEach(({ signal, handler }) => {
          try {
            signal.removeEventListener('abort', handler);
          } catch (e) {
            // Ignore - signal might be disposed
          }
        });
        
        // Don't abort the controllers - they should naturally complete or be garbage collected
        // Aborting them causes "user aborted request" messages even for successful requests
      }
    }

    // Should never reach here, but just in case
    throw lastError || new ApiError(500, 0, 'Request failed after retries with unknown error');
  });
  
  // Store the promise for deduplication
  pendingRequests.set(requestKey, requestPromise);
  
  try {
    return await requestPromise;
  } finally {
    // Clean up after request completes (success or failure)
    pendingRequests.delete(requestKey);
  }
};

/**
 * Export circuit breaker for monitoring/testing purposes
 */
export const getCircuitBreakerState = () => circuitBreaker.getState();
export const resetCircuitBreaker = () => circuitBreaker.reset();

/**
 * Safely parse JSON from response, handling empty responses and non-JSON content.
 * 
 * @param response - The fetch Response object
 * @returns Parsed JSON data or null for empty responses
 * @throws ApiError if response is not JSON or parsing fails
 */
export const parseJsonResponse = async <T>(response: Response): Promise<T | null> => {
  // Handle 204 No Content and 205 Reset Content
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  // Check content-type header
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    logger.warn('Non-JSON response received', {
      url: response.url,
      status: response.status,
      contentType,
    });
    
    // For successful requests with non-JSON content, return null
    if (response.ok) {
      return null;
    }
    
    // For error responses, throw ApiError
    throw new ApiError(
      response.status,
      0,
      `Expected JSON response but received ${contentType || 'unknown content type'}`
    );
  }

  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    logger.error('Failed to parse JSON response', error as Error, {
      url: response.url,
      status: response.status,
    });
    
    throw new ApiError(
      response.status,
      0,
      'Failed to parse response as JSON'
    );
  }
};
