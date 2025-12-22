# Implementation Plan

## Phase 1: Database & API Foundation

- [x] 1. Set up Prisma schema for Interior module
  - [x] 1.1 Add InteriorDeveloper model with all fields and indexes
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Add InteriorDevelopment model with developer relation
    - _Requirements: 2.1, 2.2_
  - [x] 1.3 Add InteriorBuilding model with development relation and axis configuration
    - _Requirements: 3.1, 3.2_
  - [x] 1.4 Add InteriorBuildingUnit model with building and layout relations
    - _Requirements: 4.1, 4.2_
  - [x] 1.5 Add InteriorUnitLayout model with room breakdown JSON field
    - _Requirements: 5.1, 5.2_
  - [x] 1.6 Add InteriorPackage model with items JSON field
    - _Requirements: 6.1, 6.2_
  - [x] 1.7 Add InteriorFurnitureCategory and InteriorFurnitureItem models
    - _Requirements: 7.1, 7.2_
  - [x] 1.8 Add InteriorSurcharge model with conditions JSON field
    - _Requirements: 8.1, 8.2_
  - [x] 1.9 Add InteriorQuoteSettings singleton model
    - _Requirements: 9.1-9.7_
  - [x] 1.10 Add InteriorRoomType model
    - _Requirements: 10.1, 10.2_
  - [x] 1.11 Add InteriorQuote model with all pricing fields
    - _Requirements: 15.1-15.8, 17.1-17.6_
  - [x] 1.12 Run prisma generate and push schema
    - _Requirements: 19.1_

- [x] 2. Create API schemas (Zod validation)
  - [x] 2.1 Create interior.schema.ts with all validation schemas
    - Developer, Development, Building schemas
    - BuildingUnit, Layout, Package schemas
    - Surcharge, Settings, RoomType schemas
    - Quote calculation and save schemas
    - _Requirements: 18.4, 19.1-19.6_
  - [x] 2.2 Write property test for schema validation
    - **Property 19: Validation error specificity**
    - **Validates: Requirements 18.4**


- [x] 3. Implement Developer service and routes
  - [x] 3.1 Create developer.service.ts with CRUD operations
    - list, getById, create, update, delete, reorder functions
    - Slug generation from name
    - Development count aggregation
    - _Requirements: 1.1-1.6_
  - [x] 3.2 Write property test for slug uniqueness
    - **Property 1: Developer slug uniqueness and format**
    - **Validates: Requirements 1.2**
  - [x] 3.3 Write property test for referential integrity
    - **Property 3: Referential integrity on deletion**
    - **Validates: Requirements 1.5**
  - [x] 3.4 Add developer routes to interior.routes.ts


    - Public: GET /developers, GET /developers/:id
    - Admin: full CRUD + reorder
    - _Requirements: 18.1, 18.2_

- [x] 4. Implement Development service and routes
  - [x] 4.1 Create development.service.ts with CRUD operations
    - Filter by developerId
    - Building count aggregation
    - Image handling (thumbnail, gallery)
    - _Requirements: 2.1-2.6_
  - [x] 4.2 Write property test for developer filter
    - **Property 2: Inactive entities filtered from public API**
    - **Validates: Requirements 2.5**

  - [x] 4.3 Add development routes to interior.routes.ts
    - _Requirements: 18.1, 18.2_

- [x] 5. Implement Building service and routes
  - [x] 5.1 Create building.service.ts with CRUD operations
    - Axis labels parsing and validation
    - Floor range validation
    - Unit code format handling
    - Special floors configuration
    - _Requirements: 3.1-3.6_
  - [x] 5.2 Write property test for floor range validation
    - **Property 5: Floor range validation**
    - **Validates: Requirements 3.3**
  - [x] 5.3 Write property test for axis uniqueness
    - **Property 6: Axis labels uniqueness**
    - **Validates: Requirements 3.2**
  - [x] 5.4 Write property test for unit code format
    - **Property 7: Unit code format generation**


    - **Validates: Requirements 3.4**
  - [x] 5.5 Add building routes to interior.routes.ts
    - _Requirements: 18.1, 18.2_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


