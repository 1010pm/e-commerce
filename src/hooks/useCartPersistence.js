/**
 * useCartPersistence Hook
 * Manages cart persistence across localStorage and Firestore
 * خطاف إدارة المثابرة
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCart } from '../store/slices/cartSlice';
import { cartService } from '../services/cartService';

/**
 * Hook to sync cart between localStorage, Firestore, and Redux
 * - Loads cart from localStorage on mount
 * - Syncs with Firestore when user logs in
 * - Merges guest cart with user cart when user logs in
 */
export const useCartPersistence = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const { isAuthenticated, currentUser } = useSelector((state) => state.auth);

  // Load cart from Firestore when user logs in
  useEffect(() => {
    if (isAuthenticated && currentUser?.uid) {
      // Get current guest cart from localStorage
      const guestCart = cartService.getLocalCart();

      // Get user's saved cart from Firestore
      cartService.getFromFirestore(currentUser.uid).then((result) => {
        if (result.success) {
          const userCart = result.data || [];

          // Merge guest cart with user cart
          const mergedCart = cartService.mergeCart(guestCart, userCart);

          // Update Redux state
          if (mergedCart.length > 0) {
            dispatch(setCart({ items: mergedCart, cartId: currentUser.uid }));

            // Save merged cart back to Firestore
            cartService.saveToFirestore(currentUser.uid, mergedCart).catch((error) => {
              console.error('Error saving merged cart to Firestore:', error);
            });
          }
        }
      });
    }
  }, [isAuthenticated, currentUser?.uid, dispatch]);

  // Sync to Firestore whenever cart changes for authenticated users
  useEffect(() => {
    if (isAuthenticated && currentUser?.uid && items.length > 0) {
      // Debounce Firestore saves to avoid too many writes
      const timer = setTimeout(() => {
        cartService.saveToFirestore(currentUser.uid, items).catch((error) => {
          console.error('Error syncing cart to Firestore:', error);
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentUser?.uid, items]);
};

export default useCartPersistence;
