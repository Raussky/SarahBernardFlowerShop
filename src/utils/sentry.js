import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN } from '@env';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Enable in development for testing, disable in production
    debug: __DEV__,
    // Enable automatic session tracking
    enableAutoSessionTracking: true,
    // Session timeout in milliseconds (30 minutes)
    sessionTrackingIntervalMillis: 30000,
    // Environment
    environment: __DEV__ ? 'development' : 'production',
    // Attach stack trace to all messages
    attachStacktrace: true,
    // Before send callback to filter/modify events
    beforeSend(event, hint) {
      // Don't send events in development if you prefer
      // if (__DEV__) return null;

      // Filter out specific errors if needed
      if (event.exception) {
        const error = hint.originalException;
        // Example: Don't send network timeout errors
        if (error?.message?.includes('Network request failed')) {
          return null;
        }
      }

      return event;
    },
  });
};

/**
 * Capture an exception manually
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
export const captureException = (error, context = {}) => {
  if (!SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    Object.keys(context).forEach((key) => {
      scope.setContext(key, context[key]);
    });
    Sentry.captureException(error);
  });
};

/**
 * Capture a message manually
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (fatal, error, warning, info, debug)
 */
export const captureMessage = (message, level = 'info') => {
  if (!SENTRY_DSN) return;
  Sentry.captureMessage(message, level);
};

/**
 * Set user context for error tracking
 * @param {Object} user - User information
 */
export const setUser = (user) => {
  if (!SENTRY_DSN) return;

  Sentry.setUser(user ? {
    id: user.id,
    email: user.email,
    username: user.user_metadata?.name,
  } : null);
};

/**
 * Add breadcrumb for debugging
 * @param {Object} breadcrumb - Breadcrumb data
 */
export const addBreadcrumb = (breadcrumb) => {
  if (!SENTRY_DSN) return;
  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Set a tag for filtering events
 * @param {string} key - Tag key
 * @param {string} value - Tag value
 */
export const setTag = (key, value) => {
  if (!SENTRY_DSN) return;
  Sentry.setTag(key, value);
};

export default Sentry;
