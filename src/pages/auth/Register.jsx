/**
 * Register Page
 * صفحة التسجيل
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { register, googleLogin } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ROUTES } from '../../constants/routes';
import { validateForm } from '../../utils/validators';
import { resendVerificationEmail } from '../../services/auth';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { 
  EnvelopeIcon, 
  XCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);

  // Redirect if already authenticated and verified
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.HOME);
    }
  }, [isAuthenticated, navigate]);

  // Note: After registration, user is signed out automatically
  // They need to verify email and then log in
  // This effect is removed since user won't be authenticated after registration

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = validateForm(formData, {
      displayName: {
        required: true,
        requiredMessage: 'Name is required',
        minLength: 2,
        minLengthMessage: 'Name must be at least 2 characters',
      },
      email: {
        required: true,
        requiredMessage: 'Email is required',
        email: true,
        emailMessage: 'Invalid email address',
      },
      password: {
        required: true,
        requiredMessage: 'Password is required',
        minLength: 8,
        minLengthMessage: 'Password must be at least 8 characters',
        custom: (value) => {
          // Check for uppercase, lowercase, and number
          const hasUpper = /[A-Z]/.test(value);
          const hasLower = /[a-z]/.test(value);
          const hasNumber = /[0-9]/.test(value);
          return hasUpper && hasLower && hasNumber;
        },
        customMessage: 'Password must contain uppercase, lowercase, and number',
      },
      confirmPassword: {
        required: true,
        requiredMessage: 'Please confirm your password',
        custom: (value) => value === formData.password,
        customMessage: 'Passwords do not match',
      },
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(
        register({
          email: formData.email,
          password: formData.password,
          userData: {
            displayName: formData.displayName,
          },
        })
      );
      if (register.fulfilled.match(result)) {
        toast.success('Account created successfully! Verification email sent.');
        setEmailSent(true);
        // User is automatically signed out after registration
        // They must verify email and then log in
      } else if (register.rejected.match(result)) {
        const errorMessage = result.payload?.error || result.payload || 'Registration failed. Please try again.';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      // Pass email since user is not logged in after registration
      const result = await resendVerificationEmail(formData.email);
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        if (result.requiresLogin) {
          toast.error('Please try logging in. A verification email will be sent automatically.');
        } else {
          toast.error(result.error || 'Failed to send verification email. Please try again.');
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await dispatch(googleLogin());
      if (googleLogin.fulfilled.match(result)) {
        toast.success('Login successful!');
        navigate(ROUTES.HOME);
      } else if (googleLogin.rejected.match(result)) {
        const errorCode = result.payload?.code;
        if (errorCode === 'auth/email-not-verified') {
          toast.error(result.payload.error || 'Please verify your email address before logging in.');
          // Redirect to login page where they can resend verification
          navigate(ROUTES.LOGIN);
        } else if (errorCode === 'auth/account-disabled') {
          toast.error(result.payload.error || 'Your account has been disabled.');
        } else {
          toast.error(result.payload?.error || result.payload || 'Google login failed. Please try again.');
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show email verification status if email was sent
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
              <EnvelopeIcon className="h-10 w-10 text-primary-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-6">
              We've sent a verification email to<br />
              <span className="font-semibold text-gray-900">{formData.email}</span>
              <br /><br />
              Please click the link in the email to verify your account.
              <br /><br />
              <span className="text-sm text-gray-500">
                After verification, you can log in to your account.
              </span>
            </p>

            {/* Status Badge */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <XCircleIcon className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Email Not Verified Yet
                </span>
              </div>
            </div>

            {/* Resend Email Button */}
            <div className="space-y-4">
              <Button
                onClick={handleResendEmail}
                loading={resending}
                variant="outline"
                fullWidth
                size="lg"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Resend Verification Email
              </Button>

              <div className="flex flex-col gap-2">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Go to Login Page
                </Link>
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setFormData({ displayName: '', email: '', password: '', confirmPassword: '' });
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Back to Registration
                </button>
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder or click "Resend" above.
                <br />
                After verifying your email, go to the login page to access your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-8 md:p-10">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold gradient-text mb-2">
              Create Account
            </h2>
            <p className="text-gray-600 mt-2">
              Join us and start shopping today
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Full Name"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              error={errors.displayName}
              required
              placeholder="Enter your full name"
            />

            <Input
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              placeholder="Enter your email"
              helperText="We'll send a verification email to this address"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              placeholder="Enter your password"
              helperText="Must be at least 8 characters with uppercase, lowercase, and number"
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
              placeholder="Confirm your password"
            />
          </div>

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-6">
              Create Account
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
                  className="hover:bg-gray-50"
                >
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
                  Sign up with Google
                </Button>
              </div>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
