/**
 * Cart Service - Production Ready
 * Manages cart persistence in localStorage and Firestore
 * خدمة سلة التسوق
 */

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.config';

const CART_STORAGE_KEY = 'ecommerce_cart';
const CART_EXPIRY_DAYS = 30;

/**
 * Cart Service
 * Handles local cart storage and Firestore persistence
 */
export const cartService = {
  /**
   * Get cart from localStorage
   * @returns {array} Array of cart items
   */
  getLocalCart: () => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];

      const { items, timestamp } = JSON.parse(stored);

      // Check if cart has expired
      const daysSinceCreated = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated > CART_EXPIRY_DAYS) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
      }

      return items || [];
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
      return [];
    }
  },

  /**
   * Save cart to localStorage
   * @param {array} items - Cart items
   */
  saveLocalCart: (items) => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          items: items || [],
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  },

  /**
   * Clear cart from localStorage
   */
  clearLocalCart: () => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },

  /**
   * Save cart to Firestore (for logged-in users)
   * @param {string} userId - User's Firebase UID
   * @param {array} items - Cart items
   * @returns {Promise<{success: boolean, error: string}>}
   */
  saveToFirestore: async (userId, items) => {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const cartRef = doc(db, 'carts', userId);
      await setDoc(cartRef, {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          image: item.image,
          stock: item.stock,
          category: item.category,
        })),
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error saving cart to Firestore:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get cart from Firestore
   * @param {string} userId - User's Firebase UID
   * @returns {Promise<{success: boolean, data: array, error: string}>}
   */
  getFromFirestore: async (userId) => {
    try {
      if (!userId) {
        return { success: false, data: [], error: 'User ID is required' };
      }

      const cartRef = doc(db, 'carts', userId);
      const cartSnap = await getDoc(cartRef);

      if (!cartSnap.exists()) {
        return { success: true, data: [] };
      }

      return {
        success: true,
        data: cartSnap.data().items || [],
      };
    } catch (error) {
      console.error('Error getting cart from Firestore:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  /**
   * Merge guest cart with user cart
   * Keeps higher quantities if item exists in both carts
   * @param {array} guestCart - Guest cart items
   * @param {array} userCart - User's Firestore cart items
   * @returns {array} Merged cart items
   */
  mergeCart: (guestCart, userCart) => {
    if (!guestCart || guestCart.length === 0) {
      return userCart || [];
    }

    if (!userCart || userCart.length === 0) {
      return guestCart || [];
    }

    const merged = { ...Object.fromEntries(userCart.map((item) => [item.id, item])) };

    guestCart.forEach((guestItem) => {
      if (merged[guestItem.id]) {
        // If item exists in both, keep the higher quantity
        merged[guestItem.id].quantity = Math.max(
          merged[guestItem.id].quantity,
          guestItem.quantity
        );
      } else {
        // Add new items from guest cart
        merged[guestItem.id] = guestItem;
      }
    });

    return Object.values(merged);
  },

  /**
   * Sync cart on login
   * Merges guest cart with user's Firestore cart
   * @param {string} userId - User's Firebase UID
   * @param {array} currentCart - Current cart items (from Redux/localStorage)
   * @returns {Promise<{success: boolean, data: array, error: string}>}
   */
  syncOnLogin: async (userId, currentCart) => {
    try {
      // Get user's existing cart from Firestore
      const firestoreResult = await cartService.getFromFirestore(userId);

      if (!firestoreResult.success) {
        // If error getting Firestore cart, just return current cart
        return { success: true, data: currentCart || [] };
      }

      // Merge carts
      const mergedCart = cartService.mergeCart(currentCart, firestoreResult.data);

      // Save merged cart back to Firestore
      const saveResult = await cartService.saveToFirestore(userId, mergedCart);

      if (!saveResult.success) {
        return { success: false, error: saveResult.error };
      }

      // Also save to localStorage for consistency
      cartService.saveLocalCart(mergedCart);

      return {
        success: true,
        data: mergedCart,
        message: 'Cart synced successfully',
      };
    } catch (error) {
      console.error('Error syncing cart:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Clear cart from Firestore
   * @param {string} userId - User's Firebase UID
   * @returns {Promise<{success: boolean, error: string}>}
   */
  clearFirestore: async (userId) => {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const cartRef = doc(db, 'carts', userId);
      await setDoc(cartRef, {
        items: [],
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error clearing Firestore cart:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Validate cart item
   * @param {object} item - Cart item to validate
   * @returns {object} {valid: boolean, error: string}
   */
  validateItem: (item) => {
    if (!item.id) {
      return { valid: false, error: 'Item ID is required' };
    }

    if (!item.name || item.name.trim() === '') {
      return { valid: false, error: 'Item name is required' };
    }

    if (!Number.isFinite(item.price) || item.price < 0) {
      return { valid: false, error: 'Item price must be a positive number' };
    }

    if (!Number.isFinite(item.quantity) || item.quantity < 1) {
      return { valid: false, error: 'Item quantity must be at least 1' };
    }

    if (item.stock && item.quantity > item.stock) {
      return { valid: false, error: `Item quantity exceeds available stock (${item.stock})` };
    }

    return { valid: true };
  },

  /**
   * Calculate cart totals
   * @param {array} items - Cart items
   * @param {number} taxRate - Tax rate (default 0.08 = 8%)
   * @param {number} shippingCost - Shipping cost (default 10)
   * @param {number} freeShippingThreshold - Free shipping above this amount (default 100)
   * @returns {object} Totals object
   */
  calculateTotals: (items, taxRate = 0.08, shippingCost = 10, freeShippingThreshold = 100) => {
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
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
};

export default cartService;
