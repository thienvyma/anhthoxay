# Daily Changelog

## 2026-01-09

### Task: Fix Mobile Background với Fixed Pseudo-Element

**✏️ Modified:**
- `landing/src/app/app.tsx` - Sử dụng CSS custom property và class thay vì inline background styles
- `landing/src/styles.css` - Thêm `body.has-fixed-bg::before` pseudo-element với `position: fixed` để tạo fixed background layer hoạt động trên iOS Safari

**🔧 Giải pháp:**
- iOS Safari không hỗ trợ `background-attachment: fixed` trên mobile
- Thay vì dùng background trực tiếp trên body, tạo pseudo-element `::before` với `position: fixed`
- Pseudo-element này nằm phía sau content (`z-index: -1`) và giữ nguyên vị trí khi scroll
- Hoạt động trên tất cả browsers bao gồm iOS Safari

---

### Task: Thêm Section LEGAL_CONTENT (Privacy Policy & Terms of Use)

**🆕 Created:**
- `admin/src/app/components/SectionEditor/forms/LegalContentForm.tsx` - Form editor cho Privacy Policy & Terms of Use
- `admin/src/app/components/SectionEditor/previews/LegalContentPreview.tsx` - Preview component với tabs/stacked layout
- `landing/src/app/sections/LegalContent.tsx` - Landing page section component với responsive design

**✏️ Modified:**
- `admin/src/app/types/content.ts` - Thêm `LEGAL_CONTENT` vào SectionKind
- `admin/src/app/components/SectionEditor/defaults.ts` - Thêm default data với nội dung mẫu đầy đủ
- `admin/src/app/components/SectionEditor/forms/index.tsx` - Import và route LegalContentForm
- `admin/src/app/components/SectionEditor/previews/index.tsx` - Import và route LegalContentPreview
- `admin/src/app/pages/SectionsPage.tsx` - Thêm vào danh sách section types
- `landing/src/app/types.ts` - Thêm `LEGAL_CONTENT` vào SectionKind
- `landing/src/app/sections/render.tsx` - Register LegalContent component

**📋 Features:**
- Hỗ trợ 3 loại: Privacy Policy, Terms of Use, hoặc cả hai
- Nội dung mẫu tiếng Việt đầy đủ cho doanh nghiệp
- Layout: tabs, accordion, stacked
- Table of Contents tự động với smooth scroll
- Thông tin công ty có thể tùy chỉnh
- Responsive design với Framer Motion animations

---

### Task: Fix Mobile Background và Logo Size

**✏️ Modified:**
- `landing/src/app/app.tsx` - Fix background-attachment cho mobile/tablet (iOS Safari không hỗ trợ fixed), thêm resize listener
- `landing/src/app/components/Header.tsx` - Tăng kích thước logo trên mobile (38px min thay vì 32px)
- `landing/src/styles.css` - Thêm CSS rules cho mobile: background-attachment scroll, logo size 42px

**🔧 Issues Fixed:**
- Background không hiển thị đúng trên điện thoại thật (iOS Safari)
- Logo quá nhỏ trên mobile

---

### Task: Tắt dịch vụ GCP không cần thiết + Fix Logo PDF

**🔧 GCP Services Disabled:**
- `alloydb.googleapis.com` - AlloyDB (không dùng)
- `analyticshub.googleapis.com` - Analytics Hub
- `bigquerydatapolicy.googleapis.com` - BigQuery Data Policy
- `bigquerydatatransfer.googleapis.com` - BigQuery Data Transfer
- `bigquerymigration.googleapis.com` - BigQuery Migration
- `bigqueryreservation.googleapis.com` - BigQuery Reservation
- `dataform.googleapis.com` - Dataform
- `dataplex.googleapis.com` - Dataplex
- `datastore.googleapis.com` - Datastore
- `containerregistry.googleapis.com` - Container Registry (đã migrate sang Artifact Registry)

