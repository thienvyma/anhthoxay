/**
 * Property-Based Tests for Chat Service
 *
 * **Feature: bidding-phase4-communication**
 * **Properties: 1-6, 9-10**
 */

import * as fc from 'fast-check';
import { describe, it } from 'vitest';

// ============================================
// Type Definitions (isolated for testing)
// ============================================

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ReadReceipt {
  userId: string;
  readAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  attachments: Attachment[];
  isRead: boolean;
  readAt: Date | null;
  readBy: ReadReceipt[];
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
}

interface Participant {
  id: string;
  conversationId: string;
  userId: string;
  isActive: boolean;
  lastReadAt: Date | null;
}

interface Conversation {
  id: string;
  projectId: string | null;
  isClosed: boolean;
  participants: Participant[];
  messages: Message[];
}

interface Project {
  id: string;
  status: string;
  ownerId: string;
  selectedBidContractorId: string | null;
  escrowStatus: string | null;
}

// ============================================
// Business Logic (isolated for testing)
// ============================================

const VALID_PROJECT_STATUSES_FOR_CHAT = ['MATCHED', 'IN_PROGRESS'];
const VALID_ESCROW_STATUS_FOR_CHAT = 'HELD';

function canCreateConversation(
  project: Project,
  userId: string
): { allowed: boolean; reason?: string } {
  // Check project status
  if (!VALID_PROJECT_STATUSES_FOR_CHAT.includes(project.status)) {
    return { allowed: false, reason: 'PROJECT_NOT_MATCHED' };
  }

  // Check escrow status
  if (project.escrowStatus !== VALID_ESCROW_STATUS_FOR_CHAT) {
    return { allowed: false, reason: 'ESCROW_NOT_HELD' };
  }

  // Check user is participant (homeowner or contractor)
  const isHomeowner = project.ownerId === userId;
  const isContractor = project.selectedBidContractorId === userId;

  if (!isHomeowner && !isContractor) {
    return { allowed: false, reason: 'NOT_PARTICIPANT' };
  }

  return { allowed: true };
}


function canAccessConversation(
  conversation: Conversation,
  userId: string,
  isAdmin: boolean
): boolean {
  // Admin can access all conversations
  if (isAdmin) {
    return true;
  }

  // User must be active participant
  return conversation.participants.some(
    (p) => p.userId === userId && p.isActive
  );
}

function canSendMessage(
  conversation: Conversation,
  senderId: string
): { allowed: boolean; reason?: string } {
  // Check conversation is not closed
  if (conversation.isClosed) {
    return { allowed: false, reason: 'CONVERSATION_CLOSED' };
  }

  // Check sender is active participant
  const isParticipant = conversation.participants.some(
    (p) => p.userId === senderId && p.isActive
  );

  if (!isParticipant) {
    return { allowed: false, reason: 'NOT_PARTICIPANT' };
  }

  return { allowed: true };
}

function markMessageAsRead(
  message: Message,
  userId: string
): Message {
  // Don't mark own messages as read
  if (message.senderId === userId) {
    return message;
  }

  const now = new Date();
  const readBy = [...message.readBy];

  // Check if already read by this user
  if (!readBy.some((r) => r.userId === userId)) {
    readBy.push({ userId, readAt: now.toISOString() });
  }

  return {
    ...message,
    isRead: true,
    readAt: now,
    readBy,
  };
}

function softDeleteMessage(
  message: Message,
  userId: string
): { success: boolean; message?: Message; reason?: string } {
  // Only sender can delete their own message
  if (message.senderId !== userId) {
    return { success: false, reason: 'NOT_SENDER' };
  }

  return {
    success: true,
    message: {
      ...message,
      isDeleted: true,
      deletedAt: new Date(),
    },
  };
}

function serializeAttachments(attachments: Attachment[]): string {
  return JSON.stringify(attachments);
}

