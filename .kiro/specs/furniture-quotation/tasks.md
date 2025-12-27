# Implementation Plan

## Phase 1: Database Schema & Core Service

- [x] 1. Add Prisma models for Furniture Quotation System





  - [x] 1.1 Add FurnitureDeveloper model to `infra/prisma/schema.prisma`


    - Fields: id, name (unique), createdAt, updatedAt
    - Relation: projects (FurnitureProject[])

    - _Requirements: 1.1_
  - [x] 1.2 Add FurnitureProject model







    - Fields: id, name, code, developerId, createdAt, updatedAt
    - Relation: developer, buildings
    - Unique constraint: [developerId, code]

    - Index: developerId
    - _Requirements: 1.1_
  - [x] 1.3 Add FurnitureBuilding model

    - Fields: id, name (TenToaNha), code (MaToaNha), projectId, maxFloor (SoTangMax), maxAxis (SoTrucMax), createdAt, updatedAt

    - Relation: project
    - Index: projectId, code
    - _Requirements: 1.1, 1.13_
  - [x] 1.4 Add FurnitureLayout model

    - Fields: id, layoutAxis (unique), buildingCode, axis, apartmentType, createdAt, updatedAt
    - Unique constraint: [buildingCode, axis]
    - Index: buildingCode, apartmentType

    - _Requirements: 1.3_
  - [x] 1.5 Add FurnitureApartmentType model

    - Fields: id, buildingCode, apartmentType, imageUrl, description, createdAt, updatedAt

    - Index: buildingCode, apartmentType
    - _Requirements: 1.4_
  - [x] 1.6 Add FurnitureCategory model

    - Fields: id, name (unique), description, icon, order, isActive, createdAt, updatedAt

    - Relation: products
    - _Requirements: 2.1, 2.6_

  - [x] 1.7 Add FurnitureProduct model
    - Fields: id, name, categoryId, price, imageUrl, description, dimensions (JSON), order, isActive, createdAt, updatedAt

    - Relation: category, comboItems
    - Index: categoryId, isActive
    - _Requirements: 2.3_
  - [x] 1.8 Add FurnitureCombo model

    - Fields: id, name, apartmentTypes (JSON array), price, imageUrl, description, isActive, createdAt, updatedAt
    - Relation: items (FurnitureComboItem[])
    - Index: isActive


    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 1.9 Add FurnitureComboItem model (junction table)
    - Fields: id, comboId, productId, quantity
    - Unique constraint: [comboId, productId]

    - Index: comboId, productId
    - _Requirements: 3.2_



  - [x] 1.10 Add FurnitureFee model

    - Fields: id, name, type (FIXED/PERCENTAGE), value, applicability (COMBO/CUSTOM/BOTH), description, isActive, order, createdAt, updatedAt
    - Index: applicability, isActive
    - _Requirements: 4.1, 4.2_
  - [x] 1.11 Add FurnitureQuotation model
    - Fields: id, leadId, developerName, projectName, buildingName, buildingCode, floor, axis, unitNumber, apartmentType, layoutImageUrl, selectionType, comboId, comboName, items (JSON), basePrice, fees (JSON), totalPrice, createdAt
    - Relation: lead (CustomerLead)
    - Index: leadId, createdAt
    - _Requirements: 11.1, 11.2_
  - [x] 1.12 Update CustomerLead model to add furnitureQuotations relation

    - Add: furnitureQuotations FurnitureQuotation[]
    - _Requirements: 11.1_
  - [x] 1.13 Run Prisma generate and push



    - Execute: `pnpm db:generate` then `pnpm db:push`
    - Verify no errors
    - _Requirements: 1.1_

