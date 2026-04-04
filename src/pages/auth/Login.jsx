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
import { ROUTES } from '../../constants/routes';
import { validateForm } from '../../utils/validators';
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from '../../utils/rateLimiter';
import { withTimeout, handleNetworkError, getFriendlyErrorMessage } from '../../utils/errorHandler';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useSelector } from 'react-redux';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, emailVerified } = useAuth();
  const isAdmin = useSelector((state) => state.auth.isAdmin);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (!emailVerified) {
        navigate(ROUTES.VERIFY_EMAIL);
      } else {
        navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME);
      }
    }
  }, [isAuthenticated, emailVerified, isAdmin, navigate]);


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
        clearRateLimit('login', email);
        const isAdmin = result.payload.userData?.role === 'admin';
        const isVerified = result.payload.emailVerified;
        
        if (isVerified) {
          toast.success('Welcome back!', { icon: '✅', duration: 3000 });
          navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME);
        } else {
          navigate(ROUTES.VERIFY_EMAIL, { replace: true });
        }
      } else if (login.rejected.match(result)) {
        // Handle all Firebase auth errors with clear, specific messages
        const errorPayload = result.payload || {};
        const errorCode = errorPayload.code || '';
        let errorMessage = errorPayload.error || 'Login failed. Please try again.';

        // Get specific, user-friendly error messages
        if (errorCode) {
          errorMessage = getFriendlyErrorMessage(errorCode);
        }

        // Record failed attempt for rate limiting (except disabled)
        if (errorCode !== 'auth/account-disabled') {
          recordFailedAttempt('login', email);
        }

        if (errorCode === 'auth/account-disabled') {
          // Account disabled - show clear error
          setGeneralError(errorMessage);
          toast.error(errorMessage, { 
            duration: 5000,
            icon: '⚠️',
          });
        } else if (errorCode === 'auth/user-not-found') {
          // Account does not exist - specific message
          setGeneralError('Account does not exist. Please check your email or sign up.');
          toast.error('Account does not exist. Please check your email or sign up.', {
            duration: 4000,
          });
        } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
          setGeneralError('Incorrect email or password. Please try again.');
          toast.error('Incorrect email or password. Please try again.', {
            duration: 4000,
          });
        } else {
          // Other errors - show user-friendly message
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


  const handleGoogleLogin = async () => {
    setLoading(true);
    setGeneralError('');
    setErrors({});
    
    try {
      const result = await dispatch(googleLogin());
      if (googleLogin.fulfilled.match(result)) {
        const isAdmin = result.payload.userData?.role === 'admin';
        const isVerified = result.payload.emailVerified;
        
        if (isVerified) {
          toast.success('Welcome back!', { icon: '✅', duration: 3000 });
          navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME);
        } else {
          navigate(ROUTES.VERIFY_EMAIL, { replace: true });
        }
      } else {
        const errorPayload = result.payload || {};
        const errorMessage = errorPayload.error || 'Google login failed. Please try again.';
        const errorCode = errorPayload.code || '';

        if (errorCode === 'auth/account-disabled') {
          setGeneralError(getFriendlyErrorMessage(errorCode));
          toast.error(getFriendlyErrorMessage(errorCode), { 
            duration: 5000,
            icon: '⚠️',
          });
        } else {
          const friendlyMessage = getFriendlyErrorMessage(errorCode) || errorMessage;
          setGeneralError(friendlyMessage);
          toast.error(friendlyMessage, { duration: 4000 });
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

          {/* General Error */}
          {generalError && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-medium text-red-800">{generalError}</p>
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

    </div>
  );
};

export default Login;

