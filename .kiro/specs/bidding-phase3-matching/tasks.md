# Implementation Plan

## Bidding Phase 3: Matching & Payment

- [x] 1. Database Schema Updates





  - [x] 1.1 Add Escrow model to Prisma schema


    - Add all fields as defined in design document
    - Add relations to Project, Bid, User (homeowner as depositor)
    - Add releasedAmount field for partial release tracking
    - Add indexes for performance
    - _Requirements: 3.1, 3.2, 3.6, 3.7, 4.1_
  - [x] 1.2 Add ProjectMilestone model to Prisma schema


    - Add all fields: name, percentage, releasePercentage, status
    - Add relations to Escrow, Project
    - Add tracking fields: requestedAt, confirmedAt, disputedAt
    - _Requirements: 15.1, 15.2, 15.3_
  - [x] 1.3 Add FeeTransaction model to Prisma schema


    - Add all fields as defined in design document
    - Add relations to User, Project, Bid
    - Add indexes for performance
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 1.4 Add Notification model to Prisma schema


    - Add all fields as defined in design document
    - Add relation to User
    - Add indexes for performance
    - _Requirements: 14.1, 14.5_
  - [x] 1.5 Update User, Project, Bid models with new relations


    - Add feeTransactions, notifications, escrowsDeposited to User
    - Add escrow, feeTransactions, milestones to Project
    - Add escrow, feeTransactions to Bid

  - [x] 1.6 Generate and push schema

    - Run `pnpm db:generate` and `pnpm db:push`

- [x] 2. Code Generator Updates





  - [x] 2.1 Add escrow and fee code generators


    - Update `api/src/utils/code-generator.ts`
    - Implement `generateEscrowCode(prisma)` → ESC-YYYY-NNN
    - Implement `generateFeeCode(prisma)` → FEE-YYYY-NNN
    - _Requirements: 3.1, 7.1_

- [x] 3. Milestone Service





  - [x] 3.1 Create milestone.schema.ts


    - Create `api/src/schemas/milestone.schema.ts`
    - RequestMilestoneSchema
    - ConfirmMilestoneSchema
    - DisputeMilestoneSchema
    - Export from schemas/index.ts
    - _Requirements: 15.2, 15.3, 15.6_
  - [x] 3.2 Create milestone.service.ts


    - Create `api/src/services/milestone.service.ts`
    - Implement createDefaultMilestones (50%, 100%)
    - Implement requestCompletion (contractor)
    - Implement confirmCompletion (homeowner)
    - Implement disputeMilestone
    - _Requirements: 15.1-15.6_

- [ ] 4. Escrow Service
  - [x] 3.1 Create escrow.schema.ts


    - Create `api/src/schemas/escrow.schema.ts`
    - CreateEscrowSchema (internal use)
    - UpdateEscrowSchema
    - EscrowQuerySchema for listing
    - EscrowActionSchema for admin actions
    - Export from schemas/index.ts
    - _Requirements: 3.2, 5.1_
  - [x] 3.2 Create escrow.service.ts


    - Create `api/src/services/escrow.service.ts`
    - Implement EscrowService class with all methods
    - Implement calculateAmount with min/max constraints
    - Implement status transition validation
    - Create EscrowError class
    - _Requirements: 3.3, 3.4, 3.5, 4.1-4.6, 5.1-5.7_
  - [x] 3.3 Write property tests for escrow service


    - **Property 4: Escrow code uniqueness**
    - **Property 5: Escrow amount calculation**
    - **Property 6: Escrow status transition validity**
    - **Validates: Requirements 3.1, 3.3, 3.4, 3.5, 4.1-4.6**

- [x] 5. Checkpoint - Escrow service tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Fee Service
  - [x] 5.1 Create fee.schema.ts


    - Create `api/src/schemas/fee.schema.ts`
    - CreateFeeSchema (internal use)
    - FeeQuerySchema for listing
    - FeeActionSchema for admin actions
    - Export from schemas/index.ts
    - _Requirements: 7.3, 10.4_
  - [x] 5.2 Create fee.service.ts


    - Create `api/src/services/fee.service.ts`
    - Implement FeeService class with all methods
    - Implement calculateWinFee using BiddingSettings
    - Create FeeError class
    - _Requirements: 6.1, 6.2, 6.3, 7.1-7.6, 10.5_
  - [x] 5.3 Write property tests for fee service


    - **Property 7: Win fee calculation**
    - **Property 8: Fee transaction creation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 7.1-7.6**

