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
      console.log(`[INFO] ${message}`, meta);
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

    console.warn(`[WARN] ${message}`, meta);

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

    console.error(`[ERROR] ${message}`, error, meta);

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
    console.log(`[DEBUG] ${message}`, meta);

    return log;
  }

  /**
   * Track user action
   */
  trackEvent(eventName, properties = {}) {
    const log = this._formatLog('EVENT', eventName, properties);

    if (this.isDevelopment) {
      console.log(`[EVENT] ${eventName}`, properties);
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
      console.log(`[SCREEN] ${screenName}`, properties);
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
      console.log(`[API] ${method} ${endpoint} - ${statusCode} (${duration}ms)`, error);
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
