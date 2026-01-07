# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu để cải thiện khả năng mở rộng và độ tin cậy của hệ thống ANH THỢ XÂY dựa trên báo cáo đánh giá kỹ thuật toàn diện (TECHNICAL_ASSESSMENT_2026.md). Hệ thống hiện tại đạt điểm 4.5/10 về các kỹ thuật chuyên nghiệp và cần được nâng cấp để sẵn sàng cho production với traffic lớn.

### Tổng quan vấn đề theo mức độ ưu tiên:

**P0 - Critical (Cần làm ngay):**
- Không có Queue System → Email/sync có thể timeout, không retry
- Không có Redis Cache → Database bị hit liên tục, response chậm

**P1 - High (Nên làm sớm):**
- Không có CAPTCHA → Bot spam forms, fake leads
- Database connection pool mặc định (10) → Không scale được (cần 50+)
- Không có Distributed Lock → Race conditions khi token refresh, ranking
- Không có Idempotency → Duplicate submissions khi network retry

**P2 - Medium (Cải thiện dần):**
- Rate Limit chỉ trả 429, không log/alert → Không phát hiện attacks
- Không có Circuit Breaker → External API failures cascade
- Landing thiếu Debounce → Quá nhiều re-renders khi nhập liệu
- Landing thiếu localStorage persistence → Mất data khi refresh

**P3 - Nice to have:**
- Không có Prometheus/Grafana → Thiếu real-time dashboard
- Landing thiếu client-side Zod validation → Validation không nhất quán
- Không có real-time validation (validate on blur)

## Glossary

- **Queue System**: Hệ thống hàng đợi để xử lý các tác vụ bất đồng bộ (email, sync)
- **BullMQ**: Thư viện queue dựa trên Redis cho Node.js
- **Redis Cache**: Bộ nhớ đệm phân tán để giảm tải database
- **CAPTCHA**: Cơ chế xác minh người dùng không phải robot
- **Turnstile**: Dịch vụ CAPTCHA miễn phí của Cloudflare
- **Connection Pooling**: Quản lý pool kết nối database để tối ưu hiệu suất
- **Distributed Lock**: Cơ chế khóa phân tán để tránh race conditions
- **Idempotency Key**: Khóa đảm bảo request chỉ được xử lý một lần
- **Circuit Breaker**: Pattern ngắt mạch khi external service lỗi liên tục
- **TTL**: Time To Live - thời gian sống của cache entry
- **Debounce**: Kỹ thuật trì hoãn xử lý cho đến khi user ngừng nhập liệu
- **Throttle**: Kỹ thuật giới hạn tần suất xử lý trong khoảng thời gian
- **LocalStorage**: Bộ nhớ trình duyệt để lưu trữ dữ liệu tạm thời
- **Prometheus**: Hệ thống monitoring và alerting mã nguồn mở
- **Grafana**: Platform visualization cho metrics và logs
- **Backpressure**: Cơ chế kiểm soát tốc độ xử lý khi hệ thống quá tải

## Requirements

### Requirement 1: Queue System với BullMQ

**User Story:** As a system administrator, I want asynchronous task processing, so that long-running operations do not block API responses and can be retried on failure.

#### Acceptance Criteria

1. WHEN the API receives a request to send email THEN the System SHALL queue the email job and return response immediately within 200ms
2. WHEN a queued job fails THEN the System SHALL retry the job up to 3 times with exponential backoff
3. WHEN Google Sheets sync is triggered THEN the System SHALL process the sync through the queue instead of blocking the request
4. WHEN a notification needs to be sent THEN the System SHALL queue the notification delivery job
5. WHILE the queue worker is processing jobs THEN the System SHALL log job status (started, completed, failed) with correlation ID
6. IF the Redis connection fails THEN the System SHALL fall back to synchronous processing and log a warning

### Requirement 2: Redis Cache Layer

**User Story:** As a developer, I want frequently accessed data to be cached, so that database load is reduced and response times are improved.

#### Acceptance Criteria

1. WHEN fetching service categories THEN the System SHALL return cached data if available with TTL of 5 minutes
2. WHEN fetching materials list THEN the System SHALL return cached data if available with TTL of 5 minutes
3. WHEN fetching system settings THEN the System SHALL return cached data if available with TTL of 1 minute
4. WHEN fetching regions list THEN the System SHALL return cached data if available with TTL of 10 minutes
5. WHEN cached data is modified through admin panel THEN the System SHALL invalidate the relevant cache entries immediately
6. IF Redis is unavailable THEN the System SHALL fall back to database queries and log a warning
7. WHEN cache hit occurs THEN the System SHALL include X-Cache-Status header with value "HIT"
8. WHEN cache miss occurs THEN the System SHALL include X-Cache-Status header with value "MISS"

### Requirement 3: CAPTCHA Protection với Cloudflare Turnstile

**User Story:** As a system administrator, I want bot protection on public forms, so that spam submissions are prevented without degrading user experience.

#### Acceptance Criteria

