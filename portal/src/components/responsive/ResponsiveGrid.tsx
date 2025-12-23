/**
 * ResponsiveGrid Component for Portal
 * Auto-adjusting grid columns based on screen size
 *
 * Requirements: 2.3 - Single-column layout on mobile
 */

import React, { useMemo } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import {
  getGridColumns,
  getResponsiveValue,
  ResponsiveValue,
  Breakpoint,
} from '../../utils/responsive';

export interface ResponsiveGridProps {
  children: React.ReactNode;

  /** Column configuration per breakpoint */
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };

  /** Gap configuration - number (px) or per-breakpoint */
  gap?: ResponsiveValue<number>;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: React.CSSProperties;

  /** Test ID for testing */
  testId?: string;
}

/**
 * Default column configuration
 */
const DEFAULT_COLS = {
  mobile: 1,
  tablet: 2,
  desktop: 4,
};

/**
 * Default gap values per breakpoint
 */
const DEFAULT_GAP = {
  mobile: 12,
  tablet: 16,
  desktop: 16,
};

/**
 * Map deviceType to Breakpoint
 */
function deviceTypeToBreakpoint(deviceType: string): Breakpoint {
  if (deviceType === 'mobile') return 'mobile';
  if (deviceType === 'tablet') return 'tablet';
  return 'desktop';
}

/**
 * ResponsiveGrid - A grid component that automatically adjusts columns based on screen size
 *
 * @example
 * // Basic usage - 1 col mobile, 2 col tablet, 4 col desktop
 * <ResponsiveGrid>
 *   <ProjectCard />
 *   <ProjectCard />
 *   <ProjectCard />
 *   <ProjectCard />
 * </ResponsiveGrid>
 *
 * @example
 * // Custom columns
 * <ResponsiveGrid cols={{ mobile: 2, tablet: 3, desktop: 6 }}>
 *   {items.map(item => <Card key={item.id} />)}
 * </ResponsiveGrid>
 */
export function ResponsiveGrid({
  children,
  cols = DEFAULT_COLS,
  gap = DEFAULT_GAP,
  className = '',
  style = {},
  testId,
}: ResponsiveGridProps) {
  const { deviceType, width } = useResponsive();
  const breakpoint = deviceTypeToBreakpoint(deviceType);

  // Calculate columns based on current width
  const columns = useMemo(
    () => getGridColumns(width, cols),
    [width, cols]
  );

  // Calculate gap based on breakpoint
  const gapValue = useMemo(
    () => getResponsiveValue(gap, breakpoint, DEFAULT_GAP[breakpoint]),
    [gap, breakpoint]
  );

  const gridStyle: React.CSSProperties = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: `${gapValue}px`,
      ...style,
    }),
    [columns, gapValue, style]
  );

  return (
    <div
      className={className}
      style={gridStyle}
      data-testid={testId}
      data-breakpoint={breakpoint}
      data-columns={columns}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveGridItem - Optional wrapper for grid items with consistent styling
 */
export interface ResponsiveGridItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Span multiple columns */
  colSpan?: ResponsiveValue<number>;
}

export function ResponsiveGridItem({
  children,
  className = '',
  style = {},
  colSpan,
}: ResponsiveGridItemProps) {
  const { deviceType } = useResponsive();
  const breakpoint = deviceTypeToBreakpoint(deviceType);

  const itemStyle: React.CSSProperties = useMemo(() => {
    const span = colSpan
      ? getResponsiveValue(colSpan, breakpoint, 1)
      : undefined;

    return {
      ...(span && span > 1 ? { gridColumn: `span ${span}` } : {}),
      ...style,
    };
  }, [colSpan, breakpoint, style]);

  return (
    <div className={className} style={itemStyle}>
      {children}
    </div>
  );
}

export default ResponsiveGrid;
