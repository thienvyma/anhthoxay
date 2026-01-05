# Implementation Plan

## Phase 1: Database Schema Updates

- [x] 1. Update Prisma schema for FurnitureProduct model




  - [x] 1.1 Add new fields to FurnitureProduct: material, pricePerUnit, pricingType, length, width, calculatedPrice, allowFitIn

    - Add `material String` field (required)
    - Add `pricePerUnit Float` field (required)
    - Add `pricingType String @default("LINEAR")` field
    - Add `length Float` field (required)
    - Add `width Float?` field (optional, for M2)
    - Add `calculatedPrice Float` field (required)
    - Add `allowFitIn Boolean @default(false)` field
    - _Requirements: 9.1_

  - [x] 1.2 Create FurnitureProductMapping model
    - Create model with fields: id, productId, projectName, buildingCode, apartmentType, createdAt
    - Add relation to FurnitureProduct with onDelete: Cascade
    - Add unique constraint on (productId, projectName, buildingCode, apartmentType)
    - Add index on (projectName, buildingCode, apartmentType)

    - _Requirements: 9.2, 9.3_
  - [x] 1.3 Update FurnitureFee model with code field
    - Add `code String @unique` field
    - _Requirements: 4.2_
  - [x] 1.4 Run Prisma migration



    - Generate migration: `pnpm db:generate`
    - Push schema: `pnpm db:push`
    - _Requirements: 9.1, 9.2_

## Phase 2: Backend Service Layer


- [x] 2. Implement price calculation utilities



  - [x] 2.1 Create calculateProductPrice function in furniture.service.ts


    - Implement M2 calculation: pricePerUnit × length × width
    - Implement LINEAR calculation: pricePerUnit × length
    - Add validation for required width when pricingType = M2
    - _Requirements: 3.4_

  - [x] 2.2 Write property test for price calculation (Property 6)

    - **Property 6: Calculated Price Formula**
    - **Validates: Requirements 3.4**
    - Test with random pricePerUnit, pricingType, length, width values
    - Verify formula correctness for both M2 and LINEAR

- [x] 3. Implement product CRUD with new fields





  - [x] 3.1 Update createProduct function


    - Add validation for required fields: material, pricePerUnit, pricingType, length
    - Add conditional validation: width required when pricingType = M2
    - Calculate and store calculatedPrice before saving
    - Require at least one mapping when creating product
    - _Requirements: 2.1, 3.1, 3.2, 3.3, 1.1_

  - [x] 3.2 Write property test for dimension validation (Property 5)

    - **Property 5: Dimension Validation by Pricing Type**
    - **Validates: Requirements 3.2, 3.3**
    - Test M2 products require width, LINEAR products don't
  - [x] 3.3 Update updateProduct function


    - Recalculate calculatedPrice when dimensions change
    - _Requirements: 3.4_

  - [x] 3.4 Update getProducts function to include mappings

    - Include mappings relation in query
    - _Requirements: 1.2_

- [x] 4. Implement product mapping CRUD








  - [x] 4.1 Create addProductMapping function


    - Validate product exists
    - Check for duplicate mapping (unique constraint)
    - Create mapping record
    - _Requirements: 10.3_
  - [x] 4.2 Create removeProductMapping function

    - Validate mapping exists
    - Delete mapping without affecting product
    - _Requirements: 10.4, 1.3_
  - [x] 4.3 Write property test for mapping integrity (Property 2)


    - **Property 2: Product Mapping Integrity**
    - **Validates: Requirements 1.3**
    - Test adding/removing mappings doesn't modify product data
  - [x] 4.4 Create getProductMappings function

    - Return all mappings for a product
    - _Requirements: 10.5_



- [x] 5. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Product Filtering by Apartment



- [x] 6. Implement product filtering logic



  - [x] 6.1 Update getProducts to filter by apartment mapping


    - Accept optional query params: projectName, buildingCode, apartmentType
    - Filter products that have matching mappings
    - Normalize apartmentType to lowercase
    - _Requirements: 1.4, 10.1_
  - [x] 6.2 Write property test for product filtering (Property 1)


    - **Property 1: Product Filtering by Apartment Mapping**
    - **Validates: Requirements 1.4, 1.5**
    - Test only products with matching mappings are returned
  - [x] 6.3 Implement product grouping by name


    - Group products with same name
    - Return material variants as array
    - _Requirements: 2.3_

  - [x] 6.4 Write property test for product grouping (Property 4)

    - **Property 4: Product Grouping by Name**
    - **Validates: Requirements 2.3**
    - Test products with same name are grouped together

## Phase 4: Fit-in Fee Implementation



- [x] 7. Implement Fit-in fee logic







  - [x] 7.1 Create FIT_IN fee in database (seed or migration)


    - Create fee with code = "FIT_IN", type = "FIXED"
    - _Requirements: 4.2_
  - [x] 7.2 Update quotation calculation to include Fit-in per product


    - Get FIT_IN fee from database
    - Add fee to individual product price when fitInSelected = true
    - _Requirements: 4.4, 4.5_
  - [x] 7.3 Write property test for Fit-in fee calculation (Property 7)


    - **Property 7: Fit-in Fee Per Product**
    - **Validates: Requirements 4.4, 4.5**
    - Test Fit-in fee is added to individual product, not total



