/**
 * Design System: Spacing Tokens
 * 
 * 4px base scale for consistent spacing throughout the application
 * Use these tokens instead of arbitrary values for maintainable spacing
 * 
 * Example usage:
 * - margin: spacing.md
 * - padding: spacing.xl
 * - gap: spacing.sm
 */

/**
 * Spacing Scale (4px base)
 * Values range from 4px to 128px
 */
export const spacing = {
  /** 4px - Minimum spacing */
  xs: '4px',
  
  /** 8px - Tight spacing between related elements */
  sm: '8px',
  
  /** 12px - Default spacing for compact layouts */
  md: '12px',
  
  /** 16px - Standard spacing between elements */
  lg: '16px',
  
  /** 20px - Comfortable spacing */
  xl: '20px',
  
  /** 24px - Generous spacing between sections */
  '2xl': '24px',
  
  /** 32px - Large section spacing */
  '3xl': '32px',
  
  /** 48px - Extra large section spacing */
  '4xl': '48px',
  
  /** 64px - Major section divider */
  '5xl': '64px',
  
  /** 80px - Page section spacing */
  '6xl': '80px',
  
  /** 96px - Large page section spacing */
  '7xl': '96px',
  
  /** 128px - Maximum spacing */
  '8xl': '128px',
} as const;

/**
 * Component-specific spacing presets
 * Common spacing patterns for different component types
 */
export const componentSpacing = {
  /** Card padding variants */
  card: {
    sm: spacing.md,
    md: spacing.lg,
    lg: spacing['2xl'],
  },
  
  /** Button padding variants */
  button: {
    sm: `${spacing.xs} ${spacing.md}`,
    md: `${spacing.sm} ${spacing.lg}`,
    lg: `${spacing.md} ${spacing['2xl']}`,
  },
  
  /** Input padding variants */
  input: {
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
  },
  
  /** Modal/Dialog spacing */
  modal: {
    padding: spacing['2xl'],
    gap: spacing.lg,
  },
  
  /** Grid gaps */
  grid: {
    compact: spacing.sm,
    comfortable: spacing.lg,
    spacious: spacing['2xl'],
  },
  
  /** Stack spacing (vertical rhythm) */
  stack: {
    tight: spacing.xs,
    normal: spacing.md,
    relaxed: spacing.xl,
  },
} as const;

/**
 * Container max widths
 * Responsive container sizes for different layouts
 */
export const container = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
} as const;

/**
 * Border radius scale
 * Consistent rounding for UI elements
 */
export const radius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
} as const;

/**
 * Utility function to get spacing value
 */
export const getSpacing = (size: keyof typeof spacing) => {
  return spacing[size];
};

/**
 * Export all spacing tokens
 */
export default spacing;
