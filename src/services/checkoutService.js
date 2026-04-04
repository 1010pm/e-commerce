/**
 * Checkout Service - Production Ready
 * Handles checkout flow, validation, and calculations
 * خدمة الدفع
 */

import { validatePhoneNumber, validateAddress } from './userService';

/**
 * Checkout Service
 * Manages checkout validation, calculations, and address handling
 */
const checkoutService = {
  /**
   * Validate shipping address
   * @param {object} address - Address object
   * @returns {object} {valid: boolean, errors: object}
   */
  validateShippingAddress(address) {
    const errors = {};

    if (!address) {
      return { valid: false, errors: { address: 'Address is required' } };
    }

    // Validate required fields
    const requiredFields = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone number',
      addressLine: 'Street address',
      city: 'City',
      country: 'Country',
      zipCode: 'Postal code',
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!address[field] || address[field].trim() === '') {
        errors[field] = `${label} is required`;
      }
    }

    // Validate first name
    if (address.firstName && address.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    // Validate last name
    if (address.lastName && address.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Validate email
    if (address.email && !this.validateEmail(address.email)) {
      errors.email = 'Invalid email address';
    }

    // Validate phone
    if (address.phone && !validatePhoneNumber(address.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    // Validate street address
    if (address.addressLine && (address.addressLine.length < 5 || address.addressLine.length > 100)) {
      errors.addressLine = 'Street address must be 5-100 characters';
    }

    // Validate city
    if (address.city && (address.city.length < 2 || address.city.length > 50)) {
      errors.city = 'City must be 2-50 characters';
    }

    // Validate postal code
    if (address.zipCode && !this.validatePostalCode(address.zipCode)) {
      errors.zipCode = 'Invalid postal code format';
    }

    // Validate state if provided
    if (address.state && address.state.length > 50) {
      errors.state = 'State must not exceed 50 characters';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate email
   * @param {string} email - Email address
   * @returns {boolean}
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate postal code
   * @param {string} postalCode - Postal code
   * @returns {boolean}
   */
  validatePostalCode(postalCode) {
    // Alphanumeric and hyphens, max 20 characters
    const postalCodeRegex = /^[a-zA-Z0-9\-]{3,20}$/;
    return postalCodeRegex.test(postalCode);
  },

  /**
   * Validate payment information
   * @param {object} payment - Payment object
   * @returns {object} {valid: boolean, errors: object}
   */
  validatePayment(payment) {
    const errors = {};

    if (!payment) {
      return { valid: false, errors: { payment: 'Payment information is required' } };
    }

    if (!payment.method || !['card', 'cash', 'bank_transfer'].includes(payment.method)) {
      errors.method = 'Invalid payment method';
    }

    // Validate card payment
    if (payment.method === 'card') {
      if (!payment.cardNumber || !this.validateCardNumber(payment.cardNumber)) {
        errors.cardNumber = 'Invalid card number';
      }

      if (!payment.cardName || payment.cardName.trim() === '') {
        errors.cardName = 'Cardholder name is required';
      }

      if (!payment.cardExpiry || !this.validateCardExpiry(payment.cardExpiry)) {
        errors.cardExpiry = 'Invalid expiry date (use MM/YY format)';
      }

      if (!payment.cardCVC || !this.validateCardCVC(payment.cardCVC)) {
        errors.cardCVC = 'Invalid CVC (must be 3-4 digits)';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate card number using Luhn algorithm
   * @param {string} cardNumber - Card number
   * @returns {boolean}
   */
  validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');

    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  /**
   * Validate card expiry date
   * @param {string} expiry - Expiry date (MM/YY format)
   * @returns {boolean}
   */
  validateCardExpiry(expiry) {
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;

    if (!expiryRegex.test(expiry)) {
      return false;
    }

    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const cardYear = parseInt(year, 10);
    const cardMonth = parseInt(month, 10);

    if (cardYear < currentYear) {
      return false;
    }

    if (cardYear === currentYear && cardMonth < currentMonth) {
      return false;
    }

    return true;
  },

  /**
   * Validate card CVC
   * @param {string} cvc - CVC code
   * @returns {boolean}
   */
  validateCardCVC(cvc) {
    const cvcRegex = /^\d{3,4}$/;
    return cvcRegex.test(cvc.replace(/\D/g, ''));
  },

  /**
   * Calculate order totals
   * @param {array} items - Cart items
   * @param {object} config - Configuration {taxRate, shippingCost, freeShippingThreshold}
   * @returns {object} Totals
   */
  calculateTotals(items, config = {}) {
    const {
      taxRate = 0.08,
      shippingCost = 10,
      freeShippingThreshold = 100,
    } = config;

    const subtotal = items.reduce((total, item) => {
      return total + parseFloat(item.price) * parseInt(item.quantity, 10);
    }, 0);

    const tax = subtotal * taxRate;
    const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost;
    const total = subtotal + tax + shipping;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
    };
  },

  /**
   * Validate complete checkout data
   * @param {object} data - Checkout data
   * @returns {object} {valid: boolean, errors: object}
   */
  validateCheckoutData(data) {
    const errors = {};

    // Validate items
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.items = 'Cart is empty';
    }

    // Validate shipping address
    if (!data.shippingAddress) {
      errors.shippingAddress = 'Shipping address is required';
    } else {
      const addressValidation = this.validateShippingAddress(data.shippingAddress);
      if (!addressValidation.valid) {
        errors.shippingAddress = addressValidation.errors;
      }
    }

    // Validate payment
    if (!data.payment) {
      errors.payment = 'Payment information is required';
    } else {
      const paymentValidation = this.validatePayment(data.payment);
      if (!paymentValidation.valid) {
        errors.payment = paymentValidation.errors;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Format card number for display
   * @param {string} cardNumber - Card number
   * @returns {string} Formatted card number (last 4 digits visible)
   */
  formatCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');
    return `**** **** **** ${cleaned.slice(-4)}`;
  },

  /**
   * Format price for display
   * @param {number} price - Price
   * @returns {string} Formatted price
   */
  formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  },

  /**
   * Prepare order data for submission
   * @param {object} data - Checkout data
   * @param {string} userId - User's Firebase UID
   * @returns {object} Prepared order data
   */
  prepareOrderData(data, userId) {
    return {
      userId,
      items: data.items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity, 10),
        image: item.image,
      })),
      shippingAddress: {
        firstName: data.shippingAddress.firstName,
        lastName: data.shippingAddress.lastName,
        email: data.shippingAddress.email,
        phone: data.shippingAddress.phone,
        addressLine: data.shippingAddress.addressLine,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state || '',
        country: data.shippingAddress.country,
        zipCode: data.shippingAddress.zipCode,
      },
      paymentMethod: data.payment.method,
      paymentStatus: 'pending',
      subtotal: parseFloat(data.totals.subtotal),
      tax: parseFloat(data.totals.tax),
      shipping: parseFloat(data.totals.shipping),
      total: parseFloat(data.totals.total),
      status: 'pending',
      notes: data.orderNotes || '',
    };
  },
};

export default checkoutService;
export { checkoutService };
