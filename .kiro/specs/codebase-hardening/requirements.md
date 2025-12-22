# Requirements Document

## Introduction

Spec này thực hiện kiểm tra toàn diện (recheck) tất cả code đã được tạo trong các spec Bidding Phase 1-6. Mục tiêu là đảm bảo code tuân thủ cấu trúc chuẩn của dự án, fix tất cả lỗi/warnings từ gốc, và bổ sung UI còn thiếu.

## Glossary

- **Codebase_Hardening_System**: Hệ thống kiểm tra và củng cố code
- **Lint**: Công cụ kiểm tra code style (ESLint)
- **Typecheck**: Công cụ kiểm tra TypeScript types
- **Property_Test**: Test dựa trên thuộc tính (property-based testing)
- **Refactor**: Tái cấu trúc code mà không thay đổi chức năng

## Requirements

### Requirement 1: Lint & Typecheck Compliance

**User Story:** As a developer, I want all code to pass lint and typecheck without errors or warnings, so that the codebase maintains consistent quality.

#### Acceptance Criteria

1. WHEN running `pnpm nx run-many --target=lint --all` THEN the Codebase_Hardening_System SHALL report zero errors and zero warnings
2. WHEN running `pnpm nx run-many --target=typecheck --all` THEN the Codebase_Hardening_System SHALL report zero errors
3. WHEN running `pnpm nx run-many --target=test --all` THEN the Codebase_Hardening_System SHALL report all tests passing
4. IF any lint error exists THEN the Codebase_Hardening_System SHALL fix the root cause instead of using eslint-disable comments

### Requirement 2: API Structure Compliance

**User Story:** As a developer, I want all API code to follow the established project structure, so that the codebase is maintainable and consistent.

#### Acceptance Criteria

1. WHEN creating API routes THEN the Codebase_Hardening_System SHALL place them in `api/src/routes/*.routes.ts`
2. WHEN creating API services THEN the Codebase_Hardening_System SHALL place them in `api/src/services/*.service.ts`
3. WHEN creating API schemas THEN the Codebase_Hardening_System SHALL place them in `api/src/schemas/*.schema.ts` and export from `index.ts`
4. WHEN creating API middleware THEN the Codebase_Hardening_System SHALL place them in `api/src/middleware/*.ts`
5. WHEN creating API utilities THEN the Codebase_Hardening_System SHALL place them in `api/src/utils/*.ts`

### Requirement 3: Frontend Structure Compliance

**User Story:** As a developer, I want all frontend code to follow the established project structure, so that the codebase is maintainable and consistent.

#### Acceptance Criteria

1. WHEN creating Admin pages THEN the Codebase_Hardening_System SHALL place them in `admin/src/app/pages/*Page/index.tsx` with sub-components
2. WHEN creating Portal pages THEN the Codebase_Hardening_System SHALL place them in `portal/src/pages/{role}/*.tsx`
3. WHEN creating shared components THEN the Codebase_Hardening_System SHALL place them in `portal/src/components/*.tsx`
4. WHEN creating hooks THEN the Codebase_Hardening_System SHALL place them in `portal/src/hooks/*.ts`
5. WHEN creating contexts THEN the Codebase_Hardening_System SHALL place them in `portal/src/contexts/*.tsx`

### Requirement 4: Import Order Compliance

**User Story:** As a developer, I want all imports to follow the established order, so that the codebase is consistent and readable.

#### Acceptance Criteria

1. WHEN organizing imports THEN the Codebase_Hardening_System SHALL order them as: external libraries, internal absolute imports (@app/*), relative imports, type imports
2. WHEN importing from shared packages THEN the Codebase_Hardening_System SHALL use `@app/shared` or `@app/ui`
3. IF cross-app imports exist THEN the Codebase_Hardening_System SHALL refactor to use shared packages

### Requirement 5: Security Compliance

**User Story:** As a developer, I want all API endpoints to have proper authentication and authorization, so that the system is secure.

#### Acceptance Criteria

1. WHEN creating admin endpoints THEN the Codebase_Hardening_System SHALL include `authenticate()` and `requireRole('ADMIN')` middleware
2. WHEN creating contractor endpoints THEN the Codebase_Hardening_System SHALL include `authenticate()` and `requireRole('CONTRACTOR')` middleware
3. WHEN creating homeowner endpoints THEN the Codebase_Hardening_System SHALL include `authenticate()` and `requireRole('HOMEOWNER')` middleware
4. WHEN creating public endpoints with form submission THEN the Codebase_Hardening_System SHALL include rate limiting middleware
5. WHEN creating new routes THEN the Codebase_Hardening_System SHALL update `security-checklist.md` Protected Routes Registry

### Requirement 6: Missing UI Completion

**User Story:** As a developer, I want all backend features to have corresponding UI, so that users can interact with all system features.

#### Acceptance Criteria

1. WHEN a backend API exists without corresponding Admin UI THEN the Codebase_Hardening_System SHALL create the Admin UI page
2. WHEN a backend API exists without corresponding Portal UI THEN the Codebase_Hardening_System SHALL create the Portal UI page
3. WHEN creating UI THEN the Codebase_Hardening_System SHALL follow existing patterns and use shared components

### Requirement 7: Property Test Coverage

**User Story:** As a developer, I want all critical business logic to have property tests, so that correctness is verified.

#### Acceptance Criteria

1. WHEN a service has business logic THEN the Codebase_Hardening_System SHALL verify property tests exist
2. IF property tests are missing THEN the Codebase_Hardening_System SHALL create them following the design document
3. WHEN running property tests THEN the Codebase_Hardening_System SHALL ensure all tests pass

### Requirement 8: Documentation Sync

**User Story:** As a developer, I want all steering files to be up-to-date, so that future development follows correct patterns.

#### Acceptance Criteria

1. WHEN new routes are added THEN the Codebase_Hardening_System SHALL update `security-checklist.md`
2. WHEN new business logic is added THEN the Codebase_Hardening_System SHALL update `ath-business-logic.md`
3. WHEN new patterns are established THEN the Codebase_Hardening_System SHALL update relevant steering files