- [x] 8. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: API Routes





- [x] 9. Update public API routes

  - [x] 9.1 Update GET /api/furniture/products endpoint


    - Accept query params: projectName, buildingCode, apartmentType
    - Return grouped products with material variants
    - Include calculatedPrice, allowFitIn in response
    - _Requirements: 10.1, 3.5_

- [x] 10. Create admin API routes for mappings



  - [x] 10.1 Create POST /api/admin/furniture/products/:id/mappings


    - Validate request body with Zod schema
    - Call addProductMapping service
    - _Requirements: 10.3_

  - [x] 10.2 Create DELETE /api/admin/furniture/products/:id/mappings/:mappingId
    - Validate product and mapping exist
    - Call removeProductMapping service
    - _Requirements: 10.4_

  - [x] 10.3 Create GET /api/admin/furniture/products/:id/mappings
    - Return all mappings for product

    - _Requirements: 10.5_
  - [x] 10.4 Update POST /api/admin/furniture/products


    - Validate new fields in request body
    - Require at least one mapping
    - _Requirements: 10.2, 1.1_


- [x] 11. Create Zod validation schemas
















  - [x] 11.1 Create ProductMappingSchema



    - projectName: string (required)
    - buildingCode: string (required)
    - apartmentType: string (required)
    - _Requirements: 10.3_



  - [x] 11.2 Update CreateProductSchema

    - Add material, pricePerUnit, pricingType, length, width, allowFitIn
    - Add mappings array (min 1)
    - Add conditional validation for width
    - _Requirements: 10.2_

## Phase 6: Admin UI Updates


- [x] 12. Update Product Form in Admin




  - [x] 12.1 Add new fields to ProductForm component


    - Add material input field
    - Add pricePerUnit input field
    - Add pricingType select (M2 / LINEAR)
    - Add length input field
    - Add width input field (conditional, show only for M2)
    - Add allowFitIn checkbox
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 12.2 Add calculated price preview
    - Calculate and display preview price before saving
    - Update preview when dimensions change
    - _Requirements: 5.4, 5.5_
  - [x] 12.3 Add mappings section to ProductForm



    - Display current mappings list
    - Add "Add Mapping" button
    - Add delete button for each mapping
    - _Requirements: 6.1_


- [x] 13. Create Mapping Form Modal






  - [x] 13.1 Create AddMappingModal component

    - Project dropdown (fetch from API)
    - Building dropdown (filtered by selected project)
    - ApartmentType dropdown (filtered by selected building)
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 13.2 Write property test for cascading filters (Property 12)

    - **Property 12: Cascading Filter for Mappings**
    - **Validates: Requirements 6.3, 6.4**
    - Test buildings filtered by project, types filtered by building

- [x] 14. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Landing Page Updates

- [x] 15. Update Step 7 (Product Selection)





  - [x] 15.1 Update product fetching to include apartment filters


    - Pass projectName, buildingCode, apartmentType from previous steps
    - Fetch only mapped products
    - _Requirements: 7.1_

  - [x] 15.2 Update product display to show material variants

    - Group products by name
    - Show material selector for each product group
    - _Requirements: 7.2_
  - [x] 15.3 Add Fit-in toggle for eligible products

    - Show toggle only when allowFitIn = true
    - Update displayed price when toggled
    - _Requirements: 7.3, 7.4_
  - [x] 15.4 Update product selection state

    - Store selected material variant
    - Store Fit-in selection
    - _Requirements: 7.5_

- [x] 16. Update Quotation Creation








  - [x] 16.1 Update quotation items structure

    - Include material, calculatedPrice, fitInSelected, fitInFee

    - _Requirements: 8.3_
  - [x] 16.2 Write property test for quotation item structure (Property 8)



    - **Property 8: Quotation Item Data Completeness**
    - **Validates: Requirements 8.3**
    - Test all required fields are present in quotation items
  - [x] 16.3 Update price breakdown display


    - Show base product prices
    - Show individual Fit-in fees
    - Show other fees separately
    - _Requirements: 8.4_

## Phase 8: Quotation Persistence

- [x] 17. Update quotation storage






  - [x] 17.1 Update FurnitureQuotation items JSON structure

    - Store material, calculatedPrice, fitInSelected, fitInFee for each item
    - _Requirements: 8.5_

  - [x] 17.2 Write property test for quotation round-trip (Property 9)

    - **Property 9: Quotation Data Persistence Round-Trip**
    - **Validates: Requirements 8.5**
    - Test creating and retrieving quotation returns identical data

- [x] 18. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Additional Property Tests



- [x] 19. Write remaining property tests







  - [x] 19.1 Write property test for material variant uniqueness (Property 3)



    - **Property 3: Material Variant Uniqueness**
    - **Validates: Requirements 2.2**
    - Test products with same name but different materials have unique IDs

  - [x] 19.2 Write property test for mapping unique constraint (Property 10)

    - **Property 10: Mapping Unique Constraint**
    - **Validates: Requirements 9.3**
    - Test duplicate mappings are rejected
  - [x] 19.3 Write property test for cascade delete (Property 11)


    - **Property 11: Cascade Delete on Product**
    - **Validates: Requirements 9.4**
    - Test deleting product also deletes all mappings
