/**
 * Checkout Page
 * صفحة الدفع
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../store/slices/cartSlice';
import { ordersService } from '../services/ordersService';
import { checkoutService } from '../services/checkoutService';
import { getUserProfile } from '../services/userService';
import { formatCurrency } from '../utils/helpers';
import { ROUTES } from '../constants/routes';
import { APP_CONFIG } from '../constants/config';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { validateForm } from '../utils/validators';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    paymentMethod: 'card',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCVC: '',
  });
  const [errors, setErrors] = useState({});

  // Load user profile data for auto-fill
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!authUser?.uid) {
          setProfileLoading(false);
          return;
        }

        const result = await getUserProfile(authUser.uid);
        if (result.success && result.data) {
          const { displayName, phoneNumber, address } = result.data;
          const [firstName, ...lastNameParts] = (displayName || '').split(' ');

          setFormData((prev) => ({
            ...prev,
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            phone: phoneNumber || '',
            addressLine: address?.addressLine || '',
            city: address?.city || '',
            state: address?.state || '',
            zipCode: address?.zipCode || '',
            country: address?.country || 'US',
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [authUser?.uid]);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = subtotal * APP_CONFIG.TAX_RATE;
  const shipping = subtotal >= APP_CONFIG.FREE_SHIPPING_THRESHOLD ? 0 : APP_CONFIG.SHIPPING_COST;
  const total = subtotal + tax + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authUser?.uid) {
      toast.error('Please sign in to continue');
      navigate(ROUTES.LOGIN);
      return;
    }

    // Validate shipping address
    const addressValidation = checkoutService.validateShippingAddress({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      addressLine: formData.addressLine,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country,
    });

    if (!addressValidation.valid) {
      setErrors(addressValidation.errors);
      toast.error('Please fill in all required fields correctly');
      return;
    }

    // Validate payment if using card
    if (formData.paymentMethod === 'card') {
      const paymentValidation = checkoutService.validatePayment({
        method: 'card',
        cardNumber: formData.cardNumber,
        cardName: formData.cardName,
        cardExpiry: formData.cardExpiry,
        cardCVC: formData.cardCVC,
      });

      if (!paymentValidation.valid) {
        setErrors((prev) => ({ ...prev, ...paymentValidation.errors }));
        toast.error('Please check your payment information');
        return;
      }
    }

    setLoading(true);
    try {
      // Prepare order data
      const orderData = checkoutService.prepareOrderData(
        {
          items,
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            addressLine: formData.addressLine,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          payment: {
            method: formData.paymentMethod,
            cardNumber: formData.cardNumber,
            cardName: formData.cardName,
            cardExpiry: formData.cardExpiry,
            cardCVC: formData.cardCVC,
          },
          totals: {
            subtotal,
            tax,
            shipping,
            total,
          },
          orderNotes: '',
        },
        authUser.uid
      );

      // Create order using ordersService
      const result = await ordersService.create(authUser.uid, orderData);

      if (result.success) {
        dispatch(clearCart());
        toast.success('Order placed successfully! ✅');
        navigate(ROUTES.ORDER_DETAILS.replace(':id', encodeURIComponent(result.data.id)));
      } else {
        toast.error(result.error || 'Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-4">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fade-in">
        <div className="mb-10 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold gradient-text mb-2">
            Checkout
          </h1>
          <p className="text-gray-600 text-lg">
            Complete your order securely
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-700 text-xl font-semibold mb-2">
                Your cart is empty
              </p>
              <p className="text-gray-500 mb-6">
                Add items to your cart to continue
              </p>
              <Button 
                onClick={() => navigate(ROUTES.PRODUCTS)} 
                size="lg"
                className="hover-lift press-effect"
              >
                Continue Shopping →
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in-up">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    <Input
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      error={errors.firstName}
                      required
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      error={errors.lastName}
                      required
                    />
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      required
                    />
                    <Input
                      label="Phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      required
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Address"
                        name="addressLine"
                        value={formData.addressLine}
                        onChange={handleChange}
                        error={errors.addressLine}
                        required
                      />
                    </div>
                    <Input
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      error={errors.city}
                      required
                    />
                    <Input
                      label="State"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      error={errors.state}
                      required
                    />
                    <Input
                      label="ZIP Code"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      error={errors.zipCode}
                      required
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        error={errors.country}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in-up stagger-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handleChange}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-medium text-gray-900">Credit/Debit Card</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === 'cash'}
                        onChange={handleChange}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-medium text-gray-900">Cash on Delivery</span>
                    </label>
                  </div>

                  {formData.paymentMethod === 'card' && (
                    <div className="mt-6 space-y-4">
                      <Input
                        label="Card Number"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                      <Input
                        label="Cardholder Name"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleChange}
                        placeholder="John Doe"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiry Date"
                          name="cardExpiry"
                          value={formData.cardExpiry}
                          onChange={handleChange}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                        <Input
                          label="CVC"
                          name="cardCVC"
                          value={formData.cardCVC}
                          onChange={handleChange}
                          placeholder="123"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24 animate-fade-in-up stagger-2">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

                  {/* Items */}
                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <img
                          src={item.image || '/placeholder-product.svg'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-3 mb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax ({APP_CONFIG.TAX_RATE * 100}%)</span>
                      <span className="font-medium">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="font-medium">
                        {shipping === 0 ? (
                          <span className="text-success-600">Free</span>
                        ) : (
                          formatCurrency(shipping)
                        )}
                      </span>
                    </div>
                    {subtotal < APP_CONFIG.FREE_SHIPPING_THRESHOLD && (
                      <p className="text-xs text-gray-500 pt-2">
                        Add {formatCurrency(APP_CONFIG.FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
                      </p>
                    )}
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span className="gradient-text">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    loading={loading} 
                    size="lg" 
                    fullWidth
                    className="shadow-sm hover:shadow press-effect"
                  >
                    Place Order
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
  );
};

export default Checkout;

