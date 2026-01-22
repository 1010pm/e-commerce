/**
 * Verify Email Page - Production Ready
 * Professional email verification experience
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/authSlice';
import { resendVerificationEmail, checkEmailVerification, syncEmailVerification } from '../../services/auth';
import { auth } from '../../config/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import Button from '../../components/common/Button';
import { ROUTES } from '../../constants/routes';
import toast from 'react-hot-toast';
import { 
  EnvelopeIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Get email from URL params or auth state
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setUserEmail(emailParam);
    }

    // Listen to auth state to get user email
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || '');
        setLoading(false);
        
        // Check verification status
        const verified = await checkEmailVerification(user);
        if (verified) {
          setEmailVerified(true);
          // Sync to Firestore
          await syncEmailVerification(user);
          // Try to log in
          try {
            const result = await dispatch(login({ 
              email: user.email, 
              password: '' // Password not needed if already authenticated
            }));
            if (login.fulfilled.match(result)) {
              toast.success('Email verified successfully!');
              const isAdmin = result.payload.userData?.role === 'admin';
              setTimeout(() => navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME), 2000);
            }
          } catch (error) {
            // If login fails, redirect to login page
            navigate(ROUTES.LOGIN);
          }
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [searchParams, dispatch, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please log in first to check verification status.');
        navigate(ROUTES.LOGIN);
        return;
      }

      const verified = await checkEmailVerification(user);
      if (verified) {
        setEmailVerified(true);
        // Sync to Firestore
        await syncEmailVerification(user);
        toast.success('Email verified successfully!');
        // Try to log in
        const result = await dispatch(login({ 
          email: user.email, 
          password: '' 
        }));
        if (login.fulfilled.match(result)) {
          const isAdmin = result.payload.userData?.role === 'admin';
          setTimeout(() => navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME), 2000);
        } else {
          navigate(ROUTES.LOGIN);
        }
      } else {
        toast.info('Email not verified yet. Please check your inbox.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown} seconds before requesting another verification email.`);
      return;
    }

    setResending(true);
    try {
      const user = auth.currentUser;
      const email = userEmail || user?.email;
      
      if (!email) {
        toast.error('Email address not found. Please try logging in again.');
        navigate(ROUTES.LOGIN);
        return;
      }

      const result = await resendVerificationEmail(email);
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.');
        setCooldown(60); // 60 second cooldown
      } else {
        if (result.requiresLogin) {
          toast.error('Please try logging in. A verification email will be sent automatically.');
          navigate(ROUTES.LOGIN);
        } else if (result.cooldown) {
          setCooldown(result.cooldown);
          toast.error(result.error || 'Please wait before requesting another email.');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-8 md:p-10 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 transition-all duration-300">
            {emailVerified ? (
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircleSolidIcon className="h-12 w-12 text-green-600" />
              </div>
            ) : (
              <div className="bg-primary-100 p-4 rounded-full">
                <EnvelopeIcon className="h-12 w-12 text-primary-600" />
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            {emailVerified ? 'Email Verified!' : 'Verify Your Email'}
          </h2>

          {/* Message */}
          <div className="mb-6">
            {emailVerified ? (
              <div className="space-y-2">
                <p className="text-gray-700 text-lg font-medium">
                  Your email has been verified successfully!
                </p>
                <p className="text-gray-600 text-sm">
                  Redirecting you to the home page...
                </p>
                <div className="mt-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Verification Complete
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {userEmail ? (
                  <>
                    <p className="text-gray-700">
                      We've sent a verification email to:
                    </p>
                    <p className="font-semibold text-primary-600 text-lg break-all">
                      {userEmail}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Please click the link in the email to verify your account.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-700">
                      Please check your email for a verification link.
                    </p>
                    <p className="text-gray-600 text-sm">
                      Click the link to verify your account.
                    </p>
                  </>
                )}

                {/* Status Badge */}
                <div className="mt-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Email Not Verified Yet
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {!emailVerified && (
            <div className="space-y-3">
              <Button
                onClick={handleCheckVerification}
                loading={checking}
                disabled={checking}
                fullWidth
                size="lg"
              >
                {!checking && <CheckCircleIcon className="h-5 w-5 mr-2" />}
                {checking ? 'Checking...' : 'Check Verification Status'}
              </Button>

              <Button
                onClick={handleResendEmail}
                loading={resending}
                disabled={cooldown > 0 || resending}
                variant="outline"
                fullWidth
                size="lg"
              >
                {!resending && <ArrowPathIcon className="h-5 w-5 mr-2" />}
                {cooldown > 0 
                  ? `Resend Email (${cooldown}s)` 
                  : resending 
                    ? 'Sending...' 
                    : 'Resend Verification Email'}
              </Button>

              <Link
                to={ROUTES.LOGIN}
                className="block text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors mt-4"
              >
                ← Back to Login
              </Link>
            </div>
          )}

          {/* Help Text */}
          {!emailVerified && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-800">Didn't receive the email?</strong>
                  <br />
                  • Check your spam or junk folder
                  <br />
                  • Click "Resend Verification Email" above
                  <br />
                  • After verifying, click "Check Verification Status" or return to login
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
