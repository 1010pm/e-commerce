/**
 * Environment Variable Validation
 * Validates required environment variables on app startup
 */

/**
 * Required environment variables for production
 */
const REQUIRED_ENV_VARS = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
];

/**
 * Validate environment variables
 * @returns {Object} Validation result
 */
export const validateEnvironment = () => {
  const missing = [];
  const warnings = [];

  // Check required variables
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missing.push(varName);
    }
  });

  // Check for placeholder values (common mistake)
  REQUIRED_ENV_VARS.forEach(varName => {
    const value = process.env[varName];
    if (value && (
      value.includes('YOUR_') ||
      value.includes('your_') ||
      value.includes('example') ||
      value.includes('placeholder')
    )) {
      warnings.push(`${varName} appears to be a placeholder value`);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
};

/**
 * Log environment validation results
 * Only logs in development, fails silently in production to avoid exposing config
 */
export const logEnvironmentValidation = () => {
  if (process.env.NODE_ENV === 'development') {
    const validation = validateEnvironment();
    
    if (!validation.valid) {
      console.warn('⚠️ Missing required environment variables:', validation.missing);
      console.warn('Please check your .env.local file');
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Environment variable warnings:', validation.warnings);
    }
    
    if (validation.valid && validation.warnings.length === 0) {
      console.log('✅ Environment variables validated');
    }
  }
};

/**
 * Get environment info (safe for logging)
 */
export const getEnvironmentInfo = () => {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasFirebaseConfig: !!process.env.REACT_APP_FIREBASE_API_KEY,
    // Don't expose actual values
  };
};
