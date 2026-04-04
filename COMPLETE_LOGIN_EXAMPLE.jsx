/**
 * COMPLETE LOGIN PAGE EXAMPLE
 * Production-ready login page with Google Sign-In integration
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login, googleLogin } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ROUTES } from '../../constants/routes';
import { validateForm } from '../../utils/validators';
import { withTimeout } from '../../utils/errorHandler';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, emailVerified } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (!emailVerified) {
        navigate(ROUTES.VERIFY_EMAIL);
      } else {
        navigate(ROUTES.HOME);
      }
    }
  }, [isAuthenticated, emailVerified, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    const validation = validateForm(formData, {
      email: {
        required: true,
        email: true,
      },
      password: {
        required: true,
      },
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      const result = await withTimeout(
        dispatch(login({ email: formData.email, password: formData.password })),
        15000
      );

      if (login.fulfilled.match(result)) {
        if (result.payload.emailVerified) {
          toast.success('Welcome back!');
          navigate(ROUTES.HOME);
        } else {
          navigate(ROUTES.VERIFY_EMAIL);
        }
      } else if (login.rejected.match(result)) {
        toast.error(result.payload?.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (userData) => {
    toast.success(`Welcome, ${userData.displayName}!`);
    navigate(ROUTES.HOME);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Google Sign-In Button */}
        <GoogleSignInButton
          variant="primary"
          size="md"
          fullWidth={true}
          onSuccess={handleGoogleSuccess}
        />

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <Input
            type="email"
            name="email"
            label="Email Address"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="you@example.com"
            disabled={loading}
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Forgot Password Link */}
        <div className="text-center mt-4">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              to={ROUTES.REGISTER}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