- [x] 2. Create Furniture Service (api/src/services/furniture.service.ts)




  - [x] 2.1 Create FurnitureServiceError class

    - Follow pattern from pricing.service.ts
    - Properties: code, message, statusCode
    - _Requirements: 1.12, 1.14_

  - [x] 2.2 Create FurnitureService class with constructor(prisma: PrismaClient)

    - _Requirements: 1.1_
  - [x] 2.3 Implement Developer CRUD methods
    - getDevelopers(): Promise<FurnitureDeveloper[]>
    - createDeveloper(data): Promise<FurnitureDeveloper>
    - updateDeveloper(id, data): Promise<FurnitureDeveloper>

    - deleteDeveloper(id): Promise<void> - cascade delete projects
    - _Requirements: 1.10, 1.11, 1.14_
  - [x] 2.4 Implement Project CRUD methods
    - getProjects(developerId?): Promise<FurnitureProject[]>
    - createProject(data): Promise<FurnitureProject>

    - updateProject(id, data): Promise<FurnitureProject>
    - deleteProject(id): Promise<void> - cascade delete buildings
    - _Requirements: 1.10, 1.11, 1.14_
  - [x] 2.5 Implement Building CRUD methods
    - getBuildings(projectId?): Promise<FurnitureBuilding[]>

    - createBuilding(data): Promise<FurnitureBuilding> - validate maxFloor > 0, maxAxis >= 0
    - updateBuilding(id, data): Promise<FurnitureBuilding>
    - deleteBuilding(id): Promise<void>
    - _Requirements: 1.10, 1.11, 1.13, 1.14_
  - [x] 2.6 Implement Layout CRUD methods
    - getLayouts(buildingCode): Promise<FurnitureLayout[]>
    - getLayoutByAxis(buildingCode, axis): Promise<FurnitureLayout | null>
    - createLayout(data): Promise<FurnitureLayout> - generate layoutAxis = `${buildingCode}_${axis.toString().padStart(2, '0')}`
    - updateLayout(id, data): Promise<FurnitureLayout>
    - deleteLayout(id): Promise<void>
    - _Requirements: 1.3, 1.10, 1.11, 1.14_
  - [x] 2.7 Implement ApartmentType CRUD methods

    - getApartmentTypes(buildingCode, type?): Promise<FurnitureApartmentType[]>
    - createApartmentType(data): Promise<FurnitureApartmentType>
    - updateApartmentType(id, data): Promise<FurnitureApartmentType>
    - deleteApartmentType(id): Promise<void>
    - _Requirements: 1.4, 1.5, 1.10, 1.11, 1.14_

  - [x] 2.8 Implement Category CRUD methods
    - getCategories(): Promise<FurnitureCategory[]>
    - createCategory(data): Promise<FurnitureCategory>
    - updateCategory(id, data): Promise<FurnitureCategory>
    - deleteCategory(id): Promise<void> - THROW ERROR if products exist

    - _Requirements: 2.1, 2.6, 2.7_
  - [x] 2.9 Implement Product CRUD methods
    - getProducts(categoryId?): Promise<FurnitureProduct[]>
    - createProduct(data): Promise<FurnitureProduct>
    - updateProduct(id, data): Promise<FurnitureProduct>

    - deleteProduct(id): Promise<void>
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  - [x] 2.10 Implement Combo CRUD methods
    - getCombos(apartmentType?): Promise<FurnitureCombo[]> - filter by apartmentType if provided, only active
    - createCombo(data): Promise<FurnitureCombo> - include items

    - updateCombo(id, data): Promise<FurnitureCombo>
    - deleteCombo(id): Promise<void>
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_
  - [x] 2.11 Implement duplicateCombo(id) method

    - Create copy with name = `${originalName} (Copy)`
    - Copy all properties except id
    - Copy all combo items
    - _Requirements: 3.4_
  - [x] 2.12 Implement Fee CRUD methods
    - getFees(applicability?): Promise<FurnitureFee[]> - filter by applicability if provided, only active
    - createFee(data): Promise<FurnitureFee>
    - updateFee(id, data): Promise<FurnitureFee>
    - deleteFee(id): Promise<void>
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 2.13 Implement calculateUnitNumber(buildingCode, floor, axis) method

    - Return: `${buildingCode}.${floor.toString().padStart(2, '0')}${axis.toString().padStart(2, '0')}`
    - Example: calculateUnitNumber('LBV A', 15, 3) => 'LBV A.1503'
    - _Requirements: 6.5_

  - [x] 2.14 Implement calculateQuotation(items, fees, selectionType) method
    - Calculate basePrice = sum of item prices * quantities
    - Filter fees by applicability matching selectionType
    - Apply FIXED fees directly, PERCENTAGE fees as basePrice * value / 100
    - Return: { basePrice, feesBreakdown: [{name, type, value, amount}], totalPrice }

    - _Requirements: 4.5, 7.6_
  - [x] 2.15 Implement createQuotation(data) method
    - Validate leadId exists
    - Calculate unitNumber using calculateUnitNumber
    - Calculate pricing using calculateQuotation

    - Store all required fields
    - _Requirements: 7.8, 11.1, 11.2_
  - [x] 2.16 Implement getQuotationsByLead(leadId) method
    - Return all quotations for a lead, ordered by createdAt desc
    - _Requirements: 8.1, 8.3, 11.3_
  - [x] 2.17 Write property test for metrics grid dimensions


    - **Property 1: Metrics Grid Dimensions**
    - Test: For any maxFloor and maxAxis, grid has maxFloor rows and (maxAxis + 1) columns
    - **Validates: Requirements 1.2**

  - [x] 2.18 Write property test for layout lookup consistency
    - **Property 2: Layout Lookup Consistency**
    - Test: For any valid buildingCode and axis, lookup returns same apartmentType

    - **Validates: Requirements 1.3, 6.6**
  - [x] 2.19 Write property test for unit number format
    - **Property 8: Unit Number Format**

    - Test: For any buildingCode, floor, axis, result matches format {code}.{floor 2 digits}{axis 2 digits}
    - **Validates: Requirements 6.5**
  - [x] 2.20 Write property test for fee calculation

    - **Property 7: Fee Calculation Correctness**
    - Test: totalPrice = basePrice + sum(applicable fees)
    - **Validates: Requirements 4.5, 7.6**

  - [x] 2.21 Write property test for combo duplication
    - **Property 6: Combo Duplication**
    - Test: Duplicated combo has name with "(Copy)" suffix and same properties
    - **Validates: Requirements 3.4**
  - [x] 2.22 Write property test for category deletion constraint

    - **Property 5: Category Deletion Constraint**
    - Test: Deleting category with products throws error
    - **Validates: Requirements 2.7**

