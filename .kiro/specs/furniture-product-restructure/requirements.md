# Requirements Document

## Introduction

Tái cấu trúc hệ thống sản phẩm nội thất (Furniture Product) để chuẩn hóa database, tách biệt sản phẩm gốc (ProductBase) và biến thể chất liệu (ProductVariant). Đồng thời cải tiến UI/UX trên Landing page với flow chọn sản phẩm mới và thêm step xác nhận trước khi tạo báo giá.

**Scope**: Tập trung vào restructure database và cải tiến UX. Draft Quotation (lưu nháp) sẽ được tách thành spec riêng.

## Glossary

- **FurnitureProductBase**: Sản phẩm nội thất gốc, chứa thông tin chung (tên, danh mục, mô tả, cho phép Fit-in). Unique theo (name, categoryId).
- **FurnitureProductVariant**: Biến thể của sản phẩm theo chất liệu, chứa thông tin giá và kích thước. Liên kết với FurnitureMaterial.
- **FurnitureMaterial**: Danh mục chất liệu (Gỗ sồi, MDF, Da thật...). Đã tồn tại trong schema hiện tại.
- **ProductMapping**: Liên kết sản phẩm với căn hộ (Project + Building + ApartmentType). Chuyển từ variant-level sang base-level.
- **Fit-in**: Dịch vụ lắp đặt tại chỗ, tính phí bổ sung
- **Landing Page**: Trang công khai cho khách hàng tạo báo giá nội thất
- **Admin Panel**: Trang quản trị cho ADMIN/MANAGER quản lý sản phẩm
- **Legacy FurnitureProduct**: Model cũ, sẽ được giữ lại read-only cho backward compatibility

## Requirements

### Requirement 1: Database Schema Restructure

**User Story:** As a system administrator, I want the furniture product data to be normalized, so that I can manage products and their material variants efficiently without data duplication.

#### Acceptance Criteria

1. WHEN the system stores a furniture product THEN the FurnitureProductBase model SHALL contain only common product information (name, categoryId, description, imageUrl, allowFitIn, order, isActive)
2. WHEN the system stores material variants THEN the FurnitureProductVariant model SHALL contain variant-specific information (productBaseId, materialId, pricePerUnit, pricingType, length, width, calculatedPrice, imageUrl, order, isActive)
3. WHEN a product base is created THEN the system SHALL enforce a unique constraint on (name, categoryId) combination to prevent duplicate product names within the same category
4. WHEN a product variant is created THEN the system SHALL enforce a unique constraint on (productBaseId, materialId) combination to prevent duplicate material variants
5. WHEN product mappings are stored THEN the FurnitureProductMapping model SHALL reference FurnitureProductBase instead of individual variants
6. WHEN a FurnitureProductBase is deleted THEN the system SHALL cascade delete all associated FurnitureProductVariant records
7. WHEN a FurnitureMaterial is referenced by active variants THEN the system SHALL prevent deletion of that material with a clear error message
8. WHEN a FurnitureProductVariant references a material THEN the system SHALL use the existing FurnitureMaterial model via materialId foreign key

### Requirement 2: Data Migration

**User Story:** As a system administrator, I want existing product data to be migrated to the new schema, so that no data is lost during the restructure.

#### Acceptance Criteria

1. WHEN migration runs THEN the system SHALL create FurnitureProductBase records by grouping existing products by (name, categoryId) combination
2. WHEN migration runs THEN the system SHALL create FurnitureProductVariant records for each unique (productBaseId, materialId) combination
3. WHEN migration runs THEN the system SHALL map material strings to existing FurnitureMaterial records, creating new materials if not found
4. WHEN migration runs THEN the system SHALL preserve all existing product mappings by linking them to the new FurnitureProductBase records
5. WHEN migration runs THEN the system SHALL preserve all pricing information (pricePerUnit, pricingType, length, width, calculatedPrice)
6. WHEN migration completes THEN the system SHALL verify data integrity by comparing total product counts before and after
7. WHEN migration completes THEN the system SHALL keep the legacy FurnitureProduct table read-only for historical quotation references
8. WHEN migration encounters duplicate (name, categoryId) with different data THEN the system SHALL log a warning and merge variants under the first encountered base

### Requirement 3: Admin Panel - Product Base Management

**User Story:** As an admin/manager, I want to manage base products separately from their variants, so that I can efficiently organize the product catalog.

#### Acceptance Criteria

