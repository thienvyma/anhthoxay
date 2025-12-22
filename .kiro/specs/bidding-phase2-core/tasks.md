# Implementation Plan

## Bidding Phase 2: Core Bidding System

- [x] 1. Database Schema Updates





  - [x] 1.1 Add Project model to Prisma schema


    - Add all fields as defined in design document
    - Add relations to User, ServiceCategory, Region
    - Add indexes for performance
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 1.2 Add Bid model to Prisma schema

    - Add all fields as defined in design document
    - Add relations to Project, User
    - Add unique constraint [projectId, contractorId]
    - Add indexes for performance
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 1.3 Update User model with new relations

    - Add `ownedProjects Project[] @relation("ProjectOwner")`
    - Add `contractorBids Bid[] @relation("ContractorBids")`

  - [x] 1.4 Update ServiceCategory and Region models

    - Add `projects Project[]` relation to both models
  - [x] 1.5 Generate and push schema


    - Run `pnpm db:generate` and `pnpm db:push`

- [x] 2. Code Generator Utility












  - [x] 2.1 Create code-generator.ts



    - Create `api/src/utils/code-generator.ts`
    - Implement `generateProjectCode(prisma)` → PRJ-YYYY-NNN
    - Implement `generateBidCode(prisma)` → BID-YYYY-NNN
    - Handle concurrent generation safely
    - _Requirements: 1.1, 6.1_

- [x] 3. Project Service





  - [x] 3.1 Create project.schema.ts


    - Create `api/src/schemas/project.schema.ts`
    - CreateProjectSchema with validation
    - UpdateProjectSchema
    - SubmitProjectSchema (bidDeadline)
    - ProjectQuerySchema for listing
    - ProjectReviewSchema for admin
    - Export from schemas/index.ts
    - _Requirements: 1.3, 3.1, 3.3, 4.3, 4.4_
  - [x] 3.2 Create project.service.ts


    - Create `api/src/services/project.service.ts`
    - Implement ProjectService class with all methods
    - Implement status transition validation
    - Implement access control checks
    - Create ProjectError class
    - _Requirements: 2.1-2.6, 3.1-3.6, 4.1-4.5, 5.1-5.5_
  - [x] 3.3 Write property tests for project service






    - **Property 1: Project code uniqueness**
    - **Property 2: Project status transition validity**
    - **Property 3: Project owner access control**
    - **Property 4: Public project information hiding**
    - **Validates: Requirements 1.1, 2.1-2.6, 3.2, 3.4, 3.5, 5.2, 12.1, 12.2**

- [x] 4. Checkpoint - Project service tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Bid Service





  - [x] 5.1 Create bid.schema.ts


    - Create `api/src/schemas/bid.schema.ts`
    - CreateBidSchema with validation
    - UpdateBidSchema
    - BidQuerySchema for listing
    - BidReviewSchema for admin
    - Export from schemas/index.ts
    - _Requirements: 6.3, 7.1-7.7, 8.3, 8.4_
  - [x] 5.2 Create bid.service.ts


    - Create `api/src/services/bid.service.ts`
    - Implement BidService class with all methods
    - Implement contractor verification check
    - Implement project state validation
    - Implement bid anonymization for homeowner view
    - Create BidError class
    - _Requirements: 6.1-6.6, 7.1-7.7, 8.1-8.5, 9.1-9.5_
  - [x] 5.3 Write property tests for bid service






    - **Property 5: Bid code uniqueness**
    - **Property 6: Bid contractor uniqueness per project**
    - **Property 7: Bid creation validation**
    - **Property 8: Homeowner bid view anonymization**
    - **Validates: Requirements 6.1, 6.5, 7.1-7.5, 9.2, 12.3**