**✏️ Modified:**
- `admin/src/app/pages/SettingsPage/CompanyTab.tsx` - Cập nhật description cho logo PDF
- `api/src/services/pdf.service.ts` - Fix logo URL resolution, thêm logging để debug
- `infra/gcp/cloudbuild-api.yaml` - Thêm API_URL env var cho production

---

## 2026-01-08

### Task: Fix Media Storage - Use S3 Instead of Local Filesystem

**✏️ Modified:**
- `api/src/services/media.service.ts` - Refactored to use IStorage abstraction instead of local fs. Now uploads to S3/R2 for persistent storage across deployments
- `infra/gcp/cloudbuild-api.yaml` - Added S3 secrets (s3-bucket, s3-region, s3-endpoint, s3-access-key-id, s3-secret-access-key, s3-public-url)

**🔧 GCP Configuration:**
- Granted Cloud Run service account access to S3 secrets
- Deployed API with S3 storage enabled

**⚠️ Note:** Logo và media files giờ sẽ được lưu trữ persistent trong S3, không bị mất khi redeploy.

---

### Task: Add GCP Deployment Steering + System Check

**🆕 Created:**
- `.kiro/steering/gcp-deployment.md` - Hướng dẫn deployment lên GCP, không chạy local cho production

**✅ System Check:**
- All 4 Cloud Run services: ✅ Running (ntn-api, ntn-landing, ntn-admin, ntn-portal)
- Cloud SQL (ntn-db): ✅ RUNNABLE
- Cloud Storage (ntn-media-bucket): ✅ Available
- All secrets: ✅ Configured
- Recent builds: ✅ All SUCCESS

---

### Task: Simplify Quotation Email Template

**✏️ Modified:**
- `api/src/utils/quotation-email.ts` - Redesigned email template: removed gradients, simplified colors, cleaner professional look

---

### Task: Fix Google Integration - ENCRYPTION_KEY

**✏️ Modified:**
- Updated ENCRYPTION_KEY secret in GCP Secret Manager with proper base64 format
- Redeployed ntn-api to apply new secret

---

### Task: Fix GCB Build - Missing Google OAuth Secrets

**✏️ Modified:**
- `infra/gcp/setup.sh` - Added placeholder secrets creation for GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET; added IAM binding for these secrets
- `infra/gcp/cloudbuild-api.yaml` - (verified) Google OAuth secrets are required for deployment

---

### Task: Add Google Integration Setup Script

**🆕 Created:**
- `infra/gcp/setup-google-integration.sh` - Script tự động cấu hình Google OAuth (Sheets + Gmail) cho production

**✏️ Modified:**
- `docs/DEPLOYMENT_GCP.md` - Thêm Bước 10: Setup Google Integration với hướng dẫn chi tiết

---

### Task: Fix SectionEditor Modal Light Mode Styling

**✏️ Modified:**
- `admin/src/app/components/SectionEditor/index.tsx` - Replaced hardcoded dark colors with adminTokens for light mode compatibility: modal background, header gradient, template button gradient, form background, preview container
- `admin/src/app/components/SectionEditor/forms/shared/ArraySection.tsx` - Replaced hardcoded rgba colors with token-based opacity colors
- `admin/src/app/components/SectionEditor/forms/shared/InfoBanner.tsx` - Removed gradient, using solid color with opacity

---

### Task: Fix Admin Package Security & Error Handling Issues

**✏️ Modified:**
- `admin/package.json` - Removed deprecated `@types/dompurify` (DOMPurify ships own types), bumped `vitest` from 3.0.0 to 3.0.5 (CVE-2025-24964)
- `admin/src/app/pages/SectionsPage.tsx` - Fixed `handleCreatePage` and `handleDeletePage` to check `addPageToHeaderNav`/`removePageFromHeaderNav` results and show appropriate success/error messages
- `admin/src/app/pages/SettingsPage/LayoutTab.tsx` - Fixed `loadAllPages` to throw on API failure instead of returning empty array; added empty pages validation in `handleSaveHeader`/`handleSaveFooter`; used `Promise.allSettled` for partial failure handling; improved error messages for home page not found
- `admin/src/app/utils/headerSync.ts` - Added `Array.isArray` type guard for `parsed.links`; added retry with exponential backoff for page updates; added rollback on partial failures; improved error logging

