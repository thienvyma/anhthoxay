# Requirements Document

## Introduction

API app của ANH THỢ XÂY hiện có test coverage thấp (7.3% - 14 test files cho 191 source files, 301 tests). Spec này định nghĩa requirements để cải thiện test coverage cho các critical API components, đảm bảo business logic được verify và giảm regression bugs.

## Glossary

- **Unit Test**: Test cho một function/service độc lập
- **Integration Test**: Test cho nhiều components làm việc cùng nhau
- **Property-Based Test**: Test với random inputs để verify properties
- **Service**: Business logic layer (project.service, bid.service, etc.)
- **Route**: HTTP endpoint handler
- **Schema**: Zod validation schema

## Current State Analysis

### API Test Coverage

| Category | Source Files | Test Files | Coverage |
|----------|-------------|------------|----------|
| Services | 35+ | 1 (auth.service) | ~3% |
| Routes | 32+ | 1 (auth.routes) | ~3% |
| Middleware | 10 | 6 | 60% |
| Utils | 6 | 4 | 67% |
| Config | 4 | 1 | 25% |
| **TOTAL** | **191** | **14** | **7.3%** |

### Untested Critical Services
- project.service.ts - Project CRUD, status transitions
- bid.service.ts - Bid creation, validation, anonymization
- escrow.service.ts - Escrow calculation, status management
- fee.service.ts - Fee calculation, transactions
- match.service.ts - Bid selection, contact reveal
- notification.service.ts - Notification creation, delivery
- review.service.ts - Review CRUD, rating calculation
- ranking.service.ts - Contractor ranking calculation

## Requirements

### Requirement 1: Project Service Tests

**User Story:** As a developer, I want comprehensive tests for project.service, so that project management logic is verified.

#### Acceptance Criteria

1. WHEN testing project creation THEN the test suite SHALL verify code generation (PRJ-YYYY-NNN format)
2. WHEN testing project status transitions THEN the test suite SHALL verify valid transitions (DRAFT → PENDING_APPROVAL → OPEN → BIDDING_CLOSED → MATCHED → COMPLETED)
3. WHEN testing project status transitions THEN the test suite SHALL reject invalid transitions
4. WHEN testing project queries THEN the test suite SHALL verify filtering by status, region, category
5. WHEN testing project access THEN the test suite SHALL verify owner-only access for draft projects

### Requirement 2: Bid Service Tests

**User Story:** As a developer, I want comprehensive tests for bid.service, so that bidding logic is verified.

#### Acceptance Criteria

1. WHEN testing bid creation THEN the test suite SHALL verify contractor verification status check
2. WHEN testing bid creation THEN the test suite SHALL verify one-bid-per-project constraint
3. WHEN testing bid queries THEN the test suite SHALL verify contractor info anonymization for homeowners
4. WHEN testing bid status transitions THEN the test suite SHALL verify valid transitions (PENDING → APPROVED → SELECTED)
5. WHEN testing bid withdrawal THEN the test suite SHALL verify only PENDING/APPROVED bids can be withdrawn

### Requirement 3: Escrow Service Tests

**User Story:** As a developer, I want comprehensive tests for escrow.service, so that financial logic is verified.

#### Acceptance Criteria

1. WHEN testing escrow creation THEN the test suite SHALL verify amount calculation (bidPrice × escrowPercentage)
2. WHEN testing escrow creation THEN the test suite SHALL verify minimum amount enforcement
3. WHEN testing escrow status transitions THEN the test suite SHALL verify valid transitions (PENDING → HELD → RELEASED)
4. WHEN testing partial release THEN the test suite SHALL verify releasedAmount tracking
5. WHEN testing dispute THEN the test suite SHALL verify status change to DISPUTED

### Requirement 4: Notification Service Tests

**User Story:** As a developer, I want comprehensive tests for notification.service, so that notification logic is verified.

#### Acceptance Criteria

1. WHEN testing notification creation THEN the test suite SHALL verify all notification types are handled
2. WHEN testing notification queries THEN the test suite SHALL verify unread count calculation
3. WHEN testing mark as read THEN the test suite SHALL verify readAt timestamp is set
4. WHEN testing notification preferences THEN the test suite SHALL verify channel-specific settings

### Requirement 5: Review & Ranking Service Tests

**User Story:** As a developer, I want comprehensive tests for review and ranking services, so that rating logic is verified.

#### Acceptance Criteria

1. WHEN testing review creation THEN the test suite SHALL verify one-review-per-project constraint
2. WHEN testing review creation THEN the test suite SHALL verify project completion status check
3. WHEN testing ranking calculation THEN the test suite SHALL verify score formula (rating 40%, projects 30%, response 15%, verification 15%)
4. WHEN testing ranking THEN the test suite SHALL verify rank ordering by totalScore

### Requirement 6: Route Tests for Critical Endpoints

**User Story:** As a developer, I want tests for critical API routes, so that HTTP interfaces are verified.

#### Acceptance Criteria

1. WHEN testing protected routes THEN the test suite SHALL verify 401 response without auth token
2. WHEN testing role-restricted routes THEN the test suite SHALL verify 403 response for unauthorized roles
3. WHEN testing routes with validation THEN the test suite SHALL verify 400 response for invalid input
4. WHEN testing successful operations THEN the test suite SHALL verify correct response format
