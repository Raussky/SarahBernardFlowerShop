/**
 * Environment configuration
 *
 * Centralizes environment variable access and provides defaults
 */

import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@env';
import { logger } from '../utils/logger';

/**
 * Environment type
 */
export const ENV = __DEV__ ? 'development' : 'production';

/**
 * Check if running in development
 */
export const isDevelopment = __DEV__;

/**
 * Check if running in production
 */
export const isProduction = !__DEV__;

/**
 * Supabase configuration
 */
export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_PUBLISHABLE_KEY,
};

/**
 * Validate required environment variables
 */
export function validateEnv() {
  const required = {
    SUPABASE_URL: supabaseConfig.url,
    SUPABASE_PUBLISHABLE_KEY: supabaseConfig.anonKey,
  };

  const missing = [];

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(error, null, { context: 'Environment Validation' });

    if (isProduction) {
      throw new Error(error);
    }

    return false;
  }

  return true;
}

/**
 * App configuration
 */
export const appConfig = {
  // App info
  name: 'Sarah Bernard Flower Shop',
  version: '1.0.0',
  environment: ENV,

  // Features flags (can be moved to remote config later)
  features: {
    enableAnalytics: isProduction,
    enableErrorReporting: isProduction,
    enablePushNotifications: false,
    enableOfflineMode: false,
    enableDebugMode: isDevelopment,
  },

  // API configuration
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // Cache configuration
  cache: {
    enabled: true,
    ttl: {
      short: 5 * 60 * 1000,     // 5 minutes
      medium: 15 * 60 * 1000,   // 15 minutes
      long: 60 * 60 * 1000,     // 1 hour
    },
  },

  // Logging configuration
  logging: {
    level: isDevelopment ? 'debug' : 'error',
    enableConsole: isDevelopment,
    enableRemote: isProduction,
  },

  // Sentry configuration (when implemented)
  sentry: {
    dsn: null, // Add your Sentry DSN here
    environment: ENV,
    enabled: isProduction,
    tracesSampleRate: 1.0,
    beforeSend: (event) => {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    },
  },

  // Analytics configuration (when implemented)
  analytics: {
    enabled: isProduction,
    debugMode: isDevelopment,
  },
};

/**
 * Get configuration value by path
 *
 * Usage: getConfig('features.enableAnalytics')
 */
export function getConfig(path, defaultValue = null) {
  const keys = path.split('.');
  let value = appConfig;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value;
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(featureName) {
  return getConfig(`features.${featureName}`, false);
}

// Validate environment on import
validateEnv();
