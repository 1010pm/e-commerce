/**
 * Thawani Payment Service
 * Handles secure payment processing through Thawani gateway
 * All API calls go through Firebase Cloud Functions backend
 * Supports mock mode for testing without real API credentials
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

const THAWANI_CHECKOUT_URL = process.env.REACT_APP_THAWANI_CHECKOUT_URL || 'https://uatcheckout.thawani.om/pay';
const MOCK_MODE = process.env.REACT_APP_THAWANI_MOCK_MODE === 'true';

// ============================================
// MOCK DATA FOR TESTING
// ============================================

const generateMockSessionId = () => {
  return `mock_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const mockCreateSession = (config) => {
  const mockSessionId = generateMockSessionId();
  const mockCheckoutUrl = `${THAWANI_CHECKOUT_URL}/${mockSessionId}`;
  
  return {
    success: true,
    sessionId: mockSessionId,
    sessionUrl: mockCheckoutUrl,
    isMock: true,
  };
};

const mockVerifyPayment = (sessionId) => {
  // Auto-approve all mock payments
  return {
    success: true,
    status: 'paid',
    isMock: true,
    sessionData: {
      sessionId,
      status: 'paid',
      amount: 50000, // test amount in baisa
      currency: 'OMR',
      transactionId: `mock_tx_${Date.now()}`,
    },
  };
};

// ============================================
// REAL API CALLS (when not in mock mode)
// ============================================

/**
 * Create a Thawani payment session
 * Backend-only: Session is created securely on the server
 *
 * @param {Object} config
 * @param {number} config.amount - Amount in baisa (1000 baisa = 1 OMR)
 * @param {string} config.currency - Currency (must be 'OMR')
 * @param {Object} config.customer - Customer information
 * @param {string} config.customer.name - Customer name
 * @param {string} config.customer.email - Customer email
 * @param {string} config.customer.phone - Customer phone
 * @param {Array} config.items - Order items
 * @param {string} config.orderId - Optional order ID for reference
 * @returns {Promise<{success: boolean, sessionUrl?: string, sessionId?: string, error?: string}>}
 */
