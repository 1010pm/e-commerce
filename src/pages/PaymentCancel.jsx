/**
 * Payment Cancel Page
 * Displayed when user cancels payment from Thawani gateway
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clearPaymentSession } from '../services/thawaniPaymentService';
import { ROUTES } from '../constants/routes';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Clear payment session when user cancels
    clearPaymentSession();

    // Show cancel toast
    toast.error('Payment was cancelled');
  }, []);

  const sessionId = searchParams.get('sessionId');
  const reason = searchParams.get('reason') || 'user_cancelled';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Cancel Header */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 mb-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-yellow-800 mb-2">Payment Cancelled</h1>
        <p className="text-yellow-700">Your payment was not completed</p>
      </div>

      {/* What Happened */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4">What Happened?</h2>
        <p className="text-gray-700 mb-4">
          You cancelled your payment and were redirected back to this page. Your cart and items are still saved.
        </p>

        {/* Reason */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600 mb-1">Cancellation Reason</p>
          <p className="font-semibold">
            {reason === 'user_cancelled'
              ? 'Payment cancelled by user'
              : reason === 'timeout'
                ? 'Payment session expired'
                : reason === 'invalid'
                  ? 'Invalid payment information'
                  : 'Payment cancelled'}
          </p>
          {sessionId && (
            <p className="text-xs text-gray-500 mt-3 font-mono break-all">
              Session ID: {sessionId}
            </p>
          )}
        </div>

        {/* Important Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">✓ Good News</h3>
          <ul className="text-blue-700 space-y-2 text-sm">
            <li>• No charge was made to your payment method</li>
            <li>• Your shopping cart items are still saved</li>
            <li>• You can try again whenever you're ready</li>
            <li>• Your order and customer data is secure</li>
          </ul>
        </div>
      </div>

      {/* Troubleshooting */}
      <details className="bg-gray-50 rounded-lg p-6 mb-8">
        <summary className="font-semibold cursor-pointer text-gray-800 hover:text-gray-600">
          Common Reasons & Solutions
        </summary>
        <div className="mt-4 space-y-4 text-sm text-gray-700">
          <div>
            <h4 className="font-semibold text-gray-800">I don't want to buy right now</h4>
            <p>No problem! Your cart is saved. You can return anytime to complete your purchase.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Payment information issue</h4>
            <p>If you had payment issues, try updating your payment method and try again.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Session expired</h4>
            <p>Payment sessions expire after 15 minutes. Start over and complete payment quickly.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Network/connectivity issue</h4>
            <p>Check your internet connection and try the payment again.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Payment amount mismatch</h4>
            <p>Cart totals may have changed. Review your cart and start checkout again.</p>
          </div>
        </div>
      </details>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={() => navigate(ROUTES.CHECKOUT)}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Return to Checkout
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

      {/* Support */}
      <div className="mt-8 pt-8 border-t text-center">
        <p className="text-gray-600 mb-4">
          Still having trouble? Our support team is here to help.
        </p>
        <a href={ROUTES.CONTACT} className="text-blue-600 hover:underline font-semibold">
          Contact Support
        </a>
      </div>

      {/* Security Info */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-800 mb-2">🔒 Your Data is Secure</h3>
        <p className="text-green-700 text-sm">
          We use industry-standard encryption and Thawani's secure payment gateway. Your payment
          information is never stored on our servers.
        </p>
      </div>
    </div>
  );
};

export default PaymentCancel;
