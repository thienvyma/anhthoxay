# Design Document: Furniture Product Mapping

## Overview

Tính năng nâng cấp hệ thống Báo giá Nội thất với các thay đổi chính:

1. **Product Mapping**: Sản phẩm phải được mapping với căn hộ cụ thể (Dự án + Tòa nhà + Loại căn hộ) để hiển thị đúng sản phẩm cho từng layout.

2. **Material Variants**: Mỗi sản phẩm có thể có nhiều chất liệu khác nhau với giá khác nhau. Mỗi sản phẩm + chất liệu = 1 dòng riêng trong database.

3. **Dimension-Based Pricing**: Giá sản phẩm được tính dựa trên kích thước (m² hoặc m dài) do admin nhập khi tạo sản phẩm.

4. **Fit-in Option**: Cho phép user chọn option "Fit-in" với phí tăng thêm cho từng sản phẩm riêng biệt.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FURNITURE QUOTATION SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   Landing Page  │    │   Admin Panel   │    │   API Backend   │          │
│  │   (React)       │    │   (React)       │    │   (Hono)        │          │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘          │
│           │                      │                      │                    │
│           └──────────────────────┼──────────────────────┘                    │
│                                  │                                           │
│                    ┌─────────────▼─────────────┐                             │
│                    │      Prisma ORM           │                             │
│                    └─────────────┬─────────────┘                             │
│                                  │                                           │
│                    ┌─────────────▼─────────────┐                             │
│                    │      PostgreSQL           │                             │
│                    │  ┌─────────────────────┐  │                             │
│                    │  │ FurnitureProduct    │  │                             │
│                    │  │ FurnitureProductMap │  │                             │
│                    │  │ FurnitureFee        │  │                             │
│                    │  │ FurnitureQuotation  │  │                             │
│                    │  └─────────────────────┘  │                             │
│                    └───────────────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Models

#### FurnitureProduct (Updated)

```typescript
interface FurnitureProduct {
  id: string;
  name: string;
  material: string;              // NEW: Chất liệu (VD: "Gỗ sồi", "MDF")
  categoryId: string;
  pricePerUnit: number;          // NEW: Giá trên 1 mét (VNĐ)
  pricingType: 'M2' | 'LINEAR';  // NEW: Cách tính giá (M2 = mét vuông, LINEAR = mét dài)
  length: number;                // NEW: Chiều dài (m)
  width?: number;                // NEW: Chiều rộng (m) - chỉ cho M2
  calculatedPrice: number;       // NEW: Giá đã tính = pricePerUnit × dimensions
  allowFitIn: boolean;           // NEW: Cho phép chọn Fit-in
  imageUrl?: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
  
  // Relations
  category: FurnitureCategory;
  mappings: FurnitureProductMapping[];
}
```

#### FurnitureProductMapping (New)

```typescript
interface FurnitureProductMapping {
  id: string;
  productId: string;
  projectName: string;           // Tên dự án (TenDuAn)
  buildingCode: string;          // Mã tòa nhà (MaToaNha)
  apartmentType: string;         // Loại căn hộ (1pn, 2pn, 3pn)
  createdAt: DateTime;
  
  // Relations
  product: FurnitureProduct;
  
  // Constraints
  @@unique([productId, projectName, buildingCode, apartmentType])
  @@index([projectName, buildingCode, apartmentType])
}
```

#### FurnitureFee (Updated)

```typescript
interface FurnitureFee {
  id: string;
  name: string;
  code: string;                  // NEW: Unique code (VD: "FIT_IN")
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### FurnitureQuotation (Updated)

```typescript
interface FurnitureQuotation {
  id: string;
  leadId: string;
  developerName: string;
  projectName: string;
  buildingName: string;
  buildingCode: string;
  floor: number;
  axis: number;
  unitNumber: string;
  apartmentType: string;
  layoutImageUrl?: string;
  items: QuotationItem[];        // Updated structure
  basePrice: number;
  fees: FeeBreakdown[];
  totalPrice: number;
  createdAt: DateTime;
}

