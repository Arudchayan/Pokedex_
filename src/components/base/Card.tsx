import React, { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

// Card variant types
export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: CardVariant;
  /** Padding size */
  padding?: CardPadding;
  /** Adds hover effects and cursor pointer */
  interactive?: boolean;
  /** Custom class names */
  className?: string;
  /** Children elements */
  children?: React.ReactNode;
}

// Base Card Component
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      padding = 'md',
      interactive = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Variant styles
    const variantStyles = {
      elevated:
        'bg-white/80 dark:bg-black/20 backdrop-blur-lg shadow-lg border border-white/10 dark:border-white/20',
      outlined:
        'bg-transparent border-2 border-slate-200 dark:border-white/20',
      filled: 'bg-slate-100 dark:bg-slate-900/50 border border-transparent',
    };

    // Padding styles
    const paddingStyles = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    // Interactive styles
    const interactiveStyles = interactive
      ? 'cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
      : '';

    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
      // Preserve any user-provided key handler.
      props.onKeyDown?.(e);
      if (!interactive) return;
      if (e.defaultPrevented) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;

      e.preventDefault();
      // Call the click handler to simulate button behavior for keyboard users.
      (props.onClick as any)?.(e);
    };

    return (
      <div
        ref={ref}
        className={`rounded-xl ${variantStyles[variant]} ${paddingStyles[padding]} ${interactiveStyles} ${className}`}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card.Header - Composition component
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mb-3 pb-3 border-b border-slate-200 dark:border-white/10 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'Card.Header';

// Card.Body - Composition component
interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`flex-1 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'Card.Body';

// Card.Footer - Composition component
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-3 pt-3 border-t border-slate-200 dark:border-white/10 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'Card.Footer';

// Attach compound components
const CardWithComponents = Object.assign(Card, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

export { CardWithComponents as Card, CardHeader, CardBody, CardFooter };
export default CardWithComponents;
