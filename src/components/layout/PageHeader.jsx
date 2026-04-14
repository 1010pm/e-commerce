/**
 * Page Header Component
 * Reusable header component for pages
 * مكون رأس الصفحة
 */

import React from 'react';

const PageHeader = ({ 
  title, 
  subtitle = null, 
  className = '',
  children = null 
}) => {
  return (
    <div className={`bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 ${className}`}>
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-600 text-lg">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

export default PageHeader;
