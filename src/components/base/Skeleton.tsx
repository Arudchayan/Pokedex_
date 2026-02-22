import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Animation type */
  animation?: 'pulse' | 'wave' | 'none';
  /** Custom class names */
  className?: string;
}

/**
 * Skeleton Component
 * 
 * Base skeleton loading placeholder with customizable dimensions and animations.
 * 
 * @example
 * ```tsx
 * <Skeleton width="100%" height="20px" />
 * <Skeleton width={200} height={200} rounded="full" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  rounded = 'md',
  animation = 'pulse',
  className,
  style,
  ...props
}) => {
  const roundedStyles = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-[length:200%_100%]',
    none: '',
  };

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  return (
    <div
      className={cn(
        'bg-slate-700/50',
        roundedStyles[rounded],
        animationStyles[animation],
        className
      )}
      style={inlineStyles}
      role="status"
      aria-label="Loading..."
      {...props}
    />
  );
};

// SkeletonText Component
export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of lines */
  lines?: number;
  /** Line height */
  lineHeight?: string;
  /** Gap between lines */
  gap?: string;
  /** Custom class names */
  className?: string;
}

/**
 * SkeletonText Component
 * 
 * Multi-line text skeleton with configurable lines and spacing.
 * 
 * @example
 * ```tsx
 * <SkeletonText lines={3} />
 * <SkeletonText lines={5} lineHeight="16px" gap="8px" />
 * ```
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = '1rem',
  gap = '0.5rem',
  className,
  ...props
}) => {
  return (
    <div
      className={cn('flex flex-col', className)}
      style={{ gap }}
      role="status"
      aria-label="Loading text..."
      {...props}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
};

// SkeletonCircle Component
export interface SkeletonCircleProps extends HTMLAttributes<HTMLDivElement> {
  /** Size of the circle (diameter) */
  size?: string | number;
  /** Custom class names */
  className?: string;
}

/**
 * SkeletonCircle Component
 * 
 * Circular skeleton for avatars and profile images.
 * 
 * @example
 * ```tsx
 * <SkeletonCircle size={64} />
 * <SkeletonCircle size="4rem" />
 * ```
 */
export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = 48,
  className,
  ...props
}) => {
  return (
    <Skeleton
      width={size}
      height={size}
      rounded="full"
      className={className}
      role="status"
      aria-label="Loading avatar..."
      {...props}
    />
  );
};

// SkeletonCard Component
export interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Show image skeleton */
  showImage?: boolean;
  /** Image height */
  imageHeight?: string;
  /** Show title */
  showTitle?: boolean;
  /** Show description lines */
  descriptionLines?: number;
  /** Custom class names */
  className?: string;
}

/**
 * SkeletonCard Component
 * 
 * Full card skeleton matching typical card layouts.
 * 
 * @example
 * ```tsx
 * <SkeletonCard />
 * <SkeletonCard showImage imageHeight="200px" descriptionLines={3} />
 * ```
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = true,
  imageHeight = '12rem',
  showTitle = true,
  descriptionLines = 2,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700',
        className
      )}
      role="status"
      aria-label="Loading card..."
      {...props}
    >
      {/* Image */}
      {showImage && (
        <Skeleton
          height={imageHeight}
          rounded="none"
          className="w-full"
        />
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        {showTitle && (
          <Skeleton height="1.5rem" width="75%" />
        )}

        {/* Description */}
        {descriptionLines > 0 && (
          <SkeletonText lines={descriptionLines} />
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Skeleton height="2rem" width="5rem" />
          <Skeleton height="2rem" width="5rem" />
        </div>
      </div>
    </div>
  );
};

Skeleton.displayName = 'Skeleton';
SkeletonText.displayName = 'SkeletonText';
SkeletonCircle.displayName = 'SkeletonCircle';
SkeletonCard.displayName = 'SkeletonCard';

export default Skeleton;
