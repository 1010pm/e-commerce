/**
 * Firestore Query Helpers
 * Consolidates common query building logic for Firestore
 * Single source of truth for product queries, filters, and sorting
 */

import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.config';

/**
 * Build product query with filters
 * Handles category filtering, search, and sorting
 * @param {Object} filters - { category?, search?, sortBy?, sortOrder? }
 * @param {number} pageSize - Number of results per page
 * @returns {Object} { queryRef, constraints }
 */
export const buildProductQuery = (filters = {}, pageSize = 12) => {
  const {
    category,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const constraints = [];

  // Filter by active status (always)
  constraints.push(where('status', '==', 'active'));
  constraints.push(where('inStock', '==', true));

  // Category filter (if provided)
  if (category && category.trim()) {
    constraints.push(where('categoryId', '==', category));
  }

  // Note: Full-text search requires separate logic
  // This handles category + sort, search is handled client-side

  // Add sorting
  const validSortFields = ['createdAt', 'price', 'name', 'rating'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const direction = sortOrder === 'asc' ? 'asc' : 'desc';

  constraints.push(orderBy(sortField, direction));

  // Add pagination limit
  constraints.push(limit(pageSize));

  return {
    constraints,
    collectionRef: collection(db, 'products'),
  };
};

/**
 * Apply pagination to query
 * @param {Array} constraints - Existing query constraints
 * @param {Object} pagination - { lastDoc?, pageSize? }
 * @returns {Array} Updated constraints
 */
export const applyPaginationToQuery = (constraints, pagination = {}) => {
  const { lastDoc, pageSize = 12 } = pagination;

  const paginatedConstraints = [...constraints];

  // Replace old limit
  const limitIndex = paginatedConstraints.findIndex(
    (c) => c.type === 'limit'
  );
  if (limitIndex >= 0) {
    paginatedConstraints.splice(limitIndex, 1);
  }

  // Add startAfter for pagination (if we have a last document)
  if (lastDoc) {
    paginatedConstraints.push(startAfter(lastDoc));
  }

  // Add new limit
  paginatedConstraints.push(limit(pageSize));

  return paginatedConstraints;
};

/**
 * Get sort options with labels for UI
 * @returns {Array} Sort options
 */
export const getSortOptions = () => [
  { value: 'createdAt-desc', label: '✨ Newest First' },
  { value: 'createdAt-asc', label: '⏰ Oldest First' },
  { value: 'price-asc', label: '💰 Price: Low to High' },
  { value: 'price-desc', label: '💸 Price: High to Low' },
  { value: 'name-asc', label: 'A-Z Alphabetical' },
  { value: 'name-desc', label: 'Z-A Alphabetical' },
  { value: 'rating-desc', label: '⭐ Top Rated' },
];

/**
 * Log query for debugging
 * @param {Array} constraints - Query constraints
 * @param {string} context - Where query is from
 */
export const logQueryDebug = (constraints, context = 'product') => {
  console.log(`📊 [QUERY DEBUG] ${context}:`, {
    constraintCount: constraints.length,
    constraints: constraints.map((c) => c.type || 'unknown'),
  });
};

/**
 * Safe category filter (handles missing or invalid categories)
 * @param {string} categoryId
 * @returns {Object} { constraint, isValid }
 */
export const buildCategoryConstraint = (categoryId) => {
  if (!categoryId || !categoryId.trim()) {
    return {
      constraint: null,
      isValid: false,
    };
  }

  return {
    constraint: where('categoryId', '==', categoryId),
    isValid: true,
  };
};

/**
 * Build search constraint (partial matching)
 * Note: Firestore doesn't support full-text search natively
 * This should be handled client-side after retrieval
 * @param {string} searchTerm
 * @returns {Function} Filter function for client-side filtering
 */
export const buildSearchFilter = (searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) {
    return (item) => true;
  }

  const lowerSearch = searchTerm.toLowerCase();
  return (item) => {
    return (
      (item.name && item.name.toLowerCase().includes(lowerSearch)) ||
      (item.description && item.description.toLowerCase().includes(lowerSearch)) ||
      (item.sku && item.sku.toLowerCase().includes(lowerSearch))
    );
  };
};

/**
 * Combine multiple filters (category + search)
 * @param {Object} filters
 * @returns {Object} { queryConstraints, clientFilters }
 */
export const buildCombinedFilters = (filters = {}) => {
  const { category, search, sortBy, sortOrder } = filters;

  // Server-side constraints
  const queryConstraints = [];

  // Always filter active products
  queryConstraints.push(where('status', '==', 'active'));
  queryConstraints.push(where('inStock', '==', true));

  // Add category constraint if valid
  const categoryConstraint = buildCategoryConstraint(category);
  if (categoryConstraint.isValid) {
    queryConstraints.push(categoryConstraint.constraint);
  }

  // Add sorting
  const sortField = ['createdAt', 'price', 'name', 'rating'].includes(sortBy)
    ? sortBy
    : 'createdAt';
  queryConstraints.push(orderBy(sortField, sortOrder === 'asc' ? 'asc' : 'desc'));

  // Client-side search filter
  const searchFilter = buildSearchFilter(search);

  return {
    queryConstraints,
    searchFilter,
  };
};
