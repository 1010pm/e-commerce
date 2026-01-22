/**
 * Auth Redirect Component
 * Component to handle automatic redirects based on user role after auth state is loaded
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';

const AuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, loading, userData } = useSelector((state) => state.auth);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Reset redirect flag when auth state changes
    if (loading) {
      hasRedirected.current = false;
      return;
    }

    // Don't redirect if not authenticated
    if (!isAuthenticated) {
      hasRedirected.current = false;
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected.current) return;

    // Check if user is admin from userData.role (more reliable than isAdmin state)
    const userIsAdmin = isAdmin || userData?.role === 'admin';

    // If user is admin and on home page, redirect to admin dashboard
    if (userIsAdmin && location.pathname === ROUTES.HOME) {
      hasRedirected.current = true;
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      return;
    }

    // If user is NOT admin and trying to access admin routes, redirect to home
    if (!userIsAdmin && location.pathname.startsWith('/admin')) {
      hasRedirected.current = true;
      navigate(ROUTES.HOME, { replace: true });
      return;
    }
  }, [isAuthenticated, isAdmin, loading, userData?.role, location.pathname, navigate]);

  return null;
};

export default AuthRedirect;
