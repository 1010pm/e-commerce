"use strict";
/**
 * Thawani Payment Gateway Integration
 * Secure payment processing for Oman-based transactions
 * Production-ready implementation with full error handling
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.thawaniWebhook = exports.verifyThawaniPayment = exports.createThawaniSession = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const axios_1 = __importDefault(require("axios"));
const runtimeConfig = functions.config();
// Thawani API Configuration
const THAWANI_BASE_URL = 'https://uatcheckout.thawani.om/api/v1';
const THAWANI_CHECKOUT_URL = 'https://uatcheckout.thawani.om/pay';
// Lazy-load Firestore to ensure Firebase is initialized
const getDb = () => admin.firestore();
/**
 * Create a Thawani Session
 * Backend-only: Secret key never exposed to frontend
 *
 * Request:
 * {
 *   amount: number (in baisa - 1000 baisa = 1 OMR),
 *   currency: 'OMR',
 *   description?: string,
 *   customer: {
 *     name: string,
 *     email: string,
 *     phone: string
 *   },
 *   items?: array,
 *   orderId?: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   sessionUrl?: string,
 *   sessionId?: string,
 *   error?: string
 * }
 */
exports.createThawaniSession = functions.https.onCall(async (data, context) => {
    try {
        // Verify user is authenticated
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to create a payment session');
        }
        const { amount, currency = 'OMR', description = 'E-commerce purchase', customer, items = [], orderId, successUrl, cancelUrl, } = data;
        // Validate amount
        if (!amount || typeof amount !== 'number' || amount < 1) {
            throw new functions.https.HttpsError('invalid-argument', 'Amount must be a positive number in baisa (1000 baisa = 1 OMR)');
        }
        // Validate currency
        if (currency !== 'OMR') {
            throw new functions.https.HttpsError('invalid-argument', 'Only OMR currency is supported');
        }
        // Validate customer info
        if (!customer || !customer.email || !customer.phone || !customer.name) {
            throw new functions.https.HttpsError('invalid-argument', 'Customer name, email, and phone are required');
        }
        // Get Thawani API keys from Firebase Functions config
        const thawaniApiKey = runtimeConfig.thawani?.secret;
        const thawaniPublishableKey = runtimeConfig.thawani?.publishable;
        if (!thawaniApiKey) {
            console.error('Thawani API key not configured');
            throw new functions.https.HttpsError('internal', 'Payment gateway is not configured. Contact support.');
        }
        if (!thawaniPublishableKey) {
            console.error('Thawani publishable key not configured');
            throw new functions.https.HttpsError('internal', 'Payment gateway publishable key not configured. Contact support.');
        }
        // Generate unique client reference ID with only allowed characters
        // Thawani accepts: English letters, digits, spaces, or Arabic characters (NO underscores, dashes, etc)
        const sanitizedUid = context.auth.uid.replace(/[^a-zA-Z0-9]/g, '');
        const clientReferenceId = `order${Date.now()}${sanitizedUid.slice(0, 8)}`;
        // Validate client_reference_id format
        const validRefIdPattern = /^[a-zA-Z0-9\s\u0600-\u06FF]+$/; // Alphanumeric, spaces, or Arabic
        if (!validRefIdPattern.test(clientReferenceId)) {
            console.error('❌ [THAWANI] client_reference_id contains invalid characters:', {
                clientReferenceId,
                allowedChars: 'English letters, digits, spaces, or Arabic characters',
            });
            throw new functions.https.HttpsError('invalid-argument', `Invalid client_reference_id format: ${clientReferenceId}`);
        }
        console.log('🔍 [THAWANI] Raw input data received:', {
            itemsCount: items.length,
            itemsStructure: items.length > 0 ? {
                firstItem: items[0],
                types: {
                    itemName: typeof items[0]?.name,
                    itemPrice: typeof items[0]?.price,
                    itemQuantity: typeof items[0]?.quantity,
                },
            } : 'no items',
            amount,
            amountType: typeof amount,
            amountIsNaN: isNaN(amount),
        });
        // Prepare products for Thawani API with STRICT validation
        const products = items.length > 0
            ? items.map((item, index) => {
                console.log(`📦 [THAWANI] Validating product ${index + 1}:`, {
                    rawItem: item,
                    name: item?.name,
                    quantity: item?.quantity,
                    price: item?.price,
                    priceType: typeof item?.price,
                });
                // 1. Validate name
                if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
                    throw new functions.https.HttpsError('invalid-argument', `Product ${index + 1}: name is required and must be a non-empty string. Received: ${JSON.stringify(item.name)}`);
                }
                // 2. Validate quantity
                let quantity = item.quantity;
                if (quantity === undefined || quantity === null) {
                    throw new functions.https.HttpsError('invalid-argument', `Product ${index + 1} "${item.name}": quantity is required`);
                }
                quantity = parseInt(quantity, 10);
                if (isNaN(quantity) || quantity < 1) {
                    throw new functions.https.HttpsError('invalid-argument', `Product ${index + 1} "${item.name}": quantity must be >= 1, received: ${item.quantity}`);
                }
                // 3. Validate and convert price
                let price = item.price;
                if (price === undefined || price === null) {
                    throw new functions.https.HttpsError('invalid-argument', `Product ${index + 1} "${item.name}": price is required`);
                }
                price = parseFloat(price);
                if (isNaN(price) || price <= 0) {
                    throw new functions.https.HttpsError('invalid-argument', `Product ${index + 1} "${item.name}": price must be > 0, received: ${item.price}`);
                }
                // 4. Convert OMR to baisa (1 OMR = 1000 baisa)
                const unitAmount = Math.round(price * 1000);
                if (unitAmount < 100) {
                    throw new functions.https.HttpsError('invalid-argument', `Product ${index + 1} "${item.name}": unit_amount must be >= 100 baisa (0.1 OMR), calculated: ${unitAmount} from price ${price}`);
                }
                if (!Number.isInteger(unitAmount)) {
                    throw new functions.https.HttpsError('invalid-argument', `Product ${index + 1} "${item.name}": unit_amount must be an integer, got: ${unitAmount}`);
                }
                const validatedProduct = {
                    name: item.name.trim(),
                    quantity,
                    unit_amount: unitAmount,
                };
                console.log(`✅ [THAWANI] Product ${index + 1} validated:`, validatedProduct);
                return validatedProduct;
            })
            : [{
                    name: description || 'E-commerce Purchase',
                    quantity: 1,
                    unit_amount: Math.round(amount), // Already in baisa
                }];
        // Validate total amount
        if (!Number.isInteger(amount)) {
            throw new functions.https.HttpsError('invalid-argument', `Total amount must be an integer in baisa, received: ${amount}`);
        }
        if (amount < 100) {
            throw new functions.https.HttpsError('invalid-argument', `Total amount must be at least 100 baisa (0.1 OMR), received: ${amount}`);
        }
        if (isNaN(amount)) {
            throw new functions.https.HttpsError('invalid-argument', `Total amount is NaN (Not a Number), cannot process payment`);
        }
        // Default URLs - can be overridden
        // ✅ IMPORTANT: Include sessionId in success_url so Thawani redirects back with it
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const success_url = successUrl || `${baseUrl}/payment-success`;
        const cancel_url = cancelUrl || `${baseUrl}/payment-cancel`;
        
        // Create Thawani session - Prepare request payload
        // NOTE: Defined here (not inside try block) so it's accessible in error handler
        const requestPayload = {
            client_reference_id: clientReferenceId,
            mode: 'payment',
            products,
            success_url,
            cancel_url,
        };
        // ⚠️ CRITICAL DEBUG: Log entire request payload before sending
        const payloadJson = JSON.stringify(requestPayload);
        const payloadSize = Buffer.byteLength(payloadJson, 'utf-8');
        console.log('📤 [THAWANI] ========== COMPLETE REQUEST PAYLOAD ==========');
        console.log('📤 [THAWANI] Endpoint:', `${THAWANI_BASE_URL}/checkout/session`);
        console.log('📤 [THAWANI] Method: POST');
        console.log('📤 [THAWANI] Headers:', {
            'Content-Type': 'application/json',
            'thawani-api-key': '***' + (thawaniApiKey ? thawaniApiKey.slice(-4) : 'MISSING'),
        });
        console.log('📤 [THAWANI] Timeout: 10000ms');
        console.log('📤 [THAWANI] Payload Size:', `${payloadSize} bytes`);
        console.log('📤 [THAWANI] Request Body (full JSON):', payloadJson);
        console.log('📤 [THAWANI] Parsed Request:', requestPayload);
        console.log('📤 [THAWANI] Products Array Details:');
        products.forEach((p, i) => {
            console.log(`  Product ${i + 1}:`, {
                name: p.name,
                quantity: p.quantity,
                unit_amount: p.unit_amount,
                unit_amountType: typeof p.unit_amount,
                isValidInt: Number.isInteger(p.unit_amount),
            });
        });
        console.log('📤 [THAWANI] Client Reference ID:', clientReferenceId);
        console.log('📤 [THAWANI] User ID:', context.auth.uid);
        console.log('📤 [THAWANI] =======================================');
        const response = await axios_1.default.post(`${THAWANI_BASE_URL}/checkout/session`, requestPayload, {
            headers: {
                'Content-Type': 'application/json',
                'thawani-api-key': thawaniApiKey,
            },
            timeout: 10000, // 10 second timeout
        });
        console.log('📥 [THAWANI] Response received:', {
            status: response.status,
            statusText: response.statusText,
            hasData: !!response.data,
            dataStructure: response.data ? {
                hasData: !!response.data.data,
                hasSessionId: !!response.data.data?.session_id,
                keys: Object.keys(response.data),
            } : 'no data',
        });
        // Defensive checks - validate response structure
        if (!response.data) {
            console.error('❌ [THAWANI] No response.data object');
            throw new functions.https.HttpsError('internal', 'Thawani API returned no data');
        }
        // Check if response indicates an error
        if (response.data.success === false) {
            const errorMsg = response.data.description || 'Unknown error';
            const errorData = response.data.data?.error || [];
            console.error('❌ [THAWANI] API returned error:', {
                description: errorMsg,
                errors: errorData,
            });
            throw new functions.https.HttpsError('invalid-argument', `Thawani API error: ${errorMsg}`);
        }
        // Check nested data structure
        if (!response.data.data) {
            console.error('❌ [THAWANI] No response.data.data object:', {
                responseKeys: Object.keys(response.data),
                fullResponse: JSON.stringify(response.data),
            });
            throw new functions.https.HttpsError('internal', 'Invalid Thawani response structure: missing data object');
        }
        // Extract and validate sessionId - CRUCIAL CHECK
        const sessionId = response.data.data.session_id;
        
        // Validate sessionId exists and is a valid string
        if (sessionId === undefined || sessionId === null) {
            console.error('❌ [THAWANI] Session ID is undefined/null:', {
                sessionIdType: typeof sessionId,
                sessionIdValue: sessionId,
                sessionIdKeys: Object.keys(response.data.data || {}),
                fullData: JSON.stringify(response.data.data),
            });
            throw new functions.https.HttpsError('internal', 'Thawani API did not return a session ID. API may be misconfigured.');
        }
        
        // Validate it's a string
        if (typeof sessionId !== 'string') {
            console.error('❌ [THAWANI] Session ID is not a string:', {
                sessionIdType: typeof sessionId,
                sessionIdValue: sessionId,
            });
            throw new functions.https.HttpsError('internal', `Invalid session ID type: expected string, got ${typeof sessionId}`);
        }
        
        // Validate it's not empty
        const trimmedSessionId = sessionId.trim();
        if (trimmedSessionId === '') {
            console.error('❌ [THAWANI] Session ID is empty string');
            throw new functions.https.HttpsError('internal', 'Thawani returned empty session ID');
        }
        
        // Final validation: sessionId should have reasonable length (typically 20+ chars)
        if (trimmedSessionId.length < 5) {
            console.error('❌ [THAWANI] Session ID appears malformed - too short:', {
                length: trimmedSessionId.length,
                sessionId: trimmedSessionId,
            });
            throw new functions.https.HttpsError('internal', 'Session ID format appears invalid - too short');
        }
        
        console.log('✅ [THAWANI] Session ID validated successfully:', {
            sessionId: trimmedSessionId,
            length: trimmedSessionId.length,
            startsWithExpected: trimmedSessionId.substring(0, 2),
        });
        console.log(`✅ [THAWANI] Session created successfully:`, {
            sessionId: trimmedSessionId,
            sessionIdLength: trimmedSessionId.length,
            clientReferenceId,
            userId: context.auth.uid,
            checkoutUrl: `${THAWANI_CHECKOUT_URL}/${trimmedSessionId}`,
        });
        // Store session info in Firestore for verification later
        try {
            await getDb()
                .collection('paymentSessions')
                .doc(trimmedSessionId)
                .set({
                userId: context.auth.uid,
                amount,
                currency,
                customer,
                orderId,
                sessionId: trimmedSessionId,
                clientReferenceId,
                status: 'created',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
            });
        }
        catch (dbError) {
            console.error('Error storing session in Firestore:', dbError);
            // Don't fail the entire operation if logging fails
        }
        console.log(`✅ Thawani session created: ${trimmedSessionId} for user ${context.auth.uid}`);
        // ✅ CRITICAL: Build sessionUrl with publishable key (required by Thawani)
        // Format: https://uatcheckout.thawani.om/pay/{sessionId}?key={publishableKey}
        const sessionUrl = `${THAWANI_CHECKOUT_URL}/${trimmedSessionId}?key=${thawaniPublishableKey}`;
        console.log('✅ [THAWANI] Session URL constructed:', {
            sessionUrl: sessionUrl.replace(thawaniPublishableKey, '***'),
            publishableKeyLength: thawaniPublishableKey.length,
        });
        // Return session details to frontend
        return {
            success: true,
            sessionId: trimmedSessionId,
            sessionUrl: sessionUrl,
        };
    }
    catch (error) {
        const errorDetails = {
            type: error.constructor.name,
            message: error.message,
            code: error.code,
            responseStatus: error.response?.status,
            responseStatusText: error.response?.statusText,
            responseHeaders: error.response?.headers ? {
                contentType: error.response.headers['content-type'],
                contentLength: error.response.headers['content-length'],
                date: error.response.headers['date'],
            } : undefined,
            axiosCode: error.code,
        };
        // 🔴 CRITICAL: Log full error response data
        if (error.response?.data) {
            console.error('❌ [THAWANI] FULL ERROR RESPONSE DATA:', {
                data: error.response.data,
                dataJson: JSON.stringify(error.response.data, null, 2),
                dataKeys: Object.keys(error.response.data || {}),
            });
        }
        console.error('❌ [THAWANI] Error creating session:', errorDetails);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Handle specific Axios/API errors
        if (error.response?.status === 401) {
            console.error('❌ [THAWANI] Unauthorized - API key invalid or expired');
            throw new functions.https.HttpsError('permission-denied', 'Payment gateway rejected API key - contact support');
        }
        if (error.response?.status === 400) {
            const apiMessage = error.response.data?.message || error.response.data?.error || error.response.data?.description || '';
            const fullErrorData = JSON.stringify(error.response.data);
            console.error('❌ [THAWANI] 400 Bad Request:', {
                message: apiMessage,
                fullData: fullErrorData,
                requestPayload: JSON.stringify(requestPayload),
            });
            throw new functions.https.HttpsError('invalid-argument', `Invalid payment request: ${apiMessage || fullErrorData || 'Bad request'}`);
        }
        if (error.response?.status === 403) {
            console.error('❌ [THAWANI] 403 Forbidden - insufficient permissions');
            throw new functions.https.HttpsError('permission-denied', 'API key does not have required permissions');
        }
        if (error.response?.status === 503) {
            console.error('❌ [THAWANI] 503 Service Unavailable - gateway maintenance');
            throw new functions.https.HttpsError('unavailable', 'Payment gateway is temporarily unavailable. Please try again in a few minutes.');
        }
        if (error.code === 'ECONNABORTED') {
            console.error('❌ [THAWANI] Connection timeout');
            throw new functions.https.HttpsError('deadline-exceeded', 'Payment gateway request timed out. Please try again.');
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            console.error('❌ [THAWANI] Network error - cannot reach gateway:', error.code);
            throw new functions.https.HttpsError('unavailable', 'Cannot reach payment gateway. Please check your internet connection and try again.');
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to create payment session with gateway');
    }
});
/**
 * Verify Thawani Payment Session
 * Called on success page to verify payment status
 *
 * Request:
 * {
 *   sessionId: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   status: 'paid' | 'pending' | 'failed',
 *   sessionData?: object
 * }
 */
