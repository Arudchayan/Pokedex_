import React from 'react';
import { cn } from '../../utils/cn';

interface CalculatorActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

/**
 * Theme-safe action button for calculator results.
 *
 * The shared `primary` Tailwind token is not usable in this build, so the
 * calculator actions use explicit high-contrast pairs: dark ink on light
 * surfaces and white on dark surfaces.
 */
const CalculatorActionButton: React.FC<CalculatorActionButtonProps> = ({
  variant = 'primary',
  className,
  type = 'button',
  children,
  ...props
}) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:border-slate-500 disabled:bg-slate-500 disabled:text-white dark:disabled:border-slate-500 dark:disabled:bg-slate-500 dark:disabled:text-white',
      variant === 'primary'
        ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900 focus-visible:ring-offset-white dark:border-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-slate-900'
        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500 focus-visible:ring-offset-white dark:border-white/20 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/10 dark:focus-visible:ring-slate-400 dark:focus-visible:ring-offset-slate-900',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export default CalculatorActionButton;
