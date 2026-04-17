/**
 * Order Details Page - Production Ready
 * Displays complete order information with status tracking
 * صفحة تفاصيل الطلب
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersService } from '../services/ordersService';
import { formatDate } from '../utils/helpers';
import Currency from '../components/common/Currency';
import { ROUTES } from '../constants/routes';
import Button from '../components/common/Button';
import { Spinner } from '../components/common/Loading';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  MapPinIcon,
  ShoppingBagIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

const OrderDetails = () => {
  const params = useParams();
  const orderId = params.id ? decodeURIComponent(params.id) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);

        if (!user?.uid) {
          setError('User not authenticated');
          return;
        }

        if (!orderId || orderId.trim() === '') {
          console.error('Order ID is empty:', orderId);
          setError('Invalid order ID');
          return;
        }

        console.log('Loading order:', { orderId, userId: user.uid });

        const result = await ordersService.getById(orderId, user.uid);

        if (result.success) {
          setOrder(result.data);
        } else {
          console.error('Order fetch error:', result.error);
          setError(result.error);
          toast.error(result.error);
        }
      } catch (err) {
        console.error('Load order error:', err);
        setError('Failed to load order details');
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, user?.uid]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setLoading(true);
      console.log('Starting order cancellation:', { orderId, userId: user.uid });
      
      const result = await ordersService.cancel(orderId, user.uid, 'Cancelled by customer');

      if (result.success) {
        toast.success(result.message);
        console.log('Cancel succeeded, reloading order...');
        
        // Reload order
        const reloadResult = await ordersService.getById(orderId, user.uid);
        if (reloadResult.success) {
          setOrder(reloadResult.data);
        }
      } else {
        console.error('Cancel failed:', result.error);
        toast.error(result.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error('Failed to cancel order: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-gray-700 text-xl font-semibold mb-2">
              {error || 'Order not found'}
            </p>
            <Button onClick={() => navigate(ROUTES.ORDERS)}>
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(ROUTES.ORDERS)}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Orders
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Order #{order.id?.slice(0, 8).toUpperCase() || 'N/A'}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Placed on {formatDate(order.createdAt?.toDate?.() || order.createdAt)}
              </p>
            </div>
            
            {/* Status Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-lg bg-white border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">Order Status</p>
                <div className="flex items-center gap-1">
                  <ShoppingBagIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-gray-900 capitalize">
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                  </span>
                </div>
              </div>
              
              <div className="px-4 py-2 rounded-lg bg-white border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-1">Payment</p>
                <div className="flex items-center gap-1">
                  <CreditCardIcon className={`h-4 w-4 ${order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`} />
                  <span className={`font-semibold capitalize ${order.paymentStatus === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>
                    {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) || 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBagIcon className="h-5 w-5 text-blue-600" />
                  Order Items ({order.items?.length || 0})
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {order.items?.map((item, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={item.image || '/placeholder-product.svg'}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                        <div className="flex gap-4 mt-3 text-sm">
                          <span className="text-gray-600">
                            Quantity: <span className="font-semibold text-gray-900">{item.quantity}</span>
                          </span>
                          <span className="text-gray-600">
                            Unit Price: <span className="font-semibold text-gray-900"><Currency amount={item.price} /></span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">
                          <Currency amount={item.subtotal || item.price * item.quantity} />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-green-600" />
                  Shipping Address
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-semibold text-gray-900">
                      {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="text-gray-900">{order.shippingAddress?.addressLine}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">City</p>
                      <p className="text-gray-900">{order.shippingAddress?.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">ZIP Code</p>
                      <p className="text-gray-900">{order.shippingAddress?.zipCode}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Country</p>
                      <p className="text-gray-900">{order.shippingAddress?.country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone</p>
                      <p className="text-gray-900 font-mono">{order.shippingAddress?.phone}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-gray-900 break-all">{order.shippingAddress?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Order Notes</h3>
                <p className="text-gray-700 leading-relaxed">{order.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            {!['delivered', 'cancelled'].includes(order.status) && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelOrder}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel Order
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden sticky top-20">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
              </div>

              <div className="p-6 space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    <Currency amount={order.subtotal || 0} />
                  </span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {order.shipping === 0 ? (
                      <span className="text-green-600 font-bold">Free</span>
                    ) : (
                      <Currency amount={order.shipping || 0} />
                    )}
                  </span>
                </div>

                {/* Tax if applicable */}
                {order.tax > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-semibold text-gray-900">
                      <Currency amount={order.tax || 0} />
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200 pt-4"></div>

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    <Currency amount={order.total || 0} size="lg" />
                  </span>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Timeline</h3>
              
              <div className="space-y-4">
                {/* Created */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Order Created</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(order.createdAt?.toDate?.() || order.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Updated */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <ClockIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Last Updated</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(order.updatedAt?.toDate?.() || order.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full ${order.status === 'delivered' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      <TruckIcon className={`h-5 w-5 ${order.status === 'delivered' ? 'text-green-600' : 'text-yellow-600'}`} />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Processing'}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">
                      {order.status === 'delivered' ? 'Delivery completed' : 'In progress'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-700 mb-4">
                If you have any questions about your order, please don't hesitate to reach out.
              </p>
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate(ROUTES.CONTACT)}
                size="sm"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
