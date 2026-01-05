# Requirements Document

## Introduction

Tính năng này bao gồm 2 phần chính trong Admin Panel:
1. **Trang Hướng dẫn (Guide Page)** - Trang hướng dẫn sử dụng hệ thống với nhiều tabs, giúp Admin và Manager hiểu cách sử dụng từng tính năng
2. **Quản lý API Keys** - Cho phép Admin tạo, quản lý, bật/tắt, xóa API keys để tích hợp với AI agents (ChatGPT, Claude, custom bots)

**API Key là gì?**
- API Key giống như "chìa khóa" để các chương trình bên ngoài (AI agents) có thể tự động làm việc với hệ thống
- Ví dụ: Tạo 1 API key cho ChatGPT → ChatGPT có thể tự động đọc leads mới hoặc tạo bài blog
- Khi không cần nữa → Tắt hoặc xóa key để bảo mật

## Glossary

- **Admin_Panel**: Giao diện quản trị hệ thống (admin app tại port 4201)
- **API_Key**: Chuỗi ký tự bí mật dùng để xác thực khi AI agents gọi API
- **AI_Agent**: Chương trình AI tự động tương tác với hệ thống (ChatGPT, Claude, custom bots)
- **Guide_Page**: Trang hướng dẫn sử dụng trong Admin với nhiều tabs
- **Scope**: Phạm vi quyền của API key (chỉ đọc, đọc-ghi, toàn quyền)
- **Endpoint_Group**: Nhóm các API mà key được phép truy cập (Leads, Blog, Projects...)

## Requirements

---

## PHẦN 1: TRANG HƯỚNG DẪN

### Requirement 1: Cấu trúc Trang Hướng dẫn

**User Story:** As an Admin or Manager, I want to access a guide page with multiple tabs, so that I can learn how to use different features without technical support.

#### Acceptance Criteria

1. WHEN an Admin or Manager navigates to /guide THEN the Admin_Panel SHALL display a page with tabs: Tổng quan, Quản lý Leads, Quản lý Blog, Quản lý Công trình, Quản lý Nhà thầu, Cài đặt, API Keys
2. WHEN clicking on a tab THEN the Admin_Panel SHALL display the corresponding content without page reload
3. WHEN the page loads THEN the Admin_Panel SHALL display "Tổng quan" tab as active by default
4. WHEN displaying content THEN the Admin_Panel SHALL render with proper formatting including headings, lists, info boxes, and images

### Requirement 2: Tab Tổng quan

**User Story:** As a new Admin or Manager, I want to see an overview of the system, so that I can understand the main features.

#### Acceptance Criteria

1. WHEN viewing Tổng quan tab THEN the Admin_Panel SHALL display welcome message and list of main features
2. WHEN viewing Tổng quan tab THEN the Admin_Panel SHALL display navigation guide showing how to access each section
3. WHEN viewing Tổng quan tab THEN the Admin_Panel SHALL explain what Admin vs Manager can do
4. WHEN viewing Tổng quan tab THEN the Admin_Panel SHALL display quick links to commonly used features

### Requirement 3: Tab Quản lý Leads

**User Story:** As an Admin or Manager, I want to learn how to manage customer leads.

#### Acceptance Criteria

1. WHEN viewing Quản lý Leads tab THEN the Admin_Panel SHALL display step-by-step instructions for viewing, filtering, and searching leads
2. WHEN viewing Quản lý Leads tab THEN the Admin_Panel SHALL explain lead status workflow (NEW → CONTACTED → CONVERTED/CANCELLED)
3. WHEN viewing Quản lý Leads tab THEN the Admin_Panel SHALL show how to update lead status and add notes
4. WHEN viewing Quản lý Leads tab THEN the Admin_Panel SHALL explain how to export leads to CSV

### Requirement 4: Tab Quản lý Blog

**User Story:** As an Admin or Manager, I want to learn how to manage blog posts.

#### Acceptance Criteria

1. WHEN viewing Quản lý Blog tab THEN the Admin_Panel SHALL display instructions for creating, editing, and publishing blog posts
2. WHEN viewing Quản lý Blog tab THEN the Admin_Panel SHALL explain how to manage categories and tags
3. WHEN viewing Quản lý Blog tab THEN the Admin_Panel SHALL show how to upload images
4. WHEN viewing Quản lý Blog tab THEN the Admin_Panel SHALL explain comment moderation

### Requirement 5: Tab Quản lý Công trình

**User Story:** As an Admin, I want to learn how to manage construction projects.

#### Acceptance Criteria

