/**
 * Payment Calculation Helper
 * Ensures correct total calculation for payment processing
 * Prevents mismatches between frontend and backend
 */

/**
 * Calculate total payment amount
 * Includes subtotal, shipping, and tax
 * 
 * @param {number} subtotal - Sum of all items (price * quantity)
 * @param {number} shipping - Shipping cost (default: 0)
 * @param {number} tax - Tax amount (default: 0)
 * @returns {object} { total, totalInBaisa }
 * 
 * @example
 * const { total, totalInBaisa } = calculatePaymentTotal(100, 5, 0)
 * // Returns: { total: 105, totalInBaisa: 105000 }
 */
export const calculatePaymentTotal = (subtotal = 0, shipping = 0, tax = 0) => {
  try {
    // Ensure all inputs are numbers
    const validSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
    const validShipping = Number.isFinite(shipping) ? shipping : 0;
    const validTax = Number.isFinite(tax) ? tax : 0;

    // Ensure all amounts are non-negative
    if (validSubtotal < 0 || validShipping < 0 || validTax < 0) {
      console.error('❌ [CALCULATE] Negative amounts detected:', {
        subtotal: validSubtotal,
        shipping: validShipping,
        tax: validTax,
      });
      throw new Error('All amounts must be non-negative');
    }

    // Calculate total
    const total = validSubtotal + validShipping + validTax;

    // Convert to baisa (1 OMR = 1000 baisa)
    // CRITICAL: Round to integer for payment processing
    const totalInBaisa = Math.round(total * 1000);

    // Validation logs
    console.log('✅ [CALCULATE] Payment total calculated:', {
      subtotal: validSubtotal.toFixed(3),
      shipping: validShipping.toFixed(3),
      tax: validTax.toFixed(3),
      total: total.toFixed(3),
      totalInBaisa,
      totalInBaisaIsInteger: Number.isInteger(totalInBaisa),
      backToOMR: (totalInBaisa / 1000).toFixed(3),
    });

    return {
      total: Math.round(total * 100) / 100, // Round to 2 decimal places
      totalInBaisa,
    };
  } catch (error) {
    console.error('❌ [CALCULATE] Error calculating payment total:', error);
    throw error;
  }
};

/**
 * Validate payment amount
 * Ensures amount is valid for payment processing
 * 
 * @param {number} amountInBaisa - Amount in baisa
 * @returns {object} { valid: boolean, error?: string }
 */
export const validatePaymentAmount = (amountInBaisa) => {
  try {
    // Must be a number
    if (typeof amountInBaisa !== 'number') {
      return {
        valid: false,
        error: `Amount must be a number, received: ${typeof amountInBaisa}`,
      };
    }

    // Must be finite
    if (!Number.isFinite(amountInBaisa)) {
      return {
        valid: false,
        error: `Amount must be finite, received: ${amountInBaisa}`,
      };
    }

    // Must be integer
    if (!Number.isInteger(amountInBaisa)) {
      return {
        valid: false,
        error: `Amount must be an integer (baisa), received: ${amountInBaisa}. Use Math.round(total * 1000)`,
      };
    }

    // Must not be NaN
    if (isNaN(amountInBaisa)) {
      return {
        valid: false,
        error: 'Amount is NaN - check your calculation',
      };
    }

    // Minimum amount: 100 baisa = 0.1 OMR
    if (amountInBaisa < 100) {
      return {
        valid: false,
        error: `Amount must be at least 100 baisa (0.1 OMR), received: ${amountInBaisa} baisa (${(amountInBaisa / 1000).toFixed(3)} OMR)`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('❌ [VALIDATE] Error validating amount:', error);
    return { valid: false, error: error.message };
  }
};

/**
 * Log payment details for debugging
 * Use before sending to payment gateway
 * 
 * @param {object} paymentData - Payment data to log
 */
export const logPaymentDetails = (paymentData) => {
  const {
    subtotal = 0,
    shipping = 0,
    tax = 0,
    total = 0,
    totalInBaisa = 0,
    itemCount = 0,
    customer = {},
  } = paymentData;

  console.group('💳 [PAYMENT] Complete Payment Details');
  console.log('📊 Amount Breakdown:');
  console.table({
    'Subtotal (OMR)': subtotal.toFixed(3),
    'Shipping (OMR)': shipping.toFixed(3),
    'Tax (OMR)': tax.toFixed(3),
    '─────────────': '───────────',
    'Total (OMR)': total.toFixed(3),
    'Total (Baisa)': totalInBaisa,
  });
  console.log(`\n🛍️ Items: ${itemCount}`);
  console.log(`\n👤 Customer: ${customer.name} (${customer.email})`);
  console.log(`\n🔐 Amount to send: ${totalInBaisa} baisa (${(totalInBaisa / 1000).toFixed(3)} OMR)`);
  console.groupEnd();
};

export default {
  calculatePaymentTotal,
  validatePaymentAmount,
  logPaymentDetails,
};
