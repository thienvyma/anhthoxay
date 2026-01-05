# 🔍 ANH THỢ XÂY - Codebase Risk Analysis & Improvement Report

**Ngày phân tích:** 04/01/2026  
**Phạm vi:** Toàn bộ monorepo (4 apps + 3 packages)  
**Mục tiêu:** Rà soát rủi ro và điểm cải thiện cho scalability

---

## 📊 EXECUTIVE SUMMARY

### Tình trạng hiện tại
| Metric | Status | Notes |
|--------|--------|-------|
| Architecture | 🟢 Good | Clean separation, DI pattern |
| Security | 🟢 Good | JWT, Token Selector, Audit logs |
| Code Quality | 🟡 Medium | Large files cần refactor |
| Scalability | 🟡 Medium | SQLite limitation, no caching |
| Testing | 🟢 Good | Property-based tests |
| Documentation | 🟢 Good | Steering files, ADRs |

### Top 5 Risks (Ưu tiên cao)
1. **Database Scalability** - SQLite không scale cho production
2. **Large Files** - 15+ files >500 lines gây khó maintain
3. **No Caching Layer** - Mỗi request query DB
4. **Inconsistent API Client** - 3 implementations khác nhau
5. **JSON Fields Type Safety** - Runtime parsing errors

---

## 🔴 CRITICAL RISKS

### 1. Database Scalability (SQLite → PostgreSQL)

**Vấn đề:**
```prisma
datasource db {
  provider = "sqlite"  // ⚠️ Không scale
  url      = env("DATABASE_URL")
}
```

**Rủi ro:**
- SQLite không hỗ trợ concurrent writes tốt
- Không có connection pooling
- Không có full-text search native
- Không có JSON operators

**Đề xuất:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Migration checklist:**
- [ ] Setup PostgreSQL (local + cloud)
- [ ] Update schema cho PostgreSQL features
- [ ] Migrate data
- [ ] Update connection string
- [ ] Test all queries

---

### 2. Large Files - Maintainability Risk

**API Services (>500 lines):**
| File | Lines | Risk Level |
|------|-------|------------|
| `furniture-product.service.ts` | 1212 | 🔴 Critical |
| `bid.service.ts` | 902 | 🔴 Critical |
| `ranking.service.ts` | 866 | 🔴 Critical |
| `escrow.service.ts` | 843 | 🔴 Critical |
| `auth.service.ts` | 775 | 🟡 High |
| `reminder.service.ts` | 768 | 🟡 High |
| `google-sheets.service.ts` | 742 | 🟡 High |
| `match/crud.service.ts` | 729 | 🟡 High |

**Admin Pages (>500 lines):**
| File | Lines | Risk Level |
|------|-------|------------|
| `MaterialsTab.tsx` | 726 | 🟡 High |
| `MediaPage/index.tsx` | 720 | 🟡 High |
| `GuideContent.tsx` | 713 | 🟡 High |
| `CatalogTab.tsx` | 711 | 🟡 High |
| `EditApiKeyModal.tsx` | 688 | 🟡 High |
| `DashboardPage.tsx` | 664 | 🟡 High |

**Đề xuất refactor pattern:**
```
api/src/services/furniture/
├── index.ts                    # Re-exports
├── furniture-product.service.ts # Main orchestrator (~200 lines)
├── product-crud.service.ts     # CRUD operations
├── product-query.service.ts    # Query/filter logic
├── product-import.service.ts   # Import/export
└── types.ts                    # Shared types
```

---

### 3. No Caching Strategy

**Vấn đề:**
- Mỗi request query database trực tiếp
- Không có in-memory cache
- Tab counts query nhiều lần
- Settings được fetch mỗi request

**Impact:**
- Database load cao
- Response time chậm khi scale
- Không tận dụng được read replicas

**Đề xuất:**
```typescript
// packages/shared/src/cache/
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; expiry: number }>();
  
  async get(key: string, fetcher: () => Promise<T>, ttl = 60000): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    const data = await fetcher();
    this.cache.set(key, { data, expiry: Date.now() + ttl });
    return data;
  }
  
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
  }
}
```

**Cache candidates:**
- BiddingSettings (singleton, rarely changes)
- ServiceFees (rarely changes)
- Regions (rarely changes)
- NotificationTemplates (rarely changes)
- User sessions (frequently accessed)

---

### 4. Inconsistent API Client

**Hiện tại có 3 implementations:**

