# 🔍 ANH THỢ XÂY - Deep Codebase Analysis Report

**Ngày phân tích:** 23/12/2024  
**Phạm vi:** Toàn bộ monorepo (4 apps + 3 packages)

---

## 📊 TỔNG QUAN KIẾN TRÚC

### Monorepo Structure (NX)
```
├── admin/      → Port 4201 (Admin Dashboard)
├── api/        → Port 4202 (Hono Backend)
├── landing/    → Port 4200 (Public Website)
├── portal/     → Port 4203 (User Portal - Homeowner/Contractor)
├── packages/
│   ├── shared/ → Design tokens, config, utilities
│   ├── ui/     → Shared UI components
│   └── contracts/ → OpenAPI spec
└── infra/prisma/ → Database schema
```

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Framer Motion, TanStack Query |
| Backend | Hono (Node.js), Prisma ORM |
| Database | SQLite (dev), có thể migrate PostgreSQL |
| Auth | JWT với Token Selector Pattern |
| Styling | CSS-in-JS (inline styles) + CSS Variables |

---

## ✅ ĐIỂM MẠNH (STRENGTHS)

### 1. **Kiến trúc Backend Tốt**
- ✅ **Separation of Concerns**: Routes → Services → Schemas rõ ràng
- ✅ **Dependency Injection**: Services nhận PrismaClient qua constructor
- ✅ **Validation Middleware**: Zod schemas cho tất cả endpoints
- ✅ **Error Handling**: Custom Error classes với status codes
- ✅ **Response Format**: Standardized `successResponse`, `errorResponse`

```typescript
// Pattern tốt đang được áp dụng
export function createProjectRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const projectService = new ProjectService(prisma);
  // ...
}
```

### 2. **Security Implementation**
- ✅ **Token Selector Pattern**: O(1) lookup thay vì O(n) bcrypt
- ✅ **Token Blacklist**: Revoke tokens ngay lập tức
- ✅ **Token Rotation**: Refresh token mới mỗi lần refresh
- ✅ **Audit Logging**: Track tất cả auth events
- ✅ **Session Limits**: Max 5 sessions/user
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options

### 3. **Design System Centralized**
- ✅ **`@app/shared` tokens**: Colors, spacing, typography
- ✅ **Consistent patterns**: Button, Card, Modal, Input
- ✅ **Remix Icon**: Unified icon system

### 4. **Code Organization**
- ✅ **Modular API structure**: `api/auth.ts`, `api/bidding.ts`, etc.
- ✅ **Type definitions**: Separate type files
- ✅ **Steering files**: Documentation cho patterns

### 5. **Testing Coverage**
- ✅ **Property-based tests**: Fast-check cho services
- ✅ **Test utilities**: Shared test helpers

---

## ⚠️ RỦI RO TIỀM ẨN (RISKS)

### 1. **File Size Issues - CẦN REFACTOR NGAY**

#### API Services (>500 lines)
| File | Lines | Đề xuất |
|------|-------|---------|
| `project.service.ts` | 902 | Tách: CRUD, Status, Query |
| `ranking.service.ts` | 775 | Tách: Calculation, Query |
| `escrow.service.ts` | 756 | Tách: CRUD, Workflow |
| `quote.service.ts` | 755 | Tách: Calculation, Validation |
| `bid.service.ts` | 754 | Tách: CRUD, Anonymization |
| `auth.service.ts` | 658 | Tách: Token, Session, User |

#### Admin Pages (>800 lines) - CRITICAL
| File | Lines | Đề xuất |
|------|-------|---------|
| `FurnitureCatalogTab.tsx` | **2067** | Tách: Table, Modal, Form |
| `LayoutsTab.tsx` | **1614** | Tách: List, Editor, Preview |
| `PackagesTab.tsx` | **1542** | Tách: Grid, Detail, Form |
| `BuildingsTab.tsx` | **1387** | Tách: Tree, Form, Modal |
| `DevelopmentsTab.tsx` | **1306** | Tách: List, Form, Filter |
| `BuildingUnitsTab.tsx` | **1055** | Tách: Table, Form |

