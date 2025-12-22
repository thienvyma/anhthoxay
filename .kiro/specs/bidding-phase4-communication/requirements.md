# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cho Phase 4 của Bidding Marketplace: Communication. Phạm vi bao gồm:

1. **Chat System** - Hệ thống nhắn tin real-time giữa chủ nhà và nhà thầu sau khi match
2. **Notification System** - Hệ thống thông báo qua Email và SMS cho các sự kiện quan trọng
3. **Notification Preferences** - Cho phép người dùng tùy chỉnh cách nhận thông báo

Phase 4 xây dựng trên Phase 1-3, bổ sung khả năng giao tiếp trực tiếp giữa các bên sau khi đã match thành công.

**Lưu ý quan trọng**: Chat chỉ được mở sau khi Admin duyệt match. Trước đó, đôi bên không thể liên lạc trực tiếp.

## Glossary

- **Conversation**: Cuộc hội thoại giữa 2 hoặc nhiều người dùng
- **Message**: Tin nhắn trong một cuộc hội thoại
- **Participant**: Người tham gia cuộc hội thoại
- **Real-time**: Cập nhật tức thì không cần refresh trang
- **Notification**: Thông báo về sự kiện trong hệ thống
- **Notification Channel**: Kênh gửi thông báo (EMAIL, SMS, IN_APP)
- **Notification Preference**: Cài đặt nhận thông báo của người dùng
- **WebSocket**: Giao thức cho phép giao tiếp hai chiều real-time

## Requirements

### Requirement 1: Conversation Data Model

**User Story:** As a system architect, I want a Conversation model to manage chat sessions between matched parties, so that communication is organized and traceable.

#### Acceptance Criteria

1. WHEN a conversation is created THEN the system SHALL generate a unique conversation ID
2. WHEN a conversation is created THEN the system SHALL optionally associate it with a project
3. WHEN a conversation is created THEN the system SHALL track all participants
4. WHEN a conversation is updated THEN the system SHALL update the updatedAt timestamp
5. WHEN querying conversations THEN the system SHALL support filtering by participant and project

### Requirement 2: Message Data Model

**User Story:** As a system architect, I want a Message model to store chat messages, so that conversation history is preserved.

#### Acceptance Criteria

1. WHEN a message is created THEN the system SHALL associate it with a conversation and sender
2. WHEN a message is created THEN the system SHALL record the message content and type (TEXT, IMAGE, FILE, SYSTEM)
3. WHEN a message includes attachments THEN the system SHALL store attachment metadata as JSON array
4. WHEN a message is sent THEN the system SHALL record the creation timestamp
5. WHEN a message is read THEN the system SHALL update the isRead flag and readAt timestamp

### Requirement 3: Conversation Participant Model

**User Story:** As a system architect, I want a ConversationParticipant model to track who is in each conversation, so that access control is enforced.

#### Acceptance Criteria

1. WHEN a participant joins a conversation THEN the system SHALL create a participant record
2. WHEN a participant reads messages THEN the system SHALL update their lastReadAt timestamp
3. WHEN a participant leaves a conversation THEN the system SHALL set isActive to false
4. WHEN querying participants THEN the system SHALL enforce unique constraint on conversation-user pair

### Requirement 4: Chat Access Control

**User Story:** As a product owner, I want chat to only be available after match is confirmed, so that contact information is protected until appropriate.

#### Acceptance Criteria

1. WHEN a project is in MATCHED status with escrow HELD THEN the system SHALL allow creating a conversation
2. WHEN a project is NOT in MATCHED status THEN the system SHALL NOT allow creating a conversation
3. WHEN a user is NOT a participant in a conversation THEN the system SHALL return 403 Forbidden
4. WHEN an admin views conversations THEN the system SHALL allow access to all conversations for dispute resolution

### Requirement 5: Chat API - Conversation Management

**User Story:** As a matched party, I want API endpoints to manage conversations, so that I can communicate with the other party.

#### Acceptance Criteria

