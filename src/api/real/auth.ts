import type { LoginRequest, LoginResponse, User } from '../../types';
import { realApiFetch } from './client';
import { parseApiError } from '../errors';
import { env } from '../../config/env';
import { API_ENDPOINTS } from '../../config/api';
import { logger } from '../../utils/logger';

const AUTH_BASE_URL = `${env.apiBaseUrl}${API_ENDPOINTS.auth}`;

export const realAuthApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // Create Basic Auth header
    const basicAuth = btoa(`${credentials.username}:${credentials.password}`);

    // Server will set HttpOnly cookie named "ads_token"
    // Note: We don't use realApiFetch here to avoid 401 redirect during login
    const response = await fetch(`${AUTH_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies in request
    });

    if (!response.ok) {
      const apiError = await parseApiError(response);
      throw apiError;
    }

    const data: LoginResponse = await response.json();
    // No need to store anything - cookie is managed by browser
    return data;
  },

  me: async (): Promise<User> => {
    // Fetch current user from backend using cookie authentication
    const response = await realApiFetch(`${AUTH_BASE_URL}/me`, {
      method: 'GET',
    });

    const data: User = await response.json();
    return data;
  },

  logout: async (): Promise<void> => {
    // Call server to clear the HttpOnly cookie
    try {
      await realApiFetch(`${AUTH_BASE_URL}/logout`, {
        method: 'POST',
      });
    } catch (error) {
      // Even if logout fails, we continue since cookie might be cleared
      logger.warn('Logout request failed', error as Error);
    }
  },
};
