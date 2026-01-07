# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu để đảm bảo hệ thống ANH THỢ XÂY có khả năng chịu tải cao và phục hồi nhanh khi gặp sự cố. Dựa trên phân tích toàn diện, hệ thống đã có nền tảng tốt nhưng cần bổ sung các giải pháp để:

1. **Horizontal Scaling** - Khả năng mở rộng nhiều instances
2. **CDN & Static Asset Optimization** - Giảm tải cho origin server
3. **Database Read Replicas** - Tách read/write để scale database
4. **Auto-scaling & Load Balancing** - Tự động điều chỉnh capacity
5. **Disaster Recovery** - Khôi phục nhanh khi sự cố
6. **Secret Management** - Quản lý secrets an toàn và rotate định kỳ
7. **Load Testing Infrastructure** - Kiểm tra khả năng chịu tải

### Phân tích rủi ro hiện tại:

**Đã giải quyết tốt:**
- ✅ Rate Limiting (Redis + in-memory fallback)
- ✅ CAPTCHA (Cloudflare Turnstile)
- ✅ Queue System (BullMQ)
- ✅ Redis Cache
- ✅ Circuit Breaker (Opossum)
- ✅ Distributed Lock (Redlock)
- ✅ Prometheus Metrics
- ✅ Security Headers (CSP, HSTS)
- ✅ JWT Enhancement (blacklist, rotation)

**Cần bổ sung cho traffic cao:**
- ⚠️ Single instance limitation khi Redis down
- ⚠️ Chưa có CDN cho static assets
- ⚠️ Database single point of failure
- ⚠️ Chưa có auto-scaling configuration
- ⚠️ Secret rotation chưa tự động
- ⚠️ Chưa có load testing baseline

## Glossary

- **Horizontal Scaling**: Mở rộng bằng cách thêm nhiều server instances
- **CDN (Content Delivery Network)**: Mạng phân phối nội dung toàn cầu
- **Read Replica**: Bản sao database chỉ đọc để giảm tải primary
- **Auto-scaling**: Tự động tăng/giảm số lượng instances theo tải
- **Load Balancer**: Bộ cân bằng tải phân phối request
- **Health Check**: Kiểm tra sức khỏe service để routing
- **Blue-Green Deployment**: Triển khai với 2 môi trường song song
- **Disaster Recovery (DR)**: Kế hoạch khôi phục sau thảm họa
- **RTO (Recovery Time Objective)**: Thời gian tối đa để khôi phục
- **RPO (Recovery Point Objective)**: Lượng data tối đa có thể mất
- **Secret Rotation**: Thay đổi secrets định kỳ để tăng bảo mật
- **k6**: Công cụ load testing hiện đại
- **Sticky Session**: Session gắn với một server cụ thể
- **Connection Draining**: Đợi requests hoàn thành trước khi shutdown
- **Backoff Strategy**: Chiến lược retry với delay tăng dần

## Requirements

### Requirement 1: Stateless API Design Verification

**User Story:** As a DevOps engineer, I want the API to be completely stateless, so that I can horizontally scale to multiple instances without session issues.

#### Acceptance Criteria

1. WHEN multiple API instances are running THEN the System SHALL handle requests correctly regardless of which instance receives them
2. WHEN a user authenticates on instance A THEN the System SHALL validate their token on instance B without issues
3. WHEN rate limit state is stored THEN the System SHALL use Redis as the single source of truth across all instances
4. WHEN cache is invalidated on instance A THEN the System SHALL reflect the change on all instances immediately
5. WHEN file uploads are processed THEN the System SHALL store files in shared storage (S3/R2) accessible by all instances
6. IF Redis is unavailable THEN the System SHALL operate in degraded mode with in-memory state and log warnings

### Requirement 2: CDN Integration for Static Assets

**User Story:** As a user, I want static assets to load quickly from nearby servers, so that the website feels responsive regardless of my location.

#### Acceptance Criteria

1. WHEN serving images from /media endpoint THEN the System SHALL return Cache-Control headers with max-age of 1 year for immutable assets
2. WHEN serving API responses for public data THEN the System SHALL return appropriate Cache-Control headers (s-maxage for CDN)
3. WHEN a media file is uploaded THEN the System SHALL generate a unique filename with content hash for cache busting
4. WHEN CDN cache needs invalidation THEN the System SHALL provide an admin endpoint to purge specific paths
5. WHEN serving fonts and CSS THEN the Landing Page SHALL use CDN URLs with immutable cache headers
6. WHEN configuring CDN THEN the System SHALL use environment variables for CDN domain and purge API credentials

### Requirement 3: Database Read Replica Support

**User Story:** As a database administrator, I want read queries to be distributed to replicas, so that the primary database is not overwhelmed during traffic spikes.

#### Acceptance Criteria

