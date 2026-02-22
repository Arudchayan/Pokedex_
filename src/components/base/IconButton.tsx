import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: IconButtonVariant;
  /** Size of the button */
  size?: IconButtonSize;
  /** Icon element to display */
  icon: React.ReactNode;
  /** Accessible label for screen readers */
  'aria-label': string;
  /** Loading state */
  loading?: boolean;
  /** Custom class names */
  className?: string;
}

/**
 * IconButton Component
 * 
 * Square button designed for icon-only usage with proper accessibility.
 * 
 * Features:
 * - 4 variants: primary, secondary, ghost, danger
 * - 4 sizes: sm, md, lg, xl
 * - Loading state
 * - Required aria-label for accessibility
 * - Square dimensions
 * - Hover and active states
 * - WCAG 2.1 AA compliant
 * 
 * @example
 * ```tsx
 * <IconButton
 *   icon={<HeartIcon />}
 *   aria-label="Add to favorites"
 *   variant="primary"
 * />
 * 
 * <IconButton
 *   icon={<TrashIcon />}
 *   aria-label="Delete"
 *   variant="danger"
 *   size="sm"
 * />
 * 
 * <IconButton
 *   icon={<SearchIcon />}
 *   aria-label="Search"
 *   variant="ghost"
 *   loading
 * />
 * ```
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      icon,
      'aria-label': ariaLabel,
      loading = false,
      className,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Variant styles
    const variantStyles: Record<IconButtonVariant, string> = {
      primary:
        'bg-primary-500 text-white border-primary-400/60 hover:bg-primary-600 hover:border-primary-500 active:bg-primary-700 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30',
      secondary:
        'bg-slate-700 text-slate-100 border-slate-600 hover:bg-slate-600 hover:border-slate-500 active:bg-slate-800 shadow-md hover:shadow-lg',
      ghost:
        'bg-transparent text-slate-300 border-transparent hover:bg-white/10 hover:border-white/20 active:bg-white/5',
      danger:
        'bg-red-500 text-white border-red-400 hover:bg-red-600 hover:border-red-500 active:bg-red-700 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30',
    };

    // Size styles (square dimensions)
    const sizeStyles: Record<IconButtonSize, string> = {
      sm: 'w-8 h-8 p-1.5',
      md: 'w-10 h-10 p-2',
      lg: 'w-12 h-12 p-2.5',
      xl: 'w-14 h-14 p-3',
    };

    // Icon size based on button size
    const iconSizeStyles: Record<IconButtonSize, string> = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-7 h-7',
    };

    // Spinner size based on button size
    const spinnerSizeStyles: Record<IconButtonSize, string> = {
      sm: 'w-3 h-3 border-[1.5px]',
      md: 'w-4 h-4 border-2',
      lg: 'w-5 h-5 border-[2.5px]',
      xl: 'w-6 h-6 border-[3px]',
    };

    // Determine if button should be disabled
    const isDisabled = disabled || loading;

    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';

    // Interactive styles (only when not disabled)
    const interactiveStyles = !isDisabled
      ? 'hover:scale-105 active:scale-95'
      : '';

    // Render loading spinner
    const renderSpinner = () => (
      <span
        className={cn(
          'inline-flex animate-spin rounded-full border-transparent border-t-current border-r-current',
          spinnerSizeStyles[size]
        )}
        role="status"
        aria-label="Loading"
      />
    );

    // Render icon
    const renderIcon = () => (
      <span className={cn('inline-flex items-center justify-center', iconSizeStyles[size])}>
        {icon}
      </span>
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={loading}
        aria-disabled={isDisabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          interactiveStyles,
          className
        )}
        {...props}
      >
        {loading ? renderSpinner() : renderIcon()}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton };
export default IconButton;
