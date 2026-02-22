/**
 * Design System: Elevation Tokens
 * 
 * Shadow system for creating depth and hierarchy
 * Levels 0-4 for standard elevation, plus special glow effects
 * 
 * Usage:
 * - Level 0: Flush/flat elements
 * - Level 1: Slightly raised (cards on page)
 * - Level 2: Raised (hover states, dropdowns)
 * - Level 3: Floating (modals, tooltips)
 * - Level 4: Highest (alerts, notifications)
 * - Glow: Special effects (legendary Pokemon, focus states)
 */

/**
 * Shadow Layers
 * Multiple shadow layers create more realistic depth
 */
const shadowLayer = {
  /** Ambient shadow (soft, diffused) */
  ambient: (opacity: number) => `rgba(0, 0, 0, ${opacity})`,
  
  /** Direct shadow (sharper, from light source) */
  direct: (opacity: number) => `rgba(0, 0, 0, ${opacity})`,
  
  /** Colored glow (for accents) */
  glow: (r: number, g: number, b: number, opacity: number) => 
    `rgba(${r}, ${g}, ${b}, ${opacity})`,
} as const;

/**
 * Elevation Scale (0-4)
 * Based on Material Design elevation system
 */
export const elevation = {
  /** Level 0: No elevation, flat on surface */
  0: 'none',
  
  /** Level 1: Subtle elevation for cards */
  1: `0 1px 3px 0 ${shadowLayer.ambient(0.1)}, 0 1px 2px -1px ${shadowLayer.direct(0.1)}`,
  
  /** Level 2: Moderate elevation for hover states */
  2: `0 4px 6px -1px ${shadowLayer.ambient(0.1)}, 0 2px 4px -2px ${shadowLayer.direct(0.1)}`,
  
  /** Level 3: High elevation for floating elements */
  3: `0 10px 15px -3px ${shadowLayer.ambient(0.1)}, 0 4px 6px -4px ${shadowLayer.direct(0.1)}`,
  
  /** Level 4: Maximum elevation for overlays */
  4: `0 20px 25px -5px ${shadowLayer.ambient(0.1)}, 0 8px 10px -6px ${shadowLayer.direct(0.1)}`,
  
  /** Level 5: Dramatic elevation for modals */
  5: `0 25px 50px -12px ${shadowLayer.ambient(0.25)}`,
} as const;

/**
 * Dark Mode Elevations
 * Adjusted shadows for dark backgrounds
 */
export const elevationDark = {
  0: 'none',
  1: `0 1px 3px 0 ${shadowLayer.ambient(0.3)}, 0 1px 2px -1px ${shadowLayer.direct(0.3)}`,
  2: `0 4px 6px -1px ${shadowLayer.ambient(0.3)}, 0 2px 4px -2px ${shadowLayer.direct(0.3)}`,
  3: `0 10px 15px -3px ${shadowLayer.ambient(0.3)}, 0 4px 6px -4px ${shadowLayer.direct(0.3)}`,
  4: `0 20px 25px -5px ${shadowLayer.ambient(0.3)}, 0 8px 10px -6px ${shadowLayer.direct(0.3)}`,
  5: `0 25px 50px -12px ${shadowLayer.ambient(0.4)}`,
} as const;

/**
 * Glow Effects
 * Special colored shadows for emphasis and states
 */
