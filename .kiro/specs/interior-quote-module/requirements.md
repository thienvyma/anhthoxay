# Requirements Document

## Introduction

Tính năng **Báo giá Nội thất** (Interior Quote Module) là một module mới bổ sung vào hệ thống Anh Thợ Xây, cho phép khách hàng tính toán chi phí nội thất cho căn hộ chung cư/căn hộ dự án. Module này bao gồm:

1. **Admin Section**: Quản lý dữ liệu chủ đầu tư, dự án, tòa nhà, căn hộ, layout, gói nội thất, phụ phí và cấu hình báo giá
2. **Landing Page**: Trang báo giá nội thất với UI/UX dạng mini-app, có animation chuyển bước mượt mà, hiệu ứng bắt mắt

Module này hoạt động song song với tính năng "Báo giá Thi công" hiện có (QuoteCalculatorSection).

## Glossary

- **Developer (Chủ đầu tư)**: Công ty phát triển bất động sản (VD: Vingroup, Novaland, Capitaland)
- **Development (Dự án)**: Khu đô thị/chung cư do chủ đầu tư phát triển (VD: Vinhomes Grand Park, Masteri Thảo Điền)
- **Building (Tòa nhà)**: Tòa/Block trong dự án (VD: S1.01, Tòa A, Block T2)
- **Axis (Trục)**: Vị trí căn hộ trên mặt bằng tầng (VD: A, B, C, D...)
- **Unit Code (Mã căn hộ)**: Mã định danh căn hộ theo format: Tòa.Tầng.Trục (VD: S1.15.A)
- **Unit Type (Loại căn)**: Phân loại theo số phòng ngủ (Studio, 1PN, 2PN, 3PN, 4PN, Penthouse, Duplex)
- **Layout (Bản vẽ)**: Bản vẽ mặt bằng căn hộ với diện tích và phân chia phòng
- **Gross Area (Diện tích tim tường)**: Diện tích tính từ tim tường
- **Net Area (Diện tích thông thủy)**: Diện tích sử dụng thực tế
- **Interior Package (Gói nội thất)**: Bộ đồ nội thất được thiết kế sẵn cho một layout cụ thể
- **Surcharge (Phụ phí)**: Chi phí phát sinh theo điều kiện (tầng cao, vận chuyển đặc biệt...)
- **Interior Quote (Báo giá nội thất)**: Bản báo giá chi tiết cho khách hàng

## Requirements

### Requirement 1: Quản lý Chủ đầu tư (Developer Management)

**User Story:** As an admin, I want to manage real estate developers, so that I can organize developments and buildings under each developer.

#### Acceptance Criteria

1. WHEN an admin accesses the Interior Developers page THEN the System SHALL display a list of all developers with name, logo, status, and development count
2. WHEN an admin creates a new developer THEN the System SHALL validate required fields (name) and generate a unique slug automatically
3. WHEN an admin updates a developer THEN the System SHALL save changes and reflect them immediately in the list
4. WHEN an admin toggles developer status to inactive THEN the System SHALL hide that developer from the landing page selection
5. WHEN an admin deletes a developer with existing developments THEN the System SHALL prevent deletion and display an error message
6. WHEN an admin reorders developers THEN the System SHALL update the display order on the landing page accordingly

---

### Requirement 2: Quản lý Dự án (Development Management)

**User Story:** As an admin, I want to manage real estate developments under each developer, so that I can organize buildings and provide project information to customers.

#### Acceptance Criteria

1. WHEN an admin accesses the Interior Developments page THEN the System SHALL display a filterable list of developments with developer name, project name, code, building count, and status
2. WHEN an admin creates a new development THEN the System SHALL require developer selection, name, and code, and generate a unique slug
3. WHEN an admin uploads development images THEN the System SHALL store thumbnail and gallery images with proper optimization
4. WHEN an admin updates development metadata (total buildings, total units, completion year) THEN the System SHALL validate numeric values and save changes
5. WHEN an admin filters developments by developer THEN the System SHALL display only developments belonging to that developer
6. WHEN an admin deletes a development with existing buildings THEN the System SHALL prevent deletion and display an error message

