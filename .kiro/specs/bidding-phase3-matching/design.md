# Design Document - Bidding Phase 3: Matching & Payment

## Overview

Phase 3 hoàn thiện flow đấu giá bằng cách cho phép chủ nhà chọn nhà thầu từ danh sách bid đã duyệt, mở thông tin liên hệ cho đôi bên, và quản lý escrow/phí dịch vụ.

### Key Features
1. **Bid Selection** - Chủ nhà chọn bid, hệ thống cập nhật trạng thái
2. **Contact Reveal** - Mở thông tin liên hệ sau khi match
3. **Escrow Management** - Quản lý tiền đặt cọc từ chủ nhà với milestone-based release
4. **Fee Collection** - Thu phí thắng thầu từ nhà thầu
5. **Progress Tracking** - Theo dõi tiến độ với milestones (50%, 100%)
6. **Dispute Resolution** - Xử lý tranh chấp giữa các bên
7. **Admin Management** - UI quản lý matches, escrows, fees và disputes

**Lưu ý**: Chat system và Email/SMS notifications sẽ được implement trong Phase 4 (Communication)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MATCHING FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  HOMEOWNER                    SYSTEM                      CONTRACTOR     │
│  ──────────                   ──────                      ──────────     │
│                                                                          │
│  1. View approved bids ──────► Filter APPROVED bids                     │
│     (anonymized)               for project                              │
│                                                                          │
│  2. Select bid ──────────────► Validate preconditions                   │
│                                │                                         │
│                                ├─► Update bid → SELECTED                │
│                                ├─► Update other bids → NOT_SELECTED     │
│                                ├─► Update project → MATCHED             │
│                                ├─► Create Escrow (PENDING)              │
│                                ├─► Create FeeTransaction (PENDING)      │
│                                └─► Send notifications ──────► Receive   │
│                                                                          │
│  3. View match details ◄─────── Reveal contact info ────────► View      │
│     (contractor info)           (both parties)               (homeowner │
│                                                               + address)│
│                                                                          │
│  ═══════════════════════ ADMIN ACTIONS ═══════════════════════════════  │
│                                                                          │
│  4. Admin confirms ──────────► Escrow → HELD                            │
│     escrow deposit                                                       │
│                                                                          │
│  5. Admin marks fee ─────────► FeeTransaction → PAID                    │
│     as paid                                                              │
│                                                                          │
│  ═══════════════════════ PROJECT PROGRESS ════════════════════════════  │
│                                                                          │
│  6. Start work ──────────────► Project → IN_PROGRESS                    │
│                                                                          │
│  7. Complete work ───────────► Project → COMPLETED                      │
│                                Escrow → RELEASED                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Match Service (`api/src/services/match.service.ts`)

```typescript
interface MatchService {
  // Bid Selection
  selectBid(projectId: string, bidId: string, homeownerId: string): Promise<MatchResult>;
  
  // Contact Reveal
  getMatchDetails(projectId: string, userId: string): Promise<MatchDetails>;
  getContactInfo(projectId: string, userId: string): Promise<ContactInfo>;
  
  // Project Status
  startProject(projectId: string, homeownerId: string): Promise<Project>;
  completeProject(projectId: string, homeownerId: string): Promise<Project>;
  cancelMatch(projectId: string, userId: string, reason: string): Promise<Project>;
}

interface MatchResult {
  project: Project;
  selectedBid: Bid;
  escrow: Escrow;
  feeTransaction: FeeTransaction;
}

interface MatchDetails {
  project: Project;
  bid: Bid;
  contractor?: ContactInfo;  // For homeowner
  homeowner?: ContactInfo;   // For contractor
  escrow: EscrowSummary;
  fee: FeeSummary;
}

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  address?: string;  // Only for contractor viewing project
}
```

### 2. Escrow Service (`api/src/services/escrow.service.ts`)

