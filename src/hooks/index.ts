/**
 * Custom React Hooks for Pokedex App
 *
 * This module provides a collection of reusable hooks for common patterns:
 * - UI state management (hover, intersection, click outside)
 * - Performance optimization (debounce, throttle)
 * - Responsive design (media queries, breakpoints)
 * - User input (keyboard shortcuts)
 * - Persistence (localStorage)
 * - Analytics and performance tracking
 *
 * All hooks are SSR-safe and handle cleanup properly to prevent memory leaks.
 */

// UI State Hooks
export { useClickOutside } from './useClickOutside';
export { useHover, useHoverRef } from './useHover';
export {
  useIntersectionObserver,
  useIsVisible,
  type UseIntersectionObserverOptions,
} from './useIntersectionObserver';

// Input Hooks
export {
  useKeyboardShortcut,
  useKeyboardShortcuts,
  type KeyboardShortcutOptions,
} from './useKeyboardShortcut';

// Performance Hooks
export { useDebounce, useDebouncedCallback, useThrottle } from './useDebounce';

// Responsive Design Hooks
export {
  useMediaQuery,
  useBreakpoint,
  useSystemPreferences,
  useIsTouchDevice,
  useOrientation,
} from './useMediaQuery';

// Persistence Hooks
export { useLocalStorage, useIsLocalStorageAvailable } from './useLocalStorage';

// Application-Specific Hooks
export { useModalState } from './useModalState';
export { usePerformance } from './usePerformance';
export { useTeamAnalytics } from './useTeamAnalytics';
