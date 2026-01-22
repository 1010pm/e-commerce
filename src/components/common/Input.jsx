/**
 * Input Component - Premium Clean Design
 * مكون حقل الإدخال - تصميم نظيف ومميز
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
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400 ${
          error 
            ? 'border-error-500 focus:ring-error-500 focus:border-error-500' 
            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
        } ${
          disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-gray-400'
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-error-600 font-medium" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;

