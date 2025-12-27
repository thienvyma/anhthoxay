# Requirements: Xóa hoàn toàn Combo khỏi hệ thống báo giá nội thất

## Mục tiêu
Xóa hoàn toàn tính năng Combo (gói nội thất) khỏi hệ thống báo giá nội thất ở cả Landing page và Admin panel. Sau khi hoàn thành, người dùng chỉ có thể chọn sản phẩm theo cách CUSTOM (tự chọn từng sản phẩm).

## Phạm vi ảnh hưởng

### 1. Database (Prisma Schema)
- [ ] REQ-1.1: Xóa model `FurnitureCombo`
- [ ] REQ-1.2: Xóa model `FurnitureComboItem`
- [ ] REQ-1.3: Xóa relation `comboItems` trong model `FurnitureProduct`
- [ ] REQ-1.4: Cập nhật enum `FeeApplicability` - xóa giá trị `COMBO`, chỉ giữ `CUSTOM` và `BOTH` (hoặc đổi thành `ALL`)
- [ ] REQ-1.5: Cập nhật model `FurnitureQuotation` - xóa fields `selectionType`, `comboId`, `comboName`

### 2. API Backend (api/)
- [ ] REQ-2.1: Xóa tất cả routes `/combos` trong `furniture.routes.ts`
- [ ] REQ-2.2: Xóa các service methods liên quan đến combo trong `furniture.service.ts`
- [ ] REQ-2.3: Xóa các schema liên quan đến combo trong `furniture.schema.ts`
- [ ] REQ-2.4: Cập nhật logic tính quotation - bỏ xử lý COMBO selection type
- [ ] REQ-2.5: Cập nhật logic fees - bỏ filter theo applicability COMBO
- [ ] REQ-2.6: Cập nhật PDF service nếu có logic liên quan đến combo

### 3. Admin Panel (admin/)
- [ ] REQ-3.1: Xóa file `ComboTab.tsx`
- [ ] REQ-3.2: Xóa file `components/ComboTable.tsx`
- [ ] REQ-3.3: Xóa file `components/ComboForm.tsx`
- [ ] REQ-3.4: Xóa tab "Combo" trong `FurniturePage/index.tsx`
- [ ] REQ-3.5: Xóa `furnitureCombosApi` trong `api/furniture.ts`
- [ ] REQ-3.6: Xóa types liên quan đến combo trong `types.ts`
- [ ] REQ-3.7: Cập nhật `components/index.ts` - xóa exports combo
- [ ] REQ-3.8: Cập nhật file-size test - xóa test cho ComboTab

### 4. Landing Page (landing/)
- [ ] REQ-4.1: Xóa state và logic combo trong `FurnitureQuote/index.tsx`
- [ ] REQ-4.2: Xóa step chọn selection type (COMBO/CUSTOM)
- [ ] REQ-4.3: Xóa step chọn combo
- [ ] REQ-4.4: Xóa types liên quan đến combo trong `types.ts`
- [ ] REQ-4.5: Xóa `FurnitureCombo` interface và API call trong `api/furniture.ts`
- [ ] REQ-4.6: Cập nhật `QuotationResult.tsx` - bỏ hiển thị combo info

### 5. Seed Data (infra/prisma/)
- [ ] REQ-5.1: Xóa seed data cho `furnitureCombos` trong `seed.ts`
- [ ] REQ-5.2: Cập nhật seed data cho fees - bỏ applicability COMBO

### 6. Tests
- [ ] REQ-6.1: Xóa/cập nhật tests liên quan đến combo trong `furniture.service.property.test.ts`
- [ ] REQ-6.2: Cập nhật file-size tests

### 7. Documentation
- [ ] REQ-7.1: Cập nhật DAILY_CHANGELOG.md

## Lưu ý quan trọng
1. Cần chạy migration sau khi thay đổi Prisma schema
2. Dữ liệu combo hiện có trong database sẽ bị mất - cần backup nếu cần
3. Quotations cũ có selectionType = 'COMBO' vẫn giữ nguyên trong database (historical data)
4. Sau khi xóa, flow báo giá sẽ đơn giản hơn: chọn căn hộ → chọn sản phẩm → xem kết quả
