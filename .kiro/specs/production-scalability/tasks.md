# Implementation Plan

## Phase 1: Queue System + Redis Cache (P0 - Critical)

- [x] 1. Set up BullMQ infrastructure








  - [x] 1.1 Install BullMQ and configure Redis connection

    - Add bullmq package to api
    - Create queue configuration with Redis connection
    - Set up default job options (retries, backoff)
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Write property test for queue response time

    - **Property 1: Queue job response time**
    - **Validates: Requirements 1.1**
  - [x] 1.3 Create email queue and worker


    - Define EmailJob interface
    - Create email queue with proper configuration
    - Implement email worker with job processing logic
    - Add logging with correlation ID
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 1.4 Write property test for retry behavior

    - **Property 2: Queue retry with exponential backoff**
    - **Validates: Requirements 1.2**
  - [x] 1.5 Create sync queue for Google Sheets


    - Define SyncJob interface
    - Create sync queue
    - Implement sync worker
    - _Requirements: 1.3_

  - [x] 1.6 Create notification queue


    - Define NotificationJob interface
    - Create notification queue
    - Implement notification worker
    - _Requirements: 1.4_

  - [x] 1.7 Implement Redis fallback for queue

    - Add connection status tracking
    - Implement synchronous fallback when Redis unavailable
    - Add warning logging
    - _Requirements: 1.6_

  - [x] 1.8 Write property test for Redis fallback


    - **Property 3: Queue fallback on Redis failure**
    - **Validates: Requirements 1.6**

- [x] 2. Implement Redis Cache Layer





  - [x] 2.1 Create CacheService class


    - Implement getOrSet method with TTL
    - Implement invalidate method with pattern matching
    - Add connection status tracking
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
  - [x] 2.2 Write property test for cache TTL



    - **Property 4: Cache returns data with correct TTL**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - [x] 2.3 Add cache to service categories endpoint


    - Integrate CacheService with pricing routes
    - Set TTL to 5 minutes
    - _Requirements: 2.1_
  - [x] 2.4 Add cache to materials endpoint


    - Integrate CacheService with materials routes
    - Set TTL to 5 minutes
    - _Requirements: 2.2_
  - [x] 2.5 Add cache to settings endpoint


    - Integrate CacheService with settings routes
    - Set TTL to 1 minute
    - _Requirements: 2.3_
  - [x] 2.6 Add cache to regions endpoint



    - Integrate CacheService with region routes
    - Set TTL to 10 minutes
    - _Requirements: 2.4_
  - [x] 2.7 Implement cache invalidation on admin updates


    - Add invalidation calls to admin update handlers
    - _Requirements: 2.5_
  - [x] 2.8 Write property test for cache invalidation


    - **Property 5: Cache invalidation on modification**
    - **Validates: Requirements 2.5**
  - [x] 2.9 Add X-Cache-Status header middleware


    - Create middleware to add cache status header
    - _Requirements: 2.7, 2.8_
  - [x] 2.10 Write property test for cache status header


    - **Property 6: Cache status header**
    - **Validates: Requirements 2.7, 2.8**

- [x] 3. Checkpoint - Phase 1






  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Security + Reliability (P1 - High)

- [x] 4. Implement Cloudflare Turnstile CAPTCHA





  - [x] 4.1 Create Turnstile verification service




    - Add verifyTurnstile function
    - Handle API errors gracefully
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_
  - [x] 4.2 Create Turnstile middleware


    - Extract token from request body
    - Verify token before processing
    - Return CAPTCHA_FAILED error on failure
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.3 Write property test for CAPTCHA verification


    - **Property 7: CAPTCHA verification required**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  - [x] 4.4 Apply Turnstile to lead submission endpoint


    - Add middleware to /leads POST route
    - _Requirements: 3.1_
  - [x] 4.5 Apply Turnstile to registration endpoint


    - Add middleware to /auth/signup POST route
    - _Requirements: 3.3_
  - [x] 4.6 Create TurnstileWidget component for Landing


    - Install @marsidev/react-turnstile
    - Create reusable widget component
    - _Requirements: 3.5_
  - [x] 4.7 Add TurnstileWidget to quote forms




    - Integrate widget into QuoteCalculatorSection
    - Integrate widget into FurnitureQuoteSection
    - _Requirements: 3.2, 3.5_
  - [x] 4.8 Create TurnstileWidget component for Portal


    - Create widget for Portal app
    - _Requirements: 3.6_
  - [x] 4.9 Add TurnstileWidget to registration form


    - Integrate widget into RegisterPage
    - _Requirements: 3.6_

