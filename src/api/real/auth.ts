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

    let lastError: unknown;
    const maxRetries = 2; // Fewer retries for login to avoid account lockouts

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let timeoutId: number | undefined;

      try {
        // Create timeout signal
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), env.apiTimeout);

        // Server will set HttpOnly cookie named "ads_token"
        // Note: We don't use realApiFetch here to avoid 401 redirect during login
        const response = await fetch(`${AUTH_BASE_URL}/login`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important: include cookies in request
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const apiError = await parseApiError(response);
          // Don't retry auth errors (401, 403) - invalid credentials
          if (response.status === 401 || response.status === 403 || attempt === maxRetries - 1) {
            throw apiError;
          }
          
          // Only retry on network/server errors
          if (response.status >= 500) {
            lastError = apiError;
            const delay = Math.pow(2, attempt) * 1000;
            logger.warn(`Retrying login request (${attempt + 1}/${maxRetries})`, { delay });
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw apiError;
        }

        const data: LoginResponse = await response.json();
        // No need to store anything - cookie is managed by browser
        return data;

      } catch (error) {
        // Clear timeout to prevent memory leak
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }

        // Don't retry on abort or auth errors
        if (error instanceof DOMException && error.name === 'AbortError') {
          logger.debug('Login request aborted');
          throw error;
        }

        // Only retry network errors (TypeError = network failure)
        if (attempt === maxRetries - 1 || !(error instanceof TypeError)) {
          logger.error('Login request failed', error as Error);
          throw error;
        }

        lastError = error;
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn(`Retrying login after network error (${attempt + 1}/${maxRetries})`, {
          delay,
          error: error instanceof Error ? error.message : String(error),
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Login failed after retries');
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
