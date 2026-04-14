/**
 * Favorites (Wishlist) Service
 * Enhanced with caching and real-time updates via Firestore
 * خدمة المفضلات
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { logSecurityEvent } from '../utils/securityLogger';

/**
 * Favorites Service
 * Manages user's favorite products with Firestore persistence
 */
export const favoritesService = {
  /**
   * Add product to favorites
   * @param {string} userId - User's Firebase UID
   * @param {object} product - Product object with id, name, image, price
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  addToFavorites: async (userId, product) => {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      if (!product || !product.id) {
        return { success: false, error: 'Valid product data is required' };
      }

      // Reference to user's favorite document
      const favoriteRef = doc(
        db,
        'users',
        userId,
        'favorites',
        product.id
      );

      // Check if already favorited (to prevent duplicates)
      const existingDoc = await getDoc(favoriteRef);
      if (existingDoc.exists()) {
        return { success: true, message: 'Already in favorites' };
      }

      // Add to favorites
      await setDoc(favoriteRef, {
        productId: product.id,
        name: product.name,
        image: product.images?.[0] || product.image || '/placeholder-product.svg',
        price: Number(product.price) || 0,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        category: product.category || '',
        description: product.description || '',
        rating: product.rating || null,
        inStock: product.inStock !== false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Log security event
      logSecurityEvent('favorite_added', {
        userId,
        productId: product.id,
        productName: product.name,
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      
      // Handle specific Firebase errors
      if (error?.code === 'permission-denied') {
        return {
          success: false,
          error: 'You do not have permission to add favorites. Please ensure you are logged in.',
        };
      }
      
      return {
        success: false,
        error: error?.message || 'Failed to add to favorites',
      };
    }
  },

  /**
   * Remove product from favorites
   * @param {string} userId - User's Firebase UID
   * @param {string} productId - Product ID to remove
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  removeFromFavorites: async (userId, productId) => {
    try {
      if (!userId || !productId) {
        return { success: false, error: 'User ID and Product ID are required' };
      }

      const favoriteRef = doc(
        db,
        'users',
        userId,
        'favorites',
        productId
      );

      await deleteDoc(favoriteRef);

      // Log security event
      logSecurityEvent('favorite_removed', {
        userId,
        productId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      
      // Handle specific Firebase errors
      if (error?.code === 'permission-denied') {
        return {
          success: false,
          error: 'You do not have permission to remove favorites. Please ensure you are logged in.',
        };
      }
      
      return {
        success: false,
        error: error?.message || 'Failed to remove from favorites',
      };
    }
  },

  /**
   * Get all favorites for a user
   * @param {string} userId - User's Firebase UID
   * @returns {Promise<{success: boolean, data: array, error?: string}>}
   */
  getFavorites: async (userId) => {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required', data: [] };
      }

      const favoritesRef = collection(db, 'users', userId, 'favorites');
      const q = query(
        favoritesRef,
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const favorites = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, data: favorites };
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch favorites',
        data: [],
      };
    }
  },

  /**
   * Check if a product is in user's favorites
   * @param {string} userId - User's Firebase UID
   * @param {string} productId - Product ID to check
   * @returns {Promise<{success: boolean, isFavorite: boolean, error?: string}>}
   */
  isFavorite: async (userId, productId) => {
    try {
      if (!userId || !productId) {
        return {
          success: false,
          isFavorite: false,
          error: 'User ID and Product ID are required',
        };
      }

      const favoriteRef = doc(
        db,
        'users',
        userId,
        'favorites',
        productId
      );

      const doc_snapshot = await getDoc(favoriteRef);
      return {
        success: true,
        isFavorite: doc_snapshot.exists(),
      };
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return {
        success: false,
        isFavorite: false,
        error: error.message || 'Failed to check favorite status',
      };
    }
  },

  /**
   * Subscribe to real-time favorites updates
   * Returns unsubscribe function to stop listening
   * @param {string} userId - User's Firebase UID
   * @param {function} onUpdate - Callback function with favorites array
   * @param {function} onError - Callback function for errors
   * @returns {function} Unsubscribe function
   */
  subscribeFavorites: (userId, onUpdate, onError = null) => {
    if (!userId) {
      if (onError) onError('User ID is required');
      return () => {}; // Return no-op unsubscribe
    }

    const favoritesRef = collection(db, 'users', userId, 'favorites');
    const q = query(
      favoritesRef,
      orderBy('createdAt', 'desc')
    );

    try {
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const favorites = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          onUpdate(favorites);
        },
        (error) => {
          console.error('Error in favorites real-time subscription:', error);
          if (onError) onError(error.message);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up favorites subscription:', error);
      if (onError) onError(error.message);
      return () => {}; // Return no-op unsubscribe
    }
  },

  /**
   * Check multiple products at once
   * Used for batch checking of favorite status
   * @param {string} userId - User's Firebase UID
   * @param {array} productIds - Array of product IDs
   * @returns {Promise<{success: boolean, favoriteIds: array, error?: string}>}
   */
  checkFavoritesStatus: async (userId, productIds = []) => {
    try {
      if (!userId || !Array.isArray(productIds) || productIds.length === 0) {
        return { success: true, favoriteIds: [] };
      }

      const favoritesRef = collection(db, 'users', userId, 'favorites');
      const q = query(
        favoritesRef,
        where('__name__', 'in', productIds.slice(0, 10)) // Firestore limit: 10 conditions
      );

      const querySnapshot = await getDocs(q);
      const favoriteIds = querySnapshot.docs.map((doc) => doc.id);

      return { success: true, favoriteIds };
    } catch (error) {
      console.error('Error checking favorites status:', error);
      return {
        success: false,
        error: error.message || 'Failed to check favorites status',
        favoriteIds: [],
      };
    }
  },

  /**
   * Remove multiple favorites at once
   * @param {string} userId - User's Firebase UID
   * @param {array} productIds - Array of product IDs to remove
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  removeFavoritesBatch: async (userId, productIds = []) => {
    try {
      if (!userId || !Array.isArray(productIds) || productIds.length === 0) {
        return { success: false, error: 'User ID and product IDs are required' };
      }

      const batch = writeBatch(db);

      productIds.forEach((productId) => {
        const favoriteRef = doc(
          db,
          'users',
          userId,
          'favorites',
          productId
        );
        batch.delete(favoriteRef);
      });

      await batch.commit();

      logSecurityEvent('favorites_batch_removed', {
        userId,
        count: productIds.length,
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing favorites in batch:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove favorites',
      };
    }
  },

  /**
   * Clear all favorites for a user
   * Used when user deletes account or requests data deletion
   * @param {string} userId - User's Firebase UID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  clearAllFavorites: async (userId) => {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const favoritesRef = collection(db, 'users', userId, 'favorites');
      const querySnapshot = await getDocs(favoritesRef);

      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      logSecurityEvent('all_favorites_cleared', {
        userId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error clearing all favorites:', error);
      return {
        success: false,
        error: error.message || 'Failed to clear favorites',
      };
    }
  },

  /**
   * Get favorites count for a user
   * Used for UI badge/indicator
   * @param {string} userId - User's Firebase UID
   * @returns {Promise<{success: boolean, count: number, error?: string}>}
   */
  getFavoritesCount: async (userId) => {
    try {
      if (!userId) {
        return { success: false, count: 0, error: 'User ID is required' };
      }

      const favoritesRef = collection(db, 'users', userId, 'favorites');
      const querySnapshot = await getDocs(favoritesRef);

      return { success: true, count: querySnapshot.size };
    } catch (error) {
      console.error('Error fetching favorites count:', error);
      return {
        success: false,
        count: 0,
        error: error.message || 'Failed to fetch favorites count',
      };
    }
  },
};

// Export for use without Redux
export default favoritesService;