---

### Requirement 3: Quản lý Tòa nhà (Building Management)

**User Story:** As an admin, I want to manage buildings within each development, so that I can configure floors, axes, and unit code formats.

#### Acceptance Criteria

1. WHEN an admin creates a new building THEN the System SHALL require development selection, name, code, total floors, and axis labels configuration
2. WHEN an admin configures axis labels THEN the System SHALL accept a comma-separated list (e.g., "A,B,C,D,E,F,G,H") and validate uniqueness
3. WHEN an admin sets floor range (startFloor, endFloor) THEN the System SHALL validate that startFloor is less than or equal to endFloor and both are within totalFloors
4. WHEN an admin configures unit code format THEN the System SHALL provide format options ({building}.{floor}.{axis}, {building}-{floor}{axis}) and preview sample codes
5. WHEN an admin adds special floors (penthouse, shophouse) THEN the System SHALL store floor number, type, and notes separately from standard floor configuration
6. WHEN an admin uploads floor plan image THEN the System SHALL display it as reference when configuring building units

---

### Requirement 4: Quản lý Căn hộ theo Trục (Building Unit Management)

**User Story:** As an admin, I want to manage apartment units by axis within each building, so that I can assign layouts and configure unit properties.

#### Acceptance Criteria

1. WHEN an admin accesses building units page THEN the System SHALL display a matrix view showing axes (columns) and floor ranges (rows) with assigned layouts
2. WHEN an admin creates a building unit THEN the System SHALL require axis, unit type, bedrooms, bathrooms, and layout assignment
3. WHEN an admin assigns a layout to an axis THEN the System SHALL validate that the layout unit type matches the building unit type
4. WHEN an admin configures unit position (CORNER, EDGE, MIDDLE) THEN the System SHALL store this for surcharge calculation purposes
5. WHEN an admin sets floor range for a unit THEN the System SHALL apply the same layout to all floors within that range for the specified axis
6. WHEN an admin bulk imports units from Excel THEN the System SHALL validate data format, check for duplicates, and report import results
7. WHEN an admin configures unit direction and view THEN the System SHALL store these as optional metadata for display purposes

---

### Requirement 5: Quản lý Bản vẽ Layout (Unit Layout Management)

**User Story:** As an admin, I want to manage apartment layouts with detailed room breakdowns, so that customers can preview their apartment configuration.

#### Acceptance Criteria

1. WHEN an admin creates a new layout THEN the System SHALL require name, code, unit type, bedrooms, bathrooms, gross area, and net area
2. WHEN an admin configures room breakdown THEN the System SHALL allow adding multiple rooms with name, area (m²), and room type selection
3. WHEN the total room areas are entered THEN the System SHALL calculate and display the sum, comparing it with net area for validation
4. WHEN an admin uploads layout images THEN the System SHALL accept 2D floor plan, 3D render, and dimension drawing separately
5. WHEN an admin adds layout highlights THEN the System SHALL store feature tags (e.g., "2 mặt thoáng", "View hồ bơi") for display
6. WHEN an admin clones a layout THEN the System SHALL create a copy with a new code and allow modifications
7. WHEN an admin deletes a layout assigned to building units THEN the System SHALL prevent deletion and display affected units

---

### Requirement 6: Quản lý Gói Nội thất (Interior Package Management)

**User Story:** As an admin, I want to manage interior packages for each layout, so that customers can choose from different price tiers.

#### Acceptance Criteria

1. WHEN an admin creates an interior package THEN the System SHALL require layout selection, name, code, tier (1-4), and base price
2. WHEN an admin configures package items THEN the System SHALL allow grouping items by room with name, brand, material, quantity, and unit price
3. WHEN package items are configured THEN the System SHALL auto-calculate total items count and total items price
4. WHEN an admin uploads package images THEN the System SHALL accept thumbnail and multiple 3D render gallery images
5. WHEN an admin sets package as featured THEN the System SHALL highlight it in the landing page selection
6. WHEN an admin clones a package to another layout THEN the System SHALL copy all items and allow price adjustments
7. WHEN an admin configures warranty and installation info THEN the System SHALL store warranty months and estimated installation days

