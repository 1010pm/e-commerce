/**
 * Empty State Component - Production Ready
 * Displays user-friendly empty states for various scenarios
 */

import React from 'react';
import Button from './Button';

const EmptyState = ({
  icon = '📦',
  title = 'No items found',
  description = 'There are no items to display at this time.',
  actionLabel = null,
  onAction = null,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="text-6xl mb-4 animate-fade-in-up">
          {icon}
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 animate-fade-in-up stagger-1">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 mb-6 animate-fade-in-up stagger-2">
          {description}
        </p>
        
        {/* Action Button */}
        {actionLabel && onAction && (
          <div className="animate-fade-in-up stagger-3">
            <Button onClick={onAction} variant="primary">
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
