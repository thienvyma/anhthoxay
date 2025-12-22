/**
 * Chat Zod Schemas
 *
 * Validation schemas for chat/conversation operations.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 5.1, 6.1, 6.3**
 */

import { z } from 'zod';

// ============================================
// MESSAGE TYPE ENUM
// ============================================

/**
 * Message type enum
 * Requirements: 2.2 - Support TEXT, IMAGE, FILE, SYSTEM types
 */
export const messageTypeEnum = z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']);
export type MessageType = z.infer<typeof messageTypeEnum>;

// ============================================
// ATTACHMENT SCHEMA
// ============================================

/**
 * Schema for message attachment
 * Requirements: 2.3 - Store attachment metadata as JSON array
 */
export const AttachmentSchema = z.object({
  name: z.string().min(1, 'Tên file không được để trống').max(255),
  url: z.string().url('URL không hợp lệ'),
  type: z.string().min(1, 'Loại file không được để trống'),
  size: z.number().int().positive('Kích thước file phải lớn hơn 0'),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

// ============================================
// CREATE CONVERSATION SCHEMA
// ============================================

/**
 * Schema for creating a new conversation
 * Requirements: 5.1 - Validate project is MATCHED with escrow HELD
 */
export const CreateConversationSchema = z.object({
  projectId: z.string().min(1, 'ID công trình không được để trống'),
});
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;

// ============================================
// SEND MESSAGE SCHEMA
// ============================================

/**
 * Schema for sending a message
 * Requirements: 6.1 - Validate sender is participant
 * Requirements: 6.3 - Validate file type and size
 */
export const SendMessageSchema = z.object({
  content: z.string()
    .min(1, 'Nội dung tin nhắn không được để trống')
    .max(5000, 'Nội dung tin nhắn tối đa 5000 ký tự'),
  type: messageTypeEnum.default('TEXT'),
  attachments: z.array(AttachmentSchema)
    .max(5, 'Tối đa 5 file đính kèm')
    .optional(),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

// ============================================
// MESSAGE QUERY SCHEMA
// ============================================

/**
 * Schema for querying messages in a conversation
 * Requirements: 5.3 - Return messages with pagination
 */
export const MessageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().datetime().optional(), // For cursor-based pagination
  after: z.string().datetime().optional(),
});
export type MessageQuery = z.infer<typeof MessageQuerySchema>;

// ============================================
// CONVERSATION QUERY SCHEMA
// ============================================

/**
 * Schema for querying conversations
 * Requirements: 5.2 - Return only conversations user participates in
 */
export const ConversationQuerySchema = z.object({
  projectId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ConversationQuery = z.infer<typeof ConversationQuerySchema>;

// ============================================
// ADMIN CONVERSATION QUERY SCHEMA
// ============================================

/**
 * Schema for admin querying all conversations
 * Requirements: 14.1 - Return all conversations with filters
 */
export const AdminConversationQuerySchema = z.object({
  projectId: z.string().optional(),
  userId: z.string().optional(),
  isClosed: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminConversationQuery = z.infer<typeof AdminConversationQuerySchema>;

// ============================================
// ADMIN SEND SYSTEM MESSAGE SCHEMA
// ============================================

/**
 * Schema for admin sending system message
 * Requirements: 14.3 - Mark message as type SYSTEM
 */
export const AdminSendSystemMessageSchema = z.object({
  content: z.string()
    .min(1, 'Nội dung tin nhắn không được để trống')
    .max(2000, 'Nội dung tin nhắn tối đa 2000 ký tự'),
});
export type AdminSendSystemMessageInput = z.infer<typeof AdminSendSystemMessageSchema>;

// ============================================
// CLOSE CONVERSATION SCHEMA
// ============================================

/**
 * Schema for closing a conversation
 * Requirements: 14.4 - Prevent further messages
 */
export const CloseConversationSchema = z.object({
  reason: z.string()
    .max(500, 'Lý do tối đa 500 ký tự')
    .optional(),
});
export type CloseConversationInput = z.infer<typeof CloseConversationSchema>;

// ============================================
// SEARCH MESSAGES SCHEMA
// ============================================

/**
 * Schema for searching messages in a conversation
 * Requirements: 19.1 - Search message content
 */
export const SearchMessagesSchema = z.object({
  q: z.string().min(1, 'Từ khóa tìm kiếm không được để trống').max(100),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchMessagesQuery = z.infer<typeof SearchMessagesSchema>;

// ============================================
// READ RECEIPT SCHEMA
// ============================================

/**
 * Schema for read receipt response
 * Requirements: 18.2, 18.4 - Show read status per participant
 */
export const ReadReceiptSchema = z.object({
  userId: z.string(),
  readAt: z.string().datetime(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().nullable(),
  }).optional(),
});
export type ReadReceipt = z.infer<typeof ReadReceiptSchema>;

