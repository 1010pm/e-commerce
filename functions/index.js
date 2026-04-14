"use strict";
/**
 * Firebase Cloud Functions for E-Commerce
 * Dynamic payment provider support with secure secret key management
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
exports.thawaniWebhook = exports.verifyThawaniPayment = exports.createThawaniSession = exports.listUserOrders = exports.cancelOrder = exports.updateOrderStatus = exports.getOrder = exports.createOrder = exports.health = exports.deletePaymentMethod = exports.updatePaymentMethod = exports.createPaymentMethod = exports.processPayment = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const thawani_1 = require("./thawani");
Object.defineProperty(exports, "createThawaniSession", { enumerable: true, get: function () { return thawani_1.createThawaniSession; } });
Object.defineProperty(exports, "verifyThawaniPayment", { enumerable: true, get: function () { return thawani_1.verifyThawaniPayment; } });
Object.defineProperty(exports, "thawaniWebhook", { enumerable: true, get: function () { return thawani_1.thawaniWebhook; } });
// Initialize Firebase Admin
admin.initializeApp();
const getDb = () => admin.firestore();
// Get runtime config
const runtimeConfig = functions.config();
// ===========================
// UNIFIED PAYMENT PROCESSOR
// ===========================
/**
 * Process payment for any configured provider
 * SECURITY: Secret keys are stored in Cloud Functions config, never exposed to frontend
 */
exports.processPayment = functions.https.onCall(async (data, context) => {
    try {
        // Verify user is authenticated
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { provider, methodId, amount, currency, paymentData, metadata } = data;
        const userId = context.auth.uid;
        // Validate input
        if (!provider || !amount || !currency) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: provider, amount, currency');
        }
        if (amount <= 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Amount must be greater than 0');
        }
        // Fetch payment method config from Firestore
        let paymentMethod = null;
        if (methodId) {
            try {
                const methodDoc = await getDb().collection('paymentMethods').doc(methodId).get();
                if (methodDoc.exists) {
                    paymentMethod = methodDoc.data();
                }
            }
            catch (error) {
                console.error('Error fetching payment method:', error);
            }
        }
        // Route to appropriate provider handler
        let result;
        switch (provider.toLowerCase()) {
            case 'paypal':
                result = await processPayPalPayment(amount, currency, paymentData, { userId, methodId, ...metadata });
                break;
            case 'bank_transfer':
                result = await processBankTransferPayment(amount, currency, paymentData, { userId, methodId, ...metadata });
                break;
            default:
                throw new functions.https.HttpsError('invalid-argument', `Unknown payment provider: ${provider}`);
        }
        // Log transaction
        await logPaymentTransaction(userId, {
            provider,
            methodId,
            amount,
            currency,
            status: result.success ? 'succeeded' : 'failed',
            transactionId: result.transactionId,
            error: result.error,
        });
        return result;
    }
    catch (error) {
        console.error('Error in processPayment:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Payment processing failed');
    }
});
// ===========================
// PAYPAL PAYMENT HANDLER
// ===========================
async function processPayPalPayment(amount, currency, paymentData, metadata) {
    try {
        // Get PayPal credentials from secure config
        const paypalClientId = runtimeConfig.paypal?.client_id;
        const paypalSecret = runtimeConfig.paypal?.secret;
        if (!paypalClientId || !paypalSecret) {
            console.error('PayPal not properly configured');
            throw new Error('PayPal is not properly configured');
        }
        // In production, implement PayPal order creation and capture
        // This is a simplified example
        return {
            success: true,
            transactionId: `paypal_${Date.now()}`,
            status: 'pending',
            redirectUrl: paymentData.returnUrl,
        };
    }
    catch (error) {
        console.error('PayPal payment error:', error);
        return {
            success: false,
            error: error.message || 'PayPal payment processing failed',
            transactionId: null,
        };
    }
}
// ===========================
// BANK TRANSFER HANDLER
// ===========================
async function processBankTransferPayment(amount, currency, paymentData, metadata) {
    try {
        // Bank transfer requires manual verification
        return {
            success: true,
            transactionId: `bank_${Date.now()}`,
            status: 'pending_verification',
            message: 'Bank transfer initiated. Awaiting verification.',
        };
    }
    catch (error) {
        console.error('Bank transfer error:', error);
        return {
            success: false,
            error: error.message || 'Bank transfer processing failed',
            transactionId: null,
        };
    }
}
// ===========================
// PAYMENT METHOD MANAGEMENT
// ===========================
/**
 * Admin only: Create a new payment method
 * SECURITY: Only stores public config, secret keys must be set via environment variables
 */
