/**
 * Currency Component
 * Displays amounts with custom OMR currency icon
 * Replaces all "OMR" text throughout the application
 * 
 * @component
 * @param {number} amount - The amount to display
 * @param {string} size - Icon size: 'sm' (14px), 'md' (16px), 'lg' (18px)
 * @param {boolean} showFallback - Show "OMR" text if image fails to load
 * @param {string} className - Additional CSS classes
 * 
 * @example
 * // Basic usage - shows: "5.000 [icon]"
 * <Currency amount={5} />
 * 
 * // Large icon
 * <Currency amount={29.999} size="lg" />
 * 
 * // In checkout
 * <Currency amount={total} />
 */

import React, { useState } from 'react';
import omrIcon from '../../images/Omr_symbol.svg.png';

const Currency = ({ 
  amount = 0, 
  size = 'md',
  showFallback = true,
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false);

  // Size mapping for icon
  const sizeMap = {
    sm: '14px',
    md: '16px',
    lg: '18px',
  };

  const iconSize = sizeMap[size] || sizeMap.md;

  // Format amount to 3 decimal places
  const formattedAmount = typeof amount === 'number' 
    ? amount.toFixed(3) 
    : parseFloat(amount).toFixed(3);

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${className}`}>
      <span className="font-semibold tabular-nums">
        {formattedAmount}
      </span>
      
      {!imageError ? (
        <img
          src={omrIcon}
          alt="OMR"
          style={{
            width: iconSize,
            height: iconSize,
            display: 'inline-block',
            verticalAlign: 'middle',
            flexShrink: 0,
          }}
          onError={handleImageError}
          title="Omani Rial"
        />
      ) : showFallback ? (
        <span className="text-sm font-medium" style={{ fontSize: '0.85em' }}>
          OMR
        </span>
      ) : null}
    </span>
  );
};

export default Currency;
