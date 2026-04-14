/**
 * Redux Store Configuration
 * إعداد Redux Store
 */

import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import authReducer from './slices/authSlice';
import productsReducer from './slices/productsSlice';
import cartReducer from './slices/cartSlice';
import categoriesReducer from './slices/categoriesSlice';
import favoritesReducer from './slices/favoritesSlice';
import cartPersistenceMiddleware from './middleware/cartPersistenceMiddleware';

// Enable Immer to handle Map and Set data structures
enableMapSet();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    categories: categoriesReducer,
    favorites: favoritesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
        ignoredPaths: ['auth.user', 'favorites.favoriteIds'],
      },
    }).concat(cartPersistenceMiddleware),
});

// Export types for TypeScript (if using TypeScript)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

