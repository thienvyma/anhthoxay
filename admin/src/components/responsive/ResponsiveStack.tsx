/**
 * ResponsiveStack Component
 * Flex container that changes direction based on screen size
 *
 * Requirements: 12.5
 */

import React, { useMemo } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import {
  getStackDirection,
  getResponsiveValue,
  ResponsiveValue,
  StackDirection,
} from '../../utils/responsive';

export interface ResponsiveStackProps {
  children: React.ReactNode;

  /** Direction per breakpoint */
  direction?: {
    mobile?: StackDirection;
    tablet?: StackDirection;
    desktop?: StackDirection;
  };

  /** Gap between items (px) or per-breakpoint */
  gap?: ResponsiveValue<number>;

  /** Align items (cross-axis) */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';

  /** Justify content (main-axis) */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

  /** Allow items to wrap */
  wrap?: boolean;

  /** Additional CSS class */
  className?: string;

  /** Additional inline styles */
  style?: React.CSSProperties;

  /** Test ID for testing */
  testId?: string;
}

/**
 * Default direction configuration
 */
const DEFAULT_DIRECTION = {
  mobile: 'column' as StackDirection,
  tablet: 'row' as StackDirection,
  desktop: 'row' as StackDirection,
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
 * Map align prop to CSS value
 */
const ALIGN_MAP: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

/**
 * Map justify prop to CSS value
 */
const JUSTIFY_MAP: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

/**
 * ResponsiveStack - A flex container that changes direction based on screen size
 *
 * @example
 * // Basic usage - column on mobile, row on tablet/desktop
 * <ResponsiveStack>
 *   <Button>Action 1</Button>
 *   <Button>Action 2</Button>
 * </ResponsiveStack>
 *
 * @example
 * // Custom direction
 * <ResponsiveStack direction={{ mobile: 'column', tablet: 'column', desktop: 'row' }}>
 *   <Card />
 *   <Card />
 * </ResponsiveStack>
 *
 * @example
 * // With alignment
 * <ResponsiveStack align="center" justify="between" gap={24}>
 *   <Logo />
 *   <Navigation />
 * </ResponsiveStack>
 */
export function ResponsiveStack({
  children,
  direction = DEFAULT_DIRECTION,
  gap = DEFAULT_GAP,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '',
  style = {},
  testId,
}: ResponsiveStackProps) {
  const { breakpoint } = useResponsive();

  // Calculate direction based on breakpoint
  const flexDirection = useMemo(
    () => getStackDirection(breakpoint, direction),
    [breakpoint, direction]
  );

  // Calculate gap based on breakpoint
  const gapValue = useMemo(
    () => getResponsiveValue(gap, breakpoint, DEFAULT_GAP[breakpoint]),
    [gap, breakpoint]
  );

  const stackStyle: React.CSSProperties = useMemo(
    () => ({
      display: 'flex',
      flexDirection,
      gap: `${gapValue}px`,
      alignItems: ALIGN_MAP[align] || align,
      justifyContent: JUSTIFY_MAP[justify] || justify,
      flexWrap: wrap ? 'wrap' : 'nowrap',
      ...style,
    }),
    [flexDirection, gapValue, align, justify, wrap, style]
  );

  return (
    <div
      className={className}
      style={stackStyle}
      data-testid={testId}
      data-breakpoint={breakpoint}
      data-direction={flexDirection}
    >
      {children}
    </div>
  );
}

/**
 * HStack - Horizontal stack (row direction on all breakpoints)
 */
export function HStack({
  children,
  gap,
  align = 'center',
  justify = 'start',
  wrap = false,
  className = '',
  style = {},
  testId,
}: Omit<ResponsiveStackProps, 'direction'>) {
  return (
    <ResponsiveStack
      direction={{ mobile: 'row', tablet: 'row', desktop: 'row' }}
      gap={gap}
      align={align}
      justify={justify}
      wrap={wrap}
      className={className}
      style={style}
      testId={testId}
    >
      {children}
    </ResponsiveStack>
  );
}

/**
 * VStack - Vertical stack (column direction on all breakpoints)
 */
export function VStack({
  children,
  gap,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '',
  style = {},
  testId,
}: Omit<ResponsiveStackProps, 'direction'>) {
  return (
    <ResponsiveStack
      direction={{ mobile: 'column', tablet: 'column', desktop: 'column' }}
      gap={gap}
      align={align}
      justify={justify}
      wrap={wrap}
      className={className}
      style={style}
      testId={testId}
    >
      {children}
    </ResponsiveStack>
  );
}

export default ResponsiveStack;
