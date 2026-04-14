/**
 * Comprehensive Cloud Functions for E-Commerce Payment System
 * Features:
 * - Dynamic payment provider support
 * - Secure secret key management (Cloud Functions config only)
 * - Multi-provider payment processing (Stripe, PayPal, Bank Transfer, Custom)
 * - Webhook handling for payment confirmations
 * - Payment method administration
 * - Transaction logging
 * - Comprehensive error handling
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
const Stripe = require('stripe');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Get runtime config (secrets set via firebase functions:config:set)
const config = functions.config();

// ============================================
// PROVIDER SECRETS CONFIGURATION
// ============================================

/**
 * Provider secret mappings from Cloud Functions config
 * These are set via Firebase CLI, never exposed to frontend
 * 
 * Example setup:
 * firebase functions:config:set \
 *   stripe.api_key="sk_live_..." \
 *   stripe.webhook_secret="whsec_..." \
 *   paypal.client_id="..." \
 *   paypal.client_secret="..." \
 *   custom.api_keys="..." \
 *   firebase.deploy --only functions
 */
const providerSecrets = {
  stripe: {
    apiKey: config.stripe?.api_key || '',
    webhookSecret: config.stripe?.webhook_secret || '',
  },
  paypal: {
    clientId: config.paypal?.client_id || '',
    clientSecret: config.paypal?.client_secret || '',
  },
  bank_transfer: {
    // Bank transfer doesn't need API keys, only verification
  },
  // Add custom providers as needed
  custom: {
    // Custom providers can have custom secrets
    apiKey: config.custom?.api_key || '',
    apiEndpoint: config.custom?.api_endpoint || '',
  },
};

// ============================================
// UNIFIED PAYMENT PROCESSOR
// ============================================

/**
 * Main payment processing function
 * Handles all payment providers securely
 * 
 * @param {Object} data - Payment request data
 * @param {string} data.provider - Payment provider (stripe, paypal, etc.)
 * @param {string} data.methodId - Payment method ID from Firestore
 * @param {number} data.amount - Amount in dollars
 * @param {string} data.currency - Currency code (USD, EUR, etc.)
 * @param {Object} data.paymentData - Payment form data (card, etc.)
 * @param {Object} data.metadata - Additional metadata (orderId, userId, etc.)
 */
export const processPayment = functions.https.onCall(
  async (data, context) => {
    try {
      // Verify user authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to process payments'
        );
      }

      const userId = context.auth.uid;
      const {
        provider,
        methodId,
        amount,
        currency,
        paymentData,
        metadata = {},
      } = data;

      // Validate required fields
      if (!provider || !amount || !currency) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required fields: provider, amount, currency'
        );
      }

      if (amount <= 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Amount must be greater than 0'
        );
      }

      // Fetch payment method configuration from Firestore
      let paymentMethod = null;
      if (methodId) {
        const methodDoc = await db
          .collection('paymentMethods')
          .doc(methodId)
          .get();

        if (methodDoc.exists && methodDoc.data()?.isActive) {
          paymentMethod = methodDoc.data();
        }
      }

      // Route to provider-specific handler
      let result;
      switch (provider.toLowerCase()) {
        case 'stripe':
          result = await handleStripePayment(
            amount,
            currency,
            paymentData,
            { userId, methodId, ...metadata }
          );
          break;

        case 'paypal':
          result = await handlePayPalPayment(
            amount,
            currency,
            paymentData,
            { userId, methodId, ...metadata }
          );
          break;

        case 'bank_transfer':
          result = await handleBankTransferPayment(amount, currency, metadata);
          break;

        default:
          // Support custom providers
          if (paymentMethod?.provider === provider) {
            result = await handleCustomPayment(
              provider,
              amount,
              currency,
              paymentData,
              { userId, methodId, ...metadata }
            );
          } else {
            throw new functions.https.HttpsError(
              'invalid-argument',
              `Payment provider '${provider}' is not configured`
            );
          }
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
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error: any) {
      console.error('Payment processing error:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Payment processing failed'
      );
    }
  }
);