## Phase 2: Core Entities (Unit, Layout, Package)

- [x] 7. Implement BuildingUnit service and routes
  - [x] 7.1 Create building-unit.service.ts with CRUD operations
    - Matrix view data aggregation
    - Layout assignment with type validation
    - Floor range application
    - Bulk import from Excel
    - _Requirements: 4.1-4.7_
  - [x] 7.2 Write property test for layout-unit type matching
    - **Property 8: Layout-unit type matching**
    - **Validates: Requirements 4.3**
  - [x] 7.3 Add building unit routes to interior.routes.ts
    - _Requirements: 18.1, 18.2_

- [x] 8. Implement Layout service and routes
  - [x] 8.1 Create layout.service.ts with CRUD operations
    - Room breakdown JSON handling
    - Room areas sum calculation
    - Clone functionality
    - Package count aggregation
    - _Requirements: 5.1-5.7_
  - [x] 8.2 Write property test for room areas sum
    - **Property 9: Room areas sum validation**
    - **Validates: Requirements 5.3**
  - [x] 8.3 Write property test for clone operation
    - **Property 11: Clone operation creates distinct entity**
    - **Validates: Requirements 5.6**
  - [x] 8.4 Add layout routes to interior.routes.ts
    - _Requirements: 18.1, 18.2_

- [x] 9. Implement Package service and routes
  - [x] 9.1 Create package.service.ts with CRUD operations
    - Items JSON handling by room
    - Total items and price calculation
    - Clone to another layout
    - Featured flag handling
    - _Requirements: 6.1-6.7_
  - [x] 9.2 Write property test for items calculation
    - **Property 10: Package items calculation**
    - **Validates: Requirements 6.3**
  - [x] 9.3 Add package routes to interior.routes.ts
    - _Requirements: 18.1, 18.2_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Supporting Entities (Furniture, Surcharge, Settings)

- [x] 11. Implement Furniture Catalog service and routes
  - [x] 11.1 Create furniture.service.ts with category and item CRUD
    - Hierarchical category structure
    - Item search with filters
    - Room type to category linking
    - Bulk import
    - _Requirements: 7.1-7.6_
  - [x] 11.2 Write property test for category hierarchy
    - **Property 12: Furniture category hierarchy**
    - **Validates: Requirements 7.1**
  - [x] 11.3 Add furniture routes to interior.routes.ts
    - _Requirements: 18.1, 18.2_

- [x] 12. Implement Surcharge service and routes
  - [x] 12.1 Create surcharge.service.ts with CRUD operations
    - Conditions JSON handling
    - Condition evaluation logic (AND logic)
    - Test interface for conditions
    - _Requirements: 8.1-8.6_
  - [x] 12.2 Write property test for condition AND logic
    - **Property 13: Surcharge condition AND logic**
    - **Validates: Requirements 8.3**
  - [x] 12.3 Add surcharge routes to interior.routes.ts
    - _Requirements: 18.1, 18.2_

- [x] 13. Implement Settings and RoomType services
  - [x] 13.1 Create quote-settings.service.ts (singleton CRUD)
    - _Requirements: 9.1-9.7_
  - [x] 13.2 Create room-type.service.ts with CRUD operations
    - Default categories linking
    - Order handling
    - _Requirements: 10.1-10.4_
  - [x] 13.3 Write property test for order field
    - **Property 4: Order field affects list ordering**
    - **Validates: Requirements 1.6, 10.3**
  - [x] 13.4 Add settings and room-type routes to interior.routes.ts
    - _Requirements: 18.1, 18.2_

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


## Phase 4: Quote Calculation & Management