export const createThawaniSession = async (config) => {
  try {
    const {
      amount,
      currency = 'OMR',
      customer,
      items = [],
      orderId,
    } = config;

    console.log('🧹 [THAWANI-SERVICE] Cleaning input data:', {
      amountType: typeof amount,
      amountValue: amount,
      amountIsNaN: isNaN(amount),
      amountIsInteger: Number.isInteger(amount),
      customerType: typeof customer,
      itemsLength: items.length,
    });

    // 🔥 CRITICAL: Validate amount BEFORE sending
    // Amount MUST be an integer (already in baisa)
    if (amount === undefined || amount === null) {
      throw new Error('Amount is required');
    }

    if (typeof amount !== 'number') {
      throw new Error(`Amount must be a number, received: ${typeof amount}`);
    }

    if (isNaN(amount)) {
      throw new Error('Amount is NaN - check your calculation (Math.round(total * 1000))');
    }

    if (!Number.isFinite(amount)) {
      throw new Error(`Amount must be finite, received: ${amount}`);
    }

    if (!Number.isInteger(amount)) {
      throw new Error(
        `Amount must be an integer in baisa. Received: ${amount}. ` +
        `Fix: Use Math.round(total_OMR * 1000) to convert from OMR to baisa`
      );
    }

    if (amount < 100) {
      throw new Error(`Amount must be >= 100 baisa (0.1 OMR), received: ${amount}`);
    }

    console.log('✅ [THAWANI-SERVICE] Amount validation passed:', {
      amount,
      amountInOMR: (amount / 1000).toFixed(3),
    });

    // Validate required fields
    if (!customer || !customer.email || !customer.phone || !customer.name) {
      throw new Error('Customer name, email, and phone are required');
    }

    // 🎭 Use mock mode if enabled
    if (MOCK_MODE) {
      return mockCreateSession(config);
    }

    // ⚠️ CLEAN ITEMS DATA BEFORE SENDING
    // Ensure items are plain objects without Firestore types
    const cleanItems = items.map((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Item ${index + 1}: must be an object, received: ${typeof item}`);
      }

      // Convert name to string and validate
      const name = String(item.name || `Product ${index + 1}`).trim();
      if (name === '') {
        throw new Error(`Item ${index + 1}: name cannot be empty`);
      }

      // Convert quantity to integer
      const quantityNum = Number(item.quantity);
      if (isNaN(quantityNum)) {
        throw new Error(`Item ${index + 1} "${name}": quantity must be a number, received: ${item.quantity}`);
      }
      const quantity = Math.floor(quantityNum);
      if (quantity < 1) {
        throw new Error(`Item ${index + 1} "${name}": quantity must be >= 1, received: ${item.quantity}`);
      }

      // Convert price to number
      const priceNum = Number(item.price);
      if (isNaN(priceNum)) {
        throw new Error(`Item ${index + 1} "${name}": price must be a number, received: ${item.price}`);
      }
      if (priceNum <= 0) {
        throw new Error(`Item ${index + 1} "${name}": price must be > 0, received: ${item.price}`);
      }

      const cleanItem = {
        name,
        quantity,
        price: parseFloat(priceNum.toFixed(3)), // Keep to 3 decimals for OMR precision
      };

      console.log(`✅ [THAWANI-SERVICE] Item ${index + 1} cleaned:`, cleanItem);
      return cleanItem;
    });

    // Validate customer data is clean primitives
    const cleanCustomer = {
      name: String(customer.name || '').trim(),
      email: String(customer.email || '').trim().toLowerCase(),
      phone: String(customer.phone || '').trim(),
    };

    if (!cleanCustomer.name) {
      throw new Error('Customer name is required');
    }

    if (!cleanCustomer.email) {
      throw new Error('Customer email is required');
    }

    if (!cleanCustomer.phone) {
      throw new Error('Customer phone is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanCustomer.email)) {
      throw new Error(`Invalid email format: ${cleanCustomer.email}`);
    }

    console.log('✅ [THAWANI-SERVICE] Customer data validated:', cleanCustomer);

    // Call backend function to create session
    const functions = getFunctions();
    const createSessionFn = httpsCallable(functions, 'createThawaniSession');

    console.log('📤 [THAWANI-SERVICE] Sending to Cloud Function:', {
      amount,
      currency,
      itemsCount: cleanItems.length,
      customerName: cleanCustomer.name,
      customerEmail: cleanCustomer.email,
    });

    const result = await createSessionFn({
      amount: Math.round(amount), // Ensure integer
      currency,
      customer: cleanCustomer,
      items: cleanItems,
      orderId,
    });

    // Validate response exists
    if (!result.data) {
      console.error('❌ [THAWANI-SERVICE] No result.data in response');
      throw new Error('Cloud Function returned no data');
    }

    // Check for explicit error response
    if (result.data.success === false) {
      const errorMessage = result.data.error || 'Unknown error from payment gateway';
      console.error('❌ [THAWANI-SERVICE] Cloud Function returned error:', {
        error: errorMessage,
        code: result.data.code,
        fullResponse: result.data,
      });
      throw new Error(errorMessage);
    }

    // Validate sessionId exists and is a string
    const { sessionId, sessionUrl } = result.data;
    
    if (!sessionId) {
      console.error('❌ [THAWANI-SERVICE] No sessionId in response:', {
        resultData: result.data,
        resultKeys: Object.keys(result.data),
      });
      throw new Error('Payment gateway did not return a session ID');
    }

    if (typeof sessionId !== 'string') {
      console.error('❌ [THAWANI-SERVICE] sessionId is not a string:', {
        sessionIdType: typeof sessionId,
        sessionIdValue: sessionId,
      });
      throw new Error(`Invalid session ID format: expected string, got ${typeof sessionId}`);
    }

    // Validate sessionId is not empty or whitespace
    const trimmedSessionId = sessionId.trim();
    if (trimmedSessionId === '') {
      console.error('❌ [THAWANI-SERVICE] sessionId is empty string');
      throw new Error('Session ID cannot be empty');
    }

    // Validate sessionId has reasonable length
    if (trimmedSessionId.length < 5) {
      console.error('❌ [THAWANI-SERVICE] sessionId is too short:', {
        length: trimmedSessionId.length,
        value: trimmedSessionId,
      });
      throw new Error('Session ID format appears invalid');
    }

    console.log('✅ [THAWANI-SERVICE] Session created successfully:', {
      sessionId: trimmedSessionId,
      sessionIdLength: trimmedSessionId.length,
      hasSessionUrl: !!sessionUrl,
    });

    return {
      success: true,
      sessionId: trimmedSessionId,
      sessionUrl: sessionUrl || `https://uatcheckout.thawani.om/pay/${trimmedSessionId}`,
    };
  } catch (error) {
    console.error('❌ [THAWANI-SERVICE] Error creating session:', error);

    // Detect specific error types for better UX
    let userFriendlyMessage = 'Failed to create payment session';

    // Check for service unavailability (503 or general 'unavailable' code)
    if (error.code === 'unavailable' || error.message?.includes('temporarily unavailable')) {
      userFriendlyMessage = 'Payment gateway is temporarily unavailable. Please try again in a few moments.';
      console.error('🔴 [THAWANI-SERVICE] Service unavailable detected');
    }
    // Check for timeout
    else if (error.code === 'deadline-exceeded' || error.message?.includes('timed out')) {
      userFriendlyMessage = 'Payment gateway is not responding. Please check your connection and try again.';
      console.error('⏱️  [THAWANI-SERVICE] Timeout detected');
    }
    // Check for network errors
    else if (error.message?.includes('Cannot reach') || error.message?.includes('unreachable')) {
      userFriendlyMessage = 'Cannot connect to payment gateway. Please check your internet connection.';
      console.error('🌐 [THAWANI-SERVICE] Network error detected');
    }
    // Check for invalid configuration
    else if (error.code === 'permission-denied' || error.message?.includes('API key')) {
      userFriendlyMessage = 'Payment system configuration error. Please contact support.';
      console.error('🔐 [THAWANI-SERVICE] Auth/config error detected');
    }
    // Check for invalid request
    else if (error.code === 'invalid-argument' || error.message?.includes('Invalid')) {
      userFriendlyMessage = 'Invalid payment request. Please verify your order details.';
      console.error('📋 [THAWANI-SERVICE] Invalid request detected');
    }

    return {
      success: false,
      error: userFriendlyMessage,
      originalError: error.message, // For debugging
      code: error.code,
    };
  }
};

/**
 * Redirect to Thawani checkout page
 * Called after successful session creation
 * Uses the sessionUrl returned from backend (already includes publishable key)
 *
 * @param {string} sessionUrl - Full checkout URL from createThawaniSession (includes ?key parameter)
 * @throws Error if sessionUrl is invalid
 */
export const redirectToThawaniCheckout = (sessionUrl) => {
  console.log('🔗 [REDIRECT] Initiating redirect to Thawani checkout');

  // Validate sessionUrl exists
  if (!sessionUrl) {
    const errorMsg = 'Session URL is required but got: ' +
      `value=${sessionUrl}, type=${typeof sessionUrl}`;
    console.error('❌ [REDIRECT] ' + errorMsg);
    throw new Error('Payment session URL is invalid. Please try again.');
  }

  // Validate it's a string
  if (typeof sessionUrl !== 'string') {
    const errorMsg = `Expected string, got ${typeof sessionUrl}`;
    console.error('❌ [REDIRECT] Session URL type invalid:', errorMsg);
    throw new Error(`Invalid session URL format: ${errorMsg}`);
  }

  // Validate it's not empty or whitespace
  const trimmedUrl = sessionUrl.trim();
  if (trimmedUrl === '') {
    console.error('❌ [REDIRECT] Session URL is empty string');
    throw new Error('Session URL cannot be empty');
  }

  // Validate it's a proper URL
  try {
    new URL(trimmedUrl);
  } catch (e) {
    console.error('❌ [REDIRECT] Session URL is not a valid URL:', {
      value: trimmedUrl,
      error: e.message,
    });
    throw new Error('Session URL format is invalid');
  }

  // Validate it contains the required domain
  if (!trimmedUrl.includes('uatcheckout.thawani.om')) {
    console.error('❌ [REDIRECT] Session URL does not contain expected Thawani domain:', {
      value: trimmedUrl,
      expectedDomain: 'uatcheckout.thawani.om',
    });
    throw new Error('Session URL is not from authorized payment gateway');
  }

  // Validate it contains the key parameter
  if (!trimmedUrl.includes('key=')) {
    console.error('❌ [REDIRECT] Session URL missing required key parameter:', {
      value: trimmedUrl,
    });
    throw new Error('Session URL missing required authentication key');
  }

  console.log('✅ [REDIRECT] Valid session URL, redirecting to:', {
    url: trimmedUrl.substring(0, 50) + '...',
    timestamp: new Date().toISOString(),
  });

  // Redirect to Thawani checkout
  window.location.href = trimmedUrl;
};

/**
 * Verify payment status after user returns from Thawani
 * Called on success page to confirm payment
 * Handles network errors and 503 responses gracefully
 *
 * @param {string} sessionId - Session ID returned from Thawani
 * @returns {Promise<{success: boolean, status: 'paid'|'pending'|'failed', sessionData?: object, error?: string}>}
 */
export const verifyThawaniPayment = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required for payment verification');
    }

    console.log('🔍 [VERIFY] Verifying payment for session:', sessionId.substring(0, 10) + '...');

    // 🎭 Use mock mode if enabled
    if (MOCK_MODE) {
      console.log('🎭 [VERIFY] Mock mode - simulating payment verification');
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockVerifyPayment(sessionId);
    }

    const functions = getFunctions();
    const verifyPaymentFn = httpsCallable(functions, 'verifyThawaniPayment');

    const result = await verifyPaymentFn({ sessionId });

    if (!result.data) {
      console.error('❌ [VERIFY] No response data from payment verification');
      throw new Error('Payment verification returned no data');
    }

    if (!result.data.success) {
      const errorMsg = result.data.error || 'Unknown verification error';
      console.error('❌ [VERIFY] Payment verification failed:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('✅ [VERIFY] Payment verified successfully:', {
      status: result.data.status,
      hasSessionData: !!result.data.sessionData,
    });

    return {
      success: true,
      status: result.data.status,
      sessionData: result.data.sessionData,
    };
  } catch (error) {
    console.error('❌ [VERIFY] Error verifying payment:', {
      message: error.message,
      code: error.code,
      type: error.constructor.name,
    });

    // Handle specific error scenarios with detailed error codes
    let userMessage = 'Failed to verify payment';
    
    if (error.code === 'unavailable' || error.message?.includes('temporarily unavailable')) {
      userMessage = 'Payment gateway is temporarily unavailable. Please try again in a moment.';
      console.error('🔴 [VERIFY] Service unavailable');
    } else if (error.code === 'deadline-exceeded' || error.message?.includes('timed out')) {
      userMessage = 'Verification request timed out. Your payment may still be processing.';
      console.error('⏱️  [VERIFY] Request timeout');
    } else if (error.message?.includes('network') || error.message?.includes('unreachable') || error.message?.includes('reach')) {
      userMessage = 'Network error during verification. Please check your connection.';
      console.error('🌐 [VERIFY] Network error');
    } else if (error.message?.includes('503')) {
      userMessage = 'Payment service temporarily unavailable. Please try again soon.';
      console.error('🔴 [VERIFY] 503 Service Unavailable');
    } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ENOTFOUND')) {
      userMessage = 'Cannot reach payment verification service. Please check your internet connection.';
      console.error('🌐 [VERIFY] Connection refused/DNS error');
    }

    return {
      success: false,
      error: userMessage,
      status: 'unknown',
      originalError: error.message,
      code: error.code,
    };
  }
};

