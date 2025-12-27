/**
 * useResponsive Hook
 * Centralized responsive system - screen size detection
 *
 * Requirements: 11.3
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Breakpoint thresholds (matching CSS variables)
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveState {
  // Current breakpoint
  breakpoint: Breakpoint;

  // Screen dimensions
  width: number;
  height: number;

  // Convenience booleans
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Comparison helpers
  isAtLeast: (breakpoint: Breakpoint) => boolean;
  isAtMost: (breakpoint: Breakpoint) => boolean;
}

// Breakpoint order for comparison
const BREAKPOINT_ORDER: Record<Breakpoint, number> = {
  mobile: 0,
  tablet: 1,
  desktop: 2,
};

/**
 * Get breakpoint from width
 */
export function getBreakpoint(width: number): Breakpoint {
  if (width <= BREAKPOINTS.mobile) return 'mobile';
  if (width <= BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

/**
 * Debounce function for resize events
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Get initial dimensions (SSR-safe)
 */
function getInitialDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    // SSR: default to desktop
    return { width: BREAKPOINTS.desktop + 1, height: 800 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * useResponsive Hook
 * Returns current breakpoint and screen dimensions with helper functions
 */
export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState(getInitialDimensions);

  // Debounced resize handler - only update if dimensions actually changed
  const handleResize = useCallback(() => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    setDimensions((prev) => {
      // Only update if dimensions actually changed to prevent unnecessary re-renders
      if (prev.width === newWidth && prev.height === newHeight) {
        return prev;
      }
      return { width: newWidth, height: newHeight };
    });
  }, []);

  useEffect(() => {
    // Create debounced handler
    const debouncedResize = debounce(handleResize, 100);

    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [handleResize]);

  // Calculate breakpoint
  const breakpoint = useMemo(
    () => getBreakpoint(dimensions.width),
    [dimensions.width]
  );

  // Comparison helpers
  const isAtLeast = useCallback(
    (bp: Breakpoint): boolean => {
      return BREAKPOINT_ORDER[breakpoint] >= BREAKPOINT_ORDER[bp];
    },
    [breakpoint]
  );

  const isAtMost = useCallback(
    (bp: Breakpoint): boolean => {
      return BREAKPOINT_ORDER[breakpoint] <= BREAKPOINT_ORDER[bp];
    },
    [breakpoint]
  );

  return {
    breakpoint,
    width: dimensions.width,
    height: dimensions.height,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isAtLeast,
    isAtMost,
  };
}

export default useResponsive;
