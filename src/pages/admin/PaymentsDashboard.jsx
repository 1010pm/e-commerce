/**
 * Admin Payment Dashboard
 * Complete payment and session management interface
 * Shows overview, tables, and linked data
 */

import React, { useState, useEffect, useCallback } from 'react';
import paymentAdminService from '../../services/paymentAdminService';
import PaymentStatsOverview from '../../components/admin/PaymentStatsOverview';
import PaymentsTable from '../../components/admin/PaymentsTable';
import PaymentSessionsTable from '../../components/admin/PaymentSessionsTable';
import PaymentDetailsCard from '../../components/admin/PaymentDetailsCard';
import SessionDetailsCard from '../../components/admin/SessionDetailsCard';
import PaymentExport from '../../components/admin/PaymentExport';
import Modal from '../../components/admin/Modal';
import Button from '../../components/common/Button';
import {
  CreditCardIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PaymentsDashboard = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter/search states
  const [statusFilter, setStatusFilter] = useState(null);
  
  // Modal states
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [linkedData, setLinkedData] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  
  // Load initial data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsResult = await paymentAdminService.getPaymentStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      }
      
      // Load payments
      const paymentsResult = await paymentAdminService.getAllPayments({
        status: statusFilter,
        limit: 50,
      });
      if (paymentsResult.success) {
        setPayments(paymentsResult.data);
      }
      
      // Load sessions
      const sessionsResult = await paymentAdminService.getAllSessions({
        limit: 50,
      });
      if (sessionsResult.success) {
        setSessions(sessionsResult.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handlePaymentClick = async (payment) => {
    try {
      setSelectedPayment(payment);
      
      // Link payment to session
      const linkResult = await paymentAdminService.linkPaymentToSession(payment);
      if (linkResult.success) {
        setLinkedData(linkResult.data);
      } else if (linkResult.warning) {
        console.warn('Payment not linked to session');
        setLinkedData(null);
      }
      
      // Detect anomalies
      const anomalyResult = await paymentAdminService.detectAnomalies(
        payment,
        linkResult.success ? linkResult.data : null
      );
      if (anomalyResult.success) {
        setAnomalies(anomalyResult.data);
      }
    } catch (error) {
      console.error('Error viewing payment:', error);
      toast.error('Failed to load payment details');
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
  };

  const handleSearch = (term) => {
    if (term.trim().length > 0) {
      paymentAdminService.searchPayments(term).then((result) => {
        if (result.success) {
          setPayments(result.data);
        }
      });
    } else {
      loadDashboardData();
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status === 'all' ? null : status);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <CreditCardIcon className="h-8 w-8 text-blue-500" />
                Payment Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">Monitor and manage Thawani payments</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white"
              >
                <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              {activeTab === 'payments' && (
                <PaymentExport payments={payments} isLoading={loading} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Sessions
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <PaymentStatsOverview stats={stats} loading={loading} />
            
            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Payments */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Recent Payments</h3>
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => {
                        handlePaymentClick(payment);
                        setActiveTab('payments');
                      }}
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{payment.customerName}</p>
                        <p className="text-xs text-gray-400">{payment.customerEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{payment.amount?.toFixed(2)} OMR</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                          payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Recent Sessions</h3>
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => {
                        handleSessionClick(session);
                        setActiveTab('sessions');
                      }}
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm font-mono">
                          {session.sessionId?.substring(0, 12)}...
                        </p>
                        <p className="text-xs text-gray-400">{session.clientReferenceId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{(session.amount / 1000).toFixed(2)} OMR</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          session.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <PaymentsTable
              payments={payments}
              loading={loading}
              onPaymentClick={handlePaymentClick}
              onSearch={handleSearch}
              onFilterChange={(filters) => handleStatusFilter(filters.status)}
            />
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <PaymentSessionsTable
              sessions={sessions}
              loading={loading}
              onSessionClick={handleSessionClick}
            />
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title={selectedPayment?.customerName}
        size="2xl"
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Anomalies Alert */}
          {anomalies.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold mb-2">⚠️ Anomalies Detected:</p>
              <ul className="space-y-1 text-sm text-red-600">
                {anomalies.map((anomaly, idx) => (
                  <li key={idx}>• {anomaly.message}</li>
                ))}
              </ul>
            </div>
          )}
          
          <PaymentDetailsCard
            payment={selectedPayment}
            session={linkedData}
            anomalies={anomalies}
            onClose={() => setSelectedPayment(null)}
          />
        </div>
      </Modal>

      {/* Session Details Modal */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession?.sessionId?.substring(0, 20)}
        size="2xl"
      >
        <div className="max-h-[60vh] overflow-y-auto">
          <SessionDetailsCard
            session={selectedSession}
            linkedPayment={payments.find(p => p.sessionId === selectedSession?.sessionId)}
            onClose={() => setSelectedSession(null)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default PaymentsDashboard;
