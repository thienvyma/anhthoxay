# Implementation Plan

- [x] 1. Add production startup validation in main.ts






  - [x] 1.1 Create validateProductionConfig function that checks JWT_SECRET

    - Add function at top of main.ts before any initialization
    - Check if NODE_ENV === 'production' and JWT_SECRET is missing or too short
    - Exit with code 1 and clear error message if validation fails
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 1.2 Write property test for JWT validation
    - **Property 4: JWT validation rejects short secrets in production**
    - **Validates: Requirements 3.2**

- [x] 2. Refactor ranking.service.ts to fix N+1 queries





  - [x] 2.1 Add chunkArray helper function


    - Create utility function to split array into chunks of specified size
    - Use CHUNK_SIZE constant of 50
    - _Requirements: 1.2_
  - [x] 2.2 Refactor recalculateAllScores to use batch processing


    - Replace sequential for loop with chunked Promise.all
    - Add structured logger for error handling
    - Continue processing on individual failures
    - _Requirements: 1.1, 1.4_
  - [ ]* 2.3 Write property test for batch processing correctness
    - **Property 1: Batch processing produces same results as sequential**
    - **Validates: Requirements 1.1**
  - [ ]* 2.4 Write property test for error resilience
    - **Property 3: Error resilience in batch processing**
    - **Validates: Requirements 1.4**
  - [x] 2.5 Refactor getMonthlyStats to use aggregated queries


    - Replace per-month loops with single aggregated queries
    - Use Promise.all for parallel data fetching
    - Group results by month in application code
    - _Requirements: 1.3_
  - [ ]* 2.6 Write property test for monthly stats aggregation
    - **Property 2: Monthly stats aggregation correctness**
    - **Validates: Requirements 1.3**

- [x] 3. Replace console.error with structured logger in services






  - [x] 3.1 Update ranking.service.ts to use createLogger

    - Import createLogger from utils/logger
    - Replace all console.error calls with logger.error
    - Include relevant context (contractorId, operation name)
    - _Requirements: 2.1, 2.4_

  - [x] 3.2 Update bid.service.ts to use createLogger

    - Import createLogger from utils/logger
    - Replace all console.error calls with logger.error
    - Include relevant context (bidId, projectId, operation name)
    - _Requirements: 2.2, 2.4_

  - [x] 3.3 Update escrow.service.ts to use createLogger

    - Import createLogger from utils/logger
    - Replace all console.error calls with logger.error
    - Include relevant context (escrowId, projectId, operation name)
    - _Requirements: 2.3, 2.4_


- [x] 4. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.



- [x] 5. Improve error handling consistency




  - [x] 5.1 Ensure bid.service.ts continues on notification failure

    - Verify try-catch blocks around notification calls
    - Add structured logging for notification failures
    - Ensure bid creation returns successfully even if notification fails
    - _Requirements: 4.1, 4.4_
  - [ ]* 5.2 Write property test for bid creation resilience
    - **Property 5: Bid creation succeeds despite notification failure**
    - **Validates: Requirements 4.1**

  - [x] 5.3 Ensure escrow.service.ts continues on scheduling failure

    - Verify try-catch blocks around scheduled notification calls
    - Add structured logging for scheduling failures
    - Ensure escrow creation returns successfully even if scheduling fails
    - _Requirements: 4.2, 4.3, 4.4_
  - [ ]* 5.4 Write property test for escrow creation resilience
    - **Property 6: Escrow creation succeeds despite scheduling failure**
    - **Validates: Requirements 4.2, 4.3**

- [ ] 6. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
