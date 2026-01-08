# 🏠 NỘI THẤT NHANH - WebApp MVP

WebApp cho doanh nghiệp thiết kế nội thất với tính năng báo giá & dự toán tự động.

## 🎯 Mục tiêu

1. **Khách hàng**: Nhận dự toán nhanh hoặc đăng ký tư vấn trực tiếp
2. **Chủ doanh nghiệp**: Toàn quyền kiểm soát đơn giá, vật dụng, hạng mục, hệ số - không cần code
3. **Sẵn sàng**: Automation AI + Google Sheet + SEO trong tương lai

## 🏗️ Kiến trúc Monorepo (Nx)

```
├── landing/     → Port 4200 (React + Vite) - Website khách hàng
├── admin/       → Port 4201 (React + Vite) - Dashboard quản trị  
├── api/         → Port 4202 (Hono + Prisma) - Backend API
├── packages/    → Shared libraries (@app/shared, @app/ui)
└── infra/       → Prisma schema + Database
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Setup database
pnpm db:generate
pnpm db:push
pnpm db:seed
```

### Development

```bash
# Start all services
pnpm dev:api      # API Server (http://localhost:4202)
pnpm dev:landing  # Landing Page (http://localhost:4200)
pnpm dev:admin    # Admin Dashboard (http://localhost:4201)
```

### Default Admin Login
```
Email: admin@example.com
Password: admin123
```

## 📦 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Hono (lightweight web framework)
- **Database**: SQLite + Prisma ORM
- **Monorepo**: Nx
- **Styling**: CSS-in-JS với design tokens

## ✨ Tính năng chính

### Landing Page
- **Trang chủ**: Hero, giới thiệu dịch vụ
- **Báo giá & Dự toán**: Chọn hạng mục → Nhập diện tích → Chọn vật dụng → Xem dự toán
- **Blog**: Bài viết SEO
- **Form đăng ký tư vấn**: Thu thập lead

### Admin Panel
- **Dashboard**: Thống kê tổng quan
- **Cấu hình báo giá**: Đơn giá, Vật dụng, Công thức, Hạng mục
- **Quản lý Lead**: Theo dõi khách hàng đăng ký
- **Blog Manager**: Tạo/sửa bài viết
- **Media Library**: Quản lý hình ảnh
- **Settings**: Cấu hình hệ thống, CTA, Promo popup

## 📐 Công thức tính báo giá

```
TỔNG = (Kết quả công thức × Hệ số hạng mục) + Tổng giá vật dụng

Ví dụ:
- Hạng mục: Sơn tường (hệ số 1.2)
- Diện tích: 50 m²
- Đơn giá sơn: 80,000 VNĐ/m²
- Vật dụng: Sơn Dulux (500,000 VNĐ)

Công thức: (50 × 80,000 × 1.2) + 500,000 = 5,300,000 VNĐ
```

## 🔧 Scripts

```bash
# Database
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
pnpm db:seed        # Seed sample data

# Development
pnpm dev:api        # Start API server
pnpm dev:landing    # Start Landing page
pnpm dev:admin      # Start Admin dashboard

# Type checking
pnpm nx run landing:typecheck
pnpm nx run admin:typecheck
pnpm nx run api:typecheck

# Build
pnpm nx run-many --target=build --all
```

## 📁 Project Structure

```
anh-tho-xay/
├── admin/              # Admin Dashboard
│   └── src/app/
│       ├── components/ # UI components
│       ├── pages/      # Page components
│       ├── api.ts      # API client
│       └── types.ts    # TypeScript types
│
├── landing/            # Landing Page
│   └── src/app/
│       ├── sections/   # Section components
│       ├── pages/      # Page components
│       ├── components/ # Shared components
│       └── api.ts      # API client
│
├── api/                # Backend API (Hono)
│   └── src/
│       ├── main.ts     # Routes & handlers
│       ├── schemas.ts  # Zod validation
│       └── middleware.ts
│
├── packages/
│   ├── shared/         # Design tokens, utilities
│   └── ui/             # Shared UI components
│
└── infra/
    └── prisma/
        ├── schema.prisma  # Database schema
        └── seed.ts        # Seed data
```

## 👥 Phân quyền

| Role | Quyền |
|------|-------|
| **ADMIN** | Toàn quyền |
| **QUẢN LÝ** | Xem/quản lý khách hàng, blog. Đề xuất sửa đơn giá/vật dụng (cần Admin duyệt) |

## 📝 License

MIT

---

**Built with ❤️ for NỘI THẤT NHANH**