- [x] 3. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: API Routes & Validation

- [x] 4. Create Zod validation schemas (api/src/schemas/furniture.schema.ts)








  - [x] 4.1 Create developer schemas

    - createDeveloperSchema: { name: string min 1 max 100 }
    - updateDeveloperSchema: partial of create
    - _Requirements: 1.11_

  - [x] 4.2 Create project schemas

    - createProjectSchema: { name: string, code: string, developerId: cuid }
    - updateProjectSchema: partial of create (exclude developerId)

    - _Requirements: 1.11_

  - [x] 4.3 Create building schemas

    - createBuildingSchema: { name: string, code: string, projectId: cuid, maxFloor: int min 1 max 200, maxAxis: int min 0 max 100 }

    - updateBuildingSchema: partial of create (exclude projectId)
    - _Requirements: 1.11, 1.13_
  - [x] 4.4 Create layout schemas

    - createLayoutSchema: { buildingCode: string, axis: int min 0, apartmentType: string transform trim lowercase }
    - updateLayoutSchema: partial of create
    - _Requirements: 1.7, 1.11_



  - [x] 4.5 Create apartmentType schemas
    - createApartmentTypeSchema: { buildingCode: string, apartmentType: string, imageUrl: url optional, description: string optional }
    - updateApartmentTypeSchema: partial of create


    - _Requirements: 1.11_

  - [x] 4.6 Create category schemas
    - createCategorySchema: { name: string unique, description: string optional, icon: string optional, order: int default 0, isActive: boolean default true }

    - updateCategorySchema: partial of create
    - _Requirements: 2.6_
  - [x] 4.7 Create product schemas

    - createProductSchema: { name: string, categoryId: cuid, price: number positive, imageUrl: url optional, description: string optional, dimensions: string optional }

    - updateProductSchema: partial of create
    - _Requirements: 2.3_



  - [x] 4.8 Create combo schemas
    - createComboSchema: { name: string, apartmentTypes: array of strings, price: number positive, imageUrl: url optional, description: string optional, items: array of { productId: cuid, quantity: int min 1 } }
    - updateComboSchema: partial of create

    - _Requirements: 3.2, 3.3_
  - [x] 4.9 Create fee schemas

    - createFeeSchema: { name: string, type: enum FIXED/PERCENTAGE, value: number positive, applicability: enum COMBO/CUSTOM/BOTH, description: string optional }
    - updateFeeSchema: partial of create
    - _Requirements: 4.2_
  - [x] 4.10 Create quotation schema

    - createQuotationSchema: { leadId: cuid, developerName, projectName, buildingName, buildingCode, floor: int min 1, axis: int min 0, apartmentType, layoutImageUrl optional, selectionType: enum COMBO/CUSTOM, comboId optional, items: array }
    - _Requirements: 7.8, 11.2_
  - [x] 4.11 Write property test for ApartmentType normalization


    - **Property 4: ApartmentType Normalization**
    - Test: Any string with whitespace is trimmed and lowercased
    - **Validates: Requirements 1.7**



