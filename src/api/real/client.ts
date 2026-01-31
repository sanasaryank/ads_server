/**
 * Real API Client with authentication and error handling
 */

import { parseApiError, ApiError } from '../errors';
import { navigationService } from '../../utils/navigationService';

const getAuthHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};

const handleUnauthorized = () => {
  // Redirect to login using navigation service (React Router)
  navigationService.redirectToLogin();
};

export const realApiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Important: include cookies in all requests
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, 0, 'Unauthorized');
  }

  // Handle other error status codes
  if (!response.ok) {
    const apiError = await parseApiError(response);
    throw apiError;
  }

  return response;
};