1. WHEN viewing Quản lý Công trình tab THEN the Admin_Panel SHALL display project lifecycle diagram
2. WHEN viewing Quản lý Công trình tab THEN the Admin_Panel SHALL explain how to approve/reject projects
3. WHEN viewing Quản lý Công trình tab THEN the Admin_Panel SHALL show how to manage bids
4. WHEN viewing Quản lý Công trình tab THEN the Admin_Panel SHALL explain escrow and fee management

### Requirement 6: Tab Quản lý Nhà thầu

**User Story:** As an Admin, I want to learn how to verify contractors.

#### Acceptance Criteria

1. WHEN viewing Quản lý Nhà thầu tab THEN the Admin_Panel SHALL display verification workflow
2. WHEN viewing Quản lý Nhà thầu tab THEN the Admin_Panel SHALL explain what documents to check
3. WHEN viewing Quản lý Nhà thầu tab THEN the Admin_Panel SHALL show how to approve/reject contractors
4. WHEN viewing Quản lý Nhà thầu tab THEN the Admin_Panel SHALL explain ranking system

### Requirement 7: Tab Cài đặt

**User Story:** As an Admin, I want to learn how to configure system settings.

#### Acceptance Criteria

1. WHEN viewing Cài đặt tab THEN the Admin_Panel SHALL explain bidding settings
2. WHEN viewing Cài đặt tab THEN the Admin_Panel SHALL show how to manage service fees
3. WHEN viewing Cài đặt tab THEN the Admin_Panel SHALL explain region management
4. WHEN viewing Cài đặt tab THEN the Admin_Panel SHALL show notification template management

### Requirement 8: Tab API Keys (Hướng dẫn)

**User Story:** As an Admin, I want to learn how to use API keys for AI agent integration.

#### Acceptance Criteria

1. WHEN viewing API Keys tab THEN the Admin_Panel SHALL explain what API keys are in simple terms with examples
2. WHEN viewing API Keys tab THEN the Admin_Panel SHALL provide step-by-step guide for creating and using API keys
3. WHEN viewing API Keys tab THEN the Admin_Panel SHALL show example use cases (ChatGPT đọc leads, Claude tạo blog)
4. WHEN viewing API Keys tab THEN the Admin_Panel SHALL explain security tips (không chia sẻ key, tắt khi không dùng)

---

## PHẦN 2: QUẢN LÝ API KEYS

### Requirement 9: Danh sách API Keys

**User Story:** As an Admin, I want to view all API keys, so that I can manage external integrations.

#### Acceptance Criteria

1. WHEN navigating to /settings/api-keys THEN the Admin_Panel SHALL display a table with columns: Tên, Trạng thái (Hoạt động/Tắt/Hết hạn), Quyền, Lần dùng cuối, Ngày tạo
2. WHEN displaying API keys THEN the Admin_Panel SHALL show only first 8 characters of key followed by "..." for security
3. WHEN an API key has never been used THEN the Admin_Panel SHALL display "Chưa sử dụng"
4. WHEN filtering by status THEN the Admin_Panel SHALL show only matching keys

### Requirement 10: Tạo API Key mới

**User Story:** As an Admin, I want to create new API keys for AI agents.

#### Acceptance Criteria

1. WHEN clicking "Tạo API Key" THEN the Admin_Panel SHALL display a form with: Tên (bắt buộc), Mô tả (tùy chọn), Quyền (Chỉ đọc/Đọc-Ghi/Toàn quyền), Nhóm API được phép, Thời hạn (Không giới hạn/30 ngày/90 ngày/1 năm)
2. WHEN submitting valid form THEN the System SHALL generate a secure 64-character API key
3. WHEN key is created THEN the Admin_Panel SHALL display the full key ONLY ONCE with copy button and warning "Key này chỉ hiển thị một lần duy nhất!"
4. WHEN selecting Quyền THEN the Admin_Panel SHALL show clear explanation: Chỉ đọc (xem dữ liệu), Đọc-Ghi (xem và tạo/sửa), Toàn quyền (bao gồm xóa)
5. WHEN selecting Nhóm API THEN the Admin_Panel SHALL show checkboxes: Leads, Blog, Công trình, Nhà thầu, Báo cáo

### Requirement 11: Bật/Tắt API Key

**User Story:** As an Admin, I want to enable or disable API keys instantly.

#### Acceptance Criteria

1. WHEN clicking toggle on active key THEN the System SHALL set status to inactive immediately
2. WHEN clicking toggle on inactive key THEN the System SHALL set status to active immediately
3. WHEN key is inactive THEN the System SHALL reject all requests using that key
4. WHEN toggling status THEN the Admin_Panel SHALL show toast notification confirming the change

