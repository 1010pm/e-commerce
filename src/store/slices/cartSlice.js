/**
 * Cart Redux Slice
 * شريحة Redux للسلة
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartService } from '../../services/firestore';

// Initial state
const initialState = {
  items: [],
  loading: false,
  error: null,
  cartId: null,
};

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
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
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
    },
    clearCart: (state) => {
      state.items = [];
    },
    setCart: (state, action) => {
      state.items = action.payload.items || [];
      state.cartId = action.payload.cartId || null;
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
      })
      .addCase(updateCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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

