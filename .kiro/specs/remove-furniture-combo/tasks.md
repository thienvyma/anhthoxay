# Implementation Plan

## Xóa hoàn toàn Combo khỏi hệ thống báo giá nội thất

- [x] 1. Xóa Combo Files trong Admin
  - Xóa các file component liên quan đến Combo để tránh import errors khi cập nhật các file khác
  - _Requirements: REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 1.1 Xóa file ComboTab.tsx
  - Xóa file `admin/src/app/pages/FurniturePage/ComboTab.tsx`
  - _Requirements: REQ-3.1_

- [x] 1.2 Xóa file ComboTable.tsx
  - Xóa file `admin/src/app/pages/FurniturePage/components/ComboTable.tsx`
  - _Requirements: REQ-3.2_

- [x] 1.3 Xóa file ComboForm.tsx
  - Xóa file `admin/src/app/pages/FurniturePage/components/ComboForm.tsx`
  - _Requirements: REQ-3.3_

- [x] 2. Cập nhật Admin FurniturePage
  - Cập nhật index.tsx, types.ts và components/index.ts để xóa references đến Combo
  - _Requirements: REQ-3.4, REQ-3.6, REQ-3.7_

- [x] 2.1 Cập nhật FurniturePage/index.tsx
  - Xóa import ComboTab
  - Xóa state `combos` và `setCombos`
  - Xóa fetch combos trong useEffect
  - Xóa tab object "Combo" trong tabs array
  - _Requirements: REQ-3.4_

- [x] 2.2 Cập nhật FurniturePage/types.ts
  - Xóa types: `FurnitureCombo`, `FurnitureComboItem`, `ComboTabProps`, `CreateComboInput`, `UpdateComboInput`, `ComboItemInput`
  - Cập nhật `TabType` - xóa 'combo'
  - Cập nhật `FeeApplicability` - xóa 'COMBO'
  - Cập nhật `SelectionType` - xóa hoặc chỉ giữ 'CUSTOM'
  - Cập nhật `FurnitureQuotation` - xóa fields combo
  - _Requirements: REQ-3.6_

- [x] 2.3 Cập nhật components/index.ts
  - Xóa exports liên quan đến combo (ComboTable, ComboForm)
  - _Requirements: REQ-3.7_

- [x] 3. Cập nhật Admin API Client
  - Cập nhật file `admin/src/app/api/furniture.ts` để xóa combo APIs và types
  - _Requirements: REQ-3.5_

- [x] 3.1 Xóa combo interfaces và API object
  - Xóa interfaces: `FurnitureComboItem`, `FurnitureCombo`, `CreateComboInput`, `UpdateComboInput`, `ComboItemInput`
  - Xóa `furnitureCombosApi` object
  - _Requirements: REQ-3.5_

- [x] 3.2 Cập nhật quotation và fee types
  - Cập nhật `FurnitureQuotation` - xóa fields `selectionType`, `comboId`, `comboName`
  - Cập nhật `FurnitureFee` - xóa/đơn giản hóa `applicability`
  - Cập nhật `CreateFeeInput`, `UpdateFeeInput` - xóa applicability COMBO option
  - _Requirements: REQ-3.5_

- [x] 4. Cập nhật Landing FurnitureQuote
  - Cập nhật flow báo giá để bỏ selection type và combo
  - _Requirements: REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4, REQ-4.5_

- [x] 4.1 Cập nhật FurnitureQuote/index.tsx
  - Xóa state `combos`
  - Xóa `selectionType` và `combo` trong selections state
  - Xóa useEffect fetch combos
  - Xóa handlers `handleSelectionTypeSelect`, `handleComboSelect`
  - Cập nhật flow steps - bỏ step chọn selection type và combo
  - Cập nhật submit logic - bỏ xử lý COMBO
  - _Requirements: REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 4.2 Cập nhật FurnitureQuote/types.ts
  - Xóa `FurnitureCombo` import và interface
  - Cập nhật `FurnitureSelections` - xóa `selectionType`, `combo`
  - _Requirements: REQ-4.4_

- [x] 4.3 Cập nhật landing api/furniture.ts
  - Xóa `FurnitureComboItem`, `FurnitureCombo` interfaces
  - Xóa `getCombos` API call
  - _Requirements: REQ-4.5_

- [x] 5. Cập nhật QuotationResult
  - Cập nhật hiển thị kết quả báo giá để bỏ combo info
  - _Requirements: REQ-4.6_

- [x] 5.1 Cập nhật QuotationResult.tsx
  - Xóa hiển thị combo info trong QuotationResult
  - Cập nhật types/props nếu cần
  - _Requirements: REQ-4.6_

- [x] 5.2 Cập nhật QuotationResultPage.tsx (nếu có)
  - Xóa logic liên quan đến combo
  - _Requirements: REQ-4.6_

- [x] 6. Cập nhật Admin LeadsPage
  - Cập nhật hiển thị quotation history để bỏ combo info
  - _Requirements: REQ-3.6_

- [x] 6.1 Cập nhật LeadsPage types và components
  - Cập nhật `FurnitureQuotationData` type - xóa fields combo
  - Cập nhật hiển thị quotation history - bỏ combo info
  - _Requirements: REQ-3.6_

- [x] 7. Xóa Combo API Routes và Service
  - Xóa routes và service methods liên quan đến combo trong API
  - _Requirements: REQ-2.1, REQ-2.2, REQ-2.3_

- [x] 7.1 Xóa combo routes trong furniture.routes.ts
  - Xóa routes `/combos` (GET, POST, PUT, DELETE, duplicate) trong public và admin sections
  - Xóa import `createComboSchema`, `updateComboSchema`
  - _Requirements: REQ-2.1_

