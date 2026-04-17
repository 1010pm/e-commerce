/**
 * Product Card Component
 * مكون بطاقة المنتج
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useDispatch } from 'react-redux';
import { addItem } from '../../store/slices/cartSlice';
import { formatCurrency, calculateDiscount } from '../../utils/helpers';
import Currency from '../common/Currency';
import Button from '../common/Button';
import FavoriteButton from './FavoriteButton';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onAddToWishlist, isInWishlist = false }) => {
  const dispatch = useDispatch();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dispatch(addItem({ product, quantity: 1 }));
    toast.success('Added to cart!');
  };

  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  return (
    <Link to={`/products/${product.id}`} className="block h-full group">
      <div className="card-elevated h-full flex flex-col hover-lift">
        {/* Image Container - Responsive height */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 aspect-square md:aspect-square">
          <img
            src={product.images?.[0] || product.image || '/placeholder-product.svg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          
          {/* Discount Badge */}
          {discount > 0 && (
            <span className="absolute top-2 md:top-3 left-2 md:left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-bold shadow-lg animate-scale-in">
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

          {/* Favorite Button */}
          <div className="absolute top-2 md:top-3 right-2 md:right-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <FavoriteButton 
              product={product}
              size="md"
              className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
            />
          </div>
        </div>

        {/* Content - Responsive padding */}
        <div className="p-3 md:p-4 lg:p-5 flex flex-col flex-grow">
          {/* Category - Hidden on mobile */}
          {product.category && (
            <span className="hidden md:block text-xs text-primary-600 font-semibold uppercase mb-2 tracking-wide">
              {product.category}
            </span>
          )}

          {/* Product Name - Responsive sizing */}
          <h3 className="text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-1 md:mb-2 line-clamp-2 min-h-[2.5rem] md:min-h-[3.5rem] group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Description - Hidden on mobile and tablet */}
          {product.description && (
            <p className="hidden lg:block text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price - Responsive sizing */}
          <div className="flex items-baseline gap-2 mb-2 md:mb-3">
            <span className="text-lg md:text-xl lg:text-2xl font-bold gradient-text">
              <Currency amount={product.price} />
            </span>
            {product.originalPrice && (
              <span className="text-xs md:text-sm text-gray-400 line-through">
                <Currency amount={product.originalPrice} />
              </span>
            )}
          </div>

          {/* Rating - Hidden on mobile */}
          {product.rating && (
            <div className="hidden md:flex items-center gap-1 mb-3">
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
            className="mt-auto group/btn text-sm md:text-base"
          >
            <ShoppingCartIcon className="h-4 md:h-5 w-4 md:w-5 mr-1 md:mr-2 group-hover/btn:animate-bounce" />
            {product.inStock ? 'Add' : 'Out of Stock'}
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