- [x] 7. Checkpoint - Fee service tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Match Service








  - [x] 7.1 Create match.schema.ts


    - Create `api/src/schemas/match.schema.ts`
    - SelectBidSchema
    - MatchQuerySchema
    - CancelMatchSchema
    - Export from schemas/index.ts
    - _Requirements: 1.1, 8.1, 8.5_


  - [x] 7.2 Create match.service.ts





    - Create `api/src/services/match.service.ts`
    - Implement MatchService class
    - Implement selectBid with all validations and state transitions
    - Implement getMatchDetails with contact reveal logic
    - Implement startProject, completeProject, cancelMatch


    - Create MatchError class
    - _Requirements: 1.1-1.7, 2.1-2.6, 8.1-8.5, 9.1-9.5, 11.1-11.6_
  - [x] 7.3 Write property tests for match service

    - **Property 1: Bid selection preconditions**
    - **Property 2: Bid selection state transitions**
    - **Property 3: Contact information reveal**
    - **Property 9: Project status transition for matching**
    - **Validates: Requirements 1.1-1.7, 2.1-2.6, 11.1-11.6**

- [x] 9. Checkpoint - Match service tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Dispute Service





  - [x] 10.1 Create dispute.schema.ts


    - Create `api/src/schemas/dispute.schema.ts`
    - RaiseDisputeSchema
    - ResolveDisputeSchema
    - DisputeQuerySchema
    - Export from schemas/index.ts
    - _Requirements: 16.1, 16.2, 16.4_
  - [x] 10.2 Create dispute.service.ts


    - Create `api/src/services/dispute.service.ts`
    - Implement raiseDispute (homeowner or contractor)
    - Implement resolveDispute (admin)
    - Implement listDisputes (admin)
    - _Requirements: 16.1-16.6_

- [ ] 11. Notification Service
  - [x] 9.1 Create notification.schema.ts


    - Create `api/src/schemas/notification.schema.ts`
    - CreateNotificationSchema (internal use)
    - NotificationQuerySchema for listing
    - Export from schemas/index.ts
    - _Requirements: 14.5_
  - [x] 9.2 Create notification.service.ts


    - Create `api/src/services/notification.service.ts`
    - Implement NotificationService class
    - Implement createMatchNotifications for bid selection
    - Implement createEscrowNotification for escrow changes
    - Implement list, markRead, markAllRead
    - _Requirements: 14.1-14.5_

  - [x] 9.3 Write property tests for notification service

    - **Property 10: Match notification creation**
    - **Validates: Requirements 14.1-14.5**

- [x] 12. Checkpoint - Notification service tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Match Routes





  - [x] 11.1 Create homeowner match routes





    - Update `api/src/routes/project.routes.ts`
    - POST `/api/homeowner/projects/:id/select-bid` - Select a bid
    - POST `/api/homeowner/projects/:id/start` - Start project
    - POST `/api/homeowner/projects/:id/complete` - Complete project
    - POST `/api/homeowner/projects/:id/cancel` - Cancel match
    - GET `/api/homeowner/projects/:id/match` - Get match details
    - Auth: authenticate(), requireRole('HOMEOWNER')
    - _Requirements: 8.1-8.5_
  - [x] 11.2 Create contractor match routes









    - Update `api/src/routes/bid.routes.ts`
    - GET `/api/contractor/bids/:id/match` - Get match details
    - Auth: authenticate(), requireRole('CONTRACTOR')
    - _Requirements: 9.1-9.5_