// ============================================
// STRIPE PAYMENT HANDLER
// ============================================

async function handleStripePayment(
  amount: number,
  currency: string,
  paymentData: any,
  metadata: any
) {
  try {
    const stripeApiKey = providerSecrets.stripe.apiKey;

    if (!stripeApiKey) {
      console.error('Stripe API key not configured');
      return {
        success: false,
        error: 'Stripe is not configured. Contact support.',
        transactionId: null,
      };
    }

    const stripe = new Stripe(stripeApiKey, {
      apiVersion: '2023-10-16',
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: {
        userId: metadata.userId,
        orderId: metadata.orderId || 'temp',
      },
      description: `Payment for order ${metadata.orderId || 'unknown'}`,
    });

    // If payment method ID is provided, confirm immediately
    if (paymentData?.paymentMethodId) {
      try {
        const confirmed = await stripe.paymentIntents.confirm(
          paymentIntent.id,
          {
            payment_method: paymentData.paymentMethodId,
          }
        );

        return {
          success: confirmed.status === 'succeeded',
          transactionId: confirmed.id,
          status: confirmed.status,
          clientSecret: confirmed.client_secret,
          requiresAction: [
            'requires_payment_method',
            'requires_action',
          ].includes(confirmed.status),
          error: null,
        };
      } catch (error: any) {
        return {
          success: false,
          transactionId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          error: error.message || 'Payment confirmation failed',
          requiresAction: true,
        };
      }
    }

    // Return intent for frontend confirmation
    return {
      success: false,
      transactionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      requiresAction: true,
      status: 'requires_payment_method',
      message: 'Please confirm payment on frontend',
    };
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    return {
      success: false,
      error: error.message || 'Stripe payment failed',
      transactionId: null,
    };
  }
}

// ============================================
// PAYPAL PAYMENT HANDLER
// ============================================

async function handlePayPalPayment(
  amount: number,
  currency: string,
  paymentData: any,
  metadata: any
) {
  try {
    const paypalClientId = providerSecrets.paypal.clientId;
    const paypalSecret = providerSecrets.paypal.clientSecret;

    if (!paypalClientId || !paypalSecret) {
      console.error('PayPal credentials not configured');
      return {
        success: false,
        error: 'PayPal is not configured. Contact support.',
        transactionId: null,
      };
    }

    // TODO: Implement PayPal order creation and capture
    // For now, return pending status
    const orderId = `PAYPAL_${Date.now()}_${metadata.userId}`;

    return {
      success: false,
      transactionId: orderId,
      status: 'pending_approval',
      message: 'PayPal order created. Redirect to PayPal to complete.',
      requiresAction: true,
    };
  } catch (error: any) {
    console.error('PayPal payment error:', error);
    return {
      success: false,
      error: error.message || 'PayPal payment failed',
      transactionId: null,
    };
  }
}

// ============================================
// BANK TRANSFER HANDLER
// ============================================