interface QuotationItem {
  productId: string;
  name: string;
  material: string;              // NEW
  calculatedPrice: number;       // NEW: Giá đã tính từ kích thước
  fitInSelected: boolean;        // NEW
  fitInFee: number;              // NEW: Phí Fit-in (nếu chọn)
  quantity: number;
  totalPrice: number;            // calculatedPrice + fitInFee (nếu có)
}
```

### 2. API Endpoints

#### Public Endpoints

```typescript
// GET /api/furniture/products
// Query params: projectName, buildingCode, apartmentType (all required for filtering)
interface GetProductsQuery {
  projectName?: string;
  buildingCode?: string;
  apartmentType?: string;
  categoryId?: string;
}

// Response: Products grouped by name with material variants
interface ProductsResponse {
  products: ProductGroup[];
}

interface ProductGroup {
  name: string;
  variants: ProductVariant[];
}

interface ProductVariant {
  id: string;
  material: string;
  calculatedPrice: number;
  allowFitIn: boolean;
  imageUrl?: string;
  description?: string;
}
```

#### Admin Endpoints

```typescript
// POST /api/admin/furniture/products
interface CreateProductRequest {
  name: string;
  material: string;
  categoryId: string;
  pricePerUnit: number;
  pricingType: 'M2' | 'LINEAR';
  length: number;
  width?: number;                // Required if pricingType = M2 (mét vuông)
  allowFitIn: boolean;
  imageUrl?: string;
  description?: string;
  mappings: MappingInput[];      // At least one required
}

interface MappingInput {
  projectName: string;
  buildingCode: string;
  apartmentType: string;
}

// POST /api/admin/furniture/products/:id/mappings
interface AddMappingRequest {
  projectName: string;
  buildingCode: string;
  apartmentType: string;
}

// DELETE /api/admin/furniture/products/:id/mappings/:mappingId

// GET /api/admin/furniture/products/:id/mappings
interface GetMappingsResponse {
  mappings: FurnitureProductMapping[];
}
```

### 3. Price Calculation Logic

```typescript
// Calculate product price from dimensions
function calculateProductPrice(
  pricePerUnit: number,
  pricingType: 'M2' | 'LINEAR',
  length: number,
  width?: number
): number {
  if (pricingType === 'M2') {
    if (!width) throw new Error('Width required for M2 pricing');
    return pricePerUnit * length * width;
  }
  // LINEAR: mét dài
  return pricePerUnit * length;
}

