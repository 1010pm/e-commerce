/**
 * Input Sanitization Utility
 * Prevents XSS attacks by sanitizing user inputs
 * 
 * SECURITY: This utility sanitizes user inputs to prevent XSS attacks.
 * For production, consider using DOMPurify library for more robust sanitization.
 */

/**
 * Sanitize HTML string to prevent XSS
 * Removes potentially dangerous HTML tags and attributes
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML string
 */
export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') {
    return '';
  }

  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers like onclick="..."
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '') // Remove event handlers without quotes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:text\/html/gi, '') // Remove data URIs with HTML
    .trim();
};

/**
 * Sanitize plain text input
 * Escapes HTML special characters
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') {
    return '';
  }

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Sanitize URL to prevent javascript: and data: protocol attacks
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL or empty string if invalid
 */
export const sanitizeURL = (url) => {
  if (typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']; // eslint-disable-line no-script-url
  const lowerUrl = trimmed.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // Allow http, https, mailto, tel
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  if (trimmed.includes('://')) {
    const protocol = trimmed.split('://')[0].toLowerCase();
    if (!allowedProtocols.includes(protocol + ':')) {
      return '';
    }
  }

  return trimmed;
};

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return '';
  }

  // Remove any HTML tags and trim
  return email
    .replace(/<[^>]*>/g, '')
    .trim()
    .toLowerCase();
};

/**
 * Sanitize object recursively
 * Sanitizes all string values in an object
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized object
 */
export const sanitizeObject = (obj, options = {}) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const { 
    sanitizeText: useTextSanitizer = true,
    sanitizeHTML: useHTMLSanitizer = false,
    allowedKeys = null, // If provided, only sanitize these keys
  } = options;

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    // Skip if allowedKeys is specified and key is not in list
    if (allowedKeys && !allowedKeys.includes(key)) {
      sanitized[key] = obj[key];
      continue;
    }

    const value = obj[key];

    if (typeof value === 'string') {
      if (useHTMLSanitizer) {
        sanitized[key] = sanitizeHTML(value);
      } else if (useTextSanitizer) {
        sanitized[key] = sanitizeText(value);
      } else {
        sanitized[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, options);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Sanitize form data before submission
 * @param {Object} formData - Form data to sanitize
 * @returns {Object} Sanitized form data
 */
export const sanitizeFormData = (formData) => {
  if (!formData || typeof formData !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const key in formData) {
    if (!formData.hasOwnProperty(key)) continue;

    const value = formData[key];

    if (typeof value === 'string') {
      // Use text sanitizer for form inputs (prevents XSS)
      sanitized[key] = sanitizeText(value.trim());
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, { sanitizeText: true });
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
