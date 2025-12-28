# Implementation Plan

## Phase 1: Critical Fixes & Quick Wins

- [x] 1. Fix PrismaClient Singleton Pattern





  - [x] 1.1 Update main.ts to import prisma from utils/prisma.ts


    - Remove `const prisma = new PrismaClient()` from main.ts
    - Import from `./utils/prisma`
    - _Requirements: 6.1_

  - [x] 1.2 Update google-sheets.service.ts to use singleton

    - Remove local PrismaClient instantiation
    - Import from `../utils/prisma`
    - _Requirements: 6.1_
  - [ ]* 1.3 Write property test for PrismaClient singleton
    - **Property 1: PrismaClient Singleton**
    - Verify only one PrismaClient instance exists across codebase
    - **Validates: Requirements 6.1**

- [x] 2. Add Graceful Shutdown Handler






  - [x] 2.1 Implement SIGTERM/SIGINT handlers in main.ts

    - Add process signal handlers
    - Close Prisma connection on shutdown
    - Log shutdown events
    - _Requirements: 8.4_
  - [ ]* 2.2 Write unit test for graceful shutdown
    - Test that shutdown handler is registered
    - _Requirements: 8.4_

- [x] 3. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Database Performance Optimization

- [x] 4. Optimize Dashboard Service Queries





  - [x] 4.1 Replace findMany with aggregation queries for stats


    - Use Prisma `count()` and `groupBy()` instead of fetching all records
    - Update getLeadsStats, getProjectsStats, getBidsStats, etc.
    - _Requirements: 2.3, 2.4_
  - [x] 4.2 Add pagination to activity feed queries


    - Ensure getRecentLeads, getRecentProjects use proper limits
    - _Requirements: 2.3_
  - [ ]* 4.3 Write property test for pagination bounds
    - **Property 4: Pagination Bounds**
    - Verify all paginated responses have correct meta format
    - **Validates: Requirements 6.5**

- [x] 5. Audit and Fix N+1 Query Patterns








  - [x] 5.1 Review and optimize bid.service.ts queries

    - Add proper `include` statements to avoid N+1
    - Use `select` to limit returned fields
    - _Requirements: 1.2, 2.4_

  - [x] 5.2 Review and optimize project.service.ts queries

    - Ensure relations are eagerly loaded where needed
    - _Requirements: 1.2, 2.4_

  - [x] 5.3 Review and optimize review services queries



    - Check stats.service.ts and crud.service.ts
    - _Requirements: 1.2, 2.4_

- [x] 6. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Security Audit & Fixes

- [x] 7. Audit Authentication Coverage


  - [x] 7.1 Create script to list all endpoints and their auth status


    - Parse route files to identify endpoints
    - Check for authenticate() middleware presence
    - Generate report of unprotected endpoints
    - _Requirements: 1.1, 3.2_
  - [x] 7.2 Fix any endpoints missing required authentication


    - Add authenticate() middleware where needed
    - Add requireRole() for admin endpoints
    - _Requirements: 1.1, 3.2_
  - [ ]* 7.3 Write property test for protected endpoints
    - **Property 3: Authenticated Endpoint Protection**
    - Verify admin/homeowner/contractor routes require auth
    - **Validates: Requirements 3.2**

- [x] 8. Audit Sensitive Data Exposure


  - [x] 8.1 Review all user-related API responses


    - Ensure passwordHash is never returned
    - Ensure token fields are excluded
    - _Requirements: 3.3_
  - [ ]* 8.2 Write property test for sensitive data exclusion
    - **Property 1: Sensitive Data Exclusion**
    - Verify no sensitive fields in user responses
    - **Validates: Requirements 3.3**

- [x] 9. Audit Rate Limiting Coverage


  - [x] 9.1 Document current rate limiting configuration


    - List all endpoints with rate limits
    - Identify public endpoints without rate limits
    - _Requirements: 3.4_
  - [x] 9.2 Add rate limiting to missing public endpoints


    - Focus on form submission endpoints
    - _Requirements: 3.4_