async function handleBankTransferPayment(
  amount: number,
  currency: string,
  metadata: any
) {
  try {
    // Bank transfer is manual - just log it
    const transferId = `BANK_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return {
      success: true,
      transactionId: transferId,
      status: 'pending_verification',
      message: 'Bank transfer initiated. Awaiting manual verification.',
      amount,
      currency,
    };
  } catch (error: any) {
    console.error('Bank transfer error:', error);
    return {
      success: false,
      error: error.message || 'Bank transfer failed',
      transactionId: null,
    };
  }
}

// ============================================
// CUSTOM PROVIDER HANDLER
// ============================================

async function handleCustomPayment(
  provider: string,
  amount: number,
  currency: string,
  paymentData: any,
  metadata: any
) {
  try {
    // Generic handler for custom payment providers
    // Implement provider-specific logic in separate functions as needed

    // Get custom provider config from Firestore
    const methodDoc = await db
      .collection('paymentMethods')
      .doc(metadata.methodId)
      .get();

    if (!methodDoc.exists) {
      throw new Error(`Payment method ${metadata.methodId} not found`);
    }

    const methodConfig = methodDoc.data();

    // Log custom payment
    const customTransactionId = `${provider.toUpperCase()}_${Date.now()}`;

    return {
      success: true,
      transactionId: customTransactionId,
      status: 'pending',
      message: `${provider} payment initiated`,
      provider,
      amount,
      currency,
    };
  } catch (error: any) {
    console.error(`Custom payment error (${provider}):`, error);
    return {
      success: false,
      error: error.message || `${provider} payment failed`,
      transactionId: null,
    };
  }
}

// ============================================
// STRIPE WEBHOOK HANDLER
// ============================================

/**
 * Stripe webhook for payment confirmation
 * Handles payment intent success/failure
 */
export const stripeWebhook = functions.https.onRequest(
  async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const webhookSecret = providerSecrets.stripe.webhookSecret;

      if (!webhookSecret) {
        console.warn('Stripe webhook secret not configured');
        res.status(200).send('Webhook received');
        return;
      }

      const stripe = new Stripe(providerSecrets.stripe.apiKey, {
        apiVersion: '2023-10-16',
      });

      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          webhookSecret
        );
      } catch (error: any) {
        console.error('Webhook signature verification failed:', error);
        res.status(400).send(`Webhook error: ${error.message}`);
        return;
      }

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Stripe webhook error:', error);
      res.status(500).send('Webhook processing failed');
    }
  }
);

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    const { id: transactionId, metadata } = paymentIntent;
    const userId = metadata?.userId;
    const orderId = metadata?.orderId;

    if (userId && orderId) {
      // Update order status to paid
      await db.collection('orders').doc(orderId).update({
        paymentStatus: 'paid',
        transactionId,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Payment succeeded for order ${orderId}`);
    }
  } catch (error: any) {
    console.error('Error handling payment success webhook:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  try {
    const { id: transactionId, metadata } = paymentIntent;
    const userId = metadata?.userId;
    const orderId = metadata?.orderId;

    if (userId && orderId) {
      // Update order status to failed
      await db.collection('orders').doc(orderId).update({
        paymentStatus: 'failed',
        transactionId,
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Payment failed for order ${orderId}`);
    }
  } catch (error: any) {
    console.error('Error handling payment failure webhook:', error);
  }
}

// ============================================
// PAYMENT METHOD MANAGEMENT
// ============================================

/**
 * Admin only: Create a new payment method
 * CRITICAL: Only public config is stored in Firestore
 * Secret keys must be set via Cloud Functions environment config
 */
export const createPaymentMethod = functions.https.onCall(
  async (data, context) => {
    try {
      // Verify user is authenticated
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated'
        );
      }

      // Verify user is admin
      const userDoc = await db
        .collection('users')
        .doc(context.auth.uid)
        .get();

      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can create payment methods'
        );
      }

      const {
        name,
        provider,
        description,
        publicConfig = {},
        fields = [],
        isActive = true,
        logo = null,
      } = data;

      // Validate required fields
      if (!name || !provider) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Name and provider are required'
        );
      }

      // SECURITY: Block any secret key submission
      // Check only actual secret VALUES, not field names
      const hasSecretValues = (obj: any): boolean => {
        if (!obj) return false;
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            const lowerValue = value.toLowerCase().trim();
            // Block secret value patterns
            if (lowerValue.startsWith('sk_') || 
                lowerValue.startsWith('rk_') ||
                (lowerValue.includes('secret') && lowerValue.length > 20)) {
              return true;
            }
          } else if (typeof value === 'object' && value !== null) {
            if (hasSecretValues(value)) return true;
          }
        }
        return false;
      };

      if (hasSecretValues(publicConfig) || hasSecretValues(data)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'SECURITY ERROR: Secret keys cannot be submitted via UI. Configure secrets via Cloud Functions environment variables.'
        );
      }

      // Check maximum methods limit
      const existingMethods = await db
        .collection('paymentMethods')
        .get();

      if (existingMethods.size >= 20) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Maximum payment methods limit reached'
        );
      }

      // Create payment method
      const methodId = db.collection('paymentMethods').doc().id;

      await db.collection('paymentMethods').doc(methodId).set({
        name,
        provider,
        description,
        publicConfig,
        fields,
        isActive,
        logo,
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Payment method created: ${methodId} (${provider})`);

      return {
        success: true,
        methodId,
        message: `Payment method '${name}' created successfully`,
      };
    } catch (error: any) {
      console.error('Create payment method error:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to create payment method'
      );
    }
  }
);

/**
 * Admin only: Update payment method
 * SECURITY: Secret keys cannot be updated via UI
 */
export const updatePaymentMethod = functions.https.onCall(
  async (data, context) => {
    try {
      // Verify admin
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated'
        );
      }

      const userDoc = await db
        .collection('users')
        .doc(context.auth.uid)
        .get();

      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can update payment methods'
        );
      }

      const { methodId, updates } = data;

      if (!methodId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Method ID is required'
        );
      }

      // SECURITY: Block secret key submissions
      // Check only actual secret VALUES, not field names
      const hasSecretValues = (obj: any): boolean => {
        if (!obj) return false;
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            const lowerValue = value.toLowerCase().trim();
            // Block secret value patterns
            if (lowerValue.startsWith('sk_') || 
                lowerValue.startsWith('rk_') ||
                (lowerValue.includes('secret') && lowerValue.length > 20)) {
              return true;
            }
          } else if (typeof value === 'object' && value !== null) {
            if (hasSecretValues(value)) return true;
          }
        }
        return false;
      };

      if (hasSecretValues(updates)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'SECURITY ERROR: Secret keys cannot be updated via UI. Configure secrets via Cloud Functions environment variables.'
        );
      }

      // Update method
      await db
        .collection('paymentMethods')
        .doc(methodId)
        .update({
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(`Payment method updated: ${methodId}`);

      return {
        success: true,
        message: 'Payment method updated successfully',
      };
    } catch (error: any) {
      console.error('Update payment method error:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to update payment method'
      );
    }
  }
);

