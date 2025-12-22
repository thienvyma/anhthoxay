# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cho Phase 3 của Bidding Marketplace: Matching & Payment. Phạm vi bao gồm:

1. **Project Matching** - Chủ nhà chọn nhà thầu từ danh sách bid đã duyệt, hệ thống mở thông tin liên hệ cho đôi bên
2. **Escrow System** - Hệ thống đặt cọc từ chủ nhà để đảm bảo an toàn giao dịch, với milestone-based release
3. **Service Fee Collection** - Thu phí dịch vụ từ nhà thầu khi thắng thầu
4. **Progress Tracking** - Theo dõi tiến độ thi công với milestones
5. **Dispute Resolution** - Xử lý tranh chấp giữa các bên

Phase 3 xây dựng trên Phase 1 (Foundation) và Phase 2 (Core Bidding), hoàn thiện flow đấu giá từ lúc chủ nhà chọn thầu đến khi hoàn thành thi công.

**Lưu ý**: Chat system và Email/SMS notifications sẽ được implement trong Phase 4 (Communication).

## Glossary

- **Match**: Quá trình chủ nhà chọn một bid và hệ thống kết nối đôi bên
- **Escrow**: Tiền đặt cọc được hệ thống giữ để đảm bảo giao dịch
- **Win Fee**: Phí thắng thầu mà nhà thầu phải trả khi được chọn
- **Contact Reveal**: Quá trình mở thông tin liên hệ cho đôi bên sau khi match
- **MATCHED Status**: Project đã được chọn nhà thầu
- **SELECTED Status**: Bid được chủ nhà chọn
- **NOT_SELECTED Status**: Bid không được chọn (khi project đã match với bid khác)
- **Escrow Code**: Mã định danh duy nhất cho escrow (ESC-YYYY-NNN)
- **Milestone**: Mốc tiến độ thi công (50%, 100%)
- **Dispute**: Tranh chấp giữa homeowner và contractor cần admin xử lý

## Requirements

### Requirement 1: Bid Selection by Homeowner

**User Story:** As a homeowner, I want to select a contractor from approved bids, so that I can start my construction project with a trusted contractor.

#### Acceptance Criteria

1. WHEN a homeowner selects a bid THEN the system SHALL validate the project status is BIDDING_CLOSED
2. WHEN a homeowner selects a bid THEN the system SHALL validate the bid status is APPROVED
3. WHEN a homeowner selects a bid THEN the system SHALL validate the homeowner owns the project
4. WHEN a bid is selected THEN the system SHALL change the bid status to SELECTED
5. WHEN a bid is selected THEN the system SHALL change all other APPROVED bids on the same project to NOT_SELECTED
6. WHEN a bid is selected THEN the system SHALL change the project status to MATCHED and set matchedAt timestamp
7. WHEN a bid is selected THEN the system SHALL set the project's selectedBidId to the chosen bid

### Requirement 2: Contact Information Reveal

**User Story:** As a matched party (homeowner or contractor), I want to see the other party's contact information, so that I can communicate directly about the project.

#### Acceptance Criteria

1. WHEN a project is in MATCHED status THEN the system SHALL reveal the contractor's contact information to the homeowner
2. WHEN a project is in MATCHED status THEN the system SHALL reveal the homeowner's contact information to the contractor
3. WHEN a project is in MATCHED status THEN the system SHALL reveal the project's full address to the contractor
4. WHEN revealing contact information THEN the system SHALL include name, phone, and email
5. WHEN a project is NOT in MATCHED status THEN the system SHALL NOT reveal any contact information
6. WHEN a user requests contact information for a project they are not involved in THEN the system SHALL return 403 Forbidden

### Requirement 3: Escrow Data Model

**User Story:** As a system architect, I want an Escrow model to track deposit transactions from homeowner, so that the platform can manage financial security for both parties.

#### Acceptance Criteria

1. WHEN an escrow is created THEN the system SHALL generate a unique code in format ESC-YYYY-NNN
2. WHEN an escrow is created THEN the system SHALL associate it with a project, bid, and homeowner (payer)
3. WHEN an escrow is created THEN the system SHALL calculate the amount based on bid price and escrowPercentage from BiddingSettings
4. WHEN an escrow is created THEN the system SHALL enforce minimum amount from escrowMinAmount setting
5. WHEN an escrow is created THEN the system SHALL enforce maximum amount from escrowMaxAmount setting if configured
6. WHEN an escrow stores transactions THEN the system SHALL store them as JSON array with type, amount, date, note, and adminId
7. WHEN an escrow is created THEN the system SHALL record the homeowner as the depositor

### Requirement 4: Escrow Status Flow

**User Story:** As a product owner, I want escrow to follow a defined status workflow, so that financial transactions are controlled and auditable.

#### Acceptance Criteria

