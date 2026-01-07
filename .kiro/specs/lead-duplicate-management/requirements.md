# Requirements Document

## Introduction

Tính năng quản lý Lead trùng lặp (Duplicate Lead Management) giúp hệ thống tự động phát hiện và xử lý các leads có cùng thông tin liên hệ (phone/email) nhưng vẫn phân biệt theo nguồn (source) để giữ lại các nhu cầu khác nhau của cùng một khách hàng.

**Vấn đề hiện tại:**
- Mỗi lần submit form tạo record mới, không check trùng
- DB phình to với nhiều leads trùng từ double-click, spam
- Admin mất thời gian xử lý leads trùng
- Thống kê sai (conversion rate, daily leads)

**Giải pháp:**
- Auto-merge leads cùng phone + cùng source trong thời gian ngắn (1 giờ)
- Đánh dấu potential duplicates cho Admin review
- Cung cấp UI để Admin merge/view related leads
- Giữ riêng leads từ các nguồn khác nhau (QUOTE_FORM, CONTACT_FORM, FURNITURE_QUOTE)

## Glossary

- **Lead**: Khách hàng tiềm năng submit form trên website
- **Duplicate Lead**: Lead có cùng số điện thoại (normalized) VÀ cùng source với lead khác
- **Related Lead**: Lead có cùng số điện thoại nhưng KHÁC source (cùng người, khác nhu cầu)
- **Primary Lead**: Lead gốc mà các duplicates được merge vào
- **Normalized Phone**: Số điện thoại đã chuẩn hóa (bỏ +84, spaces, dashes → format 0xxxxxxxxx)
- **Source**: Nguồn lead (QUOTE_FORM = báo giá xây dựng, CONTACT_FORM = liên hệ chung, FURNITURE_QUOTE = báo giá nội thất)
- **Time Window**: Khoảng thời gian để auto-merge (mặc định 1 giờ)
- **Submission Count**: Số lần submit của cùng 1 lead (sau khi merge)

## Requirements

### Requirement 1: Phone Number Normalization

**User Story:** As a system, I want to normalize phone numbers before storing, so that I can accurately detect duplicates regardless of input format.

#### Acceptance Criteria

1. WHEN a lead is created with phone number containing spaces, dashes, or parentheses THEN the System SHALL store a normalized version without special characters
2. WHEN a lead is created with phone starting with "+84" THEN the System SHALL convert it to "0" prefix format
3. WHEN a lead is created with phone starting with "84" (without plus) THEN the System SHALL convert it to "0" prefix format
4. WHEN normalizing phone numbers THEN the System SHALL store both original phone and normalized phone for display purposes

### Requirement 2: Auto-Merge Within Time Window (Same Source)

**User Story:** As a system, I want to automatically merge leads with same phone AND same source within 1 hour, so that double-clicks and spam are handled automatically.

#### Acceptance Criteria

1. WHEN a new lead is submitted with same normalized phone AND same source as an existing NEW lead within 1 hour THEN the System SHALL update the existing lead instead of creating new one
2. WHEN auto-merging leads THEN the System SHALL append new content to existing content with timestamp separator
3. WHEN auto-merging leads THEN the System SHALL increment the submission count of the existing lead
4. WHEN auto-merging leads THEN the System SHALL update the quoteData if new quoteData is provided
5. WHEN the existing lead status is not NEW (already CONTACTED, CONVERTED, CANCELLED) THEN the System SHALL create a new lead instead of merging

### Requirement 3: Different Source = Different Lead

**User Story:** As a system, I want to keep leads from different sources separate, so that different customer needs are tracked independently.

#### Acceptance Criteria

1. WHEN a new lead is submitted with same phone but DIFFERENT source THEN the System SHALL create a new lead record
2. WHEN creating a lead with same phone but different source THEN the System SHALL mark both leads as having related leads
3. WHEN a lead has related leads from other sources THEN the System SHALL store the count of related leads

### Requirement 4: Potential Duplicate Detection

**User Story:** As an Admin/Manager, I want to see which leads are potential duplicates, so that I can review and merge them manually.

#### Acceptance Criteria

1. WHEN a new lead is created (not auto-merged) with same phone AND same source as existing leads (outside time window) THEN the System SHALL mark it as potential duplicate
2. WHEN listing leads THEN the System SHALL provide filter option for "potential duplicates only"
3. WHEN viewing a lead with potential duplicates THEN the System SHALL display the list of related duplicate IDs

### Requirement 5: View Related Leads

**User Story:** As an Admin/Manager, I want to view all leads from the same customer (same phone), so that I can see their complete interaction history.

#### Acceptance Criteria

1. WHEN viewing a lead detail THEN the System SHALL show count of related leads (same phone, any source)
2. WHEN requesting related leads for a lead THEN the System SHALL return all leads with same normalized phone grouped by source
3. WHEN displaying related leads THEN the System SHALL show source, status, content preview, and created date for each

### Requirement 6: Manual Merge Leads

**User Story:** As an Admin/Manager, I want to merge duplicate leads manually, so that I can consolidate leads that the system didn't auto-merge.

#### Acceptance Criteria

1. WHEN merging leads THEN the System SHALL only allow merging leads with same source
2. WHEN merging leads THEN the System SHALL require selecting one lead as primary
3. WHEN merging leads THEN the System SHALL append content from secondary leads to primary lead with timestamps
4. WHEN merging leads THEN the System SHALL sum up submission counts
5. WHEN merging leads THEN the System SHALL soft-delete secondary leads and store reference to primary lead
6. WHEN a merged (soft-deleted) lead is accessed THEN the System SHALL redirect to the primary lead

### Requirement 7: Lead Statistics Update

**User Story:** As an Admin/Manager, I want accurate statistics that account for duplicates, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN calculating total leads THEN the System SHALL exclude soft-deleted (merged) leads
2. WHEN calculating conversion rate THEN the System SHALL use unique leads (excluding merged)
3. WHEN displaying stats THEN the System SHALL show additional metric for "duplicate submissions blocked"

### Requirement 8: Duplicate Filter in Lead List

**User Story:** As an Admin/Manager, I want to filter leads by duplicate status, so that I can quickly find and process duplicates.

#### Acceptance Criteria

1. WHEN listing leads THEN the System SHALL support filter parameter for duplicate status (all, duplicates_only, no_duplicates)
2. WHEN listing leads THEN the System SHALL support filter parameter for has_related (leads with related leads from other sources)
3. WHEN displaying lead in list THEN the System SHALL show badge/indicator for potential duplicate and related count
