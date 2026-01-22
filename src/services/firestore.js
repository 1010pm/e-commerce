/**
 * Firestore Database Service
 * خدمة قاعدة البيانات Firestore
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

/**
 * Products Service
 */
export const productsService = {
  // Get all products
  getAll: async (filters = {}, pagination = {}) => {
    try {
      let q = collection(db, 'products');
      
      // Apply filters
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      
      if (filters.inStock !== undefined) {
        q = query(q, where('inStock', '==', filters.inStock));
      }
      
      // Apply ordering
      if (filters.sortBy) {
        q = query(q, orderBy(filters.sortBy, filters.sortOrder || 'desc'));
      } else {
        q = query(q, orderBy('createdAt', 'desc'));
      }
      
      // Apply pagination
      if (pagination.lastDoc) {
        q = query(q, startAfter(pagination.lastDoc));
      }
      
      if (pagination.limit) {
        q = query(q, limit(pagination.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const products = [];
      
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return { success: true, data: products, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
    } catch (error) {
      console.error('Get products error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single product
  getById: async (id) => {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      }
      
      return { success: false, error: 'Product not found' };
    } catch (error) {
      console.error('Get product error:', error);
      return { success: false, error: error.message };
    }
  },

  // Create product
  create: async (productData) => {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Create product error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update product
  update: async (id, productData) => {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        ...productData,
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update product error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete product
  delete: async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      return { success: true };
    } catch (error) {
      console.error('Delete product error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * Categories Service
 */
export const categoriesService = {
  // Get all categories
  getAll: async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const categories = [];
      
      querySnapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return { success: true, data: categories };
    } catch (error) {
      console.error('Get categories error:', error);
      return { success: false, error: error.message };
    }
  },

  // Create category
  create: async (categoryData) => {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...categoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Create category error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update category
  update: async (id, categoryData) => {
    try {
      const docRef = doc(db, 'categories', id);
      await updateDoc(docRef, {
        ...categoryData,
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update category error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete category
  delete: async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      return { success: true };
    } catch (error) {
      console.error('Delete category error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * Orders Service
 */
export const ordersService = {
  // Get all orders
  getAll: async (userId = null) => {
    try {
      let q = collection(db, 'orders');
      
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return { success: true, data: orders };
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single order
  getById: async (id) => {
    try {
      const docRef = doc(db, 'orders', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      }
      
      return { success: false, error: 'Order not found' };
    } catch (error) {
      console.error('Get order error:', error);
      return { success: false, error: error.message };
    }
  },

  // Create order
  create: async (orderData) => {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update order
  update: async (id, orderData) => {
    try {
      const docRef = doc(db, 'orders', id);
      await updateDoc(docRef, {
        ...orderData,
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update order error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * Cart Service
 */
export const cartService = {
  // Get user cart
  get: async (userId) => {
    try {
      const q = query(collection(db, 'carts'), where('userId', '==', userId), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const cartDoc = querySnapshot.docs[0];
        return { success: true, data: { id: cartDoc.id, ...cartDoc.data() } };
      }
      
      // Create empty cart if doesn't exist
      const docRef = await addDoc(collection(db, 'carts'), {
        userId,
        items: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true, data: { id: docRef.id, userId, items: [] } };
    } catch (error) {
      console.error('Get cart error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update cart
  update: async (cartId, items) => {
    try {
      const docRef = doc(db, 'carts', cartId);
      await updateDoc(docRef, {
        items,
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update cart error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * Users Service
 */
export const usersService = {
  // Get all users (Admin only)
  getAll: async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return { success: true, data: users };
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user
  update: async (uid, userData) => {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.message };
    }
  },
};

