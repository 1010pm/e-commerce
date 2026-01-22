/**
 * Products Page - Production Ready
 * Enhanced products page with animated filters and smooth grid transitions
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, setFilters, clearFilters } from '../store/slices/productsSlice';
import ProductCard from '../components/features/ProductCard';
import { ProductCardSkeleton } from '../components/common/Loading';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { APP_CONFIG } from '../constants/config';
import { staggerAnimation } from '../utils/animations';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Products = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading, filters, pagination } = useSelector((state) => state.products);

  const [localFilters, setLocalFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    // Apply filters from URL
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    dispatch(setFilters({ category }));
    dispatch(fetchProducts({ filters: { category }, pagination: { limit: APP_CONFIG.ITEMS_PER_PAGE } }));
  }, [dispatch, searchParams]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    // Update URL
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);

    // Update Redux filters
    dispatch(setFilters({ [key]: value }));
    dispatch(fetchProducts({ filters: { [key]: value }, pagination: { limit: APP_CONFIG.ITEMS_PER_PAGE } }));
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
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fade-in">
      {/* Header */}
      <div className="mb-10 text-center md:text-left animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-extrabold gradient-text mb-3">
          Products
        </h1>
        <p className="text-lg text-gray-600">
          Discover our amazing collection of quality products
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24 animate-slide-right">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              </div>
              {(localFilters.category || localFilters.search) && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-all hover:scale-105 press-effect"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Clear All
                </button>
              )}
            </div>

            {/* Search */}
            <div className="mb-6 animate-fade-in-up stagger-1">
              <Input
                label="Search"
                name="search"
                value={localFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search products..."
                className="transition-all duration-300 focus:scale-[1.02]"
              />
            </div>

            {/* Category Filter */}
            <div className="mb-6 animate-fade-in-up stagger-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Category
              </label>
              <select
                value={localFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white hover:border-primary-300 focus:scale-[1.02]"
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
                <option value="Books">Books</option>
                <option value="Sports">Sports</option>
              </select>
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white hover:border-primary-300 focus:scale-[1.02]"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="rating-desc">Highest Rated</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between animate-fade-in-up">
            <p className="text-gray-600 font-medium">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></span>
                  Loading...
                </span>
              ) : (
                <>
                  <span className="text-gray-900 font-bold text-lg">{products.length}</span>
                  <span className="ml-1">
                    {products.length === 1 ? 'product' : 'products'} found
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Products */}
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, index) => (
                <div key={index} style={staggerAnimation(index, 50)}>
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in-up"
                    style={staggerAnimation(index, 50)}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Load More */}
              {pagination.hasMore && (
                <div className="text-center mt-12 animate-fade-in-up">
                  <Button 
                    onClick={loadMore} 
                    loading={loading} 
                    size="lg"
                    className="hover-glow press-effect shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Loading...' : 'Load More Products'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100 animate-scale-in">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4 animate-bounce-subtle">🔍</div>
                <p className="text-gray-700 text-xl font-semibold mb-2">
                  No products found
                </p>
                <p className="text-gray-500 mb-6">
                  Try adjusting your filters to see more results
                </p>
                <Button 
                  onClick={clearAllFilters} 
                  variant="outline" 
                  size="lg"
                  className="hover-lift press-effect"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;

