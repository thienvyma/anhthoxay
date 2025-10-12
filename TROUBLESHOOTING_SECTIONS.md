# 🔧 Troubleshooting: Không Thể Lưu Section Mới

## ✅ Đã Fix

### 1. **Missing Section Type trong Backend Schema**
**Vấn đề:** Admin có `HERO_SIMPLE` nhưng backend validation schema không có.

**Fix:** Đã thêm `HERO_SIMPLE` vào `api/src/schemas.ts`:
```typescript
export const createSectionSchema = z.object({
  kind: z.enum([
    'HERO', 'HERO_SIMPLE', 'GALLERY', 'FEATURED_MENU', ...
  ]),
  ...
});
```

### 2. **Error Handling Improvements**
**Vấn đề:** Lỗi bị "nuốt" trong catch block, user không biết lỗi gì.

**Fix:** 
- ✅ Thêm alert hiển thị error message cho user
- ✅ Thêm detailed logging trong console
- ✅ Format validation errors rõ ràng hơn
- ✅ Re-throw error để prevent modal đóng khi lỗi

---

## 🔍 Cách Debug Khi Không Lưu Được Section

### Bước 1: Kiểm tra Console
Mở **DevTools** (F12) → Tab **Console**, xem có error gì không:

```
API Error [POST /pages/home/sections]: {
  status: 400,
  error: { error: "Validation failed", details: [...] }
}
```

### Bước 2: Kiểm tra Network Tab
1. Mở **DevTools** → Tab **Network**
2. Click **Create Section**
3. Tìm request `POST /pages/home/sections`
4. Xem **Response** tab để thấy lỗi chi tiết

### Bước 3: Kiểm tra Backend Server
```bash
# Đảm bảo backend đang chạy
cd ai-sales-agents-platform/api
npm run dev

# Kiểm tra port 4202
curl http://localhost:4202/health
```

### Bước 4: Kiểm tra Database
```bash
cd ai-sales-agents-platform/infra
npx prisma studio
```
Xem table `Section` có data không.

---

## 🐛 Common Errors

### Error: "Validation failed"
**Nguyên nhân:** Section type không có trong backend schema hoặc data không đúng format.

**Fix:**
1. Kiểm tra `api/src/schemas.ts` có section type đó không
2. Kiểm tra data structure có đúng với schema không

### Error: "HTTP 401: Unauthorized"
**Nguyên nhân:** Chưa login hoặc session hết hạn.

**Fix:**
1. Logout và login lại
2. Kiểm tra cookie `session_token` trong DevTools → Application → Cookies

### Error: "HTTP 404: Not Found"
**Nguyên nhân:** Page không tồn tại.

**Fix:**
1. Kiểm tra page slug có đúng không (default: `home`)
2. Tạo page mới nếu chưa có:
```bash
curl -X POST http://localhost:4202/pages \
  -H "Content-Type: application/json" \
  -d '{"slug":"home","title":"Home"}'
```

### Error: "Failed to fetch"
**Nguyên nhân:** Backend không chạy hoặc CORS issue.

**Fix:**
1. Start backend: `cd api && npm run dev`
2. Kiểm tra `API_BASE` trong `admin/src/app/api.ts` (phải là `http://localhost:4202`)

---

## 📝 Checklist Trước Khi Tạo Section Mới

- [ ] Backend đang chạy (`http://localhost:4202`)
- [ ] Admin đang chạy (`http://localhost:3001`)
- [ ] Đã login với account ADMIN hoặc MANAGER
- [ ] Page `home` đã tồn tại trong database
- [ ] Console không có error
- [ ] Network tab không có failed requests

---

## 🔄 Reset Nếu Vẫn Lỗi

```bash
# 1. Stop tất cả services
# Ctrl+C trong các terminal

# 2. Clear database và recreate
cd ai-sales-agents-platform/infra
rm -f prisma/dev.db
npx prisma migrate dev

# 3. Seed lại data
npm run seed

# 4. Restart services
cd ../api && npm run dev
cd ../admin && npm run dev
```

---

## 📞 Liên Hệ Support

Nếu vẫn gặp vấn đề, cung cấp:
1. Screenshot console errors
2. Network request/response (từ DevTools)
3. Backend logs
4. Steps to reproduce

---

## 📚 Related Files

- `admin/src/app/api.ts` - API client với error handling
- `admin/src/app/pages/SectionsPage.tsx` - Section management page
- `admin/src/app/components/SectionEditor.tsx` - Section editor modal
- `api/src/schemas.ts` - Validation schemas
- `api/src/main.ts` - API endpoints

