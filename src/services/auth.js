/**
 * Firebase Authentication Service
 * خدمة المصادقة في Firebase
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';
import {
  logAuthEvent,
  logSecurityEvent,
  logFailedAuthAttempt,
  logSuccessfulAuth,
  logLogout,
  logPasswordResetRequest,
  logEmailVerification,
} from '../utils/securityLogger';
import { sanitizeFormData } from '../utils/sanitizer';

// Resend verification cooldown (60 seconds)
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Centralized error handler for authentication
 * Returns user-friendly error messages without exposing security details
 */
export const handleAuthError = (error) => {
  // Don't expose stack traces or detailed error info in production
  if (process.env.NODE_ENV === 'production') {
    return getFriendlyErrorMessage(error.code);
  }

  // In development, log full error but still return friendly message
  console.error('Auth error:', error);
  return getFriendlyErrorMessage(error.code);
};

/**
 * Get friendly error message
 * Maps Firebase error codes to human-readable messages
 */
const getFriendlyErrorMessage = (errorCode) => {
  const errorMap = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in.',
    'auth/invalid-email': 'Invalid email format',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/too-many-requests': 'Too many attempts. Try later',
    'auth/network-request-failed': 'Network error. Check connection',
    'auth/popup-closed-by-user': 'Sign-in was cancelled',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/requires-recent-login': 'Please sign out and sign in again to continue.',
    'auth/email-not-verified': 'Please verify your email to continue',
    'auth/account-disabled': 'Your account has been disabled',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/credential-already-in-use': 'This credential is already associated with another account.',
  };

  return errorMap[errorCode] || 'An error occurred. Please try again.';
};

/**
 * Get resend cooldown status (exported for UI to sync on load)
 */
