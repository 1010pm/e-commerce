/**
 * Google Authentication Service
 * Standalone module for clean separation of Google OAuth logic
 *
 * This service encapsulates all Google-specific authentication logic,
 * making it easy to use across the application without worrying about
 * Redux implementation details.
 *
 * Usage:
 * const result = await googleAuthService.signInWithGoogle();
 * if (result.success) {
 *   // User is signed in, dispatch action
 * }
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';
import { logAuthEvent, logSecurityEvent, logSuccessfulAuth } from '../utils/securityLogger';

/**
 * Get friendly error message for Google Auth errors
 */
const getGoogleAuthErrorMessage = (errorCode) => {
  const errorMap = {
    'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Pop-up was blocked by your browser. Please allow pop-ups and try again.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/operation-not-allowed': 'Google Sign-In is not enabled. Please contact support.',
    'auth/credential-already-in-use': 'This Google account is already linked to another account.',
    'auth/account-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-disabled': 'Your account has been disabled. Please contact support.',
  };

  return errorMap[errorCode] || 'Sign-in failed. Please try again.';
};

/**
 * Google Authentication Service
 */
const googleAuthService = {
  /**
   * Sign in with Google OAuth
   * 
   * @returns {Promise<{
   *   success: boolean,
   *   user: FirebaseUser | null,
   *   isNewUser: boolean,
   *   error?: string,
   *   code?: string
   * }>}
   */
  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Customize the OAuth popup
      provider.setCustomParameters({
        prompt: 'select_account', // Always show account selection
      });

      // Sign in with popup
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Get the ID token to extract provider info
      const tokenResult = await user.getIdTokenResult();

      // Check if this is a new user (first time signing in)
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      const isNewUser = !userDocSnapshot.exists();

      // Prepare user document data
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || null,
        phoneNumber: user.phoneNumber || null,
        role: 'user',
        provider: 'google',
        isActive: true,
        emailVerified: true, // Google accounts are always verified
        updatedAt: serverTimestamp(),
      };

      if (isNewUser) {
        // Create new user document for first-time sign-in
        await setDoc(userDocRef, {
          ...userData,
          createdAt: serverTimestamp(),
        });

        logAuthEvent('GOOGLE_SIGN_IN_NEW_USER', {
          userId: user.uid,
          email: user.email,
        });
      } else {
        // Update existing user document
        const existingData = userDocSnapshot.data();

        // Check if account is disabled
        if (existingData.isActive === false) {
          await googleAuthService.signOut();
          return {
            success: false,
            user: null,
            error: 'Your account has been disabled. Please contact support.',
            code: 'auth/account-disabled',
          };
        }

        // Update user document (preserve admin role if already set)
        await updateDoc(userDocRef, {
          ...userData,
          role: existingData.role || 'user',
        });

        logAuthEvent('GOOGLE_SIGN_IN_EXISTING_USER', {
          userId: user.uid,
          email: user.email,
        });
      }

      logSuccessfulAuth('GOOGLE_SIGN_IN', user.uid);
      
      return {
        success: true,
        user,
        isNewUser,
      };
    } catch (error) {
      const code = error?.code || 'unknown';
      const message = getGoogleAuthErrorMessage(code);

      console.error('Google sign-in error:', error);
      logSecurityEvent('GOOGLE_SIGN_IN_FAILED', {
        code,
        message: error?.message,
      });

      return {
        success: false,
        user: null,
        error: message,
        code,
      };
    }
  },

  /**
   * Sign out the current user
   * 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  signOut: async () => {
    try {
      const userId = auth.currentUser?.uid;
      
      await auth.signOut();

      if (userId) {
        logAuthEvent('SIGN_OUT', { userId });
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign out',
      };
    }
  },

  /**
   * Get the current authenticated user
   * 
   * @returns {FirebaseUser | null}
   */
  getCurrentUser: () => {
    return auth.currentUser;
  },

  /**
   * Get the current user's Firebase Auth ID token
   * Useful for server-side authentication
   * 
   * @param {boolean} forceRefresh - Force refresh the token
   * @returns {Promise<string | null>}
   */
  getIdToken: async (forceRefresh = false) => {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  },

  /**
   * Listen to auth state changes
   * Returns an unsubscribe function
   * 
   * @param {Function} callback - Called with user or null
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged: (callback) => {
    return auth.onAuthStateChanged(callback);
  },

  /**
   * Check if user is authenticated
   * 
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return auth.currentUser !== null;
  },

  /**
   * Get user data from Firestore
   * 
   * @param {string} uid - User ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  getUserData: async (uid) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        return {
          success: true,
          data: userDocSnapshot.data(),
        };
      }

      return {
        success: false,
        error: 'User not found',
      };
    } catch (error) {
      console.error('Get user data error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update user data in Firestore
   * 
   * @param {string} uid - User ID
   * @param {Object} data - Data to update
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  updateUserData: async (uid, data) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Update user data error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default googleAuthService;