1. WHEN viewing the catalog THEN the Admin Panel SHALL display a list of FurnitureProductBase with variant count and price range for each
2. WHEN creating a new product base THEN the Admin Panel SHALL require name, categoryId, and at least one variant with material and pricing
3. WHEN editing a product base THEN the Admin Panel SHALL allow updating common fields (name, description, imageUrl, allowFitIn, order, isActive)
4. WHEN deleting a product base THEN the Admin Panel SHALL show confirmation with warning about cascade deletion of all variants
5. WHEN filtering products THEN the Admin Panel SHALL support filtering by category, active status, and material type
6. WHEN a product base name conflicts with existing THEN the Admin Panel SHALL show validation error before submission

### Requirement 4: Admin Panel - Variant Management

**User Story:** As an admin/manager, I want to manage material variants for each product, so that I can offer different material options with different prices.

#### Acceptance Criteria

1. WHEN viewing a product base THEN the Admin Panel SHALL display all variants with material name, price, dimensions, and status in an expandable section
2. WHEN adding a variant THEN the Admin Panel SHALL require materialId (from FurnitureMaterial dropdown), pricePerUnit, pricingType, and length (width required for M2 type)
3. WHEN adding a variant THEN the system SHALL auto-calculate calculatedPrice based on pricePerUnit and dimensions in real-time
4. WHEN editing a variant THEN the Admin Panel SHALL allow updating all variant fields including optional variant-specific imageUrl
5. WHEN deleting a variant THEN the Admin Panel SHALL prevent deletion if it is the last variant of a product base with a clear error message
6. WHEN a variant is toggled inactive THEN the system SHALL exclude it from Landing page product selection
7. WHEN adding a variant with duplicate materialId THEN the Admin Panel SHALL show validation error

### Requirement 5: Admin Panel - Product Mapping

**User Story:** As an admin/manager, I want to map products to specific apartments, so that only relevant products appear for each apartment type.

#### Acceptance Criteria

1. WHEN viewing product mappings THEN the Admin Panel SHALL display mappings at the ProductBase level (not variant level)
2. WHEN adding a mapping THEN the Admin Panel SHALL require projectName, buildingCode, and apartmentType with autocomplete from existing data
3. WHEN a mapping is added to ProductBase THEN all active variants of that product SHALL be available for the mapped apartment
4. WHEN removing a mapping THEN the Admin Panel SHALL show confirmation before deletion
5. WHEN bulk mapping THEN the Admin Panel SHALL support selecting multiple products to map to the same apartment in a single operation

### Requirement 6: Landing Page - Product Selection UI (Step 7)

**User Story:** As a customer, I want to browse and select furniture products with an intuitive interface, so that I can easily choose products and their material variants.

#### Acceptance Criteria

1. WHEN viewing Step 7 THEN the Landing Page SHALL display products grouped by ProductBase (not individual variants)
2. WHEN a product card is displayed THEN the system SHALL show product name, category, image, price range (min-max of variants), and number of available variants
3. WHEN clicking on a product card THEN the system SHALL open a modal/drawer for variant selection
4. WHEN the variant selection modal opens THEN the system SHALL display all active variants with material name, price, and optional variant image
5. WHEN selecting a variant THEN the customer SHALL be able to toggle Fit-in option (if allowFitIn is true on the base product)
6. WHEN selecting a variant THEN the customer SHALL be able to set quantity (minimum 1, maximum 99)
7. WHEN confirming selection THEN the system SHALL add the product to the selection list with chosen variant, Fit-in status, and quantity
8. WHEN a product is already selected THEN clicking the card SHALL open the modal with current selection pre-filled for editing
9. WHEN viewing Step 7 THEN the system SHALL provide a search input to filter products by name in real-time
10. WHEN searching THEN the system SHALL filter products as user types with debounce of 300ms to optimize performance
11. WHEN no products are mapped to the selected apartment THEN the system SHALL display a friendly empty state message with contact support suggestion

### Requirement 7: Landing Page - Variant Selection Modal

**User Story:** As a customer, I want a clear interface to choose material variants and options, so that I can make informed decisions about my furniture selection.

#### Acceptance Criteria

