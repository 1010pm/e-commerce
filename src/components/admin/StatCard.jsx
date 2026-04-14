/**
 * Stat Card Component
 * Premium KPI card with icon and trend
 */

import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = 'up',
  color = 'blue',
  onClick,
  loading = false,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-emerald-100',
    purple: 'bg-purple-100',
    amber: 'bg-amber-100',
    red: 'bg-red-100',
  };

  const cls = colorClasses[color] || colorClasses.blue;
  const iconBgCls = iconBgClasses[color] || iconBgClasses.blue;

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border p-6 
        transition-all duration-300 ease-out
        ${cls}
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        ${loading ? 'opacity-50' : ''}
      `}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 opacity-0 bg-gradient-to-br from-white to-transparent pointer-events-none" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75 mb-2">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-3 text-sm font-semibold ${trendDirection === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {trendDirection === 'up' ? (
                <ArrowTrendingUpIcon className="w-4 h-4" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4" />
              )}
              {trend}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`${iconBgCls} p-3 rounded-lg`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
