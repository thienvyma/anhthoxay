# Design Document: Bidding Phase 2 - Core Bidding System

## Overview

This document details the technical design for implementing the core bidding system, including Project management, Bid submission, and Admin approval workflows. The design follows existing project patterns and conventions.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Admin Panel          │  Landing (Public)    │  Portal (Future) │
│  - ProjectsPage       │  - Project listing   │  - Homeowner UI  │
│  - BidsPage           │                      │  - Contractor UI │
├─────────────────────────────────────────────────────────────────┤
│                        API Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│  project.routes.ts                │  bid.routes.ts              │
│  - /api/projects (public)         │  - /api/contractor/bids     │
│  - /api/homeowner/projects        │  - /api/admin/bids          │
│  - /api/admin/projects            │                             │
├─────────────────────────────────────────────────────────────────┤
│                      Service Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  project.service.ts               │  bid.service.ts             │
│  - CRUD operations                │  - CRUD operations          │
│  - Status transitions             │  - Validation rules         │
│  - Access control                 │  - Access control           │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│  Prisma Models: Project, Bid                                     │
│  Relations: User, ServiceCategory, Region                        │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Project Service

**File:** `api/src/services/project.service.ts`

```typescript
class ProjectService {
  // Homeowner operations
  create(ownerId: string, data: CreateProjectInput): Promise<Project>;
  update(id: string, ownerId: string, data: UpdateProjectInput): Promise<Project>;
  submit(id: string, ownerId: string, bidDeadline: Date): Promise<Project>;
  delete(id: string, ownerId: string): Promise<void>;
  getByOwner(ownerId: string, query: ProjectQuery): Promise<Project[]>;
  getByIdForOwner(id: string, ownerId: string): Promise<Project | null>;
  
  // Public operations
  getPublicList(query: PublicProjectQuery): Promise<PublicProject[]>;
  getPublicById(id: string): Promise<PublicProject | null>;
  
  // Admin operations
  getAdminList(query: AdminProjectQuery): Promise<Project[]>;
  getAdminById(id: string): Promise<Project | null>;
  approve(id: string, adminId: string, note?: string): Promise<Project>;
  reject(id: string, adminId: string, note: string): Promise<Project>;
}
```

### 2. Bid Service

**File:** `api/src/services/bid.service.ts`

```typescript
class BidService {
  // Contractor operations
  create(contractorId: string, data: CreateBidInput): Promise<Bid>;
  update(id: string, contractorId: string, data: UpdateBidInput): Promise<Bid>;
  withdraw(id: string, contractorId: string): Promise<Bid>;
  getByContractor(contractorId: string, query: BidQuery): Promise<Bid[]>;
  getByIdForContractor(id: string, contractorId: string): Promise<Bid | null>;
  
  // Homeowner operations (view approved bids)
  getApprovedByProject(projectId: string, ownerId: string): Promise<AnonymousBid[]>;
  
  // Admin operations
  getAdminList(query: AdminBidQuery): Promise<Bid[]>;
  getAdminById(id: string): Promise<Bid | null>;
  approve(id: string, adminId: string, note?: string): Promise<Bid>;
  reject(id: string, adminId: string, note: string): Promise<Bid>;
}
```

### 3. Code Generator Utility

**File:** `api/src/utils/code-generator.ts`

```typescript
async function generateProjectCode(prisma: PrismaClient): Promise<string>;
async function generateBidCode(prisma: PrismaClient): Promise<string>;
```

## Data Models

### Project Model

```prisma
model Project {
  id          String   @id @default(cuid())
  code        String   @unique // AUTO: PRJ-2024-001
  
  // Owner relation
  ownerId     String
  owner       User     @relation("ProjectOwner", fields: [ownerId], references: [id])
  
  // Basic info
  title       String
  description String   @db.Text
  categoryId  String
  category    ServiceCategory @relation(fields: [categoryId], references: [id])
  
  // Location
  regionId    String
  region      Region   @relation(fields: [regionId], references: [id])
  address     String   // Hidden until match
  
  // Details
  area        Float?            // Diện tích (m²)
  budgetMin   Float?            // Ngân sách tối thiểu
  budgetMax   Float?            // Ngân sách tối đa
  timeline    String?           // Timeline mong muốn (e.g., "2 tuần", "1 tháng")
  images      String?  @db.Text // JSON array of URLs (max 10)
  requirements String? @db.Text // Yêu cầu đặc biệt
  
  // Status: DRAFT, PENDING_APPROVAL, REJECTED, OPEN, BIDDING_CLOSED, MATCHED, IN_PROGRESS, COMPLETED, CANCELLED
  status      String   @default("DRAFT")
  
  // Admin review
  reviewedBy    String?
  reviewedAt    DateTime?
  reviewNote    String?
  
  // Bidding
  bidDeadline   DateTime?
  maxBids       Int       @default(20)
  
  // Match (Phase 3)
  selectedBidId String?   @unique
  selectedBid   Bid?      @relation("SelectedBid", fields: [selectedBidId], references: [id])
  matchedAt     DateTime?
  
  // Relations
  bids          Bid[]     @relation("ProjectBids")
  
  // Timestamps
  publishedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([status])
  @@index([ownerId])
  @@index([regionId])
  @@index([categoryId])
}
```

