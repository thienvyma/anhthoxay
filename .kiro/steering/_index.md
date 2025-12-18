---
inclusion: always
---

# 📚 Steering Files Index - ANH THỢ XÂY

## 🎯 Mục đích
Hướng dẫn AI đọc đúng thứ tự các steering files để vibe code hiệu quả.

## 📖 THỨ TỰ ĐỌC (Quan trọng → Chi tiết)

### 1. LUÔN ĐỌC TRƯỚC
| File | Khi nào | Nội dung |
|------|---------|----------|
| `cursor-rules.md` | Mọi lúc | Rules chính, checklist, KHÔNG BAO GIỜ/LUÔN LÀM |
| `security-checklist.md` | Khi tạo/sửa API | Auth, roles, rate limiting |

### 2. ĐỌC THEO CONTEXT
| File | Khi nào | Trigger |
|------|---------|---------|
| `react-patterns.md` | Code React | Files trong `landing/`, `admin/` |
| `api-patterns.md` | Code API | Files trong `api/` |
| `prisma-patterns.md` | Sửa schema | Files trong `infra/prisma/` |

### 3. THAM KHẢO KHI CẦN
| File | Nội dung |
|------|----------|
| `ath-business-logic.md` | Business logic, công thức tính giá, roles |
| `coding-standards.md` | Standards chi tiết |
| `common-mistakes.md` | Lỗi thường gặp |
| `development-workflow.md` | Quy trình dev |
| `project-rules.md` | Tổng quan dự án |

## 🔑 QUICK REFERENCE

### Roles (theo thứ tự quyền)
```
ADMIN > MANAGER > WORKER > USER
```

### Apps & Ports
```
landing/  → Port 4200 (Public website)
admin/    → Port 4201 (Admin dashboard)
api/      → Port 4202 (Backend API)
```

### Commands thường dùng
```bash
pnpm dev:api          # Start API
pnpm dev:landing      # Start Landing
pnpm dev:admin        # Start Admin
pnpm db:generate      # Generate Prisma
pnpm db:push          # Push schema
```

### ⚠️ Commands kiểm tra code (BẮT BUỘC chạy đủ 3)
```bash
pnpm nx run-many --target=lint --all      # ESLint errors/warnings
pnpm nx run-many --target=typecheck --all # TypeScript errors
pnpm nx run-many --target=test --all      # Unit tests (nếu có)
```
**LƯU Ý:** `pnpm nx run api:test` CHỈ chạy unit tests, KHÔNG kiểm tra lint!

### Import paths
```typescript
import { tokens, API_URL, resolveMediaUrl } from '@app/shared';
// KHÔNG import cross-app!
```

## ⚠️ CRITICAL REMINDERS

1. **Lint + Typecheck**: Phải pass CẢ HAI commands → 0 errors, 0 warnings
2. **Security**: Mọi API endpoint admin/manager PHẢI có auth middleware
3. **Validation**: Mọi input PHẢI validate với Zod
4. **No hardcode**: Dùng constants từ `@app/shared`
5. **No cross-app import**: Dùng shared packages

## 📋 CHECKLIST NHANH

Trước khi code:
- [ ] Đọc `cursor-rules.md`
- [ ] Nếu API → đọc `security-checklist.md`
- [ ] Kiểm tra file/function tương tự đã có chưa

Sau khi code:
- [ ] Chạy lint: `pnpm nx run-many --target=lint --all`
- [ ] Chạy typecheck: `pnpm nx run-many --target=typecheck --all`
- [ ] Nếu API mới → đã thêm auth?
- [ ] Nếu form → đã có rate limiting?

## 🔄 SPEC ↔ STEERING SYNC

**Khi implement từ spec hoặc phát triển feature mới:**

| Thay đổi | Cập nhật file |
|----------|---------------|
| API routes mới | `security-checklist.md` |
| Role/permission mới | `ath-business-logic.md` |
| Pattern mới | File pattern tương ứng |
| Lỗi hay gặp | `common-mistakes.md` |

**SAU KHI HOÀN THÀNH FEATURE → HỎI USER:**
> "Cần cập nhật steering files không? (routes, roles, patterns...)"
