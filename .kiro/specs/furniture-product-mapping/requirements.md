# Requirements Document

## Introduction

Tính năng nâng cấp hệ thống Báo giá Nội thất (Furniture Quotation) với các thay đổi chính:

1. **Product Mapping**: Sản phẩm nội thất phải được mapping với căn hộ cụ thể (Dự án + Tòa nhà + Loại căn hộ) để hiển thị đúng sản phẩm cho từng layout.

2. **Chất liệu (Material)**: Mỗi sản phẩm có thể có nhiều chất liệu khác nhau với giá khác nhau. Mỗi sản phẩm + chất liệu = 1 dòng riêng trong database.

3. **Tính giá theo kích thước**: Giá sản phẩm được tính dựa trên kích thước (m² hoặc m dài) do admin nhập khi tạo sản phẩm.

4. **Fit-in Option**: Cho phép user chọn option "Fit-in" (làm vừa khít không gian) với phí tăng thêm cho từng sản phẩm.

## Glossary

- **FurnitureProduct**: Sản phẩm nội thất trong hệ thống báo giá
- **ProductMapping**: Bảng liên kết sản phẩm với căn hộ (Dự án + Tòa nhà + ApartmentType)
- **Material**: Chất liệu của sản phẩm (VD: Gỗ sồi, MDF, Gỗ công nghiệp)
- **PricingType**: Cách tính giá - M2 (mét vuông) hoặc LINEAR (mét dài)
- **Fit-in**: Option làm sản phẩm vừa khít với không gian căn hộ (có phí tăng thêm)
- **Default Size**: Kích thước mặc định của sản phẩm (không có phí Fit-in)
- **pricePerUnit**: Giá trên 1 mét (m² hoặc m dài tùy pricingType)
- **calculatedPrice**: Giá đã tính sẵn từ kích thước = pricePerUnit × dimensions

## Requirements

### Requirement 1: Product Mapping

**User Story:** As an admin, I want to map furniture products to specific apartments (Project + Building + ApartmentType), so that customers only see relevant products for their selected apartment.

#### Acceptance Criteria

1. WHEN an admin creates a furniture product THEN the System SHALL require at least one mapping to a combination of projectName, buildingCode, and apartmentType
2. WHEN an admin views a product THEN the System SHALL display all apartment mappings associated with that product
3. WHEN an admin updates product mappings THEN the System SHALL allow adding or removing mappings without affecting the product itself
4. WHEN a customer selects an apartment in Step 7 THEN the System SHALL filter and display only products that have mappings matching the selected projectName, buildingCode, and apartmentType
5. IF a product has no valid mappings for the selected apartment THEN the System SHALL exclude that product from the display list

### Requirement 2: Material Variants

**User Story:** As an admin, I want to create multiple material variants for the same product with different prices, so that customers can choose their preferred material.

#### Acceptance Criteria

1. WHEN an admin creates a product THEN the System SHALL require a material field specifying the material type
2. WHEN an admin creates products with the same name but different materials THEN the System SHALL store each as a separate database record with unique ID
3. WHEN displaying products to customers THEN the System SHALL group products by name and show material options as selectable variants
4. WHEN a customer selects a product THEN the System SHALL display available material options with their respective prices
5. WHEN calculating quotation price THEN the System SHALL use the price of the selected material variant

### Requirement 3: Dimension-Based Pricing

**User Story:** As an admin, I want to set product prices based on dimensions (m² or linear meter), so that the system automatically calculates the final price.

#### Acceptance Criteria

1. WHEN an admin creates a product THEN the System SHALL require pricePerUnit (price per 1 meter), pricingType (M2 or LINEAR), and length dimension
2. WHEN pricingType is M2 THEN the System SHALL require both length and width dimensions
3. WHEN pricingType is LINEAR THEN the System SHALL require only length dimension
4. WHEN a product is saved THEN the System SHALL calculate and store calculatedPrice as pricePerUnit × length × width (for M2) or pricePerUnit × length (for LINEAR)
5. WHEN displaying product price to customers THEN the System SHALL show the pre-calculated price (calculatedPrice) instead of pricePerUnit

### Requirement 4: Fit-in Option

**User Story:** As a customer, I want to choose between standard size or fit-in (custom fit) for each product, so that I can get furniture that perfectly fits my space.

#### Acceptance Criteria

1. WHEN an admin creates a product THEN the System SHALL allow setting allowFitIn flag to enable or disable fit-in option for that product
2. WHEN an admin configures fees THEN the System SHALL allow creating a special FIT_IN_FEE with code "FIT_IN" that applies per product
3. WHEN a customer views a product with allowFitIn=true THEN the System SHALL display two options: "Kích thước mặc định" and "Fit-in"
4. WHEN a customer selects Fit-in for a product THEN the System SHALL add the FIT_IN_FEE amount to that product's price
5. WHEN calculating total quotation THEN the System SHALL sum all product prices including individual Fit-in fees where selected

