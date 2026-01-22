/**
 * Product Details Page - Production Ready
 * Enhanced product details with image zoom and smooth add-to-cart animations
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProduct } from '../store/slices/productsSlice';
import { addItem } from '../store/slices/cartSlice';
import { formatCurrency, calculateDiscount } from '../utils/helpers';
import Button from '../components/common/Button';
import { Spinner, CardSkeleton } from '../components/common/Loading';
import { ShoppingCartIcon, HeartIcon, MinusIcon, PlusIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { product, loading } = useSelector((state) => state.products);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProduct(id));
    }
  }, [id, dispatch]);

  const handleAddToCart = async () => {
    if (!product.inStock) {
      toast.error('Product is out of stock');
      return;
    }
    
    setAddingToCart(true);
    
    // Simulate smooth animation
    setTimeout(() => {
      dispatch(addItem({ product, quantity }));
      setAddingToCart(false);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-success-500" />
          <span>Added {quantity} item(s) to cart!</span>
        </div>,
        {
          icon: '✅',
          duration: 3000,
        }
      );
    }, 300);
  };

  const handleQuantityChange = (change) => {
    setQuantity((prev) => {
      const newQuantity = prev + change;
      if (newQuantity < 1) return 1;
      if (newQuantity > (product?.stock || 10)) return product?.stock || 10;
      return newQuantity;
    });
  };

  const discount = product?.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  if (loading && !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CardSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 text-lg mb-4">Product not found</p>
        <Button onClick={() => navigate('/products')}>Back to Products</Button>
      </div>
    );
  }

  const images = product.images || (product.image ? [product.image] : []);

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="text-primary-600 hover:text-primary-700 mb-6 flex items-center gap-2 transition-all hover:gap-3 press-effect animate-fade-in-up"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span className="font-medium">Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="animate-fade-in-up">
          <div 
            className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 relative group cursor-zoom-in transition-all duration-300 hover:shadow-2xl"
            onMouseEnter={() => setImageZoom(true)}
            onMouseLeave={() => setImageZoom(false)}
          >
            <img
              src={images[selectedImage] || '/placeholder-product.jpg'}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                imageZoom ? 'scale-110' : 'scale-100'
              }`}
            />
            {imageZoom && (
              <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                    selectedImage === index 
                      ? 'border-primary-600 ring-2 ring-primary-200 shadow-lg' 
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <img
                    src={image || '/placeholder-product.jpg'}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="animate-fade-in-up stagger-1">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 gradient-text">
            {product.name}
          </h1>

          {product.category && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                {product.category}
              </span>
            </div>
          )}

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-2 mb-6 animate-fade-in-up stagger-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-xl ${
                      i < Math.round(product.rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-600 font-medium">
                {product.rating.toFixed(1)} ({product.reviewsCount || 0} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mb-6 animate-fade-in-up stagger-3">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-4xl font-extrabold gradient-text">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                  <span className="bg-gradient-to-r from-error-500 to-error-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg animate-scale-in">
                    -{discount}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Stock */}
          <div className="mb-6">
            <p className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
              {product.inStock ? `In Stock (${product.stock || 'Available'})` : 'Out of Stock'}
            </p>
          </div>

          {/* Quantity Selector */}
          {product.inStock && (
            <div className="mb-6 animate-fade-in-up stagger-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 transition-colors">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="p-3 hover:bg-primary-50 hover:text-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed press-effect"
                    disabled={quantity <= 1}
                  >
                    <MinusIcon className="h-5 w-5" />
                  </button>
                  <span className="px-6 py-3 min-w-[80px] text-center font-bold text-lg bg-gray-50">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="p-3 hover:bg-primary-50 hover:text-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed press-effect"
                    disabled={quantity >= (product.stock || 10)}
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={() => setIsInWishlist(!isInWishlist)}
                  className={`p-3 border-2 rounded-xl transition-all duration-300 press-effect ${
                    isInWishlist
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                  aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isInWishlist ? (
                    <HeartSolidIcon className="h-6 w-6 animate-scale-in" />
                  ) : (
                    <HeartIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <div className="flex gap-4 mb-8 animate-fade-in-up stagger-5">
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock || addingToCart}
              loading={addingToCart}
              size="lg"
              fullWidth
              className="flex-1 hover-glow press-effect shadow-lg hover:shadow-xl"
            >
              {addingToCart ? (
                'Adding...'
              ) : (
                <>
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </>
              )}
            </Button>
          </div>

          {/* Product Details */}
          {product.details && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Product Details</h3>
              <ul className="space-y-2 text-gray-600">
                {Object.entries(product.details).map(([key, value]) => (
                  <li key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

