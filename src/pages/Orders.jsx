/**
 * Orders Page
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

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (user?.uid) {
        setLoading(true);
        const result = await ordersService.getAll(user.uid);
        if (result.success) {
          setOrders(result.data);
        }
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {order.createdAt ? formatDate(order.createdAt.toDate()) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">
                      {formatCurrency(order.total || 0)}
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.status || 'pending'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {order.items?.length || 0} item(s)
                    </p>
                    <Link
                      to={ROUTES.ORDER_DETAILS.replace(':id', encodeURIComponent(order.id))}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                      title={`Order ID: ${order.id}`}
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
};

export default Orders;

