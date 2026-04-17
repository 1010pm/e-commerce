/**
 * Payment Details Modal/Card Component
 * Displays comprehensive payment information
 */

import React, { useState } from 'react';
import Badge from './Badge';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const PaymentDetailsCard = ({ payment, session, anomalies = [], onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    products: true,
    breakdown: true,
    gateway: false,
    anomalies: anomalies.length > 0,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getAnomalySeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'low':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
        <h2 className="text-2xl font-bold">Payment Details</h2>
        <p className="text-blue-100 text-sm">ID: {payment?.id}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Anomalies Alert */}
        {anomalies.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('anomalies')}
            >
              <h3 className="font-semibold text-red-800 flex items-center gap-2">
                ⚠️ Anomalies Detected ({anomalies.length})
              </h3>
              {expandedSections.anomalies ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </div>
            {expandedSections.anomalies && (
              <div className="mt-4 space-y-2">
                {anomalies.map((anomaly, idx) => (
                  <div key={idx} className={`p-3 border rounded ${getAnomalySeverityColor(anomaly.severity)}`}>
                    <p className="font-semibold">{anomaly.type}</p>
                    <p className="text-sm mt-1">{anomaly.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-lg">💳 Payment Info</h3>
            <div>
              <p className="text-sm text-gray-500">Amount (OMR)</p>
              <p className="text-2xl font-bold text-gray-900">{payment?.amount?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount (Baisa)</p>
              <p className="font-mono text-gray-900">{Math.round((payment?.amount || 0) * 1000)} BZ</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge status={payment?.status}>{payment?.status?.toUpperCase()}</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-lg">🔖 Identifiers</h3>
            <div>
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="font-mono text-xs text-gray-900 break-all">{payment?.transactionId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Session ID</p>
              <p className="font-mono text-xs text-gray-900 break-all">{payment?.sessionId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Gateway</p>
              <p className="capitalize font-medium text-gray-900">{payment?.paymentGateway || 'thawani'}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 text-lg mb-4">👤 Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{payment?.customerName || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900 break-all">{payment?.customerEmail || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{payment?.customerPhone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="border-t pt-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('products')}
          >
            <h3 className="font-semibold text-gray-900 text-lg">📦 Products</h3>
            {expandedSections.products ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </div>
          {expandedSections.products && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Price</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payment?.products?.map((product, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-gray-900">{product.name || 'Unknown'}</td>
                      <td className="px-3 py-2 text-gray-600">{product.quantity || 1}</td>
                      <td className="px-3 py-2 text-right text-gray-900">
                        {(product.price || 0).toFixed(2)} OMR
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                        {((product.price || 0) * (product.quantity || 1)).toFixed(2)} OMR
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Shipping */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 text-lg mb-4">🚚 Shipping</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-gray-900">
              {payment?.shippingAddress?.street || 'No street address'}
            </p>
            <p className="text-gray-900">
              {payment?.shippingAddress?.city || ''} {payment?.shippingAddress?.state || ''}{' '}
              {payment?.shippingAddress?.postalCode || ''}
            </p>
            <p className="text-gray-900">{payment?.shippingAddress?.country || 'No country'}</p>
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500">Shipping Cost</p>
              <p className="font-semibold text-gray-900">{(payment?.shipping || 0).toFixed(2)} OMR</p>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="border-t pt-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('breakdown')}
          >
            <h3 className="font-semibold text-gray-900 text-lg">📊 Breakdown</h3>
            {expandedSections.breakdown ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </div>
          {expandedSections.breakdown && (
            <div className="mt-4 space-y-2 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{(payment?.subtotal || 0).toFixed(2)} OMR</span>
              </div>
              {payment?.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">{(payment?.tax || 0).toFixed(2)} OMR</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">{(payment?.shipping || 0).toFixed(2)} OMR</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">{(payment?.amount || 0).toFixed(2)} OMR</span>
              </div>
            </div>
          )}
        </div>

        {/* Gateway Response */}
        <div className="border-t pt-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('gateway')}
          >
            <h3 className="font-semibold text-gray-900 text-lg">🔍 Gateway Data</h3>
            {expandedSections.gateway ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </div>
          {expandedSections.gateway && (
            <div className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-xs">
              <pre>{JSON.stringify(payment?.gatewayResponse || {}, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="border-t pt-6 text-sm text-gray-600 space-y-2">
          <div>
            <span className="font-medium">Created:</span> {formatDate(payment?.createdAt)}
          </div>
          {payment?.paidAt && (
            <div>
              <span className="font-medium">Paid:</span> {formatDate(payment?.paidAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsCard;
