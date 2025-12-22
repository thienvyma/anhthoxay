# Requirements Document

## Introduction

This document specifies the requirements for Phase 2 of the Bidding Marketplace: Core Bidding System. The scope includes:

1. **Project Management** - Homeowners can create and submit construction projects for bidding
2. **Bidding System** - Verified contractors can view open projects and submit bids
3. **Bid Approval** - Admin reviews and approves/rejects bids before showing to homeowners
4. **Admin UI** - Management pages for projects and bids

Phase 2 builds on Phase 1 Foundation (User roles, ContractorProfile, Region, BiddingSettings) and enables the core bidding workflow.

## Glossary

- **Project**: A construction job posted by a homeowner seeking contractor bids
- **Bid**: A contractor's proposal to complete a project, including price and timeline
- **Homeowner**: User with role HOMEOWNER who posts projects
- **Contractor**: User with role CONTRACTOR who submits bids (must be VERIFIED)
- **Project Code**: Auto-generated unique identifier (PRJ-YYYY-NNN)
- **Bid Code**: Auto-generated unique identifier (BID-YYYY-NNN)
- **OPEN Status**: Project is accepting bids from contractors
- **APPROVED Status**: Bid has been reviewed and approved by admin

## Requirements

### Requirement 1: Project Data Model

**User Story:** As a system architect, I want a Project model to store construction job details, so that homeowners can post projects and contractors can bid on them.

#### Acceptance Criteria

1. WHEN a project is created THEN the system SHALL generate a unique code in format PRJ-YYYY-NNN
2. WHEN a project is created THEN the system SHALL associate it with the owner (HOMEOWNER user)
3. WHEN a project is created THEN the system SHALL require title, description, categoryId, regionId, and address fields
4. WHEN a project is created THEN the system SHALL set initial status to DRAFT
5. WHEN a project stores images THEN the system SHALL store them as JSON array of URLs (max 10)
6. WHEN a project is linked to a region THEN the system SHALL validate the region exists and is active
7. WHEN a project has budget THEN the system SHALL support budget range (budgetMin, budgetMax)
8. WHEN a project has requirements THEN the system SHALL store special requirements as text

### Requirement 2: Project Status Flow

**User Story:** As a product owner, I want projects to follow a defined status workflow, so that the bidding process is controlled and transparent.

#### Acceptance Criteria

1. WHEN a project is in DRAFT status THEN the system SHALL allow transition to PENDING_APPROVAL or CANCELLED
2. WHEN a project is in PENDING_APPROVAL status THEN the system SHALL allow transition to OPEN or REJECTED
3. WHEN a project is in REJECTED status THEN the system SHALL allow transition to PENDING_APPROVAL (resubmit) or CANCELLED
4. WHEN a project is in OPEN status THEN the system SHALL allow transition to BIDDING_CLOSED or CANCELLED
5. WHEN a project is in BIDDING_CLOSED status THEN the system SHALL allow transition to MATCHED, OPEN (reopen), or CANCELLED
6. WHEN a project reaches COMPLETED or CANCELLED status THEN the system SHALL NOT allow any further transitions

### Requirement 3: Homeowner Project API

**User Story:** As a homeowner, I want to create and manage my construction projects, so that I can receive bids from contractors.

#### Acceptance Criteria

1. WHEN a homeowner creates a project THEN the system SHALL save it with DRAFT status and return the project with generated code
2. WHEN a homeowner updates a project THEN the system SHALL only allow updates if status is DRAFT or REJECTED
3. WHEN a homeowner submits a project for approval THEN the system SHALL change status from DRAFT to PENDING_APPROVAL and set bidDeadline
4. WHEN a homeowner sets bidDeadline THEN the system SHALL validate it is within minBidDuration and maxBidDuration from BiddingSettings
5. WHEN a homeowner deletes a project THEN the system SHALL only allow deletion if status is DRAFT
6. WHEN a homeowner lists their projects THEN the system SHALL return only projects owned by that user
7. WHEN a homeowner views project detail THEN the system SHALL return full project information including bids count

### Requirement 4: Admin Project Management

**User Story:** As an admin, I want to review and approve/reject projects, so that only valid projects are published on the marketplace.

#### Acceptance Criteria

1. WHEN an admin lists projects THEN the system SHALL return all projects with filtering by status, region, and category
2. WHEN an admin views a project THEN the system SHALL return full project details including owner information
3. WHEN an admin approves a project THEN the system SHALL change status from PENDING_APPROVAL to OPEN and set publishedAt
4. WHEN an admin rejects a project THEN the system SHALL change status to REJECTED and store the rejection note
5. WHEN an admin approves a project THEN the system SHALL validate bidDeadline is in the future

### Requirement 5: Public Project Listing

**User Story:** As a contractor, I want to browse open projects on the marketplace, so that I can find suitable jobs to bid on.

#### Acceptance Criteria

1. WHEN fetching public project list THEN the system SHALL return only projects with OPEN status
2. WHEN displaying public project THEN the system SHALL hide sensitive information (address, owner contact details)
3. WHEN displaying public project THEN the system SHALL show region name, category, area, budget range, deadline, bid count, and lowest bid price
4. WHEN filtering public projects THEN the system SHALL support filtering by region and category
5. WHEN a project deadline has passed THEN the system SHALL NOT include it in public listing
6. WHEN sorting public projects THEN the system SHALL support sorting by deadline, bid count, and created date

