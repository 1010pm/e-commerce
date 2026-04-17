/**
 * Payment Success Page - Production Ready
 * Displayed after successful Thawani payment
 * Verifies payment status, creates order, and clears cart ONLY on paid status
 * Supports mock mode for testing without real API credentials
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../store/slices/cartSlice';
import { retrievePaymentSession, clearPaymentSession } from '../services/thawaniPaymentService';
import { verifyPaymentAndProcessOrder } from '../services/paymentVerificationService';
import { savePaymentTransaction } from '../services/paymentsService';
import Currency from '../components/common/Currency';
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
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);

  const [verifying, setVerifying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);
  const [isMockPayment, setIsMockPayment] = useState(false);

  // ✅ CRITICAL: Prevent effect from running twice
  // This ref ensures verification only happens once per component mount
  const verificationAttemptedRef = useRef(false);

  // ✅ Main payment verification effect
  useEffect(() => {
    // ✅ PREVENT DOUBLE EXECUTION: Check if we've already attempted verification
    if (verificationAttemptedRef.current) {
      console.log('ℹ️ [PAYMENT-SUCCESS] Verification already attempted, skipping duplicate run');
      return;
    }

    // ✅ CRITICAL: Mark that we're attempting verification
    verificationAttemptedRef.current = true;

    const verifyAndProcessPayment = async () => {
      try {
        setVerifying(true);
        console.log('🔐 [PAYMENT-SUCCESS] Starting payment verification and order processing');

        // ✅ Step 1: Get session ID from URL or storage
        let sessionId = searchParams.get('sessionId');
        
        if (!sessionId) {
          const storedSession = retrievePaymentSession();
          sessionId = storedSession.sessionId;
        }

        if (!sessionId) {
          throw new Error('No payment session found. Please try the checkout process again.');
        }

        console.log('📍 [PAYMENT-SUCCESS] Session ID found:', sessionId.substring(0, 10) + '...');

        // Retrieve stored session data
        const storedSession = retrievePaymentSession();

        // ✅ Step 2: Verify payment and process order using new service
        console.log('🚀 [PAYMENT-SUCCESS] Calling verifyPaymentAndProcessOrder...');
        
        const verificationResult = await verifyPaymentAndProcessOrder({
          sessionId,
          userId: authUser?.uid,
          cartItems: storedSession?.items || items,
          shippingAddress: storedSession?.shippingAddress,
          onClearCart: () => dispatch(clearCart()),
          onError: (error) => {
            console.error('❌ [PAYMENT-SUCCESS] Verification error:', error);
            setError(error);
            toast.error(error);
          },
          onSuccess: async (result) => {
            console.log('✅ [PAYMENT-SUCCESS] Payment verification successful:', result);
            
            setIsMockPayment(result.isMock);
            setOrderId(result.orderId);
            
            // ✅ Extract gateway data immediately (accessible after try/catch)
            const orderPayload = {
              items: storedSession?.items || items,
              total: storedSession?.amount || storedSession?.total || 0,
              subtotal: storedSession?.subtotal || 0,
              shipping: storedSession?.shipping || 0,
              shippingAddress: storedSession?.shippingAddress || {},
            };

            // ✅ CRITICAL: Extract gateway data from verification result
            const gatewayResponse = result.sessionData || {};
            const gatewayAmount = gatewayResponse.total_amount || (Math.round(orderPayload.total * 1000));
            const displayAmount = gatewayAmount / 1000;
            
            console.log('[PAYMENT-SUCCESS] Extracted gateway data:', {
              total_amount_baisa: gatewayAmount,
              total_amount_omr: displayAmount.toFixed(3),
              session_id: gatewayResponse.session_id || sessionId,
              invoice: gatewayResponse.invoice,
              payment_status: gatewayResponse.payment_status,
              client_reference_id: gatewayResponse.client_reference_id,
            });

            // ✅ Extract transaction ID - MUST use invoice from Thawani response
            // Invoice is the official transaction ID from payment gateway
            if (!gatewayResponse.invoice) {
              console.warn('⚠️ [PAYMENT-SUCCESS] WARNING: invoice field missing from Thawani response!', {
                available_fields: Object.keys(gatewayResponse),
                full_response: gatewayResponse,
                session_id: gatewayResponse.session_id,
                client_reference_id: gatewayResponse.client_reference_id,
              });
            }
            
            // ✅ Try multiple field names for transaction ID (in priority order)
            const transactionId = 
              gatewayResponse.invoice || 
              gatewayResponse.transaction_id || 
              gatewayResponse.session_id || // ✅ Fallback to session_id if no invoice
              ''; 
            
            console.log('[PAYMENT-SUCCESS] Transaction ID Extraction:', {
              invoice_field: gatewayResponse.invoice,
              transaction_id_field: gatewayResponse.transaction_id,
              session_id_field: gatewayResponse.session_id,
              final_transactionId: transactionId,
              which_field_was_used: transactionId === gatewayResponse.invoice ? 'invoice' : 
                                     transactionId === gatewayResponse.transaction_id ? 'transaction_id' :
                                     transactionId === gatewayResponse.session_id ? 'session_id' : 'none',
            });
            
            // ✅ Save payment transaction record with complete gateway data
            try {
              console.log('💾 [PAYMENT-SUCCESS] Saving payment transaction with gateway data...');

              const paymentSaveResult = await savePaymentTransaction(
                authUser?.uid,
                result.orderId,
                {
                  // ✅ Amount fields with proper priority
                  amount: displayAmount || orderPayload.total,  // OMR (display)
                  gatewayAmount: gatewayAmount,                 // baisa (from gateway)
                  
                  // ✅ Gateway identifiers (CRITICAL)
                  sessionId: gatewayResponse.session_id || sessionId,           // Thawani session
                  transactionId: transactionId,                                 // Thawani invoice
                  
                  // ✅ Full gateway response for audit trail
                  gatewayResponse: {
                    session_id: gatewayResponse.session_id,
                    invoice: gatewayResponse.invoice,
                    total_amount: gatewayAmount,
                    payment_status: gatewayResponse.payment_status || 'paid',
                    client_reference_id: gatewayResponse.client_reference_id,
                    created_at: gatewayResponse.created_at,
                  },
                  
                  // ✅ Order details
                  subtotal: orderPayload.subtotal,
                  shipping: orderPayload.shipping,
                  currency: 'OMR',
                  status: gatewayResponse.payment_status || 'paid',
                  
                  // ✅ Payment method
                  paymentMethod: 'thawani',
                  paymentGateway: 'thawani',
                  
                  // ✅ Customer information
                  customerName: `${orderPayload.shippingAddress?.firstName || ''} ${orderPayload.shippingAddress?.lastName || ''}`.trim(),
                  customerEmail: orderPayload.shippingAddress?.email || '',
                  customerPhone: orderPayload.shippingAddress?.phone || '',
                  
                  // ✅ Items and products
                  itemsCount: orderPayload.items?.length || 0,
                  products: orderPayload.items?.map((item, idx) => ({
                    id: item.id || `item-${idx}`,
                    productId: item.productId || item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                  })) || [],
                  
                  // ✅ Shipping address
                  shippingAddress: orderPayload.shippingAddress,
                  
                  // ✅ Metadata
                  userAgent: navigator.userAgent,
                  notes: `Order created after successful Thawani payment verification at ${new Date().toISOString()}`,
                  
                  // ✅ Verification timestamp
                  verifiedAt: new Date(),
                }
              );

              if (paymentSaveResult.success) {
                console.log('✅ [PAYMENT-SUCCESS] Payment transaction saved with complete data:', {
                  paymentId: paymentSaveResult.paymentId,
                  amount: `${displayAmount.toFixed(3)} OMR`,
                  sessionId: sessionId.substring(0, 15) + '...',
                });
              } else {
                console.warn('⚠️ [PAYMENT-SUCCESS] Payment transaction save failed:', paymentSaveResult.error);
              }
            } catch (txError) {
              console.error('❌ [PAYMENT-SUCCESS] Error saving transaction:', txError);
              // Don't fail the entire flow for this
            }

            // ✅ Set order data for display (including transaction ID)
            setOrderData({
              ...storedSession,
              orderId: result.orderId,
              items: storedSession?.items || items,
              transactionId: transactionId,  // ✅ Include transaction ID
              amount: displayAmount,         // ✅ Include display amount
              status: gatewayResponse.payment_status || 'paid',
            });

            // ✅ Clear temporary payment session
            clearPaymentSession();
            
            // ✅ Clear shopping cart after successful payment
            dispatch(clearCart());
            console.log('🗑️ [PAYMENT-SUCCESS] Shopping cart cleared after successful payment');
            
            // ✅ Show success message
            toast.success('🎉 Payment successful! Order created and cart cleared.');
          },
        });

        // Handle verification result
        if (!verificationResult.success) {
          throw new Error(verificationResult.error || 'Payment verification failed');
        }

      } catch (err) {
        console.error('❌ [PAYMENT-SUCCESS] Error:', err);
        const errorMessage = err?.message || 'An error occurred during payment verification';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setVerifying(false);
      }
    };

    // ✅ Only verify if we're authenticated (ref prevents double execution)
    if (authUser?.uid) {
      verifyAndProcessPayment();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.uid]);

  // ✅ Auto-redirect to orders page after 50 second delay if successful
  useEffect(() => {
    if (orderId && !error) {
      const redirectTimer = setTimeout(() => {
        console.log('🔄 [PAYMENT-SUCCESS] Auto-redirecting to orders page after 50 seconds...');
        navigate(ROUTES.ORDERS);
      }, 50000); // 50 seconds - user requested delay

      return () => clearTimeout(redirectTimer);
    }
  }, [orderId, error, navigate]);

  // ✅ Countdown for redirect (50 seconds)
  const [redirectCountdown, setRedirectCountdown] = React.useState(50);
  useEffect(() => {
    if (orderId && !error) {
      const countdown = setInterval(() => {
        setRedirectCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [orderId, error]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center gap-4">
        <PageLoader />
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-2">🔍 Verifying your payment...</p>
          <p className="text-sm text-gray-500">Please wait while we confirm your transaction and create your order.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white border-2 border-red-200 rounded-xl p-8 text-center shadow-lg">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold text-red-800 mb-2">Payment Verification Failed</h1>
            <p className="text-lg text-red-700 mb-6">{error}</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>What happened?</strong><br/>
                Your payment could not be verified. If you were charged, your payment will be refunded within 3-5 business days.
              </p>
            </div>

            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={() => navigate(ROUTES.CHECKOUT)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate(ROUTES.ORDERS)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
              >
                View Orders
              </Button>
              <Button
                onClick={() => navigate(ROUTES.HOME)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Home
              </Button>
            </div>
          </div>
        </div>
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
                <Currency amount={orderData.amount || orderData.total || 0} size="lg" />
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
                  <p className="font-semibold"><Currency amount={item.price * item.quantity} /></p>
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
                <span className="font-semibold"><Currency amount={orderData.subtotal} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Shipping</span>
                <span className="font-semibold"><Currency amount={orderData.shipping} /></span>
              </div>
              <div className="border-t-2 border-blue-300 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-lg text-blue-600"><Currency amount={orderData.amount || orderData.total || 0} size="lg" /></span>
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

          {/* Transaction ID - CRITICAL */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm font-semibold text-gray-600 mb-2">🧾 Transaction ID</p>
            {orderData.transactionId ? (
              <div>
                <p className="font-mono text-lg font-bold text-blue-600 break-all">{orderData.transactionId}</p>
                <p className="text-xs text-green-600 mt-2">✓ Transaction confirmed and saved</p>
              </div>
            ) : (
              <div className="text-yellow-600">
                <p className="font-mono text-sm">Transaction ID: Pending from payment gateway</p>
                <p className="text-xs mt-1">An order confirmation with transaction details has been sent to your email</p>
                <p className="text-xs text-gray-500 mt-2">Order ID {orderId} can be used to track your order</p>
              </div>
            )}
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

      {/* Auto-redirect notification - HIDDEN */}
      {/* Redirect happens silently in background */}

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
