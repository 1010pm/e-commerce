/**
 * Modern Orders Management Page - Premium Edition
 * Advanced order tracking with analytics, status management, and detailed order views
 */

import React, { useEffect, useState } from 'react';
import { ordersService } from '../../services/ordersService';
import { formatCurrency } from '../../utils/helpers';
import Badge from '../../components/admin/Badge';
import Modal from '../../components/admin/Modal';
import EmptyState from '../../components/admin/EmptyState';
import { SkeletonTable } from '../../components/admin/SkeletonLoader';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TruckIcon,
  XMarkIcon,
  TrashIcon,
  CalendarIcon,
  CreditCardIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ModernOrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await ordersService.getAllOrders();
      if (result.success) {
        setOrders(result.data || []);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((order) =>
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter((order) => order.paymentStatus === paymentFilter);
    }

    // Sort by newest first
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt) || 0;
      const dateB = new Date(b.createdAt) || 0;
      return dateB - dateA;
    });

    setFilteredOrders(filtered);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const result = await ordersService.updateStatus(orderId, newStatus);
      if (result.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        setSelectedOrder({ ...selectedOrder, status: newStatus });
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span>Order status updated to {newStatus}</span>
          </div>
        );
      } else {
        throw new Error(result.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('❌ ' + (error.message || 'Failed to update order'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    setUpdatingId(orderId);
    try {
      const result = await ordersService.updatePaymentStatus(orderId, newPaymentStatus);
      
      if (result.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o));
        setSelectedOrder({ ...selectedOrder, paymentStatus: newPaymentStatus });
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span>Payment status updated to {newPaymentStatus}</span>
          </div>
        );
      } else {
        throw new Error(result.error || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('❌ ' + (error.message || 'Failed to update payment status'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    
    setUpdatingId(orderId);
    try {
      const result = await ordersService.delete(orderId);
      if (result.success) {
        setOrders(orders.filter(o => o.id !== orderId));
        toast.success('✅ Order deleted successfully');
        setShowModal(false);
      } else {
        throw new Error(result.error || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('❌ ' + (error.message || 'Failed to delete order'));
    } finally {
      setUpdatingId(null);
    }
  };

  // Statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const paidRevenue = orders.filter(o => o.paymentStatus === 'completed').reduce((sum, order) => sum + (order.total || 0), 0);
  const unpaidOrders = orders.filter(o => o.paymentStatus === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5" />;
      case 'processing':
        return <ShoppingBagIcon className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'cancelled':
        return <XMarkIcon className="h-5 w-5" />;
      default:
        return <ShoppingBagIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'info';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'info';
    }
  };

  const getPaymentStatusIcon = (paymentStatus) => {
    switch (paymentStatus) {
      case 'pending':
        return <ExclamationCircleIcon className="h-5 w-5" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'failed':
        return <XMarkIcon className="h-5 w-5" />;
      case 'refunded':
        return <CreditCardIcon className="h-5 w-5" />;
      default:
        return <CreditCardIcon className="h-5 w-5" />;
    }
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      card: '💳 Card',
      bank: '🏦 Bank Transfer',
      wallet: '👛 Digital Wallet',
      cash: '💵 Cash on Delivery',
      thawani: '🔐 Thawani',
    };
    return methods[method] || method || 'Unknown';
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
          <p className="text-gray-600">Manage and track all customer orders</p>
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
        <p className="text-gray-600">Manage and track all customer orders</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(paidRevenue)}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unpaid Orders</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{unpaidOrders}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{deliveredOrders}</p>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TruckIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Order Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
          >
            <option value="all">Payment: All</option>
            <option value="pending">Payment: Unpaid</option>
            <option value="completed">Payment: Paid</option>
            <option value="failed">Payment: Failed</option>
            <option value="refunded">Payment: Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    {/* Order ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">#{order.id?.slice(-8) || 'Unknown'}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{order.shippingAddress?.email}</p>
                      </div>
                    </td>

                    {/* Items Count */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(order.total || 0)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge status={getStatusColor(order.status)}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                      </Badge>
                    </td>

                    {/* Payment Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge status={getPaymentStatusColor(order.paymentStatus)}>
                        <div className="flex items-center gap-1">
                          {getPaymentStatusIcon(order.paymentStatus)}
                          <span>{order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) || 'Pending'}</span>
                        </div>
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon="📦"
          title="No orders found"
          description="Try adjusting your search or filters to find orders"
        />
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`Order #${selectedOrder.id?.slice(-8)}`}
          size="lg"
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                disabled={updatingId === selectedOrder.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Order
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Order Header */}
            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedOrder.createdAt)} at {formatTime(selectedOrder.createdAt)}
                  </p>
                </div>
                <Badge status={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status?.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Status Management */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <p className="text-xs font-semibold text-gray-700 uppercase mb-3 block">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {['pending', 'processing', 'delivered', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedOrder.id, status)}
                    disabled={updatingId === selectedOrder.id}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedOrder.status === status
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white border border-indigo-200 text-gray-700 hover:bg-indigo-100'
                    }`}
                  >
                    {getStatusIcon(status)}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Status Management */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 uppercase mb-2 block">Payment Information</p>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="font-semibold text-gray-900 mt-1">{getPaymentMethodDisplay(selectedOrder.paymentMethod)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Status</p>
                    <Badge status={getPaymentStatusColor(selectedOrder.paymentStatus)} className="mt-1">
                      {selectedOrder.paymentStatus?.charAt(0).toUpperCase() + selectedOrder.paymentStatus?.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-700 uppercase mb-3 block">Mark Payment As</p>
              <div className="grid grid-cols-2 gap-2">
                {['pending', 'completed', 'failed', 'refunded'].map((paymentStatus) => (
                  <button
                    key={paymentStatus}
                    onClick={() => handlePaymentStatusChange(selectedOrder.id, paymentStatus)}
                    disabled={updatingId === selectedOrder.id}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedOrder.paymentStatus === paymentStatus
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-white border border-green-200 text-gray-700 hover:bg-green-100'
                    }`}
                  >
                    {getPaymentStatusIcon(paymentStatus)}
                    {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Customer Information</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Name</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                  <p className="text-gray-900 font-medium mt-1 truncate">{selectedOrder.shippingAddress?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                  <p className="text-gray-900 font-medium mt-1">{selectedOrder.shippingAddress?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Order Items ({selectedOrder.items?.length || 0})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Qty: <span className="font-medium">{item.quantity}</span>
                        {item.sku && ` • SKU: ${item.sku}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-2 mb-3">
                <TruckIcon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-gray-900">Shipping Address</p>
              </div>
              <div className="text-sm text-gray-700 space-y-1 ml-7">
                <p className="font-medium">
                  {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}
                </p>
                <p>{selectedOrder.shippingAddress?.street}</p>
                <p>
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}{' '}
                  {selectedOrder.shippingAddress?.zipCode}
                </p>
                {selectedOrder.shippingAddress?.country && (
                  <p>{selectedOrder.shippingAddress?.country}</p>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(selectedOrder.subtotal || 0)}
                </span>
              </div>
              {selectedOrder.tax > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Tax</span>
                  <span className="font-medium text-gray-900">{formatCurrency(selectedOrder.tax)}</span>
                </div>
              )}
              {selectedOrder.shipping > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Shipping</span>
                  <span className="font-medium text-gray-900">{formatCurrency(selectedOrder.shipping)}</span>
                </div>
              )}
              <div className="border-t border-indigo-300 pt-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-indigo-600">
                  {formatCurrency(selectedOrder.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ModernOrdersManagement;
