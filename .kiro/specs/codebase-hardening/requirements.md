# Requirements Document

## Introduction

Tài liệu này định nghĩa các yêu cầu cho việc hardening codebase ANH THỢ XÂY, tập trung vào các rủi ro chưa được giải quyết từ các audit trước đó và các điểm cải thiện mới phát hiện. Mục tiêu là tăng cường độ tin cậy, khả năng bảo trì và sẵn sàng cho scale-up.

## Glossary

- **Codebase**: Toàn bộ source code của dự án ANH THỢ XÂY bao gồm admin, api, landing, portal
- **Technical Debt**: Code tạm thời hoặc không tối ưu cần được cải thiện
- **N+1 Query**: Anti-pattern database query gây ra nhiều queries không cần thiết
- **Type Safety**: Đảm bảo type checking tại compile time để tránh runtime errors
- **JSON Field**: Trường dữ liệu lưu trữ JSON string trong database
- **Singleton Pattern**: Design pattern đảm bảo chỉ có một instance của class
- **Rate Limiting**: Giới hạn số lượng requests trong một khoảng thời gian
- **Graceful Shutdown**: Đóng server một cách an toàn, hoàn thành các requests đang xử lý

## Requirements

### Requirement 1: Type Safety Enhancement

**User Story:** As a developer, I want JSON fields in the database to have proper TypeScript types, so that I can catch type errors at compile time instead of runtime.

#### Acceptance Criteria

1. WHEN a service reads a JSON field from database THEN the System SHALL parse it using a Zod schema and return typed data
2. WHEN a service writes to a JSON field THEN the System SHALL validate the data against a Zod schema before serialization
3. WHEN JSON parsing fails THEN the System SHALL return a typed error with the field name and validation details
4. WHEN accessing JSON field properties THEN the System SHALL provide TypeScript autocomplete and type checking

### Requirement 2: Status Enum Consolidation

**User Story:** As a developer, I want all status values to be defined as TypeScript enums or const objects, so that I can avoid typos and get autocomplete support.

#### Acceptance Criteria

1. WHEN defining a status field THEN the System SHALL use a const object with `as const` assertion
2. WHEN checking status values THEN the System SHALL use the defined constants instead of string literals
3. WHEN a status transition occurs THEN the System SHALL validate against allowed transitions defined in a state machine
4. WHEN an invalid status value is provided THEN the System SHALL return a validation error with allowed values

### Requirement 3: API Client Unification

**User Story:** As a developer, I want a single API client implementation shared across all frontend apps, so that I can maintain consistent behavior and reduce code duplication.

#### Acceptance Criteria

1. WHEN making an API request from any frontend app THEN the System SHALL use the shared API client from `@app/shared`
2. WHEN an API request requires authentication THEN the System SHALL automatically attach the Bearer token
3. WHEN a 401 response is received THEN the System SHALL attempt token refresh before retrying the request
4. WHEN token refresh fails THEN the System SHALL redirect to login and clear stored credentials
5. WHEN an API error occurs THEN the System SHALL return a standardized error object with code, message, and correlationId

### Requirement 4: Shared Type Definitions

**User Story:** As a developer, I want common types like Region, ServiceCategory, and PaginationMeta to be defined once in the shared package, so that I can avoid duplicate definitions across apps.

#### Acceptance Criteria

1. WHEN a type is used in multiple apps THEN the System SHALL define it in `@app/shared/types`
2. WHEN importing a shared type THEN the System SHALL use the path `@app/shared` instead of relative imports
3. WHEN a shared type is updated THEN the System SHALL propagate the change to all consuming apps via TypeScript compilation
4. WHEN duplicate type definitions exist THEN the System SHALL remove them and use the shared definition

### Requirement 5: Error Handling Standardization

**User Story:** As a developer, I want all API errors to follow a consistent format with proper error codes, so that frontend apps can handle errors uniformly.

#### Acceptance Criteria

1. WHEN an API error occurs THEN the System SHALL return a response with `success: false`, `error.code`, `error.message`, and `correlationId`
2. WHEN a validation error occurs THEN the System SHALL include `error.details` with field-level error information
3. WHEN an unexpected error occurs THEN the System SHALL log the full error stack and return a generic error to the client
4. WHEN a known business error occurs THEN the System SHALL return a specific error code from the defined error catalog

### Requirement 6: Database Query Optimization

**User Story:** As a developer, I want database queries to be optimized to avoid N+1 patterns, so that the system performs well under load.

#### Acceptance Criteria

1. WHEN fetching a list with related data THEN the System SHALL use Prisma `include` or `select` to fetch in a single query
2. WHEN counting records THEN the System SHALL use Prisma `count()` instead of fetching all records
3. WHEN aggregating data THEN the System SHALL use Prisma `groupBy()` or raw SQL aggregations
4. WHEN a query takes longer than 100ms THEN the System SHALL log a warning with the query details

### Requirement 7: Caching Strategy Implementation

**User Story:** As a developer, I want frequently accessed, rarely changed data to be cached, so that the system can handle more concurrent users.

#### Acceptance Criteria

1. WHEN fetching Settings data THEN the System SHALL check cache first and return cached data if valid
2. WHEN fetching Regions data THEN the System SHALL use cached data with a 1-hour TTL
3. WHEN fetching BiddingSettings THEN the System SHALL use cached data with a 1-hour TTL
4. WHEN cached data is updated THEN the System SHALL invalidate the cache immediately
5. WHEN cache is empty or expired THEN the System SHALL fetch from database and populate cache

### Requirement 8: Code Organization - Large File Refactoring

**User Story:** As a developer, I want large files (>500 lines) to be split into smaller, focused modules, so that the code is easier to understand and maintain.

#### Acceptance Criteria

1. WHEN a service file exceeds 500 lines THEN the System SHALL split it into domain-specific sub-services
2. WHEN a React component file exceeds 400 lines THEN the System SHALL extract sub-components and custom hooks
3. WHEN splitting a file THEN the System SHALL maintain backward compatibility through re-exports
4. WHEN a file is split THEN the System SHALL update all imports to use the new module structure

### Requirement 9: Dead Code Removal

**User Story:** As a developer, I want unused code and empty directories to be removed, so that the codebase is clean and easy to navigate.

#### Acceptance Criteria
