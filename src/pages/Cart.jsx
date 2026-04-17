/**
 * Shopping Cart Page - Premium Checkout Experience
 * Enhanced cart with statistics, trust indicators, and optimized checkout flow
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { removeItem, updateItemQuantity, clearCart } from '../store/slices/cartSlice';
import { formatCurrency } from '../utils/helpers';
import Currency from '../components/common/Currency';
import { ROUTES } from '../constants/routes';
import { APP_CONFIG } from '../constants/config';
import Button from '../components/common/Button';
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  TruckIcon,
  ShieldCheckIcon,
  GiftIcon,
  TimerIcon,
  ArrowPathIcon,
  SparklesIcon,
  LockClosedIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { animateCounter } from '../utils/animations';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = 0; // No tax
  const shipping = 2; // Fixed 2 OMR shipping
  const total = subtotal + tax + shipping;

  const [animatedTotal, setAnimatedTotal] = useState(total);

  // Animate total when it changes
  useEffect(() => {
    if (animatedTotal !== total) {
      animateCounter(animatedTotal, total, 500, setAnimatedTotal);
    }
  }, [total, animatedTotal]);

  const handleQuantityChange = (id, change) => {
    const item = items.find((item) => item.id === id);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        dispatch(removeItem(id));
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-success-500" />
            <span>Item removed from cart</span>
          </div>,
          { duration: 2000 }
        );
      } else if (newQuantity <= (item.stock || 999)) {
        dispatch(updateItemQuantity({ id, quantity: newQuantity }));
      } else {
        toast.error('Not enough stock available');
      }
    }
  };

  const handleRemoveItem = (id) => {
    dispatch(removeItem(id));
    toast.success('Item removed from cart');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
      toast.success('Cart cleared');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate(ROUTES.LOGIN);
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate(ROUTES.CHECKOUT);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white py-12 md:py-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-5 rounded-full -ml-40 -mb-40"></div>

          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2">Shopping Cart</h1>
            <p className="text-lg md:text-xl text-primary-100">Ready to start shopping?</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
              <div className="bg-gradient-to-br from-primary-100 to-primary-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 animate-bounce-subtle">
                <ShoppingCartIcon className="h-16 w-16 text-primary-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-3 animate-fade-in-up">
                Your cart is empty
              </h2>
              
              <p className="text-gray-600 mb-8 animate-fade-in-up text-base">
                Discover amazing products and start building your perfect order. Free shipping on orders over {formatCurrency(APP_CONFIG.FREE_SHIPPING_THRESHOLD)}!
              </p>

              {/* Trust Indicators */}
              <div className="space-y-3 mb-10 animate-fade-in-up">
                <div className="flex items-center justify-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-700">100% Safe & Secure</span>
                </div>
                <div className="flex items-center justify-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <TruckIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-blue-700">Fast & Free Delivery Available</span>
                </div>
                <div className="flex items-center justify-center gap-3 p-3 bg-amber-50 rounded-lg">
                  <GiftIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-amber-700">Exclusive Deals & Offers</span>
                </div>
              </div>

              <Link to={ROUTES.PRODUCTS} className="inline-block w-full">
                <Button size="lg" fullWidth className="shadow-lg hover:shadow-xl hover-glow press-effect mb-3">
                  🛍️ Start Shopping
                </Button>
              </Link>
              
              <Button variant="outline" size="lg" fullWidth onClick={() => navigate(-1)}>
                Continue browsing
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2">Shopping Cart</h1>
          <p className="text-lg md:text-xl text-primary-100">
            {items.length} {items.length === 1 ? 'item' : 'items'} ready for checkout
          </p>
        </div>
      </div>

      {/* Cart Statistics */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Items Count */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{items.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Subtotal */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Subtotal</p>
                <p className="text-3xl font-bold text-gray-900 mt-2"><Currency amount={subtotal} size="lg" /></p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Savings */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-md border border-amber-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Est. Total</p>
                <p className="text-3xl font-bold text-amber-900 mt-2"><Currency amount={total} size="lg" /></p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 animate-fade-in-up">
            {/* Clear Cart Button */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 border border-gray-200">
              <p className="font-semibold text-gray-900">Items in cart</p>
              <button
                onClick={handleClearCart}
                className="text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-all"
              >
                🗑️ Clear All
              </button>
            </div>

            {/* Items */}
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex gap-6 items-start">
                  {/* Image */}
                  <div className="relative">
                    <img
                      src={item.image || '/placeholder-product.svg'}
                      alt={item.name}
                      className="w-32 h-32 object-cover rounded-lg shadow-md"
                    />
                    {item.stock <= 5 && item.stock > 0 && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        Only {item.stock} left
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link to={`${ROUTES.PRODUCTS}/${item.id}`}>
                      <h3 className="font-bold text-gray-900 hover:text-primary-600 text-lg mb-2 transition-colors">
                        {item.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-2xl font-bold text-primary-600">
                        <Currency amount={item.price} />
                      </p>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <p className="text-sm text-gray-500 line-through">
                          <Currency amount={item.originalPrice} />
                        </p>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden hover:border-primary-400 transition-colors">
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="p-2 hover:bg-primary-50 hover:text-primary-600 transition-all"
                        >
                          <MinusIcon className="h-5 w-5" />
                        </button>
                        <span className="px-6 py-2 min-w-[70px] text-center text-base font-bold bg-gray-50">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="p-2 hover:bg-primary-50 hover:text-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.quantity >= (item.stock || 999)}
                        >
                          <PlusIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700 p-2.5 rounded-lg hover:bg-red-50 transition-all"
                        aria-label="Remove item"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      <Currency amount={item.price * item.quantity} />
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {item.quantity} × <Currency amount={item.price} />
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24 space-y-6 animate-fade-in-up max-h-[calc(100vh-150px)] overflow-y-auto">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-b border-gray-200 pb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold"><Currency amount={subtotal} /></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold"><Currency amount={shipping} /></span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Total:</span>
                  <span className="text-3xl font-bold text-primary-600 transition-all duration-300">
                    <Currency amount={animatedTotal} size="lg" />
                  </span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <LockClosedIcon className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">Secure Checkout</span>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                size="lg"
                fullWidth
                className="shadow-lg hover:shadow-xl hover-glow press-effect"
              >
                💳 Proceed to Checkout
              </Button>

              {/* Continue Shopping */}
              <Link to={ROUTES.PRODUCTS} className="block">
                <Button variant="outline" size="lg" fullWidth>
                  Continue Shopping
                </Button>
              </Link>

              {/* Trust Indicators */}
              <div className="space-y-2 border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-600">30-day returns</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <TruckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-600">Fast delivery</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <LockClosedIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-gray-600">Secure payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

