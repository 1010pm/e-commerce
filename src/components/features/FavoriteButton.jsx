/**
 * FavoriteButton Component
 * Reusable heart icon button for toggling favorites
 * مكون زر المفضلات القابل لإعادة الاستخدام
 */

import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { addFavorite, removeFavorite, selectIsFavorite } from '../../store/slices/favoritesSlice';
import { selectUser } from '../../store/slices/authSlice';

/**
 * FavoriteButton Component
 * Handles adding/removing products from favorites with proper loading and auth states
 * 
 * @param {object} props
 * @param {object} props.product - Product object (id, name, image, price required)
 * @param {string} props.size - Size of icon: 'sm' (5), 'md' (6), 'lg' (8) - default: 'md'
 * @param {boolean} props.showLabel - Show text label next to icon - default: false
 * @param {string} props.className - Additional Tailwind classes
 * @param {function} props.onToggle - Optional callback after successful toggle
 * @param {boolean} props.disabled - Disable button - default: false
 * @returns {JSX.Element}
 */
const FavoriteButton = ({
  product,
  size = 'md',
  showLabel = false,
  className = '',
  onToggle = null,
  disabled = false,
}) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isFavorited = useSelector((state) => selectIsFavorite(state, product?.id));
  const [isLoading, setIsLoading] = useState(false);

  // Size mapping for icons
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const iconSize = sizeMap[size] || sizeMap.md;

  /**
   * Handle favorite toggle
   * Checks authentication first, then toggles favorite status
   */
  const handleToggleFavorite = useCallback(
    async (e) => {
      // Prevent event propagation
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Check if user is authenticated
      if (!user || !user.uid) {
        toast.error('Please sign in to add favorites');
        return;
      }

      // Validate product
      if (!product || !product.id) {
        toast.error('Invalid product');
        console.error('Invalid product data:', product);
        return;
      }

      // Validate user UID is valid
      if (typeof user.uid !== 'string' || user.uid.length === 0) {
        toast.error('Invalid user session. Please refresh and try again.');
        console.error('Invalid user UID:', user.uid);
        return;
      }

      setIsLoading(true);

      try {
        if (isFavorited) {
          // Remove from favorites
          await dispatch(
            removeFavorite({
              userId: user.uid,
              productId: product.id,
            })
          ).unwrap();

          toast.success('Removed from favorites');

          if (onToggle) {
            onToggle(false);
          }
        } else {
          // Add to favorites
          await dispatch(
            addFavorite({
              userId: user.uid,
              product,
            })
          ).unwrap();

          toast.success('Added to favorites');

          if (onToggle) {
            onToggle(true);
          }
        }
      } catch (error) {
        const errorMessage = typeof error === 'string' 
          ? error 
          : error?.message || 'Failed to update favorite';
        console.error('Error toggling favorite:', error);
        console.error('Error message:', errorMessage);
        console.error('Product ID:', product?.id);
        console.error('User UID:', user?.uid);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [user, product, isFavorited, dispatch, onToggle]
  );

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={disabled || isLoading || !user}
      className={`
        relative inline-flex items-center gap-2
        p-2 rounded-full
        transition-all duration-200
        hover:scale-110
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
        ${className}
      `}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-full rounded-full border-2 border-transparent border-t-red-500 animate-spin" />
        </div>
      )}

      {/* Heart icon */}
      {isFavorited ? (
        <HeartSolidIcon
          className={`${iconSize} text-red-500 transition-all duration-300`}
        />
      ) : (
        <HeartIcon
          className={`${iconSize} text-gray-600 hover:text-red-500 transition-colors duration-200`}
        />
      )}

      {/* Optional label */}
      {showLabel && (
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
          {isFavorited ? 'Favorited' : 'Add to favorites'}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;
