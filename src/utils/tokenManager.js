/**
 * Token Management Utility
 * Handles token expiration and auto-logout for expired sessions
 * 
 * SECURITY: Firebase handles JWT tokens automatically, but we add
 * additional session management and expiration checks
 */

import { auth } from '../config/firebase.config';
import { logoutUser } from '../services/auth';
import { logSecurityEvent } from './securityLogger';

const TOKEN_CHECK_INTERVAL = 60 * 1000; // Check every minute
let tokenCheckInterval = null;

/**
 * Check if user session is still valid
 * @returns {Promise<boolean>} Whether session is valid
 */
export const checkSessionValidity = async () => {
  const user = auth.currentUser;
  
  if (!user) {
    return false;
  }

  try {
    // Reload user to get latest token status
    await user.reload();
    
    // Check if token is still valid (Firebase handles this automatically)
    // Additional check: verify user is still authenticated
    return !!auth.currentUser;
  } catch (error) {
    console.error('Session validation error:', error);
    
    // Log security event for token validation failure
    logSecurityEvent('TOKEN_VALIDATION_FAILED', {
      userId: user?.uid,
      error: error.code || 'unknown',
    });
    
    return false;
  }
};

/**
 * Start token expiration monitoring
 * Automatically logs out user when token expires
 * @param {Function} onExpired - Callback when token expires
 */
export const startTokenMonitoring = (onExpired) => {
  // Clear existing interval if any
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
  }

  // Check token validity periodically
  tokenCheckInterval = setInterval(async () => {
    const isValid = await checkSessionValidity();
    
    if (!isValid) {
      // Token expired or invalid
      logSecurityEvent('SESSION_EXPIRED', {
        userId: auth.currentUser?.uid,
      });
      
      // Clear interval
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
        tokenCheckInterval = null;
      }
      
      // Logout user
      await logoutUser();
      
      // Call callback if provided
      if (onExpired) {
        onExpired();
      }
    }
  }, TOKEN_CHECK_INTERVAL);
};

/**
 * Stop token expiration monitoring
 */
export const stopTokenMonitoring = () => {
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
    tokenCheckInterval = null;
  }
};

/**
 * Setup auth state listener for token expiration
 * Listens to Firebase auth state changes and handles token expiration
 */
export const setupTokenExpirationListener = () => {
  return auth.onAuthStateChanged(async (user) => {
    if (user) {
      // User is logged in - start monitoring
      startTokenMonitoring(() => {
        // Redirect to login on expiration
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      });
    } else {
      // User is logged out - stop monitoring
      stopTokenMonitoring();
    }
  });
};