- [x] 15. Implement Quote calculation service



  - [x] 15.1 Create quote.service.ts with calculation logic

    - Unit info resolution (development → building → unit → layout)
    - Labor cost calculation with min/max clamping
    - Surcharge evaluation and application
    - Management fee calculation (fixed/percentage)
    - Contingency calculation
    - VAT calculation
    - Grand total and price per sqm
    - _Requirements: 15.1-15.4_

  - [x] 15.2 Write property test for quote calculation formula
    - **Property 15: Quote calculation formula**

    - **Validates: Requirements 15.2, 15.4**
  - [x] 15.3 Write property test for auto-apply surcharges

    - **Property 14: Auto-apply surcharge inclusion**
    - **Validates: Requirements 8.4**




- [x] 16. Implement Quote save and management
  - [x] 16.1 Add quote save functionality
    - Quote code generation (INT-YYYY-NNN)


    - CustomerLead creation with source="INTERIOR_QUOTE"

    - Validity date calculation
    - _Requirements: 15.5-15.8, 20.4_

  - [x] 16.2 Write property test for quote code uniqueness
    - **Property 16: Quote code uniqueness**
    - **Validates: Requirements 18.6**
  - [x] 16.3 Write property test for CustomerLead creation

    - **Property 20: CustomerLead creation from quote**
    - **Validates: Requirements 20.4**
  - [x] 16.4 Add quote list and detail for admin
    - Filtering by status, date, development, price
    - Status update functionality
    - CSV export
    - _Requirements: 17.1-17.5_
  - [x] 16.5 Write property test for quote expiration
    - **Property 17: Quote validity expiration**
    - **Validates: Requirements 17.6**
  - [x] 16.6 Add quote routes to interior.routes.ts

    - Public: POST /quotes/calculate, POST /quotes, GET /quotes/:code
    - Admin: GET /quotes, GET /quotes/:id, PUT /quotes/:id/status, GET /quotes/export
    - _Requirements: 18.1, 18.2_

- [x] 17. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Admin UI Implementation

- [x] 18. Create Admin Interior page structure
  - [x] 18.1 Create InteriorPage/index.tsx with tab navigation
    - 11 tabs: Developers, Developments, Buildings, Units, Layouts, Packages, Furniture, Surcharges, Settings, RoomTypes, Quotes
    - _Requirements: 20.1_
  - [x] 18.2 Add Interior page to admin routing and navigation
    - Add to sidebar menu under "Nội thất" section
    - _Requirements: 20.1_

- [x] 19. Implement Developers tab



  - [x] 19.1 Create DevelopersTab.tsx with table and CRUD



    - List with name, logo, status, development count
    - Create/Edit modal with all fields
    - Delete confirmation with dependency check
    - Drag-and-drop reorder
    - _Requirements: 1.1-1.6_

- [x] 20. Implement Developments tab

  - [x] 20.1 Create DevelopmentsTab.tsx with table and CRUD

    - Filter by developer dropdown
    - List with developer, name, code, building count, status
    - Create/Edit modal with image upload
    - _Requirements: 2.1-2.6_



- [x] 21. Implement Buildings tab
  - [x] 21.1 Create BuildingsTab.tsx with table and CRUD
    - Filter by development dropdown
    - List with development, name, code, floors, axes
    - Create/Edit modal with:
      - Floor configuration (total, start, end)
      - Axis labels input (comma-separated)
      - Unit code format selector with preview
      - Special floors configuration




      - Floor plan image upload

    - _Requirements: 3.1-3.6_

- [x] 22. Implement Building Units tab

  - [x] 22.1 Create BuildingUnitsTab.tsx with matrix view

    - Building selector
    - Matrix grid: axes (columns) × floors (rows)
    - Cell shows layout name or empty
    - Click cell to assign/edit unit


    - Unit modal with:
      - Axis, unit type, bedrooms, bathrooms
      - Position, direction, view


      - Floor range
      - Layout selector (filtered by unit type)
    - Bulk import button
    - _Requirements: 4.1-4.7_


