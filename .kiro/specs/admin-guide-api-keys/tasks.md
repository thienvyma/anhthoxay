# Implementation Plan

## Phase 1: Database & Backend Foundation

- [x] 1. Set up database schema for API Keys


  - [x] 1.1 Add ApiKeyScope and ApiKeyStatus enums to Prisma schema


    - Add enum ApiKeyScope { READ_ONLY, READ_WRITE, FULL_ACCESS }
    - Add enum ApiKeyStatus { ACTIVE, INACTIVE, EXPIRED }

    - _Requirements: 10.4, 17.1, 17.2, 17.4_
  - [x] 1.2 Create ApiKey model in Prisma schema








    - Fields: id, name, description, keyPrefix, keyHash, scope, allowedEndpoints, status, expiresAt, lastUsedAt, usageCount, createdBy, createdAt, updatedAt
    - Add relation to User model

    - Add indexes on keyPrefix and status
    - _Requirements: 9.1, 10.2_


  - [x] 1.3 Create ApiKeyUsageLog model in Prisma schema



    - Fields: id, apiKeyId, endpoint, method, statusCode, responseTime, ipAddress, userAgent, createdAt


    - Add relation to ApiKey with cascade delete
    - Add indexes on apiKeyId and createdAt
    - _Requirements: 14.3_
  - [ ] 1.4 Run Prisma migration
    - Generate and apply migration
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement API Key Service





  - [x] 2.1 Create api-key.service.ts with CRUD operations




    - Implement list() with filters (status, search)
    - Implement create() with secure key generation (crypto.randomBytes)
    - Implement getById() for detail view
    - Implement update() for editing
    - Implement delete() for permanent removal
    - _Requirements: 9.1, 9.4, 10.2, 12.2, 15.3_
  - [x] 2.2 Write property test for key generation uniqueness


    - **Property 3: Key Generation Uniqueness**
    - **Validates: Requirements 10.2**
  - [x] 2.3 Implement toggleStatus() method

    - Toggle between ACTIVE and INACTIVE
    - _Requirements: 11.1, 11.2_
  - [x] 2.4 Write property test for toggle round-trip


    - **Property 4: Toggle Status Round-Trip**
    - **Validates: Requirements 11.1, 11.2**
  - [x] 2.5 Implement validateKey() method

    - Parse keyPrefix from raw key
    - Find key by prefix, verify hash with bcrypt
    - Check status and expiration
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  - [x] 2.6 Write property tests for key validation


    - **Property 7: Valid Key Authentication**
    - **Property 8: Invalid Key Rejection**
    - **Property 9: Expired Key Rejection**
    - **Validates: Requirements 16.1, 16.2, 16.4**
  - [x] 2.7 Implement checkPermission() method

    - Check scope against HTTP method
    - Check endpoint against allowedEndpoints
    - _Requirements: 17.1, 17.2, 17.3, 17.4_
  - [x] 2.8 Write property tests for permission checking


    - **Property 11: Read-Only Scope Enforcement**
    - **Property 12: Read-Write Scope Enforcement**
    - **Property 13: Endpoint Group Enforcement**
    - **Property 14: Full Access Permission**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4**
  - [x] 2.9 Implement logUsage() and getUsageLogs() methods

    - Log each API request with details
    - Get recent logs for detail view
    - _Requirements: 14.3, 16.5_
  - [x] 2.10 Write property test for usage tracking


    - **Property 10: Usage Tracking**
    - **Validates: Requirements 16.5**
  - [x] 2.11 Implement testKey() method for testing API keys

    - Make internal API call with the key
    - Return success/failure with response time
    - _Requirements: 13.3, 13.4, 13.5, 13.6_

- [x] 3. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create API Key Validation Schemas






  - [x] 4.1 Create api-key.schema.ts with Zod schemas

    - CreateApiKeySchema: name (3-100 chars, unique), description, scope, allowedEndpoints, expiresAt
    - UpdateApiKeySchema: partial of create schema
    - ListApiKeysQuerySchema: status filter, search
    - _Requirements: 10.1, 15.1_



