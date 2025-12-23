# Design Document: Admin Dashboard Enhancement

## Overview

Cải tiến trang Dashboard của Admin Panel để cung cấp cái nhìn tổng quan toàn diện về hoạt động của hệ thống Anh Thợ Xây. Dashboard mới sẽ hiển thị thống kê từ tất cả các module quan trọng: Leads, Projects, Bids, Contractors, Interior Quotes, Blog, Users, và Media.

### Goals
- Hiển thị thống kê tổng quan từ tất cả modules
- Highlight các mục cần xử lý (pending items)
- Cung cấp quick actions để truy cập nhanh
- Hiển thị hoạt động gần đây
- Responsive design cho desktop/tablet/mobile
- Performance tối ưu với skeleton loaders và caching

## Architecture

```mermaid
graph TB
    subgraph Frontend [Admin Panel - React]
        DP[DashboardPage]
        SC[StatsCards]
        PI[PendingItemsSection]
        CH[ChartsSection]
        AF[ActivityFeed]
        QA[QuickActions]
    end
    
    subgraph API [Hono API]
        DE[/api/admin/dashboard]
        AS[/api/admin/dashboard/activity]
    end
    
    subgraph Services
        DS[DashboardService]
    end
    
    subgraph Database [Prisma]
        CL[CustomerLead]
        PR[Project]
        BD[Bid]
        US[User]
        IQ[InteriorQuote]
        BP[BlogPost]
        MA[MediaAsset]
    end
    
    DP --> SC
    DP --> PI
    DP --> CH
    DP --> AF
    DP --> QA
    
    SC --> DE
    PI --> DE
    CH --> DE
    AF --> AS
    QA --> DE
    
    DE --> DS
    AS --> DS
    
    DS --> CL
    DS --> PR
    DS --> BD
    DS --> US
    DS --> IQ
    DS --> BP
    DS --> MA
```

## Components and Interfaces

### API Endpoints

#### GET /api/admin/dashboard
Returns all dashboard statistics in a single response.

**Request:**
```
GET /api/admin/dashboard
Authorization: Bearer <token>
```

**Response:**
```typescript
interface DashboardStatsResponse {
  success: true;
  data: {
    leads: {
      total: number;
      new: number;
      byStatus: Record<string, number>;
      bySource: Record<string, number>;
      conversionRate: number;
      dailyLeads: Array<{ date: string; count: number }>;
    };
    projects: {
      total: number;
      pending: number;      // PENDING_APPROVAL
      open: number;         // OPEN
      matched: number;      // MATCHED
      inProgress: number;   // IN_PROGRESS
      completed: number;    // COMPLETED
    };
    bids: {
      total: number;
      pending: number;      // PENDING
      approved: number;     // APPROVED
    };
    contractors: {
      total: number;
      pending: number;      // verificationStatus = PENDING
      verified: number;     // verificationStatus = VERIFIED
    };
    interiorQuotes: {
      total: number;
      thisMonth: number;
    };
    blogPosts: {
      total: number;
      published: number;
      draft: number;
    };
    users: {
      total: number;
      byRole: Record<string, number>;
    };
    media: {
      total: number;
    };
    pendingItems: {
      projects: Array<PendingProject>;
      bids: Array<PendingBid>;
      contractors: Array<PendingContractor>;
    };
  };
}

interface PendingProject {
  id: string;
  code: string;
  title: string;
  ownerName: string;
  createdAt: string;
}

interface PendingBid {
  id: string;
  code: string;
  projectCode: string;
  contractorName: string;
  price: number;
  createdAt: string;
}

interface PendingContractor {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  submittedAt?: string;
}
```

#### GET /api/admin/dashboard/activity
Returns recent activity feed.

**Request:**
```
GET /api/admin/dashboard/activity?limit=10
Authorization: Bearer <token>
```

**Response:**
```typescript
interface ActivityFeedResponse {
  success: true;
  data: Array<{
    id: string;
    type: 'LEAD' | 'PROJECT' | 'BID' | 'CONTRACTOR' | 'INTERIOR_QUOTE';
    title: string;
    description: string;
    entityId: string;
    createdAt: string;
  }>;
}
```

### Frontend Components

#### DashboardPage
Main container component that orchestrates data loading and renders child components.

```typescript
interface DashboardPageProps {}

// State
interface DashboardState {
  stats: DashboardStats | null;
  activity: ActivityItem[];
  loading: boolean;
  chartsLoading: boolean;
  error: string | null;
}
```

