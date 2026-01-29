/**
 * Production Error Handler
 * Centralized error handling with network timeout, retry logic, and user-friendly messages
 */

/**
 * Network error handler with timeout and retry
 */
export const handleNetworkError = (error) => {
  const errorCode = error?.code || error?.message || 'unknown';
  
  // Network-related errors
  if (errorCode === 'auth/network-request-failed' || errorCode.includes('network')) {
    return {
      success: false,
      error: 'Network error. Please check your internet connection and try again.',
      retryable: true,
      code: 'network-error',
    };
  }
  
  // Service unavailable
  if (errorCode === 'unavailable' || errorCode.includes('unavailable')) {
    return {
      success: false,
      error: 'Service temporarily unavailable. Please try again in a moment.',
      retryable: true,
      code: 'service-unavailable',
    };
  }
  
  // Timeout errors
  if (errorCode === 'timeout' || errorCode.includes('timeout')) {
    return {
      success: false,
      error: 'Request timed out. Please try again.',
      retryable: true,
      code: 'timeout',
    };
  }
  
  // Generic error
  return {
    success: false,
    error: getFriendlyErrorMessage(errorCode),
    retryable: false,
    code: errorCode,
  };
};

/**
 * Get friendly error message
 * Maps error codes to user-friendly messages (hides technical details)
 */
export const getFriendlyErrorMessage = (errorCode) => {
  const errorMap = {
    // Authentication errors
    'auth/email-already-in-use': 'This email is already registered. Please sign in.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/requires-recent-login': 'Please sign out and sign in again to continue.',
    'auth/email-not-verified': 'Please verify your email to continue.',
    'auth/account-disabled': 'Your account has been disabled.',
    'auth/account-not-verified': 'Your account is not verified yet.',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/credential-already-in-use': 'This credential is already associated with another account.',
    
    // Firestore errors
    'permission-denied': 'You do not have permission to perform this action.',
    'not-found': 'The requested resource was not found.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
    'deadline-exceeded': 'Request timed out. Please try again.',
    'failed-precondition': 'Operation cannot be completed. Please try again.',
    'aborted': 'Operation was cancelled. Please try again.',
    'out-of-range': 'Invalid request. Please check your input.',
    'unimplemented': 'This feature is not available yet.',
    'internal': 'An internal error occurred. Please try again later.',
    'unauthenticated': 'Please sign in to continue.',
    
    // Generic errors
    'timeout': 'Request timed out. Please try again.',
    'network-error': 'Network error. Please check your connection.',
    'unknown': 'An unexpected error occurred. Please try again.',
  };
  
  return errorMap[errorCode] || 'An error occurred. Please try again.';
};

/**
 * Add timeout to a promise
 * @param {Promise} promise - The promise to add timeout to
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Promise} Promise that rejects on timeout
 */
export const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} delayMs - Initial delay in milliseconds (default: 1000)
 * @returns {Promise} Result of the function
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error?.code === 'auth/user-not-found' || 
          error?.code === 'auth/wrong-password' ||
          error?.code === 'permission-denied') {
        throw error;
      }
      
      // If not last attempt, wait and retry
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Safe async wrapper with error handling
 * @param {Function} asyncFn - Async function to wrap
 * @returns {Promise} Result with success/error structure
 */
export const safeAsync = async (asyncFn) => {
  try {
    const result = await asyncFn();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: getFriendlyErrorMessage(error?.code || error?.message),
      code: error?.code,
      originalError: process.env.NODE_ENV === 'development' ? error : undefined,
    };
  }
};

/**
 * Log error (only in development, or to error service in production)
 */
export const logError = (error, context = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error, context);
  } else {
    // In production, send to error tracking service (e.g., Sentry, LogRocket)
    // Example: errorTrackingService.captureException(error, { extra: context });
  }
};
