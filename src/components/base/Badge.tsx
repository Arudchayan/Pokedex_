import React, { forwardRef, HTMLAttributes } from 'react';

// Badge variant and size types
export type BadgeVariant = 'solid' | 'soft' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Custom color (CSS color value or Tailwind color) */
  color?: string;
  /** Makes badge removable with close button */
  removable?: boolean;
  /** Callback when remove button is clicked */
  onRemove?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Custom class names */
  className?: string;
  /** Badge content */
  children?: React.ReactNode;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'solid',
      size = 'md',
      color,
      removable = false,
      onRemove,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Size styles
    const sizeStyles = {
      sm: 'px-2 py-0.5 text-[10px] gap-1',
      md: 'px-3 py-1 text-xs gap-1.5',
      lg: 'px-4 py-1.5 text-sm gap-2',
    };

    // Get variant styles based on color
    const getVariantStyles = () => {
      // If custom color is provided, use inline styles
      if (color) {
        const variants = {
          solid: {
            backgroundColor: color,
            color: getContrastColor(color),
          },
          soft: {
            backgroundColor: `${color}20`,
            color: color,
          },
          outline: {
            backgroundColor: 'transparent',
            borderColor: color,
            color: color,
          },
        };
        return variants[variant];
      }

      // Default color variants (using Tailwind classes)
      const defaultVariants = {
        solid: 'bg-primary-500 text-white',
        soft: 'bg-primary-500/20 text-primary-400 dark:text-primary-300',
        outline:
          'bg-transparent border border-primary-400 text-primary-500 dark:text-primary-400',
      };

      return defaultVariants[variant];
    };

    const variantStyles = getVariantStyles();
    const isInlineStyle = typeof variantStyles === 'object';
    const isCustomColor = Boolean(color);

    const inlineStyle: React.CSSProperties | undefined = isInlineStyle
      ? ({
          ...(variantStyles as React.CSSProperties),
          ...(variant === 'outline'
            ? {
                backgroundColor: 'transparent',
                borderStyle: 'solid',
                borderWidth: '1px',
                ...(isCustomColor ? { borderColor: color } : null),
              }
            : null),
        } as React.CSSProperties)
      : undefined;

    // Close button size based on badge size
    const closeButtonSize = {
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
      lg: 'w-4 h-4',
    };

    const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (onRemove) {
        onRemove(e);
      }
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center justify-center rounded-full font-semibold uppercase tracking-wide shadow-sm transition-all duration-200 ${
          sizeStyles[size]
        } ${!isInlineStyle ? variantStyles : ''} ${
          variant === 'outline' ? 'border' : ''
        } ${className}`}
        style={inlineStyle}
        {...props}
      >
        {children}

        {removable && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove badge"
            className={`inline-flex items-center justify-center rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${closeButtonSize[size]} hover:opacity-70`}
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
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Helper function to determine if text should be light or dark based on background color
function getContrastColor(hexColor: string): string {
  // Handle CSS color values
  if (!hexColor.startsWith('#')) {
    return '#ffffff'; // Default to white for non-hex colors
  }

  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black or white based on luminance
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
}

export { Badge };
export default Badge;
