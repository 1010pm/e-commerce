/**
 * Categories Redux Slice
 * إدارة حالة الفئات
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoriesService } from '../../services/firestore';
import { handleNetworkError, withTimeout } from '../../utils/errorHandler';

// Initial state
const initialState = {
  categories: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (adminView = false, { rejectWithValue }) => {
    try {
      // Admin view: get all categories (including inactive)
      // Public view: get only active categories
      const serviceMethod = adminView ? categoriesService.getAll : categoriesService.getActive;
      const result = await withTimeout(serviceMethod(), 10000);
      if (result.success) {
        return result.data || [];
      }
      return rejectWithValue(result.error || 'Failed to fetch categories');
    } catch (error) {
      const networkError = handleNetworkError(error);
      return rejectWithValue(networkError.error);
    }
  }
);

// Slice
const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCategories: (state) => {
      state.categories = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCategories } = categoriesSlice.actions;
export default categoriesSlice.reducer;
