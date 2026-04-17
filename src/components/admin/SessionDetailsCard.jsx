/**
 * Session Details Card Component
 * Displays payment session information
 */

import React, { useState } from 'react';
import Badge from './Badge';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const SessionDetailsCard = ({ session, linkedPayment, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    products: true,
    link: true,
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

  const isExpired = session?.expiresAt
    ? (session.expiresAt.toDate ? session.expiresAt.toDate() : new Date(session.expiresAt)) <
      new Date()
    : false;

  const getSessionStatus = isExpired ? 'expired' : (session?.status || 'pending');

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-white">
        <h2 className="text-2xl font-bold">Session Details</h2>
        <p className="text-purple-100 text-sm">Session ID: {session?.sessionId}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Details */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('details')}
        >
          <h3 className="font-semibold text-gray-900 text-lg">📋 Session Details</h3>
          {expandedSections.details ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </div>

        {expandedSections.details && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Session ID</p>
              <p className="font-mono text-xs text-gray-900 break-all">{session?.sessionId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Client Reference</p>
              <p className="text-gray-900">{session?.clientReferenceId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount (Baisa)</p>
              <p className="font-semibold text-gray-900">{session?.amount} BZ</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount (OMR)</p>
              <p className="font-semibold text-gray-900">{(session?.amount / 1000).toFixed(2)} OMR</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge
                status={
                  getSessionStatus === 'paid'
                    ? 'success'
                    : getSessionStatus === 'expired'
                    ? 'inactive'
                    : 'warning'
                }
              >
                {getSessionStatus.charAt(0).toUpperCase() + getSessionStatus.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiry Status</p>
              {isExpired ? (
                <p className="text-red-600 font-medium">⚠️ Expired</p>
              ) : (
                <p className="text-green-600 font-medium">✓ Active</p>
              )}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="border-t pt-6 text-sm space-y-2">
          <div>
            <span className="text-gray-500 font-medium">Created:</span>
            <p className="text-gray-900">{formatDate(session?.createdAt)}</p>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Expires:</span>
            <p className={isExpired ? 'text-red-600 font-medium' : 'text-gray-900'}>
              {formatDate(session?.expiresAt)}
            </p>
          </div>
        </div>

        {/* Products Sent to Gateway */}
        <div className="border-t pt-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('products')}
          >
            <h3 className="font-semibold text-gray-900 text-lg">📦 Products Sent to Thawani</h3>
            {expandedSections.products ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </div>

          {expandedSections.products && (
            <div className="mt-4 space-y-3">
              {session?.products?.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {session.products.map((product, idx) => (
                    <div key={idx} className="flex justify-between items-start py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{product.name || 'Unknown Product'}</p>
                        <p className="text-sm text-gray-500">Qty: {product.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">{(product.price || 0).toFixed(2)} OMR</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No products in session</p>
              )}
            </div>
          )}
        </div>

        {/* Payment Link */}
        <div className="border-t pt-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('link')}
          >
            <h3 className="font-semibold text-gray-900 text-lg">🔗 Linked Payment</h3>
            {expandedSections.link ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </div>

          {expandedSections.link && (
            <div className="mt-4">
              {session?.linkedPaymentId ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <span className="text-xl">✓</span>
                    <span className="font-medium">Payment Found</span>
                  </div>
                  <div className="bg-white p-3 rounded font-mono text-xs break-all">
                    {session.linkedPaymentId}
                  </div>
                  {linkedPayment && (
                    <div className="bg-white p-3 rounded space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        Status: <Badge status={linkedPayment.status}>{linkedPayment.status}</Badge>
                      </p>
                      <p className="text-sm text-gray-600">
                        Amount: {linkedPayment.amount?.toFixed(2)} OMR
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <span className="text-xl">⚠️</span>
                    <span className="font-medium">Session not linked to payment</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-2">
                    This session hasn't been converted to a payment yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Raw Gateway Data */}
        <div className="border-t pt-6">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-xs">
            <pre>{JSON.stringify(session || {}, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailsCard;
