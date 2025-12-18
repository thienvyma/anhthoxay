---
inclusion: manual
---

# 🔄 Development Workflow

> **Note**: Quy trình phát triển feature mới. Xem `cursor-rules.md` cho rules chính.

## 📋 Quy trình phát triển feature mới

### Step 1: Phân tích
- [ ] Đọc requirements trong Product.md
- [ ] Xác định data models cần thiết
- [ ] Xác định API endpoints cần tạo
- [ ] Xác định UI components cần tạo

### Step 2: Database (nếu cần)
```bash
# 1. Sửa schema
# File: infra/prisma/schema.prisma

# 2. Generate Prisma client
pnpm db:generate

# 3. Push changes to database
pnpm db:push

# 4. Seed data (optional)
pnpm db:seed
```

### Step 3: API
- [ ] Tạo Zod schema trong `api/src/schemas.ts`
- [ ] Tạo route handlers trong `api/src/main.ts`
- [ ] **🔐 Thêm auth middleware nếu cần** (xem `security-checklist.md`)
- [ ] **🔐 Thêm rate limiting cho form submissions**
- [ ] Test với curl/Postman

### Step 4: Frontend
- [ ] Tạo types trong `types.ts`
- [ ] Tạo API functions trong `api.ts`
- [ ] Tạo components
- [ ] Tạo pages

### Step 5: Testing
- [ ] Test API endpoints
- [ ] **🔐 Test với user không có quyền (nếu có auth)**
- [ ] Test UI trên browser
- [ ] Test mobile responsive
- [ ] Test error cases

### Step 6: Security Review (BẮT BUỘC cho API)
- [ ] Endpoint có auth middleware chưa?
- [ ] Role check đúng chưa?
- [ ] Input validation đầy đủ chưa?
- [ ] Rate limiting cho form submissions?
- [ ] Đã cập nhật Protected Routes Registry?

## 🚀 Commands thường dùng

```bash
# Install dependencies
pnpm install

# Database
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
pnpm db:seed        # Seed sample data

# Development
pnpm dev:api        # Start API server (port 4202)
pnpm dev:landing    # Start Landing page (port 4200)
pnpm dev:admin      # Start Admin dashboard (port 4201)

# Type checking
pnpm nx run landing:typecheck
pnpm nx run admin:typecheck
pnpm nx run api:typecheck
```

## 🔍 Debug Checklist

### API không hoạt động?
1. Check API server đang chạy (`pnpm dev:api`)
2. Check port 4202 không bị chiếm
3. Check database connection
4. Check Prisma client đã generate

### Frontend lỗi?
1. Check console errors
2. Check Network tab trong DevTools
3. Check API response
4. Check TypeScript errors

### Database lỗi?
1. Check file `infra/prisma/dev.db` tồn tại
2. Chạy `pnpm db:generate`
3. Chạy `pnpm db:push`

## 📁 File Organization

### Khi tạo feature mới
```
1. Schema:     infra/prisma/schema.prisma
2. API:        api/src/main.ts, api/src/schemas.ts
3. Types:      landing/src/app/types.ts, admin/src/app/types.ts
4. Components: landing/src/app/components/, admin/src/app/components/
5. Pages:      landing/src/app/pages/, admin/src/app/pages/
```

### Naming Convention
- Components: PascalCase (`QuoteForm.tsx`)
- Hooks: camelCase với prefix `use` (`useQuoteCalculator.ts`)
- Utils: camelCase (`formatCurrency.ts`)
- Types: PascalCase (`CustomerLead`)

## ⚠️ Trước khi commit

```bash
# 1. Check TypeScript errors
pnpm nx run-many --target=typecheck --all

# 2. Check ESLint
pnpm nx run-many --target=lint --all

# 3. Test build
pnpm nx run-many --target=build --all
```

## 🎯 Priority Order khi refactor

1. **Database Schema** - Nền tảng cho mọi thứ
2. **API Endpoints** - Backend logic
3. **Admin Panel** - Quản lý data
4. **Landing Page** - User-facing