- [x] 5. Create Furniture API Routes (api/src/routes/furniture.routes.ts)

  - [x] 5.1 Create createFurnitureRoutes(prisma: PrismaClient) factory function


    - Follow pricing.routes.ts pattern
    - Import authenticate, requireRole from auth.middleware
    - Import validate, getValidatedBody from validation middleware
    - Import successResponse, errorResponse from utils/response
    - _Requirements: 10.4_

  - [x] 5.2 Add public GET endpoints for landing page

    - GET /furniture/developers - list all developers
    - GET /furniture/projects?developerId={id} - list projects by developer
    - GET /furniture/buildings?projectId={id} - list buildings by project
    - GET /furniture/layouts?buildingCode={code} - list layouts by building code
    - GET /furniture/layouts/by-axis?buildingCode={code}&axis={axis} - get single layout
    - GET /furniture/apartment-types?buildingCode={code}&type={type} - list apartment types
    - GET /furniture/categories - list active categories
    - GET /furniture/products?categoryId={id} - list active products
    - GET /furniture/combos?apartmentType={type} - list active combos
    - GET /furniture/fees?applicability={type} - list active fees

    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 7.2, 7.3_
  - [x] 5.3 Add public POST endpoint for quotation


    - POST /furniture/quotations - create quotation (also creates/updates lead)
    - _Requirements: 7.8_
  - [x] 5.4 Add admin CRUD endpoints for developers

    - GET /admin/furniture/developers - authenticate, requireRole('ADMIN', 'MANAGER')
    - POST /admin/furniture/developers - validate(createDeveloperSchema)

    - PUT /admin/furniture/developers/:id - validate(updateDeveloperSchema)
    - DELETE /admin/furniture/developers/:id
    - _Requirements: 1.10, 1.11, 1.14, 10.1, 10.2_

  - [x] 5.5 Add admin CRUD endpoints for projects

    - Same pattern as developers

    - _Requirements: 1.10, 1.11, 1.14, 10.1, 10.2_
  - [x] 5.6 Add admin CRUD endpoints for buildings


    - Same pattern as developers
    - _Requirements: 1.10, 1.11, 1.13, 1.14, 10.1, 10.2_
  - [x] 5.7 Add admin CRUD endpoints for layouts


    - Same pattern as developers
    - _Requirements: 1.10, 1.11, 1.14, 10.1, 10.2_

  - [x] 5.8 Add admin CRUD endpoints for apartment types

    - Same pattern as developers

    - _Requirements: 1.10, 1.11, 1.14, 10.1, 10.2_
  - [x] 5.9 Add admin CRUD endpoints for categories

    - Same pattern as developers

    - _Requirements: 2.1, 2.6, 2.7, 10.1, 10.2_
  - [x] 5.10 Add admin CRUD endpoints for products


    - Same pattern as developers
    - _Requirements: 2.3, 2.4, 2.5, 10.1, 10.2_
  - [x] 5.11 Add admin CRUD endpoints for combos


    - Same pattern as developers
    - Add POST /admin/furniture/combos/:id/duplicate
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 10.1, 10.2_
  - [x] 5.12 Add admin CRUD endpoints for fees

    - Same pattern as developers
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 10.1, 10.2_
  - [x] 5.13 Add admin quotation history endpoint

    - GET /admin/furniture/quotations?leadId={id}
    - _Requirements: 8.1, 8.3, 11.3_
  - [x] 5.14 Register routes in api/src/main.ts


    - Import createFurnitureRoutes
    - Mount at /furniture and /admin/furniture
    - _Requirements: 10.4_




- [x] 6. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Import/Export & Google Sheets Sync



- [x] 7. Implement CSV Import/Export in furniture.service.ts



  - [x] 7.1 Implement parseCSV(content: string) helper function


    - Parse CSV string to array of objects
    - Handle quoted values with commas
    - _Requirements: 1.6_

  - [x] 7.2 Implement generateCSV(data: object[], headers: string[]) helper function

    - Generate CSV string from array of objects
    - Quote values containing commas
    - _Requirements: 1.8_
  - [x] 7.3 Implement importFromCSV(files: { duAn: string; layouts: string; apartmentTypes: string }) method


    - Parse DuAn.csv: extract unique developers, projects, buildings
    - Parse LayoutIDs.csv: create layouts with normalized apartmentType (trim, lowercase)
    - Parse ApartmentType.csv: create apartment types
    - Validate SoTruc within SoTrucMax range
    - Use transaction for atomicity
    - Return: { developers: number, projects: number, buildings: number, layouts: number, apartmentTypes: number }
    - _Requirements: 1.6, 1.7_
  - [x] 7.4 Implement exportToCSV() method


    - Generate DuAn.csv: ChuDauTu,TenDuAn,MaDuAn,TenToaNha,MaToaNha,SoTangMax,SoTrucMax
    - Generate LayoutIDs.csv: LayoutAxis,MaToaNha,SoTruc,ApartmentType
    - Generate ApartmentType.csv: MaToaNha,ApartmentType,Ảnh,Mô tả
    - Return: { duAn: string, layouts: string, apartmentTypes: string }
    - _Requirements: 1.8_
  - [x] 7.5 Write property test for CSV round trip


    - **Property 3: CSV Import/Export Round Trip**
    - Test: Export then import produces equivalent dataset
    - **Validates: Requirements 1.6, 1.8**
  - [x] 7.6 Add import/export API endpoints in furniture.routes.ts


    - POST /admin/furniture/import - accept multipart form with 3 files
    - GET /admin/furniture/export - return JSON with 3 CSV strings
    - _Requirements: 1.6, 1.8_

