# Requirements Document

## Introduction

Cải tiến trang Dashboard của Admin Panel để phản ánh đầy đủ các tính năng hiện có của hệ thống Anh Thợ Xây. Dashboard hiện tại chỉ hiển thị thống kê về Leads và Pricing Config, trong khi hệ thống đã có nhiều module quan trọng khác như Đấu thầu, Nhà thầu, Nội thất, Blog, Users.

Dashboard mới sẽ cung cấp cái nhìn tổng quan toàn diện về hoạt động của hệ thống, giúp Admin nhanh chóng nhận biết các công việc cần xử lý và truy cập nhanh đến các chức năng quan trọng.

## Glossary

- **Dashboard**: Trang tổng quan hiển thị thống kê và thông tin quan trọng của hệ thống
- **Stats Card**: Thẻ hiển thị một số liệu thống kê với icon, label và value
- **Quick Actions**: Các nút truy cập nhanh đến các chức năng thường dùng
- **Pending Items**: Các mục cần xử lý (chờ duyệt, chờ xác minh)
- **Admin Panel**: Giao diện quản trị hệ thống tại localhost:4201
- **Leads**: Khách hàng tiềm năng từ form báo giá/liên hệ
- **Projects**: Công trình đăng bởi chủ nhà trong hệ thống đấu thầu
- **Bids**: Đề xuất thầu từ nhà thầu
- **Contractors**: Nhà thầu đăng ký trong hệ thống
- **Interior Quotes**: Báo giá nội thất từ wizard trên landing page

## Requirements

### Requirement 1: Enhanced Stats Overview

**User Story:** As an admin, I want to see comprehensive statistics about all system modules, so that I can quickly understand the overall system status.

#### Acceptance Criteria

1. WHEN the Dashboard loads THEN the System SHALL display stats cards in a responsive grid layout with 6-8 cards
2. WHEN displaying stats THEN the System SHALL show the following metrics:
   - Tổng khách hàng (Leads) với số lượng mới
   - Công trình chờ duyệt (Projects PENDING_APPROVAL)
   - Bids chờ duyệt (Bids PENDING)
   - Nhà thầu chờ xác minh (Contractors PENDING)
   - Báo giá nội thất (Interior Quotes)
   - Tổng bài viết (Blog Posts)
   - Tổng users
   - Tổng media files
3. WHEN a stats card has pending items THEN the System SHALL highlight the card with a warning indicator
4. WHEN the user clicks on a stats card THEN the System SHALL navigate to the corresponding management page

### Requirement 2: Pending Items Section

**User Story:** As an admin, I want to see a consolidated list of items requiring my attention, so that I can prioritize and process them efficiently.

#### Acceptance Criteria

1. WHEN there are pending items THEN the System SHALL display a "Cần xử lý" section below the stats cards
2. WHEN displaying pending items THEN the System SHALL show tabs for different categories:
   - Công trình chờ duyệt
   - Bids chờ duyệt
   - Nhà thầu chờ xác minh
3. WHEN a tab is selected THEN the System SHALL display up to 5 most recent pending items for that category
4. WHEN the user clicks on a pending item THEN the System SHALL navigate to the detail page for that item
5. WHEN there are no pending items in a category THEN the System SHALL display an empty state message

### Requirement 3: Activity Charts

**User Story:** As an admin, I want to see visual charts of system activity, so that I can understand trends and patterns.

#### Acceptance Criteria

1. WHEN the Dashboard loads THEN the System SHALL display activity charts in a 2-column layout
2. WHEN displaying charts THEN the System SHALL show:
   - Leads theo ngày (30 ngày) - Line chart
   - Tỷ lệ chuyển đổi - Gauge/Progress card
   - Phân bố leads theo trạng thái - Pie chart
   - Phân bố leads theo nguồn - Bar chart
3. WHEN chart data is loading THEN the System SHALL display a loading spinner
4. WHEN chart data fails to load THEN the System SHALL display an error message with retry option

### Requirement 4: Recent Activity Feed

**User Story:** As an admin, I want to see recent activities across the system, so that I can stay informed about what's happening.

#### Acceptance Criteria

1. WHEN the Dashboard loads THEN the System SHALL display a "Hoạt động gần đây" section
2. WHEN displaying recent activity THEN the System SHALL show the 10 most recent items from:
   - New leads
   - New projects submitted
   - New bids submitted
   - Contractor registrations
   - Interior quotes created
3. WHEN displaying an activity item THEN the System SHALL show timestamp, type icon, and brief description
4. WHEN the user clicks on an activity item THEN the System SHALL navigate to the relevant detail page

### Requirement 5: Quick Actions Enhancement

**User Story:** As an admin, I want quick access to frequently used actions, so that I can perform common tasks efficiently.

#### Acceptance Criteria

1. WHEN the Dashboard loads THEN the System SHALL display a "Thao tác nhanh" section with action buttons
2. WHEN displaying quick actions THEN the System SHALL include:
   - Duyệt công trình (if pending > 0)
   - Duyệt nhà thầu (if pending > 0)
   - Quản lý đấu thầu
   - Cấu hình nội thất
   - Viết bài blog
   - Quản lý media
3. WHEN a quick action has pending items THEN the System SHALL display a badge with the count
4. WHEN the user clicks a quick action THEN the System SHALL navigate to the corresponding page

### Requirement 6: Dashboard API Endpoint

**User Story:** As a developer, I want a single API endpoint that returns all dashboard data, so that the frontend can load efficiently.

#### Acceptance Criteria

1. WHEN the frontend requests dashboard data THEN the API SHALL return all stats in a single response
2. WHEN returning stats THEN the API SHALL include counts for:
   - leads (total, new, byStatus)
   - projects (total, pending, open, matched, completed)
   - bids (total, pending, approved)
   - contractors (total, pending, verified)
   - interiorQuotes (total, thisMonth)
   - blogPosts (total, published, draft)
   - users (total, byRole)
   - media (total)
3. WHEN the API request fails THEN the System SHALL return appropriate error response with status code
4. WHEN the user is not authenticated THEN the API SHALL return 401 Unauthorized

### Requirement 7: Responsive Design

**User Story:** As an admin using different devices, I want the dashboard to be responsive, so that I can use it on tablet and mobile.

#### Acceptance Criteria

1. WHEN viewing on desktop (>1024px) THEN the System SHALL display stats in 4-column grid
2. WHEN viewing on tablet (768-1024px) THEN the System SHALL display stats in 2-column grid
3. WHEN viewing on mobile (<768px) THEN the System SHALL display stats in 1-column grid
4. WHEN viewing on mobile THEN the System SHALL collapse charts into a scrollable horizontal layout
5. WHEN viewing on any device THEN the System SHALL maintain readable font sizes and touch-friendly targets

### Requirement 8: Performance Optimization

**User Story:** As an admin, I want the dashboard to load quickly, so that I can access information without delay.

#### Acceptance Criteria

1. WHEN the Dashboard loads THEN the System SHALL display skeleton loaders for each section
2. WHEN loading data THEN the System SHALL load stats cards first, then charts, then activity feed
3. WHEN data is cached THEN the System SHALL use cached data for initial render and refresh in background
4. WHEN the Dashboard is visible THEN the System SHALL auto-refresh data every 5 minutes
