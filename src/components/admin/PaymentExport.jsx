/**
 * Payment Export Component
 * Export payments to CSV
 */

import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const PaymentExport = ({ payments = [], isLoading = false }) => {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = async () => {
    if (!payments.length) {
      alert('No payments to export');
      return;
    }

    setExporting(true);

    try {
      // Prepare CSV headers
      const headers = [
        'Payment ID',
        'Order ID',
        'Customer Name',
        'Customer Email',
        'Amount (OMR)',
        'Status',
        'Payment Method',
        'Transaction ID',
        'Session ID',
        'Subtotal',
        'Tax',
        'Shipping',
        'Shipping Address',
        'Created At',
        'Paid At',
      ];

      // Prepare CSV rows
      const rows = payments.map((payment) => {
        const createdDate = payment.createdAt?.toDate
          ? payment.createdAt.toDate().toISOString()
          : new Date(payment.createdAt).toISOString();

        const paidDate = payment.paidAt
          ? payment.paidAt.toDate
            ? payment.paidAt.toDate().toISOString()
            : new Date(payment.paidAt).toISOString()
          : '';

        const address = [
          payment.shippingAddress?.street,
          payment.shippingAddress?.city,
          payment.shippingAddress?.state,
          payment.shippingAddress?.postalCode,
          payment.shippingAddress?.country,
        ]
          .filter(Boolean)
          .join(', ');

        return [
          payment.id,
          payment.orderId || '',
          payment.customerName || '',
          payment.customerEmail || '',
          payment.amount?.toFixed(2) || '0.00',
          payment.status || '',
          payment.paymentMethod || '',
          payment.transactionId || '',
          payment.sessionId || '',
          payment.subtotal?.toFixed(2) || '0.00',
          payment.tax?.toFixed(2) || '0.00',
          payment.shipping?.toFixed(2) || '0.00',
          `"${address}"`, // Wrap in quotes for CSV
          createdDate,
          paidDate,
        ];
      });

      // Create CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const fileName = `payments_${new Date().toISOString().split('T')[0]}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setExporting(false);
      }, 500);
    } catch (error) {
      console.error('Error exporting payments:', error);
      alert('Failed to export payments');
      setExporting(false);
    }
  };

  return (
    <button
      onClick={exportToCSV}
      disabled={isLoading || exporting || payments.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
    >
      <ArrowDownTrayIcon className="h-5 w-5" />
      {exporting ? 'Exporting...' : 'Export CSV'}
    </button>
  );
};

export default PaymentExport;