#### StatsCards
Displays 8 stats cards in a responsive grid.

```typescript
interface StatsCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  pendingCount?: number;
  onClick: () => void;
}
```

#### PendingItemsSection
Tabbed section showing pending items by category.

```typescript
interface PendingItemsSectionProps {
  projects: PendingProject[];
  bids: PendingBid[];
  contractors: PendingContractor[];
}
```

#### ActivityFeed
Shows recent activity with icons and timestamps.

```typescript
interface ActivityFeedProps {
  items: ActivityItem[];
  loading: boolean;
}
```

#### QuickActions
Action buttons with optional badges.

```typescript
interface QuickActionProps {
  icon: string;
  label: string;
  route: string;
  badgeCount?: number;
}
```

## Data Models

### DashboardStats (Frontend Type)
```typescript
interface DashboardStats {
  leads: LeadsStats;
  projects: ProjectsStats;
  bids: BidsStats;
  contractors: ContractorsStats;
  interiorQuotes: InteriorQuotesStats;
  blogPosts: BlogPostsStats;
  users: UsersStats;
  media: MediaStats;
  pendingItems: PendingItems;
}
```

### ActivityItem (Frontend Type)
```typescript
interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  entityId: string;
  createdAt: Date;
  icon: string;
  route: string;
}

type ActivityType = 'LEAD' | 'PROJECT' | 'BID' | 'CONTRACTOR' | 'INTERIOR_QUOTE';
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dashboard API returns complete stats structure
*For any* authenticated admin request to `/api/admin/dashboard`, the response SHALL contain all required stat categories (leads, projects, bids, contractors, interiorQuotes, blogPosts, users, media) with numeric values.
**Validates: Requirements 6.1, 6.2**

### Property 2: Pending items are limited to 5 per category
*For any* dashboard stats response, each pending items category (projects, bids, contractors) SHALL contain at most 5 items, sorted by createdAt descending.
**Validates: Requirements 2.3**

### Property 3: Activity feed is limited to requested count
*For any* activity feed request with limit parameter, the response SHALL contain at most `limit` items, sorted by createdAt descending.
**Validates: Requirements 4.2**

### Property 4: Activity items have required fields
*For any* activity item in the feed, it SHALL contain id, type, title, description, entityId, and createdAt fields with non-empty values.
**Validates: Requirements 4.3**

### Property 5: Pending counts match pending items
*For any* dashboard stats response, the pending count for each category SHALL equal the actual count of items with pending status in the database (capped at 5 for display).
**Validates: Requirements 1.3, 2.1, 5.3**

### Property 6: Stats counts are non-negative integers
*For any* dashboard stats response, all count values SHALL be non-negative integers.
**Validates: Requirements 1.2**

## Error Handling

### API Errors
| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| UNAUTHORIZED | 401 | User not authenticated |
| FORBIDDEN | 403 | User not admin |
| INTERNAL_ERROR | 500 | Database or server error |

### Frontend Error States
- Loading state: Skeleton loaders for each section
- Error state: Error message with retry button
- Empty state: Appropriate message for each section

## Testing Strategy

### Unit Tests
- DashboardService methods return correct data structure
- Stats calculations are accurate
- Pending items filtering works correctly
- Activity feed aggregation works correctly

### Property-Based Tests
Using `fast-check` library for property-based testing:

1. **Property 1**: Dashboard API response structure validation
   - Generate random database states
   - Verify response always contains all required fields
   - Verify all counts are numbers

2. **Property 2**: Pending items limit
   - Generate random number of pending items (0-100)
   - Verify response never exceeds 5 items per category

3. **Property 3**: Activity feed limit
   - Generate random limit values (1-50)
   - Verify response never exceeds limit

4. **Property 4**: Activity item structure
   - Generate random activity items
   - Verify all required fields are present

5. **Property 5**: Pending counts accuracy
   - Generate random pending items
   - Verify counts match actual pending status

6. **Property 6**: Non-negative counts
   - Generate random database states
   - Verify all counts are >= 0

### Integration Tests
- Full API endpoint testing with authentication
- Frontend component rendering with mock data
- Navigation testing for clickable elements

### E2E Tests (Manual)
- Responsive layout on different screen sizes
- Auto-refresh functionality
- Loading states and transitions