/**
 * Enhanced: Verify Thawani Payment with Fallback Search
 * Tries to verify by sessionId first, then searches by client_reference_id
 * Useful when sessionId is lost or unavailable
 *
 * @param {string} sessionId - Session ID returned from Thawani (can be null)
 * @param {string} clientReferenceId - Client reference ID (optional fallback)
 * @returns {Promise<{success: boolean, status: 'paid'|'pending'|'failed', sessionData?: object, foundBy?: string, error?: string}>}
 */
export const verifyThawaniPaymentWithFallback = async (sessionId, clientReferenceId) => {
  try {
    console.log('🔍 [VERIFY-ENHANCED] Starting payment verification:', {
      hasSessionId: !!sessionId,
      hasClientRefId: !!clientReferenceId,
    });

    // First, try to verify by sessionId
    if (sessionId) {
      console.log('🔍 [VERIFY-ENHANCED] Attempting verification by sessionId');
      const result = await verifyThawaniPayment(sessionId);
      
      if (result.success) {
        console.log('✅ [VERIFY-ENHANCED] Payment verified by sessionId');
        return {
          ...result,
          foundBy: 'sessionId',
        };
      }
      
      console.warn('⚠️ [VERIFY-ENHANCED] SessionId verification failed, attempting fallback');
    }

    // Fallback: Search by client_reference_id
    if (clientReferenceId) {
      console.log('🔍 [VERIFY-ENHANCED] Fallback: Searching by clientReferenceId');
      const intentResult = await findPaymentIntentByClientRef(clientReferenceId);
      
      if (intentResult.success && intentResult.intent) {
        const intent = intentResult.intent;
        const status = intent.status === 'succeeded' ? 'paid' : 
                      intent.status === 'requires_action' ? 'pending' : 
                      'failed';
        
        console.log('✅ [VERIFY-ENHANCED] Payment found by clientReferenceId:', {
          status,
          intentId: intent.id,
        });
        
        return {
          success: true,
          status,
          sessionData: intent,
          foundBy: 'clientReferenceId',
        };
      }
    }

    // Neither method worked
    console.error('❌ [VERIFY-ENHANCED] Could not verify payment by any method');
    return {
      success: false,
      error: 'Could not verify payment. Please check your order status or contact support.',
      status: 'unknown',
      foundBy: 'none',
    };
  } catch (error) {
    console.error('❌ [VERIFY-ENHANCED] Error in verify with fallback:', error);
    return {
      success: false,
      error: 'Payment verification failed. Please try again.',
      status: 'unknown',
      originalError: error.message,
    };
  }
};