1. WHEN an escrow is created THEN the system SHALL set initial status to PENDING
2. WHEN an escrow is in PENDING status THEN the system SHALL allow transition to HELD or CANCELLED
3. WHEN an escrow is in HELD status THEN the system SHALL allow transition to PARTIAL_RELEASED, RELEASED, REFUNDED, or DISPUTED
4. WHEN an escrow is in PARTIAL_RELEASED status THEN the system SHALL allow transition to RELEASED, REFUNDED, or DISPUTED
5. WHEN an escrow reaches RELEASED, REFUNDED, or CANCELLED status THEN the system SHALL NOT allow any further transitions
6. WHEN an escrow status changes THEN the system SHALL record the transaction in the transactions array

### Requirement 5: Escrow Management API

**User Story:** As an admin, I want to manage escrow transactions, so that I can ensure financial security and resolve disputes.

#### Acceptance Criteria

1. WHEN an admin lists escrows THEN the system SHALL return all escrows with filtering by status and projectId
2. WHEN an admin views an escrow THEN the system SHALL return full escrow details including project and bid information
3. WHEN an admin confirms escrow deposit THEN the system SHALL change status from PENDING to HELD
4. WHEN an admin releases escrow THEN the system SHALL change status to RELEASED and record the transaction
5. WHEN an admin partially releases escrow THEN the system SHALL change status to PARTIAL_RELEASED and record the amount released
6. WHEN an admin refunds escrow THEN the system SHALL change status to REFUNDED and record the reason
7. WHEN an admin marks escrow as disputed THEN the system SHALL change status to DISPUTED and record the dispute reason

### Requirement 6: Win Fee Calculation

**User Story:** As a platform operator, I want to calculate and track win fees, so that the platform can generate revenue from successful matches.

#### Acceptance Criteria

1. WHEN a bid is selected THEN the system SHALL calculate the win fee based on bid price and winFeePercentage from BiddingSettings
2. WHEN calculating win fee THEN the system SHALL use the WIN_FEE service fee configuration if available
3. WHEN a win fee is calculated THEN the system SHALL store it in a FeeTransaction record
4. WHEN displaying win fee to contractor THEN the system SHALL show the calculated amount before confirmation
5. WHEN a contractor views their selected bid THEN the system SHALL display the win fee amount

### Requirement 7: Fee Transaction Model

**User Story:** As a system architect, I want a FeeTransaction model to track all platform fees, so that financial records are complete and auditable.

#### Acceptance Criteria

1. WHEN a fee transaction is created THEN the system SHALL generate a unique code in format FEE-YYYY-NNN
2. WHEN a fee transaction is created THEN the system SHALL associate it with a user (contractor)
3. WHEN a fee transaction is created THEN the system SHALL record the fee type (WIN_FEE, VERIFICATION_FEE)
4. WHEN a fee transaction is created THEN the system SHALL record the amount, related projectId, and bidId
5. WHEN a fee transaction is created THEN the system SHALL set initial status to PENDING
6. WHEN a fee transaction status changes THEN the system SHALL record the timestamp

### Requirement 8: Homeowner Match API

**User Story:** As a homeowner, I want API endpoints to select a contractor and view match details, so that I can complete the bidding process.

#### Acceptance Criteria

1. WHEN a homeowner calls select bid endpoint THEN the system SHALL validate all preconditions and perform the match
2. WHEN a homeowner views a matched project THEN the system SHALL return contractor contact information
3. WHEN a homeowner views a matched project THEN the system SHALL return escrow status and amount
4. WHEN a homeowner views a matched project THEN the system SHALL return win fee information
5. WHEN a homeowner cancels a matched project THEN the system SHALL validate project status allows cancellation

### Requirement 9: Contractor Match API

**User Story:** As a contractor, I want API endpoints to view my selected bids and project details, so that I can proceed with the construction work.

#### Acceptance Criteria

1. WHEN a contractor views their selected bid THEN the system SHALL return homeowner contact information
2. WHEN a contractor views their selected bid THEN the system SHALL return full project address
3. WHEN a contractor views their selected bid THEN the system SHALL return escrow status and amount
4. WHEN a contractor views their selected bid THEN the system SHALL return win fee amount and payment status
5. WHEN a contractor lists their bids THEN the system SHALL indicate which bids are SELECTED

### Requirement 10: Admin Match Management

**User Story:** As an admin, I want to manage matches and resolve issues, so that I can ensure smooth transactions between parties.

#### Acceptance Criteria

1. WHEN an admin lists matched projects THEN the system SHALL return projects with MATCHED status including both party details
2. WHEN an admin views a matched project THEN the system SHALL return full details of homeowner, contractor, escrow, and fees
3. WHEN an admin cancels a match THEN the system SHALL revert project status and handle escrow appropriately
4. WHEN an admin views fee transactions THEN the system SHALL return all transactions with filtering by status and type
5. WHEN an admin marks a fee as paid THEN the system SHALL update the fee transaction status to PAID