---

### Task: Fix Header Layout Sync Between Pages & Sections and Settings

**✏️ Modified:**
- `admin/src/app/pages/SettingsPage/LayoutTab.tsx` - Changed from hardcoded `ATH_PAGES` list to dynamic pages loading from API. Now when saving header/footer, it saves to ALL existing pages automatically.

**Details:** Previously, LayoutTab used a hardcoded list of pages (`ATH_PAGES = ['home', 'about', 'contact', 'blog', 'bao-gia', 'noi-that']`). When new pages were created in SectionsPage, they weren't included in the header/footer sync. Now the LayoutTab loads all pages dynamically from API before saving, ensuring all pages get the updated header/footer config.

---

### Task: Auto-sync Header Navigation When Creating/Deleting Pages

**🆕 Created:**
- `admin/src/app/utils/headerSync.ts` - Utility for auto-syncing header navigation when pages are created/deleted in SectionsPage

**✏️ Modified:**
- `admin/src/app/pages/SectionsPage.tsx` - Integrated headerSync utilities to automatically add/remove pages from header navigation

**Details:** When creating a new page in Pages & Sections, it's now automatically added to the header navigation. When deleting a page, it's automatically removed from the header navigation. This eliminates the need to manually update both places.

---

### Task: Fix Frontend Apps Not Connecting to Production API

**✏️ Modified:**
- `packages/shared/src/config.ts` - Simplified config to work with Vite's `define` replacement, removed caching logic
- `landing/vite.config.ts` - Already had `loadEnv` + `define` pattern (verified working)
- `admin/vite.config.ts` - Added `loadEnv` + `define` pattern for build-time env replacement
- `portal/vite.config.ts` - Added `loadEnv` + `define` pattern for build-time env replacement

**Root Cause:** Vite's `define` option replaces exact string patterns at build time. The shared package was using intermediate variables and optional chaining which prevented the replacement from working.

**Solution:** Simplified `config.ts` to use direct `import.meta.env.VITE_API_URL` access, and ensured all vite configs use `define` to replace these values at build time.

---

### Task: GCP Deployment - Phase 7 Completion & Codebase Review

**✏️ Modified:**
- `infra/gcp/cloudbuild-landing.yaml` - Fixed API URL (noithanhnhanh → noithatnhanh)
- `infra/gcp/cloudbuild-admin.yaml` - Fixed API URL (noithanhnhanh → noithatnhanh)
- `infra/gcp/cloudbuild-portal.yaml` - Fixed API URL (noithanhnhanh → noithatnhanh)
- `infra/gcp/deploy-manual.sh` - Fixed API URL (anhthoxay → noithatnhanh)
- `docs/DEPLOYMENT_PROGRESS.md` - Updated Phase 7 completion, added file structure documentation

**🆕 Created:**
- `infra/gcp/alert-policy-api.json` - Alert policy for API uptime monitoring
- `infra/gcp/alert-policy-landing.json` - Alert policy for Landing uptime monitoring

---

## 2026-01-07

### Task: Google Cloud Deployment Configuration

**🆕 Created:**
- `infra/docker/nginx.conf` - Nginx configuration for SPA routing with gzip, caching, security headers
- `infra/docker/frontend.Dockerfile` - Multi-stage Dockerfile for Landing/Admin/Portal apps
- `infra/docker/api.Dockerfile` - Multi-stage Dockerfile for API with Prisma client
- `infra/gcp/cloudbuild-landing.yaml` - Cloud Build config for Landing app
- `infra/gcp/cloudbuild-admin.yaml` - Cloud Build config for Admin app
- `infra/gcp/cloudbuild-portal.yaml` - Cloud Build config for Portal app
- `infra/gcp/cloudbuild-api.yaml` - Cloud Build config for API with secrets
- `infra/gcp/setup.sh` - Automated GCP infrastructure setup script
- `infra/gcp/deploy-manual.sh` - Manual deployment script for quick deploys
- `docs/DEPLOYMENT_GCP.md` - Comprehensive deployment guide for Google Cloud

