# Design Document - Bidding Phase 6: Portal UI

## Overview

Phase 6 tạo giao diện người dùng hoàn chỉnh cho nền tảng đấu giá, bao gồm:

1. **Portal App** - Ứng dụng React riêng biệt cho Homeowner và Contractor
2. **Homeowner Dashboard** - Quản lý công trình và bid
3. **Contractor Dashboard** - Quản lý bid và hồ sơ
4. **Public Marketplace** - Trang công khai hiển thị công trình đang đấu giá
5. **Responsive Design** - Hỗ trợ mobile và tablet

### Key Features
1. **Role-based UI** - Giao diện khác nhau cho Homeowner và Contractor
2. **Project Management** - Tạo, xem, quản lý công trình
3. **Bid Management** - Tạo, xem, quản lý bid
4. **Real-time Updates** - Notifications và chat integration
5. **Public Marketplace** - Sàn giao dịch công khai

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PORTAL APP ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         PORTAL APP (port 4203)                   │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │    │
│  │  │   PUBLIC     │  │  HOMEOWNER   │  │  CONTRACTOR  │          │    │
│  │  │   ROUTES     │  │   ROUTES     │  │   ROUTES     │          │    │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤          │    │
│  │  │ /            │  │ /homeowner   │  │ /contractor  │          │    │
│  │  │ /marketplace │  │ /projects    │  │ /marketplace │          │    │
│  │  │ /contractors │  │ /projects/:id│  │ /my-bids     │          │    │
│  │  │ /auth/*      │  │ /bids        │  │ /profile     │          │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │                    SHARED COMPONENTS                     │    │    │
│  │  ├─────────────────────────────────────────────────────────┤    │    │
│  │  │ Layout │ Header │ Sidebar │ ProjectCard │ BidCard │ ... │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │                    SHARED PACKAGES                       │    │    │
│  │  ├─────────────────────────────────────────────────────────┤    │    │
│  │  │ @app/shared (types, utils) │ @app/ui (components)       │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         API (port 4202)                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. App Structure

```
portal/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── favicon.ico
└── src/
    ├── main.tsx
    ├── app.tsx
    ├── styles.css
    ├── api.ts                    # API client
    ├── auth/
    │   ├── AuthContext.tsx       # Auth state management
    │   ├── ProtectedRoute.tsx    # Route guard
    │   └── useAuth.ts            # Auth hook
    ├── components/
    │   ├── Layout/
    │   │   ├── Header.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── Layout.tsx
    │   ├── ProjectCard.tsx
    │   ├── BidCard.tsx
    │   ├── NotificationBell.tsx
    │   ├── ChatWidget.tsx
    │   └── ...
    └── pages/
        ├── auth/
        │   ├── LoginPage.tsx
        │   └── RegisterPage.tsx
        ├── public/
        │   ├── MarketplacePage.tsx
        │   ├── ContractorDirectoryPage.tsx
        │   └── ContractorProfilePage.tsx
        ├── homeowner/
        │   ├── DashboardPage.tsx
        │   ├── ProjectsPage.tsx
        │   ├── ProjectDetailPage.tsx
        │   ├── CreateProjectPage.tsx
        │   └── ReviewPage.tsx
        └── contractor/
            ├── DashboardPage.tsx
            ├── MarketplacePage.tsx
            ├── MyBidsPage.tsx
            ├── BidDetailPage.tsx
            ├── CreateBidPage.tsx
            └── ProfilePage.tsx
```

### 2. Auth Context (`portal/src/auth/AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'HOMEOWNER' | 'CONTRACTOR';
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
}
```

### 3. API Client (`portal/src/api.ts`)

```typescript
interface ApiClient {
  // Auth
  login(email: string, password: string): Promise<AuthResponse>;
  register(data: RegisterInput): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(): Promise<AuthResponse>;
  
  // Projects
  getProjects(query?: ProjectQuery): Promise<PaginatedResult<Project>>;
  getProject(id: string): Promise<Project>;
  createProject(data: CreateProjectInput): Promise<Project>;
  updateProject(id: string, data: UpdateProjectInput): Promise<Project>;
  submitProject(id: string): Promise<Project>;
  
  // Bids
  getBids(query?: BidQuery): Promise<PaginatedResult<Bid>>;
  getBid(id: string): Promise<Bid>;
  createBid(data: CreateBidInput): Promise<Bid>;
  updateBid(id: string, data: UpdateBidInput): Promise<Bid>;
  withdrawBid(id: string): Promise<Bid>;
  selectBid(projectId: string, bidId: string): Promise<void>;
  
  // Marketplace
  getMarketplaceProjects(query?: MarketplaceQuery): Promise<PaginatedResult<Project>>;
  getContractors(query?: ContractorQuery): Promise<PaginatedResult<Contractor>>;
  getContractorProfile(id: string): Promise<ContractorProfile>;
  
  // Notifications
  getNotifications(query?: NotificationQuery): Promise<PaginatedResult<Notification>>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  
  // Chat
  getConversations(): Promise<Conversation[]>;
  getMessages(conversationId: string, query?: MessageQuery): Promise<PaginatedResult<Message>>;
  sendMessage(conversationId: string, content: string): Promise<Message>;
}
```

### 4. Route Configuration

```typescript
// Public routes (no auth required)
const publicRoutes = [
  { path: '/', element: <HomePage /> },
  { path: '/marketplace', element: <MarketplacePage /> },
  { path: '/marketplace/:id', element: <ProjectDetailPage /> },
  { path: '/contractors', element: <ContractorDirectoryPage /> },
  { path: '/contractors/:id', element: <ContractorProfilePage /> },
  { path: '/auth/login', element: <LoginPage /> },
  { path: '/auth/register', element: <RegisterPage /> },
];

// Homeowner routes (HOMEOWNER role required)
const homeownerRoutes = [
  { path: '/homeowner', element: <HomeownerDashboard /> },
  { path: '/homeowner/projects', element: <ProjectsPage /> },
  { path: '/homeowner/projects/new', element: <CreateProjectPage /> },
  { path: '/homeowner/projects/:id', element: <ProjectDetailPage /> },
  { path: '/homeowner/projects/:id/bids', element: <BidsPage /> },
  { path: '/homeowner/projects/:id/review', element: <ReviewPage /> },
];

// Contractor routes (CONTRACTOR role required)
const contractorRoutes = [
  { path: '/contractor', element: <ContractorDashboard /> },
  { path: '/contractor/marketplace', element: <ContractorMarketplace /> },
  { path: '/contractor/marketplace/:id', element: <ProjectDetailPage /> },
  { path: '/contractor/marketplace/:id/bid', element: <CreateBidPage /> },
  { path: '/contractor/my-bids', element: <MyBidsPage /> },
  { path: '/contractor/my-bids/:id', element: <BidDetailPage /> },
  { path: '/contractor/profile', element: <ProfilePage /> },
  { path: '/contractor/verification', element: <VerificationPage /> },
];
```

## Data Models

### Frontend Types

```typescript
// Project types
interface Project {
  id: string;
  code: string;
  title: string;
  description: string;
  category: ServiceCategory;
  region: Region;
  address?: string; // Only visible after match
  area?: number;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  images?: string[];
  status: ProjectStatus;
  bidDeadline?: string;
  bidCount: number;
  owner?: User; // Only visible after match
  createdAt: string;
}

type ProjectStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'REJECTED'
  | 'OPEN' 
  | 'BIDDING_CLOSED' 
  | 'MATCHED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

// Bid types
interface Bid {
  id: string;
  code: string;
  project: Project;
  contractor?: Contractor; // Anonymized for homeowner before match
  price: number;
  timeline: string;
  proposal: string;
  attachments?: Attachment[];
  status: BidStatus;
  createdAt: string;
}

type BidStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'SELECTED' 
  | 'NOT_SELECTED' 
  | 'WITHDRAWN';

// Contractor types
interface Contractor {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  totalProjects: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  profile?: ContractorProfile;
}

interface ContractorProfile {
  description?: string;
  experience?: number;
  specialties?: string[];
  serviceAreas?: Region[];
  portfolioImages?: string[];
  certificates?: Certificate[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Protected Route Redirect
*For any* unauthenticated user accessing a protected route, the system should redirect to the login page.
**Validates: Requirements 2.1**

### Property 2: Role-based Menu Items
*For any* authenticated user, the sidebar should display menu items appropriate for their role (HOMEOWNER or CONTRACTOR).
**Validates: Requirements 3.2**

### Property 3: Token Refresh on Expiry
*For any* expired access token, the system should attempt to refresh using the refresh token before redirecting to login.
**Validates: Requirements 2.5**

### Property 4: Project Ownership Filter
*For any* homeowner viewing their projects, only projects they own should be displayed.
**Validates: Requirements 5.1**

### Property 5: Project Status Filter
*For any* project filter by status, only projects matching the selected status should be returned.
**Validates: Requirements 5.2**

### Property 6: Marketplace OPEN Status Filter
*For any* marketplace listing (public or contractor), only projects with OPEN status should be displayed.
**Validates: Requirements 9.1, 13.1**

### Property 7: Project Privacy - No Owner Info
*For any* project viewed by a contractor or visitor before match, owner information should not be exposed.
**Validates: Requirements 9.3, 13.2**

### Property 8: Verification Gate for Bidding
*For any* contractor with verificationStatus not VERIFIED, the bid button should be replaced with verification prompt.
**Validates: Requirements 9.4**

### Property 9: Public Filter Support
*For any* public marketplace filter, filtering by region and category should return matching projects.
**Validates: Requirements 13.4**

### Property 10: Contractor Directory Verified Only
*For any* contractor directory listing, only contractors with VERIFIED status should be displayed.
**Validates: Requirements 14.1**

### Property 11: Onboarding Completion Persistence
*For any* user who completes onboarding, the completion status should persist and onboarding should not show again.
**Validates: Requirements 19.4**

### Property 12: Bid Comparison Limit
*For any* bid comparison, at most 3 bids should be selectable for comparison.
**Validates: Requirements 20.1**

### Property 13: Draft Auto-save Restoration
*For any* incomplete form with saved draft, returning to the form should restore the draft data.
**Validates: Requirements 22.3**

### Property 14: Saved Project Expiration
*For any* saved project that is no longer OPEN, it should be marked as expired in the saved list.
**Validates: Requirements 21.5**

### Property 15: Dark Mode Persistence
*For any* user dark mode preference, the setting should persist across browser sessions.
**Validates: Requirements 25.2**

## Error Handling

### API Error Handling

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Error codes
type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

// Error handling hook
function useApiError() {
  const handleError = (error: ApiError) => {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Redirect to login
        break;
      case 'FORBIDDEN':
        // Show access denied message
        break;
      case 'VALIDATION_ERROR':
        // Show validation errors
        break;
      default:
        // Show generic error toast
        break;
    }
  };
  return { handleError };
}
```

### Loading States

```typescript
// Loading state component
function LoadingState({ type }: { type: 'skeleton' | 'spinner' }) {
  if (type === 'skeleton') {
    return <SkeletonLoader />;
  }
  return <Spinner />;
}

// Error boundary
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={<ErrorFallback />}
      onError={(error) => logError(error)}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
```

### Onboarding Components

```typescript
// Onboarding context
interface OnboardingContextType {
  isCompleted: boolean;
  currentStep: number;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
}

// Onboarding steps for Homeowner
const homeownerSteps = [
  { target: '.create-project-btn', content: 'Bắt đầu bằng cách đăng công trình của bạn' },
  { target: '.project-list', content: 'Theo dõi tất cả công trình tại đây' },
  { target: '.bid-list', content: 'Xem và so sánh các đề xuất từ nhà thầu' },
  { target: '.notification-bell', content: 'Nhận thông báo khi có bid mới' },
];

// Verification checklist for Contractor
const verificationChecklist = [
  { id: 'profile', label: 'Hoàn thiện hồ sơ', completed: false },
  { id: 'idCard', label: 'Tải lên CMND/CCCD', completed: false },
  { id: 'portfolio', label: 'Thêm ảnh portfolio', completed: false },
  { id: 'submit', label: 'Gửi xác minh', completed: false },
];
```

### Bid Comparison Component

```typescript
interface BidComparisonProps {
  bids: Bid[];
  onSelect: (bidId: string) => void;
  onClose: () => void;
}

// Comparison table columns
const comparisonColumns = [
  { key: 'price', label: 'Giá đề xuất', highlight: 'lowest' },
  { key: 'timeline', label: 'Thời gian', highlight: 'fastest' },
  { key: 'rating', label: 'Đánh giá', highlight: 'highest' },
  { key: 'projects', label: 'Số dự án', highlight: 'highest' },
  { key: 'proposal', label: 'Đề xuất', highlight: null },
];
```

### Draft Auto-save Service

```typescript
interface DraftService {
  saveDraft(key: string, data: unknown): void;
  getDraft<T>(key: string): T | null;
  deleteDraft(key: string): void;
  getDraftAge(key: string): number | null; // days
}

// Draft keys
const DRAFT_KEYS = {
  PROJECT: 'draft_project',
  BID: (projectId: string) => `draft_bid_${projectId}`,
};
```

### Theme Context

```typescript
type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

// CSS variables for dark mode
const darkThemeVars = {
  '--bg-primary': '#1a1a2e',
  '--bg-secondary': '#16213e',
  '--text-primary': '#eaeaea',
  '--text-secondary': '#a0a0a0',
  '--accent': '#e94560',
  '--border': '#2a2a4a',
};
```

### SavedProject Model

```typescript
interface SavedProject {
  id: string;
  projectId: string;
  project: Project;
  savedAt: string;
  isExpired: boolean; // project no longer OPEN
}
```

## Testing Strategy

### Property-Based Testing Library
- **Library**: fast-check (for logic tests)
- **Component Testing**: React Testing Library
- **E2E Testing**: Playwright (optional)
- **Minimum iterations**: 100 per property test

### Unit Tests
- Auth context and hooks
- API client methods
- Utility functions
- Form validation

### Component Tests
- Layout components render correctly
- Protected routes redirect unauthenticated users
- Role-based menu items display correctly
- Forms validate input correctly

### Property-Based Tests
Each correctness property will be implemented as a property-based test:

1. **Property 1**: Generate random routes and auth states, verify redirect behavior
2. **Property 2**: Generate users with different roles, verify menu items
3. **Property 3**: Generate expired tokens, verify refresh attempt
4. **Property 4**: Generate projects with different owners, verify filtering
5. **Property 5**: Generate projects with various statuses, verify filter results
6. **Property 6**: Generate projects with various statuses, verify OPEN filter
7. **Property 7**: Generate project views, verify owner info is hidden
8. **Property 8**: Generate contractors with various verification statuses, verify UI
9. **Property 9**: Generate filter combinations, verify results
10. **Property 10**: Generate contractors with various statuses, verify directory

### Test File Structure
```
portal/src/
├── auth/
│   ├── AuthContext.tsx
│   └── AuthContext.test.tsx
├── api.ts
├── api.test.ts
├── api.property.test.ts
├── components/
│   ├── Layout/
│   │   └── Layout.test.tsx
│   └── ...
└── pages/
    └── ...
```

### Test Annotations
Each property-based test must include:
```typescript
/**
 * **Feature: bidding-phase6-portal, Property 1: Protected Route Redirect**
 * **Validates: Requirements 2.1**
 */
```
