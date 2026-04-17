/**
 * Favorites (Wishlist) Page - Premium Collection
 * Modern favorites management with statistics and social features
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  HeartIcon,
  TrashIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TruckIcon,
  TagIcon,
  ChevronRightIcon,
  StarIcon,
  CheckCircleIcon,
  EyeIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  fetchFavorites,
  removeFavorite,
  removeBatchFavorites,
  selectFavorites,
  selectFavoritesLoading,
  selectFavoritesError,
} from '../store/slices/favoritesSlice';
import { selectUser } from '../store/slices/authSlice';
import { addItem } from '../store/slices/cartSlice';
import { formatCurrency } from '../utils/helpers';
import Button from '../components/common/Button';
import { ProductCardSkeleton } from '../components/common/Loading';

const Favorites = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const favorites = useSelector(selectFavorites);
  const loading = useSelector(selectFavoritesLoading);
  const error = useSelector(selectFavoritesError);

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isRemovingSelected, setIsRemovingSelected] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest, price-low, price-high, rating
  const [viewType, setViewType] = useState('grid'); // grid or list

  // Calculate statistics
  const totalValue = favorites.reduce((sum, fav) => sum + fav.price, 0);
  const avgRating = favorites.length > 0
    ? (favorites.reduce((sum, fav) => sum + (fav.rating || 0), 0) / favorites.length).toFixed(1)
    : 0;
  const inStockCount = favorites.filter(fav => fav.inStock).length;

  /**
   * Load favorites on component mount or when user changes
   */
  useEffect(() => {
    if (!user || !user.uid) {
      navigate('/auth/login');
      return;
    }

    // Fetch favorites
    dispatch(fetchFavorites(user.uid));
  }, [user, dispatch, navigate]);

  /**
   * Handle selecting/deselecting items
   */
  const handleSelectItem = (productId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
  };

  /**
   * Toggle select all items
   */
  const handleSelectAll = () => {
    if (selectedItems.size === favorites.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(favorites.map((fav) => fav.id)));
    }
  };

  /**
   * Remove single favorite
   */
  const handleRemoveFavorite = async (productId) => {
    try {
      await dispatch(
        removeFavorite({
          userId: user.uid,
          productId,
        })
      ).unwrap();
      
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error(error?.message || 'Failed to remove favorite');
    }
  };

  /**
   * Remove selected items
   */
  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) {
      toast.error('Select items to remove');
      return;
    }

    setIsRemovingSelected(true);
    try {
      await dispatch(
        removeBatchFavorites({
          userId: user.uid,
          productIds: Array.from(selectedItems),
        })
      ).unwrap();

      setSelectedItems(new Set());
      toast.success(`Removed ${selectedItems.size} items from favorites`);
    } catch (error) {
      console.error('Error removing selected favorites:', error);
      toast.error(error?.message || 'Failed to remove selected items');
    } finally {
      setIsRemovingSelected(false);
    }
  };

  /**
   * Add favorite to cart
   */
  const handleAddToCart = (product) => {
    if (!product.inStock) {
      toast.error('Product is out of stock');
      return;
    }

    dispatch(addItem({ product, quantity: 1 }));
    toast.success('Added to cart');
  };

  /**
   * Navigate to product details
   */
  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`);
  };

  /**
   * Get sorted favorites
   */
  const getSortedFavorites = () => {
    const sorted = [...favorites];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
      default:
        return sorted;
    }
  };

  // Render empty state
  if (!loading && favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white py-12 md:py-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-5 rounded-full -ml-40 -mb-40"></div>

          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold">My Favorites</h1>
            <p className="text-lg md:text-xl text-primary-100 mt-2">Ready to discover your next favorite?</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
              <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8">
                <HeartIcon className="h-16 w-16 text-pink-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Your Favorites List is Empty
              </h2>
              
              <p className="text-gray-600 mb-2 text-base">
                Add items to your wishlist and keep track of products you love
              </p>
              <p className="text-gray-500 text-sm mb-8">
                Your favorite items will be saved here for easy access
              </p>

              {/* Trust Indicators */}
              <div className="space-y-3 mb-10">
                <div className="flex items-center justify-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <HeartIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-blue-700">Save Your Favorite Products</span>
                </div>
                <div className="flex items-center justify-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-700">Track Price Changes</span>
                </div>
                <div className="flex items-center justify-center gap-3 p-3 bg-amber-50 rounded-lg">
                  <TruckIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-amber-700">Easy Checkout</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/products')}
                size="lg"
                fullWidth
                className="shadow-lg hover:shadow-xl hover-glow press-effect mb-3"
              >
                💝 Start Adding Favorites
              </Button>
              
              <Button variant="outline" size="lg" fullWidth onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white py-12 md:py-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-5 rounded-full -ml-40 -mb-40"></div>

          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold">My Favorites</h1>
            <p className="text-lg md:text-xl text-primary-100 mt-2">Your wishlist</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Error Loading Favorites
              </h2>
              
              <p className="text-gray-600 text-center max-w-md mb-8">
                {error}
              </p>
              
              <Button
                onClick={() => dispatch(fetchFavorites(user.uid))}
                size="lg"
                fullWidth
                className="mb-3"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-5 rounded-full -ml-40 -mb-40"></div>

        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold">My Favorites</h1>
          <p className="text-lg md:text-xl text-primary-100 mt-2">
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'} in your wishlist
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
          {/* Total Items */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{favorites.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                <HeartIcon className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(totalValue)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TagIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* In Stock */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">In Stock</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{inStockCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Avg Rating */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-md border border-amber-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Avg Rating</p>
                <p className="text-3xl font-bold text-amber-900 mt-2">⭐ {avgRating}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-8 animate-fade-in-up flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedItems.size === favorites.length && favorites.length > 0}
              onChange={handleSelectAll}
              className="w-5 h-5 text-primary-600 rounded cursor-pointer"
              aria-label="Select all favorites"
            />
            <span className="text-sm font-medium text-gray-600">
              {selectedItems.size > 0
                ? `${selectedItems.size} selected`
                : 'Select items'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 hidden sm:flex">
              <button
                onClick={() => setViewType('grid')}
                className={`p-2 rounded transition-all ${viewType === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
                title="Grid View"
              >
                ⊞
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`p-2 rounded transition-all ${viewType === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
                title="List View"
              >
                ≡
              </button>
            </div>

            {/* Delete Selected */}
            {selectedItems.size > 0 && (
              <Button
                onClick={handleRemoveSelected}
                disabled={isRemovingSelected}
                variant="outline"
                size="sm"
                className="gap-2 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              >
                <TrashIcon className="h-4 w-4" />
                Remove ({selectedItems.size})
              </Button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className={`grid ${viewType === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
            {Array(8)
              .fill(null)
              .map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
          </div>
        ) : (
          // Favorites grid/list
          <div className={`grid ${viewType === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-6 animate-fade-in-up`}>
            {getSortedFavorites().map((favorite, index) => (
              <div
                key={favorite.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Image Container */}
                <div className="relative overflow-hidden bg-gray-100 aspect-square group">
                  <img
                    src={favorite.image}
                    alt={favorite.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />

                  {/* Stock Overlay */}
                  {!favorite.inStock && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
                      <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-center">
                        Out of Stock
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleViewDetails(favorite.id)}
                      className="bg-white text-gray-900 p-3 rounded-full shadow-lg hover:bg-primary-600 hover:text-white transition-all"
                      aria-label="View product"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(favorite.id)}
                      className="bg-white text-gray-900 p-3 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all"
                      aria-label="Remove from favorites"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedItems.has(favorite.id)}
                    onChange={() => handleSelectItem(favorite.id)}
                    className="absolute top-3 left-3 w-5 h-5 rounded cursor-pointer z-10"
                    aria-label={`Select ${favorite.name}`}
                  />

                  {/* Sale Badge */}
                  {favorite.originalPrice && favorite.originalPrice > favorite.price && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-xs">
                      SALE
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  {/* Category */}
                  {favorite.category && (
                    <span className="inline-block text-xs text-primary-600 font-bold uppercase mb-2 tracking-wide">
                      {favorite.category}
                    </span>
                  )}

                  {/* Product Name */}
                  <h3
                    className="font-bold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-primary-600 transition-colors text-lg"
                    onClick={() => handleViewDetails(favorite.id)}
                  >
                    {favorite.name}
                  </h3>

                  {/* Price Section */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(favorite.price)}
                    </span>
                    {favorite.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(favorite.originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  {favorite.rating && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < Math.floor(favorite.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 font-medium">({favorite.rating.toFixed(1)})</span>
                    </div>
                  )}

                  {/* Stock Status - removed from customer view */}

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-col">
                    <Button
                      onClick={() => handleAddToCart(favorite)}
                      disabled={!favorite.inStock}
                      fullWidth
                      size="sm"
                      className="gap-2"
                    >
                      <ShoppingCartIcon className="h-4 w-4" />
                      Add to Cart
                    </Button>
                    <Button
                      onClick={() => handleViewDetails(favorite.id)}
                      variant="secondary"
                      fullWidth
                      size="sm"
                      className="gap-2"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
