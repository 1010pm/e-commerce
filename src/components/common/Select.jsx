/**
 * Select Component - Production-Ready Responsive Design
 * مكون القائمة المنسدلة - تصميم مستجيب وإنتاجي
 * 
 * Features:
 * - Responsive sizing
 * - Mobile-friendly touch targets
 * - Clear error states
 * - Helper text support
 * - Accessible (ARIA)
 */

import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  error = null,
  required = false,
  disabled = false,
  className = '',
  helperText = '',
  placeholder = 'Select an option',
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
      
      {/* Select Wrapper */}
      <div className="relative w-full">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full
            px-4 md:px-4 py-3 md:py-2.5
            text-base md:text-sm
            border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-offset-0 
            transition-all duration-200 
            appearance-none
            bg-white text-gray-900 
            min-h-[44px] md:min-h-[40px]
            pr-10
            cursor-pointer
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
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Chevron Icon */}
        <ChevronDownIcon 
          className="absolute right-3 md:right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
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
    </div>
  );
};

export default Select;
