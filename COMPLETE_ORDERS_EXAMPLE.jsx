/**
 * COMPLETE ORDERS PAGE EXAMPLE
 * Displays user's orders with proper userId filtering
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ordersService } from '../../services/firestore';
import toast from 'react-hot-toast';

const Orders = () => {
  const navigate = useNavigate();
  const { userData, isAuthenticated, loading: authLoading, requireAuth } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!requireAuth('/login')) return;
  }, [requireAuth]);

  useEffect(() => {
    if (!isAuthenticated || !userData?.uid) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // CRITICAL: Pass userId to filter orders
        // Only returns orders where userId === user.uid
        const result = await ordersService.getAll(userData.uid);
        
        if (result.success) {
          setOrders(result.data || []);
        } else {
          setError(result.error || 'Failed to load orders');
          toast.error('Failed to load orders');
        }
      } catch (err) {
        setError(err.message);
        toast.error('An error occurred while loading orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, userData?.uid]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-1">
            Track and manage all your orders
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">⚠️ Error loading orders</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <button
              onClick={() => navigate('/products')}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Products
            </button>
          </div>
        )}

        {/* Orders List */}
        {orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Order #{order.id.substring(0, 8).toUpperCase()}
                      </h3>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Order Date</p>
                        <p className="text-gray-900 font-medium">
                          {order.createdAt?.toDate?.()?.toLocaleDateString() ||
                            'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="text-gray-900 font-bold text-lg">
                          ${order.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Items</p>
                        <p className="text-gray-900">
                          {order.items?.length || 0} item(s)
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tracking</p>
                        <p className="text-gray-900">
                          {order.trackingNumber || 'Not yet shipped'}
                        </p>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-gray-600 mb-2">
                          Shipping Address:
                        </p>
                        <p className="text-sm text-gray-900">
                          {order.shippingAddress.street}
                          <br />
                          {order.shippingAddress.city},{' '}
                          {order.shippingAddress.state}{' '}
                          {order.shippingAddress.zip}
                          <br />
                          {order.shippingAddress.country}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm whitespace-nowrap"
                    >
                      View Details
                    </button>
                    {order.status === 'shipped' && order.trackingNumber && (
                      <a
                        href={`https://tracking.example.com/${order.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm whitespace-nowrap text-center"
                      >
                        Track Package
                      </a>
                    )}
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-600 mb-2">Items:</p>
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-700">
                          • {item.name} × {item.quantity} @ ${item.price?.toFixed(2)}
                        </p>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-600 italic">
                          +{order.items.length - 3} more item(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Orders Count */}
        {orders.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Showing <span className="font-bold text-gray-900">{orders.length}</span> order(s)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Status Badge Component
 */
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: '⏳',
    },
    processing: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: '⚙️',
    },
    shipped: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      icon: '📦',
    },
    delivered: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: '✅',
    },
    cancelled: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: '❌',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-block ${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-medium`}>
      {config.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default Orders;