---

## 2026-01-07

### Task: Phase 7 - Load Testing & Documentation (high-traffic-resilience spec - Tasks 19-21)

**🆕 Created:**
- `scripts/load-test/config.js` - Shared configuration for k6 load tests (base URL, thresholds, endpoints, VU scenarios)
- `scripts/load-test/baseline.js` - Baseline load test for normal traffic patterns (50 VUs, 5 minutes)
- `scripts/load-test/stress.js` - Stress test with ramp-up to 500 VUs to identify breaking point
- `scripts/load-test/metrics-reporter.js` - Utility module for generating detailed metrics reports (JSON, CSV, HTML)
- `scripts/load-test/bottleneck-detection.js` - Component-specific bottleneck detection test
- `scripts/load-test/README.md` - Documentation for load testing scripts
- `scripts/load-test/results/.gitkeep` - Results directory placeholder
- `docs/infrastructure/auto-scaling.md` - Auto-scaling configuration documentation (CPU/memory thresholds, scaling policies, scheduled scaling)
- `docs/infrastructure/backup-recovery.md` - Backup and recovery procedures (RTO/RPO targets, database/Redis/media backup, DR strategy)
- `docs/infrastructure/deployment-checklist.md` - Comprehensive deployment checklist (pre/post deployment, rollback procedures)

---

### Task: Implement Configuration Hot Reload (high-traffic-resilience spec - Task 17)

**🆕 Created:**
- `api/src/config/hot-reload.ts` - Configuration hot reload service with:
  - Zod schemas for runtime configuration validation (rate limits, feature flags, cache TTL)
  - Polling from Redis with configurable interval (default: 30 seconds)
  - Configuration validation before applying changes
  - Rejection of invalid configurations
  - Change logging with old and new values
  - Change handlers for subscribing to configuration updates
  - Convenience functions for accessing configuration
  - (Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6)
- `api/src/config/hot-reload.test.ts` - Unit tests for hot reload service (28 tests)

---

### Task: Implement Emergency Mode Integration (high-traffic-resilience spec - Task 16.5)

**✏️ Modified:**
- `api/src/main.ts` - Integrated emergency mode features into main application:
  - Added emergency-aware rate limiters (loginEmergencyRateLimiter, formEmergencyRateLimiter, globalEmergencyRateLimiter)
  - Added suspicious activity detection middleware
  - Added emergency mode header middleware
  - Initialized emergency mode service with periodic check for auto-activation
  - Added emergency mode service cleanup to shutdown handlers
  - (Requirements 14.5, 14.6)
- `api/src/services/emergency-mode.service.ts` - Fixed lint error (removed redundant type annotation)

---

### Task: Implement Emergency Mode (high-traffic-resilience spec - Task 16.5)

**🆕 Created:**
- `api/src/services/emergency-mode.service.ts` - Comprehensive emergency mode service with:
  - Centralized emergency mode activation/deactivation
  - Auto-detection of attacks based on blocked IPs and violation thresholds
  - Attack metrics tracking (violations per minute/hour, blocked IPs count)
  - Configurable auto-activation thresholds
  - Auto-expiration of emergency mode
  - Periodic check for auto-activation and expiration
  - Integration with IP blocking service and emergency rate limiter
  - CAPTCHA challenge rate configuration and enforcement
  - (Requirements 14.5, 14.6)
- `api/src/services/emergency-mode.service.test.ts` - Unit tests for emergency mode service (12 tests)

**✏️ Modified:**
- `api/src/routes/ip-blocking.routes.ts` - Added new emergency mode endpoints:
  - GET `/emergency/status` - Detailed status with metrics
  - GET `/emergency/metrics` - Attack metrics for monitoring
  - POST `/emergency/activate` - Manual activation with custom settings
  - POST `/emergency/deactivate` - Manual deactivation
  - GET/PUT `/captcha/config` - CAPTCHA challenge rate configuration
  - POST `/captcha/reset` - Reset CAPTCHA config to defaults
  - (Requirements 14.5, 14.6)