```typescript
// admin/src/app/api.ts
export async function apiFetch<T>(endpoint: string, options?: FetchOptions): Promise<T>

// portal/src/api/client.ts
export async function apiFetch<T>(endpoint: string, options?: FetchOptions): Promise<T>

// landing/src/app/api.ts
// Inline fetch calls với different patterns
```

**Rủi ro:**
- Bug fixes phải apply 3 nơi
- Inconsistent error handling
- Inconsistent auth token handling
- Khó test

**Đề xuất:**
```typescript
// packages/shared/src/api/
├── client.ts           # Base fetch wrapper
├── interceptors.ts     # Auth, error handling
├── types.ts            # Request/Response types
└── index.ts            # Re-exports

// Usage in apps:
import { createApiClient } from '@app/shared/api';
const api = createApiClient({ baseUrl: API_URL });
```

---

### 5. JSON Fields Type Safety

**Vấn đề trong schema.prisma:**
```prisma
model Project {
  images       String?  // JSON array - no type safety
  requirements String?  // JSON - no type safety
}

model Bid {
  attachments String?  // JSON array - no type safety
}

model ContractorProfile {
  specialties     String?  // JSON array
  serviceAreas    String?  // JSON array
  portfolioImages String?  // JSON array
  certificates    String?  // JSON array
}
```

**Rủi ro:**
- Runtime parsing errors
- No autocomplete
- No validation at compile time
- Inconsistent data format

**Đề xuất:**
```typescript
// packages/shared/src/schemas/json-fields.ts
import { z } from 'zod';

export const ProjectImagesSchema = z.array(z.string().url()).max(10);
export const BidAttachmentSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.string(),
  size: z.number(),
});
export const BidAttachmentsSchema = z.array(BidAttachmentSchema).max(5);

// Usage in services:
const images = ProjectImagesSchema.parse(JSON.parse(project.images || '[]'));
```

---

## 🟡 HIGH PRIORITY IMPROVEMENTS

### 6. Status Strings → Enums

**Vấn đề:**
```prisma
status String @default("DRAFT") // DRAFT, PENDING_APPROVAL, REJECTED...
```

**Rủi ro:**
- Typos không được catch
- No exhaustive switch checks
- No autocomplete

**Đề xuất:**
```typescript
// packages/shared/src/constants/status.ts
export const PROJECT_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  REJECTED: 'REJECTED',
  OPEN: 'OPEN',
  BIDDING_CLOSED: 'BIDDING_CLOSED',
  MATCHED: 'MATCHED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

// Type guard
export function isValidProjectStatus(status: string): status is ProjectStatus {
  return Object.values(PROJECT_STATUS).includes(status as ProjectStatus);
}
```

---

### 7. Error Handling Inconsistency

**Vấn đề:**
```typescript
// Một số nơi:
} catch (error) {
  console.error('Error:', error);
  return errorResponse(c, 'INTERNAL_ERROR', 'Failed', 500);
}

// Nơi khác:
} catch (error) {
  if (error instanceof CustomError) {
    return errorResponse(c, error.code, error.message, error.statusCode);
  }
  throw error;
}
```

**Đề xuất:**
```typescript
// packages/shared/src/errors/
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Centralized error handler
export function handleServiceError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    return new AppError('VALIDATION_ERROR', 'Invalid input', 400, { 
      issues: error.issues 
    });
  }
  // Log unexpected errors
  console.error('Unexpected error:', error);
  return new AppError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
}
```

---

### 8. Missing Rate Limiting on Some Endpoints

**Hiện tại:**
```typescript
// main.ts
app.use('/api/auth/login', rateLimit({ windowMs: 1 * 60 * 1000, max: isDev ? 100 : 20 }));
app.use('/leads', rateLimit({ windowMs: 60 * 1000, max: isDev ? 100 : 30 }));
app.use('*', rateLimit({ windowMs: 60 * 1000, max: isDev ? 500 : 200 }));
```

**Thiếu rate limiting cho:**
- `/api/auth/signup` - Registration abuse
- `/api/auth/refresh` - Token refresh abuse
- `/api/furniture/quotation` - Quotation spam
- `/blog/posts/:postId/comments` - Comment spam

**Đề xuất:**
```typescript
// Thêm rate limiting cho sensitive endpoints
app.use('/api/auth/signup', rateLimit({ windowMs: 60 * 1000, max: 5 }));
app.use('/api/auth/refresh', rateLimit({ windowMs: 60 * 1000, max: 30 }));
app.use('/api/furniture/quotation', rateLimit({ windowMs: 60 * 1000, max: 10 }));
```

---

### 9. Console.log in Production Code

