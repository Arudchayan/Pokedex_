import { useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

/**
 * Custom hook for performance monitoring
 * Tracks component render times and reports performance metrics
 */
export const usePerformance = (componentName: string, enabled = false) => {
  const renderCount = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = startTime.current ? endTime - startTime.current : 0;

    if (renderTime > 0) {
      logger.debug(`[Performance] ${componentName}:`, {
        renderCount: renderCount.current,
        renderTime: `${renderTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
      });

      // In production, send to analytics
      // if (import.meta.env.PROD) {
      //   sendPerformanceMetric(componentName, renderTime);
      // }
    }

    startTime.current = performance.now();
  });
};

/**
 * Hook to measure component mount time
 */
export const useMountTime = (componentName: string, enabled = false) => {
  useEffect(() => {
    if (!enabled) return;

    const mountTime = performance.now();
    logger.debug(`[Mount] ${componentName} mounted at ${mountTime.toFixed(2)}ms`);

    return () => {
      const unmountTime = performance.now();
      const lifetime = unmountTime - mountTime;
      logger.debug(`[Unmount] ${componentName} lifetime: ${lifetime.toFixed(2)}ms`);
    };
  }, [componentName, enabled]);
};

/**
 * Hook to detect slow renders
 */
export const useSlowRenderDetection = (
  componentName: string,
  threshold = 16, // 16ms = 60fps
  enabled = false
) => {
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTime.current;

    if (renderTime > threshold) {
      logger.warn(
        `[Slow Render] ${componentName} took ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
      );

      // In production, send to analytics
      // if (import.meta.env.PROD) {
      //   reportSlowRender(componentName, renderTime);
      // }
    }

    lastRenderTime.current = currentTime;
  });
};

export default {
  usePerformance,
  useMountTime,
  useSlowRenderDetection,
};