- [x] 8. Implement Google Sheets Sync








  - [x] 8.1 Add furniture sync methods to googleSheetsService

    - syncFurniturePull(spreadsheetId: string): read 3 tabs, call importFromCSV
    - syncFurniturePush(spreadsheetId: string): call exportToCSV, write to 3 tabs
    - Tab names: DuAn, Layout, ApartmentType

    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 8.2 Write property test for Google Sheets sync round trip



    - **Property 10: Google Sheets Sync Round Trip**
    - Test: Push then pull produces equivalent dataset
    - **Validates: Requirements 9.3, 9.4**

  - [x] 8.3 Add sync API endpoints in furniture.routes.ts


    - POST /admin/furniture/sync/pull - body: { spreadsheetId }
    - POST /admin/furniture/sync/push - body: { spreadsheetId }
    - Return: { success: boolean, counts: {...}, error?: string }
    - _Requirements: 9.3, 9.4, 9.5, 9.6_

- [x] 9. Checkpoint - Ensure all tests pass
  - All 767 tests pass (verified 2024-12-26)

## Phase 4: Admin Panel UI

- [x] 10. Create Admin API Client (admin/src/app/api/furniture.ts)



  - [x] 10.1 Create furnitureDevelopersApi object


    - list(): apiFetch<FurnitureDeveloper[]>('/admin/furniture/developers')
    - create(data): apiFetch POST
    - update(id, data): apiFetch PUT
    - delete(id): apiFetch DELETE
    - _Requirements: 1.1_

  - [x] 10.2 Create furnitureProjectsApi object
    - list(developerId?): with optional query param
    - create, update, delete methods

    - _Requirements: 1.1_
  - [x] 10.3 Create furnitureBuildingsApi object
    - list(projectId?): with optional query param

    - create, update, delete methods
    - _Requirements: 1.1_
  - [x] 10.4 Create furnitureLayoutsApi object
    - list(buildingCode): required param

    - getByAxis(buildingCode, axis): for single lookup
    - create, update, delete methods
    - _Requirements: 1.3_

  - [x] 10.5 Create furnitureApartmentTypesApi object
    - list(buildingCode, type?): with optional type filter
    - create, update, delete methods
    - _Requirements: 1.4_
  - [x] 10.6 Create furnitureCategoriesApi object
    - list, create, update, delete methods
    - _Requirements: 2.1_
  - [x] 10.7 Create furnitureProductsApi object

    - list(categoryId?): with optional filter
    - create, update, delete methods
    - _Requirements: 2.2_

  - [x] 10.8 Create furnitureCombosApi object
    - list(apartmentType?): with optional filter
    - create, update, delete, duplicate methods

    - _Requirements: 3.1_
  - [x] 10.9 Create furnitureFeesApi object
    - list(applicability?): with optional filter

    - create, update, delete methods
    - _Requirements: 4.1_
  - [x] 10.10 Create furnitureDataApi object
    - import(files): FormData upload
    - export(): get CSV strings

    - syncPull(spreadsheetId): POST
    - syncPush(spreadsheetId): POST
    - _Requirements: 1.6, 1.8, 9.3, 9.4_
  - [x] 10.11 Create furnitureQuotationsApi object

    - list(leadId): get quotations by lead
    - _Requirements: 8.1_

- [x] 11. Create FurniturePage Types (admin/src/app/pages/FurniturePage/types.ts)






  - [x] 11.1 Define TypeScript interfaces for all entities

    - FurnitureDeveloper, FurnitureProject, FurnitureBuilding
    - FurnitureLayout, FurnitureApartmentType
    - FurnitureCategory, FurnitureProduct
    - FurnitureCombo, FurnitureComboItem
    - FurnitureFee, FurnitureQuotation
    - TabType = 'management' | 'catalog' | 'combo' | 'settings'
    - _Requirements: 1.1_

