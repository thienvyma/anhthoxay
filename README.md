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
├── api/         → Port 4202 (Hono + Firebase) - Backend API
├── packages/    → Shared libraries (@app/shared, @app/ui)
└── infra/       → Firebase configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Firebase Project (with Firestore, Auth, Storage enabled)

### Installation

```bash
# Install dependencies
pnpm install

# Setup Firebase
# 1. Create a Firebase project at https://console.firebase.google.com
# 2. Enable Firestore, Authentication, and Storage
# 3. Download service account key and save as service-account.json
# 4. Copy env.example to .env and configure Firebase settings

# Seed initial data
pnpm firebase:seed
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
Email: admin@noithatnhanh.vn
Password: Admin@123456
```

## 📦 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Hono (lightweight web framework)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
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

### Bidding System
- **Dự án**: Homeowner đăng dự án cần thi công
- **Đấu thầu**: Contractor gửi báo giá
- **Escrow**: Quản lý thanh toán an toàn
- **Chat**: Giao tiếp real-time

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
# Firebase
pnpm firebase:seed        # Seed initial data to Firestore
pnpm firebase:set-admin   # Set admin custom claims

# Development
pnpm dev:api        # Start API server
pnpm dev:landing    # Start Landing page
pnpm dev:admin      # Start Admin dashboard

# Type checking
pnpm nx run landing:typecheck
pnpm nx run admin:typecheck
pnpm nx run api:typecheck

# Testing
pnpm test:api       # Run API tests
pnpm test:admin     # Run Admin tests
pnpm test:landing   # Run Landing tests

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
│       ├── api/        # API client modules
│       └── auth/       # Firebase Auth context
│
├── landing/            # Landing Page
│   └── src/app/
│       ├── sections/   # Section components
│       ├── pages/      # Page components
│       ├── components/ # Shared components
│       └── api.ts      # API client
│
├── api/                # Backend API (Hono + Firebase)
│   └── src/
│       ├── main.ts           # App entry point
│       ├── routes/firestore/ # Firestore-based routes
│       ├── services/firestore/ # Firestore services
│       ├── middleware/       # Auth, validation, etc.
│       └── types/            # TypeScript types
│
├── packages/
│   ├── shared/         # Design tokens, utilities
│   └── ui/             # Shared UI components
│
├── infra/
│   └── firebase/       # Firebase rules & indexes
│
└── scripts/
    ├── seed-firestore.ts     # Firestore seed script
    └── firebase-set-admin-claims.ts
```

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Firestore Database
4. Enable Authentication (Email/Password)
5. Enable Storage

### 2. Configure Service Account
1. Go to Project Settings > Service Accounts
2. Generate new private key
3. Save as `service-account.json` in project root
4. Set `GOOGLE_APPLICATION_CREDENTIALS` in `.env`

### 3. Deploy Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and deploy
firebase login
firebase deploy --only firestore:rules,storage
```

### 4. Seed Initial Data
```bash
pnpm firebase:seed
```

## 👥 Phân quyền

| Role | Quyền |
|------|-------|
| **ADMIN** | Toàn quyền |
| **MANAGER** | Quản lý blog, leads, media |
| **CONTRACTOR** | Đấu thầu dự án, quản lý hồ sơ |
| **HOMEOWNER** | Đăng dự án, chọn nhà thầu |
| **WORKER** | Xem công việc được giao |
| **USER** | Quyền cơ bản |

## 📝 License

MIT

---

**Built with ❤️ for NỘI THẤT NHANH**