- [x] 10. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Code Quality & Consistency

- [x] 11. Audit Error Response Consistency


  - [x] 11.1 Review all error responses in route handlers


    - Ensure errorResponse() helper is used consistently
    - Check for direct c.json() error calls
    - _Requirements: 4.3_
  - [ ]* 11.2 Write property test for error response format
    - **Property 2: Error Response Format Consistency**
    - Verify all errors have success, error, correlationId
    - **Validates: Requirements 4.3**

- [x] 12. Audit Input Validation Coverage


  - [x] 12.1 List all POST/PUT endpoints and their validation status


    - Check for validate() middleware usage
    - Identify endpoints without Zod validation
    - _Requirements: 1.5_
  - [x] 12.2 Add missing Zod validation schemas


    - Create schemas for unvalidated endpoints
    - _Requirements: 1.5_

- [x] 13. Audit Type Safety


  - [x] 13.1 Run TypeScript strict mode check


    - Identify `any` type usage
    - Identify unsafe type assertions
    - _Requirements: 1.4_
  - [x] 13.2 Fix critical type safety issues


    - Replace `any` with proper types
    - Add type guards where needed
    - _Requirements: 1.4_

- [x] 14. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Resource Management Audit

- [x] 15. Audit File Operations


  - [x] 15.1 Review media.service.ts for stream handling


    - Verify streams are properly closed
    - Check Sharp memory management
    - _Requirements: 6.2, 6.3_
  - [x] 15.2 Review pdf.service.ts for resource cleanup


    - Verify PDFKit resources are released
    - _Requirements: 6.2_

- [x] 16. Audit WebSocket Connections


  - [x] 16.1 Review chat.handler.ts for connection cleanup


    - Verify disconnect handlers are implemented
    - Check for memory leaks in connection tracking
    - _Requirements: 6.4_

- [x] 17. Audit Test Coverage


  - [x] 17.1 Generate test coverage report


    - Identify services without property tests
    - Document coverage gaps
    - _Requirements: 7.4_
  - [x] 17.2 Create list of missing property tests


    - Prioritize by business criticality
    - _Requirements: 7.4_

## Phase 6: Scalability Preparation Documentation

- [x] 18. Document Current Architecture Limitations


  - [x] 18.1 Create architecture decision record (ADR)


    - Document current monolith structure
    - Identify service boundaries for future microservices
    - _Requirements: 5.1_
  - [x] 18.2 Document stateful components


    - List in-memory stores (rate limiter)
    - Document session handling
    - _Requirements: 5.2_

- [x] 19. Create Caching Strategy Document


  - [x] 19.1 Identify cacheable data


    - Settings, Regions, ServiceCategories
    - BiddingSettings (singleton)
    - _Requirements: 5.3_
  - [x] 19.2 Document cache invalidation strategy


    - When to invalidate each cache type
    - _Requirements: 5.3_

- [x] 20. Create Async Processing Roadmap


  - [x] 20.1 Identify operations for background processing


    - Email notifications
    - PDF generation
    - Image processing
    - Ranking calculations
    - _Requirements: 5.4_
  - [x] 20.2 Document message queue integration plan


    - Queue structure for each operation type
    - _Requirements: 5.4_

- [x] 21. Create Database Scaling Plan




  - [x] 21.1 Document read-heavy vs write-heavy operations



    - Analyze query patterns
    - Identify read replica candidates
    - _Requirements: 5.5_
  - [x] 21.2 Create PostgreSQL migration checklist


    - Schema compatibility check
    - Data migration strategy
    - _Requirements: 5.5_

## Phase 7: Final Audit Report

- [x] 22. Generate Comprehensive Audit Report


  - [x] 22.1 Compile all findings into single document


    - Categorize by severity
    - Include recommendations
    - _Requirements: All_
  - [x] 22.2 Create prioritized action items


    - P0: Critical security/stability issues
    - P1: High performance issues
    - P2: Medium quality issues
    - P3: Low best practice issues
    - _Requirements: All_

- [x] 23. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