- [x] 5. Configure Database Connection Pooling
  - [x] 5.1 Update DATABASE_URL with pool settings
    - Add connection_limit=50 and pool_timeout=30
    - _Requirements: 4.1, 4.3_
  - [x] 5.2 Add slow query logging to Prisma
    - Configure Prisma event logging
    - Log queries over 100ms threshold
    - _Requirements: 4.2_
  - [x] 5.3 Write property test for slow query logging
    - **Property 8: Slow query logging**
    - **Validates: Requirements 4.2**
  - [x] 5.4 Add graceful shutdown for Prisma
    - Handle SIGTERM/SIGINT signals
    - Disconnect Prisma client properly
    - _Requirements: 4.4_
  - [x] 5.5 Write property test for connection reuse
    - **Property 9: Connection pool reuse**
    - **Validates: Requirements 4.5**

- [x] 6. Implement Distributed Lock with Redlock
  - [x] 6.1 Install and configure Redlock
    - Add redlock package
    - Create withLock utility function
    - Define LockKeys constants
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  - [x] 6.2 Write property test for lock acquisition
    - **Property 10: Lock acquisition for critical operations**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  - [x] 6.3 Add lock to token refresh
    - Wrap refreshToken with distributed lock
    - _Requirements: 5.1_
  - [x] 6.4 Add lock to ranking recalculation
    - Wrap recalculateRankings with distributed lock
    - _Requirements: 5.2_
  - [x] 6.5 Add lock to Google Sheets sync
    - Wrap sync operations with distributed lock
    - _Requirements: 5.3_
  - [x] 6.6 Implement lock timeout error handling
    - Create LockTimeoutError class
    - Return 503 status on timeout
    - _Requirements: 5.4_
  - [x] 6.7 Write property test for lock timeout
    - **Property 11: Lock timeout error**
    - **Validates: Requirements 5.4**
  - [x] 6.8 Write property test for lock auto-release
    - **Property 12: Lock auto-release on TTL**
    - **Validates: Requirements 5.5**
  - [x] 6.9 Implement Redis unavailable fallback
    - Skip locking when Redis down
    - Log warning
    - _Requirements: 5.6_

- [x] 7. Implement Idempotency Keys
  - [x] 7.1 Create idempotency middleware
    - Check for Idempotency-Key header
    - Cache responses in Redis
    - Return cached response for duplicates
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 7.2 Write property test for duplicate detection
    - **Property 13: Idempotency duplicate detection**
    - **Validates: Requirements 6.1, 6.2**
  - [x] 7.3 Write property test for idempotency TTL
    - **Property 14: Idempotency cache TTL**
    - **Validates: Requirements 6.3, 6.5**
  - [x] 7.4 Apply idempotency to lead submission
    - Add middleware to /leads POST route
    - _Requirements: 6.1_
  - [x] 7.5 Handle requests without idempotency key
    - Process normally without caching
    - _Requirements: 6.4_

- [x] 8. Checkpoint - Phase 2
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Monitoring + Circuit Breaker (P2 - Medium)

- [x] 9. Implement Rate Limit Monitoring





  - [x] 9.1 Add violation logging to rate limiter


    - Log IP, path, timestamp on violation
    - _Requirements: 7.1_
  - [x] 9.2 Write property test for violation logging


    - **Property 15: Rate limit violation logging**
    - **Validates: Requirements 7.1**
  - [x] 9.3 Implement violation tracking in Redis


    - Track violations per IP with 1 hour TTL
    - _Requirements: 7.4_
  - [x] 9.4 Implement alert threshold detection


    - Trigger alert when IP exceeds 10 violations in 5 minutes
    - _Requirements: 7.2_
  - [x] 9.5 Write property test for alert threshold


    - **Property 16: Rate limit alert threshold**
    - **Validates: Requirements 7.2**
  - [x] 9.6 Create rate limit metrics endpoint


    - Return violations per endpoint in last hour
    - _Requirements: 7.3_
  - [x] 9.7 Add rate limit dashboard to Admin Panel




    - Display top violating IPs and endpoints
    - _Requirements: 7.5_