- [x] 23. Implement Layouts tab

  - [x] 23.1 Create LayoutsTab.tsx with table and CRUD

    - List with name, code, unit type, areas, package count
    - Create/Edit modal with:
      - Basic info (name, code, unit type, bedrooms, bathrooms)
      - Area inputs (gross, net, carpet, balcony, terrace)
      - Room breakdown editor (add/remove rooms with name, area, type)
      - Image uploads (2D, 3D, dimensions)
      - Highlights tags input
    - Clone button
    - _Requirements: 5.1-5.7_



- [x] 24. Implement Packages tab


  - [x] 24.1 Create PackagesTab.tsx with table and CRUD

    - Filter by layout dropdown
    - List with layout, name, tier, price, items count, featured
    - Create/Edit modal with:
      - Basic info (name, code, tier, prices)
      - Description fields
      - Image uploads (thumbnail, gallery)
      - Items editor by room (nested form)
      - Warranty and installation info
    - Clone to another layout button
    - Featured toggle
    - _Requirements: 6.1-6.7_

- [x] 25. Implement Furniture Catalog tab
  - [x] 25.1 Create FurnitureCatalogTab.tsx with categories and items

    - Split view: categories tree (left) + items table (right)
    - Category tree with drag-and-drop hierarchy
    - Category modal with parent selector, room types
    - Items table with filters (category, brand, price range, search)
    - Item modal with all fields including dimensions JSON
    - Bulk import button
    - _Requirements: 7.1-7.6_

- [x] 26. Implement Surcharges tab



  - [x] 26.1 Create SurchargesTab.tsx with table and CRUD

    - List with name, code, type, value, auto-apply, optional
    - Create/Edit modal with:
      - Basic info (name, code, type, value)
      - Conditions editor:
        - Floor range (min, max)
        - Area range (min, max)
        - Unit types multi-select
        - Positions multi-select
        - Buildings multi-select
        - Developments multi-select
      - Auto-apply and optional toggles
    - Test conditions button (opens test modal)
    - _Requirements: 8.1-8.6_

- [x] 27. Implement Settings tab


  - [x] 27.1 Create QuoteSettingsTab.tsx with form


    - Labor cost section (per sqm, min, max)
    - Management fee section (type toggle, value)
    - Contingency section (type toggle, value)
    - VAT section (enabled toggle, percent)
    - Discount section (max percent)
    - Quote validity (days)
    - Display options (checkboxes)
    - Company info section
    - Save button
    - _Requirements: 9.1-9.7_

- [x] 28. Implement Room Types tab


  - [x] 28.1 Create RoomTypesTab.tsx with table and CRUD


    - List with code, name, icon, default categories
    - Create/Edit modal with:
      - Code, Vietnamese name, English name
      - Icon selector
      - Default categories multi-select
    - Drag-and-drop reorder
    - _Requirements: 10.1-10.4_


- [x] 29. Implement Quotes tab




  - [x] 29.1 Create QuotesTab.tsx with table and detail modal



    - Filters: status, date range, development, price range
    - List with code, customer, unit, package, total, status, date
    - Detail modal showing full breakdown
    - Status update dropdown
    - Export CSV button
    - _Requirements: 17.1-17.6_


- [x] 30. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.


## Phase 6: Landing Page Implementation

- [x] 31. Create Landing Page structure




  - [x] 31.1 Create InteriorQuotePage.tsx at /noi-that route



    - Add route to landing app.tsx
    - Page wrapper with header/footer
    - _Requirements: 20.2, 20.5_
  - [x] 31.2 Create InteriorQuoteSection for CMS integration


    - Section kind: INTERIOR_QUOTE
    - Add to section renderer
    - _Requirements: 20.2_

- [x] 32. Implement Wizard container and state

  - [x] 32.1 Create InteriorWizard.tsx component


    - 7-step wizard container
    - Step state management (current step, direction)
    - Navigation functions (next, prev, goTo)
    - Data state (selected developer, development, building, unit, package)
    - _Requirements: 11.1_
  - [x] 32.2 Create useInteriorWizard.ts hook
    - Wizard state and actions
    - Step validation
    - Data persistence (session storage)
    - _Requirements: 11.1_
  - [x] 32.3 Create StepIndicator.tsx component
    - 7 steps with labels
    - Current step highlight
    - Completed steps checkmark
    - Responsive (hide labels on mobile)
    - _Requirements: 11.1_