1. WHEN executing read-only queries (GET endpoints) THEN the System SHALL route to read replica if configured
2. WHEN executing write queries (POST, PUT, DELETE) THEN the System SHALL always route to primary database
3. WHEN read replica is unavailable THEN the System SHALL fallback to primary database and log a warning
4. WHEN configuring database THEN the System SHALL support separate DATABASE_URL and DATABASE_REPLICA_URL environment variables
5. WHEN replication lag exceeds 5 seconds THEN the System SHALL route critical reads to primary and log a warning
6. WHEN listing data with pagination THEN the System SHALL use read replica for better performance

### Requirement 4: Health Check Enhancement for Load Balancer

**User Story:** As a load balancer, I want detailed health information from each instance, so that I can route traffic only to healthy instances.

#### Acceptance Criteria

1. WHEN load balancer checks /health/live THEN the System SHALL return 200 if the process is running
2. WHEN load balancer checks /health/ready THEN the System SHALL return 200 only if database and Redis are connected
3. WHEN database connection fails THEN the System SHALL return 503 on /health/ready with error details
4. WHEN Redis connection fails THEN the System SHALL return 200 on /health/ready with degraded status
5. WHEN health check is requested THEN the System SHALL respond within 100ms to avoid timeout
6. WHEN instance is shutting down THEN the System SHALL return 503 on /health/ready immediately to stop receiving new traffic

### Requirement 5: Graceful Shutdown with Connection Draining

**User Story:** As a DevOps engineer, I want instances to drain connections gracefully during deployment, so that in-flight requests are not dropped.

#### Acceptance Criteria

1. WHEN SIGTERM is received THEN the System SHALL stop accepting new connections immediately
2. WHEN SIGTERM is received THEN the System SHALL wait up to 30 seconds for in-flight requests to complete
3. WHEN graceful shutdown starts THEN the System SHALL return 503 on health checks to stop load balancer traffic
4. WHEN all in-flight requests complete THEN the System SHALL close database and Redis connections
5. WHEN shutdown timeout is reached THEN the System SHALL force close remaining connections and exit
6. WHEN shutdown completes THEN the System SHALL log total shutdown duration and any forced closures

### Requirement 6: Secret Rotation Support

**User Story:** As a security engineer, I want to rotate secrets without downtime, so that compromised credentials can be quickly invalidated.

#### Acceptance Criteria

1. WHEN JWT_SECRET is rotated THEN the System SHALL support both old and new secrets during transition period
2. WHEN ENCRYPTION_KEY is rotated THEN the System SHALL re-encrypt existing data with new key in background
3. WHEN database credentials are rotated THEN the System SHALL reconnect with new credentials without restart
4. WHEN API keys are rotated THEN the System SHALL invalidate old keys after grace period of 24 hours
5. WHEN secret rotation is triggered THEN the System SHALL log the rotation event with timestamp
6. WHEN rotation fails THEN the System SHALL alert administrators and continue using current secrets

### Requirement 7: Load Testing Infrastructure

**User Story:** As a performance engineer, I want automated load tests, so that I can verify system capacity before traffic spikes.

#### Acceptance Criteria

1. WHEN running load test THEN the System SHALL simulate realistic user scenarios (browse, quote, submit lead)
2. WHEN load test completes THEN the System SHALL report p50, p95, p99 latencies for each endpoint
3. WHEN load test completes THEN the System SHALL report error rate and throughput (requests/second)
4. WHEN load test detects degradation THEN the System SHALL identify the bottleneck (CPU, memory, database, Redis)
5. WHEN baseline test runs THEN the System SHALL verify system handles 100 concurrent users with p99 < 500ms
6. WHEN stress test runs THEN the System SHALL identify breaking point and recovery behavior

### Requirement 8: Redis Cluster Support

**User Story:** As a DevOps engineer, I want Redis to be highly available, so that cache and rate limiting continue working during Redis node failures.

#### Acceptance Criteria

1. WHEN Redis cluster is configured THEN the System SHALL connect to cluster instead of single node
2. WHEN a Redis node fails THEN the System SHALL automatically failover to replica node
3. WHEN Redis cluster is unavailable THEN the System SHALL fallback to in-memory cache with reduced TTL
4. WHEN configuring Redis THEN the System SHALL support both single node (REDIS_URL) and cluster (REDIS_CLUSTER_URLS) modes
5. WHEN Redis connection is restored THEN the System SHALL resume using Redis without manual intervention
6. WHEN Redis operations fail THEN the System SHALL not block the main request flow

### Requirement 9: Request Timeout and Circuit Breaker Enhancement

**User Story:** As a user, I want requests to fail fast when services are slow, so that I get quick feedback instead of waiting indefinitely.

#### Acceptance Criteria

