# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cho Phase 6 của Bidding Marketplace: Portal UI. Phạm vi bao gồm:

1. **Portal App** - Tạo ứng dụng portal mới cho Homeowner và Contractor
2. **Homeowner Dashboard** - Giao diện quản lý công trình và bid cho chủ nhà
3. **Contractor Dashboard** - Giao diện quản lý bid và hồ sơ cho nhà thầu
4. **Public Marketplace** - Trang công khai hiển thị công trình đang đấu giá

Phase 6 xây dựng trên Phase 1-5, tạo giao diện người dùng hoàn chỉnh cho nền tảng đấu giá.

**Lưu ý**: Portal app sẽ là một ứng dụng React riêng biệt, tương tự như admin/ và landing/.

## Glossary

- **Portal**: Ứng dụng web cho người dùng đăng nhập (Homeowner/Contractor)
- **Dashboard**: Trang tổng quan hiển thị thông tin quan trọng
- **Marketplace**: Sàn giao dịch công khai hiển thị công trình đang đấu giá
- **Project Card**: Thẻ hiển thị thông tin tóm tắt công trình
- **Bid Card**: Thẻ hiển thị thông tin tóm tắt bid
- **Profile**: Trang hồ sơ cá nhân/doanh nghiệp

## Requirements

### Requirement 1: Portal App Setup

**User Story:** As a developer, I want a new portal app in the monorepo, so that users have a dedicated interface.

#### Acceptance Criteria

1. WHEN setting up portal THEN the system SHALL create a new Vite + React app at portal/
2. WHEN setting up portal THEN the system SHALL configure shared packages (@app/shared, @app/ui)
3. WHEN setting up portal THEN the system SHALL configure routing with React Router
4. WHEN setting up portal THEN the system SHALL configure authentication with JWT
5. WHEN setting up portal THEN the system SHALL run on port 4203

### Requirement 2: Portal Authentication

**User Story:** As a user, I want to login and register in the portal, so that I can access my account.

#### Acceptance Criteria

1. WHEN a user visits portal THEN the system SHALL redirect unauthenticated users to login
2. WHEN a user logs in THEN the system SHALL store JWT tokens securely
3. WHEN a user registers as homeowner THEN the system SHALL auto-approve and redirect to dashboard
4. WHEN a user registers as contractor THEN the system SHALL show pending verification message
5. WHEN a token expires THEN the system SHALL attempt refresh or redirect to login

### Requirement 3: Portal Layout

**User Story:** As a user, I want a consistent layout across the portal, so that navigation is intuitive.

#### Acceptance Criteria

1. WHEN viewing portal THEN the system SHALL display header with logo, navigation, and user menu
2. WHEN viewing portal THEN the system SHALL display sidebar with role-specific menu items
3. WHEN viewing portal THEN the system SHALL display notification bell with unread count
4. WHEN viewing portal THEN the system SHALL display chat icon with unread message count
5. WHEN on mobile THEN the system SHALL collapse sidebar into hamburger menu

### Requirement 4: Homeowner Dashboard

**User Story:** As a homeowner, I want a dashboard showing my projects and activities, so that I can manage everything in one place.

#### Acceptance Criteria

1. WHEN homeowner views dashboard THEN the system SHALL display welcome message with name
2. WHEN homeowner views dashboard THEN the system SHALL display project summary cards (draft, active, completed)
3. WHEN homeowner views dashboard THEN the system SHALL display recent activity feed
4. WHEN homeowner views dashboard THEN the system SHALL display quick action button to create project
5. WHEN homeowner views dashboard THEN the system SHALL display pending actions (bids to review, reviews to write)

### Requirement 5: Homeowner Project List

**User Story:** As a homeowner, I want to view and manage my projects, so that I can track their progress.

#### Acceptance Criteria

1. WHEN homeowner views projects THEN the system SHALL display all projects with status tabs
2. WHEN homeowner filters projects THEN the system SHALL support filtering by status and date
3. WHEN homeowner clicks a project THEN the system SHALL navigate to project detail page
4. WHEN homeowner creates a project THEN the system SHALL show multi-step form wizard