// Calculate quotation total
function calculateQuotationTotal(
  items: QuotationItem[],
  fees: FurnitureFee[],
  fitInFee: FurnitureFee | null
): QuotationCalculation {
  // Base price = sum of all product prices
  let basePrice = 0;
  let totalFitInFees = 0;
  
  for (const item of items) {
    const itemPrice = item.calculatedPrice * item.quantity;
    basePrice += itemPrice;
    
    if (item.fitInSelected && fitInFee) {
      const fitIn = fitInFee.type === 'FIXED' 
        ? fitInFee.value 
        : itemPrice * fitInFee.value / 100;
      totalFitInFees += fitIn * item.quantity;
    }
  }
  
  // Apply other fees
  const otherFees = fees
    .filter(f => f.code !== 'FIT_IN' && f.isActive)
    .map(fee => ({
      name: fee.name,
      type: fee.type,
      value: fee.value,
      amount: fee.type === 'FIXED' ? fee.value : basePrice * fee.value / 100
    }));
  
  const totalOtherFees = otherFees.reduce((sum, f) => sum + f.amount, 0);
  const totalPrice = basePrice + totalFitInFees + totalOtherFees;
  
  return {
    basePrice,
    fitInFees: totalFitInFees,
    otherFees,
    totalPrice
  };
}
```

### 4. Product Filtering Logic

```typescript
// Filter products by apartment mapping
async function getProductsByApartment(
  projectName: string,
  buildingCode: string,
  apartmentType: string
): Promise<ProductGroup[]> {
  const products = await prisma.furnitureProduct.findMany({
    where: {
      isActive: true,
      mappings: {
        some: {
          projectName,
          buildingCode,
          apartmentType: apartmentType.toLowerCase()
        }
      }
    },
    include: {
      category: true,
      mappings: true
    },
    orderBy: [
      { category: { order: 'asc' } },
      { order: 'asc' }
    ]
  });
  
  // Group by name
  const groups = new Map<string, ProductVariant[]>();
  for (const product of products) {
    const variants = groups.get(product.name) || [];
    variants.push({
      id: product.id,
      material: product.material,
      calculatedPrice: product.calculatedPrice,
      allowFitIn: product.allowFitIn,
      imageUrl: product.imageUrl,
      description: product.description
    });
    groups.set(product.name, variants);
  }
  
  return Array.from(groups.entries()).map(([name, variants]) => ({
    name,
    variants
  }));
}
```

## Data Models

### Prisma Schema Updates

```prisma
model FurnitureProduct {
  id              String   @id @default(cuid())
  name            String
  material        String                          // NEW
  categoryId      String
  pricePerUnit    Float                           // NEW
  pricingType     String   @default("LINEAR")     // NEW: M2 | LINEAR
  length          Float                           // NEW
  width           Float?                          // NEW
  calculatedPrice Float                           // NEW
  allowFitIn      Boolean  @default(false)        // NEW
  imageUrl        String?
  description     String?
  order           Int      @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  category FurnitureCategory          @relation(fields: [categoryId], references: [id])
  mappings FurnitureProductMapping[]  // NEW

  @@index([categoryId])
  @@index([isActive])
}

model FurnitureProductMapping {
  id            String   @id @default(cuid())
  productId     String
  projectName   String                            // TenDuAn
  buildingCode  String                            // MaToaNha
  apartmentType String                            // 1pn, 2pn, 3pn
  createdAt     DateTime @default(now())

  product FurnitureProduct @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, projectName, buildingCode, apartmentType])
  @@index([projectName, buildingCode, apartmentType])
}

