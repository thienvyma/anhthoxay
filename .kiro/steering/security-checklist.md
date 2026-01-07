# 🔐 Security & Auth Checklist

## ⚠️ BẮT BUỘC KIỂM TRA KHI THÊM/SỬA TÍNH NĂNG

### 1. KHI TẠO API ENDPOINT MỚI

```typescript
// ❌ SAI - Endpoint không có auth
app.get('/api/admin/users', async (c) => { ... });

// ✅ ĐÚNG - Có auth middleware
app.get('/api/admin/users', authenticate(), requireRole('ADMIN'), async (c) => { ... });
```

**Checklist:**
- [ ] Endpoint có cần authentication không? → Thêm `authenticate()` middleware
- [ ] Endpoint cần role cụ thể không? → Thêm `requireRole('ADMIN')` hoặc `requireRole('ADMIN', 'MANAGER')`
- [ ] Endpoint public (landing page) → Không cần auth, nhưng cần rate limiting nếu có form submit

### 2. PHÂN LOẠI ENDPOINT THEO ROLE

| Loại | Roles | Ví dụ |
|------|-------|-------|
| Public | Không cần auth | GET /api/blog/posts, GET /api/settings, GET /api/regions |
| Homeowner | HOMEOWNER, CONTRACTOR, WORKER, MANAGER, ADMIN | GET /api/user/profile |
| Contractor | CONTRACTOR, MANAGER, ADMIN | GET /api/contractor/profile |
| Worker | WORKER, MANAGER, ADMIN | GET /api/worker/jobs |
| Manager | MANAGER, ADMIN | POST /api/blog/posts, GET /api/leads |
| Admin Only | ADMIN | POST /api/users, DELETE /api/*, Settings, Verify contractors |

> **Role Hierarchy**: ADMIN > MANAGER > CONTRACTOR > HOMEOWNER > WORKER > USER

### 3. KHI SỬA FILE TRONG CÁC THƯ MỤC SAU

```
api/src/main.ts          → Kiểm tra auth middleware cho routes mới
api/src/routes/*.ts      → Kiểm tra auth cho từng endpoint
admin/src/app/pages/*    → Kiểm tra ProtectedRoute wrapper
admin/src/app/api.ts     → Kiểm tra Authorization header
```

### 4. RATE LIMITING CHO FORM SUBMISSIONS

```typescript
// Các endpoint cần rate limiting:
// - POST /api/leads (form báo giá, liên hệ)
// - POST /api/newsletter (đăng ký newsletter)
// - POST /auth/login (đăng nhập)

// ✅ ĐÚNG
app.post('/api/leads', rateLimiter({ maxAttempts: 5, windowMs: 60000 }), async (c) => { ... });
```

### 5. INPUT VALIDATION

```typescript
// ❌ SAI - Không validate
const body = await c.req.json();
await prisma.user.create({ data: body });

// ✅ ĐÚNG - Dùng validation middleware
import { validate, validateQuery } from '../middleware/validation';

// Validate request body
app.post('/items', validate(CreateItemSchema), async (c) => {
  const data = c.req.valid('json'); // Type-safe validated data
  await prisma.item.create({ data });
});

// Validate query parameters
app.get('/items', validateQuery(ListQuerySchema), async (c) => {
  const query = c.req.valid('query'); // Type-safe validated query
  // ...
});

// Validation errors automatically return:
// { success: false, error: { code: 'VALIDATION_ERROR', message: '...', details: {...} }, correlationId }
```

## 🔄 REFACTORING GUIDELINES

### 1. KHI THÊM TÍNH NĂNG MỚI

**Trước khi code:**
- [ ] Tính năng này cần auth không?
- [ ] Role nào được phép truy cập?
- [ ] Có cần rate limiting không?
- [ ] Input validation đã đủ chưa?

**Sau khi code:**
- [ ] Đã thêm auth middleware chưa?
- [ ] Đã test với user không có quyền chưa?
- [ ] Đã thêm vào danh sách protected routes chưa?

### 2. KHI SỬA TÍNH NĂNG CŨ

- [ ] Kiểm tra auth hiện tại có đúng không
- [ ] Nếu thêm endpoint mới → thêm auth
- [ ] Nếu đổi logic → không làm mất auth

### 3. CODE ORGANIZATION CHO DỄ MAINTAIN

```
api/src/
├── main.ts                     # Entry point (~150 lines)
├── config/
│   └── cors.ts                 # CORS configuration from env
├── middleware/
│   ├── auth.middleware.ts      # Auth logic tập trung
│   ├── correlation-id.ts       # Request tracing
│   ├── error-handler.ts        # Global error handler
│   ├── rate-limiter.ts         # Rate limiting tập trung
│   ├── security-headers.ts     # Security headers
│   ├── validation.ts           # Zod validation middleware
│   └── api-key-auth.middleware.ts # API Key authentication middleware
├── routes/
│   ├── auth.routes.ts          # /api/auth/* endpoints
│   ├── users.routes.ts         # /api/users/* endpoints (ADMIN only)
│   ├── contractor.routes.ts    # /api/contractor/*, /api/admin/contractors/*
│   ├── region.routes.ts        # /api/regions/*, /api/admin/regions/*
│   ├── bidding-settings.routes.ts  # /api/settings/bidding, /api/admin/settings/bidding
│   ├── service-fee.routes.ts   # /api/service-fees/*, /api/admin/service-fees/*
│   ├── project.routes.ts       # /api/projects/*, /api/homeowner/projects/*, /api/admin/projects/*
│   ├── bid.routes.ts           # /api/contractor/bids/*, /api/admin/bids/*
│   ├── escrow.routes.ts        # /api/admin/escrows/*
│   ├── fee.routes.ts           # /api/admin/fees/*
│   ├── match.routes.ts         # /api/admin/matches/*
│   ├── dispute.routes.ts       # /api/*/disputes/*
│   ├── chat.routes.ts          # /api/chat/*, /api/admin/chat/*
│   ├── notification.routes.ts  # /api/notifications/*
│   ├── notification-template.routes.ts  # /api/admin/notification-templates/*
│   ├── scheduled-notification.routes.ts # /api/admin/scheduled-notifications/*
│   ├── unsubscribe.routes.ts   # /api/unsubscribe/*
│   ├── review.routes.ts        # /api/reviews/*, /api/*/reviews/*
│   ├── ranking.routes.ts       # /api/rankings/*, /api/admin/rankings/*
│   ├── report.routes.ts        # /api/reviews/:id/report, /api/admin/review-reports/*
│   ├── saved-project.routes.ts # /api/contractor/saved-projects/*
│   ├── activity.routes.ts      # /api/user/activity/*
│   ├── pages.routes.ts         # /pages/*, /sections/*
│   ├── media.routes.ts         # /media/*
│   ├── leads.routes.ts         # /leads/*
│   ├── pricing.routes.ts       # /service-categories/*, /unit-prices/*, etc.
│   ├── blog.routes.ts          # /blog/*
│   ├── settings.routes.ts      # /settings/*
│   ├── integrations.routes.ts  # /integrations/*
│   ├── api-keys.routes.ts      # /api/admin/api-keys/* (ADMIN only)
│   └── external-api.routes.ts  # /api/external/* (API Key auth)
├── services/
│   ├── auth.service.ts         # Auth business logic
│   ├── contractor.service.ts   # Contractor profile & verification logic
│   ├── region.service.ts       # Region CRUD logic
│   ├── bidding-settings.service.ts # Bidding settings logic
│   ├── service-fee.service.ts  # Service fee CRUD logic
│   ├── project.service.ts      # Project CRUD & status logic
│   ├── bid.service.ts          # Bid CRUD & status logic
│   ├── escrow.service.ts       # Escrow management logic
│   ├── fee.service.ts          # Fee transaction logic
│   ├── match.service.ts        # Match management logic
│   ├── milestone.service.ts    # Milestone management logic
│   ├── dispute.service.ts      # Dispute resolution logic
│   ├── notification.service.ts # Notification creation logic
│   ├── notification-channel.service.ts # Multi-channel delivery
│   ├── notification-template.service.ts # Template management
│   ├── scheduled-notification.service.ts # Scheduled notifications
│   ├── unsubscribe.service.ts  # Unsubscribe management
│   ├── chat.service.ts         # Chat & messaging logic
│   ├── review.service.ts       # Review CRUD logic
│   ├── ranking.service.ts      # Ranking calculation logic
│   ├── ranking-job.service.ts  # Daily ranking job
│   ├── report.service.ts       # Review report logic
│   ├── badge.service.ts        # Badge management logic
│   ├── badge-job.service.ts    # Badge calculation job
│   ├── review-reminder.service.ts # Review reminder logic
│   ├── saved-project.service.ts # Saved project logic
│   ├── activity.service.ts     # Activity history logic
│   ├── pages.service.ts        # Pages CRUD logic
│   ├── media.service.ts        # Media upload/delete logic
│   ├── leads.service.ts        # Leads CRUD & stats logic
│   ├── pricing.service.ts      # Pricing CRUD logic
│   ├── quote.service.ts        # Quote calculation logic
│   ├── users.service.ts        # User management logic
│   ├── google-sheets.service.ts # Google Sheets integration
│   └── api-key.service.ts      # API Key management logic
├── schemas/
│   ├── index.ts                # Re-exports all schemas
│   ├── auth.schema.ts          # Auth validation schemas
│   ├── contractor.schema.ts    # Contractor profile validation schemas
│   ├── region.schema.ts        # Region validation schemas
│   ├── bidding-settings.schema.ts # Bidding settings schemas
│   ├── service-fee.schema.ts   # Service fee schemas
│   ├── project.schema.ts       # Project validation schemas
│   ├── bid.schema.ts           # Bid validation schemas
│   ├── escrow.schema.ts        # Escrow validation schemas
│   ├── fee.schema.ts           # Fee validation schemas
│   ├── match.schema.ts         # Match validation schemas
│   ├── milestone.schema.ts     # Milestone validation schemas
│   ├── dispute.schema.ts       # Dispute validation schemas
│   ├── notification.schema.ts  # Notification schemas
│   ├── notification-preference.schema.ts # Notification preference schemas
│   ├── notification-template.schema.ts # Template schemas
│   ├── scheduled-notification.schema.ts # Scheduled notification schemas
│   ├── unsubscribe.schema.ts   # Unsubscribe schemas
│   ├── chat.schema.ts          # Chat validation schemas
│   ├── review.schema.ts        # Review validation schemas
│   ├── ranking.schema.ts       # Ranking validation schemas
│   ├── report.schema.ts        # Report validation schemas
│   ├── badge.schema.ts         # Badge validation schemas
│   ├── saved-project.schema.ts # Saved project schemas
│   ├── activity.schema.ts      # Activity validation schemas
│   ├── pages.schema.ts         # Pages validation schemas
│   ├── media.schema.ts         # Media validation schemas
│   ├── leads.schema.ts         # Leads validation schemas
│   ├── pricing.schema.ts       # Pricing validation schemas
│   ├── blog.schema.ts          # Blog validation schemas
│   ├── settings.schema.ts      # Settings validation schemas
│   ├── users.schema.ts         # Users validation schemas
│   └── api-key.schema.ts       # API Key validation schemas
└── utils/
    ├── logger.ts               # Structured logging
    └── response.ts             # Response helpers
```

### 4. TRÁNH CODE TRÙNG LẶP

```typescript
// ❌ SAI - Copy-paste auth check
app.get('/api/users', async (c) => {
  const token = c.req.header('Authorization');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  // ... verify token manually
});

// ✅ ĐÚNG - Dùng middleware
app.get('/api/users', authenticate(), async (c) => {
  const user = c.get('user'); // User đã được verify
});
```

## 📋 PROTECTED ROUTES REGISTRY

Khi thêm route mới, cập nhật danh sách này:

### JWT Auth Routes (`/api/auth/*`) - Cho TẤT CẢ Apps (Admin, Landing, User, Worker)
- `POST /api/auth/register` - Tạo user mới (ADMIN only)
- `POST /api/auth/signup` - Đăng ký công khai cho homeowner/contractor (Public + Rate limiting)
  - accountType: "homeowner" → auto-approve, role = HOMEOWNER, auto-login
  - accountType: "contractor" → verificationStatus = PENDING, role = CONTRACTOR, cần xét duyệt
- `POST /api/auth/login` - Đăng nhập (Public + Rate limiting) + Session limit (max 5)
- `POST /api/auth/refresh` - Refresh token với rotation (Public)
- `POST /api/auth/logout` - Đăng xuất + Blacklist token (Authenticated)
- `POST /api/auth/change-password` - Đổi password + Revoke all sessions (Authenticated)
- `GET /api/auth/me` - Thông tin user (Authenticated)
- `GET /api/auth/sessions` - Danh sách sessions (Authenticated)
- `DELETE /api/auth/sessions/:id` - Xóa session (Authenticated)
- `DELETE /api/auth/sessions` - Xóa tất cả sessions khác (Authenticated)

> **Note**: Cookie auth đã được loại bỏ. Toàn bộ hệ thống dùng JWT duy nhất.

### JWT Enhancement Features (v2)
- **Token Rotation**: Mỗi lần refresh → token mới, token cũ bị vô hiệu
- **Token Blacklist**: Logout/đổi password → token bị blacklist ngay lập tức
- **Token Reuse Detection**: Phát hiện token bị đánh cắp → revoke all sessions
- **Audit Logging**: Log tất cả auth events (login, logout, password change, security events)
- **Session Limits**: Max 5 sessions/user, tự động kick oldest
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, Cache-Control

### Admin Panel Routes (requireRole('ADMIN'))
- `/api/users/*` - Quản lý users (list, create, update, delete, ban)
- `/api/users/:id/sessions` - Xem sessions của user
- `/api/users/:id/sessions/:sessionId` - Revoke session
- `/api/users/:id/ban` - Ban user (revoke all sessions)
- `/api/admin/settings/*` - Cài đặt hệ thống
- `/api/pricing/*` - Cấu hình giá (formulas, categories)
- `/api/admin/contractors` - Danh sách nhà thầu (ADMIN only)
- `/api/admin/contractors/:id` - Chi tiết nhà thầu (ADMIN only)
- `/api/admin/contractors/:id/verify` - Duyệt/từ chối nhà thầu (ADMIN only)
- `POST /api/admin/regions` - Tạo khu vực mới (ADMIN only)
- `PUT /api/admin/regions/:id` - Cập nhật khu vực (ADMIN only)
- `DELETE /api/admin/regions/:id` - Xóa khu vực (ADMIN only)
- `GET /api/admin/settings/bidding` - Lấy full cấu hình đấu giá (ADMIN only)
- `PUT /api/admin/settings/bidding` - Cập nhật cấu hình đấu giá (ADMIN only)
- `GET /api/admin/service-fees` - Danh sách tất cả phí dịch vụ (ADMIN only)
- `GET /api/admin/service-fees/:id` - Chi tiết phí dịch vụ (ADMIN only)
- `POST /api/admin/service-fees` - Tạo phí dịch vụ mới (ADMIN only)
- `PUT /api/admin/service-fees/:id` - Cập nhật phí dịch vụ (ADMIN only)
- `DELETE /api/admin/service-fees/:id` - Xóa phí dịch vụ (ADMIN only)

### Contractor Routes (requireRole('CONTRACTOR'))
- `GET /api/contractor/profile` - Xem hồ sơ năng lực (CONTRACTOR only)
- `PUT /api/contractor/profile` - Cập nhật hồ sơ năng lực (CONTRACTOR only)
- `POST /api/contractor/submit-verification` - Gửi hồ sơ xét duyệt (CONTRACTOR only)

### Homeowner Routes (requireRole('HOMEOWNER'))
- `POST /api/homeowner/projects` - Tạo công trình mới
- `GET /api/homeowner/projects` - Danh sách công trình của tôi
- `GET /api/homeowner/projects/:id` - Chi tiết công trình của tôi
- `PUT /api/homeowner/projects/:id` - Cập nhật công trình (chỉ DRAFT/REJECTED)
- `POST /api/homeowner/projects/:id/submit` - Gửi duyệt công trình
- `DELETE /api/homeowner/projects/:id` - Xóa công trình (chỉ DRAFT)
- `GET /api/homeowner/projects/:id/bids` - Xem bids đã duyệt (ẩn thông tin nhà thầu)

### Homeowner Routes - Match Management (requireRole('HOMEOWNER'))
- `POST /api/homeowner/projects/:id/select-bid` - Chọn bid (BIDDING_CLOSED → MATCHED)
- `GET /api/homeowner/projects/:id/match` - Xem chi tiết match (contractor info, escrow, fee)
- `POST /api/homeowner/projects/:id/start` - Bắt đầu thi công (MATCHED → IN_PROGRESS)
- `POST /api/homeowner/projects/:id/complete` - Hoàn thành công trình (IN_PROGRESS → COMPLETED)
- `POST /api/homeowner/projects/:id/cancel` - Hủy match (xử lý escrow refund, fee cancellation)

### Homeowner Routes - Milestone Management (requireRole('HOMEOWNER'))
- `POST /api/homeowner/projects/:id/milestone/:milestoneId/confirm` - Xác nhận milestone hoàn thành
- `POST /api/homeowner/projects/:id/milestone/:milestoneId/dispute` - Tranh chấp milestone

### Contractor Routes - Bidding (requireRole('CONTRACTOR'))
- `POST /api/contractor/bids` - Tạo bid mới (cần VERIFIED status)
- `GET /api/contractor/bids` - Danh sách bids của tôi
- `GET /api/contractor/bids/:id` - Chi tiết bid của tôi
- `PUT /api/contractor/bids/:id` - Cập nhật bid (chỉ PENDING)
- `DELETE /api/contractor/bids/:id` - Rút bid (PENDING/APPROVED → WITHDRAWN)
- `GET /api/contractor/bids/:id/match` - Xem chi tiết match (homeowner info, address, escrow, fee)

### Contractor Routes - Milestone Management (requireRole('CONTRACTOR'))
- `POST /api/contractor/bids/:id/milestone/:milestoneId/request` - Yêu cầu xác nhận milestone hoàn thành

### Admin Routes - Project Management (requireRole('ADMIN'))
- `GET /api/admin/projects` - Danh sách tất cả công trình
- `GET /api/admin/projects/:id` - Chi tiết công trình (bao gồm owner info)
- `PUT /api/admin/projects/:id/approve` - Duyệt công trình (PENDING_APPROVAL → OPEN)
- `PUT /api/admin/projects/:id/reject` - Từ chối công trình (PENDING_APPROVAL → REJECTED)

### Admin Routes - Bid Management (requireRole('ADMIN'))
- `GET /api/admin/bids` - Danh sách tất cả bids
- `GET /api/admin/bids/:id` - Chi tiết bid (bao gồm contractor profile)
- `PUT /api/admin/bids/:id/approve` - Duyệt bid (PENDING → APPROVED)
- `PUT /api/admin/bids/:id/reject` - Từ chối bid (PENDING → REJECTED)

### Admin Routes - Escrow Management (requireRole('ADMIN'))
- `GET /api/admin/escrows` - Danh sách escrows với filtering
- `GET /api/admin/escrows/:id` - Chi tiết escrow
- `PUT /api/admin/escrows/:id/confirm` - Xác nhận đặt cọc (PENDING → HELD)
- `PUT /api/admin/escrows/:id/release` - Giải phóng escrow
- `PUT /api/admin/escrows/:id/partial` - Giải phóng một phần escrow
- `PUT /api/admin/escrows/:id/refund` - Hoàn tiền escrow
- `PUT /api/admin/escrows/:id/dispute` - Đánh dấu tranh chấp

### Admin Routes - Fee Management (requireRole('ADMIN'))
- `GET /api/admin/fees` - Danh sách phí giao dịch với filtering
- `GET /api/admin/fees/:id` - Chi tiết phí giao dịch
- `PUT /api/admin/fees/:id/paid` - Đánh dấu đã thanh toán (PENDING → PAID)
- `PUT /api/admin/fees/:id/cancel` - Hủy phí giao dịch (PENDING → CANCELLED)
- `GET /api/admin/fees/export` - Xuất CSV danh sách phí

### Admin Routes - Match Management (requireRole('ADMIN'))
- `GET /api/admin/matches` - Danh sách matched projects
- `GET /api/admin/matches/:projectId` - Chi tiết match (homeowner, contractor, escrow, fee)
- `PUT /api/admin/matches/:projectId/cancel` - Hủy match (xử lý escrow refund, fee cancellation)

### Homeowner Routes - Dispute Management (requireRole('HOMEOWNER'))
- `POST /api/homeowner/projects/:id/dispute` - Tạo tranh chấp (escrow HELD/PARTIAL_RELEASED → DISPUTED)

### Contractor Routes - Dispute Management (requireRole('CONTRACTOR'))
- `POST /api/contractor/bids/:id/dispute` - Tạo tranh chấp (escrow HELD/PARTIAL_RELEASED → DISPUTED)

### Admin Routes - Dispute Management (requireRole('ADMIN'))
- `GET /api/admin/disputes` - Danh sách tranh chấp với filtering
- `GET /api/admin/disputes/:id` - Chi tiết tranh chấp
- `PUT /api/admin/disputes/:id/resolve` - Giải quyết tranh chấp (REFUND_TO_HOMEOWNER hoặc RELEASE_TO_CONTRACTOR)

### Chat Routes - User (Authenticated)
- `POST /api/chat/conversations` - Tạo cuộc hội thoại (HOMEOWNER/CONTRACTOR, project MATCHED + escrow HELD)
- `GET /api/chat/conversations` - Danh sách cuộc hội thoại của tôi
- `GET /api/chat/conversations/:id` - Chi tiết cuộc hội thoại (participant only)
- `POST /api/chat/conversations/:id/messages` - Gửi tin nhắn (participant only)
- `GET /api/chat/conversations/:id/messages` - Danh sách tin nhắn với pagination
- `PUT /api/chat/conversations/:id/read` - Đánh dấu đã đọc
- `GET /api/chat/conversations/:id/search` - Tìm kiếm tin nhắn
- `DELETE /api/chat/messages/:id` - Xóa tin nhắn (sender only, soft delete)

### Admin Routes - Chat Management (requireRole('ADMIN'))
- `GET /api/admin/chat/conversations` - Danh sách tất cả cuộc hội thoại với filtering
- `GET /api/admin/chat/conversations/:id` - Chi tiết cuộc hội thoại (full access)
- `POST /api/admin/chat/conversations/:id/messages` - Gửi tin nhắn hệ thống (type: SYSTEM)
- `PUT /api/admin/chat/conversations/:id/close` - Đóng cuộc hội thoại

### Admin Routes - Notification Templates (requireRole('ADMIN'))
- `GET /api/admin/notification-templates` - Danh sách tất cả mẫu thông báo
- `GET /api/admin/notification-templates/types` - Danh sách các loại mẫu
- `GET /api/admin/notification-templates/:type` - Chi tiết mẫu theo loại
- `POST /api/admin/notification-templates` - Tạo mẫu mới
- `PUT /api/admin/notification-templates/:type` - Cập nhật mẫu
- `DELETE /api/admin/notification-templates/:type` - Xóa mẫu
- `POST /api/admin/notification-templates/render` - Preview mẫu với biến
- `POST /api/admin/notification-templates/seed` - Tạo mẫu mặc định

### Admin Routes - Scheduled Notifications (requireRole('ADMIN'))
- `GET /api/admin/scheduled-notifications` - Danh sách scheduled notifications với filtering
- `GET /api/admin/scheduled-notifications/:id` - Chi tiết scheduled notification
- `PUT /api/admin/scheduled-notifications/:id/cancel` - Hủy scheduled notification
- `POST /api/admin/scheduled-notifications/process` - Trigger xử lý notifications đến hạn
- `POST /api/admin/scheduled-notifications/scan` - Scan và schedule reminders

### Notification Routes - User (Authenticated)
- `GET /api/notifications` - Danh sách thông báo với pagination và unread count
- `PUT /api/notifications/:id/read` - Đánh dấu thông báo đã đọc
- `PUT /api/notifications/read-all` - Đánh dấu tất cả thông báo đã đọc
- `GET /api/notifications/preferences` - Lấy cài đặt thông báo
- `PUT /api/notifications/preferences` - Cập nhật cài đặt thông báo

### Manager Routes (requireRole('ADMIN', 'MANAGER'))
- `/api/blog/*` - Quản lý blog
- `/api/leads/*` - Quản lý khách hàng
- `/api/media/*` - Quản lý media
- `GET /leads` - Danh sách leads với search, pagination
- `GET /leads/stats` - Thống kê leads cho dashboard charts
- `GET /leads/export` - Export CSV
- `PUT /leads/:id` - Cập nhật status, notes

### Integration Routes (requireRole('ADMIN'))
- `GET /integrations/google/auth-url` - Lấy OAuth URL
- `POST /integrations/google/callback` - Xử lý OAuth callback
- `POST /integrations/google/disconnect` - Ngắt kết nối
- `GET /integrations/google/status` - Trạng thái kết nối
- `POST /integrations/google/test` - Test spreadsheet access
- `PUT /integrations/google/settings` - Cập nhật cấu hình

### Blog Comments Routes
- `POST /blog/posts/:postId/comments` - Submit comment (Public + Rate limiting)
- `GET /blog/posts/:postId/comments` - Get approved comments (Public)
- `GET /blog/comments` - List all comments (ADMIN, MANAGER)
- `PUT /blog/comments/:id/status` - Approve/Reject comment (ADMIN, MANAGER)
- `DELETE /blog/comments/:id` - Delete comment (ADMIN, MANAGER)

### Region Routes (Public + Admin)
- `GET /api/regions` - Danh sách khu vực (Public, tree hoặc flat)
- `GET /api/regions/:id` - Chi tiết khu vực (Public)

### Public Routes (không cần auth)
- `GET /api/blog/posts` - Danh sách bài viết
- `GET /api/blog/posts/:postId/comments` - Comments đã duyệt
- `GET /api/settings/public` - Settings công khai
- `GET /api/settings/bidding` - Cấu hình đấu giá công khai (Public)
- `GET /api/regions` - Danh sách khu vực
- `GET /api/regions/:id` - Chi tiết khu vực
- `GET /api/service-fees` - Danh sách phí dịch vụ (Public, chỉ active)
- `POST /api/leads` - Submit form (cần rate limiting)
- `POST /blog/posts/:postId/comments` - Submit comment (cần rate limiting)
- `GET /api/projects` - Danh sách công trình đang mở (OPEN status, ẩn address)
- `GET /api/projects/:id` - Chi tiết công trình công khai (ẩn address, owner info)

### Unsubscribe Routes (Public - via email links)
- `GET /api/unsubscribe?token=xxx` - Lấy thông tin trang unsubscribe
- `PUT /api/unsubscribe` - Cập nhật cài đặt thông báo qua unsubscribe
- `POST /api/unsubscribe/quick` - Hủy đăng ký nhanh tất cả email (trừ critical)

### Ranking Routes - Public (Phase 5)
- `GET /api/rankings` - Danh sách xếp hạng nhà thầu (Public)
- `GET /api/rankings/featured` - Danh sách nhà thầu nổi bật (Public)
- `GET /api/rankings/contractors/:id` - Xem xếp hạng của nhà thầu (Public)

### Admin Routes - Ranking Management (requireRole('ADMIN'))
- `POST /api/admin/rankings/recalculate` - Tính toán lại xếp hạng tất cả nhà thầu (ADMIN only)
- `PUT /api/admin/rankings/contractors/:id/featured` - Đặt trạng thái nổi bật cho nhà thầu (ADMIN only)

### Review Report Routes - Public (Authenticated)
- `POST /api/reviews/:id/report` - Báo cáo đánh giá (Authenticated users)

### Admin Routes - Review Report Management (requireRole('ADMIN'))
- `GET /api/admin/review-reports` - Danh sách báo cáo đánh giá (ADMIN only)
- `GET /api/admin/review-reports/stats` - Thống kê báo cáo (ADMIN only)
- `GET /api/admin/review-reports/:id` - Chi tiết báo cáo (ADMIN only)
- `PUT /api/admin/review-reports/:id/resolve` - Xử lý báo cáo (ADMIN only)

### Homeowner Routes - Review Management (requireRole('HOMEOWNER'))
- `POST /api/homeowner/projects/:projectId/review` - Tạo đánh giá cho công trình đã hoàn thành
- `PUT /api/homeowner/reviews/:id` - Cập nhật đánh giá (trong 7 ngày)
- `DELETE /api/homeowner/reviews/:id` - Xóa đánh giá (soft delete)
- `GET /api/homeowner/reviews` - Danh sách đánh giá đã tạo

### Contractor Routes - Review Management (requireRole('CONTRACTOR'))
- `GET /api/contractor/reviews` - Danh sách đánh giá nhận được
- `GET /api/contractor/reviews/stats` - Thống kê đánh giá
- `GET /api/contractor/reviews/ranking` - Xếp hạng hiện tại
- `GET /api/contractor/reviews/monthly-stats` - Thống kê theo tháng
- `GET /api/contractor/reviews/:id` - Chi tiết đánh giá
- `POST /api/contractor/reviews/:id/response` - Phản hồi đánh giá

### Review Routes - Public
- `GET /api/reviews/contractors/:id` - Danh sách đánh giá công khai của nhà thầu
- `GET /api/reviews/contractors/:id/summary` - Tổng hợp đánh giá của nhà thầu

### Review Routes - Authenticated
- `POST /api/reviews/:id/helpful` - Vote đánh giá hữu ích
- `DELETE /api/reviews/:id/helpful` - Bỏ vote hữu ích
- `GET /api/reviews/:id/helpful/status` - Kiểm tra trạng thái vote

### Admin Routes - Review Management (requireRole('ADMIN'))
- `GET /api/admin/reviews` - Danh sách tất cả đánh giá với filters
- `GET /api/admin/reviews/stats` - Thống kê đánh giá toàn hệ thống
- `GET /api/admin/reviews/:id` - Chi tiết đánh giá
- `PUT /api/admin/reviews/:id/hide` - Ẩn đánh giá
- `PUT /api/admin/reviews/:id/unhide` - Hiện đánh giá
- `DELETE /api/admin/reviews/:id` - Xóa vĩnh viễn đánh giá

### Admin Routes - Ranking Job (requireRole('ADMIN'))
- `GET /api/admin/rankings/job-status` - Trạng thái job tính xếp hạng

### Admin Routes - Dashboard (requireRole('ADMIN'))
- `GET /api/admin/dashboard` - Lấy thống kê tổng quan dashboard (leads, projects, bids, contractors, etc.)
- `GET /api/admin/dashboard/activity` - Lấy activity feed gần đây (limit param)

### Contractor Routes - Saved Projects (requireRole('CONTRACTOR'))
- `GET /api/contractor/saved-projects` - Danh sách công trình đã lưu
- `POST /api/contractor/saved-projects/:projectId` - Lưu công trình
- `DELETE /api/contractor/saved-projects/:projectId` - Bỏ lưu công trình
- `GET /api/contractor/saved-projects/:projectId/check` - Kiểm tra đã lưu chưa

### User Routes - Activity (Authenticated)
- `GET /api/user/activity` - Lịch sử hoạt động của user

### Admin Routes - CDN Management (requireRole('ADMIN'))
- `GET /api/admin/cdn/status` - Trạng thái cấu hình CDN
- `POST /api/admin/cdn/purge` - Purge specific paths từ CDN cache
- `POST /api/admin/cdn/purge-media` - Purge media files từ CDN cache
- `POST /api/admin/cdn/purge-api` - Purge API response cache từ CDN
- `POST /api/admin/cdn/purge-all` - Purge ALL CDN cache (use with caution!)

### Admin Routes - API Key Management (requireRole('ADMIN'))
- `GET /api/admin/api-keys` - Danh sách tất cả API keys
- `POST /api/admin/api-keys` - Tạo API key mới
- `GET /api/admin/api-keys/:id` - Chi tiết API key
- `PUT /api/admin/api-keys/:id` - Cập nhật API key
- `DELETE /api/admin/api-keys/:id` - Xóa API key
- `PUT /api/admin/api-keys/:id/toggle` - Bật/tắt API key
- `POST /api/admin/api-keys/:id/test` - Test API key
- `GET /api/admin/api-keys/:id/logs` - Lấy usage logs của API key

### External API Routes (API Key Auth - X-API-Key header)
> **Note**: Các routes này dùng API key authentication thay vì JWT. API key được tạo từ Admin Panel.

**Leads Routes (requires `leads` endpoint group):**
- `GET /api/external/leads` - Danh sách leads (READ_ONLY, READ_WRITE, FULL_ACCESS)
- `POST /api/external/leads` - Tạo lead mới (READ_WRITE, FULL_ACCESS)
- `GET /api/external/leads/stats` - Thống kê leads (requires `reports` endpoint group)

**Blog Routes (requires `blog` endpoint group):**
- `GET /api/external/blog/posts` - Danh sách bài viết
- `GET /api/external/blog/posts/:slug` - Chi tiết bài viết
- `GET /api/external/blog/categories` - Danh sách danh mục

**Projects Routes (requires `projects` endpoint group):**
- `GET /api/external/projects` - Danh sách công trình đang mở
- `GET /api/external/projects/:id` - Chi tiết công trình (ẩn address, owner info)

**Contractors Routes (requires `contractors` endpoint group):**
- `GET /api/external/contractors` - Danh sách nhà thầu đã xác minh

**Reports Routes (requires `reports` endpoint group):**
- `GET /api/external/reports/dashboard` - Thống kê tổng quan

**Health Check:**
- `GET /api/external/health` - Kiểm tra kết nối API key

**API Key Scopes:**
- `READ_ONLY` - Chỉ GET requests
- `READ_WRITE` - GET, POST, PUT requests
- `FULL_ACCESS` - Tất cả methods (GET, POST, PUT, DELETE)

**API Key Error Codes:**
- `API_KEY_REQUIRED` (401) - Thiếu X-API-Key header
- `API_KEY_INVALID` (401) - API key không hợp lệ
- `API_KEY_INACTIVE` (401) - API key đã bị tắt
- `API_KEY_EXPIRED` (401) - API key đã hết hạn
- `PERMISSION_DENIED` (403) - Không có quyền truy cập
- `ENDPOINT_NOT_ALLOWED` (403) - Endpoint không được phép
- `SCOPE_INSUFFICIENT` (403) - Quyền không đủ cho thao tác này

## 🚨 KHÔNG BAO GIỜ

- ❌ Tạo endpoint admin mà không có auth
- ❌ Bỏ qua role check khi sửa code
- ❌ Hardcode user ID hoặc bypass auth
- ❌ Log sensitive data (password, token)
- ❌ Return password hash trong response

## ✅ LUÔN LÀM

- ✅ Kiểm tra auth khi tạo/sửa endpoint
- ✅ Dùng middleware thay vì copy-paste
- ✅ Validate input với Zod
- ✅ Rate limit form submissions
- ✅ Cập nhật Protected Routes Registry

## 🔐 JWT ENHANCEMENT - SECURITY FEATURES

### Token Blacklist
```typescript
// Khi logout hoặc đổi password, token bị blacklist ngay lập tức
await authService.addToBlacklist(token, userId, 'logout');

// Middleware tự động check blacklist
const isBlacklisted = await authService.isBlacklisted(token);
if (isBlacklisted) {
  return c.json({ error: { code: 'TOKEN_REVOKED' } }, 401);
}
```

### Token Rotation
```typescript
// Mỗi lần refresh → token mới, token cũ bị vô hiệu
// Nếu token cũ được dùng lại → SECURITY BREACH!
const result = await authService.refreshToken(refreshToken);
// result.refreshToken là token MỚI, token cũ không còn valid
```

### Token Reuse Detection
```typescript
// Nếu phát hiện token reuse → revoke ALL sessions
// Log CRITICAL audit event
// Return AUTH_TOKEN_REUSED error
```

### Audit Logging
```typescript
// Tự động log các events:
// - LOGIN_SUCCESS, LOGIN_FAILED
// - LOGOUT, TOKEN_REFRESH
// - PASSWORD_CHANGE
// - TOKEN_REUSE_DETECTED (CRITICAL)
// - SESSION_LIMIT_REACHED

// Query audit logs
const logs = await prisma.auditLog.findMany({
  where: { userId, severity: 'CRITICAL' },
  orderBy: { createdAt: 'desc' }
});
```

### Session Limits
```typescript
// Max 5 sessions per user
// Khi đạt limit → tự động kick oldest session
const revokedSessions = await authService.enforceSessionLimit(userId);
```

### Security Headers (Tự động)
```typescript
// Middleware tự động thêm headers:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Referrer-Policy: strict-origin-when-cross-origin
// Cache-Control: no-store (cho authenticated responses)
```

## 📊 DATABASE MODELS (JWT Enhancement)

### TokenBlacklist
```prisma
model TokenBlacklist {
  id        String   @id @default(cuid())
  tokenHash String   @unique  // SHA256 hash
  userId    String
  reason    String   // logout, password_change, admin_revoke
  expiresAt DateTime // Auto-cleanup
  createdAt DateTime @default(now())
}
```

### AuditLog
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  eventType String   // LOGIN_SUCCESS, LOGIN_FAILED, etc.
  userId    String?
  email     String?
  ipAddress String
  userAgent String
  metadata  String?  // JSON
  severity  String   @default("INFO") // INFO, WARNING, CRITICAL
  createdAt DateTime @default(now())
}
```

### Session (Enhanced with Token Selector Pattern)
```prisma
model Session {
  id            String    @id @default(cuid())
  userId        String
  tokenSelector String    @unique  // O(1) lookup, unhashed
  tokenVerifier String              // Bcrypt hashed
  token         String?   @unique  // Deprecated, nullable for migration
  previousToken String?   // For rotation detection
  rotatedAt     DateTime? // Last rotation
  // ... other fields
  
  @@index([tokenSelector])
}
```

### Token Selector Pattern (DoS Prevention)
```typescript
// Token format: {selector}.{verifier}
// - Selector: 16 bytes hex (32 chars) - stored plaintext, indexed
// - Verifier: 32 bytes hex (64 chars) - stored as bcrypt hash

// Lookup flow (O(1) instead of O(n)):
// 1. Parse token → extract selector and verifier
// 2. Query: SELECT * FROM Session WHERE tokenSelector = ? (O(1))
// 3. If found: bcrypt.compare(verifier, session.tokenVerifier)
// 4. Return session or null

// This prevents DoS attacks where attackers spam invalid tokens
// causing O(n) bcrypt comparisons across all sessions
```
