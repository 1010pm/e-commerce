/**
 * Payments Table Component
 * Displays list of payments with search, filter, and sort
 */

import React, { useState, useCallback } from 'react';
import Badge from './Badge';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const PaymentsTable = ({
  payments = [],
  loading = false,
  onPaymentClick,
  onSearch,
  onFilterChange,
  hasMore = false,
  onLoadMore,
  onLoadPrevious,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSearch = useCallback(
    (e) => {
      const term = e.target.value;
      setSearchTerm(term);
      onSearch?.(term);
    },
    [onSearch]
  );

  const handleStatusFilter = useCallback(
    (e) => {
      const status = e.target.value;
      setStatusFilter(status);
      onFilterChange?.({ status: status === 'all' ? null : status });
    },
    [onFilterChange]
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'inactive';
      default:
        return 'info';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email, name, or payment ID..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={handleStatusFilter}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Payment ID</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Customer</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Method</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onPaymentClick?.(payment)}
                >
                  <td className="px-6 py-4 text-gray-900 font-mono text-xs">
                    {payment.id?.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{payment.customerName || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{payment.customerEmail || 'No email'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {payment.amount?.toFixed(2) || '0.00'} {payment.currency || 'OMR'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={payment.status}>
                      {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || 'Unknown'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-600 capitalize">
                    {payment.paymentMethod || 'thawani'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPaymentClick?.(payment);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(hasMore || onLoadPrevious) && (
        <div className="flex items-center justify-between">
          <button
            onClick={onLoadPrevious}
            disabled={!onLoadPrevious}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </button>
          {hasMore && (
            <button
              onClick={onLoadMore}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Load More
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentsTable;