function deserializeAttachments(json: string): Attachment[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function filterConversationsForUser(
  conversations: Conversation[],
  userId: string
): Conversation[] {
  return conversations.filter((c) =>
    c.participants.some((p) => p.userId === userId && p.isActive)
  );
}


// ============================================
// Generators
// ============================================

const userId = fc.uuid();

const projectStatus = fc.constantFrom(
  'DRAFT',
  'PENDING_APPROVAL',
  'REJECTED',
  'OPEN',
  'BIDDING_CLOSED',
  'MATCHED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

const escrowStatus = fc.constantFrom(
  'PENDING',
  'HELD',
  'PARTIAL_RELEASED',
  'RELEASED',
  'REFUNDED',
  'DISPUTED',
  'CANCELLED',
  null
);

const project = fc.record({
  id: fc.uuid(),
  status: projectStatus,
  ownerId: userId,
  selectedBidContractorId: fc.option(userId, { nil: null }),
  escrowStatus: escrowStatus,
});

// Use a constrained date range to avoid invalid dates - use integer timestamps
const validDate = fc
  .integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
  .map((ts) => new Date(ts));

const participant = fc.record({
  id: fc.uuid(),
  conversationId: fc.uuid(),
  userId: userId,
  isActive: fc.boolean(),
  lastReadAt: fc.option(validDate, { nil: null }),
});

const attachment = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  url: fc.webUrl(),
  type: fc.constantFrom('image/png', 'image/jpeg', 'application/pdf', 'text/plain'),
  size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }), // Max 10MB
});

const readReceipt = fc.record({
  userId: userId,
  readAt: validDate.map((d) => d.toISOString()),
});

const message = fc.record({
  id: fc.uuid(),
  conversationId: fc.uuid(),
  senderId: userId,
  content: fc.string({ minLength: 1, maxLength: 5000 }),
  type: fc.constantFrom('TEXT', 'IMAGE', 'FILE', 'SYSTEM'),
  attachments: fc.array(attachment, { maxLength: 5 }),
  isRead: fc.boolean(),
  readAt: fc.option(validDate, { nil: null }),
  readBy: fc.array(readReceipt, { maxLength: 10 }),
  isDeleted: fc.boolean(),
  deletedAt: fc.option(validDate, { nil: null }),
  createdAt: validDate,
});

const conversation = fc.record({
  id: fc.uuid(),
  projectId: fc.option(fc.uuid(), { nil: null }),
  isClosed: fc.boolean(),
  participants: fc.array(participant, { minLength: 1, maxLength: 5 }),
  messages: fc.array(message, { maxLength: 50 }),
});


// ============================================
// PROPERTY 2: Chat Precondition
// Requirements: 4.1, 4.2, 5.1
// ============================================

