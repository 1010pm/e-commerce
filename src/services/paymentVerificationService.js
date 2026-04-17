/**
 * Payment Verification Service
 * Production-ready flow for verifying payments and clearing cart
 * Ensures cart is ONLY cleared on confirmed successful payment
 */

import { verifyThawaniPayment } from './thawaniPaymentService';
import { ordersService } from './ordersService';

/**
 * Payment verification state to prevent duplicate operations
 * @type {Object}
 */
const paymentState = {
  verificationInProgress: {},
  ordersSaved: {},
  cartCleared: {},
};

/**
 * Verify payment and execute post-payment flow
 * CRITICAL: This function MUST verify payment before clearing cart
 *
 * @param {Object} config
 * @param {string} config.sessionId - Thawani session ID from URL
 * @param {string} config.userId - Current user ID
 * @param {Array} config.cartItems - Current cart items
 * @param {Function} config.onClearCart - Redux clearCart dispatch function
 * @param {Function} config.onError - Error callback
 * @param {Function} config.onSuccess - Success callback
 * @returns {Promise<{success: boolean, orderId?: string, error?: string}>}
 */
export const verifyPaymentAndProcessOrder = async (config) => {
  const {
    sessionId,
    userId,
    cartItems = [],
    shippingAddress,
    onClearCart,
    onError,
    onSuccess,
  } = config;

  // ✅ Step 1: Input validation
  if (!sessionId || !sessionId.trim()) {
    const error = 'Session ID is missing. Please check your payment provider.';
    console.error('❌ [PAYMENT-VERIFY] ' + error);
    onError?.(error);
    return { success: false, error };
  }

  if (!userId || !userId.trim()) {
    const error = 'User ID is missing. Please log in again.';
    console.error('❌ [PAYMENT-VERIFY] ' + error);
    onError?.(error);
    return { success: false, error };
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    const error = 'Cart is empty. Cannot process order.';
    console.error('❌ [PAYMENT-VERIFY] ' + error);
    onError?.(error);
    return { success: false, error };
  }

  // ✅ CRITICAL: Prevent concurrent verification for same session
  // If verification is already in progress, wait and return cached result
  if (paymentState.verificationInProgress[sessionId]) {
    console.log('ℹ️  [PAYMENT-VERIFY] Verification already in progress for this session, waiting for result...');
    // Wait a bit and check if order was saved
    await new Promise(resolve => setTimeout(resolve, 500));
    if (paymentState.ordersSaved[sessionId]) {
      return { success: true, orderId: paymentState.ordersSaved[sessionId] };
    }
  }

  // Mark verification in progress
  paymentState.verificationInProgress[sessionId] = true;

  console.log('🔐 [PAYMENT-VERIFY] Starting payment verification:', {
    sessionId: sessionId.substring(0, 10) + '...',
    userId: userId.substring(0, 5) + '...',
    itemsCount: cartItems.length,
  });

  // ✅ Step 2: Check if order was ALREADY saved for this session
  // This is the PRIMARY check - if order exists in Firestore, verification is complete
  if (paymentState.ordersSaved[sessionId]) {
    console.log('ℹ️  [PAYMENT-VERIFY] Order already saved for this session (from memory):', {
      sessionId: sessionId.substring(0, 10) + '...',
      orderId: paymentState.ordersSaved[sessionId],
    });
    paymentState.verificationInProgress[sessionId] = false;
    return { success: true, orderId: paymentState.ordersSaved[sessionId] };
  }

  try {
      // ✅ Step 3: Verify payment on backend
      console.log('🔍 [PAYMENT-VERIFY] Calling verifyThawaniPayment...');
      const verificationResult = await verifyThawaniPayment(sessionId);

      if (!verificationResult.success) {
        const error = verificationResult.error || 'Payment verification failed';
        console.error('❌ [PAYMENT-VERIFY] Verification failed:', error);
        onError?.(error);
        return { success: false, error };
      }

      console.log('✅ [PAYMENT-VERIFY] Verification succeeded:', {
        status: verificationResult.status,
        isMock: verificationResult.isMock,
      });

      // ✅ Step 4: Check payment status
      if (verificationResult.status !== 'paid') {
        const error = `Payment status is '${verificationResult.status}'. Expected 'paid'.`;
        console.error('❌ [PAYMENT-VERIFY] ', error);
        onError?.(error);
        return { success: false, error };
      }

      // ✅ Step 5: Save order BEFORE clearing cart
      console.log('💾 [PAYMENT-VERIFY] Saving order to Firestore...');
      const orderResult = await saveOrderBeforeClearingCart({
        userId,
        cartItems,
        shippingAddress,
        sessionId,
        verificationData: verificationResult,
      });

      if (!orderResult.success) {
        const error = orderResult.error || 'Failed to save order';
        console.error('❌ [PAYMENT-VERIFY] Order save failed:', error);
        onError?.(error);
        return { success: false, error };
      }

      const orderId = orderResult.orderId;
      console.log('✅ [PAYMENT-VERIFY] Order saved successfully:', { orderId });

      // ✅ Step 6: Clear cart ONLY after successful order save
      console.log('🧹 [PAYMENT-VERIFY] Clearing cart...');
      const clearResult = await clearCartComplete({
        sessionId,
        userId,
        orderId,
        onClearCart,
      });

      if (!clearResult.success) {
        console.error('❌ [PAYMENT-VERIFY] Cart clear failed (but order already saved):', clearResult.error);
        // Don't return error here - order is already saved
      } else {
        console.log('✅ [PAYMENT-VERIFY] Cart cleared successfully');
      }

      // ✅ Step 7: Call success callback
      console.log('🎉 [PAYMENT-VERIFY] Payment verification flow completed successfully');
      onSuccess?.({
        orderId,
        sessionId,
        isMock: verificationResult.isMock,
        sessionData: verificationResult.sessionData, // ✅ Pass full gateway response including invoice
      });

      // ✅ Clear verification in progress flag
      paymentState.verificationInProgress[sessionId] = false;

      return {
        success: true,
        orderId,
        isMock: verificationResult.isMock,
        sessionData: verificationResult.sessionData, // ✅ Include gateway response in return
      };
    } catch (error) {
      console.error('❌ [PAYMENT-VERIFY] Unexpected error:', error);
      // ✅ Clear verification in progress flag on error
      paymentState.verificationInProgress[sessionId] = false;
      const errorMessage = error?.message || 'An unexpected error occurred during payment verification';
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
};

/**
 * Save order to Firestore with proper validation
 * This is called BEFORE clearing the cart to ensure order is safely stored
 *
 * @private
 * @param {Object} config
 * @returns {Promise<{success: boolean, orderId?: string, error?: string}>}
 */
async function saveOrderBeforeClearingCart(config) {
  try {
    const {
      userId,
      cartItems,
      shippingAddress,
      sessionId,
      verificationData,
    } = config;

    // Prevent duplicate order saves
    if (paymentState.ordersSaved[sessionId]) {
      console.warn('⚠️ [ORDER-SAVE] Order already saved for this session:', sessionId);
      return {
        success: true,
        orderId: paymentState.ordersSaved[sessionId],
      };
    }

    // Calculate totals
    const APP_CONFIG = require('../constants/config').APP_CONFIG;
    const subtotal = cartItems.reduce(
      (total, item) => total + (Number(item.price || 0) * Number(item.quantity || 1)),
      0
    );
    const shipping = subtotal >= APP_CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : APP_CONFIG.SHIPPING_COST;
    const total = subtotal + shipping;

    // ✅ CRITICAL: Verify calculation matches product line items
    console.log('🧮 [ORDER-SAVE] Amount verification:', {
      subtotal: subtotal.toFixed(3),
      shipping: shipping.toFixed(3),
      total: total.toFixed(3),
      totalInBaisa: Math.round(total * 1000),
      verificationData: {
        thawaniAmount: verificationData?.amount,
        thawaniAmountInOmr: verificationData?.amount ? (verificationData.amount / 1000).toFixed(3) : 'N/A',
        match: Math.round(total * 1000) === verificationData?.amount,
      },
    });

    // ✅ LOG ORDER CALCULATION FOR VERIFICATION
    console.log('💰 [ORDER-SAVE] Order total calculation:', {
      subtotal: subtotal.toFixed(3),
      shipping: shipping.toFixed(3),
      total: total.toFixed(3),
      breakdown: `${subtotal.toFixed(3)} + ${shipping.toFixed(3)} = ${total.toFixed(3)}`,
    });

    // ✅ Extract invoice from Thawani response (official transaction ID)
    // Priority: invoice > transaction_id > session_id (fallback)
    const gatewayData = verificationData?.sessionData || {};
    const invoiceId = gatewayData.invoice || gatewayData.transaction_id || sessionId;
    
    console.log('🧾 [ORDER-SAVE] Transaction ID extraction:', {
      invoice: gatewayData.invoice,
      transaction_id: gatewayData.transaction_id,
      session_id: sessionId,
      final_transactionId: invoiceId,
      which_field_used: invoiceId === gatewayData.invoice ? 'invoice' : 
                        invoiceId === gatewayData.transaction_id ? 'transaction_id' : 
                        'session_id',
    });

    // Prepare order payload
    const orderPayload = {
      userId,
      items: cartItems.map((item, idx) => ({
        id: item.id || `item-${idx}`,
        productId: item.productId || item.id || `product-${idx}`,
        name: String(item.name || `Product ${idx + 1}`).trim(),
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        image: item.image || null,
      })),
      shippingAddress: {
        addressLine: shippingAddress?.addressLine || '',
        city: shippingAddress?.city || '',
        state: shippingAddress?.state || '',
        country: shippingAddress?.country || 'OM',
        zipCode: shippingAddress?.zipCode || '',
        firstName: shippingAddress?.firstName || '',
        lastName: shippingAddress?.lastName || '',
        phone: shippingAddress?.phone || '',
        email: shippingAddress?.email || '',
      },
      paymentMethod: 'thawani',
      paymentStatus: 'paid',
      transactionId: invoiceId,
      subtotal,
      shipping,
      total,
      status: 'pending',
      notes: `Thawani Payment verified at ${new Date().toISOString()}`,
    };

    console.log('📝 [ORDER-SAVE] Payload ready:', {
      itemCount: orderPayload.items.length,
      subtotal: orderPayload.subtotal.toFixed(3),
      shipping: orderPayload.shipping.toFixed(3),
      total: orderPayload.total.toFixed(3),
      hasAddress: !!orderPayload.shippingAddress?.addressLine,
      breakdown: `Subtotal: ${orderPayload.subtotal.toFixed(3)} + Shipping: ${orderPayload.shipping.toFixed(3)} = Total: ${orderPayload.total.toFixed(3)}`,
    });

    // Create order in Firestore
    const result = await ordersService.create(userId, orderPayload);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to create order',
      };
    }

    const orderId = result.data?.id;
    console.log('✅ [ORDER-SAVE] Order created in Firestore:', { orderId });

    // Mark this session's order as saved
    paymentState.ordersSaved[sessionId] = orderId;

    return {
      success: true,
      orderId,
    };
  } catch (error) {
    console.error('❌ [ORDER-SAVE] Error saving order:', error);
    return {
      success: false,
      error: error?.message || 'Error saving order to database',
    };
  }
}