---

### Requirement 7: Quản lý Danh mục Đồ Nội thất (Furniture Catalog Management)

**User Story:** As an admin, I want to manage a furniture catalog with categories and items, so that I can reference them when creating interior packages.

#### Acceptance Criteria

1. WHEN an admin manages furniture categories THEN the System SHALL support hierarchical structure (parent-child categories)
2. WHEN an admin creates a furniture item THEN the System SHALL require category, name, price, and allow optional fields (brand, material, dimensions, images)
3. WHEN an admin configures item dimensions THEN the System SHALL store width, height, depth with unit specification
4. WHEN an admin searches furniture items THEN the System SHALL filter by category, brand, price range, and keyword
5. WHEN an admin imports furniture items from Excel THEN the System SHALL validate data and report import results
6. WHEN an admin links room types to categories THEN the System SHALL suggest relevant categories when adding items to a room

---

### Requirement 8: Quản lý Phụ phí (Surcharge Management)

**User Story:** As an admin, I want to manage surcharges with conditional rules, so that additional costs are automatically applied based on unit properties.

#### Acceptance Criteria

1. WHEN an admin creates a surcharge THEN the System SHALL require name, code, type (FIXED, PERCENTAGE, PER_FLOOR, PER_SQM), and value
2. WHEN an admin configures surcharge conditions THEN the System SHALL allow setting floor range, area range, unit types, positions, and specific buildings/developments
3. WHEN multiple conditions are set THEN the System SHALL apply AND logic (all conditions must match for surcharge to apply)
4. WHEN an admin sets surcharge as auto-apply THEN the System SHALL automatically include it in quotes when conditions match
5. WHEN an admin sets surcharge as optional THEN the System SHALL display it as a selectable option in the quote result
6. WHEN an admin tests surcharge conditions THEN the System SHALL provide a test interface to verify which units would be affected

---

### Requirement 9: Cấu hình Báo giá (Quote Settings Management)

**User Story:** As an admin, I want to configure quote calculation parameters, so that I can control pricing formulas and display options.

#### Acceptance Criteria

1. WHEN an admin configures labor cost THEN the System SHALL allow setting cost per sqm with optional min/max limits
2. WHEN an admin configures management fee THEN the System SHALL allow choosing between fixed amount or percentage of subtotal
3. WHEN an admin configures contingency THEN the System SHALL allow setting percentage for unexpected costs
4. WHEN an admin configures VAT THEN the System SHALL allow enabling/disabling and setting percentage (default 10%)
5. WHEN an admin sets quote validity THEN the System SHALL store number of days the quote remains valid
6. WHEN an admin configures display options THEN the System SHALL allow toggling item breakdown, room breakdown, and price per sqm display
7. WHEN an admin enters company info THEN the System SHALL display it on generated quote documents

---

### Requirement 10: Quản lý Loại phòng (Room Type Management)

**User Story:** As an admin, I want to manage room types with default furniture categories, so that the system can suggest appropriate items when configuring layouts.

#### Acceptance Criteria

1. WHEN an admin creates a room type THEN the System SHALL require code, Vietnamese name, and optional English name
2. WHEN an admin assigns default categories to a room type THEN the System SHALL suggest those categories when adding items to that room
3. WHEN an admin reorders room types THEN the System SHALL reflect the order in layout room configuration dropdowns
4. WHEN a room type is used in layouts THEN the System SHALL prevent deletion and display affected layouts

---

### Requirement 11: Landing Page - Wizard Flow

**User Story:** As a customer, I want to navigate through a step-by-step wizard to get an interior quote, so that I can easily select my apartment and preferred interior package.

#### Acceptance Criteria

