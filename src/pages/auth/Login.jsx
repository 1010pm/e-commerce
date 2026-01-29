/**
 * Login Page - Production Ready
 * Professional login experience with clear error handling and security
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login, googleLogin } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { ROUTES } from '../../constants/routes';
import { validateForm } from '../../utils/validators';
import { resendVerificationEmail } from '../../services/auth';
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from '../../utils/rateLimiter';
import { withTimeout, handleNetworkError } from '../../utils/errorHandler';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const isAdmin = useSelector((state) => state.auth.isAdmin);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME);
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Cooldown timer for resend email
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});
    
    // Step 1: Validate inputs (empty / invalid email format)
    const validation = validateForm(formData, {
      email: {
        required: true,
        requiredMessage: 'Email is required',
        email: true,
        emailMessage: 'Invalid email format',
      },
      password: {
        required: true,
        requiredMessage: 'Password is required',
      },
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Step 1.5: Check rate limit
    const email = formData.email.trim();
    const rateLimit = checkRateLimit('login', email);
    if (!rateLimit.allowed) {
      setGeneralError(rateLimit.message);
      toast.error(rateLimit.message);
      return;
    }

    // Step 2: Disable submit button while loading
    setLoading(true);

    try {
      // Step 3: Authenticate with Firebase (with timeout)
      const result = await withTimeout(
        dispatch(login({ 
          email: formData.email.trim(), 
          password: formData.password 
        })),
        15000 // 15 second timeout
      );

      if (login.fulfilled.match(result)) {
        // Login successful - clear rate limit
        clearRateLimit('login', email);
        
        toast.success('Login successful!', {
          icon: '✅',
          duration: 3000,
        });
        // Redirect admin users to admin dashboard, regular users to home
        const isAdmin = result.payload.userData?.role === 'admin';
        navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME);
      } else if (login.rejected.match(result)) {
        // Handle all Firebase auth errors with clear messages
        const errorPayload = result.payload || {};
        const errorMessage = errorPayload.error || 'Login failed. Please try again.';
        const errorCode = errorPayload.code || '';

        // Record failed attempt for rate limiting (except for verification errors)
        if (
          errorCode !== 'auth/email-not-verified' && 
          errorCode !== 'auth/account-not-verified' &&
          errorCode !== 'auth/account-disabled'
        ) {
          recordFailedAttempt('login', email);
        }

        // Check if it's an email verification error
        if (
          errorCode === 'auth/email-not-verified' || 
          errorCode === 'auth/account-not-verified' ||
          errorMessage.includes('verify your email') || 
          errorMessage.includes('not verified yet')
        ) {
          // Show verification modal with email
          setUserEmail(formData.email.trim());
          setShowVerificationModal(true);
        } else if (errorCode === 'auth/account-disabled') {
          // Account disabled - show clear error
          setGeneralError(errorMessage);
          toast.error(errorMessage, { duration: 5000 });
        } else {
          // Other errors - show inline or banner
          setGeneralError(errorMessage);
          toast.error(errorMessage, { duration: 4000 });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle network/timeout errors
      const networkError = handleNetworkError(error);
      setGeneralError(networkError.error);
      toast.error(networkError.error);
      
      // Record failed attempt
      if (networkError.retryable) {
        recordFailedAttempt('login', email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before requesting another verification email.`);
      return;
    }

    setResending(true);
    try {
      const result = await resendVerificationEmail(userEmail);
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.', {
          icon: '📧',
          duration: 5000,
        });
        setResendCooldown(60); // 60 second cooldown
      } else {
        // If user needs to log in first, suggest trying login again
        if (result.requiresLogin) {
          toast.info('Please try logging in again. A verification email will be sent automatically.', {
            duration: 6000,
          });
        } else if (result.cooldown) {
          setResendCooldown(result.cooldown);
          toast.error(result.error || `Please wait ${result.cooldown} seconds before requesting another email.`, {
            duration: 5000,
          });
        } else {
          toast.error(result.error || 'Failed to send verification email. Please try again.');
        }
      }
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setGeneralError('');
    setErrors({});
    
    try {
      const result = await dispatch(googleLogin());
      if (googleLogin.fulfilled.match(result)) {
        toast.success('Login successful!', {
          icon: '✅',
          duration: 3000,
        });
        // Redirect admin users to admin dashboard, regular users to home
        const isAdmin = result.payload.userData?.role === 'admin';
        navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME);
      } else {
        const errorPayload = result.payload || {};
        const errorMessage = errorPayload.error || 'Google login failed. Please try again.';
        const errorCode = errorPayload.code || '';

        // Handle verification errors
        if (
          errorCode === 'auth/email-not-verified' || 
          errorCode === 'auth/account-not-verified' ||
          errorMessage.includes('verify your email') || 
          errorMessage.includes('not verified yet')
        ) {
          setUserEmail(errorPayload.user?.email || '');
          setShowVerificationModal(true);
        } else if (errorCode === 'auth/account-disabled') {
          setGeneralError(errorMessage);
          toast.error(errorMessage, { duration: 5000 });
        } else {
          setGeneralError(errorMessage);
          toast.error(errorMessage, { duration: 4000 });
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setGeneralError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-8 md:p-10">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold gradient-text mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600 mt-2">
              Sign in to your account to continue
            </p>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-start">
                <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{generalError}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <Input
                label="Email address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
              />

              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <Link
                    to={ROUTES.FORGOT_PASSWORD}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              loading={loading} 
              disabled={loading}
              fullWidth 
              size="lg" 
              className="mt-6"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  loading={loading}
                  className="hover:bg-gray-50"
                >
                  {!loading && (
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </Button>
              </div>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setResendCooldown(0);
        }}
        title=""
        size="md"
        showCloseButton={true}
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Email Verification Required
          </h3>
          
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Please verify your email to continue
              </span>
            </div>
            
            <p className="text-gray-600 text-sm leading-relaxed">
              We've sent a verification email to:
              <br />
              <span className="font-medium text-primary-600 text-base mt-2 inline-block">{userEmail}</span>
              <br />
              <br />
              Please check your inbox and click the verification link in the email.
              <br />
              <span className="text-gray-500 text-xs mt-2 block">
                If you don't see the email, check your spam or junk folder.
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleResendEmail}
              loading={resending}
              disabled={resendCooldown > 0 || resending}
              variant="primary"
              size="md"
              className="flex items-center justify-center"
            >
              {!resending && <ArrowPathIcon className="h-5 w-5 mr-2" />}
              {resendCooldown > 0 
                ? `Resend Email (${resendCooldown}s)` 
                : 'Resend Verification Email'}
            </Button>
            
            <Button
              onClick={() => {
                setShowVerificationModal(false);
                setResendCooldown(0);
              }}
              variant="outline"
              size="md"
            >
              Close
            </Button>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            After verifying your email, you can sign in again.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Login;