- [x] 33. Implement Step 1: Developer Selection
  - [x] 33.1 Create DeveloperStep.tsx component
    - Fetch active developers
    - Display as selection cards with logo, name
    - Staggered entrance animation
    - Card hover/tap animation
    - Selection highlight
    - Auto-advance on selection
    - _Requirements: 11.2_
  - [x] 33.2 Create SelectionCard.tsx reusable component
    - Image, title, subtitle slots
    - Selected state styling
    - Hover/tap animations
    - _Requirements: 11.2_

- [x] 34. Implement Step 2: Development Selection
  - [x] 34.1 Create DevelopmentStep.tsx component
    - Fetch developments for selected developer
    - Display as cards with thumbnail, name, location
    - Back button to step 1
    - _Requirements: 11.3_

- [x] 35. Implement Step 3: Building Selection
  - [x] 35.1 Create BuildingStep.tsx component
    - Fetch buildings for selected development
    - Display as cards with name, floors info
    - Show floor plan image if available
    - _Requirements: 11.4_

- [x] 36. Implement Step 4: Unit Selection
  - [x] 36.1 Create UnitStep.tsx component
    - Two input modes: code entry or floor+axis selection
    - Tab switcher between modes
    - _Requirements: 11.5, 12.1_
  - [x] 36.2 Create UnitCodeInput.tsx component (integrated in UnitStep)
    - Text input with format hint
    - Real-time validation
    - Error message display
    - _Requirements: 12.2, 12.7_
  - [x] 36.3 Create FloorAxisSelector.tsx component (integrated in UnitStep)
    - Floor dropdown (filtered by building config)
    - Axis dropdown (filtered by available units)
    - Auto-generate unit code display
    - _Requirements: 12.3-12.5_
  - [x] 36.4 Create UnitInfoCard.tsx component (integrated in UnitStep)
    - Display detected unit info
    - Unit type, bedrooms, bathrooms
    - Gross area, net area
    - Position, direction
    - _Requirements: 12.6_
  - [x] 36.5 Write property test for unit code parsing
    - **Property 7: Unit code format generation**
    - **Validates: Requirements 12.2**


- [x] 37. Implement Step 5: Layout Preview
  - [x] 37.1 Create LayoutStep.tsx component
    - Fetch layout details for selected unit
    - Display layout image (2D/3D toggle)
    - Room breakdown list
    - Area summary
    - Highlights tags
    - _Requirements: 11.6, 13.1-13.6_
  - [x] 37.2 Create LayoutPreview.tsx component (integrated in LayoutStep)
    - Image viewer with zoom
    - 2D/3D toggle if both available
    - Lazy loading with blur-up effect
    - _Requirements: 13.1-13.3_
  - [x] 37.3 Create RoomBreakdown.tsx component (integrated in LayoutStep)
    - List of rooms with icons
    - Area display for each room
    - Total area calculation
    - _Requirements: 13.4_

- [x] 38. Implement Step 6: Package Selection
  - [x] 38.1 Create PackageStep.tsx component
    - Fetch packages for selected layout
    - Display as tier-ordered cards
    - Featured badge for recommended
    - _Requirements: 11.7, 14.1-14.5_
  - [x] 38.2 Create PackageCard.tsx component (integrated in PackageStep)
    - Thumbnail, name, tier badge
    - Price display
    - Short description
    - Image carousel on hover/expand
    - Selection state
    - _Requirements: 14.2-14.4_
  - [x] 38.3 Create PackageComparison.tsx component


    - Side-by-side comparison modal
    - Show items difference by room
    - Price comparison
    - _Requirements: 14.6_
  - [x] 38.4 Create PackageDetailModal.tsx component




    - Full item breakdown by room
    - All images gallery
    - Warranty and installation info
    - _Requirements: 14.7_

