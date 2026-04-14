/**
 * Checkout Page - Thawani Payment Gateway
 * Secure checkout with Thawani payment processing for Oman-based transactions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { checkoutService } from '../services/checkoutService';
import { getUserProfile } from '../services/userService';
import { createThawaniSession, redirectToThawaniCheckout, storePaymentSession } from '../services/thawaniPaymentService';
import { formatCurrency } from '../utils/helpers';
import { ROUTES } from '../constants/routes';
import { APP_CONFIG } from '../constants/config';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { PageLoader } from '../components/common/Loading';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const MOCK_MODE = process.env.REACT_APP_THAWANI_MOCK_MODE === 'true';

const CheckoutThawani = () => {
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
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

  // Calculate totals
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = subtotal * APP_CONFIG.TAX_RATE;
  const shipping = subtotal >= APP_CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : APP_CONFIG.SHIPPING_COST;
  const total = subtotal + tax + shipping;

  // Convert to baisa (1 OMR = 1000 baisa)
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
          tax,
          shipping,
        });
        throw new Error('Order total is invalid - please verify your cart');
      }

      if (totalInBaisa < 100) {
        throw new Error('Order total must be at least 0.1 OMR');
      }

      console.log('📋 [CHECKOUT] Sending payment request:', {
        amount: totalInBaisa,
        amountInOMR: (totalInBaisa / 1000).toFixed(3),
        amountIsInteger: Number.isInteger(totalInBaisa),
        itemsCount: orderItems.length,
        customer: customerData,
      });

      // Show user feedback that we're starting the process
      toast.loading('Initializing payment gateway...', { id: 'payment-init' });

      // Create payment session on backend
      const sessionResponse = await createThawaniSession({
        amount: totalInBaisa,
        currency: 'OMR',
        customer: customerData,
        items: orderItems,
      });

      console.log('📥 [CHECKOUT] Payment session response received:', {
        hasResponse: !!sessionResponse,
        success: sessionResponse?.success,
        hasSessionId: !!sessionResponse?.sessionId,
        sessionIdType: typeof sessionResponse?.sessionId,
        sessionIdLength: sessionResponse?.sessionId?.length,
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
            tax,
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
        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex-1">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full">
                <span className="text-sm font-bold">1</span>
              </div>
              <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
              <div className="flex items-center justify-center w-10 h-10 bg-gray-300 text-gray-600 rounded-full">
                <span className="text-sm font-bold">2</span>
              </div>
              <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
              <div className="flex items-center justify-center w-10 h-10 bg-gray-300 text-gray-600 rounded-full">
                <span className="text-sm font-bold">3</span>
              </div>
            </div>
            <div className="flex justify-between mt-3 text-xs font-semibold text-gray-600">
              <span>Address</span>
              <span>Payment</span>
              <span>Complete</span>
            </div>
          </div>
        </div>

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
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="OM">Oman</option>
                    <option value="AE">UAE</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="KW">Kuwait</option>
                    <option value="QA">Qatar</option>
                    <option value="BH">Bahrain</option>
                  </select>
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
                  <>💳 Pay {formatCurrency(total)} OMR</>
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
                    <span>{formatCurrency(item.price * item.quantity)} OMR</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)} OMR</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>{formatCurrency(tax)} OMR</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatCurrency(shipping) + ' OMR'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(total)} OMR</span>
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
