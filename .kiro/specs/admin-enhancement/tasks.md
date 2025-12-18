# Implementation Plan

## Phase 1: Fix Auth for Admin Pages

- [x] 1. Update Admin API calls to use JWT consistently


  - [x] 1.1 Update LeadsPage to use leadsApi from api.ts instead of direct fetch with credentials


    - Replace `fetch(${API_URL}/leads, { credentials: 'include' })` with `leadsApi.list()`
    - Update `updateLeadStatus` to use `leadsApi.update()`
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Update DashboardPage to use API client


    - Replace direct fetch calls with appropriate API functions
    - Ensure JWT token is included in all requests
    - _Requirements: 1.1, 1.2_
  - [x] 1.3 Write property test for JWT token inclusion


    - **Property 1: JWT Token Inclusion**
    - **Validates: Requirements 1.1**


- [x] 2. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.



## Phase 2: Quote Calculator Enhancement


- [x] 3. Add SaveQuoteModal to QuoteCalculatorSection
  - [x] 3.1 Create SaveQuoteModal component in landing/src/app/components/

    - Modal with form fields: name (required), phone (required), email (optional)
    - Submit button that creates lead with quoteData
    - Success/error handling with toast messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 3.2 Integrate SaveQuoteModal into QuoteCalculatorSection result step


    - Add "Lưu & Đăng ký tư vấn" button next to existing buttons
    - Pass quoteResult to modal
    - Handle success callback to reset calculator
    - _Requirements: 2.1, 2.2_


  - [x] 3.3 Write property test for lead creation with quoteData

    - **Property 4: Lead Creation with QuoteData**

    - **Validates: Requirements 2.3**

- [x] 4. Checkpoint - Ensure all tests pass
  - All tests pass






## Phase 3: Leads Management Enhancement

- [x] 5. Update Prisma schema for leads enhancement
  - [x] 5.1 Add statusHistory field to CustomerLead model
    - Add `statusHistory String?` field for JSON array of status changes
    - Run `pnpm db:generate` and `pnpm db:push`
    - _Requirements: 3.6_

- [x] 6. Enhance API leads endpoints



  - [x] 6.1 Add search and pagination to GET /leads

    - Accept query params: search, status, page, limit
    - Implement search across name, phone, email fields
    - Return paginated response with total count
    - _Requirements: 3.1, 3.5_

  - [x] 6.2 Add status history tracking to PUT /leads/:id
    - Parse existing statusHistory, append new entry on status change
    - Include from, to, changedAt fields

    - _Requirements: 3.6_
  - [x] 6.3 Add GET /leads/export endpoint for CSV download
    - Generate CSV with columns: name, phone, email, content, status, source, createdAt
    - Apply same filters as list endpoint

    - Return file download response
    - _Requirements: 3.4_


  - [x] 6.4 Add GET /leads/stats endpoint for dashboard charts
    - Return dailyLeads (last 30 days), byStatus, bySource, conversionRate
    - _Requirements: 4.1, 4.2, 4.3, 4.4_


  - [x] 6.5 Write property tests for leads API
    - **Property 5: Search Filter Correctness**
    - **Property 8: CSV Export Completeness**
    - **Property 9: Status History Recording**
    - **Validates: Requirements 3.1, 3.4, 3.6**

- [x] 7. Checkpoint - Ensure all tests pass
  - All tests pass

- [x] 8. Update Admin leadsApi client
  - [x] 8.1 Add new API methods to admin/src/app/api.ts
    - `leadsApi.list(params)` with search, status, page, limit
    - `leadsApi.export(params)` for CSV download
    - `leadsApi.getStats()` for dashboard charts
    - _Requirements: 3.1, 3.4, 4.1_

- [x] 9. Enhance LeadsPage UI
  - [x] 9.1 Add SearchInput component
    - Text input with search icon
    - Debounced search (300ms)
    - Clear button
    - _Requirements: 3.1_
  - [x] 9.2 Add Pagination component
    - Page numbers, prev/next buttons
    - Show current page and total pages
    - _Requirements: 3.5_
  - [x] 9.3 Create QuoteDataDisplay component
    - Parse quoteData JSON
    - Render formatted table with categoryName, area, baseCost, materialsCost, grandTotal
    - Handle invalid JSON gracefully
    - _Requirements: 3.2_
  - [x] 9.4 Create NotesEditor component
    - Textarea for notes
    - Save button with loading state
    - Auto-save on blur (optional)
    - _Requirements: 3.3_
  - [x] 9.5 Add ExportButton to LeadsPage header
    - Download icon button
    - Trigger CSV download with current filters
    - _Requirements: 3.4_
  - [x] 9.6 Add StatusHistory display in lead detail modal
    - Timeline view of status changes
    - Show from → to with timestamp
    - _Requirements: 3.6_
  - [x] 9.7 Write property tests for UI components
    - **Property 6: QuoteData Parsing**
    - **Property 7: Notes Persistence**
    - **Validates: Requirements 3.2, 3.3**

