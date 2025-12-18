---
inclusion: manual
---

# 📋 ANH THỢ XÂY (ATH) - Project Rules

> **Note**: Tổng quan dự án. Xem `cursor-rules.md` cho rules chính.

## 🎯 Mục tiêu dự án
WebApp MVP cho doanh nghiệp cải tạo nhà/căn hộ với tính năng báo giá & dự toán tự động.

## 🏗️ Kiến trúc Monorepo (Nx)

```
├── landing/     → Port 4200 (React + Vite) - Website khách hàng
├── admin/       → Port 4201 (React + Vite) - Dashboard quản trị  
├── api/         → Port 4202 (Hono + Prisma) - Backend API
├── packages/    → Shared libraries
└── infra/       → Prisma schema
```

## ⚠️ QUAN TRỌNG - Tránh lỗi thường gặp

### 1. Import paths
- ✅ Dùng: `@app/shared`, `@app/ui`
- ❌ Tránh: relative imports quá sâu `../../../`
- ❌ KHÔNG import từ app khác (landing không import từ admin)

### 2. TypeScript
- ✅ Luôn định nghĩa types rõ ràng
- ✅ Dùng `interface` cho objects, `type` cho unions
- ❌ Tránh `any` - dùng `unknown` nếu cần
- ❌ Không bỏ qua TypeScript errors

### 3. React Components
- ✅ Dùng `memo()` cho components nhận props phức tạp
- ✅ Dùng `useCallback` cho functions truyền xuống children
- ✅ Dùng `useMemo` cho computed values nặng
- ❌ Không để dependencies array trống khi có dependencies

### 4. API & Data
- ✅ Validate input với Zod schemas
- ✅ Handle errors với try/catch
- ✅ Return proper HTTP status codes
- ❌ Không hardcode URLs - dùng environment variables

### 5. Prisma
- ✅ Chạy `pnpm db:generate` sau khi sửa schema
- ✅ Chạy `pnpm db:push` để sync database
- ❌ Không sửa database trực tiếp

## 📁 File References
- Prisma Schema: #[[file:infra/prisma/schema.prisma]]
- API Main: #[[file:api/src/main.ts]]
- Landing Types: #[[file:landing/src/app/types.ts]]
- Admin Types: #[[file:admin/src/app/types.ts]]
