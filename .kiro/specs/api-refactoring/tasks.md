# Implementation Plan

## Phase 1: Foundation - Response Helpers & CORS Config

- [x] 1. Create response helper utilities





  - [x] 1.1 Create response.ts utility file


    - Create `api/src/utils/response.ts`
    - Implement `successResponse<T>(c, data, status?)` function
    - Implement `paginatedResponse<T>(c, data, meta)` function
    - Implement `errorResponse(c, code, message, status?)` function
    - Export TypeScript interfaces for response types
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 1.2 Write property test for response helpers


    - **Property 5: Response Helper Functions Work Correctly**
    - **Validates: Requirements 3.4**

- [x] 2. Create CORS configuration module





  - [x] 2.1 Create cors.ts config file


    - Create `api/src/config/cors.ts`
    - Implement `getCorsConfig()` function to read from `CORS_ORIGINS` env
    - Parse comma-separated origins
    - Validate URLs
    - Fallback to localhost in development
    - Log warning in production if not set
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.2 Write property test for CORS config

    - **Property 6: CORS Origins From Environment**
    - **Property 7: CORS Origin Validation**
    - **Validates: Requirements 4.1, 4.2, 4.5**

- [x] 3. Create validation middleware





  - [x] 3.1 Create validation.ts middleware


    - Create `api/src/middleware/validation.ts`
    - Implement `validate(schema)` for request body
    - Implement `validateQuery(schema)` for query params
    - Return 400 with validation error details
    - Include correlationId in error response
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.2 Write property test for validation middleware

    - **Property 8: Input Validation Returns 400**
    - **Validates: Requirements 5.1, 5.2, 5.3**

## Phase 2: Route Modules - Extract from main.ts

- [x] 4. Create pages routes module





  - [x] 4.1 Create pages.routes.ts


    - Create `api/src/routes/pages.routes.ts`
    - Extract GET /pages, POST /pages, PUT /pages/:id, DELETE /pages/:id
    - Extract GET /sections, POST /sections, PUT /sections/:id, DELETE /sections/:id
    - Use response helpers for all responses
    - Add JSDoc comments
    - _Requirements: 1.1, 1.2, 1.3, 3.5, 6.1, 6.2_

- [x] 5. Create media routes module





  - [x] 5.1 Create media.routes.ts


    - Create `api/src/routes/media.routes.ts`
    - Extract GET /media, POST /media/upload, DELETE /media/:id
    - Use response helpers for all responses
    - Add JSDoc comments
    - _Requirements: 1.1, 1.2, 1.3, 3.5, 6.1, 6.2_

- [x] 6. Create leads routes module





  - [x] 6.1 Create leads.routes.ts


    - Create `api/src/routes/leads.routes.ts`
    - Extract GET /leads, POST /leads, PUT /leads/:id, DELETE /leads/:id
    - Extract GET /leads/stats, GET /leads/export
    - Use response helpers for all responses
    - Add Zod validation for POST/PUT
    - Add JSDoc comments
    - _Requirements: 1.1, 1.2, 1.3, 3.5, 5.1, 6.1, 6.2_

- [x] 7. Create pricing routes module








  - [x] 7.1 Create pricing.routes.ts



    - Create `api/src/routes/pricing.routes.ts`
    - Extract service-categories CRUD routes
    - Extract unit-prices CRUD routes
    - Extract material-categories CRUD routes
    - Extract materials CRUD routes
    - Extract formulas CRUD routes
    - Extract quote calculation endpoint
    - Use response helpers for all responses
    - Add Zod validation
    - Add JSDoc comments
    - _Requirements: 1.1, 1.2, 1.3, 3.5, 5.1, 6.1, 6.2_

- [x] 8. Create blog routes module





  - [x] 8.1 Create blog.routes.ts


    - Create `api/src/routes/blog.routes.ts`
    - Extract GET /blog/posts, POST /blog/posts, PUT /blog/posts/:id, DELETE /blog/posts/:id
    - Extract GET /blog/categories
    - Use response helpers for all responses
    - Add Zod validation
    - Add JSDoc comments
    - _Requirements: 1.1, 1.2, 1.3, 3.5, 5.1, 6.1, 6.2_

- [x] 9. Create settings routes module






  - [x] 9.1 Create settings.routes.ts

    - Create `api/src/routes/settings.routes.ts`
    - Extract GET /settings, PUT /settings
    - Use response helpers for all responses
    - Add Zod validation
    - Add JSDoc comments
    - _Requirements: 1.1, 1.2, 1.3, 3.5, 5.1, 6.1, 6.2_

- [x] 10. Create integrations routes module





  - [x] 10.1 Create integrations.routes.ts


    - Create `api/src/routes/integrations.routes.ts`
    - Extract Google Sheets OAuth routes
    - Use response helpers for all responses
    - Add JSDoc comments
    - _Requirements: 1.1, 1.2, 1.3, 3.5, 6.1, 6.2_

## Phase 3: Checkpoint

