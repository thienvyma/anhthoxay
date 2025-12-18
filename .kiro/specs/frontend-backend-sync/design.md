# Design Document

## Overview

Cập nhật các frontend apps (admin và landing) để đồng bộ với backend API sau khi thực hiện các spec tasks tối ưu hệ thống (api-refactoring, security-hardening, jwt-enhancement). Các thay đổi chính bao gồm:

1. **Response Format**: Backend trả về format mới `{ success: true, data: T }` và `{ success: true, data: T[], meta: {...} }`
2. **Authentication**: Chuyển từ cookie-based sang JWT Bearer token (9 files trong admin app)
3. **Field Names**: Một số field names đã thay đổi (e.g., `author` → `name`)
4. **Missing API Methods**: Cần thêm `materialCategoriesApi`, sửa `blogCommentsApi`, thêm `formulasApi.delete`

**Scope:**
- Admin App: 11 files cần sửa
- Landing App: 9 files cần sửa

## Architecture

### Backend Response Format (Đã implement)

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Response                      │
├─────────────────────────────────────────────────────────────┤
│ Success:     { success: true, data: T }                     │
│ Paginated:   { success: true, data: T[], meta: {...} }      │
│ Error:       { success: false, error: {...}, correlationId }│
└─────────────────────────────────────────────────────────────┘
```

### Frontend API Client Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Component   │────▶│  API Client  │────▶│   Backend    │
│              │     │  (apiFetch)  │     │     API      │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Unwrap     │
                     │   Response   │
                     │   Format     │
                     └──────────────┘
```

## Components

### Component 1: Admin API Client Enhancement

**File:** `admin/src/app/api.ts`

**Thay đổi:**

1. **apiFetch - Paginated Response Handler**
   - Detect paginated response: `{ success: true, data: [], meta: {...} }`
   - Flatten meta into response for backward compatibility với existing components
   - Return: `{ data: [], total, page, limit, totalPages }`

2. **materialCategoriesApi** (Thêm mới)
   - `list()` - GET /material-categories
   - `get(id)` - GET /material-categories/:id
   - `create(data)` - POST /material-categories
   - `update(id, data)` - PUT /material-categories/:id
   - `delete(id)` - DELETE /material-categories/:id

3. **blogCommentsApi** (Sửa)
   - `list(params?)` - GET /blog/comments
   - `updateStatus(id, status)` - PUT /blog/comments/:id/status
   - `delete(id)` - DELETE /blog/comments/:id

### Component 2: Admin PricingConfigPage Migration

**Files:**
- `admin/src/app/pages/PricingConfigPage/index.tsx`
- `admin/src/app/pages/PricingConfigPage/ServiceCategoriesTab.tsx`
- `admin/src/app/pages/PricingConfigPage/UnitPricesTab.tsx`
- `admin/src/app/pages/PricingConfigPage/MaterialsTab.tsx`
- `admin/src/app/pages/PricingConfigPage/FormulasTab.tsx`

**Thay đổi:**
- Thay thế tất cả `fetch()` với `credentials: 'include'` bằng API clients
- Import và sử dụng: `serviceCategoriesApi`, `unitPricesApi`, `materialsApi`, `materialCategoriesApi`, `formulasApi`

### Component 3: Admin SettingsPage Migration

**Files:**
- `admin/src/app/pages/SettingsPage/CompanyTab.tsx`
- `admin/src/app/pages/SettingsPage/LayoutTab.tsx`
- `admin/src/app/pages/SettingsPage/PromoTab.tsx`

**Thay đổi:**
- Thay thế tất cả `fetch()` với `credentials: 'include'` bằng API clients
- Import và sử dụng: `settingsApi`, `pagesApi`, `mediaApi`

### Component 3.5: Admin MediaPage Migration

**File:** `admin/src/app/pages/MediaPage.tsx`

**Thay đổi:**
- `loadMediaUsage()`: Thay `fetch()` với `credentials: 'include'` bằng API client hoặc helper với JWT
- `handleSyncMedia()`: Thay `fetch()` với `credentials: 'include'` bằng API client
- `handleSaveEdit()`: Thay `fetch()` với `credentials: 'include'` bằng API client

**Cần thêm vào `mediaApi`:**
```typescript
getUsage: () => apiFetch<MediaUsageResponse>('/media/usage'),
sync: () => apiFetch<{ message: string }>('/media/sync', { method: 'POST' }),
updateMetadata: (id: string, data: { alt?: string; tags?: string }) =>
  apiFetch<MediaAsset>(`/media/${id}`, { method: 'PUT', body: data }),
```

### Component 4: Landing API Client Fix

**File:** `landing/src/app/api.ts`

**Thay đổi:**
- `blogAPI.addComment`: Đổi field `author` thành `name`

### Component 5: Landing BlogDetailPage Fix

**File:** `landing/src/app/pages/BlogDetailPage.tsx`

**Thay đổi:**
- Khi gọi `blogAPI.addComment`, sử dụng `name` thay vì `author`

### Component 6: Landing Direct Fetch Response Handling

