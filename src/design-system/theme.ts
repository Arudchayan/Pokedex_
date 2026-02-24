/**
 * Design System: Theme Management
 *
 * Utilities for managing theme switching and accessing design tokens
 * All visual tokens are in design-tokens.css - this file only handles logic
 */

export type Theme = 'light' | 'dark' | 'cyberpunk';
export type PokemonType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy';

export type RarityLevel = 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythical';

/**
 * Get current theme from HTML data attribute
 */
export const getCurrentTheme = (): Theme => {
  const theme = document.documentElement.getAttribute('data-theme') as Theme;
  return theme || 'light';
};

/**
 * Set theme on HTML element (triggers CSS variable cascade)
 */
export const setTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pokedex-theme', theme);
};

/**
 * Initialize theme from localStorage or system preference
 */
export const initTheme = (): void => {
  const savedTheme = localStorage.getItem('pokedex-theme') as Theme;

  if (savedTheme) {
    setTheme(savedTheme);
    return;
  }

  // Check system preference for dark mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');
};

/**
 * Toggle between light and dark themes
 */
export const toggleTheme = (): Theme => {
  const current = getCurrentTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
};

/**
 * Get Tailwind utility class for Pokemon type background
 */
export const getTypeBgClass = (type: string): string => {
  const normalizedType = type.toLowerCase();
  return `bg-type-${normalizedType}`;
};

/**
 * Get Tailwind utility class for Pokemon type text color
 */
export const getTypeTextClass = (type: string): string => {
  const normalizedType = type.toLowerCase();
  return `text-type-${normalizedType}`;
};

/**
 * Get Tailwind utility class for type gradient
 */
export const getTypeGradientClass = (type: string): string => {
  const normalizedType = type.toLowerCase();
  return `bg-gradient-type-${normalizedType}`;
};

/**
 * Validate if a string is a valid Pokemon type
 */
export const isValidPokemonType = (type: string): type is PokemonType => {
  const validTypes: PokemonType[] = [
    'normal',
    'fire',
    'water',
    'electric',
    'grass',
    'ice',
    'fighting',
    'poison',
    'ground',
    'flying',
    'psychic',
    'bug',
    'rock',
    'ghost',
    'dragon',
    'dark',
    'steel',
    'fairy',
  ];
  return validTypes.includes(type.toLowerCase() as PokemonType);
};

/**
 * Get safe type class with fallback to 'normal'
 */
export const getSafeTypeBgClass = (type: string | null | undefined): string => {
  if (!type) return 'bg-type-normal';
  const normalized = type.toLowerCase();
  return isValidPokemonType(normalized) ? `bg-type-${normalized}` : 'bg-type-normal';
};

/**
 * Get elevation shadow class
 */
export const getElevationClass = (level: 0 | 1 | 2 | 3 | 4 | 5): string => {
  return `shadow-elevation-${level}`;
};

/**
 * Get glow effect class for rarity
 */
export const getRarityGlowClass = (
  rarity: RarityLevel,
  size: 'sm' | 'md' | 'lg' = 'md'
): string => {
  return `glow-${rarity}-${size}`;
};

/**
 * Combine multiple shadow classes (for elevation + glow)
 */
export const combineShadowClasses = (...classes: string[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Design System Version
 */
export const VERSION = '2.0.0';

/**
 * Export all Pokemon types as a constant array
 */
export const POKEMON_TYPES: readonly PokemonType[] = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

/**
 * Export rarity levels
 */
export const RARITY_LEVELS: readonly RarityLevel[] = [
  'common',
  'uncommon',
  'rare',
  'legendary',
  'mythical',
] as const;