```typescript
interface EscrowService {
  // CRUD
  create(projectId: string, bidId: string): Promise<Escrow>;
  getById(id: string): Promise<Escrow>;
  getByProject(projectId: string): Promise<Escrow | null>;
  list(query: EscrowQuery): Promise<PaginatedResult<Escrow>>;
  
  // Status Transitions
  confirmDeposit(id: string, adminId: string): Promise<Escrow>;
  release(id: string, adminId: string, note?: string): Promise<Escrow>;
  partialRelease(id: string, amount: number, adminId: string, note?: string): Promise<Escrow>;
  refund(id: string, adminId: string, reason: string): Promise<Escrow>;
  markDisputed(id: string, adminId: string, reason: string): Promise<Escrow>;
  
  // Calculations
  calculateAmount(bidPrice: number): Promise<EscrowAmount>;
}

interface EscrowAmount {
  amount: number;
  percentage: number;
  minApplied: boolean;
  maxApplied: boolean;
}
```

### 3. Fee Service (`api/src/services/fee.service.ts`)

```typescript
interface FeeService {
  // CRUD
  create(type: FeeType, userId: string, amount: number, projectId: string, bidId: string): Promise<FeeTransaction>;
  getById(id: string): Promise<FeeTransaction>;
  list(query: FeeQuery): Promise<PaginatedResult<FeeTransaction>>;
  
  // Status
  markPaid(id: string, adminId: string): Promise<FeeTransaction>;
  cancel(id: string, adminId: string, reason: string): Promise<FeeTransaction>;
  
  // Calculations
  calculateWinFee(bidPrice: number): Promise<number>;
}

type FeeType = 'WIN_FEE' | 'VERIFICATION_FEE';
```

### 4. API Routes

#### Homeowner Routes (`/api/homeowner/projects`)
```
POST /:id/select-bid     - Select a bid (body: { bidId })
POST /:id/start          - Start project (transition to IN_PROGRESS)
POST /:id/complete       - Complete project
POST /:id/cancel         - Cancel matched project
GET  /:id/match          - Get match details with contractor info
```

#### Contractor Routes (`/api/contractor/bids`)
```
GET  /:id/match          - Get match details with homeowner info
```

#### Admin Routes
```
# Match Management
GET  /api/admin/matches              - List matched projects
GET  /api/admin/matches/:projectId   - Get match details

# Escrow Management
GET  /api/admin/escrows              - List escrows
GET  /api/admin/escrows/:id          - Get escrow details
PUT  /api/admin/escrows/:id/confirm  - Confirm deposit (PENDING → HELD)
PUT  /api/admin/escrows/:id/release  - Release escrow
PUT  /api/admin/escrows/:id/partial  - Partial release
PUT  /api/admin/escrows/:id/refund   - Refund escrow
PUT  /api/admin/escrows/:id/dispute  - Mark as disputed

# Fee Management
GET  /api/admin/fees                 - List fee transactions
GET  /api/admin/fees/:id             - Get fee details
PUT  /api/admin/fees/:id/paid        - Mark as paid
PUT  /api/admin/fees/:id/cancel      - Cancel fee
GET  /api/admin/fees/export          - Export CSV
```

## Data Models

### Escrow Model (New)

```prisma
model Escrow {
  id          String   @id @default(cuid())
  code        String   @unique // AUTO: ESC-YYYY-NNN
  
  // Relations
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id])
  bidId       String
  bid         Bid      @relation(fields: [bidId], references: [id])
  homeownerId String   // Người đặt cọc (chủ nhà)
  homeowner   User     @relation("EscrowDepositor", fields: [homeownerId], references: [id])
  
  // Amount
  amount        Float    // Calculated escrow amount
  releasedAmount Float   @default(0) // Số tiền đã giải phóng
  currency      String   @default("VND")
  
  // Status: PENDING, HELD, PARTIAL_RELEASED, RELEASED, REFUNDED, DISPUTED, CANCELLED
  status      String   @default("PENDING")
  
  // Transactions log
  transactions String? // JSON: [{type, amount, date, note, adminId}]
  
  // Milestones
  milestones   ProjectMilestone[]
  
  // Dispute
  disputeReason     String?
  disputedBy        String?  // User who raised dispute
  disputeResolvedAt DateTime?
  disputeResolution String?  // Resolution note
  
  // Admin tracking
  confirmedBy   String?
  confirmedAt   DateTime?
  releasedBy    String?
  releasedAt    DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status])
  @@index([projectId])
  @@index([homeownerId])
}
```

