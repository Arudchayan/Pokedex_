import { useEffect, useRef, useState, useCallback } from 'react';
import { usePokemonStore } from '../../store/usePokemonStore';

interface SpotlightOverlayProps {
  targetSelector: string;
  isActive: boolean;
  onClickOutside?: () => void;
  padding?: number;
  borderRadius?: number;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function SpotlightOverlay({
  targetSelector,
  isActive,
  onClickOutside,
  padding = 8,
  borderRadius = 8,
}: SpotlightOverlayProps) {
  const theme = usePokemonStore((s) => s.theme);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);
  const isDark = theme === 'dark';

  const updateRect = useCallback(() => {
    if (!isActive) return;

    const element = document.querySelector(targetSelector);
    if (!element) {
      setTargetRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setTargetRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }, [targetSelector, isActive, padding]);

  useEffect(() => {
    if (!isActive) {
      setTargetRect(null);
      return;
    }

    // Initial rect calculation
    updateRect();

    // Setup resize and scroll listeners
    const handleResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateRect);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    // Watch for DOM mutations that might affect target position
    const observer = new MutationObserver(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateRect);
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, updateRect]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClickOutside) {
      onClickOutside();
    }
  };

  if (!isActive || !targetRect) return null;

  const spotlightStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'auto',
    zIndex: 9998,
  };

  // Create SVG path for the spotlight hole
  const path = `
    M 0 0
    L ${window.innerWidth} 0
    L ${window.innerWidth} ${window.innerHeight}
    L 0 ${window.innerHeight}
    Z
    M ${targetRect.left + borderRadius} ${targetRect.top}
    L ${targetRect.left + targetRect.width - borderRadius} ${targetRect.top}
    Q ${targetRect.left + targetRect.width} ${targetRect.top} ${targetRect.left + targetRect.width} ${targetRect.top + borderRadius}
    L ${targetRect.left + targetRect.width} ${targetRect.top + targetRect.height - borderRadius}
    Q ${targetRect.left + targetRect.width} ${targetRect.top + targetRect.height} ${targetRect.left + targetRect.width - borderRadius} ${targetRect.top + targetRect.height}
    L ${targetRect.left + borderRadius} ${targetRect.top + targetRect.height}
    Q ${targetRect.left} ${targetRect.top + targetRect.height} ${targetRect.left} ${targetRect.top + targetRect.height - borderRadius}
    L ${targetRect.left} ${targetRect.top + borderRadius}
    Q ${targetRect.left} ${targetRect.top} ${targetRect.left + borderRadius} ${targetRect.top}
    Z
  `;

  return (
    <div style={spotlightStyle} onClick={handleOverlayClick} role="presentation" aria-hidden="true">
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <path d={path} fill="black" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)'}
          mask="url(#spotlight-mask)"
        />
      </svg>
      {/* Border around spotlight */}
      <div
        style={{
          position: 'absolute',
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
          borderRadius,
          border: `2px solid ${isDark ? '#3b82f6' : '#2563eb'}`,
          boxShadow: `0 0 20px ${isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(37, 99, 235, 0.5)'}`,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
    </div>
  );
}