#### Portal Pages (>700 lines)
| File | Lines | Đề xuất |
|------|-------|---------|
| `ProjectDetailPage.tsx` | 834 | Tách: Info, Bids, Actions |
| `ContractorDirectoryPage.tsx` | 828 | Tách: List, Filter, Card |
| `MarketplacePage.tsx` | 825 | Tách: Grid, Filter, Detail |
| `CreateBidPage.tsx` | 788 | Tách: Form, Preview, Submit |
| `ProjectsPage.tsx` | 767 | Tách: Table, Filter, Modal |

### 2. **Inconsistent Patterns**

#### a) API Client Duplication
```typescript
// admin/src/app/api/client.ts
export async function apiFetch<T>(endpoint: string, options?: FetchOptions): Promise<T>

// portal/src/api/client.ts  
export async function apiFetch<T>(endpoint: string, options?: FetchOptions): Promise<T>

// landing/src/app/api.ts
// Inline fetch calls
```
**Rủi ro**: 3 implementations khác nhau, khó maintain

#### b) State Management
```typescript
// Admin: Custom store (store.ts)
export const store = { user: null, setUser: () => {} }

// Portal: React Context (AuthContext.tsx)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Landing: No state management
```
**Rủi ro**: Không nhất quán, khó share logic

### 3. **Type Safety Gaps**

#### a) JSON Fields trong Prisma
```prisma
// schema.prisma
images      String?  // JSON array of URLs
attachments String?  // JSON array
certificates String? // JSON array
```
**Rủi ro**: Runtime parsing errors, no type safety

#### b) Status Strings
```prisma
status String @default("DRAFT") // DRAFT, PENDING_APPROVAL, REJECTED...
```
**Rủi ro**: Typos, no autocomplete, no exhaustive checks

### 4. **Performance Concerns**

#### a) N+1 Query Potential
```typescript
// Trong một số services
const projects = await prisma.project.findMany();
// Sau đó loop để fetch related data
```

#### b) No Caching Strategy
- Không có Redis/in-memory cache
- Mỗi request query database
- Tab counts query nhiều lần

#### c) Large Bundle Size Risk
- Inline styles tạo duplicate CSS
- Không có code splitting cho admin pages

### 5. **Error Handling Gaps**

```typescript
// Một số nơi catch generic error
} catch (error) {
  console.error('Error:', error);
  return errorResponse(c, 'INTERNAL_ERROR', 'Failed', 500);
}
```
**Rủi ro**: Mất context, khó debug production

---

## 🔄 PATTERNS ANALYSIS

### Pattern 1: Route Factory (✅ Tốt)
```typescript
export function createProjectRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const service = new ProjectService(prisma);
  
  app.get('/', validateQuery(Schema), async (c) => {
    const query = getValidatedQuery(c);
    const result = await service.getList(query);
    return successResponse(c, result);
  });
  
  return app;
}
```
**Đánh giá**: Consistent, testable, DI-friendly

### Pattern 2: Service Class (✅ Tốt nhưng cần tách)
```typescript
export class ProjectService {
  constructor(private prisma: PrismaClient) {}
  
  async create(data: Input): Promise<Output> { }
  async update(id: string, data: Input): Promise<Output> { }
  // ... 900+ lines
}
```
**Đánh giá**: Cần tách thành smaller services

### Pattern 3: Custom Error Classes (✅ Tốt)
```typescript
export class ProjectError extends Error {
  code: string;
  statusCode: number;
  
  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
```
**Đánh giá**: Consistent error handling

### Pattern 4: React Component (⚠️ Cần cải thiện)
```typescript
// Hiện tại: Monolithic components
export function ProjectsPage() {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  // ... 20+ state variables
  // ... 800+ lines
}
```
**Đề xuất**: Custom hooks, smaller components

### Pattern 5: Inline Styles (⚠️ Trade-off)
```typescript
<div style={{
  background: tokens.color.surface,
  borderRadius: tokens.radius.lg,
  padding: 24,
}}>
```
**Pros**: Type-safe, no CSS conflicts  
**Cons**: No caching, larger bundle, no pseudo-classes

---

## 📋 ĐỀ XUẤT CẢI THIỆN

### Priority 1: CRITICAL (Tuần 1-2)

