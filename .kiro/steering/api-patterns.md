---
inclusion: fileMatch
fileMatchPattern: "api/**/*.ts"
---

# 🔌 API Development Patterns

## File Structure
```
api/src/
├── main.ts                    # Entry point (~150 lines)
│                              # - Environment setup
│                              # - Middleware configuration
│                              # - Route mounting
│                              # - Server startup
├── config/
│   └── cors.ts               # CORS configuration from env
├── middleware/
│   ├── auth.middleware.ts    # Auth & role middleware
│   ├── correlation-id.ts     # Request tracing
│   ├── error-handler.ts      # Global error handler
│   ├── rate-limiter.ts       # Rate limiting
│   ├── security-headers.ts   # Security headers
│   └── validation.ts         # Zod validation middleware
├── routes/
│   ├── auth.routes.ts        # /api/auth/* (login, register, signup, sessions)
│   ├── users.routes.ts       # /api/users/* (ADMIN only)
│   ├── contractor.routes.ts  # /api/contractor/*, /api/admin/contractors/*
│   ├── region.routes.ts      # /api/regions/*, /api/admin/regions/*
│   ├── bidding-settings.routes.ts  # /api/settings/bidding, /api/admin/settings/bidding
│   ├── service-fee.routes.ts # /api/service-fees/*, /api/admin/service-fees/*
│   ├── project.routes.ts     # /api/projects/*, /api/homeowner/projects/*, /api/admin/projects/*
│   ├── bid.routes.ts         # /api/contractor/bids/*, /api/admin/bids/*
│   ├── match.routes.ts       # /api/admin/matches/* (Admin match management)
│   ├── escrow.routes.ts      # /api/admin/escrows/* (Admin escrow management)
│   ├── fee.routes.ts         # /api/admin/fees/* (Admin fee management)
│   ├── dispute.routes.ts     # /api/admin/disputes/*, /api/homeowner/*/dispute, /api/contractor/*/dispute
│   ├── pages.routes.ts       # /pages/*, /sections/*
│   ├── media.routes.ts       # /media/*
│   ├── leads.routes.ts       # /leads/*
│   ├── pricing.routes.ts     # /service-categories/*, /unit-prices/*, etc.
│   ├── blog.routes.ts        # /blog/*
│   ├── settings.routes.ts    # /settings/*
│   └── integrations.routes.ts # /integrations/*
├── services/
│   ├── auth.service.ts       # Auth business logic (supports CONTRACTOR, HOMEOWNER roles)
│   ├── users.service.ts      # User management logic (ADMIN only)
│   ├── contractor.service.ts # Contractor profile & verification logic
│   ├── region.service.ts     # Region hierarchy management
│   ├── bidding-settings.service.ts  # Bidding configuration (singleton)
│   ├── service-fee.service.ts # Service fee management
│   ├── project.service.ts    # Project CRUD, status transitions, access control
│   ├── bid.service.ts        # Bid CRUD, validation, anonymization
│   ├── match.service.ts      # Bid selection, contact reveal, project status transitions
│   ├── escrow.service.ts     # Escrow CRUD, amount calculation, status transitions
│   ├── fee.service.ts        # Fee transaction CRUD, win fee calculation
│   ├── milestone.service.ts  # Milestone management, completion tracking
│   ├── notification.service.ts # In-app notifications for match events
│   ├── dispute.service.ts    # Dispute raising and resolution
│   ├── pages.service.ts      # Pages CRUD logic
│   ├── media.service.ts      # Media upload/delete logic
│   ├── leads.service.ts      # Leads CRUD & stats logic
│   ├── pricing.service.ts    # Pricing CRUD logic
│   ├── quote.service.ts      # Quote calculation logic
│   └── google-sheets.service.ts # Google Sheets integration (uses encryption)
├── schemas/
│   ├── index.ts              # Re-exports all schemas
│   ├── auth.schema.ts        # Auth validation schemas
│   ├── users.schema.ts       # User management validation schemas
│   ├── contractor.schema.ts  # Contractor profile validation schemas
│   ├── region.schema.ts      # Region validation schemas
│   ├── bidding-settings.schema.ts  # Bidding settings validation schemas
│   ├── service-fee.schema.ts # Service fee validation schemas
│   ├── project.schema.ts     # Project validation schemas (create, update, submit, query)
│   ├── bid.schema.ts         # Bid validation schemas (create, update, query)
│   ├── match.schema.ts       # Match validation schemas (select bid, cancel match)
│   ├── escrow.schema.ts      # Escrow validation schemas (create, update, query, actions)
│   ├── fee.schema.ts         # Fee validation schemas (create, query, actions)
│   ├── milestone.schema.ts   # Milestone validation schemas (request, confirm, dispute)
│   ├── notification.schema.ts # Notification validation schemas (create, query)
│   ├── dispute.schema.ts     # Dispute validation schemas (raise, resolve, query)
│   ├── pages.schema.ts       # Pages validation schemas
│   ├── media.schema.ts       # Media validation schemas
│   ├── leads.schema.ts       # Leads validation schemas
│   ├── pricing.schema.ts     # Pricing validation schemas
│   ├── blog.schema.ts        # Blog validation schemas
│   └── settings.schema.ts    # Settings validation schemas
└── utils/
    ├── logger.ts             # Structured logging
    ├── response.ts           # Response helpers
    ├── encryption.ts         # AES-256-GCM encryption for sensitive data
    └── code-generator.ts     # Auto-generate codes (PRJ-YYYY-NNN, BID-YYYY-NNN)
```

