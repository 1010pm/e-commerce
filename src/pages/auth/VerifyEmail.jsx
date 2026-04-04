/**
 * Email Verification Required Screen
 *
 * STRICT VERIFICATION: User cannot access Home/Dashboard until user.emailVerified === true.
 * Firebase Auth user.emailVerified is the ONLY source of truth.
 *
 * - Blocks access until user actually clicks verification link
 * - Resend: only for password provider, with cooldown
 * - Check status: allows user to refresh after clicking link
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  resendVerificationEmail,
  checkEmailVerification,
  getUserData,
  getResendCooldown,
} from '../../services/auth';
import { auth } from '../../config/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { setUserData } from '../../store/slices/authSlice';
import { logout } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';
import { ROUTES } from '../../constants/routes';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { ShieldExclamationIcon } from '@heroicons/react/24/solid';

const COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  // Sync cooldown from localStorage on mount (ميزة من مشروع auth)
  useEffect(() => {
    if (userEmail) {
      const { remainingSeconds } = getResendCooldown(userEmail);
      if (remainingSeconds > 0) setCooldown(remainingSeconds);
    }
  }, [userEmail]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || '');
        setLoading(false);

        // اعتماد كلي على Firebase Auth - user.emailVerified فقط
        const verified = await checkEmailVerification(user);
        if (verified) {
          setEmailVerified(true);
          const userDataResult = await getUserData(user.uid);
          const fd = userDataResult.success ? userDataResult.data : {};
          dispatch(
            setUserData({
              ...fd,
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || fd?.displayName || '',
              role: fd?.role || 'user',
              provider: 'password',
              emailVerified: true,
              isVerified: true,
              isActive: fd?.isActive !== false,
            })
          );
          toast.success('Your email has been verified!');
          const isAdmin = (fd?.role || 'user') === 'admin';
          setTimeout(
            () => navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME, { replace: true }),
            1200
          );
        }
      } else {
        setLoading(false);
        navigate(ROUTES.LOGIN, { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate, dispatch]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0) return;

    setResending(true);
    setSuccessMessage('');
    try {
      const user = auth.currentUser;
      const email = userEmail || user?.email;

      if (!email) {
        toast.error('Please log in again.');
        navigate(ROUTES.LOGIN);
        return;
      }

      const result = await resendVerificationEmail(email);
      if (result.success) {
        setSuccessMessage('Verification email sent. Check inbox or spam folder.');
        toast.success('Verification email sent. Check inbox or spam folder.');
        setCooldown(COOLDOWN_SECONDS);
      } else {
        if (result.alreadyVerified) {
          toast.success('Your email has already been verified!');
          navigate(ROUTES.HOME, { replace: true });
        } else if (result.requiresLogin) {
          navigate(ROUTES.LOGIN);
        } else if (result.cooldown) {
          setCooldown(result.cooldown);
        }
        toast.error(result.error || 'Failed to send.');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    setChecking(true);
    try {
      const verified = await checkEmailVerification(user);
      if (verified) {
        setEmailVerified(true);
        const userDataResult = await getUserData(user.uid);
        const fd = userDataResult.success ? userDataResult.data : {};
        dispatch(
          setUserData({
            ...fd,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || fd?.displayName || '',
            role: fd?.role || 'user',
            provider: 'password',
            emailVerified: true,
            isVerified: true,
            isActive: fd?.isActive !== false,
          })
        );
        toast.success('Your email has been verified!');
        const isAdmin = (fd?.role || 'user') === 'admin';
        setTimeout(
          () => navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME, { replace: true }),
          800
        );
      } else {
        toast('Email not verified yet. Click the link in your email.', { icon: '📧' });
      }
    } catch {
      toast.error('Could not check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.LOGIN);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-10 text-center animate-fade-in-up"
          style={{ animationDuration: '0.3s' }}
        >
          {emailVerified ? (
            <div className="animate-fade-in">
              <div className="mx-auto w-20 h-20 rounded-full bg-success-100 flex items-center justify-center mb-6">
                <CheckCircleSolidIcon className="h-12 w-12 text-success-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Email Verified</h2>
              <p className="text-slate-600 mb-4">Your email has been verified. Redirecting...</p>
            </div>
          ) : (
            <>
              {/* Icon */}
              <div className="mx-auto w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-105">
                <EnvelopeIcon className="h-12 w-12 text-primary-600" />
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Verify Your Email
              </h1>

              {/* Message */}
              <p className="text-slate-600 text-base mb-6 leading-relaxed">
                Your account has been created, but you need to verify your email before accessing
                the app.
              </p>

              {/* Registered Email */}
              {userEmail && (
                <div className="bg-slate-50 rounded-xl p-4 mb-4 text-left border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Registered email
                  </p>
                  <p className="font-semibold text-slate-900 break-all">{userEmail}</p>
                </div>
              )}

              {/* Status Indicator */}
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                <ShieldExclamationIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-medium text-amber-800">Status: Not Verified</span>
              </div>

              {/* Success Message (after resend) */}
              {successMessage && (
                <div
                  className="mb-6 p-4 bg-success-50 border border-success-200 rounded-xl text-left animate-fade-in"
                  role="alert"
                >
                  <p className="text-sm font-medium text-success-800">{successMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleResendEmail}
                  loading={resending}
                  disabled={cooldown > 0 || resending}
                  fullWidth
                  size="lg"
                  className="transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-md hover:shadow-lg"
                >
                  {!resending && <ArrowPathIcon className="h-5 w-5 mr-2" />}
                  {cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : resending
                    ? 'Sending...'
                    : 'Resend Verification Email'}
                </Button>

                <button
                  onClick={handleCheckStatus}
                  disabled={checking}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 py-3 px-4 rounded-xl transition-all duration-200"
                >
                  {checking ? (
                    <span className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5" />
                  )}
                  {checking ? 'Checking...' : "I've verified my email"}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium py-3 rounded-xl transition-colors duration-200 hover:bg-slate-50"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Log Out
                </button>
              </div>

              {/* Help Text */}
              <p className="mt-6 text-xs text-slate-400">
                Check your spam folder if you don&apos;t see the email.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