1. WHEN a user submits the lead form THEN the System SHALL verify the Turnstile token before processing
2. WHEN a user submits the quote form THEN the System SHALL verify the Turnstile token before processing
3. WHEN a user registers a new account THEN the System SHALL verify the Turnstile token before creating the account
4. IF the Turnstile verification fails THEN the System SHALL return error code CAPTCHA_FAILED with status 400
5. WHEN rendering public forms THEN the Landing Page SHALL display the Turnstile widget
6. WHEN rendering registration form THEN the Portal SHALL display the Turnstile widget
7. WHERE Turnstile is configured THEN the System SHALL use environment variables for site key and secret key

### Requirement 4: Database Connection Pooling

**User Story:** As a system administrator, I want optimized database connections, so that the system can handle high concurrent traffic without connection exhaustion.

#### Acceptance Criteria

1. WHEN the API starts THEN the System SHALL configure connection pool with maximum 50 connections
2. WHEN a query takes longer than 100ms THEN the System SHALL log the slow query with duration and query text
3. WHEN connection pool is exhausted THEN the System SHALL queue requests with timeout of 30 seconds
4. WHEN the API shuts down THEN the System SHALL gracefully close all database connections
5. WHILE processing requests THEN the System SHALL reuse connections from the pool instead of creating new ones

### Requirement 5: Distributed Lock với Redlock

**User Story:** As a developer, I want distributed locking, so that concurrent operations on shared resources do not cause race conditions.

#### Acceptance Criteria

1. WHEN refreshing JWT token THEN the System SHALL acquire a lock for the user ID before processing
2. WHEN recalculating contractor rankings THEN the System SHALL acquire a global lock before processing
3. WHEN syncing to Google Sheets THEN the System SHALL acquire a lock for the spreadsheet ID before processing
4. IF the lock cannot be acquired within 5 seconds THEN the System SHALL return error code LOCK_TIMEOUT with status 503
5. WHEN the lock holder crashes THEN the System SHALL auto-release the lock after TTL expires (30 seconds default)
6. IF Redis is unavailable THEN the System SHALL skip locking and log a warning

### Requirement 6: Idempotency Keys

**User Story:** As a user, I want my form submissions to be processed exactly once, so that duplicate submissions due to network issues do not create duplicate records.

#### Acceptance Criteria

1. WHEN a client sends Idempotency-Key header with lead submission THEN the System SHALL check for existing result before processing
2. WHEN a duplicate request with same Idempotency-Key is received THEN the System SHALL return the cached result instead of processing again
3. WHEN a new request with Idempotency-Key is processed THEN the System SHALL cache the result for 24 hours
4. WHEN a request without Idempotency-Key is received THEN the System SHALL process normally without idempotency check
5. WHEN idempotency cache entry expires THEN the System SHALL allow reprocessing of the same key

### Requirement 7: Rate Limit Monitoring và Alerting

**User Story:** As a system administrator, I want visibility into rate limit violations, so that I can identify and respond to potential attacks or misconfigurations.

#### Acceptance Criteria

1. WHEN rate limit is exceeded THEN the System SHALL log the violation with IP address, path, and timestamp
2. WHEN an IP exceeds rate limit 10 times within 5 minutes THEN the System SHALL trigger an alert
3. WHEN rate limit metrics are requested THEN the System SHALL return count of violations per endpoint in the last hour
4. WHILE rate limiting is active THEN the System SHALL track violations per IP in Redis with 1 hour TTL
5. WHEN admin requests rate limit dashboard THEN the Admin Panel SHALL display top violating IPs and endpoints

### Requirement 8: Circuit Breaker cho External Services

**User Story:** As a developer, I want external service calls to fail fast when the service is down, so that cascading failures are prevented and system resources are preserved.

#### Acceptance Criteria

1. WHEN Google Sheets API fails 5 times consecutively THEN the System SHALL open the circuit and stop calling for 30 seconds
2. WHEN the circuit is open THEN the System SHALL return a fallback response indicating service unavailable
3. WHEN the circuit reset timeout expires THEN the System SHALL allow one test request (half-open state)
4. IF the test request succeeds THEN the System SHALL close the circuit and resume normal operation
5. IF the test request fails THEN the System SHALL keep the circuit open for another 30 seconds
6. WHEN circuit state changes THEN the System SHALL log the event with service name and new state



### Requirement 9: Frontend Debounce cho Landing Page

**User Story:** As a user, I want smooth input experience on quote forms, so that the page does not lag or re-render excessively while I am typing.

#### Acceptance Criteria

1. WHEN user types in area input field THEN the Landing Page SHALL debounce the calculation with 300ms delay
2. WHEN user types in search/filter fields THEN the Landing Page SHALL debounce the API call with 500ms delay
3. WHEN user scrolls the page THEN the Landing Page SHALL throttle scroll handlers with 100ms interval
4. WHEN user resizes the window THEN the Landing Page SHALL debounce resize handlers with 100ms delay
5. WHILE user is typing THEN the Landing Page SHALL show a subtle loading indicator after debounce starts

