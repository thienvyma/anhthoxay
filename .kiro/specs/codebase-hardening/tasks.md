# Implementation Plan - Codebase Hardening

## Overview

Kế hoạch kiểm tra toàn diện code từ Bidding Phase 1-6, chia thành các giai đoạn:
1. **Audit**: Chạy lint/typecheck/test để phát hiện lỗi
2. **Fix**: Sửa tất cả lỗi từ gốc
3. **Property Tests**: Verify và fix property tests
4. **Documentation**: Cập nhật steering files

---

## Phase A: Initial Audit & Fix

- [x] 1. Run Full Audit and Fix API Layer


  - [x] 1.1 Run lint/typecheck/test audit


    - Execute `pnpm nx run-many --target=lint --all`
    - Execute `pnpm nx run-many --target=typecheck --all`
    - Execute `pnpm nx run-many --target=test --all`
    - Document all errors found
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Fix API lint and type errors


    - Fix all errors in `api/src/routes/`, `api/src/services/`, `api/src/schemas/`
    - Fix import order, unused variables, any types
    - Ensure schemas exported from index.ts
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 4.1_
  - [x] 1.3 Verify API security compliance


    - Verify all `/admin/*` routes have authenticate() + requireRole('ADMIN')
    - Verify all `/contractor/*` routes have authenticate() + requireRole('CONTRACTOR')
    - Verify all `/homeowner/*` routes have authenticate() + requireRole('HOMEOWNER')
    - Verify public POST routes have rate limiting
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 1.4 Write property test for API file structure compliance
    - **Property 1: API File Structure Compliance**
    - **Property 2: Service File Structure Compliance**
    - **Property 3: Schema File Structure Compliance**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  - [ ]* 1.5 Write property test for API route authentication
    - **Property 4: Admin Route Authentication**
    - **Property 5: Contractor Route Authentication**
    - **Property 6: Homeowner Route Authentication**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 2. Checkpoint - API Layer



  - Ensure all API tests pass, ask the user if questions arise.

---

## Phase B: Frontend Fixes

- [x] 3. Fix Admin UI






  - [x] 3.1 Fix Admin lint and type errors

    - Fix all errors in `admin/src/app/pages/`, `admin/src/app/components/`
    - Fix import order, unused variables, any types
    - _Requirements: 1.1, 1.2, 3.1_

  - [x] 3.2 Verify Admin UI completeness

    - Verify ContractorsPage, RegionsPage, ProjectsPage, BidsPage working
    - Verify MatchesPage, FeesPage, DisputesPage working
    - Verify ChatPage, NotificationTemplatesPage, SettingsPage working
    - _Requirements: 6.1_



- [x] 4. Fix Portal UI




  - [x] 4.1 Fix Portal lint and type errors

    - Fix all errors in `portal/src/pages/`, `portal/src/components/`
    - Fix all errors in `portal/src/hooks/`, `portal/src/contexts/`
    - _Requirements: 1.1, 1.2, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.2 Verify Portal UI completeness

    - Verify Auth pages (LoginPage, RegisterPage) working
    - Verify Homeowner pages (Dashboard, Projects, CreateProject) working
    - Verify Contractor pages (Dashboard, Marketplace, MyBids, Profile) working
    - Verify Public pages (Marketplace, ContractorDirectory) working
    - _Requirements: 6.2_


- [x] 5. Fix Landing UI







  - [x] 5.1 Fix Landing lint and type errors



    - Fix all errors in `landing/src/app/components/`, `landing/src/app/pages/`
    - _Requirements: 1.1, 1.2_
  - [x] 5.2 Verify Landing UI completeness


    - Verify ReviewForm, StarRating, RatingBreakdown working
    - Verify UnsubscribePage working
    - _Requirements: 6.2_

- [x] 6. Checkpoint - Frontend



  - Ensure all frontend builds without errors, ask the user if questions arise.

---

## Phase C: Property Tests Verification

- [x] 7. Verify and Fix Property Tests





  - [x] 7.1 Verify Phase 1-2 property tests


    - Run and verify contractor.service, region.service, bidding-settings.service tests
    - Run and verify project.service.property.test.ts, bid.service.property.test.ts
    - Fix any failing tests
    - _Requirements: 7.1, 7.3_

  - [x] 7.2 Verify Phase 3 property tests

    - Run and verify escrow.service.property.test.ts
    - Run and verify fee.service.property.test.ts
    - Run and verify match.service.property.test.ts
    - Run and verify notification.service.property.test.ts
    - Fix any failing tests
    - _Requirements: 7.1, 7.3_

  - [x] 7.3 Verify Phase 4-5 property tests

    - Run and verify chat.service.property.test.ts
    - Run and verify notification-channel.service.property.test.ts
    - Run and verify review.service.property.test.ts, ranking.service.property.test.ts
    - Fix any failing tests
    - _Requirements: 7.1, 7.3_

  - [x] 7.4 Verify Phase 6 property tests

    - Run and verify Portal property tests
    - Fix any failing tests
    - _Requirements: 7.1, 7.3_



  - [x] 7.5 Write property test for service-test file pairing




    - **Property 7: Property Test Coverage**
    - **Validates: Requirements 7.1**

- [x] 8. Checkpoint - Property Tests





  - Ensure all property tests pass, ask the user if questions arise.

---

## Phase D: Documentation & Final Verification

- [x] 9. Update Documentation





  - [x] 9.1 Update security-checklist.md


    - Verify all routes in Protected Routes Registry
    - Add any missing routes
    - _Requirements: 8.1_
  - [x] 9.2 Update ath-business-logic.md


    - Verify all data models documented
    - Verify all status flows documented
    - _Requirements: 8.2_
  - [x]* 9.3 Update DAILY_CHANGELOG.md



    - Document all fixes made
    - _Requirements: 8.3_

- [x] 10. Final Verification






  - [x] 10.1 Run final full audit

    - Execute `pnpm nx run-many --target=lint --all` - verify 0 errors/warnings
    - Execute `pnpm nx run-many --target=typecheck --all` - verify 0 errors
    - Execute `pnpm nx run-many --target=test --all` - verify all pass
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 11. Final Checkpoint





  - Ensure all tests pass, ask the user if questions arise.

---

## Summary

| Phase | Tasks | Priority | Estimate |
|-------|-------|----------|----------|
| A. API Audit & Fix | 1-2 | HIGH | 2-3h |
| B. Frontend Fixes | 3-6 | HIGH | 3-4h |
| C. Property Tests | 7-8 | HIGH | 1-2h |
| D. Documentation | 9-11 | MEDIUM | 1h |

**Total Estimate: 7-10 hours (1 day)**

---

## Notes

### Fix Strategy
1. **Root Cause Fix**: Không dùng eslint-disable, không bypass
2. **Type Safety**: Không dùng `any`, sử dụng proper types
3. **Consistency**: Follow existing patterns trong codebase

### Priority Order
1. Lint errors (blocking build)
2. Type errors (blocking build)
3. Test failures (blocking CI)
4. Structure issues (maintainability)
5. Documentation (future development)
