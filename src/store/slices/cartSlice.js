/**
 * Cart Redux Slice - Secure Shopping Cart Management
 * Stores cart items securely and clears on logout for privacy
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartService } from '../../services/firestore';

// Helper to save cart to localStorage
const saveCartToLocalStorage = (items) => {
  try {
    localStorage.setItem('ecommerce_cart', JSON.stringify({
      items,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

// Helper to clear cart from localStorage
const clearCartFromLocalStorage = () => {
  try {
    localStorage.removeItem('ecommerce_cart');
  } catch (error) {
    console.error('Error clearing cart from localStorage:', error);
  }
};

// Get initial cart from localStorage
const getInitialState = () => {
  try {
    const stored = localStorage.getItem('ecommerce_cart');
    if (stored) {
      const { items, timestamp } = JSON.parse(stored);
      
      // Check if cart has expired (30 days)
      const daysSinceCreated = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated > 30) {
        clearCartFromLocalStorage();
        return {
          items: [],
          loading: false,
          error: null,
          cartId: null,
        };
      }
      
      return {
        items: items || [],
        loading: false,
        error: null,
        cartId: null,
      };
    }
  } catch (error) {
    console.error('Error getting initial cart state:', error);
  }

  return {
    items: [],
    loading: false,
    error: null,
    cartId: null,
  };
};

// Initial state
const initialState = getInitialState();

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (userId, { rejectWithValue }) => {
    const result = await cartService.get(userId);
    if (result.success) {
      return { cartId: result.data.id, items: result.data.items || [] };
    }
    return rejectWithValue(result.error);
  }
);

export const updateCart = createAsyncThunk(
  'cart/updateCart',
  async ({ cartId, items }, { rejectWithValue }) => {
    const result = await cartService.update(cartId, items);
    if (result.success) {
      return items;
    }
    return rejectWithValue(result.error);
  }
);

// Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || product.image,
          quantity,
          stock: product.stock,
        });
      }
      // Save to localStorage after adding item
      saveCartToLocalStorage(state.items);
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      // Save to localStorage after removing item
      saveCartToLocalStorage(state.items);
    },
    updateItemQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((item) => item.id === id);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((item) => item.id !== id);
        } else {
          item.quantity = quantity;
        }
      }
      // Save to localStorage after updating quantity
      saveCartToLocalStorage(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      // Clear from localStorage
      clearCartFromLocalStorage();
    },
    setCart: (state, action) => {
      state.items = action.payload.items || [];
      state.cartId = action.payload.cartId || null;
      // Save to localStorage
      saveCartToLocalStorage(state.items);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.cartId = action.payload.cartId;
        // Save to localStorage
        saveCartToLocalStorage(state.items);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Cart
    builder
      .addCase(updateCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        // Save to localStorage
        saveCartToLocalStorage(state.items);
      })
      .addCase(updateCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Handle logout from auth slice - clear cart on logout
    builder
      .addCase('auth/logout/fulfilled', (state) => {
        state.items = [];
        state.cartId = null;
        state.loading = false;
        state.error = null;
        // Clear from localStorage when user logs out
        clearCartFromLocalStorage();
      });
  },
});

export const {
  addItem,
  removeItem,
  updateItemQuantity,
  clearCart,
  setCart,
  clearError,
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => {
  return state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
};
export const selectCartItemsCount = (state) => {
  return state.cart.items.reduce((count, item) => count + item.quantity, 0);
};

export default cartSlice.reducer;

