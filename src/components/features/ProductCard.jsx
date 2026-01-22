/**
 * Product Card Component
 * مكون بطاقة المنتج
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useDispatch } from 'react-redux';
import { addItem } from '../../store/slices/cartSlice';
import { formatCurrency, calculateDiscount } from '../../utils/helpers';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onAddToWishlist, isInWishlist = false }) => {
  const dispatch = useDispatch();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dispatch(addItem({ product, quantity: 1 }));
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToWishlist) {
      onAddToWishlist(product.id);
    }
  };

  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  return (
    <Link to={`/products/${product.id}`} className="block h-full group">
      <div className="card-elevated h-full flex flex-col hover-lift">
        {/* Image Container */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 aspect-square">
          <img
            src={product.images?.[0] || product.image || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          
          {/* Discount Badge */}
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-scale-in">
              -{discount}%
            </span>
          )}

          {/* Out of Stock Badge */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-white px-4 py-2 rounded-md font-semibold">
                Out of Stock
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isInWishlist ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-600 hover:text-red-500 transition-colors" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Category */}
          {product.category && (
            <span className="text-xs text-primary-600 font-semibold uppercase mb-2 tracking-wide">
              {product.category}
            </span>
          )}

          {/* Product Name */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold gradient-text">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1 mb-3">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600">
                {product.rating.toFixed(1)} ({product.reviewsCount || 0})
              </span>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            fullWidth
            className="mt-auto group/btn"
          >
            <ShoppingCartIcon className="h-5 w-5 mr-2 group-hover/btn:animate-bounce" />
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