/**
 * Get payment session details
 * Useful for retrieving session information on cancel/error pages
 *
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Session details
 */
export const getPaymentSessionDetails = async (sessionId) => {
  try {
    const functions = getFunctions();
    const getSessionFn = httpsCallable(functions, 'verifyThawaniPayment');

    const result = await getSessionFn({ sessionId });

    return result.data;
  } catch (error) {
    console.error('Error getting session details:', error);
    throw error;
  }
};

/**
 * List Thawani Payment Intents
 * Retrieve payment intents from Thawani, useful for searching by client_reference_id
 *
 * @param {Object} options
 * @param {number} options.limit - Number of intents to retrieve (default: 10, max: 100)
 * @param {number} options.skip - Number of intents to skip (default: 0)
 * @param {string} options.clientReferenceId - Optional client reference ID to filter
 * @returns {Promise<{success: boolean, intents?: array, total?: number, error?: string}>}
 */
export const listPaymentIntents = async (options = {}) => {
  try {
    const {
      limit = 10,
      skip = 0,
      clientReferenceId,
    } = options;

    console.log('🔍 [THAWANI-SERVICE] Listing payment intents:', {
      limit,
      skip,
      filterByClientRefId: !!clientReferenceId,
    });

    if (MOCK_MODE) {
      console.log('🎭 [THAWANI-SERVICE] Mock mode - simulating payment intents');
      return {
        success: true,
        intents: [{
          id: 'mock_intent_123',
          client_reference_id: clientReferenceId || 'mock_ref_id',
          amount: 50000,
          currency: 'OMR',
          status: 'succeeded',
          created_at: new Date().toISOString(),
        }],
        total: 1,
        isMock: true,
      };
    }

    const functions = getFunctions();
    const listIntentsFn = httpsCallable(functions, 'listThawaniPaymentIntents');

    const result = await listIntentsFn({
      limit: Math.min(Math.max(1, limit), 100), // Ensure between 1-100
      skip: Math.max(0, skip),
      clientReferenceId,
    });

    if (!result.data) {
      console.error('❌ [THAWANI-SERVICE] No result.data in response');
      throw new Error('Cloud Function returned no data');
    }

    if (result.data.success === false) {
      const errorMessage = result.data.error || 'Failed to list payment intents';
      console.error('❌ [THAWANI-SERVICE] Error from Cloud Function:', errorMessage);
      throw new Error(errorMessage);
    }

    const { intents = [], total = 0 } = result.data;

    console.log('✅ [THAWANI-SERVICE] Payment intents retrieved:', {
      count: intents.length,
      total,
      success: true,
    });

    return {
      success: true,
      intents,
      total,
    };
  } catch (error) {
    console.error('❌ [THAWANI-SERVICE] Error listing payment intents:', error);

    let userFriendlyMessage = 'Failed to retrieve payment intents';

    if (error.code === 'unavailable' || error.message?.includes('temporarily unavailable')) {
      userFriendlyMessage = 'Payment gateway is temporarily unavailable.';
    } else if (error.code === 'deadline-exceeded' || error.message?.includes('timed out')) {
      userFriendlyMessage = 'Request timed out while retrieving payment intents.';
    } else if (error.message?.includes('network') || error.message?.includes('unreachable')) {
      userFriendlyMessage = 'Network error while retrieving payment intents.';
    }

    return {
      success: false,
      error: userFriendlyMessage,
      originalError: error.message,
      code: error.code,
    };
  }
};