model FurnitureFee {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique                    // NEW
  type        String   @default("FIXED")
  value       Float
  description String?
  isActive    Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Product Filtering by Apartment Mapping
*For any* apartment selection (projectName, buildingCode, apartmentType), the system SHALL return only products that have at least one mapping matching all three fields exactly.
**Validates: Requirements 1.4, 1.5**

### Property 2: Product Mapping Integrity
*For any* product with mappings, adding or removing mappings SHALL NOT modify the product's core data (name, material, price, dimensions).
**Validates: Requirements 1.3**

### Property 3: Material Variant Uniqueness
*For any* two products with the same name but different materials, each SHALL have a unique database ID and be stored as separate records.
**Validates: Requirements 2.2**

### Property 4: Product Grouping by Name
*For any* set of products returned to customers, products with the same name SHALL be grouped together with their material variants as selectable options.
**Validates: Requirements 2.3**

### Property 5: Dimension Validation by Pricing Type
*For any* product with pricingType = M2, the system SHALL require both length and width fields. *For any* product with pricingType = LINEAR, the system SHALL require only length field.
**Validates: Requirements 3.2, 3.3**

### Property 6: Calculated Price Formula
*For any* product, calculatedPrice SHALL equal pricePerUnit × length × width (for M2) or pricePerUnit × length (for LINEAR).
**Validates: Requirements 3.4**

### Property 7: Fit-in Fee Per Product
*For any* product with fitInSelected = true, the system SHALL add the FIT_IN_FEE amount to that specific product's price, not to the total quotation.
**Validates: Requirements 4.4, 4.5**

### Property 8: Quotation Item Data Completeness
*For any* quotation item, the stored data SHALL include productId, name, material, calculatedPrice, fitInSelected, fitInFee (if applicable), and quantity.
**Validates: Requirements 8.3**

### Property 9: Quotation Data Persistence Round-Trip
*For any* quotation created with product selections (including material and fit-in choices), retrieving that quotation SHALL return identical product details.
**Validates: Requirements 8.5**

### Property 10: Mapping Unique Constraint
*For any* attempt to create a duplicate mapping (same productId, projectName, buildingCode, apartmentType), the system SHALL reject the operation.
**Validates: Requirements 9.3**

### Property 11: Cascade Delete on Product
*For any* product deletion, all associated mappings SHALL be automatically deleted.
**Validates: Requirements 9.4**

### Property 12: Cascading Filter for Mappings
*For any* project selection, the buildings dropdown SHALL show only buildings belonging to that project. *For any* building selection, the apartmentType dropdown SHALL show only types available in that building.
**Validates: Requirements 6.3, 6.4**

## Error Handling

### Validation Errors

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `PRODUCT_MAPPING_REQUIRED` | Product must have at least one mapping | 400 |
| `MATERIAL_REQUIRED` | Material field is required | 400 |
| `WIDTH_REQUIRED_FOR_M2` | Width is required when pricingType is M2 | 400 |
| `DUPLICATE_MAPPING` | Mapping already exists for this product-apartment combination | 409 |
| `PRODUCT_NOT_FOUND` | Product with given ID not found | 404 |
| `MAPPING_NOT_FOUND` | Mapping with given ID not found | 404 |
| `FIT_IN_FEE_NOT_CONFIGURED` | FIT_IN fee not found in system | 500 |

### Business Logic Errors

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `NO_PRODUCTS_FOR_APARTMENT` | No products mapped to selected apartment | 404 |
| `INVALID_PRICING_TYPE` | pricingType must be M2 or LINEAR | 400 |
| `INVALID_DIMENSIONS` | Dimensions must be positive numbers | 400 |

## Testing Strategy

### Unit Testing

Unit tests sẽ cover các trường hợp cụ thể:

1. **Price Calculation**
   - Test calculateProductPrice với M2 và LINEAR
   - Test edge cases: zero dimensions, negative values

2. **Product Filtering**
   - Test filtering với exact match
   - Test filtering với no matches
   - Test filtering với partial matches (should return empty)

3. **Quotation Calculation**
   - Test với products có và không có Fit-in
   - Test với multiple fees

### Property-Based Testing

Sử dụng **fast-check** library cho TypeScript.

Mỗi property-based test PHẢI:
- Chạy tối thiểu 100 iterations
- Được annotate với comment referencing correctness property
- Sử dụng generators phù hợp cho input space

```typescript
// Example test structure
import fc from 'fast-check';

describe('Furniture Product Mapping', () => {
  // **Feature: furniture-product-mapping, Property 6: Calculated Price Formula**
  // **Validates: Requirements 3.4**
  it('should calculate price correctly based on pricing type', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 1000000 }),  // pricePerUnit
        fc.constantFrom('M2', 'LINEAR'),     // pricingType (M2 = mét vuông, LINEAR = mét dài)
        fc.float({ min: 0.1, max: 100 }),    // length
        fc.float({ min: 0.1, max: 100 }),    // width
        (pricePerUnit, pricingType, length, width) => {
          const result = calculateProductPrice(
            pricePerUnit, 
            pricingType, 
            length, 
            pricingType === 'M2' ? width : undefined
          );
          
          const expected = pricingType === 'M2'
            ? pricePerUnit * length * width
            : pricePerUnit * length;
          
          return Math.abs(result - expected) < 0.01; // Float tolerance
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

1. **API Endpoint Tests**
   - Test CRUD operations cho products và mappings
   - Test filtering với database queries

2. **End-to-End Flow**
   - Test complete quotation flow từ Step 1 đến Step 8
   - Test PDF generation với new data structure