1. WHEN the modal opens THEN the system SHALL display product base image, name, description, and category
2. WHEN displaying variants THEN the system SHALL show radio buttons or cards for each variant with material name, calculated price, and dimensions
3. WHEN a variant has a specific imageUrl THEN the system SHALL update the modal image when that variant is selected
4. WHEN Fit-in is available THEN the system SHALL display a checkbox with the Fit-in fee amount calculated based on fee type (FIXED or PERCENTAGE)
5. WHEN quantity changes THEN the system SHALL update the total price in real-time including Fit-in fee if selected
6. WHEN clicking "Add to list" THEN the system SHALL validate that a variant is selected before adding
7. WHEN clicking outside the modal or pressing Escape THEN the system SHALL close the modal without adding
8. WHEN no variants are available THEN the modal SHALL display a message and disable the add button
9. WHEN the modal opens on mobile devices (viewport width less than 768px) THEN the system SHALL display the modal as a full-screen drawer sliding from bottom
10. WHEN the modal opens on desktop devices THEN the system SHALL display the modal as a centered overlay with max-width 600px
11. WHEN loading variant data THEN the modal SHALL display a loading skeleton until data is ready

### Requirement 8: Landing Page - Confirmation Step (Step 7.5)

**User Story:** As a customer, I want to review and confirm my furniture selections before getting a quotation, so that I can verify my choices and make adjustments if needed.

#### Acceptance Criteria

1. WHEN navigating from Step 7 to Step 7.5 THEN the system SHALL display a detailed summary of all selected products
2. WHEN displaying each selection THEN the system SHALL show product name, material name, Fit-in status (with icon), quantity, unit price, and line total
3. WHEN clicking "Edit" on a selection THEN the system SHALL open the variant selection modal with current values pre-filled
4. WHEN clicking "Remove" on a selection THEN the system SHALL remove the item immediately with undo option (5 seconds)
5. WHEN displaying totals THEN the system SHALL show subtotal (products only), Fit-in fees total, other fees breakdown, and grand total
6. WHEN clicking "Back" THEN the system SHALL return to Step 7 with all selections preserved
7. WHEN clicking "Confirm & Get Quote" THEN the system SHALL proceed to Step 8 (Quotation Result)
8. WHEN the selection list is empty THEN the system SHALL disable the confirm button and show a message to add products
9. WHEN clicking "Add more products" button THEN the system SHALL return to Step 7 with all current selections preserved
10. WHEN returning to Step 7 from Step 7.5 THEN the system SHALL highlight previously selected products with a visual indicator (checkmark badge)

### Requirement 9: API Endpoints

**User Story:** As a developer, I want well-structured API endpoints for the new product schema, so that I can integrate the frontend with the backend efficiently.

#### Acceptance Criteria

1. WHEN fetching products for Landing THEN the API SHALL return products grouped by ProductBase with nested variants array
2. WHEN fetching products for Admin THEN the API SHALL support pagination, filtering by category/material/status, and sorting by name/price/order
3. WHEN creating a product base THEN the API SHALL accept variants array and create all in a single transaction with rollback on failure
4. WHEN updating a product base THEN the API SHALL support partial updates without affecting variants unless explicitly included
5. WHEN managing variants THEN the API SHALL provide separate endpoints for CRUD operations on variants with proper validation
6. WHEN deleting a product base THEN the API SHALL return error if referenced by existing quotations (soft delete recommended)
7. WHEN fetching products with apartment filter THEN the API SHALL filter by ProductBase mappings and return all active variants

### Requirement 10: Backward Compatibility

**User Story:** As a system administrator, I want the migration to maintain backward compatibility, so that existing quotations and reports remain accurate.

#### Acceptance Criteria

1. WHEN viewing existing quotations THEN the system SHALL display correct product information from the legacy FurnitureProduct table
2. WHEN generating reports THEN the system SHALL correctly aggregate data from both old and new schema periods
3. WHEN the old FurnitureProduct table is deprecated THEN the system SHALL keep it read-only for historical reference
4. WHEN API clients use old endpoints THEN the system SHALL return data in the expected format with deprecation warning header
5. WHEN new quotations are created THEN the system SHALL reference FurnitureProductVariant IDs for future-proof data integrity

### Requirement 11: Price Calculation

**User Story:** As a system administrator, I want consistent price calculation across the system, so that customers see accurate pricing.

#### Acceptance Criteria

1. WHEN a variant is created or updated THEN the system SHALL auto-calculate calculatedPrice as pricePerUnit × length (for LINEAR) or pricePerUnit × length × width (for M2)
2. WHEN displaying price range on product card THEN the system SHALL show min and max calculatedPrice from active variants
3. WHEN calculating Fit-in fee THEN the system SHALL apply the fee based on type (FIXED: add value, PERCENTAGE: add value% of calculatedPrice)
4. WHEN calculating line total THEN the system SHALL compute (calculatedPrice + fitInFee) × quantity
5. WHEN calculating grand total THEN the system SHALL sum all line totals plus other applicable fees

