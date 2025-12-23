# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu để tối ưu hóa responsive cho tất cả các trang trong Admin Dashboard của ANH THỢ XÂY. Hiện tại, admin app có một số vấn đề về responsive trên các thiết bị khác nhau (mobile, tablet, desktop). Mục tiêu là đảm bảo trải nghiệm người dùng nhất quán và dễ sử dụng trên mọi kích thước màn hình.

### Approach: Centralized Responsive System

Thay vì fix responsive từng trang riêng lẻ, chúng ta sẽ tạo một **hệ thống responsive tập trung** bao gồm:

1. **Global CSS Variables & Utility Classes** - Định nghĩa breakpoints, spacing, font sizes dùng chung
2. **Responsive Hooks** - Custom React hooks để detect screen size và apply responsive logic
3. **Responsive Components** - Các component wrapper có sẵn responsive behavior
4. **Global Stylesheet** - File CSS chung với media queries cho toàn app

Cách tiếp cận này có ưu điểm:
- ✅ Consistency: Tất cả các trang sử dụng cùng breakpoints và behavior
- ✅ Maintainability: Chỉ cần sửa 1 chỗ khi cần thay đổi
- ✅ DRY: Không lặp lại code responsive ở mỗi component
- ✅ Performance: CSS được cache và reuse

## Glossary

- **Admin Dashboard**: Ứng dụng quản trị chạy trên port 4201
- **Responsive Design**: Thiết kế giao diện tự động điều chỉnh theo kích thước màn hình
- **Breakpoint**: Điểm ngắt kích thước màn hình để áp dụng CSS khác nhau
- **Mobile**: Thiết bị có màn hình ≤ 640px
- **Tablet**: Thiết bị có màn hình 641px - 1024px
- **Desktop**: Thiết bị có màn hình > 1024px
- **Grid Layout**: Bố cục dạng lưới sử dụng CSS Grid
- **Overflow**: Tình trạng nội dung tràn ra ngoài container

## Requirements

### Requirement 1: Layout Component Responsive

**User Story:** As an admin user, I want the sidebar and main content area to adapt properly on different screen sizes, so that I can navigate and manage the system efficiently on any device.

#### Acceptance Criteria

1. WHEN the screen width is less than or equal to 768px THEN the Admin_Dashboard SHALL hide the desktop sidebar and display a hamburger menu button
2. WHEN a user clicks the hamburger menu on mobile THEN the Admin_Dashboard SHALL display a slide-out mobile menu with all navigation items
3. WHEN the screen width is greater than 768px THEN the Admin_Dashboard SHALL display the collapsible desktop sidebar
4. WHILE the sidebar is collapsed on desktop THEN the Admin_Dashboard SHALL display only icons with tooltips for navigation items
5. WHEN the user info section is displayed on mobile THEN the Admin_Dashboard SHALL truncate long email addresses with ellipsis

### Requirement 2: Dashboard Page Responsive

**User Story:** As an admin user, I want the dashboard statistics and charts to display properly on all devices, so that I can monitor system metrics from anywhere.

#### Acceptance Criteria

1. WHEN the screen width is less than or equal to 640px THEN the Dashboard_Page SHALL display stats cards in a single column layout
2. WHEN the screen width is between 641px and 1024px THEN the Dashboard_Page SHALL display stats cards in a 2-column grid
3. WHEN the screen width is greater than 1024px THEN the Dashboard_Page SHALL display stats cards in a 4-column grid
4. WHEN displaying charts on mobile THEN the Dashboard_Page SHALL stack charts vertically instead of side-by-side
5. WHEN the header section is displayed on mobile THEN the Dashboard_Page SHALL stack the title and landing page badge vertically

### Requirement 3: Data Tables Responsive

**User Story:** As an admin user, I want to view and interact with data tables on mobile devices, so that I can manage users, leads, and other data on the go.

#### Acceptance Criteria

