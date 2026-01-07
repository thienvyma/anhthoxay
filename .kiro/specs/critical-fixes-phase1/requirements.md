# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu để khắc phục các vấn đề kỹ thuật quan trọng (Critical Fixes - Phase 1) được xác định trong báo cáo TECHNICAL_IMPROVEMENT_ANALYSIS.md. Các vấn đề này cần được giải quyết ngay để đảm bảo code quality, performance và production-readiness.

Phạm vi bao gồm:
1. Fix N+1 Query Patterns trong ranking.service.ts
2. Replace console.log/console.error với structured logger
3. Thêm production startup checks cho JWT_SECRET
4. Cải thiện error handling consistency

## Glossary

- **N+1 Query**: Anti-pattern trong database queries khi thực hiện N queries bổ sung cho N records thay vì 1 batch query
- **Structured Logger**: Logger output JSON format với correlation ID, timestamp, level để dễ parse và monitor
- **JWT_SECRET**: Secret key dùng để sign/verify JWT tokens
- **Batch Processing**: Xử lý nhiều items cùng lúc thay vì từng item một
- **Chunking**: Chia nhỏ batch thành các chunks để tránh memory issues

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want the ranking recalculation to be performant, so that the daily job doesn't cause database overload.

#### Acceptance Criteria

1. WHEN the system recalculates all contractor scores THEN the Ranking_Service SHALL use batch processing with Promise.all instead of sequential queries
2. WHEN processing contractors in batches THEN the Ranking_Service SHALL process in chunks of maximum 50 contractors per batch
3. WHEN calculating monthly statistics THEN the Ranking_Service SHALL use aggregated queries instead of per-month loops
4. WHEN a single contractor score calculation fails THEN the Ranking_Service SHALL log the error and continue processing other contractors

### Requirement 2

**User Story:** As a developer, I want all error logs to go through structured logger, so that I can trace issues with correlation IDs in production.

#### Acceptance Criteria

1. WHEN an error occurs in ranking.service.ts THEN the Ranking_Service SHALL use createLogger() instead of console.error
2. WHEN an error occurs in bid.service.ts THEN the Bid_Service SHALL use createLogger() instead of console.error
3. WHEN an error occurs in escrow.service.ts THEN the Escrow_Service SHALL use createLogger() instead of console.error
4. WHEN logging errors THEN the Logger SHALL include error message, stack trace, and relevant context (contractorId, bidId, etc.)

### Requirement 3

**User Story:** As a DevOps engineer, I want the API to fail fast if JWT_SECRET is missing in production, so that we don't accidentally run with insecure defaults.

#### Acceptance Criteria

1. WHEN the API starts in production mode without JWT_SECRET THEN the System SHALL exit with error code 1 and clear error message
2. WHEN the API starts in production mode with JWT_SECRET shorter than 32 characters THEN the System SHALL exit with error code 1
3. WHEN the API starts in development mode without JWT_SECRET THEN the System SHALL log a warning and use development fallback
4. WHEN startup validation fails THEN the System SHALL log the specific validation error before exiting

### Requirement 4

**User Story:** As a developer, I want consistent error handling across all services, so that errors are properly logged and don't cause silent failures.

#### Acceptance Criteria

1. WHEN creating a notification fails in bid.service.ts THEN the Bid_Service SHALL log the error with structured logger and continue the operation
2. WHEN creating a notification fails in escrow.service.ts THEN the Escrow_Service SHALL log the error with structured logger and continue the operation
3. WHEN scheduling a notification fails THEN the Escrow_Service SHALL log the error with structured logger and continue the operation
4. WHEN any service catches an error THEN the Service SHALL include the operation context in the log entry
