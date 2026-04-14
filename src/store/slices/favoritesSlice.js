/**
 * Favorites Redux Slice
 * Manages favorites state with Redux Toolkit
 * شريحة Redux للمفضلات
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { favoritesService } from '../../services/favoritesService';

// Initial state
const initialState = {
  favorites: [], // Array of favorite products
  loading: false, // Loading state for async operations
  error: null, // Error message
  favoriteIds: new Set(), // Quick lookup set for favorite product IDs
  count: 0, // Total favorites count
  lastUpdated: null, // Timestamp of last update
};

// Async thunks
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (userId, { rejectWithValue }) => {
    const result = await favoritesService.getFavorites(userId);
    if (result.success) {
      return result.data;
    }
    return rejectWithValue(result.error);
  }
);

export const addFavorite = createAsyncThunk(
  'favorites/addFavorite',
  async ({ userId, product }, { rejectWithValue }) => {
    const result = await favoritesService.addToFavorites(userId, product);
    if (result.success) {
      // Return the product with the stored data
      return {
        id: product.id,
        name: product.name,
        image: product.images?.[0] || product.image || '/placeholder-product.svg',
        price: Number(product.price) || 0,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        category: product.category || '',
        description: product.description || '',
        rating: product.rating || null,
        inStock: product.inStock !== false,
      };
    }
    return rejectWithValue(result.error);
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/removeFavorite',
  async ({ userId, productId }, { rejectWithValue }) => {
    const result = await favoritesService.removeFromFavorites(userId, productId);
    if (result.success) {
      return productId;
    }
    return rejectWithValue(result.error);
  }
);

export const checkFavoriteStatus = createAsyncThunk(
  'favorites/checkFavoriteStatus',
  async ({ userId, productId }, { rejectWithValue }) => {
    const result = await favoritesService.isFavorite(userId, productId);
    if (result.success) {
      return { productId, isFavorite: result.isFavorite };
    }
    return rejectWithValue(result.error);
  }
);

export const checkBatchFavorites = createAsyncThunk(
  'favorites/checkBatchFavorites',
  async ({ userId, productIds }, { rejectWithValue }) => {
    const result = await favoritesService.checkFavoritesStatus(userId, productIds);
    if (result.success) {
      return result.favoriteIds;
    }
    return rejectWithValue(result.error);
  }
);

export const removeBatchFavorites = createAsyncThunk(
  'favorites/removeBatchFavorites',
  async ({ userId, productIds }, { rejectWithValue }) => {
    const result = await favoritesService.removeFavoritesBatch(userId, productIds);
    if (result.success) {
      return productIds;
    }
    return rejectWithValue(result.error);
  }
);

export const clearFavorites = createAsyncThunk(
  'favorites/clearFavorites',
  async (userId, { rejectWithValue }) => {
    const result = await favoritesService.clearAllFavorites(userId);
    if (result.success) {
      return true;
    }
    return rejectWithValue(result.error);
  }
);

export const fetchFavoritesCount = createAsyncThunk(
  'favorites/fetchFavoritesCount',
  async (userId, { rejectWithValue }) => {
    const result = await favoritesService.getFavoritesCount(userId);
    if (result.success) {
      return result.count;
    }
    return rejectWithValue(result.error);
  }
);

// Slice
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    /**
     * Optimistically add favorite locally (used before Firestore sync)
     */
    optimisticAddFavorite: (state, action) => {
      const product = action.payload;
      const exists = state.favorites.some((fav) => fav.id === product.id);
      
      if (!exists) {
        state.favorites.push(product);
        state.favoriteIds.add(product.id);
        state.count = state.favorites.length;
      }
    },

    /**
     * Optimistically remove favorite locally
     */
    optimisticRemoveFavorite: (state, action) => {
      const productId = action.payload;
      state.favorites = state.favorites.filter((fav) => fav.id !== productId);
      state.favoriteIds.delete(productId);
      state.count = state.favorites.length;
    },

    /**
     * Revert optimistic updates (on error)
     */
    revertOptimisticUpdate: (state) => {
      // Reversion handled by fetchFavorites after error
      state.error = null;
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Clear all favorites state (on logout)
     */
    resetFavorites: () => initialState,
  },

  extraReducers: (builder) => {
    // Fetch Favorites
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
        state.favoriteIds = new Set(action.payload.map((fav) => fav.id));
        state.count = action.payload.length;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch favorites';
      });

    // Add Favorite
    builder
      .addCase(addFavorite.pending, (state) => {
        state.error = null;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        const product = action.payload;
        const exists = state.favorites.some((fav) => fav.id === product.id);
        
        if (!exists) {
          state.favorites.unshift(product); // Add to beginning for recency
          state.favoriteIds.add(product.id);
          state.count = state.favorites.length;
        }
      })
      .addCase(addFavorite.rejected, (state, action) => {
        state.error = action.payload || 'Failed to add favorite';
      });

    // Remove Favorite
    builder
      .addCase(removeFavorite.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        const productId = action.payload;
        state.favorites = state.favorites.filter(
          (fav) => fav.id !== productId
        );
        state.favoriteIds.delete(productId);
        state.count = state.favorites.length;
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.error = action.payload || 'Failed to remove favorite';
      });

    // Check Favorite Status
    builder
      .addCase(checkFavoriteStatus.fulfilled, (state, action) => {
        const { productId, isFavorite } = action.payload;
        if (isFavorite) {
          state.favoriteIds.add(productId);
        } else {
          state.favoriteIds.delete(productId);
        }
      });

    // Check Batch Favorites
    builder
      .addCase(checkBatchFavorites.fulfilled, (state, action) => {
        state.favoriteIds = new Set(action.payload);
      });

    // Remove Batch Favorites
    builder
      .addCase(removeBatchFavorites.pending, (state) => {
        state.error = null;
      })
      .addCase(removeBatchFavorites.fulfilled, (state, action) => {
        const productIds = action.payload;
        state.favorites = state.favorites.filter(
          (fav) => !productIds.includes(fav.id)
        );
        productIds.forEach((id) => state.favoriteIds.delete(id));
        state.count = state.favorites.length;
      })
      .addCase(removeBatchFavorites.rejected, (state, action) => {
        state.error = action.payload || 'Failed to remove favorites';
      });

    // Clear All Favorites
    builder
      .addCase(clearFavorites.pending, (state) => {
        state.error = null;
      })
      .addCase(clearFavorites.fulfilled, (state) => {
        state.favorites = [];
        state.favoriteIds.clear();
        state.count = 0;
      })
      .addCase(clearFavorites.rejected, (state, action) => {
        state.error = action.payload || 'Failed to clear favorites';
      });

    // Fetch Favorites Count
    builder
      .addCase(fetchFavoritesCount.fulfilled, (state, action) => {
        state.count = action.payload;
      });
  },
});

// Selectors
export const selectFavorites = (state) => state.favorites.favorites;
export const selectFavoritesLoading = (state) => state.favorites.loading;
export const selectFavoritesError = (state) => state.favorites.error;
export const selectFavoritesCount = (state) => state.favorites.count;
export const selectFavoriteIds = (state) => state.favorites.favoriteIds;
export const selectIsFavorite = (state, productId) =>
  state.favorites.favoriteIds.has(productId);

// Actions
export const {
  optimisticAddFavorite,
  optimisticRemoveFavorite,
  revertOptimisticUpdate,
  clearError,
  resetFavorites,
} = favoritesSlice.actions;

// Export reducer
export default favoritesSlice.reducer;
