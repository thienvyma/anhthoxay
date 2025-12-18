# 🏗️ ANH THỢ XÂY - Construction Bidding Marketplace

## 📋 Tổng quan ý tưởng

Nền tảng kết nối **Chủ nhà (Homeowner)** với **Nhà thầu (Contractor)** thông qua hệ thống đấu giá có xét duyệt, với **Admin** là trung gian đảm bảo an toàn và minh bạch.

---

## 👥 Phân loại người dùng

### 1. Chủ nhà (HOMEOWNER)
- Đăng ký tài khoản với thông tin cá nhân
- Đăng công trình cần thi công
- Xem danh sách nhà thầu apply (ẩn danh)
- Chọn nhà thầu phù hợp
- Đánh giá sau khi hoàn thành

### 2. Nhà thầu (CONTRACTOR)
- Đăng ký tài khoản + Xác minh hồ sơ năng lực
- Duyệt danh sách công trình đang mở
- Apply/Đấu giá vào công trình
- Đính kèm hồ sơ, bằng chứng thi công
- Nhận thông tin chủ nhà khi được chọn

### 3. Admin/Manager
- Xét duyệt tài khoản nhà thầu
- Xét duyệt công trình đăng
- Xét duyệt bid của nhà thầu
- Quản lý escrow/đặt cọc
- Mở thông tin liên hệ cho đôi bên

---

## 🔄 Flow chính

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONSTRUCTION BIDDING FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  HOMEOWNER              ADMIN                      CONTRACTOR                │
│  ──────────             ─────                      ──────────                │
│                                                                              │
│  1. Đăng ký ───────────► Duyệt (auto/manual)                                │
│                                                                              │
│                                                    2. Đăng ký + Hồ sơ       │
│                         ◄─────────────────────────────────────────          │
│                         Xét duyệt hồ sơ năng lực                            │
│                         (CMND, Portfolio, Giấy phép...)                     │
│                                                                              │
│  3. Đăng công trình ───► Duyệt công trình                                   │
│     (ẩn thông tin)       (kiểm tra hợp lệ)                                  │
│                                                                              │
│                          Công bố lên sàn ─────────► 4. Xem & Apply          │
│                          (Landing page)              (đính kèm hồ sơ,       │
│                                                       báo giá, timeline)    │
│                                                                              │
│                         ◄──────────────────────────  Gửi bid                │
│                         Xét duyệt bid                                        │
│                         (kiểm tra hồ sơ đính kèm)                           │
│                                                                              │
│  5. Xem danh sách ◄───── Chuyển bid đã duyệt                                │
│     bid (ẩn danh)        cho chủ nhà                                        │
│     - Giá đề xuất                                                            │
│     - Rating nhà thầu                                                        │
│     - Số dự án đã làm                                                        │
│     - Timeline đề xuất                                                       │
│                                                                              │
│  6. Chọn nhà thầu ──────► Xác nhận match                                    │
│     (dù giá không thấp    Thu phí từ nhà thầu                               │
│      nhất vẫn được)       Giữ escrow (nếu có)                               │
│                                                                              │
│  7. Nhận thông tin ◄─────► Mở thông tin ──────────► Nhận thông tin          │
│     nhà thầu              cho đôi bên               chủ nhà                 │
│                                                                              │
│  ═══════════════════════ THI CÔNG ═══════════════════════════════           │
│                                                                              │
│  8. Xác nhận hoàn thành ─► Giải phóng escrow ─────► Nhận tiền               │
│                                                                              │
│  9. Đánh giá ────────────► Lưu review ────────────► Nhận review             │
│     nhà thầu                                        (hiển thị trên profile) │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

## 🔐 Bảo mật thông tin

