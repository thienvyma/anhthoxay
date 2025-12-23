# Implementation Plan

- [-] 1. Set up responsive infrastructure



  - [-] 1.1 Create portal/src/components/responsive/ directory structure

    - Create index.ts for centralized exports
    - _Requirements: 6.1_
  - [x] 1.2 Copy and adapt responsive utility functions

    - Copy admin/src/utils/responsive.ts to portal/src/utils/responsive.ts
    - Adjust imports for Portal context
    - _Requirements: 6.2_
  - [ ]* 1.3 Write property test for responsive utilities
    - **Property 8: Responsive utility returns correct values**
    - **Validates: Requirements 6.2**




- [x] 2. Implement ResponsiveTable component

  - [x] 2.1 Copy ResponsiveTable from Admin

    - Copy admin/src/components/responsive/ResponsiveTable.tsx
    - Adjust imports for Portal (@app/shared tokens, useResponsive hook)
    - _Requirements: 1.1, 1.2, 2.1_
  - [ ]* 2.2 Write property test for ResponsiveTable
    - **Property 1: Table renders cards on mobile**
    - **Validates: Requirements 1.1, 1.2, 2.1**
  - [-]* 2.3 Write property test for touch targets


    - **Property 2: Touch targets meet minimum size**

    - **Validates: Requirements 1.4**

- [x] 3. Implement ResponsiveModal component

  - [ ] 3.1 Copy ResponsiveModal from Admin
    - Copy admin/src/components/responsive/ResponsiveModal.tsx
    - Adjust imports for Portal context



    - _Requirements: 3.1, 3.3_
  - [ ]* 3.2 Write property test for ResponsiveModal
    - **Property 3: Modal full-screen on mobile**
    - **Property 4: Modal buttons stack vertically on mobile**
    - **Validates: Requirements 3.1, 3.3**

- [-] 4. Implement ResponsiveFilters component




  - [ ] 4.1 Copy ResponsiveFilters from Admin
    - Copy admin/src/components/responsive/ResponsiveFilters.tsx
    - Adjust imports for Portal context
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 4.2 Write property test for ResponsiveFilters
    - **Property 5: Filters collapse on mobile**



    - **Property 6: Filter badge shows active count**


    - **Validates: Requirements 4.1, 4.2, 4.3**



- [x] 5. Implement ResponsiveTabs component



  - [ ] 5.1 Copy ResponsiveTabs from Admin
    - Copy admin/src/components/responsive/ResponsiveTabs.tsx
    - Adjust imports for Portal context
    - _Requirements: 5.1, 5.4_
  - [ ]* 5.2 Write property test for ResponsiveTabs
    - **Property 7: Tabs enable horizontal scroll on mobile**

    - **Validates: Requirements 5.1**


- [ ] 6. Copy additional responsive components
  - [x] 6.1 Copy ResponsivePageHeader from Admin

    - Adjust for Portal page structure
    - _Requirements: 2.3_
  - [ ] 6.2 Copy ResponsiveActionBar from Admin
    - Adjust for Portal actions
    - _Requirements: 1.4_
  - [ ] 6.3 Copy ResponsiveGrid and ResponsiveStack from Admin
    - Enhance existing Portal components if needed
    - _Requirements: 2.3_


- [ ] 7. Update centralized exports
  - [x] 7.1 Create comprehensive index.ts

    - Export all responsive components
    - Export utility functions
    - Export types
    - _Requirements: 6.1_

- [ ] 8. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.


- [-] 9. Apply responsive components to Portal pages


  - [x] 9.1 Update Marketplace page

    - Replace existing table with ResponsiveTable
    - Add ResponsiveFilters for project filtering
    - _Requirements: 1.1_
  - [x] 9.2 Update Contractor Bids page


    - Replace existing table with ResponsiveTable
    - Add custom mobile card renderer for bids
    - _Requirements: 1.2_
  - [x] 9.3 Update Homeowner Projects page


    - Replace existing table with ResponsiveTable
    - Add status badges in mobile cards
    - _Requirements: 2.1_
  - [x] 9.4 Update modals across Portal


    - Replace existing modals with ResponsiveModal
    - Ensure full-screen on mobile
    - _Requirements: 3.1, 3.3_




- [x] 10. Update Portal styles

  - [x] 10.1 Update responsive.css

    - Add new responsive utility classes
    - Ensure consistency with Admin styles
    - _Requirements: 6.3_

- [x] 11. Fix horizontal scroll and content overflow issues




  - [x] 11.1 Update layout CSS to prevent horizontal scroll

    - Add overflow-x: hidden to portal-layout and portal-main
    - Ensure box-sizing: border-box on all containers
    - _Requirements: 7.1_

  - [x] 11.2 Fix project card content overflow on mobile

    - Update budget display to use abbreviated format on mobile
    - Ensure text truncation with ellipsis for long content
    - Stack region/budget info vertically on narrow screens
    - _Requirements: 7.2, 7.3, 8.2, 8.3_

  - [x] 11.3 Update ProjectsPage card layout for mobile

    - Fix card grid to use proper width constraints
    - Ensure cards don't exceed viewport width
    - _Requirements: 7.4, 8.1, 8.4_

- [ ] 12. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.