- `api/src/middleware/emergency-rate-limiter.ts` - Integrated with emergency mode service for violation tracking to enable auto-activation
- `api/src/middleware/suspicious-activity.ts` - Added suspicious activity detection and CAPTCHA challenge rate middleware

---

### Task: Add SLO Alerting (high-traffic-resilience spec - Task 14.4)

**✏️ Modified:**
- `api/src/services/slo.service.ts` - Enhanced SLO alerting with:
  - Added `AlertConfig` interface for configurable alerting behavior
  - Added `severity` field to alerts (warning/critical)
  - Added `alertId` field for unique alert tracking
  - Added `error_budget_warning` alert type for early warning when budget is low
  - Added alert history tracking with `getAlertHistory()`, `getAlertsByType()`, `getAlertsBySeverity()` methods
  - Added `externalAlertHandler` callback for integration with external alerting systems
  - Added `forceCheckAndAlert()` method for manual/testing alert checks
  - Added `updateAlertConfig()` and `getAlertConfig()` methods
  - Enhanced logging with severity-based log levels (error for critical, warn for warning)
  - (Requirements 13.2)
- `api/src/services/slo.service.test.ts` - Added comprehensive tests for alerting functionality (12 new tests)

---

### Task: Implement SLO Monitoring Service (high-traffic-resilience spec)

**✏️ Modified:**
- `api/src/services/slo.service.ts` - Fixed error budget calculation to properly handle edge case where total budget is 0 (isExhausted should only be true when there are actual failures exceeding the budget)
- `api/src/services/slo.service.test.ts` - Fixed test configuration to include all required fields for SLOConfig

**Note:** SLO service was already implemented with:
- Request success/failure tracking (Requirement 13.1)
- Availability calculation with 4+ decimal precision (Requirement 13.1, 13.5)
- P99/P95 latency percentile tracking (Requirement 13.4, 13.5)
- Error budget calculation and tracking (Requirement 13.4, 13.5)
- Alert callbacks for availability breach, latency breach, and error budget exhaustion (Requirement 13.2)
- Redis storage with in-memory fallback
- Rolling window support (default 30 days)

---

### Task: Enhance Correlation ID Propagation (high-traffic-resilience spec)

**✏️ Modified:**
- `api/src/middleware/correlation-id.ts` - Enhanced correlation ID middleware with X-Request-ID header support (standard), child context creation for spans, external service header injection, and full correlation context tracking (Requirements 10.1, 10.3, 10.4, 10.5)
- `api/src/utils/logger.ts` - Updated logger to include spanId and parentId from correlation context for distributed tracing
- `api/src/services/google-sheets.service.ts` - Added correlation ID parameter to syncLeadToSheet method for distributed tracing (Requirements 10.3)
- `api/src/routes/leads.routes.ts` - Updated to pass correlation ID to Google Sheets sync calls (Requirements 10.3)

**🆕 Created:**
- `api/src/middleware/correlation-id.test.ts` - Comprehensive tests for correlation ID middleware (25 tests)

---

### Task: Implement Request Timeout Manager (high-traffic-resilience spec)

**🆕 Created:**
- `api/src/middleware/timeout.ts` - Request timeout middleware with configurable timeouts per operation type (default: 30s, database: 10s, external: 15s, healthCheck: 100ms), circuit breaker integration, cache fallback when circuit open, and comprehensive logging (Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6)
- `api/src/middleware/timeout.test.ts` - Unit tests for timeout middleware (17 tests)

---

### Task: Implement Redis Cluster Support (high-traffic-resilience spec)

**🆕 Created:**
- `api/src/config/redis-cluster.ts` - Redis cluster client supporting both single node and cluster modes with automatic failover handling, in-memory fallback, and reconnection logic (Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6)
- `api/src/config/redis-cluster.test.ts` - Unit tests for Redis cluster client (23 tests)

