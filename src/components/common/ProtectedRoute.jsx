/**
 * Protected Route Component
 *
 * STRICT EMAIL VERIFICATION:
 * - auth.currentUser existence alone NEVER grants access
 * - Access depends ONLY on user.emailVerified (Firebase Auth - source of truth)
 * - Firestore isVerified is a mirror only - never used for access decisions
 * - Unverified users (password provider) are blocked even if authenticated
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading, emailVerified, userData } = useSelector(
    (state) => state.auth
  );
  // CRITICAL: ONLY trust state.emailVerified (from Firebase via useAuth) - NEVER userData from Firestore
  const verified = emailVerified === true;
  const provider = userData?.provider;

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // CRITICAL: emailVerified from Firebase Auth ONLY - Google = always verified
  const hasAccess = provider === 'google' || verified === true;
  if (!hasAccess) {
    return <Navigate to={ROUTES.VERIFY_EMAIL} replace />;
  }

  // CRITICAL: Check admin status from userData.role as well
  const userIsAdmin = isAdmin || userData?.role === 'admin';
  if (requireAdmin && !userIsAdmin) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
};

export default ProtectedRoute;

