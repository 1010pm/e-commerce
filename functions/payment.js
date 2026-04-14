"use strict";
/**
 * Payment Intent Handler
 * Secure Stripe integration with backend secret key management
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
exports.stripePaymentWebhook = exports.confirmPaymentIntent = exports.createPaymentIntent = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const Stripe = require('stripe');
const db = admin.firestore();
const runtimeConfig = functions.config();
/**
 * Create a Stripe PaymentIntent
 * Backend-only: Secret key never exposed to frontend
 *
 * Request:
 * {
 *   amount: number (in cents),
 *   currency: string (e.g., 'usd'),
 *   description?: string,
 *   metadata?: object
 * }
 *
 * Response:
 * {
 *   clientSecret: string,
 *   publishableKey?: string (optional, for client setup)
 * }
 */
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
    try {
        // Verify user is authenticated
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to create a payment intent');
        }
        const { amount, currency = 'usd', description, metadata = {} } = data;
        // Validate amount
        if (!amount || typeof amount !== 'number' || amount < 1) {
            throw new functions.https.HttpsError('invalid-argument', 'Amount must be a positive number in cents');
        }
        // Validate currency
        if (!currency || typeof currency !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'Currency must be a valid string');
        }
        // Get Stripe secret key from Firebase Functions config
        const stripeSecretKey = runtimeConfig.stripe?.secret;
        if (!stripeSecretKey) {
            console.error('Stripe secret key not configured');
            throw new functions.https.HttpsError('internal', 'Payment processing is not configured. Contact support.');
        }
        // Initialize Stripe with secret key (backend only)
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });
        // Create PaymentIntent with automatic payment methods enabled
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Ensure it's in cents
            currency: currency.toLowerCase(),
            description: description || 'E-commerce purchase',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: context.auth.uid,
                ...metadata,
            },
        });
        console.log(`Payment intent created: ${paymentIntent.id} for user ${context.auth.uid}`);
        // Return only clientSecret to frontend
        return {
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    }
    catch (error) {
        console.error('Error creating payment intent:', {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            type: error.type,
            fullError: error,
        });
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Provide specific error codes based on Stripe error types
        if (error.type === 'StripeInvalidRequestError') {
            throw new functions.https.HttpsError('invalid-argument', `Invalid payment request: ${error.message}`);
        }
        if (error.type === 'StripeAuthenticationError') {
            throw new functions.https.HttpsError('permission-denied', 'Payment service authentication failed');
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to create payment intent');
    }
});
/**
 * Confirm payment on backend
 * Called after frontend confirms payment with card details
 *
 * Request:
 * {
 *   paymentIntentId: string,
 *   orderId: string (optional, for order linking)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   status: string ('succeeded' | 'requires_action' | 'failed'),
 *   orderId?: string
 * }
 */
exports.confirmPaymentIntent = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { paymentIntentId, orderId } = data;
        if (!paymentIntentId) {
            throw new functions.https.HttpsError('invalid-argument', 'Payment intent ID is required');
        }
        const stripeSecretKey = runtimeConfig.stripe?.secret;
        if (!stripeSecretKey) {
            throw new functions.https.HttpsError('internal', 'Payment processing is not configured');
        }
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });
        // Retrieve the payment intent to check status
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        // Verify the payment intent belongs to this user
        if (paymentIntent.metadata?.userId !== context.auth.uid) {
            console.error(`Payment intent ${paymentIntentId} user mismatch`);
            throw new functions.https.HttpsError('permission-denied', 'This payment intent does not belong to you');
        }
        // ✅ CRITICAL: Only return success if payment status is 'succeeded'
        if (paymentIntent.status === 'succeeded') {
            console.log(`✅ Payment intent ${paymentIntentId} verified as succeeded`);
            return {
                success: true,
                status: 'succeeded',
                transactionId: paymentIntentId,
                amount: paymentIntent.amount,
            };
        }
        // ❌ Payment did not succeed
        console.warn(`Payment intent ${paymentIntentId} status: ${paymentIntent.status}`);
        return {
            success: false,
            status: paymentIntent.status,
            error: `Payment status is ${paymentIntent.status}, not succeeded`,
        };
    }
    catch (error) {
        console.error('Error confirming payment intent:', {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            type: error.type,
            fullError: error,
        });
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Provide specific error codes based on Stripe error types
        if (error.type === 'StripeInvalidRequestError') {
            throw new functions.https.HttpsError('invalid-argument', `Invalid payment request: ${error.message}`);
        }
        throw new functions.https.HttpsError('internal', 'Failed to confirm payment');
    }
});
/**
 * Webhook handler for Stripe events
 * Processes payment status updates from Stripe
 */
exports.stripePaymentWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const stripeSecretKey = runtimeConfig.stripe?.secret;
    const webhookSecret = runtimeConfig.stripe?.webhook_secret;
    if (!sig || !webhookSecret) {
        res.status(400).send('Missing signature or webhook secret');
        return;
    }
    try {
        if (!stripeSecretKey) {
            console.error('Stripe secret key not configured');
            res.status(500).send('Stripe not configured');
            return;
        }
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });
        // Verify webhook signature
        const event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, webhookSecret);
        // Handle payment events
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            case 'charge.refunded':
                await handleChargeRefunded(event.data.object);
                break;
            default:
                console.log(`Unhandled webhook event: ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook error:', {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            type: error.type,
        });
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});
/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent) {
    console.log('Payment succeeded:', paymentIntent.id);
    const userId = paymentIntent.metadata?.userId;
    if (!userId) {
        console.warn('Payment succeeded but no userId in metadata:', paymentIntent.id);
        return;
    }
    // Log transaction for audit trail
    try {
        await db
            .collection('users')
            .doc(userId)
            .collection('paymentTransactions')
            .add({
            transactionId: paymentIntent.id,
            type: 'payment_success',
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'succeeded',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        console.error('Error logging transaction:', error);
    }
}
/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
    console.log('Payment failed:', paymentIntent.id);
    const userId = paymentIntent.metadata?.userId;
    if (!userId)
        return;
    try {
        await db
            .collection('users')
            .doc(userId)
            .collection('paymentTransactions')
            .add({
            transactionId: paymentIntent.id,
            type: 'payment_failed',
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            error: paymentIntent.last_payment_error?.message,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        console.error('Error logging failed payment:', error);
    }
}
/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge) {
    console.log('Charge refunded:', charge.id);
    // Find related payment intent and update order
    // Implementation depends on your order structure
}
//# sourceMappingURL=payment.js.map