1. WHEN a data table is displayed on mobile THEN the Admin_Dashboard SHALL enable horizontal scrolling for the table container
2. WHEN displaying action buttons in table rows on mobile THEN the Admin_Dashboard SHALL use icon-only buttons to save space
3. WHEN the screen width is less than 768px THEN the Admin_Dashboard SHALL hide non-essential table columns and show only critical information
4. WHEN a user taps on a table row on mobile THEN the Admin_Dashboard SHALL provide a way to view full details (modal or expandable row)
5. WHEN pagination controls are displayed on mobile THEN the Admin_Dashboard SHALL use compact pagination with page number input

### Requirement 4: Forms and Modals Responsive

**User Story:** As an admin user, I want forms and modals to be usable on mobile devices, so that I can create and edit content from any device.

#### Acceptance Criteria

1. WHEN a modal is displayed on mobile THEN the Admin_Dashboard SHALL display the modal as full-screen or near full-screen
2. WHEN form fields are displayed on mobile THEN the Admin_Dashboard SHALL stack form fields vertically with full width
3. WHEN action buttons are displayed in modals on mobile THEN the Admin_Dashboard SHALL stack buttons vertically or use full-width buttons
4. WHEN a modal contains scrollable content THEN the Admin_Dashboard SHALL ensure the modal header and footer remain fixed
5. WHEN input fields receive focus on mobile THEN the Admin_Dashboard SHALL ensure the keyboard does not obscure the active field

### Requirement 5: Tab Navigation Responsive

**User Story:** As an admin user, I want tab navigation to work properly on mobile devices, so that I can switch between different sections easily.

#### Acceptance Criteria

1. WHEN tab navigation has more tabs than can fit on screen THEN the Admin_Dashboard SHALL enable horizontal scrolling for the tab container
2. WHEN tabs are displayed on mobile THEN the Admin_Dashboard SHALL use icon-only tabs or abbreviated labels
3. WHEN a tab is active THEN the Admin_Dashboard SHALL ensure the active tab is visible in the viewport
4. WHILE scrolling through tabs on mobile THEN the Admin_Dashboard SHALL display scroll indicators (fade or arrows) to show more content
5. WHEN the Interior Page tabs are displayed on mobile THEN the Admin_Dashboard SHALL group related tabs into a dropdown or accordion

### Requirement 6: Filter and Search Controls Responsive

**User Story:** As an admin user, I want filter and search controls to be accessible on mobile, so that I can find specific data quickly.

#### Acceptance Criteria

1. WHEN filter controls are displayed on mobile THEN the Admin_Dashboard SHALL stack filters vertically or use a collapsible filter panel
2. WHEN the search input is displayed on mobile THEN the Admin_Dashboard SHALL display the search input at full width
3. WHEN multiple filter buttons are displayed on mobile THEN the Admin_Dashboard SHALL wrap buttons to multiple rows or use a dropdown
4. WHEN a filter panel is expanded on mobile THEN the Admin_Dashboard SHALL overlay the content area with the filter options
5. WHEN filters are applied on mobile THEN the Admin_Dashboard SHALL display a summary badge showing active filter count

### Requirement 7: Media Gallery Responsive

**User Story:** As an admin user, I want the media gallery to display properly on all devices, so that I can manage images and files efficiently.

#### Acceptance Criteria

1. WHEN the media grid is displayed on mobile THEN the Admin_Dashboard SHALL display 2 columns of media cards
2. WHEN the media grid is displayed on tablet THEN the Admin_Dashboard SHALL display 3-4 columns of media cards
3. WHEN media card actions are displayed on mobile THEN the Admin_Dashboard SHALL use a single action menu button instead of multiple buttons
4. WHEN the media list view is displayed on mobile THEN the Admin_Dashboard SHALL use a compact layout with essential info only
5. WHEN uploading files on mobile THEN the Admin_Dashboard SHALL support drag-and-drop or file picker with clear touch targets

### Requirement 8: Typography and Spacing Responsive

**User Story:** As an admin user, I want text and spacing to be readable on all devices, so that I can comfortably read and interact with content.

#### Acceptance Criteria

