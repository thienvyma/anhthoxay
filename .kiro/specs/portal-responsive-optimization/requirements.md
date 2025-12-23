# Requirements Document

## Introduction

Tối ưu hóa responsive cho Portal app bằng cách áp dụng các responsive components đã được phát triển cho Admin app. Portal hiện có một số responsive components cơ bản nhưng còn thiếu nhiều components quan trọng như ResponsiveTable, ResponsiveModal, ResponsiveFilters. Mục tiêu là đảm bảo trải nghiệm người dùng tốt trên mobile, tablet và desktop cho cả Homeowner và Contractor.

## Glossary

- **Portal**: Ứng dụng web cho Homeowner và Contractor quản lý công trình, bids
- **Responsive Component**: Component tự động điều chỉnh layout theo kích thước màn hình
- **Breakpoint**: Điểm chuyển đổi layout (mobile: <640px, tablet: 640-1024px, desktop: >1024px)
- **Touch Target**: Vùng chạm tối thiểu 44x44px cho mobile
- **Card Layout**: Layout dạng thẻ thay thế table trên mobile

## Requirements

### Requirement 1

**User Story:** As a Contractor, I want to view project listings and my bids on mobile devices, so that I can manage my work on the go.

#### Acceptance Criteria

1. WHEN a Contractor views the marketplace on mobile THEN the Portal SHALL display projects as cards instead of table rows
2. WHEN a Contractor views their bids list on mobile THEN the Portal SHALL display bids as cards with essential info visible
3. WHEN a Contractor taps on a project card THEN the Portal SHALL navigate to project detail with smooth transition
4. WHEN displaying action buttons on mobile THEN the Portal SHALL ensure minimum touch target of 44x44 pixels

### Requirement 2

**User Story:** As a Homeowner, I want to manage my projects on mobile devices, so that I can track progress anywhere.

#### Acceptance Criteria

1. WHEN a Homeowner views their projects list on mobile THEN the Portal SHALL display projects as cards with status badges
2. WHEN a Homeowner views bids for a project on mobile THEN the Portal SHALL display bid comparison in a mobile-friendly format
3. WHEN a Homeowner creates a new project on mobile THEN the Portal SHALL display form fields in single-column layout
4. WHEN displaying project images on mobile THEN the Portal SHALL use responsive image gallery with swipe support

### Requirement 3

**User Story:** As a user, I want modals and dialogs to be usable on mobile, so that I can complete actions without frustration.

#### Acceptance Criteria

1. WHEN a modal opens on mobile THEN the Portal SHALL display it as full-screen overlay
2. WHEN a modal has form inputs THEN the Portal SHALL ensure inputs are accessible without keyboard overlap
3. WHEN a modal has action buttons THEN the Portal SHALL stack buttons vertically on mobile
4. WHEN user presses Escape or taps outside THEN the Portal SHALL close the modal appropriately

### Requirement 4

**User Story:** As a user, I want to filter and search data on mobile, so that I can find relevant information quickly.

#### Acceptance Criteria

1. WHEN filters are displayed on mobile THEN the Portal SHALL collapse them into an expandable panel
2. WHEN user expands filter panel THEN the Portal SHALL display filters in single-column layout
3. WHEN active filters exist THEN the Portal SHALL show filter count badge on collapsed panel
4. WHEN user clears filters THEN the Portal SHALL reset all filter values and collapse panel

### Requirement 5

**User Story:** As a user, I want navigation tabs to work well on mobile, so that I can switch between sections easily.

#### Acceptance Criteria

1. WHEN tabs exceed screen width on mobile THEN the Portal SHALL enable horizontal scrolling
2. WHEN user scrolls tabs THEN the Portal SHALL show scroll indicators
3. WHEN tab is selected THEN the Portal SHALL scroll selected tab into view
4. WHEN displaying tab content THEN the Portal SHALL adjust padding for mobile screens

### Requirement 6

**User Story:** As a developer, I want reusable responsive components, so that I can maintain consistent UX across Portal.

#### Acceptance Criteria

1. WHEN importing responsive components THEN the Portal SHALL provide centralized exports from single index file
2. WHEN using responsive utilities THEN the Portal SHALL provide helper functions for breakpoint-based values
3. WHEN components render THEN the Portal SHALL use design tokens from @app/shared for consistency
4. WHEN testing responsive behavior THEN the Portal SHALL support data-testid and data-breakpoint attributes

### Requirement 7

**User Story:** As a user, I want the portal to not have horizontal scroll on mobile, so that I can navigate without accidentally scrolling sideways.

#### Acceptance Criteria

1. WHEN viewing any page on mobile THEN the Portal SHALL prevent horizontal scrolling
2. WHEN content exceeds container width THEN the Portal SHALL truncate text with ellipsis or wrap appropriately
3. WHEN displaying budget/price information THEN the Portal SHALL format numbers to fit within card width
4. WHEN cards are displayed on mobile THEN the Portal SHALL ensure all content fits within viewport width minus padding

### Requirement 8

**User Story:** As a user, I want project cards on mobile to display information clearly, so that I can quickly understand project details.

#### Acceptance Criteria

1. WHEN displaying project cards on mobile THEN the Portal SHALL show status badge, title, and key info without truncation
2. WHEN displaying budget range THEN the Portal SHALL use abbreviated format (e.g., "5tr - 10tr") on mobile
3. WHEN displaying region and date THEN the Portal SHALL stack information vertically on narrow screens
4. WHEN card content is long THEN the Portal SHALL limit description to 2 lines with ellipsis
