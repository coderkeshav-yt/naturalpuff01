
import React from 'react';

interface SquareAspectRatioProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A component that enforces a square aspect ratio (1:1) for its children
 */
export function SquareAspectRatio({ children, className = '' }: SquareAspectRatioProps) {
  return (
    <div className={`relative w-full pb-[100%] ${className}`}>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}
