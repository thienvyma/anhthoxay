---
inclusion: always
---

# 📚 ANH THỢ XÂY - Steering Guide

## 🎯 MỤC TIÊU
Đảm bảo code nhất quán, tránh trùng lặp, dễ maintain khi vibe-code lâu dài.

## 🔑 QUICK REFERENCE

### Roles (theo thứ tự quyền)
```
ADMIN > MANAGER > CONTRACTOR > HOMEOWNER > WORKER > USER
```

### Apps & Ports
```
landing/  → Port 4200 (Public website)
admin/    → Port 4201 (Admin dashboard)
api/      → Port 4202 (Backend API)
portal/   → Port 4203 (User portal - Homeowner/Contractor)
```

### Commands
```bash
pnpm dev:api          # Start API
pnpm dev:landing      # Start Landing
pnpm dev:admin        # Start Admin
pnpm dev:portal       # Start Portal
pnpm db:generate      # Generate Prisma
pnpm db:push          # Push schema
```

### ⚠️ KIỂM TRA CODE (BẮT BUỘC chạy đủ 3)
```bash
pnpm nx run-many --target=lint --all      # ESLint
pnpm nx run-many --target=typecheck --all # TypeScript
pnpm nx run-many --target=test --all      # Unit tests
```

### Import paths
```typescript
import { tokens, API_URL, resolveMediaUrl } from '@app/shared';
// KHÔNG import cross-app!
```

## 📁 CẤU TRÚC THƯ MỤC

### Frontend Apps
```
landing/src/app/
├── components/     # Shared components (Header, Footer, etc.)
├── pages/          # Route pages
└── sections/       # Page sections (Hero, Features, etc.)

admin/src/app/
├── components/     # Shared components (Layout, Button, Input, etc.)
├── pages/          # Route pages (UsersPage, BlogManagerPage, etc.)
├── forms/          # Form components
├── api/            # API client modules
└── types/          # TypeScript types

portal/src/
├── components/     # Shared components (Layout, Cards, etc.)
├── pages/          # Route pages by role (homeowner/, contractor/, public/)
├── hooks/          # Custom hooks
├── api/            # API client modules
├── auth/           # Auth context & utilities
└── styles/         # CSS files (variables, responsive, etc.)
```

### Backend
```
api/src/
├── routes/         # Hono route handlers
├── services/       # Business logic
├── schemas/        # Zod validation schemas
├── middleware/     # Auth, validation, rate-limit, etc.
├── config/         # CORS, env config
└── utils/          # Helpers (response, logger, encryption)
```

### Shared
```
packages/shared/src/
├── index.ts        # Re-exports (tokens, API_URL, resolveMediaUrl)
├── config.ts       # Environment config (getApiUrl, getPortalUrl)
└── lib/            # Shared utilities

packages/ui/src/    # Shared UI components (nếu có)
```

## 📦 MONOREPO NX RULES

- **KHÔNG** import cross-app trực tiếp (landing → admin)
- Dùng `@app/shared` cho code dùng chung
- Mỗi app có package.json riêng cho dependencies đặc thù
- Scripts chạy từ root: `pnpm dev:api`, `pnpm dev:landing`, etc.

## 🚫 KHÔNG BAO GIỜ

- Tạo file mới nếu đã có file tương tự
- Hardcode strings/numbers, URLs, màu sắc
- Dùng `any` trong TypeScript
- Comment code cũ thay vì xóa
- Suppress warnings bằng eslint-disable mà không có lý do
- **TỰ Ý push/rollback** - CHỈ khi user yêu cầu
- **🔐 Tạo API endpoint admin/manager mà KHÔNG có auth middleware**
- **🔐 Bypass auth hoặc hardcode user ID**
- **🎨 Hardcode màu sắc** - Dùng `tokens` từ `@app/shared`
- **🎨 Dùng icon library khác** - Chỉ dùng Remix Icon (`ri-*`)

## ✅ LUÔN LÀM

- Kiểm tra code hiện tại trước khi tạo mới
- Follow patterns hiện có
- Validate input với Zod
- Fix errors/warnings ngay khi phát hiện
- **🔐 Kiểm tra auth khi tạo/sửa API endpoint**
- **🔐 Cập nhật Protected Routes Registry khi thêm route mới**
- **🎨 Import `tokens` từ `@app/shared` cho UI**
- **🎨 Dùng Framer Motion cho animations**

## 📋 CHECKLIST

### Trước khi code:
- [ ] Source of truth? (Prisma enum/model hay domain type có sẵn)
- [ ] Kiểm tra file/function tương tự đã có chưa
- [ ] Nếu API → xem `security-checklist.md`
- [ ] Nếu UI → xem `ui-style-patterns.md`

### Sau khi code:
- [ ] Chạy lint + typecheck → 0 errors, 0 warnings
- [ ] Nếu API mới → đã thêm auth?
- [ ] Nếu form → đã có rate limiting?
- [ ] Nếu UI → dùng tokens, không hardcode màu?

## 📖 STEERING FILES

### LUÔN ĐỌC
| File | Nội dung |
|------|----------|
| `security-checklist.md` | Auth, roles, rate limiting, Protected Routes Registry |
| `ath-business-logic.md` | Business logic, công thức tính giá, roles |

### ĐỌC THEO CONTEXT (fileMatch)
| File | Trigger |
|------|---------|
| `react-patterns.md` | Files trong `landing/`, `admin/` |
| `api-patterns.md` | Files trong `api/` |
| `prisma-patterns.md` | Files trong `infra/prisma/` |
| `ui-style-patterns.md` | Files `.tsx`, `.css` trong `landing/`, `admin/`, `portal/` |

## ⚠️ CRITICAL RULES

### ERROR / WARNING ENFORCEMENT (ƯU TIÊN CAO NHẤT)
- **BẮT BUỘC** pass: lint + typecheck → 0 errors, 0 warnings
- Warning = bug tiềm ẩn, phải fix, không suppress bằng eslint-disable (trừ bất khả kháng, phải ghi lý do)
- Khi fix warnings: **KHÔNG** phá cấu trúc/logic hiện có
- Thiếu thông tin → **HỎI**, không viết code "tạm đúng"

### TYPE & PRISMA
- Prisma là nguồn sự thật cho enum/model. **CẤM** tạo enum/type trùng nghĩa
- Import: `import { Prisma, $Enums } from '@prisma/client'`
- JSON Prisma: dùng `Prisma.InputJsonValue` (ghi) / `Prisma.JsonValue` (đọc)
- **CẤM** `any | unknown | {} | Record<string, any>` cho Prisma fields

### UI & STYLE
- **BẮT BUỘC** import `tokens` từ `@app/shared` cho colors, spacing, radius
- **CẤM** hardcode màu sắc (`#F5D393`, `#131316`, etc.)
- **LUÔN** dùng Remix Icon (`ri-*`) - không dùng FontAwesome hay icon khác
- **LUÔN** dùng Framer Motion cho animations

### IMPORT ORDER
```
1. External libraries (react, hono, etc)
2. Internal absolute imports (@app/shared, @app/ui)
3. Relative imports (./Component)
4. Types (import type ...)
```

### NAMING CONVENTIONS
- Files: PascalCase cho components, camelCase cho utils
- Components/Types: PascalCase
- Functions/Variables: camelCase
- Constants: UPPER_SNAKE_CASE

## 🔄 SPEC ↔ STEERING SYNC

Sau khi hoàn thành feature, cập nhật steering nếu có:
- API routes mới → `security-checklist.md`
- Role/permission mới → `ath-business-logic.md`
- Pattern mới → file pattern tương ứng
