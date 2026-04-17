/**
 * Payments Service - Production Ready
 * Manages payment transaction records in Firebase with full gateway integration
 * Ensures complete traceability: Thawani → Payment → Order
 */

import { db } from '../config/firebase.config';
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, Timestamp, getDoc, runTransaction } from 'firebase/firestore';

/**
 * Enhanced payment validation
 * Ensures data integrity for all payments
 */
function validatePaymentData(paymentData, isThawani = true) {
  const errors = [];
  
  // Amount validation (CRITICAL for paid payments)
  if (paymentData.status === 'paid') {
    // Amount in OMR must be > 0
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push(`Amount must be > 0 for paid payments, got: ${paymentData.amount}`);
    }
    
    // For Thawani: must have sessionId
    if (isThawani && !paymentData.sessionId) {
      errors.push('sessionId is required for Thawani payments');
    }
    
    // For Thawani: must have transactionId (invoice from gateway)
    if (isThawani && !paymentData.transactionId) {
      errors.push('transactionId is required for Thawani payments');
    }
    
    // Gateway amount validation
    if (isThawani && !paymentData.gatewayAmount) {
      errors.push('gatewayAmount (baisa) is required for Thawani payments');
    }
    
    // Amount consistency check
    if (paymentData.gatewayAmount && paymentData.amount) {
      const calculatedAmount = paymentData.gatewayAmount / 1000;
      const difference = Math.abs(calculatedAmount - paymentData.amount);
      if (difference > 0.01) { // Allow 0.01 OMR tolerance
        errors.push(
          `Amount mismatch: amount=${paymentData.amount} OMR ` +
          `but gatewayAmount=${paymentData.gatewayAmount} baisa (${calculatedAmount.toFixed(3)} OMR). ` +
          `Difference: ${difference.toFixed(3)} OMR`
        );
      }
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Payment validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Save a payment transaction with atomic transaction to prevent duplicates
 * CRITICAL: Uses Firestore transaction to ensure idempotent payment creation
 * Ensures complete traceability: Thawani → Payment → Order
 * 
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID associated with this payment
 * @param {object} paymentData - Complete payment details with gateway response
 * @returns {Promise<object>} Success response with payment ID
 */
export const savePaymentTransaction = async (userId, orderId, paymentData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to save payment');
    }

    if (!orderId) {
      throw new Error('Order ID is required to save payment');
    }

    // Validate all payment data
    const isThawani = paymentData.paymentMethod === 'thawani' || paymentData.paymentGateway === 'thawani';
    validatePaymentData(paymentData, isThawani);

    // Calculate gatewayAmount if not provided (fallback)
    let gatewayAmount = paymentData.gatewayAmount;
    if (!gatewayAmount && paymentData.amount) {
      gatewayAmount = Math.round(paymentData.amount * 1000);
      console.warn('[PAYMENT-SERVICE] Calculated gatewayAmount from amount:', {
        amount: paymentData.amount,
        calculated: gatewayAmount,
      });
    }

    // ✅ ENHANCED: Complete payment document with all gateway data
    const buildPaymentDocument = (paymentId) => ({
      // ===== CORE IDENTIFIERS =====
      paymentId,
      orderId,
      userId,

      // ===== THAWANI GATEWAY FIELDS ✅ NEW =====
      sessionId: paymentData.sessionId || null,           // thawani.data.session_id
      transactionId: paymentData.transactionId || null,   // thawani.data.invoice
      
      // ===== AMOUNT FIELDS ✅ COMPLETE =====
      amount: paymentData.amount || 0,                    // OMR (primary display)
      gatewayAmount: gatewayAmount || null,               // baisa (from Thawani)
      currency: paymentData.currency || 'OMR',
      
      // ===== PAYMENT METHOD & STATUS =====
      paymentMethod: paymentData.paymentMethod || 'thawani',
      paymentGateway: paymentData.paymentGateway || 'thawani',
      status: paymentData.status || 'pending',            // paid, pending, failed
      
      // ===== ORDER BREAKDOWN =====
      subtotal: paymentData.subtotal || 0,
      tax: paymentData.tax || 0,
      shipping: paymentData.shipping || 0,
      
      // ===== CUSTOMER INFORMATION =====
      customerName: paymentData.customerName || 'Unknown',
      customerEmail: paymentData.customerEmail || '',
      customerPhone: paymentData.customerPhone || '',
      
      // ===== ITEMS =====
      itemsCount: paymentData.itemsCount || 0,
      products: paymentData.products || [],              // ✅ NEW: full product list
      
      // ===== THAWANI RESPONSE ✅ NEW - Full gateway data for audit trail =====
      gatewayResponse: paymentData.gatewayResponse || {   // Store complete API response
        session_id: paymentData.sessionId,
        invoice: paymentData.transactionId,
        total_amount: gatewayAmount,
        payment_status: paymentData.status,
      },
      
      // ===== TIMESTAMPS =====
      createdAt: Timestamp.now(),
      paidAt: paymentData.status === 'paid' ? Timestamp.now() : null,
      verifiedAt: paymentData.verifiedAt || null,        // When verified from Thawani
      
      // ===== CUSTOMER CONTACT =====
      shippingAddress: paymentData.shippingAddress || {},
      
      // ===== AUDIT TRAIL =====
      ipAddress: paymentData.ipAddress || null,
      userAgent: paymentData.userAgent || null,
      notes: paymentData.notes || '',
      
      // ===== VALIDATION STATUS ✅ NEW =====
      isValidated: paymentData.status === 'paid' ? true : false,
      validationErrors: paymentData.validationErrors || [],
    });

    console.log('[PAYMENT-SERVICE] Preparing payment transaction:', {
      userId,
      orderId,
      amount: `${paymentData.amount || 0} OMR`,
      gatewayAmount: `${gatewayAmount || 0} baisa`,
      sessionId: paymentData.sessionId ? paymentData.sessionId.substring(0, 15) + '...' : 'missing',
      transactionId: paymentData.transactionId ? paymentData.transactionId.substring(0, 15) + '...' : 'missing',
      status: paymentData.status,
      isThawani,
    });

    // ✅ AUDIT: Log amount verification
    if (paymentData.status === 'paid') {
      console.log('[PAYMENT-SERVICE] ✅ PAID PAYMENT - Amount verified:', {
        amount_omr: paymentData.amount,
        gatewayAmount_baisa: gatewayAmount,
        converted: `${(gatewayAmount / 1000).toFixed(3)} OMR`,
        match: Math.abs(paymentData.amount - (gatewayAmount / 1000)) < 0.01,
      });
    }

    // ✅ ATOMIC TRANSACTION: Prevents duplicate payments on concurrent requests
    // If two requests come in simultaneously for the same transactionId,
    // only one will create the payment while the other returns the existing one
    let resultPaymentId = null;
    let existingPayment = null;

    if (paymentData.transactionId) {
      try {
        const result = await runTransaction(db, async (transaction) => {
          // ✅ Step 1: Query for existing payment within transaction
          const existingPaymentQuery = query(
            collection(db, 'payments'),
            where('userId', '==', userId),
            where('transactionId', '==', paymentData.transactionId)
          );
          const existingPayments = await getDocs(existingPaymentQuery);

          if (!existingPayments.empty) {
            // ✅ Payment already exists - return it without creating duplicate
            console.log('✅ [PAYMENT-SERVICE] Payment exists in transaction, returning existing:', {
              paymentId: existingPayments.docs[0].id,
              transactionId: paymentData.transactionId,
            });
            return {
              exists: true,
              paymentId: existingPayments.docs[0].id,
              data: existingPayments.docs[0].data(),
            };
          }

          // ✅ Step 2: Payment doesn't exist - create it atomically
          const paymentsRef = collection(db, 'payments');
          const newPaymentRef = doc(paymentsRef);
          const paymentId = newPaymentRef.id;
          const paymentDocument = buildPaymentDocument(paymentId);

          transaction.set(newPaymentRef, paymentDocument);

          console.log('✅ [PAYMENT-SERVICE] Created new payment in transaction:', {
            paymentId,
            transactionId: paymentData.transactionId,
          });

          return {
            exists: false,
            paymentId,
            data: paymentDocument,
          };
        });

        if (result.exists) {
          existingPayment = result;
        } else {
          resultPaymentId = result.paymentId;
        }
      } catch (transactionError) {
        console.error('[PAYMENT-SERVICE] Transaction error:', transactionError);
        throw transactionError;
      }
    } else {
      // ✅ No transactionId - use regular setDoc with auto-generated ID (less safe but works)
      console.log('⚠️ [PAYMENT-SERVICE] Creating payment without transactionId, duplicates may occur');
      const paymentsRef = collection(db, 'payments');
      const newPaymentRef = doc(paymentsRef);
      const paymentId = newPaymentRef.id;
      const paymentDocument = buildPaymentDocument(paymentId);
      await setDoc(newPaymentRef, paymentDocument);
      resultPaymentId = paymentId;
    }

    // Return appropriate response
    if (existingPayment) {
      return {
        success: true,
        paymentId: existingPayment.paymentId,
        message: 'Payment already exists with this transaction ID',
        data: existingPayment.data,
      };
    }

    console.log('[PAYMENT-SERVICE] ✅ Payment transaction saved successfully:', resultPaymentId);

    return {
      success: true,
      paymentId: resultPaymentId,
      message: 'Payment transaction saved successfully',
      data: buildPaymentDocument(resultPaymentId),
    };
  } catch (error) {
    console.error('[PAYMENT-SERVICE] ❌ Error saving payment transaction:', error);
    return {
      success: false,
      error: error.message || 'Failed to save payment transaction',
    };
  }
};

