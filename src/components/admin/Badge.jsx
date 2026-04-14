/**
 * Status Badge Component
 * Modern badge for status indicators
 */

const statusStyles = {
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200',
  error: 'bg-red-100 text-red-800 border border-red-200',
  info: 'bg-blue-100 text-blue-800 border border-blue-200',
  pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  active: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  inactive: 'bg-gray-100 text-gray-800 border border-gray-200',
  paid: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  unpaid: 'bg-red-100 text-red-800 border border-red-200',
  delivered: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  processing: 'bg-blue-100 text-blue-800 border border-blue-200',
  cancelled: 'bg-gray-100 text-gray-800 border border-gray-200',
};

const Badge = ({ status, children, className = '' }) => {
  const style = statusStyles[status] || statusStyles.info;
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
