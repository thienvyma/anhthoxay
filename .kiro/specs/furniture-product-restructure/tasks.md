# Implementation Plan

> **NOTE**: Backend service đã được refactor thành module structure tại `api/src/services/furniture/`:
> - `furniture-quotation.service.ts` - Calculation utilities & quotations (calculateVariantPrice, calculatePriceRange, calculateFitInFee, calculateLineTotal, calculateGrandTotal)
> - `furniture-product.service.ts` - Product CRUD (legacy FurnitureProduct) & mappings (FurnitureProductMapping for FurnitureProductBase)
> - `furniture-category.service.ts` - Category CRUD
> - `furniture-fee.service.ts` - Fee CRUD
> - `furniture-developer.service.ts` - Developer/Project/Building CRUD
> - `furniture-layout.service.ts` - Layout/ApartmentType CRUD
> - `furniture-import-export.service.ts` - CSV import/export
> - `furniture.types.ts` - Shared types
> - `furniture.error.ts` - Error class
> - `index.ts` - Re-exports & FurnitureService facade class
>
> **Facade Pattern**: `FurnitureService` class trong `index.ts` delegate tất cả methods đến các service riêng lẻ để backward compatibility.

- [x] 1. Database Schema Changes
  - [x] 1.1 Create FurnitureProductBase model in Prisma schema
    - Add model with fields: id, name, categoryId, description, imageUrl, allowFitIn, order, isActive
    - Add unique constraint on (name, categoryId)
    - Add relation to FurnitureCategory
    - Add indexes on categoryId and isActive
    - _Requirements: 1.1, 1.3_
  - [x] 1.2 Create FurnitureProductVariant model in Prisma schema
    - Add model with fields: id, productBaseId, materialId, pricePerUnit, pricingType, length, width, calculatedPrice, imageUrl, order, isActive
    - Add unique constraint on (productBaseId, materialId)
    - Add cascade delete on productBase relation
    - Add relation to FurnitureMaterial
    - Add indexes on productBaseId, materialId, isActive
    - _Requirements: 1.2, 1.4, 1.6, 1.8_
  - [x] 1.3 Update FurnitureProductMapping model
    - Change productId to productBaseId
    - Update relation to FurnitureProductBase
    - Update unique constraint
    - _Requirements: 1.5_
  - [x] 1.4 Update FurnitureMaterial model
    - Add variants relation to FurnitureProductVariant[]
    - _Requirements: 1.8_
  - [x] 1.5 Run Prisma generate and push schema
    - Generate Prisma client
    - Push schema changes to database
    - _Requirements: 1.1, 1.2_

- [x] 2. Backend Service - Core Functions (in `furniture-quotation.service.ts`)
  - [x] 2.1 Implement calculateVariantPrice function ✅ DONE
    - Calculate price based on pricingType (LINEAR: pricePerUnit × length, M2: pricePerUnit × length × width)
    - Validate width is provided for M2 type
    - Validate non-negative values for pricePerUnit, length, width
    - _Requirements: 11.1, 4.3_
  - [ ]* 2.2 Write property test for price calculation
    - **Property 5: Price calculation formula correctness**
    - **Validates: Requirements 11.1, 4.3**
  - [x] 2.3 Implement calculatePriceRange function ✅ DONE
    - Calculate min and max calculatedPrice from active variants
    - Handle edge case of no active variants (returns null)
    - _Requirements: 11.2, 6.2_
  - [ ]* 2.4 Write property test for price range calculation
    - **Property 6: Price range calculation**
    - **Validates: Requirements 11.2, 6.2**
  - [x] 2.5 Implement calculateFitInFee function ✅ DONE
    - Calculate fee based on type (FIXED: value, PERCENTAGE: calculatedPrice × value / 100)
    - _Requirements: 11.3, 7.4_
  - [ ]* 2.6 Write property test for Fit-in fee calculation
    - **Property 7: Fit-in fee calculation**
    - **Validates: Requirements 11.3, 7.4**
  - [x] 2.7 Implement calculateLineTotal function ✅ DONE
    - Calculate (calculatedPrice + fitInFee) × quantity
    - _Requirements: 11.4, 7.5_
  - [ ]* 2.8 Write property test for line total calculation
    - **Property 8: Line total calculation**
    - **Validates: Requirements 11.4, 7.5**
  - [x] 2.9 Implement calculateGrandTotal function ✅ DONE
    - Sum subtotal + fitInFeesTotal + other fees
    - _Requirements: 11.5, 8.5_
  - [ ]* 2.10 Write property test for grand total calculation
    - **Property 9: Grand total calculation**
    - **Validates: Requirements 11.5, 8.5**

