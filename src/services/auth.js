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
 * Get resend cooldown status
 */
const getResendCooldown = (email) => {
  const key = `resend_verification_${email}`;
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
  const key = `resend_verification_${email}`;
  localStorage.setItem(key, JSON.stringify({ timestamp: Date.now() }));
};

/**
 * Register new user with production schema
 */
export const registerUser = async (email, password, userData = {}) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile
    if (userData.displayName) {
      await updateProfile(user, {
        displayName: userData.displayName,
      });
    }

    // Send email verification
    await sendEmailVerification(user, {
      url: `${window.location.origin}/verify-email`,
    });

    // Create user document in Firestore with production schema
    const userDoc = {
      uid: user.uid,
      email: user.email,
      displayName: userData.displayName || '',
      phoneNumber: userData.phoneNumber || null,
      photoURL: userData.photoURL || null,
      role: 'user',
      provider: 'password',
      emailVerified: false, // Firebase technical status
      isVerified: false,    // Business verification flag
      isActive: true,       // New users are active by default
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);

    // CRITICAL: Sign out user immediately after registration
    // User must verify email before being authenticated
    await signOut(auth);

    return { success: true, user, emailSent: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: getFriendlyErrorMessage(error.code) };
  }
};

/**
 * Login user with verification and active status checks
 */
