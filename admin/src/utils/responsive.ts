/**
 * Responsive Utility Functions
 * Centralized responsive system - utility functions for breakpoint-based values
 *
 * Requirements: 11.3, 12.1
 */

import { BREAKPOINTS, Breakpoint, getBreakpoint } from '../hooks/useResponsive';

// Re-export for convenience
export { BREAKPOINTS, getBreakpoint };
export type { Breakpoint };

/**
 * Responsive value type - can be a single value or per-breakpoint values
 */
export type ResponsiveValue<T> =
  | T
  | {
      mobile?: T;
      tablet?: T;
      desktop?: T;
    };

/**
 * Check if value is a responsive object
 */
function isResponsiveObject<T>(
  value: ResponsiveValue<T>
): value is { mobile?: T; tablet?: T; desktop?: T } {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('mobile' in value || 'tablet' in value || 'desktop' in value)
  );
}

/**
 * Get value for current breakpoint with fallback chain
 * Fallback order: current breakpoint → larger breakpoints → default
 *
 * Property 3: Responsive Value Resolution
 */
export function getResponsiveValue<T>(
  value: ResponsiveValue<T>,
  breakpoint: Breakpoint,
  defaultValue: T
): T {
  // If not a responsive object, return as-is
  if (!isResponsiveObject(value)) {
    return value;
  }

  // Try current breakpoint first
  if (breakpoint === 'mobile') {
    return value.mobile ?? value.tablet ?? value.desktop ?? defaultValue;
  }

  if (breakpoint === 'tablet') {
    return value.tablet ?? value.desktop ?? defaultValue;
  }

  // Desktop
  return value.desktop ?? defaultValue;
}

/**
 * Grid column configuration
 */
export interface GridColumnConfig {
  mobile?: number;
  tablet?: number;
  desktop?: number;
}

/**
 * Calculate grid columns based on width
 *
 * Property 2: Grid Column Calculation
 */
export function getGridColumns(
  width: number,
  config: GridColumnConfig
): number {
  const breakpoint = getBreakpoint(width);

  const defaults: Required<GridColumnConfig> = {
    mobile: 1,
    tablet: 2,
    desktop: 4,
  };

  if (breakpoint === 'mobile') {
    return config.mobile ?? defaults.mobile;
  }

  if (breakpoint === 'tablet') {
    return config.tablet ?? config.desktop ?? defaults.tablet;
  }

  return config.desktop ?? defaults.desktop;
}

/**
 * Spacing sizes
 */
export type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Spacing values per breakpoint (in pixels)
 */
const SPACING_SCALE: Record<Breakpoint, Record<SpacingSize, number>> = {
  mobile: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  tablet: {
    xs: 4,
    sm: 6,
    md: 12,
    lg: 18,
    xl: 24,
  },
  desktop: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
  },
};

/**
 * Get spacing value based on breakpoint
 *
 * Property 4: Spacing Scale Consistency
 */
export function getSpacing(breakpoint: Breakpoint, size: SpacingSize): number {
  return SPACING_SCALE[breakpoint][size];
}

/**
 * Font sizes
 */
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

/**
 * Font size values per breakpoint (in pixels)
 * Ensures minimum 14px for body text (sm) on all breakpoints
 */
const FONT_SIZE_SCALE: Record<Breakpoint, Record<FontSize, number>> = {
  mobile: {
    xs: 11,
    sm: 14, // Minimum 14px for body text
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
  },
  tablet: {
    xs: 12,
    sm: 14,
    md: 15,
    lg: 17,
    xl: 19,
    '2xl': 22,
    '3xl': 26,
  },
  desktop: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
};

/**
 * Get font size based on breakpoint
 *
 * Property 5: Font Size Scale Consistency
 */
export function getFontSize(breakpoint: Breakpoint, size: FontSize): number {
  return FONT_SIZE_SCALE[breakpoint][size];
}

/**
 * Touch target configuration
 */
export interface TouchTargetConfig {
  width?: number;
  height?: number;
}

/**
 * Minimum touch target size (44x44 pixels)
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Ensure touch target meets minimum size on mobile
 *
 * Property 6: Touch Target Minimum Size
 */
export function ensureTouchTarget(
  breakpoint: Breakpoint,
  config: TouchTargetConfig = {}
): { minWidth: number; minHeight: number } {
  if (breakpoint === 'mobile') {
    return {
      minWidth: Math.max(config.width ?? 0, MIN_TOUCH_TARGET),
      minHeight: Math.max(config.height ?? 0, MIN_TOUCH_TARGET),
    };
  }

  return {
    minWidth: config.width ?? 0,
    minHeight: config.height ?? 0,
  };
}

/**
 * Stack direction type
 */
export type StackDirection = 'row' | 'column';

/**
 * Stack direction configuration
 */
export interface StackDirectionConfig {
  mobile?: StackDirection;
  tablet?: StackDirection;
  desktop?: StackDirection;
}

/**
 * Get stack direction based on breakpoint
 *
 * Property 7: Stack Direction Resolution
 */
export function getStackDirection(
  breakpoint: Breakpoint,
  config: StackDirectionConfig
): StackDirection {
  const defaults: Required<StackDirectionConfig> = {
    mobile: 'column',
    tablet: 'row',
    desktop: 'row',
  };

  return getResponsiveValue(config, breakpoint, defaults[breakpoint]);
}

/**
 * Create responsive style object
 * Utility to generate inline styles based on breakpoint
 */
export function createResponsiveStyle<T extends Record<string, unknown>>(
  breakpoint: Breakpoint,
  styles: {
    mobile?: Partial<T>;
    tablet?: Partial<T>;
    desktop?: Partial<T>;
    base?: Partial<T>;
  }
): Partial<T> {
  const base = styles.base ?? {};

  if (breakpoint === 'mobile') {
    return { ...base, ...styles.mobile };
  }

  if (breakpoint === 'tablet') {
    return { ...base, ...styles.tablet };
  }

  return { ...base, ...styles.desktop };
}
