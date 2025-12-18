# 📋 BÁO CÁO KIỂM TRA ĐỒNG BỘ FRONTEND-BACKEND

## 📅 Ngày kiểm tra: 19/12/2024

## 🎯 Mục đích
Sau khi thực hiện nhiều spec tasks để tối ưu hệ thống API (api-refactoring, security-hardening, jwt-enhancement), cần kiểm tra và cập nhật các frontend apps (admin và landing) để đồng bộ với các thay đổi của backend.

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG

### 1. Authentication Migration (Cookie → JWT)

**Mô tả:** Backend đã chuyển từ cookie-based auth sang JWT Bearer token, nhưng nhiều components trong admin app vẫn dùng `credentials: 'include'` (cookie auth).

**Các files bị ảnh hưởng:**

| File | Vấn đề |
|------|--------|
| `admin/src/app/pages/PricingConfigPage/index.tsx` | Dùng `credentials: 'include'` cho tất cả fetch calls |
| `admin/src/app/pages/PricingConfigPage/ServiceCategoriesTab.tsx` | Dùng `credentials: 'include'` |
| `admin/src/app/pages/PricingConfigPage/UnitPricesTab.tsx` | Dùng `credentials: 'include'` |
| `admin/src/app/pages/PricingConfigPage/MaterialsTab.tsx` | Dùng `credentials: 'include'` |
| `admin/src/app/pages/PricingConfigPage/FormulasTab.tsx` | Dùng `credentials: 'include'` |
| `admin/src/app/pages/SettingsPage/CompanyTab.tsx` | Dùng `credentials: 'include'` |
| `admin/src/app/pages/SettingsPage/LayoutTab.tsx` | Dùng `credentials: 'include'` |
| `admin/src/app/pages/SettingsPage/PromoTab.tsx` | Có thể dùng `credentials: 'include'` |

**Giải pháp:** Chuyển tất cả direct fetch() calls sang sử dụng centralized API client (`admin/src/app/api.ts`) đã có sẵn JWT auth.

---

### 2. Response Format Mismatch

**Mô tả:** Backend trả về response format mới:
- Success: `{ success: true, data: T }`
- Paginated: `{ success: true, data: T[], meta: { total, page, limit, totalPages } }`
- Error: `{ success: false, error: { code, message }, correlationId }`

Nhiều components chưa xử lý đúng format này.

**Admin App - Paginated Response:**

```typescript
// Backend trả về:
{
  success: true,
  data: [...leads],
  meta: { total: 100, page: 1, limit: 20, totalPages: 5 }
}

// Admin app expect (LeadsPage.tsx):
{
  data: [...leads],
  total: 100,
  page: 1,
  limit: 20,
  totalPages: 5
}
```

**File cần fix:** `admin/src/app/api.ts` - function `apiFetch` cần xử lý paginated response đặc biệt.

---

## 🟠 VẤN ĐỀ TRUNG BÌNH

### 3. Landing App - Blog Comment Field Name

**File:** `landing/src/app/api.ts`

**Vấn đề:**
```typescript
// Hiện tại gửi:
addComment: (postId: string, data: { author: string; email: string; content: string })

// Backend expect:
CreateCommentSchema = z.object({
  name: z.string(),  // NOT "author"
  email: z.string(),
  content: z.string(),
});
```

**Giải pháp:** Đổi `author` thành `name` trong `blogAPI.addComment`.

---

### 4. Landing App - Direct Fetch Calls

**Mô tả:** Nhiều components trong landing app gọi `fetch()` trực tiếp và cần xử lý response format mới.

| Component | File | Vấn đề |
|-----------|------|--------|
| QuoteCalculatorSection | `landing/src/app/sections/QuoteCalculatorSection.tsx` | Cần unwrap `response.data` |
| QuoteFormSection | `landing/src/app/sections/QuoteFormSection.tsx` | Cần unwrap `response.data` |
| DynamicPage | `landing/src/app/pages/DynamicPage.tsx` | Cần unwrap `response.data` |
| QuotePage | `landing/src/app/pages/QuotePage.tsx` | Cần unwrap `response.data` |
| App | `landing/src/app/app.tsx` | Cần unwrap `response.data` |
| MobileMenu | `landing/src/app/components/MobileMenu.tsx` | Cần unwrap `response.data` |
| PromoPopup | `landing/src/app/components/PromoPopup.tsx` | Cần unwrap `response.data` |
| NewsletterSignup | `landing/src/app/components/NewsletterSignup.tsx` | Cần handle response format |
| SaveQuoteModal | `landing/src/app/components/SaveQuoteModal.tsx` | Cần handle response format |

