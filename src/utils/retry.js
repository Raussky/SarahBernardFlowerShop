import { logger } from './logger';

/**
 * Retry utility with exponential backoff
 *
 * Usage:
 *   const data = await retry(() => fetchProducts(), {
 *     maxAttempts: 3,
 *     delayMs: 1000,
 *     exponentialBackoff: true
 *   });
 */

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG = {
  maxAttempts: 3,
  delayMs: 1000,
  exponentialBackoff: true,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
  onRetry: null,
  retryableErrors: [
    'Network request failed',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
  ],
};

/**
 * Check if error is retryable
 */
function isRetryableError(error, retryableErrors) {
  if (!error) return false;

  const errorMessage = error.message || error.toString();

  return retryableErrors.some(retryableMsg =>
    errorMessage.includes(retryableMsg)
  );
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attemptNumber, baseDelay, multiplier, maxDelay) {
  const delay = baseDelay * Math.pow(multiplier, attemptNumber - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} config - Retry configuration
 * @returns {Promise} - Result of successful function call
 * @throws {Error} - Last error if all attempts fail
 */
export async function retry(fn, config = {}) {
  const options = { ...DEFAULT_CONFIG, ...config };
  const {
    maxAttempts,
    delayMs,
    exponentialBackoff,
    backoffMultiplier,
    maxDelayMs,
    onRetry,
    retryableErrors,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();

      if (attempt > 1) {
        logger.info('Retry succeeded', {
          attempt,
          maxAttempts,
        });
      }

      return result;
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error, retryableErrors)) {
        logger.warn('Non-retryable error encountered', {
          error: error.message,
          attempt,
        });
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === maxAttempts) {
        logger.error('All retry attempts failed', error, {
          maxAttempts,
        });
        throw error;
      }

      // Calculate delay
      const delay = exponentialBackoff
        ? calculateDelay(attempt, delayMs, backoffMultiplier, maxDelayMs)
        : delayMs;

      logger.warn('Retry attempt failed, retrying...', {
        attempt,
        maxAttempts,
        delayMs: delay,
        error: error.message,
      });

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt, delay);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // Should never reach here, but just in case
  throw lastError;
}

/**
 * Create a retry wrapper for a function
 *
 * Usage:
 *   const fetchProductsWithRetry = withRetry(fetchProducts, { maxAttempts: 3 });
 *   const data = await fetchProductsWithRetry();
 */
export function withRetry(fn, config = {}) {
  return async (...args) => {
    return retry(() => fn(...args), config);
  };
}

/**
 * Retry configuration presets
 */
export const RETRY_PRESETS = {
  // Quick retry for fast operations
  quick: {
    maxAttempts: 2,
    delayMs: 500,
    exponentialBackoff: false,
  },

  // Standard retry for most operations
  standard: {
    maxAttempts: 3,
    delayMs: 1000,
    exponentialBackoff: true,
    backoffMultiplier: 2,
  },

  // Aggressive retry for critical operations
  aggressive: {
    maxAttempts: 5,
    delayMs: 1000,
    exponentialBackoff: true,
    backoffMultiplier: 2,
    maxDelayMs: 30000,
  },
};
