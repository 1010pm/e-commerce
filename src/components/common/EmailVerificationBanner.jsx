/**
 * Email Verification Banner Component
 * مكون تنبيه التحقق من البريد الإلكتروني
 */

import React, { useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon, ArrowPathIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { resendVerificationEmail, getCurrentUser, checkEmailVerification } from '../../services/auth';
import { useAuth } from '../../hooks/useAuth';
import Button from './Button';
import toast from 'react-hot-toast';

const EmailVerificationBanner = ({ onDismiss }) => {
  const { emailVerified, user, isAuthenticated } = useAuth();
  const [resending, setResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if email is verified, user is not authenticated, or banner is dismissed
  if (!isAuthenticated || emailVerified || !user || dismissed) {
    return null;
  }

  // Also check user.emailVerified directly as fallback
  if (user?.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setResending(true);
    try {
      const result = await resendVerificationEmail();
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        toast.error(result.error || 'Failed to send verification email. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleCheckVerification = async () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const verified = await checkEmailVerification(currentUser);
      if (verified) {
        toast.success('Email verified successfully! Page will refresh.');
        window.location.reload();
      } else {
        toast.info('Email not verified yet. Please check your inbox and click the verification link.');
      }
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-800">
                Please verify your email address
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                We've sent a verification email to <span className="font-semibold">{user?.email}</span>.
                Please check your inbox and click the verification link.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleCheckVerification}
              variant="ghost"
              size="sm"
              className="text-yellow-800 hover:bg-yellow-100"
            >
              Check Status
            </Button>
            <Button
              onClick={handleResend}
              loading={resending}
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Resend
            </Button>
            <button
              onClick={handleDismiss}
              className="text-yellow-600 hover:text-yellow-800 p-1 rounded transition-colors"
              aria-label="Dismiss"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;