## Route Naming Convention
```ts
// RESTful endpoints
GET    /items          → List all
GET    /items/:id      → Get one
POST   /items          → Create
PUT    /items/:id      → Update (full)
PATCH  /items/:id      → Update (partial)
DELETE /items/:id      → Delete

// Nested resources
GET    /categories/:id/items
POST   /posts/:id/comments
```

## Route Module Pattern
```ts
// api/src/routes/example.routes.ts
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';
import { ExampleSchema } from '../schemas/example.schema';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';

/**
 * Creates example routes
 * @param prisma - Prisma client instance
 */
export function createExampleRoutes(prisma: PrismaClient) {
  const app = new Hono();

  /**
   * @route GET /example
   * @description Get all examples
   * @access Public
   */
  app.get('/', async (c) => {
    const items = await prisma.example.findMany();
    return successResponse(c, items);
  });

  /**
   * @route POST /example
   * @description Create new example
   * @access Admin only
   */
  app.post('/', authenticate(), requireRole('ADMIN'), validate(ExampleSchema), async (c) => {
    const data = c.req.valid('json');
    const item = await prisma.example.create({ data });
    return successResponse(c, item, 201);
  });

  return app;
}

// Mount in main.ts:
// app.route('/example', createExampleRoutes(prisma));
```

## Response Format (Standardized)
```ts
// Import response helpers
import { successResponse, paginatedResponse, errorResponse } from '../utils/response';

// Success response: { success: true, data: T }
return successResponse(c, data);
return successResponse(c, data, 201); // with custom status

// Paginated response: { success: true, data: T[], meta: { total, page, limit, totalPages } }
return paginatedResponse(c, items, { total: 100, page: 1, limit: 10 });

// Error response: { success: false, error: { code, message }, correlationId }
return errorResponse(c, 'VALIDATION_ERROR', 'Invalid input', 400);
return errorResponse(c, 'NOT_FOUND', 'Resource not found', 404);
```

## Validation Middleware Pattern
```ts
// api/src/middleware/validation.ts
import { validate, validateQuery } from '../middleware/validation';

// Validate request body
app.post('/items', validate(CreateItemSchema), async (c) => {
  const data = c.req.valid('json'); // Type-safe validated data
  // ...
});

// Validate query parameters
app.get('/items', validateQuery(ListQuerySchema), async (c) => {
  const query = c.req.valid('query'); // Type-safe validated query
  // ...
});

// Validation errors automatically return:
// { success: false, error: { code: 'VALIDATION_ERROR', message: '...', details: {...} }, correlationId }
```

## Service Layer Pattern
```ts
// api/src/services/example.service.ts
import { PrismaClient } from '@prisma/client';

export class ExampleService {
  constructor(private prisma: PrismaClient) {}

  async getAll() {
    return this.prisma.example.findMany();
  }

  async create(data: CreateExampleInput) {
    return this.prisma.example.create({ data });
  }

  async getById(id: string) {
    return this.prisma.example.findUnique({ where: { id } });
  }
}

// Usage in routes:
// const service = new ExampleService(prisma);
// const items = await service.getAll();
```

## Status Codes
- 200: OK (GET, PUT, PATCH success)
- 201: Created (POST success)
- 204: No Content (DELETE success)
- 400: Bad Request (validation error)
- 401: Unauthorized (not logged in)
- 403: Forbidden (no permission)
- 404: Not Found
- 500: Internal Server Error

## Authentication Pattern
```ts
// Protected route
app.get('/admin/items', authMiddleware, async (c) => {
  const user = c.get('user');
  if (user.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  // ...
});
```

## Validation Pattern
```ts
import { z } from 'zod';

const CreateItemSchema = z.object({
  name: z.string().min(1, 'Tên không được trống'),
  price: z.number().positive('Giá phải lớn hơn 0'),
});

app.post('/items', async (c) => {
  const body = await c.req.json();
  const result = CreateItemSchema.safeParse(body);
  
  if (!result.success) {
    return c.json({ error: result.error.flatten() }, 400);
  }
  
  // Use result.data
});
```

## Error Handling
```ts
// Centralized error handler (api/src/middleware/error-handler.ts)
// Đã được cấu hình sẵn trong main.ts với app.onError(errorHandler())

// Error handler tự động xử lý:
// - ZodError → 400 với validation details
// - AuthError → status từ error.statusCode
// - Prisma P2025 → 404 Not Found
// - Prisma P2002 → 409 Conflict
// - Other errors → 500 Internal Server Error

// Tất cả error responses đều có correlationId để debug
{
  error: 'Validation failed',
  details: { ... },
  correlationId: 'uuid-xxx'
}
```

