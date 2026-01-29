/**
 * Custom Hook for Authentication
 * Hook مخصص للمصادقة
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChange, getUserData, checkEmailVerification, syncEmailVerification, logoutUser } from '../services/auth';
import { setUser, setUserData, resetAuth } from '../store/slices/authSlice';
import { clearAllRateLimits } from '../utils/rateLimiter';
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
          // Set loading state
          dispatch(setUser(firebaseUser));
          
          // Fetch user data from Firestore (single call)
          const result = await getUserData(firebaseUser.uid);
          
          if (!isMounted) return;
          
          if (result.success && result.data) {
            const userData = result.data;
            
            // Check email verification status
            const emailVerified = await checkEmailVerification(firebaseUser);
            
            if (!isMounted) return;
            
            // Sync email verification status from Firebase Auth to Firestore (only if needed)
            const needsSync = emailVerified !== userData.emailVerified;
            
            if (needsSync) {
              await syncEmailVerification(firebaseUser);
              // Get updated data after sync (only if sync was needed)
              const updatedResult = await getUserData(firebaseUser.uid);
              if (updatedResult.success && updatedResult.data) {
                Object.assign(userData, updatedResult.data);
              }
            }
            
            if (!isMounted) return;
            
            // Extract all status flags
            const finalEmailVerified = emailVerified;
            const finalIsVerified = userData.isVerified ?? emailVerified;
            const finalIsActive = userData.isActive !== undefined ? userData.isActive : true;
            
            // CRITICAL: Check if account is still active (session expiration check)
            if (finalIsActive === false) {
              // Account was disabled during session
              await logoutUser();
              dispatch(resetAuth());
              clearAllRateLimits();
              toast.error('Your account has been disabled. Please contact support.');
              if (!isMounted) return;
              navigate('/login');
              return;
            }
            
            // CRITICAL: Check if email is still verified (session expiration check)
            if (!finalEmailVerified || !finalIsVerified) {
              // Email verification was revoked or account unverified
              await logoutUser();
              dispatch(resetAuth());
              clearAllRateLimits();
              toast.error('Please verify your email to continue.');
              if (!isMounted) return;
              navigate('/login');
              return;
            }
            
            // CRITICAL: Ensure role is included and properly set
            // This is essential for admin check after page refresh
            const userDataWithRole = {
              ...userData,
              role: userData.role || 'user', // Default to 'user' if role is missing
              emailVerified: finalEmailVerified,
              isVerified: finalIsVerified,
              isActive: finalIsActive,
            };
            
            // Single update to Redux state with complete user data including role
            // This ensures all state is updated atomically and loading is set to false
            dispatch(setUserData(userDataWithRole));
          } else {
            // If user data not found, still set user but with default role
            const emailVerified = await checkEmailVerification(firebaseUser);
            if (!isMounted) return;
            
            dispatch(setUserData({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              role: 'user', // Default role
              emailVerified: emailVerified,
              isVerified: emailVerified,
              isActive: true,
            }));
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          if (!isMounted) return;
          
          // Set default user data on error
          dispatch(setUserData({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || '',
            role: 'user',
            emailVerified: false,
            isVerified: false,
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
  }, [dispatch]);

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

