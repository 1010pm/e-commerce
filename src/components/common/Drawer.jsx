/**
 * Drawer Component - Mobile-First Responsive Panel
 * مكون الدرج - لوحة سحب للهاتف المحمول
 * 
 * Features:
 * - Mobile-first design
 * - Smooth animations
 * - Click outside to close
 * - Responsive positioning
 * - Accessibility support (ARIA, ESC key)
 */

import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Drawer = ({
  isOpen,
  onClose,
  children,
  title = '',
  position = 'right', // 'left' or 'right'
  size = 'md', // 'sm', 'md', 'lg', 'full'
  className = '',
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Size classes
  const sizeClasses = {
    sm: 'w-64 md:w-72',
    md: 'w-80 md:w-96',
    lg: 'w-96 md:w-screen md:max-w-2xl',
    full: 'w-full',
  };

  // Position classes
  const positionClasses = {
    left: `left-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`,
    right: `right-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black z-40
          transition-opacity duration-300 ease-out
          ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`
          fixed top-0 ${positionClasses[position]} ${sizeClasses[size]}
          h-screen bg-white shadow-xl
          transform transition-transform duration-300 ease-out
          z-50 flex flex-col
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close drawer"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Close Button (if no header) */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors z-10"
            aria-label="Close drawer"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </div>
    </>
  );
};

export default Drawer;
