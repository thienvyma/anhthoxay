/**
 * Responsive Components Library
 * Centralized exports for all responsive components and utilities
 *
 * Requirements: 11.6
 */

// Layout Components
export { ResponsivePageContainer } from './ResponsivePageContainer';
export type { ResponsivePageContainerProps } from './ResponsivePageContainer';

export { ResponsivePageHeader } from './ResponsivePageHeader';
export type { ResponsivePageHeaderProps } from './ResponsivePageHeader';

export { ResponsiveActionBar } from './ResponsiveActionBar';
export type { ResponsiveActionBarProps } from './ResponsiveActionBar';

// Grid & Stack
export { ResponsiveGrid, ResponsiveGridItem } from './ResponsiveGrid';
export type { ResponsiveGridProps, ResponsiveGridItemProps } from './ResponsiveGrid';

export { ResponsiveStack, HStack, VStack } from './ResponsiveStack';
export type { ResponsiveStackProps } from './ResponsiveStack';

// UI Components
export { ResponsiveModal } from './ResponsiveModal';
export type { ResponsiveModalProps } from './ResponsiveModal';

export { ResponsiveTabs } from './ResponsiveTabs';
export type { ResponsiveTabsProps, Tab } from './ResponsiveTabs';

export { ResponsiveTable } from './ResponsiveTable';
export type { ResponsiveTableProps, TableColumn } from './ResponsiveTable';

export { ResponsiveFilters } from './ResponsiveFilters';
export type { ResponsiveFiltersProps, FilterOption } from './ResponsiveFilters';

// Hook
export { useResponsive, getBreakpoint, BREAKPOINTS } from '../../hooks/useResponsive';
export type { ResponsiveState, Breakpoint } from '../../hooks/useResponsive';

// Utilities
export {
  getResponsiveValue,
  getGridColumns,
  getSpacing,
  getFontSize,
  ensureTouchTarget,
  getStackDirection,
  createResponsiveStyle,
  MIN_TOUCH_TARGET,
} from '../../utils/responsive';
export type {
  ResponsiveValue,
  GridColumnConfig,
  SpacingSize,
  FontSize,
  TouchTargetConfig,
  StackDirection,
  StackDirectionConfig,
} from '../../utils/responsive';

// Chart utilities
export {
  getChartConfig,
  reduceDataPoints,
  getChartColors,
  getChartTheme,
  formatAxisLabel,
  getChartContainerStyle,
} from '../../utils/chartConfig';
export type { ChartType, LegendPosition, ChartConfig } from '../../utils/chartConfig';