---

### Task: Implement Secret Rotation Service (high-traffic-resilience spec)

**🆕 Created:**
- `api/src/services/secret-rotation.service.ts` - Secret rotation service supporting multiple JWT secrets and encryption keys during transition periods, with re-encryption utilities and rotation event logging (Requirements 6.1, 6.2, 6.5, 6.6)
- `api/src/services/secret-rotation.service.test.ts` - Unit tests for secret rotation service (24 tests)

**✏️ Modified:**
- `env.example` - Added documentation for JWT_SECRET_PREVIOUS and ENCRYPTION_KEY_PREVIOUS environment variables

---

### Task: Implement Graceful Shutdown Manager (high-traffic-resilience spec)

**🆕 Created:**
- `api/src/utils/shutdown.ts` - Graceful shutdown manager with connection draining, configurable timeouts, cleanup handlers, and shutdown metrics (Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6)
- `api/src/utils/shutdown.test.ts` - Unit tests for shutdown manager

**✏️ Modified:**
- `api/src/main.ts` - Updated to use new ShutdownManager with registered cleanup handlers for database, Redis, and Sentry

---

### Task: Enhance Health Check System (high-traffic-resilience spec)

**🆕 Created:**
- `api/src/services/health.service.ts` - Comprehensive health monitoring service with liveness/readiness probes, dependency checks, and shutdown state management (Requirements 4.1, 4.2, 4.3, 4.4, 4.6)
- `api/src/services/health.service.test.ts` - Unit tests for health service

**✏️ Modified:**
- `api/src/routes/health.routes.ts` - Updated to use new health service for comprehensive health checks
- `api/src/main.ts` - Added setShutdownState call in graceful shutdown handler

---

### Task: Implement Database Read Replica Support (high-traffic-resilience spec)

**🆕 Created:**
- `api/src/utils/db.ts` - Database utilities with read/write separation helpers (dbRead, dbWrite, dbReadPrimary), service factory, and health check (Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6)

**✏️ Modified:**
- `api/src/utils/prisma-replica.ts` - Enhanced with circuit breaker pattern for replica fallback, automatic recovery, and replication lag detection (Requirements 3.3, 3.5)
- `api/src/utils/prisma-replica.test.ts` - Added circuit breaker tests
- `api/src/services/region.service.ts` - Updated to use query router for read/write separation (Requirements 3.4, 3.6)
- `api/src/services/pricing.service.ts` - Updated to use query router for read/write separation (Requirements 3.4, 3.6)

---

### Task: Implement CDN Purge Endpoint (high-traffic-resilience spec)

**🆕 Created:**
- `api/src/services/cdn.service.ts` - CDN service for cache invalidation with Cloudflare API support (Requirements 2.4, 2.6)
- `api/src/services/cdn.service.test.ts` - Unit tests for CDN service
- `api/src/routes/cdn.routes.ts` - Admin CDN routes for cache purging (Requirements 2.4, 2.6)

**✏️ Modified:**
- `api/src/main.ts` - Added CDN routes registration at `/api/admin/cdn`

---

### Task: Implement Stateless API Verification (high-traffic-resilience spec)

**🆕 Created:**
- `api/src/config/cluster.ts` - Cluster configuration module with instance ID generation, cluster mode detection (Requirements 1.1, 1.2)
- `api/src/config/cluster.test.ts` - Unit tests for cluster configuration
- `api/src/services/storage/storage.interface.ts` - Storage interface for file operations (Requirements 1.5)
- `api/src/services/storage/local.storage.ts` - Local filesystem storage implementation
- `api/src/services/storage/s3.storage.ts` - S3/R2 storage implementation for shared storage
- `api/src/services/storage/index.ts` - Storage factory with automatic provider selection
- `api/src/services/storage/storage.test.ts` - Unit tests for storage module
- `api/src/services/redis-health.service.ts` - Redis health monitoring and degraded mode handling (Requirements 1.6)
- `api/src/services/redis-health.service.test.ts` - Unit tests for Redis health service