- [x] 12. Create FurniturePage Main Component (admin/src/app/pages/FurniturePage/index.tsx)






  - [x] 12.1 Create FurniturePage component

    - Import ResponsiveTabs, Tab from '../../../components/responsive'
    - Import tokens from '@app/shared'
    - Import motion from 'framer-motion'
    - State: activeTab, loading
    - _Requirements: 1.1_

  - [x] 12.2 Fetch all data on mount
    - Parallel fetch: developers, projects, buildings, layouts, apartmentTypes, categories, products, combos, fees
    - Pass data to child tabs

    - _Requirements: 1.1_
  - [x] 12.3 Define tabs array with ResponsiveTabs
    - Tab 1: id='management', label='Quản lý', icon='ri-building-line'
    - Tab 2: id='catalog', label='Catalog', icon='ri-store-line'
    - Tab 3: id='combo', label='Combo', icon='ri-gift-line'

    - Tab 4: id='settings', label='Cài đặt', icon='ri-settings-line'
    - _Requirements: 1.1_
  - [x] 12.4 Render ResponsiveTabs with mobileMode="dropdown"
    - Follow PricingConfigPage pattern
    - _Requirements: 1.1_

- [x] 13. Create ManagementTab Component (admin/src/app/pages/FurniturePage/ManagementTab.tsx)








  - [x] 13.1 Create ManagementTab component with props


    - Props: developers, projects, buildings, layouts, apartmentTypes, onRefresh
    - State: selectedDeveloper, selectedProject, selectedBuilding
    - _Requirements: 1.1_
  - [x] 13.2 Implement hierarchical dropdowns section

    - Use ResponsiveGrid for layout
    - Developer dropdown: filter projects on change
    - Project dropdown: filter buildings on change
    - Building dropdown: update metrics grid on change
    - _Requirements: 1.1_
  - [x] 13.3 Implement Import/Export/Sync buttons section

    - Position: top right of section
    - Import button: open file picker for 3 CSV files
    - Export button: download 3 CSV files
    - Sync dropdown: Pull and Push options
    - Use ResponsiveActionBar for button group
    - _Requirements: 1.6, 1.8, 1.9_
  - [x] 13.4 Implement MetricsGrid component

    - Display when building is selected
    - Rows: 1 to maxFloor (descending order, top = highest floor)
    - Columns: 0 to maxAxis
    - Cell content: apartmentType from layouts lookup
    - Cell click: open edit modal
    - Use ResponsiveTable or custom grid
    - _Requirements: 1.2, 1.3_
  - [x] 13.5 Implement LayoutCards component

    - Display below metrics grid
    - Show image and description for each apartmentType
    - Filter by selected building's code
    - Use ResponsiveGrid for card layout
    - _Requirements: 1.4, 1.5_
  - [x] 13.6 Implement inline editing for developers

    - Add/Edit/Delete buttons
    - Use ResponsiveModal for forms
    - _Requirements: 1.10, 1.11, 1.14_
  - [x] 13.7 Implement inline editing for projects

    - Same pattern as developers
    - _Requirements: 1.10, 1.11, 1.14_
  - [x] 13.8 Implement inline editing for buildings

    - Same pattern as developers
    - _Requirements: 1.10, 1.11, 1.13, 1.14_
  - [x] 13.9 Implement inline editing for layouts

    - Edit apartmentType for each axis
    - _Requirements: 1.10, 1.11, 1.14_
  - [x] 13.10 Implement inline editing for apartment types

    - Edit image and description
    - Use mediaApi.uploadFile for image upload
    - _Requirements: 1.10, 1.11, 1.14_

- [x] 14. Create CatalogTab Component (admin/src/app/pages/FurniturePage/CatalogTab.tsx)





  - [x] 14.1 Create CatalogTab component with props


    - Props: categories, products, onRefresh
    - State: selectedCategory
    - _Requirements: 2.1_
  - [x] 14.2 Implement two-column layout

    - Use ResponsiveGrid with columns: { mobile: 1, tablet: 2, desktop: 2 }
    - Left column: categories list
    - Right column: products grid
    - _Requirements: 2.1_
  - [x] 14.3 Implement categories list

    - Display category name, icon, product count
    - Click to filter products
    - Add/Edit/Delete buttons
    - _Requirements: 2.1, 2.6, 2.7_
  - [x] 14.4 Implement category form modal

    - Fields: name, description, icon (IconPicker), order, isActive
    - Use ResponsiveModal
    - _Requirements: 2.6_
  - [x] 14.5 Implement products grid

    - Filter by selected category
    - Display: image, name, price, category
    - Use ResponsiveGrid for cards
    - _Requirements: 2.2_
  - [x] 14.6 Implement product form modal

    - Fields: name, categoryId (select), price, imageUrl (upload), description, dimensions
    - Use mediaApi.uploadFile for image
    - Use ResponsiveModal
    - _Requirements: 2.3_
  - [x] 14.7 Implement product delete with confirmation

    - Use ResponsiveModal for confirmation
    - _Requirements: 2.5_

