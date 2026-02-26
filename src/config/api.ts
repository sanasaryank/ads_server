/**
 * API Endpoints Configuration
 * Centralized configuration for all API endpoints used throughout the application.
 * This prevents hardcoding URLs and makes it easier to maintain and update endpoints.
 */

export const API_ENDPOINTS = {
  auth: '/auth',
  advertisers: '/advertisers',
  campaigns: '/campaigns',
  creatives: '/creatives',
  restaurants: '/restaurants',
  schedules: '/schedules',
  slots: '/adslots',
  dictionaries: '/dictionaries',
  locations: '/locations',
  audit: '/audit',
} as const;

// Type-safe endpoint keys
export type ApiEndpoint = keyof typeof API_ENDPOINTS;
