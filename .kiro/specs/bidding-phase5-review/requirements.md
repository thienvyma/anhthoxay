# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cho Phase 5 của Bidding Marketplace: Review & Ranking. Phạm vi bao gồm:

1. **Review System** - Hệ thống đánh giá nhà thầu sau khi hoàn thành dự án
2. **Contractor Ranking** - Xếp hạng nhà thầu dựa trên đánh giá và hiệu suất
3. **Review Moderation** - Admin quản lý và kiểm duyệt đánh giá

Phase 5 xây dựng trên Phase 1-4, bổ sung khả năng đánh giá và xếp hạng nhà thầu để tăng độ tin cậy của nền tảng.

## Glossary

- **Review**: Đánh giá của chủ nhà về nhà thầu sau khi hoàn thành dự án
- **Rating**: Điểm đánh giá từ 1-5 sao
- **Response**: Phản hồi của nhà thầu đối với đánh giá
- **Ranking**: Xếp hạng nhà thầu dựa trên nhiều tiêu chí
- **Ranking Score**: Điểm tổng hợp để xếp hạng
- **Featured Contractor**: Nhà thầu nổi bật được hiển thị ưu tiên

## Requirements

### Requirement 1: Review Data Model

**User Story:** As a system architect, I want a Review model to store ratings and feedback, so that contractor performance is tracked.

#### Acceptance Criteria

1. WHEN a review is created THEN the system SHALL associate it with a project, reviewer (homeowner), and contractor
2. WHEN a review is created THEN the system SHALL require a rating from 1 to 5
3. WHEN a review is created THEN the system SHALL optionally accept a comment and images
4. WHEN a review is created THEN the system SHALL enforce unique constraint on project-reviewer pair
5. WHEN a review is created THEN the system SHALL set isPublic to true by default

### Requirement 2: Review Creation

**User Story:** As a homeowner, I want to review a contractor after project completion, so that I can share my experience.

#### Acceptance Criteria

1. WHEN a project is COMPLETED THEN the system SHALL allow the homeowner to create a review
2. WHEN a project is NOT COMPLETED THEN the system SHALL NOT allow creating a review
3. WHEN a homeowner has already reviewed a project THEN the system SHALL NOT allow duplicate reviews
4. WHEN creating a review THEN the system SHALL validate rating is between 1 and 5
5. WHEN creating a review with images THEN the system SHALL validate image URLs and limit to 5 images

### Requirement 3: Review Response

**User Story:** As a contractor, I want to respond to reviews, so that I can address feedback professionally.

#### Acceptance Criteria

1. WHEN a contractor receives a review THEN the system SHALL allow them to respond once
2. WHEN a contractor responds THEN the system SHALL record the response and respondedAt timestamp
3. WHEN a contractor has already responded THEN the system SHALL NOT allow additional responses
4. WHEN a response is submitted THEN the system SHALL notify the reviewer

### Requirement 4: Review Visibility

**User Story:** As a product owner, I want to control review visibility, so that inappropriate content is filtered.

#### Acceptance Criteria

1. WHEN a review is created THEN the system SHALL set isPublic to true by default
2. WHEN an admin hides a review THEN the system SHALL set isPublic to false
3. WHEN displaying reviews THEN the system SHALL only show reviews where isPublic is true
4. WHEN a contractor views their reviews THEN the system SHALL show all reviews including hidden ones

### Requirement 5: Contractor Rating Calculation

**User Story:** As a system architect, I want to automatically calculate contractor ratings, so that ratings are always accurate.

#### Acceptance Criteria

1. WHEN a review is created THEN the system SHALL recalculate the contractor's average rating
2. WHEN a review is updated THEN the system SHALL recalculate the contractor's average rating
3. WHEN a review is deleted THEN the system SHALL recalculate the contractor's average rating
4. WHEN calculating rating THEN the system SHALL use weighted average based on recency
5. WHEN a contractor has no reviews THEN the system SHALL display rating as 0

### Requirement 6: Contractor Statistics

**User Story:** As a contractor, I want to see my performance statistics, so that I can track my progress.

#### Acceptance Criteria

