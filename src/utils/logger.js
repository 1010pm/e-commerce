/**
 * Logger Utility - Production-Safe Logging
 * Only logs in development mode
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log info messages (development only)
   */
  info: (label, data) => {
    if (isDev) {
      console.log(`ℹ️ ${label}`, data);
    }
  },

  /**
   * Log warning messages (development only)
   */
  warn: (label, data) => {
    if (isDev) {
      console.warn(`⚠️ ${label}`, data);
    }
  },

  /**
   * Log error messages (development only)
   */
  error: (label, data) => {
    if (isDev) {
      console.error(`❌ ${label}`, data);
    }
  },

  /**
   * Log success messages (development only)
   */
  success: (label, data) => {
    if (isDev) {
      console.log(`✅ ${label}`, data);
    }
  },

  /**
   * Log step-by-step flow (development only)
   */
  step: (stepNumber, message, data) => {
    if (isDev) {
      console.log(`Step ${stepNumber}️⃣ ${message}`, data || '');
    }
  },

  /**
   * Report error to external service in production
   * (e.g., Sentry, LogRocket, etc.)
   */
  reportError: (error, context = {}) => {
    if (!isDev) {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(error, { extra: context });
      console.error('Production Error:', error, context);
    } else {
      console.error('❌ Error:', error, context);
    }
  },
};

export default logger;
