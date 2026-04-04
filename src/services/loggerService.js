/**
 * Logger Service - Production Ready
 * Centralized logging for debugging and monitoring
 * خدمة السجلات
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const LOG_COLORS = {
  DEBUG: '#7c7c7c',
  INFO: '#0066cc',
  WARN: '#ff9900',
  ERROR: '#cc0000',
};

/**
 * Logger Service
 */
export const loggerService = {
  /**
   * Format timestamp
   * @returns {string} Formatted timestamp
   */
  getTimestamp: () => {
    return new Date().toISOString();
  },

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {any} data - Additional data
   * @returns {object} Formatted log object
   */
  formatLog: (level, message, data = null) => {
    return {
      timestamp: loggerService.getTimestamp(),
      level,
      message,
      data,
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    };
  },

  /**
   * Log to console with styling
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  log: (level, message, data = null) => {
    const formattedLog = loggerService.formatLog(level, message, data);
    const color = LOG_COLORS[level] || LOG_COLORS.INFO;
    const timestamp = formattedLog.timestamp;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `%c[${timestamp}] ${level}: ${message}`,
        `color: ${color}; font-weight: bold;`
      );

      if (data) {
        console.log('Data:', data);
      }
    } else {
      // In production, use regular console with minimal output
      if (level === 'ERROR' || level === 'WARN') {
        console.log(`[${timestamp}] ${level}: ${message}`);
        if (data) {
          console.log(data);
        }
      }
    }

    return formattedLog;
  },

  /**
   * Debug log
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  debug: (message, data = null) => {
    return loggerService.log(LOG_LEVELS.DEBUG, message, data);
  },

  /**
   * Info log
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  info: (message, data = null) => {
    return loggerService.log(LOG_LEVELS.INFO, message, data);
  },

  /**
   * Warning log
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  warn: (message, data = null) => {
    return loggerService.log(LOG_LEVELS.WARN, message, data);
  },

  /**
   * Error log
   * @param {string} message - Log message
   * @param {Error} error - Error object
   */
  error: (message, error = null) => {
    const errorData = error
      ? {
          message: error.message,
          code: error.code,
          stack: error.stack,
        }
      : null;

    return loggerService.log(LOG_LEVELS.ERROR, message, errorData);
  },

  /**
   * Log API call
   * @param {string} method - HTTP method
   * @param {string} url - API URL
   * @param {number} status - HTTP status code
   * @param {number} duration - Request duration in ms
   */
  logApiCall: (method, url, status, duration = null) => {
    const statusColor =
      status >= 200 && status < 300
        ? 'green'
        : status >= 400 && status < 500
        ? 'orange'
        : status >= 500
        ? 'red'
        : 'gray';

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `%c${method} %c${url} %c${status}${duration ? ` ${duration}ms` : ''}`,
        'color: #666; font-weight: bold;',
        'color: #0066cc;',
        `color: ${statusColor}; font-weight: bold;`
      );
    }

    return loggerService.formatLog(LOG_LEVELS.INFO, `API: ${method} ${url} ${status}`, {
      duration,
    });
  },

  /**
   * Log user action
   * @param {string} action - Action name
   * @param {string} details - Action details
   * @param {any} metadata - Additional metadata
   */
  logUserAction: (action, details = null, metadata = null) => {
    return loggerService.info(`User Action: ${action}`, {
      details,
      metadata,
    });
  },

  /**
   * Log authentication event
   * @param {string} event - Auth event (login, logout, signup, etc)
   * @param {string} userId - User ID (if available)
   * @param {boolean} success - Success status
   */
  logAuthEvent: (event, userId = null, success = true) => {
    const message = `Auth Event: ${event}`;
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;

    return loggerService.log(level, message, {
      userId,
      success,
    });
  },

  /**
   * Log performance metrics
   * @param {string} label - Performance label
   * @param {number} duration - Duration in ms
   */
  logPerformance: (label, duration) => {
    return loggerService.info(`Performance: ${label}`, {
      duration: `${duration}ms`,
    });
  },

  /**
   * Clear all logs (development only)
   */
  clear: () => {
    if (process.env.NODE_ENV === 'development') {
      console.clear();
    }
  },

  /**
   * Export logs (for debugging)
   * @returns {string} JSON string of logs
   */
  exportLogs: () => {
    if (typeof window !== 'undefined' && window.__logs) {
      return JSON.stringify(window.__logs, null, 2);
    }
    return 'No logs available';
  },
};

// Initialize logs storage in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.__logs = [];

  // Intercept console methods
  const originalLog = console.log;
  console.log = function (...args) {
    window.__logs.push({
      timestamp: new Date().toISOString(),
      type: 'log',
      args,
    });
    originalLog.apply(console, args);
  };
}

export default loggerService;