export const getResendCooldown = (email) => {
  if (!email) return { onCooldown: false, remainingSeconds: 0 };
  const key = `resend_verification_${String(email).toLowerCase().trim()}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    const data = JSON.parse(stored);
    const now = Date.now();
    if (data.timestamp + (RESEND_COOLDOWN_SECONDS * 1000) > now) {
      const remaining = Math.ceil((data.timestamp + (RESEND_COOLDOWN_SECONDS * 1000) - now) / 1000);
      return { onCooldown: true, remainingSeconds: remaining };
    }
  }
  return { onCooldown: false, remainingSeconds: 0 };
};

/**
 * Set resend cooldown
 */
const setResendCooldown = (email) => {
  if (!email) return;
  const key = `resend_verification_${String(email).toLowerCase().trim()}`;
  localStorage.setItem(key, JSON.stringify({ timestamp: Date.now() }));
};

/**
 * Register new user with production schema
 */
export const registerUser = async (email, password, userData = {}) => {
  try {
    // Sanitize input data
    const sanitizedEmail = sanitizeFormData({ email }).email;
    const sanitizedUserData = sanitizeFormData(userData);

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
    const user = userCredential.user;

    // Update user profile
    if (sanitizedUserData.displayName) {
      await updateProfile(user, {
        displayName: sanitizedUserData.displayName,
      });
    }

    // Send email verification (no custom URL - Firebase default may deliver better)
    await sendEmailVerification(user);

    // Create user document in Firestore with production schema
    const userDoc = {
      uid: user.uid,
      email: user.email,
      displayName: sanitizedUserData.displayName || '',
      phoneNumber: sanitizedUserData.phoneNumber || null,
      photoURL: sanitizedUserData.photoURL || null,
      role: 'user',
      provider: 'password',
      // emailVerified & isVerified REMOVED - using Firebase Auth as source of truth
      isActive: true,       // New users are active by default
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);

    // Log successful registration
    logAuthEvent('REGISTER', {
      userId: user.uid,
      email: sanitizedEmail,
    });

    // CRITICAL: Sign out user immediately after registration
    // User must verify email before being authenticated
    await signOut(auth);

    return { success: true, user, emailSent: true };
  } catch (error) {
    console.error('Registration error:', error);

    // Log failed registration attempt
    logFailedAuthAttempt('register', email, error.code || 'unknown');

    return { success: false, error: getFriendlyErrorMessage(error.code), code: error.code };
  }
};

/**
 * Login user with verification and active status checks
 *
 * STRICT VERIFICATION: user.emailVerified from Firebase Auth is the ONLY source of truth.
 * - After login: ALWAYS reload session (user.reload())
 * - Check ONLY user.emailVerified - never auto-set to true
 * - Firestore isVerified is updated ONLY when user actually clicks verification link
 */
export const loginUser = async (email, password) => {
  try {
    // Sanitize email input
    const sanitizedEmail = sanitizeFormData({ email }).email;

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
    const user = userCredential.user;

    // CRITICAL: Reload user session to get latest emailVerified from Firebase Auth
    await user.reload();

    // Unverified users: allow login, redirect to verify-email screen (VerificationRequiredGate blocks access)
    // NEVER set emailVerified or isVerified to true - only Firebase Auth can do that after user clicks link
    if (!user.emailVerified) {
      return {
        success: true,
        user,
        emailVerified: false,  // From Firebase only - never auto-set
        isActive: true,
        provider: 'password',
      };
    }

    // Verified users - check role/active status from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    let isActive = true;

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.isActive === false) {
        logSecurityEvent('DISABLED_ACCOUNT_LOGIN_ATTEMPT', {
          userId: user.uid,
          email: sanitizedEmail,
        });
        await signOut(auth);
        return {
          success: false,
          error: 'Your account has been disabled',
          code: 'auth/account-disabled',
        };
      }
      isActive = userData.isActive !== false;
    }

    logSuccessfulAuth('LOGIN', user.uid);

    // Log custom claims (admin, roles, etc.) for debugging
    const tokenResult = await user.getIdTokenResult();
    console.log('User Claims:', tokenResult.claims);

    return {
      success: true,
      user,
      emailVerified: user.emailVerified, // Firebase Auth only
      isActive,
      provider: 'password',
    };
  } catch (error) {
    console.error('Login error:', error);

    // Log failed login attempt
    logFailedAuthAttempt('login', email, error.code || 'unknown');

    return { success: false, error: getFriendlyErrorMessage(error.code), code: error.code };
  }
};

/**
 * Login with Google OAuth (auto-verified)
 */
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Reload to ensure we have latest data from Firebase Authentication
    await user.reload();

    // Use actual emailVerified status from Firebase Authentication
    // Google accounts are usually verified, but we use Firebase's actual status
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      phoneNumber: user.phoneNumber || null,
      photoURL: user.photoURL || null,
      role: 'user',
      provider: 'google',
      // emailVerified & isVerified REMOVED - using Firebase Auth as source of truth
      isActive: true,
      updatedAt: serverTimestamp(),
    };

    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(userDocRef, {
        ...userData,
        createdAt: serverTimestamp(),
      });
    } else {
      // Update existing user document
      const existingData = userDoc.data();

      // Check if account is active
      if (existingData.isActive === false) {
        await signOut(auth);
        return {
          success: false,
          error: 'Your account has been disabled. Please contact support.',
          code: 'auth/account-disabled',
        };
      }

      // Update user data (preserve role if admin)
      await updateDoc(userDocRef, {
        ...userData,
        role: existingData.role || 'user', // Preserve admin role
        phoneNumber: existingData.phoneNumber || userData.phoneNumber, // Preserve existing phone
      });
    }

    // Google accounts: treat as verified (Firebase returns emailVerified=true)
    // Provider-aware: Google users never see verification gate

    // Log custom claims (admin, roles, etc.) for debugging
    const tokenResult = await user.getIdTokenResult();
    console.log('User Claims:', tokenResult.claims);

    return {
      success: true,
      user,
      emailVerified: user.emailVerified, // Firebase: Google accounts are verified
      provider: 'google',
    };
  } catch (error) {
    console.error('Google login error:', error);
    return { success: false, error: getFriendlyErrorMessage(error.code) };
  }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    const userId = auth.currentUser?.uid;
    await signOut(auth);

    // Log logout event
    if (userId) {
      logLogout(userId);
    }

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    // Sanitize email input
    const sanitizedEmail = sanitizeFormData({ email }).email;

    await sendPasswordResetEmail(auth, sanitizedEmail, {
      url: `${window.location.origin}/login`,
    });

    // Log password reset request
    logPasswordResetRequest(sanitizedEmail);

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);

    // Log failed password reset attempt
    logFailedAuthAttempt('password_reset', email, error.code || 'unknown');

    return {
      success: false,
      error: getFriendlyErrorMessage(error.code) || 'Failed to send reset email. Please try again.',
      code: error.code,
    };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Get user claims (admin roles, etc)
 * fetches and logs custom claims from the ID token result
 */
export const getUserClaims = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const tokenResult = await user.getIdTokenResult();
    console.log('User Token Claims:', tokenResult.claims);
    return tokenResult.claims;
  } catch (error) {
    console.error('Error getting user claims:', error);
    return null;
  }
};

/**
 * Force refresh the ID token to get latest custom claims
 */
export const refreshUserToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(true);
    console.log('Token refreshed with latest claims');
    return token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

/**
 * Auth state observer
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get user data from Firestore
 * Returns serialized data (Firestore Timestamps converted to numbers) safe for Redux
 */
export const getUserData = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Import here to avoid circular dependency issues
      const { serializeFirestoreData } = await import('../utils/firebaseSerializer.js');
      const userData = userDoc.data();
      const serializedData = serializeFirestoreData(userData);
      return { success: true, data: serializedData };
    }

    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Get user data error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Resend verification email - Production-grade, strict rules
 *
 * Allowed ONLY if ALL are true:
 * - user exists (auth.currentUser)
 * - provider === "password"
 * - user.emailVerified === false
 *
 * Flow: reload user → re-check emailVerified → send if still false
 * Never expose Firebase error codes to user
 */
export const resendVerificationEmail = async (email = null) => {
  try {
    const user = auth.currentUser;
    const userEmail = email || user?.email;

    // 1. Must have email
    if (!userEmail) {
      return { success: false, error: 'Email address is required', code: 'missing-email' };
    }

    // 2. Must be authenticated (Firebase requires logged-in user)
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Resend] Session expired - no current user');
      }
      return {
        success: false,
        error: 'Session expired. Please log in again.',
        requiresLogin: true,
        code: 'auth/user-not-found',
      };
    }

    // 3. Email must match (case-insensitive)
    if (user.email?.toLowerCase() !== userEmail?.toLowerCase()) {
      return {
        success: false,
        error: 'Session expired. Please log in again.',
        requiresLogin: true,
        code: 'requires-login',
      };
    }

    // 4. Provider-aware: Resend ONLY for password provider (Google accounts are already verified)
    const providerId = user.providerData?.[0]?.providerId;
    if (providerId === 'google.com') {
      return {
        success: false,
        error: 'Google accounts are already verified.',
        code: 'google-verified',
        alreadyVerified: true,
      };
    }

    // 5. Check cooldown (rate-limit, prevent spam)
    const cooldown = getResendCooldown(userEmail);
    if (cooldown.onCooldown) {
      return {
        success: false,
        error: `Resend available in ${cooldown.remainingSeconds}s`,
        cooldown: cooldown.remainingSeconds,
        code: 'cooldown',
      };
    }

    // 6. CRITICAL: Reload user FIRST to get latest emailVerified status (handles stale session)
    await user.reload();

    // 7. Only send if NOT verified - prevent unnecessary sends
    if (user.emailVerified === true) {
      if (process.env.NODE_ENV === 'development') {
        console.info('[Resend] User already verified - skipping send');
      }
      return {
        success: false,
        error: 'Your email is already verified.',
        code: 'already-verified',
        alreadyVerified: true,
      };
    }

    // 8. Send verification email
    await sendEmailVerification(user);
    setResendCooldown(userEmail);
    logEmailVerification(user.uid, true);

    if (process.env.NODE_ENV === 'development') {
      console.info('[Resend] Verification email sent to', userEmail);
    }

    return { success: true };
  } catch (error) {
    const code = error?.code || 'unknown';

    if (process.env.NODE_ENV === 'development') {
      console.warn('[Resend] Failed:', code, error?.message);
    }

    // User-friendly error messages - never expose raw Firebase codes
    if (code === 'auth/too-many-requests') {
      return {
        success: false,
        error: "You've requested too many emails. Please try again in a few minutes.",
        code,
        cooldown: 120,
      };
    }

    if (code === 'auth/network-request-failed') {
      return {
        success: false,
        error: 'Network issue. Check your internet connection.',
        code,
      };
    }

    if (code === 'auth/user-not-found' || code === 'auth/user-disabled') {
      return {
        success: false,
        error: 'Session expired. Please log in again.',
        requiresLogin: true,
        code,
      };
    }

    return {
      success: false,
      error: getFriendlyErrorMessage(code) || 'Failed to send verification email. Please try again.',
      code,
    };
  }
};

/**
 * Check if user email is verified
 */
export const checkEmailVerification = async (user) => {
  try {
    // Reload user to get latest verification status
    await user.reload();
    return user.emailVerified;
  } catch (error) {
    console.error('Check email verification error:', error);
    return false;
  }
};

/**
 * Sync email verification status from Firebase Auth to Firestore
 *
 * CRITICAL: Firestore isVerified is updated ONLY when user actually clicks verification link.
 * Firebase Auth sets user.emailVerified = true only after the user clicks the link.
 * We NEVER set isVerified = true automatically - only mirror Firebase's actual status.
 *
 * SECURITY: Firestore rules require request.auth.token.email_verified == true to set isVerified.
 * We MUST refresh the ID token before updateDoc so the new token (with email_verified) is used.
 */
/**
 * Sync email verification status
 * DEPRECATED: We no longer sync verification status to Firestore.
 * This function now just returns the current Auth status without database writes.
 */
export const syncEmailVerification = async (user) => {
  try {
    const firebaseUser = typeof user === 'string' ? auth.currentUser : user;
    if (!firebaseUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Reload to get latest from Firebase Auth
    await firebaseUser.reload();

    return {
      success: true,
      emailVerified: firebaseUser.emailVerified,
      isVerified: firebaseUser.emailVerified,
    };
  } catch (error) {
    console.error('Sync email verification error:', error);
    return { success: false, error: error.message };
  }
};
