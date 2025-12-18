# 📋 BÁO CÁO KIỂM TRA ĐỒNG BỘ FRONTEND-BACKEND (V2 - Chi tiết)

## 📅 Ngày kiểm tra: 19/12/2024 (Cập nhật)

## 🎯 Mục đích
Rà soát toàn diện và chi tiết tất cả các vấn đề đồng bộ giữa frontend apps (admin, landing) và backend API sau khi thực hiện các spec tasks tối ưu hệ thống.

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG (CRITICAL)

### 1. Admin App - Direct Fetch với `credentials: 'include'` (Cookie Auth)

Backend đã chuyển sang JWT Bearer token, nhưng nhiều files vẫn dùng cookie auth.

| # | File | Lines | Vấn đề |
|---|------|-------|--------|
| 1 | `admin/src/app/pages/PricingConfigPage/index.tsx` | 33-38 | `fetch()` với `credentials: 'include'` cho 5 endpoints |
| 2 | `admin/src/app/pages/PricingConfigPage/ServiceCategoriesTab.tsx` | 53-62, 68-73 | `fetch()` với `credentials: 'include'` cho CRUD |
| 3 | `admin/src/app/pages/PricingConfigPage/UnitPricesTab.tsx` | 48-58, 64-71 | `fetch()` với `credentials: 'include'` cho CRUD |
| 4 | `admin/src/app/pages/PricingConfigPage/MaterialsTab.tsx` | Multiple | `fetch()` với `credentials: 'include'` cho CRUD |
| 5 | `admin/src/app/pages/PricingConfigPage/FormulasTab.tsx` | 32-42, 48-55 | `fetch()` với `credentials: 'include'` cho CRUD |
| 6 | `admin/src/app/pages/SettingsPage/CompanyTab.tsx` | 22-32, 38-58, 62-78 | `fetch()` với `credentials: 'include'` |
| 7 | `admin/src/app/pages/SettingsPage/LayoutTab.tsx` | 68-73, 95-143 | `fetch()` với `credentials: 'include'` |
| 8 | `admin/src/app/pages/SettingsPage/PromoTab.tsx` | 22-32, 38-58 | `fetch()` với `credentials: 'include'` |
| 9 | `admin/src/app/pages/MediaPage.tsx` | 56-62, 68-78, 119-132 | `fetch()` với `credentials: 'include'` cho usage, sync, edit |

**Tổng: 9 files, ~30+ fetch calls cần migrate**

### 2. Admin App - Response Format Mismatch (Paginated)

Backend trả về:
```json
{ "success": true, "data": [...], "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 } }
```

Admin app expects:
```json
{ "data": [...], "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
```

**File cần fix:** `admin/src/app/api.ts` - function `apiFetch`

### 3. Landing App - Blog Comment Field Name Mismatch

| File | Line | Vấn đề |
|------|------|--------|
| `landing/src/app/api.ts` | 119 | `addComment` gửi `author` thay vì `name` |
| `landing/src/app/pages/BlogDetailPage.tsx` | 86-89 | Gọi `blogAPI.addComment` với `author: commentForm.name` |

Backend expects:
```typescript
CreateCommentSchema = z.object({
  name: z.string(),  // NOT "author"
  email: z.string(),
  content: z.string(),
});
```

---

## 🟠 VẤN ĐỀ TRUNG BÌNH (MEDIUM)

### 4. Landing App - Response Format Handling

Các components cần unwrap `response.data` từ standardized format:

| # | File | Vấn đề | Trạng thái |
|---|------|--------|------------|
| 1 | `landing/src/app/app.tsx` | Line ~88-91: fetch settings không unwrap | ❌ Cần fix |
| 2 | `landing/src/app/pages/DynamicPage.tsx` | Line ~25: `res.json()` không unwrap | ❌ Cần fix |
| 3 | `landing/src/app/pages/QuotePage.tsx` | Line ~17-20: `res.json()` không unwrap | ❌ Cần fix |
| 4 | `landing/src/app/components/MobileMenu.tsx` | Line ~56-59: fetch settings không unwrap | ❌ Cần fix |
| 5 | `landing/src/app/components/PromoPopup.tsx` | Line ~24-27: fetch settings không unwrap | ❌ Cần fix |
| 6 | `landing/src/app/components/NewsletterSignup.tsx` | Line ~39-45: POST lead không handle response | ❌ Cần fix |
| 7 | `landing/src/app/components/SaveQuoteModal.tsx` | Line ~51-57: POST lead không handle response | ❌ Cần fix |
| 8 | `landing/src/app/sections/QuoteCalculatorSection.tsx` | Line ~367-370 | ✅ Đã có fallback |

### 5. Admin App - Missing API Client Methods

**File:** `admin/src/app/api.ts`

| API | Thiếu | Cần thêm |
|-----|-------|----------|
| `materialCategoriesApi` | Hoàn toàn | `list()`, `get()`, `create()`, `update()`, `delete()` |
| `blogCommentsApi` | `list()`, `updateStatus()` | Endpoint `/blog/comments` và `/blog/comments/:id/status` |
| `formulasApi` | `delete()` | Endpoint `/formulas/:id` DELETE |

