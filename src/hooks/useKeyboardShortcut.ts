import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcutOptions {
  /**
   * If true, shortcut only triggers when Ctrl (Windows/Linux) or Cmd (Mac) is pressed
   */
  ctrl?: boolean;

  /**
   * If true, shortcut only triggers when Shift is pressed
   */
  shift?: boolean;

  /**
   * If true, shortcut only triggers when Alt/Option is pressed
   */
  alt?: boolean;

  /**
   * If true, the default browser action for this key will be prevented
   * @default true
   */
  preventDefault?: boolean;

  /**
   * If true, the event will not propagate to parent elements
   * @default false
   */
  stopPropagation?: boolean;

  /**
   * If false, the shortcut will be disabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Event type to listen for
   * @default 'keydown'
   */
  eventType?: 'keydown' | 'keyup' | 'keypress';
}

/**
 * Registers keyboard shortcuts with modifier key support
 * Automatically handles cleanup and prevents memory leaks
 *
 * SSR-safe: Does nothing when window is undefined
 *
 * @param key - The key to listen for (e.g., 'k', 'Enter', 'Escape', '/')
 * @param callback - Function to call when the shortcut is triggered
 * @param options - Configuration options for the shortcut
 *
 * @example
 * ```tsx
 * // Search shortcut: Ctrl+K or Cmd+K
 * const SearchBar = () => {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   useKeyboardShortcut('k', () => setIsOpen(true), {
 *     ctrl: true,
 *     preventDefault: true
 *   });
 *
 *   useKeyboardShortcut('Escape', () => setIsOpen(false), {
 *     enabled: isOpen
 *   });
 *
 *   return isOpen && <SearchModal onClose={() => setIsOpen(false)} />;
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Navigation shortcuts
 * const PokemonGrid = () => {
 *   useKeyboardShortcut('ArrowLeft', () => goToPrevious());
 *   useKeyboardShortcut('ArrowRight', () => goToNext());
 *   useKeyboardShortcut('/', () => focusSearch(), {
 *     preventDefault: true
 *   });
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Quick actions with multiple modifiers
 * const TeamBuilder = () => {
 *   useKeyboardShortcut('s', () => saveTeam(), {
 *     ctrl: true,
 *     preventDefault: true
 *   });
 *
 *   useKeyboardShortcut('Delete', () => clearTeam(), {
 *     shift: true,
 *     preventDefault: true
 *   });
 * };
 * ```
 */
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    ctrl = false,
    shift = false,
    alt = false,
    preventDefault = true,
    stopPropagation = false,
    enabled = true,
    eventType = 'keydown',
  } = options;

  // Use ref to avoid recreating the handler on every render
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handler = useCallback(
    (event: KeyboardEvent) => {
      // Check if the key matches (case-insensitive)
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();

      // Check modifiers - use metaKey for Cmd on Mac, ctrlKey for Ctrl on Windows/Linux
      const ctrlPressed = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftPressed = shift ? event.shiftKey : !event.shiftKey;
      const altPressed = alt ? event.altKey : !event.altKey;

      // Only trigger if all conditions are met
      if (keyMatches && ctrlPressed && shiftPressed && altPressed) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        callbackRef.current(event);
      }
    },
    [key, ctrl, shift, alt, preventDefault, stopPropagation]
  );

  useEffect(() => {
    // SSR safety
    if (typeof window === 'undefined') {
      return;
    }

    if (!enabled) {
      return;
    }

    window.addEventListener(eventType, handler);

    // Cleanup to prevent memory leaks
    return () => {
      window.removeEventListener(eventType, handler);
    };
  }, [handler, enabled, eventType]);
}

/**
 * Hook for registering multiple keyboard shortcuts at once
 *
 * **BUG FIX #1:** Refactored to avoid calling hooks in loops.
 * Instead of calling useKeyboardShortcut in a forEach, we use a single effect
 * that handles all shortcuts, preventing React Rules of Hooks violations.
 *
 * @example
 * ```tsx
 * const PokemonDetail = () => {
 *   useKeyboardShortcuts({
 *     'Escape': () => closeModal(),
 *     'ArrowLeft': () => previousPokemon(),
 *     'ArrowRight': () => nextPokemon(),
 *     'f': { handler: () => toggleFavorite(), ctrl: true },
 *     'a': { handler: () => addToTeam(), ctrl: true }
 *   });
 *
 *   return <div>...</div>;
 * };
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: Record<
    string,
    | ((event: KeyboardEvent) => void)
    | { handler: (event: KeyboardEvent) => void; options?: KeyboardShortcutOptions }
  >
): void {
  type ShortcutConfig =
    | ((event: KeyboardEvent) => void)
    | { handler: (event: KeyboardEvent) => void; options?: KeyboardShortcutOptions };

  // Store callbacks in ref to avoid recreating handler on every render
  const callbacksRef = useRef(shortcuts);

  useEffect(() => {
    callbacksRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    // SSR safety
    if (typeof window === 'undefined') {
      return;
    }

    // Create a unified handler for all shortcuts
    const handler = (event: KeyboardEvent) => {
      const shortcuts = callbacksRef.current;

      // Check each shortcut configuration
      (Object.entries(shortcuts) as Array<[string, ShortcutConfig]>).forEach(([key, config]) => {
        const isFunction = typeof config === 'function';
        const callback = isFunction ? config : config.handler;
        const options = isFunction ? {} : config.options || {};

        const {
          ctrl = false,
          shift = false,
          alt = false,
          preventDefault = true,
          stopPropagation = false,
        } = options;

        // Check if the key matches (case-insensitive)
        const keyMatches = event.key.toLowerCase() === key.toLowerCase();

        // Check modifiers - use metaKey for Cmd on Mac, ctrlKey for Ctrl on Windows/Linux
        // BUG FIX #4: When modifier is false, ignore it (don't negate it)
        const ctrlPressed = ctrl ? event.ctrlKey || event.metaKey : true;
        const shiftPressed = shift ? event.shiftKey : true;
        const altPressed = alt ? event.altKey : true;

        // Only trigger if all conditions are met
        if (keyMatches && ctrlPressed && shiftPressed && altPressed) {
          if (preventDefault) {
            event.preventDefault();
          }
          if (stopPropagation) {
            event.stopPropagation();
          }
          callback(event);
        }
      });
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, []); // Empty deps - callbacks are accessed via ref
}
