# Design Document

## Overview

Tái cấu trúc hệ thống sản phẩm nội thất từ mô hình flat (mỗi sản phẩm + chất liệu = 1 row) sang mô hình normalized (ProductBase + ProductVariant). Đồng thời cải tiến UX trên Landing page với step xác nhận trước khi tạo báo giá.

### Goals
- Chuẩn hóa database theo 3NF, giảm data duplication
- Cải thiện Admin UX khi quản lý sản phẩm và variants
- Thêm step xác nhận (Step 7.5) trên Landing page
- Đảm bảo backward compatibility với quotations cũ

### Non-Goals
- Draft Quotation (lưu nháp) - sẽ làm spec riêng
- Inventory tracking per variant
- Complex pricing rules (combo, discount)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Landing Page                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│  │ Step 7  │→ │Step 7.5 │→ │ Step 8  │  │         │  │        │ │
│  │Products │  │Confirm  │  │ Result  │  │         │  │        │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └─────────┘  └────────┘ │
└───────┼────────────┼────────────┼───────────────────────────────┘
        │            │            │
        ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ GET /products    │  │ POST /quotations │  │ GET /quotations│ │
│  │ (grouped)        │  │                  │  │ /:id           │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘ │
└───────────┼─────────────────────┼────────────────────┼──────────┘
            │                     │                    │
            ▼                     ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer (Refactored)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ api/src/services/furniture/                               │   │
│  │  ├── index.ts (facade + re-exports)                       │   │
│  │  ├── furniture-quotation.service.ts (calculations)        │   │
│  │  ├── furniture-product.service.ts (products + mappings)   │   │
│  │  ├── furniture-category.service.ts (categories)           │   │
│  │  ├── furniture-fee.service.ts (fees)                      │   │
│  │  ├── furniture-developer.service.ts (developers/projects) │   │
│  │  ├── furniture-layout.service.ts (layouts/apartments)     │   │
│  │  ├── furniture-import-export.service.ts (CSV)             │   │
│  │  ├── furniture.types.ts (shared types)                    │   │
│  │  └── furniture.error.ts (error class)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │ProductBase     │  │ProductVariant  │  │ProductMapping      │ │
│  │                │←─│                │  │                    │ │
│  │ id             │  │ id             │  │ id                 │ │
│  │ name           │  │ productBaseId  │  │ productBaseId      │ │
│  │ categoryId     │  │ materialId     │  │ projectName        │ │
│  │ description    │  │ pricePerUnit   │  │ buildingCode       │ │
│  │ imageUrl       │  │ pricingType    │  │ apartmentType      │ │
│  │ allowFitIn     │  │ length, width  │  └────────────────────┘ │
│  │ order          │  │ calculatedPrice│                         │
│  │ isActive       │  │ imageUrl       │                         │
│  └────────────────┘  │ order          │                         │
│         │            │ isActive       │                         │
│         │            └────────────────┘                         │
│         ▼                    │                                  │
│  ┌────────────────┐          │                                  │
│  │FurnitureCategory│         │                                  │
│  └────────────────┘          ▼                                  │
│                       ┌────────────────┐                        │
│                       │FurnitureMaterial│                       │
│                       └────────────────┘                        │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Legacy: FurnitureProduct (read-only for backward compat)   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Models (Prisma)