### Requirement 5: Admin Product Form Updates

**User Story:** As an admin, I want an updated product creation form with new fields, so that I can properly configure products with materials, dimensions, and pricing.

#### Acceptance Criteria

1. WHEN an admin opens the product form THEN the System SHALL display fields: name, material, categoryId, pricePerUnit, pricingType, length, width (conditional), allowFitIn, imageUrl, description
2. WHEN pricingType is M2 THEN the System SHALL show and require the width field
3. WHEN pricingType is LINEAR THEN the System SHALL hide the width field
4. WHEN an admin saves the product THEN the System SHALL validate all required fields and calculate the final price
5. WHEN an admin saves the product THEN the System SHALL display a preview of the calculated price before saving

### Requirement 6: Admin Product Mapping UI

**User Story:** As an admin, I want a UI to manage product-apartment mappings, so that I can easily assign products to specific apartments.

#### Acceptance Criteria

1. WHEN an admin views a product THEN the System SHALL display a "Mappings" section showing all current apartment mappings
2. WHEN an admin clicks "Add Mapping" THEN the System SHALL display a form with dropdowns for Project, Building, and ApartmentType
3. WHEN an admin selects a Project THEN the System SHALL filter Buildings dropdown to show only buildings in that project
4. WHEN an admin selects a Building THEN the System SHALL filter ApartmentType dropdown to show only types available in that building
5. WHEN an admin removes a mapping THEN the System SHALL delete only the mapping record without affecting the product

### Requirement 7: Landing Page Step 7 Updates

**User Story:** As a customer, I want to see only relevant products for my selected apartment and choose material/fit-in options, so that I can get an accurate quotation.

#### Acceptance Criteria

1. WHEN a customer reaches Step 7 THEN the System SHALL query products filtered by the selected projectName, buildingCode, and apartmentType from previous steps
2. WHEN displaying products THEN the System SHALL group products by name and show material variants as selectable options
3. WHEN a customer selects a product THEN the System SHALL show the calculated price and Fit-in option (if allowFitIn=true)
4. WHEN a customer toggles Fit-in THEN the System SHALL immediately update the displayed price to include or exclude the Fit-in fee
5. WHEN a customer proceeds to quotation THEN the System SHALL include selected products with their material, dimensions, and Fit-in selections in the quotation data

### Requirement 8: Quotation Calculation Updates

**User Story:** As a system, I want to calculate quotations with the new pricing model, so that customers receive accurate price breakdowns.

#### Acceptance Criteria

1. WHEN calculating base price THEN the System SHALL sum calculatedPrice for all selected products
2. WHEN a product has Fit-in selected THEN the System SHALL add the FIT_IN_FEE amount to that product's individual price
3. WHEN generating quotation items THEN the System SHALL include productId, name, material, calculatedPrice, fitInFee (if applicable), and quantity
4. WHEN displaying price breakdown THEN the System SHALL show base product prices, individual Fit-in fees, and other applicable fees separately
5. WHEN storing quotation THEN the System SHALL persist all product details including material and Fit-in selections for future reference

### Requirement 9: Database Schema Updates

**User Story:** As a developer, I want updated database schema to support the new product structure, so that all new fields and relationships are properly stored.

#### Acceptance Criteria

1. WHEN updating FurnitureProduct model THEN the System SHALL add fields: material, pricePerUnit, pricingType, length, width, allowFitIn, calculatedPrice
2. WHEN creating FurnitureProductMapping model THEN the System SHALL include fields: productId, projectName, buildingCode, apartmentType with proper indexes
3. WHEN creating a product mapping THEN the System SHALL enforce unique constraint on (productId, projectName, buildingCode, apartmentType)
4. WHEN deleting a product THEN the System SHALL cascade delete all associated mappings
5. WHEN querying products by apartment THEN the System SHALL use indexed fields for efficient filtering

### Requirement 10: API Endpoint Updates

**User Story:** As a developer, I want updated API endpoints to support the new product features, so that frontend can properly interact with the system.

#### Acceptance Criteria

1. WHEN calling GET /api/furniture/products THEN the System SHALL accept optional query parameters: projectName, buildingCode, apartmentType for filtering
2. WHEN calling POST /api/admin/furniture/products THEN the System SHALL validate and accept new fields: material, pricePerUnit, pricingType (M2 or LINEAR), length, width, allowFitIn
3. WHEN calling POST /api/admin/furniture/products/:id/mappings THEN the System SHALL create a new product-apartment mapping
4. WHEN calling DELETE /api/admin/furniture/products/:id/mappings/:mappingId THEN the System SHALL remove the specified mapping
5. WHEN calling GET /api/admin/furniture/products/:id/mappings THEN the System SHALL return all mappings for the specified product