export const loginUser = async (email, password) => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Reload user to get latest data
    await user.reload();

    // Get user document from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // User document doesn't exist, create it (backward compatibility)
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        phoneNumber: null,
        photoURL: user.photoURL || null,
        role: 'user',
        provider: 'password',
        emailVerified: user.emailVerified,
        isVerified: user.emailVerified, // Sync with emailVerified for existing users
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const userData = userDoc.data();

      // Check if account is active (before other checks)
      if (userData.isActive === false) {
        // Sign out immediately
        await signOut(auth);
        return {
          success: false,
          error: 'Your account has been disabled',
          code: 'auth/account-disabled',
        };
      }

      // Sync email verification status from Firebase to Firestore
      if (user.emailVerified !== userData.emailVerified) {
        await updateDoc(userDocRef, {
          emailVerified: user.emailVerified,
          isVerified: user.emailVerified, // When emailVerified is true, set isVerified to true
          updatedAt: serverTimestamp(),
        });
      }
    }

    // CRITICAL POST-LOGIN CHECKS (in exact order as specified)
    
    // 1. Check email verification (Firebase auth)
    if (!user.emailVerified) {
      // Send verification email automatically before signing out
      try {
        await sendEmailVerification(user, {
          url: `${window.location.origin}/verify-email`,
        });
      } catch (verifyError) {
        console.error('Error sending verification email:', verifyError);
        // Continue with sign out even if email send fails
      }
      
      // Sign out immediately to prevent session creation
      await signOut(auth);
      return {
        success: false,
        error: 'Please verify your email to continue',
        code: 'auth/email-not-verified',
        email: user.email, // Return email for resend functionality
      };
    }

    // 2. Get updated user data from Firestore
    const updatedUserDoc = await getDoc(userDocRef);
    const finalUserData = updatedUserDoc.exists() ? updatedUserDoc.data() : {};

    // 3. Check isVerified status (business verification flag)
    if (finalUserData.isVerified === false) {
      // Send verification email automatically before signing out
      try {
        await sendEmailVerification(user, {
          url: `${window.location.origin}/verify-email`,
        });
      } catch (verifyError) {
        console.error('Error sending verification email:', verifyError);
      }
      
      await signOut(auth);
      return {
        success: false,
        error: 'Your account is not verified yet',
        code: 'auth/account-not-verified',
        email: user.email,
      };
    }

    // 4. Check isActive status (admin-controlled active status)
    if (finalUserData.isActive === false) {
      await signOut(auth);
      return {
        success: false,
        error: 'Your account has been disabled',
        code: 'auth/account-disabled',
      };
    }

    return {
      success: true,
      user,
      emailVerified: user.emailVerified,
      isVerified: finalUserData.isVerified || user.emailVerified,
      isActive: finalUserData.isActive !== false,
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: getFriendlyErrorMessage(error.code) };
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
      emailVerified: user.emailVerified,  // Use Firebase Authentication's actual status
      isVerified: user.emailVerified,     // Sync isVerified with emailVerified from Firebase
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

    // CRITICAL POST-LOGIN CHECKS (in exact order as specified)
    
    // 1. Check email verification (Firebase auth)
    if (!user.emailVerified) {
      await signOut(auth);
      return {
        success: false,
        error: 'Please verify your email to continue',
        code: 'auth/email-not-verified',
        user,
      };
    }

    // 2. Get updated user data from Firestore
    const finalUserDoc = await getDoc(userDocRef);
    const finalUserData = finalUserDoc.exists() ? finalUserDoc.data() : userData;
    
    // 3. Check isVerified status (business verification flag)
    if (finalUserData.isVerified === false) {
      await signOut(auth);
      return {
        success: false,
        error: 'Your account is not verified yet',
        code: 'auth/account-not-verified',
        user,
      };
    }

    // 4. Check isActive status is already done above

    return { 
      success: true, 
      user,
      emailVerified: user.emailVerified,
      isVerified: finalUserData.isVerified || user.emailVerified,
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
    await signOut(auth);
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
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`,
    });
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { 
      success: false, 
      error: getFriendlyErrorMessage(error.code) || 'Failed to send reset email. Please try again.' 
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
 * Auth state observer
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get user data from Firestore
 */
export const getUserData = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    }
    
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Get user data error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Resend email verification with cooldown
 */
export const resendVerificationEmail = async (email = null) => {
  try {
    const user = auth.currentUser;
    const userEmail = email || user?.email;

    if (!userEmail) {
      return { success: false, error: 'Email address is required' };
    }

    // Check cooldown
    const cooldown = getResendCooldown(userEmail);
    if (cooldown.onCooldown) {
      return {
        success: false,
        error: `Please wait ${cooldown.remainingSeconds} seconds before requesting another verification email.`,
        cooldown: cooldown.remainingSeconds,
      };
    }

    // If user is logged in, use current user
    if (user && user.email === userEmail) {
      if (user.emailVerified) {
        return { success: false, error: 'Email is already verified' };
      }

      await sendEmailVerification(user, {
        url: `${window.location.origin}/verify-email`,
      });
    } else {
      // User is not logged in - we need to sign them in temporarily to send verification
      // This is a limitation: Firebase requires logged-in user to send verification
      // We'll return an error suggesting they try logging in again
      return {
        success: false,
        error: 'Please try logging in again. A verification email will be sent automatically.',
        requiresLogin: true,
      };
    }

    // Set cooldown
    setResendCooldown(userEmail);

    return { success: true };
  } catch (error) {
    console.error('Resend verification email error:', error);
    return { success: false, error: getFriendlyErrorMessage(error.code) };
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
 * Sync email verification status from Firebase to Firestore
 */
export const syncEmailVerification = async (user) => {
  try {
    // Accept either user object or uid string
    const firebaseUser = typeof user === 'string' ? auth.currentUser : user;
    if (!firebaseUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const uid = typeof user === 'string' ? user : user.uid;
    if (firebaseUser.uid !== uid) {
      return { success: false, error: 'User ID mismatch' };
    }

    // Reload user to get latest verification status
    await firebaseUser.reload();
    const userDocRef = doc(db, 'users', uid);
    
    // Get current Firestore data
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      return { success: false, error: 'User document not found' };
    }
    
    const currentData = userDoc.data();
    
    // Only update if status changed (optimize to avoid unnecessary writes)
    if (firebaseUser.emailVerified !== currentData.emailVerified || 
        (firebaseUser.emailVerified && currentData.isVerified !== firebaseUser.emailVerified)) {
      await updateDoc(userDocRef, {
        emailVerified: firebaseUser.emailVerified,
        isVerified: firebaseUser.emailVerified, // Sync isVerified with emailVerified
        updatedAt: serverTimestamp(),
      });
    }

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