- [x] 14. Milestone Routes








  - [x] 14.1 Create milestone routes


    - Update project.routes.ts and bid.routes.ts
    - POST `/api/contractor/bids/:id/milestone/:milestoneId/request` - Request completion
    - POST `/api/homeowner/projects/:id/milestone/:milestoneId/confirm` - Confirm completion
    - POST `/api/homeowner/projects/:id/milestone/:milestoneId/dispute` - Dispute milestone
    - Auth: authenticate(), requireRole('CONTRACTOR'/'HOMEOWNER')
    - _Requirements: 15.2, 15.3, 15.6_

- [ ] 15. Escrow Routes
  - [x] 12.1 Create admin escrow routes


    - Create `api/src/routes/escrow.routes.ts`
    - GET `/api/admin/escrows` - List escrows
    - GET `/api/admin/escrows/:id` - Get escrow details
    - PUT `/api/admin/escrows/:id/confirm` - Confirm deposit
    - PUT `/api/admin/escrows/:id/release` - Release escrow
    - PUT `/api/admin/escrows/:id/partial` - Partial release
    - PUT `/api/admin/escrows/:id/refund` - Refund escrow
    - PUT `/api/admin/escrows/:id/dispute` - Mark disputed
    - Auth: authenticate(), requireRole('ADMIN')
    - Mount routes in main.ts
    - _Requirements: 5.1-5.7_

- [ ] 16. Fee Routes
  - [x] 13.1 Create admin fee routes


    - Create `api/src/routes/fee.routes.ts`
    - GET `/api/admin/fees` - List fee transactions
    - GET `/api/admin/fees/:id` - Get fee details
    - PUT `/api/admin/fees/:id/paid` - Mark as paid
    - PUT `/api/admin/fees/:id/cancel` - Cancel fee
    - GET `/api/admin/fees/export` - Export CSV
    - Auth: authenticate(), requireRole('ADMIN')
    - Mount routes in main.ts
    - _Requirements: 10.4, 10.5, 13.1-13.5_

- [x] 17. Dispute Routes



  - [x] 17.1 Create dispute routes



    - Create `api/src/routes/dispute.routes.ts`
    - POST `/api/homeowner/projects/:id/dispute` - Raise dispute (homeowner)
    - POST `/api/contractor/bids/:id/dispute` - Raise dispute (contractor)
    - GET `/api/admin/disputes` - List disputes
    - GET `/api/admin/disputes/:id` - Get dispute details
    - PUT `/api/admin/disputes/:id/resolve` - Resolve dispute
    - Auth: authenticate(), requireRole('ADMIN')
    - Mount routes in main.ts
    - _Requirements: 16.1-16.6_

- [ ] 18. Admin Match Routes
  - [x] 14.1 Create admin match routes


    - Create `api/src/routes/match.routes.ts`
    - GET `/api/admin/matches` - List matched projects
    - GET `/api/admin/matches/:projectId` - Get match details
    - PUT `/api/admin/matches/:projectId/cancel` - Cancel match
    - Auth: authenticate(), requireRole('ADMIN')
    - Mount routes in main.ts
    - _Requirements: 10.1-10.3_

- [x] 19. Checkpoint - API routes working





  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Admin API Client






  - [x] 16.1 Add types to admin/types.ts






    - Add Escrow interface
    - Add EscrowListItem interface
    - Add FeeTransaction interface
    - Add FeeListItem interface
    - Add MatchDetails interface
    - Add Notification interface
  - [x] 16.2 Add escrowsApi to admin/api.ts





    - list(params) - Admin list with filters
    - get(id) - Get escrow detail
    - confirm(id) - Confirm deposit
    - release(id, note?) - Release escrow
    - partialRelease(id, amount, note?) - Partial release
    - refund(id, reason) - Refund escrow
    - dispute(id, reason) - Mark disputed
  - [x] 16.3 Add feesApi to admin/api.ts





    - list(params) - Admin list with filters
    - get(id) - Get fee detail
    - markPaid(id) - Mark as paid
    - cancel(id, reason) - Cancel fee
    - exportCsv(params) - Export CSV
  - [x] 16.4 Add matchesApi to admin/api.ts





    - list(params) - List matched projects
    - get(projectId) - Get match details
    - cancel(projectId, reason) - Cancel match

