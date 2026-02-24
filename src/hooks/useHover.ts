import { useState, useEffect, RefObject, useRef } from 'react';

/**
 * Tracks hover state of an element
 *
 * Better than inline state because it handles cleanup automatically and
 * provides a cleaner API for hover interactions.
 *
 * @param elementRef - Reference to the element to track hover state
 * @returns Boolean indicating if the element is currently hovered
 *
 * @example
 * ```tsx
 * const PokemonCard = ({ pokemon }) => {
 *   const cardRef = useRef<HTMLDivElement>(null);
 *   const isHovered = useHover(cardRef);
 *
 *   return (
 *     <div ref={cardRef}>
 *       <h3>{pokemon.name}</h3>
 *       {isHovered && <QuickStats stats={pokemon.stats} />}
 *     </div>
 *   );
 * };
 * ```
 */
export function useHover<T extends HTMLElement = HTMLElement>(elementRef: RefObject<T>): boolean {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup to prevent memory leaks
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [elementRef]);

  return isHovered;
}

/**
 * Alternative hook that returns both the ref and hover state
 * Useful when you don't need to manage the ref separately
 *
 * @returns Tuple of [ref, isHovered]
 *
 * @example
 * ```tsx
 * const TypeBadge = ({ type }) => {
 *   const [ref, isHovered] = useHoverRef<HTMLDivElement>();
 *
 *   return (
 *     <div ref={ref} className={isHovered ? 'scale-105' : ''}>
 *       {type}
 *     </div>
 *   );
 * };
 * ```
 */
export function useHoverRef<T extends HTMLElement = HTMLElement>(): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const isHovered = useHover(ref);
  return [ref, isHovered];
}
