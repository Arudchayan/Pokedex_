import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * Synchronizes state with localStorage
 * Automatically handles JSON serialization/deserialization
 * SSR-safe: Falls back to initial value when localStorage is unavailable
 *
 * @param key - The localStorage key to use
 * @param initialValue - Default value if no stored value exists
 * @returns Tuple of [value, setValue, remove] similar to useState
 *
 * @example
 * ```tsx
 * // Store user preferences
 * const UserSettings = () => {
 *   const [theme, setTheme] = useLocalStorage('theme', 'dark');
 *   const [gridDensity, setGridDensity] = useLocalStorage('grid-density', 'comfortable');
 *
 *   return (
 *     <div>
 *       <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *         Toggle Theme
 *       </button>
 *       <select value={gridDensity} onChange={(e) => setGridDensity(e.target.value)}>
 *         <option value="compact">Compact</option>
 *         <option value="comfortable">Comfortable</option>
 *         <option value="spacious">Spacious</option>
 *       </select>
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Store complex objects
 * interface TeamConfig {
 *   name: string;
 *   members: Pokemon[];
 *   tags: string[];
 * }
 *
 * const TeamBuilder = () => {
 *   const [savedTeams, setSavedTeams, removeTeams] = useLocalStorage<TeamConfig[]>(
 *     'saved-teams',
 *     []
 *   );
 *
 *   const addTeam = (team: TeamConfig) => {
 *     setSavedTeams(prev => [...prev, team]);
 *   };
 *
 *   const clearAll = () => {
 *     removeTeams(); // Removes from localStorage
 *   };
 *
 *   return <div>...</div>;
 * };
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>, () => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    // SSR safety
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // SSR safety
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));

          // Dispatch custom event so other tabs/windows can sync
          window.dispatchEvent(
            new CustomEvent('local-storage-change', {
              detail: { key, value: valueToStore },
            })
          );
        }
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove value from localStorage
  const remove = useCallback(() => {
    try {
      setStoredValue(initialValue);

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);

        window.dispatchEvent(
          new CustomEvent('local-storage-change', {
            detail: { key, value: undefined },
          })
        );
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync state across tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('key' in e) {
        // Native storage event (from other tabs)
        if (e.key === key && e.newValue !== null) {
          try {
            setStoredValue(JSON.parse(e.newValue));
          } catch (error) {
            console.warn(`Error parsing storage event for key "${key}":`, error);
          }
        }
      } else if ('detail' in e) {
        // Custom event (from same tab)
        const detail = e.detail as { key: string; value: T };
        if (detail.key === key) {
          setStoredValue(detail.value ?? initialValue);
        }
      }
    };

    // Listen to changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange as EventListener);

    // Listen to changes from same tab (our custom event)
    window.addEventListener('local-storage-change', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('local-storage-change', handleStorageChange as EventListener);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, remove];
}

/**
 * Hook to check if localStorage is available
 * Useful for showing warnings or fallback UI
 *
 * @example
 * ```tsx
 * const DataManagement = () => {
 *   const isAvailable = useIsLocalStorageAvailable();
 *
 *   if (!isAvailable) {
 *     return <Warning>localStorage is not available. Data will not persist.</Warning>;
 *   }
 *
 *   return <div>...</div>;
 * };
 * ```
 */
export function useIsLocalStorageAvailable(): boolean {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    try {
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      setIsAvailable(true);
    } catch {
      setIsAvailable(false);
    }
  }, []);

  return isAvailable;
}
