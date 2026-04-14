/**
 * Orders Service - Production Ready
 * Handles all order-related operations with Firestore
 * خدمة الطلبات
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

/**
 * Complete Orders Service
 * Manages all order operations with proper userId filtering
 */
export const ordersService = {
  /**
   * Get all orders for a user
   * @param {string} userId - User's Firebase UID
   * @returns {Promise<{success: boolean, data: array, error: string}>}
   */
  getAll: async (userId) => {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      // Query orders where userId matches the logged-in user
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return { success: true, data: orders };
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get single order by ID
   * @param {string} orderId - Order document ID
   * @param {string} userId - User's Firebase UID (for authorization check)
   * @returns {Promise<{success: boolean, data: object, error: string}>}
   */
  getById: async (orderId, userId) => {
    try {
      if (!orderId || !userId) {
        return { success: false, error: 'Order ID and User ID are required' };
      }

      console.log('Fetching order:', { orderId, userId, idLength: orderId.length });

      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.error('Order document not found:', orderId);
        return { success: false, error: 'Order not found' };
      }

      const orderData = docSnap.data();

      // Verify user owns this order
      if (orderData.userId !== userId) {
        console.error('Unauthorized access attempt:', { orderId, expectedUserId: userId, actualUserId: orderData.userId });
        return { success: false, error: 'Unauthorized to access this order' };
      }

      return {
        success: true,
        data: { id: docSnap.id, ...orderData },
      };
    } catch (error) {
      console.error('Get order error:', error, { orderId, userId });
      return { success: false, error: error.message };
    }
  },

  /**
   * Create new order
   * @param {string} userId - User's Firebase UID
   * @param {object} orderData - Order details
   * @returns {Promise<{success: boolean, data: object, error: string}>}
   */
  create: async (userId, orderData) => {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      if (!orderData || !orderData.items || orderData.items.length === 0) {
        return { success: false, error: 'Order must contain items' };
      }

      // Validate required fields
      const requiredFields = ['shippingAddress', 'paymentMethod', 'subtotal', 'tax', 'shipping', 'total'];
      for (const field of requiredFields) {
        if (orderData[field] === undefined) {
          return { success: false, error: `Missing required field: ${field}` };
        }
      }

      // Validate address fields
      const addressFields = ['addressLine', 'city', 'country', 'zipCode'];
      for (const field of addressFields) {
        if (!orderData.shippingAddress[field]) {
          return { success: false, error: `Missing address field: ${field}` };
        }
      }

      // Prepare order document with complete schema
      const order = {
        userId, // CRITICAL: Must use userId for queries
        items: orderData.items.map((item) => ({
          productId: item.productId || item.id,
          name: String(item.name || 'Product').trim(),
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          image: item.image || null, // ✅ Use null instead of undefined
          subtotal: Number(item.price || 0) * Number(item.quantity || 1),
        })),
        shippingAddress: {
          addressLine: String(orderData.shippingAddress.addressLine || '').trim(),
          city: String(orderData.shippingAddress.city || '').trim(),
          state: String(orderData.shippingAddress.state || '').trim(),
          country: String(orderData.shippingAddress.country || '').trim(),
          zipCode: String(orderData.shippingAddress.zipCode || '').trim(),
          firstName: String(orderData.shippingAddress.firstName || '').trim(),
          lastName: String(orderData.shippingAddress.lastName || '').trim(),
          phone: String(orderData.shippingAddress.phone || '').trim(),
          email: String(orderData.shippingAddress.email || '').trim(),
        },
        paymentMethod: orderData.paymentMethod || 'unknown',
        paymentStatus: orderData.paymentStatus || 'pending',
        transactionId: orderData.transactionId || null, // ✅ Add transactionId support
        subtotal: Number(orderData.subtotal || 0),
        tax: Number(orderData.tax || 0),
        shipping: Number(orderData.shipping || 0),
        total: Number(orderData.total || 0),
        status: 'pending', // Initial status
        notes: String(orderData.notes || '').trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Final check: ensure no undefined values exist in the order
      const checkForUndefined = (obj, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const fullPath = path ? `${path}.${key}` : key;
          if (value === undefined) {
            throw new Error(`Order contains undefined field at ${fullPath}`);
          }
          if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            checkForUndefined(value, fullPath);
          }
        }
      };
      checkForUndefined(order);

      console.log('Order document ready for Firestore:', {
        hasUserId: !!order.userId,
        hasItems: !!order.items?.length,
        addressComplete: !!(order.shippingAddress?.addressLine && order.shippingAddress?.city),
      });

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'orders'), order);

      return {
        success: true,
        data: {
          id: docRef.id,
          ...order,
        },
        message: 'Order created successfully',
      };
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update order status (admin only)
   * @param {string} orderId - Order document ID
   * @param {string} status - New status (pending, processing, shipped, delivered, cancelled)
   * @param {string} notes - Optional notes
   * @returns {Promise<{success: boolean, data: object, error: string}>}
   */
  updateStatus: async (orderId, status, notes = '') => {
    try {
      if (!orderId) {
        return { success: false, error: 'Order ID is required' };
      }

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
      }

      const docRef = doc(db, 'orders', orderId);
      const updateData = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      await updateDoc(docRef, updateData);

      return {
        success: true,
        message: `Order status updated to ${status}`,
      };
    } catch (error) {
      console.error('Update order error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update payment status
   * @param {string} orderId - Order document ID
   * @param {string} paymentStatus - New payment status (pending, completed, failed, refunded)
   * @returns {Promise<{success: boolean, error: string}>}
   */
  updatePaymentStatus: async (orderId, paymentStatus) => {
    try {
      if (!orderId) {
        return { success: false, error: 'Order ID is required' };
      }

      const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
      if (!validStatuses.includes(paymentStatus)) {
        return { success: false, error: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}` };
      }

      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, {
        paymentStatus,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: 'Payment status updated',
      };
    } catch (error) {
      console.error('Update payment status error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cancel order
   * @param {string} orderId - Order document ID
   * @param {string} userId - User's Firebase UID (for authorization)
   * @param {string} reason - Cancellation reason
   * @returns {Promise<{success: boolean, error: string}>}
   */
  cancel: async (orderId, userId, reason = '') => {
    try {
      if (!orderId || !userId) {
        return { success: false, error: 'Order ID and User ID are required' };
      }

      console.log('Cancelling order:', { orderId, userId, reason });

      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false, error: 'Order not found' };
      }

      const orderData = docSnap.data();

      // Verify user owns this order
      if (orderData.userId !== userId) {
        console.error('Unauthorized cancel attempt:', { orderId, expectedUserId: userId, actualUserId: orderData.userId });
        return { success: false, error: 'Unauthorized to cancel this order' };
      }

      // Cannot cancel delivered or already cancelled orders
      if (['delivered', 'cancelled'].includes(orderData.status)) {
        return { success: false, error: `Cannot cancel order with status: ${orderData.status}` };
      }

      console.log('Updating order status to cancelled...');

      await updateDoc(docRef, {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: serverTimestamp(),
      });

      console.log('Order cancelled successfully:', orderId);

      return {
        success: true,
        message: 'Order cancelled successfully',
      };
    } catch (error) {
      console.error('Cancel order error:', error, { orderId, userId });
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all orders (admin only)
   * @param {object} filters - Filter options
   * @returns {Promise<{success: boolean, data: array, error: string}>}
   */
  getAllOrders: async (filters = {}) => {
    try {
      let q = collection(db, 'orders');

      // Build query with filters
      const constraints = [];

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters.paymentStatus) {
        constraints.push(where('paymentStatus', '==', filters.paymentStatus));
      }

      // Always order by createdAt descending
      if (constraints.length > 0) {
        q = query(q, ...constraints, orderBy('createdAt', 'desc'));
      } else {
        q = query(q, orderBy('createdAt', 'desc'));
      }

      // Limit results
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return { success: true, data: orders };
    } catch (error) {
      console.error('Get all orders error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get orders by status
   * @param {string} status - Order status to filter by
   * @returns {Promise<{success: boolean, data: array, error: string}>}
   */
  getByStatus: async (status) => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return { success: true, data: orders };
    } catch (error) {
      console.error('Get orders by status error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete order (admin only)
   * @param {string} orderId - Order document ID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  delete: async (orderId) => {
    try {
      if (!orderId) {
        return { success: false, error: 'Order ID is required' };
      }

      const docRef = doc(db, 'orders', orderId);
      await deleteDoc(docRef);

      return {
        success: true,
        message: 'Order deleted successfully',
      };
    } catch (error) {
      console.error('Delete order error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * Export for backward compatibility and convenience
 */
export default ordersService;