**Files:**
- `landing/src/app/sections/QuoteFormSection.tsx`
- `landing/src/app/sections/QuoteCalculatorSection.tsx`
- `landing/src/app/pages/DynamicPage.tsx`
- `landing/src/app/pages/QuotePage.tsx`
- `landing/src/app/app.tsx`
- `landing/src/app/components/MobileMenu.tsx`
- `landing/src/app/components/PromoPopup.tsx`
- `landing/src/app/components/NewsletterSignup.tsx`
- `landing/src/app/components/SaveQuoteModal.tsx`

**Thay đổi:**
- Thêm response unwrapping: `const data = json.data || json;`
- **Lead submission forms** (QuoteFormSection, NewsletterSignup, SaveQuoteModal): Extract error message từ response khi fail

**Chi tiết fix cho Lead Submission Forms:**
```typescript
// TRƯỚC (chỉ check res.ok, hiển thị generic error)
if (!res.ok) {
  throw new Error('Failed to submit');
}
// catch: toast.error('Có lỗi xảy ra. Vui lòng thử lại!');

// SAU (extract error message từ response)
if (!res.ok) {
  const errorData = await res.json();
  const errorMessage = errorData.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại!';
  toast.error(errorMessage);
  return;
}
```

### Component 7: Admin BlogManagerPage Migration

**File:** `admin/src/app/pages/BlogManagerPage/PostsTab.tsx`

**Thay đổi:**
- `onImageUpload` trong MarkdownEditor: Thay `fetch()` với `credentials: 'include'` bằng `mediaApi.upload()`

## Data Models

### Paginated Response (Admin expects)

```typescript
// Backend returns:
interface BackendPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Admin components expect (after apiFetch transformation):
interface AdminPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Material Category

```typescript
interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MaterialCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}
```

### Blog Comment

```typescript
interface BlogComment {
  id: string;
  postId: string;
  name: string;  // NOT "author"
  email: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
```

## Error Handling

### API Client Error Extraction

```typescript
// Backend error format:
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input'
  },
  correlationId: 'uuid-xxx'
}

// Frontend extraction:
const errorMessage = error.error?.message || error.error || error.message || 'Unknown error';
```

## Testing Strategy

### Manual Testing Checklist

1. **Admin App**
   - [ ] Login/Logout works
   - [ ] LeadsPage loads with pagination
   - [ ] DashboardPage shows stats
   - [ ] PricingConfigPage loads all tabs
   - [ ] ServiceCategories CRUD works
   - [ ] UnitPrices CRUD works
   - [ ] Materials CRUD works
   - [ ] Formulas CRUD works
   - [ ] SettingsPage Company tab saves
   - [ ] SettingsPage Layout tab saves
   - [ ] BlogPage CRUD works
   - [ ] Blog comments moderation works

2. **Landing App**
   - [ ] Homepage loads
   - [ ] Quote calculator works
   - [ ] Quote form submits
   - [ ] Blog posts load
   - [ ] Blog detail page loads
   - [ ] Blog comment submission works
   - [ ] Newsletter signup works
   - [ ] Contact form works

### Lint & Typecheck

```bash
pnpm nx run-many --target=lint --all
pnpm nx run-many --target=typecheck --all
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API Client Response Unwrapping
*For any* API response with format `{ success: true, data: T }`, the `apiFetch` function SHALL return only the `data` portion, not the wrapper object.
**Validates: Requirements 2.1, 5.1**

### Property 2: Paginated Response Flattening
*For any* paginated API response with format `{ success: true, data: T[], meta: {...} }`, the `apiFetch` function SHALL return an object with `data`, `total`, `page`, `limit`, `totalPages` at the top level.
**Validates: Requirements 4.1, 4.2**

### Property 3: JWT Authorization Header
*For any* authenticated API call, the request SHALL include `Authorization: Bearer <token>` header instead of `credentials: 'include'`.
**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 16.1, 16.2, 16.3**

### Property 4: Blog Comment Field Name
*For any* blog comment submission, the request body SHALL use field `name` instead of `author`.
**Validates: Requirements 1.1**

### Property 5: Error Response Extraction
*For any* error response with format `{ success: false, error: { code, message }, correlationId }`, the API client SHALL extract and display the `error.message` to users.
**Validates: Requirements 2.2, 14.1, 14.2**

### Property 6: Backward Compatibility
*For any* non-standard response (legacy format without `success` field), the API client SHALL return the response as-is.
**Validates: Requirements 2.3**

## Migration Notes

### Breaking Changes

1. **Cookie Auth → JWT**: Tất cả direct fetch() calls phải chuyển sang API client hoặc thêm Authorization header
2. **Response Format**: Tất cả response handlers phải unwrap `json.data`
3. **Field Names**: `author` → `name` trong blog comments

### Backward Compatibility

- API client sử dụng fallback `json.data || json` để hỗ trợ cả format cũ và mới
- Paginated response được flatten để không cần sửa existing components

### Rollback Plan

Nếu có vấn đề, có thể rollback từng component một vì các thay đổi độc lập với nhau.
