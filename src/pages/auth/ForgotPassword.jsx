/**
 * Forgot Password Page - Production Ready
 * Professional password reset experience
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../services/auth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ROUTES } from '../../constants/routes';
import { validateForm } from '../../utils/validators';
import toast from 'react-hot-toast';
import { EnvelopeIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = validateForm(formData, {
      email: {
        required: true,
        requiredMessage: 'Email is required',
        email: true,
        emailMessage: 'Invalid email address',
      },
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(formData.email.trim());
      if (result.success) {
        setEmailSent(true);
        toast.success('Password reset email sent! Check your inbox.', {
          icon: '📧',
          duration: 5000,
        });
      } else {
        toast.error(result.error || 'Failed to send reset email. Please try again.', {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-8 md:p-10 text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Check your email
            </h2>
            
            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                We've sent a password reset link to:
              </p>
              <p className="font-semibold text-primary-600 text-lg break-all">
                {formData.email}
              </p>
              <p className="text-gray-600 text-sm">
                Please check your inbox and click the link to reset your password.
              </p>
              
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-800">
                  <strong>Didn't receive the email?</strong>
                  <br />
                  Check your spam or junk folder, or try again with a different email address.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link to={ROUTES.LOGIN}>
                <Button fullWidth size="lg" className="flex items-center justify-center">
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Login
                </Button>
              </Link>
              <button
                onClick={() => setEmailSent(false)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Try different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
              <EnvelopeIcon className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold gradient-text mb-2">
              Reset your password
            </h2>
            <p className="text-gray-600 mt-2">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
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
            </div>

            <Button 
              type="submit" 
              loading={loading} 
              disabled={loading}
              fullWidth 
              size="lg"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center">
              <Link
                to={ROUTES.LOGIN}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              We'll send you a secure link to reset your password. 
              The link will expire after a short period for security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

