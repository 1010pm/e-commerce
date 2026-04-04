/**
 * Google Sign-In Button Component
 * Production-ready Google authentication with proper state management
 *
 * Features:
 * - Loading spinner during authentication
 * - Error handling and recovery
 * - Popup closed by user handling
 * - Network error management
 * - Accessibility compliant
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { getFriendlyErrorMessage } from '../../utils/errorHandler';

const GoogleSignInButton = ({ 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  onSuccess = null,
  onError = null,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading: authLoading } = useSelector((state) => state.auth);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const isLoading = authLoading || localLoading;

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    setLocalError(null);

    try {
      const result = await dispatch(googleLogin());

      if (googleLogin.fulfilled.match(result)) {
        const userData = result.payload.userData;
        const isAdmin = userData?.role === 'admin';
        
        toast.success('Welcome! 🎉', {
          duration: 3000,
          icon: '✅',
        });

        // Call custom success handler if provided
        if (onSuccess) {
          onSuccess(userData);
        } else {
          // Default navigation
          navigate(isAdmin ? '/admin/dashboard' : '/');
        }
      } else if (googleLogin.rejected.match(result)) {
        const errorPayload = result.payload || {};
        const errorCode = errorPayload.code || 'unknown';
        const errorMessage = errorPayload.error || getFriendlyErrorMessage(errorCode);

        setLocalError(errorMessage);
        
        // Handle specific error codes
        if (errorCode === 'auth/popup-closed-by-user') {
          toast.info('Sign-in cancelled', { duration: 2000 });
        } else if (errorCode === 'auth/network-request-failed') {
          toast.error('Network error. Check your connection.', { duration: 4000 });
        } else {
          toast.error(errorMessage, { duration: 4000 });
        }

        // Call custom error handler if provided
        if (onError) {
          onError(errorCode, errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setLocalError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
      
      if (onError) {
        onError('unknown', errorMessage);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  // CSS classes based on variant and size
  const baseClasses = 'flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    secondary: 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 focus:ring-blue-500',
    minimal: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = isLoading ? 'opacity-75 cursor-not-allowed' : '';

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${widthClass}
          ${disabledClass}
          ${className}
        `}
        aria-label="Sign in with Google"
        title={isLoading ? 'Signing in...' : 'Continue with Google'}
      >
        {/* Google Icon */}
        {!isLoading && (
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Button Text */}
        <span>
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </span>
      </button>

      {/* Error Message */}
      {localError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <p className="font-medium">Sign-in Error</p>
          <p className="mt-1">{localError}</p>
          <button
            type="button"
            onClick={() => setLocalError(null)}
            className="mt-2 text-red-600 hover:text-red-700 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;
