# 🎛️ Admin Dashboard - NỘI THẤT NHANH

Dashboard quản trị cho hệ thống báo giá & dự toán thiết kế nội thất.

## 🚀 Quick Start

```bash
# Start Admin Dashboard
pnpm dev:admin
# http://localhost:4201

# Đảm bảo API đang chạy
pnpm dev:api
# http://localhost:4202
```

### Login
```
Email: admin@example.com
Password: admin123
```

## ✨ Tính năng

### 📊 Dashboard
- Thống kê tổng quan (leads, blog posts, materials)
- Quick actions

### 💰 Cấu hình Báo giá (Pricing Config)
- **Đơn giá**: Quản lý giá nhân công, vật liệu với TAG cho công thức
- **Vật dụng**: Quản lý vật dụng với hình ảnh, giá, thể loại
- **Công thức**: Tạo công thức tính toán (VD: `DIEN_TICH * CONG_SON`)
- **Hạng mục**: Quản lý hạng mục thi công với hệ số

### 👥 Quản lý Lead
- Xem danh sách khách hàng đăng ký
- Lọc theo trạng thái (Mới, Đang liên hệ, Đã chốt, Hủy)
- Xem chi tiết dự toán của khách

### 📝 Blog Manager
- Tạo/sửa/xóa bài viết
- Quản lý danh mục blog
- SEO-ready với slug, meta description

### 🖼️ Media Library
- Upload hình ảnh
- Copy URL để sử dụng
- Xóa media không dùng

### ⚙️ Settings
- **Layout**: Header/Footer configuration
- **Company**: Thông tin công ty, CTA nổi (Messenger, Zalo, Phone)
- **Promo**: Popup quảng cáo cho Landing page

## 📁 Cấu trúc

```
admin/src/app/
├── components/       # UI components
│   ├── Layout.tsx
│   ├── Card.tsx
│   ├── Button.tsx
│   ├── Toast.tsx
│   └── SectionEditor/
├── pages/
│   ├── DashboardPage.tsx
│   ├── PricingConfigPage/   # Đơn giá, Vật dụng, Công thức, Hạng mục
│   ├── LeadsPage.tsx
│   ├── BlogManagerPage/
│   ├── MediaPage.tsx
│   └── SettingsPage/
├── api.ts            # API client
└── types.ts          # TypeScript types
```

## 👥 Phân quyền

| Trang | ADMIN | QUẢN LÝ |
|-------|-------|---------|
| Dashboard | ✅ | ✅ |
| Pricing Config | ✅ | ❌ |
| Leads | ✅ | ✅ |
| Blog Manager | ✅ | ✅ |
| Media | ✅ | ✅ |
| Settings | ✅ | ❌ |

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite
- @app/shared (design tokens)
- @app/ui (shared components)

---

**Built for NỘI THẤT NHANH**
