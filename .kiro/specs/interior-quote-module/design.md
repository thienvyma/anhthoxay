# Design Document - Interior Quote Module

## Overview

Interior Quote Module là một tính năng mới cho phép khách hàng tính toán chi phí nội thất cho căn hộ chung cư. Module bao gồm:

1. **Admin Section**: Các trang quản lý trong admin panel để cấu hình dữ liệu
2. **Landing Page**: Trang `/noi-that` với UI dạng mini-app, wizard 7 bước
3. **API Layer**: REST endpoints cho CRUD operations và quote calculation
4. **Database**: 12 models mới trong Prisma schema

Module này tích hợp với hệ thống hiện có, sử dụng chung design tokens, components, và patterns.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LANDING PAGE                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              InteriorQuotePage (/noi-that)                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │   │
│  │  │ Step 1  │→│ Step 2  │→│ Step 3  │→│ Step 4  │→...        │   │
│  │  │Developer│ │Developmt│ │Building │ │  Unit   │            │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ interior.routes  │  │interior.service  │  │interior.schema   │  │
│  │ (Public + Admin) │  │ (Business Logic) │  │ (Zod Validation) │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE (Prisma)                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │ Developer  │ │Development │ │  Building  │ │BuildingUnit│       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │ UnitLayout │ │  Package   │ │ Surcharge  │ │   Quote    │       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```


## Components and Interfaces

### Admin Pages Structure

```
admin/src/app/pages/
├── InteriorPage/                    # Main interior management page
│   ├── index.tsx                    # Tab container
│   ├── DevelopersTab.tsx            # Chủ đầu tư management
│   ├── DevelopmentsTab.tsx          # Dự án management
│   ├── BuildingsTab.tsx             # Tòa nhà management
│   ├── BuildingUnitsTab.tsx         # Căn hộ theo trục
│   ├── LayoutsTab.tsx               # Bản vẽ layout
│   ├── PackagesTab.tsx              # Gói nội thất
│   ├── FurnitureCatalogTab.tsx      # Catalog đồ nội thất
│   ├── SurchargesTab.tsx            # Phụ phí
│   ├── QuoteSettingsTab.tsx         # Cấu hình báo giá
│   ├── RoomTypesTab.tsx             # Loại phòng
│   └── QuotesTab.tsx                # Lịch sử báo giá
│
├── InteriorPage/modals/             # Modal components
│   ├── DeveloperModal.tsx
│   ├── DevelopmentModal.tsx
│   ├── BuildingModal.tsx
│   ├── BuildingUnitModal.tsx
│   ├── LayoutModal.tsx
│   ├── PackageModal.tsx
│   ├── PackageItemsModal.tsx
│   ├── FurnitureCategoryModal.tsx
│   ├── FurnitureItemModal.tsx
│   ├── SurchargeModal.tsx
│   ├── RoomTypeModal.tsx
│   └── QuoteDetailModal.tsx
```

### Landing Page Structure

```
landing/src/app/
├── pages/
│   └── InteriorQuotePage.tsx        # Main page component
│
├── sections/
│   └── InteriorQuoteSection/        # Section component (for CMS)
│       ├── index.tsx                # Main section wrapper
│       ├── InteriorWizard.tsx       # Wizard container
│       ├── steps/
│       │   ├── DeveloperStep.tsx    # Step 1: Chọn chủ đầu tư
│       │   ├── DevelopmentStep.tsx  # Step 2: Chọn dự án
│       │   ├── BuildingStep.tsx     # Step 3: Chọn tòa nhà
│       │   ├── UnitStep.tsx         # Step 4: Chọn căn hộ
│       │   ├── LayoutStep.tsx       # Step 5: Preview layout
│       │   ├── PackageStep.tsx      # Step 6: Chọn gói nội thất
│       │   └── ResultStep.tsx       # Step 7: Kết quả báo giá
│       ├── components/
│       │   ├── StepIndicator.tsx    # Progress indicator
│       │   ├── SelectionCard.tsx    # Reusable selection card
│       │   ├── UnitCodeInput.tsx    # Unit code input with validation
│       │   ├── FloorAxisSelector.tsx # Floor + Axis dropdowns
│       │   ├── LayoutPreview.tsx    # Layout image + room breakdown
│       │   ├── PackageCard.tsx      # Package selection card
│       │   ├── PackageComparison.tsx # Side-by-side comparison
│       │   ├── QuoteBreakdown.tsx   # Price breakdown display
│       │   └── SaveQuoteForm.tsx    # Customer info form
│       └── hooks/
│           ├── useInteriorWizard.ts # Wizard state management
│           └── useQuoteCalculation.ts # Quote calculation logic
```


### API Routes Structure

```
api/src/
├── routes/
│   └── interior.routes.ts           # All interior endpoints
│
├── services/
│   └── interior/
│       ├── index.ts                 # Re-exports
│       ├── developer.service.ts     # Developer CRUD
│       ├── development.service.ts   # Development CRUD
│       ├── building.service.ts      # Building CRUD
│       ├── building-unit.service.ts # Building Unit CRUD
│       ├── layout.service.ts        # Layout CRUD
│       ├── package.service.ts       # Package CRUD
│       ├── furniture.service.ts     # Furniture catalog CRUD
│       ├── surcharge.service.ts     # Surcharge CRUD
│       ├── quote-settings.service.ts # Settings CRUD
│       ├── room-type.service.ts     # Room type CRUD
│       ├── quote.service.ts         # Quote CRUD + calculation
│       └── types.ts                 # Shared types
│
├── schemas/
│   └── interior.schema.ts           # Zod validation schemas
```

### TypeScript Interfaces

```typescript
// Admin Types (admin/src/app/types/interior.ts)

