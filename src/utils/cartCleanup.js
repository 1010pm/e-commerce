/**
 * Cart Cleanup Utility
 * Consolidates cart clearing logic used in multiple places
 * Single source of truth for post-payment cleanup
 */

/**
 * Complete cart cleanup after successful payment
 * Clears Redux store and localStorage
 * @param {Function} dispatch - Redux dispatch function
 */
export const clearPaymentCart = (dispatch) => {
  if (!dispatch) {
    console.error('❌ [CART CLEANUP] Dispatch function is required');
    return;
  }

  try {
    // Redux store clear
    dispatch({ type: 'cart/clearCart' });
    
    // Alternative if using Redux Toolkit
    // dispatch(clearCart());

    // localStorage cleanup
    localStorage.removeItem('cartItems');
    localStorage.removeItem('cartTimestamp');
    localStorage.removeItem('cartQuantity');

    console.log('✅ [CART CLEANUP] Cart cleared successfully');
  } catch (error) {
    console.error('❌ [CART CLEANUP] Error clearing cart:', error);
  }
};

/**
 * Soft cart cleanup (without Redux dispatch)
 * Use when Redux is not immediately available
 */
export const clearPaymentCartLocalStorage = () => {
  try {
    localStorage.removeItem('cartItems');
    localStorage.removeItem('cartTimestamp');
    localStorage.removeItem('cartQuantity');
    console.log('✅ [CART CLEANUP] LocalStorage cleared');
  } catch (error) {
    console.error('❌ [CART CLEANUP] LocalStorage error:', error);
  }
};

/**
 * Get current cart state before clearing (useful for logging)
 */
export const getCartStateBeforeClear = () => {
  try {
    const items = localStorage.getItem('cartItems');
    const quantity = localStorage.getItem('cartQuantity');
    return {
      items: items ? JSON.parse(items) : null,
      quantity: quantity ? parseInt(quantity) : 0,
    };
  } catch (error) {
    console.error('❌ [CART CLEANUP] Error reading cart state:', error);
    return { items: null, quantity: 0 };
  }
};
