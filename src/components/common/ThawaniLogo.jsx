/**
 * Thawani Logo Component
 * Displays the Thawani payment gateway logo as currency icon
 * Used for pricing and payment-related displays
 */

import React from 'react';

/**
 * Thawani Logo SVG Component
 * Red geometric design used as currency/brand icon
 * 
 * @component
 * @param {string} props.size - Icon size: 'xs', 'sm', 'md', 'lg', 'xl', '2xl'
 * @param {string} props.className - Additional CSS classes
 * @example
 * <ThawaniLogo size="md" />
 * <ThawaniLogo size="lg" className="text-red-600" />
 */
export const ThawaniLogo = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    xs: '16',
    sm: '20',
    md: '24',
    lg: '32',
    xl: '40',
    '2xl': '48',
  };

  const sizeValue = sizeMap[size] || sizeMap.md;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 960 640"
      fill="currentColor"
      width={sizeValue}
      height={sizeValue}
      className={`inline-block ${className}`}
      aria-label="Thawani"
      style={{ color: '#C41E3A' }}
    >
      {/* Top curved element */}
      <path d="M 160 240 Q 200 80 380 80 L 620 80 Q 700 80 760 140 L 680 240 L 160 240 Z" fill="currentColor" />
      
      {/* Middle top bar */}
      <rect x="120" y="240" width="800" height="100" fill="currentColor" />
      
      {/* Middle bottom bar (with gap for opening) */}
      <path d="M 40 360 L 440 360 L 420 400 L 60 400 Z" fill="currentColor" />
      <path d="M 560 360 L 920 360 L 900 400 L 540 400 Z" fill="currentColor" />
      
      {/* Bottom bar */}
      <path d="M 0 420 L 960 420 L 900 540 Q 800 600 680 600 L 280 600 Q 160 600 60 540 Z" fill="currentColor" />
    </svg>
  );
};

/**
 * Thawani Logo with Text Component
 * Displays logo alongside optional text label
 * 
 * @component
 * @param {string} props.size - Icon size
 * @param {string} props.label - Optional text label (e.g., "Thawani", "Payment")
 * @param {string} props.className - Additional CSS classes
 * @example
 * <ThawaniLogoWithText size="md" label="Pay with Thawani" />
 */
export const ThawaniLogoWithText = ({ size = 'md', label = '', className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ThawaniLogo size={size} />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
};

/**
 * Compact Thawani Currency Badge
 * Minimal design for use in product listings and prices
 * 
 * @component
 * @param {string} props.amount - Amount to display (e.g., "29.999")
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 * @example
 * <ThawaniCurrencyBadge amount="29.999" size="md" />
 */
export const ThawaniCurrencyBadge = ({ amount = '', size = 'md', className = '' }) => {
  const sizeMap = {
    sm: { logo: 'xs', text: 'text-xs' },
    md: { logo: 'sm', text: 'text-sm' },
    lg: { logo: 'md', text: 'text-base' },
  };

  const sizeConfig = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 ${className}`}>
      <ThawaniLogo size={sizeConfig.logo} />
      {amount && <span className={`font-semibold ${sizeConfig.text}`}>{amount}</span>}
    </div>
  );
};

/**
 * Price Display with Thawani Logo
 * Complete price component with amount and Thawani logo
 * 
 * @component
 * @param {number} props.amount - Price amount
 * @param {string} props.size - Size variant
 * @param {boolean} props.showBrand - Show "Thawani" text
 * @param {string} props.className - Additional CSS classes
 * @example
 * <ThawaniPriceDisplay amount={29.999} size="md" />
 * <ThawaniPriceDisplay amount={100} size="lg" showBrand={true} />
 */
export const ThawaniPriceDisplay = ({
  amount = '0',
  size = 'md',
  showBrand = false,
  className = '',
}) => {
  const logoSizeMap = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
  };

  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const logoSize = logoSizeMap[size] || logoSizeMap.md;
  const textSize = textSizeMap[size] || textSizeMap.md;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <ThawaniLogo size={logoSize} />
      <span className={`font-semibold tabular-nums ${textSize}`}>
        {typeof amount === 'number' ? amount.toFixed(3) : amount}
      </span>
      {showBrand && <span className="text-xs font-medium opacity-75">Thawani</span>}
    </div>
  );
};

export default ThawaniLogo;