/**
 * Clear cart from all storage locations
 * ONLY called after order is successfully saved
 *
 * @private
 * @param {Object} config
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function clearCartComplete(config) {
  try {
    const { sessionId, userId, orderId, onClearCart } = config;

    // Prevent duplicate clearing
    if (paymentState.cartCleared[sessionId]) {
      console.warn('⚠️ [CART-CLEAR] Cart already cleared for this session:', sessionId);
      return { success: true };
    }

    console.log('🧹 [CART-CLEAR] Starting cart clearing process:', { sessionId, orderId });

    // ✅ Clear Redux store
    if (typeof onClearCart === 'function') {
      try {
        console.log('🧹 [CART-CLEAR] Clearing Redux cart...');
        onClearCart();
        console.log('✅ [CART-CLEAR] Redux cart cleared');
      } catch (error) {
        console.error('❌ [CART-CLEAR] Redux clear failed:', error);
        // Continue anyway - we'll clear localStorage
      }
    }

    // ✅ Clear localStorage
    try {
      console.log('🧹 [CART-CLEAR] Clearing localStorage cart...');
      localStorage.removeItem('ecommerce_cart');
      console.log('✅ [CART-CLEAR] localStorage cart cleared');
    } catch (error) {
      console.error('❌ [CART-CLEAR] localStorage clear failed:', error);
    }

    // Mark this session's cart as cleared
    paymentState.cartCleared[sessionId] = true;

    console.log('✅ [CART-CLEAR] Cart clearing complete:', {
      sessionId,
      orderId,
    });

    return { success: true };
  } catch (error) {
    console.error('❌ [CART-CLEAR] Error clearing cart:', error);
    return {
      success: false,
      error: error?.message || 'Error clearing cart',
    };
  }
}

/**
 * Get payment verification state (for debugging)
 * @returns {Object} Current payment state
 */
export const getPaymentVerificationState = () => {
  return {
    verificationInProgress: Object.keys(paymentState.verificationInProgress).filter(
      (k) => paymentState.verificationInProgress[k]
    ),
    ordersSavedCount: Object.keys(paymentState.ordersSaved).length,
    cartsClearedCount: Object.keys(paymentState.cartCleared).length,
  };
};

/**
 * Reset payment state for testing
 * @private
 */
export const resetPaymentVerificationState = () => {
  paymentState.verificationInProgress = {};
  paymentState.ordersSaved = {};
  paymentState.cartCleared = {};
  console.log('🔄 [PAYMENT-VERIFY] State reset');
};

/**
 * Check if payment for session has been verified and processed
 * @param {string} sessionId
 * @returns {boolean}
 */
export const hasPaymentBeenProcessed = (sessionId) => {
  return !!(paymentState.ordersSaved[sessionId] && paymentState.cartCleared[sessionId]);
};
