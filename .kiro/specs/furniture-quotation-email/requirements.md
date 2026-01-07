# Requirements Document

## Introduction

Tính năng này thay đổi flow báo giá nội thất tại landing page để bảo vệ thông tin giá khỏi đối thủ cạnh tranh và ngăn chặn spam. Thay vì hiển thị giá trực tiếp trên website, hệ thống sẽ gửi file PDF báo giá qua email cho khách hàng sau khi họ hoàn thành form đăng ký.

Đồng thời, tính năng này cũng giải quyết vấn đề rate limiting đang gây ảnh hưởng trải nghiệm người dùng khi sử dụng bảng báo giá nội thất.

## Glossary

- **FurnitureQuote**: Module báo giá nội thất trên landing page, gồm 9 bước từ chọn chủ đầu tư đến xem kết quả
- **Lead**: Thông tin khách hàng tiềm năng (tên, SĐT, email)
- **Quotation**: Báo giá được tạo từ các sản phẩm nội thất đã chọn
- **PDF Quotation**: File PDF chứa thông tin báo giá chi tiết
- **Google Integration**: Tích hợp Google OAuth2 trong admin settings để gửi email
- **Rate Limiting**: Cơ chế giới hạn số lượng request trong một khoảng thời gian
- **Step 7**: Bước chọn sản phẩm nội thất
- **Step 8**: Bước xác nhận sản phẩm đã chọn
- **Step 9**: Bước hiển thị kết quả báo giá (sẽ thay đổi thành xác nhận gửi email)

## Requirements

### Requirement 1: Rate Limiting Optimization

**User Story:** As a homeowner, I want to use the furniture quotation tool without being blocked by rate limits, so that I can complete my quotation smoothly.

#### Acceptance Criteria

1. WHEN a user navigates through furniture quotation steps THEN THE FurnitureQuote system SHALL allow at least 50 API requests per minute for read operations
2. WHEN a user submits a quotation THEN THE FurnitureQuote system SHALL apply rate limiting only to the final submission endpoint
3. WHEN rate limiting is applied THEN THE FurnitureQuote system SHALL display a user-friendly message with estimated wait time
4. WHILE a user is actively using the quotation tool THEN THE FurnitureQuote system SHALL not interrupt the session with rate limit errors for navigation requests

### Requirement 2: Hide Price Information in Steps 7-8

**User Story:** As a business owner, I want to hide pricing information from the quotation steps, so that competitors cannot easily view our pricing structure.

#### Acceptance Criteria

1. WHEN displaying products in Step 7 THEN THE ProductStep component SHALL show product names and materials without displaying prices
2. WHEN displaying the confirmation in Step 8 THEN THE ConfirmationStep component SHALL show selected products without displaying individual prices or totals
3. WHEN a user selects a product variant THEN THE FurnitureQuote system SHALL store the selection without revealing the calculated price
4. WHEN rendering product cards THEN THE FurnitureQuote system SHALL hide all price-related information including unit prices and subtotals

### Requirement 3: Email-Based Quotation Delivery

**User Story:** As a homeowner, I want to receive my furniture quotation via email, so that I have a permanent record of the pricing.

#### Acceptance Criteria

1. WHEN a user completes Step 8 and confirms their selection THEN THE FurnitureQuote system SHALL send a PDF quotation to the provided email address
2. WHEN sending the quotation email THEN THE FurnitureQuote system SHALL use the Google integration configured in admin settings
3. WHEN the email is sent successfully THEN THE FurnitureQuote system SHALL display a confirmation message in Step 9
4. IF the email sending fails THEN THE FurnitureQuote system SHALL display an error message and offer retry option
5. WHEN generating the email THEN THE FurnitureQuote system SHALL include the PDF as an attachment with a descriptive filename

### Requirement 4: Email Validation and Requirement

**User Story:** As a business owner, I want to require valid email addresses for quotations, so that I can ensure delivery and reduce spam submissions.

#### Acceptance Criteria

1. WHEN a user enters contact information in Step 6 THEN THE LeadInfoStep component SHALL require a valid email address
2. WHEN validating the email THEN THE FurnitureQuote system SHALL verify the email format follows standard patterns
3. IF the email field is empty or invalid THEN THE FurnitureQuote system SHALL prevent progression to Step 7
4. WHEN displaying the email field THEN THE LeadInfoStep component SHALL indicate that email is required for receiving the quotation

### Requirement 5: Step 9 Redesign - Email Confirmation

**User Story:** As a homeowner, I want to see a clear confirmation that my quotation has been sent, so that I know to check my email.

#### Acceptance Criteria

1. WHEN Step 9 is displayed THEN THE QuotationResultStep component SHALL show an email sent confirmation instead of price details
2. WHEN displaying the confirmation THEN THE QuotationResultStep component SHALL show the email address where the quotation was sent
3. WHEN the quotation is sent THEN THE QuotationResultStep component SHALL provide a "Request New Quotation" button
4. WHEN displaying the confirmation THEN THE QuotationResultStep component SHALL include instructions to check spam folder
5. IF the user did not receive the email THEN THE QuotationResultStep component SHALL provide a resend option

### Requirement 6: Google Email Integration

**User Story:** As an admin, I want to use the existing Google integration to send quotation emails, so that I can manage email sending from a single configuration.

#### Acceptance Criteria

1. WHEN sending a quotation email THEN THE email service SHALL use the Google OAuth2 credentials from admin settings
2. WHEN Google integration is not configured THEN THE FurnitureQuote system SHALL display an appropriate error message
3. WHEN sending emails THEN THE email service SHALL use Gmail API with the configured OAuth2 tokens
4. WHEN the OAuth2 token expires THEN THE email service SHALL automatically refresh the token before sending

### Requirement 7: PDF Generation and Attachment

**User Story:** As a homeowner, I want to receive a professional PDF quotation, so that I can review and share it easily.

#### Acceptance Criteria

1. WHEN generating the PDF THEN THE pdf service SHALL include all selected products with prices
2. WHEN generating the PDF THEN THE pdf service SHALL include apartment information (developer, project, building, unit)
3. WHEN generating the PDF THEN THE pdf service SHALL include fee breakdowns and total price
4. WHEN attaching the PDF THEN THE email service SHALL use a filename format of "bao-gia-{unitNumber}-{date}.pdf"
5. WHEN generating the PDF THEN THE pdf service SHALL use the existing PDF generation logic from the quotation endpoint

### Requirement 8: API Endpoint for Email Sending

**User Story:** As a developer, I want a dedicated API endpoint for sending quotation emails, so that the frontend can trigger email delivery.

#### Acceptance Criteria

1. WHEN the frontend requests email sending THEN THE API SHALL provide a POST endpoint at /api/furniture/quotations/:id/send-email
2. WHEN processing the email request THEN THE API SHALL validate that the quotation exists and has a valid lead with email
3. WHEN the email is sent successfully THEN THE API SHALL return a success response with timestamp
4. IF the email fails to send THEN THE API SHALL return an appropriate error code and message
5. WHEN sending the email THEN THE API SHALL apply rate limiting of 3 requests per quotation per hour