### Bid Model

```prisma
model Bid {
  id          String   @id @default(cuid())
  code        String   @unique // AUTO: BID-2024-001
  
  // Relations
  projectId   String
  project     Project  @relation("ProjectBids", fields: [projectId], references: [id])
  contractorId String
  contractor  User     @relation("ContractorBids", fields: [contractorId], references: [id])
  
  // Bid details
  price       Float              // Giá đề xuất
  timeline    String             // Timeline đề xuất (e.g., "10 ngày", "2 tuần")
  proposal    String   @db.Text  // Mô tả đề xuất chi tiết
  attachments String?  @db.Text  // JSON array: [{name, url, type, size}] (max 5 files)
  
  // Status: PENDING, APPROVED, REJECTED, SELECTED, NOT_SELECTED, WITHDRAWN
  status      String   @default("PENDING")
  
  // Admin review
  reviewedBy  String?
  reviewedAt  DateTime?
  reviewNote  String?
  
  // Selected (Phase 3)
  selectedProject Project? @relation("SelectedBid")
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([projectId, contractorId])
  @@index([projectId])
  @@index([contractorId])
  @@index([status])
}
```

### User Model Updates

```prisma
model User {
  // ... existing fields ...
  
  // New relations
  ownedProjects     Project[] @relation("ProjectOwner")
  contractorBids    Bid[]     @relation("ContractorBids")
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Project Properties

**Property 1: Project code uniqueness**
*For any* two projects in the system, their code values SHALL be different.
**Validates: Requirements 1.1**

**Property 2: Project status transition validity**
*For any* project status change, the new status SHALL be a valid transition from the current status according to the defined state machine.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

**Property 3: Project owner access control**
*For any* project update or delete operation by a homeowner, the operation SHALL only succeed if the homeowner is the project owner.
**Validates: Requirements 3.2, 3.4, 3.5**

**Property 4: Public project information hiding**
*For any* public project listing response, the response SHALL NOT contain address or owner contact information.
**Validates: Requirements 5.2, 12.1, 12.2**

### Bid Properties

**Property 5: Bid code uniqueness**
*For any* two bids in the system, their code values SHALL be different.
**Validates: Requirements 6.1**

**Property 6: Bid contractor uniqueness per project**
*For any* project, a contractor SHALL have at most one bid.
**Validates: Requirements 6.5, 7.5**

**Property 7: Bid creation validation**
*For any* bid creation attempt, the system SHALL reject if contractor is not VERIFIED, project is not OPEN, deadline has passed, or maxBids reached.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

**Property 8: Homeowner bid view anonymization**
*For any* bid displayed to a homeowner, the response SHALL NOT contain contractor name, phone, or email.
**Validates: Requirements 9.2, 12.3**

## Error Handling

### Project Errors

| Error Code | Cause | HTTP Status |
|------------|-------|-------------|
| `PROJECT_NOT_FOUND` | Project ID does not exist | 404 |
| `PROJECT_ACCESS_DENIED` | User is not the owner | 403 |
| `PROJECT_INVALID_STATUS` | Operation not allowed for current status | 400 |
| `PROJECT_INVALID_TRANSITION` | Status transition not allowed | 400 |
| `PROJECT_DEADLINE_PAST` | Bid deadline is in the past | 400 |
| `PROJECT_DEADLINE_TOO_SHORT` | Bid deadline less than minBidDuration | 400 |
| `PROJECT_DEADLINE_TOO_LONG` | Bid deadline exceeds maxBidDuration | 400 |
| `CATEGORY_NOT_FOUND` | Category ID does not exist | 400 |
| `REGION_NOT_FOUND` | Region ID does not exist | 400 |
| `REGION_NOT_ACTIVE` | Region is not active | 400 |

### Bid Errors

| Error Code | Cause | HTTP Status |
|------------|-------|-------------|
| `BID_NOT_FOUND` | Bid ID does not exist | 404 |
| `BID_ACCESS_DENIED` | User is not the contractor | 403 |
| `BID_INVALID_STATUS` | Operation not allowed for current status | 400 |
| `BID_ALREADY_EXISTS` | Contractor already bid on this project | 409 |
| `BID_PROJECT_NOT_OPEN` | Project is not accepting bids | 400 |
| `BID_DEADLINE_PASSED` | Project bid deadline has passed | 400 |
| `BID_MAX_REACHED` | Project has reached maximum bids | 400 |
| `CONTRACTOR_NOT_VERIFIED` | Contractor verification status is not VERIFIED | 403 |

## Testing Strategy

### Property-Based Testing (fast-check)

1. **Code generation uniqueness** - Generate multiple codes, verify all unique
2. **Status transitions** - Generate random transitions, verify only valid ones succeed
3. **Access control** - Generate random user/project pairs, verify correct access
4. **Information hiding** - Generate public responses, verify no sensitive data

### Unit Tests

1. **ProjectService**
   - CRUD operations
   - Status transitions
   - Validation rules

2. **BidService**
   - CRUD operations
   - Contractor validation
   - Project state validation

3. **Code Generator**
   - Format validation
   - Sequence incrementing

### Integration Tests

1. **Project workflow**
   - Create → Submit → Approve → Open
   - Create → Submit → Reject → Resubmit

2. **Bid workflow**
   - View project → Create bid → Admin approve
   - Homeowner view approved bids

## File Structure

```
api/src/
├── schemas/
│   ├── project.schema.ts        # Project validation schemas
│   └── bid.schema.ts            # Bid validation schemas
├── services/
│   ├── project.service.ts       # Project business logic
│   └── bid.service.ts           # Bid business logic
├── routes/
│   ├── project.routes.ts        # Project REST endpoints
│   └── bid.routes.ts            # Bid REST endpoints
└── utils/
    └── code-generator.ts        # PRJ/BID code generation

