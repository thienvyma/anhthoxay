# Requirements Document

## Introduction

Hệ thống Báo giá Nội thất cho phép khách hàng trên Landing page chọn căn hộ theo quy trình step-by-step và nhận báo giá nội thất (combo hoặc custom). Admin/Manager có thể quản lý dữ liệu dự án, sản phẩm nội thất, combo và các cài đặt phí thông qua Admin panel. Hệ thống tích hợp Google Sheets để đồng bộ dữ liệu 2 chiều.

## Technical Context (Existing Systems to Reuse)

Hệ thống sẽ tận dụng các components và patterns đã có:

1. **Google Sheets Service** (`api/src/services/google-sheets.service.ts`):
   - Đã có `readSheet()` và `writeSheet()` methods
   - Đã có OAuth2 flow và encryption cho credentials
   - Sẽ mở rộng để hỗ trợ 3 tabs (DuAn, Layout, ApartmentType)

2. **Leads Service** (`api/src/services/leads.service.ts`):
   - Đã có CRUD operations, stats, CSV export
   - Sẽ mở rộng để lưu quotation history

3. **Pages Service** (`api/src/services/pages.service.ts`):
   - Đã có section management với JSON data
   - Sẽ tạo section type mới `FURNITURE_QUOTE` với form fields config

4. **Pricing Service** (`api/src/services/pricing.service.ts`):
   - Đã có patterns cho categories, materials
   - Sẽ tham khảo patterns cho furniture catalog

5. **Auth Middleware** (`api/src/middleware/auth.middleware.ts`):
   - Đã có `authenticate()`, `requireRole('ADMIN', 'MANAGER')`

6. **Validation Middleware** (`api/src/middleware/validation.ts`):
   - Đã có `validate()` với Zod schemas

7. **Response Utils** (`api/src/utils/response.ts`):
   - Đã có `successResponse()`, `errorResponse()`

## Glossary

- **Chủ đầu tư (Developer)**: Công ty phát triển dự án bất động sản (VD: Masterise Homes)
- **Dự án (Project)**: Khu căn hộ do chủ đầu tư phát triển (VD: Lumiere Boulevard)
- **Tòa nhà (Building)**: Tòa nhà trong dự án, có TenToaNha (tên hiển thị) và MaToaNha (mã định danh)
- **Mã tòa nhà (BuildingCode/MaToaNha)**: Mã định danh tòa nhà (VD: LBV A, MCP B). Lưu ý: nhiều tòa có thể dùng chung MaToaNha (VD: Daisy 1 và Daisy 2 cùng dùng LBV D)
- **SoTangMax**: Tổng số tầng của tòa nhà (VD: 22 tầng nghĩa là có tầng 1-22)
- **SoTrucMax**: Tổng số trục/căn hộ trên mỗi tầng (VD: 13 trục nghĩa là có trục 0-13)
- **Trục (Axis/SoTruc)**: Vị trí căn hộ theo chiều ngang trên mỗi tầng (0 đến SoTrucMax). Layout của căn hộ được xác định bởi trục, không phụ thuộc tầng
- **Tầng (Floor)**: Số tầng mà căn hộ của user đang ở (1 đến SoTangMax)
- **Layout/ApartmentType**: Loại căn hộ (1pn, 2pn, 3pn, 1pn+, penhouse, shophouse). Được xác định bởi MaToaNha + SoTruc
- **LayoutAxis**: Mã định danh layout = {MaToaNha}_{SoTruc} (VD: LBV A_00, LBV A_01)
- **Số nhà (UnitNumber)**: Mã căn hộ theo format {MaToaNha}.{Tầng}{Trục} (VD: LBV A.1503 = Tòa LBV A, Tầng 15, Trục 03)
- **Metrics Grid**: Bảng hiển thị layout của tất cả căn hộ trong tòa nhà, với hàng = tầng, cột = trục, cell = ApartmentType
- **Combo**: Gói nội thất trọn bộ theo loại căn hộ với giá cố định
- **Custom**: Lựa chọn sản phẩm nội thất riêng lẻ
- **Lead**: Thông tin khách hàng tiềm năng thu thập từ form
- **Phí (Fee)**: Các loại phí bổ sung áp dụng cho combo hoặc custom
- **Furniture_System**: Hệ thống báo giá nội thất

