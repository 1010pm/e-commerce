/**
 * Card Component - Premium Clean Design
 * مكون البطاقة - تصميم نظيف ومميز
 */

import React from 'react';

const Card = ({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}) => {
  const baseStyles = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200';
  const hoverStyles = hover ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Header
export const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`p-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

// Card Body
export const CardBody = ({ children, className = '' }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

// Card Footer
export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`p-4 border-t border-gray-200 bg-gray-50 ${className}`}>
      {children}
    </div>
  );
};

export default Card;