### Trước khi match
| Thông tin | Chủ nhà thấy | Nhà thầu thấy |
|-----------|--------------|---------------|
| Tên thật | ❌ | ❌ |
| SĐT | ❌ | ❌ |
| Email | ❌ | ❌ |
| Địa chỉ cụ thể | N/A | ❌ |
| Khu vực (Quận/Huyện) | N/A | ✅ |
| Loại công trình | N/A | ✅ |
| Diện tích | N/A | ✅ |
| Mô tả yêu cầu | N/A | ✅ |
| Giá đề xuất | ✅ | N/A |
| Rating | ✅ | N/A |
| Số dự án đã làm | ✅ | N/A |
| Mã định danh | ✅ (Nhà thầu A, B, C) | ✅ (Công trình #123) |

### Sau khi match + Admin duyệt
- ✅ Mở toàn bộ thông tin liên hệ cho cả 2 bên
- ✅ Tạo kênh chat/message trong hệ thống (optional)

---

## 💰 Mô hình kinh doanh

### Phí dịch vụ (Thu từ Nhà thầu)
```
┌─────────────────────────────────────────────────────────────┐
│  Loại phí              │  Mức phí           │  Khi nào thu  │
├────────────────────────┼────────────────────┼───────────────┤
│  Phí đăng ký           │  Miễn phí          │  Đăng ký      │
│  Phí xác minh hồ sơ    │  X VNĐ (tuỳ chỉnh) │  Xác minh     │
│  Phí thắng thầu        │  Y% giá trị HĐ     │  Khi match    │
│  Phí nổi bật (optional)│  Z VNĐ/tháng       │  Subscription │
└─────────────────────────────────────────────────────────────┘
```

### Escrow/Đặt cọc
```
┌─────────────────────────────────────────────────────────────┐
│  Giai đoạn             │  Trạng thái tiền                   │
├────────────────────────┼────────────────────────────────────┤
│  Chủ nhà chọn thầu     │  Chủ nhà đặt cọc X% → Admin giữ   │
│  Thi công              │  Tiền vẫn ở Admin                  │
│  Hoàn thành 50%        │  Giải phóng 50% cọc → Nhà thầu    │
│  Hoàn thành 100%       │  Giải phóng 50% còn lại           │
│  Tranh chấp            │  Admin xử lý, hoàn tiền nếu cần   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Cấu trúc Apps

### Đề xuất: Tách Portal riêng
```
landing/     → Trang công khai (sàn giao dịch, showcase)
             - Danh sách công trình đang đấu giá
             - Danh sách nhà thầu nổi bật
             - Thống kê (số công trình, nhà thầu, dự án...)
             
admin/       → Admin dashboard (quản lý, xét duyệt)
             - Duyệt tài khoản nhà thầu
             - Duyệt công trình
             - Duyệt bid
             - Quản lý escrow
             - Cấu hình khu vực, loại công trình, phí...
             
portal/      → User portal (Homeowner & Contractor)
             ├── /auth/* → Đăng nhập/Đăng ký
             ├── /homeowner/* → Dashboard chủ nhà
             │   ├── /projects → Công trình của tôi
             │   ├── /projects/new → Đăng công trình mới
             │   ├── /projects/:id/bids → Xem bid
             │   └── /profile → Thông tin cá nhân
             │
             └── /contractor/* → Dashboard nhà thầu
                 ├── /marketplace → Sàn công trình
                 ├── /my-bids → Bid của tôi
                 ├── /profile → Hồ sơ năng lực
                 └── /verification → Xác minh tài khoản
```


---

## 🗄️ Data Models (Prisma Schema)

### User mở rộng
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  phone         String?
  avatar        String?
  role          String   @default("USER") // ADMIN, MANAGER, HOMEOWNER, CONTRACTOR
  
  // Contractor specific
  companyName       String?
  businessLicense   String?   // Giấy phép kinh doanh
  taxCode           String?   // Mã số thuế
  verificationStatus String   @default("PENDING") // PENDING, VERIFIED, REJECTED
  verifiedAt        DateTime?
  rating            Float     @default(0)
  totalProjects     Int       @default(0)
  
  // Relations
  projects          Project[]        @relation("ProjectOwner")
  bids              Bid[]
  contractorProfile ContractorProfile?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ContractorProfile {
  id          String @id @default(cuid())
  userId      String @unique
  user        User   @relation(fields: [userId], references: [id])
  
  // Hồ sơ năng lực
  description     String?   // Giới thiệu
  experience      Int?      // Số năm kinh nghiệm
  specialties     String?   // JSON: ["Sơn", "Ốp lát", "Điện"]
  serviceAreas    String?   // JSON: ["Q1", "Q7", "Bình Thạnh"]
  portfolioImages String?   // JSON: ["url1", "url2"]
  certificates    String?   // JSON: [{name, imageUrl, issuedDate}]
  
  // Documents
  idCardFront     String?
  idCardBack      String?
  businessLicense String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Project (Công trình)
```prisma
model Project {
  id          String   @id @default(cuid())
  code        String   @unique // AUTO: PRJ-2024-001
  
  // Owner
  ownerId     String
  owner       User     @relation("ProjectOwner", fields: [ownerId], references: [id])
  
  // Basic info
  title       String
  description String
  categoryId  String   // Loại công trình (từ ServiceCategory)
  category    ServiceCategory @relation(fields: [categoryId], references: [id])
  
  // Location (ẩn địa chỉ cụ thể)
  regionId    String   // Khu vực (từ Region)
  region      Region   @relation(fields: [regionId], references: [id])
  address     String   // Địa chỉ cụ thể (chỉ hiện sau match)
  
  // Details
  area        Float?   // Diện tích (m²)
  budget      Float?   // Ngân sách dự kiến
  timeline    String?  // Timeline mong muốn
  images      String?  // JSON: ["url1", "url2"]
  
  // Status
  status      String   @default("DRAFT") 
  // DRAFT, PENDING_APPROVAL, OPEN, BIDDING_CLOSED, MATCHED, IN_PROGRESS, COMPLETED, CANCELLED
  
  // Bidding
  bidDeadline DateTime?
  minBid      Float?
  maxBid      Float?
  
  // Match
  selectedBidId   String?   @unique
  selectedBid     Bid?      @relation("SelectedBid", fields: [selectedBidId], references: [id])
  matchedAt       DateTime?
  
  // Relations
  bids        Bid[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?
  
  @@index([status])
  @@index([regionId])
  @@index([categoryId])
}
```

### Bid (Đấu giá)
```prisma
model Bid {
  id          String   @id @default(cuid())
  code        String   @unique // AUTO: BID-2024-001
  
  // Relations
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  contractorId String
  contractor  User     @relation(fields: [contractorId], references: [id])
  
  // Bid details
  price       Float    // Giá đề xuất
  timeline    String   // Timeline đề xuất
  proposal    String   // Mô tả đề xuất
  attachments String?  // JSON: [{name, url, type}]
  
  // Status
  status      String   @default("PENDING")
  // PENDING, APPROVED, REJECTED, SELECTED, NOT_SELECTED
  
  // Admin review
  reviewedBy  String?
  reviewedAt  DateTime?
  reviewNote  String?
  
  // Selected
  selectedProject Project? @relation("SelectedBid")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([projectId, contractorId]) // 1 contractor chỉ bid 1 lần/project
  @@index([projectId])
  @@index([contractorId])
  @@index([status])
}
```


### Region (Khu vực - Admin quản lý)
```prisma
model Region {
  id        String   @id @default(cuid())
  name      String   // "Quận 1", "Quận 7", "Bình Thạnh"
  slug      String   @unique
  parentId  String?  // Cho phép phân cấp (Tỉnh > Quận > Phường)
  parent    Region?  @relation("RegionHierarchy", fields: [parentId], references: [id])
  children  Region[] @relation("RegionHierarchy")
  isActive  Boolean  @default(true)
  order     Int      @default(0)
  
  projects  Project[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Escrow (Đặt cọc)
```prisma
model Escrow {
  id          String   @id @default(cuid())
  code        String   @unique // AUTO: ESC-2024-001
  
  projectId   String
  bidId       String
  
  // Amounts
  amount      Float    // Số tiền đặt cọc
  currency    String   @default("VND")
  
  // Status
  status      String   @default("PENDING")
  // PENDING, HELD, PARTIAL_RELEASED, RELEASED, REFUNDED, DISPUTED
  
  // Transactions
  transactions String? // JSON: [{type, amount, date, note}]
  
  // Dispute
  disputeReason String?
  disputeResolvedAt DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### ServiceFee (Phí dịch vụ - Admin cấu hình)
```prisma
model ServiceFee {
  id          String   @id @default(cuid())
  name        String   // "Phí xác minh", "Phí thắng thầu"
  code        String   @unique // VERIFICATION_FEE, WIN_FEE
  type        String   // FIXED, PERCENTAGE
  value       Float    // 500000 hoặc 5 (%)
  description String?
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Review (Đánh giá)
```prisma
model Review {
  id          String   @id @default(cuid())
  
  projectId   String
  reviewerId  String   // Chủ nhà
  contractorId String  // Nhà thầu được đánh giá
  
  rating      Int      // 1-5
  comment     String?
  images      String?  // JSON: ["url1", "url2"]
  
  // Response from contractor
  response    String?
  respondedAt DateTime?
  
  isPublic    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([projectId, reviewerId])
}
```

---

## 🎨 UI Đề xuất

### Landing Page - Sàn giao dịch
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Trang chủ | Công trình | Nhà thầu | Blog | [Đăng nhập] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║  🏗️ SÀN KẾT NỐI THI CÔNG XÂY DỰNG                        ║  │
│  ║  Tìm nhà thầu uy tín - Đấu giá minh bạch                  ║  │
│  ║                                                            ║  │
│  ║  [🏠 Tôi cần thi công]     [👷 Tôi là nhà thầu]           ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│                                                                  │
│  📊 THỐNG KÊ                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 150+     │ │ 80+      │ │ 500+     │ │ 4.8★     │           │
│  │ Công trình│ │ Nhà thầu │ │ Dự án    │ │ Đánh giá │           │
│  │ đang mở  │ │ xác minh │ │ hoàn thành│ │ trung bình│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  🔥 CÔNG TRÌNH ĐANG ĐẤU GIÁ              [Xem tất cả →]        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [Ảnh]  Sơn nhà 3 tầng                    #PRJ-2024-042  │    │
│  │        📍 Q.Bình Thạnh | 📐 120m²                       │    │
│  │        ⏰ Hạn bid: 3 ngày | 👥 5 bid                    │    │
│  │        💰 Giá thấp nhất: 45,000,000 VNĐ                 │    │
│  │        [Xem chi tiết]                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [Ảnh]  Ốp lát phòng tắm                  #PRJ-2024-041  │    │
│  │        📍 Q.7 | 📐 25m²                                 │    │
│  │        ⏰ Hạn bid: 5 ngày | 👥 3 bid                    │    │
│  │        💰 Giá thấp nhất: 12,000,000 VNĐ                 │    │
│  │        [Xem chi tiết]                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ⭐ NHÀ THẦU NỔI BẬT                       [Xem tất cả →]       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │ [Ava]  │ │ [Ava]  │ │ [Ava]  │ │ [Ava]  │                   │
│  │ Thầu A │ │ Thầu B │ │ Thầu C │ │ Thầu D │                   │
│  │ ⭐4.9  │ │ ⭐4.8  │ │ ⭐4.7  │ │ ⭐4.6  │                   │
│  │ 50 jobs│ │ 45 jobs│ │ 40 jobs│ │ 35 jobs│                   │
│  │ ✓Verified│ ✓Verified│ ✓Verified│ ✓Verified                  │
│  └────────┘ └────────┘ └────────┘ └────────┘                   │
│                                                                  │
│  📝 CÁCH THỨC HOẠT ĐỘNG                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │ 1️⃣     │ → │ 2️⃣     │ → │ 3️⃣     │ → │ 4️⃣     │      │
│  │ Đăng    │    │ Nhà thầu│    │ Chọn    │    │ Thi công│      │
│  │ công    │    │ đấu giá │    │ nhà thầu│    │ & đánh  │      │
│  │ trình   │    │         │    │         │    │ giá     │      │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```


### Homeowner Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Dashboard | Công trình | Tin nhắn | [Avatar ▼]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👋 Xin chào, Anh Minh!                                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [+ Đăng công trình mới]                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  📋 CÔNG TRÌNH CỦA TÔI                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ #PRJ-2024-042 | Sơn nhà 3 tầng                          │    │
│  │ 🟢 ĐANG ĐẤU GIÁ | 5 bid | Hạn: 3 ngày                  │    │
│  │ [Xem bid] [Chỉnh sửa] [Đóng]                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ #PRJ-2024-038 | Ốp lát phòng khách                      │    │
│  │ 🔵 ĐÃ CHỌN THẦU | Nhà thầu: *** (đang thi công)        │    │
│  │ [Xem chi tiết] [Liên hệ thầu] [Xác nhận hoàn thành]    │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ #PRJ-2024-025 | Cải tạo nhà tắm                         │    │
│  │ ✅ HOÀN THÀNH | Đã đánh giá: ⭐⭐⭐⭐⭐                  │    │
│  │ [Xem chi tiết]                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Contractor Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Dashboard | Sàn | Bid của tôi | Hồ sơ | [Avatar ▼]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👷 Xin chào, Công ty XYZ!                                      │
│  ✅ Đã xác minh | ⭐ 4.8 (50 đánh giá) | 🏆 45 dự án            │
│                                                                  │
│  📊 THỐNG KÊ THÁNG NÀY                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 12       │ │ 5        │ │ 2        │ │ 15tr     │           │
│  │ Bid gửi  │ │ Đang chờ │ │ Thắng    │ │ Doanh thu│           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  🔥 CÔNG TRÌNH PHÙ HỢP                    [Xem tất cả →]        │
│  (Dựa trên chuyên môn và khu vực của bạn)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ #PRJ-2024-045 | Sơn căn hộ 80m²                         │    │
│  │ 📍 Q.7 | 💰 Budget: 30-40tr | ⏰ Hạn: 5 ngày           │    │
│  │ 👥 3 bid | Giá thấp nhất: 32tr                          │    │
│  │ [Xem chi tiết] [Gửi bid]                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  📝 BID CỦA TÔI                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ #PRJ-2024-042 | Sơn nhà 3 tầng                          │    │
│  │ 💰 Giá bid: 45tr | 🟡 Đang chờ duyệt                   │    │
│  │ [Xem] [Chỉnh sửa] [Rút bid]                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ #PRJ-2024-038 | Ốp lát phòng khách                      │    │
│  │ 💰 Giá bid: 25tr | 🟢 THẮNG - Đang thi công            │    │
│  │ [Xem] [Liên hệ chủ nhà]                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Admin Configuration

### Quản lý trong Admin Panel

1. **Khu vực (Regions)**
   - Thêm/sửa/xóa khu vực
   - Phân cấp: Tỉnh/Thành phố > Quận/Huyện > Phường/Xã
   - Bật/tắt khu vực hoạt động

2. **Loại công trình**
   - Sử dụng ServiceCategory hiện có
   - Thêm mới nếu cần

3. **Phí dịch vụ**
   - Cấu hình các loại phí
   - Phí cố định hoặc %

4. **Xét duyệt**
   - Duyệt tài khoản nhà thầu
   - Duyệt công trình
   - Duyệt bid
   - Xử lý tranh chấp

5. **Escrow**
   - Xem danh sách escrow
   - Giải phóng tiền
   - Hoàn tiền

---

## 📋 Phân chia Specs

Đề xuất chia thành các spec nhỏ để implement từng phần:

### Phase 1: Foundation
1. **user-roles-extension** - Mở rộng User model với HOMEOWNER, CONTRACTOR
2. **contractor-verification** - Hệ thống xác minh nhà thầu
3. **region-management** - Quản lý khu vực trong Admin

### Phase 2: Core Bidding
4. **project-posting** - Chủ nhà đăng công trình
5. **bidding-system** - Nhà thầu apply/đấu giá
6. **bid-approval** - Admin xét duyệt bid

### Phase 3: Matching & Payment
7. **project-matching** - Chủ nhà chọn thầu, mở thông tin
8. **escrow-system** - Hệ thống đặt cọc
9. **service-fees** - Thu phí dịch vụ

### Phase 4: Post-Project
10. **review-system** - Đánh giá sau thi công
11. **contractor-ranking** - Xếp hạng nhà thầu

### Phase 5: Portal UI
12. **portal-app** - Tạo app portal mới
13. **homeowner-dashboard** - UI cho chủ nhà
14. **contractor-dashboard** - UI cho nhà thầu

---

## ✅ Xác nhận từ Product Owner

| Câu hỏi | Trả lời |
|---------|---------|
| Đăng ký Homeowner | **Tự động duyệt** (không cần Admin) |
| Số bid tối đa/công trình | **Admin cấu hình** trong trang admin |
| Thời gian bid mặc định | **Admin cấu hình** trong trang admin |
| Escrow đặt cọc % | **Admin cấu hình** trong trang admin |
| Chat trong hệ thống | **Có** - Real-time messaging |
| Notification | **Có** - Email + SMS |

---

## 🔧 Admin Settings mở rộng

```prisma
model BiddingSettings {
  id                  String   @id @default(cuid())
  
  // Bidding config
  maxBidsPerProject   Int      @default(20)      // Số bid tối đa/công trình
  defaultBidDuration  Int      @default(7)       // Số ngày mặc định
  minBidDuration      Int      @default(3)       // Tối thiểu
  maxBidDuration      Int      @default(30)      // Tối đa
  
  // Escrow config
  escrowPercentage    Float    @default(10)      // % đặt cọc
  escrowMinAmount     Float    @default(1000000) // Tối thiểu 1tr
  escrowMaxAmount     Float?                     // Tối đa (null = không giới hạn)
  
  // Fees config
  verificationFee     Float    @default(500000)  // Phí xác minh nhà thầu
  winFeePercentage    Float    @default(5)       // % phí thắng thầu
  
  // Auto-approval
  autoApproveHomeowner Boolean @default(true)    // Tự động duyệt chủ nhà
  autoApproveProject   Boolean @default(false)   // Tự động duyệt công trình
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

## 💬 Chat System

### Data Model
```prisma
model Conversation {
  id            String   @id @default(cuid())
  projectId     String?  // Liên kết với công trình (optional)
  
  participants  ConversationParticipant[]
  messages      Message[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ConversationParticipant {
  id              String       @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  userId          String
  
  // Tracking
  lastReadAt      DateTime?
  isActive        Boolean      @default(true)
  
  @@unique([conversationId, userId])
}

model Message {
  id              String       @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  senderId        String
  
  content         String
  type            String       @default("TEXT") // TEXT, IMAGE, FILE, SYSTEM
  attachments     String?      // JSON: [{name, url, type, size}]
  
  isRead          Boolean      @default(false)
  readAt          DateTime?
  
  createdAt       DateTime     @default(now())
  
  @@index([conversationId])
  @@index([senderId])
}
```

### Chat Rules
- Chat chỉ mở sau khi **Admin duyệt match**
- Trước đó, đôi bên không thể liên lạc trực tiếp
- Admin có thể xem tất cả conversation (để xử lý tranh chấp)

---

## 📧 Notification System

### Data Model
```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  
  type        String   // BID_RECEIVED, BID_APPROVED, PROJECT_MATCHED, etc.
  title       String
  content     String
  data        String?  // JSON: metadata
  
  // Channels
  channels    String   // JSON: ["EMAIL", "SMS", "PUSH"]
  
  // Status
  isRead      Boolean  @default(false)
  readAt      DateTime?
  
  // Delivery status
  emailSent   Boolean  @default(false)
  emailSentAt DateTime?
  smsSent     Boolean  @default(false)
  smsSentAt   DateTime?
  
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([isRead])
}

model NotificationPreference {
  id          String   @id @default(cuid())
  userId      String   @unique
  
  // Email notifications
  emailEnabled        Boolean @default(true)
  emailBidReceived    Boolean @default(true)
  emailBidApproved    Boolean @default(true)
  emailProjectMatched Boolean @default(true)
  emailNewMessage     Boolean @default(true)
  
  // SMS notifications
  smsEnabled          Boolean @default(true)
  smsBidReceived      Boolean @default(false)
  smsBidApproved      Boolean @default(true)
  smsProjectMatched   Boolean @default(true)
  smsNewMessage       Boolean @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Notification Types
| Type | Trigger | Email | SMS |
|------|---------|-------|-----|
| `BID_RECEIVED` | Nhà thầu gửi bid | ✅ | ⚙️ |
| `BID_APPROVED` | Admin duyệt bid | ✅ | ✅ |
| `BID_REJECTED` | Admin từ chối bid | ✅ | ❌ |
| `PROJECT_MATCHED` | Chủ nhà chọn thầu | ✅ | ✅ |
| `NEW_MESSAGE` | Tin nhắn mới | ✅ | ⚙️ |
| `ESCROW_RELEASED` | Giải phóng tiền cọc | ✅ | ✅ |
| `REVIEW_RECEIVED` | Nhận đánh giá | ✅ | ❌ |

*(⚙️ = tuỳ chọn user)*

---

## 📋 Phân chia Specs (Cập nhật)

### Phase 1: Foundation
1. **user-roles-extension** - Mở rộng User với HOMEOWNER, CONTRACTOR
2. **contractor-verification** - Xác minh nhà thầu
3. **region-management** - Quản lý khu vực
4. **bidding-settings** - Cấu hình bidding trong Admin

### Phase 2: Core Bidding
5. **project-posting** - Đăng công trình
6. **bidding-system** - Đấu giá
7. **bid-approval** - Xét duyệt bid

### Phase 3: Matching & Payment
8. **project-matching** - Chọn thầu, mở thông tin
9. **escrow-system** - Đặt cọc
10. **service-fees** - Thu phí

### Phase 4: Communication
11. **chat-system** - Real-time messaging
12. **notification-system** - Email + SMS notifications

### Phase 5: Post-Project
13. **review-system** - Đánh giá
14. **contractor-ranking** - Xếp hạng

### Phase 6: Portal UI
15. **portal-app** - Tạo app portal
16. **homeowner-dashboard** - UI chủ nhà
17. **contractor-dashboard** - UI nhà thầu

---

*Tài liệu đã được cập nhật với xác nhận từ Product Owner.*
*Sẵn sàng để bắt đầu tạo spec cho Phase 1!*
