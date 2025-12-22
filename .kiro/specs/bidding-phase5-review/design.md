# Design Document - Bidding Phase 5: Review & Ranking

## Overview

Phase 5 bổ sung hệ thống đánh giá và xếp hạng nhà thầu, bao gồm:

1. **Review System** - Đánh giá nhà thầu sau khi hoàn thành dự án
2. **Contractor Response** - Nhà thầu phản hồi đánh giá
3. **Rating Calculation** - Tính toán điểm đánh giá trung bình
4. **Ranking Algorithm** - Xếp hạng nhà thầu theo nhiều tiêu chí
5. **Featured Contractors** - Nhà thầu nổi bật

### Key Features
1. **Star Rating** - Đánh giá 1-5 sao
2. **Review Comments** - Nhận xét chi tiết với hình ảnh
3. **Contractor Response** - Phản hồi chuyên nghiệp
4. **Weighted Ranking** - Xếp hạng đa tiêu chí
5. **Featured Display** - Hiển thị nhà thầu nổi bật

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REVIEW & RANKING FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  HOMEOWNER              SYSTEM                      CONTRACTOR           │
│  ──────────             ──────                      ──────────           │
│                                                                          │
│  1. Project completed ──► Prompt for review                             │
│                                                                          │
│  2. Submit review ──────► Validate project status                       │
│     (rating, comment,     Validate ownership                            │
│      images)              Save review                                    │
│                           │                                              │
│                           ├─► Recalculate rating ────► Update profile   │
│                           └─► Send notification ─────► Receive alert    │
│                                                                          │
│                                                        3. View review   │
│                                                           Submit response│
│                           ◄──────────────────────────────────────────── │
│                           Save response                                  │
│                           Notify reviewer ◄──────────────────────────── │
│                                                                          │
│  ═══════════════════════ RANKING CALCULATION ═══════════════════════   │
│                                                                          │
│  DAILY CRON JOB ────────► For each contractor:                          │
│                           │                                              │
│                           ├─► Rating score (40%)                        │
│                           ├─► Projects score (30%)                      │
│                           ├─► Response rate (15%)                       │
│                           └─► Verification (15%)                        │
│                           │                                              │
│                           └─► Total ranking score                       │
│                               Update contractor rank                     │
│                               Update featured status                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Review Service (`api/src/services/review.service.ts`)

```typescript
interface ReviewService {
  // Review CRUD
  create(projectId: string, reviewerId: string, data: CreateReviewInput): Promise<Review>;
  update(reviewId: string, reviewerId: string, data: UpdateReviewInput): Promise<Review>;
  delete(reviewId: string, reviewerId: string): Promise<void>;
  getById(reviewId: string): Promise<Review | null>;
  
  // Listing
  listByContractor(contractorId: string, query: ReviewQuery): Promise<PaginatedResult<Review>>;
  listByReviewer(reviewerId: string, query: ReviewQuery): Promise<PaginatedResult<Review>>;
  listPublic(contractorId: string, query: PublicReviewQuery): Promise<PaginatedResult<Review>>;
  
  // Response
  addResponse(reviewId: string, contractorId: string, response: string): Promise<Review>;
  
  // Admin
  hide(reviewId: string, adminId: string): Promise<Review>;
  unhide(reviewId: string, adminId: string): Promise<Review>;
  adminDelete(reviewId: string, adminId: string): Promise<void>;
}

interface CreateReviewInput {
  rating: number; // 1-5
  comment?: string;
  images?: string[];
}

interface ReviewQuery {
  rating?: number;
  fromDate?: Date;
  toDate?: Date;
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'rating';
  sortOrder: 'asc' | 'desc';
}
```

### 2. Ranking Service (`api/src/services/ranking.service.ts`)

```typescript
interface RankingService {
  // Score Calculation
  calculateScore(contractorId: string): Promise<RankingScore>;
  recalculateAllScores(): Promise<void>;
  
  // Ranking
  getRanking(query: RankingQuery): Promise<PaginatedResult<ContractorRanking>>;
  getContractorRank(contractorId: string): Promise<ContractorRanking>;
  
  // Featured
  updateFeaturedContractors(): Promise<void>;
  getFeaturedContractors(limit?: number): Promise<ContractorRanking[]>;
  setFeatured(contractorId: string, adminId: string, featured: boolean): Promise<void>;
  
  // Statistics
  getContractorStats(contractorId: string): Promise<ContractorStats>;
  getMonthlyStats(contractorId: string, months?: number): Promise<MonthlyStats[]>;
}

interface RankingScore {
  ratingScore: number;      // 40% weight
  projectsScore: number;    // 30% weight
  responseScore: number;    // 15% weight
  verificationScore: number; // 15% weight
  totalScore: number;
}

interface ContractorStats {
  totalProjects: number;
  completedProjects: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  averageResponseTime: number; // hours
}
```

### 3. API Routes

#### Review Routes - Homeowner (`/api/homeowner/reviews`)
```
POST /projects/:projectId/review  - Create review for completed project
PUT  /reviews/:id                 - Update review (within 7 days)
DELETE /reviews/:id               - Delete review
GET  /reviews                     - List my reviews
```

