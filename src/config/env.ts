/**
 * Environment configuration utility
 * Provides type-safe access to environment variables
 */

interface EnvironmentConfig {
  // Application
  appMode: 'development' | 'production';
  appName: string;
  appVersion: string;

  // API
  apiBaseUrl: string;
  apiTimeout: number;
  useMockApi: boolean;

  // Features
  enableAuditLog: boolean;
  enableQrGeneration: boolean;

  // Debug
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  // Map
  mapDefaultCenter: {
    lat: number;
    lng: number;
  };
  mapDefaultZoom: number;

  // Session
  sessionTimeout: number;
  tokenRefreshInterval: number;
}

/**
 * Get environment variable value
 */
const getEnv = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    console.warn(`Environment variable ${key} is not defined`);
    return '';
  }
  return value;
};

/**
 * Get boolean environment variable
 */
const getEnvBoolean = (key: string, defaultValue = false): boolean => {
  const value = getEnv(key, String(defaultValue));
  return value === 'true' || value === '1';
};

/**
 * Get number environment variable
 */
const getEnvNumber = (key: string, defaultValue = 0): number => {
  const value = getEnv(key, String(defaultValue));
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

/**
 * Application environment configuration
 */
export const env: EnvironmentConfig = {
  // Application
  appMode: (getEnv('VITE_APP_MODE', 'development') as 'development' | 'production'),
  appName: getEnv('VITE_APP_NAME', 'Trio Admin'),
  appVersion: getEnv('VITE_APP_VERSION', '1.0.0'),

  // API
  apiBaseUrl: getEnv('VITE_API_BASE_URL', 'http://localhost:3000/api'),
  apiTimeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
  useMockApi: getEnvBoolean('VITE_USE_MOCK_API', true),

  // Features
  enableAuditLog: getEnvBoolean('VITE_ENABLE_AUDIT_LOG', true),
  enableQrGeneration: getEnvBoolean('VITE_ENABLE_QR_GENERATION', true),

  // Debug
  debugMode: getEnvBoolean('VITE_DEBUG_MODE', false),
  logLevel: (getEnv('VITE_LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error'),

  // Map
  mapDefaultCenter: {
    lat: getEnvNumber('VITE_MAP_DEFAULT_CENTER_LAT', 40.1792),
    lng: getEnvNumber('VITE_MAP_DEFAULT_CENTER_LNG', 44.4991),
  },
  mapDefaultZoom: getEnvNumber('VITE_MAP_DEFAULT_ZOOM', 12),

  // Session
  sessionTimeout: getEnvNumber('VITE_SESSION_TIMEOUT', 3600000),
  tokenRefreshInterval: getEnvNumber('VITE_TOKEN_REFRESH_INTERVAL', 300000),
};

/**
 * Check if running in development mode
 */
export const isDevelopment = env.appMode === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = env.appMode === 'production';

/**
 * Log environment configuration in development
 */
if (isDevelopment && env.debugMode) {
  console.log('🔧 Environment Configuration:', env);
}