### Requirement 10: LocalStorage Persistence cho Quote Forms

**User Story:** As a user, I want my quote form progress to be saved automatically, so that I do not lose my selections if I accidentally refresh the page or navigate away.

#### Acceptance Criteria

1. WHEN user makes selections in quote calculator THEN the Landing Page SHALL save the state to localStorage immediately
2. WHEN user returns to quote calculator THEN the Landing Page SHALL restore the saved state from localStorage
3. WHEN user completes the quote submission THEN the Landing Page SHALL clear the saved state from localStorage
4. WHEN saved state is older than 24 hours THEN the Landing Page SHALL discard the saved state and start fresh
5. WHEN user clicks "Clear Form" button THEN the Landing Page SHALL clear the saved state from localStorage
6. WHILE restoring saved state THEN the Landing Page SHALL show a toast notification informing user that previous progress was restored

### Requirement 11: Client-side Validation với Zod cho Landing

**User Story:** As a user, I want immediate feedback on form validation errors, so that I can correct mistakes before submitting the form.

#### Acceptance Criteria

1. WHEN user blurs out of a required field THEN the Landing Page SHALL validate the field and show error message if invalid
2. WHEN user enters invalid phone number format THEN the Landing Page SHALL show error message with correct format hint
3. WHEN user enters invalid email format THEN the Landing Page SHALL show error message with correct format hint
4. WHEN user enters name shorter than 2 characters THEN the Landing Page SHALL show error message requiring minimum length
5. WHEN all fields are valid THEN the Landing Page SHALL enable the submit button
6. WHEN any field is invalid THEN the Landing Page SHALL disable the submit button and highlight invalid fields
7. WHILE validating THEN the Landing Page SHALL use the same Zod schemas as the backend for consistency

### Requirement 12: Prometheus Metrics Export

**User Story:** As a system administrator, I want application metrics exported in Prometheus format, so that I can visualize and alert on system health using Grafana.

#### Acceptance Criteria

1. WHEN Prometheus scrapes /metrics endpoint THEN the API SHALL return metrics in Prometheus text format
2. WHEN requests are processed THEN the API SHALL record http_request_duration_seconds histogram
3. WHEN requests are processed THEN the API SHALL record http_requests_total counter with labels for method, path, and status
4. WHEN database queries are executed THEN the API SHALL record db_query_duration_seconds histogram
5. WHEN cache operations occur THEN the API SHALL record cache_hits_total and cache_misses_total counters
6. WHEN queue jobs are processed THEN the API SHALL record queue_jobs_total counter with labels for queue name and status
7. WHEN rate limit is exceeded THEN the API SHALL record rate_limit_exceeded_total counter with labels for IP and path

### Requirement 13: Backpressure và Queue Health Monitoring

**User Story:** As a system administrator, I want visibility into queue health and backpressure, so that I can identify processing bottlenecks and scale workers appropriately.

#### Acceptance Criteria

1. WHEN queue depth exceeds 1000 jobs THEN the System SHALL log a warning and trigger an alert
2. WHEN queue worker is unhealthy THEN the System SHALL mark the worker as unavailable and log the error
3. WHEN admin requests queue status THEN the API SHALL return current depth, processing rate, and failed job count for each queue
4. WHILE queue is processing THEN the System SHALL track average job processing time per queue
5. IF queue depth exceeds 5000 jobs THEN the System SHALL reject new jobs with error code QUEUE_FULL and status 503
6. WHEN failed jobs exceed retry limit THEN the System SHALL move them to dead letter queue and send alert

### Requirement 14: Google Sheets Batch Operations

**User Story:** As a system administrator, I want Google Sheets sync to use batch operations, so that API quota is not exhausted and sync is more efficient.

#### Acceptance Criteria

1. WHEN multiple leads need to be synced THEN the System SHALL batch them into a single API call with maximum 100 rows per batch
2. WHEN syncing to Google Sheets THEN the System SHALL use batchUpdate API instead of individual append calls
3. WHEN batch sync fails THEN the System SHALL retry the entire batch up to 3 times with exponential backoff
4. WHEN batch size exceeds 100 rows THEN the System SHALL split into multiple batches and process sequentially
5. WHILE batch sync is in progress THEN the System SHALL log progress with batch number and total batches

### Requirement 15: Per-User Rate Limiting

**User Story:** As a system administrator, I want rate limiting per authenticated user in addition to per-IP, so that authenticated users cannot abuse the system even when sharing IP addresses.

#### Acceptance Criteria

1. WHEN authenticated user makes requests THEN the System SHALL apply rate limit based on user ID in addition to IP
2. WHEN user exceeds their rate limit THEN the System SHALL return 429 with X-RateLimit-User-Remaining header
3. WHEN admin user makes requests THEN the System SHALL apply higher rate limits (5x normal)
4. WHEN rate limit is configured THEN the System SHALL allow different limits per role (ADMIN, MANAGER, USER)
5. WHILE rate limiting THEN the System SHALL track both IP-based and user-based limits independently