- [x] 6. Checkpoint - Bid service tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Project Routes



  - [x] 7.1 Create public project routes


    - Create `api/src/routes/project.routes.ts`
    - Implement `createPublicProjectRoutes(prisma)`
    - GET `/api/projects` - List open projects
    - GET `/api/projects/:id` - Get project detail (limited)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.2 Create homeowner project routes
    - Implement `createHomeownerProjectRoutes(prisma)`
    - POST `/api/homeowner/projects` - Create project
    - GET `/api/homeowner/projects` - List my projects
    - GET `/api/homeowner/projects/:id` - Get my project detail
    - PUT `/api/homeowner/projects/:id` - Update project
    - POST `/api/homeowner/projects/:id/submit` - Submit for approval
    - DELETE `/api/homeowner/projects/:id` - Delete project
    - GET `/api/homeowner/projects/:id/bids` - View approved bids
    - Auth: authenticate(), requireRole('HOMEOWNER')
    - _Requirements: 3.1-3.6, 9.1-9.5_
  - [x] 7.3 Create admin project routes

    - Implement `createAdminProjectRoutes(prisma)`
    - GET `/api/admin/projects` - List all projects
    - GET `/api/admin/projects/:id` - Get project detail
    - PUT `/api/admin/projects/:id/approve` - Approve project
    - PUT `/api/admin/projects/:id/reject` - Reject project
    - Auth: authenticate(), requireRole('ADMIN')
    - _Requirements: 4.1-4.5_

  - [x] 7.4 Mount project routes in main.ts


    - Mount `/api/projects` → public routes
    - Mount `/api/homeowner/projects` → homeowner routes
    - Mount `/api/admin/projects` → admin routes

- [x] 8. Bid Routes







  - [x] 8.1 Create contractor bid routes


    - Create `api/src/routes/bid.routes.ts`
    - Implement `createContractorBidRoutes(prisma)`
    - POST `/api/contractor/bids` - Create bid
    - GET `/api/contractor/bids` - List my bids
    - GET `/api/contractor/bids/:id` - Get my bid detail
    - PUT `/api/contractor/bids/:id` - Update bid
    - DELETE `/api/contractor/bids/:id` - Withdraw bid
    - Auth: authenticate(), requireRole('CONTRACTOR')
    - _Requirements: 7.1-7.7_

  - [x] 8.2 Create admin bid routes


    - Implement `createAdminBidRoutes(prisma)`
    - GET `/api/admin/bids` - List all bids
    - GET `/api/admin/bids/:id` - Get bid detail
    - PUT `/api/admin/bids/:id/approve` - Approve bid
    - PUT `/api/admin/bids/:id/reject` - Reject bid
    - Auth: authenticate(), requireRole('ADMIN')
    - _Requirements: 8.1-8.5_

  - [x] 8.3 Mount bid routes in main.ts




    - Mount `/api/contractor/bids` → contractor routes
    - Mount `/api/admin/bids` → admin routes

- [x] 9. Checkpoint - API routes working





  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Admin API Client





  - [x] 10.1 Add types to admin/types.ts


    - Add Project interface
    - Add ProjectListItem interface
    - Add Bid interface
    - Add BidListItem interface


  - [x] 10.2 Add projectsApi to admin/api.ts








    - list(params) - Admin list with filters
    - get(id) - Get project detail


    - approve(id, note?) - Approve project
    - reject(id, note) - Reject project
  - [x] 10.3 Add bidsApi to admin/api.ts





    - list(params) - Admin list with filters
    - get(id) - Get bid detail
    - approve(id, note?) - Approve bid
    - reject(id, note) - Reject bid

- [x] 11. Admin UI - Projects Page





  - [x] 11.1 Create ProjectsPage folder structure


    - Create `admin/src/app/pages/ProjectsPage/index.tsx`
    - Create `admin/src/app/pages/ProjectsPage/types.ts`
    - _Requirements: 10.1_
  - [x] 11.2 Create ProjectTable component


    - Create `admin/src/app/pages/ProjectsPage/ProjectTable.tsx`
    - Columns: Code, Title, Owner, Region, Category, Status, Bids, Actions
    - Status badges with colors
    - Actions: View, Approve (PENDING), Reject (PENDING)
    - _Requirements: 10.1, 10.6_
  - [x] 11.3 Create ProjectDetailModal component


    - Create `admin/src/app/pages/ProjectsPage/ProjectDetailModal.tsx`
    - Display full project information
    - Display owner information
    - Display bids count and list
    - _Requirements: 10.4_
  - [x] 11.4 Create ApprovalModal component


    - Create `admin/src/app/pages/ProjectsPage/ApprovalModal.tsx`
    - Form for approve/reject with optional note
    - Confirmation before action
    - _Requirements: 10.5, 10.6_
  - [x] 11.5 Implement main ProjectsPage

    - Search by code and title
    - Filter by status, region, category
    - Pagination
    - Load data from API
    - Handle approve/reject actions
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 11.6 Add route and menu item


    - Add `/projects` route to admin app
    - Add "Quản lý Công trình" menu item to Layout