### 6. Admin App - MediaPage Direct Fetch Issues

**File:** `admin/src/app/pages/MediaPage.tsx`

| Function | Line | Vấn đề |
|----------|------|--------|
| `loadMediaUsage` | ~56-62 | `fetch()` với `credentials: 'include'` |
| `handleSyncMedia` | ~68-78 | `fetch()` với `credentials: 'include'` |
| `handleSaveEdit` | ~119-132 | `fetch()` với `credentials: 'include'` |

---

## 🟡 VẤN ĐỀ NHẸ (LOW)

### 7. Admin App - BlogCommentsApi Endpoint Sai

**File:** `admin/src/app/api.ts`

Hiện tại:
```typescript
update: (id: string, data: { status: string }) =>
  apiFetch<BlogComment>(`/blog/comments/${id}`, { method: 'PUT', body: data }),
```

Cần sửa:
```typescript
updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
  apiFetch<BlogComment>(`/blog/comments/${id}/status`, { method: 'PUT', body: { status } }),
```

### 8. Landing App - API Client Không Có Error Handling Cho correlationId

**File:** `landing/src/app/api.ts`

Hiện tại không log `correlationId` từ error response để debug.

---

## 📊 TỔNG HỢP

### Số lượng files cần sửa:

| App | Số files | Mức độ | Chi tiết |
|-----|----------|--------|----------|
| Admin | 11 files | 🔴 Nghiêm trọng | 9 files direct fetch + 2 files API client |
| Landing | 9 files | 🟠 Trung bình | 1 API client + 8 components |

### Phân loại theo loại vấn đề:

