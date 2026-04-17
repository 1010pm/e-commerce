/**
 * Currency Icon Component
 * Displays Omani Rial or other currency symbols with styling options
 * Uses Thawani logo as the primary currency icon
 */

import React from 'react';
import { getCurrencyConfig, getCurrencySymbol } from '../constants/currency';
import { ThawaniLogo } from './ThawaniLogo';

/**
 * OMR Icon Component
 * Uses Thawani logo as the currency icon for OMR currency
 */
const OmrIcon = ({ size = 'md', className = '' }) => {
  return <ThawaniLogo size={size} className={className} />;

/**
 * Simple OMR Text Symbol Component
 * For cases where SVG is not needed
 */
const OmrTextSymbol = ({ currency = 'OMR', className = '' }) => {
  const config = getCurrencyConfig(currency);
  
  return (
    <span
      className={`font-semibold whitespace-nowrap ${className}`}
      title={config.name}
    >
      {config.symbol}
    </span>
  );
};

/**
 * Currency Icon Component (Main Export)
 * Supports both SVG and text-based currency display
 *
 * @component
 * @param {string} props.currency - Currency code (default: 'OMR')
 * @param {string} props.size - Icon size: 'xs', 'sm', 'md', 'lg', 'xl', '2xl'
 * @param {string} props.variant - Display variant: 'icon' (SVG) or 'text'
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showLabel - Show currency code label
 * @param {string} props.labelPosition - Label position: 'before' or 'after'
 * @example
 * // SVG icon
 * <CurrencyIcon currency="OMR" size="md" variant="icon" />
 *
 * // Text symbol
 * <CurrencyIcon currency="OMR" variant="text" />
 *
 * // With label
 * <CurrencyIcon currency="OMR" showLabel labelPosition="after" />
 */
const CurrencyIcon = ({
  currency = 'OMR',
  size = 'md',
  variant = 'icon',
  className = '',
  showLabel = false,
  labelPosition = 'after',
}) => {
  const config = getCurrencyConfig(currency);

  if (variant === 'text') {
    if (showLabel && currency === 'OMR') {
      return (
        <span className={`flex items-center gap-1 ${className}`}>
          {labelPosition === 'before' && <span className="text-xs font-semibold">{currency}</span>}
          <OmrTextSymbol currency={currency} />
          {labelPosition === 'after' && <span className="text-xs font-semibold">{currency}</span>}
        </span>
      );
    }
    return <OmrTextSymbol currency={currency} className={className} />;
  }

  // SVG variant (icon)
  if (currency === 'OMR') {
    if (showLabel) {
      return (
        <span className={`flex items-center gap-1 ${className}`}>
          {labelPosition === 'before' && <span className="text-xs font-semibold">{currency}</span>}
          <OmrIcon size={size} />
          {labelPosition === 'after' && <span className="text-xs font-semibold">{currency}</span>}
        </span>
      );
    }
    return <OmrIcon size={size} className={className} />;
  }

  // For other currencies, use text variant
  return <OmrTextSymbol currency={currency} className={className} />;
};

/**
 * Currency Badge Component
 * Displays currency in a badge format useful for headers
 */
export const CurrencyBadge = ({
  currency = 'OMR',
  size = 'md',
  variant = 'outline',
  className = '',
}) => {
  const config = getCurrencyConfig(currency);

  const baseClasses =
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold';

  const variantClasses = {
    outline: 'border border-primary-200 text-primary-700 bg-primary-50',
    solid: 'bg-primary-600 text-white',
    ghost: 'text-primary-600 hover:bg-primary-50',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant] || variantClasses.outline} ${className}`}>
      <CurrencyIcon currency={currency} size="sm" variant="icon" />
      <span>{config.code}</span>
    </span>
  );
};

/**
 * Price Display Component
 * Formatted price with currency icon
 */
export const PriceDisplay = ({
  amount,
  currency = 'OMR',
  size = 'md',
  showIcon = true,
  className = '',
  strikethrough = false,
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  };

  const config = getCurrencyConfig(currency);
  const formattedAmount = new Intl.NumberFormat(config.locale || 'en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);

  return (
    <div className={`flex items-center gap-1 ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      {showIcon && config.position === 'before' && (
        <CurrencyIcon currency={currency} size={size} className="flex-shrink-0" />
      )}
      <span className={strikethrough ? 'line-through text-gray-500' : 'font-semibold'}>
        {formattedAmount}
      </span>
      {showIcon && config.position === 'after' && (
        <CurrencyIcon currency={currency} size={size} className="flex-shrink-0" />
      )}
    </div>
  );
};

export default CurrencyIcon;
export { ThawaniLogo, ThawaniLogoWithText, ThawaniCurrencyBadge, ThawaniPriceDisplay } from './ThawaniLogo';