export const glow = {
  /** Primary glow (cyan accent) */
  primary: {
    sm: `0 0 10px ${shadowLayer.glow(6, 182, 212, 0.3)}`,
    md: `0 0 20px ${shadowLayer.glow(6, 182, 212, 0.4)}`,
    lg: `0 0 30px ${shadowLayer.glow(6, 182, 212, 0.5)}`,
  },
  
  /** Success glow (green) */
  success: {
    sm: `0 0 10px ${shadowLayer.glow(5, 150, 105, 0.3)}`,
    md: `0 0 20px ${shadowLayer.glow(5, 150, 105, 0.4)}`,
    lg: `0 0 30px ${shadowLayer.glow(5, 150, 105, 0.5)}`,
  },
  
  /** Warning glow (amber) */
  warning: {
    sm: `0 0 10px ${shadowLayer.glow(217, 119, 6, 0.3)}`,
    md: `0 0 20px ${shadowLayer.glow(217, 119, 6, 0.4)}`,
    lg: `0 0 30px ${shadowLayer.glow(217, 119, 6, 0.5)}`,
  },
  
  /** Error glow (red) */
  error: {
    sm: `0 0 10px ${shadowLayer.glow(220, 38, 38, 0.3)}`,
    md: `0 0 20px ${shadowLayer.glow(220, 38, 38, 0.4)}`,
    lg: `0 0 30px ${shadowLayer.glow(220, 38, 38, 0.5)}`,
  },
  
  /** Legendary glow (gold) */
  legendary: {
    sm: `0 0 15px ${shadowLayer.glow(245, 158, 11, 0.4)}`,
    md: `0 0 25px ${shadowLayer.glow(245, 158, 11, 0.5)}`,
    lg: `0 0 40px ${shadowLayer.glow(245, 158, 11, 0.6)}`,
  },
  
  /** Mythical glow (pink) */
  mythical: {
    sm: `0 0 15px ${shadowLayer.glow(236, 72, 153, 0.4)}`,
    md: `0 0 25px ${shadowLayer.glow(236, 72, 153, 0.5)}`,
    lg: `0 0 40px ${shadowLayer.glow(236, 72, 153, 0.6)}`,
  },
  
  /** Shiny glow (rainbow sparkle) */
  shiny: `
    0 0 20px ${shadowLayer.glow(255, 215, 0, 0.5)},
    0 0 30px ${shadowLayer.glow(255, 105, 180, 0.3)},
    0 0 40px ${shadowLayer.glow(138, 43, 226, 0.2)}
  `,
} as const;

/**
 * Inner Shadows
 * Inset shadows for pressed states and input fields
 */
export const innerShadow = {
  sm: `inset 0 1px 2px 0 ${shadowLayer.ambient(0.05)}`,
  md: `inset 0 2px 4px 0 ${shadowLayer.ambient(0.06)}`,
  lg: `inset 0 4px 8px 0 ${shadowLayer.ambient(0.08)}`,
} as const;

/**
 * Elevation Utilities
 * Helper functions for dynamic elevation
 */
export const elevationUtils = {
  /**
   * Get elevation based on interaction state
   */
  interactive: {
    default: elevation[1],
    hover: elevation[2],
    active: innerShadow.md,
  },
  
  /**
   * Get elevation for card variants
   */
  card: {
    flat: elevation[0],
    elevated: elevation[1],
    floating: elevation[3],
  },
  
  /**
   * Get elevation for overlay elements
   */
  overlay: {
    dropdown: elevation[2],
    modal: elevation[4],
    tooltip: elevation[3],
    notification: elevation[5],
  },
} as const;

/**
 * Cyberpunk/Neon Shadow Effects
 * Special effects for cyberpunk theme mode
 */
export const cyberShadow = {
  /** Neon box glow */
  neon: `
    0 0 5px currentColor,
    0 0 10px currentColor,
    0 0 20px currentColor,
    0 0 40px currentColor
  `,
  
  /** Subtle cyber glow */
  subtle: `
    0 0 10px rgba(var(--color-primary-500), 0.3),
    0 4px 15px rgba(0, 0, 0, 0.3)
  `,
  
  /** Strong cyber emphasis */
  strong: `
    0 0 20px rgba(var(--color-primary-500), 0.5),
    0 0 40px rgba(var(--color-primary-500), 0.3),
    0 8px 25px rgba(0, 0, 0, 0.4)
  `,
} as const;

/**
 * Utility function to combine shadows
 */
export const combineShadows = (...shadows: string[]) => {
  return shadows.filter(s => s !== 'none').join(', ');
};

/**
 * Utility function to get elevation with glow
 */
export const elevationWithGlow = (
  level: keyof typeof elevation,
  glowType: keyof typeof glow,
  glowSize: 'sm' | 'md' | 'lg' = 'md'
) => {
  const baseElevation = elevation[level];
  const glowEffect = typeof glow[glowType] === 'string' 
    ? glow[glowType] 
    : glow[glowType][glowSize];
  
  return combineShadows(baseElevation, glowEffect as string);
};

/**
 * Export all elevation tokens
 */
export default elevation;
