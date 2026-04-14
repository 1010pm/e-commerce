/**
 * Payment Failed Page
 * Displayed when Thawani payment fails
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clearPaymentSession } from '../services/thawaniPaymentService';
import { ROUTES } from '../constants/routes';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Clear payment session
    clearPaymentSession();

    // Show error toast
    toast.error('Payment failed');
  }, []);

  const errorCode = searchParams.get('errorCode') || 'unknown_error';

  const getErrorDetails = (code) => {
    const errors = {
      declined: {
        title: 'Card Declined',
        message:
          'Your card was declined. This could be due to insufficient funds, incorrect information, or your bank declining the transaction.',
        action: 'Try a different payment method or contact your bank.',
      },
      invalid_card: {
        title: 'Invalid Card Information',
        message: 'The card information you provided is not valid. Please double-check and try again.',
        action: 'Verify your card details and try again.',
      },
      network_error: {
        title: 'Network Error',
        message: 'Connection to the payment gateway was lost. This is not your fault.',
        action: 'Check your internet connection and try again.',
      },
      expired_session: {
        title: 'Session Expired',
        message: 'Your payment session expired. Payment sessions are valid for 15 minutes.',
        action: 'Start over with a new checkout.',
      },
      insufficient_funds: {
        title: 'Insufficient Funds',
        message:
          'Your card does not have sufficient funds to complete this transaction.',
        action: 'Try a different payment method with available funds.',
      },
      unauthorized: {
        title: 'Authorization Failed',
        message:
          'Your bank did not authorize this transaction. Contact your bank for more information.',
        action: 'Try a different card or payment method.',
      },
      unknown_error: {
        title: 'Payment Failed',
        message: 'An unexpected error occurred during payment processing.',
        action: 'Try again or contact support.',
      },
    };

    return errors[code] || errors.unknown_error;
  };

  const error = getErrorDetails(errorCode);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Error Header */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-3xl font-bold text-red-800 mb-2">{error.title}</h1>
        <p className="text-red-700">Payment failed</p>
      </div>

      {/* Error Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4">What Happened?</h2>

        {/* Error Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
          <p className="text-red-700 mb-2">{error.message}</p>
          <p className="text-red-700">{error.action}</p>
        </div>

        {/* Important Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">✓ Important</h3>
          <ul className="text-blue-700 space-y-2 text-sm">
            <li>• You were NOT charged for this failed transaction</li>
            <li>• Your shopping cart is still saved</li>
            <li>• You can try again immediately</li>
            <li>• Your order and customer data is secure</li>
          </ul>
        </div>

        {/* Error Code */}
        {errorCode !== 'unknown_error' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Error Code</p>
            <p className="font-mono text-sm text-gray-800">{errorCode}</p>
          </div>
        )}
      </div>

      {/* Recommended Actions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-bold text-yellow-800 mb-4">Recommended Actions</h2>
        <ol className="space-y-3 text-yellow-900">
          <li className="flex gap-3">
            <span className="font-bold">1.</span>
            <span>Double-check your payment information (card number, CVV, expiration date)</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">2.</span>
            <span>Verify you have sufficient funds available</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">3.</span>
            <span>Try a different card or payment method if available</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">4.</span>
            <span>Contact your bank to ensure there are no blocks on your account</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">5.</span>
            <span>Try again in a few minutes - it may be a temporary issue</span>
          </li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={() => navigate(ROUTES.CHECKOUT)}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Try Payment Again
        </Button>
        <Button
          onClick={() => navigate(ROUTES.CART)}
          className="w-full px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
        >
          Review Your Cart
        </Button>
        <Button
          onClick={() => navigate(ROUTES.HOME)}
          className="w-full px-6 py-3 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200"
        >
          Continue Shopping
        </Button>
      </div>

      {/* Support Section */}
      <div className="mt-8 pt-8 border-t">
        <h2 className="text-lg font-bold mb-4">Still Have Issues?</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            Our support team is available to help troubleshoot payment issues and find alternative
            solutions.
          </p>
          <div className="space-y-2">
            <a href={ROUTES.CONTACT} className="block text-blue-600 hover:underline font-semibold">
              📧 Contact Support
            </a>
            <a href={ROUTES.FAQ} className="block text-blue-600 hover:underline font-semibold">
              ❓ Payment FAQs
            </a>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-800 mb-2">🔒 Your Data is Safe</h3>
        <p className="text-green-700 text-sm">
          We use industry-standard encryption and Thawani's secure payment gateway. Your payment
          information is never stored on our servers and is fully encrypted during transmission.
        </p>
      </div>
    </div>
  );
};

export default PaymentFailed;
