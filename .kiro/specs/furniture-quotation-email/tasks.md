# Implementation Plan

- [x] 1. Optimize Rate Limiting Configuration





  - [x] 1.1 Update rate limiter for furniture read endpoints


    - Increase maxAttempts to 100 for GET /api/furniture/* endpoints
    - Keep windowMs at 60 seconds
    - _Requirements: 1.1, 1.4_
  - [x] 1.2 Configure separate rate limit for quotation submission


    - Set maxAttempts to 10 for POST /api/furniture/quotations
    - _Requirements: 1.2_
  - [ ]* 1.3 Write property test for read operations rate limit
    - **Property 8: Read Operations Rate Limit**
    - **Validates: Requirements 1.1, 1.4**

- [x] 2. Create Gmail Email Service





  - [x] 2.1 Create gmail-email.service.ts


    - Implement sendQuotationEmail method using Google OAuth2
    - Implement isConfigured method to check integration status
    - Implement refreshTokenIfNeeded for token refresh
    - Use existing googleSheetsService OAuth2 client
    - _Requirements: 6.1, 6.3, 6.4_
  - [x] 2.2 Add Gmail API scope to Google integration


    - Add 'https://www.googleapis.com/auth/gmail.send' scope
    - Update google-sheets.service.ts SCOPES array
    - _Requirements: 6.1_
  - [ ]* 2.3 Write unit tests for Gmail service
    - Test isConfigured returns correct status
    - Test error handling for missing configuration
    - _Requirements: 6.2_




- [x] 3. Create Send Email API Endpoint



  - [x] 3.1 Add POST /api/furniture/quotations/:id/send-email endpoint

    - Validate quotation exists
    - Validate lead has email
    - Generate PDF using existing pdf.service
    - Send email via Gmail service
    - Return success response with timestamp
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 3.2 Add rate limiting for email endpoint

    - Configure 3 requests per quotation per hour
    - Use quotation ID as rate limit key
    - _Requirements: 8.5_
  - [ ]* 3.3 Write property test for API validation
    - **Property 6: API Validates Quotation Before Email**
    - **Validates: Requirements 8.2**
  - [ ]* 3.4 Write property test for email rate limiting
    - **Property 7: Email Rate Limiting Per Quotation**
    - **Validates: Requirements 8.5**


- [x] 4. Update LeadInfoStep - Require Email








  - [x] 4.1 Make email field required in LeadInfoStep


    - Add required attribute to email input
    - Update validation to require email
    - Add helper text explaining email is needed for quotation
    - _Requirements: 4.1, 4.4_
  - [x] 4.2 Implement email format validation


    - Use standard email regex pattern
    - Show validation error for invalid format
    - Disable next button when email is invalid
    - _Requirements: 4.2, 4.3_
  - [ ]* 4.3 Write property test for email validation
    - **Property 2: Email Validation Prevents Invalid Submissions**
    - **Validates: Requirements 4.1, 4.2, 4.3**



- [ ] 5. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Hide Prices in ProductStep (Step 7)





  - [x] 6.1 Remove price display from ProductCard


    - Remove formatCurrency calls for prices
    - Remove price range display
    - Remove price from material selector options
    - Keep product name, image, and material name
    - _Requirements: 2.1, 2.4_
  - [x] 6.2 Remove price from SelectedSummary


    - Remove total calculation display
    - Show only product count
    - _Requirements: 2.1_
  - [ ]* 6.3 Write property test for price hiding in Step 7
    - **Property 1: Price Information Hidden in Steps 7-8**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 7. Hide Prices in ConfirmationStep (Step 8)





  - [x] 7.1 Remove price display from product list


    - Remove unit price column
    - Remove line total column
    - Remove formatCurrency calls
    - Keep product name, material, quantity
    - _Requirements: 2.2_
  - [x] 7.2 Remove totals section


    - Remove subtotal display
    - Remove fees breakdown
    - Remove grand total
    - _Requirements: 2.2_
  - [x] 7.3 Update confirm button text


    - Change to "Xác nhận & Gửi báo giá qua Email"
    - _Requirements: 2.2_



- [x] 8. Redesign QuotationResultStep (Step 9)







  - [x] 8.1 Replace price display with email confirmation



    - Show success icon and message
    - Display recipient email address
    - Add "Check spam folder" instruction

    - _Requirements: 5.1, 5.2, 5.4_
  - [x] 8.2 Add resend email functionality
    - Add "Gửi lại email" button
    - Call send-email API on click
    - Show loading state during send
    - Handle rate limit errors
    - _Requirements: 5.5_
  - [x] 8.3 Update "New Quotation" button

    - Keep existing reset functionality
    - _Requirements: 5.3_
  - [ ]* 8.4 Write property test for Step 9 display
    - **Property 3: Step 9 Shows Email Confirmation**
    - **Validates: Requirements 5.1, 5.2**

- [x] 9. Update useQuotation Hook





  - [x] 9.1 Add sendEmail function to hook


    - Call POST /api/furniture/quotations/:id/send-email
    - Handle success/error responses
    - Track email sent status
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 9.2 Update calculateQuotation to trigger email

    - After successful quotation creation, call sendEmail
    - Pass quotation ID to sendEmail
    - _Requirements: 3.1_

- [x] 10. Update Frontend API Client




  - [x] 10.1 Add sendQuotationEmail method to furnitureAPI


    - POST /api/furniture/quotations/:id/send-email
    - Return SendEmailResponse type
    - Handle error responses
    - _Requirements: 3.1_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. PDF Filename and Email Content






  - [x] 12.1 Update PDF filename format

    - Use format "bao-gia-{unitNumber}-{date}.pdf"
    - Sanitize unitNumber for filename safety
    - _Requirements: 7.4_
  - [ ]* 12.2 Write property test for filename format
    - **Property 5: Email Filename Format**
    - **Validates: Requirements 7.4**
  - [x] 12.3 Create email HTML template


    - Professional Vietnamese email template
    - Include company branding
    - Explain PDF attachment
    - _Requirements: 3.5_



- [x] 13. Error Handling and Edge Cases



  - [x] 13.1 Handle Gmail not configured error


    - Show user-friendly message
    - Suggest contacting support
    - _Requirements: 6.2_
  - [x] 13.2 Handle email send failure

    - Show error message
    - Offer retry option
    - _Requirements: 3.4, 8.4_
  - [x] 13.3 Handle rate limit exceeded

    - Show wait time message
    - Disable resend button temporarily
    - _Requirements: 1.3_

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