```prisma
// NEW: Product Base - Common information
model FurnitureProductBase {
  id          String   @id @default(cuid())
  name        String
  categoryId  String
  category    FurnitureCategory @relation(fields: [categoryId], references: [id])
  description String?
  imageUrl    String?
  allowFitIn  Boolean  @default(false)
  order       Int      @default(0)
  isActive    Boolean  @default(true)

  // Relations
  variants    FurnitureProductVariant[]
  mappings    FurnitureProductMapping[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([name, categoryId])
  @@index([categoryId])
  @@index([isActive])
}

// NEW: Product Variant - Material-specific information
model FurnitureProductVariant {
  id              String   @id @default(cuid())
  productBaseId   String
  productBase     FurnitureProductBase @relation(fields: [productBaseId], references: [id], onDelete: Cascade)
  materialId      String
  material        FurnitureMaterial @relation(fields: [materialId], references: [id])
  pricePerUnit    Float
  pricingType     String   @default("LINEAR") // LINEAR | M2
  length          Float
  width           Float?   // Required for M2
  calculatedPrice Float    // Auto-calculated
  imageUrl        String?  // Optional variant-specific image
  order           Int      @default(0)
  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([productBaseId, materialId])
  @@index([productBaseId])
  @@index([materialId])
  @@index([isActive])
}

// UPDATED: Mapping now references ProductBase
model FurnitureProductMapping {
  id            String   @id @default(cuid())
  productBaseId String
  productBase   FurnitureProductBase @relation(fields: [productBaseId], references: [id], onDelete: Cascade)
  projectName   String
  buildingCode  String
  apartmentType String
  createdAt     DateTime @default(now())

  @@unique([productBaseId, projectName, buildingCode, apartmentType])
  @@index([projectName, buildingCode, apartmentType])
}

// UPDATED: FurnitureMaterial - Add relation to variants
model FurnitureMaterial {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  order       Int      @default(0)
  isActive    Boolean  @default(true)

  // NEW: Relation to variants
  variants    FurnitureProductVariant[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isActive])
}
```

### 2. Service Interfaces

> **NOTE**: Services đã được refactor thành module structure. Import từ `api/src/services/furniture/`:
> ```typescript
> // Import individual services (recommended)
> import { FurnitureQuotationService, FurnitureProductService } from '../services/furniture';
> 
> // Or use facade for backward compatibility
> import { FurnitureService } from '../services/furniture';
> ```

```typescript
// Product Base with variants and mappings
interface ProductBaseWithDetails {
  id: string;
  name: string;
  categoryId: string;
  category: FurnitureCategory;
  description: string | null;
  imageUrl: string | null;
  allowFitIn: boolean;
  order: number;
  isActive: boolean;
  variants: ProductVariantWithMaterial[];
  mappings: ProductMapping[];
  // Computed
  variantCount: number;
  priceRange: { min: number; max: number };
}

// Product Variant with material info
interface ProductVariantWithMaterial {
  id: string;
  productBaseId: string;
  materialId: string;
  material: FurnitureMaterial;
  pricePerUnit: number;
  pricingType: 'LINEAR' | 'M2';
  length: number;
  width: number | null;
  calculatedPrice: number;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
}

// Grouped products for Landing page (NEW schema)
interface ProductBaseGroup {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string | null;
  imageUrl: string | null;
  allowFitIn: boolean;
  variants: ProductVariantForLanding[];
  priceRange: { min: number; max: number };
  variantCount: number;
}

interface ProductVariantForLanding {
  id: string;
  materialId: string;
  materialName: string;
  calculatedPrice: number;
  imageUrl: string | null;
}

// Legacy: Grouped products (from FurnitureProduct table)
interface ProductGroup {
  name: string;
  variants: ProductVariant[];
}

interface ProductVariant {
  id: string;
  material: string;
  calculatedPrice: number;
  allowFitIn: boolean;
  imageUrl?: string | null;
  description?: string | null;
  categoryId: string;
  categoryName: string;
  order: number;
}

// Create/Update inputs
interface CreateProductBaseInput {
  name: string;
  categoryId: string;
  description?: string;
  imageUrl?: string;
  allowFitIn?: boolean;
  order?: number;
  isActive?: boolean;
  variants: CreateVariantInput[];
  mappings?: CreateMappingInput[];
}

interface CreateVariantInput {
  materialId: string;
  pricePerUnit: number;
  pricingType: 'LINEAR' | 'M2';
  length: number;
  width?: number;
  imageUrl?: string;
  order?: number;
  isActive?: boolean;
}

interface CreateMappingInput {
  projectName: string;
  buildingCode: string;
  apartmentType: string;
}
```

### 3. API Endpoints

