---
inclusion: always
---

# 📝 Daily Changelog Rule

## ⚠️ BẮT BUỘC SAU MỖI TASK

Sau khi hoàn thành mỗi task, **PHẢI** cập nhật file `docs/DAILY_CHANGELOG.md` với danh sách các file đã tạo mới hoặc chỉnh sửa.

## 📋 QUY TẮC

1. **Mỗi ngày một section** - Format: `## YYYY-MM-DD`
2. **Nếu cùng ngày** - Chỉ bổ sung vào section hiện có, không tạo section mới
3. **Nếu ngày mới** - Tạo section mới ở đầu file (ngày mới nhất ở trên)
4. **Phân loại file** theo:
   - 🆕 **Created** - File mới tạo
   - ✏️ **Modified** - File đã chỉnh sửa
5. **Ghi rõ task name** để dễ trace

## 📄 FORMAT MẪU

```markdown
## 2024-12-19

### Task: [Tên task ngắn gọn]
**🆕 Created:**
- `path/to/new/file.ts` - Mô tả ngắn

**✏️ Modified:**
- `path/to/existing/file.ts` - Thay đổi gì
```

## 🔗 FILE LOCATION

`docs/DAILY_CHANGELOG.md`
