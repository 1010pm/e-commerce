/**
 * Empty State Component
 * Premium empty state with illustration and CTA
 */

import React from 'react';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {Icon && (
        <div className="mb-4 p-4 bg-gray-100 rounded-full">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">
        {description}
      </p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
