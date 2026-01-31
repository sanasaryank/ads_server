/**
 * Real API Client with authentication and error handling
 */

import { parseApiError, ApiError } from '../errors';
import { navigationService } from '../../utils/navigationService';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

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
 * Real API fetch with retry logic, timeout, and proper error handling
 */
export const realApiFetch = async (
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<Response> => {
  const startTime = performance.now();
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let timeoutId: number | undefined;

    try {
      // Create AbortController for timeout if not provided
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), env.apiTimeout);
      
      // Merge signals if one is provided
      const signal = options.signal 
        ? (() => {
            // If provided signal is already aborted, use it
            if (options.signal.aborted) {
              return options.signal;
            }
            // Otherwise, create a merged signal that aborts if either aborts
            const mergedController = new AbortController();
            options.signal.addEventListener('abort', () => mergedController.abort());
            controller.signal.addEventListener('abort', () => mergedController.abort());
            return mergedController.signal;
          })()
        : controller.signal;

      // Check if aborted before attempting request
      if (signal.aborted) {
        clearTimeout(timeoutId);
        throw new DOMException('Request aborted', 'AbortError');
      }

      const response = await fetch(url, {
        ...options,
        credentials: 'include', // Important: include cookies in all requests
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
        signal,
      });

      clearTimeout(timeoutId);
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
      // Clear timeout to prevent memory leak
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

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
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error('Request failed after retries');
};