1. WHEN a customer accesses the interior quote page THEN the System SHALL display an animated intro with step indicator showing 7 steps
2. WHEN a customer selects a developer THEN the System SHALL animate transition to step 2 and load developments for that developer
3. WHEN a customer selects a development THEN the System SHALL animate transition to step 3 and load buildings for that development
4. WHEN a customer selects a building THEN the System SHALL animate transition to step 4 and display floor/axis selection interface
5. WHEN a customer enters unit code or selects floor+axis THEN the System SHALL validate the combination and display detected unit type and area
6. WHEN a customer proceeds to layout preview THEN the System SHALL display layout image, room breakdown, and area information with smooth animation
7. WHEN a customer selects an interior package THEN the System SHALL display package details, images, and price with comparison to other tiers
8. WHEN a customer reaches the result step THEN the System SHALL display complete quote breakdown with all costs and allow saving/sharing

---

### Requirement 12: Landing Page - Unit Selection Interface

**User Story:** As a customer, I want to select my apartment unit by entering the unit code or choosing floor and axis, so that the system can identify my exact apartment.

#### Acceptance Criteria

1. WHEN a customer views the unit selection step THEN the System SHALL display both input methods: direct code entry and floor+axis selection
2. WHEN a customer enters a unit code THEN the System SHALL parse and validate the format against the building's unit code format
3. WHEN a customer selects floor from dropdown THEN the System SHALL show only valid floors (excluding special floors if not applicable)
4. WHEN a customer selects axis from dropdown THEN the System SHALL show only axes that have assigned layouts
5. WHEN floor and axis are selected THEN the System SHALL auto-generate and display the unit code
6. WHEN a valid unit is identified THEN the System SHALL display unit type, bedrooms, bathrooms, gross area, net area, position, and direction
7. IF an invalid unit code is entered THEN the System SHALL display a clear error message and suggest valid format

---

### Requirement 13: Landing Page - Layout Preview

**User Story:** As a customer, I want to preview my apartment layout with room details, so that I can understand the space before selecting interior packages.

#### Acceptance Criteria

1. WHEN a customer views the layout preview THEN the System SHALL display the 2D floor plan image prominently
2. WHEN layout has 3D render THEN the System SHALL provide a toggle to switch between 2D and 3D views
3. WHEN a customer views room breakdown THEN the System SHALL display each room with name, area, and room type icon
4. WHEN a customer views area summary THEN the System SHALL display gross area, net area, balcony area, and total
5. WHEN layout has highlights THEN the System SHALL display feature tags with appropriate icons
6. WHEN a customer clicks on a room in the breakdown THEN the System SHALL highlight that room area on the floor plan (if interactive)

---

### Requirement 14: Landing Page - Package Selection

**User Story:** As a customer, I want to compare and select interior packages, so that I can choose the best option for my budget and preferences.

#### Acceptance Criteria

1. WHEN a customer views package selection THEN the System SHALL display all available packages for the layout in tier order
2. WHEN packages are displayed THEN the System SHALL show thumbnail, name, tier badge, base price, and short description
3. WHEN a customer hovers/taps a package THEN the System SHALL expand to show gallery images in a carousel
4. WHEN a customer selects a package THEN the System SHALL highlight it and enable the "Next" button
5. WHEN a package is marked as featured THEN the System SHALL display a "Recommended" badge
6. WHEN a customer wants to compare packages THEN the System SHALL provide a side-by-side comparison view showing item differences
7. WHEN a customer clicks "View Details" THEN the System SHALL display full item breakdown by room in a modal

---

### Requirement 15: Landing Page - Quote Result

**User Story:** As a customer, I want to see a detailed quote breakdown with all costs, so that I can understand the total investment required.

#### Acceptance Criteria

1. WHEN a customer views the quote result THEN the System SHALL display a summary card with unit info, layout, and selected package
2. WHEN displaying price breakdown THEN the System SHALL show: package price, labor cost, applicable surcharges, management fee, contingency, subtotal, VAT, and grand total
3. WHEN surcharges apply THEN the System SHALL list each surcharge with name and amount
4. WHEN displaying price per sqm THEN the System SHALL calculate grand total divided by net area
5. WHEN a customer clicks "Save Quote" THEN the System SHALL open a form to collect name, phone, and email
6. WHEN a quote is saved THEN the System SHALL generate a unique quote code and store it in the database
7. WHEN a customer clicks "Share" THEN the System SHALL provide options to copy link, share to social media, or download PDF
8. WHEN a customer clicks "Start Over" THEN the System SHALL reset the wizard to step 1 with animation

