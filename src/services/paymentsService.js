/**
 * Payments Service
 * Manages payment transaction records in Firebase
 * Stores successful payment data in the 'payments' collection
 */

import { db } from '../config/firebase.config';
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, Timestamp, getDoc } from 'firebase/firestore';

/**
 * Save a successful payment to Firebase
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID associated with this payment
 * @param {object} paymentData - Payment details
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

    // Generate payment ID
    const paymentsRef = collection(db, 'payments');
    const paymentId = doc(paymentsRef).id;

    // Prepare payment document
    const paymentDocument = {
      // Identifiers
      paymentId,
      orderId,
      userId,

      // Payment information
      amount: paymentData.amount || 0,
      currency: paymentData.currency || 'OMR',
      paymentMethod: paymentData.paymentMethod || 'thawani',
      paymentGateway: 'thawani',
      
      // Status
      status: 'paid', // paid, pending, failed
      transactionId: paymentData.transactionId || null,
      
      // Customer information
      customerName: paymentData.customerName || 'Unknown',
      customerEmail: paymentData.customerEmail || '',
      customerPhone: paymentData.customerPhone || '',
      
      // Breakdown
      subtotal: paymentData.subtotal || 0,
      tax: paymentData.tax || 0,
      shipping: paymentData.shipping || 0,
      
      // Items count
      itemsCount: paymentData.itemsCount || 0,
      
      // Timestamps
      createdAt: Timestamp.now(),
      paidAt: Timestamp.now(),
      
      // Additional metadata
      ipAddress: paymentData.ipAddress || null,
      userAgent: paymentData.userAgent || null,
      notes: paymentData.notes || '',

      // Shipping address
      shippingAddress: paymentData.shippingAddress || {},
    };

    console.log('💾 [PAYMENT-SERVICE] Saving payment transaction:', {
      paymentId,
      orderId,
      userId,
      amount: paymentData.amount,
      currency: paymentData.currency,
    });

    // Save to Firestore
    await setDoc(doc(db, 'payments', paymentId), paymentDocument);

    console.log('✅ [PAYMENT-SERVICE] Payment transaction saved successfully:', paymentId);

    return {
      success: true,
      paymentId,
      message: 'Payment transaction saved successfully',
    };
  } catch (error) {
    console.error('❌ [PAYMENT-SERVICE] Error saving payment transaction:', error);
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
