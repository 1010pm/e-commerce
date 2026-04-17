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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { deleteImage, deleteMultipleImages } from './storage';

/**
 * Helper function to serialize Firestore data (convert Timestamps to ISO strings)
 * This prevents Redux serialization warnings
 */
const serializeFirestoreData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Timestamp) {
    // Convert Firestore Timestamp to ISO string
    return data.toDate().toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }

  if (typeof data === 'object') {
    const serialized = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        serialized[key] = serializeFirestoreData(data[key]);
      }
    }
    return serialized;
  }

  return data;
};

/**
 * Products Service - Enhanced with Search and Filtering
 * IMPORTANT: Two separate flows:
 * - Public methods (no "Admin" suffix): Show ONLY active products (isActive: true)
 * - Admin methods (with "Admin" suffix): Show ALL products for management
 */
export const productsService = {
  // Get all products for customers (public view - in stock only)
  getAll: async (filters = {}, pagination = {}) => {
    try {
      const constraints = [];

      // ✅ Build query constraints in the correct order
      // 1. Apply category filter in Firestore if provided
      if (filters.category) {
        console.log('📊 [FIRESTORE] Filtering by categoryId:', filters.category);
        constraints.push(where('categoryId', '==', filters.category));
      }

      // 2. Dynamic sort: Use provided sortBy/sortOrder or default to createdAt DESC
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      console.log('📊 [FIRESTORE] Sorting by:', sortBy, '(' + sortOrder + ')');
      constraints.push(orderBy(sortBy, sortOrder));

      // 3. Apply pagination
      if (pagination.lastDoc) {
        constraints.push(startAfter(pagination.lastDoc));
      }

      const pageLimit = pagination.limit || 12;
      constraints.push(limit(pageLimit * 3)); // Fetch extra to account for inStock/isActive filtering

      console.log('📊 [FIRESTORE] getAll() - Building query with constraints:', {
        hasCategory: !!filters.category,
        category: filters.category,
        hasSearch: !!filters.search,
        searchTerm: filters.search,
        sortBy: sortBy,
        sortOrder: sortOrder,
        pageLimit,
      });

      const q = query(collection(db, 'products'), ...constraints);
      const querySnapshot = await getDocs(q);
      const products = [];

      console.log('📊 [FIRESTORE] Query returned:', {
        totalDocs: querySnapshot.docs.length,
      });

      // Client-side filtering for inStock and isActive
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        
        // ✅ Filter 1: Must be in stock
        if (product.inStock !== true) {
          console.log('❌ [FIRESTORE] Product filtered out (not in stock):', {
            id: doc.id,
            name: product.name,
            inStock: product.inStock,
          });
          return;
        }

        // ✅ Filter 2: Must not be explicitly hidden
        if (product.isActive === false) {
          console.log('❌ [FIRESTORE] Product filtered out (inactive):', {
            id: doc.id,
            name: product.name,
            isActive: product.isActive,
          });
          return;
        }

        // ✅ Filter 3: Search filter (client-side because Firestore text search is limited)
        if (filters.search && filters.search.trim()) {
          const searchTerm = filters.search.toLowerCase().trim();
          const matchesSearch =
            product.name?.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm) ||
            product.sku?.toLowerCase().includes(searchTerm) ||
            product.category?.toLowerCase().includes(searchTerm);
          
          if (!matchesSearch) {
            console.log('❌ [FIRESTORE] Product filtered out (search mismatch):', {
              id: doc.id,
              name: product.name,
              searchTerm,
            });
            return;
          }
        }

        // ✅ Filter 4: Price filters
        if (filters.minPrice !== undefined && product.price < filters.minPrice) {
          return;
        }
        if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
          return;
        }

        console.log('✅ [FIRESTORE] Product passed filters:', {
          id: doc.id,
          name: product.name,
          categoryId: product.categoryId,
          category: product.category,
          inStock: product.inStock,
          isActive: product.isActive,
        });

        products.push({
          id: doc.id,
          ...serializeFirestoreData(product),
        });
      });

      // Trim to correct page limit
      const finalProducts = products.slice(0, pageLimit);

      console.log('✅ [FIRESTORE] Query Complete - Returning results:', {
        requestedCategory: filters.category,
        searchTerm: filters.search || 'none',
        sortBy: sortBy,
        sortOrder: sortOrder,
        totalDocsFromDb: querySnapshot.docs.length,
        totalAfterInStockFilter: products.length,
        finalProductsReturned: finalProducts.length,
      });

      return {
        success: true,
        data: finalProducts,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: finalProducts.length === pageLimit,
      };
    } catch (error) {
      console.error('❌ [FIRESTORE] Get products error:', {
        message: error.message,
        code: error.code,
        filters,
      });
      
      // ⚠️ IMPORTANT: Only use fallback if a CATEGORY FILTER was NOT applied
      // If user selected a category and got an error, return empty (don't fallback to all products)
      if (filters.category) {
        console.warn('⚠️ [FIRESTORE] Query failed for category:', filters.category);
        return { success: false, error: 'Failed to fetch products from this category' };
      }
      
      // FALLBACK: Only for general queries without category filters
      console.warn('⚠️ [FIRESTORE] Query failed, trying ultimate fallback...');
      try {
        const fallbackQ = query(collection(db, 'products'));
        const fallbackSnapshot = await getDocs(fallbackQ);
        const fallbackProducts = [];

        fallbackSnapshot.forEach((doc) => {
          const product = doc.data();
          // Only return in-stock products
          if (product.inStock === true && product.isActive !== false) {
            fallbackProducts.push({
              id: doc.id,
              ...serializeFirestoreData(product),
            });
          }
        });

        console.log('✅ [FIRESTORE] Fallback query succeeded, found:', fallbackProducts.length, 'products');
        return {
          success: true,
          data: fallbackProducts.slice(0, pagination.limit || 12),
          lastDoc: null,
          hasMore: false,
        };
      } catch (fallbackError) {
        console.error('❌ [FIRESTORE] All queries failed:', fallbackError.message);
        return { success: false, error: error.message };
      }
    }
  },

  // ===== ADMIN ONLY: Get ALL products (no filters) =====
  
  // Get all products for ADMIN - shows everything including out-of-stock and inactive
  getAllAdmin: async (filters = {}, pagination = {}) => {
    try {
      const constraints = [];

      // 🔑 ADMIN VIEW: NO FILTERS - show all products regardless of inStock or isActive
      // This allows admin to manage, edit, and control product visibility

      // Apply category filter (optional)
      if (filters.category) {
        constraints.push(where('categoryId', '==', filters.category));
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
        const product = doc.data();
        products.push({
          id: doc.id,
          ...serializeFirestoreData(product),
          // 🏷️ Add admin-only badges for clarity
          _adminInfo: {
            isActive: product.isActive !== false, // Default to true if not set
            inStock: product.inStock === true,
            stockCount: product.stock || 0,
            visibility: product.isActive === false ? '🔒 HIDDEN_BY_ADMIN' : product.inStock ? '✅ VISIBLE' : '⚠️ OUT_OF_STOCK',
          }
        });
      });

      return {
        success: true,
        data: products,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: products.length === pageLimit,
      };
    } catch (error) {
      console.error('Get products (admin) error:', error);
      return { success: false, error: error.message };
    }
  },

  // Search products by name or description (customer view - in stock only)
  search: async (searchQuery, category = null) => {
    try {
      // ✅ SIMPLIFIED: Fetch with minimal constraints, filter client-side
      const constraints = [orderBy('createdAt', 'desc')];

      const q = query(collection(db, 'products'), ...constraints);
      const querySnapshot = await getDocs(q);
      const searchTerm = searchQuery.toLowerCase();
      const results = [];

      querySnapshot.forEach((doc) => {
        const product = doc.data();
        
        // ✅ Filter 1: Must be in stock
        if (product.inStock !== true) {
          return;
        }

        // ✅ Filter 2: Must not be explicitly hidden
        if (product.isActive === false) {
          return;
        }

        // ✅ Filter 3: Category filter (if provided)
        if (category && product.category !== category) {
          return;
        }

        // ✅ Filter 4: Search match
        const matchesSearch =
          product.name?.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.tags?.some((tag) => tag.toLowerCase().includes(searchTerm));

        if (matchesSearch) {
          results.push({
            id: doc.id,
            ...serializeFirestoreData(product),
          });
        }
      });

      return { success: true, data: results };
    } catch (error) {
      console.error('Search products error:', error);
      return { success: false, error: error.message };
    }
  },

  // Search products for ADMIN - shows all results
  searchAdmin: async (searchQuery, category = null) => {
    try {
      // 🔑 ADMIN VIEW: Show all products regardless of inStock or isActive
      const constraints = [orderBy('createdAt', 'desc')];

      if (category) {
        constraints.push(where('categoryId', '==', category));
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
            ...serializeFirestoreData(product),
            _adminInfo: {
              isActive: product.isActive !== false, // Default true if not set
              inStock: product.inStock === true,
              stockCount: product.stock || 0,
              visibility: product.isActive === false ? '🔒 HIDDEN_BY_ADMIN' : product.inStock ? '✅ VISIBLE' : '⚠️ OUT_OF_STOCK',
            }
          });
        }
      });

      return { success: true, data: results };
    } catch (error) {
      console.error('Search products (admin) error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get featured products
  getFeatured: async (limit = 6) => {
    try {
      // ✅ SIMPLIFIED: Fetch by creation date, filter client-side
      const q = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc'),
        limit(limit * 2) // Fetch extra to account for filtering
      );
      const querySnapshot = await getDocs(q);
      const products = [];

      querySnapshot.forEach((doc) => {
        const product = doc.data();
        
        // ✅ Filter: Must be in stock and not hidden
        if (product.inStock === true && product.isActive !== false) {
          products.push({
            id: doc.id,
            ...serializeFirestoreData(product),
          });
        }
      });

      return { success: true, data: products.slice(0, limit) };
    } catch (error) {
      console.error('Get featured products error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get featured products for ADMIN - shows all featured items
  getFeaturedAdmin: async (limit = 6) => {
    try {
      // 🔑 ADMIN VIEW: Show all featured products regardless of inStock or isActive
      const q = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      const querySnapshot = await getDocs(q);
      const products = [];

      querySnapshot.forEach((doc) => {
        const product = doc.data();
        products.push({
          id: doc.id,
          ...serializeFirestoreData(product),
          _adminInfo: {
            isActive: product.isActive !== false,
            inStock: product.inStock === true,
            stockCount: product.stock || 0,
            visibility: product.isActive === false ? '🔒 HIDDEN_BY_ADMIN' : product.inStock ? '✅ VISIBLE' : '⚠️ OUT_OF_STOCK',
          }
        });
      });

      return { success: true, data: products };
    } catch (error) {
      console.error('Get featured products (admin) error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get products by category with pagination
  getByCategory: async (category, pagination = {}) => {
    try {
      const constraints = [
        where('categoryId', '==', category),
        orderBy('createdAt', 'desc'),
      ];

      if (pagination.lastDoc) {
        constraints.push(startAfter(pagination.lastDoc));
      }

      const pageLimit = pagination.limit || 12;
      constraints.push(limit(pageLimit * 3)); // Fetch extra to account for inStock/isActive filtering

      console.log('📊 [FIRESTORE] getByCategory() - Fetching products for category:', category);

      const q = query(collection(db, 'products'), ...constraints);
      const querySnapshot = await getDocs(q);
      const products = [];

      console.log('📊 [FIRESTORE] Query returned:', {
        totalDocs: querySnapshot.docs.length,
        category,
      });

      querySnapshot.forEach((doc) => {
        const product = doc.data();
        
        // ✅ Filter: Must be in stock and not hidden
        if (product.inStock === true && product.isActive !== false) {
          console.log('✅ [FIRESTORE] Product passed filters:', {
            id: doc.id,
            name: product.name,
            category: product.category,
          });
          products.push({
            id: doc.id,
            ...serializeFirestoreData(product),
          });
        } else {
          console.log('❌ [FIRESTORE] Product filtered out:', {
            id: doc.id,
            name: product.name,
            inStock: product.inStock,
            isActive: product.isActive,
          });
        }
      });

      // Trim to correct page size
      const finalProducts = products.slice(0, pageLimit);

      console.log('✅ [FIRESTORE] Returning', finalProducts.length, 'products for category:', category);

      return {
        success: true,
        data: finalProducts,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: finalProducts.length === pageLimit,
      };
    } catch (error) {
      console.error('❌ [FIRESTORE] Get products by category error:', {
        message: error.message,
        code: error.code,
        category,
      });
      return { success: false, error: error.message };
    }
  },

  // Get products by category for ADMIN - shows all in category
  getByCategoryAdmin: async (category, pagination = {}) => {
    try {
      // 🔑 ADMIN VIEW: Show all products in category regardless of inStock or isActive
      const constraints = [
        where('categoryId', '==', category),
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
        const product = doc.data();
        products.push({
          id: doc.id,
          ...serializeFirestoreData(product),
          _adminInfo: {
            isActive: product.isActive !== false,
            inStock: product.inStock === true,
            stockCount: product.stock || 0,
            visibility: product.isActive === false ? '🔒 HIDDEN_BY_ADMIN' : product.inStock ? '✅ VISIBLE' : '⚠️ OUT_OF_STOCK',
          }
        });
      });

      return {
        success: true,
        data: products,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: products.length === pageLimit,
      };
    } catch (error) {
      console.error('Get products by category (admin) error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single product
  getById: async (id) => {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false, error: 'Product not found' };
      }

      const product = docSnap.data();

      // ✅ CUSTOMER VIEW: Don't show products that are explicitly hidden by admin
      // Allow viewing if inStock is true OR if isActive is not explicitly false
      if (product.isActive === false) {
        return { success: false, error: 'This product is currently unavailable' };
      }

      return { success: true, data: { id: docSnap.id, ...serializeFirestoreData(product) } };
    } catch (error) {
      console.error('Get product error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single product for ADMIN - shows all products
  getByIdAdmin: async (id) => {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false, error: 'Product not found' };
      }

      const product = docSnap.data();

      // 🔑 ADMIN VIEW: Show all products regardless of inStock or isActive
      return { 
        success: true, 
        data: { 
          id: docSnap.id, 
          ...serializeFirestoreData(product),
          _adminInfo: {
            isActive: product.isActive !== false,
            inStock: product.inStock === true,
            stockCount: product.stock || 0,
            visibility: product.isActive === false ? '🔒 HIDDEN_BY_ADMIN' : product.inStock ? '✅ VISIBLE' : '⚠️ OUT_OF_STOCK',
          }
        } 
      };
    } catch (error) {
      console.error('Get product (admin) error:', error);
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
          ...serializeFirestoreData(doc.data()),
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
          ...serializeFirestoreData(doc.data()),
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
          ...serializeFirestoreData(doc.data()),
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
        return { success: true, data: { id: docSnap.id, ...serializeFirestoreData(docSnap.data()) } };
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
        return { success: true, data: { id: cartDoc.id, ...serializeFirestoreData(cartDoc.data()) } };
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
          ...serializeFirestoreData(doc.data()),
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