#### Review Routes - Contractor (`/api/contractor/reviews`)
```
GET  /                            - List reviews for my projects
GET  /:id                         - Get review detail
POST /:id/response                - Add response to review
GET  /stats                       - Get my statistics
GET  /ranking                     - Get my ranking
```

#### Review Routes - Public (`/api/reviews`)
```
GET  /contractors/:id             - List public reviews for contractor
GET  /contractors/:id/summary     - Get review summary (rating distribution)
```

#### Ranking Routes (`/api/rankings`)
```
GET  /                            - List contractor rankings
GET  /featured                    - Get featured contractors
GET  /contractors/:id             - Get contractor's rank
```

#### Admin Routes (`/api/admin/reviews`)
```
GET  /                            - List all reviews
GET  /:id                         - Get review detail
PUT  /:id/hide                    - Hide review
PUT  /:id/unhide                  - Unhide review
DELETE /:id                       - Permanently delete review
GET  /stats                       - Platform-wide review statistics
```

#### Admin Ranking Routes (`/api/admin/rankings`)
```
POST /recalculate                 - Trigger ranking recalculation
PUT  /contractors/:id/featured    - Set featured status
```

## Data Models

### Review Model

```prisma
model Review {
  id          String   @id @default(cuid())
  
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  reviewerId  String   // Homeowner
  reviewer    User     @relation("ReviewAuthor", fields: [reviewerId], references: [id])
  contractorId String  // Contractor being reviewed
  contractor  User     @relation("ReviewSubject", fields: [contractorId], references: [id])
  
  rating      Int      // 1-5
  comment     String?
  images      String?  // JSON: ["url1", "url2"] max 5
  
  // Response from contractor
  response    String?
  respondedAt DateTime?
  
  isPublic    Boolean  @default(true)
  isDeleted   Boolean  @default(false)
  deletedAt   DateTime?
  deletedBy   String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([projectId, reviewerId])
  @@index([contractorId])
  @@index([rating])
  @@index([isPublic])
}
```

### ContractorRanking Model

```prisma
model ContractorRanking {
  id              String   @id @default(cuid())
  contractorId    String   @unique
  contractor      User     @relation(fields: [contractorId], references: [id])
  
  // Score components
  ratingScore     Float    @default(0)
  projectsScore   Float    @default(0)
  responseScore   Float    @default(0)
  verificationScore Float  @default(0)
  totalScore      Float    @default(0)
  
  // Rank
  rank            Int      @default(0)
  previousRank    Int?
  
  // Featured
  isFeatured      Boolean  @default(false)
  featuredAt      DateTime?
  featuredBy      String?  // Admin who manually featured
  
  // Stats cache
  totalProjects   Int      @default(0)
  completedProjects Int    @default(0)
  totalReviews    Int      @default(0)
  averageRating   Float    @default(0)
  
  calculatedAt    DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([totalScore])
  @@index([rank])
  @@index([isFeatured])
}
```

### Updated User Model Relations

```prisma
model User {
  // ... existing fields
  
  // Reviews
  reviewsGiven    Review[] @relation("ReviewAuthor")
  reviewsReceived Review[] @relation("ReviewSubject")
  
  // Ranking
  ranking         ContractorRanking?
}
```

### ReviewHelpfulness Model

```prisma
model ReviewHelpfulness {
  id        String   @id @default(cuid())
  reviewId  String
  review    Review   @relation(fields: [reviewId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@unique([reviewId, userId])
  @@index([reviewId])
}
```

### ReviewReport Model

```prisma
model ReviewReport {
  id          String   @id @default(cuid())
  reviewId    String
  review      Review   @relation(fields: [reviewId], references: [id])
  reporterId  String
  reporter    User     @relation(fields: [reporterId], references: [id])
  
  reason      String   // spam, offensive, fake, irrelevant
  description String?
  status      String   @default("PENDING") // PENDING, RESOLVED, DISMISSED
  
  resolvedBy  String?
  resolvedAt  DateTime?
  resolution  String?  // hide, delete, dismiss
  
  createdAt   DateTime @default(now())
  
  @@index([reviewId])
  @@index([status])
}
```

### ContractorBadge Model

```prisma
model ContractorBadge {
  id           String   @id @default(cuid())
  contractorId String
  contractor   User     @relation(fields: [contractorId], references: [id])
  
  badgeType    String   // ACTIVE_CONTRACTOR, HIGH_QUALITY, FAST_RESPONDER
  awardedAt    DateTime @default(now())
  
  @@unique([contractorId, badgeType])
  @@index([contractorId])
}
```

### Extended Review Model (Multi-Criteria)

