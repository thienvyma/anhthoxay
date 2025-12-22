# 🏗️ Bidding Marketplace - Phase 1: Foundation - Implementation Plan

## Overview
Phase 1 thiết lập nền tảng cho hệ thống đấu giá, ước tính 3-4 ngày làm việc.

---

## Day 1: Database & Auth

- [x] 1. Database Schema Updates





  - [x] 1.1 Update Prisma Schema với User model extension


    - Thêm fields: phone, avatar, companyName, businessLicense, taxCode, verificationStatus, verifiedAt, verificationNote, rating, totalProjects
    - _Requirements: REQ-1.2_
  - [x] 1.2 Tạo model ContractorProfile


    - Fields: description, experience, specialties, serviceAreas, portfolioImages, certificates, idCardFront, idCardBack, businessLicenseImage, submittedAt
    - Relation 1-1 với User
    - _Requirements: REQ-1.3_
  - [x] 1.3 Tạo model Region với self-referencing relation


    - Fields: name, slug, parentId, level, isActive, order
    - Self-referencing relation cho hierarchy
    - _Requirements: REQ-3.1_
  - [x] 1.4 Tạo model BiddingSettings (singleton)


    - Fields: maxBidsPerProject, defaultBidDuration, minBidDuration, maxBidDuration, escrowPercentage, escrowMinAmount, escrowMaxAmount, verificationFee, winFeePercentage, autoApproveHomeowner, autoApproveProject
    - _Requirements: REQ-4.1_
  - [x] 1.5 Tạo model ServiceFee

    - Fields: name, code, type, value, description, isActive
    - _Requirements: REQ-5.1_
  - [x] 1.6 Chạy db:generate và db:push


    - `pnpm db:generate` và `pnpm db:push`

- [x] 2. Seed Data Script





  - [x] 2.1 Tạo file seed-bidding.ts


    - Tạo `infra/prisma/seed-bidding.ts`
  - [x] 2.2 Seed regions cho TP.HCM

    - Seed 10+ quận/huyện
    - _Requirements: REQ-3.3_
  - [x] 2.3 Seed default BiddingSettings và ServiceFees

    - Default settings và fees theo design
    - _Requirements: REQ-4.1, REQ-5.1_
  - [x] 2.4 Thêm script vào package.json


    - Script `db:seed-bidding`

- [x] 3. Update Auth & Role System





  - [x] 3.1 Update Role Hierarchy


    - Thêm CONTRACTOR, HOMEOWNER vào Role type
    - Update ROLE_HIERARCHY trong auth.middleware.ts
    - Update JWTPayload type
    - _Requirements: REQ-1.1_
  - [x] 3.2 Update Registration Flow


    - Thêm `accountType` param vào register schema
    - Update auth.service.ts để handle accountType
    - Homeowner: auto-approve, role = HOMEOWNER
    - Contractor: verificationStatus = PENDING, role = CONTRACTOR
    - _Requirements: REQ-1.4_


  - [x] 3.3 Update auth.schema.ts với accountType

    - Export types
    - _Requirements: REQ-1.4_

- [x] 4. Checkpoint - Day 1





  - Ensure all tests pass, ask the user if questions arise.

---

## Day 2: APIs


- [x] 5. Contractor Profile API




  - [x] 5.1 Tạo contractor.schema.ts


    - CreateContractorProfileSchema, UpdateContractorProfileSchema
    - Export từ index.ts
    - _Requirements: REQ-2.3_
  - [x] 5.2 Tạo contractor.service.ts


    - getProfile(userId), createOrUpdateProfile(userId, data), submitVerification(userId), listPendingContractors(query), verifyContractor(id, status, note)
    - _Requirements: REQ-2.1, REQ-2.2_
  - [x] 5.3 Tạo contractor.routes.ts


    - GET /api/contractor/profile (CONTRACTOR)
    - PUT /api/contractor/profile (CONTRACTOR)
    - POST /api/contractor/submit-verification (CONTRACTOR)
    - GET /api/admin/contractors (ADMIN)
    - GET /api/admin/contractors/:id (ADMIN)
    - PUT /api/admin/contractors/:id/verify (ADMIN)
    - Mount routes trong main.ts
    - _Requirements: REQ-2.2_

- [x] 6. Region Management API





  - [x] 6.1 Tạo region.schema.ts


    - CreateRegionSchema, UpdateRegionSchema, RegionQuerySchema
    - _Requirements: REQ-3.2_
  - [x] 6.2 Tạo region.service.ts


    - getAll(flat, parentId), getById(id), create(data), update(id, data), delete(id), buildTree(regions)
    - _Requirements: REQ-3.2_
  - [x] 6.3 Tạo region.routes.ts


    - GET /api/regions (Public)
    - GET /api/regions/:id (Public)
    - POST /api/admin/regions (ADMIN)
    - PUT /api/admin/regions/:id (ADMIN)
    - DELETE /api/admin/regions/:id (ADMIN)
    - Mount routes trong main.ts
    - _Requirements: REQ-3.2_

- [x] 7. Bidding Settings API





  - [x] 7.1 Tạo bidding-settings.schema.ts


    - UpdateBiddingSettingsSchema
    - _Requirements: REQ-4.2_
  - [x] 7.2 Tạo bidding-settings.service.ts


    - get(), getPublic(), update(data)
    - _Requirements: REQ-4.2_
  - [x] 7.3 Tạo bidding-settings.routes.ts


    - GET /api/settings/bidding (Public)
    - GET /api/admin/settings/bidding (ADMIN)
    - PUT /api/admin/settings/bidding (ADMIN)
    - Mount routes trong main.ts
    - _Requirements: REQ-4.2_