- [ ] 3. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Backend Service - Product Base CRUD (in `furniture-product.service.ts`)





  - [x] 4.1 Implement createProductBase function


    - Create base with variants in single transaction
    - Auto-calculate calculatedPrice for each variant
    - Validate unique (name, categoryId)
    - Validate at least one variant
    - _Requirements: 3.2, 9.3_
  - [ ]* 4.2 Write property test for transaction atomicity
    - **Property 14: Transaction atomicity for product creation**
    - **Validates: Requirements 9.3**
  - [x] 4.3 Implement getProductBasesGrouped function

    - Return products grouped by ProductBase with nested variants
    - Filter by apartment mapping if provided
    - Exclude inactive variants
    - Include priceRange and variantCount
    - _Requirements: 9.1, 9.7, 4.6_
  - [ ]* 4.4 Write property test for inactive variant filtering
    - **Property 11: Inactive variants excluded from Landing**
    - **Validates: Requirements 4.6, 6.4**
  - [ ]* 4.5 Write property test for mapping-based filtering
    - **Property 12: Mapping-based product filtering**
    - **Validates: Requirements 9.7, 5.3**
  - [x] 4.6 Implement getProductBasesForAdmin function

    - Support pagination, filtering, sorting
    - Include all variants and mappings
    - _Requirements: 9.2_
  - [x] 4.7 Implement updateProductBase function

    - Support partial updates
    - Validate unique constraint on name change
    - _Requirements: 9.4, 3.3_
  - [x] 4.8 Implement deleteProductBase function

    - Check if referenced by quotations
    - Cascade delete variants (handled by Prisma)
    - _Requirements: 9.6, 3.4_




- [x] 5. Backend Service - Variant CRUD (in `furniture-product.service.ts`)


  - [x] 5.1 Implement createVariant function


    - Validate unique (productBaseId, materialId)
    - Auto-calculate calculatedPrice
    - Validate width for M2 type
    - _Requirements: 4.2, 4.3, 4.7_
  - [ ]* 5.2 Write property test for unique constraint
    - **Property 2: Unique constraint on ProductVariant (productBaseId, materialId)**
    - **Validates: Requirements 1.4**
  - [x] 5.3 Implement updateVariant function

    - Recalculate price on dimension changes
    - _Requirements: 4.4_
  - [x] 5.4 Implement deleteVariant function

    - Prevent deletion of last variant
    - _Requirements: 4.5_
  - [ ]* 5.5 Write property test for last variant protection
    - **Property 10: Prevent deletion of last variant**
    - **Validates: Requirements 4.5**

- [ ] 6. Backend Service - Mapping CRUD (in `furniture-product.service.ts`)
  - [x] 6.1 Implement addProductMapping function ✅ DONE (already exists)
    - Validate unique constraint
    - Verify product base exists
    - _Requirements: 5.2_


  - [x] 6.2 Implement bulkCreateMappings function



    - Create mappings for multiple products in single operation
    - _Requirements: 5.5_
  - [x] 6.3 Implement removeProductMapping function ✅ DONE (already exists)
    - _Requirements: 5.4_
  - [x] 6.4 Implement getProductMappings function ✅ DONE (already exists)
    - Get all mappings for a product base
    - _Requirements: 5.1_


- [x] 7. Backend Service - Material Protection (in `furniture.routes.ts` or new `furniture-material.service.ts`)





  - [x] 7.1 Update DELETE /materials endpoint

    - Check if material is referenced by active FurnitureProductVariant
    - Return error if in use: "Không thể xóa chất liệu đang được sử dụng bởi sản phẩm"
    - NOTE: Currently in `api/src/routes/furniture.routes.ts` line ~410
    - _Requirements: 1.7_
  - [ ]* 7.2 Write property test for material deletion protection
    - **Property 4: Prevent material deletion when referenced by variants**
    - **Validates: Requirements 1.7**