- [x] 10. Implement Circuit Breaker






  - [x] 10.1 Install and configure opossum

    - Add opossum package
    - Create createCircuitBreaker utility
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 10.2 Write property test for circuit breaker

    - **Property 17: Circuit breaker opens on failures**
    - **Validates: Requirements 8.1, 8.2**
  - [x] 10.3 Write property test for half-open state


    - **Property 18: Circuit breaker half-open state**
    - **Validates: Requirements 8.3, 8.4, 8.5**
  - [x] 10.4 Create Google Sheets circuit breaker


    - Configure with 5 failure threshold
    - Set 30 second reset timeout
    - Add fallback response
    - _Requirements: 8.1, 8.2_
  - [x] 10.5 Add circuit state change logging


    - Log service name and new state
    - _Requirements: 8.6_
  - [x] 10.6 Integrate circuit breaker with sync service


    - Wrap Google Sheets calls with breaker
    - _Requirements: 8.1_

- [x] 11. Implement Frontend Debounce










  - [x] 11.1 Create useDebounce hook


    - Implement debounce with configurable delay
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 11.2 Create useDebouncedCallback hook


    - Implement callback debouncing with pending state
    - _Requirements: 9.1, 9.2, 9.4, 9.5_
  - [x] 11.3 Create useThrottle hook


    - Implement throttle with configurable interval
    - _Requirements: 9.3_
  - [x] 11.4 Write property test for debounce timing


    - **Property 19: Debounce timing**
    - **Validates: Requirements 9.1, 9.2, 9.4**

  - [x] 11.5 Apply debounce to area input in QuoteCalculator


    - Use 300ms delay
    - _Requirements: 9.1_

  - [x] 11.6 Apply debounce to search fields

    - Use 500ms delay
    - _Requirements: 9.2_

  - [x] 11.7 Apply throttle to scroll handlers

    - Use 100ms interval
    - _Requirements: 9.3_
  - [x] 11.8 Add loading indicator during debounce


    - Show subtle indicator while pending
    - _Requirements: 9.5_

- [x] 12. Implement LocalStorage Persistence






  - [x] 12.1 Create useLocalStoragePersistence hook


    - Implement save/restore with TTL
    - _Requirements: 10.1, 10.2, 10.4_
  - [x] 12.2 Write property test for persistence round-trip


    - **Property 20: LocalStorage persistence round-trip**
    - **Validates: Requirements 10.1, 10.2**
  - [x] 12.3 Write property test for expiry


    - **Property 21: LocalStorage expiry**
    - **Validates: Requirements 10.4**
  - [x] 12.4 Apply persistence to QuoteCalculator


    - Save selections to localStorage
    - Restore on page load
    - _Requirements: 10.1, 10.2_
  - [x] 12.5 Apply persistence to FurnitureQuote


    - Save selections to localStorage
    - Restore on page load
    - _Requirements: 10.1, 10.2_
  - [x] 12.6 Clear storage on form submission


    - Remove saved state after successful submit
    - _Requirements: 10.3_

  - [x] 12.7 Add Clear Form button

    - Clear localStorage on click
    - _Requirements: 10.5_
  - [x] 12.8 Add restoration toast notification


    - Show toast when restoring saved state
    - _Requirements: 10.6_

- [x] 13. Checkpoint - Phase 3


  - ✅ All tests pass (872 passed, 2 todo)
  - ✅ Lint: 0 errors, 0 warnings
  - ✅ Typecheck: All 5 projects passed

## Phase 4: Validation + Metrics (P3 - Nice to have)

- [ ] 14. Implement Client-side Validation






  - [x] 14.1 Create shared Zod schemas

    - Define phoneSchema, emailSchema, nameSchema
    - Export leadFormSchema
    - _Requirements: 11.2, 11.3, 11.4, 11.7_
  - [x] 14.2 Create useFormValidation hook


    - Implement field validation on blur
    - Track touched state
    - _Requirements: 11.1_
  - [x] 14.3 Write property test for validation errors


    - **Property 22: Field validation error messages**
    - **Validates: Requirements 11.2, 11.3, 11.4**
  - [x] 14.4 Write property test for submit button state


    - **Property 23: Submit button state**
    - **Validates: Requirements 11.5, 11.6**
  - [x] 14.5 Apply validation to quote forms


    - Integrate useFormValidation hook
    - Show error messages on blur
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [x] 14.6 Implement submit button state management


    - Enable only when all fields valid
    - Highlight invalid fields
    - _Requirements: 11.5, 11.6_

