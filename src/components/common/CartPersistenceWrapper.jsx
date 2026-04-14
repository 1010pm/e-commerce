/**
 * CartPersistenceWrapper Component
 * Wraps the app content and manages cart persistence
 * This component uses the useCartPersistence hook to sync cart
 * between localStorage, Firestore, and Redux
 */

import React from 'react';
import { useCartPersistence } from '../../hooks/useCartPersistence';

export const CartPersistenceWrapper = ({ children }) => {
  // Initialize cart persistence on mount
  useCartPersistence();

  return <>{children}</>;
};

export default CartPersistenceWrapper;
