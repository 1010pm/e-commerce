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
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { 
  EnvelopeIcon, 
  XCircleIcon,
} from '@heroicons/react/24/outline';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, emailVerified } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      if (!emailVerified) {
        navigate(ROUTES.VERIFY_EMAIL);
      } else {
        navigate(ROUTES.HOME);
      }
    }
  }, [isAuthenticated, emailVerified, navigate]);

  // Note: After registration, user is signed out automatically
  // They need to verify email and then log in
  // This effect is removed since user won't be authenticated after registration

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For phone field, only allow digits and limit to 8 characters
    let processedValue = value;
    if (name === 'phone') {
      // Remove all non-digit characters
      processedValue = value.replace(/\D/g, '');
      // Limit to 8 digits
      if (processedValue.length > 8) {
        processedValue = processedValue.slice(0, 8);
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
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
      phone: {
        required: true,
        requiredMessage: 'Phone number is required',
        phone: true,
        phoneMessage: 'Phone number must be 8 digits starting with 9 or 7',
        minLength: 8,
        minLengthMessage: 'Phone number must be 8 digits',
        maxLength: 8,
        maxLengthMessage: 'Phone number must be 8 digits',
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
            phoneNumber: formData.phone.trim(),
          },
        })
      );
      if (register.fulfilled.match(result)) {
        toast.success('Account created successfully! Please verify your email to continue.');
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await dispatch(googleLogin());
      if (googleLogin.fulfilled.match(result)) {
        const isVerified = result.payload?.emailVerified;
        if (isVerified) {
          toast.success('Welcome! Your account is ready.');
          navigate(ROUTES.HOME);
        } else {
          toast.success('Account found! Please verify your email to continue.');
          navigate(ROUTES.VERIFY_EMAIL);
        }
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in">
              Account created successfully!
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Please verify your email to continue.
              <br /><br />
              We&apos;ve sent a verification email to<br />
              <span className="font-semibold text-gray-900">{formData.email}</span>
              <br /><br />
              <span className="text-sm text-gray-500">
                Click the link in the email to verify your account, then log in.
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

            {/* CRITICAL: Resend requires auth.currentUser - user is signed out after registration */}
            <div className="space-y-4">
              <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl mb-4">
                <p className="text-sm text-primary-800 font-medium mb-1">
                  Your email is not verified yet
                </p>
                <p className="text-xs text-primary-700">
                  Please log in to resend the verification email.
                </p>
              </div>

              <Link to={ROUTES.LOGIN} className="block">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  className="w-full"
                >
                  Go to Login
                </Button>
              </Link>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setFormData({ displayName: '', email: '', phone: '', password: '', confirmPassword: '' });
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
                Didn&apos;t receive the email? Check your spam folder.
                <br />
                After logging in, you can resend the verification email from the verify screen.
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
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              required
              placeholder="91234567"
              helperText="Enter 8 digits starting with 9 or 7 (e.g., 91234567 or 71234567)"
              maxLength={8}
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
