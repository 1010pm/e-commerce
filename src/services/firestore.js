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
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { deleteImage, deleteMultipleImages } from './storage';

/**
 * Products Service - Enhanced with Search and Filtering
 */
export const productsService = {
  // Get all products with advanced filtering and pagination
  getAll: async (filters = {}, pagination = {}) => {
    try {
      const constraints = [];

      // Apply category filter
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }

      // Apply stock filter
      if (filters.inStock !== undefined) {
        constraints.push(where('inStock', '==', filters.inStock));
      }

      // Apply price range filter
      if (filters.minPrice !== undefined) {
        constraints.push(where('price', '>=', filters.minPrice));
      }
      if (filters.maxPrice !== undefined) {
        constraints.push(where('price', '<=', filters.maxPrice));
      }

      // Apply ordering
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      constraints.push(orderBy(sortBy, sortOrder));

      // Apply pagination
      if (pagination.lastDoc) {
        constraints.push(startAfter(pagination.lastDoc));
      }

      const pageLimit = pagination.limit || 12;
      constraints.push(limit(pageLimit));

      const q = query(collection(db, 'products'), ...constraints);
      const querySnapshot = await getDocs(q);
      const products = [];

      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return {
        success: true,
        data: products,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: products.length === pageLimit,
      };
    } catch (error) {
      console.error('Get products error:', error);
      return { success: false, error: error.message };
    }
  },

  // Search products by name or description (client-side)
  search: async (searchQuery, category = null) => {
    try {
      const constraints = [orderBy('createdAt', 'desc')];

      if (category) {
        constraints.push(where('category', '==', category));
      }

      const q = query(collection(db, 'products'), ...constraints);
      const querySnapshot = await getDocs(q);
      const searchTerm = searchQuery.toLowerCase();
      const results = [];

      querySnapshot.forEach((doc) => {
        const product = doc.data();
        const matchesSearch =
          product.name?.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.tags?.some((tag) => tag.toLowerCase().includes(searchTerm));

        if (matchesSearch) {
          results.push({
            id: doc.id,
            ...product,
          });
        }
      });

      return { success: true, data: results };
    } catch (error) {
      console.error('Search products error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get featured products
  getFeatured: async (limit = 6) => {
    try {
      const q = query(
        collection(db, 'products'),
        where('isFeatured', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      const querySnapshot = await getDocs(q);
      const products = [];

      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return { success: true, data: products };
    } catch (error) {
      console.error('Get featured products error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get products by category with pagination
  getByCategory: async (category, pagination = {}) => {
    try {
      const constraints = [
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
      ];

      if (pagination.lastDoc) {
        constraints.push(startAfter(pagination.lastDoc));
      }

      const pageLimit = pagination.limit || 12;
      constraints.push(limit(pageLimit));

      const q = query(collection(db, 'products'), ...constraints);
      const querySnapshot = await getDocs(q);
      const products = [];

      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return {
        success: true,
        data: products,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: products.length === pageLimit,
      };
    } catch (error) {
      console.error('Get products by category error:', error);
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

  // Delete product (Safe Deletion with Storage Cleanup)
  delete: async (id) => {
    try {
      // 1. Fetch the product to get image URLs
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false, error: 'Product not found' };
      }

      const productData = docSnap.data();
      const images = productData.images || [];

      // 2. Delete ALL related images from Firebase Storage
      if (images.length > 0) {
        try {
          // We WAIT for deletion but don't abort if it fails
          // This ensures the database record is removed even if storage cleanup has issues
          await deleteMultipleImages(images);
        } catch (storageError) {
          console.warn('Storage cleanup failed but proceeding with product deletion:', storageError);
        }
      }

      // 3. Delete product document from Firestore
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error('Delete product error:', error);
      return { success: false, error: 'Network failure or permission denied' };
    }
  },
};

/**
 * Categories Service
 */
export const categoriesService = {
  // Get all categories (admin view - includes inactive)
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

  // Get active categories only (public view)
  getActive: async () => {
    try {
      const q = query(
        collection(db, 'categories'),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
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
      console.error('Get active categories error:', error);
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

  // Delete category (Safe Deletion with Storage Cleanup)
  delete: async (id) => {
    try {
      // 1. Fetch the category to get image URL
      const docRef = doc(db, 'categories', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false, error: 'Category not found' };
      }

      const categoryData = docSnap.data();
      const imagePath = categoryData.imagePath || categoryData.imageUrl;

      // 2. Delete image from Firebase Storage
      if (imagePath) {
        try {
          await deleteImage(imagePath);
        } catch (storageError) {
          console.warn('Storage cleanup failed but proceeding with category deletion:', storageError);
        }
      }

      // 3. Delete category document from Firestore
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error('Delete category error:', error);
      return { success: false, error: 'Network failure or permission denied' };
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

