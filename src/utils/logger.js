/**
 * Structured logging utility
 *
 * Usage:
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Failed to fetch products', error, { context: 'HomeScreen' });
 *   logger.warn('Low stock detected', { productId: '456', stock: 2 });
 */

class Logger {
  constructor() {
    this.isDevelopment = __DEV__;
  }

  /**
   * Format log message with timestamp and metadata
   */
  _formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      message,
      ...meta,
    };
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    const log = this._formatLog('INFO', message, meta);

    if (this.isDevelopment) {
      // Use try/catch to prevent console conflicts with Sentry
      try {
        console.log(`[INFO] ${message}`, meta);
      } catch (e) {
        // Fallback to other logging if console.log fails
        console.log(`[INFO] ${message} (meta: ${JSON.stringify(meta)})`);
      }
    }

    // TODO: Send to analytics service
    // Analytics.track('log_info', log);

    // TODO: Send to Sentry as breadcrumb
    // Sentry.addBreadcrumb({
    //   message,
    //   level: 'info',
    //   data: meta,
    // });

    return log;
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    const log = this._formatLog('WARN', message, meta);

    try {
      console.warn(`[WARN] ${message}`, meta);
    } catch (e) {
      // Fallback to other logging if console.warn fails
      console.log(`[WARN] ${message} (meta: ${JSON.stringify(meta)})`);
    }

    // TODO: Send to Sentry as breadcrumb
    // Sentry.addBreadcrumb({
    //   message,
    //   level: 'warning',
    //   data: meta,
    // });

    return log;
  }

  /**
   * Log error message
   */
  error(message, error = null, meta = {}) {
    const log = this._formatLog('ERROR', message, {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : null,
    });

    try {
      console.error(`[ERROR] ${message}`, error, meta);
    } catch (e) {
      // Fallback to other logging if console.error fails
      console.log(`[ERROR] ${message} (error: ${error?.message || 'null'}, meta: ${JSON.stringify(meta)})`);
    }

    // TODO: Send to Sentry
    // if (error instanceof Error) {
    //   Sentry.captureException(error, {
    //     extra: meta,
    //     tags: {
    //       context: meta.context || 'unknown',
    //     },
    //   });
    // } else {
    //   Sentry.captureMessage(message, {
    //     level: 'error',
    //     extra: { ...meta, error },
    //   });
    // }

    return log;
  }

  /**
   * Log debug message (only in development)
   */
  debug(message, meta = {}) {
    if (!this.isDevelopment) return;

    const log = this._formatLog('DEBUG', message, meta);
    try {
      console.log(`[DEBUG] ${message}`, meta);
    } catch (e) {
      // Fallback to other logging if console.log fails
      console.log(`[DEBUG] ${message} (meta: ${JSON.stringify(meta)})`);
    }

    return log;
  }

  /**
   * Track user action
   */
  trackEvent(eventName, properties = {}) {
    const log = this._formatLog('EVENT', eventName, properties);

    if (this.isDevelopment) {
      try {
        console.log(`[EVENT] ${eventName}`, properties);
      } catch (e) {
        // Fallback to other logging if console.log fails
        console.log(`[EVENT] ${eventName} (properties: ${JSON.stringify(properties)})`);
      }
    }

    // TODO: Send to analytics
    // Analytics.track(eventName, properties);

    return log;
  }

  /**
   * Track screen view
   */
  trackScreen(screenName, properties = {}) {
    const log = this._formatLog('SCREEN', screenName, properties);

    if (this.isDevelopment) {
      try {
        console.log(`[SCREEN] ${screenName}`, properties);
      } catch (e) {
        // Fallback to other logging if console.log fails
        console.log(`[SCREEN] ${screenName} (properties: ${JSON.stringify(properties)})`);
      }
    }

    // TODO: Send to analytics
    // Analytics.screen(screenName, properties);

    return log;
  }

  /**
   * Track API call
   */
  trackApiCall(method, endpoint, duration, statusCode, error = null) {
    const log = this._formatLog('API', `${method} ${endpoint}`, {
      method,
      endpoint,
      duration,
      statusCode,
      error: error ? error.message : null,
    });

    if (this.isDevelopment) {
      try {
        console.log(`[API] ${method} ${endpoint} - ${statusCode} (${duration}ms)`, error);
      } catch (e) {
        // Fallback to other logging if console.log fails
        console.log(`[API] ${method} ${endpoint} - ${statusCode} (${duration}ms) (error: ${error?.message || 'null'})`);
      }
    }

    // TODO: Send to monitoring service
    // if (statusCode >= 400) {
    //   Sentry.captureMessage(`API Error: ${method} ${endpoint}`, {
    //     level: 'error',
    //     extra: log,
    //   });
    // }

    return log;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };
