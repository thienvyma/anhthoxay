# Requirements Document

## Introduction

Sau khi thực hiện nhiều spec tasks để tối ưu hệ thống API (api-refactoring, security-hardening, jwt-enhancement), các frontend apps (admin và landing) cần được cập nhật để đồng bộ với các thay đổi của backend. Hiện tại có nhiều vấn đề về kết nối và format dữ liệu giữa frontend và backend cần được fix toàn diện.

## Glossary

- **API Client**: Module trong frontend app chứa các functions để gọi API backend
- **Response Format**: Cấu trúc JSON response từ backend:
  - Success: `{ success: true, data: T }`
  - Paginated: `{ success: true, data: T[], meta: { total, page, limit, totalPages } }`
  - Error: `{ success: false, error: { code, message }, correlationId }`
- **Landing App**: Public website cho khách hàng (port 4200)
- **Admin App**: Dashboard quản trị (port 4201)
- **Backend API**: Hono server (port 4202)
- **Direct Fetch**: Các component gọi `fetch()` trực tiếp thay vì qua API client

## Requirements

### Requirement 1: Landing App - Blog Comment Fix

**User Story:** As a landing page visitor, I want to submit blog comments successfully, so that I can engage with blog content.

#### Acceptance Criteria

1. WHEN a user submits a comment on a blog post THEN the Landing API client SHALL send field `name` instead of `author` to match backend schema
2. WHEN the backend returns a validation error THEN the Landing App SHALL display the error message to the user
3. WHEN the comment is submitted successfully THEN the Landing App SHALL show a success toast notification

### Requirement 2: Landing App - API Client Response Handling

**User Story:** As a developer, I want the landing API client to handle the standardized response format correctly, so that data is properly extracted from API responses.

#### Acceptance Criteria

1. WHEN the backend returns `{ success: true, data: T }` THEN the Landing API client SHALL unwrap and return only the `data` portion
2. WHEN the backend returns an error response THEN the Landing API client SHALL extract the error message from `error.message` or `error.code`
3. WHEN the backend returns a non-standard response (legacy format) THEN the Landing API client SHALL return the response as-is for backward compatibility

### Requirement 3: Landing App - Direct Fetch Calls

**User Story:** As a landing page visitor, I want all pages and components to work correctly, so that I can use the website without errors.

#### Acceptance Criteria

1. WHEN QuoteCalculatorSection fetches service-categories, materials, unit-prices THEN the component SHALL correctly unwrap `response.data` from standardized format
2. WHEN QuoteFormSection submits a lead and backend returns error THEN the component SHALL extract and display error message from `error.message` instead of generic error
3. WHEN DynamicPage fetches page data THEN the component SHALL correctly unwrap `response.data` from standardized format
4. WHEN QuotePage fetches page data THEN the component SHALL correctly unwrap `response.data` from standardized format
5. WHEN App component fetches settings and pages THEN the component SHALL correctly unwrap `response.data` from standardized format
6. WHEN MobileMenu fetches settings THEN the component SHALL correctly unwrap `response.data` from standardized format
7. WHEN PromoPopup fetches settings THEN the component SHALL correctly unwrap `response.data` from standardized format
8. WHEN NewsletterSignup submits a lead THEN the component SHALL correctly handle the standardized response format
9. WHEN SaveQuoteModal submits a lead THEN the component SHALL correctly handle the standardized response format

### Requirement 4: Admin App - Paginated Response Handling

**User Story:** As an admin user, I want the admin API client to handle paginated responses correctly, so that I can view leads with proper pagination metadata.

#### Acceptance Criteria

1. WHEN the backend returns a paginated response `{ success: true, data: [], meta: { total, page, limit, totalPages } }` THEN the Admin API client SHALL correctly extract both data array and pagination metadata
2. WHEN fetching leads list THEN the Admin API client SHALL return response with `data`, `total`, `page`, `limit`, `totalPages` properties at top level for compatibility with existing components
3. WHEN LeadsPage uses leadsApi.list() THEN the page SHALL receive data in expected format without code changes

### Requirement 5: Admin App - API Client Response Handling

**User Story:** As an admin user, I want all admin features to work correctly after API refactoring, so that I can manage the website.

#### Acceptance Criteria

1. WHEN the backend returns `{ success: true, data: T }` THEN the Admin API client SHALL unwrap and return only the `data` portion for non-paginated endpoints
2. WHEN the backend returns an error response THEN the Admin API client SHALL extract error details and display meaningful messages
3. WHEN DashboardPage loads stats THEN the page SHALL correctly receive and display data from leadsApi.getStats()

### Requirement 6: Admin App - Blog Management

**User Story:** As an admin user, I want to manage blog posts, categories, and comments, so that I can maintain blog content.

#### Acceptance Criteria

1. WHEN listing blog posts THEN the Admin App SHALL correctly handle the standardized response format
2. WHEN creating/updating/deleting blog posts THEN the Admin App SHALL correctly handle the standardized response format
3. WHEN listing blog categories THEN the Admin App SHALL correctly handle the standardized response format
4. WHEN updating comment status (approve/reject) THEN the Admin App SHALL call endpoint `/blog/comments/:id/status` with `{ status: 'APPROVED' | 'REJECTED' }`
5. WHEN listing all comments for moderation THEN the Admin App SHALL call endpoint `/blog/comments` with optional filters

### Requirement 7: Admin App - Pricing Management

**User Story:** As an admin user, I want to manage service categories, unit prices, materials, and formulas, so that I can configure pricing.

#### Acceptance Criteria

1. WHEN listing service categories THEN the Admin App SHALL correctly handle the standardized response format
2. WHEN creating/updating/deleting service categories THEN the Admin App SHALL correctly handle the standardized response format
3. WHEN listing unit prices THEN the Admin App SHALL correctly handle the standardized response format
4. WHEN listing materials THEN the Admin App SHALL correctly handle the standardized response format
5. WHEN listing formulas THEN the Admin App SHALL correctly handle the standardized response format

### Requirement 8: Admin App - Pages and Sections Management

**User Story:** As an admin user, I want to manage pages and sections, so that I can customize website content.

#### Acceptance Criteria

1. WHEN listing pages THEN the Admin App SHALL correctly handle the standardized response format
2. WHEN creating/updating/deleting pages THEN the Admin App SHALL correctly handle the standardized response format
3. WHEN creating/updating/deleting sections THEN the Admin App SHALL correctly handle the standardized response format

### Requirement 9: Admin App - Media Management

**User Story:** As an admin user, I want to manage media assets, so that I can upload and organize images.

#### Acceptance Criteria

1. WHEN listing media assets THEN the Admin App SHALL correctly handle the standardized response format
2. WHEN uploading media THEN the Admin App SHALL correctly handle the standardized response format
3. WHEN deleting media THEN the Admin App SHALL correctly handle the standardized response format

### Requirement 10: Admin App - Settings Management

**User Story:** As an admin user, I want to manage application settings, so that I can configure the website.

#### Acceptance Criteria

1. WHEN fetching settings THEN the Admin App SHALL correctly handle the standardized response format
2. WHEN updating settings THEN the Admin App SHALL correctly handle the standardized response format

### Requirement 11: Admin App - Authentication Migration

**User Story:** As an admin user, I want all admin features to work with JWT authentication, so that I can securely manage the website.

#### Acceptance Criteria

1. WHEN PricingConfigPage fetches data THEN the component SHALL use JWT Bearer token instead of cookie-based `credentials: 'include'`
2. WHEN PricingConfigPage tabs (ServiceCategories, UnitPrices, Materials, Formulas) make API calls THEN the components SHALL use JWT Bearer token
3. WHEN SettingsPage tabs (Company, Layout, Promo) make API calls THEN the components SHALL use JWT Bearer token
4. WHEN any admin component makes a direct fetch() call THEN the component SHALL include Authorization header with Bearer token

### Requirement 12: Admin App - Direct Fetch Calls Migration

**User Story:** As a developer, I want all direct fetch() calls in admin app to use the centralized API client, so that authentication and response handling is consistent.

#### Acceptance Criteria

