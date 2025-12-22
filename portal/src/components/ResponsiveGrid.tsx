/**
 * ResponsiveGrid Component
 * 
 * A responsive grid layout component that automatically adjusts columns
 * based on screen size.
 * 
 * Requirements: 15.1, 15.5 - Responsive layout for mobile, tablet, desktop
 * 
 * Breakpoints:
 * - Mobile (< 640px): 1 column
 * - Tablet (640px - 1024px): 2 columns
 * - Desktop (> 1024px): 3 columns
 * - Large Desktop (> 1280px): 4 columns
 */

import { type ReactNode, type CSSProperties } from 'react';
import { useResponsive } from '../hooks/useResponsive';

export interface ResponsiveGridProps {
  children: ReactNode;
  /** Number of columns on mobile (default: 1) */
  mobileColumns?: number;
  /** Number of columns on tablet (default: 2) */
  tabletColumns?: number;
  /** Number of columns on desktop (default: 3) */
  desktopColumns?: number;
  /** Number of columns on large desktop (default: 4) */
  largeDesktopColumns?: number;
  /** Gap between items in pixels (default: responsive) */
  gap?: number | { mobile?: number; tablet?: number; desktop?: number };
  /** Additional className */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
  /** Minimum item width for auto-fit (overrides column settings) */
  minItemWidth?: number;
}

export function ResponsiveGrid({
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  largeDesktopColumns = 4,
  gap,
  className = '',
  style,
  minItemWidth,
}: ResponsiveGridProps) {
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useResponsive();

  // Calculate current columns based on breakpoint
  const getColumns = (): number => {
    if (isMobile) return mobileColumns;
    if (isTablet) return tabletColumns;
    if (isLargeDesktop) return largeDesktopColumns;
    if (isDesktop) return desktopColumns;
    return desktopColumns;
  };

  // Calculate gap based on breakpoint
  const getGap = (): number => {
    if (typeof gap === 'number') return gap;
    if (gap) {
      if (isMobile) return gap.mobile ?? 12;
      if (isTablet) return gap.tablet ?? 16;
      return gap.desktop ?? 20;
    }
    // Default responsive gaps
    if (isMobile) return 12;
    if (isTablet) return 16;
    return 20;
  };

  const columns = getColumns();
  const currentGap = getGap();

  // Use auto-fit with minItemWidth if provided
  const gridTemplateColumns = minItemWidth
    ? `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`
    : `repeat(${columns}, 1fr)`;

  return (
    <div
      className={`responsive-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns,
        gap: currentGap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveStack Component
 * 
 * A responsive flex container that stacks vertically on mobile
 * and horizontally on larger screens.
 */
export interface ResponsiveStackProps {
  children: ReactNode;
  /** Direction on mobile (default: column) */
  mobileDirection?: 'row' | 'column';
  /** Direction on tablet and up (default: row) */
  desktopDirection?: 'row' | 'column';
  /** Gap between items */
  gap?: number | { mobile?: number; tablet?: number; desktop?: number };
  /** Alignment */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justify content */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Wrap items */
  wrap?: boolean;
  /** Additional className */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

export function ResponsiveStack({
  children,
  mobileDirection = 'column',
  desktopDirection = 'row',
  gap,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '',
  style,
}: ResponsiveStackProps) {
  const { isMobile } = useResponsive();

  // Calculate gap based on breakpoint
  const getGap = (): number => {
    if (typeof gap === 'number') return gap;
    if (gap) {
      if (isMobile) return gap.mobile ?? 12;
      return gap.desktop ?? 16;
    }
    return isMobile ? 12 : 16;
  };

  const direction = isMobile ? mobileDirection : desktopDirection;
  const currentGap = getGap();

  const alignItems = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
  }[align];

  const justifyContent = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
  }[justify];

  return (
    <div
      className={`responsive-stack ${className}`}
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: currentGap,
        alignItems,
        justifyContent,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveContainer Component
 * 
 * A responsive container with max-width constraints
 */
export interface ResponsiveContainerProps {
  children: ReactNode;
  /** Max width on different breakpoints */
  maxWidth?: {
    mobile?: number | string;
    tablet?: number | string;
    desktop?: number | string;
  };
  /** Padding on different breakpoints */
  padding?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  /** Center the container */
  centered?: boolean;
  /** Additional className */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

export function ResponsiveContainer({
  children,
  maxWidth,
  padding,
  centered = true,
  className = '',
  style,
}: ResponsiveContainerProps) {
  const { isMobile, isTablet } = useResponsive();

  const getMaxWidth = (): string | number => {
    if (!maxWidth) return '100%';
    if (isMobile) return maxWidth.mobile ?? '100%';
    if (isTablet) return maxWidth.tablet ?? maxWidth.desktop ?? '100%';
    return maxWidth.desktop ?? '100%';
  };

  const getPadding = (): number => {
    if (!padding) {
      if (isMobile) return 12;
      if (isTablet) return 16;
      return 24;
    }
    if (isMobile) return padding.mobile ?? 12;
    if (isTablet) return padding.tablet ?? 16;
    return padding.desktop ?? 24;
  };

  return (
    <div
      className={`responsive-container ${className}`}
      style={{
        width: '100%',
        maxWidth: getMaxWidth(),
        padding: `0 ${getPadding()}px`,
        margin: centered ? '0 auto' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default ResponsiveGrid;
