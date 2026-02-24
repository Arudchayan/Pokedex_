import { useState, useEffect, useRef, useCallback } from 'react';
import { get, set } from 'idb-keyval';

/**
 * A hook to persist state to IndexedDB using idb-keyval.
 * mimics useState but persists the value.
 *
 * @param key The key to store the data under in IndexedDB
 * @param initialValue The initial value if no data is found
 * @returns [value, setValue, isLoaded]
 */
export function usePersistence<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasUserModified = useRef(false);

  // Load from IDB on mount
  useEffect(() => {
    let mounted = true;
    get(key)
      .then((val) => {
        if (mounted) {
          // Only update if the user hasn't modified the value while loading
          if (!hasUserModified.current && val !== undefined) {
            setStoredValue(val);
          }
          setIsLoaded(true);
        }
      })
      .catch((err) => {
        console.error(`Error loading key "${key}" from IDB:`, err);
        if (mounted) setIsLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [key]);

  // Save to IDB on change
  useEffect(() => {
    // Only save if loaded to prevent overwriting with initial value
    // OR if user explicitly modified it (in which case we trust the new value)
    if (isLoaded || hasUserModified.current) {
      set(key, storedValue).catch((err) => console.error(`Error saving key "${key}" to IDB:`, err));
    }
  }, [key, storedValue, isLoaded]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    hasUserModified.current = true;
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      return valueToStore;
    });
  }, []);

  return [storedValue, setValue, isLoaded] as const;
}