- [x] 11. Checkpoint - Verify route modules work





  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Service Layer Extraction

- [x] 12. Create pages service






  - [x] 12.1 Create pages.service.ts

    - Create `api/src/services/pages.service.ts`
    - Extract page CRUD logic from routes
    - Extract section CRUD logic from routes
    - Export service instance
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 13. Create media service





  - [x] 13.1 Create media.service.ts


    - Create `api/src/services/media.service.ts`
    - Extract media upload logic
    - Extract media delete logic
    - Export service instance
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 14. Create leads service






  - [x] 14.1 Create leads.service.ts

    - Create `api/src/services/leads.service.ts`
    - Extract leads CRUD logic
    - Extract leads stats calculation
    - Extract leads export logic
    - Export service instance
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 15. Create pricing service








  - [x] 15.1 Create pricing.service.ts


    - Create `api/src/services/pricing.service.ts`
    - Extract service categories logic
    - Extract unit prices logic
    - Extract materials logic
    - Extract formulas logic
    - Export service instance
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 16. Create quote service






  - [x] 16.1 Create quote.service.ts

    - Create `api/src/services/quote.service.ts`
    - Extract quote calculation logic
    - Export service instance
    - _Requirements: 2.1, 2.2, 2.3_

## Phase 5: Schema Organization


- [x] 17. Organize Zod schemas





  - [x] 17.1 Create schema files by domain

    - Rename `api/src/schemas.ts` to `api/src/schemas/index.ts`
    - Create `api/src/schemas/pages.schema.ts`
    - Create `api/src/schemas/media.schema.ts`
    - Create `api/src/schemas/leads.schema.ts`
    - Create `api/src/schemas/pricing.schema.ts`
    - Move relevant schemas to domain files
    - Re-export from index.ts
    - _Requirements: 5.4_

## Phase 6: Main.ts Refactoring

- [x] 18. Refactor main.ts






  - [x] 18.1 Update main.ts to mount route modules

    - Import all route modules
    - Mount routes: `app.route('/api/pages', pagesRoutes)`
    - Remove extracted route handlers
    - Update CORS to use new config module
    - Keep only middleware setup and route mounting
    - Target: ~100 lines
    - _Requirements: 1.1, 1.4_
  - [x] 18.2 Write property test for protected routes


    - **Property 1: Protected Routes Require Authentication**
    - **Validates: Requirements 1.5**

## Phase 7: Response Format Migration

- [x] 19. Update auth routes to use response helpers






  - [x] 19.1 Update auth.routes.ts

    - Import response helpers
    - Update all responses to use `successResponse()`, `errorResponse()`
    - _Requirements: 3.5_

  - [x] 19.2 Write property tests for response format

    - **Property 2: Success Response Format Consistency**
    - **Property 3: Paginated Response Format Consistency**
    - **Property 4: Error Response Format Consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3**

## Phase 8: Final Checkpoint

- [x] 20. Final verification





  - [x] 20.1 Run all tests and lint


    - Run `pnpm nx run-many --target=lint --all`
    - Run `pnpm nx run-many --target=typecheck --all`
    - Run `pnpm nx run-many --target=test --all`
    - Ensure 0 errors, 0 warnings
  - [x] 20.2 Verify main.ts line count


    - Confirm main.ts is ~100 lines or less
    - Confirm all routes are in separate modules
  - [x] 20.3 Update steering files


    - Update `api-patterns.md` with new route module pattern
    - Update `security-checklist.md` if needed
    - _Requirements: All_

---

## Summary

### Implementation Order
1. Foundation (response helpers, CORS config, validation middleware)
2. Route modules extraction (pages, media, leads, pricing, blog, settings, integrations)
3. Service layer extraction
4. Schema organization
5. Main.ts refactoring
6. Response format migration
7. Final verification

### Files to Create
- `api/src/utils/response.ts` - Response helpers
- `api/src/config/cors.ts` - CORS configuration
- `api/src/middleware/validation.ts` - Zod validation middleware
- `api/src/routes/pages.routes.ts`
- `api/src/routes/media.routes.ts`
- `api/src/routes/leads.routes.ts`
- `api/src/routes/pricing.routes.ts`
- `api/src/routes/blog.routes.ts`
- `api/src/routes/settings.routes.ts`
- `api/src/routes/integrations.routes.ts`
- `api/src/services/pages.service.ts`
- `api/src/services/media.service.ts`
- `api/src/services/leads.service.ts`
- `api/src/services/pricing.service.ts`
- `api/src/services/quote.service.ts`
- `api/src/schemas/pages.schema.ts`
- `api/src/schemas/media.schema.ts`
- `api/src/schemas/leads.schema.ts`
- `api/src/schemas/pricing.schema.ts`

### Files to Modify
- `api/src/main.ts` - Refactor to mount route modules
- `api/src/routes/auth.routes.ts` - Use response helpers
- `api/src/schemas.ts` - Rename to `api/src/schemas/index.ts`

