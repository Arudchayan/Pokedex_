import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn } from '../../utils/cn';

export type InputVariant = 'default' | 'filled' | 'outlined';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Visual style variant */
  variant?: InputVariant;
  /** Size of the input */
  size?: InputSize;
  /** Error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Helper text */
  helperText?: string;
  /** Loading state */
  loading?: boolean;
  /** Prefix element (icon or text) */
  prefix?: React.ReactNode;
  /** Suffix element (icon or text) */
  suffix?: React.ReactNode;
  /** Show clear button */
  clearable?: boolean;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Label for the input */
  label?: string;
  /** Makes label required indicator visible */
  required?: boolean;
  /** Container class name */
  containerClassName?: string;
}

/**
 * Input Component
 *
 * Accessible and feature-rich input component with multiple variants and states.
 *
 * Features:
 * - 3 variants: default, filled, outlined
 * - 3 sizes: sm, md, lg
 * - Error states with messages
 * - Loading state
 * - Prefix and suffix support
 * - Clearable with button
 * - Label with required indicator
 * - Helper text
 * - WCAG 2.1 AA compliant
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   required
 * />
 *
 * <Input
 *   type="search"
 *   prefix={<SearchIcon />}
 *   clearable
 *   onClear={() => console.log('cleared')}
 * />
 *
 * <Input
 *   error
 *   errorMessage="This field is required"
 * />
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error = false,
      errorMessage,
      helperText,
      loading = false,
      prefix,
      suffix,
      clearable = false,
      onClear,
      label,
      required = false,
      containerClassName,
      className,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(value || '');
    const currentValue = value !== undefined ? value : internalValue;
    const showClearButton = clearable && currentValue && !disabled && !loading;

    // Variant styles
    const variantStyles: Record<InputVariant, string> = {
      default: 'bg-slate-800/50 border-slate-600 focus:border-primary-400 focus:bg-slate-800',
      filled: 'bg-slate-700 border-transparent focus:border-primary-400 focus:bg-slate-600',
      outlined: 'bg-transparent border-slate-500 focus:border-primary-400 focus:bg-slate-800/30',
    };

    // Size styles
    const sizeStyles: Record<InputSize, string> = {
      sm: 'h-8 px-2.5 text-xs',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    };

    // Icon size based on input size
    const iconSizeStyles: Record<InputSize, string> = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    // Padding adjustments when prefix/suffix present
    const prefixPadding = prefix ? 'pl-9' : '';
    const suffixPadding = suffix || showClearButton || loading ? 'pr-9' : '';

    // Base styles
    const baseStyles =
      'w-full rounded-lg border transition-all duration-200 text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50';

    // Error styles
    const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

    const handleClear = () => {
      if (onClear) {
        onClear();
      }
      setInternalValue('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-200 mb-1.5">
            {label}
            {required && (
              <span className="text-red-400 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Prefix */}
          {prefix && (
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-slate-400',
                iconSizeStyles[size]
              )}
            >
              {prefix}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            value={currentValue}
            onChange={handleChange}
            disabled={disabled || loading}
            aria-invalid={error}
            aria-describedby={
              error && errorMessage
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            aria-required={required}
            className={cn(
              baseStyles,
              variantStyles[variant],
              sizeStyles[size],
              prefixPadding,
              suffixPadding,
              errorStyles,
              className
            )}
            {...props}
          />

          {/* Suffix / Loading / Clear */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {loading && (
              <span
                className={cn(
                  'inline-flex animate-spin rounded-full border-2 border-transparent border-t-primary-400 border-r-primary-400',
                  iconSizeStyles[size]
                )}
                role="status"
                aria-label="Loading"
              />
            )}

            {!loading && showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className={cn(
                  'inline-flex items-center justify-center text-slate-400 hover:text-slate-200 focus:outline-none focus:text-slate-200 transition-colors',
                  iconSizeStyles[size]
                )}
                aria-label="Clear input"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-full h-full"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}

            {!loading && !showClearButton && suffix && (
              <div className={cn('flex items-center text-slate-400', iconSizeStyles[size])}>
                {suffix}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && errorMessage && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-400" role="alert">
            {errorMessage}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;