- [x] 8. Service Fee API





  - [x] 8.1 Tạo service-fee.schema.ts


    - CreateServiceFeeSchema, UpdateServiceFeeSchema
    - _Requirements: REQ-5.2_
  - [x] 8.2 Tạo service-fee.service.ts


    - list(activeOnly), getById(id), getByCode(code), create(data), update(id, data), delete(id)
    - _Requirements: REQ-5.2_
  - [x] 8.3 Tạo service-fee.routes.ts


    - GET /api/service-fees (Public)
    - POST /api/admin/service-fees (ADMIN)
    - PUT /api/admin/service-fees/:id (ADMIN)
    - DELETE /api/admin/service-fees/:id (ADMIN)
    - Mount routes trong main.ts
    - _Requirements: REQ-5.2_

- [x] 9. Checkpoint - Day 2





  - Ensure all tests pass, ask the user if questions arise.

---

## Day 3: Admin UI - Main Pages

- [x] 10. Admin UI - Contractors Page





  - [x] 10.1 Tạo ContractorsPage.tsx


    - Tabs: Chờ duyệt | Đã xác minh | Bị từ chối
    - Table với pagination
    - View profile modal
    - Approve/Reject actions với confirmation
    - _Requirements: REQ-2.1_
  - [x] 10.2 Update Admin API Client


    - Thêm contractorsApi vào admin/src/app/api.ts
    - list, get, verify methods
  - [x] 10.3 Update Admin Types và Layout


    - Thêm Contractor, ContractorProfile types
    - Thêm menu item "Quản lý Nhà thầu"
    - Thêm route /contractors

- [x] 11. Admin UI - Regions Page





  - [x] 11.1 Tạo RegionsPage.tsx


    - Tree view với expand/collapse
    - Add/Edit region modal
    - Toggle active status
    - Delete with confirmation
    - _Requirements: REQ-3.4_
  - [x] 11.2 Update Admin API Client


    - Thêm regionsApi vào admin/src/app/api.ts

  - [x] 11.3 Update Admin Types và Layout

    - Thêm Region type
    - Thêm menu item "Quản lý Khu vực"
    - Thêm route /regions

- [x] 12. Checkpoint - Day 3




  - Ensure all tests pass, ask the user if questions arise.

---

## Day 4: Admin UI - Settings & Final

- [x] 13. Admin UI - Bidding Settings Tab





  - [x] 13.1 Tạo BiddingTab.tsx


    - Form với các fields từ BiddingSettings
    - Validation
    - Save functionality
    - _Requirements: REQ-4.3_
  - [x] 13.2 Update SettingsPage


    - Thêm tab "Cấu hình Đấu giá"
    - Import BiddingTab
  - [x] 13.3 Update Admin API Client


    - Thêm biddingSettingsApi vào admin/src/app/api.ts

- [x] 14. Admin UI - Service Fees Tab





  - [x] 14.1 Tạo ServiceFeesTab.tsx


    - Table với CRUD
    - Add/Edit modal
    - Toggle active status
    - _Requirements: REQ-5.2_
  - [x] 14.2 Update SettingsPage


    - Thêm tab "Phí dịch vụ"
  - [x] 14.3 Update Admin API Client


    - Thêm serviceFeesApi vào admin/src/app/api.ts

- [x] 15. Update Steering Files





  - [x] 15.1 Cập nhật security-checklist.md


    - Thêm các routes mới vào Protected Routes Registry
    - _Requirements: NFR-1_
  - [x] 15.2 Cập nhật api-patterns.md


    - Thêm file structure mới
  - [x] 15.3 Cập nhật ath-business-logic.md


    - Thêm roles mới: CONTRACTOR, HOMEOWNER

- [x] 16. Testing & Verification





  - [x] 16.1 Chạy lint và typecheck


    - `pnpm nx run-many --target=lint --all`
    - `pnpm nx run-many --target=typecheck --all`
  - [x] 16.2 Chạy tests


    - `pnpm nx run-many --target=test --all`
  - [x] 16.3 Cập nhật DAILY_CHANGELOG.md


    - Ghi lại tất cả files đã tạo/sửa

---

## Summary

| Task | Priority | Estimate | Status |
|------|----------|----------|--------|
| 1. Database Schema | HIGH | 2-3h | ⬜ |
| 2. Seed Data | HIGH | 1h | ⬜ |
| 3. Auth & Role System | HIGH | 2h | ⬜ |
| 5. Contractor Profile API | HIGH | 2h | ⬜ |
| 6. Region Management API | MEDIUM | 2h | ⬜ |
| 7. Bidding Settings API | MEDIUM | 1h | ⬜ |
| 8. Service Fee API | LOW | 1h | ⬜ |
| 10. Admin UI - Contractors | HIGH | 3h | ⬜ |
| 11. Admin UI - Regions | MEDIUM | 3h | ⬜ |
| 13. Admin UI - Bidding Settings | MEDIUM | 2h | ⬜ |
| 14. Admin UI - Service Fees | LOW | 2h | ⬜ |
| 15. Update Steering | HIGH | 30m | ⬜ |
| 16. Testing | HIGH | 1h | ⬜ |

**Total Estimate: 22-26 hours (3-4 days)**