interface InteriorDeveloper {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  order: number;
  isActive: boolean;
  developmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface InteriorDevelopment {
  id: string;
  developerId: string;
  developer?: InteriorDeveloper;
  name: string;
  code: string;
  slug: string;
  address?: string;
  district?: string;
  city?: string;
  description?: string;
  thumbnail?: string;
  images?: string[];
  totalBuildings?: number;
  totalUnits?: number;
  startYear?: number;
  completionYear?: number;
  order: number;
  isActive: boolean;
  buildingCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface InteriorBuilding {
  id: string;
  developmentId: string;
  development?: InteriorDevelopment;
  name: string;
  code: string;
  totalFloors: number;
  startFloor: number;
  endFloor?: number;
  axisLabels: string[];
  unitsPerFloor: number;
  unitCodeFormat: string;
  specialFloors?: SpecialFloor[];
  thumbnail?: string;
  floorPlanImage?: string;
  order: number;
  isActive: boolean;
  unitCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface SpecialFloor {
  floor: number;
  type: 'PENTHOUSE' | 'DUPLEX' | 'SHOPHOUSE' | 'COMMERCIAL';
  note?: string;
}

interface InteriorBuildingUnit {
  id: string;
  buildingId: string;
  building?: InteriorBuilding;
  axis: string;
  unitType: UnitType;
  bedrooms: number;
  bathrooms: number;
  position: 'CORNER' | 'EDGE' | 'MIDDLE';
  direction?: string;
  view?: string;
  floorStart: number;
  floorEnd?: number;
  layoutId: string;
  layout?: InteriorUnitLayout;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type UnitType = 'STUDIO' | '1PN' | '2PN' | '3PN' | '4PN' | 'PENTHOUSE' | 'DUPLEX' | 'SHOPHOUSE';

interface InteriorUnitLayout {
  id: string;
  name: string;
  code: string;
  unitType: UnitType;
  bedrooms: number;
  bathrooms: number;
  grossArea: number;
  netArea: number;
  carpetArea?: number;
  balconyArea?: number;
  terraceArea?: number;
  rooms: LayoutRoom[];
  layoutImage?: string;
  layout3DImage?: string;
  dimensionImage?: string;
  description?: string;
  highlights?: string[];
  isActive: boolean;
  packageCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface LayoutRoom {
  name: string;
  area: number;
  type: RoomType;
}

type RoomType = 'LIVING' | 'BEDROOM' | 'BEDROOM_MASTER' | 'KITCHEN' | 'BATHROOM' | 
                'BATHROOM_ENSUITE' | 'BALCONY' | 'TERRACE' | 'STORAGE' | 'DINING' | 'OTHER';

interface InteriorPackage {
  id: string;
  layoutId: string;
  layout?: InteriorUnitLayout;
  name: string;
  code: string;
  tier: 1 | 2 | 3 | 4;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  pricePerSqm?: number;
  thumbnail?: string;
  images?: string[];
  video360Url?: string;
  items: PackageRoomItems[];
  totalItems?: number;
  totalItemsPrice?: number;
  warrantyMonths?: number;
  installationDays?: number;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PackageRoomItems {
  room: string;
  items: PackageItem[];
}

interface PackageItem {
  name: string;
  brand?: string;
  material?: string;
  qty: number;
  price: number;
}
```


```typescript
// Continued interfaces...

interface InteriorSurcharge {
  id: string;
  name: string;
  code: string;
  type: 'FIXED' | 'PERCENTAGE' | 'PER_FLOOR' | 'PER_SQM' | 'CONDITIONAL';
  value: number;
  conditions?: SurchargeConditions;
  description?: string;
  isAutoApply: boolean;
  isOptional: boolean;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SurchargeConditions {
  minFloor?: number;
  maxFloor?: number;
  minArea?: number;
  maxArea?: number;
  unitTypes?: UnitType[];
  positions?: ('CORNER' | 'EDGE' | 'MIDDLE')[];
  buildings?: string[];
  developments?: string[];
}

interface InteriorQuoteSettings {
  id: string;
  laborCostPerSqm: number;
  laborCostMin?: number;
  laborCostMax?: number;
  managementFeeType: 'FIXED' | 'PERCENTAGE';
  managementFeeValue: number;
  contingencyType: 'FIXED' | 'PERCENTAGE';
  contingencyValue: number;
  vatEnabled: boolean;
  vatPercent: number;
  maxDiscountPercent?: number;
  quoteValidityDays: number;
  customFormula?: string;
  showItemBreakdown: boolean;
  showRoomBreakdown: boolean;
  showPricePerSqm: boolean;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  createdAt: string;
  updatedAt: string;
}

interface InteriorQuote {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  developmentName: string;
  buildingName: string;
  unitCode: string;
  floor: number;
  axis: string;
  unitType: UnitType;
  layoutName: string;
  grossArea: number;
  netArea: number;
  packageId: string;
  package?: InteriorPackage;
  packageName: string;
  packageTier: number;
  packagePrice: number;
  laborCost: number;
  surcharges?: AppliedSurcharge[];
  surchargesTotal: number;
  managementFee: number;
  contingency: number;
  subtotal: number;
  vatAmount: number;
  discount: number;
  grandTotal: number;
  pricePerSqm?: number;
  status: QuoteStatus;
  validUntil?: string;
  notes?: string;
  internalNotes?: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

interface AppliedSurcharge {
  name: string;
  amount: number;
}

// Quote Calculation Types
interface QuoteCalculationInput {
  buildingUnitId: string;
  floor: number;
  packageId: string;
  discount?: number;
}

interface QuoteCalculationResult {
  unitInfo: {
    developmentName: string;
    buildingName: string;
    unitCode: string;
    floor: number;
    axis: string;
    unitType: UnitType;
    position: string;
    direction?: string;
  };
  layoutInfo: {
    name: string;
    grossArea: number;
    netArea: number;
    rooms: LayoutRoom[];
  };
  packageInfo: {
    id: string;
    name: string;
    tier: number;
    basePrice: number;
    items: PackageRoomItems[];
  };
  priceBreakdown: {
    packagePrice: number;
    laborCost: number;
    surcharges: AppliedSurcharge[];
    surchargesTotal: number;
    managementFee: number;
    contingency: number;
    subtotal: number;
    vatAmount: number;
    discount: number;
    grandTotal: number;
    pricePerSqm: number;
  };
  validUntil: string;
}
```


## Data Models

### Prisma Schema

```prisma
// ============================================
// INTERIOR MODULE - CHỦ ĐẦU TƯ
// ============================================

model InteriorDeveloper {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  logo        String?
  description String?
  website     String?
  phone       String?
  email       String?
  address     String?
  
  developments InteriorDevelopment[]
  
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([isActive])
  @@index([order])
}

// ============================================
// INTERIOR MODULE - DỰ ÁN
// ============================================

model InteriorDevelopment {
  id          String   @id @default(cuid())
  developerId String
  developer   InteriorDeveloper @relation(fields: [developerId], references: [id], onDelete: Cascade)
  
  name        String
  code        String   @unique
  slug        String   @unique
  address     String?
  district    String?
  city        String?
  description String?
  thumbnail   String?
  images      String?  // JSON array
  totalBuildings Int?
  totalUnits     Int?
  startYear      Int?
  completionYear Int?
  
  buildings   InteriorBuilding[]
  
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([developerId])
  @@index([isActive])
  @@index([order])
}

// ============================================
// INTERIOR MODULE - TÒA NHÀ
// ============================================

model InteriorBuilding {
  id            String   @id @default(cuid())
  developmentId String
  development   InteriorDevelopment @relation(fields: [developmentId], references: [id], onDelete: Cascade)
  
  name          String
  code          String
  totalFloors   Int
  startFloor    Int      @default(1)
  endFloor      Int?
  axisLabels    String   // JSON array: ["A","B","C","D"]
  unitsPerFloor Int
  unitCodeFormat String  @default("{building}.{floor}.{axis}")
  specialFloors String?  // JSON array
  thumbnail     String?
  floorPlanImage String?
  
  units         InteriorBuildingUnit[]
  
  order         Int      @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([developmentId, code])
  @@index([developmentId])
  @@index([isActive])
}

// ============================================
// INTERIOR MODULE - CĂN HỘ THEO TRỤC
// ============================================

model InteriorBuildingUnit {
  id          String   @id @default(cuid())
  buildingId  String
  building    InteriorBuilding @relation(fields: [buildingId], references: [id], onDelete: Cascade)
  
  axis        String
  unitType    String   // STUDIO, 1PN, 2PN, 3PN, 4PN, PENTHOUSE, DUPLEX
  bedrooms    Int
  bathrooms   Int      @default(1)
  position    String   @default("MIDDLE") // CORNER, EDGE, MIDDLE
  direction   String?  // ĐÔNG, TÂY, NAM, BẮC, etc.
  view        String?  // VIEW_POOL, VIEW_PARK, VIEW_CITY
  floorStart  Int      @default(1)
  floorEnd    Int?
  layoutId    String
  layout      InteriorUnitLayout @relation(fields: [layoutId], references: [id])
  notes       String?
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([buildingId, axis])
  @@index([buildingId])
  @@index([layoutId])
  @@index([unitType])
}

// ============================================
// INTERIOR MODULE - BẢN VẼ LAYOUT
// ============================================

model InteriorUnitLayout {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  unitType    String
  bedrooms    Int
  bathrooms   Int      @default(1)
  grossArea   Float
  netArea     Float
  carpetArea  Float?
  balconyArea Float?
  terraceArea Float?
  rooms       String   // JSON array of LayoutRoom
  layoutImage     String?
  layout3DImage   String?
  dimensionImage  String?
  description     String?
  highlights      String?  // JSON array
  
  buildingUnits   InteriorBuildingUnit[]
  packages        InteriorPackage[]
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([unitType])
  @@index([isActive])
}
```


```prisma
// ============================================
// INTERIOR MODULE - GÓI NỘI THẤT
// ============================================

model InteriorPackage {
  id          String   @id @default(cuid())
  layoutId    String
  layout      InteriorUnitLayout @relation(fields: [layoutId], references: [id], onDelete: Cascade)
  
  name        String
  code        String
  tier        Int      @default(1) // 1: Basic, 2: Standard, 3: Premium, 4: Luxury
  description     String?
  shortDescription String?
  basePrice       Float
  pricePerSqm     Float?
  thumbnail       String?
  images          String?  // JSON array
  video360Url     String?
  items           String   // JSON array of PackageRoomItems
  totalItems      Int?
  totalItemsPrice Float?
  warrantyMonths  Int?
  installationDays Int?
  
  quotes          InteriorQuote[]
  
  order           Int     @default(0)
  isActive        Boolean @default(true)
  isFeatured      Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([layoutId, code])
  @@index([layoutId])
  @@index([tier])
  @@index([isActive])
}

// ============================================
// INTERIOR MODULE - DANH MỤC ĐỒ NỘI THẤT
// ============================================

model InteriorFurnitureCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  icon        String?
  description String?
  parentId    String?
  parent      InteriorFurnitureCategory?  @relation("FurnitureCategoryHierarchy", fields: [parentId], references: [id])
  children    InteriorFurnitureCategory[] @relation("FurnitureCategoryHierarchy")
  roomTypes   String?  // JSON array
  
  items       InteriorFurnitureItem[]
  
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([parentId])
  @@index([isActive])
}

// ============================================
// INTERIOR MODULE - ĐỒ NỘI THẤT
// ============================================

model InteriorFurnitureItem {
  id          String   @id @default(cuid())
  categoryId  String
  category    InteriorFurnitureCategory @relation(fields: [categoryId], references: [id])
  
  name        String
  sku         String?  @unique
  brand       String?
  origin      String?
  material    String?
  color       String?
  dimensions  String?  // JSON: {width, height, depth, unit}
  weight      Float?
  price       Float
  costPrice   Float?
  thumbnail   String?
  images      String?  // JSON array
  description String?
  features    String?  // JSON array
  warrantyMonths Int?
  inStock     Boolean  @default(true)
  stockQty    Int?
  
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([categoryId])
  @@index([brand])
  @@index([isActive])
}

// ============================================
// INTERIOR MODULE - PHỤ PHÍ
// ============================================

model InteriorSurcharge {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  type        String   // FIXED, PERCENTAGE, PER_FLOOR, PER_SQM, CONDITIONAL
  value       Float
  conditions  String?  // JSON: SurchargeConditions
  description String?
  isAutoApply Boolean  @default(true)
  isOptional  Boolean  @default(false)
  
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([type])
  @@index([isActive])
}

// ============================================
// INTERIOR MODULE - CẤU HÌNH BÁO GIÁ
// ============================================

model InteriorQuoteSettings {
  id          String   @id @default("default")
  laborCostPerSqm     Float   @default(500000)
  laborCostMin        Float?
  laborCostMax        Float?
  managementFeeType   String  @default("PERCENTAGE")
  managementFeeValue  Float   @default(5)
  contingencyType     String  @default("PERCENTAGE")
  contingencyValue    Float   @default(3)
  vatEnabled          Boolean @default(true)
  vatPercent          Float   @default(10)
  maxDiscountPercent  Float?  @default(15)
  quoteValidityDays   Int     @default(30)
  customFormula       String?
  showItemBreakdown   Boolean @default(true)
  showRoomBreakdown   Boolean @default(true)
  showPricePerSqm     Boolean @default(true)
  companyName         String?
  companyPhone        String?
  companyEmail        String?
  companyAddress      String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================
// INTERIOR MODULE - LOẠI PHÒNG
// ============================================

model InteriorRoomType {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  nameEn      String?
  icon        String?
  description String?
  defaultCategories String?  // JSON array of category IDs
  
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================
// INTERIOR MODULE - BÁO GIÁ
// ============================================

model InteriorQuote {
  id          String   @id @default(cuid())
  code        String   @unique
  customerName    String
  customerPhone   String
  customerEmail   String?
  developmentName String
  buildingName    String
  unitCode        String
  floor           Int
  axis            String
  unitType        String
  layoutName      String
  grossArea       Float
  netArea         Float
  packageId       String
  package         InteriorPackage @relation(fields: [packageId], references: [id])
  packageName     String
  packageTier     Int
  packagePrice    Float
  laborCost       Float
  surcharges      String?  // JSON array
  surchargesTotal Float    @default(0)
  managementFee   Float    @default(0)
  contingency     Float    @default(0)
  subtotal        Float
  vatAmount       Float    @default(0)
  discount        Float    @default(0)
  grandTotal      Float
  pricePerSqm     Float?
  status          String   @default("DRAFT")
  validUntil      DateTime?
  notes           String?
  internalNotes   String?
  sentAt          DateTime?
  viewedAt        DateTime?
  acceptedAt      DateTime?
  rejectedAt      DateTime?
  rejectionReason String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([status])
  @@index([customerPhone])
  @@index([packageId])
  @@index([createdAt])
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Developer slug uniqueness and format
*For any* developer name, the generated slug SHALL be unique, URL-safe (lowercase, hyphenated), and deterministically derived from the name.
**Validates: Requirements 1.2**

### Property 2: Inactive entities filtered from public API
*For any* entity (developer, development, building, layout, package) with isActive=false, the public API SHALL NOT include it in responses.
**Validates: Requirements 1.4, 2.5**

### Property 3: Referential integrity on deletion
*For any* entity with dependent children (developer→developments, development→buildings, building→units, layout→packages), deletion SHALL fail with an error listing the dependent entities.
**Validates: Requirements 1.5, 2.6, 5.7**

### Property 4: Order field affects list ordering
*For any* list of entities with order field, the returned list SHALL be sorted by order ascending.
**Validates: Requirements 1.6, 10.3**

### Property 5: Floor range validation
*For any* building configuration, startFloor SHALL be less than or equal to endFloor, and both SHALL be within 1 to totalFloors range.
**Validates: Requirements 3.3**

### Property 6: Axis labels uniqueness
*For any* building, axis labels SHALL be unique within that building (no duplicates in the array).
**Validates: Requirements 3.2**

### Property 7: Unit code format generation
*For any* building with unitCodeFormat, floor, and axis, the generated unit code SHALL match the format pattern with correct substitutions.
**Validates: Requirements 3.4, 12.2**

### Property 8: Layout-unit type matching
*For any* building unit assignment, the assigned layout's unitType SHALL match the building unit's unitType.
**Validates: Requirements 4.3**

### Property 9: Room areas sum validation
*For any* layout with room breakdown, the sum of all room areas SHALL be less than or equal to netArea.
**Validates: Requirements 5.3**

### Property 10: Package items calculation
*For any* interior package with items, totalItems SHALL equal the count of all items across all rooms, and totalItemsPrice SHALL equal the sum of (qty × price) for all items.
**Validates: Requirements 6.3**

### Property 11: Clone operation creates distinct entity
*For any* clone operation (layout or package), the cloned entity SHALL have a different ID and code but identical data for other fields.
**Validates: Requirements 5.6, 6.6**

### Property 12: Furniture category hierarchy
*For any* furniture category with parentId, the parent category SHALL exist and not create circular references.
**Validates: Requirements 7.1**

### Property 13: Surcharge condition AND logic
*For any* surcharge with multiple conditions, the surcharge SHALL only apply when ALL conditions are satisfied.
**Validates: Requirements 8.3**

### Property 14: Auto-apply surcharge inclusion
*For any* quote calculation, all active surcharges with isAutoApply=true and matching conditions SHALL be included in the surcharges array.
**Validates: Requirements 8.4**

### Property 15: Quote calculation formula
*For any* quote calculation:
- laborCost = netArea × laborCostPerSqm (clamped by min/max if set)
- managementFee = subtotal × managementFeeValue/100 (if PERCENTAGE) or managementFeeValue (if FIXED)
- contingency = subtotal × contingencyValue/100 (if PERCENTAGE) or contingencyValue (if FIXED)
- subtotal = packagePrice + laborCost + surchargesTotal + managementFee + contingency
- vatAmount = subtotal × vatPercent/100 (if vatEnabled)
- grandTotal = subtotal + vatAmount - discount
- pricePerSqm = grandTotal / netArea
**Validates: Requirements 15.2, 15.4**

### Property 16: Quote code uniqueness
*For any* saved quote, the generated code SHALL be unique and follow the format INT-YYYY-NNN.
**Validates: Requirements 18.6**

### Property 17: Quote validity expiration
*For any* quote with validUntil date in the past, the status SHALL be automatically updated to EXPIRED.
**Validates: Requirements 17.6**

### Property 18: API pagination consistency
*For any* paginated API response, the total count SHALL equal the sum of all pages' item counts, and items SHALL not be duplicated across pages.
**Validates: Requirements 18.3**

### Property 19: Validation error specificity
*For any* invalid API request, the error response SHALL include field-specific error messages for each invalid field.
**Validates: Requirements 18.4**

### Property 20: CustomerLead creation from quote
*For any* saved quote, a corresponding CustomerLead record SHALL be created with source="INTERIOR_QUOTE" and quoteData containing the quote details.
**Validates: Requirements 20.4**


## Error Handling

### API Error Responses

```typescript
// Standard error response format
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  correlationId: string;
}

// Error codes
const ERROR_CODES = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_UNIT_CODE: 'INVALID_UNIT_CODE',
  INVALID_FLOOR_RANGE: 'INVALID_FLOOR_RANGE',
  DUPLICATE_AXIS: 'DUPLICATE_AXIS',
  UNIT_TYPE_MISMATCH: 'UNIT_TYPE_MISMATCH',
  
  // Not found errors
  DEVELOPER_NOT_FOUND: 'DEVELOPER_NOT_FOUND',
  DEVELOPMENT_NOT_FOUND: 'DEVELOPMENT_NOT_FOUND',
  BUILDING_NOT_FOUND: 'BUILDING_NOT_FOUND',
  UNIT_NOT_FOUND: 'UNIT_NOT_FOUND',
  LAYOUT_NOT_FOUND: 'LAYOUT_NOT_FOUND',
  PACKAGE_NOT_FOUND: 'PACKAGE_NOT_FOUND',
  QUOTE_NOT_FOUND: 'QUOTE_NOT_FOUND',
  
  // Referential integrity errors
  DEVELOPER_HAS_DEVELOPMENTS: 'DEVELOPER_HAS_DEVELOPMENTS',
  DEVELOPMENT_HAS_BUILDINGS: 'DEVELOPMENT_HAS_BUILDINGS',
  BUILDING_HAS_UNITS: 'BUILDING_HAS_UNITS',
  LAYOUT_HAS_UNITS: 'LAYOUT_HAS_UNITS',
  LAYOUT_HAS_PACKAGES: 'LAYOUT_HAS_PACKAGES',
  
  // Business logic errors
  INACTIVE_ENTITY: 'INACTIVE_ENTITY',
  QUOTE_EXPIRED: 'QUOTE_EXPIRED',
  INVALID_DISCOUNT: 'INVALID_DISCOUNT',
};
```

### Landing Page Error States

```typescript
// Error state component props
interface ErrorStateProps {
  type: 'network' | 'not_found' | 'validation' | 'server';
  message: string;
  onRetry?: () => void;
}

// Error handling in wizard
const handleStepError = (error: Error, step: number) => {
  // Log error for debugging
  console.error(`Error in step ${step}:`, error);
  
  // Show user-friendly message
  if (error.message.includes('network')) {
    showError('Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.');
  } else if (error.message.includes('not_found')) {
    showError('Không tìm thấy dữ liệu. Vui lòng chọn lại.');
  } else {
    showError('Có lỗi xảy ra. Vui lòng thử lại sau.');
  }
};
```

## Testing Strategy

### Dual Testing Approach

This module uses both unit tests and property-based tests:

1. **Unit Tests**: Verify specific examples, edge cases, and error conditions
2. **Property-Based Tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing Library

- **Library**: fast-check (for TypeScript/JavaScript)
- **Minimum iterations**: 100 per property test

### Test File Structure

```
api/src/services/interior/
├── developer.service.ts
├── developer.service.test.ts           # Unit tests
├── developer.service.property.test.ts  # Property tests
├── development.service.ts
├── development.service.test.ts
├── development.service.property.test.ts
├── building.service.ts
├── building.service.test.ts
├── building.service.property.test.ts
├── quote.service.ts
├── quote.service.test.ts
├── quote.service.property.test.ts      # Quote calculation properties
└── ...
```

### Property Test Examples

```typescript
// Example: Property 15 - Quote calculation formula
import * as fc from 'fast-check';

describe('Quote Calculation Properties', () => {
  /**
   * **Feature: interior-quote-module, Property 15: Quote calculation formula**
   * **Validates: Requirements 15.2, 15.4**
   */
  it('should calculate quote components correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          packagePrice: fc.float({ min: 1000000, max: 1000000000 }),
          netArea: fc.float({ min: 20, max: 500 }),
          laborCostPerSqm: fc.float({ min: 100000, max: 1000000 }),
          managementFeePercent: fc.float({ min: 0, max: 20 }),
          contingencyPercent: fc.float({ min: 0, max: 10 }),
          vatPercent: fc.float({ min: 0, max: 15 }),
          surchargesTotal: fc.float({ min: 0, max: 50000000 }),
        }),
        (input) => {
          const result = calculateQuote(input);
          
          // Verify labor cost
          const expectedLaborCost = input.netArea * input.laborCostPerSqm;
          expect(result.laborCost).toBeCloseTo(expectedLaborCost, 2);
          
          // Verify subtotal
          const expectedSubtotal = input.packagePrice + result.laborCost + 
            input.surchargesTotal + result.managementFee + result.contingency;
          expect(result.subtotal).toBeCloseTo(expectedSubtotal, 2);
          
          // Verify VAT
          const expectedVat = result.subtotal * (input.vatPercent / 100);
          expect(result.vatAmount).toBeCloseTo(expectedVat, 2);
          
          // Verify grand total
          const expectedGrandTotal = result.subtotal + result.vatAmount;
          expect(result.grandTotal).toBeCloseTo(expectedGrandTotal, 2);
          
          // Verify price per sqm
          const expectedPricePerSqm = result.grandTotal / input.netArea;
          expect(result.pricePerSqm).toBeCloseTo(expectedPricePerSqm, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Examples

```typescript
// Example: Unit tests for edge cases
describe('Quote Calculation Edge Cases', () => {
  it('should handle zero surcharges', () => {
    const result = calculateQuote({
      packagePrice: 100000000,
      netArea: 50,
      laborCostPerSqm: 500000,
      surcharges: [],
    });
    
    expect(result.surchargesTotal).toBe(0);
  });
  
  it('should clamp labor cost to min/max', () => {
    const result = calculateQuote({
      packagePrice: 100000000,
      netArea: 10, // Very small area
      laborCostPerSqm: 500000,
      laborCostMin: 10000000, // Minimum 10M
    });
    
    expect(result.laborCost).toBe(10000000);
  });
  
  it('should handle VAT disabled', () => {
    const result = calculateQuote({
      packagePrice: 100000000,
      netArea: 50,
      vatEnabled: false,
    });
    
    expect(result.vatAmount).toBe(0);
  });
});
```


## API Endpoints

### Public Endpoints (No Auth Required)

```
GET  /api/interior/developers                    # List active developers
GET  /api/interior/developers/:id                # Get developer details
GET  /api/interior/developments                  # List active developments (filter by developerId)
GET  /api/interior/developments/:id              # Get development details
GET  /api/interior/buildings                     # List active buildings (filter by developmentId)
GET  /api/interior/buildings/:id                 # Get building details with units
GET  /api/interior/buildings/:id/units           # Get building units matrix
GET  /api/interior/layouts/:id                   # Get layout details
GET  /api/interior/packages                      # List packages (filter by layoutId)
GET  /api/interior/packages/:id                  # Get package details with items
POST /api/interior/quotes/calculate              # Calculate quote (no save)
POST /api/interior/quotes                        # Save quote (creates CustomerLead)
GET  /api/interior/quotes/:code                  # Get quote by code (public view)
```

### Admin Endpoints (Require ADMIN Role)

```
# Developers
GET    /api/admin/interior/developers            # List all developers (including inactive)
POST   /api/admin/interior/developers            # Create developer
PUT    /api/admin/interior/developers/:id        # Update developer
DELETE /api/admin/interior/developers/:id        # Delete developer
PUT    /api/admin/interior/developers/reorder    # Reorder developers

# Developments
GET    /api/admin/interior/developments          # List all developments
POST   /api/admin/interior/developments          # Create development
PUT    /api/admin/interior/developments/:id      # Update development
DELETE /api/admin/interior/developments/:id      # Delete development

# Buildings
GET    /api/admin/interior/buildings             # List all buildings
POST   /api/admin/interior/buildings             # Create building
PUT    /api/admin/interior/buildings/:id         # Update building
DELETE /api/admin/interior/buildings/:id         # Delete building

# Building Units
GET    /api/admin/interior/buildings/:id/units   # List building units
POST   /api/admin/interior/buildings/:id/units   # Create building unit
PUT    /api/admin/interior/units/:id             # Update building unit
DELETE /api/admin/interior/units/:id             # Delete building unit
POST   /api/admin/interior/buildings/:id/units/import  # Bulk import units

# Layouts
GET    /api/admin/interior/layouts               # List all layouts
POST   /api/admin/interior/layouts               # Create layout
PUT    /api/admin/interior/layouts/:id           # Update layout
DELETE /api/admin/interior/layouts/:id           # Delete layout
POST   /api/admin/interior/layouts/:id/clone     # Clone layout

# Packages
GET    /api/admin/interior/packages              # List all packages
POST   /api/admin/interior/packages              # Create package
PUT    /api/admin/interior/packages/:id          # Update package
DELETE /api/admin/interior/packages/:id          # Delete package
POST   /api/admin/interior/packages/:id/clone    # Clone package to another layout

# Furniture Catalog
GET    /api/admin/interior/furniture/categories  # List categories (tree)
POST   /api/admin/interior/furniture/categories  # Create category
PUT    /api/admin/interior/furniture/categories/:id  # Update category
DELETE /api/admin/interior/furniture/categories/:id  # Delete category
GET    /api/admin/interior/furniture/items       # List items (with filters)
POST   /api/admin/interior/furniture/items       # Create item
PUT    /api/admin/interior/furniture/items/:id   # Update item
DELETE /api/admin/interior/furniture/items/:id   # Delete item
POST   /api/admin/interior/furniture/items/import  # Bulk import items

# Surcharges
GET    /api/admin/interior/surcharges            # List surcharges
POST   /api/admin/interior/surcharges            # Create surcharge
PUT    /api/admin/interior/surcharges/:id        # Update surcharge
DELETE /api/admin/interior/surcharges/:id        # Delete surcharge
POST   /api/admin/interior/surcharges/test       # Test surcharge conditions

# Quote Settings
GET    /api/admin/interior/settings              # Get quote settings
PUT    /api/admin/interior/settings              # Update quote settings

# Room Types
GET    /api/admin/interior/room-types            # List room types
POST   /api/admin/interior/room-types            # Create room type
PUT    /api/admin/interior/room-types/:id        # Update room type
DELETE /api/admin/interior/room-types/:id        # Delete room type

# Quotes
GET    /api/admin/interior/quotes                # List quotes (with filters)
GET    /api/admin/interior/quotes/:id            # Get quote details
PUT    /api/admin/interior/quotes/:id/status     # Update quote status
GET    /api/admin/interior/quotes/export         # Export quotes to CSV
```

## Landing Page Animation Specifications

### Step Transitions

```typescript
// Framer Motion variants for step transitions
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const stepTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  duration: 0.4,
};
```

### Card Selection Animation

```typescript
// Selection card hover/tap animation
const cardVariants = {
  initial: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
  tap: { scale: 0.98 },
  selected: { 
    scale: 1, 
    borderColor: tokens.color.primary,
    boxShadow: `0 0 0 2px ${tokens.color.primary}`,
  },
};
```

### Staggered List Animation

```typescript
// Staggered entrance for list items
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 },
  },
};
```

### Loading States

```typescript
// Skeleton loader animation
const skeletonVariants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Image lazy load with blur-up
const imageVariants = {
  loading: { filter: 'blur(10px)', scale: 1.1 },
  loaded: { 
    filter: 'blur(0px)', 
    scale: 1,
    transition: { duration: 0.4 },
  },
};
```

### Mobile Swipe Gestures

```typescript
// Swipe gesture handling
const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const handleDragEnd = (e: any, { offset, velocity }: any) => {
  const swipe = swipePower(offset.x, velocity.x);
  
  if (swipe < -swipeConfidenceThreshold) {
    goToNextStep();
  } else if (swipe > swipeConfidenceThreshold) {
    goToPrevStep();
  }
};
```