- [x] 15. Implement Prometheus Metrics








  - [x] 15.1 Create PrometheusMetrics class

    - Implement metric recording methods
    - Implement toPrometheusFormat method
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6, 12.7_
  - [x] 15.2 Write property test for metrics format


    - **Property 24: Prometheus metrics format**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.5, 12.6, 12.7**
  - [x] 15.3 Create /metrics endpoint


    - Return metrics in Prometheus text format
    - _Requirements: 12.1_
  - [x] 15.4 Add HTTP request metrics middleware


    - Record duration and count
    - _Requirements: 12.2, 12.3_
  - [x] 15.5 Add database query metrics
    - Record query duration
    - _Requirements: 12.4_

  - [x] 15.6 Add cache metrics
    - Record hits and misses
    - _Requirements: 12.5_

  - [x] 15.7 Add queue metrics
    - Record job counts by status
    - _Requirements: 12.6_

  - [x] 15.8 Add rate limit metrics
    - Record exceeded counts
    - _Requirements: 12.7_

- [x] 16. Implement Queue Health Monitoring









  - [x] 16.1 Create QueueHealthService

    - Track queue depth and processing times
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 16.2 Write property test for depth alerting

    - **Property 25: Queue depth alerting**
    - **Validates: Requirements 13.1**
  - [x] 16.3 Write property test for backpressure rejection


    - **Property 26: Queue backpressure rejection**
    - **Validates: Requirements 13.5**
  - [x] 16.4 Implement depth warning alerts


    - Log warning at 1000 jobs
    - _Requirements: 13.1_
  - [x] 16.5 Implement backpressure rejection


    - Reject new jobs at 5000 depth
    - Return QUEUE_FULL error
    - _Requirements: 13.5_
  - [x] 16.6 Create queue status endpoint




    - Return depth, rate, failed count
    - _Requirements: 13.3_

  - [x] 16.7 Implement dead letter queue


    - Move failed jobs after retry limit
    - Send alert
    - _Requirements: 13.6_

- [x] 17. Implement Google Sheets Batch Operations







  - [x] 17.1 Create GoogleSheetsBatchService


    - Implement batch splitting logic
    - _Requirements: 14.1, 14.4_
  - [x] 17.2 Write property test for batch size


    - **Property 27: Google Sheets batch size**
    - **Validates: Requirements 14.1, 14.4**
  - [x] 17.3 Implement batchAppend method


    - Use batchUpdate API
    - _Requirements: 14.2_
  - [x] 17.4 Add retry logic for batch operations


    - Retry up to 3 times with exponential backoff
    - _Requirements: 14.3_
  - [x] 17.5 Add batch progress logging


    - Log batch number and total
    - _Requirements: 14.5_

  - [x] 17.6 Integrate batch service with sync queue



    - Replace individual appends with batch
    - _Requirements: 14.1, 14.2_

- [x] 18. Implement Per-User Rate Limiting
  - [x] 18.1 Create userRateLimiter middleware
    - Track by user ID
    - Apply role multipliers
    - _Requirements: 15.1, 15.3, 15.4_
  - [x] 18.2 Write property test for per-user limiting
    - **Property 28: Per-user rate limiting**
    - **Validates: Requirements 15.1, 15.5**
  - [x] 18.3 Write property test for role-based limits
    - **Property 29: Role-based rate limits**
    - **Validates: Requirements 15.3**
  - [x] 18.4 Add X-RateLimit-User headers
    - Include Limit, Remaining, Reset
    - _Requirements: 15.2_
  - [x] 18.5 Apply to authenticated routes
    - Add middleware after authentication
    - _Requirements: 15.1_
  - [x] 18.6 Configure role-based limits
    - ADMIN: 5x, MANAGER: 3x, others: 1x
    - _Requirements: 15.3, 15.4_

- [x] 19. Final Checkpoint
  - ✅ All tests pass (810 passed, 2 todo)
  - ✅ Lint: 0 errors, 0 warnings
  - ✅ Typecheck: All 5 projects passed
  - ✅ All spec files verified and complete