## Data Structure Analysis

### File 1: DuAn.csv - Cấu trúc phân cấp
```
ChuDauTu → TenDuAn (MaDuAn) → TenToaNha (MaToaNha, SoTangMax, SoTrucMax)
```
- Một chủ đầu tư có nhiều dự án
- Một dự án có nhiều tòa nhà
- Mỗi tòa nhà có: TenToaNha (tên hiển thị), MaToaNha (mã), SoTangMax, SoTrucMax
- **Lưu ý**: Nhiều tòa có thể dùng chung MaToaNha (VD: Daisy 1 và Daisy 2 cùng dùng LBV D với SoTrucMax khác nhau)

### File 2: LayoutIDs.csv - Mapping trục → loại căn hộ
```
LayoutAxis = {MaToaNha}_{SoTruc} → ApartmentType
```
- Xác định loại căn hộ theo **trục**, không phụ thuộc tầng
- Tất cả căn hộ trên cùng 1 trục đều có cùng ApartmentType
- VD: Trục 0 của LBV A luôn là 1pn (dù ở tầng 1 hay tầng 22)

### File 3: ApartmentType.csv - Chi tiết layout
```
MaToaNha + ApartmentType → Ảnh, Mô tả
```
- Mỗi tòa nhà có danh sách các loại căn hộ với ảnh và mô tả riêng
- Một số căn hộ có thể có nhiều layout khác nhau dù cùng ApartmentType

### Data Validation Rules
1. **SoTruc validation**: SoTruc trong LayoutIDs phải nằm trong range [0, SoTrucMax] của tòa nhà tương ứng
2. **ApartmentType normalization**: Trim whitespace, lowercase để so sánh (VD: "1pn " → "1pn")
3. **MaToaNha consistency**: LayoutIDs và ApartmentType phải reference MaToaNha có trong DuAn
4. **Unique constraint**: Mỗi LayoutAxis (MaToaNha + SoTruc) chỉ có 1 ApartmentType

### Edge Cases
1. **Nhiều tòa cùng MaToaNha**: Daisy 1 và Daisy 2 cùng dùng "LBV D" → Cần dùng TenToaNha để phân biệt khi hiển thị, nhưng dùng MaToaNha để lookup layout
2. **SoTrucMax khác nhau**: Daisy 1 có SoTrucMax=10, Daisy 2 có SoTrucMax=12 → Khi user chọn Daisy 1, chỉ hiển thị trục 0-10
3. **Layout không tồn tại**: Nếu user chọn trục không có trong LayoutIDs → Hiển thị thông báo lỗi

## Requirements

### Requirement 1: Quản lý Dữ liệu Dự án (Admin)

**User Story:** As an admin/manager, I want to manage project data (developers, projects, buildings, layouts), so that I can maintain accurate apartment information for the quotation system.

#### Acceptance Criteria