1. WHEN a project is completed THEN the system SHALL increment the contractor's totalProjects count
2. WHEN displaying contractor profile THEN the system SHALL show total projects, rating, and review count
3. WHEN calculating statistics THEN the system SHALL include completion rate and average response time
4. WHEN a contractor views dashboard THEN the system SHALL show monthly statistics

### Requirement 7: Ranking Algorithm

**User Story:** As a product owner, I want contractors ranked by multiple factors, so that quality contractors are highlighted.

#### Acceptance Criteria

1. WHEN calculating ranking score THEN the system SHALL consider average rating (40% weight)
2. WHEN calculating ranking score THEN the system SHALL consider total completed projects (30% weight)
3. WHEN calculating ranking score THEN the system SHALL consider response rate (15% weight)
4. WHEN calculating ranking score THEN the system SHALL consider verification status (15% weight)
5. WHEN ranking contractors THEN the system SHALL update scores daily via scheduled job

### Requirement 8: Featured Contractors

**User Story:** As a platform operator, I want to feature top contractors, so that quality is promoted.

#### Acceptance Criteria

1. WHEN a contractor meets criteria THEN the system SHALL mark them as featured
2. WHEN displaying featured contractors THEN the system SHALL show top 10 by ranking score
3. WHEN a contractor's ranking drops THEN the system SHALL remove featured status
4. WHEN an admin manually features a contractor THEN the system SHALL override automatic selection

### Requirement 9: Review API - Homeowner

**User Story:** As a homeowner, I want API endpoints to manage my reviews, so that I can share feedback.

#### Acceptance Criteria

1. WHEN a homeowner creates a review THEN the system SHALL validate project ownership and completion
2. WHEN a homeowner updates a review THEN the system SHALL allow within 7 days of creation
3. WHEN a homeowner deletes a review THEN the system SHALL soft-delete the review
4. WHEN a homeowner lists their reviews THEN the system SHALL return all reviews they created

### Requirement 10: Review API - Contractor

**User Story:** As a contractor, I want API endpoints to view and respond to reviews, so that I can manage my reputation.

#### Acceptance Criteria

1. WHEN a contractor lists reviews THEN the system SHALL return all reviews for their projects
2. WHEN a contractor responds to a review THEN the system SHALL validate they haven't responded before
3. WHEN a contractor views statistics THEN the system SHALL return aggregated performance data
4. WHEN a contractor views ranking THEN the system SHALL return their current rank and score

### Requirement 11: Review API - Public

**User Story:** As a visitor, I want to view contractor reviews publicly, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN viewing a contractor profile THEN the system SHALL return public reviews with pagination
2. WHEN viewing reviews THEN the system SHALL include reviewer name (anonymized) and project type
3. WHEN filtering reviews THEN the system SHALL support filtering by rating and date range
4. WHEN sorting reviews THEN the system SHALL support sorting by date, rating, and helpfulness

### Requirement 12: Review API - Admin

**User Story:** As an admin, I want to manage reviews, so that I can maintain platform quality.

#### Acceptance Criteria

1. WHEN an admin lists reviews THEN the system SHALL return all reviews with filters
2. WHEN an admin hides a review THEN the system SHALL set isPublic to false
3. WHEN an admin deletes a review THEN the system SHALL permanently remove the review
4. WHEN an admin views review statistics THEN the system SHALL return platform-wide metrics

### Requirement 13: Ranking API

**User Story:** As a user, I want to view contractor rankings, so that I can find quality contractors.

#### Acceptance Criteria

1. WHEN viewing rankings THEN the system SHALL return contractors sorted by ranking score
2. WHEN filtering rankings THEN the system SHALL support filtering by region and specialty
3. WHEN viewing a contractor's rank THEN the system SHALL show their position and score breakdown
4. WHEN rankings are updated THEN the system SHALL notify contractors of significant changes

### Requirement 14: Review UI - Homeowner Portal

**User Story:** As a homeowner, I want a review interface in the portal, so that I can easily rate contractors.

#### Acceptance Criteria

1. WHEN a project is completed THEN the system SHALL prompt the homeowner to leave a review
2. WHEN creating a review THEN the system SHALL display a star rating selector and comment field
3. WHEN uploading images THEN the system SHALL show preview and allow removal
4. WHEN submitting a review THEN the system SHALL show confirmation and thank you message

### Requirement 15: Review UI - Contractor Portal