---

## 2026-01-06

### Task: Implement Per-User Rate Limiting (production-scalability spec)

**🆕 Created:**
- `api/src/middleware/user-rate-limiter.ts` - Per-user rate limiting middleware with role-based multipliers (Requirements 15.1, 15.2, 15.3, 15.4, 15.5)
- `api/src/middleware/user-rate-limiter.test.ts` - Property-based tests for per-user rate limiting (Property 28, 29)

**✏️ Modified:**
- `api/src/routes/queue-health.routes.ts` - Fixed auth middleware imports to use factory pattern
- `api/src/main.ts` - Updated queue health routes to pass prisma client
- `api/src/services/google-sheets-batch.service.test.ts` - Fixed empty function lint error
- `.kiro/specs/production-scalability/tasks.md` - Marked tasks 16.7 and 18 as complete

---

### Task: Integrate batch service with sync queue (production-scalability spec)

**✏️ Modified:**
- `api/src/queues/workers/sync.worker.ts` - Integrated GoogleSheetsBatchService for batch operations, replacing individual appends with batch processing (Requirements 14.1, 14.2)

---

### Task: Complete Prometheus Metrics Integration (production-scalability spec)

**✏️ Modified:**
- `api/src/services/cache.service.ts` - Added Prometheus metrics for cache hits and misses (Requirements 12.5)
- `api/src/services/rate-limit-monitoring.service.ts` - Added Prometheus metrics for rate limit exceeded events (Requirements 12.7)
- `api/src/queues/workers/email.worker.ts` - Added Prometheus metrics for queue job status (Requirements 12.6)
- `api/src/queues/workers/sync.worker.ts` - Added Prometheus metrics for queue job status (Requirements 12.6)
- `api/src/queues/workers/notification.worker.ts` - Added Prometheus metrics for queue job status (Requirements 12.6)
- `api/src/middleware/idempotency.ts` - Fixed console.info to use structured logger

---

### Task: Fix lint/typecheck errors and warnings (production-scalability spec)

**✏️ Modified:**
- `api/src/services/rate-limit-monitoring.service.test.ts` - Fixed unnecessary escape characters in regex patterns
- `api/src/middleware/idempotency.ts` - Removed unused eslint-disable directives
- `api/src/routes/project.routes.test.ts` - Removed unused imports (beforeEach, vi, z, userFixtures, projectFixtures, roleGen)
- `api/src/services/review/review.service.test.ts` - Fixed non-null assertions with proper type guards
- `api/src/utils/distributed-lock.ts` - Removed unused eslint-disable directives and console.debug calls
- `api/src/utils/prisma.ts` - Removed unused eslint-disable directive
- `landing/src/app/components/ReadingProgressBar.tsx` - Removed unused useCallback import
- `landing/src/app/components/ScrollSnapCarousel.tsx` - Removed unused useCallback import
- `landing/tsconfig.app.json` - Added module: ESNext and moduleResolution: bundler for import.meta support
- `portal/tsconfig.app.json` - Added module: ESNext and moduleResolution: bundler for import.meta support
- `admin/tsconfig.app.json` - Added module: ESNext and moduleResolution: bundler for import.meta support
- `packages/shared/src/config.ts` - Fixed import.meta type handling for cross-environment compatibility
- `landing/src/app/sections/RichTextSection/blocks/ParagraphBlock.tsx` - Fixed DOMPurify.Config to Config import
- `landing/src/app/sections/RichTextSection/RichTextSection.tsx` - Fixed DOMPurify.Config to Config import
- `landing/src/app/utils/simpleMarkdown.tsx` - Fixed DOMPurify.Config to Config import
- `admin/src/app/components/MarkdownEditor.tsx` - Fixed DOMPurify.Config to Config import
- `admin/src/app/components/RichTextEditor.tsx` - Fixed DOMPurify.Config to Config import
- `admin/src/app/components/SectionEditor/previews/richtext/blocks/ParagraphBlock.tsx` - Fixed DOMPurify.Config to Config import
- `admin/src/app/components/SectionEditor/previews/RichTextPreview.tsx` - Fixed DOMPurify.Config to Config import
- `admin/src/app/components/VisualBlockEditor/components/BlocksPreview.tsx` - Fixed DOMPurify.Config to Config import
- `admin/src/app/pages/NotificationTemplatesPage/TemplateEditModal.tsx` - Fixed DOMPurify.Config to Config import
- `landing/src/app/hooks/useLocalStoragePersistence.test.ts` - Fixed localStorage mock using vi.stubGlobal