### ProjectMilestone Model (New)

```prisma
model ProjectMilestone {
  id          String   @id @default(cuid())
  
  // Relations
  escrowId    String
  escrow      Escrow   @relation(fields: [escrowId], references: [id])
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  
  // Milestone details
  name        String   // "50% Completion", "100% Completion"
  percentage  Int      // 50, 100
  releasePercentage Int // % of escrow to release at this milestone
  
  // Status: PENDING, REQUESTED, CONFIRMED, DISPUTED
  status      String   @default("PENDING")
  
  // Tracking
  requestedAt   DateTime?  // Contractor requests completion
  requestedBy   String?
  confirmedAt   DateTime?  // Homeowner confirms
  confirmedBy   String?
  disputedAt    DateTime?
  disputeReason String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([escrowId])
  @@index([projectId])
  @@index([status])
}
```

### FeeTransaction Model (New)

```prisma
model FeeTransaction {
  id          String   @id @default(cuid())
  code        String   @unique // AUTO: FEE-YYYY-NNN
  
  // Relations
  userId      String   // Contractor who pays
  user        User     @relation(fields: [userId], references: [id])
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  bidId       String
  bid         Bid      @relation(fields: [bidId], references: [id])
  
  // Fee details
  type        String   // WIN_FEE, VERIFICATION_FEE
  amount      Float
  currency    String   @default("VND")
  
  // Status: PENDING, PAID, CANCELLED
  status      String   @default("PENDING")
  
  // Payment tracking
  paidAt      DateTime?
  paidBy      String?  // Admin who marked as paid
  cancelledAt DateTime?
  cancelledBy String?
  cancelReason String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status])
  @@index([userId])
  @@index([type])
}
```

### Notification Model (New)

```prisma
model Notification {
  id          String   @id @default(cuid())
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  type        String   // BID_SELECTED, BID_NOT_SELECTED, ESCROW_HELD, ESCROW_RELEASED, etc.
  title       String
  content     String
  data        String?  // JSON: { projectId, bidId, etc. }
  
  isRead      Boolean  @default(false)
  readAt      DateTime?
  
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([isRead])
  @@index([type])
}
```

### Updated Relations

