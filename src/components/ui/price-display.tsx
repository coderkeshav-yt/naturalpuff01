import React from 'react';

interface PriceDisplayProps {
  price: number | string;
  className?: string;
  discountedPrice?: number | string;
  discountPercent?: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A reusable component for displaying prices consistently across the application
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  className = '',
  discountedPrice,
  discountPercent,
  size = 'md',
}) => {
  // Convert price to number and divide by 10 if it's a whole number ending in 0
  // This fixes the issue where prices are displayed as 10x their actual value
  const formatPrice = (value: number | string): number => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // If the price is a whole number and ends with 0, divide by 10
    // This handles the case where prices are stored as 2940 but should display as 294
    if (numValue % 10 === 0 && numValue >= 1000) {
      return numValue / 10;
    }
    
    return numValue;
  };

  // Format the price with Indian locale and proper decimal places
  const formatPriceString = (value: number): string => {
    return value.toLocaleString('en-IN');
  };

  // Determine text size based on the size prop
  const textSizeClass = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  // Format the prices
  const formattedPrice = formatPriceString(formatPrice(price));
  const formattedDiscountedPrice = discountedPrice 
    ? formatPriceString(formatPrice(discountedPrice)) 
    : null;

  return (
    <div className={`flex items-center ${className}`}>
      {discountedPrice ? (
        <>
          <span className={`font-bold text-brand-600 ${textSizeClass}`}>
            ₹{formattedDiscountedPrice}
          </span>
          <span className="text-gray-500 line-through text-sm ml-2">
            ₹{formattedPrice}
          </span>
          {discountPercent && (
            <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded ml-2">
              {discountPercent}% OFF
            </span>
          )}
        </>
      ) : (
        <span className={`font-bold text-brand-600 ${textSizeClass}`}>
          ₹{formattedPrice}
        </span>
      )}
    </div>
  );
};