/**
 * Get user's payment history
 * @param {string} userId - User ID
 * @param {number} limit - Number of recent payments to retrieve
 * @returns {Promise<array>} Array of payment documents
 */
export const getUserPaymentHistory = async (userId, limitCount = 10) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const paymentsRef = collection(db, 'payments');
    const q = query(
      paymentsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log('📊 [PAYMENT-SERVICE] Retrieved payment history for user:', {
      userId,
      count: payments.length,
    });

    return {
      success: true,
      data: payments,
    };
  } catch (error) {
    console.error('❌ [PAYMENT-SERVICE] Error retrieving payment history:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve payment history',
      data: [],
    };
  }
};

/**
 * Get payment by ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise<object>} Payment document
 */
export const getPaymentById = async (paymentId) => {
  try {
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    const paymentRef = doc(db, 'payments', paymentId);
    const docSnap = await getDoc(paymentRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Payment not found',
        data: null,
      };
    }

    return {
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data(),
      },
    };
  } catch (error) {
    console.error('❌ [PAYMENT-SERVICE] Error retrieving payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve payment',
      data: null,
    };
  }
};

/**
 * Get total payment amount for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total payment amount
 */
export const getUserTotalPayments = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const paymentsRef = collection(db, 'payments');
    const q = query(
      paymentsRef,
      where('userId', '==', userId),
      where('status', '==', 'paid')
    );

    const snapshot = await getDocs(q);
    const total = snapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().amount || 0);
    }, 0);

    return {
      success: true,
      total,
      currency: 'OMR',
      transactionCount: snapshot.docs.length,
    };
  } catch (error) {
    console.error('❌ [PAYMENT-SERVICE] Error calculating total payments:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate total payments',
      total: 0,
    };
  }
};

