# Requirements Document

## Introduction

Refactor API codebase để cải thiện maintainability và scalability. File `api/src/main.ts` hiện tại chứa ~1000+ lines code với tất cả routes, cần được tách ra thành các modules riêng biệt. Đồng thời chuẩn hóa response format, CORS configuration, và input validation.

**Vấn đề hiện tại:**
- `main.ts` chứa tất cả routes (media, pages, leads, pricing, blog, settings, integrations)
- Chỉ có `auth.routes.ts` được tách riêng
- Response format không nhất quán
- CORS origins hardcoded
- Input validation không nhất quán (có chỗ dùng Zod, có chỗ không)

## Glossary

- **API_Server**: Hono-based backend server tại port 4202
- **Route_Module**: File TypeScript chứa các route handlers cho một domain cụ thể
- **Service_Module**: File TypeScript chứa business logic, tách biệt khỏi HTTP handling
- **Response_Format**: Cấu trúc JSON chuẩn cho tất cả API responses
- **CORS**: Cross-Origin Resource Sharing - cơ chế cho phép requests từ origins khác
- **Zod_Schema**: Schema validation sử dụng thư viện Zod

## Requirements

### Requirement 1: Route Module Separation

**User Story:** As a developer, I want routes to be organized into separate modules by domain, so that the codebase is easier to navigate and maintain.

#### Acceptance Criteria

1. WHEN the API_Server starts THEN the API_Server SHALL load routes from separate module files in `api/src/routes/` directory
2. WHEN a route module is created THEN the Route_Module SHALL export a Hono app instance that can be mounted on the main app
3. WHEN routes are organized THEN the API_Server SHALL have separate modules for: pages, media, leads, pricing, blog, settings, integrations
4. WHEN main.ts is refactored THEN the main.ts file SHALL contain only middleware setup, route mounting, and server startup logic
5. WHEN route modules are created THEN each Route_Module SHALL import and use shared middleware (auth, validation) consistently

### Requirement 2: Service Layer Separation

**User Story:** As a developer, I want business logic to be separated from route handlers, so that code is reusable and testable.

#### Acceptance Criteria

1. WHEN a route handler contains complex business logic THEN the API_Server SHALL extract that logic into a Service_Module
2. WHEN creating service modules THEN the Service_Module SHALL be placed in `api/src/services/` directory
3. WHEN a service is created THEN the Service_Module SHALL export pure functions or class methods that handle business logic
4. WHEN route handlers call services THEN the Route_Module SHALL only handle HTTP concerns (parsing request, formatting response)

### Requirement 3: Standardized Response Format

**User Story:** As a frontend developer, I want all API responses to follow a consistent format, so that I can handle responses predictably.

#### Acceptance Criteria

1. WHEN returning a successful response THEN the API_Server SHALL use format: `{ success: true, data: T }`
2. WHEN returning a paginated response THEN the API_Server SHALL use format: `{ success: true, data: T[], meta: { total, page, limit, totalPages } }`
3. WHEN returning an error response THEN the API_Server SHALL use format: `{ success: false, error: { code, message }, correlationId }`
4. WHEN creating response helpers THEN the API_Server SHALL provide utility functions: `successResponse()`, `paginatedResponse()`, `errorResponse()`
5. WHEN migrating existing routes THEN the API_Server SHALL update all routes to use the new response format

### Requirement 4: CORS Configuration

**User Story:** As a DevOps engineer, I want CORS origins to be configurable via environment variables, so that I can deploy to different environments without code changes.

#### Acceptance Criteria

1. WHEN the API_Server starts THEN the API_Server SHALL read CORS origins from `CORS_ORIGINS` environment variable
2. WHEN `CORS_ORIGINS` is set THEN the API_Server SHALL parse comma-separated origins and allow requests from those origins
3. WHEN `CORS_ORIGINS` is not set in development THEN the API_Server SHALL fall back to `http://localhost:4200,http://localhost:4201`
4. WHEN `CORS_ORIGINS` is not set in production THEN the API_Server SHALL log a warning and use restrictive defaults
5. WHEN validating CORS origins THEN the API_Server SHALL validate that origins are valid URLs

### Requirement 5: Consistent Input Validation

**User Story:** As a security engineer, I want all API inputs to be validated using Zod schemas, so that invalid data is rejected before processing.

#### Acceptance Criteria

1. WHEN a route accepts request body THEN the Route_Module SHALL validate the body using a Zod schema
2. WHEN a route accepts query parameters THEN the Route_Module SHALL validate parameters using a Zod schema
3. WHEN validation fails THEN the API_Server SHALL return 400 status with validation error details
4. WHEN creating schemas THEN the API_Server SHALL place all schemas in `api/src/schemas/` directory organized by domain
5. WHEN a schema is reused THEN the API_Server SHALL export shared schemas from a common file

### Requirement 6: Route Documentation

**User Story:** As a developer, I want routes to be documented with their purpose and requirements, so that I can understand the API without reading implementation details.

#### Acceptance Criteria

1. WHEN creating a route module THEN the Route_Module SHALL include JSDoc comments describing the module purpose
2. WHEN creating a route handler THEN the Route_Module SHALL include JSDoc comments with endpoint path, method, and description
3. WHEN a route requires authentication THEN the Route_Module SHALL document required roles in JSDoc
4. WHEN a route accepts parameters THEN the Route_Module SHALL document parameter types and validation rules

