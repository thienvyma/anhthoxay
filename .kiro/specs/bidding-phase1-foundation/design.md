# 🏗️ Bidding Marketplace - Phase 1: Foundation - Technical Design

## 1. Database Schema Changes

### 1.1 Prisma Schema Updates

```prisma
// ============================================
// USER MODEL EXTENSION
// ============================================

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  phone         String?
  avatar        String?
  
  // Role: ADMIN, MANAGER, CONTRACTOR, HOMEOWNER, WORKER, USER
  role          String   @default("USER")
  
  // Contractor specific fields
  companyName         String?
  businessLicense     String?
  taxCode             String?
  verificationStatus  String   @default("PENDING") // PENDING, VERIFIED, REJECTED
  verifiedAt          DateTime?
  verificationNote    String?  // Lý do từ chối (nếu có)
  rating              Float    @default(0)
  totalProjects       Int      @default(0)
  
  // Relations
  contractorProfile   ContractorProfile?
  sessions            Session[]
  blogPosts           BlogPost[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([role])
  @@index([verificationStatus])
}

// ============================================
// CONTRACTOR PROFILE
// ============================================

model ContractorProfile {
  id          String @id @default(cuid())
  userId      String @unique
  user        User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Hồ sơ năng lực
  description     String?   @db.Text  // Giới thiệu
  experience      Int?                 // Số năm kinh nghiệm
  specialties     String?              // JSON: ["Sơn", "Ốp lát", "Điện"]
  serviceAreas    String?              // JSON: ["region-id-1", "region-id-2"]
  portfolioImages String?              // JSON: ["url1", "url2"]
  certificates    String?              // JSON: [{name, imageUrl, issuedDate}]
  
  // Documents for verification
  idCardFront         String?
  idCardBack          String?
  businessLicenseImage String?
  
  // Submission tracking
  submittedAt     DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================
// REGION (KHU VỰC)
// ============================================

model Region {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  parentId  String?
  parent    Region?  @relation("RegionHierarchy", fields: [parentId], references: [id])
  children  Region[] @relation("RegionHierarchy")
  
  level     Int      @default(1)  // 1: Tỉnh/TP, 2: Quận/Huyện, 3: Phường/Xã
  isActive  Boolean  @default(true)
  order     Int      @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([parentId])
  @@index([isActive])
  @@index([level])
}

// ============================================
// BIDDING SETTINGS (Singleton)
// ============================================

model BiddingSettings {
  id                  String   @id @default("default")
  
  // Bidding config
  maxBidsPerProject   Int      @default(20)
  defaultBidDuration  Int      @default(7)
  minBidDuration      Int      @default(3)
  maxBidDuration      Int      @default(30)
  
  // Escrow config
  escrowPercentage    Float    @default(10)
  escrowMinAmount     Float    @default(1000000)
  escrowMaxAmount     Float?
  
  // Fees config
  verificationFee     Float    @default(500000)
  winFeePercentage    Float    @default(5)
  
  // Auto-approval
  autoApproveHomeowner Boolean @default(true)
  autoApproveProject   Boolean @default(false)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

// ============================================
// SERVICE FEE
// ============================================

model ServiceFee {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  type        String   // FIXED, PERCENTAGE
  value       Float
  description String?
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([code])
  @@index([isActive])
}
```

---

## 2. API Design

### 2.1 Auth Extension

```
POST /api/auth/register
Body: {
  email: string,
  password: string,
  name: string,
  accountType: "user" | "homeowner" | "contractor"  // NEW
}

Response:
- accountType = "homeowner" → role = HOMEOWNER, auto-approved
- accountType = "contractor" → role = CONTRACTOR, verificationStatus = PENDING
- accountType = "user" (default) → role = USER
```

### 2.2 Contractor Profile API

```
# Get own profile
GET /api/contractor/profile
Auth: CONTRACTOR
Response: ContractorProfile with User info

# Create/Update profile
PUT /api/contractor/profile
Auth: CONTRACTOR
Body: {
  description?: string,
  experience?: number,
  specialties?: string[],
  serviceAreas?: string[],  // Region IDs
  portfolioImages?: string[],
  certificates?: Array<{name, imageUrl, issuedDate}>,
  idCardFront?: string,
  idCardBack?: string,
  businessLicenseImage?: string
}

# Submit for verification
POST /api/contractor/submit-verification
Auth: CONTRACTOR (verificationStatus = PENDING or REJECTED)
Response: { success: true, message: "Hồ sơ đã được gửi xét duyệt" }
```