### Requirement 6: Homeowner Project Detail

**User Story:** As a homeowner, I want to view project details and manage bids, so that I can select the best contractor.

#### Acceptance Criteria

1. WHEN homeowner views project detail THEN the system SHALL display project information and images
2. WHEN homeowner views project detail THEN the system SHALL display bid list with anonymized contractor info
3. WHEN homeowner views a bid THEN the system SHALL display price, timeline, proposal, and contractor rating
4. WHEN homeowner selects a bid THEN the system SHALL show confirmation modal with escrow information
5. WHEN project is matched THEN the system SHALL display contractor contact info and chat button

### Requirement 7: Homeowner Project Creation

**User Story:** As a homeowner, I want to create a new project, so that contractors can bid on it.

#### Acceptance Criteria

1. WHEN creating project THEN the system SHALL display step 1: Basic info (title, description, category)
2. WHEN creating project THEN the system SHALL display step 2: Location (region, address)
3. WHEN creating project THEN the system SHALL display step 3: Details (area, budget, timeline)
4. WHEN creating project THEN the system SHALL display step 4: Images (upload up to 10)
5. WHEN creating project THEN the system SHALL display step 5: Review and submit
6. WHEN submitting project THEN the system SHALL show success message with project code

### Requirement 8: Contractor Dashboard

**User Story:** As a contractor, I want a dashboard showing my bids and statistics, so that I can track my business.

#### Acceptance Criteria

1. WHEN contractor views dashboard THEN the system SHALL display verification status prominently
2. WHEN contractor views dashboard THEN the system SHALL display bid summary (pending, won, lost)
3. WHEN contractor views dashboard THEN the system SHALL display monthly statistics chart
4. WHEN contractor views dashboard THEN the system SHALL display recommended projects based on specialty
5. WHEN contractor views dashboard THEN the system SHALL display recent reviews and rating

### Requirement 9: Contractor Marketplace

**User Story:** As a contractor, I want to browse available projects, so that I can find work opportunities.

#### Acceptance Criteria

1. WHEN contractor views marketplace THEN the system SHALL display projects with OPEN status
2. WHEN contractor filters projects THEN the system SHALL support filtering by region, category, budget
3. WHEN contractor views a project THEN the system SHALL display project details without owner info
4. WHEN contractor is not verified THEN the system SHALL show verification prompt instead of bid button
5. WHEN contractor clicks bid THEN the system SHALL navigate to bid creation form

### Requirement 10: Contractor Bid Management

**User Story:** As a contractor, I want to manage my bids, so that I can track my proposals.

#### Acceptance Criteria

1. WHEN contractor views bids THEN the system SHALL display all bids with status tabs
2. WHEN contractor views a bid THEN the system SHALL display bid details and project info
3. WHEN bid is pending THEN the system SHALL allow editing or withdrawing
4. WHEN bid is selected THEN the system SHALL display homeowner contact info and chat button
5. WHEN bid is not selected THEN the system SHALL display notification with reason if available

### Requirement 11: Contractor Bid Creation

**User Story:** As a contractor, I want to create a bid for a project, so that I can compete for work.

#### Acceptance Criteria

1. WHEN creating bid THEN the system SHALL display project summary at top
2. WHEN creating bid THEN the system SHALL require price and timeline
3. WHEN creating bid THEN the system SHALL require proposal description (min 100 characters)
4. WHEN creating bid THEN the system SHALL allow attaching up to 5 files
5. WHEN submitting bid THEN the system SHALL show win fee calculation and confirmation

### Requirement 12: Contractor Profile Management

**User Story:** As a contractor, I want to manage my profile, so that I can attract more clients.

#### Acceptance Criteria

1. WHEN contractor views profile THEN the system SHALL display current profile information
2. WHEN contractor edits profile THEN the system SHALL allow updating description, experience, specialties
3. WHEN contractor uploads portfolio THEN the system SHALL allow up to 10 images
4. WHEN contractor uploads certificates THEN the system SHALL allow up to 5 certificates
5. WHEN contractor submits verification THEN the system SHALL show pending status and requirements

