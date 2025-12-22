# Design Document - Code Refactoring

## Overview

Spec này thực hiện refactoring các files quá dài (>500 lines) trong codebase để cải thiện maintainability. Mục tiêu là tách các files lớn thành các modules nhỏ hơn, có trách nhiệm rõ ràng, dễ đọc và dễ maintain.

## Architecture

### Phạm vi Refactoring

```
┌─────────────────────────────────────────────────────────────────┐
│                    FILES CẦN REFACTOR                           │
├─────────────────────────────────────────────────────────────────┤
│ 🔴 CRITICAL (>1000 lines)                                       │
│   API Services:                                                 │
│   - chat.service.ts (1285) → chat-message.service.ts,          │
│                               chat-conversation.service.ts      │
│   - review.service.ts (1275) → review-crud.service.ts,         │
│                                 review-stats.service.ts         │
│   - match.service.ts (1206) → match-crud.service.ts,           │
│                                match-workflow.service.ts        │
│   - scheduled-notification.service.ts (1151) →                 │
│                               scheduler.service.ts,             │
│                               reminder.service.ts               │
│                                                                 │
│   Frontend API:                                                 │
│   - admin/src/app/api.ts (1515) → api/auth.ts, api/bidding.ts, │
│                                    api/content.ts, api/index.ts │
│   - portal/src/api.ts (1188) → api/auth.ts, api/projects.ts,   │
│                                 api/bids.ts, api/index.ts       │
│                                                                 │
│   Types:                                                        │
│   - admin/src/app/types.ts (1134) → types/bidding.ts,          │
│                                      types/content.ts,          │
│                                      types/user.ts, types/index │
│                                                                 │
│   Components:                                                   │
│   - portal/ProfilePage.tsx (1153) → ProfileForm.tsx,           │
│                                      ProfileDocuments.tsx,      │
│                                      ProfilePreview.tsx         │
├─────────────────────────────────────────────────────────────────┤
│ 🟡 WARNING (500-1000 lines) - Phase 2                          │
│   - project.service.ts (901)                                    │
│   - escrow.service.ts (756)                                     │
│   - bid.service.ts (733)                                        │
│   - pricing.routes.ts (661)                                     │
│   - review.routes.ts (660)                                      │
│   - dispute.service.ts (656)                                    │
│   - auth.service.ts (654)                                       │
│   - notification-channel.service.ts (653)                       │
│   - ... và 20+ files khác                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Refactoring Strategy

#### 1. API Services Refactoring Pattern

```typescript
// BEFORE: chat.service.ts (1285 lines)
export const chatService = {
  // Conversation methods (500 lines)
  createConversation, getConversation, listConversations, closeConversation,
  // Message methods (500 lines)
  sendMessage, getMessages, deleteMessage, searchMessages,
  // Participant methods (285 lines)
  addParticipant, removeParticipant, markAsRead
};

// AFTER: Split into focused modules
// chat/conversation.service.ts
export const conversationService = {
  create, get, list, close
};

// chat/message.service.ts
export const messageService = {
  send, get, delete, search
};

// chat/participant.service.ts
export const participantService = {
  add, remove, markAsRead
};

// chat/index.ts (barrel export)
export * from './conversation.service';
export * from './message.service';
export * from './participant.service';

// Backward compatible export
export const chatService = {
  ...conversationService,
  ...messageService,
  ...participantService
};
```

#### 2. Frontend API Refactoring Pattern

```typescript
// BEFORE: admin/src/app/api.ts (1515 lines)
export const api = {
  // Auth (200 lines)
  login, logout, refreshToken,
  // Bidding (500 lines)
  getProjects, getBids, getMatches,
  // Content (400 lines)
  getPages, getBlog, getMedia,
  // Users (200 lines)
  getUsers, createUser,
  // Settings (215 lines)
  getSettings, updateSettings
};

// AFTER: Split by domain
// api/auth.ts
export const authApi = { login, logout, refreshToken };

// api/bidding.ts
export const biddingApi = { getProjects, getBids, getMatches };

// api/content.ts
export const contentApi = { getPages, getBlog, getMedia };

// api/users.ts
export const usersApi = { getUsers, createUser };

// api/settings.ts
export const settingsApi = { getSettings, updateSettings };

// api/index.ts (barrel export + backward compatible)
export * from './auth';
export * from './bidding';
export * from './content';
export * from './users';
export * from './settings';

export const api = {
  ...authApi,
  ...biddingApi,
  ...contentApi,
  ...usersApi,
  ...settingsApi
};
```

#### 3. Types Refactoring Pattern

```typescript
// BEFORE: admin/src/app/types.ts (1134 lines)
export interface User { ... }
export interface Project { ... }
export interface Bid { ... }
// ... 100+ types

// AFTER: Split by domain
// types/user.ts
export interface User { ... }
export interface Session { ... }

// types/bidding.ts
export interface Project { ... }
export interface Bid { ... }
export interface Match { ... }

// types/content.ts
export interface Page { ... }
export interface BlogPost { ... }

// types/index.ts (barrel export)
export * from './user';
export * from './bidding';
export * from './content';
```

#### 4. Component Refactoring Pattern

```typescript
// BEFORE: ProfilePage.tsx (1153 lines)
export function ProfilePage() {
  // Form logic (400 lines)
  // Document upload (300 lines)
  // Preview (200 lines)
  // Validation (253 lines)
}

// AFTER: Split into sub-components
// ProfilePage/ProfileForm.tsx
export function ProfileForm({ onSubmit, initialData }) { ... }

// ProfilePage/ProfileDocuments.tsx
export function ProfileDocuments({ documents, onUpload, onDelete }) { ... }

// ProfilePage/ProfilePreview.tsx
export function ProfilePreview({ profile }) { ... }

// ProfilePage/index.tsx (main component)
export function ProfilePage() {
  return (
    <div>
      <ProfileForm />
      <ProfileDocuments />
      <ProfilePreview />
    </div>
  );
}
```

## Data Models

Không thay đổi data models - chỉ refactor code organization.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File Size Compliance
*For any* refactored file, the line count should not exceed 500 lines (except test files which can be up to 800 lines)
**Validates: Requirements 1.1, 2.1, 2.2, 3.1, 4.1, 5.1**

### Property 2: Backward Compatibility
*For any* refactored module, all existing imports should continue to work without modification
**Validates: Requirements 1.3, 2.4, 3.3, 4.3**

### Property 3: Code Quality Maintenance
*For any* refactored code, lint, typecheck, and all tests should pass
**Validates: Requirements 6.1, 6.2, 6.3**

## Error Handling

- Nếu refactoring gây lỗi import → fix bằng barrel exports
- Nếu refactoring gây lỗi type → fix bằng proper type exports
- Nếu test fail → fix logic trước khi tiếp tục

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
1. File size compliance sau refactoring
2. Backward compatibility của exports
3. Code quality maintenance

