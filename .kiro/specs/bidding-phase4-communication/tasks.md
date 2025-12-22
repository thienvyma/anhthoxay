# Implementation Plan - Bidding Phase 4: Communication

## Trạng thái tổng quan
- **Prisma Models**: ✅ Hoàn thành
- **Chat Service**: ✅ Hoàn thành (service + property tests)
- **Chat Routes**: ✅ Hoàn thành
- **Notification Channel Service**: ✅ Hoàn thành
- **WebSocket**: ✅ Hoàn thành (handler + broadcasting + offline queue)
- **Email/SMS Integration**: ✅ Hoàn thành (service layer)

---

- [x] 1. Set up Prisma models for Chat System
  - [x] 1.1 Add Conversation model to schema.prisma
    - Create Conversation model with id, projectId, isClosed, closedAt, closedBy
    - Add relations to Project, ConversationParticipant, Message
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.2 Add ConversationParticipant model to schema.prisma
    - Create model with conversationId, userId, lastReadAt, isActive
    - Add unique constraint on conversation-user pair
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 1.3 Add Message model to schema.prisma
    - Create model with conversationId, senderId, content, type, attachments
    - Add isRead, readAt, isDeleted, deletedAt fields
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 1.4 Add NotificationPreference model to schema.prisma
    - Create model with userId and preference fields for email/SMS
    - Add unique constraint on userId
    - _Requirements: 9.1, 9.2_
  - [x] 1.5 Extend Notification model for multi-channel support
    - Add channels, emailSent, emailSentAt, emailError, smsSent, smsSentAt, smsError
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 1.6 Run Prisma generate and push schema
    - Execute pnpm db:generate and pnpm db:push
    - _Requirements: 1.1-1.5_

- [x] 2. Implement Chat Service
  - [x] 2.1 Create chat.schema.ts with Zod validation schemas
    - Define CreateConversationSchema, SendMessageSchema, MessageQuerySchema
    - _Requirements: 5.1, 6.1, 6.3_
  - [x] 2.2 Create chat.service.ts with conversation management
    - Implement createConversation with project status validation
    - Implement getConversation, listConversations
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3_
  - [x] 2.3 Write property test for chat precondition (Property 2)

    - **Property 2: Chat Precondition**
    - **Validates: Requirements 4.1, 4.2, 5.1**
  - [x] 2.4 Implement message management in chat.service.ts
    - Implement sendMessage, getMessages, markAsRead, deleteMessage
    - _Requirements: 6.1, 6.2, 6.4, 5.4_
  - [x] 2.5 Write property test for message participant validation (Property 3)






    - **Property 3: Message Participant Validation**
    - **Validates: Requirements 6.1**
  - [x] 2.6 Write property test for soft delete preservation (Property 6)






    - **Property 6: Soft Delete Preservation**
    - **Validates: Requirements 6.4**
  - [x] 2.7 Implement participant management
    - Implement addParticipant, removeParticipant, getParticipants
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 2.8 Write property test for participant uniqueness (Property 4)






    - **Property 4: Participant Uniqueness**
    - **Validates: Requirements 3.4**
  - [x] 2.9 Write property test for conversation access control (Property 1)






    - **Property 1: Conversation Access Control**
    - **Validates: Requirements 4.3, 4.4**
  - [x] 2.10 Write property test for message read state transition (Property 5)






    - **Property 5: Message Read State Transition**
    - **Validates: Requirements 2.5, 5.4**
  - [x]* 2.11 Write property test for attachment serialization (Property 9)
    - **Property 9: Attachment Serialization Round-trip**
    - **Validates: Requirements 2.3**
  - [x]* 2.12 Write property test for conversation listing filter (Property 10)
    - **Property 10: Conversation Listing Filter**
    - **Validates: Requirements 5.2**

- [x] 3. Checkpoint - Ensure all tests pass


  - All 432 tests pass (22 chat service property tests)
  - Lint: 0 errors
  - Typecheck: 0 errors

- [x] 4. Implement Chat API Routes





  - [x] 4.1 Create chat.routes.ts with conversation endpoints


    - POST /conversations - Create conversation
    - GET /conversations - List conversations
    - GET /conversations/:id - Get conversation with messages
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 4.2 Add message endpoints to chat.routes.ts

    - POST /conversations/:id/messages - Send message
    - GET /conversations/:id/messages - Get messages with pagination
    - PUT /conversations/:id/read - Mark as read
    - DELETE /messages/:id - Soft delete message
    - _Requirements: 6.1, 6.2, 6.4, 5.4_

  - [x] 4.3 Create admin chat routes


    - GET /admin/chat/conversations - List all conversations
    - GET /admin/chat/conversations/:id - Get conversation details
    - POST /admin/chat/conversations/:id/messages - Send system message
    - PUT /admin/chat/conversations/:id/close - Close conversation

    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  - [x] 4.4 Register chat routes in main.ts



    - Import and mount chat routes with auth middleware
    - _Requirements: 4.3, 4.4_

- [x] 5. Implement Notification Channel Service





  - [x] 5.1 Create notification-preference.schema.ts


    - Define UpdatePreferenceSchema with all preference fields
    - _Requirements: 9.2_
  - [x] 5.2 Create notification-channel.service.ts


    - Implement getPreferences, updatePreferences
    - Implement createDefaultPreferences for new users
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 5.3 Write property test for default preference creation (Property 8)






    - **Property 8: Default Preference Creation**
    - **Validates: Requirements 9.1**
  - [x] 5.4 Write property test for notification preference filtering (Property 7)






    - **Property 7: Notification Preference Filtering**
    - **Validates: Requirements 9.3, 9.4**
  - [x] 5.5 Implement send notification with channel routing


    - Implement send, sendBulk methods
    - Route to appropriate channels based on preferences
    - _Requirements: 8.1, 9.3, 9.4_
  - [x] 5.6 Implement email notification service


    - Create email templates for Vietnamese content
    - Implement sendEmail with retry logic
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 5.7 Implement SMS notification service


    - Implement sendSMS with 160 char limit
    - Add retry logic for failures
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 6. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
  - All tests pass (5 projects)
  - Lint: 0 errors
  - Typecheck: 0 errors

