/**
 * Custom Hook for Authentication - Production-Grade Email Verification
 *
 * APP INITIALIZATION (Critical):
 * 1. Wait for Firebase Auth to fully load
 * 2. If user exists: force reload session, read ONLY user.emailVerified
 * 3. emailVerified === true → grant access, sync Firestore
 * 4. emailVerified === false → block ALL routes, show verification gate
 *
 * RULES:
 * - Authentication ≠ Authorization (auth.currentUser alone NEVER grants access)
 * - emailVerified from Firebase Auth is the ONLY source of truth
 * - Firestore isVerified is a mirror ONLY - never used for access decisions
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChange, getUserData, checkEmailVerification, logoutUser } from '../services/auth';
import { setUser, setUserData, resetAuth } from '../store/slices/authSlice';
import { clearAllRateLimits } from '../utils/rateLimiter';
import { serializeFirestoreData } from '../utils/firebaseSerializer.js';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, userData, isAuthenticated, isAdmin, emailVerified, isVerified, isActive, loading, error } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    let isMounted = true;
    let loadingTimeout;
    
    // Listen to auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (!isMounted) return;
      
      if (firebaseUser) {
        try {
          dispatch(setUser(firebaseUser));
          
          // Safety: if getUserData/checkEmailVerification hangs, unblock after 10s
          // CRITICAL: For password provider, NEVER assume emailVerified=true without reload
          // Only Google is auto-verified; password users must have clicked link
          loadingTimeout = setTimeout(() => {
            if (!isMounted) return;
            const providerId = firebaseUser.providerData?.[0]?.providerId;
            const provider = providerId === 'google.com' ? 'google' : 'password';
            const emailVerified = providerId === 'google.com' ? true : false; // Never trust stale firebaseUser.emailVerified
            dispatch(setUserData({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              role: 'user',
              provider,
              emailVerified,
              isVerified: emailVerified,
              isActive: true,
            }));
          }, 10000);
          
          const result = await getUserData(firebaseUser.uid);
          
          if (!isMounted) return;
          
          if (result.success && result.data) {
            const userData = result.data;
            
            // CRITICAL: Use ONLY Firebase providerData - NEVER trust Firestore userData.provider
            const providerId = firebaseUser.providerData?.[0]?.providerId;
            const isGoogleProvider = providerId === 'google.com';
            const provider = isGoogleProvider ? 'google' : 'password';

            // CRITICAL: emailVerified from Firebase Auth ONLY - اعتماد كلي على Firebase Authentication
            const emailVerifiedFromFirebase = await checkEmailVerification(firebaseUser);
            const finalEmailVerified = isGoogleProvider ? true : (emailVerifiedFromFirebase === true);

            if (!isMounted) return;
            
            const finalIsActive = userData.isActive !== undefined ? userData.isActive : true;
            
            if (finalIsActive === false) {
              clearTimeout(loadingTimeout);
              loadingTimeout = null;
              await logoutUser();
              dispatch(resetAuth());
              clearAllRateLimits();
              toast.error('Your account has been disabled. Please contact support.');
              if (!isMounted) return;
              navigate('/login');
              return;
            }
            
            // NEVER overwrite emailVerified/isVerified/isActive with Firestore - use Firebase + explicit values
            const userDataWithRole = {
              ...userData,
              role: userData.role || 'user',
              provider: provider,
              emailVerified: finalEmailVerified,  // From Firebase only
              isVerified: finalEmailVerified,     // From Firebase only
              isActive: finalIsActive,
            };
            
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
            // Ensure userData is serializable (convert any remaining Firestore objects)
            const serializedUserData = serializeFirestoreData(userDataWithRole);
            dispatch(setUserData(serializedUserData));
          } else {
            // User data not found (e.g., unverified) - use Firebase only, never default to true
            const providerId = firebaseUser.providerData?.[0]?.providerId;
            const provider = providerId === 'google.com' ? 'google' : 'password';
            const emailVerifiedFromFirebase = await checkEmailVerification(firebaseUser);
            const finalEmailVerified = provider === 'google' ? true : (emailVerifiedFromFirebase === true);
            if (!isMounted) return;
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
            dispatch(setUserData({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              role: 'user',
              provider,
              emailVerified: finalEmailVerified,
              isVerified: finalEmailVerified,
              isActive: true, // New/unverified users default active until admin disables
            }));
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          if (!isMounted) return;
          clearTimeout(loadingTimeout);
          loadingTimeout = null;
          const providerId = firebaseUser.providerData?.[0]?.providerId;
          const provider = providerId === 'google.com' ? 'google' : 'password';
          // On error: never assume true for password provider - block until verified
          const emailVerified = provider === 'google' ? true : false;
          dispatch(setUserData({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || '',
            role: 'user',
            provider,
            emailVerified,
            isVerified: emailVerified,
            isActive: true,
          }));
        }
      } else {
        dispatch(setUser(null));
        dispatch(setUserData(null));
      }
    });

    return () => {
      isMounted = false;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [dispatch, navigate]);

  const requireAuth = (redirectTo = '/login') => {
    if (!isAuthenticated) {
      navigate(redirectTo);
      return false;
    }
    return true;
  };

  const requireAdmin = (redirectTo = '/') => {
    if (!isAuthenticated || !isAdmin) {
      navigate(redirectTo);
      return false;
    }
    return true;
  };

  return {
    user,
    userData,
    isAuthenticated,
    isAdmin,
    emailVerified,
    isVerified,
    isActive,
    loading,
    error,
    requireAuth,
    requireAdmin,
  };
};

