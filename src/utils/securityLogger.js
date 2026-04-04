/**
 * Security Logging Utility
 * Logs authentication events and suspicious activities for monitoring and auditing
 * 
 * SECURITY: Never log sensitive data (passwords, tokens, full credit card numbers)
 */

const LOG_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  SECURITY: 'SECURITY', // For security-related events
};

/**
 * Format log entry
 * @param {string} level - Log level
 * @param {string} event - Event name
 * @param {Object} data - Event data (sanitized)
 * @returns {Object} Formatted log entry
 */
const formatLogEntry = (level, event, data = {}) => {
  return {
    timestamp: new Date().toISOString(),
    level,
    event,
    data: sanitizeLogData(data),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };
};

/**
 * Sanitize log data to prevent logging sensitive information
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'socialSecurityNumber',
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Sanitize nested objects
  for (const key in sanitized) {
    if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Log authentication event
 * @param {string} event - Event name (login, logout, register, etc.)
 * @param {Object} data - Event data
 * @param {string} level - Log level
 */
export const logAuthEvent = (event, data = {}, level = LOG_LEVELS.INFO) => {
  const logEntry = formatLogEntry(level, `AUTH_${event.toUpperCase()}`, data);
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to your logging service (e.g., Firebase Analytics, Sentry, etc.)
    // Example: sendToLoggingService(logEntry);
    console.log('[AUTH LOG]', logEntry);
  } else {
    // In development, log to console
    console.log(`[AUTH ${level}]`, event, sanitizeLogData(data));
  }
};

/**
 * Log security event (suspicious activity)
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const logSecurityEvent = (event, data = {}) => {
  const logEntry = formatLogEntry(LOG_LEVELS.SECURITY, `SECURITY_${event.toUpperCase()}`, data);
  
  // Always log security events, even in production
  console.warn('[SECURITY EVENT]', logEntry);
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to security monitoring service
    // Example: sendToSecurityService(logEntry);
  }
};

/**
 * Log failed authentication attempt
 * @param {string} action - Action type (login, register, etc.)
 * @param {string} identifier - User identifier (email, IP, etc.)
 * @param {string} reason - Failure reason
 */
export const logFailedAuthAttempt = (action, identifier, reason) => {
  logSecurityEvent('FAILED_AUTH_ATTEMPT', {
    action,
    identifier: identifier ? identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'unknown', // Partially mask email
    reason,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log rate limit trigger
 * @param {string} action - Action type
 * @param {string} identifier - User identifier
 */
export const logRateLimitTrigger = (action, identifier) => {
  logSecurityEvent('RATE_LIMIT_TRIGGERED', {
    action,
    identifier: identifier ? identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'unknown',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log suspicious activity
 * @param {string} activity - Activity description
 * @param {Object} data - Additional data
 */
export const logSuspiciousActivity = (activity, data = {}) => {
  logSecurityEvent('SUSPICIOUS_ACTIVITY', {
    activity,
    ...sanitizeLogData(data),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log successful authentication
 * @param {string} action - Action type
 * @param {string} userId - User ID
 */
export const logSuccessfulAuth = (action, userId) => {
  logAuthEvent(`${action}_SUCCESS`, {
    userId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log logout event
 * @param {string} userId - User ID
 */
export const logLogout = (userId) => {
  logAuthEvent('LOGOUT', {
    userId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log password reset request
 * @param {string} email - User email (partially masked)
 */
export const logPasswordResetRequest = (email) => {
  logAuthEvent('PASSWORD_RESET_REQUEST', {
    email: email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'unknown',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log email verification event
 * @param {string} userId - User ID
 * @param {boolean} success - Whether verification was successful
 */
export const logEmailVerification = (userId, success) => {
  logAuthEvent('EMAIL_VERIFICATION', {
    userId,
    success,
    timestamp: new Date().toISOString(),
  });
};
