/**
 * Responsive Components Library for Portal
 * Centralized exports for all responsive components and utilities
 *
 * Requirements: 6.1 - Centralized exports from single index file
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

// Hook - Re-export from hooks
export {
  useResponsive,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice,
  useResponsiveValue,
  useGridColumns,
  BREAKPOINTS,
} from '../../hooks/useResponsive';
export type { ResponsiveState, DeviceType, BreakpointKey } from '../../hooks/useResponsive';

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
  getBreakpoint,
  BREAKPOINTS as BREAKPOINT_VALUES,
} from '../../utils/responsive';
export type {
  ResponsiveValue,
  GridColumnConfig,
  SpacingSize,
  FontSize,
  TouchTargetConfig,
  StackDirection,
  StackDirectionConfig,
  Breakpoint,
} from '../../utils/responsive';
