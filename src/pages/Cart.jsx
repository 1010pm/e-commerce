/**
 * Cart Page - Production Ready
 * Enhanced cart with quantity animations and real-time updates
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { removeItem, updateItemQuantity, clearCart } from '../store/slices/cartSlice';
import { formatCurrency } from '../utils/helpers';
import { ROUTES } from '../constants/routes';
import { APP_CONFIG } from '../constants/config';
import Button from '../components/common/Button';
import { TrashIcon, MinusIcon, PlusIcon, ShoppingCartIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { animateCounter } from '../utils/animations';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = subtotal * APP_CONFIG.TAX_RATE;
  const shipping = subtotal >= APP_CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : APP_CONFIG.SHIPPING_COST;
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
      <div className="container mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-br from-primary-100 to-primary-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
            <ShoppingCartIcon className="h-16 w-16 text-primary-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3 animate-fade-in-up">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-8 text-lg animate-fade-in-up stagger-1">
            Start shopping to add items to your cart
          </p>
          <Link to={ROUTES.PRODUCTS} className="inline-block animate-fade-in-up stagger-2">
            <Button 
              size="lg" 
              className="shadow-lg hover:shadow-xl hover-glow press-effect"
            >
              Continue Shopping →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fade-in">
      <div className="mb-10 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-extrabold gradient-text mb-2">
          Shopping Cart
        </h1>
        <p className="text-gray-600 text-lg">
          {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Clear Cart Button */}
          <div className="flex justify-end mb-4 animate-fade-in-up">
            <button
              onClick={handleClearCart}
              className="text-sm font-semibold text-red-600 hover:text-red-700 transition-all hover:scale-105 press-effect"
            >
              Clear Cart
            </button>
          </div>

          {/* Items */}
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md border border-gray-100 p-5 flex gap-5 hover:shadow-xl transition-all duration-300 hover-lift animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Image */}
              <img
                src={item.image || '/placeholder-product.jpg'}
                alt={item.name}
                className="w-28 h-28 object-cover rounded-xl shadow-sm"
              />

              {/* Info */}
              <div className="flex-1">
                <Link to={`${ROUTES.PRODUCTS}/${item.id}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-primary-600 mb-1">
                    {item.name}
                  </h3>
                </Link>
                <p className="text-lg font-bold text-primary-600 mb-2">
                  {formatCurrency(item.price)}
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 transition-colors">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="p-2 hover:bg-primary-50 hover:text-primary-600 transition-all press-effect"
                    >
                      <MinusIcon className="h-5 w-5" />
                    </button>
                    <span className="px-4 py-2 min-w-[60px] text-center text-base font-bold bg-gray-50 transition-all">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="p-2 hover:bg-primary-50 hover:text-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed press-effect"
                      disabled={item.quantity >= (item.stock || 999)}
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all press-effect"
                    aria-label="Remove item"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax ({APP_CONFIG.TAX_RATE * 100}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatCurrency(shipping)
                  )}
                </span>
              </div>
              {subtotal < APP_CONFIG.FREE_SHIPPING_THRESHOLD && (
                <p className="text-sm text-gray-500">
                  Add {formatCurrency(APP_CONFIG.FREE_SHIPPING_THRESHOLD - subtotal)} for free shipping
                </p>
              )}
            </div>

            <div className="border-t-2 border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-2xl font-bold gradient-text">
                <span>Total</span>
                <span className="transition-all duration-300">
                  {formatCurrency(animatedTotal)}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleCheckout} 
              size="lg" 
              fullWidth 
              className="shadow-lg hover:shadow-xl hover-glow press-effect"
            >
              Proceed to Checkout →
            </Button>

            <Link to={ROUTES.PRODUCTS} className="block mt-4 text-center text-primary-600 hover:text-primary-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