exports.createPaymentMethod = functions.https.onCall(async (data, context) => {
    try {
        // Verify user is admin
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const userDoc = await getDb().collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can create payment methods');
        }
        const { name, provider, publicConfig, fields, description } = data;
        // Validate input
        if (!name || !provider) {
            throw new functions.https.HttpsError('invalid-argument', 'Name and provider are required');
        }
        // CRITICAL: Never accept secret keys from admin UI
        // Check only actual secret VALUES, not field names
        const hasSecretValues = (obj) => {
            if (!obj)
                return false;
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string') {
                    const lowerValue = value.toLowerCase().trim();
                    // Block actual secret patterns
                    if (lowerValue.startsWith('sk_') ||
                        lowerValue.startsWith('rk_') ||
                        (lowerValue.includes('secret') && lowerValue.length > 20)) {
                        return true;
                    }
                }
                else if (typeof value === 'object' && value !== null) {
                    if (hasSecretValues(value))
                        return true;
                }
            }
            return false;
        };
        if (hasSecretValues(publicConfig) || hasSecretValues(data.config)) {
            throw new functions.https.HttpsError('permission-denied', 'Secret keys cannot be configured via UI. Set via Firebase Cloud Functions config.');
        }
        // Create payment method document
        const methodRef = getDb().collection('paymentMethods').doc();
        const methodId = methodRef.id;
        await methodRef.set({
            id: methodId,
            name,
            provider: provider.toLowerCase(),
            description: description || '',
            isActive: false, // Require admin to explicitly activate
            publicConfig: publicConfig || {},
            fields: fields || [],
            createdBy: context.auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            methodId,
            message: 'Payment method created. Don\'t forget to set API keys via Cloud Functions config.',
        };
    }
    catch (error) {
        console.error('Error creating payment method:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to create payment method');
    }
});
/**
 * Admin only: Update payment method
 * SECURITY: Prevents direct secret key updates
 */
exports.updatePaymentMethod = functions.https.onCall(async (data, context) => {
    try {
        // Verify admin
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const userDoc = await getDb().collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can update payment methods');
        }
        const { methodId, updates } = data;
        if (!methodId) {
            throw new functions.https.HttpsError('invalid-argument', 'Payment method ID is required');
        }
        // CRITICAL: Block secret key updates
        // Check only actual secret VALUES, not field names  
        const hasSecretValues = (obj) => {
            if (!obj)
                return false;
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string') {
                    const lowerValue = value.toLowerCase().trim();
                    // Block actual secret patterns
                    if (lowerValue.startsWith('sk_') ||
                        lowerValue.startsWith('rk_') ||
                        (lowerValue.includes('secret') && lowerValue.length > 20)) {
                        return true;
                    }
                }
                else if (typeof value === 'object' && value !== null) {
                    if (hasSecretValues(value))
                        return true;
                }
            }
            return false;
        };
        if (hasSecretValues(updates?.publicConfig) ||
            hasSecretValues(updates?.config) ||
            hasSecretValues(updates)) {
            throw new functions.https.HttpsError('permission-denied', 'Secret keys cannot be updated via UI. Set via Firebase Cloud Functions config.');
        }
        // Safe fields only
        const safeUpdates = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (updates?.name)
            safeUpdates.name = updates.name;
        if (updates?.description)
            safeUpdates.description = updates.description;
        if (updates?.isActive !== undefined)
            safeUpdates.isActive = updates.isActive;
        if (updates?.publicConfig)
            safeUpdates.publicConfig = updates.publicConfig;
        if (updates?.fields)
            safeUpdates.fields = updates.fields;
        await getDb()
            .collection('paymentMethods')
            .doc(methodId)
            .update(safeUpdates);
        return {
            success: true,
            message: 'Payment method updated',
        };
    }
    catch (error) {
        console.error('Error updating payment method:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to update payment method');
    }
});
/**
 * Admin only: Delete payment method
 */
exports.deletePaymentMethod = functions.https.onCall(async (data, context) => {
    try {
        // Verify admin
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const userDoc = await getDb().collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can delete payment methods');
        }
        const { methodId } = data;
        if (!methodId) {
            throw new functions.https.HttpsError('invalid-argument', 'Payment method ID is required');
        }
        await getDb().collection('paymentMethods').doc(methodId).delete();
        return {
            success: true,
            message: 'Payment method deleted',
        };
    }
    catch (error) {
        console.error('Error deleting payment method:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to delete payment method');
    }
});
// ===========================
// WEBHOOK HANDLERS
// ===========================
// ===========================
// UTILITY FUNCTIONS
// ===========================
/**
 * Log payment transaction for audit trail
 */
async function logPaymentTransaction(userId, transactionData) {
    try {
        await getDb()
            .collection('users')
            .doc(userId)
            .collection('paymentTransactions')
            .add({
            ...transactionData,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        console.error('Error logging payment transaction:', error);
        // Don't throw - payment succeeded but logging failed
    }
}
// ===========================
// HEALTH CHECK
// ===========================
/**
 * Simple health check endpoint
 */
exports.health = functions.https.onRequest((req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
});
// Import and export order functions
var orders_1 = require("./orders");
Object.defineProperty(exports, "createOrder", { enumerable: true, get: function () { return orders_1.createOrder; } });
Object.defineProperty(exports, "getOrder", { enumerable: true, get: function () { return orders_1.getOrder; } });
Object.defineProperty(exports, "updateOrderStatus", { enumerable: true, get: function () { return orders_1.updateOrderStatus; } });
Object.defineProperty(exports, "cancelOrder", { enumerable: true, get: function () { return orders_1.cancelOrder; } });
Object.defineProperty(exports, "listUserOrders", { enumerable: true, get: function () { return orders_1.listUserOrders; } });
//# sourceMappingURL=index.js.map