1. WHEN PricingConfigPage/index.tsx fetches data THEN the component SHALL use the centralized API client (serviceCategoriesApi, unitPricesApi, materialsApi, formulasApi)
2. WHEN ServiceCategoriesTab makes CRUD operations THEN the component SHALL use serviceCategoriesApi instead of direct fetch()
3. WHEN UnitPricesTab makes CRUD operations THEN the component SHALL use unitPricesApi instead of direct fetch()
4. WHEN MaterialsTab makes CRUD operations THEN the component SHALL use materialsApi instead of direct fetch()
5. WHEN FormulasTab makes CRUD operations THEN the component SHALL use formulasApi instead of direct fetch()
6. WHEN CompanyTab saves settings THEN the component SHALL use settingsApi instead of direct fetch()
7. WHEN LayoutTab saves header/footer config THEN the component SHALL use pagesApi instead of direct fetch()
8. WHEN LayoutTab saves mobile menu config THEN the component SHALL use settingsApi instead of direct fetch()

### Requirement 13: Admin App - Material Categories API

**User Story:** As an admin user, I want to manage material categories, so that I can organize materials properly.

#### Acceptance Criteria

1. WHEN listing material categories THEN the Admin API client SHALL have a materialCategoriesApi with list(), create(), update(), delete() methods
2. WHEN PricingConfigPage fetches material categories THEN the component SHALL use materialCategoriesApi.list()
3. WHEN MaterialsTab creates/updates material categories THEN the component SHALL use materialCategoriesApi

### Requirement 14: Error Handling Consistency

**User Story:** As a developer, I want consistent error handling across all API calls, so that users see meaningful error messages.

#### Acceptance Criteria

1. WHEN an API call fails with HTTP error THEN the API client SHALL extract error details from the standardized error response format
2. WHEN the error response contains `correlationId` THEN the API client SHALL include it in error logs for debugging
3. WHEN validation errors occur THEN the API client SHALL format and display field-specific error messages

### Requirement 15: Landing App - Lead Submission

**User Story:** As a landing page visitor, I want to submit contact forms and quote requests, so that I can get in touch with the company.

#### Acceptance Criteria

1. WHEN QuoteFormSection submits a lead and fails THEN the component SHALL extract error message from `response.error.message` and display to user
2. WHEN NewsletterSignup submits a lead and fails THEN the component SHALL extract error message from `response.error.message` and display to user
3. WHEN SaveQuoteModal submits a lead and fails THEN the component SHALL extract error message from `response.error.message` and display to user
4. WHEN lead submission succeeds THEN the component SHALL show success notification to user

### Requirement 16: Admin App - Media Page Migration

**User Story:** As an admin user, I want the media page to work correctly with JWT authentication, so that I can manage media assets.

#### Acceptance Criteria

1. WHEN MediaPage loads media usage data THEN the component SHALL use JWT Bearer token instead of cookie-based `credentials: 'include'`
2. WHEN MediaPage syncs media database THEN the component SHALL use JWT Bearer token
3. WHEN MediaPage edits media metadata THEN the component SHALL use JWT Bearer token
4. WHEN any MediaPage operation fails THEN the component SHALL display meaningful error messages

### Requirement 17: Admin App - Formulas API Completion

**User Story:** As an admin user, I want to delete formulas, so that I can manage pricing formulas completely.

#### Acceptance Criteria

1. WHEN deleting a formula THEN the Admin API client SHALL have a `formulasApi.delete()` method
2. WHEN FormulasTab deletes a formula THEN the component SHALL use `formulasApi.delete()` instead of direct fetch()

### Requirement 18: Admin App - Blog Post Image Upload Migration

**User Story:** As an admin user, I want blog post image uploads to work with JWT authentication, so that I can add images to blog posts.

#### Acceptance Criteria

1. WHEN uploading images in MarkdownEditor (PostsTab) THEN the component SHALL use JWT Bearer token instead of cookie-based `credentials: 'include'`
2. WHEN image upload fails THEN the component SHALL display meaningful error messages

### Requirement 19: Landing App - QuoteCalculatorSection Response Handling

**User Story:** As a landing page visitor, I want the quote calculator to work correctly, so that I can get accurate price estimates.

#### Acceptance Criteria

1. WHEN QuoteCalculatorSection fetches service-categories THEN the component SHALL correctly unwrap `response.data` from standardized format
2. WHEN QuoteCalculatorSection fetches materials THEN the component SHALL correctly unwrap `response.data` from standardized format
3. WHEN QuoteCalculatorSection fetches unit-prices THEN the component SHALL correctly unwrap `response.data` from standardized format
4. WHEN QuoteCalculatorSection fetches QUOTE_FORM section THEN the component SHALL correctly unwrap `response.data` from standardized format
