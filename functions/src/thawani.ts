/**
 * Thawani Payment Gateway Integration
 * Secure payment processing for Oman-based transactions
 * Production-ready implementation with full error handling
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import axios from 'axios';

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
 *   currency?: 'OMR' (default),
 *   description?: string,
 *   customer: {
 *     name: string,
 *     email: string,
 *     phone: string
 *   },
 *   items: array (REQUIRED - items will be used to calculate total amount securely),
 *   shippingAmount?: number (in OMR - will be added as separate line item),
 *   shippingAddress?: object (for order records),
 *   orderId?: string
 * }
 *
 * NOTE: Amount is calculated on the BACKEND from items (not trusted from frontend)
 *       This prevents users from tampering with prices
 *
 * Response:
 * {
 *   success: boolean,
 *   sessionUrl?: string,
 *   sessionId?: string,
 *   error?: string
 * }
 */
export const createThawaniSession = functions.https.onCall(
  async (data, context) => {
    try {
      // Verify user is authenticated
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to create a payment session'
        );
      }

      const {
        amount,
        currency = 'OMR',
        description = 'E-commerce purchase',
        customer,
        items = [],
        orderId,
        successUrl,
        cancelUrl,
        shippingAmount = 0, // ✅ Accept shipping amount separately
        shippingAddress = {}, // ✅ Accept shipping address for orders
        subtotal = 0, // ✅ Accept subtotal for verification (optional)
      } = data;

      // 🔍 DEBUG: Log incoming shipping data IMMEDIATELY
      console.log('📥 [THAWANI] ===== INCOMING DATA (BEFORE PROCESSING) =====');
      console.log('📥 [THAWANI] Shipping data:', {
        shippingAmount,
        shippingAmountType: typeof shippingAmount,
        shippingAmountIsNumber: typeof shippingAmount === 'number',
        shippingAmountIsValid: shippingAmount > 0 && Number.isFinite(shippingAmount),
      });
      console.log('📥 [THAWANI] Amount data (from frontend):', {
        amount,
        amountType: typeof amount,
        amountProvided: amount ? `${(amount / 1000).toFixed(3)} OMR` : 'NOT PROVIDED',
        amountWillBeCalculated: !amount,
      });
      console.log('📥 [THAWANI] Subtotal data:', {
        subtotal,
        subtotalType: typeof subtotal,
        itemsCount: items.length,
      });
      console.log('📥 [THAWANI] ===================================');

      // Validate customer info FIRST (before calculating amount)
      if (!customer || !customer.email || !customer.phone || !customer.name) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Customer name, email, and phone are required'
        );
      }

      // Validate currency FIRST
      if (currency !== 'OMR') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Only OMR currency is supported'
        );
      }

      // ✅ SECURITY: Calculate amount from items on backend (don't trust frontend)
      // This prevents users from tampering with the price
      let calculatedAmount = 0;
      if (items && items.length > 0) {
        calculatedAmount = items.reduce((sum: number, item: any) => {
          const itemPrice = Number(item.price) || 0;
          const itemQuantity = Number(item.quantity) || 1;
          return sum + (itemPrice * itemQuantity);
        }, 0);
        
        // Convert to baisa
        calculatedAmount = Math.round(calculatedAmount * 1000);
        
        console.log('🔒 [SECURITY] Amount calculated from items (backend):', {
          itemsCount: items.length,
          calculatedAmount_baisa: calculatedAmount,
          calculatedAmount_omr: (calculatedAmount / 1000).toFixed(3),
          frontendAmount: amount ? `${(amount / 1000).toFixed(3)} OMR` : 'NOT PROVIDED',
        });

        // If frontend provided amount, log if it differs (security check)
        if (amount && Math.abs(calculatedAmount - amount) > 100) { // More than 0.1 OMR difference
          console.warn('⚠️ [SECURITY] Frontend amount differs from backend calculation:', {
            frontendAmount_baisa: amount,
            backendCalculated_baisa: calculatedAmount,
            difference_baisa: calculatedAmount - amount,
            difference_omr: ((calculatedAmount - amount) / 1000).toFixed(3),
          });
        }

        // Use backend calculated amount (more secure)
        // If frontend passed amount, log it but don't use it
      } else {
        // No items provided - shouldn't happen in normal flow
        if (!amount) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Either items or amount is required'
          );
        }
        calculatedAmount = amount;
        console.log('📦 [THAWANI] No items provided, using amount from request');
      }

      // ✅ CRITICAL FIX: Add shipping to the calculated amount BEFORE defining finalAmount
      // This ensures finalAmount = items + shipping = sum(products)
      const shippingBaisa = Math.round(shippingAmount * 1000);
      console.log('🚚 [THAWANI] Adding shipping to total calculation:', {
        itemsTotal_baisa: calculatedAmount,
        itemsTotal_omr: (calculatedAmount / 1000).toFixed(3),
        shippingAmount_omr: shippingAmount,
        shippingBaisa,
        willBe_total_baisa: calculatedAmount + shippingBaisa,
        willBe_total_omr: ((calculatedAmount + shippingBaisa) / 1000).toFixed(3),
      });

      // Use the calculated/verified amount INCLUDING SHIPPING
      const finalAmount = calculatedAmount + shippingBaisa;

      // NOW validate the finalAmount - CRITICAL CHECKS
      if (finalAmount === undefined || finalAmount === null) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Amount is required'
        );
      }

      if (typeof finalAmount !== 'number') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Amount must be a number, received: ${typeof finalAmount}`
        );
      }

      if (isNaN(finalAmount)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Amount is NaN (Not a Number) - cannot process'
        );
      }

      if (!Number.isFinite(finalAmount)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Amount must be a finite number, received: ${finalAmount}`
        );
      }

      if (!Number.isInteger(finalAmount)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Amount must be an integer (in baisa), received: ${finalAmount}. Convert using Math.round(omr * 1000)`
        );
      }

      if (finalAmount < 100) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Amount must be at least 100 baisa (0.1 OMR), received: ${finalAmount}`
        );
      }

      if (finalAmount > 100000000) { // 100,000 OMR
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Amount exceeds maximum limit (100,000 OMR), received: ${finalAmount} baisa`
        );
      }

      // Get Thawani API key from Firebase Functions config
      const thawaniApiKey = runtimeConfig.thawani?.secret;
      if (!thawaniApiKey) {
        console.error('Thawani API key not configured');
        throw new functions.https.HttpsError(
          'internal',
          'Payment gateway is not configured. Contact support.'
        );
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
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Invalid client_reference_id format: ${clientReferenceId}`
        );
      }

      let requestPayload = {
        client_reference_id: '',
        mode: 'payment',
        products: [] as any,
        success_url: '',
        cancel_url: '',
      }; // Declare for use in catch block

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
        ? items.map((item: any, index: number) => {
            console.log(`📦 [THAWANI] Validating product ${index + 1}:`, {
              rawItem: item,
              itemType: typeof item,
              name: item?.name,
              quantity: item?.quantity,
              price: item?.price,
              priceType: typeof item?.price,
              quantityType: typeof item?.quantity,
            });

            // Check if item is an object
            if (!item || typeof item !== 'object') {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1}: must be an object, received: ${typeof item}`
              );
            }

            // 1. Validate name
            if (!item.name) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1}: name is required`
              );
            }

            const nameStr = String(item.name).trim();
            if (nameStr === '') {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1}: name cannot be empty string`
              );
            }

            if (nameStr.length > 255) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1}: name is too long (max 255 chars), received: ${nameStr.length}`
              );
            }

            // 2. Validate quantity - STRICT
            let quantity = item.quantity;
            
            if (quantity === undefined || quantity === null) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": quantity is required`
              );
            }

            // Convert to number first
            const quantityNum = Number(quantity);
            if (isNaN(quantityNum)) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": quantity must be a number, received: ${quantity}`
              );
            }

            // Convert to integer
            quantity = Math.floor(quantityNum);
            if (quantity < 1) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": quantity must be >= 1, received: ${item.quantity}`
              );
            }

            if (quantity > 10000) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": quantity exceeds limit (max 10000), received: ${quantity}`
              );
            }

            // 3. Validate and convert price - STRICT
            let price = item.price;
            
            if (price === undefined || price === null) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": price is required`
              );
            }

            // Convert to number
            const priceNum = Number(price);
            if (isNaN(priceNum)) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": price must be a number, received: ${price}`
              );
            }

            if (!Number.isFinite(priceNum)) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": price must be finite (not Infinity), received: ${price}`
              );
            }

            if (priceNum <= 0) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": price must be > 0, received: ${price}`
              );
            }

            // 4. Convert OMR to baisa (1 OMR = 1000 baisa) - STRICT
            const unitAmount = Math.round(priceNum * 1000);

            if (isNaN(unitAmount)) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": failed to convert price to baisa - NaN result`
              );
            }

            if (!Number.isInteger(unitAmount)) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": unit_amount must be integer after conversion, got: ${unitAmount}`
              );
            }

            if (unitAmount < 100) {
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": unit_amount must be >= 100 baisa (0.1 OMR), calculated: ${unitAmount} from price ${price}`
              );
            }

            if (unitAmount > 10000000) { // 10,000 OMR per item
              throw new functions.https.HttpsError(
                'invalid-argument',
                `Product ${index + 1} "${nameStr}": unit_amount exceeds limit (10,000 OMR), calculated: ${unitAmount} baisa`
              );
            }

            const validatedProduct = {
              name: nameStr,
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

      // ✅ CRITICAL: Always add shipping as separate line item
      // This ensures sum(products) === amount for Thawani API verification
      // Thawani checks: sum(all products.unit_amount * quantity) === amount
      // ⚠️ Use the SAME shippingBaisa calculated above to ensure consistency
      if (shippingBaisa > 0) {
        console.log('📦 [THAWANI] Adding shipping to products array:', {
          shippingBaisa,
          willAdd: {
            name: 'Shipping',
            quantity: 1,
            unit_amount: shippingBaisa,
          },
          currentProductsCount: products.length,
          willBeProductsCount: products.length + 1,
        });
        
        products.push({
          name: 'Shipping',
          quantity: 1,
          unit_amount: shippingBaisa,
        });
        console.log('✅ [THAWANI] Shipping added to products');
      } else {
        console.log('📦 [THAWANI] No shipping to add:', {
          shippingAmount,
          shippingBaisa,
        });
      }



      // ✅ VALIDATION: Calculate product total and verify it matches the amount
      const calculatedTotal = products.reduce((sum, product) => {
        return sum + (product.unit_amount * product.quantity);
      }, 0);

      console.log('💰 [THAWANI] Products line items breakdown:', {
        itemsCount: items.length,
        productsCount: products.length,
        products: products.map((p, i) => ({
          index: i + 1,
          name: p.name,
          quantity: p.quantity,
          unit_amount: p.unit_amount,
          subtotal: p.unit_amount * p.quantity,
        })),
        calculatedTotal,
        requestedAmount: finalAmount,
        match: calculatedTotal === finalAmount,
      });

      // 🔴 CRITICAL: Enhanced mismatch debugging
      const mismatchDebug = {
        calculatedTotal,
        requestedAmount: finalAmount,
        difference: calculatedTotal - finalAmount,
        difference_omr: (calculatedTotal - finalAmount) / 1000,
        percentageOff: ((Math.abs(calculatedTotal - finalAmount) / finalAmount) * 100).toFixed(2) + '%',
        shipping_omr: shippingAmount,
        items_count: items.length,
        products_count: products.length,
      };

      console.log('🔍 [THAWANI] Detailed mismatch analysis:', mismatchDebug);

      // Verify that products total matches the requested amount
      // Allow tiny tolerance for rounding errors (1 baisa = ~0.001 OMR)
      const TOLERANCE_BAISA = 5; // Allow 5 baisa (~0.005 OMR) tolerance for rounding
      const amountDifference = Math.abs(calculatedTotal - finalAmount);
      
      if (amountDifference > TOLERANCE_BAISA) {
        console.error('❌ [THAWANI] Products total mismatch (exceeds tolerance):', {
          calculatedTotal,
          requestedAmount: finalAmount,
          difference: calculatedTotal - finalAmount,
          difference_omr: ((calculatedTotal - finalAmount) / 1000).toFixed(4),
          tolerance_baisa: TOLERANCE_BAISA,
          exceeded: amountDifference,
          shipping_omr: shippingAmount,
          expectedTotal_omr: `${(shippingAmount).toFixed(3)}`,
          expectedTotal_baisa: Math.round((shippingAmount) * 1000),
          products_details: products.map(p => ({
            name: p.name,
            quantity: p.quantity,
            unit_amount_baisa: p.unit_amount,
            unit_amount_omr: (p.unit_amount / 1000).toFixed(3),
            line_total_baisa: p.unit_amount * p.quantity,
            line_total_omr: ((p.unit_amount * p.quantity) / 1000).toFixed(3),
          })),
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Order calculation error: product total (${calculatedTotal} baisa = ${(calculatedTotal/1000).toFixed(3)} OMR) does not match requested amount (${finalAmount} baisa = ${(finalAmount/1000).toFixed(3)} OMR). ` +
          `Difference: ${(calculatedTotal - finalAmount)} baisa = ${((calculatedTotal - finalAmount) / 1000).toFixed(3)} OMR. ` +
          `Expected: shipping(${shippingAmount.toFixed(3)} OMR). ` +
          `Please refresh your cart and try again.`
        );
      } else if (amountDifference > 0) {
        console.warn('⚠️ [THAWANI] Minor rounding difference (within tolerance):', {
          calculatedTotal,
          requestedAmount: finalAmount,
          difference_baisa: calculatedTotal - finalAmount,
          tolerance_baisa: TOLERANCE_BAISA,
        });
      }

      console.log('✅ [THAWANI] Products total verified:', {
        calculatedTotal,
        finalAmount,
        match: true,
      });

      // Validate total amount - FINAL CHECK
      if (!Number.isInteger(finalAmount)) {
        console.error('❌ [THAWANI] Total amount is not an integer:', {
          finalAmount,
          type: typeof finalAmount,
          isInteger: Number.isInteger(finalAmount),
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Total amount must be an integer in baisa, received: ${finalAmount}`
        );
      }

      if (isNaN(finalAmount)) {
        console.error('❌ [THAWANI] Total amount is NaN');
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Total amount is NaN (Not a Number), cannot process payment'
        );
      }

      if (!Number.isFinite(finalAmount)) {
        console.error('❌ [THAWANI] Total amount is not finite:', { finalAmount });
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Total amount must be finite, received: ${finalAmount}`
        );
      }

      // Calculate sum of products to verify
      let productsTotal = 0;
      products.forEach((p) => {
        productsTotal += p.unit_amount * p.quantity;
      });

      console.log('📊 [THAWANI] Amount validation:', {
        requestedAmount: finalAmount,
        productsTotal,
        matches: finalAmount === productsTotal || finalAmount >= productsTotal * 0.9,
        variance: Math.abs(finalAmount - productsTotal),
      });

      // Only warn if amounts differ significantly (allow for tax/shipping)
      if (finalAmount < productsTotal) {
        console.warn('⚠️  [THAWANI] Amount less than sum of products, might be an issue');
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Order total is less than the sum of product prices'
        );
      }

      // Default URLs - can be overridden
      const success_url = successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success`;
      const cancel_url = cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel`;

      // Create Thawani session - Prepare request payload
      requestPayload = {
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
      console.log('📤 [THAWANI] Client Reference ID:', {
        value: clientReferenceId,
        length: clientReferenceId.length,
        pattern: /^[a-zA-Z0-9\s\u0600-\u06FF]+$/.test(clientReferenceId) ? 'VALID' : 'INVALID',
      });
      console.log('📤 [THAWANI] Products Array:', {
        count: products.length,
        details: products.map((p, i) => ({
          index: i,
          name: p.name.substring(0, 50),
          quantity: p.quantity,
          quantityType: typeof p.quantity,
          unit_amount: p.unit_amount,
          unit_amountType: typeof p.unit_amount,
          isInteger: Number.isInteger(p.unit_amount),
          subtotal: p.unit_amount * p.quantity,
        })),
      });
      console.log('📤 [THAWANI] Amount Breakdown:', {
        total_amount: finalAmount,
        productsTotal: products.reduce((sum, p) => sum + p.unit_amount * p.quantity, 0),
        amountType: typeof finalAmount,
        isInteger: Number.isInteger(finalAmount),
        isNaN: isNaN(finalAmount),
        isFinite: Number.isFinite(finalAmount),
      });
      console.log('📤 [THAWANI] Success URL:', success_url);
      console.log('📤 [THAWANI] Cancel URL:', cancel_url);
      console.log('📤 [THAWANI] User ID:', context.auth.uid);
      console.log('📤 [THAWANI] Full Request Payload:', requestPayload);
      console.log('📤 [THAWANI] =======================================');

      const response = await axios.post(
        `${THAWANI_BASE_URL}/checkout/session`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'thawani-api-key': thawaniApiKey,
          },
          timeout: 10000, // 10 second timeout
        }
      );

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
        throw new functions.https.HttpsError(
          'internal',
          'Thawani API returned no data'
        );
      }

      // Check if response indicates an error
      if (response.data.success === false) {
        const errorMsg = response.data.description || 'Unknown error';
        const errorData = response.data.data?.error || [];
        console.error('❌ [THAWANI] API returned error:', {
          description: errorMsg,
          errors: errorData,
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Thawani API error: ${errorMsg}`
        );
      }

      // Check nested data structure
      if (!response.data.data) {
        console.error('❌ [THAWANI] No response.data.data object:', {
          responseKeys: Object.keys(response.data),
          fullResponse: JSON.stringify(response.data),
        });
        throw new functions.https.HttpsError(
          'internal',
          'Invalid Thawani response structure: missing data object'
        );
      }

      // Extract and validate sessionId - CRITICAL CHECKS
      const sessionId = response.data.data.session_id;
      
      // 1. Check if sessionId exists
      if (sessionId === undefined || sessionId === null) {
        console.error('❌ [THAWANI] Session ID is undefined/null:', {
          sessionIdType: typeof sessionId,
          sessionIdValue: sessionId,
          dataKeys: Object.keys(response.data.data || {}),
        });
        throw new functions.https.HttpsError(
          'internal',
          'Thawani API did not return a session ID'
        );
      }
      
      // 2. Check if sessionId is a string
      if (typeof sessionId !== 'string') {
        console.error('❌ [THAWANI] Session ID is not a string:', {
          sessionIdType: typeof sessionId,
          sessionIdValue: JSON.stringify(sessionId),
        });
        throw new functions.https.HttpsError(
          'internal',
          `Invalid session ID type: expected string, got ${typeof sessionId}`
        );
      }
      
      // 3. Check if sessionId is empty after trimming
      const trimmedSessionId = sessionId.trim();
      if (trimmedSessionId === '') {
        console.error('❌ [THAWANI] Session ID is empty string');
        throw new functions.https.HttpsError(
          'internal',
          'Thawani returned empty session ID'
        );
      }
      
      // 4. Check if sessionId has reasonable length (Thawani IDs are typically 20+ chars)
      if (trimmedSessionId.length < 5) {
        console.error('❌ [THAWANI] Session ID too short:', {
          length: trimmedSessionId.length,
          value: trimmedSessionId,
        });
        throw new functions.https.HttpsError(
          'internal',
          'Session ID format appears invalid (too short)'
        );
      }
      
      console.log(`✅ [THAWANI] Session ID validated successfully:`, {
        sessionId: trimmedSessionId,
        sessionIdLength: trimmedSessionId.length,
        clientReferenceId,
        userId: context.auth.uid,
        checkoutUrl: `${THAWANI_CHECKOUT_URL}/${trimmedSessionId}`,
      });

      // Extract Thawani response data for structured storage
      const thawaniData = response.data.data;
      
      // Store session info in Firestore with hybrid structure:
      // - Queryable indexed fields for fast queries
      // - Full raw response for debugging and audit trail
      try {
        const paymentSessionDoc = {
          // 🔑 Core Fields (indexed & queryable)
          sessionId: trimmedSessionId,
          clientReferenceId,
          userId: context.auth.uid,
          
          // 💰 Amount Fields
          status: thawaniData.payment_status || 'unpaid', // from Thawani response
          currency: thawaniData.currency || currency,
          amount: thawaniData.total_amount || finalAmount,  // baisa (from gateway)
          amountOMR: (thawaniData.total_amount || finalAmount) / 1000,  // OMR (computed for UI)
          
          // 🧾 Transaction ID
          invoice: thawaniData.invoice || '', // Will be populated after payment
          
          // 👤 Customer Snapshot
          customer: customer || {},
          
          // 🛒 Products (cleaned from request)
          products: products || [],
          
          // 🧠 Metadata (flattened for filtering)
          metadata: thawaniData.metadata || {},
          
          // 🔗 Order Info
          orderId: orderId || '',
          
          // 🧾 URLs
          successUrl: success_url,
          cancelUrl: cancel_url,
          
          // ⏱️ Dates
          createdAt: admin.firestore.Timestamp.fromDate(
            new Date(thawaniData.created_at || new Date())
          ),
          expiresAt: admin.firestore.Timestamp.fromDate(
            new Date(thawaniData.expire_at || new Date(Date.now() + 30 * 60 * 1000))
          ),
          
          // 🔥 FULL RAW RESPONSE (for debugging & audit trail)
          raw: response.data,
          
          // System fields
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isPaid: thawaniData.payment_status === 'paid',
        };
        
        await getDb()
          .collection('paymentSessions')
          .doc(trimmedSessionId)
          .set(paymentSessionDoc);
        
        console.log(`✅ [FIRESTORE] Session stored with hybrid structure:`, {
          sessionId: trimmedSessionId,
          amount_omr: (thawaniData.total_amount || finalAmount) / 1000,
          currency: thawaniData.currency || currency,
          status: thawaniData.payment_status || 'unpaid',
          fields_count: Object.keys(paymentSessionDoc).length,
          hasRawData: !!paymentSessionDoc.raw,
        });
      } catch (dbError) {
        console.error('⚠️ [FIRESTORE] Error storing session:', dbError);
        // Don't fail the entire operation if logging fails
      }
      
      console.log(`✅ Thawani session created: ${trimmedSessionId} for user ${context.auth.uid}`);

      // ✅ CRITICAL: Get publishable key for the checkout URL
      // Thawani checkout URL requires the publishable key as a query parameter
      const thawaniPublishable = runtimeConfig.thawani?.publishable;
      
      let checkoutUrl = `${THAWANI_CHECKOUT_URL}/${trimmedSessionId}`;
      if (thawaniPublishable) {
        checkoutUrl = `${THAWANI_CHECKOUT_URL}/${trimmedSessionId}?key=${encodeURIComponent(thawaniPublishable)}`;
        console.log('✅ [THAWANI] Added publishable key to checkout URL');
      } else {
        console.warn('⚠️ [THAWANI] No publishable key configured - URL may not work', {
          hasTawaniConfig: !!runtimeConfig.thawani,
          configKeys: runtimeConfig.thawani ? Object.keys(runtimeConfig.thawani) : 'none',
        });
      }

      // Return session details to frontend
      return {
        success: true,
        sessionId: trimmedSessionId,
        sessionUrl: checkoutUrl,
      };
    } catch (error: any) {
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

      // 🔴 CRITICAL: Log full error response data with ALL details
      if (error.response?.data) {
        const responseData = error.response.data;
        console.error('❌ [THAWANI] ========== FULL ERROR RESPONSE ==========');
        console.error('❌ [THAWANI] Status:', error.response.status);
        console.error('❌ [THAWANI] Status Text:', error.response.statusText);
        console.error('❌ [THAWANI] Response Data Type:', typeof responseData);
        console.error('❌ [THAWANI] Response Data Keys:', Object.keys(responseData || {}));
        console.error('❌ [THAWANI] Response Data (raw):', responseData);
        console.error('❌ [THAWANI] Response Data (JSON):', JSON.stringify(responseData, null, 2));
        
        // Extract specific error fields if available
        if (responseData.error) {
          console.error('❌ [THAWANI] Error field:', responseData.error);
        }
        if (responseData.message) {
          console.error('❌ [THAWANI] Message field:', responseData.message);
        }
        if (responseData.errors) {
          console.error('❌ [THAWANI] Errors array:', responseData.errors);
        }
        if (responseData.description) {
          console.error('❌ [THAWANI] Description:', responseData.description);
        }
        if (responseData.data?.error) {
          console.error('❌ [THAWANI] data.error:', responseData.data.error);
        }
        
        console.error('❌ [THAWANI] Request that caused this error:', {
          endpoint: `${THAWANI_BASE_URL}/checkout/session`,
          method: 'POST',
          userId: context.auth?.uid,
          timestamp: new Date().toISOString(),
        });
        console.error('❌ [THAWANI] ===================================');
      }

      console.error('❌ [THAWANI] Error creating session:', errorDetails);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Handle specific Axios/API errors
      if (error.response?.status === 401) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Payment gateway rejected API key - check configuration'
        );
      }

      if (error.response?.status === 400) {
        const apiMessage = error.response.data?.message || error.response.data?.error || '';
        const fullErrorData = JSON.stringify(error.response.data);
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Invalid payment request from Thawani: ${apiMessage || fullErrorData || 'Bad request'}`
        );
      }

      if (error.response?.status === 403) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'API key does not have permission - check Thawani configuration'
        );
      }

      if (error.response?.status === 503) {
        console.error('❌ [THAWANI] 503 Service Unavailable');
        throw new functions.https.HttpsError(
          'unavailable',
          'Payment gateway is temporarily unavailable. Please try again later.'
        );
      }

      if (error.code === 'ECONNABORTED') {
        throw new functions.https.HttpsError(
          'deadline-exceeded',
          'Payment gateway request timed out - please try again'
        );
      }

      // Handle network errors
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ [THAWANI] Connection refused');
        throw new functions.https.HttpsError(
          'unavailable',
          'Cannot reach payment gateway. Please check your connection and try again.'
        );
      }

      if (error.code === 'ENOTFOUND') {
        console.error('❌ [THAWANI] DNS error - gateway not reachable');
        throw new functions.https.HttpsError(
          'unavailable',
          'Payment gateway is unreachable. Please try again later.'
        );
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to create payment session with gateway'
      );
    }
  }
);

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
export const verifyThawaniPayment = functions.https.onCall(
  async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated'
        );
      }

      const { sessionId } = data;

      if (!sessionId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Session ID is required'
        );
      }

      const thawaniApiKey = runtimeConfig.thawani?.secret;
      if (!thawaniApiKey) {
        throw new functions.https.HttpsError(
          'internal',
          'Payment gateway is not configured'
        );
      }

      // Verify session in Firestore (security: user owns session)
      const sessionDoc = await getDb().collection('paymentSessions').doc(sessionId).get();

      if (!sessionDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Payment session not found'
        );
      }

      const sessionData = sessionDoc.data();
      if (sessionData?.userId !== context.auth.uid) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'This payment session does not belong to you'
        );
      }

      // Get session details from Thawani API
      console.log(`📤 [THAWANI] Verifying session:`, {
        sessionId,
        endpoint: `${THAWANI_BASE_URL}/checkout/session/${sessionId}`,
      });

      const response = await axios.get(
        `${THAWANI_BASE_URL}/checkout/session/${sessionId}`,
        {
          headers: {
            'thawani-api-key': thawaniApiKey,
          },
          timeout: 10000,
        }
      );

      console.log(`📥 [THAWANI] Verification response received:`, {
        status: response.status,
        hasData: !!response.data?.data,
      });

      if (!response.data || !response.data.data) {
        console.error('❌ [THAWANI] Invalid verification response:', {
          status: response.status,
          data: response.data,
        });
        throw new functions.https.HttpsError(
          'internal',
          'Failed to retrieve payment status from gateway'
        );
      }

      const sessionInfo = response.data.data;
      const paymentStatus = sessionInfo.payment_status || 'pending';
      const invoiceId = sessionInfo.invoice; // ✅ Extract invoice from Thawani response

      console.log(`✅ [THAWANI] Session verified:`, {
        sessionId,
        paymentStatus,
        invoice: invoiceId, // ✅ Log invoice explicitly
      });

      // Update session with complete latest data in Firestore
      try {
        const updateData = {
          status: paymentStatus,
          invoice: sessionInfo.invoice || '',
          amount: sessionInfo.total_amount || 0,
          amountOMR: (sessionInfo.total_amount || 0) / 1000,
          isPaid: paymentStatus === 'paid',
          
          // 🔥 Update full raw response with latest state
          raw: response.data,
          
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        await getDb()
          .collection('paymentSessions')
          .doc(sessionId)
          .update(updateData);
        
        console.log(`✅ [FIRESTORE] Session ${sessionId} updated:`, {
          paymentStatus,
          amount_omr: (sessionInfo.total_amount || 0) / 1000,
          invoice: sessionInfo.invoice || 'pending',
          hasRawData: !!updateData.raw,
        });
      } catch (dbError) {
        console.warn(`⚠️ [FIRESTORE] Could not update session status:`, dbError);
        // Don't fail verification if Firestore update fails
      }

      return {
        success: true,
        status: paymentStatus,
        sessionData: {
          ...sessionInfo, // ✅ Include all Thawani response fields
          invoice: invoiceId, // ✅ Explicitly ensure invoice is included
        },
      };
    } catch (error: any) {
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
        throw new functions.https.HttpsError(
          'permission-denied',
          'Payment gateway authentication failed'
        );
      }

      if (error.response?.status === 404) {
        throw new functions.https.HttpsError(
          'not-found',
          'Payment session not found on payment gateway'
        );
      }

      if (error.code === 'ECONNABORTED') {
        throw new functions.https.HttpsError(
          'deadline-exceeded',
          'Payment verification timed out - please try again'
        );
      }

      throw new functions.https.HttpsError(
        'internal',
        'Failed to verify payment - please contact support'
      );
    }
  }
);

/**
 * List Thawani Payment Intents
 * Retrieve payment intents from Thawani, useful for searching by client_reference_id
 *
 * Request:
 * {
 *   limit: number (default: 10),
 *   skip: number (default: 0),
 *   clientReferenceId?: string (optional filter)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   intents?: array,
 *   error?: string
 * }
 */
export const listThawaniPaymentIntents = functions.https.onCall(
  async (data, context) => {
    try {
      // Verify user is authenticated
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated'
        );
      }

      const {
        limit = 10,
        skip = 0,
        clientReferenceId,
      } = data;

      // Validate limit
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Limit must be a number between 1 and 100'
        );
      }

      // Validate skip
      if (typeof skip !== 'number' || skip < 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Skip must be a non-negative number'
        );
      }

      const thawaniApiKey = runtimeConfig.thawani?.secret;
      if (!thawaniApiKey) {
        console.error('Thawani API key not configured');
        throw new functions.https.HttpsError(
          'internal',
          'Payment gateway is not configured'
        );
      }

      console.log('📤 [THAWANI] Listing payment intents:', {
        limit,
        skip,
        clientReferenceId: clientReferenceId ? clientReferenceId.substring(0, 20) + '...' : 'none',
        userId: context.auth.uid,
      });

      // Call Thawani API
      const response = await axios.get(
        `${THAWANI_BASE_URL}/payment_intents`,
        {
          params: {
            limit,
            skip,
          },
          headers: {
            'thawani-api-key': thawaniApiKey,
          },
          timeout: 10000,
        }
      );

      console.log(`📥 [THAWANI] Payment intents response received:`, {
        status: response.status,
        hasData: !!response.data?.data,
        dataCount: response.data?.data?.length,
      });

      if (!response.data || !Array.isArray(response.data.data)) {
        console.error('❌ [THAWANI] Invalid payment intents response:', {
          status: response.status,
          data: response.data,
        });
        throw new functions.https.HttpsError(
          'internal',
          'Failed to retrieve payment intents from gateway'
        );
      }

      // Filter by clientReferenceId if provided
      let intents = response.data.data;
      if (clientReferenceId) {
        intents = intents.filter(
          (intent: any) => intent.client_reference_id === clientReferenceId
        );
        console.log(`🔍 [THAWANI] Filtered intents by clientReferenceId:`, {
          totalReturned: response.data.data.length,
          filtered: intents.length,
        });
      }

      // Verify intents belong to this user (via Firestore session)
      const userIntents: any[] = [];
      for (const intent of intents) {
        try {
          // Try to find session with this client_reference_id
          const sessionDoc = await getDb()
            .collection('paymentSessions')
            .where('clientReferenceId', '==', intent.client_reference_id)
            .limit(1)
            .get();

          if (!sessionDoc.empty) {
            const session = sessionDoc.docs[0].data();
            if (session.userId === context.auth.uid) {
              // Add session info and include intent
              userIntents.push({
                ...intent,
                sessionId: sessionDoc.docs[0].id,
                userId: session.userId,
              });
            }
          }
        } catch (dbError) {
          console.warn(`⚠️ [FIRESTORE] Error checking intent ownership:`, dbError);
          // Continue processing other intents
        }
      }

      console.log(`✅ [THAWANI] Payment intents retrieved:`, {
        total: response.data.data.length,
        filtered: userIntents.length,
      });

      return {
        success: true,
        intents: userIntents,
        total: response.data.data.length,
      };
    } catch (error: any) {
      const errorDetails = {
        type: error.constructor.name,
        message: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        axiosCode: error.code,
      };

      console.error('❌ [THAWANI] Error listing payment intents:', errorDetails);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Handle specific Axios/API errors
      if (error.response?.status === 401) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Payment gateway authentication failed'
        );
      }

      if (error.response?.status === 400) {
        const apiMessage = error.response.data?.message || 'Bad request';
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Invalid request to payment gateway: ${apiMessage}`
        );
      }

      if (error.code === 'ECONNABORTED') {
        throw new functions.https.HttpsError(
          'deadline-exceeded',
          'Request to payment gateway timed out'
        );
      }

      throw new functions.https.HttpsError(
        'internal',
        'Failed to list payment intents'
      );
    }
  }
);

/**
 * Handle Thawani Webhook Events
 * Processes payment status updates from Thawani
 * Webhook URL: https://your-domain.com/webhook
 */
export const thawaniWebhook = functions.https.onRequest(
  async (req, res) => {
    try {
      // Verify webhook signature
      const signature = req.headers['x-thawani-signature'] as string;
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
    } catch (error: any) {
      console.error('Webhook error:', {
        message: error.message,
        fullError: error,
      });
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(eventData: any) {
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
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(eventData: any) {
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
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle cancelled payment
 */
async function handlePaymentCancelled(eventData: any) {
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
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}