1. WHEN content is displayed on mobile THEN the Admin_Dashboard SHALL use appropriate font sizes (minimum 14px for body text)
2. WHEN headings are displayed on mobile THEN the Admin_Dashboard SHALL scale heading sizes proportionally (h1: 24px, h2: 20px, h3: 18px)
3. WHEN padding and margins are applied on mobile THEN the Admin_Dashboard SHALL use reduced spacing (16px instead of 24px for main padding)
4. WHEN buttons are displayed on mobile THEN the Admin_Dashboard SHALL ensure minimum touch target size of 44x44 pixels
5. WHEN long text content is displayed on mobile THEN the Admin_Dashboard SHALL use appropriate line-height (1.5) for readability

### Requirement 9: Charts and Visualizations Responsive

**User Story:** As an admin user, I want charts and data visualizations to be readable on mobile, so that I can understand metrics at a glance.

#### Acceptance Criteria

1. WHEN a line chart is displayed on mobile THEN the Admin_Dashboard SHALL reduce the number of data points or use simplified axis labels
2. WHEN a pie chart is displayed on mobile THEN the Admin_Dashboard SHALL position the legend below the chart instead of beside it
3. WHEN a bar chart is displayed on mobile THEN the Admin_Dashboard SHALL use horizontal bars if vertical bars would be too narrow
4. WHEN chart tooltips are displayed on mobile THEN the Admin_Dashboard SHALL ensure tooltips are positioned within the viewport
5. WHEN multiple charts are displayed on mobile THEN the Admin_Dashboard SHALL stack charts vertically with adequate spacing

### Requirement 10: Bidding Management Pages Responsive

**User Story:** As an admin user, I want the bidding management pages (Projects, Bids, Matches, Fees, Disputes) to work on mobile, so that I can manage bidding operations remotely.

#### Acceptance Criteria

1. WHEN the bidding tab navigation is displayed on mobile THEN the Admin_Dashboard SHALL use a scrollable tab bar or dropdown selector
2. WHEN project cards are displayed on mobile THEN the Admin_Dashboard SHALL use a card-based layout instead of table rows
3. WHEN bid details are displayed on mobile THEN the Admin_Dashboard SHALL use an expandable accordion or modal view
4. WHEN status badges are displayed on mobile THEN the Admin_Dashboard SHALL use abbreviated text or icon-only badges
5. WHEN action buttons for bidding items are displayed on mobile THEN the Admin_Dashboard SHALL group actions into a context menu

### Requirement 11: Centralized Responsive System

**User Story:** As a developer, I want a centralized responsive system, so that I can apply consistent responsive behavior across all admin pages without duplicating code.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL define CSS custom properties for breakpoints (mobile: 640px, tablet: 1024px, desktop: 1280px)
2. THE Admin_Dashboard SHALL provide a global stylesheet with utility classes for responsive visibility (hide-mobile, hide-tablet, show-mobile, etc.)
3. THE Admin_Dashboard SHALL provide a useResponsive hook that returns current breakpoint and screen dimensions
4. THE Admin_Dashboard SHALL provide responsive grid utility classes (grid-cols-1, grid-cols-2, grid-cols-4, etc.) that adapt to screen size
5. THE Admin_Dashboard SHALL provide responsive spacing utility classes (p-responsive, m-responsive, gap-responsive) that scale with screen size
6. WHEN a component uses the responsive system THEN the Admin_Dashboard SHALL apply consistent breakpoint behavior across all instances

### Requirement 12: Responsive Component Library

**User Story:** As a developer, I want pre-built responsive components, so that I can quickly build responsive UIs without writing custom CSS for each page.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL provide a ResponsiveGrid component that automatically adjusts columns based on screen size
2. THE Admin_Dashboard SHALL provide a ResponsiveTable component that converts to card layout on mobile
3. THE Admin_Dashboard SHALL provide a ResponsiveTabs component that converts to scrollable or dropdown on mobile
4. THE Admin_Dashboard SHALL provide a ResponsiveModal component that becomes full-screen on mobile
5. THE Admin_Dashboard SHALL provide a ResponsiveStack component that changes direction based on screen size
6. WHEN using responsive components THEN the Admin_Dashboard SHALL allow customization of breakpoint behavior via props