/**
 * Search for Payment Intent by Client Reference ID
 * More targeted than listPaymentIntents for finding a specific payment
 *
 * @param {string} clientReferenceId - Client reference ID to search for
 * @returns {Promise<{success: boolean, intent?: object, error?: string}>}
 */
export const findPaymentIntentByClientRef = async (clientReferenceId) => {
  try {
    if (!clientReferenceId || typeof clientReferenceId !== 'string') {
      throw new Error('Client reference ID must be a non-empty string');
    }

    console.log('🔍 [THAWANI-SERVICE] Searching for payment intent:', {
      clientReferenceId: clientReferenceId.substring(0, 20) + '...',
    });

    const result = await listPaymentIntents({
      limit: 50,
      skip: 0,
      clientReferenceId,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    const intents = result.intents || [];
    if (intents.length === 0) {
      console.warn('⚠️ [THAWANI-SERVICE] No payment intent found matching:', clientReferenceId);
      return {
        success: false,
        error: 'Payment intent not found',
      };
    }

    // Return the most recent intent
    const intent = intents.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )[0];

    console.log('✅ [THAWANI-SERVICE] Payment intent found:', {
      id: intent.id,
      status: intent.status,
      amount: intent.amount,
    });

    return {
      success: true,
      intent,
    };
  } catch (error) {
    console.error('❌ [THAWANI-SERVICE] Error finding payment intent:', error);
    return {
      success: false,
      error: error.message || 'Failed to find payment intent',
      originalError: error.message,
    };
  }
};

/**
 * Extract session ID from URL parameters
 * Called on success/cancel pages
 *
 * @returns {string|null} Session ID if present
 */
export const getSessionIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('sessionId');
};