```typescript
// Landing Page APIs
GET  /api/furniture/products/grouped
     Query: categoryId?, projectName?, buildingCode?, apartmentType?
     Response: { products: ProductGroup[] }

// Admin APIs - Product Base
GET  /api/furniture/admin/products
     Query: categoryId?, materialId?, isActive?, page?, limit?, sortBy?, sortOrder?
     Response: { products: ProductBaseWithDetails[], total: number, page: number }

POST /api/furniture/admin/products
     Body: CreateProductBaseInput
     Response: ProductBaseWithDetails

PUT  /api/furniture/admin/products/:id
     Body: UpdateProductBaseInput
     Response: ProductBaseWithDetails

DELETE /api/furniture/admin/products/:id
     Response: { success: boolean }

// Admin APIs - Variants
POST /api/furniture/admin/products/:productBaseId/variants
     Body: CreateVariantInput
     Response: ProductVariantWithMaterial

PUT  /api/furniture/admin/products/:productBaseId/variants/:variantId
     Body: UpdateVariantInput
     Response: ProductVariantWithMaterial

DELETE /api/furniture/admin/products/:productBaseId/variants/:variantId
     Response: { success: boolean }

// Admin APIs - Mappings
POST /api/furniture/admin/products/:productBaseId/mappings
     Body: CreateMappingInput
     Response: ProductMapping

POST /api/furniture/admin/products/bulk-mapping
     Body: { productBaseIds: string[], mapping: CreateMappingInput }
     Response: { success: boolean, count: number }

DELETE /api/furniture/admin/products/:productBaseId/mappings/:mappingId
     Response: { success: boolean }

// Deprecated (backward compatibility)
GET  /api/furniture/products
     Header: X-Deprecation-Warning: Use /api/furniture/products/grouped instead
     Response: FurnitureProduct[] (legacy format)
```

## Data Models

### Selection State (Landing Page)

```typescript
interface ProductSelection {
  productBaseId: string;
  productName: string;
  variantId: string;
  materialName: string;
  calculatedPrice: number;
  quantity: number;
  fitInSelected: boolean;
  fitInFee: number; // Calculated based on fee type
  lineTotal: number; // (calculatedPrice + fitInFee) × quantity
}

interface SelectionSummary {
  items: ProductSelection[];
  subtotal: number; // Sum of calculatedPrice × quantity
  fitInFeesTotal: number;
  otherFees: FeeBreakdown[];
  grandTotal: number;
}
```

### Migration Data Structure