- [x] 8. Checkpoint - Make sure all tests are passing



  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. API Routes - Landing Page





  - [x] 9.1 Create GET /api/furniture/products/grouped endpoint


    - Accept query params: categoryId, projectName, buildingCode, apartmentType
    - Return ProductGroup[] with nested variants
    - _Requirements: 9.1, 6.1_
  - [x] 9.2 Update existing /api/furniture/products endpoint


    - Add deprecation warning header
    - Return legacy format for backward compatibility
    - _Requirements: 10.4_

- [x] 10. API Routes - Admin Product Base





  - [x] 10.1 Create GET /api/furniture/admin/products endpoint


    - Support pagination, filtering, sorting
    - _Requirements: 9.2, 3.1_
  - [x] 10.2 Create POST /api/furniture/admin/products endpoint

    - Accept CreateProductBaseInput with variants
    - Return ProductBaseWithDetails
    - _Requirements: 9.3, 3.2_
  - [x] 10.3 Create PUT /api/furniture/admin/products/:id endpoint

    - Support partial updates
    - _Requirements: 9.4, 3.3_
  - [x] 10.4 Create DELETE /api/furniture/admin/products/:id endpoint

    - Check quotation references
    - _Requirements: 9.6, 3.4_

- [x] 11. API Routes - Admin Variants





  - [x] 11.1 Create POST /api/furniture/admin/products/:productBaseId/variants endpoint


    - _Requirements: 9.5, 4.2_
  - [x] 11.2 Create PUT /api/furniture/admin/products/:productBaseId/variants/:variantId endpoint

    - _Requirements: 9.5, 4.4_
  - [x] 11.3 Create DELETE /api/furniture/admin/products/:productBaseId/variants/:variantId endpoint

    - _Requirements: 9.5, 4.5_

- [x] 12. API Routes - Admin Mappings





  - [x] 12.1 Create POST /api/furniture/admin/products/:productBaseId/mappings endpoint


    - _Requirements: 5.2_
  - [x] 12.2 Create POST /api/furniture/admin/products/bulk-mapping endpoint

    - _Requirements: 5.5_
  - [x] 12.3 Create DELETE /api/furniture/admin/products/:productBaseId/mappings/:mappingId endpoint

    - _Requirements: 5.4_



- [x] 13. Checkpoint - Make sure all tests are passing



  - Ensure all tests pass, ask the user if questions arise.



- [x] 14. Data Migration







  - [x] 14.1 Create migration script



    - Group existing FurnitureProduct by (name, categoryId)
    - Create FurnitureProductBase records
    - Map material strings to FurnitureMaterial records (create if not found)
    - Create FurnitureProductVariant records
    - Migrate FurnitureProductMapping to reference ProductBase
    - Log warnings for duplicates
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.8_
  - [ ]* 14.2 Write property test for migration correctness
    - **Property 13: Migration preserves product count**
    - **Validates: Requirements 2.6**
  - [x] 14.3 Add verification step to migration


    - Compare counts before and after
    - Log summary report
    - _Requirements: 2.6_
  - [x] 14.4 Mark legacy FurnitureProduct table as read-only


    - Add comment in schema
    - Update service to not write to legacy table
    - _Requirements: 2.7, 10.3_


- [x] 15. Admin Panel - Product List UI




  - [x] 15.1 Update CatalogTab to use new API


    - Fetch from /api/furniture/admin/products
    - Display ProductBase with variant count and price range
    - _Requirements: 3.1_
  - [x] 15.2 Update ProductGrid component


    - Show variant count badge
    - Show price range (min - max)
    - Add expandable section for variants
    - _Requirements: 3.1, 4.1_
  - [x] 15.3 Add filter by material type

    - Add material dropdown filter
    - _Requirements: 3.5_


- [x] 16. Admin Panel - Product Form UI




  - [x] 16.1 Update ProductForm for ProductBase


    - Remove material field from base form
    - Add variants section
    - _Requirements: 3.2, 3.3_
  - [x] 16.2 Create VariantForm component


    - Material dropdown (from FurnitureMaterial)
    - Price per unit, pricing type, dimensions
    - Auto-calculate preview
    - _Requirements: 4.2, 4.3_
  - [x] 16.3 Add variant management in ProductForm


    - Add/edit/delete variants inline
    - Prevent deletion of last variant
    - Show validation errors
    - _Requirements: 4.2, 4.4, 4.5, 4.7_
  - [x] 16.4 Update delete confirmation modal


    - Show warning about cascade deletion of variants
    - _Requirements: 3.4_



