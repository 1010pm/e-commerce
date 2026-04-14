/**
 * Cart Persistence Middleware
 * Automatically saves cart to localStorage and syncs with Firestore
 * السلة ميدلويير للمثابرة
 */

import { cartService } from '../../services/cartService';

const CART_STORAGE_KEY = 'ecommerce_cart';

/**
 * Middleware to persist cart state
 * Saves cart to localStorage whenever it changes
 */
export const cartPersistenceMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // Check if action is a cart action
  if (action.type.startsWith('cart/')) {
    const state = store.getState();
    const { items } = state.cart;

    // Save to localStorage
    cartService.saveLocalCart(items);

    // Optionally sync with Firestore for authenticated users
    const { isAuthenticated, currentUser } = state.auth;
    if (isAuthenticated && currentUser?.uid) {
      // Async save to Firestore (don't await, fire and forget)
      cartService.saveToFirestore(currentUser.uid, items).catch((error) => {
        console.error('Failed to sync cart to Firestore:', error);
      });
    }
  }

  return result;
};

/**
 * Initialize cart from localStorage
 * Call this on app startup to load persisted cart
 */
export const initializeCartFromStorage = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const { items, timestamp } = JSON.parse(stored);

      // Check if cart has expired (30 days)
      const daysSinceCreated = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated > 30) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return null;
      }

      return items || null;
    }
  } catch (error) {
    console.error('Error initializing cart from storage:', error);
  }

  return null;
};

export default cartPersistenceMiddleware;
