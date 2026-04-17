/**
 * Checkout Page - Thawani Payment Gateway
 * Secure checkout with Thawani payment processing for Oman-based transactions
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { checkoutService } from '../services/checkoutService';
import { getUserProfile } from '../services/userService';
import { ordersService } from '../services/ordersService';
import Currency from '../components/common/Currency';
import { createThawaniSession, redirectToThawaniCheckout, storePaymentSession, clearPaymentSession } from '../services/thawaniPaymentService';
import { formatCurrency } from '../utils/helpers';
import { validatePaymentAmount, logPaymentDetails } from '../utils/paymentCalculation';
import { ROUTES } from '../constants/routes';
import { APP_CONFIG } from '../constants/config';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { PageLoader } from '../components/common/Loading';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { clearCart } from '../store/slices/cartSlice';

const MOCK_MODE = process.env.REACT_APP_THAWANI_MOCK_MODE === 'true';

const CheckoutThawani = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('thawani'); // ✅ Payment method selection
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'OM', // Default to Oman
  });
  const [errors, setErrors] = useState({});

  // Load user profile data for auto-fill
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!authUser?.uid) {
          setProfileLoading(false);
          return;
        }

        const result = await getUserProfile(authUser.uid);
        if (result.success && result.data) {
          const { displayName, phoneNumber, address } = result.data;
          const [firstName, ...lastNameParts] = (displayName || '').split(' ');

          setFormData((prev) => ({
            ...prev,
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            phone: phoneNumber || '',
            addressLine: address?.addressLine || '',
            city: address?.city || '',
            state: address?.state || '',
            zipCode: address?.zipCode || '',
            country: address?.country || 'OM',
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [authUser?.uid]);

  // Calculate totals using helper function
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = 2; // Fixed 2 OMR shipping
  
  // Use helper to calculate and validate total
  const total = subtotal + shipping;
  const totalInBaisa = Math.round(total * 1000);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authUser?.uid) {
      toast.error('Please sign in to continue');
      navigate(ROUTES.LOGIN);
      return;
    }

    // ⚠️ CRITICAL VERIFICATION: Log shipping calculation BEFORE sending
    console.log('🔴 [CHECKOUT] ===== CRITICAL PRE-CHECK =====');
    console.log('🔴 [CHECKOUT] Shipping verification BEFORE payment:', {
      shipping_value: shipping,
      shipping_type: typeof shipping,
      shipping_is_2: shipping === 2,
      shipping_finite: Number.isFinite(shipping),
      shipping_positive: shipping > 0,
      calculation: {
        subtotal: subtotal.toFixed(3),
        shipping: shipping.toFixed(3),
        total_should_be: `${(subtotal + shipping).toFixed(3)}`,
        total_actual: total.toFixed(3),
        match: Math.abs((subtotal + shipping) - total) < 0.01,
      },
    });
    console.log('🔴 [CHECKOUT] ================================');

    // Validate shipping address
    const addressValidation = checkoutService.validateShippingAddress({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      addressLine: formData.addressLine,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country,
    });

    if (!addressValidation.valid) {
      setErrors(addressValidation.errors);
      toast.error('Please fill in all required fields correctly');
      return;
    }

    // Process Thawani Payment
    await processThawaniPayment();
  };

  /**
   * Process Thawani Payment
   * Creates payment session, validates response, and redirects to checkout
   */
  const processThawaniPayment = async () => {
    setProcessingPayment(true);
    setLoading(true);

    try {
      // Validate cart has items
      if (!items || items.length === 0) {
        toast.error('❌ Your cart is empty. Please add items before checkout.');
        setProcessingPayment(false);
        setLoading(false);
        return;
      }

      // ✅ NEW: Validate all cart items are still in stock
      const outOfStockItems = items.filter(item => {
        const stockQuantity = item.stock || 999; // Assume unlimited if not specified
        return item.quantity > stockQuantity;
      });

      if (outOfStockItems.length > 0) {
        const itemNames = outOfStockItems.map(item => `${item.name} (requested: ${item.quantity}, available: ${item.stock || 'unlimited'})`).join(', ');
        toast.error(`❌ Not enough stock: ${itemNames}`);
        setProcessingPayment(false);
        setLoading(false);
        navigate(ROUTES.CART);
        return;
      }

      console.log('💳 [CHECKOUT] Starting payment process:', {
        itemsCount: items.length,
        totalInBaisa,
        totalInOMR: (totalInBaisa / 1000).toFixed(3),
      });  

      // Prepare customer data for Thawani
      const customerData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      // Validate customer data
      if (!customerData.name || !customerData.email || !customerData.phone) {
        toast.error('Please fill in all customer information');
        setProcessingPayment(false);
        setLoading(false);
        return;
      }

      // Prepare order items - STRICT cleaning
      const orderItems = items.map((item, index) => {
        if (!item || typeof item !== 'object') {
          throw new Error(`Item ${index + 1}: must be an object, received: ${typeof item}`);
        }

        const name = String(item.name || `Product ${index + 1}`).trim();
        if (!name) {
          throw new Error(`Item ${index + 1}: name is required`);
        }

        const quantityNum = Number(item.quantity);
        if (isNaN(quantityNum) || quantityNum < 1) {
          throw new Error(`Item ${index + 1} "${name}": invalid quantity ${item.quantity}`);
        }
        const quantity = Math.floor(quantityNum);

        const priceNum = Number(item.price);
        if (isNaN(priceNum) || priceNum <= 0) {
          throw new Error(`Item ${index + 1} "${name}": invalid price ${item.price}`);
        }

        // ✅ CRITICAL: Include ALL necessary fields for order creation
        return {
          id: item.id || `local-${index}`, // Ensure ID exists
          productId: item.productId || item.id || `product-${index}`, // Ensure productId
          name,
          quantity,
          price: parseFloat(priceNum.toFixed(3)),
          image: item.image || null,
        };
      });

      console.log('📋 [CHECKOUT] Cleaned items:', {
        itemsCount: orderItems.length,
        items: orderItems.map((i) => ({
          id: i.id,
          productId: i.productId,
          name: i.name.substring(0, 30),
          quantity: i.quantity,
          price: i.price,
          priceInBaisa: Math.round(i.price * 1000),
        })),
      });

      // Validate totalInBaisa is a proper integer
      if (!Number.isInteger(totalInBaisa)) {
        console.error('❌ [CHECKOUT] totalInBaisa is not an integer:', {
          totalInBaisa,
          total,
          type: typeof totalInBaisa,
          calculation: `Math.round(${total} * 1000) = ${totalInBaisa}`,
        });
        throw new Error('Order total calculation error - please refresh and try again');
      }

      if (isNaN(totalInBaisa)) {
        console.error('❌ [CHECKOUT] totalInBaisa is NaN:', {
          total,
          subtotal,
          shipping,
        });
        throw new Error('Order total is invalid - please verify your cart');
      }

      if (totalInBaisa < 100) {
        throw new Error('Order total must be at least 0.1 OMR');
      }

      // ✅ CRITICAL: Validate amount before sending to payment gateway
      const amountValidation = validatePaymentAmount(totalInBaisa);
      if (!amountValidation.valid) {
        console.error('❌ [CHECKOUT] Amount validation failed:', amountValidation.error);
        throw new Error(`Payment amount validation failed: ${amountValidation.error}`);
      }

      // 📊 LOG COMPLETE PAYMENT DETAILS FOR DEBUGGING
      logPaymentDetails({
        subtotal,
        shipping,
        total,
        totalInBaisa,
        itemCount: orderItems.length,
        customer: customerData,
      });

      // Show user feedback that we're starting the process
      if (paymentMethod === 'cash') {
        toast.loading('Creating order (Cash Payment)...', { id: 'payment-init' });
        console.log('💵 [CHECKOUT] Processing cash payment, creating order...');

        // ✅ For cash payment: Create order directly with pending payment status
        const orderResult = await ordersService.create(authUser.uid, {
          items: orderItems,
          total,
          paymentMethod: 'cash',
          paymentStatus: 'pending', // ✅ Payment pending for cash
          shippingAddress: formData,
          notes: `Cash payment. Order created at ${new Date().toISOString()}`,
          subtotal,
          shipping,
          transactionId: `cash_${Date.now()}`, // Generate a cash transaction ID
        });

        if (!orderResult.success) {
          throw new Error(orderResult.error || 'Failed to create order');
        }

        console.log('✅ [CHECKOUT] Order created successfully with cash payment:', {
          orderId: orderResult.data?.id,
          paymentStatus: 'pending',
        });

        toast.dismiss('payment-init');
        toast.success('✅ Order created! Payment status: Pending (Cash on Delivery)');

        // ✅ Clear shopping cart after successful order
        dispatch(clearCart());
        console.log('🗑️ [CHECKOUT] Shopping cart cleared');

        // Clear session and redirect
        storePaymentSession(null, {}); // Clear
        clearPaymentSession();
        setTimeout(() => {
          navigate(ROUTES.ORDERS);
        }, 1500);
        return;
      }

      // ✅ For Thawani online payment
      toast.loading('Initializing Thawani payment gateway...', { id: 'payment-init' });

      // 💳 SEND PAYMENT REQUEST TO THAWANI
      console.log('💳 [CHECKOUT] Creating Thawani payment session:', {
        amount: totalInBaisa,
        amountInOMR: (totalInBaisa / 1000).toFixed(3),
        amountIsInteger: Number.isInteger(totalInBaisa),
        breakdown: {
          subtotal: subtotal.toFixed(3),
          shipping: shipping.toFixed(3),
          total: total.toFixed(3),
        },
        itemsCount: orderItems.length,
        itemsDetails: orderItems.map((item, idx) => ({
          index: idx,
          id: item.id,
          productId: item.productId,
          name: item.name.substring(0, 30),
          quantity: item.quantity,
          price: item.price,
          priceInBaisa: Math.round(item.price * 1000),
        })),
        customer: customerData,
      });

      // ⚠️ CRITICAL: Log shipping value to verify it's correct
      console.log('🚚 [CHECKOUT] Shipping verification:', {
        shippingValue: shipping,
        shippingType: typeof shipping,
        shippingInBaisa: Math.round(shipping * 1000),
        shippingIsValid: shipping > 0 && Number.isFinite(shipping),
      });

      // Create payment session on backend
      // 📌 IMPORTANT: Frontend passes ONLY items, backend calculates total securely
      // Backend will: sum(items) + shipping = total
      // This prevents users from tampering with the amount
      const sessionResponse = await createThawaniSession({
        currency: 'OMR',
        customer: customerData,
        items: orderItems,                   // ✅ Only pass items - backend calculates total
        shippingAmount: shipping,            // ✅ Backend adds as separate product
        shippingAddress: formData,           // ✅ For order records
      });

      // 🔍 VERIFICATION: Log what backend should build
      console.log('📦 [CHECKOUT] Backend will build products:', {
        fromFrontend: {
          items: orderItems.length,
          itemsTotal: subtotal,
          shipping: shipping,
        },
        backendWillCreate: {
          products: [
            ...orderItems.map(i => ({name: i.name.substring(0, 20), quantity: i.quantity, unitAmount: `${Math.round(i.price * 1000)} baisa`})),
            {name: 'Shipping', quantity: 1, unitAmount: `${Math.round(shipping * 1000)} baisa`}
          ],
          calculatedTotal: `${totalInBaisa} baisa (${(totalInBaisa/1000).toFixed(3)} OMR)`,
        }
      });

      console.log('📥 [CHECKOUT] Payment session response received:', {
        hasResponse: !!sessionResponse,
        success: sessionResponse?.success,
        hasSessionId: !!sessionResponse?.sessionId,
        sessionIdType: typeof sessionResponse?.sessionId,
        sessionIdLength: sessionResponse?.sessionId?.length,
      });

      // ✅ VERIFY: Backend will calculate amount from items securely
      console.log('🔍 [CHECKOUT] Verification - Backend will calculate:', {
        items: orderItems.length,
        itemsSubtotal: subtotal.toFixed(3),
        shipping: shipping.toFixed(3),
        expectedTotal: total.toFixed(3),
        note: 'Amount NOT sent from frontend - backend calculates from items + shipping',
      });

      // Validate response structure
      if (!sessionResponse) {
        console.error('❌ [CHECKOUT] No response from payment gateway');
        toast.error('Payment gateway returned no response. Please try again.');
        setProcessingPayment(false);
        setLoading(false);
        return;
      }

      // Check for success flag
      if (sessionResponse.success === false) {
        const errorMessage = sessionResponse.error || 'Unknown payment gateway error';
        console.error('❌ [CHECKOUT] Payment gateway error:', errorMessage);
        
        // Handle specific error scenarios
        if (errorMessage.includes('503')) {
          toast.error('Payment gateway is temporarily unavailable. Please try again in a few minutes.');
        } else if (errorMessage.includes('timeout')) {
          toast.error('Payment gateway request timed out. Please try again.');
        } else if (errorMessage.includes('network')) {
          toast.error('Network error. Please check your internet connection and try again.');
        } else {
          toast.error(`Payment initialization failed: ${errorMessage}`);
        }
        setProcessingPayment(false);
        setLoading(false);
        return;
      }

      // Validate sessionUrl exists
      if (!sessionResponse.sessionUrl) {
        console.error('❌ [CHECKOUT] No sessionUrl in response!', {
          response: sessionResponse,
        });
        toast.error('Payment gateway failed to create a checkout URL. Please try again.');
        setProcessingPayment(false);
        setLoading(false);
        return;
      }

      // Validate sessionUrl is a string
      if (typeof sessionResponse.sessionUrl !== 'string') {
        console.error('❌ [CHECKOUT] sessionUrl is not a string:', {
          type: typeof sessionResponse.sessionUrl,
          value: sessionResponse.sessionUrl,
        });
        toast.error('Invalid checkout URL from payment gateway. Please try again.');
        setProcessingPayment(false);
        setLoading(false);
        return;
      }

      const sessionUrl = sessionResponse.sessionUrl.trim();

      // Final validation: sessionUrl should not be empty
      if (sessionUrl === '') {
        console.error('❌ [CHECKOUT] sessionUrl is empty string');
        toast.error('Payment gateway returned empty checkout URL. Please try again.');
        setProcessingPayment(false);
        setLoading(false);
        return;
      }

      console.log('✅ [CHECKOUT] Valid session created with checkout URL');

      // Store session info temporarily for success page
      const sessionId = sessionResponse.sessionId;
      try {
        if (sessionId) {
          storePaymentSession(sessionId, {
            amount: total,
            currency: 'OMR',
            shippingAddress: formData,
            items: orderItems,
            subtotal,
            shipping,
          });
          console.log('✅ [CHECKOUT] Session info stored locally');
        }
      } catch (storageError) {
        console.error('⚠️  [CHECKOUT] Failed to store session info locally:', storageError);
        // Continue anyway - not critical
      }

      // Update toast
      toast.loading('Redirecting to payment gateway...', { id: 'payment-init' });

      // Small delay for UX - let user see the messages
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In mock mode, simulate the redirect
      if (MOCK_MODE) {
        console.log('🎭 [CHECKOUT] Mock mode - simulating payment flow');
        setTimeout(() => {
          toast.dismiss('payment-init');
          // Dismiss all toasts and simulate returning from Thawani
          navigate(`${ROUTES.PAYMENT_SUCCESS}?sessionId=${sessionId}`);
        }, 1500);
      } else {
        // Real mode: Redirect to Thawani checkout page using the full sessionUrl
        setTimeout(() => {
          try {
            console.log('🔗 [CHECKOUT] Redirecting to Thawani checkout');
            redirectToThawaniCheckout(sessionUrl);
            // If we get here, redirect succeeded, dismiss loading toast
            toast.dismiss('payment-init');
          } catch (redirectError) {
            console.error('❌ [CHECKOUT] Redirect to Thawani failed:', redirectError.message);
            toast.dismiss('payment-init');
            toast.error(`Failed to redirect to payment gateway: ${redirectError.message}`);
            setProcessingPayment(false);
            setLoading(false);
          }
        }, 500);
      }
    } catch (error) {
      console.error('❌ [CHECKOUT] Payment process error:', {
        message: error.message,
        code: error.code,
        type: error.constructor.name,
      });
      console.error('Full error:', error);

      toast.dismiss('payment-init');

      // Provide user-friendly error message
      if (error.message.includes('not authenticated') || error.message.includes('sign in')) {
        toast.error('Your session expired. Please sign in again.');
        navigate(ROUTES.LOGIN);
      } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Payment initialization failed. Please verify your information and try again.');
      }

      setProcessingPayment(false);
      setLoading(false);
    }
  };

  if (profileLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Mock Mode Banner */}
        {MOCK_MODE && (
          <div className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎭</span>
              <div className="flex-1">
                <p className="font-bold text-yellow-800">Test Payment Mode Active</p>
                <p className="text-sm text-yellow-700">
                  Payments will be simulated. No real charges will be made.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="md:flex gap-8">
          {/* Left Column: Form */}
          <div className="flex-1">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
              <p className="text-gray-600">Complete your purchase securely</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
              {/* Personal Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                    required
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                    required
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    required
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                <Input
                  label="Address"
                  name="addressLine"
                  value={formData.addressLine}
                  onChange={handleChange}
                  error={errors.addressLine}
                  required
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    required
                  />
                  <Input
                    label="State/Region"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    error={errors.state}
                    required
                  />
                  <Input
                    label="Postal Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    error={errors.zipCode}
                    required
                  />
                </div>
                
                {/* Country: Always Oman */}
                <div>
                  <Input
                    label="Country"
                    value="Oman"
                    disabled
                    readOnly
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Cash Payment Option */}
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">💵 Pay by Cash</p>
                        <p className="text-sm text-gray-600">Pay when order is received</p>
                      </div>
                    </label>
                  </div>

                  {/* Online Payment Option */}
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'thawani'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                    onClick={() => setPaymentMethod('thawani')}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="thawani"
                        checked={paymentMethod === 'thawani'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">💳 Pay Online (Thawani)</p>
                        <p className="text-sm text-gray-600">Secure payment gateway</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Payment Status Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <p>✓ Payment status will be marked as <strong>pending</strong> until payment is received</p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || processingPayment || items.length === 0}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {processingPayment ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⚙️</span>
                    Processing...
                  </>
                ) : (
                  <>
                    {paymentMethod === 'cash' ? '✓ Confirm Order' : '💳 Pay'} {formatCurrency(total)}
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <span>🔒</span>
                Secure & encrypted payment
              </p>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="md:w-80 mt-8 md:mt-0">
            <div className="sticky top-4 bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4">Order Summary</h3>

              {/* Items */}
              <div className="space-y-2 mb-4 pb-4 border-b">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span><Currency amount={item.price * item.quantity} /></span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span><Currency amount={subtotal} /></span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : <Currency amount={shipping} />}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600"><Currency amount={total} size="lg" /></span>
                </div>
              </div>

              {/* Security Info */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
                <p className="font-semibold text-green-800 mb-2">✓ Secure Checkout</p>
                <ul className="text-green-700 text-xs space-y-1">
                  <li>• End-to-end encrypted</li>
                  <li>• Thawani verified</li>
                  <li>• Safe for Oman</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutThawani;