1. WHEN an admin/manager accesses the Furniture Management page THEN the Furniture_System SHALL display a Management tab with hierarchical dropdowns for Developer, Project, and Building (TenToaNha) selection
2. WHEN an admin/manager selects a building THEN the Furniture_System SHALL display a metrics grid showing apartments organized by Floor (rows: 1 to SoTangMax) and Axis (columns: 0 to SoTrucMax) with ApartmentType displayed in each cell
3. WHEN rendering the metrics grid THEN the Furniture_System SHALL lookup ApartmentType from LayoutIDs data using MaToaNha and SoTruc (layout is determined by axis, not floor)
4. WHEN an admin/manager selects a building THEN the Furniture_System SHALL display layout cards below the grid showing image and description for each ApartmentType of that building's MaToaNha
5. WHEN no building is selected THEN the Furniture_System SHALL display layouts grouped by MaToaNha
6. WHEN an admin/manager clicks Import button THEN the Furniture_System SHALL accept CSV files matching the 3-file structure (DuAn, LayoutIDs, ApartmentType) and validate data before importing
7. WHEN importing data THEN the Furniture_System SHALL trim whitespace from ApartmentType values and validate that SoTruc values are within SoTrucMax range
8. WHEN an admin/manager clicks Export button THEN the Furniture_System SHALL generate 3 CSV files matching the original structure with current data
9. WHEN an admin/manager clicks Sync Sheet dropdown THEN the Furniture_System SHALL display two options: Pull (Sheet to App) and Push (App to Sheet)
10. WHEN an admin/manager executes Pull sync THEN the Furniture_System SHALL read data from Google Sheet (3 tabs: DuAn, Layout, ApartmentType) and merge data with existing records
11. WHEN an admin/manager executes Push sync THEN the Furniture_System SHALL write current database data to Google Sheet maintaining the 3-tab structure
12. WHEN an admin/manager edits any data item (developer, project, building, layout) THEN the Furniture_System SHALL allow inline editing with save/cancel actions
13. WHEN an admin/manager adds a new building THEN the Furniture_System SHALL require TenToaNha, MaToaNha, SoTangMax, and SoTrucMax
14. WHEN an admin/manager deletes an item THEN the Furniture_System SHALL prompt for confirmation and cascade delete related child records

### Requirement 2: Quản lý Catalog Sản phẩm Nội thất (Admin)

**User Story:** As an admin/manager, I want to manage furniture catalog with categories and products, so that customers can browse and select items for custom quotations.

#### Acceptance Criteria

1. WHEN an admin/manager accesses the Catalog tab THEN the Furniture_System SHALL display a two-column layout with categories on the left and products on the right
2. WHEN an admin/manager selects a category THEN the Furniture_System SHALL filter products to show only items in that category
3. WHEN an admin/manager creates a product THEN the Furniture_System SHALL require: name, price, image, category, and allow optional: description, dimensions
4. WHEN an admin/manager edits a product THEN the Furniture_System SHALL allow updating all product fields
5. WHEN an admin/manager deletes a product THEN the Furniture_System SHALL prompt for confirmation before deletion
6. WHEN an admin/manager creates a category THEN the Furniture_System SHALL require a unique category name
7. WHEN an admin/manager deletes a category with products THEN the Furniture_System SHALL prevent deletion and display an error message

### Requirement 3: Quản lý Combo Nội thất (Admin)

**User Story:** As an admin/manager, I want to manage furniture combos linked to apartment types, so that customers can select pre-configured packages.

#### Acceptance Criteria

1. WHEN an admin/manager accesses the Combo tab THEN the Furniture_System SHALL display a list of combos with name, apartment type, price, and status
2. WHEN an admin/manager creates a combo THEN the Furniture_System SHALL require: name, apartment type(s), base price, and allow selecting products to include
3. WHEN an admin/manager links a combo to apartment types THEN the Furniture_System SHALL allow multiple apartment type selection (e.g., 1pn, 2pn)
4. WHEN an admin/manager duplicates a combo THEN the Furniture_System SHALL create a copy with "(Copy)" suffix and allow editing
5. WHEN an admin/manager toggles combo status THEN the Furniture_System SHALL activate or deactivate the combo for customer selection
6. WHEN displaying combos to customers THEN the Furniture_System SHALL only show active combos matching the selected apartment type

### Requirement 4: Quản lý Phí và Cài đặt (Admin)

**User Story:** As an admin/manager, I want to configure fees and settings, so that quotations include appropriate charges.

#### Acceptance Criteria