1. WHEN API request takes longer than 30 seconds THEN the System SHALL timeout and return 504 Gateway Timeout
2. WHEN database query takes longer than 10 seconds THEN the System SHALL cancel the query and return error
3. WHEN external API (Google Sheets) is slow THEN the System SHALL timeout after 15 seconds
4. WHEN circuit breaker opens THEN the System SHALL return cached data if available, otherwise return 503
5. WHEN timeout occurs THEN the System SHALL log the slow operation with duration and context
6. WHEN multiple timeouts occur THEN the System SHALL trigger circuit breaker to prevent cascade failures

### Requirement 10: Distributed Tracing Preparation

**User Story:** As a developer, I want request tracing across services, so that I can debug issues in distributed deployments.

#### Acceptance Criteria

1. WHEN a request is received THEN the System SHALL generate or propagate X-Request-ID header
2. WHEN logging any event THEN the System SHALL include the correlation ID for tracing
3. WHEN calling external services THEN the System SHALL propagate the correlation ID in headers
4. WHEN queue job is created THEN the System SHALL include correlation ID in job metadata
5. WHEN error occurs THEN the System SHALL include correlation ID in error response for support reference
6. WHEN metrics are recorded THEN the System SHALL include correlation ID as label for detailed analysis

### Requirement 11: Backup and Recovery Automation

**User Story:** As a database administrator, I want automated backups with tested recovery, so that I can restore data quickly after incidents.

#### Acceptance Criteria

1. WHEN backup schedule runs THEN the System SHALL create database backup and upload to secure storage
2. WHEN backup completes THEN the System SHALL verify backup integrity with checksum
3. WHEN backup fails THEN the System SHALL alert administrators immediately
4. WHEN recovery is needed THEN the System SHALL provide documented steps with RTO < 1 hour
5. WHEN backup retention expires THEN the System SHALL delete old backups automatically (keep 30 days)
6. WHEN disaster recovery test runs THEN the System SHALL verify backup can be restored to separate environment

### Requirement 12: Auto-scaling Configuration

**User Story:** As a DevOps engineer, I want auto-scaling rules defined, so that the system automatically adjusts capacity based on load.

#### Acceptance Criteria

1. WHEN CPU usage exceeds 70% for 5 minutes THEN the System SHALL scale up by adding instances
2. WHEN CPU usage drops below 30% for 10 minutes THEN the System SHALL scale down by removing instances
3. WHEN scaling up THEN the System SHALL wait for new instance health check before routing traffic
4. WHEN scaling down THEN the System SHALL drain connections before terminating instance
5. WHEN maximum instances reached THEN the System SHALL alert administrators about capacity limit
6. WHEN minimum instances reached THEN the System SHALL not scale down further to maintain availability

### Requirement 13: Error Budget and SLO Monitoring

**User Story:** As a product owner, I want SLO tracking, so that I can balance reliability with feature velocity.

#### Acceptance Criteria

1. WHEN calculating availability THEN the System SHALL track successful requests / total requests ratio
2. WHEN availability drops below 99.9% THEN the System SHALL trigger alert to on-call engineer
3. WHEN error budget is exhausted THEN the System SHALL prioritize reliability fixes over new features
4. WHEN SLO dashboard is viewed THEN the System SHALL show current availability, error budget remaining, and trend
5. WHEN latency SLO is defined THEN the System SHALL track p99 latency against target (500ms)
6. WHEN SLO breach occurs THEN the System SHALL create incident report with root cause analysis

### Requirement 14: DDoS Mitigation Enhancement

**User Story:** As a security engineer, I want enhanced DDoS protection, so that the system remains available during attack attempts.

#### Acceptance Criteria

1. WHEN IP exceeds rate limit 50 times in 5 minutes THEN the System SHALL temporarily block the IP for 1 hour
2. WHEN blocked IP attempts request THEN the System SHALL return 403 without processing
3. WHEN admin reviews blocked IPs THEN the System SHALL show block reason, timestamp, and request count
4. WHEN admin unblocks IP THEN the System SHALL immediately allow requests from that IP
5. WHEN suspicious pattern detected (same user-agent, rapid requests) THEN the System SHALL increase CAPTCHA challenge rate
6. WHEN under attack THEN the System SHALL enable emergency mode with stricter rate limits

### Requirement 15: Configuration Hot Reload

**User Story:** As a DevOps engineer, I want to update configuration without restart, so that I can tune system behavior in production quickly.

#### Acceptance Criteria

1. WHEN rate limit configuration changes THEN the System SHALL apply new limits without restart
2. WHEN feature flag changes THEN the System SHALL reflect the change within 30 seconds
3. WHEN cache TTL configuration changes THEN the System SHALL apply to new cache entries immediately
4. WHEN configuration reload is triggered THEN the System SHALL validate new configuration before applying
5. WHEN invalid configuration is detected THEN the System SHALL reject the change and keep current configuration
6. WHEN configuration changes THEN the System SHALL log the change with old and new values

