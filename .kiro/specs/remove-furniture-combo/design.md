# Design: Xóa hoàn toàn Combo khỏi hệ thống báo giá nội thất

## Tổng quan thay đổi

### 1. Database Schema Changes

#### Xóa Models
```prisma
// XÓA HOÀN TOÀN
model FurnitureCombo { ... }
model FurnitureComboItem { ... }
```

#### Cập nhật FurnitureProduct
```prisma
model FurnitureProduct {
  // XÓA dòng này:
  // comboItems FurnitureComboItem[]
}
```

#### Cập nhật FeeApplicability Enum
```prisma
// TRƯỚC
enum FeeApplicability {
  COMBO
  CUSTOM
  BOTH
}

// SAU - Đơn giản hóa, chỉ cần biết fee có active hay không
// Xóa enum này và field applicability trong FurnitureFee
// Hoặc giữ lại với giá trị mặc định là ALL
```

#### Cập nhật FurnitureQuotation
```prisma
model FurnitureQuotation {
  // XÓA các fields:
  // selectionType SelectionType
  // comboId       String?
  // comboName     String?
}

// XÓA enum SelectionType
```

### 2. API Changes

#### Routes to Remove (furniture.routes.ts)
```typescript
// PUBLIC ROUTES - XÓA
app.get('/combos', ...)

// ADMIN ROUTES - XÓA
app.get('/combos', ...)
app.post('/combos', ...)
app.put('/combos/:id', ...)
app.delete('/combos/:id', ...)
app.post('/combos/:id/duplicate', ...)
```

#### Service Methods to Remove (furniture.service.ts)
```typescript
// XÓA các methods:
getCombos()
createCombo()
updateCombo()
deleteCombo()
duplicateCombo()

// XÓA interfaces:
FurnitureComboWithItems
CreateComboItemInput
CreateComboInput
UpdateComboInput
```

#### Schema to Remove (furniture.schema.ts)
```typescript
// XÓA:
comboItemSchema
createComboSchema
updateComboSchema
```

#### Quotation Logic Changes
```typescript
// TRƯỚC: Xử lý cả COMBO và CUSTOM
if (body.selectionType === 'COMBO' && body.comboId) { ... }

// SAU: Chỉ xử lý CUSTOM (products)
// Bỏ toàn bộ logic COMBO
```

### 3. Admin Panel Changes

#### Files to Delete
```
admin/src/app/pages/FurniturePage/ComboTab.tsx
admin/src/app/pages/FurniturePage/components/ComboTable.tsx
admin/src/app/pages/FurniturePage/components/ComboForm.tsx
```

#### FurniturePage/index.tsx Changes
```typescript
// XÓA import
import { ComboTab } from './ComboTab';

// XÓA state
const [combos, setCombos] = useState<FurnitureCombo[]>([]);

// XÓA fetch combos trong useEffect

// XÓA tab object trong tabs array
{
  key: 'combo',
  label: 'Combo',
  icon: 'ri-gift-line',
  content: <ComboTab ... />
}
```

#### api/furniture.ts Changes
```typescript
// XÓA interfaces:
FurnitureComboItem
FurnitureCombo
CreateComboInput
UpdateComboInput
ComboItemInput

// XÓA API object:
furnitureCombosApi

// CẬP NHẬT FurnitureQuotation - xóa fields:
selectionType
comboId
comboName

// CẬP NHẬT FurnitureFee - xóa/đơn giản hóa applicability
```

#### types.ts Changes
```typescript
// XÓA:
FurnitureComboItem
FurnitureCombo
ComboTabProps
CreateComboInput
UpdateComboInput
ComboItemInput
SelectionType (hoặc chỉ giữ 'CUSTOM')

// CẬP NHẬT TabType - xóa 'combo'
export type TabType = 'management' | 'catalog' | 'settings' | 'pdf';

// CẬP NHẬT FeeApplicability - xóa 'COMBO'
```

### 4. Landing Page Changes

#### FurnitureQuote/index.tsx Changes
```typescript
// XÓA state:
const [combos, setCombos] = useState<FurnitureCombo[]>([]);

// XÓA trong selections:
selectionType: null,
combo: null,

// XÓA useEffect fetch combos

// XÓA handlers:
handleSelectionTypeSelect()
handleComboSelect()

// XÓA steps liên quan đến selection type và combo

// CẬP NHẬT flow: apartmentType → products → result
```

#### types.ts Changes
```typescript
// XÓA trong FurnitureSelections:
selectionType: 'COMBO' | 'CUSTOM' | null;
combo: FurnitureCombo | null;

// XÓA import FurnitureCombo
```

#### api/furniture.ts Changes
```typescript
// XÓA:
FurnitureComboItem
FurnitureCombo
getCombos()
```

### 5. Flow Mới (Đơn giản hóa)

```
TRƯỚC:
1. Chọn Developer → Project → Building
2. Chọn Floor → Axis
3. Xem Apartment Type
4. Chọn Selection Type (COMBO hoặc CUSTOM)
5. Nếu COMBO: Chọn combo
   Nếu CUSTOM: Chọn sản phẩm
6. Xem kết quả báo giá

SAU:
1. Chọn Developer → Project → Building
2. Chọn Floor → Axis
3. Xem Apartment Type
4. Chọn sản phẩm (CUSTOM only)
5. Xem kết quả báo giá
```

### 6. Migration Strategy

1. Backup database trước khi migrate
2. Tạo migration xóa tables và columns
3. Chạy `pnpm db:generate` và `pnpm db:push`
4. Quotations cũ với selectionType='COMBO' vẫn giữ nguyên (historical)

### 7. Files Summary

#### Files to DELETE (7 files)
```
admin/src/app/pages/FurniturePage/ComboTab.tsx
admin/src/app/pages/FurniturePage/components/ComboTable.tsx
admin/src/app/pages/FurniturePage/components/ComboForm.tsx
```

#### Files to MODIFY (15+ files)
```
# Database
infra/prisma/schema.prisma
infra/prisma/seed.ts

# API
api/src/routes/furniture.routes.ts
api/src/services/furniture.service.ts
api/src/schemas/furniture.schema.ts
api/src/schemas/index.ts
api/src/services/pdf.service.ts (nếu có logic combo)

# Admin
admin/src/app/pages/FurniturePage/index.tsx
admin/src/app/pages/FurniturePage/types.ts
admin/src/app/pages/FurniturePage/components/index.ts
admin/src/app/api/furniture.ts
admin/src/app/pages/file-size.property.test.ts
admin/src/app/pages/LeadsPage/types.ts
admin/src/app/pages/LeadsPage/components/FurnitureQuotationHistory.tsx (nếu có)

# Landing
landing/src/app/sections/FurnitureQuote/index.tsx
landing/src/app/sections/FurnitureQuote/types.ts
landing/src/app/sections/FurnitureQuote/QuotationResult.tsx
landing/src/app/api/furniture.ts
landing/src/app/pages/QuotationResultPage.tsx (nếu có)

# Tests
api/src/services/furniture.service.property.test.ts
```
