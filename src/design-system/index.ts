/**
 * Design System Index
 * 
 * Central export point for all design tokens
 * Import from this file to access the complete design system
 * 
 * @example
 * ```typescript
 * import { colors, spacing, typography, elevation } from '@/design-system';
 * 
 * const styles = {
 *   color: colors.type.fire.bg,
 *   padding: spacing.lg,
 *   fontSize: typography.h1.fontSize,
 *   boxShadow: elevation[2],
 * };
 * ```
 */

import { colors as colorsTokens } from './colors';
import spacing from './spacing';
import typography from './typography';
import elevation from './elevation';

// Color tokens
export {
  colors,
  status,
  type,
  rarity,
  primary,
  neutral,
  getTypeColor,
  getRarityColor,
} from './colors';

// Spacing tokens
export {
  default as spacing,
  componentSpacing,
  container,
  radius,
  getSpacing,
} from './spacing';

// Typography tokens
export {
  default as typography,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textUtilities,
  responsiveText,
} from './typography';

// Elevation tokens
export {
  default as elevation,
  elevationDark,
  glow,
  innerShadow,
  elevationUtils,
  cyberShadow,
  combineShadows,
  elevationWithGlow,
} from './elevation';

/**
 * Design System Version
 */
export const VERSION = '1.0.0';

/**
 * Breakpoints for responsive design
 * Match Tailwind's default breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Z-index scale
 * Consistent layering system
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

/**
 * Animation durations
 * Consistent timing for transitions and animations
 */
export const duration = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '700ms',
} as const;

/**
 * Animation easings
 * Common easing functions
 */
export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * Complete design system object
 */
export const designSystem = {
  colors: colorsTokens,
  spacing,
  typography,
  elevation,
  breakpoints,
  zIndex,
  duration,
  easing,
  version: VERSION,
} as const;

export default designSystem;