| Loại vấn đề | Số lượng | Files |
|-------------|----------|-------|
| Cookie → JWT migration | 9 files | PricingConfigPage/*, SettingsPage/*, MediaPage |
| Response format handling | 8 files | DynamicPage, QuotePage, app.tsx, MobileMenu, PromoPopup, NewsletterSignup, SaveQuoteModal, api.ts |
| Field name mismatch | 2 files | landing/api.ts, BlogDetailPage.tsx |
| Missing API methods | 1 file | admin/api.ts |

---

## 🛠️ HƯỚNG DẪN FIX CHI TIẾT

### Bước 1: Fix Admin API Client (`admin/src/app/api.ts`)

#### 1.1 Cập nhật `apiFetch` để xử lý paginated response:

```typescript
async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  // ... existing fetch logic ...
  
  const json = await response.json();
  
  // Unwrap standardized response format
  if (json && typeof json === 'object' && 'success' in json) {
    // Handle paginated response - flatten meta into response
    if ('meta' in json && Array.isArray(json.data)) {
      return {
        data: json.data,
        total: json.meta.total,
        page: json.meta.page,
        limit: json.meta.limit,
        totalPages: json.meta.totalPages,
      } as T;
    }
    // Handle standard success response
    if ('data' in json) {
      return json.data as T;
    }
  }
  
  // Fallback for non-standard responses
  return json as T;
}
```

#### 1.2 Thêm `materialCategoriesApi`:

```typescript
interface MaterialCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
}

export const materialCategoriesApi = {
  list: () => apiFetch<MaterialCategory[]>('/material-categories'),
  get: (id: string) => apiFetch<MaterialCategory>(`/material-categories/${id}`),
  create: (data: MaterialCategoryInput) => apiFetch<MaterialCategory>('/material-categories', { method: 'POST', body: data }),
  update: (id: string, data: Partial<MaterialCategoryInput>) => apiFetch<MaterialCategory>(`/material-categories/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiFetch<{ ok: boolean }>(`/material-categories/${id}`, { method: 'DELETE' }),
};
```

#### 1.3 Sửa `blogCommentsApi`:

```typescript
export const blogCommentsApi = {
  list: (params?: { status?: string; postId?: string }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString() : '';
    return apiFetch<BlogComment[]>(`/blog/comments${query ? '?' + query : ''}`);
  },
  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiFetch<BlogComment>(`/blog/comments/${id}/status`, { method: 'PUT', body: { status } }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/blog/comments/${id}`, { method: 'DELETE' }),
};
```

#### 1.4 Thêm `formulasApi.delete`:

```typescript
export const formulasApi = {
  // ... existing methods ...
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/formulas/${id}`, { method: 'DELETE' }),
};
```

### Bước 2: Migrate PricingConfigPage

**File:** `admin/src/app/pages/PricingConfigPage/index.tsx`

Thay thế:
```typescript
const [scRes, upRes, matRes, mcRes, fRes] = await Promise.all([
  fetch(`${API_URL}/service-categories`, { credentials: 'include' }),
  fetch(`${API_URL}/unit-prices`, { credentials: 'include' }),
  fetch(`${API_URL}/materials`, { credentials: 'include' }),
  fetch(`${API_URL}/material-categories`, { credentials: 'include' }),
  fetch(`${API_URL}/formulas`, { credentials: 'include' }),
]);
```

Bằng:
```typescript
import { serviceCategoriesApi, unitPricesApi, materialsApi, materialCategoriesApi, formulasApi } from '../../api';

const [sc, up, mat, mc, f] = await Promise.all([
  serviceCategoriesApi.list(),
  unitPricesApi.list(),
  materialsApi.list(),
  materialCategoriesApi.list(),
  formulasApi.list(),
]);
setServiceCategories(sc);
setUnitPrices(up);
setMaterials(mat);
setMaterialCategories(mc);
setFormulas(f);
```

### Bước 3: Migrate các Tab files

Tương tự, thay thế tất cả `fetch()` calls trong:
- `ServiceCategoriesTab.tsx`
- `UnitPricesTab.tsx`
- `MaterialsTab.tsx`
- `FormulasTab.tsx`

### Bước 4: Migrate SettingsPage

Thay thế `fetch()` calls trong:
- `CompanyTab.tsx` → sử dụng `settingsApi`, `mediaApi`
- `LayoutTab.tsx` → sử dụng `pagesApi`, `settingsApi`
- `PromoTab.tsx` → sử dụng `settingsApi`, `mediaApi`

### Bước 5: Migrate MediaPage

Thêm methods vào `mediaApi` hoặc tạo helper functions với JWT auth.

### Bước 6: Fix Landing App

#### 6.1 Fix `landing/src/app/api.ts`:

```typescript
addComment: (postId: string, data: { name: string; email: string; content: string }) => {
  return apiFetch<BlogComment>(`/blog/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
},
```

#### 6.2 Fix `landing/src/app/pages/BlogDetailPage.tsx`:

```typescript
await blogAPI.addComment(post.id, {
  name: commentForm.name,  // Changed from 'author'
  email: commentForm.email,
  content: commentForm.content,
});
```

#### 6.3 Thêm response unwrapping cho các components:

```typescript
// Pattern chung:
const json = await response.json();
const data = json.data || json; // Fallback for backward compatibility
```

---

## ✅ CHECKLIST IMPLEMENTATION

### Admin App
- [ ] Fix `admin/src/app/api.ts` - apiFetch paginated response
- [ ] Add `materialCategoriesApi` to `admin/src/app/api.ts`
- [ ] Fix `blogCommentsApi` endpoints in `admin/src/app/api.ts`
- [ ] Add `formulasApi.delete` to `admin/src/app/api.ts`
- [ ] Migrate `PricingConfigPage/index.tsx`
- [ ] Migrate `PricingConfigPage/ServiceCategoriesTab.tsx`
- [ ] Migrate `PricingConfigPage/UnitPricesTab.tsx`
- [ ] Migrate `PricingConfigPage/MaterialsTab.tsx`
- [ ] Migrate `PricingConfigPage/FormulasTab.tsx`
- [ ] Migrate `SettingsPage/CompanyTab.tsx`
- [ ] Migrate `SettingsPage/LayoutTab.tsx`
- [ ] Migrate `SettingsPage/PromoTab.tsx`
- [ ] Migrate `MediaPage.tsx`

### Landing App
- [ ] Fix `landing/src/app/api.ts` - blogAPI.addComment field name
- [ ] Fix `landing/src/app/pages/BlogDetailPage.tsx` - comment submission
- [ ] Fix `landing/src/app/app.tsx` - settings fetch
- [ ] Fix `landing/src/app/pages/DynamicPage.tsx` - response unwrap
- [ ] Fix `landing/src/app/pages/QuotePage.tsx` - response unwrap
- [ ] Fix `landing/src/app/components/MobileMenu.tsx` - settings fetch
- [ ] Fix `landing/src/app/components/PromoPopup.tsx` - settings fetch
- [ ] Fix `landing/src/app/components/NewsletterSignup.tsx` - response handling
- [ ] Fix `landing/src/app/components/SaveQuoteModal.tsx` - response handling

### Verification
- [ ] Run `pnpm nx run-many --target=lint --all`
- [ ] Run `pnpm nx run-many --target=typecheck --all`
- [ ] Test login/logout
- [ ] Test PricingConfigPage all tabs
- [ ] Test SettingsPage all tabs
- [ ] Test MediaPage
- [ ] Test LeadsPage pagination
- [ ] Test DashboardPage stats
- [ ] Test Landing homepage
- [ ] Test Landing quote calculator
- [ ] Test Landing blog comment submission

---

## 📌 GHI CHÚ QUAN TRỌNG

1. **Không sửa backend** - Backend đã hoạt động đúng
2. **Test từng module** - Sau khi sửa mỗi file, test ngay
3. **Giữ backward compatibility** - Sử dụng fallback `json.data || json`
4. **Chạy lint + typecheck** - Sau mỗi thay đổi
5. **Ưu tiên fix theo thứ tự** - Admin API client → PricingConfigPage → SettingsPage → MediaPage → Landing
