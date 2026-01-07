# Implementation Plan

## Phase 1: Test Infrastructure

- [ ] 1. Set up test utilities



  - [x] 1.1 Create mock-prisma utility


    - Create `api/src/test-utils/mock-prisma.ts` with createMockPrisma function
    - Export MockPrismaClient type
    - _Requirements: 6.1, 6.2_
  - [x] 1.2 Create test fixtures


    - Create `api/src/test-utils/fixtures.ts` with user, project, bid, escrow fixtures
    - Include all roles (ADMIN, MANAGER, CONTRACTOR, HOMEOWNER)
    - Include all statuses for each entity
    - _Requirements: 1.1, 2.1, 3.1_
  - [x] 1.3 Create test generators for property-based testing


    - Create `api/src/test-utils/generators.ts` with fast-check generators
    - Include status generators, transition generators, value generators
    - _Requirements: 1.2, 2.4, 3.3_
  - [x] 1.4 Install fast-check dependency


    - Add fast-check to devDependencies
    - _Requirements: 5.3_

## Phase 2: Project Service Tests

- [x] 2. Implement project.service tests





  - [x] 2.1 Create project.service.test.ts file structure




    - Set up describe blocks for each method
    - Set up beforeEach with mock Prisma
    - _Requirements: 1.1_
  - [x] 2.2 Write property test for project code format


    - **Property 1: Project code format**
    - **Validates: Requirements 1.1**
  - [x] 2.3 Write property test for valid status transitions


    - **Property 2: Valid project status transitions**
    - **Validates: Requirements 1.2**
  - [x] 2.4 Write property test for invalid status transitions


    - **Property 3: Invalid project status transitions rejected**
    - **Validates: Requirements 1.3**
  - [x] 2.5 Write property test for project filtering


    - **Property 4: Project filtering correctness**
    - **Validates: Requirements 1.4**
  - [x] 2.6 Write unit tests for project access control


    - Test owner-only access for draft projects
    - Test public access for open projects
    - _Requirements: 1.5_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Bid Service Tests

- [x] 4. Implement bid.service tests
  - [x] 4.1 Create bid.service.test.ts file structure
    - Set up describe blocks for each method
    - Set up beforeEach with mock Prisma
    - _Requirements: 2.1_
  - [x] 4.2 Write property test for contractor verification
    - **Property 5: Contractor verification for bidding**
    - **Validates: Requirements 2.1**
  - [x] 4.3 Write unit test for one-bid-per-project constraint
    - Test duplicate bid rejection
    - _Requirements: 2.2_
  - [x] 4.4 Write property test for bid anonymization
    - **Property 6: Bid anonymization for homeowners**
    - **Validates: Requirements 2.3**
  - [x] 4.5 Write property test for bid status transitions
    - **Property 7: Valid bid status transitions**
    - **Validates: Requirements 2.4**
  - [x] 4.6 Write property test for bid withdrawal
    - **Property 8: Bid withdrawal restrictions**
    - **Validates: Requirements 2.5**

- [x] 5. Checkpoint - Ensure all tests pass
  - All bid service tests pass (45 tests)

## Phase 4: Escrow Service Tests

- [x] 6. Implement escrow.service tests
  - [x] 6.1 Create escrow.service.test.ts file structure
    - Set up describe blocks for each method
    - Set up beforeEach with mock Prisma
    - _Requirements: 3.1_
  - [x] 6.2 Write property test for escrow amount calculation
    - **Property 9: Escrow amount calculation**
    - **Validates: Requirements 3.1, 3.2**
  - [x] 6.3 Write property test for escrow status transitions
    - **Property 10: Valid escrow status transitions**
    - **Validates: Requirements 3.3**
  - [x] 6.4 Write property test for partial release tracking

    - **Property 11: Escrow partial release tracking**
    - **Validates: Requirements 3.4**
  - [x] 6.5 Write unit test for dispute status change
    - Test status change to DISPUTED
    - _Requirements: 3.5_

- [x] 7. Checkpoint - Ensure all tests pass
  - All 138 tests pass (project: 36, bid: 45, escrow: 57)

## Phase 5: Notification Service Tests

- [x] 8. Implement notification.service tests





  - [x] 8.1 Create notification.service.test.ts file structure
    - Set up describe blocks for each method
    - Set up beforeEach with mock Prisma
    - _Requirements: 4.1_

  - [x] 8.2 Write unit tests for notification creation
    - Test all notification types
    - _Requirements: 4.1_

  - [x] 8.3 Write property test for unread count
    - **Property 12: Notification unread count**
    - **Validates: Requirements 4.2**

  - [x] 8.4 Write unit test for mark as readxx
    - Test readAt timestamp is set
    - _Requirements: 4.3_

  - [x] 8.5 Write property test for preferences
    - **Property 13: Notification preferences persistence**
    - **Validates: Requirements 4.4**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Review & Ranking Service Tests

- [x] 10. Implement review.service tests





  - [x] 10.1 Create review.service.test.ts file structure


    - Set up describe blocks for each method
    - Set up beforeEach with mock Prisma
    - _Requirements: 5.1_
  - [x] 10.2 Write unit test for one-review-per-project

    - Test duplicate review rejection
    - _Requirements: 5.1_
  - [x] 10.3 Write property test for project completion check

    - **Property 14: Review project completion check**
    - **Validates: Requirements 5.2**


- [ ] 11. Implement ranking.service tests





  - [x] 11.1 Create ranking.service.test.ts file structure


    - Set up describe blocks for each method
    - Set up beforeEach with mock Prisma
    - _Requirements: 5.3_
  - [ ] 11.2 Write property test for score calculation
    - **Property 15: Ranking score calculation**
    - **Validates: Requirements 5.3**
  - [ ] 11.3 Write property test for ranking ordering
    - **Property 16: Ranking ordering**
    - **Validates: Requirements 5.4**

- [x] 12. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Route Tests


- [x] 13. Implement route tests




  - [x] 13.1 Create project.routes.test.ts


    - Test authentication requirements
    - Test role-based access
    - Test validation
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 13.2 Write property test for protected routes


    - **Property 17: Protected routes require authentication**
    - **Validates: Requirements 6.1**
  - [x] 13.3 Write property test for role restrictions


    - **Property 18: Role-restricted routes enforce authorization**
    - **Validates: Requirements 6.2**

  - [x] 13.4 Write property test for validation errors

    - **Property 19: Validation errors return 400**
    - **Validates: Requirements 6.3**
  - [x] 13.5 Write unit tests for response format


    - Test success response format
    - Test error response format
    - _Requirements: 6.4_

- [x] 14. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
