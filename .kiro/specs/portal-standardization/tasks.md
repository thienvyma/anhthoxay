# Implementation Plan

- [x] 1. Create barrel exports for pages and contexts





  - [x] 1.1 Create `portal/src/pages/index.ts` barrel export

    - Re-export all page components from auth, homeowner, contractor, public directories


    - Use named exports consistently
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 1.2 Create `portal/src/contexts/index.ts` barrel export
    - Re-export ThemeContext and any other contexts
    - Use named exports consistently
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 2. Refactor LoginPage to use CSS variables



  - [x] 2.1 Replace hardcoded colors in LoginPage.tsx

    - Replace `#e4e7ec` with `var(--text-primary)`
    - Replace `#a1a1aa` with `var(--text-secondary)`
    - Replace `#71717a` with `var(--text-muted)`
    - Replace `#27272a` with `var(--border)`
    - Replace `#f5d393` with `var(--primary)`
    - _Requirements: 1.1, 1.3, 4.1_

- [x] 3. Refactor Homeowner DashboardPage to use CSS variables



  - [x] 3.1 Replace hardcoded colors in homeowner/DashboardPage.tsx

    - Replace all hardcoded hex colors with CSS variables
    - Keep dynamic color logic (status colors) but use CSS variables where possible
    - _Requirements: 1.1, 1.3, 4.2_

- [x] 4. Refactor Contractor DashboardPage to use CSS variables


  - [x] 4.1 Replace hardcoded colors in contractor/DashboardPage.tsx


    - Replace all hardcoded hex colors with CSS variables
    - Keep dynamic color logic (status colors) but use CSS variables where possible
    - _Requirements: 1.1, 1.3, 4.3_

- [x] 5. Refactor ProjectsPage to use CSS variables




  - [x] 5.1 Replace hardcoded colors in homeowner/ProjectsPage.tsx



    - Replace all hardcoded hex colors with CSS variables
    - Keep STATUS_COLORS mapping but use CSS variables
    - _Requirements: 1.1, 1.3, 4.4_

- [x] 6. Refactor MarketplacePage to use CSS variables

  - [x] 6.1 Replace hardcoded colors in contractor/MarketplacePage.tsx


    - Replace all hardcoded hex colors with CSS variables
    - _Requirements: 1.1, 1.3, 4.5_

- [x] 7. Checkpoint - Verify all changes



  - Ensure all tests pass, ask the user if questions arise.
  - Run lint and typecheck: `pnpm nx run-many --target=lint --all` and `pnpm nx run-many --target=typecheck --all`

- [x] 8. Write property test for hardcoded colors detection








  - [x] 8.1 Create property test to scan TSX files for hardcoded colors



    - **Property 1: No hardcoded colors in TSX files**
    - **Validates: Requirements 1.1, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 4.5**
    - Use regex to scan for hex color patterns in inline styles
    - Test should pass with 0 hardcoded colors found

- [x] 9. Update DAILY_CHANGELOG.md



  - Document all files created and modified
  - _Requirements: Workspace steering rule_