- [x] 21. Admin UI - Matches Page





  - [x] 17.1 Create MatchesPage folder structure


    - Create `admin/src/app/pages/MatchesPage/index.tsx`
    - Create `admin/src/app/pages/MatchesPage/types.ts`
    - _Requirements: 12.1_
  - [x] 17.2 Create MatchTable component


    - Create `admin/src/app/pages/MatchesPage/MatchTable.tsx`
    - Columns: Project Code, Homeowner, Contractor, Escrow Status, Fee Status, Actions
    - Status badges with colors
    - Actions: View, Manage Escrow
    - _Requirements: 12.1_
  - [x] 17.3 Create MatchDetailModal component


    - Create `admin/src/app/pages/MatchesPage/MatchDetailModal.tsx`
    - Display full match information
    - Display homeowner contact info
    - Display contractor contact info
    - Display escrow details
    - Display fee details
    - _Requirements: 12.3_
  - [x] 17.4 Create EscrowActionModal component


    - Create `admin/src/app/pages/MatchesPage/EscrowActionModal.tsx`
    - Options: Confirm, Release, Partial Release, Refund, Dispute
    - Form for amount (partial) and reason
    - _Requirements: 12.4, 12.5_
  - [x] 17.5 Implement main MatchesPage

    - Filter by escrow status, date range
    - Pagination
    - Load data from API
    - Handle escrow actions
    - _Requirements: 12.1, 12.2_
  - [x] 17.6 Add route and menu item


    - Add `/matches` route to admin app
    - Add "Quản lý Match" menu item to Layout

- [x] 22. Admin UI - Fees Page










  - [x] 18.1 Create FeesPage folder structure



    - Create `admin/src/app/pages/FeesPage/index.tsx`
    - Create `admin/src/app/pages/FeesPage/types.ts`
    - _Requirements: 13.1_
  - [x] 18.2 Create FeeTable component



    - Create `admin/src/app/pages/FeesPage/FeeTable.tsx`
    - Columns: Code, Contractor, Type, Amount, Status, Actions
    - Status badges with colors
    - Actions: View, Mark Paid
    - _Requirements: 13.1_
  - [x] 18.3 Create FeeDetailModal component



    - Create `admin/src/app/pages/FeesPage/FeeDetailModal.tsx`
    - Display full fee information
    - Display related project and bid
    - Display contractor info
    - _Requirements: 13.3_
  - [x] 18.4 Implement main FeesPage


    - Filter by status, type, date range
    - Search by code
    - Pagination
    - Export CSV button
    - Handle mark paid action
    - _Requirements: 13.1, 13.2, 13.4, 13.5_
  - [x] 18.5 Add route and menu item



    - Add `/fees` route to admin app
    - Add "Quản lý Phí" menu item to Layout

- [x] 23. Admin UI - Disputes Page





  - [x] 23.1 Create DisputesPage folder structure


    - Create `admin/src/app/pages/DisputesPage/index.tsx`
    - Create `admin/src/app/pages/DisputesPage/types.ts`
    - _Requirements: 16.3_
  - [x] 23.2 Create DisputeTable component


    - Create `admin/src/app/pages/DisputesPage/DisputeTable.tsx`
    - Columns: Project, Raised By, Reason, Status, Actions
    - Status badges with colors
    - Actions: View, Resolve


  - [x] 23.3 Create DisputeDetailModal component
    - Create `admin/src/app/pages/DisputesPage/DisputeDetailModal.tsx`
    - Display full dispute information
    - Display project, bid, escrow details
    - Display both party contact info
    - _Requirements: 16.3_
  - [x] 23.4 Create ResolveDisputeModal component


    - Create `admin/src/app/pages/DisputesPage/ResolveDisputeModal.tsx`
    - Options: Refund to homeowner, Release to contractor
    - Form for resolution note

    - _Requirements: 16.4, 16.5_
  - [x] 23.5 Implement main DisputesPage
    - Filter by status
    - Pagination
    - Load data from API
    - Handle resolve actions
  - [x] 23.6 Add route and menu item

    - Add `/disputes` route to admin app
    - Add "Quản lý Tranh chấp" menu item to Layout

