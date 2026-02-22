/**
 * Design System: Color Tokens
 * 
 * Comprehensive color palette for the Pokedex app including:
 * - Status/semantic colors (success, warning, error, info)
 * - Pokemon type colors (all 18 types with proper contrast)
 * - Rarity indicators (common → mythical)
 * - Theme-agnostic tokens that work in both light and dark modes
 */

/**
 * Semantic Status Colors
 * Used for success states, warnings, errors, and informational messages
 */
export const status = {
  success: {
    light: '#10b981',
    DEFAULT: '#059669',
    dark: '#047857',
  },
  warning: {
    light: '#f59e0b',
    DEFAULT: '#d97706',
    dark: '#b45309',
  },
  error: {
    light: '#ef4444',
    DEFAULT: '#dc2626',
    dark: '#b91c1c',
  },
  info: {
    light: '#3b82f6',
    DEFAULT: '#2563eb',
    dark: '#1d4ed8',
  },
} as const;

/**
 * Pokemon Type Colors
 * All 18 Pokemon types with background and text colors for proper contrast
 * Text color is either white (#ffffff) or dark (#1f2937) based on WCAG AA compliance
 */
export const type = {
  normal: {
    bg: '#A8A878',
    text: '#1f2937',
    gradient: 'linear-gradient(135deg, #A8A878 0%, #C6C6A7 100%)',
  },
  fire: {
    bg: '#F08030',
    text: '#ffffff',
    gradient: 'linear-gradient(135deg, #F08030 0%, #F5AC78 100%)',
  },
  water: {
    bg: '#6890F0',
    text: '#ffffff',
    gradient: 'linear-gradient(135deg, #6890F0 0%, #9DB7F5 100%)',
  },
  electric: {
    bg: '#F8D030',
    text: '#1f2937',
    gradient: 'linear-gradient(135deg, #F8D030 0%, #FAE078 100%)',
  },
  grass: {
    bg: '#78C850',
    text: '#ffffff',
    gradient: 'linear-gradient(135deg, #78C850 0%, #A7DB8D 100%)',
  },
  ice: {
    bg: '#98D8D8',
    text: '#1f2937',
    gradient: 'linear-gradient(135deg, #98D8D8 0%, #BCE6E6 100%)',
  },
  fighting: {
    bg: '#C03028',
    text: '#ffffff',
    gradient: 'linear-gradient(135deg, #C03028 0%, #D67873 100%)',
  },
  poison: {
    bg: '#A040A0',
    text: '#ffffff',
    gradient: 'linear-gradient(135deg, #A040A0 0%, #C183C1 100%)',
  },
  ground: {
    bg: '#E0C068',
    text: '#1f2937',
    gradient: 'linear-gradient(135deg, #E0C068 0%, #EBD69D 100%)',
  },
  flying: {
    bg: '#A890F0',
    text: '#ffffff',
    gradient: 'linear-gradient(135deg, #A890F0 0%, #C6B7F5 100%)',
  },
  psychic: {
    bg: '#F85888',
    text: '#ffffff',
    gradient: 'linear-gradient(135deg, #F85888 0%, #FA92B2 100%)',
  },
  bug: {
    bg: '#A8B820',
    text: '#1f2937',
    gradient: 'linear-gradient(135deg, #A8B820 0%, #C6D16E 100%)',
  },
  rock: {
    bg: '#B8A038',
    text: '#ffffff',
    gradient: 'linear-gradient(135deg, #B8A038 0%, #D1C17D 100%)',
  },
  ghost: {
    bg: '#705898',
    text: '#ffffff',
    gradient: 'linear-gradient(135deg, #705898 0%, #A292BC 100%)',
  },
  dragon: {
    bg: '#7038F8',
    text: '#ffffff',
    gradient: 'linear-gradient(135deg, #7038F8 0%, #A27DFA 100%)',
  },
  dark: {
    bg: '#705848',
    text: '#ffffff',
    gradient: 'linear-gradient(135deg, #705848 0%, #A29288 100%)',
  },
  steel: {
    bg: '#B8B8D0',
    text: '#1f2937',
    gradient: 'linear-gradient(135deg, #B8B8D0 0%, #D1D1E0 100%)',
  },
  fairy: {
    bg: '#EE99AC',
    text: '#1f2937',
    gradient: 'linear-gradient(135deg, #EE99AC 0%, #F4BDC9 100%)',
  },
} as const;

/**
 * Rarity Indicators
 * Colors used to indicate Pokemon rarity/legendary status
 */
export const rarity = {
  common: {
    color: '#9ca3af',
    glow: 'rgba(156, 163, 175, 0.3)',
  },
  uncommon: {
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  rare: {
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.3)',
  },
  legendary: {
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  mythical: {
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.4)',
  },
} as const;

/**
 * Primary/Accent Colors
 * Default cyan accent palette with RGB values for CSS variable usage
 */
export const primary = {
  300: { rgb: '103, 232, 249', hex: '#67e8f9' },
  400: { rgb: '34, 211, 238', hex: '#22d3ee' },
  500: { rgb: '6, 182, 212', hex: '#06b6d4' },
  600: { rgb: '8, 145, 178', hex: '#0891b2' },
} as const;

/**
 * Neutral Colors
 * Grayscale palette for backgrounds, borders, and text
 */
export const neutral = {
  white: '#ffffff',
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
} as const;

/**
 * Utility function to get type color by name
 */
export const getTypeColor = (typeName: string) => {
  const normalizedType = typeName.toLowerCase() as keyof typeof type;
  return type[normalizedType] || type.normal;
};

/**
 * Utility function to get rarity color
 */
export const getRarityColor = (rarityLevel: keyof typeof rarity) => {
  return rarity[rarityLevel] || rarity.common;
};

/**
 * Export all color tokens
 */
export const colors = {
  status,
  type,
  rarity,
  primary,
  neutral,
} as const;

export default colors;
