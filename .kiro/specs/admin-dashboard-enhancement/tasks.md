# Implementation Plan

- [x] 1. Create Dashboard API endpoint and service





  - [x] 1.1 Create dashboard schema for validation


    - Create `api/src/schemas/dashboard.schema.ts` with Zod schemas for response types
    - Define DashboardStatsResponse and ActivityFeedResponse schemas
    - _Requirements: 6.1, 6.2_
  - [x] 1.2 Create DashboardService with stats aggregation


    - Create `api/src/services/dashboard.service.ts`
    - Implement `getStats()` method to aggregate counts from all models
    - Implement `getPendingItems()` method to fetch pending projects, bids, contractors (max 5 each)
    - Implement `getActivityFeed()` method to aggregate recent items from multiple sources
    - _Requirements: 6.1, 6.2, 2.3, 4.2_
  - [x] 1.3 Write property test for stats structure completeness


    - **Property 1: Dashboard API returns complete stats structure**
    - **Validates: Requirements 6.1, 6.2**
  - [x] 1.4 Write property test for pending items limit

    - **Property 2: Pending items are limited to 5 per category**
    - **Validates: Requirements 2.3**
  - [x] 1.5 Write property test for activity feed limit

    - **Property 3: Activity feed is limited to requested count**
    - **Validates: Requirements 4.2**
  - [x] 1.6 Write property test for activity item structure

    - **Property 4: Activity items have required fields**
    - **Validates: Requirements 4.3**
  - [x] 1.7 Write property test for pending counts accuracy

    - **Property 5: Pending counts match pending items**
    - **Validates: Requirements 1.3, 2.1, 5.3**
  - [x] 1.8 Write property test for non-negative counts

    - **Property 6: Stats counts are non-negative integers**
    - **Validates: Requirements 1.2**
  - [x] 1.9 Create dashboard routes


    - Create `api/src/routes/dashboard.routes.ts`
    - Implement `GET /api/admin/dashboard` endpoint with auth middleware
    - Implement `GET /api/admin/dashboard/activity` endpoint with auth middleware
    - _Requirements: 6.1, 6.3, 6.4_
  - [x] 1.10 Register routes in main.ts


    - Import and register dashboard routes
    - _Requirements: 6.1_


- [x] 2. Checkpoint - Ensure all API tests pass




  - Ensure all tests pass, ask the user if questions arise.


- [x] 3. Create frontend API client





  - [x] 3.1 Add dashboard API functions

    - Add `getDashboardStats()` function to `admin/src/app/api/index.ts`
    - Add `getActivityFeed()` function
    - Define TypeScript interfaces for response types
    - _Requirements: 6.1_

- [x] 4. Create StatsCards component



  - [x] 4.1 Create StatsCard component

    - Create `admin/src/app/components/StatsCard.tsx`
    - Implement card with icon, label, value, color, and optional pending badge
    - Add click handler for navigation
    - Add hover animation with Framer Motion
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 4.2 Create StatsGrid component

    - Create `admin/src/app/components/StatsGrid.tsx`
    - Implement responsive grid layout (4 cols desktop, 2 cols tablet, 1 col mobile)
    - Add skeleton loader state
    - _Requirements: 1.1, 7.1, 7.2, 7.3, 8.1_

- [x] 5. Create PendingItemsSection component



  - [x] 5.1 Create PendingItemsSection component

    - Create `admin/src/app/components/PendingItemsSection.tsx`
    - Implement tabbed interface for projects, bids, contractors
    - Display up to 5 items per tab
    - Add empty state for each tab
    - Add click handler for navigation to detail page
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Create ActivityFeed component



  - [x] 6.1 Create ActivityFeed component

    - Create `admin/src/app/components/ActivityFeed.tsx`
    - Display activity items with icon, title, description, timestamp
    - Add click handler for navigation
    - Add loading and empty states
    - _Requirements: 4.1, 4.2, 4.3, 4.4_



- [x] 7. Create QuickActions component

  - [x] 7.1 Create QuickActions component

    - Create `admin/src/app/components/QuickActions.tsx`
    - Display action buttons with icons and optional badges
    - Include: Duyệt công trình, Duyệt nhà thầu, Quản lý đấu thầu, Cấu hình nội thất, Viết bài blog, Quản lý media
    - Add click handler for navigation
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Update DashboardPage



  - [x] 8.1 Refactor DashboardPage to use new components

    - Update `admin/src/app/pages/DashboardPage.tsx`
    - Integrate StatsGrid, PendingItemsSection, ChartsSection, ActivityFeed, QuickActions
    - Implement data loading with proper loading states
    - Add auto-refresh every 5 minutes
    - _Requirements: 1.1, 8.1, 8.2, 8.4_

  - [x] 8.2 Update stats cards configuration

    - Add new stats: Projects, Bids, Contractors, Interior Quotes, Blog Posts, Users, Media
    - Configure navigation routes for each card
    - _Requirements: 1.2_


- [x] 9. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Final integration and polish



  - [x] 10.1 Test responsive layout

    - Verify layout on desktop, tablet, mobile breakpoints
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 10.2 Test loading states and error handling

    - Verify skeleton loaders display correctly
    - Verify error states with retry option
    - _Requirements: 3.3, 3.4, 8.1_

  - [x] 10.3 Update security-checklist.md

    - Add new dashboard routes to Protected Routes Registry
    - _Requirements: 6.4_

- [x] 11. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