- [x] 24. Checkpoint - Admin UI working





  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Update Documentation

  - [x] 20.1 Update security-checklist.md


    - Add Match routes to Protected Routes Registry
    - Add Escrow routes to Protected Routes Registry
    - Add Fee routes to Protected Routes Registry
    - Document Homeowner and Contractor match access
  - [x] 20.2 Update api-patterns.md


    - Add match.routes.ts, escrow.routes.ts, fee.routes.ts to file structure
    - Add match.service.ts, escrow.service.ts, fee.service.ts
    - Add match.schema.ts, escrow.schema.ts, fee.schema.ts
  - [x] 20.3 Update ath-business-logic.md


    - Add Escrow data model
    - Add FeeTransaction data model
    - Add Escrow status flow
    - Add Match flow description

- [x] 26. Final Checkpoint - All tests passing





  - Ensure all tests pass, ask the user if questions arise.
  - Run `pnpm nx run-many --target=lint --all`
  - Run `pnpm nx run-many --target=typecheck --all`
  - Run `pnpm nx run-many --target=test --all`
  - Update DAILY_CHANGELOG.md with all created/modified files

---

## Summary

| Task | Priority | Estimate | Status |
|------|----------|----------|--------|
| 1. Database Schema | HIGH | 1.5h | ⬜ |
| 2. Code Generator | HIGH | 30m | ⬜ |
| 3. Milestone Service | HIGH | 1.5h | ⬜ |
| 4. Escrow Service | HIGH | 2h | ⬜ |
| 5. Checkpoint | - | - | ⬜ |
| 6. Fee Service | HIGH | 1.5h | ⬜ |
| 7. Checkpoint | - | - | ⬜ |
| 8. Match Service | HIGH | 3h | ⬜ |
| 9. Checkpoint | - | - | ⬜ |
| 10. Dispute Service | HIGH | 1.5h | ⬜ |
| 11. Notification Service | MEDIUM | 1.5h | ⬜ |
| 12. Checkpoint | - | - | ⬜ |
| 13. Match Routes | HIGH | 1.5h | ⬜ |
| 14. Milestone Routes | HIGH | 1h | ⬜ |
| 15. Escrow Routes | HIGH | 1h | ⬜ |
| 16. Fee Routes | HIGH | 1h | ⬜ |
| 17. Dispute Routes | HIGH | 1h | ⬜ |
| 18. Admin Match Routes | MEDIUM | 30m | ⬜ |
| 19. Checkpoint | - | - | ⬜ |
| 20. Admin API Client | MEDIUM | 1.5h | ⬜ |
| 21. Admin UI - Matches | HIGH | 3h | ⬜ |
| 22. Admin UI - Fees | MEDIUM | 2h | ⬜ |
| 23. Admin UI - Disputes | HIGH | 2.5h | ⬜ |
| 24. Checkpoint | - | - | ⬜ |
| 25. Update Documentation | HIGH | 30m | ⬜ |
| 26. Final Checkpoint | HIGH | 1h | ⬜ |

**Total Estimate: ~28-32 hours (4-5 days)**

---

## Notes

### Coding Standards
- Follow existing project patterns in api/src/routes/, api/src/services/, api/src/schemas/
- Use Zod for validation schemas
- Use successResponse/errorResponse from utils/response.ts
- Follow folder structure pattern for complex Admin pages
- Fix errors at root cause, not temporary bypasses

### Dependencies from Phase 1 & 2
- ✅ User roles: HOMEOWNER, CONTRACTOR
- ✅ ContractorProfile with verificationStatus
- ✅ Project model with status flow
- ✅ Bid model with status flow
- ✅ BiddingSettings (escrowPercentage, winFeePercentage)
- ✅ ServiceFee (WIN_FEE configuration)

### Security Notes
- Homeowner can only select bids on their own projects
- Contractor can only view match details for their selected bids
- Contact info only revealed after MATCHED status
- Admin required for all escrow and fee management actions

### Business Logic Notes
- Escrow amount = max(bidPrice * escrowPercentage%, escrowMinAmount)
- Win fee = bidPrice * winFeePercentage%
- All other APPROVED bids become NOT_SELECTED when one is selected
- Escrow and FeeTransaction created atomically with bid selection

