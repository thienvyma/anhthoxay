# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cải thiện hệ thống Admin Dashboard và Quote Calculator cho dự án Anh Thợ Xây. Bao gồm 5 phần chính:
1. Fix Auth cho Admin Pages - Chuyển từ credentials sang JWT
2. Quote Calculator Enhancement - Lưu báo giá và đăng ký tư vấn
3. Leads Management Enhancement - Search, notes, export, hiển thị quoteData
4. Dashboard Charts - Biểu đồ thống kê
5. Google Sheets Integration - Đồng bộ leads về Google Sheets qua OAuth2

## Glossary

- **Admin_Dashboard**: Giao diện quản trị tại port 4201 cho ADMIN và MANAGER
- **Quote_Calculator**: Công cụ tính báo giá trên Landing page
- **Lead**: Khách hàng tiềm năng từ form báo giá hoặc liên hệ
- **QuoteData**: Dữ liệu JSON chứa kết quả tính toán báo giá
- **JWT**: JSON Web Token dùng để xác thực API
- **Google_Sheets_API**: API của Google để đọc/ghi dữ liệu vào Google Sheets
- **OAuth2**: Giao thức xác thực để kết nối với Google API

## Requirements

### Requirement 1: Fix Auth cho Admin Pages

**User Story:** As an admin, I want all admin pages to use JWT authentication consistently, so that the system is secure and follows the established auth pattern.

#### Acceptance Criteria

1. WHEN an admin page makes an API request THEN the Admin_Dashboard SHALL include JWT token in Authorization header instead of using credentials: 'include'
2. WHEN the JWT token expires THEN the Admin_Dashboard SHALL automatically refresh the token using the refresh token mechanism
3. WHEN token refresh fails THEN the Admin_Dashboard SHALL redirect user to login page
4. WHEN user logs out THEN the Admin_Dashboard SHALL clear all stored tokens and redirect to login

### Requirement 2: Quote Calculator - Lưu Báo Giá

**User Story:** As a customer, I want to save my quote result and register for consultation, so that I can receive professional advice from the company.

#### Acceptance Criteria

1. WHEN the Quote_Calculator displays the result THEN the system SHALL show a "Lưu & Đăng ký tư vấn" button
2. WHEN user clicks "Lưu & Đăng ký tư vấn" THEN the system SHALL display a form requesting name, phone, and optional email
3. WHEN user submits the consultation form THEN the system SHALL create a new Lead with quoteData containing the calculation result
4. WHEN lead is created successfully THEN the system SHALL display a success message and offer to start a new calculation
5. WHEN the form submission fails THEN the system SHALL display an error message and allow retry

### Requirement 3: Leads Management Enhancement

**User Story:** As a manager, I want to search, filter, add notes, and export leads, so that I can manage customer relationships effectively.

#### Acceptance Criteria

1. WHEN viewing the leads list THEN the Admin_Dashboard SHALL display a search input that filters leads by name, phone, or email
2. WHEN a lead has quoteData THEN the Admin_Dashboard SHALL display the quote details in a formatted table instead of raw JSON
3. WHEN viewing lead details THEN the Admin_Dashboard SHALL allow adding and editing notes for the lead
4. WHEN user clicks export button THEN the Admin_Dashboard SHALL generate and download a CSV file containing all filtered leads
5. WHEN leads exceed 20 items THEN the Admin_Dashboard SHALL display pagination controls
6. WHEN lead status changes THEN the Admin_Dashboard SHALL record the change in a status history log

### Requirement 4: Dashboard Charts

**User Story:** As an admin, I want to see visual charts of leads statistics, so that I can understand business performance at a glance.

#### Acceptance Criteria

1. WHEN viewing the dashboard THEN the Admin_Dashboard SHALL display a line chart showing leads count by day for the last 30 days
2. WHEN viewing the dashboard THEN the Admin_Dashboard SHALL display a pie chart showing leads distribution by status
3. WHEN viewing the dashboard THEN the Admin_Dashboard SHALL display a bar chart showing leads by source (QUOTE_FORM, CONTACT_FORM)
4. WHEN viewing the dashboard THEN the Admin_Dashboard SHALL display conversion rate (NEW to CONVERTED percentage)
5. WHEN clicking on quick action buttons THEN the Admin_Dashboard SHALL navigate to the corresponding page

### Requirement 5: Google Sheets Integration

**User Story:** As an admin, I want to sync leads to Google Sheets automatically, so that I can manage leads in a familiar spreadsheet interface.

#### Acceptance Criteria

1. WHEN admin opens Settings page THEN the Admin_Dashboard SHALL display a "Google Sheets" tab with integration options
2. WHEN admin clicks "Connect Google Account" THEN the system SHALL initiate OAuth2 flow to authorize Google Sheets API access
3. WHEN OAuth2 is successful THEN the system SHALL store the refresh token securely and display connected status
4. WHEN admin enters a Spreadsheet ID THEN the system SHALL validate the ID and test write access
5. WHEN a new lead is created THEN the system SHALL automatically append the lead data to the configured Google Sheet
6. WHEN Google Sheets sync fails THEN the system SHALL log the error and retry up to 3 times with exponential backoff
7. WHEN admin clicks "Disconnect" THEN the system SHALL revoke the OAuth2 token and clear stored credentials
8. WHEN viewing integration settings THEN the Admin_Dashboard SHALL display sync status and last sync timestamp