**Giải pháp:** Thêm logic unwrap response:
```typescript
const json = await response.json();
const data = json.data || json; // Fallback for backward compatibility
```

---

### 5. Missing API Client Methods

**File:** `admin/src/app/api.ts`

**Thiếu:**
- `materialCategoriesApi` - API cho quản lý danh mục vật dụng

**Cần thêm:**
```typescript
export const materialCategoriesApi = {
  list: () => apiFetch<MaterialCategory[]>('/material-categories'),
  get: (id: string) => apiFetch<MaterialCategory>(`/material-categories/${id}`),
  create: (data: MaterialCategoryInput) => apiFetch<MaterialCategory>('/material-categories', { method: 'POST', body: data }),
  update: (id: string, data: Partial<MaterialCategoryInput>) => apiFetch<MaterialCategory>(`/material-categories/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiFetch<{ ok: boolean }>(`/material-categories/${id}`, { method: 'DELETE' }),
};
```

---

## 🟡 VẤN ĐỀ NHẸ

### 6. Admin Blog Comments API

**File:** `admin/src/app/api.ts`

**Hiện tại:**
```typescript
export const blogCommentsApi = {
  create: (postId: string, data: { name: string; email: string; content: string }) => ...,
  update: (id: string, data: { status: string }) => ...,  // Endpoint sai
  delete: (id: string) => ...,
};
```

**Cần sửa:**
```typescript
export const blogCommentsApi = {
  list: (params?: { status?: string; postId?: string }) => 
    apiFetch<BlogComment[]>(`/blog/comments${query}`),
  updateStatus: (id: string, data: { status: 'APPROVED' | 'REJECTED' }) =>
    apiFetch<BlogComment>(`/blog/comments/${id}/status`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/blog/comments/${id}`, { method: 'DELETE' }),
};
```

---

## 📊 TỔNG HỢP

### Số lượng files cần sửa:

| App | Số files | Mức độ |
|-----|----------|--------|
| Admin | ~15 files | 🔴 Nghiêm trọng |
| Landing | ~10 files | 🟠 Trung bình |

### Ưu tiên fix:

1. **Cao nhất:** Admin authentication migration (PricingConfigPage, SettingsPage)
2. **Cao:** Admin paginated response handling (LeadsPage, DashboardPage)
3. **Trung bình:** Landing response format handling
4. **Thấp:** Blog comments API cleanup

---

## 🛠️ HƯỚNG DẪN FIX

### Bước 1: Fix Admin API Client (`admin/src/app/api.ts`)

1. Cập nhật `apiFetch` để xử lý paginated response:
```typescript
async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  // ... existing code ...
  
  const json = await response.json();
  
  // Handle paginated response
  if (json && typeof json === 'object' && 'success' in json) {
    if ('meta' in json) {
      // Paginated response - flatten for compatibility
      return {
        data: json.data,
        ...json.meta,
      } as T;
    }
    if ('data' in json) {
      return json.data as T;
    }
  }
  
  return json as T;
}
```

2. Thêm `materialCategoriesApi`

3. Sửa `blogCommentsApi`

### Bước 2: Migrate PricingConfigPage

Thay thế tất cả direct fetch() calls bằng API client methods:

```typescript
// Trước:
const res = await fetch(`${API_URL}/service-categories`, { credentials: 'include' });
const data = await res.json();

// Sau:
const data = await serviceCategoriesApi.list();
```

### Bước 3: Migrate SettingsPage

Tương tự như PricingConfigPage, sử dụng `settingsApi` và `pagesApi`.

### Bước 4: Fix Landing App

1. Sửa `blogAPI.addComment` - đổi `author` thành `name`
2. Thêm response unwrapping cho tất cả direct fetch() calls

---

## 📁 SPEC FILE

Spec đã được tạo tại: `.kiro/specs/frontend-backend-sync/requirements.md`

Để tiếp tục implement, chạy spec workflow để tạo design và tasks.

---

## ✅ CHECKLIST TRƯỚC KHI FIX

- [ ] Backup code hiện tại
- [ ] Đảm bảo backend API đang chạy và hoạt động đúng
- [ ] Test login/logout trước khi fix
- [ ] Fix từng module một và test ngay
- [ ] Chạy lint và typecheck sau mỗi thay đổi


---

## 📝 CHI TIẾT CÁC FILE CẦN SỬA

### ADMIN APP

#### 1. `admin/src/app/api.ts`
**Thay đổi cần thiết:**
- Cập nhật `apiFetch` để xử lý paginated response format mới
- Thêm `materialCategoriesApi`
- Sửa `blogCommentsApi.update` thành `blogCommentsApi.updateStatus` với endpoint đúng

#### 2. `admin/src/app/pages/PricingConfigPage/index.tsx`
**Vấn đề:** Dùng direct fetch() với `credentials: 'include'`
```typescript
// Line 33-38: Cần thay thế
const [scRes, upRes, matRes, mcRes, fRes] = await Promise.all([
  fetch(`${API_URL}/service-categories`, { credentials: 'include' }),
  fetch(`${API_URL}/unit-prices`, { credentials: 'include' }),
  fetch(`${API_URL}/materials`, { credentials: 'include' }),
  fetch(`${API_URL}/material-categories`, { credentials: 'include' }),
  fetch(`${API_URL}/formulas`, { credentials: 'include' }),
]);
```
**Giải pháp:** Import và sử dụng API clients

#### 3. `admin/src/app/pages/PricingConfigPage/ServiceCategoriesTab.tsx`
**Vấn đề:** Direct fetch() với `credentials: 'include'` cho CRUD operations
**Lines:** 53-62 (handleSave), 68-73 (handleDelete)
**Giải pháp:** Sử dụng `serviceCategoriesApi`

#### 4. `admin/src/app/pages/PricingConfigPage/UnitPricesTab.tsx`
**Vấn đề:** Direct fetch() với `credentials: 'include'`
**Lines:** 48-58 (handleSave), 64-71 (handleDelete)
**Giải pháp:** Sử dụng `unitPricesApi`

#### 5. `admin/src/app/pages/PricingConfigPage/MaterialsTab.tsx`
**Vấn đề:** Direct fetch() với `credentials: 'include'`
**Giải pháp:** Sử dụng `materialsApi`

#### 6. `admin/src/app/pages/PricingConfigPage/FormulasTab.tsx`
**Vấn đề:** Direct fetch() với `credentials: 'include'`
**Lines:** 32-42 (handleSave), 48-55 (handleDelete)
**Giải pháp:** Sử dụng `formulasApi`

#### 7. `admin/src/app/pages/SettingsPage/CompanyTab.tsx`
**Vấn đề:** Direct fetch() với `credentials: 'include'`
**Lines:** 22-32 (handleSave), 38-58 (handleBackgroundUpload), 62-78 (handleRemoveBackground)
**Giải pháp:** Sử dụng `settingsApi` và `mediaApi`

#### 8. `admin/src/app/pages/SettingsPage/LayoutTab.tsx`
**Vấn đề:** Direct fetch() với `credentials: 'include'`
**Lines:** 68-73 (load mobile menu), 95-110 (handleSaveHeader), 113-130 (handleSaveFooter), 133-143 (handleSaveMobileMenu)
**Giải pháp:** Sử dụng `pagesApi` và `settingsApi`

#### 9. `admin/src/app/pages/SettingsPage/PromoTab.tsx`
**Cần kiểm tra:** Có thể dùng direct fetch()
**Giải pháp:** Sử dụng `settingsApi`

---

### LANDING APP

#### 1. `landing/src/app/api.ts`
**Vấn đề:** `blogAPI.addComment` gửi `author` thay vì `name`
```typescript
// Line 119: Cần sửa
addComment: (postId: string, data: { author: string; email: string; content: string })
// Thành:
addComment: (postId: string, data: { name: string; email: string; content: string })
```

#### 2. `landing/src/app/pages/BlogDetailPage.tsx`
**Vấn đề:** Gọi `blogAPI.addComment` với `author`
```typescript
// Line 86-89: Cần sửa
await blogAPI.addComment(post.id, {
  author: commentForm.name,  // Đổi thành: name: commentForm.name
  email: commentForm.email,
  content: commentForm.content,
});
```

#### 3. `landing/src/app/sections/QuoteCalculatorSection.tsx`
**Vấn đề:** Cần unwrap response.data
```typescript
// Line 367-370: Cần sửa
const [catData, matData, priceData] = await Promise.all([catRes.json(), matRes.json(), priceRes.json()]);
setCategories(catData.data || catData);  // ✅ Đã có fallback
setMaterials(matData.data || matData);   // ✅ Đã có fallback
setUnitPrices(priceData.data || priceData); // ✅ Đã có fallback
```
**Trạng thái:** ✅ Đã xử lý đúng

#### 4. `landing/src/app/sections/QuoteFormSection.tsx`
**Vấn đề:** Cần handle response format cho lead submission
**Line:** ~100
**Giải pháp:** Thêm response unwrapping

#### 5. `landing/src/app/pages/DynamicPage.tsx`
**Vấn đề:** Cần unwrap response.data
**Line:** ~20-25
```typescript
// Cần sửa:
const data = await res.json();
// Thành:
const json = await res.json();
const data = json.data || json;
```

#### 6. `landing/src/app/pages/QuotePage.tsx`
**Vấn đề:** Cần unwrap response.data
**Line:** ~17-20
**Giải pháp:** Tương tự DynamicPage

#### 7. `landing/src/app/app.tsx`
**Vấn đề:** Cần unwrap response.data cho settings và pages
**Lines:** ~88-91 (settings), ~192-195 (pages)
**Giải pháp:** Thêm response unwrapping

#### 8. `landing/src/app/components/MobileMenu.tsx`
**Vấn đề:** Cần unwrap response.data
**Line:** ~56-59
**Giải pháp:** Thêm response unwrapping

#### 9. `landing/src/app/components/PromoPopup.tsx`
**Vấn đề:** Cần unwrap response.data
**Line:** ~24-27
**Giải pháp:** Thêm response unwrapping

#### 10. `landing/src/app/components/NewsletterSignup.tsx`
**Vấn đề:** Cần handle response format cho lead submission
**Line:** ~39-45
**Giải pháp:** Thêm response handling

#### 11. `landing/src/app/components/SaveQuoteModal.tsx`
**Vấn đề:** Cần handle response format cho lead submission
**Line:** ~51-57
**Giải pháp:** Thêm response handling

---

## 🔧 CODE SNIPPETS CHO FIX

### 1. Admin API Client - Paginated Response Handler

```typescript
// admin/src/app/api.ts

interface PaginatedApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

### 2. Material Categories API

```typescript
// admin/src/app/api.ts

interface MaterialCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export const materialCategoriesApi = {
  list: () =>
    apiFetch<MaterialCategory[]>('/material-categories'),

  get: (id: string) =>
    apiFetch<MaterialCategory>(`/material-categories/${id}`),

  create: (data: MaterialCategoryInput) =>
    apiFetch<MaterialCategory>('/material-categories', { method: 'POST', body: data }),

  update: (id: string, data: Partial<MaterialCategoryInput>) =>
    apiFetch<MaterialCategory>(`/material-categories/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/material-categories/${id}`, { method: 'DELETE' }),
};
```

### 3. Blog Comments API Fix

```typescript
// admin/src/app/api.ts

export const blogCommentsApi = {
  // List all comments (admin)
  list: (params?: { status?: string; postId?: string }) => {
    const query = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString() : '';
    return apiFetch<BlogComment[]>(`/blog/comments${query ? '?' + query : ''}`);
  },

  // Update comment status (approve/reject)
  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiFetch<BlogComment>(`/blog/comments/${id}/status`, { method: 'PUT', body: { status } }),

  // Delete comment
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/blog/comments/${id}`, { method: 'DELETE' }),
};
```

### 4. Landing Response Unwrapping Helper

```typescript
// landing/src/app/utils/api.ts (new file) hoặc thêm vào api.ts

/**
 * Unwrap standardized API response
 * Handles both new format { success: true, data: T } and legacy format
 */
export function unwrapResponse<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

// Usage in components:
const json = await response.json();
const data = unwrapResponse<PageData>(json);
```

---

## 📌 GHI CHÚ QUAN TRỌNG

1. **Không sửa backend** - Backend đã hoạt động đúng, chỉ cần sửa frontend
2. **Test từng module** - Sau khi sửa mỗi file, test ngay để đảm bảo không break
3. **Giữ backward compatibility** - Sử dụng fallback `json.data || json` để hỗ trợ cả format cũ và mới
4. **Chạy lint + typecheck** - Sau mỗi thay đổi: `pnpm nx run-many --target=lint --all && pnpm nx run-many --target=typecheck --all`