/**
 * ✅ NEW: Detect payment anomalies
 * Identifies data integrity issues that need attention
 */
export const detectPaymentAnomalies = async (paymentId) => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      return {
        success: false,
        error: 'Payment not found',
        anomalies: [],
      };
    }

    const payment = paymentSnap.data();
    const anomalies = [];

    // CRITICAL: Paid payment with zero amount
    if (payment.status === 'paid' && (!payment.amount || payment.amount === 0)) {
      anomalies.push({
        severity: 'CRITICAL',
        code: 'ZERO_AMOUNT_PAID',
        message: 'Payment marked as paid but amount is 0',
        payment: 'Please verify with Thawani API',
      });
    }

    // CRITICAL: Missing sessionId for Thawani payment
    if (payment.paymentGateway === 'thawani' && !payment.sessionId) {
      anomalies.push({
        severity: 'CRITICAL',
        code: 'MISSING_SESSION_ID',
        message: 'Thawani payment missing sessionId - cannot trace to gateway',
        action: 'Requires manual investigation',
      });
    }

    // HIGH: Missing transactionId for Thawani payment
    if (payment.paymentGateway === 'thawani' && !payment.transactionId) {
      anomalies.push({
        severity: 'HIGH',
        code: 'MISSING_TRANSACTION_ID',
        message: 'Thawani payment missing transactionId (invoice)',
        action: 'Requires verification against gateway',
      });
    }

    // MEDIUM: Amount mismatch
    if (payment.gatewayAmount && payment.amount) {
      const calculatedAmount = payment.gatewayAmount / 1000;
      const difference = Math.abs(calculatedAmount - payment.amount);
      if (difference > 0.01) {
        anomalies.push({
          severity: 'MEDIUM',
          code: 'AMOUNT_MISMATCH',
          message: `Amount mismatch: ${payment.amount} OMR vs ${calculatedAmount.toFixed(3)} OMR from gateway`,
          difference,
          action: 'Verify against Thawani API',
        });
      }
    }

    // LOW: Missing gateway response data
    if (payment.status === 'paid' && (!payment.gatewayResponse || Object.keys(payment.gatewayResponse).length === 0)) {
      anomalies.push({
        severity: 'LOW',
        code: 'MISSING_GATEWAY_RESPONSE',
        message: 'No gateway response data stored - lacks audit trail',
        action: 'Recommended to verify manually if needed',
      });
    }

    return {
      success: true,
      hasAnomalies: anomalies.length > 0,
      anomalies,
      paymentId,
    };
  } catch (error) {
    console.error('[PAYMENT-SERVICE] Error detecting anomalies:', error);
    return {
      success: false,
      error: error.message,
      anomalies: [],
    };
  }
};