- [x] 15. Create ComboTab Component (admin/src/app/pages/FurniturePage/ComboTab.tsx)







  - [x] 15.1 Create ComboTab component with props

    - Props: combos, products, onRefresh
    - _Requirements: 3.1_

  - [x] 15.2 Implement combo list

    - Display: name, apartmentTypes (badges), price, status toggle
    - Use ResponsiveTable

    - _Requirements: 3.1, 3.5_

  - [x] 15.3 Implement combo form modal
    - Fields: name, apartmentTypes (multi-select), price, imageUrl, description
    - Product selection: checkbox list with quantity input

    - Use ResponsiveModal
    - _Requirements: 3.2, 3.3_
  - [x] 15.4 Implement duplicate button

    - Call duplicateCombo API
    - Refresh list after success

    - _Requirements: 3.4_
  - [x] 15.5 Implement status toggle
    - Toggle isActive with API call
    - _Requirements: 3.5_

- [x] 16. Create SettingsTab Component (admin/src/app/pages/FurniturePage/SettingsTab.tsx)




  - [x] 16.1 Create SettingsTab component with props

    - Props: fees, onRefresh
    - _Requirements: 4.1_

  - [x] 16.2 Implement fees list
    - Display: name, type, value, applicability, status
    - Use ResponsiveTable

    - _Requirements: 4.1_
  - [x] 16.3 Implement fee form modal
    - Fields: name, type (select: FIXED/PERCENTAGE), value, applicability (select: COMBO/CUSTOM/BOTH), description

    - Use ResponsiveModal
    - _Requirements: 4.2_

  - [x] 16.4 Implement fee delete with confirmation

    - _Requirements: 4.4_

- [x] 17. Register FurniturePage in Admin Router

  - [x] 17.1 Add route in admin/src/app/app.tsx


    - Path: /furniture
    - Component: FurniturePage
    - _Requirements: 10.1, 10.2_

  - [x] 17.2 Add navigation link in Layout sidebar

    - Label: 'Nội thất'
    - Icon: 'ri-sofa-line'
    - Path: /furniture
    - _Requirements: 10.1, 10.2_


- [x] 18. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Landing Page Section

- [x] 19. Create FurnitureQuote Section (landing/src/app/sections/FurnitureQuote/index.tsx)







  - [x] 19.1 Create FurnitureQuote section component






    - State: currentStep (1-7), selections (developer, project, building, floor, axis, layout, furniture)
    - State: leadData, quotationResult
    - _Requirements: 6.1_

  - [x] 19.2 Implement step indicator UI
    - Display steps 1-7 with current step highlighted
    - Allow clicking previous steps to go back

    - _Requirements: 6.1_
  - [x] 19.3 Implement step navigation logic
    - Next/Back buttons
    - Validate current step before proceeding
    - _Requirements: 6.1_




- [x] 20. Create StepSelector Component (landing/src/app/sections/FurnitureQuote/StepSelector.tsx)


  - [x] 20.1 Create StepSelector component for Steps 1-4


    - Props: currentStep, selections, onSelect, developers, projects, buildings
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 20.2 Implement Step 1: Developer selection

    - Fetch developers from API
    - Display as selectable cards or list
    - _Requirements: 6.1_
  - [x] 20.3 Implement Step 2: Project selection

    - Filter projects by selected developer
    - Display as selectable cards
    - _Requirements: 6.2_
  - [x] 20.4 Implement Step 3: Building selection

    - Filter buildings by selected project
    - Display TenToaNha as selectable cards
    - _Requirements: 6.3_

  - [x] 20.5 Implement Step 4: Floor and Axis selection
    - Floor dropdown: 1 to maxFloor
    - Axis dropdown: 0 to maxAxis
    - Display calculated unit number after selection
    - _Requirements: 6.4, 6.5_
  - [x] 20.6 Write property test for invalid axis error handling


    - **Property 9: Invalid Axis Error Handling**
    - Test: Selecting axis not in LayoutIDs returns error
    - **Validates: Requirements 6.7**

- [x] 21. Create LayoutSelector Component (landing/src/app/sections/FurnitureQuote/LayoutSelector.tsx)





  - [x] 21.1 Create LayoutSelector component for Step 5


    - Props: buildingCode, axis, apartmentType, onSelect
    - Fetch apartment types from API
    - _Requirements: 6.7, 6.8_
  - [x] 21.2 Display layout options

    - Show all apartment types matching buildingCode and apartmentType
    - Display image and description for each
    - _Requirements: 6.8_
  - [x] 21.3 Implement lightbox preview

    - Click image to open full-size preview
    - Use existing modal or lightbox component
    - _Requirements: 6.9_
  - [x] 21.4 Implement layout selection

    - Click to select layout
    - Proceed to lead form after selection
    - _Requirements: 6.10_



