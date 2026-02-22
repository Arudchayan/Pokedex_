import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type SpinnerVariant = 'default' | 'pokeball' | 'dots';
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: SpinnerVariant;
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Loading text */
  label?: string;
  /** Custom class names */
  className?: string;
}

/**
 * Spinner Component
 * 
 * Loading indicator with multiple variants including Pokemon-themed options.
 * 
 * Features:
 * - 3 variants: default (circular), pokeball, dots
 * - 4 sizes: sm, md, lg, xl
 * - Optional label text
 * - Accessible with ARIA labels
 * - Pokemon-themed animations
 * 
 * @example
 * ```tsx
 * <Spinner />
 * 
 * <Spinner variant="pokeball" size="lg" />
 * 
 * <Spinner variant="dots" label="Loading Pokemon..." />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
  variant = 'default',
  size = 'md',
  label,
  className,
  ...props
}) => {
  // Size styles
  const sizeStyles: Record<SpinnerSize, { container: string; spinner: string }> = {
    sm: { container: 'gap-2', spinner: 'w-4 h-4' },
    md: { container: 'gap-2.5', spinner: 'w-6 h-6' },
    lg: { container: 'gap-3', spinner: 'w-8 h-8' },
    xl: { container: 'gap-4', spinner: 'w-12 h-12' },
  };

  // Render default circular spinner
  const renderDefault = () => (
    <div
      className={cn(
        'inline-flex animate-spin rounded-full border-[3px] border-transparent border-t-primary-400 border-r-primary-400',
        sizeStyles[size].spinner
      )}
      role="status"
      aria-label={label || 'Loading'}
    />
  );

  // Render pokeball spinner
  const renderPokeball = () => (
    <div
      className={cn(
        'inline-flex relative animate-bounce',
        sizeStyles[size].spinner
      )}
      role="status"
      aria-label={label || 'Loading'}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full animate-spin-slow"
      >
        {/* Top half (red) */}
        <path
          d="M50 5 C 75 5 95 25 95 50 L 60 50 C 60 44 56 40 50 40 C 44 40 40 44 40 50 L 5 50 C 5 25 25 5 50 5 Z"
          fill="#EF4444"
          stroke="#1F2937"
          strokeWidth="3"
        />
        {/* Bottom half (white) */}
        <path
          d="M50 95 C 25 95 5 75 5 50 L 40 50 C 40 56 44 60 50 60 C 56 60 60 56 60 50 L 95 50 C 95 75 75 95 50 95 Z"
          fill="#F8FAFC"
          stroke="#1F2937"
          strokeWidth="3"
        />
        {/* Center circle (white) */}
        <circle
          cx="50"
          cy="50"
          r="12"
          fill="#F8FAFC"
          stroke="#1F2937"
          strokeWidth="3"
        />
        {/* Center circle (inner) */}
        <circle
          cx="50"
          cy="50"
          r="7"
          fill="transparent"
          stroke="#1F2937"
          strokeWidth="2"
        />
      </svg>
    </div>
  );

  // Render dots spinner
  const renderDots = () => {
    const dotSize = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
      xl: 'w-3 h-3',
    };

    return (
      <div
        className="inline-flex items-center gap-1"
        role="status"
        aria-label={label || 'Loading'}
      >
        <div
          className={cn(
            'rounded-full bg-primary-400 animate-bounce',
            dotSize[size]
          )}
          style={{ animationDelay: '0ms' }}
        />
        <div
          className={cn(
            'rounded-full bg-primary-400 animate-bounce',
            dotSize[size]
          )}
          style={{ animationDelay: '150ms' }}
        />
        <div
          className={cn(
            'rounded-full bg-primary-400 animate-bounce',
            dotSize[size]
          )}
          style={{ animationDelay: '300ms' }}
        />
      </div>
    );
  };

  // Select renderer based on variant
  const renderSpinner = () => {
    switch (variant) {
      case 'pokeball':
        return renderPokeball();
      case 'dots':
        return renderDots();
      default:
        return renderDefault();
    }
  };

  return (
    <div
      className={cn(
        'inline-flex flex-col items-center justify-center',
        sizeStyles[size].container,
        className
      )}
      {...props}
    >
      {renderSpinner()}
      {label && (
        <span className="text-sm text-slate-300 font-medium">{label}</span>
      )}
    </div>
  );
};

Spinner.displayName = 'Spinner';

export default Spinner;