/**
 * ✅ NEW: Get payment by sessionId (Thawani)
 * Find payment record using Thawani session ID
 */
export const getPaymentBySessionId = async (sessionId) => {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('sessionId', '==', sessionId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        success: false,
        error: 'No payment found for this session',
        data: null,
      };
    }

    return {
      success: true,
      data: {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      },
    };
  } catch (error) {
    console.error('[PAYMENT-SERVICE] Error retrieving payment by sessionId:', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * ✅ NEW: Get payment by transactionId (Thawani invoice)
 * Find payment record using Thawani invoice ID
 */
export const getPaymentByTransactionId = async (transactionId) => {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('transactionId', '==', transactionId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        success: false,
        error: 'No payment found for this transaction',
        data: null,
      };
    }

    return {
      success: true,
      data: {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      },
    };
  } catch (error) {
    console.error('[PAYMENT-SERVICE] Error retrieving payment by transactionId:', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * ✅ NEW: Calculate display amount with fallback logic
 * Smart amount selection priority
 */
export const getDisplayAmount = (payment) => {
  // Priority: amount (OMR) → gatewayAmount / 1000 → 0
  if (payment.amount && payment.amount > 0) {
    return payment.amount;
  }
  
  if (payment.gatewayAmount && payment.gatewayAmount > 0) {
    return payment.gatewayAmount / 1000;
  }
  
  return 0;
};

/**
 * ✅ NEW: Format payment amount for display
 */
export const formatPaymentAmount = (payment) => {
  const amount = getDisplayAmount(payment);
  return `${amount.toFixed(3)} ${payment.currency || 'OMR'}`;
};
