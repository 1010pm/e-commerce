/**
 * Enhanced Payments Table Component
 * Modern, responsive payment list with actions and real-time status
 */

import React from 'react';
import {
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { SkeletonLoader } from './SkeletonLoader';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const EnhancedPaymentsTable = ({ 
  payments, 
  loading, 
  onViewDetails, 
  isDarkMode = false 
}) => {
  const bgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const hoverClass = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDarkMode ? 'text-gray-200' : 'text-gray-900';

  const statusColors = {
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const statusIcons = {
    paid: '✓',
    pending: '⏳',
    failed: '✗',
  };

  const copyTransaction = (transactionId) => {
    navigator.clipboard.writeText(transactionId);
    toast.success('Transaction ID copied!');
  };

  if (loading) {
    return (
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <SkeletonLoader count={5} height="h-12" />
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className={`${bgClass} p-12 text-center`}>
        <div className="text-5xl mb-4">📭</div>
        <p className={`text-lg font-semibold ${textClass}`}>No payments found</p>
        <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* Header */}
        <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${borderClass}`}>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Transaction ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Customer
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Amount
            </th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className={`divide-y ${borderClass}`}>
          {payments.map((payment) => (
            <tr
              key={payment.paymentId}
              className={`${hoverClass} transition-colors duration-150`}
            >
              {/* Transaction ID */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <code className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 break-all">
                      {payment.transactionId ? payment.transactionId.substring(0, 16) : 'N/A'}
                      {payment.transactionId && payment.transactionId.length > 16 && '...'}
                    </code>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ID: {payment.paymentId?.substring(0, 8)}...
                    </p>
                  </div>
                  {payment.transactionId && (
                    <button
                      onClick={() => copyTransaction(payment.transactionId)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Copy Transaction ID"
                    >
                      <ClipboardDocumentCheckIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    </button>
                  )}
                </div>
              </td>

              {/* Customer */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <p className="font-semibold text-sm">{payment.customerName || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {payment.customerEmail || 'No email'}
                  </p>
                </div>
              </td>

              {/* Amount */}
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  OMR {(payment.amount || 0).toFixed(3)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {payment.itemsCount} item{payment.itemsCount !== 1 ? 's' : ''}
                </p>
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    statusColors[payment.status] || statusColors.pending
                  }`}
                >
                  {statusIcons[payment.status]} {payment.status?.toUpperCase()}
                </span>
              </td>

              {/* Date */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                {payment.paidAt ? (
                  <>
                    <p className="font-medium">
                      {new Date(payment.paidAt.toMillis?.() || payment.paidAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs">
                      {new Date(payment.paidAt.toMillis?.() || payment.paidAt).toLocaleTimeString()}
                    </p>
                  </>
                ) : (
                  'N/A'
                )}
              </td>

              {/* Actions */}
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    onClick={() => onViewDetails(payment)}
                    title="View Details"
                    className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} px-6 py-4 border-t ${borderClass}`}>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total: <strong>{payments.length}</strong> payment{payments.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default EnhancedPaymentsTable;
