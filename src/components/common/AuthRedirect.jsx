/**
 * Auth Redirect Component
 * Handles automatic redirects based on user role after auth state is loaded.
 *
 * STRICT EMAIL VERIFICATION:
 * - Only applies redirects to VERIFIED users (emailVerified or Google provider)
 * - Unverified users are handled by VerificationRequiredGate - do not redirect them
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';

const AuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, loading, userData, emailVerified } = useSelector((state) => state.auth);
  const hasRedirected = useRef(false);
  const provider = userData?.provider;

  useEffect(() => {
    if (loading) {
      hasRedirected.current = false;
      return;
    }

    if (!isAuthenticated) {
      hasRedirected.current = false;
      return;
    }

    // Unverified password users: let VerificationRequiredGate handle them
    if (provider !== 'google' && !emailVerified) {
      hasRedirected.current = false;
      return;
    }

    if (hasRedirected.current) return;

    const userIsAdmin = isAdmin || userData?.role === 'admin';

    if (userIsAdmin && location.pathname === ROUTES.HOME) {
      hasRedirected.current = true;
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      return;
    }

    if (!userIsAdmin && location.pathname.startsWith('/admin')) {
      hasRedirected.current = true;
      navigate(ROUTES.HOME, { replace: true });
      return;
    }
  }, [isAuthenticated, isAdmin, loading, userData?.role, emailVerified, provider, location.pathname, navigate]);

  return null;
};

export default AuthRedirect;
