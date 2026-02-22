/**
 * Design System: Typography Tokens
 * 
 * Type scale, weights, and line heights for consistent typography
 * Based on a modular scale with good readability across devices
 * 
 * Font Stack: 'Inter' from Google Fonts (already loaded)
 * Fallback: system-ui, -apple-system, sans-serif
 */

/**
 * Font Families
 */
export const fontFamily = {
  sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
} as const;

/**
 * Font Sizes
 * Using rem units for accessibility (1rem = 16px default)
 */
export const fontSize = {
  /** 12px - Fine print, captions */
  xs: {
    size: '0.75rem',
    lineHeight: '1rem',
  },
  
  /** 14px - Small text, labels */
  sm: {
    size: '0.875rem',
    lineHeight: '1.25rem',
  },
  
  /** 16px - Base body text */
  base: {
    size: '1rem',
    lineHeight: '1.5rem',
  },
  
  /** 18px - Slightly emphasized text */
  lg: {
    size: '1.125rem',
    lineHeight: '1.75rem',
  },
  
  /** 20px - Pokemon names, card titles */
  xl: {
    size: '1.25rem',
    lineHeight: '1.75rem',
  },
  
  /** 24px - Section headers */
  '2xl': {
    size: '1.5rem',
    lineHeight: '2rem',
  },
  
  /** 30px - Page headers */
  '3xl': {
    size: '1.875rem',
    lineHeight: '2.25rem',
  },
  
  /** 36px - Major headings */
  '4xl': {
    size: '2.25rem',
    lineHeight: '2.5rem',
  },
  
  /** 48px - Hero/display text */
  '5xl': {
    size: '3rem',
    lineHeight: '1',
  },
  
  /** 60px - Extra large display */
  '6xl': {
    size: '3.75rem',
    lineHeight: '1',
  },
} as const;

/**
 * Font Weights
 */
export const fontWeight = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

/**
 * Line Heights
 * Relative values for flexible typography
 */
export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

/**
 * Letter Spacing
 */
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

/**
 * Typography Presets
 * Common text styles for specific use cases
 */
export const typography = {
  /** Hero/Display text - Large, impactful headers */
  display: {
    fontSize: fontSize['5xl'].size,
    lineHeight: fontSize['5xl'].lineHeight,
    fontWeight: fontWeight.extrabold,
    letterSpacing: letterSpacing.tight,
  },
  
  /** H1 - Page titles */
  h1: {
    fontSize: fontSize['4xl'].size,
    lineHeight: fontSize['4xl'].lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  
  /** H2 - Section titles */
  h2: {
    fontSize: fontSize['3xl'].size,
    lineHeight: fontSize['3xl'].lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  
  /** H3 - Subsection titles */
  h3: {
    fontSize: fontSize['2xl'].size,
    lineHeight: fontSize['2xl'].lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  
  /** H4 - Component titles */
  h4: {
    fontSize: fontSize.xl.size,
    lineHeight: fontSize.xl.lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
  },
  
  /** Pokemon name - Special styling for Pokemon cards */
  pokemonName: {
    fontSize: fontSize.xl.size,
    lineHeight: fontSize.xl.lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
    textTransform: 'capitalize' as const,
  },
  
  /** Body text - Default paragraph text */
  body: {
    fontSize: fontSize.base.size,
    lineHeight: fontSize.base.lineHeight,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  
  /** Body small - Slightly smaller body text */
  bodySm: {
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  
  /** Caption - Fine print, metadata */
  caption: {
    fontSize: fontSize.xs.size,
    lineHeight: fontSize.xs.lineHeight,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  
  /** Label - Form labels, badges */
  label: {
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
  
  /** Button text */
  button: {
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
  },
  
  /** Code/monospace text */
  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    fontWeight: fontWeight.normal,
  },
} as const;

/**
 * Text utilities
 */
export const textUtilities = {
  /** Truncate text with ellipsis */
  truncate: {
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  
  /** Limit text to specific number of lines */
  lineClamp: (lines: number) => ({
    overflow: 'hidden' as const,
    display: '-webkit-box' as const,
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
  }),
} as const;

/**
 * Utility function to create responsive typography
 */
export const responsiveText = (
  mobile: keyof typeof fontSize,
  desktop: keyof typeof fontSize
) => ({
  fontSize: fontSize[mobile].size,
  lineHeight: fontSize[mobile].lineHeight,
  '@media (min-width: 768px)': {
    fontSize: fontSize[desktop].size,
    lineHeight: fontSize[desktop].lineHeight,
  },
});

/**
 * Export all typography tokens
 */
export default typography;
