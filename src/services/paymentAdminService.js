/**
 * Payment Admin Service
 * Advanced queries for payment dashboard and management
 * Handles payments, sessions, and anomaly detection
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  limit,
  startAfter,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

/**
 * Get all payments with optional filters, sort, and pagination
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status (paid, failed, pending)
 * @param {number} options.limit - Limit results
 * @param {Object} options.startAfter - Pagination cursor
 * @param {string} options.sortBy - Sort field (createdAt, amount)
 * @param {string} options.sortOrder - asc or desc
 * @returns {Promise}
 */
export const paymentAdminService = {
  // Get all payments
  getAllPayments: async (options = {}) => {
    try {
      const {
        status,
        limit: limitNum = 50,
        startAfterDoc,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const constraints = [];

      // Add status filter if provided
      if (status) {
        constraints.push(where('status', '==', status));
      }

      // Add sort
      constraints.push(orderBy(sortBy, sortOrder === 'asc' ? 'asc' : 'desc'));

      // Add limit
      constraints.push(limit(limitNum + 1)); // +1 to detect if more docs exist

      // Add pagination if cursor provided
      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }

      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, ...constraints);
      const snapshot = await getDocs(q);

      const payments = [];
      snapshot.forEach((doc) => {
        payments.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return {
        success: true,
        data: payments.slice(0, limitNum),
        hasMore: payments.length > limitNum,
      };
    } catch (error) {
      console.error('❌ [PAYMENT-ADMIN] Error fetching payments:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single payment by ID
  getPaymentById: async (paymentId) => {
    try {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      if (!paymentDoc.exists()) {
        return { success: false, error: 'Payment not found' };
      }
      return {
        success: true,
        data: {
          id: paymentDoc.id,
          ...paymentDoc.data(),
        },
      };
    } catch (error) {
      console.error('❌ [PAYMENT-ADMIN] Error fetching payment:', error);
      return { success: false, error: error.message };
    }
  },

  // Get payments by user
  getPaymentsByUser: async (userId) => {
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const payments = [];
      snapshot.forEach((doc) => {
        payments.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return { success: true, data: payments };
    } catch (error) {
      console.error('❌ [PAYMENT-ADMIN] Error fetching user payments:', error);
      return { success: false, error: error.message };
    }
  },

  // Get payments by status with stats
  getPaymentStats: async () => {
    try {
      const paymentsRef = collection(db, 'payments');

      // Get all payments for current month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const q = query(
        paymentsRef,
        where('createdAt', '>=', Timestamp.fromDate(monthStart)),
        where('createdAt', '<=', Timestamp.fromDate(monthEnd))
      );
      const snapshot = await getDocs(q);

      const payments = [];
      snapshot.forEach((doc) => {
        payments.push(doc.data());
      });

      // Calculate stats
      const stats = {
        totalRevenue: payments
          .filter((p) => p.status === 'paid')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        totalOrders: payments.length,
        failedCount: payments.filter((p) => p.status === 'failed').length,
        pendingCount: payments.filter((p) => p.status === 'pending').length,
        paidCount: payments.filter((p) => p.status === 'paid').length,
        averageOrderValue: payments.length > 0
          ? payments
              .filter((p) => p.status === 'paid')
              .reduce((sum, p) => sum + (p.amount || 0), 0) /
            payments.filter((p) => p.status === 'paid').length
          : 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('❌ [PAYMENT-ADMIN] Error calculating payment stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Search payments by email, name, or payment ID
  searchPayments: async (searchTerm) => {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return { success: true, data: [] };
      }

      const term = searchTerm.toLowerCase();
      const paymentsRef = collection(db, 'payments');

      // Get all payments and filter in memory (Firestore doesn't support full-text search directly)
      const q = query(paymentsRef, orderBy('createdAt', 'desc'), limit(1000));
      const snapshot = await getDocs(q);

      const results = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const matchesEmail = data.customerEmail?.toLowerCase().includes(term);
        const matchesName = data.customerName?.toLowerCase().includes(term);
        const matchesPaymentId = doc.id.toLowerCase().includes(term);

        if (matchesEmail || matchesName || matchesPaymentId) {
          results.push({
            id: doc.id,
            ...data,
          });
        }
      });

      return { success: true, data: results };
    } catch (error) {
      console.error('❌ [PAYMENT-ADMIN] Error searching payments:', error);
      return { success: false, error: error.message };
    }
  },

  // Get payment sessions
  getAllSessions: async (options = {}) => {
    try {
      const { limit: limitNum = 50, status } = options;

      const constraints = [];

      if (status) {
        constraints.push(where('status', '==', status));
      }

      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(limitNum + 1));

      const sessionsRef = collection(db, 'paymentSessions');
      const q = query(sessionsRef, ...constraints);
      const snapshot = await getDocs(q);

      const sessions = [];
      snapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return {
        success: true,
        data: sessions.slice(0, limitNum),
        hasMore: sessions.length > limitNum,
      };
    } catch (error) {
      console.error('❌ [PAYMENT-ADMIN] Error fetching sessions:', error);
      return { success: false, error: error.message };
    }
  },

  // Get session by ID
  getSessionById: async (sessionId) => {
    try {
      const sessionDoc = await getDoc(doc(db, 'paymentSessions', sessionId));
      if (!sessionDoc.exists()) {
        return { success: false, error: 'Session not found' };
      }
      return {
        success: true,
        data: {
          id: sessionDoc.id,
          ...sessionDoc.data(),
        },
      };
    } catch (error) {
      console.error('❌ [PAYMENT-ADMIN] Error fetching session:', error);
      return { success: false, error: error.message };
    }
  },

  // Link payment to session
  linkPaymentToSession: async (payment) => {
    try {
      if (!payment.sessionId) {
        return { success: false, error: 'No session ID in payment' };
      }

      // Find session with matching sessionId
      const sessionsRef = collection(db, 'paymentSessions');
      const q = query(sessionsRef, where('sessionId', '==', payment.sessionId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          success: false,
          error: 'Session not linked to payment',
          warning: true,
        };
      }

      const session = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      };

      return { success: true, data: session };
    } catch (error) {
      console.error('❌ [PAYMENT-ADMIN] Error linking payment:', error);
      return { success: false, error: error.message };
    }
  },

  // Detect anomalies
  detectAnomalies: async (payment, session) => {
    const anomalies = [];

    try {
      // ✅ CRITICAL: Zero amount on paid payment
      if (payment.status === 'paid' && (!payment.amount || payment.amount === 0)) {
        anomalies.push({
          type: 'ZERO_AMOUNT_PAID',
          severity: 'CRITICAL',
          message: `⚠️ CRITICAL: Payment marked as paid but amount is 0 OMR`,
          description: 'This payment may have been corrupted. Verify with Thawani API.',
          action: 'Manual verification required',
        });
      }

      // ✅ CRITICAL: Missing sessionId for Thawani payment
      if (payment.paymentGateway === 'thawani' && !payment.sessionId) {
        anomalies.push({
          type: 'MISSING_SESSION_ID',
          severity: 'CRITICAL',
          message: `Thawani payment missing sessionId`,
          description: 'Cannot trace payment back to Thawani gateway. Payment traceability lost.',
          action: 'Data integrity issue - requires investigation',
        });
      }

      // ✅ HIGH: Missing transactionId for Thawani payment
      if (payment.paymentGateway === 'thawani' && !payment.transactionId) {
        anomalies.push({
          type: 'MISSING_TRANSACTION_ID',
          severity: 'HIGH',
          message: `Thawani payment missing transactionId (invoice)`,
          description: 'Invoice ID not recorded. Cannot cross-reference with gateway.',
          action: 'Update transaction record with Thawani invoice',
        });
      }

      // ✅ HIGH: Missing gateway response
      if (payment.status === 'paid' && payment.paymentGateway === 'thawani' && 
          (!payment.gatewayResponse || Object.keys(payment.gatewayResponse).length === 0)) {
        anomalies.push({
          type: 'MISSING_GATEWAY_RESPONSE',
          severity: 'HIGH',
          message: `Paid Thawani payment missing gateway response data`,
          description: 'Full Thawani API response not stored. Audit trail incomplete.',
          action: 'Verify payment directly with Thawani',
        });
      }

      // 1. Amount mismatch (from sessionData)
      if (session && payment.amount) {
        const paymentAmount = Math.round(payment.amount * 100) / 100;
        const sessionAmount = Math.round((session.amount / 1000) * 100) / 100; // Convert baisa to OMR

        if (Math.abs(paymentAmount - sessionAmount) > 0.01) {
          anomalies.push({
            type: 'AMOUNT_MISMATCH',
            severity: 'MEDIUM',
            message: `Amount mismatch: payment ${paymentAmount} OMR vs session ${sessionAmount} OMR`,
            paymentAmount,
            sessionAmount,
            description: 'Payment amount from Firestore differs from Thawani session amount.',
          });
        }
      }

      // ✅ NEW: Amount consistency check (payment.amount vs gatewayAmount)
      if (payment.gatewayAmount && payment.amount) {
        const calculatedAmount = payment.gatewayAmount / 1000;
        const difference = Math.abs(calculatedAmount - payment.amount);
        if (difference > 0.01) { // Allow 0.01 OMR tolerance
          anomalies.push({
            type: 'GATEWAY_AMOUNT_MISMATCH',
            severity: 'MEDIUM',
            message: `Amount field mismatch: amount=${payment.amount} OMR vs gatewayAmount=${payment.gatewayAmount} baisa (${calculatedAmount.toFixed(3)} OMR)`,
            primaryAmount: payment.amount,
            gatewayAmount: payment.gatewayAmount,
            difference,
            description: 'The amount field does not match the gatewayAmount conversion.',
          });
        }
      }

      // 2. Session expired but marked paid
      if (session && session.expiresAt && payment.status === 'paid') {
        const expiryTime = session.expiresAt.toDate
          ? session.expiresAt.toDate()
          : new Date(session.expiresAt);
        const paidTime = payment.paidAt?.toDate
          ? payment.paidAt.toDate()
          : new Date(payment.paidAt);

        if (expiryTime < paidTime) {
          anomalies.push({
            type: 'EXPIRED_SESSION_PAID',
            severity: 'MEDIUM',
            message: `Payment marked as paid after session expiry`,
            sessionExpiry: expiryTime.toISOString(),
            paidAt: paidTime.toISOString(),
          });
        }
      }

      // 3. Missing customer data
      if (!payment.customerEmail || !payment.customerName) {
        anomalies.push({
          type: 'MISSING_CUSTOMER_DATA',
          severity: 'low',
          message: 'Incomplete customer information',
        });
      }

      // 4. Missing shipping address
      if (!payment.shippingAddress || Object.keys(payment.shippingAddress).length === 0) {
        anomalies.push({
          type: 'MISSING_ADDRESS',
          severity: 'low',
          message: 'No shipping address provided',
        });
      }

      return { success: true, data: anomalies, hasAnomalies: anomalies.length > 0 };
    } catch (error) {
      console.error('❌ [PAYMENT-ADMIN] Error detecting anomalies:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get transaction history for a payment
  getTransactionHistory: async (paymentId) => {
    try {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      if (!paymentDoc.exists()) {
        return { success: false, error: 'Payment not found' };
      }

      const payment = paymentDoc.data();

      // Build transaction history from payment data
      const history = [
        {
          type: 'payment_created',
          timestamp: payment.createdAt,
          description: 'Payment session created',
        },
      ];

      if (payment.status === 'paid' && payment.paidAt) {
        history.push({
          type: 'payment_verified',
          timestamp: payment.paidAt,
          description: 'Payment verified and marked as paid',
        });
      }

      if (payment.status === 'failed') {
        history.push({
          type: 'payment_failed',
          timestamp: payment.failedAt || payment.createdAt,
          description: 'Payment failed',
        });
      }

      return { success: true, data: history };
    } catch (error) {
      console.error('❌ [PAYMENT-ADMIN] Error getting transaction history:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * ✅ Display helper: Get displayable amount from payment
 * Uses priority: amount (OMR) → gatewayAmount / 1000 → 0
 */
export const getPaymentDisplayAmount = (payment) => {
  if (payment?.amount && payment.amount > 0) {
    return payment.amount;
  }
  
  if (payment?.gatewayAmount && payment.gatewayAmount > 0) {
    return payment.gatewayAmount / 1000;
  }
  
  return 0;
};

/**
 * ✅ Display helper: Format payment amount with currency
 */
export const formatPaymentAmount = (payment) => {
  const amount = getPaymentDisplayAmount(payment);
  const currency = payment?.currency || 'OMR';
  return `${amount.toFixed(3)} ${currency}`;
};

/**
 * ✅ Display helper: Get amount with anomaly flag
 */
export const getPaymentAmountWithFlag = (payment) => {
  const amount = getPaymentDisplayAmount(payment);
  
  // Flag if paid but zero amount
  if (payment.status === 'paid' && amount === 0) {
    return {
      amount,
      formatted: `🚨 ${amount.toFixed(3)} OMR (INVALID)`,
      isAnomaly: true,
      anomalyType: 'ZERO_AMOUNT_PAID',
    };
  }
  
  return {
    amount,
    formatted: `${amount.toFixed(3)} OMR`,
    isAnomaly: false,
  };
};

export default paymentAdminService;