describe('Property 2: Chat Precondition', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 2: Chat Precondition**
   * **Validates: Requirements 4.1, 4.2, 5.1**
   */

  it('should only allow conversation creation when project is MATCHED or IN_PROGRESS', () => {
    fc.assert(
      fc.property(project, userId, (proj, uid) => {
        const result = canCreateConversation(proj, uid);

        if (VALID_PROJECT_STATUSES_FOR_CHAT.includes(proj.status)) {
          // If status is valid, check other conditions
          if (proj.escrowStatus !== VALID_ESCROW_STATUS_FOR_CHAT) {
            return result.reason === 'ESCROW_NOT_HELD';
          }
          // Status and escrow valid, check participant
          const isParticipant =
            proj.ownerId === uid || proj.selectedBidContractorId === uid;
          if (!isParticipant) {
            return result.reason === 'NOT_PARTICIPANT';
          }
          return result.allowed === true;
        } else {
          // Invalid status should fail
          return result.reason === 'PROJECT_NOT_MATCHED';
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should require escrow status to be HELD', () => {
    fc.assert(
      fc.property(
        project.filter(
          (p) =>
            VALID_PROJECT_STATUSES_FOR_CHAT.includes(p.status) &&
            p.escrowStatus !== VALID_ESCROW_STATUS_FOR_CHAT
        ),
        userId,
        (proj, uid) => {
          const result = canCreateConversation(proj, uid);
          return result.reason === 'ESCROW_NOT_HELD';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only allow homeowner or contractor to create conversation', () => {
    fc.assert(
      fc.property(
        project.filter(
          (p) =>
            VALID_PROJECT_STATUSES_FOR_CHAT.includes(p.status) &&
            p.escrowStatus === VALID_ESCROW_STATUS_FOR_CHAT
        ),
        userId,
        (proj, uid) => {
          const result = canCreateConversation(proj, uid);
          const isParticipant =
            proj.ownerId === uid || proj.selectedBidContractorId === uid;

          if (isParticipant) {
            return result.allowed === true;
          } else {
            return result.reason === 'NOT_PARTICIPANT';
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 1: Conversation Access Control
// Requirements: 4.3, 4.4
// ============================================

describe('Property 1: Conversation Access Control', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 1: Conversation Access Control**
   * **Validates: Requirements 4.3, 4.4**
   */

  it('should allow admin to access any conversation', () => {
    fc.assert(
      fc.property(conversation, userId, (conv, uid) => {
        const canAccess = canAccessConversation(conv, uid, true);
        return canAccess === true;
      }),
      { numRuns: 100 }
    );
  });

  it('should only allow active participants to access conversation', () => {
    fc.assert(
      fc.property(conversation, userId, (conv, uid) => {
        const canAccess = canAccessConversation(conv, uid, false);
        const isActiveParticipant = conv.participants.some(
          (p) => p.userId === uid && p.isActive
        );
        return canAccess === isActiveParticipant;
      }),
      { numRuns: 100 }
    );
  });

  it('should deny access to inactive participants', () => {
    fc.assert(
      fc.property(
        conversation.chain((conv) => {
          // Ensure at least one inactive participant
          if (conv.participants.length === 0) {
            return fc.constant({
              conv,
              inactiveUserId: fc.sample(userId, 1)[0],
            });
          }
          const inactiveParticipant = conv.participants.find((p) => !p.isActive);
          if (inactiveParticipant) {
            return fc.constant({
              conv,
              inactiveUserId: inactiveParticipant.userId,
            });
          }
          // Make first participant inactive
          const modifiedConv = {
            ...conv,
            participants: conv.participants.map((p, i) =>
              i === 0 ? { ...p, isActive: false } : p
            ),
          };
          return fc.constant({
            conv: modifiedConv,
            inactiveUserId: conv.participants[0].userId,
          });
        }),
        ({ conv, inactiveUserId }) => {
          const canAccess = canAccessConversation(conv, inactiveUserId, false);
          const isActiveParticipant = conv.participants.some(
            (p) => p.userId === inactiveUserId && p.isActive
          );
          return canAccess === isActiveParticipant;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 3: Message Participant Validation
// Requirements: 6.1
// ============================================

describe('Property 3: Message Participant Validation', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 3: Message Participant Validation**
   * **Validates: Requirements 6.1**
   */

  it('should only allow active participants to send messages', () => {
    fc.assert(
      fc.property(
        conversation.filter((c) => !c.isClosed),
        userId,
        (conv, senderId) => {
          const result = canSendMessage(conv, senderId);
          const isActiveParticipant = conv.participants.some(
            (p) => p.userId === senderId && p.isActive
          );

          if (isActiveParticipant) {
            return result.allowed === true;
          } else {
            return result.reason === 'NOT_PARTICIPANT';
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not allow messages in closed conversations', () => {
    fc.assert(
      fc.property(
        conversation.filter((c) => c.isClosed),
        userId,
        (conv, senderId) => {
          const result = canSendMessage(conv, senderId);
          return result.reason === 'CONVERSATION_CLOSED';
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 4: Participant Uniqueness
// Requirements: 3.4
// ============================================

/**
 * Business logic for participant uniqueness testing
 * 
 * Requirements:
 * - 3.4: WHEN querying participants THEN the system SHALL enforce unique constraint on conversation-user pair
 */

interface ParticipantState {
  conversationId: string;
  participants: Map<string, { isActive: boolean }>;
}

type AddParticipantResult =
  | { success: true; action: 'created' | 'reactivated' }
  | { success: false; reason: 'PARTICIPANT_EXISTS' };

/**
 * Simulates the addParticipant business logic
 * - If user not in conversation: add them (success: created)
 * - If user in conversation but inactive: reactivate (success: reactivated)
 * - If user in conversation and active: reject (PARTICIPANT_EXISTS)
 */
function addParticipantToConversation(
  state: ParticipantState,
  userId: string
): { result: AddParticipantResult; newState: ParticipantState } {
  const existing = state.participants.get(userId);

  if (existing) {
    if (!existing.isActive) {
      // Reactivate inactive participant
      const newParticipants = new Map(state.participants);
      newParticipants.set(userId, { isActive: true });
      return {
        result: { success: true, action: 'reactivated' },
        newState: { ...state, participants: newParticipants },
      };
    }
    // Already active participant - reject
    return {
      result: { success: false, reason: 'PARTICIPANT_EXISTS' },
      newState: state,
    };
  }

  // New participant - add them
  const newParticipants = new Map(state.participants);
  newParticipants.set(userId, { isActive: true });
  return {
    result: { success: true, action: 'created' },
    newState: { ...state, participants: newParticipants },
  };
}

/**
 * Count active participants in a conversation
 */
function countActiveParticipants(state: ParticipantState): number {
  let count = 0;
  state.participants.forEach((p) => {
    if (p.isActive) count++;
  });
  return count;
}

/**
 * Check if a user is an active participant
 */
function isActiveParticipant(state: ParticipantState, userId: string): boolean {
  const participant = state.participants.get(userId);
  return participant !== undefined && participant.isActive;
}

describe('Property 4: Participant Uniqueness', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 4: Participant Uniqueness**
   * **Validates: Requirements 3.4**
   */

  // Generator for participant state
  const participantState = fc.record({
    conversationId: fc.uuid(),
    participants: fc.array(
      fc.record({
        oderId: userId,
        isActive: fc.boolean(),
      }),
      { maxLength: 10 }
    ).map((arr) => {
      const map = new Map<string, { isActive: boolean }>();
      // Ensure uniqueness by using Map
      arr.forEach((p) => map.set(p.oderId, { isActive: p.isActive }));
      return map;
    }),
  });

  it('should reject adding an already active participant', () => {
    fc.assert(
      fc.property(participantState, userId, (state, uid) => {
        // First, ensure user is an active participant
        const stateWithActiveUser: ParticipantState = {
          ...state,
          participants: new Map(state.participants).set(uid, { isActive: true }),
        };

        // Try to add the same user again
        const { result } = addParticipantToConversation(stateWithActiveUser, uid);

        // Should be rejected with PARTICIPANT_EXISTS
        return result.success === false && result.reason === 'PARTICIPANT_EXISTS';
      }),
      { numRuns: 100 }
    );
  });

  it('should allow adding a new participant', () => {
    fc.assert(
      fc.property(participantState, userId, (state, uid) => {
        // Ensure user is NOT in the conversation
        const stateWithoutUser: ParticipantState = {
          ...state,
          participants: new Map(
            [...state.participants].filter(([id]) => id !== uid)
          ),
        };

        // Try to add the user
        const { result, newState } = addParticipantToConversation(stateWithoutUser, uid);

        // Should succeed with 'created' action
        if (result.success && result.action === 'created') {
          // User should now be an active participant
          return isActiveParticipant(newState, uid);
        }
        return false;
      }),
      { numRuns: 100 }
    );
  });

  it('should reactivate an inactive participant instead of creating duplicate', () => {
    fc.assert(
      fc.property(participantState, userId, (state, uid) => {
        // Ensure user is an inactive participant
        const stateWithInactiveUser: ParticipantState = {
          ...state,
          participants: new Map(state.participants).set(uid, { isActive: false }),
        };

        // Try to add the user
        const { result, newState } = addParticipantToConversation(stateWithInactiveUser, uid);

        // Should succeed with 'reactivated' action
        if (result.success && result.action === 'reactivated') {
          // User should now be active
          return isActiveParticipant(newState, uid);
        }
        return false;
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain participant count invariant when adding existing active user', () => {
    fc.assert(
      fc.property(participantState, userId, (state, uid) => {
        // Ensure user is an active participant
        const stateWithActiveUser: ParticipantState = {
          ...state,
          participants: new Map(state.participants).set(uid, { isActive: true }),
        };

        const countBefore = countActiveParticipants(stateWithActiveUser);

        // Try to add the same user again
        const { newState } = addParticipantToConversation(stateWithActiveUser, uid);

        const countAfter = countActiveParticipants(newState);

        // Count should remain the same (no duplicate added)
        return countBefore === countAfter;
      }),
      { numRuns: 100 }
    );
  });

  it('should increase participant count by 1 when adding new user', () => {
    fc.assert(
      fc.property(participantState, userId, (state, uid) => {
        // Ensure user is NOT in the conversation
        const stateWithoutUser: ParticipantState = {
          ...state,
          participants: new Map(
            [...state.participants].filter(([id]) => id !== uid)
          ),
        };

        const countBefore = countActiveParticipants(stateWithoutUser);

        // Add the user
        const { result, newState } = addParticipantToConversation(stateWithoutUser, uid);

        if (result.success && result.action === 'created') {
          const countAfter = countActiveParticipants(newState);
          // Count should increase by exactly 1
          return countAfter === countBefore + 1;
        }
        return false;
      }),
      { numRuns: 100 }
    );
  });

  it('should ensure each user appears at most once in participants', () => {
    fc.assert(
      fc.property(
        participantState,
        fc.array(userId, { minLength: 1, maxLength: 10 }),
        (initialState, userIds) => {
          // Start with empty participants
          let state: ParticipantState = {
            ...initialState,
            participants: new Map(),
          };

          // Try to add each user (some may be duplicates)
          for (const uid of userIds) {
            const { newState } = addParticipantToConversation(state, uid);
            state = newState;
          }

          // Count unique user IDs in the final state
          const uniqueUserIds = new Set(state.participants.keys());

          // Each user should appear exactly once
          return state.participants.size === uniqueUserIds.size;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 5: Message Read State Transition
// Requirements: 2.5, 5.4
// ============================================

describe('Property 5: Message Read State Transition', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 5: Message Read State Transition**
   * **Validates: Requirements 2.5, 5.4**
   */

  it('should update isRead flag and readAt timestamp when marking as read', () => {
    fc.assert(
      fc.property(
        message.filter((m) => !m.isRead),
        userId,
        (msg, readerId) => {
          // Skip if reader is the sender
          if (msg.senderId === readerId) {
            const result = markMessageAsRead(msg, readerId);
            return result.isRead === msg.isRead; // Should not change
          }

          const result = markMessageAsRead(msg, readerId);
          return (
            result.isRead === true &&
            result.readAt !== null &&
            result.readBy.some((r) => r.userId === readerId)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not mark sender own messages as read', () => {
    fc.assert(
      fc.property(message, (msg) => {
        const result = markMessageAsRead(msg, msg.senderId);
        // Should return unchanged message
        return (
          result.isRead === msg.isRead &&
          result.readBy.length === msg.readBy.length
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should add reader to readBy array only once', () => {
    fc.assert(
      fc.property(
        message.filter((m) => !m.isRead),
        userId,
        (msg, readerId) => {
          if (msg.senderId === readerId) return true;

          // Mark as read twice
          const result1 = markMessageAsRead(msg, readerId);
          const result2 = markMessageAsRead(result1, readerId);

          // Should only have one entry for this reader
          const readerEntries = result2.readBy.filter(
            (r) => r.userId === readerId
          );
          return readerEntries.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 6: Soft Delete Preservation
// Requirements: 6.4
// ============================================

describe('Property 6: Soft Delete Preservation', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 6: Soft Delete Preservation**
   * **Validates: Requirements 6.4**
   */

  it('should set isDeleted to true and deletedAt when soft deleting', () => {
    fc.assert(
      fc.property(
        message.filter((m) => !m.isDeleted),
        (msg) => {
          const result = softDeleteMessage(msg, msg.senderId);

          if (result.success && result.message) {
            return (
              result.message.isDeleted === true &&
              result.message.deletedAt !== null
            );
          }
          return false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve message content after soft delete', () => {
    fc.assert(
      fc.property(
        message.filter((m) => !m.isDeleted),
        (msg) => {
          const result = softDeleteMessage(msg, msg.senderId);

          if (result.success && result.message) {
            return (
              result.message.id === msg.id &&
              result.message.content === msg.content &&
              result.message.senderId === msg.senderId &&
              result.message.conversationId === msg.conversationId
            );
          }
          return false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only allow sender to delete their own message', () => {
    fc.assert(
      fc.property(message, userId, (msg, deleterId) => {
        const result = softDeleteMessage(msg, deleterId);

        if (msg.senderId === deleterId) {
          return result.success === true;
        } else {
          return result.success === false && result.reason === 'NOT_SENDER';
        }
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 9: Attachment Serialization Round-trip
// Requirements: 2.3
// ============================================

describe('Property 9: Attachment Serialization Round-trip', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 9: Attachment Serialization Round-trip**
   * **Validates: Requirements 2.3**
   */

  it('should preserve attachment data through serialization round-trip', () => {
    fc.assert(
      fc.property(fc.array(attachment, { maxLength: 5 }), (attachments) => {
        const serialized = serializeAttachments(attachments);
        const deserialized = deserializeAttachments(serialized);

        // Check length
        if (deserialized.length !== attachments.length) {
          return false;
        }

        // Check each attachment
        return attachments.every((att, i) => {
          const des = deserialized[i];
          return (
            des.name === att.name &&
            des.url === att.url &&
            des.type === att.type &&
            des.size === att.size
          );
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty array for invalid JSON', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          try {
            JSON.parse(s);
            return false; // Valid JSON, skip
          } catch {
            return true; // Invalid JSON, keep
          }
        }),
        (invalidJson) => {
          const result = deserializeAttachments(invalidJson);
          return Array.isArray(result) && result.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array for non-array JSON', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string().map((s) => JSON.stringify(s)),
          fc.integer().map((n) => JSON.stringify(n)),
          fc.record({ key: fc.string() }).map((o) => JSON.stringify(o))
        ),
        (nonArrayJson) => {
          const result = deserializeAttachments(nonArrayJson);
          return Array.isArray(result) && result.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 10: Conversation Listing Filter
// Requirements: 5.2
// ============================================

describe('Property 10: Conversation Listing Filter', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 10: Conversation Listing Filter**
   * **Validates: Requirements 5.2**
   */

  it('should only return conversations where user is active participant', () => {
    fc.assert(
      fc.property(
        fc.array(conversation, { minLength: 0, maxLength: 10 }),
        userId,
        (conversations, uid) => {
          const filtered = filterConversationsForUser(conversations, uid);

          // All returned conversations should have user as active participant
          return filtered.every((conv) =>
            conv.participants.some((p) => p.userId === uid && p.isActive)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not return conversations where user is inactive participant', () => {
    fc.assert(
      fc.property(
        fc.array(conversation, { minLength: 0, maxLength: 10 }),
        userId,
        (conversations, uid) => {
          const filtered = filterConversationsForUser(conversations, uid);

          // Count conversations where user is inactive participant
          const inactiveParticipantConvs = conversations.filter((conv) =>
            conv.participants.some((p) => p.userId === uid && !p.isActive)
          );

          // None of these should be in filtered result
          return inactiveParticipantConvs.every(
            (conv) => !filtered.some((f) => f.id === conv.id)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not return conversations where user is not a participant', () => {
    fc.assert(
      fc.property(
        fc.array(conversation, { minLength: 0, maxLength: 10 }),
        userId,
        (conversations, uid) => {
          const filtered = filterConversationsForUser(conversations, uid);

          // Count conversations where user is not a participant at all
          const nonParticipantConvs = conversations.filter(
            (conv) => !conv.participants.some((p) => p.userId === uid)
          );

          // None of these should be in filtered result
          return nonParticipantConvs.every(
            (conv) => !filtered.some((f) => f.id === conv.id)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all conversations where user is active participant', () => {
    fc.assert(
      fc.property(
        fc.array(conversation, { minLength: 0, maxLength: 10 }),
        userId,
        (conversations, uid) => {
          const filtered = filterConversationsForUser(conversations, uid);

          // Count conversations where user is active participant
          const activeParticipantConvs = conversations.filter((conv) =>
            conv.participants.some((p) => p.userId === uid && p.isActive)
          );

          // All of these should be in filtered result
          return activeParticipantConvs.every((conv) =>
            filtered.some((f) => f.id === conv.id)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================
// PROPERTY 12: Read Receipt Accuracy
// Requirements: 18.1, 18.3
// ============================================

/**
 * Business logic for read receipt accuracy testing
 * 
 * Requirements:
 * - 18.1: WHEN a message is read by recipient THEN the system SHALL update read status in database
 * - 18.3: WHEN multiple participants exist THEN the system SHALL show read status per participant
 */

interface ReadReceiptState {
  messageId: string;
  senderId: string;
  readBy: ReadReceipt[];
  isRead: boolean;
  readAt: Date | null;
}

/**
 * Mark a message as read by a specific user and return the updated state
 * This simulates the markMessageAsRead behavior for read receipt tracking
 */
function markMessageAsReadWithReceipt(
  state: ReadReceiptState,
  readerId: string
): ReadReceiptState {
  // Don't mark own messages as read
  if (state.senderId === readerId) {
    return state;
  }

  const now = new Date();
  const readBy = [...state.readBy];

  // Check if already read by this user
  if (readBy.some((r) => r.userId === readerId)) {
    return state;
  }

  // Add user to readBy
  readBy.push({ userId: readerId, readAt: now.toISOString() });

  return {
    ...state,
    isRead: true,
    readAt: now,
    readBy,
  };
}

/**
 * Get read status for a specific participant
 */
function getReadStatusForParticipant(
  state: ReadReceiptState,
  participantId: string
): { hasRead: boolean; readAt: string | null } {
  const receipt = state.readBy.find((r) => r.userId === participantId);
  return {
    hasRead: receipt !== undefined,
    readAt: receipt?.readAt ?? null,
  };
}

/**
 * Check if all participants (except sender) have read the message
 */
function allParticipantsHaveRead(
  state: ReadReceiptState,
  participantIds: string[]
): boolean {
  const nonSenderParticipants = participantIds.filter(
    (id) => id !== state.senderId
  );
  return nonSenderParticipants.every((id) =>
    state.readBy.some((r) => r.userId === id)
  );
}

describe('Property 12: Read Receipt Accuracy', () => {
  /**
   * **Feature: bidding-phase4-communication, Property 12: Read Receipt Accuracy**
   * **Validates: Requirements 18.1, 18.3**
   */

  // Generator for read receipt state
  const readReceiptState = fc.record({
    messageId: fc.uuid(),
    senderId: userId,
    readBy: fc.array(readReceipt, { maxLength: 10 }),
    isRead: fc.boolean(),
    readAt: fc.option(validDate, { nil: null }),
  });

  it('should update read status in database when message is read by recipient (18.1)', () => {
    fc.assert(
      fc.property(
        readReceiptState.filter((s) => s.readBy.length === 0), // Start with unread message
        userId,
        (state, readerId) => {
          // Skip if reader is the sender
          if (state.senderId === readerId) {
            const result = markMessageAsReadWithReceipt(state, readerId);
            // Should not change for sender
            return (
              result.readBy.length === state.readBy.length &&
              result.isRead === state.isRead
            );
          }

          const result = markMessageAsReadWithReceipt(state, readerId);

          // After marking as read:
          // 1. isRead should be true
          // 2. readAt should be set
          // 3. readBy should contain the reader
          return (
            result.isRead === true &&
            result.readAt !== null &&
            result.readBy.some((r) => r.userId === readerId)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track read status per participant when multiple participants exist (18.3)', () => {
    fc.assert(
      fc.property(
        readReceiptState.filter((s) => s.readBy.length === 0),
        fc.array(userId, { minLength: 2, maxLength: 5 }), // Multiple participants
        (state, participantIds) => {
          // Filter out sender from participants
          const readers = participantIds.filter((id) => id !== state.senderId);
          if (readers.length === 0) return true;

          // Mark message as read by each participant sequentially
          let currentState = state;
          for (const readerId of readers) {
            currentState = markMessageAsReadWithReceipt(currentState, readerId);
          }

          // Verify each participant has their own read receipt
          return readers.every((readerId) => {
            const status = getReadStatusForParticipant(currentState, readerId);
            return status.hasRead === true && status.readAt !== null;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not duplicate read receipts when marking same message as read multiple times', () => {
    fc.assert(
      fc.property(
        readReceiptState.filter((s) => s.readBy.length === 0),
        userId,
        (state, readerId) => {
          if (state.senderId === readerId) return true;

          // Mark as read multiple times
          const result1 = markMessageAsReadWithReceipt(state, readerId);
          const result2 = markMessageAsReadWithReceipt(result1, readerId);
          const result3 = markMessageAsReadWithReceipt(result2, readerId);

          // Should only have one entry for this reader
          const readerEntries = result3.readBy.filter(
            (r) => r.userId === readerId
          );
          return readerEntries.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve existing read receipts when new participant reads', () => {
    fc.assert(
      fc.property(
        readReceiptState.filter((s) => s.readBy.length === 0),
        fc.array(userId, { minLength: 2, maxLength: 5 }),
        (state, participantIds) => {
          const readers = participantIds.filter((id) => id !== state.senderId);
          if (readers.length < 2) return true;

          // First reader marks as read
          const afterFirstRead = markMessageAsReadWithReceipt(state, readers[0]);
          const firstReaderReceipt = afterFirstRead.readBy.find(
            (r) => r.userId === readers[0]
          );

          // Second reader marks as read
          const afterSecondRead = markMessageAsReadWithReceipt(
            afterFirstRead,
            readers[1]
          );

          // First reader's receipt should still exist with same timestamp
          const firstReaderReceiptAfter = afterSecondRead.readBy.find(
            (r) => r.userId === readers[0]
          );

          return (
            firstReaderReceiptAfter !== undefined &&
            firstReaderReceiptAfter.readAt === firstReaderReceipt?.readAt
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly report when all participants have read the message', () => {
    fc.assert(
      fc.property(
        readReceiptState.filter((s) => s.readBy.length === 0),
        fc.array(userId, { minLength: 2, maxLength: 5 }),
        (state, participantIds) => {
          // Ensure unique participants
          const uniqueParticipants = [...new Set(participantIds)];
          const readers = uniqueParticipants.filter(
            (id) => id !== state.senderId
          );
          if (readers.length === 0) return true;

          // Initially, not all have read
          const initialAllRead = allParticipantsHaveRead(state, uniqueParticipants);
          if (initialAllRead && readers.length > 0) {
            // If already all read with empty readBy, something is wrong
            return false;
          }

          // Mark all readers as read
          let currentState = state;
          for (const readerId of readers) {
            currentState = markMessageAsReadWithReceipt(currentState, readerId);
          }

          // Now all should have read
          return allParticipantsHaveRead(currentState, uniqueParticipants);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not mark sender own message as read', () => {
    fc.assert(
      fc.property(readReceiptState, (state) => {
        const result = markMessageAsReadWithReceipt(state, state.senderId);

        // State should be unchanged
        return (
          result.readBy.length === state.readBy.length &&
          !result.readBy.some((r) => r.userId === state.senderId)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should include timestamp in read receipt for audit trail', () => {
    fc.assert(
      fc.property(
        readReceiptState.filter((s) => s.readBy.length === 0),
        userId,
        (state, readerId) => {
          if (state.senderId === readerId) return true;

          const result = markMessageAsReadWithReceipt(state, readerId);
          const receipt = result.readBy.find((r) => r.userId === readerId);

          // Receipt should exist and have a valid ISO timestamp
          if (!receipt) return false;

          // Validate timestamp format (ISO 8601)
          const timestamp = new Date(receipt.readAt);
          return !isNaN(timestamp.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });
});