- [x] 12. Admin UI - Bids Page








  - [x] 12.1 Create BidsPage folder structure


    - Create `admin/src/app/pages/BidsPage/index.tsx`
    - Create `admin/src/app/pages/BidsPage/types.ts`
    - _Requirements: 11.1_
  - [x] 12.2 Create BidTable component


    - Create `admin/src/app/pages/BidsPage/BidTable.tsx`
    - Columns: Code, Project, Contractor, Price, Timeline, Status, Actions
    - Status badges with colors
    - Actions: View, Approve (PENDING), Reject (PENDING)
    - _Requirements: 11.1, 11.6_
  - [x] 12.3 Create BidDetailModal component


    - Create `admin/src/app/pages/BidsPage/BidDetailModal.tsx`
    - Display full bid information
    - Display contractor profile (rating, totalProjects)
    - Display attachments
    - Display project info
    - _Requirements: 11.4_
  - [x] 12.4 Create ApprovalModal component


    - Create `admin/src/app/pages/BidsPage/ApprovalModal.tsx`
    - Form for approve/reject with optional note
    - Confirmation before action
    - _Requirements: 11.5, 11.6_
  - [x] 12.5 Implement main BidsPage

    - Search by code
    - Filter by status, project
    - Pagination
    - Load data from API
    - Handle approve/reject actions
    - _Requirements: 11.1, 11.2, 11.3_
  - [x] 12.6 Add route and menu item


    - Add `/bids` route to admin app
    - Add "Quản lý Bid" menu item to Layout

- [x] 13. Checkpoint - Admin UI working





  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Update Documentation








  - [x] 14.1 Update security-checklist.md


    - Add Project routes to Protected Routes Registry
    - Add Bid routes to Protected Routes Registry
    - Document Homeowner and Contractor route access
  - [x] 14.2 Update api-patterns.md


    - Add project.routes.ts, bid.routes.ts to file structure
    - Add project.service.ts, bid.service.ts
    - Add project.schema.ts, bid.schema.ts
  - [x] 14.3 Update ath-business-logic.md


    - Add Project data model
    - Add Bid data model
    - Add Project status flow
    - Add Bid status flow

- [x] 15. Final Checkpoint - All tests passing





  - Ensure all tests pass, ask the user if questions arise.
  - Run `pnpm nx run-many --target=lint --all`
  - Run `pnpm nx run-many --target=typecheck --all`
  - Run `pnpm nx run-many --target=test --all`
  - Update DAILY_CHANGELOG.md with all created/modified files

---

## Summary

| Task | Priority | Estimate | Status |
|------|----------|----------|--------|
| 1. Database Schema | HIGH | 1h | ⬜ |
| 2. Code Generator | HIGH | 30m | ⬜ |
| 3. Project Service | HIGH | 2h | ⬜ |
| 4. Checkpoint | - | - | ⬜ |
| 5. Bid Service | HIGH | 2h | ⬜ |
| 6. Checkpoint | - | - | ⬜ |
| 7. Project Routes | HIGH | 2h | ⬜ |
| 8. Bid Routes | HIGH | 1.5h | ⬜ |
| 9. Checkpoint | - | - | ⬜ |
| 10. Admin API Client | MEDIUM | 1h | ⬜ |
| 11. Admin UI - Projects | HIGH | 3h | ⬜ |
| 12. Admin UI - Bids | HIGH | 2.5h | ⬜ |
| 13. Checkpoint | - | - | ⬜ |
| 14. Update Documentation | HIGH | 30m | ⬜ |
| 15. Final Checkpoint | HIGH | 1h | ⬜ |

**Total Estimate: ~17-19 hours (2-3 days)**

---

## Notes

### Coding Standards
- Follow existing project patterns in api/src/routes/, api/src/services/, api/src/schemas/
- Use Zod for validation schemas
- Use successResponse/errorResponse from utils/response.ts
- Follow folder structure pattern for complex Admin pages (like ContractorsPage/, RegionsPage/)
- Fix errors at root cause, not temporary bypasses

### Dependencies from Phase 1
- ✅ User roles: HOMEOWNER, CONTRACTOR
- ✅ ContractorProfile with verificationStatus
- ✅ Region management
- ✅ ServiceCategory
- ✅ BiddingSettings (maxBids, bidDuration)

### Security Notes
- Homeowner can only access their own projects
- Contractor can only access their own bids
- Contractor must be VERIFIED to create bids
- Address and contact info hidden until match (Phase 3)
