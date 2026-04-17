/**
 * Payment Sessions Table Component
 * Displays payment sessions from Thawani
 */

import React from 'react';
import Badge from './Badge';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const PaymentSessionsTable = ({ sessions = [], loading = false, onSessionClick }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    const expiry = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    return expiry < new Date();
  };

  const getSessionStatus = (session) => {
    if (isExpired(session.expiresAt)) return 'expired';
    return session.status || 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'inactive';
      case 'failed':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Session ID</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Client Reference</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Amount</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Expires</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Linked Payment</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Created</th>
            <th className="px-6 py-3 text-center font-semibold text-gray-700">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              </td>
            </tr>
          ) : sessions.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                No payment sessions found
              </td>
            </tr>
          ) : (
            sessions.map((session) => {
              const sessionStatus = getSessionStatus(session);
              return (
                <tr
                  key={session.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onSessionClick?.(session)}
                >
                  <td className="px-6 py-4 font-mono text-xs text-gray-900">
                    {session.sessionId?.substring(0, 12)}...
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {session.clientReferenceId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {(session.amount / 1000).toFixed(2)} OMR
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={getStatusColor(sessionStatus)}>
                      {sessionStatus.charAt(0).toUpperCase() + sessionStatus.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    {formatDate(session.expiresAt)}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {session.linkedPaymentId ? (
                      <span className="text-green-600">{session.linkedPaymentId.substring(0, 8)}...</span>
                    ) : (
                      <span className="text-gray-400 italic">Not linked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    {formatDate(session.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionClick?.(session);
                      }}
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentSessionsTable;