```typescript
interface MigrationResult {
  productBasesCreated: number;
  variantsCreated: number;
  mappingsMigrated: number;
  materialsCreated: number;
  warnings: string[];
  errors: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Unique constraint on ProductBase (name, categoryId)
*For any* two ProductBase records, if they have the same name and categoryId, then they must be the same record (same id).
**Validates: Requirements 1.3**

### Property 2: Unique constraint on ProductVariant (productBaseId, materialId)
*For any* two ProductVariant records, if they have the same productBaseId and materialId, then they must be the same record.
**Validates: Requirements 1.4**

### Property 3: Cascade delete variants when ProductBase is deleted
*For any* ProductBase, when it is deleted, all associated ProductVariant records must also be deleted.
**Validates: Requirements 1.6**

### Property 4: Prevent material deletion when referenced by variants
*For any* FurnitureMaterial that has at least one active ProductVariant referencing it, deletion must fail with an error.
**Validates: Requirements 1.7**

### Property 5: Price calculation formula correctness
*For any* ProductVariant, calculatedPrice must equal pricePerUnit × length (for LINEAR) or pricePerUnit × length × width (for M2).
**Validates: Requirements 11.1, 4.3**

### Property 6: Price range calculation
*For any* ProductBase with active variants, priceRange.min must equal the minimum calculatedPrice and priceRange.max must equal the maximum calculatedPrice among active variants.
**Validates: Requirements 11.2, 6.2**

### Property 7: Fit-in fee calculation
*For any* selection with fitInSelected=true, fitInFee must equal fee.value (for FIXED) or calculatedPrice × fee.value / 100 (for PERCENTAGE).
**Validates: Requirements 11.3, 7.4**

### Property 8: Line total calculation
*For any* ProductSelection, lineTotal must equal (calculatedPrice + fitInFee) × quantity.
**Validates: Requirements 11.4, 7.5**

### Property 9: Grand total calculation
*For any* SelectionSummary, grandTotal must equal subtotal + fitInFeesTotal + sum of otherFees amounts.
**Validates: Requirements 11.5, 8.5**

### Property 10: Prevent deletion of last variant
*For any* ProductBase with exactly one variant, attempting to delete that variant must fail with an error.
**Validates: Requirements 4.5**

### Property 11: Inactive variants excluded from Landing
*For any* API call to /products/grouped, the response must not include any variant where isActive=false.
**Validates: Requirements 4.6, 6.4**

### Property 12: Mapping-based product filtering
*For any* API call to /products/grouped with apartment filters, the response must only include ProductBase records that have a matching mapping.
**Validates: Requirements 9.7, 5.3**

### Property 13: Migration preserves product count
*For any* migration run, the total number of unique (name, categoryId, material) combinations in the legacy table must equal the total number of ProductVariant records created.
**Validates: Requirements 2.6**

### Property 14: Transaction atomicity for product creation
*For any* createProductBase call with variants, either all records (base + all variants) are created, or none are created.
**Validates: Requirements 9.3**

### Property 15: Quantity validation
*For any* ProductSelection, quantity must be between 1 and 99 inclusive.
**Validates: Requirements 6.6**

### Property 16: Search filter correctness
*For any* search query string and product list, the filtered results must only include products whose name contains the search query (case-insensitive).
**Validates: Requirements 6.9, 6.10**

### Property 17: Empty state when no products mapped
*For any* apartment filter combination with no matching product mappings, the API response must return an empty products array.
**Validates: Requirements 6.11**

### Property 18: Selection preservation on navigation
*For any* navigation from Step 7.5 back to Step 7, all previously selected products must remain in the selection state.
**Validates: Requirements 8.6, 8.9**

## Error Handling

### Validation Errors (400)
- `DUPLICATE_PRODUCT_NAME`: Product with same name already exists in category
- `DUPLICATE_VARIANT_MATERIAL`: Variant with same material already exists for product
- `LAST_VARIANT_DELETE`: Cannot delete the last variant of a product
- `WIDTH_REQUIRED_FOR_M2`: Width is required when pricingType is M2
- `INVALID_QUANTITY`: Quantity must be between 1 and 99
- `VARIANT_REQUIRED`: At least one variant is required when creating product

### Not Found Errors (404)
- `PRODUCT_BASE_NOT_FOUND`: Product base not found
- `VARIANT_NOT_FOUND`: Variant not found
- `MATERIAL_NOT_FOUND`: Material not found
- `CATEGORY_NOT_FOUND`: Category not found

### Conflict Errors (409)
- `MATERIAL_IN_USE`: Cannot delete material that is referenced by variants
- `PRODUCT_IN_QUOTATION`: Cannot delete product that is referenced by quotations

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Test validation error messages
- Test API response formats
- Test migration edge cases

**Property-Based Tests**: Verify universal properties that should hold across all inputs
- Use `fast-check` library for TypeScript
- Minimum 100 iterations per property test
- Tag each test with property reference: `**Feature: furniture-product-restructure, Property {number}: {property_text}**`

### Test Categories

1. **Database Constraints**
   - Unique constraints (Properties 1, 2)
   - Cascade delete (Property 3)
   - Foreign key constraints (Property 4)

2. **Price Calculations**
   - calculatedPrice formula (Property 5)
   - Price range (Property 6)
   - Fit-in fee (Property 7)
   - Line total (Property 8)
   - Grand total (Property 9)

3. **Business Rules**
   - Last variant protection (Property 10)
   - Inactive variant filtering (Property 11)
   - Mapping-based filtering (Property 12)
   - Quantity validation (Property 15)

4. **Data Integrity**
   - Migration correctness (Property 13)
   - Transaction atomicity (Property 14)

### Test Data Generators

```typescript
// Generate valid ProductBase
const productBaseArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  categoryId: fc.uuid(),
  description: fc.option(fc.string({ maxLength: 500 })),
  allowFitIn: fc.boolean(),
  order: fc.integer({ min: 0, max: 1000 }),
  isActive: fc.boolean(),
});

// Generate valid ProductVariant
const variantArb = fc.record({
  materialId: fc.uuid(),
  pricePerUnit: fc.float({ min: 1000, max: 100000000 }),
  pricingType: fc.constantFrom('LINEAR', 'M2'),
  length: fc.float({ min: 0.1, max: 100 }),
  width: fc.option(fc.float({ min: 0.1, max: 100 })),
  order: fc.integer({ min: 0, max: 100 }),
  isActive: fc.boolean(),
});

// Generate valid quantity
const quantityArb = fc.integer({ min: 1, max: 99 });
```

