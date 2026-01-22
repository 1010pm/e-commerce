/**
 * Loading Components
 * مكونات التحميل
 */

import React from 'react';

// Spinner Component
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={`animate-spin text-primary-600 ${sizes[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// Full Page Loading
export const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner size="xl" />
    </div>
  );
};

// Skeleton Loader
export const Skeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};

// Card Skeleton
export const CardSkeleton = () => {
  return (
    <div className="card p-4">
      <Skeleton className="h-48 w-full mb-4" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
};

// Product Card Skeleton
export const ProductCardSkeleton = () => {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-64 w-full" />
      <div className="p-4">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
};

export default Spinner;

