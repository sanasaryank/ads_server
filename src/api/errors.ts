/**
 * API Error Handling
 * Standardized error handling for API responses
 */

/**
 * API Error Response Format
 */
export interface ApiErrorResponse {
  code: number;
  message: string;
}

/**
 * Custom API Error class with structured error information
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: number;
  public readonly errorMessage: string;

  constructor(statusCode: number, errorCode: number, errorMessage: string) {
    // Use the error message if provided, otherwise use status-specific description
    const message = errorMessage || ApiError.getDefaultMessage(statusCode);
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, ApiError);
    }
  }

  /**
   * Get default error message based on status code
   */
  private static getDefaultMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 405:
        return 'Method Not Allowed';
      case 413:
        return 'Content Too Large';
      case 455:
        return 'Application Error';
      case 456:
        return 'Restaurant Not Found';
      case 457:
        return 'Object Not Unique';
      case 458:
        return 'Object Not Found';
      case 460:
        return 'Object Changed';
      case 461:
        return 'Server Data Error';
      case 500:
        return 'Internal Server Error';
      case 502:
        return 'Bad Gateway';
      case 503:
        return 'Service Unavailable';
      default:
        return 'Unhandled error from server';
    }
  }

  /**
   * Get user-friendly error message based on status code
   */
  getUserMessage(): string {
    // Return the server message if provided and not empty
    if (this.errorMessage) {
      return this.errorMessage;
    }

    // Return default message based on status code
    return ApiError.getDefaultMessage(this.statusCode);
  }

  /**
   * Check if error is a specific type
   */
  isRestaurantNotFound(): boolean {
    return this.statusCode === 456;
  }

  isObjectNotUnique(): boolean {
    return this.statusCode === 457;
  }

  isObjectNotFound(): boolean {
    return this.statusCode === 458;
  }

  isObjectChanged(): boolean {
    return this.statusCode === 460;
  }

  isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  isRetryable(): boolean {
    // Retryable errors: network issues, timeouts, 5xx errors
    return this.statusCode === 500 || this.statusCode === 502 || this.statusCode === 503;
  }
}

/**
 * Parse error response from API
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  const statusCode = response.status;
  let errorCode = 0;
  let errorMessage = '';

  try {
    // Try to parse JSON response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data: ApiErrorResponse = await response.json();
      errorCode = data.code || 0;
      errorMessage = data.message || '';
    } else {
      // Non-JSON response, use status text
      errorMessage = response.statusText;
    }
  } catch (e) {
    // Failed to parse response, use status text
    errorMessage = response.statusText;
  }

  return new ApiError(statusCode, errorCode, errorMessage);
}

/**
 * Check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Get error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.getUserMessage();
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