**Tìm thấy:**
- `api/src/main.ts` - Server startup logs (OK)
- `infra/prisma/seed.ts` - Seed logs (OK)
- Scripts - Development scripts (OK)

**Đề xuất:**
- Sử dụng structured logger thay vì console.log
- Wrap debug logs trong `if (import.meta.env.DEV)`
- Đã có script `scripts/wrap-dev-logs.ts` - cần chạy định kỳ

---

### 10. Hardcoded URLs/Values

**Tìm thấy:**
```typescript
// packages/shared/src/config.ts
const DEFAULT_API_URL = 'http://localhost:4202';
const DEFAULT_PORTAL_URL = 'http://localhost:4203';

// api/src/services/google-sheets.service.ts
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4202/integrations/google/callback';

// api/src/services/notification-channel.service.ts
baseUrl: process.env.APP_URL || 'https://anhthoxay.vn',
```

**Đề xuất:**
- Tất cả URLs phải từ environment variables
- Không có fallback hardcoded trong production
- Validate required env vars at startup

```typescript
// packages/shared/src/config.ts
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || getDefaultValue(key);
}
```

---

## 🟢 GOOD PRACTICES FOUND

### 1. Security Implementation ✅
- Token Selector Pattern (O(1) lookup)
- Token Blacklist
- Token Rotation
- Audit Logging
- Session Limits (max 5)
- Security Headers

### 2. Code Organization ✅
- Routes → Services → Schemas separation
- Dependency Injection pattern
- Custom Error classes
- Standardized response format

### 3. Testing ✅
- Property-based tests với fast-check
- Test files alongside source files
- Good test coverage cho critical paths

### 4. Documentation ✅
- Steering files cho patterns
- Security checklist
- Business logic documentation
- Daily changelog

### 5. Recent Refactoring ✅
- `project.service.ts` đã được tách thành modules
- `Layout` component đã được tách
- `RichTextSection` đã được tách
- `FurnitureQuote` hooks đã được tách

---

## 📋 ACTION PLAN

### Phase 1: Critical (Tuần 1-2)
- [ ] Migrate SQLite → PostgreSQL
- [ ] Refactor `furniture-product.service.ts` (1212 lines)
- [ ] Refactor `bid.service.ts` (902 lines)
- [ ] Add rate limiting cho missing endpoints

### Phase 2: High Priority (Tuần 3-4)
- [ ] Unified API client trong `@app/shared`
- [ ] Type-safe JSON fields với Zod schemas
- [ ] Status enums trong `@app/shared`
- [ ] Simple caching layer

### Phase 3: Medium Priority (Tuần 5-6)
- [ ] Refactor remaining large admin pages
- [ ] Error handling standardization
- [ ] Environment variable validation
- [ ] Performance monitoring setup

### Phase 4: Ongoing
- [ ] Regular code review cho file sizes
- [ ] Automated lint rules cho patterns
- [ ] Documentation updates
- [ ] Security audits

---

## 📊 METRICS TO TRACK

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Files >500 lines | 15+ | <5 | 4 weeks |
| Files >1000 lines | 1 | 0 | 2 weeks |
| API response time (p95) | N/A | <200ms | 6 weeks |
| Test coverage | ~60% | >80% | 8 weeks |
| Type safety | ~85% | >95% | 4 weeks |

---

## 🎯 SCALABILITY RECOMMENDATIONS

### Short-term (1-3 months)
1. **Database**: Migrate to PostgreSQL
2. **Caching**: Add Redis for sessions, settings
3. **CDN**: Use CDN for static assets
4. **Monitoring**: Add APM (Application Performance Monitoring)

### Medium-term (3-6 months)
1. **Horizontal scaling**: Containerize with Docker
2. **Load balancing**: Add reverse proxy (nginx/traefik)
3. **Database**: Add read replicas
4. **Queue**: Add job queue for async tasks (notifications, emails)

### Long-term (6-12 months)
1. **Microservices**: Consider splitting if needed
2. **Event sourcing**: For audit-heavy features
3. **GraphQL**: Consider for complex queries
4. **Real-time**: WebSocket infrastructure

---

## 📝 KẾT LUẬN

Codebase có **nền tảng tốt** với architecture clean và security solid. Các vấn đề chính cần giải quyết:

1. **Database migration** - SQLite → PostgreSQL là critical cho production
2. **Large files** - 15+ files cần refactor để maintain được
3. **Caching** - Cần thiết cho performance khi scale
4. **Consistency** - API client, error handling cần thống nhất

**Ưu tiên cao nhất**: Database migration và refactor `furniture-product.service.ts` vì đây là bottleneck lớn nhất.
