/**
 * API Client Configuration
 * Base configuration for HTTP requests
 */

import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * API configuration object
 */
export const apiConfig = {
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Create full API URL from endpoint
 */
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = apiConfig.baseURL.endsWith('/') 
    ? apiConfig.baseURL.slice(0, -1) 
    : apiConfig.baseURL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Get authorization header
 */
export const getAuthHeader = (): Record<string, string> => {
  // With cookie-based auth, no Authorization header needed
  return {};
};

/**
 * Create fetch options with default configuration
 */
export const createFetchOptions = (
  method: string,
  body?: unknown,
  signal?: AbortSignal,
): RequestInit => {
  const options: RequestInit = {
    method,
    credentials: 'include', // Include cookies for authentication
    headers: {
      ...apiConfig.headers,
      ...getAuthHeader(),
    },
    signal: signal || AbortSignal.timeout(apiConfig.timeout),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
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
    // Network errors (fetch failures)
    return true;
  }
  if (error instanceof Error) {
    // Timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return true;
    }
    // 5xx server errors
    if (error.message.match(/API Error: 5\d\d/)) {
      return true;
    }
  }
  return false;
};

/**
 * API request wrapper with error handling
 */
export const apiRequest = async <T>(
  endpoint: string,
  method: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const url = createApiUrl(endpoint);
    const options = createFetchOptions(method, body, signal);
    
    logger.debug(`API ${method} ${endpoint}`, body);

    const response = await fetch(url, options);
    const duration = performance.now() - startTime;

    logger.api(method, endpoint, response.status, duration);

    if (!response.ok) {
      const error = new Error(`API Error: ${response.status} ${response.statusText}`);
      logger.error(`API request failed: ${method} ${endpoint}`, error, {
        status: response.status,
        statusText: response.statusText,
      });
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.api(method, endpoint, undefined, duration);
    logger.error(`API request exception: ${method} ${endpoint}`, error);
    throw error;
  }
};

/**
 * API request with retry logic
 */
export const apiRequestWithRetry = async <T>(
  endpoint: string,
  method: string,
  body?: unknown,
  maxRetries: number = 3,
  signal?: AbortSignal,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Check if aborted before attempting request
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }

    try {
      return await apiRequest<T>(endpoint, method, body, signal);
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt or non-retryable errors
      if (attempt === maxRetries - 1 || !isRetryableError(error)) {
        throw error;
      }

      // Don't retry if aborted
      if (signal?.aborted) {
        throw new DOMException('Request aborted', 'AbortError');
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      logger.warn(`Retrying request (${attempt + 1}/${maxRetries})`, {
        endpoint,
        method,
        delay,
        error: error instanceof Error ? error.message : String(error),
      });

      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * HTTP Methods
 */
export const api = {
  get: <T>(endpoint: string, signal?: AbortSignal) => apiRequestWithRetry<T>(endpoint, 'GET', undefined, 3, signal),
  post: <T>(endpoint: string, body: unknown, signal?: AbortSignal) => apiRequestWithRetry<T>(endpoint, 'POST', body, 3, signal),
  put: <T>(endpoint: string, body: unknown, signal?: AbortSignal) => apiRequestWithRetry<T>(endpoint, 'PUT', body, 3, signal),
  patch: <T>(endpoint: string, body: unknown, signal?: AbortSignal) => apiRequestWithRetry<T>(endpoint, 'PATCH', body, 3, signal),
  delete: <T>(endpoint: string, signal?: AbortSignal) => apiRequestWithRetry<T>(endpoint, 'DELETE', undefined, 3, signal),
};

export default api;
