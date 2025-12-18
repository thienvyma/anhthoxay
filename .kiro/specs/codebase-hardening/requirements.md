# Requirements Document

## Introduction

Spec này tổng hợp các cải thiện nhỏ nhưng quan trọng cho codebase ANH THỢ XÂY, dựa trên đánh giá từ bên thứ ba. Mục tiêu là gia cố (hardening) codebase về mặt bảo mật, khả năng debug, và maintainability mà không thay đổi kiến trúc lớn.

**Điểm đánh giá hiện tại:**
- Backend architecture & security: 8.5/10
- Frontend (Admin + Landing) architecture & UX: 7.5/10
- DX / toolchain / docs: 8.5/10
- Testing & độ vững chắc: 6/10

**Các cải thiện trong spec này:**
1. Environment-based configuration thay vì hardcode API_URL
2. Error boundaries cho React apps để tránh crash toàn app
3. Sanitize markdown content để tránh XSS attacks
4. Correlation-ID middleware cho API request tracing
5. Centralized error handler với structured logging

## Glossary

- **API_URL**: URL base của backend API, hiện đang hardcode là `http://localhost:4202` trong `@app/shared`
- **Error Boundary**: React component bắt lỗi JavaScript trong component tree con và hiển thị fallback UI thay vì crash toàn app
- **Correlation-ID**: Unique identifier (UUID) gắn với mỗi request để trace logs xuyên suốt hệ thống
- **Sanitize**: Quá trình loại bỏ hoặc escape các ký tự/tags nguy hiểm trong input để tránh XSS
- **XSS (Cross-Site Scripting)**: Lỗ hổng bảo mật cho phép attacker inject malicious script vào trang web
- **Structured Logging**: Log format có cấu trúc (JSON) để dễ parse, query và integrate với log aggregation tools
- **rehype-sanitize**: Plugin cho unified/rehype ecosystem để sanitize HTML output từ markdown
- **Fallback UI**: Giao diện thay thế hiển thị khi component gặp lỗi

## Requirements

### Requirement 1: Environment-based API Configuration

**User Story:** As a developer, I want API_URL to be configurable via environment variables, so that I can deploy the application to different environments (dev, staging, production) without code changes.

#### Acceptance Criteria

1. WHEN the Landing app starts THEN the System SHALL read API_URL from environment variable `VITE_API_URL`
2. WHEN the Admin app starts THEN the System SHALL read API_URL from environment variable `VITE_API_URL`
3. WHEN `VITE_API_URL` is not set in development mode THEN the System SHALL fall back to `http://localhost:4202`
4. WHEN `VITE_API_URL` is not set in production build THEN the System SHALL log a warning to console
5. WHEN `resolveMediaUrl` function is called THEN the System SHALL use the configured API_URL from environment
6. WHEN updating `.env.example` THEN the System SHALL include `VITE_API_URL` with documentation comment
7. WHEN API_URL is resolved THEN the System SHALL expose a single shared config module (`@app/shared/config`) instead of accessing `import.meta.env` directly in multiple files

### Requirement 2: React Error Boundaries

**User Story:** As a user, I want the application to gracefully handle errors, so that a crash in one component does not break the entire application and I can continue using other features.

#### Acceptance Criteria

1. WHEN a JavaScript error occurs in Admin app page component THEN the System SHALL catch the error and display a fallback UI instead of white screen
2. WHEN a JavaScript error occurs in Landing app page component THEN the System SHALL catch the error and display a fallback UI instead of white screen
3. WHEN an error is caught by Error Boundary THEN the System SHALL log error details including component stack trace to console
4. WHEN displaying fallback UI THEN the System SHALL show error message in Vietnamese with "Thử lại" (Retry) button
5. WHEN user clicks retry button THEN the System SHALL reset error state and attempt to re-render the failed component
6. WHEN Error Boundary catches error THEN the System SHALL preserve navigation and layout components (header, sidebar) functional
7. Error Boundary SHALL only handle render lifecycle errors; async errors (fetch, event handlers) SHALL be handled via try-catch or centralized error handling logic

### Requirement 3: Markdown Content Sanitization

**User Story:** As a security-conscious developer, I want blog content to be sanitized before rendering, so that malicious scripts cannot be injected through markdown content even if admin account is compromised.

#### Acceptance Criteria

1. WHEN rendering markdown content in BlogDetailPage THEN the System SHALL sanitize HTML output using rehype-sanitize plugin
2. WHEN markdown contains `<script>` tags THEN the System SHALL remove script tags completely from output
3. WHEN markdown contains inline event handlers (onclick, onerror, onload, etc.) THEN the System SHALL remove event handler attributes from output
4. WHEN markdown contains `javascript:` protocol URLs THEN the System SHALL remove or neutralize javascript: URLs
5. WHEN markdown contains `data:` protocol URLs with script content THEN the System SHALL remove dangerous data: URLs
6. WHEN markdown contains safe HTML elements (h1-h6, p, a, img, ul, ol, li, blockquote, code, pre, strong, em) THEN the System SHALL preserve these elements with safe attributes only
7. WHEN markdown contains iframe or embed tags THEN the System SHALL remove iframe and embed tags from output
8. WHEN markdown contains img tags THEN the System SHALL only allow src, alt, title, width, height attributes and SHALL remove style attribute

### Requirement 4: Correlation-ID Middleware

**User Story:** As a developer debugging production issues, I want each request to have a unique correlation ID, so that I can trace logs across the entire request lifecycle and correlate frontend errors with backend logs.

#### Acceptance Criteria

1. WHEN a request arrives at the API without `X-Correlation-ID` header THEN the System SHALL generate a new unique ID as correlation ID
2. WHEN a request arrives with `X-Correlation-ID` header THEN the System SHALL use the provided correlation ID for request tracing
3. WHEN responding to any request THEN the System SHALL include `X-Correlation-ID` header in response with the correlation ID used
4. WHEN logging any message during request handling THEN the System SHALL include correlation ID in log output
5. WHEN an error response is returned THEN the System SHALL include `correlationId` field in error response body
6. WHEN correlation ID middleware runs THEN the System SHALL store correlation ID in Hono context for access by other middleware and routes
7. Correlation ID generation SHALL be abstracted to a utility function to allow future customization (UUID v4, nanoid, etc.)

### Requirement 5: Centralized Error Handler with Structured Logging

**User Story:** As a developer, I want all API errors to be handled consistently with structured logging, so that I can easily debug issues, monitor application health, and integrate with log aggregation tools.

#### Acceptance Criteria

1. WHEN an unhandled error occurs in any route THEN the System SHALL catch the error in global error handler using Hono's `app.onError`
2. WHEN logging an error THEN the System SHALL output structured JSON log with fields: timestamp, level, message, correlationId, path, method, userId, errorCode, stack
3. WHEN a Prisma `P2025` (Record not found) error occurs THEN the System SHALL return 404 status with appropriate message
4. WHEN a Prisma `P2002` (Unique constraint) error occurs THEN the System SHALL return 409 status with conflict message
5. WHEN a Zod validation error occurs THEN the System SHALL return 400 status with flattened validation errors
6. WHEN an AuthError occurs THEN the System SHALL return status code from AuthError.statusCode with error code and message
7. WHEN returning any error response THEN the System SHALL include `correlationId` field for client-side debugging
8. WHEN error occurs in production mode THEN the System SHALL NOT include stack trace in response body (only in logs)
9. WHEN error occurs in development mode THEN the System MAY include stack trace in response body to aid debugging
