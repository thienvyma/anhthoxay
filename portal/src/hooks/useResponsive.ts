/**
 * Responsive Design Hook
 * 
 * Provides responsive breakpoint detection and utilities
 * Requirements: 15.1, 15.5 - Responsive layout for mobile, tablet, desktop
 * 
 * Breakpoints:
 * - Mobile: < 640px
 * - Tablet: 640px - 1024px
 * - Desktop: > 1024px
 */

import { useState, useEffect, useCallback } from 'react';

// Breakpoint values matching Tailwind config
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
  largeDesktop: 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveState {
  /** Current window width */
  width: number;
  /** Current window height */
  height: number;
  /** Is mobile device (< 640px) */
  isMobile: boolean;
  /** Is tablet device (640px - 1024px) */
  isTablet: boolean;
  /** Is desktop device (> 1024px) */
  isDesktop: boolean;
  /** Is large desktop (> 1280px) */
  isLargeDesktop: boolean;
  /** Current device type */
  deviceType: DeviceType;
  /** Is touch device */
  isTouchDevice: boolean;
  /** Is portrait orientation */
  isPortrait: boolean;
  /** Is landscape orientation */
  isLandscape: boolean;
}

/**
 * Hook for responsive breakpoint detection
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => getResponsiveState());

  const handleResize = useCallback(() => {
    setState(getResponsiveState());
  }, []);

  useEffect(() => {
    // Initial check
    handleResize();

    // Add resize listener with debounce
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  return state;
}

/**
 * Get current responsive state
 */
function getResponsiveState(): ResponsiveState {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const height = typeof window !== 'undefined' ? window.innerHeight : 768;

  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;
  const isLargeDesktop = width >= BREAKPOINTS.desktop;

  const deviceType: DeviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const isPortrait = height > width;
  const isLandscape = width > height;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    deviceType,
    isTouchDevice,
    isPortrait,
    isLandscape,
  };
}

/**
 * Hook for media query matching
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Initial check
    setMatches(mediaQuery.matches);

    // Add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Predefined media query hooks
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
}

export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is IE-specific
        navigator.msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * Get responsive value based on current breakpoint
 */
export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}): T {
  const { isMobile, isTablet } = useResponsive();

  if (isMobile) return values.mobile;
  if (isTablet) return values.tablet ?? values.mobile;
  return values.desktop ?? values.tablet ?? values.mobile;
}

/**
 * Responsive grid columns helper
 */
export function useGridColumns(config?: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
}): number {
  const { mobile = 1, tablet = 2, desktop = 3 } = config || {};
  return useResponsiveValue({ mobile, tablet, desktop });
}

export default useResponsive;
