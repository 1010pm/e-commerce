/**
 * Order Details Page - Production Ready
 * Displays complete order information with status tracking
 * صفحة تفاصيل الطلب
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersService } from '../services/ordersService';
import { formatCurrency, formatDate } from '../utils/helpers';
import { ROUTES } from '../constants/routes';
import Button from '../components/common/Button';
import { Spinner } from '../components/common/Loading';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

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

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    processing: 'bg-blue-100 text-blue-800 border-blue-300',
    shipped: 'bg-purple-100 text-purple-800 border-purple-300',
    delivered: 'bg-green-100 text-green-800 border-green-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
  };

  const paymentStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(ROUTES.ORDERS)}
            className="text-primary-600 hover:text-primary-700 font-medium mb-4 flex items-center gap-2"
          >
            ← Back to Orders
          </button>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
            Order #{order.id?.slice(0, 8).toUpperCase() || 'N/A'}
          </h1>
          <p className="text-gray-600">
            Placed on {formatDate(order.createdAt?.toDate?.() || order.createdAt)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status</h2>

              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Current Status</p>
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${
                      statusColors[order.status] || statusColors.pending
                    }`}
                  >
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                      paymentStatusColors[order.paymentStatus] || paymentStatusColors.pending
                    }`}
                  >
                    {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) ||
                      'Pending'}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Payment Method</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {order.paymentMethod || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>

              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={item.image || '/placeholder-product.svg'}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-gray-600 mt-1">
                        Quantity: <span className="font-medium">{item.quantity}</span>
                      </p>
                      <p className="text-gray-600">
                        Unit Price: <span className="font-medium">{formatCurrency(item.price)}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">
                        {formatCurrency(item.subtotal || item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>

              <div className="text-gray-900 space-y-2">
                <p className="font-semibold">
                  {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                </p>
                <p>{order.shippingAddress?.addressLine}</p>
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
                  {order.shippingAddress?.zipCode}
                </p>
                <p>{order.shippingAddress?.country}</p>
                <p className="text-gray-600 mt-4">
                  Email: <span className="font-medium">{order.shippingAddress?.email}</span>
                </p>
                <p className="text-gray-600">
                  Phone: <span className="font-medium">{order.shippingAddress?.phone}</span>
                </p>
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Notes</h2>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            {!['delivered', 'cancelled'].includes(order.status) && (
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleCancelOrder}
                  disabled={loading}
                >
                  Cancel Order
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3 text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(order.subtotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(order.tax || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-medium text-gray-900">
                      {order.shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        formatCurrency(order.shipping || 0)
                      )}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">{formatCurrency(order.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Order Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(order.createdAt?.toDate?.() || order.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(order.updatedAt?.toDate?.() || order.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Help Section */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => navigate(ROUTES.CONTACT)}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