### 2.3 Admin Contractor Management

```
# List pending contractors
GET /api/admin/contractors?status=PENDING&page=1&limit=20
Auth: ADMIN
Response: Paginated list of contractors with profiles

# Get contractor detail
GET /api/admin/contractors/:id
Auth: ADMIN
Response: Full contractor info with profile

# Verify contractor
PUT /api/admin/contractors/:id/verify
Auth: ADMIN
Body: {
  status: "VERIFIED" | "REJECTED",
  note?: string  // Lý do từ chối
}
Response: Updated contractor
```

### 2.4 Region API

```
# Public - Get regions tree
GET /api/regions?flat=false
Response: Tree structure of active regions

# Public - Get regions flat
GET /api/regions?flat=true&parentId=xxx
Response: Flat list with parentId filter

# Admin CRUD
POST /api/admin/regions
PUT /api/admin/regions/:id
DELETE /api/admin/regions/:id
Auth: ADMIN
```

### 2.5 Bidding Settings API

```
# Public - Get public settings
GET /api/settings/bidding
Response: {
  maxBidsPerProject,
  defaultBidDuration,
  minBidDuration,
  maxBidDuration,
  escrowPercentage,
  escrowMinAmount
}

# Admin - Get full settings
GET /api/admin/settings/bidding
Auth: ADMIN
Response: Full BiddingSettings

# Admin - Update settings
PUT /api/admin/settings/bidding
Auth: ADMIN
Body: Partial<BiddingSettings>
```

### 2.6 Service Fee API

```
# Public - List active fees
GET /api/service-fees
Response: List of active service fees

# Admin CRUD
POST /api/admin/service-fees
PUT /api/admin/service-fees/:id
DELETE /api/admin/service-fees/:id
Auth: ADMIN
```

---

## 3. File Structure

```
api/src/
├── schemas/
│   ├── contractor.schema.ts    # NEW
│   ├── region.schema.ts        # NEW
│   └── bidding-settings.schema.ts  # NEW
├── services/
│   ├── contractor.service.ts   # NEW
│   ├── region.service.ts       # NEW
│   └── bidding-settings.service.ts  # NEW
├── routes/
│   ├── contractor.routes.ts    # NEW
│   ├── region.routes.ts        # NEW
│   └── bidding-settings.routes.ts  # NEW

admin/src/app/
├── pages/
│   ├── ContractorsPage.tsx     # NEW - Quản lý nhà thầu
│   ├── RegionsPage.tsx         # NEW - Quản lý khu vực
│   └── SettingsPage/
│       └── BiddingTab.tsx      # NEW - Tab cấu hình bidding
```

---

## 4. Role Hierarchy Update

```typescript
// api/src/middleware/auth.middleware.ts

const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 6,
  MANAGER: 5,
  CONTRACTOR: 4,  // NEW
  HOMEOWNER: 3,   // NEW
  WORKER: 2,
  USER: 1,
};

export type Role = 'ADMIN' | 'MANAGER' | 'CONTRACTOR' | 'HOMEOWNER' | 'WORKER' | 'USER';
```

---

## 5. Seed Data

### 5.1 Regions (TP.HCM)

```typescript
const hcmRegions = [
  { name: 'TP. Hồ Chí Minh', slug: 'ho-chi-minh', level: 1 },
  // Quận nội thành
  { name: 'Quận 1', slug: 'quan-1', parentSlug: 'ho-chi-minh', level: 2 },
  { name: 'Quận 3', slug: 'quan-3', parentSlug: 'ho-chi-minh', level: 2 },
  { name: 'Quận 7', slug: 'quan-7', parentSlug: 'ho-chi-minh', level: 2 },
  { name: 'Quận Bình Thạnh', slug: 'binh-thanh', parentSlug: 'ho-chi-minh', level: 2 },
  { name: 'Quận Gò Vấp', slug: 'go-vap', parentSlug: 'ho-chi-minh', level: 2 },
  { name: 'Quận Tân Bình', slug: 'tan-binh', parentSlug: 'ho-chi-minh', level: 2 },
  { name: 'Quận Phú Nhuận', slug: 'phu-nhuan', parentSlug: 'ho-chi-minh', level: 2 },
  { name: 'TP. Thủ Đức', slug: 'thu-duc', parentSlug: 'ho-chi-minh', level: 2 },
  // ... thêm các quận khác
];
```