## Correlation-ID Middleware
```ts
// Mỗi request có unique correlation ID để trace logs
// Middleware đã được cấu hình sẵn trong main.ts

// Lấy correlation ID trong route handler:
import { getCorrelationId } from './middleware/correlation-id';

app.get('/api/test', (c) => {
  const correlationId = getCorrelationId(c);
  // Use for logging, error responses, etc.
});

// Response headers tự động có X-Correlation-ID
```

## Structured Logging
```ts
// Sử dụng structured logger cho consistent log format
import { createLogger } from './utils/logger';

app.get('/api/test', (c) => {
  const logger = createLogger(c);
  
  logger.info('Processing request');
  logger.warn('Something suspicious', { userId: '123' });
  logger.error('Failed to process', { error: err.message });
  
  // Output: JSON với timestamp, level, message, correlationId, path, method, userId
});
```

## JWT Auth Error Codes
```ts
// Auth error codes từ AuthService
const AUTH_ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 401,  // Sai email/password
  AUTH_TOKEN_EXPIRED: 401,        // Token hết hạn
  AUTH_TOKEN_INVALID: 401,        // Token không hợp lệ
  AUTH_TOKEN_REVOKED: 401,        // Token đã bị revoke
  AUTH_TOKEN_REUSED: 401,         // Token reuse detected (security breach!)
  AUTH_SESSION_EXPIRED: 401,      // Session hết hạn
  AUTH_USER_NOT_FOUND: 404,       // User không tồn tại
  AUTH_FORBIDDEN: 403,            // Không có quyền
  AUTH_RATE_LIMITED: 429,         // Rate limit exceeded
  AUTH_EMAIL_EXISTS: 400,         // Email đã tồn tại
  AUTH_WEAK_PASSWORD: 400,        // Password yếu
};

// Handle auth errors
import { AuthError } from '../services/auth.service';

if (error instanceof AuthError) {
  return c.json({ 
    error: { code: error.code, message: error.message } 
  }, error.statusCode);
}
```

## Audit Log Event Types
```ts
// Các event types được log tự động
type AuditEventType =
  | 'LOGIN_SUCCESS'        // Đăng nhập thành công
  | 'LOGIN_FAILED'         // Đăng nhập thất bại
  | 'LOGOUT'               // Đăng xuất
  | 'TOKEN_REFRESH'        // Refresh token
  | 'PASSWORD_CHANGE'      // Đổi password
  | 'SESSION_REVOKED'      // Session bị revoke
  | 'TOKEN_REUSE_DETECTED' // CRITICAL: Token bị đánh cắp
  | 'RATE_LIMIT_EXCEEDED'  // Rate limit
  | 'SESSION_LIMIT_REACHED'; // Max 5 sessions
```

## Encryption Service (AES-256-GCM)

### Environment Variable (BẮT BUỘC)
```bash
# .env - ENCRYPTION_KEY phải được set trong production
# Generate: openssl rand -base64 32
ENCRYPTION_KEY=your-32-byte-base64-encoded-key
```

### Usage Pattern
```ts
// api/src/utils/encryption.ts
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

// Encrypt sensitive data before storing
const encryptedToken = encrypt(refreshToken);
await prisma.integration.update({
  where: { id },
  data: { credentials: encryptedToken }
});

// Decrypt when retrieving
const credentials = await prisma.integration.findUnique({ where: { id } });
if (credentials && isEncrypted(credentials.credentials)) {
  const decryptedToken = decrypt(credentials.credentials);
  // Use decryptedToken with external APIs
}
```

### Encryption Format
```
{iv}:{authTag}:{ciphertext}
- iv: 12 bytes, base64 encoded (unique per encryption)
- authTag: 16 bytes, base64 encoded (integrity verification)
- ciphertext: variable length, base64 encoded
```

### Error Handling
```ts
try {
  const decrypted = decrypt(encryptedValue);
} catch (error) {
  // Handle decryption failure (wrong key, corrupted data)
  console.error('Decryption failed:', error.message);
  // Return null or throw appropriate error
}
```

### When to Use Encryption
- ✅ OAuth refresh tokens (Google, Facebook, etc.)
- ✅ API keys for external services
- ✅ Sensitive user data (PII)
- ❌ Passwords (use bcrypt instead)
- ❌ Session tokens (use hashing with selector pattern)

## Security Headers Middleware

### Headers Applied Automatically
```ts
// api/src/middleware/security-headers.ts
// Middleware đã được cấu hình sẵn trong main.ts

// Headers applied to ALL responses:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Referrer-Policy: strict-origin-when-cross-origin
// Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
// Permissions-Policy: geolocation=(), microphone=(), camera=()

// Production-only headers:
// Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CSP for API Responses
```ts
// API responses use restrictive CSP:
// default-src 'none' - Block all resources by default
// frame-ancestors 'none' - Prevent embedding in iframes

// For frontend apps, configure CSP separately in their middleware
```

### HSTS Configuration
```ts
// HSTS is only enabled in production to avoid localhost issues
// max-age: 31536000 (1 year)
// includeSubDomains: true

// Check environment:
const isProduction = process.env.NODE_ENV === 'production';
```
