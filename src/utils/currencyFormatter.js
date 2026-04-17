/**
 * Currency Formatter Utility
 * Professional currency formatting with support for multiple currencies
 * Handles conversion between major and minor units (e.g., baisa and OMR)
 */

import {
  CURRENCY_CONFIG,
  DEFAULT_CURRENCY,
  getCurrencyConfig,
  isCurrencySupported,
} from '../constants/currency';

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: OMR)
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string (e.g., "OMR 12.500" or "12.500 OMR")
 */
export const formatCurrency = (amount, currency = DEFAULT_CURRENCY, options = {}) => {
  try {
    // Validate inputs
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      console.warn(
        `[Currency] Invalid amount: ${amount}. Using 0. Type: ${typeof amount}`
      );
      amount = 0;
    }

    if (!isCurrencySupported(currency)) {
      console.warn(
        `[Currency] Unsupported currency: ${currency}. Falling back to ${DEFAULT_CURRENCY}`
      );
      currency = DEFAULT_CURRENCY;
    }

    const config = getCurrencyConfig(currency);
    const {
      decimals,
      position,
      separator,
      symbol,
      locale,
      fallbackLocale,
    } = config;

    // Merge default options with provided options
    const mergedOptions = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true,
      ...options,
    };

    // Format number using Intl API
    let formattedNumber;
    try {
      formattedNumber = new Intl.NumberFormat(locale, mergedOptions).format(
        amount
      );
    } catch (error) {
      // Fallback if locale not available
      formattedNumber = new Intl.NumberFormat(fallbackLocale, mergedOptions).format(
        amount
      );
    }

    // Build currency string based on position
    const currencyDisplay =
      position === 'before'
        ? `${symbol}${separator}${formattedNumber}`
        : `${formattedNumber}${separator}${symbol}`;

    return currencyDisplay;
  } catch (error) {
    console.error('[Currency] Error formatting currency:', error);
    return `${currency} 0.${'0'.repeat(getCurrencyConfig(currency).decimals)}`;
  }
};

/**
 * Format currency with just the symbol (compact format)
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string (e.g., "$12.50" or "12,50€")
 */
export const formatCurrencyCompact = (amount, currency = DEFAULT_CURRENCY) => {
  try {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      amount = 0;
    }

    if (!isCurrencySupported(currency)) {
      currency = DEFAULT_CURRENCY;
    }

    const config = getCurrencyConfig(currency);
    const { symbol, decimals, locale, fallbackLocale } = config;

    let formattedNumber;
    try {
      formattedNumber = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);
    } catch (error) {
      formattedNumber = new Intl.NumberFormat(fallbackLocale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);
    }

    return `${symbol}${formattedNumber}`;
  } catch (error) {
    console.error('[Currency] Error formatting compact currency:', error);
    return `${currency} 0`;
  }
};

/**
 * Convert from minor units (baisa, cents) to major units (OMR, USD)
 * @param {number} minorUnits - Amount in minor units
 * @param {string} currency - Currency code
 * @returns {number} Amount in major units
 */
export const convertFromMinorUnits = (minorUnits, currency = DEFAULT_CURRENCY) => {
  if (typeof minorUnits !== 'number' || !Number.isFinite(minorUnits)) {
    return 0;
  }

  const config = getCurrencyConfig(currency);
  return minorUnits / config.minorUnits;
};

/**
 * Convert from major units (OMR, USD) to minor units (baisa, cents)
 * @param {number} majorUnits - Amount in major units
 * @param {string} currency - Currency code
 * @returns {number} Amount in minor units (always an integer)
 */
export const convertToMinorUnits = (majorUnits, currency = DEFAULT_CURRENCY) => {
  if (typeof majorUnits !== 'number' || !Number.isFinite(majorUnits)) {
    return 0;
  }

  const config = getCurrencyConfig(currency);
  // Round to ensure integer value
  return Math.round(majorUnits * config.minorUnits);
};

/**
 * Format price range
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @param {string} currency - Currency code
 * @returns {string} Formatted price range (e.g., "OMR 10.000 - OMR 50.000")
 */
export const formatPriceRange = (minPrice, maxPrice, currency = DEFAULT_CURRENCY) => {
  const minFormatted = formatCurrency(minPrice, currency);
  const maxFormatted = formatCurrency(maxPrice, currency);
  return `${minFormatted} - ${maxFormatted}`;
};

/**
 * Add or subtract currency amounts
 * Useful for calculations that need precision
 * @param {number} amount1 - First amount
 * @param {number} amount2 - Second amount
 * @param {string} operation - 'add' or 'subtract'
 * @param {string} currency - Currency code
 * @returns {string} Formatted result
 */
export const calculateCurrencyAmount = (
  amount1,
  amount2,
  operation = 'add',
  currency = DEFAULT_CURRENCY
) => {
  if (
    typeof amount1 !== 'number' ||
    typeof amount2 !== 'number' ||
    !Number.isFinite(amount1) ||
    !Number.isFinite(amount2)
  ) {
    return formatCurrency(0, currency);
  }

  let result;
  if (operation === 'subtract') {
    result = amount1 - amount2;
  } else {
    result = amount1 + amount2;
  }

  // Round to correct decimal places to avoid floating-point errors
  const config = getCurrencyConfig(currency);
  result = Math.round(result * Math.pow(10, config.decimals)) / Math.pow(10, config.decimals);

  return formatCurrency(result, currency);
};

/**
 * Get currency symbol only
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency = DEFAULT_CURRENCY) => {
  const config = getCurrencyConfig(currency);
  return config.symbol;
};

/**
 * Get decimal places for currency
 * @param {string} currency - Currency code
 * @returns {number} Number of decimal places
 */
export const getDecimalPlaces = (currency = DEFAULT_CURRENCY) => {
  const config = getCurrencyConfig(currency);
  return config.decimals;
};

/**
 * Round amount to correct decimal places for currency
 * @param {number} amount - Amount to round
 * @param {string} currency - Currency code
 * @returns {number} Rounded amount
 */
export const roundCurrencyAmount = (amount, currency = DEFAULT_CURRENCY) => {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return 0;
  }

  const config = getCurrencyConfig(currency);
  const multiplier = Math.pow(10, config.decimals);
  return Math.round(amount * multiplier) / multiplier;
};
