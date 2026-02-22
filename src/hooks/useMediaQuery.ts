import { useState, useEffect } from 'react';

/**
 * Hook for responsive design using media queries
 * SSR-safe: Returns false on server and updates after hydration
 * 
 * @param query - The media query string to match against
 * @returns Boolean indicating if the media query matches
 * 
 * @example
 * ```tsx
 * // Basic responsive layout
 * const PokemonGrid = () => {
 *   const isMobile = useMediaQuery('(max-width: 640px)');
 *   const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
 *   const isDesktop = useMediaQuery('(min-width: 1025px)');
 * 
 *   const columns = isMobile ? 1 : isTablet ? 2 : 4;
 * 
 *   return <Grid columns={columns}>...</Grid>;
 * };
 * ```
 * 
 * @example
 * ```tsx
 * // Show/hide based on screen size
 * const Sidebar = () => {
 *   const isLargeScreen = useMediaQuery('(min-width: 1024px)');
 * 
 *   if (!isLargeScreen) {
 *     return <BottomSheet>{content}</BottomSheet>;
 *   }
 * 
 *   return <aside className="fixed">{content}</aside>;
 * };
 * ```
 * 
 * @example
 * ```tsx
 * // Detect user preferences
 * const App = () => {
 *   const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 *   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 * 
 *   return (
 *     <div
 *       data-theme={prefersDark ? 'dark' : 'light'}
 *       data-motion={prefersReducedMotion ? 'reduced' : 'full'}
 *     >
 *       {children}
 *     </div>
 *   );
 * };
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false for SSR safety
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // SSR safety
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Handler for when the match status changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Legacy browsers (Safari < 14)
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

/**
 * Common breakpoint helpers based on Tailwind CSS defaults
 * 
 * @example
 * ```tsx
 * const ResponsiveNav = () => {
 *   const { isMobile, isTablet, isDesktop } = useBreakpoint();
 * 
 *   return (
 *     <nav>
 *       {isMobile && <HamburgerMenu />}
 *       {(isTablet || isDesktop) && <FullNav />}
 *     </nav>
 *   );
 * };
 * ```
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isSm = useMediaQuery('(min-width: 640px) and (max-width: 767px)');
  const isMd = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isLg = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isXl = useMediaQuery('(min-width: 1280px) and (max-width: 1535px)');
  const is2Xl = useMediaQuery('(min-width: 1536px)');
  
  const isTablet = isSm || isMd;
  const isDesktop = isLg || isXl || is2Xl;
  const isLargeScreen = isXl || is2Xl;

  return {
    // Individual breakpoints
    isMobile,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    
    // Grouped breakpoints
    isTablet,
    isDesktop,
    isLargeScreen,
    
    // Convenience flags
    isTouchDevice: isMobile || isTablet,
  };
}

/**
 * Detects user's system preferences
 * 
 * @example
 * ```tsx
 * const ThemeProvider = ({ children }) => {
 *   const { prefersDark, prefersReducedMotion, prefersHighContrast } = useSystemPreferences();
 *   const [theme, setTheme] = useLocalStorage('theme', prefersDark ? 'dark' : 'light');
 * 
 *   return (
 *     <ThemeContext.Provider
 *       value={{
 *         theme,
 *         setTheme,
 *         reduceMotion: prefersReducedMotion,
 *         highContrast: prefersHighContrast
 *       }}
 *     >
 *       {children}
 *     </ThemeContext.Provider>
 *   );
 * };
 * ```
 */
export function useSystemPreferences() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersLight = useMediaQuery('(prefers-color-scheme: light)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');
  const prefersReducedTransparency = useMediaQuery('(prefers-reduced-transparency: reduce)');

  return {
    prefersDark,
    prefersLight,
    prefersReducedMotion,
    prefersHighContrast,
    prefersReducedTransparency,
  };
}

/**
 * Hook to detect if device supports touch
 * 
 * @example
 * ```tsx
 * const InteractiveCard = () => {
 *   const isTouchDevice = useIsTouchDevice();
 * 
 *   return (
 *     <Card
 *       // Show touch-friendly targets on touch devices
 *       className={isTouchDevice ? 'min-h-[44px] min-w-[44px]' : ''}
 *     >
 *       {content}
 *     </Card>
 *   );
 * };
 * ```
 */
export function useIsTouchDevice(): boolean {
  const hasCoarsePointer = useMediaQuery('(pointer: coarse)');
  const hasTouchScreen = useMediaQuery('(hover: none) and (pointer: coarse)');
  
  return hasCoarsePointer || hasTouchScreen;
}

/**
 * Hook to detect current orientation
 * 
 * @example
 * ```tsx
 * const ImageGallery = () => {
 *   const isPortrait = useOrientation();
 * 
 *   return (
 *     <div className={isPortrait ? 'grid-cols-2' : 'grid-cols-4'}>
 *       {images.map(img => <Image key={img.id} {...img} />)}
 *     </div>
 *   );
 * };
 * ```
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
}
