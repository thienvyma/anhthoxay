# Implementation Plan

## 1. Environment-based API Configuration

- [x] 1.1 Create config module in @app/shared
  - Create `packages/shared/src/config.ts` with `getApiUrl()` function
  - Read from `VITE_API_URL` environment variable
  - Fallback to `http://localhost:4202` in development
  - Log warning in production if not set
  - Export `isProduction()` helper
  - Cache result to avoid repeated env access
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7_

- [x] 1.2 Update @app/shared index to use config module
  - Update `packages/shared/src/index.ts` to import from config
  - REMOVE hardcoded `export const API_URL = 'http://localhost:4202'`
  - REPLACE with `export { API_URL, getApiUrl, isProduction } from './config'`
  - Update `resolveMediaUrl` to use `getApiUrl()` instead of hardcoded API_URL
  - Verify: grep for hardcoded `localhost:4202` in shared package - should be 0 results
  - _Requirements: 1.5, 1.7_

- [x] 1.3 Update environment files
  - Add `VITE_API_URL` to `.env.example` with documentation comment
  - Add `VITE_API_URL` to `env.example`
  - _Requirements: 1.6_

- [x] 1.4 Write unit test for config module (optional)
  - Test `getApiUrl()` returns correct value
  - Test fallback behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

## 2. React Error Boundaries

- [x] 2.1 Create ErrorBoundary component in @app/ui
  - Create folder `packages/ui/src/components/` if not exists
  - Create `packages/ui/src/components/ErrorBoundary.tsx`
  - Implement class component with getDerivedStateFromError
  - Add componentDidCatch for logging with component stack
  - Create DefaultErrorFallback with Vietnamese text ("Đã xảy ra lỗi") and "Thử lại" button
  - Style using tokens from `@app/shared` for consistency
  - Add JSDoc comment explaining limitations (only catches render errors, not async)
  - Export from `packages/ui/src/index.ts` by adding `export * from './components/ErrorBoundary'`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

- [x] 2.2 Add ErrorBoundary to Admin app
  - Wrap page routes in `admin/src/app/app.tsx` with ErrorBoundary
  - Place ErrorBoundary inside Layout to preserve header/sidebar
  - _Requirements: 2.1, 2.6_

- [x] 2.3 Add ErrorBoundary to Landing app
  - Update `landing/src/app/app.tsx` to wrap routes with ErrorBoundary
  - Keep existing SectionErrorBoundary for section-level errors (more granular)
  - _Requirements: 2.2, 2.6_

## 3. Markdown Content Sanitization

- [x] 3.1 Install rehype-sanitize package
  - Add `rehype-sanitize` to `landing/package.json` dependencies
  - Run `pnpm install` from project root
  - _Requirements: 3.1_

- [x] 3.2 Create sanitization schema
  - Create `landing/src/app/utils/markdown.ts`
  - Define custom sanitization schema with safe tags only
  - Whitelist: h1-h6, p, a, img, ul, ol, li, blockquote, code, pre, strong, em
  - Remove: script, style, iframe, embed, object, form, input, button
  - Allow img attributes: src, alt, title, width, height (no style)
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3.3 Update BlogDetailPage to use sanitization
  - Import sanitizeSchema from utils/markdown
  - Add rehypeSanitize plugin to ReactMarkdown
  - _Requirements: 3.1_

- [x] 3.4 Write property test for markdown sanitization (optional)
  - **Property 2: Markdown Sanitization Removes Dangerous Content**
  - **Property 3: Markdown Sanitization Preserves Safe Content**
  - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## 4. Checkpoint - Ensure all tests pass

- [x] 4.1 Run all tests and fix issues
  - Ensure all tests pass, ask the user if questions arise.

## 5. Correlation-ID Middleware

- [x] 5.1 Create correlation-id middleware
  - Create `api/src/middleware/correlation-id.ts`
  - Implement `generateCorrelationId()` utility function (abstracted for future customization)
  - Implement `correlationId()` middleware
  - Store in Hono context using `c.set('correlationId', id)`
  - Add `X-Correlation-ID` header to response
  - Export `getCorrelationId(c)` helper to retrieve from context
  - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.7_

- [x] 5.2 Create structured logger utility
  - Create `api/src/utils/logger.ts`
  - Implement `createLogger(c?: Context)` function
  - Output structured JSON logs with fields: timestamp, level, message, correlationId, path, method, userId
  - Support debug, info, warn, error levels
  - _Requirements: 4.4, 5.2_

- [x] 5.3 Add correlation-id middleware to API
  - Update `api/src/main.ts` to use correlationId middleware
  - Add `app.use('*', correlationId())` after security headers, before auth middleware
  - Update Hono app type: `Hono<{ Variables: { user?: User; correlationId: string } }>`
  - Verify: All requests should have X-Correlation-ID in response headers
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5.4 Write property test for correlation-id (optional)
  - **Property 4: Correlation-ID Round Trip**
  - Test: request without header → response has valid UUID
  - Test: request with header → response echoes same ID
  - **Validates: Requirements 4.1, 4.2, 4.3**

## 6. Centralized Error Handler

- [x] 6.1 Create error handler middleware
  - Create `api/src/middleware/error-handler.ts`
  - Import and use `createLogger` for structured logging
  - Handle ZodError → 400 with `err.flatten()` details
  - Handle AuthError → status from `error.statusCode` with code and message
  - Handle Prisma P2025 (Record not found) → 404
  - Handle Prisma P2002 (Unique constraint) → 409
  - Include correlationId in all error responses
  - Include stack trace in response only when `NODE_ENV !== 'production'`
  - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [x] 6.2 Add error handler to API
  - Update `api/src/main.ts` to use `app.onError(errorHandler())`
  - Place at the end of file, after all routes are defined
  - DO NOT remove existing try-catch blocks in routes yet (they provide specific error messages)
  - Verify: Throw test error in a route, check response has correlationId
  - _Requirements: 5.1, 5.2_

- [x] 6.3 Write property tests for error handler (optional)
  - **Property 5: Error Response Contains Correlation ID**
  - **Property 6: Zod Validation Error Returns 400**
  - **Property 7: AuthError Returns Correct Status**
  - Test various error types and verify correct status codes
  - **Validates: Requirements 4.5, 5.5, 5.6, 5.7**

## 7. Final Checkpoint - Ensure all tests pass

- [x] 7.1 Run final verification
  - Ensure all tests pass, ask the user if questions arise.

## 8. Update Steering Files

- [x] 8.1 Update react-patterns.md
  - Replace direct `import.meta.env.VITE_API_URL` with `import { API_URL } from '@app/shared'`
  - Add note about centralized config module
  - _Requirements: 1.7_

- [x] 8.2 Update common-mistakes.md
  - Update API_URL example to use `@app/shared`
  - Add section about Error Boundaries
  - _Requirements: 1.7_

- [x] 8.3 Update api-patterns.md
  - Add Correlation-ID middleware pattern
  - Add Centralized Error Handler pattern
  - Add Structured Logging pattern
  - _Requirements: 4.4, 5.2_
