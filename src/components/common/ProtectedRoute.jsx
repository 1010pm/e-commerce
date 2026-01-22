/**
 * Protected Route Component
 * مكون الحماية للمسارات
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading, userData } = useSelector((state) => state.auth);

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

  // CRITICAL: Check admin status from userData.role as well
  // This ensures admin check works even if isAdmin state is not updated yet
  const userIsAdmin = isAdmin || userData?.role === 'admin';
  
  if (requireAdmin && !userIsAdmin) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
};

export default ProtectedRoute;