### Requirement 13: Public Marketplace Page

**User Story:** As a visitor, I want to view the public marketplace, so that I can see available projects.

#### Acceptance Criteria

1. WHEN visitor views marketplace THEN the system SHALL display projects with OPEN status
2. WHEN visitor views a project THEN the system SHALL display limited info (no address, no owner)
3. WHEN visitor clicks bid THEN the system SHALL redirect to login/register
4. WHEN visitor filters projects THEN the system SHALL support filtering by region and category
5. WHEN visitor views statistics THEN the system SHALL display total projects, contractors, completed

### Requirement 14: Public Contractor Directory

**User Story:** As a visitor, I want to browse contractors, so that I can find trusted professionals.

#### Acceptance Criteria

1. WHEN visitor views directory THEN the system SHALL display verified contractors
2. WHEN visitor views a contractor THEN the system SHALL display profile, rating, and reviews
3. WHEN visitor filters contractors THEN the system SHALL support filtering by region and specialty
4. WHEN visitor sorts contractors THEN the system SHALL support sorting by rating and projects
5. WHEN visitor clicks contact THEN the system SHALL redirect to login/register

### Requirement 15: Responsive Design

**User Story:** As a user, I want the portal to work on mobile devices, so that I can access it anywhere.

#### Acceptance Criteria

1. WHEN viewing on mobile THEN the system SHALL display responsive layout
2. WHEN viewing on mobile THEN the system SHALL collapse navigation into hamburger menu
3. WHEN viewing on mobile THEN the system SHALL optimize forms for touch input
4. WHEN viewing on mobile THEN the system SHALL lazy load images for performance
5. WHEN viewing on tablet THEN the system SHALL display adapted layout

### Requirement 16: Portal Notifications

**User Story:** As a user, I want to receive notifications in the portal, so that I stay informed.

#### Acceptance Criteria

1. WHEN user has notifications THEN the system SHALL display badge count in header
2. WHEN user clicks notification bell THEN the system SHALL display dropdown with recent notifications
3. WHEN user clicks a notification THEN the system SHALL navigate to relevant page
4. WHEN user clicks view all THEN the system SHALL navigate to notification center
5. WHEN new notification arrives THEN the system SHALL update badge count in real-time

### Requirement 17: Portal Chat Integration

**User Story:** As a user, I want to access chat from the portal, so that I can communicate with matched parties.

#### Acceptance Criteria

1. WHEN user has unread messages THEN the system SHALL display badge count on chat icon
2. WHEN user clicks chat icon THEN the system SHALL display conversation list sidebar
3. WHEN user selects a conversation THEN the system SHALL display chat interface
4. WHEN user receives a message THEN the system SHALL show notification and update badge
5. WHEN user is in a conversation THEN the system SHALL show typing indicator

### Requirement 18: Error Handling and Loading States

**User Story:** As a user, I want clear feedback during loading and errors, so that I understand what's happening.

#### Acceptance Criteria

1. WHEN data is loading THEN the system SHALL display skeleton loaders
2. WHEN an error occurs THEN the system SHALL display user-friendly error message
3. WHEN network is offline THEN the system SHALL display offline indicator
4. WHEN action succeeds THEN the system SHALL display success toast notification
5. WHEN form has errors THEN the system SHALL display inline validation messages

### Requirement 19: User Onboarding

**User Story:** As a new user, I want guided onboarding, so that I understand how to use the platform.

#### Acceptance Criteria

1. WHEN a homeowner logs in first time THEN the system SHALL show onboarding tour highlighting key features
2. WHEN a contractor logs in first time THEN the system SHALL show verification checklist with progress
3. WHEN onboarding THEN the system SHALL use tooltips to explain each feature
4. WHEN user completes onboarding THEN the system SHALL mark as completed and not show again
5. WHEN user skips onboarding THEN the system SHALL allow re-access from help menu

