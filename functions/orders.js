"use strict";
/**
 * Order Management Cloud Functions
 * Handles order creation, updates, and retrieval
 * Integrates with payment processing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUserOrders = exports.cancelOrder = exports.getOrder = exports.updateOrderStatus = exports.createOrder = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const getDb = () => admin.firestore();
/**
 * Create a new order (called during checkout)
 * SECURITY: User can only create their own orders
 */
exports.createOrder = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to create orders');
        }
        const userId = context.auth.uid;
        const { items, total, paymentMethod, paymentStatus, shippingAddress, notes = '', } = data;
        // Validate required fields
        if (!items || items.length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Order must contain at least one item');
        }
        if (!total || total <= 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid order total');
        }
        if (!shippingAddress) {
            throw new functions.https.HttpsError('invalid-argument', 'Shipping address is required');
        }
        // Verify user can only create their own orders
        if (data.userId && data.userId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Cannot create orders for other users');
        }
        // Create order document
        const orderId = getDb().collection('orders').doc().id;
        const orderData = {
            userId,
            items: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                name: item.name,
            })),
            total,
            paymentMethod,
            paymentStatus: paymentStatus || 'pending',
            paymentStatusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            shippingAddress: {
                firstName: shippingAddress.firstName || '',
                lastName: shippingAddress.lastName || '',
                street: shippingAddress.street || '',
                city: shippingAddress.city || '',
                zipCode: shippingAddress.zipCode || '',
                country: shippingAddress.country || '',
            },
            notes,
            status: 'pending', // pending, processing, shipped, delivered, cancelled
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Save order
        await getDb().collection('orders').doc(orderId).set(orderData);
        // ✅ INVENTORY MANAGEMENT: Decrease stock if payment is successful (paid)
        if (paymentStatus === 'paid') {
            console.log(`📦 [INVENTORY] Processing stock decrease for order ${orderId}`);
            const batch = getDb().batch();
            for (const item of items) {
                if (item.productId) {
                    const productRef = getDb().collection('products').doc(item.productId);
                    const productDoc = await productRef.get();
                    if (productDoc.exists) {
                        const currentStock = productDoc.data()?.stock || 0;
                        const newStock = Math.max(0, currentStock - (item.quantity || 1));
                        batch.update(productRef, {
                            stock: newStock,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        console.log(`📦 [INVENTORY] Product ${item.productId}: ${currentStock} → ${newStock} ` +
                            `(order ${orderId}, qty: ${item.quantity})`);
                    }
                    else {
                        console.warn(`⚠️ [INVENTORY] Product not found: ${item.productId}`);
                    }
                }
            }
            await batch.commit();
            console.log(`✅ [INVENTORY] Stock decreased for order ${orderId}`);
        }
        else {
            console.log(`⏳ [INVENTORY] Order ${orderId} status is '${paymentStatus}', stock will be updated when payment completes`);
        }
        // Log order creation
        console.log(`Order created: ${orderId} for user ${userId}, total: $${total}, payment status: ${paymentStatus}`);
        // TODO: Trigger email notification to user
        return {
            success: true,
            orderId,
            message: 'Order created successfully',
        };
    }
    catch (error) {
        console.error('Create order error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to create order');
    }
});
/**
 * Update order status (admin only)
 */
exports.updateOrderStatus = functions.https.onCall(async (data, context) => {
    try {
        // Verify admin
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const userDoc = await getDb()
            .collection('users')
            .doc(context.auth.uid)
            .get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can update order status');
        }
        const { orderId, status, notes } = data;
        const validStatuses = [
            'pending',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
        ];
        if (!validStatuses.includes(status)) {
            throw new functions.https.HttpsError('invalid-argument', `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        // Update order
        await getDb().collection('orders').doc(orderId).update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Add to history
        await getDb()
            .collection('orders')
            .doc(orderId)
            .collection('history')
            .add({
            action: 'status_updated',
            oldStatus: (await getDb().collection('orders').doc(orderId).get()).data()
                ?.status,
            newStatus: status,
            notes: notes || '',
            changedBy: context.auth.uid,
            changedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Order ${orderId} status updated to ${status}`);
        return {
            success: true,
            message: `Order status updated to ${status}`,
        };
    }
    catch (error) {
        console.error('Update order status error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to update order status');
    }
});
/**
 * Get order details (user can see own, admin sees all)
 */