- [x] 5. Implement API Key Routes




  - [x] 5.1 Create api-keys.routes.ts with admin routes

    - GET /api/admin/api-keys - List all keys
    - POST /api/admin/api-keys - Create new key
    - GET /api/admin/api-keys/:id - Get key details
    - PUT /api/admin/api-keys/:id - Update key
    - DELETE /api/admin/api-keys/:id - Delete key
    - PUT /api/admin/api-keys/:id/toggle - Toggle status
    - POST /api/admin/api-keys/:id/test - Test key
    - GET /api/admin/api-keys/:id/logs - Get usage logs
    - All routes require authenticate() and requireRole('ADMIN')
    - _Requirements: 9.1, 10.1, 11.1, 11.2, 12.1, 13.1, 14.1, 15.1_

  - [x] 5.2 Register routes in main.ts

    - Import and mount api-keys routes
    - _Requirements: 5.1_

- [x] 6. Implement API Key Authentication Middleware









  - [x] 6.1 Create api-key-auth.middleware.ts

    - Extract X-API-Key header
    - Validate key using apiKeyService.validateKey()
    - Check permissions using apiKeyService.checkPermission()
    - Log usage on success
    - Return appropriate error codes
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 17.1, 17.2, 17.3_
  - [x] 6.2 Write property tests for middleware


    - **Property 5: Inactive Key Rejection**
    - **Property 6: Deleted Key Rejection**
    - **Validates: Requirements 11.3, 12.3**
  - [x] 6.3 Apply middleware to external API routes


    - Add apiKeyAuth() middleware to leads, blog, projects, contractors, reports routes
    - Allow both JWT auth and API key auth
    - _Requirements: 16.1_



- [x] 7. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Admin Frontend - API Keys Management


- [x] 8. Create API Keys Page Structure




  - [x] 8.1 Create ApiKeysPage folder and index.tsx


    - Set up page layout with header and content area
    - Add "Tạo API Key" button
    - Add status filter dropdown
    - _Requirements: 9.1, 10.1_
  - [x] 8.2 Create api-keys.api.ts for API client


    - listApiKeys(), createApiKey(), getApiKey(), updateApiKey(), deleteApiKey()
    - toggleApiKeyStatus(), testApiKey(), getApiKeyLogs()
    - _Requirements: 9.1, 10.2, 11.1, 12.2, 13.3, 14.1, 15.3_




- [x] 9. Implement API Keys List Component



  - [x] 9.1 Create ApiKeysList.tsx component

    - Display table with columns: Tên, Trạng thái, Quyền, Lần dùng cuối, Ngày tạo
    - Show keyPrefix with masking (first 8 chars + "...")
    - Add toggle switch for status
    - Add Test, Edit, Delete action buttons
    - Highlight keys expiring within 7 days
    - _Requirements: 9.1, 9.2, 9.3, 11.1, 18.1_

  - [x] 9.2 Write property test for key masking display

    - **Property 1: API Key Masking**
    - **Validates: Requirements 9.2**



- [x] 10. Implement Create API Key Modal





  - [x] 10.1 Create CreateApiKeyModal.tsx component


    - Form fields: Tên, Mô tả, Quyền (dropdown), Nhóm API (checkboxes), Thời hạn (dropdown)
    - Scope options with descriptions
    - Endpoint group checkboxes: Leads, Blog, Công trình, Nhà thầu, Báo cáo
    - Expiration options: Không giới hạn, 30 ngày, 90 ngày, 1 năm
    - _Requirements: 10.1, 10.4, 10.5_
  - [x] 10.2 Create KeyCreatedModal.tsx component



    - Display full raw key with monospace font
    - Copy button with one-click copy
    - Warning message "Key này chỉ hiển thị một lần duy nhất!"
    - _Requirements: 10.3_





- [x] 11. Implement Test API Key Modal


  - [x] 11.1 Create TestApiKeyModal.tsx component

    - Dropdown to select test endpoint (Lấy danh sách Leads, Lấy danh sách Blog, Kiểm tra kết nối)
    - "Chạy Test" button
    - Display result: success (green) or error (red)
    - Show response time in milliseconds
    - Show error reason if failed



    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 12. Implement API Key Detail Panel



  - [x] 12.1 Create ApiKeyDetailPanel.tsx component

    - Display: Tên, Mô tả, Quyền, Nhóm API, Ngày tạo, Ngày hết hạn, Tổng số lần sử dụng, Lần sử dụng cuối
    - Recent usage logs table (10 entries): Thời gian, Endpoint, Kết quả
    - Edit and Delete buttons
    - _Requirements: 14.1, 14.2, 14.3, 14.4_