```prisma
// Add to User model
model User {
  // ... existing fields
  feeTransactions  FeeTransaction[]
  notifications    Notification[]
}

// Add to Project model
model Project {
  // ... existing fields
  escrow           Escrow?
  feeTransactions  FeeTransaction[]
}

// Add to Bid model
model Bid {
  // ... existing fields
  escrow           Escrow?
  feeTransactions  FeeTransaction[]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Bid Selection Preconditions
*For any* bid selection attempt, the system should only allow selection when:
- Project status is BIDDING_CLOSED
- Bid status is APPROVED
- User is the project owner

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Bid Selection State Transitions
*For any* successful bid selection:
- The selected bid status changes to SELECTED
- All other APPROVED bids on the same project change to NOT_SELECTED
- Project status changes to MATCHED
- Project's selectedBidId is set to the chosen bid
- Project's matchedAt timestamp is set

**Validates: Requirements 1.4, 1.5, 1.6, 1.7**

### Property 3: Contact Information Reveal
*For any* project and user:
- If project status is MATCHED and user is the homeowner, contractor contact info is revealed
- If project status is MATCHED and user is the selected contractor, homeowner contact info and full address are revealed
- If project status is NOT MATCHED, no contact info is revealed
- If user is not involved in the project, 403 is returned

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

### Property 4: Escrow Code Uniqueness
*For any* set of escrows, all escrow codes are unique and follow the format ESC-YYYY-NNN

**Validates: Requirements 3.1**

### Property 5: Escrow Amount Calculation
*For any* escrow creation with bid price P:
- Amount = max(P * escrowPercentage / 100, escrowMinAmount)
- If escrowMaxAmount is set, Amount = min(Amount, escrowMaxAmount)

**Validates: Requirements 3.3, 3.4, 3.5**

### Property 6: Escrow Status Transition Validity
*For any* escrow status transition:
- PENDING can only transition to HELD or CANCELLED
- HELD can only transition to PARTIAL_RELEASED, RELEASED, REFUNDED, or DISPUTED
- PARTIAL_RELEASED can only transition to RELEASED, REFUNDED, or DISPUTED
- RELEASED, REFUNDED, CANCELLED are terminal states (no further transitions)
- Every transition is recorded in the transactions array

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**

### Property 7: Win Fee Calculation
*For any* bid selection with bid price P:
- Win fee = P * winFeePercentage / 100
- A FeeTransaction record is created with type WIN_FEE
- The fee amount is included in contractor's bid view

**Validates: Requirements 6.1, 6.2, 6.3, 6.5**

### Property 8: Fee Transaction Creation
*For any* fee transaction:
- Code is unique and follows format FEE-YYYY-NNN
- Associated with a valid user, project, and bid
- Type is one of WIN_FEE or VERIFICATION_FEE
- Initial status is PENDING
- Status changes record timestamps

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

### Property 9: Project Status Transition for Matching
*For any* project:
- OPEN → BIDDING_CLOSED when deadline passes or maxBids reached
- BIDDING_CLOSED allows bid selection
- Bid selection → MATCHED
- MATCHED → IN_PROGRESS when work starts
- MATCHED cancellation handles escrow refund and fee cancellation

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

### Property 10: Match Notification Creation
*For any* bid selection:
- Selected contractor receives BID_SELECTED notification
- Homeowner receives selection confirmation notification
- Non-selected contractors receive BID_NOT_SELECTED notification
- Escrow status changes trigger notifications to both parties
- All notifications include relevant project and bid information

**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

## Error Handling

### Match Errors
```typescript
class MatchError extends Error {
  constructor(
    public code: MatchErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

type MatchErrorCode =
  | 'PROJECT_NOT_FOUND'
  | 'BID_NOT_FOUND'
  | 'INVALID_PROJECT_STATUS'
  | 'INVALID_BID_STATUS'
  | 'NOT_PROJECT_OWNER'
  | 'ALREADY_MATCHED'
  | 'ESCROW_NOT_FOUND'
  | 'INVALID_ESCROW_STATUS'
  | 'FEE_NOT_FOUND'
  | 'INVALID_FEE_STATUS';
```

### HTTP Error Responses
| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| PROJECT_NOT_FOUND | 404 | Project không tồn tại |
| BID_NOT_FOUND | 404 | Bid không tồn tại |
| INVALID_PROJECT_STATUS | 400 | Project không ở trạng thái cho phép |
| INVALID_BID_STATUS | 400 | Bid không ở trạng thái APPROVED |
| NOT_PROJECT_OWNER | 403 | User không phải chủ project |
| ALREADY_MATCHED | 400 | Project đã được match |
| INVALID_ESCROW_STATUS | 400 | Escrow không ở trạng thái cho phép |

## Testing Strategy

### Property-Based Testing Library
- **Library**: fast-check
- **Minimum iterations**: 100 per property test

### Unit Tests
- Match service methods
- Escrow calculations
- Fee calculations
- Status transitions
- Access control

### Property-Based Tests
Each correctness property will be implemented as a property-based test:

1. **Property 1**: Generate random projects/bids with various statuses, verify selection preconditions
2. **Property 2**: Generate valid selections, verify all state transitions occur correctly
3. **Property 3**: Generate matched/unmatched projects, verify contact reveal rules
4. **Property 4**: Generate multiple escrows, verify code uniqueness
5. **Property 5**: Generate random bid prices and settings, verify amount calculation
6. **Property 6**: Generate escrow state machines, verify valid transitions only
7. **Property 7**: Generate bid selections, verify fee calculation
8. **Property 8**: Generate fee transactions, verify creation rules
9. **Property 9**: Generate project state machines, verify matching transitions
10. **Property 10**: Generate bid selections, verify notification creation

### Test File Structure
```
api/src/services/
├── match.service.ts
├── match.service.property.test.ts
├── escrow.service.ts
├── escrow.service.property.test.ts
├── fee.service.ts
└── fee.service.property.test.ts
```

### Test Annotations
Each property-based test must include:
```typescript
/**
 * **Feature: bidding-phase3-matching, Property 1: Bid Selection Preconditions**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */
```