---

### Requirement 16: Landing Page - Animation & UX

**User Story:** As a customer, I want a smooth, app-like experience with beautiful animations, so that the quote process feels modern and engaging.

#### Acceptance Criteria

1. WHEN transitioning between steps THEN the System SHALL use slide animations with easing (300-400ms duration)
2. WHEN loading data THEN the System SHALL display skeleton loaders instead of spinners
3. WHEN a selection is made THEN the System SHALL provide immediate visual feedback with scale/highlight animation
4. WHEN displaying cards THEN the System SHALL use staggered entrance animations
5. WHEN scrolling through options THEN the System SHALL use smooth scroll with momentum
6. WHEN on mobile devices THEN the System SHALL support swipe gestures for navigation between steps
7. WHEN displaying images THEN the System SHALL use lazy loading with blur-up placeholder effect
8. WHEN an error occurs THEN the System SHALL display an animated error state with retry option

---

### Requirement 17: Quote History Management

**User Story:** As an admin, I want to view and manage saved quotes, so that I can follow up with customers and track conversion.

#### Acceptance Criteria

1. WHEN an admin accesses quotes page THEN the System SHALL display a list with quote code, customer info, unit, package, total, status, and date
2. WHEN an admin filters quotes THEN the System SHALL allow filtering by status, date range, development, and price range
3. WHEN an admin views quote details THEN the System SHALL display full breakdown including all calculation parameters
4. WHEN an admin updates quote status THEN the System SHALL track status changes (DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED)
5. WHEN an admin exports quotes THEN the System SHALL generate CSV with all quote data
6. WHEN a quote expires THEN the System SHALL automatically update status to EXPIRED based on validity days

---

### Requirement 18: API Endpoints

**User Story:** As a developer, I want well-structured API endpoints for the interior module, so that the frontend can interact with the backend efficiently.

#### Acceptance Criteria

1. WHEN the API receives requests for public data (developers, developments, buildings) THEN the System SHALL return only active items without authentication
2. WHEN the API receives requests for admin operations THEN the System SHALL require authentication and ADMIN role
3. WHEN the API returns list data THEN the System SHALL support pagination, sorting, and filtering parameters
4. WHEN the API receives invalid data THEN the System SHALL return validation errors with field-specific messages
5. WHEN the API calculates a quote THEN the System SHALL accept unit and package IDs and return complete price breakdown
6. WHEN the API saves a quote THEN the System SHALL generate a unique code and return the created quote with ID

---

### Requirement 19: Data Validation & Integrity

**User Story:** As a system administrator, I want data validation and integrity checks, so that the system maintains consistent and accurate data.

#### Acceptance Criteria

1. WHEN creating entities with unique constraints (code, slug) THEN the System SHALL validate uniqueness and return clear error messages
2. WHEN deleting entities with dependencies THEN the System SHALL prevent deletion and list dependent entities
3. WHEN updating prices THEN the System SHALL validate positive numbers and reasonable ranges
4. WHEN configuring floor ranges THEN the System SHALL validate logical consistency (start <= end, within building limits)
5. WHEN importing data THEN the System SHALL validate all rows before committing and provide detailed error report
6. WHEN calculating quotes THEN the System SHALL validate all referenced entities exist and are active

---

### Requirement 20: Integration with Existing System

**User Story:** As a developer, I want the interior module to integrate seamlessly with the existing system, so that it follows established patterns and shares common components.

#### Acceptance Criteria

1. WHEN adding admin pages THEN the System SHALL integrate with existing admin layout and navigation
2. WHEN adding landing page THEN the System SHALL use existing design tokens, components, and API patterns
3. WHEN storing media THEN the System SHALL use existing media upload service and storage
4. WHEN saving customer leads from quotes THEN the System SHALL create CustomerLead records with source "INTERIOR_QUOTE"
5. WHEN displaying the interior quote section THEN the System SHALL be accessible from the main navigation alongside "Báo giá Thi công"