- [x] 13. Implement Edit API Key Modal



  - [x] 13.1 Create EditApiKeyModal.tsx component

    - Pre-filled form with current values
    - Editable: Tên, Mô tả, Quyền, Nhóm API, Thời hạn
    - NOT editable: actual key value
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 14. Implement Delete Confirmation Modal









  - [x] 14.1 Create DeleteApiKeyModal.tsx component



    - Show key name in confirmation message
    - Warning about permanent deletion
    - Confirm and Cancel buttons
    - _Requirements: 12.1, 12.4_


- [x] 15. Add API Keys to Admin Navigation















  - [x] 15.1 Add route /settings/api-keys to admin router



    - _Requirements: 9.1_
  - [x] 15.2 Add "API Keys" menu item under Settings



    - _Requirements: 9.1_



- [x] 16. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Admin Frontend - Guide Page


- [x] 17. Create Guide Page Structure





  - [x] 17.1 Create GuidePage folder and index.tsx

    - Set up page layout with tab navigation
    - 7 tabs: Tổng quan, Quản lý Leads, Quản lý Blog, Quản lý Công trình, Quản lý Nhà thầu, Cài đặt, API Keys
    - Default to "Tổng quan" tab
    - _Requirements: 1.1, 1.2, 1.3_

  - [-] 17.2 Create GuideContent.tsx component for rendering guide content

    - Support headings, lists, info boxes, warning boxes
    - Support images and code blocks
    - _Requirements: 1.4_



- [x] 18. Implement Guide Tabs Content



  - [x] 18.1 Create OverviewTab.tsx


    - Welcome message and system overview
    - Navigation guide
    - Role-based access explanation (Admin vs Manager)
    - Quick links to common features
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 18.2 Create LeadsTab.tsx


    - Step-by-step instructions for leads management
    - Status workflow explanation
    - How to update status and add notes
    - How to export to CSV
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 18.3 Create BlogTab.tsx


    - Instructions for creating/editing posts
    - Category and tag management
    - Image upload guide
    - Comment moderation
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 18.4 Create ProjectsTab.tsx


    - Project lifecycle diagram
    - How to approve/reject projects
    - Bid management
    - Escrow and fee management
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 18.5 Create ContractorsTab.tsx


    - Verification workflow
    - Document checklist
    - How to approve/reject
    - Ranking system explanation
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 18.6 Create SettingsTab.tsx


    - Bidding settings explanation
    - Service fees management
    - Region management
    - Notification templates
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 18.7 Create ApiKeysGuideTab.tsx


    - What are API keys (simple explanation)
    - Step-by-step guide for creating keys
    - Example use cases (ChatGPT, Claude)
    - Security tips
    - _Requirements: 8.1, 8.2, 8.3, 8.4_



- [x] 19. Add Guide Page to Admin Navigation




  - [x] 19.1 Add route /guide to admin router

    - _Requirements: 1.1_
  - [x] 19.2 Add "Hướng dẫn" menu item to sidebar

    - Use ri-book-open-line icon
    - _Requirements: 1.1_


- [x] 20. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Expiration Management & Final Polish


- [x] 21. Implement API Key Expiration Logic






  - [x] 21.1 Add scheduled job to check expired keys


    - Run daily to update status of expired keys to EXPIRED
    - _Requirements: 18.3_
  - [x] 21.2 Write property test for expiration auto-status


    - **Property 15: Expiration Auto-Status**
    - **Validates: Requirements 18.3**
  - [x] 21.3 Update UI to show expiration warnings


    - Highlight keys expiring within 7 days
    - Show expiration date in list
    - _Requirements: 18.1, 18.2_
  - [x] 21.4 Allow extending expiration for expired keys




    - Enable editing expiresAt to reactivate
    - _Requirements: 18.4_



- [x] 22. Update Security Checklist







  - [x] 22.1 Add API Key routes to Protected Routes Registry

    - Document all new endpoints with auth requirements
    - _Requirements: All_



- [x] 23. Update Daily Changelog




  - [x] 23.1 Document all created and modified files

    - _Requirements: All_



- [x] 24. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