1. WHEN an admin/manager accesses the Settings tab THEN the Furniture_System SHALL display a list of configurable fees
2. WHEN an admin/manager creates a fee THEN the Furniture_System SHALL require: name, type (fixed/percentage), value, and applicability (combo/custom/both)
3. WHEN an admin/manager edits a fee THEN the Furniture_System SHALL allow updating all fee properties
4. WHEN an admin/manager deletes a fee THEN the Furniture_System SHALL prompt for confirmation before deletion
5. WHEN calculating quotation THEN the Furniture_System SHALL apply fees based on their applicability setting (combo-only, custom-only, or both)

### Requirement 5: Form Thu Lead Tùy chỉnh (Admin)

**User Story:** As an admin/manager, I want to customize the lead capture form fields, so that I can collect relevant customer information.

#### Acceptance Criteria

1. WHEN an admin/manager configures the furniture quotation section THEN the Furniture_System SHALL allow adding, editing, and removing form fields
2. WHEN an admin/manager adds a form field THEN the Furniture_System SHALL allow specifying: field name, type (text/phone/email/select/textarea), required status, and placeholder
3. WHEN an admin/manager reorders form fields THEN the Furniture_System SHALL update the display order accordingly
4. WHEN the form is displayed to customers THEN the Furniture_System SHALL render fields according to the configured order and types
5. WHEN a customer submits the form THEN the Furniture_System SHALL validate required fields and store the lead with all configured field values

### Requirement 6: Quy trình Chọn Căn hộ (Landing - Steps 1-5)

**User Story:** As a customer, I want to select my apartment through a step-by-step process, so that I can get an accurate furniture quotation.

#### Acceptance Criteria

1. WHEN a customer starts the quotation process THEN the Furniture_System SHALL display Step 1 with a list of available developers (ChuDauTu)
2. WHEN a customer selects a developer THEN the Furniture_System SHALL proceed to Step 2 showing projects (TenDuAn) from that developer
3. WHEN a customer selects a project THEN the Furniture_System SHALL proceed to Step 3 showing buildings (TenToaNha) in that project
4. WHEN a customer selects a building THEN the Furniture_System SHALL proceed to Step 4 showing floor selection (1 to SoTangMax) and axis selection (0 to SoTrucMax of that specific building)
5. WHEN a customer selects floor and axis THEN the Furniture_System SHALL calculate and display the unit number in format {MaToaNha}.{Floor padded to 2 digits}{Axis padded to 2 digits} (e.g., LBV A.1503 for floor 15, axis 3)
6. WHEN a customer completes Step 4 THEN the Furniture_System SHALL lookup ApartmentType from LayoutIDs using MaToaNha and selected SoTruc
7. IF the selected axis does not exist in LayoutIDs THEN the Furniture_System SHALL display an error message and prevent proceeding
8. WHEN a customer completes Step 4 THEN the Furniture_System SHALL proceed to Step 5 showing all ApartmentType details (image, description) matching the MaToaNha and ApartmentType from ApartmentType data
9. WHEN multiple layout variants exist for the same ApartmentType THEN the Furniture_System SHALL display all options for customer selection
10. WHEN a customer clicks on a layout image THEN the Furniture_System SHALL display a lightbox preview with full-size image
11. WHEN a customer selects a layout THEN the Furniture_System SHALL display the lead capture form before proceeding to furniture selection

### Requirement 7: Chọn Nội thất và Báo giá (Landing - Steps 6-7)

**User Story:** As a customer, I want to choose furniture (combo or custom) and see the quotation, so that I can make an informed decision.

#### Acceptance Criteria

