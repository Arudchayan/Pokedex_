import { useState, useEffect, RefObject } from 'react';

export interface UseIntersectionObserverOptions {
  /**
   * Root element for intersection. Defaults to viewport
   */
  root?: Element | null;

  /**
   * Margin around root. Can be similar to CSS margin property
   * e.g. "10px 20px 30px 40px"
   */
  rootMargin?: string;

  /**
   * Either a single number or an array of numbers between 0 and 1
   * indicating at what percentage of the target's visibility the observer's callback should execute
   */
  threshold?: number | number[];

  /**
   * If true, the observer will disconnect after first intersection
   * Useful for one-time lazy loading
   */
  freezeOnceVisible?: boolean;
}

/**
 * Hook for detecting when an element enters/exits the viewport
 * Perfect for lazy loading images, infinite scroll, and fade-in animations
 *
 * Handles SSR gracefully by returning false when IntersectionObserver is unavailable
 *
 * @param elementRef - Reference to the element to observe
 * @param options - Intersection observer options
 * @returns Object containing intersection state and entry
 *
 * @example
 * ```tsx
 * // Basic lazy loading
 * const PokemonImage = ({ src, alt }) => {
 *   const imgRef = useRef<HTMLImageElement>(null);
 *   const { isIntersecting } = useIntersectionObserver(imgRef, {
 *     threshold: 0.1,
 *     freezeOnceVisible: true
 *   });
 *
 *   return (
 *     <img
 *       ref={imgRef}
 *       src={isIntersecting ? src : undefined}
 *       alt={alt}
 *       loading="lazy"
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Fade in on scroll
 * const PokemonCard = ({ pokemon }) => {
 *   const cardRef = useRef<HTMLDivElement>(null);
 *   const { isIntersecting } = useIntersectionObserver(cardRef, {
 *     threshold: 0.5
 *   });
 *
 *   return (
 *     <div
 *       ref={cardRef}
 *       className={`transition-opacity ${isIntersecting ? 'opacity-100' : 'opacity-0'}`}
 *     >
 *       {pokemon.name}
 *     </div>
 *   );
 * };
 * ```
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  elementRef: RefObject<T>,
  options: UseIntersectionObserverOptions = {}
): {
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
} {
  const { root = null, rootMargin = '0px', threshold = 0, freezeOnceVisible = false } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const frozen = isIntersecting && freezeOnceVisible;

  useEffect(() => {
    const element = elementRef.current;

    // SSR safety: IntersectionObserver is not available on server
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return;
    }

    // Don't observe if element doesn't exist or we've frozen
    if (!element || frozen) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]: IntersectionObserverEntry[]) => {
        setEntry(entry);
        setIsIntersecting(entry.isIntersecting);
      },
      { root, rootMargin, threshold }
    );

    observer.observe(element);

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, [elementRef, root, rootMargin, threshold, frozen]);

  return { isIntersecting, entry };
}

/**
 * Simplified version that only returns the intersection boolean
 *
 * @example
 * ```tsx
 * const LazyLoadedSection = ({ children }) => {
 *   const ref = useRef<HTMLDivElement>(null);
 *   const isVisible = useIsVisible(ref);
 *
 *   return <div ref={ref}>{isVisible && children}</div>;
 * };
 * ```
 */
export function useIsVisible<T extends HTMLElement = HTMLElement>(
  elementRef: RefObject<T>,
  options?: UseIntersectionObserverOptions
): boolean {
  const { isIntersecting } = useIntersectionObserver(elementRef, options);
  return isIntersecting;
}