admin/src/app/
├── pages/
│   ├── ProjectsPage/
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   ├── ProjectTable.tsx
│   │   ├── ProjectDetailModal.tsx
│   │   └── ApprovalModal.tsx
│   └── BidsPage/
│       ├── index.tsx
│       ├── types.ts
│       ├── BidTable.tsx
│       ├── BidDetailModal.tsx
│       └── ApprovalModal.tsx
├── api.ts                       # Add projectsApi, bidsApi
└── types.ts                     # Add Project, Bid types
```

## API Endpoints Summary

## Response Types

### PublicProject (for contractors/public)
```typescript
interface PublicProject {
  id: string;
  code: string;
  title: string;
  description: string;
  category: { id: string; name: string };
  region: { id: string; name: string };
  // address is HIDDEN
  area: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  timeline: string | null;
  images: string[];
  requirements: string | null;
  status: string;
  bidDeadline: string;
  bidCount: number;
  lowestBidPrice: number | null;  // Giá thấp nhất từ approved bids
  createdAt: string;
  publishedAt: string;
}
```

### AnonymousBid (for homeowner viewing bids)
```typescript
interface AnonymousBid {
  id: string;
  code: string;
  // contractor name, phone, email are HIDDEN
  anonymousName: string;  // "Nhà thầu A", "Nhà thầu B", etc.
  contractorRating: number;
  contractorTotalProjects: number;
  price: number;
  timeline: string;
  proposal: string;
  attachments: Array<{ name: string; url: string; type: string }>;
  status: string;
  createdAt: string;
}
```

## API Endpoints Summary

### Public Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List open projects (with filters, sorting) |
| GET | `/api/projects/:id` | Get project detail (limited, no address) |

### Homeowner Routes (requireRole('HOMEOWNER'))

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/homeowner/projects` | Create project |
| GET | `/api/homeowner/projects` | List my projects |
| GET | `/api/homeowner/projects/:id` | Get my project detail |
| PUT | `/api/homeowner/projects/:id` | Update project |
| POST | `/api/homeowner/projects/:id/submit` | Submit for approval |
| DELETE | `/api/homeowner/projects/:id` | Delete project |
| GET | `/api/homeowner/projects/:id/bids` | View approved bids |

### Contractor Routes (requireRole('CONTRACTOR'))

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/contractor/bids` | Create bid |
| GET | `/api/contractor/bids` | List my bids |
| GET | `/api/contractor/bids/:id` | Get my bid detail |
| PUT | `/api/contractor/bids/:id` | Update bid |
| DELETE | `/api/contractor/bids/:id` | Withdraw bid |

### Admin Routes (requireRole('ADMIN'))

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/projects` | List all projects |
| GET | `/api/admin/projects/:id` | Get project detail |
| PUT | `/api/admin/projects/:id/approve` | Approve project |
| PUT | `/api/admin/projects/:id/reject` | Reject project |
| GET | `/api/admin/bids` | List all bids |
| GET | `/api/admin/bids/:id` | Get bid detail |
| PUT | `/api/admin/bids/:id/approve` | Approve bid |
| PUT | `/api/admin/bids/:id/reject` | Reject bid |
