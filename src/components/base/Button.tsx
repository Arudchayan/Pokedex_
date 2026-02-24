import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

// Button variant and size types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type IconPosition = 'left' | 'right';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Loading state - shows spinner and disables button */
  loading?: boolean;
  /** Icon element to display */
  icon?: React.ReactNode;
  /** Position of the icon relative to text */
  iconPosition?: IconPosition;
  /** Makes button take full width of container */
  fullWidth?: boolean;
  /** Custom class names */
  className?: string;
  /** Button content */
  children?: React.ReactNode;
}

/**
 * Button Component
 *
 * Production-ready button component with multiple variants, sizes, and states.
 * Fully accessible with proper ARIA attributes and focus management.
 *
 * Features:
 * - 4 variants: primary, secondary, ghost, danger
 * - 3 sizes: sm, md, lg
 * - Loading state with spinner
 * - Icon support (left or right)
 * - Full width option
 * - Forward ref support
 * - WCAG 2.1 AA compliant
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" icon={<PlusIcon />}>
 *   Add Pokemon
 * </Button>
 *
 * <Button variant="danger" loading>
 *   Deleting...
 * </Button>
 *
 * <Button variant="ghost" fullWidth icon={<SearchIcon />} iconPosition="left">
 *   Search
 * </Button>
 * ```
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Variant styles
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-primary-500 text-white border-primary-400/60 hover:bg-primary-600 hover:border-primary-500 active:bg-primary-700 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30',
      secondary:
        'bg-slate-700 text-slate-100 border-slate-600 hover:bg-slate-600 hover:border-slate-500 active:bg-slate-800 shadow-md hover:shadow-lg',
      ghost:
        'bg-transparent text-slate-300 border-transparent hover:bg-white/10 hover:border-white/20 active:bg-white/5',
      danger:
        'bg-red-500 text-white border-red-400 hover:bg-red-600 hover:border-red-500 active:bg-red-700 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    // Icon size based on button size
    const iconSizeStyles: Record<ButtonSize, string> = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    // Spinner size based on button size
    const spinnerSizeStyles: Record<ButtonSize, string> = {
      sm: 'w-3 h-3 border-[1.5px]',
      md: 'w-4 h-4 border-2',
      lg: 'w-5 h-5 border-[2.5px]',
    };

    // Determine if button should be disabled
    const isDisabled = disabled || loading;

    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-lg border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';

    // Interactive styles (only when not disabled)
    const interactiveStyles = !isDisabled ? 'hover:scale-[1.02] active:scale-[0.98]' : '';

    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';

    // Render icon wrapper
    const renderIcon = (iconNode: React.ReactNode) => {
      if (!iconNode) return null;
      return (
        <span className={cn('inline-flex items-center', iconSizeStyles[size])}>{iconNode}</span>
      );
    };

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

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          interactiveStyles,
          widthStyles,
          className
        )}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {/* Show spinner when loading, otherwise show icon on left */}
        {loading && renderSpinner()}
        {!loading && icon && iconPosition === 'left' && renderIcon(icon)}

        {/* Button content */}
        {children && <span className={cn(loading && 'opacity-70')}>{children}</span>}

        {/* Icon on right (only when not loading) */}
        {!loading && icon && iconPosition === 'right' && renderIcon(icon)}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