- [x] 7. Implement Notification Triggers





  - [x] 7.1 Add notification triggers to existing services


    - Add BID_RECEIVED trigger in bid.service.ts
    - Add BID_APPROVED trigger in bid.service.ts
    - _Requirements: 12.1, 12.2_
  - [x] 7.2 Add match notification triggers


    - Add PROJECT_MATCHED trigger in match.service.ts
    - Add ESCROW_RELEASED trigger in escrow.service.ts
    - _Requirements: 12.3, 12.5_
  - [x] 7.3 Add message notification trigger


    - Add NEW_MESSAGE trigger in chat.service.ts for offline users
    - _Requirements: 12.4_


- [x] 8. Implement Notification API Routes




  - [x] 8.1 Create notification.routes.ts


    - GET / - List notifications with pagination
    - PUT /:id/read - Mark as read
    - PUT /read-all - Mark all as read
    - _Requirements: 13.1, 13.2_
  - [x] 8.2 Add preference endpoints

    - GET /preferences - Get preferences
    - PUT /preferences - Update preferences
    - _Requirements: 13.3, 13.4_
  - [x] 8.3 Register notification routes in main.ts


    - Import and mount notification routes with auth middleware
    - _Requirements: 13.1-13.4_

- [x] 9. Implement WebSocket Handler (Optional - Real-time)



  - [x] 9.1 Create websocket/chat.handler.ts


    - Implement handleConnection with JWT auth
    - Implement handleDisconnection
    - _Requirements: 7.2, 7.3_


  - [x] 9.2 Implement message broadcasting
    - Implement broadcastToConversation
    - Implement broadcastTypingIndicator
    - _Requirements: 7.1_
  - [x] 9.3 Implement offline message queue



    - Queue messages for offline users
    - Deliver on reconnection
    - _Requirements: 7.4_

- [x] 10. Implement Notification Templates





  - [x] 10.1 Create NotificationTemplate model


    - Add model with type, subject, body, variables fields
    - Add version tracking for audit
    - _Requirements: 17.1, 17.4_
  - [x] 10.2 Implement template service


    - Create getTemplate, updateTemplate methods
    - Implement variable replacement logic
    - _Requirements: 17.2, 17.3_
  - [x] 10.3 Write property test for template variable replacement (Property 11)






    - **Property 11: Template Variable Replacement**
    - **Validates: Requirements 17.3**
  - [x] 10.4 Create admin template management UI


    - List templates by type
    - Edit template with preview
    - _Requirements: 17.1, 17.2_

- [x] 11. Implement Read Receipts







  - [x] 11.1 Add read receipt tracking to Message model


    - Add readBy JSON field for multi-participant tracking
    - _Requirements: 18.1, 18.3_
  - [x] 11.2 Implement read receipt service methods


    - Update markAsRead to track per-participant
    - Add getReadReceipts method
    - _Requirements: 18.2, 18.4_

  - [x] 11.3 Write property test for read receipt accuracy (Property 12)











    - **Property 12: Read Receipt Accuracy**
    - **Validates: Requirements 18.1, 18.3**
  - [x] 11.4 Update chat UI to display read receipts





    - Show "Đã xem" indicator with timestamp
    - _Requirements: 18.2_

- [x] 12. Implement Message Search




  - [x] 12.1 Add search endpoint to chat routes

    - GET /conversations/:id/search?q=keyword
    - _Requirements: 19.1_

  - [x] 12.2 Implement search service method
    - Full-text search on message content
    - Return messages with context
    - _Requirements: 19.1, 19.2_

  - [x] 12.3 Update chat UI with search functionality


    - Search input in conversation header
    - Highlight matching text
    - Scroll to message on click
    - _Requirements: 19.2, 19.3, 19.4_

- [x] 13. Implement Scheduled Notifications





  - [x] 13.1 Create scheduled notification job system


    - Set up background job queue (Bull/Agenda)
    - _Requirements: 20.4_
  - [x] 13.2 Implement bid deadline reminder


    - Schedule 24h before deadline
    - _Requirements: 20.1_
  - [x] 13.3 Implement no-bids reminder

    - Check projects after 3 days
    - _Requirements: 20.2_
  - [x] 13.4 Implement escrow pending reminder


    - Check pending escrows after 48h
    - _Requirements: 20.3_
  - [x] 13.5 Write property test for scheduled notification timing (Property 13)






    - **Property 13: Scheduled Notification Timing**
    - **Validates: Requirements 20.1, 20.2, 20.3**

- [x] 14. Implement Email Unsubscribe





  - [x] 14.1 Add unsubscribe token to email templates


    - Generate unique token per user
    - Include in email footer
    - _Requirements: 21.1_
  - [x] 14.2 Create unsubscribe landing page


    - Show preference options
    - Allow selective unsubscribe
    - _Requirements: 21.2, 21.3_
  - [x] 14.3 Implement unsubscribe API endpoint


    - Validate token
    - Update preferences
    - _Requirements: 21.3, 21.4_

- [x] 15. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