/**
 * Clear payment session (optional cleanup)
 * Removes temporary payment data from session storage
 */
export const clearPaymentSession = () => {
  try {
    sessionStorage.removeItem('thawani_session_id');
    sessionStorage.removeItem('thawani_amount');
    sessionStorage.removeItem('thawani_customer');
  } catch (error) {
    console.error('Error clearing payment session:', error);
  }
};

/**
 * Store payment session temporarily
 * Useful when redirecting to Thawani
 *
 * @param {string} sessionId - Session ID
 * @param {Object} sessionData - Additional session data
 */
export const storePaymentSession = (sessionId, sessionData = {}) => {
  try {
    sessionStorage.setItem('thawani_session_id', sessionId);
    sessionStorage.setItem('thawani_session_data', JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error storing payment session:', error);
  }
};

/**
 * Retrieve stored payment session
 *
 * @returns {Object} Stored session data
 */
export const retrievePaymentSession = () => {
  try {
    const sessionId = sessionStorage.getItem('thawani_session_id');
    const sessionDataStr = sessionStorage.getItem('thawani_session_data');
    const sessionData = sessionDataStr ? JSON.parse(sessionDataStr) : {};

    return { sessionId, ...sessionData };
  } catch (error) {
    console.error('Error retrieving payment session:', error);
    return {};
  }
};
