/**
 * Input Component - Production-Ready Responsive Design
 * مكون حقل الإدخال - تصميم مستجيب وإنتاجي
 * 
 * Features:
 * - Responsive text sizing
 * - Optimized for mobile (large enough for touch)
 * - Clear error states
 * - Helper text support
 * - Accessible labels and ARIA attributes
 * - Touch-friendly spacing
 */

import React from 'react';

const Input = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = null,
  required = false,
  disabled = false,
  className = '',
  helperText = '',
  maxLength = null,
  icon = null,
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm md:text-sm font-semibold text-gray-700 mb-2 md:mb-1.5"
        >
          {label}
          {required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      
      {/* Input Wrapper with Icon Support */}
      <div className="relative w-full">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          className={`
            w-full
            px-4 md:px-4 py-3 md:py-2.5
            text-base md:text-sm
            border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-offset-0 
            transition-all duration-200 
            bg-white text-gray-900 
            placeholder-gray-400
            min-h-[44px] md:min-h-[40px]
            ${icon ? 'pl-11 md:pl-10' : ''}
            ${
              error 
                ? 'border-error-500 focus:ring-error-500 focus:border-error-500' 
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }
            ${
              disabled 
                ? 'bg-gray-50 cursor-not-allowed opacity-60' 
                : 'hover:border-gray-400'
            }
          `.trim().replace(/\s+/g, ' ')}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          {...props}
        />
        
        {/* Icon Support */}
        {icon && (
          <div className="absolute left-3 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p 
          id={`${name}-error`}
          className="mt-1.5 md:mt-1 text-sm md:text-xs text-error-600 font-medium" 
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p 
          id={`${name}-helper`}
          className="mt-1.5 md:mt-1 text-sm md:text-xs text-gray-500"
        >
          {helperText}
        </p>
      )}

      {/* Character Count */}
      {maxLength && (
        <p className="mt-1.5 md:mt-1 text-xs text-gray-500">
          {value?.length || 0} / {maxLength}
        </p>
      )}
    </div>
  );
};

export default Input;

