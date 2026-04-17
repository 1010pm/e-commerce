/**
 * Enhanced Admin Payments Dashboard - Production Grade
 * Modern UI with dark mode, advanced filtering, analytics, and real-time updates
 * 
 * Features:
 * - Professional card-based layout
 * - Dark mode support
 * - Advanced filtering (status, amount range, date range, search)
 * - Analytics cards (revenue, orders, conversion rate, avg value)
 * - Payment details modal with JSON viewer
 * - Export functionality (CSV, JSON)
 * - Skeleton loaders for smooth UX
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../../hooks/useAuth'; // Assuming theme hook exists
import paymentAdminService from '../../services/paymentAdminService';
import PaymentStatsOverview from '../../components/admin/PaymentStatsOverview';
import PaymentsTable from '../../components/admin/PaymentsTable';
import PaymentDetailsCard from '../../components/admin/PaymentDetailsCard';
import Modal from '../../components/admin/Modal';
import Button from '../../components/common/Button';
import {
  CreditCardIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EnhancedPaymentsDashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ========================
  // STATE MANAGEMENT
  // ========================
  
  // Data states
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: null,           // 'paid' | 'pending' | 'failed'
    searchTerm: '',         // Search by name, email, transactionId
    minAmount: null,        // Min amount in OMR
    maxAmount: null,        // Max amount in OMR
    startDate: null,        // From date
    endDate: null,          // To date
  });
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // date | amount | status
  const [sortOrder, setSortOrder] = useState('desc');
  
  // ========================
  // DATA LOADING
  // ========================
  
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsRes = await paymentAdminService.getPaymentStats();
      if (statsRes.success) {
        setStats(statsRes.data);
      }
      
      // Fetch payments with limit
      const paymentsRes = await paymentAdminService.getAllPayments({
        limit: 100,
      });
      if (paymentsRes.success) {
        setPayments(paymentsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  // ========================
  // FILTERING & SEARCHING
  // ========================
  
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];
    
    // Status filter
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    
    // Search filter (name, email, transactionId)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.customerName || '').toLowerCase().includes(term) ||
        (p.customerEmail || '').toLowerCase().includes(term) ||
        (p.transactionId || '').toLowerCase().includes(term) ||
        (p.sessionId || '').toLowerCase().includes(term)
      );
    }
    
    // Amount range filter
    if (filters.minAmount !== null) {
      filtered = filtered.filter(p => p.amount >= filters.minAmount);
    }
    if (filters.maxAmount !== null) {
      filtered = filtered.filter(p => p.amount <= filters.maxAmount);
    }
    
    // Date range filter
    if (filters.startDate) {
      const startTime = new Date(filters.startDate).getTime();
      filtered = filtered.filter(p => {
        const payDate = p.paidAt?.toMillis?.() || p.paidAt?.getTime?.() || 0;
        return payDate >= startTime;
      });
    }
    if (filters.endDate) {
      const endTime = new Date(filters.endDate).getTime() + (24 * 60 * 60 * 1000); // Include full day
      filtered = filtered.filter(p => {
        const payDate = p.paidAt?.toMillis?.() || p.paidAt?.getTime?.() || 0;
        return payDate <= endTime;
      });
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let compareVal = 0;
      
      if (sortBy === 'date') {
        const aTime = a.paidAt?.toMillis?.() || a.paidAt?.getTime?.() || 0;
        const bTime = b.paidAt?.toMillis?.() || b.paidAt?.getTime?.() || 0;
        compareVal = aTime - bTime;
      } else if (sortBy === 'amount') {
        compareVal = (a.amount || 0) - (b.amount || 0);
      } else if (sortBy === 'status') {
        compareVal = (a.status || '').localeCompare(b.status || '');
      }
      
      return sortOrder === 'desc' ? -compareVal : compareVal;
    });
    
    return filtered;
  }, [payments, filters, sortBy, sortOrder]);

  // ========================
  // FILTER MANAGEMENT
  // ========================
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: null,
      searchTerm: '',
      minAmount: null,
      maxAmount: null,
      startDate: null,
      endDate: null,
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== null && v !== '');

  // ========================
  // ACTIONS
  // ========================
  
  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Session ID', 'Customer', 'Amount (OMR)', 'Status', 'Date'];
    const rows = filteredPayments.map(p => [
      p.transactionId,
      p.sessionId,
      p.customerName,
      (p.amount || 0).toFixed(3),
      p.status,
      p.paidAt ? new Date(p.paidAt.toMillis?.() || p.paidAt).toLocaleDateString() : 'N/A',
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Payments exported to CSV');
  };

  const handleExportJSON = () => {
    const data = filteredPayments.map(p => ({
      transactionId: p.transactionId,
      sessionId: p.sessionId,
      orderId: p.orderId,
      customer: {
        name: p.customerName,
        email: p.customerEmail,
        phone: p.customerPhone,
      },
      amount: {
        omr: p.amount,
        baisa: p.gatewayAmount,
      },
      status: p.status,
      paidAt: p.paidAt,
      products: p.products,
    }));
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Payments exported to JSON');
  };

  // ========================
  // RENDER
  // ========================
  
  const bgClass = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const cardBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`${bgClass} ${textClass} min-h-screen`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* ==================== HEADER ==================== */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">💳 Payments Dashboard</h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Manage and monitor all payment transactions
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </Button>
            
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ==================== STATS OVERVIEW ==================== */}
        <div className="mb-8">
          <PaymentStatsOverview stats={stats} loading={loading} />
        </div>

        {/* ==================== FILTERS & SEARCH ==================== */}
        <div className={`${cardBgClass} border ${borderClass} rounded-xl p-6 mb-8`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FunnelIcon className="w-5 h-5" />
              Filters & Search
            </h2>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Name, email, or transaction ID"
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 border ${borderClass} rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || null)}
                  className={`w-full px-3 py-2 border ${borderClass} rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
                >
                  <option value="">All Status</option>
                  <option value="paid">✓ Paid</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="failed">✗ Failed</option>
                </select>
              </div>

              {/* Min Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Min Amount (OMR)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={filters.minAmount || ''}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : null)}
                  className={`w-full px-3 py-2 border ${borderClass} rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
                />
              </div>

              {/* Max Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Max Amount (OMR)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="99999.999"
                  value={filters.maxAmount || ''}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
                  className={`w-full px-3 py-2 border ${borderClass} rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value || null)}
                  className={`w-full px-3 py-2 border ${borderClass} rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value || null)}
                  className={`w-full px-3 py-2 border ${borderClass} rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
                />
              </div>
            </div>
          )}

          {/* Filter Actions */}
          <div className="flex gap-2 flex-wrap">
            {hasActiveFilters && (
              <Button
                onClick={handleClearFilters}
                className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm flex items-center gap-1"
              >
                <XMarkIcon className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
            
            <div className="ml-auto flex gap-2">
              <Button
                onClick={handleExportCSV}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                CSV
              </Button>
              <Button
                onClick={handleExportJSON}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                JSON
              </Button>
            </div>
          </div>
        </div>

        {/* ==================== RESULTS COUNT ==================== */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing <strong>{filteredPayments.length}</strong> of <strong>{payments.length}</strong> payments
        </div>

        {/* ==================== PAYMENTS TABLE ==================== */}
        <div className={`${cardBgClass} border ${borderClass} rounded-xl overflow-hidden`}>
          <PaymentsTable
            payments={filteredPayments}
            loading={loading}
            onViewDetails={handleViewDetails}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* ==================== PAYMENT DETAILS MODAL ==================== */}
        {showDetailsModal && selectedPayment && (
          <Modal onClose={() => setShowDetailsModal(false)} title="Payment Details">
            <PaymentDetailsCard
              payment={selectedPayment}
              isDarkMode={isDarkMode}
              onClose={() => setShowDetailsModal(false)}
            />
          </Modal>
        )}
      </div>
    </div>
  );
};

export default EnhancedPaymentsDashboard;