### 5.2 Default Service Fees

```typescript
const defaultFees = [
  {
    name: 'Phí xác minh nhà thầu',
    code: 'VERIFICATION_FEE',
    type: 'FIXED',
    value: 500000,
    description: 'Phí một lần khi xác minh tài khoản nhà thầu'
  },
  {
    name: 'Phí thắng thầu',
    code: 'WIN_FEE',
    type: 'PERCENTAGE',
    value: 5,
    description: 'Phí tính trên giá trị hợp đồng khi thắng thầu'
  },
  {
    name: 'Phí nổi bật',
    code: 'FEATURED_FEE',
    type: 'FIXED',
    value: 200000,
    description: 'Phí hiển thị nổi bật trên trang chủ (theo tháng)'
  }
];
```

---

## 6. Admin UI Components

### 6.1 ContractorsPage

```
┌─────────────────────────────────────────────────────────────────┐
│  Quản lý Nhà thầu                                               │
├─────────────────────────────────────────────────────────────────┤
│  [Tabs: Chờ duyệt (5) | Đã xác minh | Bị từ chối]              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [Avatar] Công ty ABC                                     │    │
│  │          📧 abc@email.com | 📱 0901234567               │    │
│  │          📅 Đăng ký: 19/12/2024                         │    │
│  │          [Xem hồ sơ] [✓ Duyệt] [✗ Từ chối]             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 RegionsPage

```
┌─────────────────────────────────────────────────────────────────┐
│  Quản lý Khu vực                          [+ Thêm khu vực]      │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Tìm kiếm...                                                 │
│                                                                  │
│  ▼ TP. Hồ Chí Minh                                    [ON] [⋮] │
│    ├─ Quận 1                                          [ON] [⋮] │
│    ├─ Quận 3                                          [ON] [⋮] │
│    ├─ Quận 7                                          [ON] [⋮] │
│    ├─ Quận Bình Thạnh                                 [ON] [⋮] │
│    └─ ...                                                       │
│  ▶ Hà Nội                                             [OFF][⋮] │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 BiddingTab (in SettingsPage)

```
┌─────────────────────────────────────────────────────────────────┐
│  Cấu hình Đấu giá                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📋 CẤU HÌNH BIDDING                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Số bid tối đa/công trình:  [20    ]                     │    │
│  │ Thời gian bid mặc định:    [7     ] ngày                │    │
│  │ Thời gian bid tối thiểu:   [3     ] ngày                │    │
│  │ Thời gian bid tối đa:      [30    ] ngày                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  💰 CẤU HÌNH ESCROW                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Phần trăm đặt cọc:         [10    ] %                   │    │
│  │ Số tiền tối thiểu:         [1,000,000] VNĐ              │    │
│  │ Số tiền tối đa:            [________] VNĐ (để trống = ∞)│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ⚙️ TỰ ĐỘNG DUYỆT                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [✓] Tự động duyệt Chủ nhà                               │    │
│  │ [ ] Tự động duyệt Công trình                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                                              [Lưu thay đổi]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Migration Strategy

1. **Step 1**: Add new columns to User table (nullable)
2. **Step 2**: Create new tables (ContractorProfile, Region, BiddingSettings, ServiceFee)
3. **Step 3**: Run seed script for regions and default settings
4. **Step 4**: Update auth middleware with new roles
5. **Step 5**: Deploy API changes
6. **Step 6**: Deploy Admin UI changes

---

## 8. Testing Strategy

### Unit Tests
- ContractorService: CRUD operations, verification flow
- RegionService: Tree building, CRUD
- BiddingSettingsService: Get/Update singleton

### Integration Tests
- Registration flow with accountType
- Contractor verification workflow
- Region hierarchy queries

### E2E Tests
- Admin approves contractor
- Contractor creates profile and submits
- Region management in Admin UI
