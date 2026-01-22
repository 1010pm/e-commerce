/**
 * Validation Functions
 * دوال التحقق من صحة البيانات
 */

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Validate required field
 */
export const validateRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Validate URL
 */
export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate image file
 */
export const validateImageFile = (file, maxSize = 5 * 1024 * 1024) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid image type. Allowed: JPEG, PNG, WebP' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: `Image size must be less than ${maxSize / 1024 / 1024}MB` };
  }
  
  return { valid: true };
};

/**
 * Validate credit card number (Luhn algorithm)
 */
export const validateCreditCard = (cardNumber) => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
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
};

/**
 * Form validation helper
 */
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach((field) => {
    const value = formData[field];
    const fieldRules = rules[field];
    
    // Required validation
    if (fieldRules.required && !validateRequired(value)) {
      errors[field] = fieldRules.requiredMessage || `${field} is required`;
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !fieldRules.required) {
      return;
    }
    
    // Email validation
    if (fieldRules.email && !validateEmail(value)) {
      errors[field] = fieldRules.emailMessage || 'Invalid email address';
      return;
    }
    
    // Password validation
    if (fieldRules.password && !validatePassword(value)) {
      errors[field] = fieldRules.passwordMessage || 'Password must be at least 8 characters with uppercase, lowercase, and number';
      return;
    }
    
    // Phone validation
    if (fieldRules.phone && !validatePhone(value)) {
      errors[field] = fieldRules.phoneMessage || 'Invalid phone number';
      return;
    }
    
    // Min length validation
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = fieldRules.minLengthMessage || `Minimum length is ${fieldRules.minLength}`;
      return;
    }
    
    // Max length validation
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = fieldRules.maxLengthMessage || `Maximum length is ${fieldRules.maxLength}`;
      return;
    }
    
    // Custom validation
    if (fieldRules.custom && !fieldRules.custom(value, formData)) {
      errors[field] = fieldRules.customMessage || 'Invalid value';
      return;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