### Requirement 6: Bid Data Model

**User Story:** As a system architect, I want a Bid model to store contractor proposals, so that contractors can submit bids and homeowners can compare them.

#### Acceptance Criteria

1. WHEN a bid is created THEN the system SHALL generate a unique code in format BID-YYYY-NNN
2. WHEN a bid is created THEN the system SHALL associate it with the project and contractor
3. WHEN a bid is created THEN the system SHALL require price, timeline, and proposal fields
4. WHEN a bid stores attachments THEN the system SHALL store them as JSON array (max 5 files)
5. WHEN a bid is created THEN the system SHALL enforce unique constraint on projectId + contractorId
6. WHEN a bid is created THEN the system SHALL set initial status to PENDING

### Requirement 7: Contractor Bid API

**User Story:** As a verified contractor, I want to submit bids on open projects, so that I can win construction jobs.

#### Acceptance Criteria

1. WHEN a contractor creates a bid THEN the system SHALL validate contractor has VERIFIED status
2. WHEN a contractor creates a bid THEN the system SHALL validate project status is OPEN
3. WHEN a contractor creates a bid THEN the system SHALL validate project deadline has not passed
4. WHEN a contractor creates a bid THEN the system SHALL validate project has not reached maxBids limit
5. WHEN a contractor creates a bid THEN the system SHALL validate contractor has not already bid on this project
6. WHEN a contractor updates a bid THEN the system SHALL only allow updates if bid status is PENDING
7. WHEN a contractor withdraws a bid THEN the system SHALL change status to WITHDRAWN if current status is PENDING or APPROVED

### Requirement 8: Admin Bid Management

**User Story:** As an admin, I want to review and approve/reject bids, so that only valid bids are shown to homeowners.

#### Acceptance Criteria

1. WHEN an admin lists bids THEN the system SHALL return all bids with filtering by status and projectId
2. WHEN an admin views a bid THEN the system SHALL return full bid details including contractor profile and rating
3. WHEN an admin approves a bid THEN the system SHALL change status from PENDING to APPROVED
4. WHEN an admin rejects a bid THEN the system SHALL change status to REJECTED and store the rejection note
5. WHEN an admin approves a bid THEN the system SHALL validate the associated project is still OPEN

### Requirement 9: Homeowner View Bids

**User Story:** As a homeowner, I want to view approved bids on my projects, so that I can compare contractors and choose the best one.

#### Acceptance Criteria

1. WHEN a homeowner views bids on their project THEN the system SHALL return only bids with APPROVED status
2. WHEN displaying bids to homeowner THEN the system SHALL hide contractor contact information (name, phone, email)
3. WHEN displaying bids to homeowner THEN the system SHALL show contractor rating, totalProjects, and anonymous identifier (Nhà thầu A, B, C)
4. WHEN displaying bids to homeowner THEN the system SHALL show price, timeline, and proposal
5. WHEN sorting bids THEN the system SHALL support sorting by price, rating, and totalProjects

### Requirement 10: Admin UI - Projects Page

**User Story:** As an admin, I want a management page for projects, so that I can efficiently review and approve/reject projects.

#### Acceptance Criteria

1. WHEN admin visits projects page THEN the system SHALL display a table with project code, title, owner, region, status, and actions
2. WHEN admin filters projects THEN the system SHALL support filtering by status, region, and category
3. WHEN admin searches projects THEN the system SHALL support searching by code and title
4. WHEN admin clicks view THEN the system SHALL show a modal with full project details
5. WHEN admin clicks approve/reject THEN the system SHALL show a confirmation modal with optional note field
6. WHEN admin approves/rejects THEN the system SHALL update the project and refresh the list

### Requirement 11: Admin UI - Bids Page

**User Story:** As an admin, I want a management page for bids, so that I can efficiently review and approve/reject bids.

#### Acceptance Criteria

1. WHEN admin visits bids page THEN the system SHALL display a table with bid code, project, contractor, price, status, and actions
2. WHEN admin filters bids THEN the system SHALL support filtering by status and project
3. WHEN admin searches bids THEN the system SHALL support searching by code
4. WHEN admin clicks view THEN the system SHALL show a modal with full bid details including contractor profile
5. WHEN admin clicks approve/reject THEN the system SHALL show a confirmation modal with optional note field
6. WHEN admin approves/rejects THEN the system SHALL update the bid and refresh the list

### Requirement 12: Information Security

**User Story:** As a security engineer, I want sensitive information to be hidden until appropriate, so that user privacy is protected.

#### Acceptance Criteria

1. WHEN displaying project to public THEN the system SHALL hide the specific address (show only region)
2. WHEN displaying project to public THEN the system SHALL hide owner contact information
3. WHEN displaying bid to homeowner THEN the system SHALL hide contractor contact information
4. WHEN a user requests data they don't own THEN the system SHALL return 403 Forbidden
5. WHEN a contractor without VERIFIED status attempts to bid THEN the system SHALL return 403 Forbidden