- [x] 39. Implement Step 7: Quote Result
  - [x] 39.1 Create ResultStep.tsx component
    - Call quote calculation API
    - Display summary card
    - Price breakdown
    - Action buttons (save, share, start over)
    - _Requirements: 11.8, 15.1-15.8_
  - [x] 39.2 Create QuoteBreakdown.tsx component (integrated in ResultStep)
    - Package price line
    - Labor cost line
    - Surcharges list (expandable)
    - Management fee line
    - Contingency line
    - Subtotal line
    - VAT line
    - Discount line (if any)
    - Grand total (highlighted)
    - Price per sqm
    - _Requirements: 15.2-15.4_
  - [x] 39.3 Create SaveQuoteForm.tsx component (integrated in ResultStep)
    - Name, phone, email inputs
    - Validation
    - Submit handler
    - Success message with quote code
    - _Requirements: 15.5, 15.6_
  - [x] 39.4 Create ShareQuoteModal.tsx component


    - Copy link button
    - Social share buttons
    - Download PDF button (future)
    - _Requirements: 15.7_

- [x] 40. Implement animations and transitions
  - [x] 40.1 Add step transition animations
    - Slide left/right based on direction
    - Spring animation with easing
    - _Requirements: 16.1_
  - [x] 40.2 Add skeleton loaders
    - For developer/development/building lists
    - For layout preview
    - For package cards
    - _Requirements: 16.2_
  - [x] 40.3 Add selection feedback animations
    - Scale on hover/tap
    - Border highlight on select
    - _Requirements: 16.3_
  - [x] 40.4 Add staggered list animations
    - For all card lists
    - _Requirements: 16.4_
  - [x] 40.5 Add mobile swipe gestures


    - Swipe left/right for navigation
    - _Requirements: 16.6_
  - [x] 40.6 Add image lazy loading
    - Blur-up placeholder effect
    - _Requirements: 16.7_
  - [x] 40.7 Add error state animations
    - Shake animation on error
    - Retry button
    - _Requirements: 16.8_

- [x] 41. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


## Phase 7: Integration & Polish

- [x] 42. Add API types to admin and landing
  - [x] 42.1 Create admin/src/app/types/interior.ts
    - All TypeScript interfaces for admin
    - _Requirements: 20.1_
  - [x] 42.2 Create admin/src/app/api/interior.ts
    - API client functions for all endpoints
    - _Requirements: 20.1_
  - [x] 42.3 Add interior types to landing
    - Shared types for landing page
    - _Requirements: 20.2_

- [x] 43. Add navigation and menu items
  - [x] 43.1 Add Interior to admin sidebar
    - Icon: ri-home-smile-line
    - Label: "Nội thất"
    - Sub-items for each tab (optional)
    - _Requirements: 20.1_
  - [x] 43.2 Add Interior Quote to landing navigation
    - Add to header menu
    - Add to mobile menu
    - Label: "Nội thất"
    - Link: /noi-that
    - _Requirements: 20.5_

- [x] 44. Create seed data


  - [x] 44.1 Create infra/prisma/seed-interior.ts


    - Sample developers (Vingroup, Novaland)
    - Sample developments (Vinhomes Grand Park)
    - Sample buildings with axis configuration
    - Sample layouts with room breakdown
    - Sample packages with items
    - Sample surcharges
    - Default quote settings
    - Default room types
    - _Requirements: All_

- [x] 45. Final integration testing


  - [x] 45.1 Write property test for API pagination


    - **Property 18: API pagination consistency**
    - **Validates: Requirements 18.3**
  - [x] 45.2 Test full wizard flow end-to-end

    - Developer → Development → Building → Unit → Layout → Package → Result
    - _Requirements: 11.1-11.8_
  - [x] 45.3 Test quote save and CustomerLead creation

    - _Requirements: 15.5, 20.4_
  - [x] 45.4 Test admin CRUD operations

    - All entities create, update, delete
    - _Requirements: 1-10_

- [x] 46. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

