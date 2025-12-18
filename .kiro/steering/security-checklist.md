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
| Public | Không cần auth | GET /api/blog/posts, GET /api/settings |
| User | USER, WORKER, MANAGER, ADMIN | GET /api/user/profile |
| Worker | WORKER, MANAGER, ADMIN | GET /api/worker/jobs |
| Manager | MANAGER, ADMIN | POST /api/blog/posts, GET /api/leads |
| Admin Only | ADMIN | POST /api/users, DELETE /api/*, Settings |

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
│   └── validation.ts           # Zod validation middleware
├── routes/
│   ├── auth.routes.ts          # /api/auth/* endpoints
│   ├── pages.routes.ts         # /pages/*, /sections/*
│   ├── media.routes.ts         # /media/*
│   ├── leads.routes.ts         # /leads/*
│   ├── pricing.routes.ts       # /service-categories/*, /unit-prices/*, etc.
│   ├── blog.routes.ts          # /blog/*
│   ├── settings.routes.ts      # /settings/*
│   └── integrations.routes.ts  # /integrations/*
├── services/
│   ├── auth.service.ts         # Auth business logic
│   ├── pages.service.ts        # Pages CRUD logic
│   ├── media.service.ts        # Media upload/delete logic
│   ├── leads.service.ts        # Leads CRUD & stats logic
│   ├── pricing.service.ts      # Pricing CRUD logic
│   └── quote.service.ts        # Quote calculation logic
├── schemas/
│   ├── index.ts                # Re-exports all schemas
│   ├── auth.schema.ts          # Auth validation schemas
│   ├── pages.schema.ts         # Pages validation schemas
│   ├── media.schema.ts         # Media validation schemas
│   ├── leads.schema.ts         # Leads validation schemas
│   ├── pricing.schema.ts       # Pricing validation schemas
│   ├── blog.schema.ts          # Blog validation schemas
│   └── settings.schema.ts      # Settings validation schemas
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
- `/api/admin/users/*` - Quản lý users
- `/api/admin/settings/*` - Cài đặt hệ thống
- `/api/pricing/*` - Cấu hình giá (formulas, categories)

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

### Public Routes (không cần auth)
- `GET /api/blog/posts` - Danh sách bài viết
- `GET /api/blog/posts/:postId/comments` - Comments đã duyệt
- `GET /api/settings/public` - Settings công khai
- `POST /api/leads` - Submit form (cần rate limiting)
- `POST /blog/posts/:postId/comments` - Submit comment (cần rate limiting)

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