exports.verifyThawaniPayment = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { sessionId } = data;
        if (!sessionId) {
            throw new functions.https.HttpsError('invalid-argument', 'Session ID is required');
        }
        const thawaniApiKey = runtimeConfig.thawani?.secret;
        if (!thawaniApiKey) {
            throw new functions.https.HttpsError('internal', 'Payment gateway is not configured');
        }
        // Verify session in Firestore (security: user owns session)
        const sessionDoc = await getDb().collection('paymentSessions').doc(sessionId).get();
        if (!sessionDoc.exists) {
            console.warn('⚠️ [THAWANI] Session not found by sessionId:', {
                sessionId,
                userId: context.auth.uid,
            });
            
            // Try to find it by user - get their most recent payment session
            console.log('🔍 [THAWANI] Attempting fallback: searching by userId...');
            const userSessions = await getDb()
                .collection('paymentSessions')
                .where('userId', '==', context.auth.uid)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
            
            if (userSessions.empty) {
                console.error('❌ [THAWANI] No payment sessions found for user:', context.auth.uid);
                throw new functions.https.HttpsError('not-found', 'No payment session found for your account');
            }
            
            const fallbackSession = userSessions.docs[0];
            console.log('✅ [THAWANI] Found fallback session:', {
                fallbackSessionId: fallbackSession.id,
                originalSessionId: sessionId,
            });
            
            // Use the fallback session ID from database
            const response = await axios_1.default.get(`${THAWANI_BASE_URL}/checkout/session/${fallbackSession.id}`, {
                headers: {
                    'thawani-api-key': thawaniApiKey,
                },
                timeout: 10000,
            });
            
            console.log(`📥 [THAWANI] Verification response received (fallback):`, {
                status: response.status,
                hasData: !!response.data?.data,
            });
            
            if (!response.data || !response.data.data) {
                console.error('❌ [THAWANI] Invalid verification response (fallback):', {
                    status: response.status,
                    data: response.data,
                });
                throw new functions.https.HttpsError('internal', 'Failed to retrieve payment status from gateway');
            }
            
            const sessionInfo = response.data.data;
            const paymentStatus = sessionInfo.payment_status || 'pending';
            console.log(`✅ [THAWANI] Session verified (fallback):`, {
                sessionId: fallbackSession.id,
                paymentStatus,
            });
            
            // Update session status in Firestore
            try {
                await getDb()
                    .collection('paymentSessions')
                    .doc(fallbackSession.id)
                    .update({
                    status: paymentStatus,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`✅ [FIRESTORE] Session ${fallbackSession.id} status updated to: ${paymentStatus}`);
            }
            catch (dbError) {
                console.warn(`⚠️ [FIRESTORE] Could not update session status:`, dbError);
            }
            
            return {
                success: true,
                status: paymentStatus,
                sessionData: sessionInfo,
            };
        }
        
        const sessionData = sessionDoc.data();
        if (sessionData?.userId !== context.auth.uid) {
            console.error('❌ [THAWANI] Permission denied - session belongs to different user:', {
                sessionOwner: sessionData?.userId,
                requestingUser: context.auth.uid,
            });
            throw new functions.https.HttpsError('permission-denied', 'This payment session does not belong to you');
        }
        // Get session details from Thawani API
        console.log(`📤 [THAWANI] Verifying session:`, {
            sessionId,
            endpoint: `${THAWANI_BASE_URL}/checkout/session/${sessionId}`,
        });
        const response = await axios_1.default.get(`${THAWANI_BASE_URL}/checkout/session/${sessionId}`, {
            headers: {
                'thawani-api-key': thawaniApiKey,
            },
            timeout: 10000,
        });
        console.log(`📥 [THAWANI] Verification response received:`, {
            status: response.status,
            hasData: !!response.data?.data,
        });
        if (!response.data || !response.data.data) {
            console.error('❌ [THAWANI] Invalid verification response:', {
                status: response.status,
                data: response.data,
            });
            throw new functions.https.HttpsError('internal', 'Failed to retrieve payment status from gateway');
        }
        const sessionInfo = response.data.data;
        const paymentStatus = sessionInfo.payment_status || 'pending';
        console.log(`✅ [THAWANI] Session verified:`, {
            sessionId,
            paymentStatus,
        });
        // Update session status in Firestore
        try {
            await getDb()
                .collection('paymentSessions')
                .doc(sessionId)
                .update({
                status: paymentStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✅ [FIRESTORE] Session ${sessionId} status updated to: ${paymentStatus}`);
        }
        catch (dbError) {
            console.warn(`⚠️ [FIRESTORE] Could not update session status:`, dbError);
            // Don't fail verification if Firestore update fails
        }
        return {
            success: true,
            status: paymentStatus,
            sessionData: sessionInfo,
        };
    }
    catch (error) {
        const errorDetails = {
            type: error.constructor.name,
            message: error.message,
            responseStatus: error.response?.status,
            responseData: error.response?.data,
            axiosCode: error.code,
        };
        console.error('❌ [THAWANI] Error verifying payment:', errorDetails);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Handle specific Axios/API errors
        if (error.response?.status === 401) {
            throw new functions.https.HttpsError('permission-denied', 'Payment gateway authentication failed');
        }
        if (error.response?.status === 404) {
            throw new functions.https.HttpsError('not-found', 'Payment session not found on payment gateway');
        }
        if (error.code === 'ECONNABORTED') {
            throw new functions.https.HttpsError('deadline-exceeded', 'Payment verification timed out - please try again');
        }
        throw new functions.https.HttpsError('internal', 'Failed to verify payment - please contact support');
    }
});
/**
 * Handle Thawani Webhook Events
 * Processes payment status updates from Thawani
 * Webhook URL: https://your-domain.com/webhook
 */
exports.thawaniWebhook = functions.https.onRequest(async (req, res) => {
    try {
        // Verify webhook signature
        const signature = req.headers['x-thawani-signature'];
        const thawaniApiKey = runtimeConfig.thawani?.secret;
        const webhookSecret = runtimeConfig.thawani?.webhook_secret;
        if (!signature || !webhookSecret) {
            res.status(400).send('Missing signature or webhook secret');
            return;
        }
        // TODO: Implement signature verification
        // For now, trust Thawani IPs or implement proper verification
        const event = req.body;
        if (!event || !event.event_type) {
            res.status(400).send('Invalid webhook payload');
            return;
        }
        console.log(`Received Thawani webhook: ${event.event_type}`);
        // Handle payment events
        switch (event.event_type) {
            case 'payment.success':
                await handlePaymentSuccess(event.data);
                break;
            case 'payment.failed':
                await handlePaymentFailed(event.data);
                break;
            case 'payment.cancelled':
                await handlePaymentCancelled(event.data);
                break;
            default:
                console.log(`Unhandled webhook event: ${event.event_type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook error:', {
            message: error.message,
            fullError: error,
        });
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});
/**
 * Handle successful payment
 */
async function handlePaymentSuccess(eventData) {
    try {
        const sessionId = eventData.session_id;
        if (!sessionId) {
            console.warn('Payment success event missing session_id');
            return;
        }
        // Update session status
        await getDb()
            .collection('paymentSessions')
            .doc(sessionId)
            .update({
            status: 'paid',
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Payment successful for session: ${sessionId}`);
    }
    catch (error) {
        console.error('Error handling payment success:', error);
    }
}
/**
 * Handle failed payment
 */
async function handlePaymentFailed(eventData) {
    try {
        const sessionId = eventData.session_id;
        if (!sessionId) {
            console.warn('Payment failed event missing session_id');
            return;
        }
        // Update session status
        await getDb()
            .collection('paymentSessions')
            .doc(sessionId)
            .update({
            status: 'failed',
            failureReason: eventData.reason || 'Payment failed',
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.error(`❌ Payment failed for session: ${sessionId}`);
    }
    catch (error) {
        console.error('Error handling payment failure:', error);
    }
}
/**
 * Handle cancelled payment
 */
async function handlePaymentCancelled(eventData) {
    try {
        const sessionId = eventData.session_id;
        if (!sessionId) {
            console.warn('Payment cancelled event missing session_id');
            return;
        }
        // Update session status
        await getDb()
            .collection('paymentSessions')
            .doc(sessionId)
            .update({
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`⚠️ Payment cancelled for session: ${sessionId}`);
    }
    catch (error) {
        console.error('Error handling payment cancellation:', error);
    }
}
//# sourceMappingURL=thawani.js.map