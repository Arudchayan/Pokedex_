import { useState, useEffect } from 'react';

/**
 * Debounces a value by delaying updates until after the specified delay
 * Useful for search inputs, resize handlers, and other high-frequency updates
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * // Search with debounce
 * const PokemonSearch = () => {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearch = useDebounce(searchTerm, 300);
 *
 *   // This expensive search only runs after user stops typing for 300ms
 *   const results = usePokemonSearch(debouncedSearch);
 *
 *   return (
 *     <div>
 *       <input
 *         value={searchTerm}
 *         onChange={(e) => setSearchTerm(e.target.value)}
 *         placeholder="Search Pokemon..."
 *       />
 *       <div>{results.length} results</div>
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // API call with debounce
 * const AutocompleteInput = () => {
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebounce(query, 500);
 *
 *   useEffect(() => {
 *     if (debouncedQuery) {
 *       fetchSuggestions(debouncedQuery);
 *     }
 *   }, [debouncedQuery]);
 *
 *   return <input onChange={(e) => setQuery(e.target.value)} />;
 * };
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: Cancel the timeout if value changes before delay expires
    // This is critical to prevent memory leaks and ensure proper debouncing
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run effect if value or delay changes

  return debouncedValue;
}

/**
 * Debounces a callback function instead of a value
 * Returns a memoized debounced function that delays invoking callback
 *
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns A debounced version of the callback
 *
 * @example
 * ```tsx
 * const FilterPanel = ({ onFilterChange }) => {
 *   // Debounce the expensive filter operation
 *   const debouncedFilter = useDebouncedCallback(
 *     (filters) => {
 *       onFilterChange(filters);
 *     },
 *     300
 *   );
 *
 *   return (
 *     <div>
 *       <input onChange={(e) => debouncedFilter({ name: e.target.value })} />
 *       <select onChange={(e) => debouncedFilter({ type: e.target.value })}>
 *         {types.map(type => <option key={type}>{type}</option>)}
 *       </select>
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Window resize handler
 * const ResponsiveGrid = () => {
 *   const [columns, setColumns] = useState(4);
 *
 *   const handleResize = useDebouncedCallback(() => {
 *     const width = window.innerWidth;
 *     if (width < 640) setColumns(1);
 *     else if (width < 768) setColumns(2);
 *     else if (width < 1024) setColumns(3);
 *     else setColumns(4);
 *   }, 150);
 *
 *   useEffect(() => {
 *     window.addEventListener('resize', handleResize);
 *     return () => window.removeEventListener('resize', handleResize);
 *   }, [handleResize]);
 *
 *   return <Grid columns={columns}>...</Grid>;
 * };
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}

/**
 * Throttles a value by limiting updates to once per specified interval
 * Unlike debounce, throttle guarantees the value updates at regular intervals
 *
 * @param value - The value to throttle
 * @param interval - The minimum interval between updates in milliseconds
 * @returns The throttled value
 *
 * @example
 * ```tsx
 * // Scroll position tracking
 * const ScrollIndicator = () => {
 *   const [scrollY, setScrollY] = useState(0);
 *   const throttledScrollY = useThrottle(scrollY, 100);
 *
 *   useEffect(() => {
 *     const handleScroll = () => setScrollY(window.scrollY);
 *     window.addEventListener('scroll', handleScroll);
 *     return () => window.removeEventListener('scroll', handleScroll);
 *   }, []);
 *
 *   return <ProgressBar progress={throttledScrollY} />;
 * };
 * ```
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated;

    if (timeSinceLastUpdate >= interval) {
      // Enough time has passed, update immediately
      setThrottledValue(value);
      setLastUpdated(now);
    } else {
      // Schedule update for the remaining time
      const timeoutId = setTimeout(() => {
        setThrottledValue(value);
        setLastUpdated(Date.now());
      }, interval - timeSinceLastUpdate);

      return () => clearTimeout(timeoutId);
    }
  }, [value, interval, lastUpdated]);

  return throttledValue;
}