- [x] 10. Checkpoint - Ensure all tests pass
  - All tests pass: API 51 tests, Admin 9 tests

## Phase 4: Dashboard Charts

- [x] 11. Enhance DashboardPage with charts
  - [x] 11.1 Install chart library (recharts)
    - Add recharts to admin package.json
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 11.2 Create LeadsLineChart component
    - Line chart showing leads count by day for last 30 days
    - X-axis: dates, Y-axis: count
    - Responsive design
    - _Requirements: 4.1_
  - [x] 11.3 Create LeadsPieChart component
    - Pie chart showing leads distribution by status
    - Color-coded by status (NEW=blue, CONTACTED=yellow, CONVERTED=green, CANCELLED=red)
    - Legend with counts
    - _Requirements: 4.2_
  - [x] 11.4 Create LeadsBarChart component
    - Bar chart showing leads by source
    - Horizontal bars for better readability
    - _Requirements: 4.3_
  - [x] 11.5 Create ConversionRateCard component
    - Display conversion rate as percentage
    - Visual indicator (progress ring or gauge)
    - _Requirements: 4.4_
  - [x] 11.6 Update DashboardPage layout
    - Integrate all chart components
    - Responsive grid layout
    - Loading states for charts
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 11.7 Fix Quick Actions navigation
    - Add onClick handlers to navigate to correct pages
    - _Requirements: 4.5_
  - [x] 11.8 Write property tests for chart data
    - **Property 10: Daily Leads Aggregation**
    - **Property 11: Status Distribution Sum**
    - **Property 12: Source Distribution Sum**
    - **Property 13: Conversion Rate Calculation**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 12. Checkpoint - Ensure all tests pass
  - All tests pass: API 55 tests, Admin 9 tests

## Phase 5: Google Sheets Integration

- [x] 13. Setup Google Sheets API infrastructure
  - [x] 13.1 Add googleapis package to API
    - Install `googleapis` package
    - Create Google OAuth2 client configuration
    - _Requirements: 5.2_
  - [x] 13.2 Add Integration model to Prisma schema
    - Create model with type, config, credentials, lastSyncAt, errorCount, lastError
    - Run migrations
    - _Requirements: 5.3, 5.8_

- [x] 14. Create Google Sheets service
  - [x] 14.1 Create GoogleSheetsService in api/src/services/
    - OAuth2 flow methods (getAuthUrl, handleCallback, revokeAccess)
    - Spreadsheet validation method
    - syncLeadToSheet method with retry logic
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 14.2 Write property tests for Google Sheets service
    - **Property 15: Google Sheets Retry Logic**
    - **Validates: Requirements 5.6**

- [x] 15. Create Google Sheets API routes
  - [x] 15.1 Add routes to api/src/main.ts
    - GET /integrations/google/auth-url - Generate OAuth URL
    - GET /integrations/google/callback - Handle OAuth callback
    - POST /integrations/google/disconnect - Revoke access
    - GET /integrations/google/status - Get connection status
    - POST /integrations/google/test - Test spreadsheet access
    - PUT /integrations/google/settings - Update spreadsheet ID
    - _Requirements: 5.2, 5.3, 5.4, 5.7, 5.8_

- [x] 16. Integrate Google Sheets sync into lead creation
  - [x] 16.1 Update POST /leads to trigger Google Sheets sync
    - Check if integration is enabled
    - Call syncLeadToSheet asynchronously (don't block response)
    - Log errors but don't fail lead creation
    - _Requirements: 5.5, 5.6_
  - [x] 16.2 Write property test for sync on lead creation
    - **Property 14: Google Sheets Sync on Lead Creation**
    - **Validates: Requirements 5.5**

- [x] 17. Checkpoint - Ensure all tests pass
  - All tests pass: API 55 tests, Admin 9 tests

- [x] 18. Create Admin UI for Google Sheets settings
  - [x] 18.1 Add googleSheetsApi to admin/src/app/api.ts
    - getAuthUrl, handleCallback, disconnect, getStatus, testConnection, updateSettings
    - _Requirements: 5.1_
  - [x] 18.2 Create GoogleSheetsTab component in admin/src/app/pages/SettingsPage/
    - Connection status display
    - Connect/Disconnect buttons
    - Spreadsheet ID input with validation
    - Sync enable/disable toggle
    - Last sync timestamp and error display
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7, 5.8_
  - [x] 18.3 Add GoogleSheetsTab to SettingsPage
    - Add new tab to TABS array
    - Render GoogleSheetsTab when active
    - _Requirements: 5.1_

- [x] 19. Final Checkpoint - Ensure all tests pass
  - All tests pass: API 55 tests, Admin 9 tests

