/**
 * Firestore Serializer Utility
 * Converts non-serializable Firestore objects (Timestamps, GeoPoints, etc) to JSON-compatible formats
 * 
 * Problem: Redux requires all state to be serializable (no functions, Timestamps, etc)
 * Solution: Convert Firestore objects to primitives before storing in Redux
 */

/**
 * Convert Firestore Timestamp to Unix timestamp (milliseconds)
 * Use toDate() if available (Firestore Timestamp), otherwise return as-is
 * 
 * @param {*} value - Any value that might be a Firestore Timestamp
 * @returns {number|string|*} - Converted value or original if not a Timestamp
 */
const convertFirestoreValue = (value) => {
  // Check if it's a Firestore Timestamp object
  if (value && typeof value === 'object') {
    // Firestore Timestamp has toDate() and toMillis() methods
    if (typeof value.toMillis === 'function') {
      // Convert to Unix timestamp (milliseconds) - most efficient for JSON
      return value.toMillis();
    }
    
    // Firestore GeoPoint has latitude/longitude
    if (value.latitude !== undefined && value.longitude !== undefined) {
      return {
        latitude: value.latitude,
        longitude: value.longitude,
      };
    }

    // Firestore DocumentReference has _key
    if (value._key) {
      return value.path || value.toString();
    }

    // Recursively convert plain objects
    if (Object.getPrototypeOf(value) === Object.prototype) {
      const converted = {};
      for (const [key, val] of Object.entries(value)) {
        converted[key] = convertFirestoreValue(val);
      }
      return converted;
    }

    // Arrays
    if (Array.isArray(value)) {
      return value.map(convertFirestoreValue);
    }
  }

  // Primitives: return as-is
  return value;
};

/**
 * Serialize Firestore document data for Redux storage
 * Converts all Firestore special types to JSON-serializable primitives
 * 
 * @param {Object} data - Firestore document data
 * @returns {Object} - JSON-serializable data safe for Redux
 */
export const serializeFirestoreData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  return convertFirestoreValue(data);
};

/**
 * Convert Firestore Timestamp back to Date object (for display/formatting)
 * Use this ONLY when you need a Date object (e.g., for .toLocaleDateString())
 * 
 * @param {number|string} value - Unix timestamp (milliseconds) or ISO string
 * @returns {Date|null} - JavaScript Date object or null if invalid
 */
export const convertTimestampToDate = (value) => {
  if (!value) return null;
  
  if (typeof value === 'number') {
    return new Date(value);
  }
  
  if (typeof value === 'string') {
    return new Date(value);
  }
  
  // If it's still a Firestore Timestamp (shouldn't happen after serialization)
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  return null;
};

/**
 * Format serialized Firestore timestamp for display
 * 
 * @param {number|string} timestamp - Unix timestamp (milliseconds) from serialized data
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} - Formatted date string
 */
export const formatSerializedTimestamp = (timestamp, locale = 'en-US') => {
  const date = convertTimestampToDate(timestamp);
  if (!date) return '';
  
  return date.toLocaleDateString(locale);
};

/**
 * Check if value looks like a serialized Firestore timestamp
 * 
 * @param {*} value - Value to check
 * @returns {boolean} - True if value appears to be a serialized timestamp
 */
export const isSerializedTimestamp = (value) => {
  return typeof value === 'number' && value > 0 && value < 9999999999999;
};