```prisma
model Review {
  // ... existing fields
  
  // Multi-criteria ratings (1-5)
  qualityRating       Int?  // Chất lượng công việc
  timelinessRating    Int?  // Đúng tiến độ
  communicationRating Int?  // Giao tiếp
  valueRating         Int?  // Giá cả hợp lý
  
  // Helpfulness
  helpfulCount        Int   @default(0)
  helpfulVotes        ReviewHelpfulness[]
  
  // Reports
  reports             ReviewReport[]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Review Rating Bounds
*For any* review, the rating must be between 1 and 5 inclusive.
**Validates: Requirements 1.2, 2.4**

### Property 2: Review Uniqueness
*For any* project and reviewer pair, only one review can exist (unique constraint).
**Validates: Requirements 1.4, 2.3**

### Property 3: Review Precondition
*For any* review creation attempt, the project must be in COMPLETED status and the reviewer must be the project owner.
**Validates: Requirements 2.1, 2.2**

### Property 4: Response Uniqueness
*For any* review, a contractor can only respond once.
**Validates: Requirements 3.1, 3.3**

### Property 5: Public Review Filtering
*For any* public review listing, only reviews with isPublic=true should be returned.
**Validates: Requirements 4.3**

### Property 6: Rating Recalculation
*For any* review creation, update, or deletion, the contractor's average rating should be recalculated correctly.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: Ranking Score Calculation
*For any* contractor, the ranking score should equal: (ratingScore * 0.4) + (projectsScore * 0.3) + (responseScore * 0.15) + (verificationScore * 0.15).
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 8: Featured Contractor Limit
*For any* featured contractor listing, at most 10 contractors should be returned, sorted by ranking score.
**Validates: Requirements 8.2**

### Property 9: Image Limit Validation
*For any* review with images, the number of images must not exceed 5.
**Validates: Requirements 2.5**

### Property 10: Contractor View All Reviews
*For any* contractor viewing their reviews, all reviews (including hidden) should be returned.
**Validates: Requirements 4.4**

### Property 11: Multi-Criteria Rating Calculation
*For any* review with multi-criteria ratings, the overall rating should be the weighted average of all criteria.
**Validates: Requirements 17.1, 17.2**

### Property 12: Helpfulness Vote Uniqueness
*For any* user and review pair, only one helpfulness vote should be allowed.
**Validates: Requirements 18.2**

### Property 13: Badge Award Criteria
*For any* contractor meeting badge criteria, the badge should be automatically awarded.
**Validates: Requirements 21.1, 21.2, 21.3**

### Property 14: Review Reminder Suppression
*For any* project with existing review, no reminder notifications should be sent.
**Validates: Requirements 20.4**

## Error Handling

### Review Errors
```typescript
class ReviewError extends Error {
  constructor(
    public code: ReviewErrorCode,
    message: string,
    public statusCode?: number
  ) {
    super(message);
  }
}

type ReviewErrorCode =
  | 'REVIEW_NOT_FOUND'
  | 'PROJECT_NOT_COMPLETED'
  | 'NOT_PROJECT_OWNER'
  | 'REVIEW_ALREADY_EXISTS'
  | 'RESPONSE_ALREADY_EXISTS'
  | 'NOT_CONTRACTOR'
  | 'REVIEW_UPDATE_EXPIRED'
  | 'INVALID_RATING'
  | 'TOO_MANY_IMAGES';
```

### HTTP Error Responses
| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| REVIEW_NOT_FOUND | 404 | Review không tồn tại |
| PROJECT_NOT_COMPLETED | 400 | Project chưa hoàn thành |
| NOT_PROJECT_OWNER | 403 | Không phải chủ project |
| REVIEW_ALREADY_EXISTS | 409 | Đã đánh giá project này |
| RESPONSE_ALREADY_EXISTS | 409 | Đã phản hồi review này |
| REVIEW_UPDATE_EXPIRED | 400 | Quá 7 ngày không thể sửa |
| INVALID_RATING | 400 | Rating phải từ 1-5 |
| TOO_MANY_IMAGES | 400 | Tối đa 5 hình ảnh |

## Testing Strategy

### Property-Based Testing Library
- **Library**: fast-check
- **Minimum iterations**: 100 per property test

### Unit Tests
- Review service methods
- Ranking calculation
- Score components
- Access control

### Property-Based Tests
Each correctness property will be implemented as a property-based test:

1. **Property 1**: Generate random ratings, verify bounds validation
2. **Property 2**: Generate duplicate review attempts, verify rejection
3. **Property 3**: Generate reviews for various project statuses, verify preconditions
4. **Property 4**: Generate multiple response attempts, verify uniqueness
5. **Property 5**: Generate reviews with various isPublic values, verify filtering
6. **Property 6**: Generate review operations, verify rating recalculation
7. **Property 7**: Generate contractor data, verify score calculation formula
8. **Property 8**: Generate featured listings, verify limit and sorting
9. **Property 9**: Generate reviews with images, verify limit validation
10. **Property 10**: Generate contractor review views, verify all reviews returned

### Test File Structure
```
api/src/services/
├── review.service.ts
├── review.service.property.test.ts
├── ranking.service.ts
└── ranking.service.property.test.ts
```

### Test Annotations
Each property-based test must include:
```typescript
/**
 * **Feature: bidding-phase5-review, Property 1: Review Rating Bounds**
 * **Validates: Requirements 1.2, 2.4**
 */
```
