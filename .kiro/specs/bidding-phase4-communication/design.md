# Design Document - Bidding Phase 4: Communication

## Overview

Phase 4 bổ sung hệ thống giao tiếp cho nền tảng đấu giá, bao gồm:

1. **Chat System** - Nhắn tin real-time giữa chủ nhà và nhà thầu sau khi match
2. **Notification System** - Thông báo qua Email, SMS và In-app
3. **Notification Preferences** - Cài đặt nhận thông báo

### Key Features
1. **Conversation Management** - Tạo và quản lý cuộc hội thoại
2. **Real-time Messaging** - Gửi/nhận tin nhắn tức thì qua WebSocket
3. **File Attachments** - Đính kèm file trong tin nhắn
4. **Multi-channel Notifications** - Email, SMS, In-app
5. **User Preferences** - Tùy chỉnh cách nhận thông báo

**Lưu ý**: Chat chỉ mở sau khi Admin duyệt match (escrow HELD).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMMUNICATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER A                    SERVER                      USER B            │
│  ──────                    ──────                      ──────            │
│                                                                          │
│  1. Connect WebSocket ────► Authenticate JWT                            │
│                             Store connection                             │
│                                                                          │
│  2. Send message ─────────► Validate participant                        │
│                             Save to database                             │
│                             Broadcast ──────────────► Receive message   │
│                                                                          │
│  3. Mark as read ─────────► Update isRead flag                          │
│                             Update lastReadAt                            │
│                                                                          │
│  ═══════════════════════ NOTIFICATION FLOW ═══════════════════════════  │
│                                                                          │
│  EVENT TRIGGER ──────────► Check user preferences                       │
│  (bid_received,            │                                             │
│   project_matched,         ├─► IN_APP: Create notification record       │
│   new_message)             ├─► EMAIL: Queue email job                   │
│                            └─► SMS: Queue SMS job                       │
│                                                                          │
│  EMAIL WORKER ───────────► SendGrid/SES API ─────────► User inbox       │
│  SMS WORKER ─────────────► Twilio/Local API ─────────► User phone       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Chat Service (`api/src/services/chat.service.ts`)

```typescript
interface ChatService {
  // Conversation Management
  createConversation(projectId: string, userId: string): Promise<Conversation>;
  getConversation(id: string, userId: string): Promise<ConversationWithMessages>;
  listConversations(userId: string, query: ConversationQuery): Promise<PaginatedResult<Conversation>>;
  
  // Message Management
  sendMessage(conversationId: string, senderId: string, data: SendMessageInput): Promise<Message>;
  getMessages(conversationId: string, userId: string, query: MessageQuery): Promise<PaginatedResult<Message>>;
  markAsRead(conversationId: string, userId: string): Promise<void>;
  deleteMessage(messageId: string, userId: string): Promise<Message>;
  
  // Participant Management
  addParticipant(conversationId: string, userId: string): Promise<ConversationParticipant>;
  removeParticipant(conversationId: string, userId: string): Promise<void>;
  getParticipants(conversationId: string): Promise<ConversationParticipant[]>;
}

interface SendMessageInput {
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  attachments?: Attachment[];
}

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}
```

### 2. WebSocket Handler (`api/src/websocket/chat.handler.ts`)

```typescript
interface WebSocketHandler {
  // Connection Management
  handleConnection(ws: WebSocket, token: string): Promise<void>;
  handleDisconnection(userId: string): void;
  
  // Message Broadcasting
  broadcastToConversation(conversationId: string, message: Message, excludeUserId?: string): void;
  broadcastTypingIndicator(conversationId: string, userId: string, isTyping: boolean): void;
  
  // Online Status
  getOnlineUsers(conversationId: string): string[];
  isUserOnline(userId: string): boolean;
}
```

### 3. Notification Service (`api/src/services/notification-channel.service.ts`)

```typescript
interface NotificationChannelService {
  // Send Notifications
  send(userId: string, notification: NotificationInput): Promise<void>;
  sendBulk(userIds: string[], notification: NotificationInput): Promise<void>;
  
  // Channel-specific
  sendEmail(userId: string, template: string, data: Record<string, unknown>): Promise<void>;
  sendSMS(userId: string, message: string): Promise<void>;
  sendInApp(userId: string, notification: CreateNotificationInput): Promise<void>;
  
  // Preferences
  getPreferences(userId: string): Promise<NotificationPreference>;
  updatePreferences(userId: string, data: UpdatePreferenceInput): Promise<NotificationPreference>;
}

interface NotificationInput {
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  channels?: ('EMAIL' | 'SMS' | 'IN_APP')[];
}
```

### 4. API Routes