- [x] 17. Admin Panel - Mapping UI




  - [x] 17.1 Update MappingTab to use ProductBase

    - Display mappings at base level
    - _Requirements: 5.1_
  - [x] 17.2 Add bulk mapping feature


    - Multi-select products
    - Single mapping form
    - _Requirements: 5.5_

- [x] 18. Checkpoint - Make sure all tests are passing





  - Ensure all tests pass, ask the user if questions arise.



- [x] 19. Landing Page - Step 7 Updates



  - [x] 19.1 Update API client for grouped products


    - Use new /products/grouped endpoint
    - Update types for ProductGroup
    - _Requirements: 6.1_
  - [x] 19.2 Update product card display


    - Show price range instead of single price
    - Show variant count
    - Add checkmark badge for selected products
    - _Requirements: 6.2, 8.10_
  - [x] 19.3 Create VariantSelectionModal component


    - Display product info (image, name, description)
    - Radio buttons/cards for variant selection
    - Update image when variant with imageUrl is selected
    - Fit-in checkbox with calculated fee
    - Quantity input (1-99)
    - Real-time total calculation
    - Mobile: full-screen drawer from bottom (viewport < 768px)
    - Desktop: centered overlay with max-width 600px
    - Loading skeleton while fetching data
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11_
  - [ ]* 19.4 Write property test for quantity validation
    - **Property 15: Quantity validation**
    - **Validates: Requirements 6.6**
  - [x] 19.5 Update product selection handler

    - Open modal on card click
    - Pre-fill values for existing selection
    - _Requirements: 6.3, 6.8_
  - [x] 19.6 Add search input for products

    - Filter products by name in real-time
    - Debounce 300ms for performance
    - _Requirements: 6.9, 6.10_
  - [ ]* 19.7 Write property test for search filter
    - **Property 16: Search filter correctness**
    - **Validates: Requirements 6.9, 6.10**
  - [x] 19.8 Add empty state component

    - Display friendly message when no products mapped
    - Suggest contacting support
    - _Requirements: 6.11_
  - [ ]* 19.9 Write property test for empty state
    - **Property 17: Empty state when no products mapped**
    - **Validates: Requirements 6.11**

- [x] 20. Landing Page - Step 7.5 (Confirmation)
  - [x] 20.1 Create ConfirmationStep component
    - Display detailed list of selections
    - Show product name, material, Fit-in icon, quantity, unit price, line total
    - _Requirements: 8.1, 8.2_
  - [x] 20.2 Add edit functionality
    - Open VariantSelectionModal with pre-filled values
    - _Requirements: 8.3_
  - [x] 20.3 Add remove functionality with undo
    - Remove item immediately
    - Show undo toast for 5 seconds
    - _Requirements: 8.4_
  - [x] 20.4 Display totals section
    - Subtotal, Fit-in fees, other fees, grand total
    - _Requirements: 8.5_
  - [x] 20.5 Add navigation buttons
    - Back to Step 7 (preserve selections)
    - Confirm & Get Quote (proceed to Step 8)
    - Disable confirm when empty
    - _Requirements: 8.6, 8.7, 8.8_
  - [x] 20.6 Add "Add more products" button
    - Return to Step 7 with selections preserved
    - _Requirements: 8.9_
  - [ ]* 20.7 Write property test for selection preservation
    - **Property 18: Selection preservation on navigation**
    - **Validates: Requirements 8.6, 8.9**

- [x] 21. Landing Page - Step Navigation
  - [x] 21.1 Update step labels and count
    - Add "Xác nhận" step between "Nội thất" and "Báo giá"
    - Update totalSteps to 9
    - _Requirements: 8.1_
  - [x] 21.2 Update step navigation logic
    - Step 7 → Step 7.5 (Confirmation)
    - Step 7.5 → Step 8 (Result)
    - _Requirements: 8.6, 8.7_

- [x] 22. Backward Compatibility
  - [x] 22.1 Update quotation display for legacy products
    - Check if productId references legacy table
    - Display correct product info
    - _Requirements: 10.1_
  - [x] 22.2 Update quotation creation
    - Reference FurnitureProductVariant IDs
    - _Requirements: 10.5_

- [x] 23. Final Checkpoint - Make sure all tests are passing





  - Ensure all tests pass, ask the user if questions arise.

