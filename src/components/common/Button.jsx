/**
 * Button Component - Production-Ready Responsive Design
 * مكون الزر القابل لإعادة الاستخدام - تصميم مستجيب وإنتاجي
 * 
 * Features:
 * - Responsive sizing (mobile-first)
 * - Touch-friendly on mobile (min 44px height)
 * - Loading states with spinner
 * - Multiple variants
 * - Accessible (ARIA, focus states)
 * - Smooth transitions
 */

import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) => {
  // Base styles: clean, consistent, accessible with refined motion
  // Mobile-first approach with proper touch targets
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg 
    transition-all duration-200 ease-out 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed 
    active:scale-[0.98] 
    hover:transition-all hover:duration-200
    select-none
    min-h-[44px]
    md:min-h-[40px]
  `.trim().replace(/\s+/g, ' ');

  // Variants: solid colors, no gradients - clean and professional
  // Optimized contrast ratios for accessibility
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow active:shadow-none',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400 shadow-sm',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500 bg-white hover:border-gray-400',
    danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 shadow-sm hover:shadow active:shadow-none',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 shadow-sm hover:shadow active:shadow-none',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
  };

  // Responsive sizing: Mobile-first, scales up on larger screens
  const sizes = {
    sm: 'px-3 py-1.5 text-sm md:px-3 md:py-1.5 md:text-sm',
    md: 'px-4 py-2.5 text-sm md:px-4 md:py-2 md:text-sm',
    lg: 'px-6 py-3 text-base md:px-6 md:py-2.5 md:text-base',
    xl: 'px-8 py-4 text-lg md:px-8 md:py-3 md:text-lg',
  };

  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = sizes[size] || sizes.md;
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${widthStyles} ${className}`}
      {...props}
      aria-busy={loading}
      aria-disabled={disabled}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
      )}
      {children}
    </button>
  );
};

export default Button;

