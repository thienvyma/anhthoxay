# Implementation Plan

- [x] 1. Create CSS variables file with breakpoints and design tokens


  - Create `admin/src/styles/variables.css` with breakpoint, spacing, and font size variables
  - Import into main app entry point
  - _Requirements: 11.1_

- [x] 2. Create global responsive utility stylesheet


  - Create `admin/src/styles/responsive.css` with utility classes
  - Include visibility utilities (hide-mobile, show-mobile, etc.)
  - Include responsive grid utilities (grid-cols-1, grid-cols-2, etc.)
  - Include responsive spacing utilities (p-responsive, gap-responsive, etc.)
  - _Requirements: 11.2, 11.4, 11.5_


- [x] 3. Create useResponsive hook

  - Create `admin/src/hooks/useResponsive.ts`
  - Implement breakpoint detection based on window width
  - Implement isAtLeast and isAtMost helper functions
  - Add debounced resize listener
  - _Requirements: 11.3_

- [x] 4. Create responsive utility functions


  - Create `admin/src/utils/responsive.ts`
  - Implement getBreakpoint(width) function
  - Implement getResponsiveValue(value, breakpoint, default) function
  - Implement getGridColumns(width, config) function
  - Implement getSpacing(breakpoint, size) function
  - Implement getFontSize(breakpoint, size) function
  - _Requirements: 11.3, 12.1_

- [ ]* 5. Write property tests for responsive utilities
  - **Property 1: Breakpoint Detection Consistency**
  - **Property 2: Grid Column Calculation**
  - **Property 3: Responsive Value Resolution**
  - **Property 4: Spacing Scale Consistency**
  - **Property 5: Font Size Scale Consistency**
  - **Property 6: Touch Target Minimum Size**
  - **Property 9: Breakpoint Comparison Helpers**
  - **Validates: Requirements 2.1, 2.2, 2.3, 7.1, 7.2, 8.1, 8.2, 8.3, 8.4, 11.3, 12.1, 12.6**

- [x] 6. Checkpoint - Ensure foundation tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create ResponsiveGrid component


  - Create `admin/src/components/responsive/ResponsiveGrid.tsx`
  - Implement auto-adjusting columns based on breakpoint
  - Support custom column configuration per breakpoint
  - Support responsive gap
  - _Requirements: 12.1_

- [x] 8. Create ResponsiveStack component


  - Create `admin/src/components/responsive/ResponsiveStack.tsx`
  - Implement direction change based on breakpoint
  - Support alignment and justify props
  - _Requirements: 12.5_

- [ ]* 9. Write property test for ResponsiveStack
  - **Property 7: Stack Direction Resolution**
  - **Validates: Requirements 12.5**

- [x] 10. Create ResponsiveModal component


  - Create `admin/src/components/responsive/ResponsiveModal.tsx`
  - Implement full-screen mode on mobile
  - Support fixed header/footer with scrollable content
  - Support size variants
  - _Requirements: 4.1, 4.4, 12.4_

- [x] 11. Create ResponsiveTabs component


  - Create `admin/src/components/responsive/ResponsiveTabs.tsx`
  - Implement scrollable mode for overflow tabs
  - Implement dropdown mode for mobile
  - Support icon-only mode on mobile
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 12.3_

- [x] 12. Create ResponsiveTable component


  - Create `admin/src/components/responsive/ResponsiveTable.tsx`
  - Implement card layout on mobile
  - Support column hiding on mobile
  - Support custom mobile card renderer
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 12.2_

- [x] 13. Create responsive chart configuration utilities


  - Create `admin/src/utils/chartConfig.ts`
  - Implement getChartConfig(type, breakpoint) function
  - Configure legend position based on breakpoint
  - Configure data point reduction for mobile
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 14. Write property test for chart configuration
  - **Property 8: Chart Configuration Adaptation**
  - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 15. Checkpoint - Ensure component tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Create index file for responsive components


  - Create `admin/src/components/responsive/index.ts`
  - Export all responsive components and hooks
  - _Requirements: 11.6_

- [x] 17. Update Layout component with responsive improvements


  - Refactor `admin/src/app/components/Layout.tsx`
  - Use useResponsive hook instead of inline media queries
  - Improve mobile menu behavior
  - Add touch-friendly targets
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 18. Update Dashboard page with responsive components


  - Refactor `admin/src/app/pages/DashboardPage.tsx`
  - Use ResponsiveGrid for stats cards
  - Use ResponsiveStack for header layout
  - Apply responsive chart configurations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 19. Update UsersPage with ResponsiveTable



  - Refactor `admin/src/app/pages/UsersPage.tsx`
  - Use ResponsiveTable component
  - Implement mobile card view
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 20. Update LeadsPage with ResponsiveTable




  - Refactor `admin/src/app/pages/LeadsPage.tsx`
  - Use ResponsiveTable component
  - Implement mobile card view
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 21. Update InteriorPage with ResponsiveTabs




  - Refactor `admin/src/app/pages/InteriorPage/index.tsx`
  - Use ResponsiveTabs component
  - Group tabs into dropdown on mobile
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 22. Update BiddingManagementPage with ResponsiveTabs


  - Refactor `admin/src/app/pages/BiddingManagementPage/index.tsx`
  - Use ResponsiveTabs component
  - _Requirements: 10.1_

- [x] 23. Update SettingsPage with ResponsiveTabs


  - Refactor `admin/src/app/pages/SettingsPage/index.tsx`
  - Use ResponsiveTabs component
  - _Requirements: 5.1, 5.2_

- [x] 24. Update PricingConfigPage with ResponsiveTabs


  - Refactor `admin/src/app/pages/PricingConfigPage/index.tsx`
  - Use ResponsiveTabs component
  - _Requirements: 5.1, 5.2_

- [x] 25. Update existing modals to use ResponsiveModal


  - Update modals in UsersPage
  - Update modals in LeadsPage
  - Update modals in ContractorsPage
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 26. Create responsive filter pattern


  - Update filter layouts to stack on mobile
  - Implement collapsible filter panel for mobile
  - Add active filter count badge
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 27. Update MediaPage with responsive grid


  - Refactor `admin/src/app/pages/MediaPage/index.tsx`
  - Use ResponsiveGrid for media cards
  - Implement compact action menu on mobile
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 28. Update ProjectsPage with responsive layout


  - Implement card-based layout on mobile
  - Use compact status badges
  - _Requirements: 10.2, 10.4_

- [x] 29. Update BidsPage with responsive layout


  - Implement accordion/modal view on mobile
  - Group actions into context menu
  - _Requirements: 10.3, 10.5_

- [x] 30. Final Checkpoint



  - Ensure all tests pass, ask the user if questions arise.
  - Verify responsive behavior on mobile, tablet, and desktop
  - Check for any remaining inline media queries that should use the system

