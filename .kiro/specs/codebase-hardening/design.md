# Design Document - Codebase Hardening

## Overview

Spec này thực hiện kiểm tra toàn diện (recheck) tất cả code đã được tạo trong các spec Bidding Phase 1-6. Mục tiêu là đảm bảo code tuân thủ cấu trúc chuẩn của dự án, fix tất cả lỗi/warnings từ gốc, và bổ sung UI còn thiếu.

## Architecture

### Phạm vi kiểm tra

```
┌─────────────────────────────────────────────────────────────────┐
│                    BIDDING PHASES 1-6                           │
├─────────────────────────────────────────────────────────────────┤
│ Phase 1: Foundation                                             │
│   - Prisma Schema (User, ContractorProfile, Region, etc.)       │
│   - Auth System (CONTRACTOR, HOMEOWNER roles)                   │
│   - Contractor API, Region API, BiddingSettings API             │
│   - Admin UI: ContractorsPage, RegionsPage, SettingsPage        │
├─────────────────────────────────────────────────────────────────┤
│ Phase 2: Core Bidding                                           │
│   - Project & Bid models                                        │
│   - Project Service, Bid Service                                │
│   - Project Routes, Bid Routes                                  │
│   - Admin UI: ProjectsPage, BidsPage                            │
├─────────────────────────────────────────────────────────────────┤
│ Phase 3: Matching & Payment                                     │
│   - Escrow, FeeTransaction, Milestone, Notification models      │
│   - Match, Escrow, Fee, Milestone, Dispute, Notification services│
│   - Admin UI: MatchesPage, FeesPage, DisputesPage               │
├─────────────────────────────────────────────────────────────────┤
│ Phase 4: Communication                                          │
│   - Conversation, Message, NotificationPreference models        │
│   - Chat Service, Notification Channel Service                  │
│   - WebSocket Handler                                           │
│   - Admin UI: ChatPage, NotificationTemplatesPage               │
├─────────────────────────────────────────────────────────────────┤
│ Phase 5: Review & Ranking                                       │
│   - Review, ContractorRanking, ContractorBadge models           │
│   - Review, Ranking, Badge services                             │
│   - Landing UI: ReviewForm, StarRating, RatingBreakdown         │
├─────────────────────────────────────────────────────────────────┤
│ Phase 6: Portal UI                                              │
│   - Portal App setup                                            │
│   - Auth, Layout, Pages                                         │
│   - Homeowner & Contractor dashboards                           │
│   - Public Marketplace & Contractor Directory                   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Checklist kiểm tra

#### 1. API Layer (`api/src/`)

| Component | Files | Check Items |
|-----------|-------|-------------|
| Routes | `routes/*.routes.ts` | Auth middleware, validation, response format |
| Services | `services/*.service.ts` | Error handling, business logic |
| Schemas | `schemas/*.schema.ts` | Zod validation, exports |
| Middleware | `middleware/*.ts` | Security, rate limiting |
| Utils | `utils/*.ts` | Helper functions |

#### 2. Admin UI (`admin/src/app/`)

| Page | Files | Check Items |
|------|-------|-------------|
| ContractorsPage | `pages/ContractorsPage/*` | Table, modals, API integration |
| RegionsPage | `pages/RegionsPage/*` | Tree view, CRUD |
| ProjectsPage | `pages/ProjectsPage/*` | Table, filters, approval |
| BidsPage | `pages/BidsPage/*` | Table, filters, approval |
| MatchesPage | `pages/MatchesPage/*` | Table, escrow actions |
| FeesPage | `pages/FeesPage/*` | Table, mark paid |
| DisputesPage | `pages/DisputesPage/*` | Table, resolve |
| ChatPage | `pages/ChatPage/*` | Conversation list, messages |
| NotificationTemplatesPage | `pages/NotificationTemplatesPage/*` | Template CRUD |
| SettingsPage | `pages/SettingsPage/*` | BiddingTab, ServiceFeesTab |

#### 3. Portal UI (`portal/src/`)

| Page | Files | Check Items |
|------|-------|-------------|
| Auth | `pages/auth/*` | Login, Register |
| Homeowner | `pages/homeowner/*` | Dashboard, Projects, CreateProject |
| Contractor | `pages/contractor/*` | Dashboard, Marketplace, MyBids, Profile |
| Public | `pages/public/*` | Marketplace, ContractorDirectory |
| Components | `components/*` | Shared components |
| Hooks | `hooks/*` | Custom hooks |
| Contexts | `contexts/*` | State management |

#### 4. Landing UI (`landing/src/app/`)

| Component | Files | Check Items |
|-----------|-------|-------------|
| Review | `components/ReviewForm.tsx` | Form validation |
| Rating | `components/StarRating.tsx` | Display |
| Breakdown | `components/RatingBreakdown.tsx` | Chart |

## Data Models

Các models đã được tạo trong Prisma schema:

### Phase 1
- User (extended with contractor fields)
- ContractorProfile
- Region
- BiddingSettings
- ServiceFee

### Phase 2
- Project
- Bid

### Phase 3
- Escrow
- FeeTransaction
- ProjectMilestone
- Notification

### Phase 4
- Conversation
- ConversationParticipant
- Message
- NotificationPreference
- NotificationTemplate
- ScheduledNotification

### Phase 5
- Review
- ContractorRanking
- ContractorBadge
- ReviewHelpfulness
- ReviewReport

### Phase 6
- SavedProject

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API File Structure Compliance
*For any* API route file, it should be located in `api/src/routes/` and named `*.routes.ts`
**Validates: Requirements 2.1**

### Property 2: Service File Structure Compliance
*For any* API service file, it should be located in `api/src/services/` and named `*.service.ts`
**Validates: Requirements 2.2**

### Property 3: Schema File Structure Compliance
*For any* API schema file, it should be located in `api/src/schemas/` and named `*.schema.ts`
**Validates: Requirements 2.3**

### Property 4: Admin Route Authentication
*For any* admin API endpoint (path contains `/admin/`), it should have `authenticate()` and `requireRole('ADMIN')` middleware
**Validates: Requirements 5.1**

### Property 5: Contractor Route Authentication
*For any* contractor API endpoint (path contains `/contractor/`), it should have `authenticate()` and `requireRole('CONTRACTOR')` middleware
**Validates: Requirements 5.2**

### Property 6: Homeowner Route Authentication
*For any* homeowner API endpoint (path contains `/homeowner/`), it should have `authenticate()` and `requireRole('HOMEOWNER')` middleware
**Validates: Requirements 5.3**

### Property 7: Property Test Coverage
*For any* service file with business logic, there should be a corresponding `.property.test.ts` file
**Validates: Requirements 7.1**

## Error Handling

- Tất cả lỗi lint phải được fix từ gốc, không dùng eslint-disable
- Tất cả lỗi typecheck phải được fix bằng cách sửa types đúng
- Tất cả test failures phải được fix bằng cách sửa logic

## Testing Strategy

### Verification Commands

```bash
# 1. Lint check
pnpm nx run-many --target=lint --all

# 2. Type check
pnpm nx run-many --target=typecheck --all

# 3. Unit & Property tests
pnpm nx run-many --target=test --all
```

### Property-Based Testing

Sử dụng `fast-check` library đã có trong dự án.

Các property tests cần verify:
1. File structure compliance
2. Route authentication compliance
3. Service-test file pairing

