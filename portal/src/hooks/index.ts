/**
 * Hooks Index
 * 
 * Export all custom hooks for easy importing
 */

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
  type ResponsiveState,
  type BreakpointKey,
  type DeviceType,
} from './useResponsive';

export {
  useFocusTrap,
  useArrowKeyNavigation,
  useEscapeKey,
  useSkipLink,
  useRovingTabIndex,
  getFocusableElements,
  announceToScreenReader,
} from './useKeyboardNavigation';
