/**
 * Payment Success Page
 * Displayed after successful Thawani payment
 * Verifies payment status and creates order in Firestore
 * Supports mock mode for testing without real API credentials
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { verifyThawaniPayment, retrievePaymentSession, clearPaymentSession } from '../services/thawaniPaymentService';
import { ordersService } from '../services/ordersService';
import { savePaymentTransaction } from '../services/paymentsService';
import { formatCurrency } from '../utils/helpers';
import { ROUTES } from '../constants/routes';
import Button from '../components/common/Button';
import { PageLoader } from '../components/common/Loading';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const MOCK_MODE = process.env.REACT_APP_THAWANI_MOCK_MODE === 'true';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuth();
  const { items } = useSelector((state) => state.cart);

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);
  const [isMockPayment, setIsMockPayment] = useState(false);

  const createOrder = React.useCallback(async (paymentSession) => {
    try {
      if (!authUser?.uid) {
        throw new Error('User not authenticated');
      }

      // 🔴 CRITICAL: Items MUST come from sessionStorage, not Redux (Redux clears on page reload)
      let cartItems = paymentSession.items;
      
      console.log('Attempting to retrieve items:', {
        sessionPaymentItems: paymentSession.items?.length,
        reduxItems: items?.length,
        sessionPaymentItemsType: typeof paymentSession.items,
      });

      // If items missing from session, try Redux as fallback (unlikely but possible)
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        console.warn('⚠️ [CHECKOUT] Items not in paymentSession, checking Redux store');
        if (items && Array.isArray(items) && items.length > 0) {
          console.log('Using Redux items as fallback:', items.length);
          cartItems = items;
        } else {
          // Still no items - CRITICAL ERROR
          console.error('❌ [CHECKOUT] NO ITEMS FOUND:', {
            sessionItems: paymentSession.items,
            reduxItems: items,
            paymentSessionKeys: Object.keys(paymentSession),
          });
          throw new Error('Order items are missing. Unable to create order. Please try checking out again.');
        }
      }

      console.log('✅ Using cart items:', {
        itemCount: cartItems.length,
        itemNames: cartItems.map(i => i.name),
      });

      // Calculate totals from cart items
      const APP_CONFIG = require('../constants/config').APP_CONFIG;
      const subtotal = cartItems.reduce((total, item) => total + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
      const tax = subtotal * APP_CONFIG.TAX_RATE;
      const shipping = subtotal >= APP_CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : APP_CONFIG.SHIPPING_COST;
      const total = subtotal + tax + shipping;

      // Prepare order data matching the ordersService.create() signature
      const orderPayload = {
        userId: authUser.uid, // ✅ CRITICAL: Must include userId
        items: cartItems
          .map((item, idx) => {
            // Ensure each item has valid data
            const itemData = {
              id: item.id || `item-${idx}`,
              productId: item.productId || item.id || `product-${idx}`,
              name: String(item.name || `Product ${idx + 1}`).trim(),
              price: Number(item.price || 0),
              quantity: Number(item.quantity || 1),
              image: item.image || null,
            };
            
            console.log(`Item ${idx + 1}:`, itemData);
            return itemData;
          })
          .filter(item => {
            // Only include items with valid productId and price
            const isValid = !!(item.productId && item.price > 0);
            if (!isValid) {
              console.warn(`Filtering out invalid item:`, item);
            }
            return isValid;
          }),
        shippingAddress: paymentSession.shippingAddress || {},
        paymentMethod: 'thawani',
        paymentStatus: 'paid',
        transactionId: paymentSession?.sessionId || searchParams.get('sessionId'),
        subtotal: Math.max(0, subtotal || 0),
        tax: Math.max(0, tax || 0),
        shipping: Math.max(0, shipping || 0),
        total: Math.max(0, total || 0),
        notes: 'Order created after successful Thawani payment',
      };

      // 🔥 CRITICAL: Validate we have items before proceeding
      if (!orderPayload.items || orderPayload.items.length === 0) {
        console.error('❌ [CHECKOUT] Order has no valid items after filtering:', {
          originalCount: cartItems.length,
          filteredCount: orderPayload.items?.length,
          items: cartItems,
        });
        throw new Error('❌ Order must contain items');
      }

      // Validate order payload
      console.log('✅ Order payload ready:', {
        hasItems: !!orderPayload.items?.length,
        itemCount: orderPayload.items?.length,
        shippingAddress: orderPayload.shippingAddress,
        totals: {
          subtotal: orderPayload.subtotal,
          tax: orderPayload.tax,
          shipping: orderPayload.shipping,
          total: orderPayload.total,
        },
      });

      // Check for undefined values in order payload
      for (const [key, value] of Object.entries(orderPayload)) {
        if (value === undefined) {
          throw new Error(`Order data contains undefined field: ${key}`);
        }
      }

      // Validate items don't have undefined fields
      orderPayload.items.forEach((item, index) => {
        for (const [key, value] of Object.entries(item)) {
          if (value === undefined) {
            throw new Error(`Item ${index + 1} has undefined field: ${key} = ${value}`);
          }
        }
      });

      // Validate shipping address
      if (!orderPayload.shippingAddress?.addressLine) {
        throw new Error('Shipping address is incomplete - addressLine is required');
      }
      if (!orderPayload.shippingAddress?.city) {
        throw new Error('Shipping address is incomplete - city is required');
      }
      if (!orderPayload.shippingAddress?.country) {
        throw new Error('Shipping address is incomplete - country is required');
      }
      if (!orderPayload.shippingAddress?.zipCode) {
        throw new Error('Shipping address is incomplete - zipCode is required');
      }

      // Call ordersService.create with userId and orderData
      const response = await ordersService.create(authUser.uid, orderPayload);

      if (response.success) {
        const orderId = response.data.id;
        
        setOrderId(orderId);
        setOrderData({
          ...orderPayload,
          orderId: orderId,
        });

        // 💾 Save payment transaction to Firebase 'payments' collection
        console.log('💾 [PAYMENT-SUCCESS] Saving payment transaction to Firebase...');
        const paymentSaveResult = await savePaymentTransaction(
          authUser.uid,
          orderId,
          {
            amount: orderPayload.total,
            subtotal: orderPayload.subtotal,
            tax: orderPayload.tax,
            shipping: orderPayload.shipping,
            currency: 'OMR',
            paymentMethod: 'thawani',
            transactionId: searchParams.get('sessionId') || null,
            customerName: `${orderPayload.shippingAddress?.firstName || ''} ${orderPayload.shippingAddress?.lastName || ''}`.trim(),
            customerEmail: orderPayload.shippingAddress?.email || '',
            customerPhone: orderPayload.shippingAddress?.phone || '',
            itemsCount: orderPayload.items?.length || 0,
            shippingAddress: orderPayload.shippingAddress || {},
            userAgent: navigator.userAgent,
            notes: `Payment verified and order created. Session: ${searchParams.get('sessionId')}`,
          }
        );

        if (paymentSaveResult.success) {
          console.log('✅ [PAYMENT-SUCCESS] Payment transaction saved with ID:', paymentSaveResult.paymentId);
          toast.success('💾 Payment record saved');
        } else {
          console.warn('⚠️ [PAYMENT-SUCCESS] Failed to save payment record:', paymentSaveResult.error);
          // Don't fail the order if payment save fails - order is already created
          toast.warning('Order created but payment record save failed');
        }

        setLoading(false);

        // Clear temporary payment session
        clearPaymentSession();

        // Show success toast
        toast.success('✅ Order created successfully!');
      } else {
        throw new Error(response.error || 'Failed to create order');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to create order');
      toast.error('❌ ' + (err.message || 'Failed to create order'));
      setLoading(false);
    }
  }, [authUser, items, searchParams]);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setVerifying(true);

        // Try multiple ways to get the sessionId:
        // 1. Try from URL params (if Thawani passes it back)
        let sessionId = searchParams.get('sessionId');
        
        // 2. If not in URL, retrieve from sessionStorage (stored before redirect)
        if (!sessionId) {
          const storedSession = retrievePaymentSession();
          sessionId = storedSession.sessionId;
          
          if (!sessionId) {
            console.error('❌ [PAYMENT-SUCCESS] No sessionId found in URL or storage:', {
              urlSessionId: searchParams.get('sessionId'),
              storedSessionId: storedSession.sessionId,
              allParams: Object.fromEntries(searchParams),
            });
            throw new Error('No payment session found in URL or local storage');
          }
        }

        // Retrieve stored session data
        const storedSession = retrievePaymentSession();
        if (!storedSession.sessionId) {
          console.warn('⚠️ [PAYMENT-SUCCESS] Stored session data missing, but have sessionId:', sessionId.substring(0, 10) + '...');
          // Continue anyway - we have sessionId from URL or previous storage
        }

        // Verify payment status on backend
        const verificationResult = await verifyThawaniPayment(sessionId);

        if (!verificationResult.success) {
          throw new Error(verificationResult.error || 'Failed to verify payment');
        }

        // Check if this is a mock payment
        if (verificationResult.isMock) {
          setIsMockPayment(true);
        }

        // If payment was successful, create order
        if (verificationResult.status === 'paid') {
          await createOrder(storedSession);
        } else if (verificationResult.status === 'pending') {
          setError('Payment is still being processed. Please check back shortly.');
        } else if (verificationResult.status === 'failed') {
          setError('Payment failed. Please try again.');
          navigate(ROUTES.PAYMENT_FAILED);
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError(err.message || 'Failed to verify payment. Please contact support.');
        toast.error(err.message || 'Payment verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate, authUser, items, createOrder]);

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <PageLoader />
        <p className="text-gray-600">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">Payment Verification Failed</h1>
          <p className="text-red-700 mb-6">{error}</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              If you were charged, your payment will be refunded within 3-5 business days.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate(ROUTES.CHECKOUT)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate(ROUTES.HOME)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <PageLoader />
        <p className="text-gray-600">Processing your order...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Debug Banner - Show if in Mock Mode */}
      {MOCK_MODE && isMockPayment && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎭</span>
            <div>
              <p className="font-bold text-yellow-800">Test Payment Mode Active</p>
              <p className="text-sm text-yellow-700">
                This is a simulated payment for testing. Data from this order may not be complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-green-800 mb-2">Payment Successful!</h1>
        <p className="text-green-700">Thank you for your purchase</p>
      </div>

      {/* Order Details */}
      {orderData && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Order Details</h2>

          {/* Order ID */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Order Number</h3>
            <p className="text-2xl font-mono font-bold text-blue-600">{orderId}</p>
          </div>

          {/* Payment Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Payment Status</h3>
              <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">
                ✓ Paid
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Amount</h3>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(orderData.total)} OMR
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Items Ordered</h3>
            <div className="space-y-4">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)} OMR</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal</span>
                <span className="font-semibold">{formatCurrency(orderData.subtotal)} OMR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Tax</span>
                <span className="font-semibold">{formatCurrency(orderData.tax)} OMR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Shipping</span>
                <span className="font-semibold">{formatCurrency(orderData.shipping)} OMR</span>
              </div>
              <div className="border-t-2 border-blue-300 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-lg text-blue-600">{formatCurrency(orderData.total)} OMR</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {orderData.shippingAddress && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">
                  {orderData.shippingAddress.firstName} {orderData.shippingAddress.lastName}
                </p>
                <p>{orderData.shippingAddress.addressLine}</p>
                <p>
                  {orderData.shippingAddress.city}, {orderData.shippingAddress.state}{' '}
                  {orderData.shippingAddress.zipCode}
                </p>
                <p>{orderData.shippingAddress.country}</p>
                <p className="text-gray-600 mt-2">{orderData.shippingAddress.phone}</p>
              </div>
            </div>
          )}

          {/* Transaction ID */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
            <p className="font-mono text-sm break-all">{orderData.transactionId}</p>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
        <h2 className="text-lg font-bold text-blue-800 mb-4">What's Next?</h2>
        <ol className="space-y-3 text-blue-900">
          <li className="flex gap-3">
            <span className="font-bold">1.</span>
            <span>Check your email for an order confirmation and receipt</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">2.</span>
            <span>Your order will be processed and shipped within 2-3 business days</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">3.</span>
            <span>Track your order status in your account dashboard</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold">4.</span>
            <span>Receive tracking information once your package ships</span>
          </li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={() => navigate(ROUTES.ORDERS)}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          View My Orders
        </Button>
        <Button
          onClick={() => navigate(ROUTES.HOME)}
          className="w-full px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
        >
          Continue Shopping
        </Button>
      </div>

      {/* Support */}
      <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
        <p>Have questions? {"  "}</p>
        <a href={ROUTES.CONTACT} className="text-blue-600 hover:underline">
          Contact our support team
        </a>
      </div>
    </div>
  );
};

export default PaymentSuccess;