### Requirement 20: Bid Comparison

**User Story:** As a homeowner, I want to compare bids side-by-side, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN viewing bids THEN the system SHALL allow selecting up to 3 bids for comparison
2. WHEN comparing THEN the system SHALL display side-by-side: price, timeline, proposal highlights, contractor rating
3. WHEN comparing THEN the system SHALL highlight differences (lowest price in green, fastest timeline)
4. WHEN user selects a bid from comparison THEN the system SHALL navigate to selection confirmation

### Requirement 21: Saved Projects

**User Story:** As a contractor, I want to save interesting projects, so that I can bid on them later.

#### Acceptance Criteria

1. WHEN viewing a project THEN the system SHALL display "Lưu" bookmark button
2. WHEN contractor saves a project THEN the system SHALL add to saved projects list
3. WHEN viewing saved projects THEN the system SHALL show list with bid deadline countdown
4. WHEN a saved project deadline approaches (24h) THEN the system SHALL send reminder notification
5. WHEN project is no longer OPEN THEN the system SHALL mark as expired in saved list

### Requirement 22: Draft Auto-save

**User Story:** As a user, I want my work auto-saved, so that I don't lose progress.

#### Acceptance Criteria

1. WHEN creating project THEN the system SHALL auto-save draft every 30 seconds
2. WHEN creating bid THEN the system SHALL auto-save draft every 30 seconds
3. WHEN user returns to incomplete form THEN the system SHALL restore from draft
4. WHEN draft is older than 30 days THEN the system SHALL prompt to continue or delete
5. WHEN form is submitted THEN the system SHALL delete the draft

### Requirement 23: Activity History

**User Story:** As a user, I want to see my activity history, so that I can track my actions.

#### Acceptance Criteria

1. WHEN viewing profile THEN the system SHALL display activity history tab
2. WHEN displaying history THEN the system SHALL show: projects created, bids submitted, reviews written, matches
3. WHEN filtering history THEN the system SHALL support filtering by type and date range
4. WHEN viewing history item THEN the system SHALL link to relevant detail page

### Requirement 24: Help Center

**User Story:** As a user, I want access to help resources, so that I can solve problems independently.

#### Acceptance Criteria

1. WHEN clicking help icon THEN the system SHALL display help center panel
2. WHEN viewing help THEN the system SHALL show FAQ organized by category (Homeowner, Contractor, Payment)
3. WHEN searching help THEN the system SHALL search FAQ content and display matching results
4. WHEN user cannot find answer THEN the system SHALL show contact support option with form

### Requirement 25: Dark Mode

**User Story:** As a user, I want dark mode option, so that I can use the portal comfortably at night.

#### Acceptance Criteria

1. WHEN user toggles dark mode THEN the system SHALL switch to dark theme immediately
2. WHEN user preference is set THEN the system SHALL persist across sessions in localStorage
3. WHEN system preference is "auto" THEN the system SHALL follow OS dark mode setting
4. WHEN switching themes THEN the system SHALL animate transition smoothly

### Requirement 26: Accessibility

**User Story:** As a user with disabilities, I want the portal to be accessible, so that I can use it effectively.

#### Acceptance Criteria

1. WHEN navigating THEN the system SHALL support full keyboard navigation
2. WHEN displaying content THEN the system SHALL meet WCAG 2.1 AA color contrast standards
3. WHEN using screen reader THEN the system SHALL provide proper ARIA labels and roles
4. WHEN displaying images THEN the system SHALL include descriptive alt text
5. WHEN displaying forms THEN the system SHALL associate labels with inputs properly

### Requirement 27: Print Support

**User Story:** As a user, I want to print project and bid details, so that I can have physical records.

#### Acceptance Criteria

1. WHEN viewing project detail THEN the system SHALL display print button
2. WHEN viewing bid detail THEN the system SHALL display print button
3. WHEN printing THEN the system SHALL format content for A4 paper with proper margins
4. WHEN printing THEN the system SHALL hide navigation, sidebar, and non-essential elements