1. WHEN a user creates a conversation THEN the system SHALL validate the project is MATCHED with escrow HELD
2. WHEN a user lists their conversations THEN the system SHALL return only conversations they participate in
3. WHEN a user views a conversation THEN the system SHALL return messages with pagination
4. WHEN a user views a conversation THEN the system SHALL mark messages as read automatically

### Requirement 6: Chat API - Message Management

**User Story:** As a conversation participant, I want API endpoints to send and receive messages, so that I can communicate effectively.

#### Acceptance Criteria

1. WHEN a user sends a message THEN the system SHALL validate they are a participant
2. WHEN a user sends a message THEN the system SHALL broadcast to other participants via WebSocket
3. WHEN a user sends a file attachment THEN the system SHALL validate file type and size
4. WHEN a user deletes a message THEN the system SHALL soft-delete (mark as deleted, not remove)

### Requirement 7: Real-time Messaging

**User Story:** As a conversation participant, I want to receive messages in real-time, so that communication is instant.

#### Acceptance Criteria

1. WHEN a message is sent THEN the system SHALL broadcast to all online participants immediately
2. WHEN a user connects to WebSocket THEN the system SHALL authenticate using JWT token
3. WHEN a user disconnects THEN the system SHALL update their online status
4. WHEN a user is offline THEN the system SHALL queue messages for delivery when they reconnect

### Requirement 8: Notification Data Model

**User Story:** As a system architect, I want to extend the Notification model to support multiple channels, so that users can receive notifications via their preferred method.

#### Acceptance Criteria

1. WHEN a notification is created THEN the system SHALL record the target channels (EMAIL, SMS, IN_APP)
2. WHEN a notification is sent via email THEN the system SHALL record emailSent and emailSentAt
3. WHEN a notification is sent via SMS THEN the system SHALL record smsSent and smsSentAt
4. WHEN a notification fails to send THEN the system SHALL record the failure reason

### Requirement 9: Notification Preference Model

**User Story:** As a user, I want to configure my notification preferences, so that I only receive notifications I want.

#### Acceptance Criteria

1. WHEN a user registers THEN the system SHALL create default notification preferences
2. WHEN a user updates preferences THEN the system SHALL validate the preference values
3. WHEN sending a notification THEN the system SHALL respect user preferences for each channel
4. WHEN a preference is disabled THEN the system SHALL NOT send notifications via that channel

### Requirement 10: Email Notification Service

**User Story:** As a platform operator, I want to send email notifications, so that users are informed of important events.

#### Acceptance Criteria

1. WHEN an email notification is triggered THEN the system SHALL use a configured email provider (SendGrid/SES)
2. WHEN sending an email THEN the system SHALL use HTML templates with Vietnamese content
3. WHEN an email fails to send THEN the system SHALL retry up to 3 times with exponential backoff
4. WHEN an email is sent THEN the system SHALL log the delivery status

### Requirement 11: SMS Notification Service

**User Story:** As a platform operator, I want to send SMS notifications for critical events, so that users are notified immediately.

#### Acceptance Criteria

1. WHEN an SMS notification is triggered THEN the system SHALL use a configured SMS provider (Twilio/local provider)
2. WHEN sending an SMS THEN the system SHALL format the message within 160 characters
3. WHEN an SMS fails to send THEN the system SHALL retry up to 3 times
4. WHEN an SMS is sent THEN the system SHALL log the delivery status and cost

### Requirement 12: Notification Triggers

**User Story:** As a product owner, I want notifications to be sent automatically for key events, so that users stay informed.

#### Acceptance Criteria

1. WHEN a bid is received THEN the system SHALL notify the homeowner via configured channels
2. WHEN a bid is approved THEN the system SHALL notify the contractor via EMAIL and SMS
3. WHEN a project is matched THEN the system SHALL notify both parties via EMAIL and SMS
4. WHEN a new message is received THEN the system SHALL notify the recipient if offline
5. WHEN escrow is released THEN the system SHALL notify both parties via EMAIL and SMS

### Requirement 13: Notification API

**User Story:** As a user, I want API endpoints to manage my notifications, so that I can stay informed and control my preferences.

#### Acceptance Criteria

