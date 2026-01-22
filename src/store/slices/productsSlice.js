/**
 * Products Redux Slice
 * شريحة Redux للمنتجات
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsService } from '../../services/firestore';

// Initial state
const initialState = {
  products: [],
  product: null,
  categories: [],
  loading: false,
  error: null,
  filters: {
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    inStock: undefined,
  },
  pagination: {
    lastDoc: null,
    hasMore: true,
  },
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ filters = {}, pagination = {} }, { rejectWithValue }) => {
    const result = await productsService.getAll(filters, pagination);
    if (result.success) {
      return {
        products: result.data,
        lastDoc: result.lastDoc,
        hasMore: result.data.length === (pagination.limit || 12),
      };
    }
    return rejectWithValue(result.error);
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (id, { rejectWithValue }) => {
    const result = await productsService.getById(id);
    if (result.success) {
      return result.data;
    }
    return rejectWithValue(result.error);
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    const result = await productsService.create(productData);
    if (result.success) {
      return { id: result.id, ...productData };
    }
    return rejectWithValue(result.error);
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    const result = await productsService.update(id, productData);
    if (result.success) {
      return { id, ...productData };
    }
    return rejectWithValue(result.error);
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    const result = await productsService.delete(id);
    if (result.success) {
      return id;
    }
    return rejectWithValue(result.error);
  }
);

// Slice
const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination = { lastDoc: null, hasMore: true };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination = initialState.pagination;
    },
    clearProduct: (state) => {
      state.product = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta.arg.pagination?.lastDoc) {
          state.products = [...state.products, ...action.payload.products];
        } else {
          state.products = action.payload.products;
        }
        state.pagination.lastDoc = action.payload.lastDoc;
        state.pagination.hasMore = action.payload.hasMore;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Product
    builder
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Product
    builder
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Product
    builder
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.product?.id === action.payload.id) {
          state.product = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Product
    builder
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearProduct, clearError } = productsSlice.actions;
export default productsSlice.reducer;