### Requirement 11: Project Status Transition for Matching

**User Story:** As a product owner, I want project status to properly transition during matching, so that the workflow is clear and controlled.

#### Acceptance Criteria

1. WHEN a project is in OPEN status and bid deadline passes THEN the system SHALL allow transition to BIDDING_CLOSED
2. WHEN a project is in OPEN status and maxBids is reached THEN the system SHALL allow transition to BIDDING_CLOSED
3. WHEN a project is in BIDDING_CLOSED status THEN the system SHALL allow homeowner to select a bid
4. WHEN a bid is selected THEN the system SHALL transition project to MATCHED status
5. WHEN a matched project is cancelled THEN the system SHALL handle escrow refund and fee cancellation
6. WHEN a matched project starts work THEN the system SHALL allow transition to IN_PROGRESS status

### Requirement 12: Admin UI - Match Management Page

**User Story:** As an admin, I want a management page for matches, so that I can efficiently oversee matched projects and resolve issues.

#### Acceptance Criteria

1. WHEN admin visits matches page THEN the system SHALL display a table with project code, homeowner, contractor, escrow status, and actions
2. WHEN admin filters matches THEN the system SHALL support filtering by escrow status and date range
3. WHEN admin clicks view THEN the system SHALL show a modal with full match details including contact info for both parties
4. WHEN admin clicks manage escrow THEN the system SHALL show options to release, partially release, or refund
5. WHEN admin performs escrow action THEN the system SHALL update the escrow and refresh the list

### Requirement 13: Admin UI - Fee Transactions Page

**User Story:** As an admin, I want a management page for fee transactions, so that I can track platform revenue and manage payments.

#### Acceptance Criteria

1. WHEN admin visits fees page THEN the system SHALL display a table with fee code, contractor, type, amount, status, and actions
2. WHEN admin filters fees THEN the system SHALL support filtering by status, type, and date range
3. WHEN admin clicks view THEN the system SHALL show a modal with full fee details including related project and bid
4. WHEN admin marks fee as paid THEN the system SHALL update the status and record payment date
5. WHEN admin exports fees THEN the system SHALL generate a CSV with all fee transactions

### Requirement 14: Notification on Match

**User Story:** As a matched party, I want to be notified when a match occurs, so that I can take appropriate action.

#### Acceptance Criteria

1. WHEN a bid is selected THEN the system SHALL create a notification for the contractor
2. WHEN a bid is selected THEN the system SHALL create a notification for the homeowner confirming the selection
3. WHEN a bid is not selected THEN the system SHALL create a notification for the contractor informing them
4. WHEN escrow status changes THEN the system SHALL create a notification for both parties
5. WHEN displaying notifications THEN the system SHALL include relevant project and bid information

### Requirement 15: Progress Milestones

**User Story:** As a homeowner, I want to track project progress with milestones, so that escrow can be released based on completion percentage.

#### Acceptance Criteria

1. WHEN a project starts THEN the system SHALL create default milestones (50% and 100%)
2. WHEN a contractor reports milestone completion THEN the system SHALL record the completion request
3. WHEN a homeowner confirms milestone completion THEN the system SHALL allow partial escrow release
4. WHEN 50% milestone is confirmed THEN the system SHALL allow release of 50% escrow amount
5. WHEN 100% milestone is confirmed THEN the system SHALL allow release of remaining escrow amount
6. WHEN a milestone is disputed THEN the system SHALL mark the escrow as DISPUTED

### Requirement 16: Dispute Resolution

**User Story:** As an admin, I want to handle disputes between homeowners and contractors, so that conflicts can be resolved fairly.

#### Acceptance Criteria

1. WHEN a homeowner or contractor raises a dispute THEN the system SHALL mark the escrow as DISPUTED
2. WHEN a dispute is raised THEN the system SHALL record the dispute reason and evidence
3. WHEN an admin reviews a dispute THEN the system SHALL show all project, bid, and escrow details
4. WHEN an admin resolves a dispute THEN the system SHALL allow refund to homeowner or release to contractor
5. WHEN a dispute is resolved THEN the system SHALL record the resolution and notify both parties
6. WHEN a dispute is resolved with refund THEN the system SHALL change escrow status to REFUNDED

### Requirement 17: Project Completion Flow

**User Story:** As a homeowner, I want to confirm project completion, so that the contractor can receive final payment and I can leave a review.

#### Acceptance Criteria

1. WHEN a homeowner confirms project completion THEN the system SHALL change project status to COMPLETED
2. WHEN a project is completed THEN the system SHALL release remaining escrow to contractor
3. WHEN a project is completed THEN the system SHALL prompt homeowner to leave a review
4. WHEN a project is completed THEN the system SHALL update contractor's totalProjects count
5. WHEN a project is completed THEN the system SHALL mark all related fee transactions as due