---

### Task: Implement Frontend Debounce (production-scalability spec)

**✏️ Modified:**
- `landing/src/app/sections/QuoteCalculatorSection.tsx` - Added debounced area preview calculation with loading indicator (300ms delay)
- `landing/src/app/sections/FurnitureQuote/steps/ProductStep.tsx` - Added debounced search with loading indicator (500ms delay)
- `landing/src/app/sections/MarketplaceSection.tsx` - Added debounced filters with loading indicator (500ms delay)
- `landing/src/app/sections/FurnitureQuote/components/VariantSelectionModal.tsx` - Added throttled resize handler (100ms interval)
- `landing/src/app/components/ReadingProgressBar.tsx` - Added throttled scroll handler (100ms interval)
- `landing/src/app/components/ScrollSnapCarousel.tsx` - Added throttled scroll handler (100ms interval)

---

### Task: Implement Circuit Breaker (production-scalability spec)

**🆕 Created:**
- `api/src/utils/circuit-breaker.ts` - Circuit breaker utility with opossum, Google Sheets breaker configuration
- `api/src/utils/circuit-breaker.test.ts` - Property-based tests for circuit breaker (Property 17, 18)

**✏️ Modified:**
- `api/src/queues/workers/sync.worker.ts` - Integrated circuit breaker with Google Sheets sync
- `package.json` - Added opossum and @types/opossum dependencies

---

### Task: Add rate limit dashboard to Admin Panel (production-scalability spec)

**✏️ Modified:**
- `admin/src/app/types/settings.ts` - Added 'rate-limits' to RouteType union
- `admin/src/app/components/Layout/constants.ts` - Added Rate Limit Monitor menu item
- `admin/src/app/app.tsx` - Added RateLimitPage import and route
- `admin/src/app/api/rate-limit.ts` - Fixed apiClient import to use apiFetch
- `admin/src/app/pages/RateLimitPage/index.tsx` - Fixed ResponsiveStack direction prop type

---

### Task: Add TurnstileWidget to quote forms and registration (production-scalability spec)

**🆕 Created:**
- `portal/src/components/TurnstileWidget.tsx` - Turnstile CAPTCHA widget for Portal app

**✏️ Modified:**
- `landing/src/app/sections/QuoteFormSection.tsx` - Added TurnstileWidget for CAPTCHA protection
- `landing/src/app/sections/FurnitureQuote/LeadForm.tsx` - Added TurnstileWidget for CAPTCHA protection
- `portal/src/components/index.ts` - Exported TurnstileWidget
- `portal/src/pages/auth/RegisterPage.tsx` - Added TurnstileWidget for registration CAPTCHA
- `portal/src/auth/AuthContext.tsx` - Added turnstileToken to RegisterInput interface

---

### Task: Implement Redis Cache Layer (production-scalability spec)

**🆕 Created:**
- `api/src/services/cache.service.ts` - CacheService class with getOrSet, invalidate, invalidateByPattern methods
- `api/src/services/cache.service.test.ts` - Property-based tests for cache TTL, invalidation, and status headers

**✏️ Modified:**
- `api/src/routes/pricing.routes.ts` - Added cache to service categories and materials endpoints with invalidation
- `api/src/routes/settings.routes.ts` - Added cache to settings endpoints with invalidation
- `api/src/routes/region.routes.ts` - Added cache to regions endpoints with invalidation
- `api/src/middleware/cache.ts` - Updated X-Cache header to X-Cache-Status for consistency