### Requirement 12: Xóa API Key

**User Story:** As an Admin, I want to permanently delete API keys.

#### Acceptance Criteria

1. WHEN clicking delete THEN the Admin_Panel SHALL display confirmation modal with key name
2. WHEN confirming deletion THEN the System SHALL permanently remove the key
3. WHEN key is deleted THEN the System SHALL immediately reject all requests using that key
4. WHEN deletion is complete THEN the Admin_Panel SHALL show success message

### Requirement 13: Test API Key

**User Story:** As an Admin, I want to test if an API key is working, so that I can verify the integration before using it.

#### Acceptance Criteria

1. WHEN clicking "Test" button on an API key THEN the Admin_Panel SHALL display a test modal
2. WHEN test modal opens THEN the Admin_Panel SHALL show a dropdown to select test endpoint (Lấy danh sách Leads, Lấy danh sách Blog, Kiểm tra kết nối)
3. WHEN clicking "Chạy Test" THEN the System SHALL make a real API call using that key
4. WHEN test succeeds THEN the Admin_Panel SHALL display green success message with response preview
5. WHEN test fails THEN the Admin_Panel SHALL display red error message with reason (key inactive, expired, no permission, etc.)
6. WHEN test completes THEN the Admin_Panel SHALL show response time in milliseconds

### Requirement 14: Xem chi tiết API Key

**User Story:** As an Admin, I want to see usage details of an API key.

#### Acceptance Criteria

1. WHEN clicking on an API key row THEN the Admin_Panel SHALL display detail panel
2. WHEN viewing details THEN the Admin_Panel SHALL show: Tên, Mô tả, Quyền, Nhóm API, Ngày tạo, Ngày hết hạn, Tổng số lần sử dụng, Lần sử dụng cuối
3. WHEN viewing details THEN the Admin_Panel SHALL show recent usage log (10 entries): Thời gian, Endpoint, Kết quả (Thành công/Lỗi)
4. WHEN viewing details THEN the Admin_Panel SHALL show Edit and Delete buttons

### Requirement 15: Chỉnh sửa API Key

**User Story:** As an Admin, I want to edit API key settings.

#### Acceptance Criteria

1. WHEN clicking Edit THEN the Admin_Panel SHALL display form with: Tên, Mô tả, Quyền, Nhóm API, Thời hạn
2. WHEN editing THEN the Admin_Panel SHALL NOT show or allow changing the actual key value
3. WHEN saving changes THEN the System SHALL update settings immediately
4. WHEN save completes THEN the Admin_Panel SHALL show success message

### Requirement 16: API Key Authentication (Backend)

**User Story:** As an AI agent, I want to authenticate using an API key to access the system.

#### Acceptance Criteria

1. WHEN request includes valid active API key in X-API-Key header THEN the System SHALL allow access
2. WHEN request includes invalid key THEN the System SHALL return 401 with message "API key không hợp lệ"
3. WHEN request includes inactive key THEN the System SHALL return 401 with message "API key đã bị tắt"
4. WHEN request includes expired key THEN the System SHALL return 401 with message "API key đã hết hạn"
5. WHEN valid key is used THEN the System SHALL update lastUsedAt timestamp

### Requirement 17: API Key Permission Check (Backend)

**User Story:** As an Admin, I want API keys to respect their assigned permissions.

#### Acceptance Criteria

1. WHEN key with "Chỉ đọc" makes POST/PUT/DELETE request THEN the System SHALL return 403 with message "Key này chỉ có quyền đọc"
2. WHEN key with "Đọc-Ghi" makes DELETE request THEN the System SHALL return 403 with message "Key này không có quyền xóa"
3. WHEN request targets endpoint not in allowed groups THEN the System SHALL return 403 with message "Key này không có quyền truy cập endpoint này"
4. WHEN key with "Toàn quyền" and correct endpoint group THEN the System SHALL allow the request

### Requirement 18: Cảnh báo API Key sắp hết hạn

**User Story:** As an Admin, I want to be notified when API keys are about to expire.

#### Acceptance Criteria

1. WHEN an API key will expire within 7 days THEN the Admin_Panel SHALL highlight it with warning color in the list
2. WHEN viewing API keys list THEN the Admin_Panel SHALL show expiration date for keys with time limit
3. WHEN an API key expires THEN the System SHALL automatically set status to "Hết hạn"
4. WHEN editing expired key THEN the Admin_Panel SHALL allow extending expiration to reactivate it
