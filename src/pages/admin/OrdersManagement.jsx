/**
 * Orders Management Page
 * صفحة إدارة الطلبات
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersService } from '../../services/firestore';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/common/Button';
import { Spinner } from '../../components/common/Loading';
import toast from 'react-hot-toast';

const OrdersManagement = () => {
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (id && orders.length > 0) {
      const order = orders.find((o) => o.id === id);
      if (order) {
        setSelectedOrder(order);
      }
    }
  }, [id, orders]);

  const loadOrders = async () => {
    setLoading(true);
    const result = await ordersService.getAll();
    if (result.success) {
      setOrders(result.data);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, status) => {
    const result = await ordersService.update(orderId, { status });
    if (result.success) {
      toast.success('Order status updated!');
      loadOrders();
    } else {
      toast.error('Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (id && selectedOrder) {
    return (
      <div>
        <Link to={ROUTES.ADMIN_ORDERS} className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← Back to Orders
        </Link>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Details</h1>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-semibold">{selectedOrder.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold capitalize">{selectedOrder.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="font-semibold text-lg">{formatCurrency(selectedOrder.total)}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              {selectedOrder.items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded mb-2">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Management</h1>
        <p className="text-gray-600">View and manage customer orders</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.shippingAddress?.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.createdAt ? formatDate(order.createdAt.toDate()) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {formatCurrency(order.total || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status || 'pending'}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`${ROUTES.ADMIN_ORDERS_DETAILS.replace(':id', order.id)}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersManagement;

