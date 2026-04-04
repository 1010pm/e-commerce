/**
 * Verification Required Gate - Real App Flow
 *
 * Login → Reload user → Check ONLY user.emailVerified (Firebase Auth)
 *        → If false: show VerifyEmail screen (block all access)
 *        → If true: grant access to app
 *
 * Unverified users NEVER see Home/Dashboard - only the VerifyEmail screen.
 * Firestore isVerified is a mirror only - never used for access.
 */

import { useSelector } from 'react-redux';
import { PageLoader } from './Loading';
import VerifyEmail from '../../pages/auth/VerifyEmail';
import { useAuth } from '../../hooks/useAuth';

const VerificationRequiredGate = ({ children }) => {
  useAuth();

  const { isAuthenticated, emailVerified, loading, userData } = useSelector((state) => state.auth);
  const provider = userData?.provider;
  // CRITICAL: ONLY trust state.emailVerified (from Firebase via useAuth) - NEVER userData from Firestore
  const verified = emailVerified === true;

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return children;
  }

  // Google accounts are auto-verified
  if (provider === 'google') {
    return children;
  }

  // ONLY grant access when Firebase user.emailVerified === true (user clicked link)
  if (verified === true) {
    return children;
  }

  // Unverified password user - render VerifyEmail directly (no bypass)
  return <VerifyEmail />;
};

export default VerificationRequiredGate;
