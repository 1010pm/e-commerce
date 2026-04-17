/**
 * Payment Stats Overview Component
 * KPI cards showing payment dashboard statistics
 */

import React from 'react';
import StatCard from './StatCard';
import { SkeletonCard } from './SkeletonLoader';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const PaymentStatsOverview = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Revenue',
      value: `OMR ${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'green',
      trend: '+12.5%',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || '0',
      icon: ShoppingBagIcon,
      color: 'blue',
      trend: '+5.2%',
    },
    {
      title: 'Failed Payments',
      value: stats?.failedCount || '0',
      icon: ExclamationCircleIcon,
      color: 'red',
      trend: '-2.1%',
      trendDirection: 'down',
    },
    {
      title: 'Pending Payments',
      value: stats?.pendingCount || '0',
      icon: ClockIcon,
      color: 'amber',
      trend: stats?.pendingCount > 5 ? '+' + stats?.pendingCount : '0',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat, idx) => (
        <StatCard
          key={idx}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          trend={stat.trend}
          trendDirection={stat.trendDirection}
        />
      ))}
    </div>
  );
};

export default PaymentStatsOverview;
