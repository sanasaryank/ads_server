/**
 * Navigation service for use outside React components
 * This allows API layer and utilities to trigger navigation without direct DOM manipulation
 */

import type { NavigateFunction } from 'react-router-dom';
import { logger } from './logger';

class NavigationService {
  private navigate: NavigateFunction | null = null;

  /**
   * Register the navigate function from React Router
   * Should be called once at app initialization
   */
  setNavigate(navigateFn: NavigateFunction): void {
    this.navigate = navigateFn;
  }

  /**
   * Navigate to a path using React Router
   * Falls back to window.location if navigate is not available
   */
  navigateTo(path: string, options?: { replace?: boolean }): void {
    if (this.navigate) {
      this.navigate(path, options);
    } else {
      // Fallback to direct navigation if React Router is not available
      logger.warn('NavigationService: navigate function not set, using window.location');
      if (options?.replace) {
        window.location.replace(path);
      } else {
        window.location.href = path;
      }
    }
  }

  /**
   * Navigate to login page (used by API client on 401)
   */
  redirectToLogin(): void {
    this.navigateTo('/login', { replace: true });
  }

  /**
   * Reload the current page
   */
  reload(): void {
    window.location.reload();
  }
}

export const navigationService = new NavigationService();
