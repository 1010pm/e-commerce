/**
 * Currency Configuration
 * Centralized currency definitions for global use
 * Supports extensible multi-currency system
 */

export const CURRENCY_CONFIG = {
  OMR: {
    code: 'OMR',
    symbol: 'OMR',
    name: 'Omani Rial',
    decimals: 3,
    position: 'before', // 'before' = "OMR 12.500", 'after' = "12.500 OMR"
    separator: ' ', // Space between currency and amount
    locale: 'en-US', // Use English numerals instead of Arabic-Indic
    fallbackLocale: 'en-US',
    minorUnits: 1000, // 1000 baisa = 1 OMR
    rtl: false,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    position: 'before',
    separator: '',
    locale: 'en-US',
    fallbackLocale: 'en-US',
    minorUnits: 100, // 100 cents = 1 USD
    rtl: false,
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    decimals: 2,
    position: 'after',
    separator: ' ',
    locale: 'ar-AE',
    fallbackLocale: 'en-US',
    minorUnits: 100, // 100 fils = 1 AED
    rtl: true,
  },
  SAR: {
    code: 'SAR',
    symbol: '﷼',
    name: 'Saudi Riyal',
    decimals: 2,
    position: 'after',
    separator: ' ',
    locale: 'ar-SA',
    fallbackLocale: 'en-US',
    minorUnits: 100,
    rtl: true,
  },
};

/**
 * Default currency for the application
 */
export const DEFAULT_CURRENCY = 'OMR';

/**
 * Get currency configuration
 * @param {string} currencyCode - Currency code (e.g., 'OMR', 'USD')
 * @returns {object} Currency configuration object
 */
export const getCurrencyConfig = (currencyCode = DEFAULT_CURRENCY) => {
  return CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG[DEFAULT_CURRENCY];
};

/**
 * Get available currencies
 * @returns {string[]} Array of available currency codes
 */
export const getAvailableCurrencies = () => {
  return Object.keys(CURRENCY_CONFIG);
};

/**
 * Check if currency is supported
 * @param {string} currencyCode - Currency code to check
 * @returns {boolean} True if currency is supported
 */
export const isCurrencySupported = (currencyCode) => {
  return currencyCode in CURRENCY_CONFIG;
};

/**
 * Get currency symbol
 * @param {string} currencyCode - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currencyCode = DEFAULT_CURRENCY) => {
  const config = getCurrencyConfig(currencyCode);
  return config.symbol;
};