#### Chat Routes (`/api/chat`)
```
POST /conversations              - Create conversation for matched project
GET  /conversations              - List user's conversations
GET  /conversations/:id          - Get conversation with messages
POST /conversations/:id/messages - Send message
GET  /conversations/:id/messages - Get messages with pagination
PUT  /conversations/:id/read     - Mark messages as read
DELETE /messages/:id             - Delete (soft) a message
```

#### Notification Routes (`/api/notifications`)
```
GET  /                           - List user's notifications
PUT  /:id/read                   - Mark notification as read
PUT  /read-all                   - Mark all as read
GET  /preferences                - Get notification preferences
PUT  /preferences                - Update notification preferences
```

#### Admin Chat Routes (`/api/admin/chat`)
```
GET  /conversations              - List all conversations
GET  /conversations/:id          - Get conversation details
POST /conversations/:id/messages - Send system message
PUT  /conversations/:id/close    - Close conversation
```

## Data Models

### Conversation Model

```prisma
model Conversation {
  id            String   @id @default(cuid())
  projectId     String?  // Optional link to project
  project       Project? @relation(fields: [projectId], references: [id])
  
  participants  ConversationParticipant[]
  messages      Message[]
  
  isClosed      Boolean  @default(false)
  closedAt      DateTime?
  closedBy      String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([projectId])
}
```

### ConversationParticipant Model

```prisma
model ConversationParticipant {
  id              String       @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  userId          String
  user            User         @relation(fields: [userId], references: [id])
  
  lastReadAt      DateTime?
  isActive        Boolean      @default(true)
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@unique([conversationId, userId])
  @@index([userId])
}
```

### Message Model

```prisma
model Message {
  id              String       @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  senderId        String
  sender          User         @relation(fields: [senderId], references: [id])
  
  content         String
  type            String       @default("TEXT") // TEXT, IMAGE, FILE, SYSTEM
  attachments     String?      // JSON: [{name, url, type, size}]
  
  isRead          Boolean      @default(false)
  readAt          DateTime?
  isDeleted       Boolean      @default(false)
  deletedAt       DateTime?
  
  createdAt       DateTime     @default(now())
  
  @@index([conversationId])
  @@index([senderId])
  @@index([createdAt])
}
```

### NotificationPreference Model

