/**
 * Products Page - Premium Collection Experience
 * Enhanced products page with statistics, filters, and professional SaaS design
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, setFilters, clearFilters } from '../store/slices/productsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import ProductCard from '../components/features/ProductCard';
import { ProductCardSkeleton } from '../components/common/Loading';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { APP_CONFIG } from '../constants/config';
import { staggerAnimation } from '../utils/animations';
import {
  FunnelIcon,
  XMarkIcon,
  SparklesIcon,
  GiftIcon,
  TruckIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  ListBulletIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

const Products = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading, filters, pagination } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  const [localFilters, setLocalFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [viewType, setViewType] = useState('grid'); // grid or list
  const [showFilters, setShowFilters] = useState(true); // Mobile filter toggle
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null); // Debounce timer

  useEffect(() => {
    // Fetch active categories if not already loaded (public view)
    if (categories.length === 0) {
      dispatch(fetchCategories(false)); // false = public view (active only)
    }
    
    // Apply filters from URL
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    // ✅ Pass ALL filters to Redux and Firestore
    const urlFilters = { 
      ...(category && { category }),
      ...(search && { search })
    };
    
    console.log('📱 [PRODUCTS] URL Filters Applied:', urlFilters);
    
    dispatch(setFilters(urlFilters));
    dispatch(fetchProducts({ filters: urlFilters, pagination: { limit: APP_CONFIG.ITEMS_PER_PAGE } }));
  }, [dispatch, searchParams, categories.length]);

  // 🔍 Debounced search handler to prevent excessive API calls
  useEffect(() => {
    // Clear previous timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // If search is empty, dispatch immediately
    if (!localFilters.search.trim()) {
      const newFilters = { ...localFilters };
      dispatch(setFilters(newFilters));
      dispatch(fetchProducts({ filters: newFilters, pagination: { limit: APP_CONFIG.ITEMS_PER_PAGE } }));
      return;
    }

    // Set new debounce timer (300ms delay for user typing)
    const timer = setTimeout(() => {
      const newFilters = { ...localFilters };
      console.log('🔍 [PRODUCTS] Debounced search dispatched:', { search: localFilters.search });
      dispatch(setFilters(newFilters));
      dispatch(fetchProducts({ filters: newFilters, pagination: { limit: APP_CONFIG.ITEMS_PER_PAGE } }));
    }, 300);

    setSearchDebounceTimer(timer);

    return () => clearTimeout(timer);
  }, [localFilters.search, dispatch]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    
    console.log('🔍 [PRODUCTS] Filter Changed:', {
      key,
      value,
      allFilters: newFilters
    });

    // Update URL
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);

    // For search: let the debounce hook handle dispatch
    // For category/other filters: dispatch immediately
    if (key !== 'search') {
      dispatch(setFilters(newFilters));
      dispatch(fetchProducts({ filters: newFilters, pagination: { limit: APP_CONFIG.ITEMS_PER_PAGE } }));
    }
  };

  const handleSortChange = (sortBy, sortOrder) => {
    handleFilterChange('sortBy', sortBy);
    handleFilterChange('sortOrder', sortOrder);
    dispatch(
      fetchProducts({
        filters: { ...filters, sortBy, sortOrder },
        pagination: { limit: APP_CONFIG.ITEMS_PER_PAGE },
      })
    );
  };

  const loadMore = () => {
    dispatch(
      fetchProducts({
        filters,
        pagination: { limit: APP_CONFIG.ITEMS_PER_PAGE, lastDoc: pagination.lastDoc },
      })
    );
  };

  const clearAllFilters = () => {
    setLocalFilters({ category: '', search: '', sortBy: 'createdAt', sortOrder: 'desc' });
    setSearchParams({});
    dispatch(clearFilters());
    dispatch(fetchProducts({ filters: {}, pagination: { limit: APP_CONFIG.ITEMS_PER_PAGE } }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white py-12 md:py-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-5 rounded-full -ml-40 -mb-40"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
              Discover Our Collection
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-6">
              Premium quality products curated just for you. Browse thousands of items with unbeatable deals and fast shipping.
            </p>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                <ShieldCheckIcon className="w-6 h-6 text-primary-200 flex-shrink-0" />
                <span className="text-sm font-medium text-primary-100">100% Authentic</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                <TruckIcon className="w-6 h-6 text-primary-200 flex-shrink-0" />
                <span className="text-sm font-medium text-primary-100">Fast Delivery</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                <GiftIcon className="w-6 h-6 text-primary-200 flex-shrink-0" />
                <span className="text-sm font-medium text-primary-100">Best Prices</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 animate-fade-in-up">
          {/* Total Products */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Products</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">{products.length || '0'}</p>
              </div>
              <div className="w-10 md:w-14 h-10 md:h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Squares2X2Icon className="w-5 md:w-7 h-5 md:h-7 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">Categories</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">{categories.length || '0'}</p>
              </div>
              <div className="w-10 md:w-14 h-10 md:h-14 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <AdjustmentsHorizontalIcon className="w-5 md:w-7 h-5 md:h-7 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Filters Applied */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">Current View</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">
                  {localFilters.category ? '📁 Filtered' : '📊 All'}
                </p>
              </div>
              <div className="w-10 md:w-14 h-10 md:h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <FunnelIcon className="w-5 md:w-7 h-5 md:h-7 text-green-600" />
              </div>
            </div>
          </div>

          {/* Best Sellers Badge */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-md border border-amber-200 p-4 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs md:text-sm font-semibold text-amber-700 uppercase tracking-wide">Hot Deals</p>
                <p className="text-2xl md:text-3xl font-bold text-amber-900 mt-1 md:mt-2">✨ Active</p>
              </div>
              <div className="w-10 md:w-14 h-10 md:h-14 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 md:w-7 h-5 md:h-7 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar & View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-4 mb-6 md:mb-8 bg-white rounded-xl shadow-md border border-gray-200 p-2 md:p-4">
          <div className="flex items-center gap-1 md:gap-2 text-gray-600 text-xs md:text-sm overflow-x-auto max-w-full">
            {localFilters.category && (
              <div className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-primary-100 rounded-full text-xs font-semibold text-primary-700 flex-shrink-0">
                <span className="truncate">📁 {categories.find(c => c.id === localFilters.category)?.name || localFilters.category}</span>
                <button onClick={() => handleFilterChange('category', '')} className="hover:text-primary-900 flex-shrink-0">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            )}
            {localFilters.search && (
              <div className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-blue-100 rounded-full text-xs font-semibold text-blue-700 flex-shrink-0">
                <span className="truncate">🔍 "{localFilters.search}"</span>
                <button onClick={() => handleFilterChange('search', '')} className="hover:text-blue-900 flex-shrink-0">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            )}
            {!localFilters.category && !localFilters.search && (
              <span className="text-gray-500 text-xs md:text-sm">Showing all</span>
            )}
          </div>

          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewType('grid')}
                className={`p-1.5 md:p-2 rounded transition-all ${
                  viewType === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <Squares2X2Icon className="w-4 md:w-5 h-4 md:h-5" />
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`p-1.5 md:p-2 rounded transition-all ${
                  viewType === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <ListBulletIcon className="w-4 md:w-5 h-4 md:h-5" />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden p-1.5 md:p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
              title="Toggle Filters"
            >
              <FunnelIcon className="w-4 md:w-5 h-4 md:h-5" />
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Mobile Filter Overlay */}
          {showFilters && (
            <div
              className="fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setShowFilters(false)}
            ></div>
          )}

          {/* Filters Sidebar */}
          <aside className={`${showFilters ? 'fixed md:static inset-0 top-16 z-40 md:z-auto md:col-span-1' : 'hidden md:block md:col-span-1'} lg:block lg:col-span-1`}>
            <div className={`${showFilters ? 'bg-white h-screen md:h-auto overflow-y-auto' : ''} md:bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 sticky top-24 space-y-6 animate-slide-right max-h-[calc(100vh-150px)] overflow-y-auto`}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-900">Refine</h2>
                </div>
                <div className="flex items-center gap-2">
                  {(localFilters.category || localFilters.search) && (
                    <button
                      onClick={clearAllFilters}
                      className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-all hover:scale-105 bg-primary-50 px-2 py-1 rounded-full hover:bg-primary-100"
                    >
                      <XMarkIcon className="h-3 w-3" />
                      Reset All
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(false)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Search */}
              <div className="animate-fade-in-up stagger-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <Input
                  name="search"
                  value={localFilters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search by name..."
                  className="transition-all duration-300 focus:scale-[1.02]"
                />
              </div>

              {/* Category Filter */}
              <div className="animate-fade-in-up stagger-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Category</label>
                  <span className="text-xs text-gray-500">{categories.length} available</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all font-medium text-sm flex items-center gap-2 ${
                      !localFilters.category
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-500 shadow-md'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-base">📂</span>
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleFilterChange('category', category.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all font-medium text-sm flex items-center gap-2 ${
                        localFilters.category === category.id
                          ? 'bg-primary-100 text-primary-700 border-2 border-primary-500 shadow-md'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                      title={category.name}
                    >
                      <span className="text-base">📁</span>
                      <span className="truncate flex-1">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="animate-fade-in-up stagger-3">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Sort By
                </label>
                <select
                  value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleSortChange(sortBy, sortOrder);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white hover:border-primary-300 font-medium text-sm"
                >
                  <option value="createdAt-desc">✨ Newest First</option>
                  <option value="createdAt-asc">⏰ Oldest First</option>
                  <option value="price-asc">💰 Price: Low to High</option>
                  <option value="price-desc">💸 Price: High to Low</option>
                  <option value="name-asc">A-Z Alphabetical</option>
                  <option value="name-desc">Z-A Alphabetical</option>
                </select>
              </div>

              {/* Filter Tips */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 animate-fade-in-up">
                <p className="text-xs font-semibold text-blue-900 mb-2">💡 Smart Filtering</p>
                <p className="text-xs text-blue-800 leading-relaxed">Combine filters and search to find exactly what you need. Only in-stock, active products are shown.</p>
              </div>
            </div>
          </aside>

          {/* Products Section */}
          <div className="lg:col-span-3">
            {/* Results Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 md:mb-8 animate-fade-in-up bg-white rounded-lg p-4 border border-gray-200">
              <div>
                <p className="text-gray-700 font-medium text-sm md:text-base">
                  {loading && products.length === 0 ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></span>
                      Loading products...
                    </span>
                  ) : (
                    <>
                      <span className="text-gray-900 font-bold text-lg">{products.length}</span>
                      <span className="text-gray-600">
                        {' '}{products.length === 1 ? 'product' : 'products'}
                      </span>
                      {localFilters.category && (
                        <span className="text-gray-500 text-sm ml-2">
                          in <strong>{categories.find(c => c.id === localFilters.category)?.name || localFilters.category}</strong>
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
              {localFilters.category && (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full border border-primary-200">
                  <span className="text-xs font-medium text-primary-700">🎯 Filtered View</span>
                </div>
              )}
            </div>

            {/* Products Grid/List */}
            {loading && products.length === 0 ? (
              <div className={`grid ${viewType === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-3 md:gap-4 lg:gap-6`}>
                {[...Array(9)].map((_, index) => (
                  <div key={index} style={staggerAnimation(index, 50)}>
                    <ProductCardSkeleton />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`grid ${viewType === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-3 md:gap-4 lg:gap-6`}>
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className="animate-fade-in-up"
                      style={staggerAnimation(index, 50)}
                    >
                      <ProductCard product={product} viewType={viewType} />
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {pagination.hasMore && (
                  <div className="text-center mt-12 animate-fade-in-up">
                    <Button
                      onClick={loadMore}
                      loading={loading}
                      size="lg"
                      className="hover-glow press-effect shadow-lg hover:shadow-xl"
                    >
                      {loading ? 'Loading...' : '📦 Load More Products'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg border border-gray-200 animate-scale-in">
                <div className="max-w-md mx-auto px-6">
                  <div className="text-7xl mb-4 animate-bounce-subtle">🔍</div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                    No Products Found
                  </h3>
                  <p className="text-gray-600 mb-2 text-sm md:text-base">
                    {localFilters.search && localFilters.category
                      ? `No products match "${localFilters.search}" in this category.`
                      : localFilters.search
                      ? `No products match your search for "${localFilters.search}".`
                      : localFilters.category
                      ? `No products available in this category right now.`
                      : 'No products available at this moment.'}
                  </p>
                  <p className="text-gray-500 text-xs md:text-sm mb-8">
                    Try adjusting your filters or search terms to discover more items.
                  </p>
                  <div className="space-y-3">
                    {(localFilters.category || localFilters.search) && (
                      <Button
                        onClick={clearAllFilters}
                        variant="outline"
                        size="lg"
                        className="hover-lift press-effect w-full"
                      >
                        ✨ Clear All Filters
                      </Button>
                    )}
                    <Button 
                      onClick={() => {
                        clearAllFilters();
                        setShowFilters(false);
                      }}
                      size="lg" 
                      className="w-full hover-glow"
                    >
                      📂 Browse All Products
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Products;

