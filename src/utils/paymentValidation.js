/**
 * Payment Validation Utility
 * Consolidates payment amount and data validation logic
 * Single source of truth for payment validation across the app
 */

import { CURRENCY_CONFIG } from '../constants/currency';

/**
 * Validate payment amount
 * Ensures amount meets minimum and maximum requirements
 * @param {number} amount - Amount to validate (in currency units)
 * @param {string} currency - Currency code (e.g., 'OMR')
 * @returns {Object} { valid: boolean, error?: string, sanitized?: number }
 */
export const validatePaymentAmount = (amount, currency = 'OMR') => {
  // Convert to number
  const numAmount = parseFloat(amount);

  // Check if valid number
  if (isNaN(numAmount) || numAmount === null) {
    return {
      valid: false,
      error: 'Amount must be a valid number',
    };
  }

  // Get currency config
  const currencyConfig = CURRENCY_CONFIG[currency];
  if (!currencyConfig) {
    return {
      valid: false,
      error: `Unsupported currency: ${currency}`,
    };
  }

  const { min = 0.1, max = 999999.99, decimals = 3 } = currencyConfig;

  // Check minimum
  if (numAmount < min) {
    return {
      valid: false,
      error: `Amount must be at least ${currency} ${min}`,
    };
  }

  // Check maximum
  if (numAmount > max) {
    return {
      valid: false,
      error: `Amount cannot exceed ${currency} ${max}`,
    };
  }

  // Sanitize: ensure correct decimal places
  const sanitized = parseFloat(numAmount.toFixed(decimals));

  return {
    valid: true,
    sanitized,
  };
};

/**
 * Validate order total against payment amount
 * Prevents fraud by ensuring order total matches payment
 * @param {number} orderTotal - Total from order
 * @param {number} paymentAmount - Amount from payment response
 * @param {number} tolerance - Tolerance in percentage (default: 0.1%)
 * @returns {Object} { matches: boolean, difference: number }
 */
export const validateAmountMatch = (orderTotal, paymentAmount, tolerance = 0.1) => {
  const orderNum = parseFloat(orderTotal);
  const paymentNum = parseFloat(paymentAmount);

  const difference = Math.abs(orderNum - paymentNum);
  const percentageDiff = (difference / orderNum) * 100;

  return {
    matches: percentageDiff <= tolerance,
    difference,
    percentageDiff,
  };
};

/**
 * Validate payment data structure
 * Ensures required fields are present
 * @param {Object} paymentData - Payment data to validate
 * @returns {Object} { valid: boolean, errors?: string[] }
 */
export const validatePaymentData = (paymentData) => {
  const errors = [];

  if (!paymentData) {
    errors.push('Payment data is missing');
    return { valid: false, errors };
  }

  // Required fields for Thawani
  const requiredFields = ['session_id', 'invoice', 'order_id'];
  requiredFields.forEach(field => {
    if (!paymentData[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate amount
  if (!paymentData.amount) {
    errors.push('Payment amount is missing');
  } else {
    const amountValidation = validatePaymentAmount(paymentData.amount);
    if (!amountValidation.valid) {
      errors.push(`Invalid amount: ${amountValidation.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

/**
 * Sanitize payment amount for database storage
 * Ensures consistent decimal places and format
 * @param {number|string} amount
 * @param {number} decimals - Number of decimal places (default: 3)
 * @returns {number} Sanitized amount
 */
export const sanitizePaymentAmount = (amount, decimals = 3) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return 0;
  return parseFloat(num.toFixed(decimals));
};

/**
 * Log payment amount validation (for debugging)
 * @param {number} amount
 * @param {string} context - Where validation is happening
 */
export const logPaymentValidation = (amount, context = 'payment') => {
  const validation = validatePaymentAmount(amount);
  if (validation.valid) {
    console.log(
      `✅ [PAYMENT VALIDATION] ${context}: ${validation.sanitized} OMR`
    );
  } else {
    console.error(
      `❌ [PAYMENT VALIDATION] ${context}: ${validation.error}`
    );
  }
  return validation;
};