- [x] 22. Create LeadForm Component (landing/src/app/sections/FurnitureQuote/LeadForm.tsx)







  - [x] 22.1 Create LeadForm component


    - Props: onSubmit, formConfig (from section data)
    - State: formData, errors
    - Reuse existing leads API for submission
    - _Requirements: 5.4, 5.5_
  - [x] 22.2 Render form fields from config

    - Support types: text, phone, email, select, textarea
    - Mark required fields
    - Default fields: name (required), phone (required)
    - _Requirements: 5.4_
  - [x] 22.3 Implement form validation

    - Validate required fields
    - Validate phone format (reuse existing regex from leads.schema.ts)
    - Validate email format
    - _Requirements: 5.5_
  - [x] 22.4 Implement form submission

    - Call existing leadsApi.create() or POST /api/leads
    - Set source = 'FURNITURE_QUOTE'
    - Store leadId for quotation
    - Proceed to furniture selection
    - _Requirements: 5.5, 6.11_

- [x] 23. Create FurnitureSelector Component (landing/src/app/sections/FurnitureQuote/FurnitureSelector.tsx)



  - [x] 23.1 Create FurnitureSelector component for Step 6


    - Props: apartmentType, onSelect
    - State: selectionType (combo/custom), selectedCombo, selectedProducts
    - _Requirements: 7.1_
  - [x] 23.2 Implement Combo/Custom toggle

    - Two buttons: Combo and Custom
    - Expand selected option
    - _Requirements: 7.1_
  - [x] 23.3 Implement Combo selection view

    - Fetch combos filtered by apartmentType
    - Display combo cards with image, name, price
    - Click to select
    - _Requirements: 7.2_
  - [x] 23.4 Implement Custom selection view

    - Fetch categories and products
    - Category filter dropdown
    - Price sort dropdown (low to high, high to low)
    - _Requirements: 7.3, 7.4_

  - [x] 23.5 Implement product selection in Custom mode

    - Display products as cards
    - Add to selection with quantity
    - Show running total
    - _Requirements: 7.5_

- [x] 24. Create QuotationResult Component (landing/src/app/sections/FurnitureQuote/QuotationResult.tsx)





  - [x] 24.1 Create QuotationResult component for Step 7


    - Props: selections, leadId, onComplete
    - _Requirements: 7.6_

  - [x] 24.2 Calculate and display quotation
    - Fetch applicable fees
    - Calculate total using calculateQuotation logic
    - Display itemized breakdown
    - _Requirements: 7.6, 7.7_
  - [x] 24.3 Save quotation to database

    - Call createQuotation API
    - Include all required fields
    - _Requirements: 7.8_
  - [x] 24.4 Write property test for quotation data completeness


    - **Property 11: Quotation Data Completeness**
    - Test: Created quotation contains all required fields
    - **Validates: Requirements 11.2**

- [x] 25. Register FurnitureQuote Section Type





  - [x] 25.1 Add FURNITURE_QUOTE to section types in admin


    - Update SectionTypePicker component
    - Add icon and label
    - _Requirements: 5.1_
  - [x] 25.2 Add section data schema for form fields config


    - formFields: array of { name, type, required, placeholder, options }
    - _Requirements: 5.1, 5.2, 5.3_


- [x] 26. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Quotation History & PDF Export

- [x] 27. Integrate Quotation History with existing LeadsPage





  - [x] 27.1 Extend QuoteDataDisplay component in LeadsPage.tsx


    - Add support for furniture quotation data format
    - Display: apartment info, selection type, items, fees, total
    - Reuse existing component structure
    - _Requirements: 8.1, 8.3, 11.3_
  - [x] 27.2 Add FurnitureQuotationHistory component


    - Display list of furniture quotations for a lead
    - Show: date, apartment info (unit number), selection type, total
    - Click to expand full details
    - _Requirements: 8.3_
  - [x] 27.3 Integrate FurnitureQuotationHistory into lead detail modal


    - Add section below existing QuoteDataDisplay
    - Fetch quotations when lead is selected
    - _Requirements: 8.1, 11.3_

- [x] 28. Implement PDF Export









  - [x] 28.1 Add PDF generation endpoint

    - GET /admin/furniture/quotations/:id/pdf
    - Use pdfkit or similar library
    - _Requirements: 8.2_
  - [x] 28.2 Design PDF template

    - Header: company logo, date
    - Apartment info: developer, project, building, unit number, layout
    - Items: name, quantity, price
    - Fees: name, type, amount
    - Total: grand total
    - _Requirements: 8.2_
  - [x] 28.3 Add Export PDF button in quotation detail


    - Download PDF file
    - _Requirements: 8.2_

- [ ] 29. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.