**User Story:** As a contractor, I want to view and respond to reviews in the portal, so that I can manage my reputation.

#### Acceptance Criteria

1. WHEN viewing reviews THEN the system SHALL display all reviews with rating distribution chart
2. WHEN responding to a review THEN the system SHALL show a text input with character limit
3. WHEN viewing statistics THEN the system SHALL display charts for rating trends and completion rate
4. WHEN viewing ranking THEN the system SHALL show current rank with comparison to previous period

### Requirement 16: Review UI - Public Landing

**User Story:** As a visitor, I want to see contractor reviews on the landing page, so that I can evaluate contractors.

#### Acceptance Criteria

1. WHEN viewing contractor profile THEN the system SHALL display average rating and review count
2. WHEN viewing reviews THEN the system SHALL show recent reviews with load more button
3. WHEN filtering reviews THEN the system SHALL provide rating filter buttons
4. WHEN viewing featured contractors THEN the system SHALL highlight their ratings prominently

### Requirement 17: Multi-Criteria Rating

**User Story:** As a homeowner, I want to rate contractors on multiple criteria, so that reviews are more detailed and useful.

#### Acceptance Criteria

1. WHEN creating a review THEN the system SHALL allow rating on: Chất lượng (1-5), Đúng tiến độ (1-5), Giao tiếp (1-5), Giá cả hợp lý (1-5)
2. WHEN displaying overall rating THEN the system SHALL calculate weighted average of all criteria
3. WHEN viewing contractor profile THEN the system SHALL display breakdown by each criteria
4. WHEN filtering contractors THEN the system SHALL support filtering by specific criteria scores

### Requirement 18: Review Helpfulness

**User Story:** As a visitor, I want to mark reviews as helpful, so that useful reviews are highlighted.

#### Acceptance Criteria

1. WHEN viewing a review THEN the system SHALL display "Hữu ích" button with current count
2. WHEN a user clicks helpful THEN the system SHALL increment count (max 1 vote per user per review)
3. WHEN sorting reviews THEN the system SHALL support sorting by helpfulness count
4. WHEN displaying reviews THEN the system SHALL highlight "Most Helpful" reviews at top

### Requirement 19: Review Reporting

**User Story:** As a user, I want to report inappropriate reviews, so that platform quality is maintained.

#### Acceptance Criteria

1. WHEN viewing a review THEN the system SHALL display "Báo cáo" button
2. WHEN reporting THEN the system SHALL require reason selection (spam, offensive, fake, irrelevant)
3. WHEN a review is reported THEN the system SHALL create moderation ticket for admin
4. WHEN admin reviews report THEN the system SHALL allow hide, delete, or dismiss actions

### Requirement 20: Review Reminder

**User Story:** As a platform operator, I want to remind homeowners to leave reviews, so that more feedback is collected.

#### Acceptance Criteria

1. WHEN a project is completed for 3 days without review THEN the system SHALL send first reminder
2. WHEN a project is completed for 7 days without review THEN the system SHALL send final reminder
3. WHEN sending reminder THEN the system SHALL include direct link to review form
4. WHEN homeowner has already reviewed THEN the system SHALL NOT send any reminders

### Requirement 21: Contractor Badges

**User Story:** As a contractor, I want to earn badges for achievements, so that I can showcase my expertise.

#### Acceptance Criteria

1. WHEN a contractor completes 10 projects THEN the system SHALL award "Nhà thầu Tích cực" badge
2. WHEN a contractor maintains 4.5+ rating for 6 months THEN the system SHALL award "Chất lượng Cao" badge
3. WHEN a contractor responds to 90%+ bids within 24h THEN the system SHALL award "Phản hồi Nhanh" badge
4. WHEN displaying contractor profile THEN the system SHALL show earned badges prominently

### Requirement 22: Response Time Tracking

**User Story:** As a homeowner, I want to see contractor response times, so that I can choose responsive contractors.

#### Acceptance Criteria

1. WHEN a contractor responds to a bid THEN the system SHALL record response time
2. WHEN calculating statistics THEN the system SHALL compute average response time
3. WHEN displaying contractor profile THEN the system SHALL show "Thường phản hồi trong X giờ"
4. WHEN filtering contractors THEN the system SHALL support filtering by response time
