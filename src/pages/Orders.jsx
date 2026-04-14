/**
 * Orders Page - My Orders with Auth Protection
 * صفحة الطلبات
 */

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ordersService } from '../services/ordersService';
import { formatCurrency, formatDate } from '../utils/helpers';
import { ROUTES } from '../constants/routes';
import { Spinner } from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  DocumentChartBarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const Orders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user?.uid) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    const fetchOrders = async () => {
      if (user?.uid) {
        setLoading(true);
        try {
          const result = await ordersService.getAll(user.uid);
          if (result.success) {
            setOrders(result.data || []);
          } else {
            setOrders([]);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
          setOrders([]);
        } finally {
          setLoading(false);
        }
      }
    };

    if (!authLoading && user?.uid) {
      fetchOrders();
    }
  }, [user?.uid, authLoading, navigate]);

  // Show loading spinner while checking authentication
  if (authLoading || (loading && user?.uid)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  // Should already be redirected by useEffect, but just in case
  if (!user?.uid) {
    return null;
  }

  // Get status icon and color
  const getStatusInfo = (status) => {
    const statusMap = {
      'pending': {
        icon: <ClockIcon className="w-5 h-5" />,
        color: 'bg-yellow-100 text-yellow-800',
        textColor: 'text-yellow-800',
        label: 'Pending'
      },
      'processing': {
        icon: <DocumentChartBarIcon className="w-5 h-5" />,
        color: 'bg-blue-100 text-blue-800',
        textColor: 'text-blue-800',
        label: 'Processing'
      },
      'shipped': {
        icon: <TruckIcon className="w-5 h-5" />,
        color: 'bg-indigo-100 text-indigo-800',
        textColor: 'text-indigo-800',
        label: 'Shipped'
      },
      'delivered': {
        icon: <CheckCircleIcon className="w-5 h-5" />,
        color: 'bg-green-100 text-green-800',
        textColor: 'text-green-800',
        label: 'Delivered'
      },
    };
    return statusMap[status] || statusMap['pending'];
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
        <p className="text-gray-600">Track and manage all your orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <EmptyState
            icon="📋"
            title="No orders yet"
            description="You haven't placed any orders yet. Start shopping to see your orders here."
            actionLabel="Start Shopping"
            onAction={() => navigate(ROUTES.PRODUCTS)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <div 
                key={order.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.createdAt ? formatDate(order.createdAt.toDate?.() || order.createdAt) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right w-full sm:w-auto">
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(order.total || 0)}
                    </p>
                    {order.paymentStatus && (
                      <p className={`text-xs font-medium mt-1 ${
                        order.paymentStatus === 'completed' 
                          ? 'text-green-600' 
                          : 'text-amber-600'
                      }`}>
                        {order.paymentStatus === 'completed' ? '✅ Paid' : '⏱️ Pending Payment'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                    <p className="text-lg font-semibold text-gray-900">{order.items?.length || 0} item(s)</p>
                  </div>
                  {order.shippingInfo && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shipping To</p>
                      <p className="text-sm text-gray-700">
                        {order.shippingInfo.address || 'Address not provided'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <Link
                    to={ROUTES.ORDER_DETAILS.replace(':id', encodeURIComponent(order.id))}
                    className="inline-flex items-center gap-2"
                  >
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      View Details
                      <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;