1. WHEN a user lists notifications THEN the system SHALL return paginated results with unread count
2. WHEN a user marks notifications as read THEN the system SHALL update the isRead flag
3. WHEN a user updates preferences THEN the system SHALL validate and save the new settings
4. WHEN a user views preferences THEN the system SHALL return current settings for all channels

### Requirement 14: Admin Chat Management

**User Story:** As an admin, I want to view and manage conversations, so that I can resolve disputes and monitor communication.

#### Acceptance Criteria

1. WHEN an admin lists conversations THEN the system SHALL return all conversations with filters
2. WHEN an admin views a conversation THEN the system SHALL return full message history
3. WHEN an admin sends a system message THEN the system SHALL mark it as type SYSTEM
4. WHEN an admin closes a conversation THEN the system SHALL prevent further messages

### Requirement 15: Chat UI Components

**User Story:** As a user, I want a chat interface in the portal, so that I can communicate with matched parties.

#### Acceptance Criteria

1. WHEN a user opens chat THEN the system SHALL display conversation list with unread counts
2. WHEN a user selects a conversation THEN the system SHALL display message history with infinite scroll
3. WHEN a user types a message THEN the system SHALL show typing indicator to other participants
4. WHEN a user receives a message THEN the system SHALL show notification badge and play sound

### Requirement 16: Notification UI Components

**User Story:** As a user, I want a notification center in the portal, so that I can view and manage my notifications.

#### Acceptance Criteria

1. WHEN a user opens notification center THEN the system SHALL display notifications grouped by date
2. WHEN a user clicks a notification THEN the system SHALL navigate to the relevant page
3. WHEN a user has unread notifications THEN the system SHALL show badge count in header
4. WHEN a user opens preferences THEN the system SHALL display toggles for each notification type

### Requirement 17: Notification Templates

**User Story:** As an admin, I want to manage notification templates, so that messages are consistent and professional.

#### Acceptance Criteria

1. WHEN sending a notification THEN the system SHALL use predefined templates for each notification type
2. WHEN an admin edits a template THEN the system SHALL support Vietnamese content with variables
3. WHEN a template includes variables THEN the system SHALL replace them with actual values (projectCode, contractorName, etc.)
4. WHEN a template is updated THEN the system SHALL version the template for audit trail

### Requirement 18: Read Receipts

**User Story:** As a user, I want to see when my messages are read, so that I know the other party received them.

#### Acceptance Criteria

1. WHEN a message is read by recipient THEN the system SHALL update read status in database
2. WHEN displaying messages THEN the system SHALL show "Đã xem" indicator with timestamp
3. WHEN multiple participants exist THEN the system SHALL show read status per participant
4. WHEN sender views conversation THEN the system SHALL display read receipts for their messages

### Requirement 19: Message Search

**User Story:** As a user, I want to search messages in a conversation, so that I can find important information.

#### Acceptance Criteria

1. WHEN a user searches in conversation THEN the system SHALL search message content
2. WHEN displaying search results THEN the system SHALL highlight matching text
3. WHEN a user clicks a result THEN the system SHALL scroll to that message in conversation
4. WHEN no results found THEN the system SHALL display appropriate message

### Requirement 20: Scheduled Notifications

**User Story:** As a platform operator, I want to schedule notifications, so that users receive timely reminders.

#### Acceptance Criteria

1. WHEN a bid deadline approaches (24h) THEN the system SHALL send reminder to homeowner
2. WHEN a project has no bids after 3 days THEN the system SHALL notify homeowner with suggestions
3. WHEN escrow is pending for 48h THEN the system SHALL remind homeowner to complete payment
4. WHEN scheduling notification THEN the system SHALL use background job queue

### Requirement 21: Email Unsubscribe

**User Story:** As a user, I want to unsubscribe from emails easily, so that I control what I receive.

#### Acceptance Criteria

1. WHEN sending email THEN the system SHALL include unsubscribe link in footer
2. WHEN user clicks unsubscribe THEN the system SHALL show preference page
3. WHEN user unsubscribes THEN the system SHALL update preferences immediately
4. WHEN user unsubscribes from all THEN the system SHALL still send critical notifications (escrow, match)