exports.getOrder = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { orderId } = data;
        const userId = context.auth.uid;
        // Get order
        const orderDoc = await getDb().collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Order not found');
        }
        const orderData = orderDoc.data();
        // Verify user can access this order
        const userDoc = await getDb().collection('users').doc(userId).get();
        const isAdmin = userDoc.data()?.role === 'admin';
        if (!isAdmin && orderData?.userId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Cannot access this order');
        }
        return {
            success: true,
            data: {
                id: orderId,
                ...orderData,
            },
        };
    }
    catch (error) {
        console.error('Get order error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to get order');
    }
});
/**
 * Cancel order (user can cancel own, admin can cancel any)
 */
exports.cancelOrder = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { orderId, reason } = data;
        const userId = context.auth.uid;
        // Get order
        const orderDoc = await getDb().collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Order not found');
        }
        const orderData = orderDoc.data();
        // Check permissions
        const userDoc = await getDb().collection('users').doc(userId).get();
        const isAdmin = userDoc.data()?.role === 'admin';
        if (!isAdmin && orderData?.userId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Cannot cancel this order');
        }
        // ✅ INVENTORY MANAGEMENT: Only allow cancellation if status is 'pending'
        // Other statuses require contacting support
        if (orderData?.status !== 'pending') {
            console.warn(`❌ [CANCEL] Cannot cancel order ${orderId} - status is '${orderData?.status}', ` +
                `only 'pending' orders can be auto-cancelled`);
            throw new functions.https.HttpsError('failed-precondition', `Cannot cancel ${orderData?.status} orders. ` +
                `Please contact support or send a cancellation request for assistance.`);
        }
        // Update order status
        await getDb().collection('orders').doc(orderId).update({
            status: 'cancelled',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // ✅ INVENTORY MANAGEMENT: Restore stock when order is cancelled
        console.log(`📦 [INVENTORY] Processing stock restore for cancelled order ${orderId}`);
        const batch = getDb().batch();
        if (orderData?.items && Array.isArray(orderData.items)) {
            for (const item of orderData.items) {
                if (item.productId) {
                    const productRef = getDb().collection('products').doc(item.productId);
                    const productDoc = await productRef.get();
                    if (productDoc.exists) {
                        const currentStock = productDoc.data()?.stock || 0;
                        const newStock = currentStock + (item.quantity || 1);
                        batch.update(productRef, {
                            stock: newStock,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        console.log(`📦 [INVENTORY] Product ${item.productId}: ${currentStock} → ${newStock} ` +
                            `(restored from cancelled order ${orderId}, qty: ${item.quantity})`);
                    }
                    else {
                        console.warn(`⚠️ [INVENTORY] Product not found for restore: ${item.productId}`);
                    }
                }
            }
        }
        await batch.commit();
        console.log(`✅ [INVENTORY] Stock restored for cancelled order ${orderId}`);
        // Add to history
        await getDb()
            .collection('orders')
            .doc(orderId)
            .collection('history')
            .add({
            action: 'cancelled',
            reason: reason || 'User requested cancellation',
            cancelledBy: userId,
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Order ${orderId} cancelled by ${userId}`);
        // TODO: Process refund if payment was completed
        return {
            success: true,
            message: 'Order cancelled successfully',
        };
    }
    catch (error) {
        console.error('Cancel order error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to cancel order');
    }
});
/**
 * List user's orders
 */
exports.listUserOrders = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const userId = context.auth.uid;
        const { limit = 20, offset = 0 } = data;
        // Get user's orders
        const snapshot = await getDb()
            .collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .offset(offset)
            .get();
        const orders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return {
            success: true,
            data: orders,
            count: orders.length,
        };
    }
    catch (error) {
        console.error('List orders error:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to list orders');
    }
});
//# sourceMappingURL=orders.js.map