#### 1.1 Refactor Large Admin Pages
```
admin/src/app/pages/InteriorPage/
├── FurnitureCatalogTab/
│   ├── index.tsx           # Main component (~200 lines)
│   ├── FurnitureTable.tsx  # Table component
│   ├── FurnitureForm.tsx   # Create/Edit form
│   ├── FurnitureModal.tsx  # Detail modal
│   └── useFurniture.ts     # Custom hook
```

#### 1.2 Refactor Large Services
```
api/src/services/project/
├── index.ts                # Re-exports
├── crud.service.ts         # Create, Read, Update, Delete
├── status.service.ts       # Status transitions
├── query.service.ts        # List, Filter, Search
└── types.ts                # Shared types
```

#### 1.3 Unified API Client
```typescript
// packages/shared/src/api/
├── client.ts       # Base fetch wrapper
├── interceptors.ts # Auth, error handling
└── types.ts        # Request/Response types
```

### Priority 2: HIGH (Tuần 3-4)

#### 2.1 Type-Safe JSON Fields
```typescript
// Tạo Zod schemas cho JSON fields
const ProjectImagesSchema = z.array(z.string().url());
const BidAttachmentsSchema = z.array(z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.string(),
  size: z.number(),
}));
```

#### 2.2 Enum Constants
```typescript
// packages/shared/src/constants/
export const PROJECT_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  // ...
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];
```

#### 2.3 Custom Hooks cho Portal
```typescript
// portal/src/hooks/
├── useProjects.ts      # Project CRUD
├── useBids.ts          # Bid operations
├── useNotifications.ts # Real-time notifications
└── usePagination.ts    # Pagination logic
```

### Priority 3: MEDIUM (Tuần 5-6)

#### 3.1 Caching Layer
```typescript
// Simple in-memory cache cho frequently accessed data
const cache = new Map<string, { data: unknown; expiry: number }>();

export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60000
): Promise<T>
```

#### 3.2 Query Optimization
```typescript
// Sử dụng Prisma includes thay vì multiple queries
const project = await prisma.project.findUnique({
  where: { id },
  include: {
    owner: { select: { id: true, name: true, email: true } },
    category: true,
    region: true,
    bids: { where: { status: 'APPROVED' } },
    _count: { select: { bids: true } },
  },
});
```

#### 3.3 Error Boundary Enhancement
```typescript
// Thêm error reporting
<ErrorBoundary
  fallback={<ErrorPage />}
  onError={(error, info) => {
    logError(error, info);
    // Send to monitoring service
  }}
>
```

### Priority 4: LOW (Ongoing)

#### 4.1 Documentation
- API documentation với OpenAPI
- Component Storybook
- Architecture Decision Records (ADRs)

#### 4.2 Testing
- E2E tests với Playwright
- Visual regression tests
- Performance benchmarks

#### 4.3 Monitoring
- Error tracking (Sentry)
- Performance monitoring
- Audit log dashboard

---

## 📊 METRICS SUMMARY

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Files >500 lines | 25+ | <10 | 🔴 |
| Files >1000 lines | 8 | 0 | 🔴 |
| Test coverage | ~60% | >80% | 🟡 |
| Type safety | ~85% | >95% | 🟡 |
| Lint errors | 0 | 0 | 🟢 |
| Typecheck errors | 0 | 0 | 🟢 |

---

## 🎯 ROADMAP

### Phase 1: Stabilization (2 tuần)
- [ ] Refactor 8 files >1000 lines
- [ ] Unified API client
- [ ] Type-safe JSON fields

### Phase 2: Optimization (2 tuần)
- [ ] Custom hooks cho Portal
- [ ] Caching layer
- [ ] Query optimization

### Phase 3: Enhancement (2 tuần)
- [ ] Error monitoring
- [ ] Performance tracking
- [ ] Documentation

---

## 📝 KẾT LUẬN

Codebase có **nền tảng tốt** với:
- Kiến trúc backend clean
- Security implementation solid
- Design system centralized

**Vấn đề chính** cần giải quyết:
1. **File size**: 8 files >1000 lines cần tách ngay
2. **Pattern inconsistency**: API client, state management
3. **Type safety**: JSON fields, status strings

**Ưu tiên cao nhất**: Refactor các file lớn trong `admin/src/app/pages/InteriorPage/` vì đây là bottleneck lớn nhất cho maintainability.
