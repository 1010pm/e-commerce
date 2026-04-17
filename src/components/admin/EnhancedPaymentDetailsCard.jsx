/**
 * Enhanced Payment Details Card Component
 * Professional payment information display with JSON viewer
 * Shows: breakdown, customer info, products, gateway response
 */

import React, { useState } from 'react';
import {
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EnhancedPaymentDetailsCard = ({ payment, isDarkMode = false, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    breakdown: true,
    customer: true,
    products: true,
    gateway: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const copyToClipboard = (text, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const statusColors = {
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    pending: 'bg-amber-100 text-amber-800 border-amber-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
  };

  const statusIcons = {
    paid: '✓',
    pending: '⏳',
    failed: '✗',
  };

  const cardBgClass = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const textClass = isDarkMode ? 'text-gray-200' : 'text-gray-700';
  const borderClass = isDarkMode ? 'border-gray-600' : 'border-gray-200';

  return (
    <div className="max-h-screen overflow-y-auto">
      {/* ==================== HEADER ==================== */}
      <div className="mb-6 pb-6 border-b border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Transaction Details</h1>
          <span className={`px-3 py-1 rounded-full border font-semibold text-sm ${statusColors[payment.status] || statusColors.pending}`}>
            {statusIcons[payment.status]} {payment.status?.toUpperCase()}
          </span>
        </div>

        {/* Transaction IDs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Transaction ID</p>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-600 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-500">
              <code className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 flex-1 break-all">
                {payment.transactionId || 'N/A'}
              </code>
              {payment.transactionId && (
                <button
                  onClick={() => copyToClipboard(payment.transactionId, 'Transaction ID copied')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-500 rounded"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Session ID</p>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-600 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-500">
              <code className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 flex-1 break-all">
                {payment.sessionId?.substring(0, 20)}...
              </code>
              {payment.sessionId && (
                <button
                  onClick={() => copyToClipboard(payment.sessionId, 'Session ID copied')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-500 rounded"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== COST BREAKDOWN ==================== */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('breakdown')}
          className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 mb-3"
        >
          <h2 className="text-lg font-semibold">💰 Cost Breakdown</h2>
          {expandedSections.breakdown ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>

        {expandedSections.breakdown && (
          <div className={`${cardBgClass} p-4 rounded-lg border ${borderClass} space-y-3`}>
            <div className="flex justify-between items-center">
              <span className={textClass}>Subtotal</span>
              <span className="font-semibold text-lg">
                OMR {(payment.subtotal || 0).toFixed(3)}
              </span>
            </div>
            {payment.tax > 0 && (
              <div className="flex justify-between items-center">
                <span className={textClass}>Tax</span>
                <span className="font-semibold">OMR {(payment.tax || 0).toFixed(3)}</span>
              </div>
            )}
            {payment.shipping > 0 && (
              <div className="flex justify-between items-center">
                <span className={textClass}>Shipping</span>
                <span className="font-semibold">OMR {(payment.shipping || 0).toFixed(3)}</span>
              </div>
            )}
            <div className="border-t border-gray-300 dark:border-gray-500 pt-3 flex justify-between items-center">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-2xl text-emerald-600">
                OMR {(payment.amount || 0).toFixed(3)}
              </span>
            </div>
            {payment.gatewayAmount && (
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                Gateway Amount: {payment.gatewayAmount} baisa
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== CUSTOMER INFORMATION ==================== */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('customer')}
          className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 mb-3"
        >
          <h2 className="text-lg font-semibold">👤 Customer Information</h2>
          {expandedSections.customer ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>

        {expandedSections.customer && (
          <div className={`${cardBgClass} p-4 rounded-lg border ${borderClass} space-y-3`}>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Name</p>
              <p className="font-semibold text-lg">{payment.customerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm">{payment.customerEmail || 'N/A'}</p>
                {payment.customerEmail && (
                  <button
                    onClick={() => copyToClipboard(payment.customerEmail, 'Email copied')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
              <p className="font-mono text-sm">{payment.customerPhone || 'N/A'}</p>
            </div>

            {/* Shipping Address */}
            {payment.shippingAddress && (
              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-500">
                <p className="text-xs font-medium text-gray-500 mb-2">Shipping Address</p>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">
                    {payment.shippingAddress.firstName} {payment.shippingAddress.lastName}
                  </p>
                  <p>{payment.shippingAddress.addressLine}</p>
                  <p>
                    {payment.shippingAddress.city}, {payment.shippingAddress.state}{' '}
                    {payment.shippingAddress.zipCode}
                  </p>
                  <p>{payment.shippingAddress.country}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== PRODUCTS ==================== */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('products')}
          className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 mb-3"
        >
          <h2 className="text-lg font-semibold">📦 Products ({payment.itemsCount || 0})</h2>
          {expandedSections.products ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>

        {expandedSections.products && (
          <div className={`${cardBgClass} p-4 rounded-lg border ${borderClass}`}>
            {payment.products && payment.products.length > 0 ? (
              <div className="space-y-3">
                {payment.products.map((product, idx) => (
                  <div key={idx} className="flex justify-between items-start pb-3 border-b border-gray-300 dark:border-gray-500 last:border-0">
                    <div>
                      <p className="font-semibold">{product.name || 'Unknown Product'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Product ID: {product.productId || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Qty: {product.quantity || 1}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        OMR {((product.price || 0) * (product.quantity || 1)).toFixed(3)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @ OMR {(product.price || 0).toFixed(3)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No products recorded</p>
            )}
          </div>
        )}
      </div>

      {/* ==================== GATEWAY RESPONSE (JSON VIEWER) ==================== */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('gateway')}
          className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 mb-3"
        >
          <h2 className="text-lg font-semibold">🔧 Raw Gateway Response</h2>
          {expandedSections.gateway ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>

        {expandedSections.gateway && (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-900'} p-4 rounded-lg border border-gray-600 overflow-x-auto`}>
            <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap break-words">
              {JSON.stringify(payment.gatewayResponse || {}, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* ==================== METADATA ==================== */}
      <div className={`${cardBgClass} p-4 rounded-lg border ${borderClass}`}>
        <h3 className="font-semibold mb-3">📋 Metadata</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Payment ID</p>
            <p className="font-mono font-semibold break-all">{payment.paymentId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Order ID</p>
            <p className="font-mono font-semibold break-all">{payment.orderId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Payment Method</p>
            <p className="font-semibold">{payment.paymentMethod || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Created At</p>
            <p className="font-semibold text-xs">
              {payment.createdAt ? new Date(payment.createdAt.toMillis?.() || payment.createdAt).toLocaleString() : 'N/A'}
            </p>
          </div>
          {payment.paidAt && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Paid At</p>
              <p className="font-semibold text-xs">
                {new Date(payment.paidAt.toMillis?.() || payment.paidAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPaymentDetailsCard;