1. WHEN a customer completes the lead form THEN the Furniture_System SHALL proceed to Step 6 showing two options: Combo and Custom
2. WHEN a customer selects Combo option THEN the Furniture_System SHALL expand to show available combos for the selected apartment type with images and prices
3. WHEN a customer selects Custom option THEN the Furniture_System SHALL expand to show product catalog with category filter and price filter
4. WHEN a customer browses custom products THEN the Furniture_System SHALL allow filtering by category and sorting by price
5. WHEN a customer selects products in Custom mode THEN the Furniture_System SHALL maintain a selection list with running total
6. WHEN a customer proceeds to Step 7 THEN the Furniture_System SHALL calculate total price: (Combo price OR sum of selected products) + applicable fees
7. WHEN displaying the quotation THEN the Furniture_System SHALL show itemized breakdown including base price, each applicable fee, and grand total
8. WHEN a customer completes the quotation THEN the Furniture_System SHALL save the quotation history linked to the lead record

### Requirement 8: Export và Lịch sử Báo giá

**User Story:** As an admin/manager, I want to view quotation history and export quotes to PDF, so that I can track customer interactions and provide formal documents.

#### Acceptance Criteria

1. WHEN an admin/manager views a lead record THEN the Furniture_System SHALL display quotation history showing all quotes generated for that lead
2. WHEN an admin/manager clicks Export PDF on a quotation THEN the Furniture_System SHALL generate a PDF document with apartment details, selected items, and price breakdown
3. WHEN displaying quotation history THEN the Furniture_System SHALL show: date, apartment info, selection type (combo/custom), and total amount
4. WHEN a customer generates multiple quotations THEN the Furniture_System SHALL store each as a separate history record

### Requirement 9: Tích hợp Google Sheets

**User Story:** As an admin, I want to sync project data with Google Sheets, so that I can manage data externally and keep systems synchronized.

#### Acceptance Criteria

1. WHEN the Google account is connected in Settings THEN the Furniture_System SHALL enable the Sync Sheet functionality in Furniture Management (reuse existing `googleSheetsService.getStatus()`)
2. WHEN an admin configures sync settings THEN the Furniture_System SHALL allow specifying the target spreadsheet ID (reuse existing `googleSheetsService.updateSettings()`)
3. WHEN executing Pull sync THEN the Furniture_System SHALL use existing `googleSheetsService.readSheet()` to read from 3 tabs (DuAn, Layout, ApartmentType) and merge data with existing records
4. WHEN executing Push sync THEN the Furniture_System SHALL use existing `googleSheetsService.writeSheet()` to write to 3 tabs maintaining column structure matching the CSV format
5. IF sync encounters errors THEN the Furniture_System SHALL display specific error messages and rollback partial changes
6. WHEN sync completes successfully THEN the Furniture_System SHALL display success message with count of records synced

### Requirement 10: Phân quyền Truy cập

**User Story:** As a system administrator, I want to control access to furniture management features, so that only authorized users can manage data.

#### Acceptance Criteria

1. WHEN a user with ADMIN role accesses Furniture Management THEN the Furniture_System SHALL grant full access to all tabs and functions (reuse existing `requireRole('ADMIN')`)
2. WHEN a user with MANAGER role accesses Furniture Management THEN the Furniture_System SHALL grant full access to all tabs and functions (reuse existing `requireRole('ADMIN', 'MANAGER')`)
3. WHEN a user without ADMIN or MANAGER role attempts to access Furniture Management THEN the Furniture_System SHALL deny access and display unauthorized message
4. WHEN an unauthorized API request is made to furniture endpoints THEN the Furniture_System SHALL return 403 Forbidden response (reuse existing `authenticate()` middleware)

### Requirement 11: Lưu trữ Lịch sử Báo giá

**User Story:** As an admin/manager, I want quotation history linked to leads, so that I can track customer interactions over time.

#### Acceptance Criteria

1. WHEN a customer completes a quotation THEN the Furniture_System SHALL create a FurnitureQuotation record linked to the CustomerLead (extend existing leads system)
2. WHEN storing quotation data THEN the Furniture_System SHALL include: apartment info, selection type, selected items, fees breakdown, and total amount
3. WHEN viewing a lead in admin THEN the Furniture_System SHALL display all quotation history for that lead
4. WHEN a customer generates multiple quotations THEN the Furniture_System SHALL store each as a separate record with timestamp