- [x] 7.2 Xóa combo service methods
  - Xóa methods `getCombos`, `createCombo`, `updateCombo`, `deleteCombo`, `duplicateCombo`
  - Xóa interfaces `FurnitureComboWithItems`, `CreateComboItemInput`, `CreateComboInput`, `UpdateComboInput`
  - _Requirements: REQ-2.2_

- [x] 7.3 Xóa combo schemas
  - Xóa schemas `comboItemSchema`, `createComboSchema`, `updateComboSchema`
  - Cập nhật exports trong `schemas/index.ts`
  - _Requirements: REQ-2.3_

- [x] 8. Cập nhật Quotation Logic trong API
  - Cập nhật logic tạo quotation và fees để bỏ xử lý COMBO
  - _Requirements: REQ-2.4, REQ-2.5_

- [x] 8.1 Cập nhật quotation schema và route
  - Cập nhật `createQuotationSchema` - xóa fields `selectionType`, `comboId`, `comboName`
  - Cập nhật route POST `/quotations` - bỏ logic xử lý COMBO selection
  - _Requirements: REQ-2.4_

- [x] 8.2 Cập nhật quotation service
  - Cập nhật `createQuotation` service method - bỏ logic COMBO
  - Cập nhật `getFees` - bỏ filter theo applicability COMBO
  - _Requirements: REQ-2.4, REQ-2.5_

- [x] 9. Cập nhật Seed Data
  - Xóa seed data liên quan đến combo
  - _Requirements: REQ-5.1, REQ-5.2_

- [x] 9.1 Cập nhật seed.ts
  - Xóa seed data cho `furnitureCombos`
  - Xóa seed data cho `furnitureComboItem`
  - Cập nhật seed data cho fees - bỏ applicability COMBO
  - _Requirements: REQ-5.1, REQ-5.2_

- [x] 10. Cập nhật Prisma Schema
  - Cập nhật database schema để xóa models và fields liên quan đến combo
  - _Requirements: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4, REQ-1.5_

- [x] 10.1 Xóa combo models
  - Xóa model `FurnitureComboItem`
  - Xóa model `FurnitureCombo`
  - Xóa relation `comboItems` trong model `FurnitureProduct`
  - _Requirements: REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 10.2 Cập nhật enums và FurnitureQuotation
  - Xóa enum `SelectionType`
  - Cập nhật enum `FeeApplicability` - xóa `COMBO`
  - Cập nhật model `FurnitureQuotation` - xóa fields `selectionType`, `comboId`, `comboName`
  - _Requirements: REQ-1.4, REQ-1.5_

- [x] 11. Cập nhật Tests và Cleanup
  - Cập nhật test files và cleanup các file còn sót combo references
  - _Requirements: REQ-6.1, REQ-6.2_

- [x] 11.1 Cleanup admin/src/app/api.ts exports
  - Xóa `furnitureCombosApi` export (không còn tồn tại trong api/furniture.ts)
  - Xóa `FurnitureCombo`, `FurnitureComboItem` type exports
  - _Requirements: REQ-3.5_

- [x] 11.2 Cập nhật property tests (api/src/services/furniture.service.property.test.ts)
  - Xóa mock cho `furnitureCombo` và `furnitureComboItem` trong createMockPrisma()
  - Xóa generators: `feeApplicabilityGen`, `selectionTypeGen`, `comboNameGen`
  - Xóa toàn bộ describe block "Property 6: Combo Duplication"
  - Xóa describe block "Property 7: Fee Calculation Correctness" (sử dụng selectionType)
  - Cập nhật các generators còn lại để bỏ COMBO references
  - _Requirements: REQ-6.1_

- [x] 11.3 Cập nhật file-size tests (admin/src/app/pages/file-size.property.test.ts)
  - Xóa test "ComboTab.tsx should be under 500 lines"
  - Xóa 'ComboTable.tsx', 'ComboForm.tsx' từ expectedComponents list
  - _Requirements: REQ-6.2_

- [x] 12. Cleanup PDF Service và Settings


  - Xóa logic hiển thị combo trong PDF service
  - _Requirements: REQ-2.6_

- [x] 12.1 Cập nhật pdf.service.ts


  - Xóa logic kiểm tra `selectionType === 'COMBO'`
  - Xóa hiển thị `comboName` trong PDF
  - Đơn giản hóa section "SELECTION TYPE" - chỉ hiển thị "Tùy chọn sản phẩm"
  - _Requirements: REQ-2.6_

- [x] 13. Checkpoint - Chạy Migration và Verify


  - Ensure all tests pass, ask the user if questions arise.

- [x] 13.1 Chạy database migration


  - Chạy `pnpm db:generate`
  - Chạy `pnpm db:push`
  - _Requirements: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4, REQ-1.5_

- [x] 13.2 Chạy lint và typecheck


  - Chạy `pnpm nx run-many --target=lint --all`
  - Chạy `pnpm nx run-many --target=typecheck --all`
  - _Requirements: All_

- [x] 13.3 Chạy tests


  - Chạy `pnpm nx run-many --target=test --all`
  - _Requirements: REQ-6.1, REQ-6.2_

- [x] 14. Cập nhật Documentation


  - Cập nhật changelog để ghi nhận các thay đổi
  - _Requirements: REQ-7.1_

- [x] 14.1 Cập nhật DAILY_CHANGELOG.md


  - Ghi nhận các files đã xóa
  - Ghi nhận các files đã sửa
  - _Requirements: REQ-7.1_

- [x] 15. Final Checkpoint - Verify hoàn thành



  - Ensure all tests pass, ask the user if questions arise.