```prisma
model NotificationPreference {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  
  // Email notifications
  emailEnabled        Boolean @default(true)
  emailBidReceived    Boolean @default(true)
  emailBidApproved    Boolean @default(true)
  emailProjectMatched Boolean @default(true)
  emailNewMessage     Boolean @default(true)
  emailEscrowReleased Boolean @default(true)
  
  // SMS notifications
  smsEnabled          Boolean @default(true)
  smsBidReceived      Boolean @default(false)
  smsBidApproved      Boolean @default(true)
  smsProjectMatched   Boolean @default(true)
  smsNewMessage       Boolean @default(false)
  smsEscrowReleased   Boolean @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Extended Notification Model

```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  type        String
  title       String
  content     String
  data        String?  // JSON
  
  // Channels
  channels    String   // JSON: ["EMAIL", "SMS", "IN_APP"]
  
  // Delivery status
  isRead      Boolean  @default(false)
  readAt      DateTime?
  
  emailSent   Boolean  @default(false)
  emailSentAt DateTime?
  emailError  String?
  
  smsSent     Boolean  @default(false)
  smsSentAt   DateTime?
  smsError    String?
  
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([isRead])
  @@index([type])
}
```

### NotificationTemplate Model

```prisma
model NotificationTemplate {
  id          String   @id @default(cuid())
  type        String   @unique // BID_RECEIVED, PROJECT_MATCHED, etc.
  
  // Email template
  emailSubject String
  emailBody    String   // HTML with variables like {{projectCode}}
  
  // SMS template
  smsBody      String   // Plain text, max 160 chars
  
  // In-app template
  inAppTitle   String
  inAppBody    String
  
  // Variables available
  variables    String   // JSON: ["projectCode", "contractorName", "price"]
  
  // Versioning
  version      Int      @default(1)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### ScheduledNotification Model

```prisma
model ScheduledNotification {
  id          String   @id @default(cuid())
  
  type        String   // BID_DEADLINE_REMINDER, NO_BIDS_REMINDER, ESCROW_PENDING
  userId      String
  
  // Reference
  projectId   String?
  escrowId    String?
  
  // Scheduling
  scheduledFor DateTime
  status       String   @default("PENDING") // PENDING, SENT, CANCELLED
  
  sentAt       DateTime?
  cancelledAt  DateTime?
  
  createdAt    DateTime @default(now())
  
  @@index([status, scheduledFor])
  @@index([userId])
}
```

### Extended Message Model (Read Receipts)

```prisma
model Message {
  // ... existing fields
  
  // Read receipts per participant
  readBy      String?  // JSON: [{ oderId, readAt }]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Conversation Access Control
*For any* conversation and user, the user can only access the conversation if they are a participant or an admin.
**Validates: Requirements 4.3, 4.4**

### Property 2: Chat Precondition
*For any* project, a conversation can only be created if the project status is MATCHED and escrow status is HELD.
**Validates: Requirements 4.1, 4.2, 5.1**

### Property 3: Message Participant Validation
*For any* message send attempt, the sender must be an active participant in the conversation.
**Validates: Requirements 6.1**

### Property 4: Participant Uniqueness
*For any* conversation, each user can only be a participant once (unique constraint on conversation-user pair).
**Validates: Requirements 3.4**

### Property 5: Message Read State Transition
*For any* message, marking as read should update both isRead flag to true and set readAt timestamp.
**Validates: Requirements 2.5, 5.4**

### Property 6: Soft Delete Preservation
*For any* deleted message, the message should remain in database with isDeleted=true and deletedAt set.
**Validates: Requirements 6.4**

### Property 7: Notification Preference Filtering
*For any* notification send, if a channel is disabled in user preferences, the notification should not be sent via that channel.
**Validates: Requirements 9.3, 9.4**

### Property 8: Default Preference Creation
*For any* new user registration, default notification preferences should be created automatically.
**Validates: Requirements 9.1**

### Property 9: Attachment Serialization Round-trip
*For any* message with attachments, serializing then deserializing the attachments should produce equivalent data.
**Validates: Requirements 2.3**

### Property 10: Conversation Listing Filter
*For any* user listing their conversations, only conversations where they are an active participant should be returned.
**Validates: Requirements 5.2**

### Property 11: Template Variable Replacement
*For any* notification template with variables, all variables should be replaced with actual values before sending.
**Validates: Requirements 17.3**

### Property 12: Read Receipt Accuracy
*For any* message marked as read, the read status should reflect the actual read state per participant.
**Validates: Requirements 18.1, 18.3**

### Property 13: Scheduled Notification Timing
*For any* scheduled notification, it should be sent within the specified time window (e.g., 24h before deadline).
**Validates: Requirements 20.1, 20.2, 20.3**

## Error Handling

### Chat Errors
```typescript
class ChatError extends Error {
  constructor(
    public code: ChatErrorCode,
    message: string,
    public statusCode?: number
  ) {
    super(message);
  }
}

type ChatErrorCode =
  | 'CONVERSATION_NOT_FOUND'
  | 'MESSAGE_NOT_FOUND'
  | 'NOT_PARTICIPANT'
  | 'CONVERSATION_CLOSED'
  | 'PROJECT_NOT_MATCHED'
  | 'ESCROW_NOT_HELD'
  | 'INVALID_MESSAGE_TYPE'
  | 'ATTACHMENT_TOO_LARGE'
  | 'INVALID_ATTACHMENT_TYPE';
```

### HTTP Error Responses
| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| CONVERSATION_NOT_FOUND | 404 | Conversation không tồn tại |
| MESSAGE_NOT_FOUND | 404 | Message không tồn tại |
| NOT_PARTICIPANT | 403 | User không phải participant |
| CONVERSATION_CLOSED | 400 | Conversation đã đóng |
| PROJECT_NOT_MATCHED | 400 | Project chưa match |
| ESCROW_NOT_HELD | 400 | Escrow chưa được xác nhận |

## Testing Strategy

### Property-Based Testing Library
- **Library**: fast-check
- **Minimum iterations**: 100 per property test

### Unit Tests
- Chat service methods
- Notification service methods
- Preference validation
- Access control checks

### Property-Based Tests
Each correctness property will be implemented as a property-based test:

1. **Property 1**: Generate random users and conversations, verify access control
2. **Property 2**: Generate projects with various statuses, verify chat creation rules
3. **Property 3**: Generate message send attempts, verify participant validation
4. **Property 4**: Generate participant additions, verify uniqueness constraint
5. **Property 5**: Generate read operations, verify state transitions
6. **Property 6**: Generate delete operations, verify soft-delete behavior
7. **Property 7**: Generate notifications with various preferences, verify filtering
8. **Property 8**: Generate user registrations, verify default preferences
9. **Property 9**: Generate attachments, verify serialization round-trip
10. **Property 10**: Generate conversation listings, verify participant filtering

### Test File Structure
```
api/src/services/
├── chat.service.ts
├── chat.service.property.test.ts
├── notification-channel.service.ts
└── notification-channel.service.property.test.ts
```

### Test Annotations
Each property-based test must include:
```typescript
/**
 * **Feature: bidding-phase4-communication, Property 1: Conversation Access Control**
 * **Validates: Requirements 4.3, 4.4**
 */
```