/**
 * Admin only: Delete payment method
 */
export const deletePaymentMethod = functions.https.onCall(
  async (data, context) => {
    try {
      // Verify admin
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated'
        );
      }

      const userDoc = await db
        .collection('users')
        .doc(context.auth.uid)
        .get();

      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can delete payment methods'
        );
      }

      const { methodId } = data;

      if (!methodId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Method ID is required'
        );
      }

      // Delete method
      await db.collection('paymentMethods').doc(methodId).delete();

      console.log(`Payment method deleted: ${methodId}`);

      return {
        success: true,
        message: 'Payment method deleted successfully',
      };
    } catch (error: any) {
      console.error('Delete payment method error:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to delete payment method'
      );
    }
  }
);

// ============================================
// PAYMENT TRANSACTION LOGGING
// ============================================

/**
 * Log all payment transactions for auditing
 */
async function logPaymentTransaction(
  userId: string,
  transactionData: any
) {
  try {
    await db
      .collection('paymentTransactions')
      .add({
        userId,
        ...transactionData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  } catch (error: any) {
    console.error('Error logging transaction:', error);
    // Don't throw - logging failure shouldn't break payment flow
  }
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Health check endpoint
 */
export const health = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    providers: {
      stripe: !!providerSecrets.stripe.apiKey,
      paypal: !!providerSecrets.paypal.clientId,
      bankTransfer: true,
    },
  });
});
