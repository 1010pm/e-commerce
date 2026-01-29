/**
 * Rate Limiter Utility
 * Prevents abuse by limiting authentication attempts and other actions
 */

const RATE_LIMIT_STORAGE_KEY = 'rate_limit_attempts';

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 30 * 60 * 1000, // 30 minutes lockout
  },
  register: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 60 * 60 * 1000, // 1 hour lockout
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 60 * 60 * 1000, // 1 hour lockout
  },
  resendVerification: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 30 * 60 * 1000, // 30 minutes lockout
  },
};

/**
 * Check if action is rate limited
 * @param {string} action - Action type (login, register, etc.)
 * @param {string} identifier - User identifier (email, IP, etc.)
 * @returns {Object} Rate limit status
 */
export const checkRateLimit = (action, identifier) => {
  const config = RATE_LIMITS[action];
  if (!config) {
    return { allowed: true };
  }

  const key = `${RATE_LIMIT_STORAGE_KEY}_${action}_${identifier}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    return { allowed: true };
  }

  const data = JSON.parse(stored);
  const now = Date.now();

  // Check if locked out
  if (data.lockUntil && now < data.lockUntil) {
    const minutesRemaining = Math.ceil((data.lockUntil - now) / 60000);
    return {
      allowed: false,
      locked: true,
      minutesRemaining,
      message: `Too many failed attempts. Please try again in ${minutesRemaining} minute(s).`,
    };
  }

  // Check if window expired
  if (now > data.windowEnd) {
    // Reset window
    localStorage.removeItem(key);
    return { allowed: true };
  }

  // Check if max attempts reached
  if (data.attempts >= config.maxAttempts) {
    // Lock out
    const lockUntil = now + config.lockoutMs;
    localStorage.setItem(key, JSON.stringify({
      ...data,
      lockUntil,
    }));
    
    const minutesRemaining = Math.ceil((lockUntil - now) / 60000);
    return {
      allowed: false,
      locked: true,
      minutesRemaining,
      message: `Too many failed attempts. Please try again in ${minutesRemaining} minute(s).`,
    };
  }

  return {
    allowed: true,
    attemptsRemaining: config.maxAttempts - data.attempts,
  };
};

/**
 * Record a failed attempt
 * @param {string} action - Action type
 * @param {string} identifier - User identifier
 */
export const recordFailedAttempt = (action, identifier) => {
  const config = RATE_LIMITS[action];
  if (!config) return;

  const key = `${RATE_LIMIT_STORAGE_KEY}_${action}_${identifier}`;
  const stored = localStorage.getItem(key);
  const now = Date.now();

  if (!stored) {
    // First attempt in new window
    localStorage.setItem(key, JSON.stringify({
      attempts: 1,
      windowStart: now,
      windowEnd: now + config.windowMs,
      lockUntil: null,
    }));
  } else {
    const data = JSON.parse(stored);
    
    // If window expired, start new window
    if (now > data.windowEnd) {
      localStorage.setItem(key, JSON.stringify({
        attempts: 1,
        windowStart: now,
        windowEnd: now + config.windowMs,
        lockUntil: null,
      }));
    } else {
      // Increment attempts
      localStorage.setItem(key, JSON.stringify({
        ...data,
        attempts: data.attempts + 1,
      }));
    }
  }
};

/**
 * Clear rate limit for an action
 * @param {string} action - Action type
 * @param {string} identifier - User identifier
 */
export const clearRateLimit = (action, identifier) => {
  const key = `${RATE_LIMIT_STORAGE_KEY}_${action}_${identifier}`;
  localStorage.removeItem(key);
};

/**
 * Clear all rate limits (for testing or logout)
 */
export const clearAllRateLimits = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(RATE_LIMIT_STORAGE_KEY)) {
      localStorage.removeItem(key);
    }
  });
};
