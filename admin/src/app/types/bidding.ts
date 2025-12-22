// Bidding-related type definitions (Project, Bid, Match, Escrow, Fee, Dispute)

// ========== PROJECT TYPES ==========

/**
 * Project status enum
 * Follows the status flow defined in requirements 2.1-2.6
 */
export type ProjectStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'REJECTED'
  | 'OPEN'
  | 'BIDDING_CLOSED'
  | 'PENDING_MATCH'
  | 'MATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Project list item for admin table view
 * Requirements: 10.1 - Display code, title, owner, region, status, actions
 */
export interface ProjectListItem {
  id: string;
  code: string;
  title: string;
  status: ProjectStatus;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  region: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  bidDeadline: string | null;
  bidCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Full project detail for admin view
 * Requirements: 4.2 - Full project details including owner information
 */
export interface Project {
  id: string;
  code: string;
  title: string;
  description: string;
  status: ProjectStatus;
  // Owner info
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  // Location
  regionId: string;
  region: {
    id: string;
    name: string;
  };
  address: string;
  // Category
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  // Details
  area: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  timeline: string | null;
  images: string[];
  requirements: string | null;
  // Bidding
  bidDeadline: string | null;
  maxBids: number;
  bidCount: number;
  // Admin review
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  // Timestamps
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ========== BID TYPES ==========

/**
 * Bid status enum
 */
export type BidStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SELECTED'
  | 'NOT_SELECTED'
  | 'WITHDRAWN';

/**
 * Bid attachment type
 */
export interface BidAttachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

/**
 * Bid list item for admin table view
 * Requirements: 11.1 - Display code, project, contractor, price, status, actions
 */
export interface BidListItem {
  id: string;
  code: string;
  status: BidStatus;
  price: number;
  timeline: string;
  project: {
    id: string;
    code: string;
    title: string;
  };
  contractor: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
    rating: number;
    totalProjects: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Full bid detail for admin view
 * Requirements: 8.2 - Full bid details including contractor profile and rating
 */
export interface Bid {
  id: string;
  code: string;
  status: BidStatus;
  // Bid details
  price: number;
  timeline: string;
  proposal: string;
  attachments: BidAttachment[];
  // Project info
  projectId: string;
  project: {
    id: string;
    code: string;
    title: string;
    status: ProjectStatus;
  };
  // Contractor info
  contractorId: string;
  contractor: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    companyName: string | null;
    rating: number;
    totalProjects: number;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  };
  // Admin review
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ========== ESCROW TYPES ==========

/**
 * Escrow status enum
 * Follows the status flow defined in requirements 4.1-4.6
 */
export type EscrowStatus =
  | 'PENDING'
  | 'HELD'
  | 'PARTIAL_RELEASED'
  | 'RELEASED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'CANCELLED';

/**
 * Escrow transaction log entry
 */
export interface EscrowTransaction {
  type: 'DEPOSIT' | 'CONFIRM' | 'RELEASE' | 'PARTIAL_RELEASE' | 'REFUND' | 'DISPUTE';
  amount: number;
  date: string;
  note?: string;
  adminId?: string;
}

/**
 * Escrow list item for admin table view
 * Requirements: 5.1 - List escrows with filtering by status and projectId
 */
export interface EscrowListItem {
  id: string;
  code: string;
  status: EscrowStatus;
  amount: number;
  releasedAmount: number;
  currency: string;
  project: {
    id: string;
    code: string;
    title: string;
  };
  bid: {
    id: string;
    code: string;
    price: number;
  };
  homeowner: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ========== PROJECT MILESTONE TYPES ==========

/**
 * Milestone status enum
 */
export type MilestoneStatus = 'PENDING' | 'REQUESTED' | 'CONFIRMED' | 'DISPUTED';

/**
 * Project milestone for tracking progress
 * Requirements: 15.1-15.6
 */
export interface ProjectMilestone {
  id: string;
  escrowId: string;
  projectId: string;
  name: string;
  percentage: number;
  releasePercentage: number;
  status: MilestoneStatus;
  requestedAt: string | null;
  requestedBy: string | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  disputedAt: string | null;
  disputeReason: string | null;
  createdAt: string;
  updatedAt: string;
}


/**
 * Full escrow detail for admin view
 * Requirements: 5.2 - Full escrow details including project and bid information
 */
export interface Escrow {
  id: string;
  code: string;
  status: EscrowStatus;
  // Amount
  amount: number;
  releasedAmount: number;
  currency: string;
  // Relations
  projectId: string;
  project: {
    id: string;
    code: string;
    title: string;
    status: ProjectStatus;
  };
  bidId: string;
  bid: {
    id: string;
    code: string;
    price: number;
  };
  homeownerId: string;
  homeowner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  // Transactions log
  transactions: EscrowTransaction[];
  // Milestones
  milestones: ProjectMilestone[];
  // Dispute
  disputeReason: string | null;
  disputedBy: string | null;
  disputeResolvedAt: string | null;
  disputeResolution: string | null;
  // Admin tracking
  confirmedBy: string | null;
  confirmedAt: string | null;
  releasedBy: string | null;
  releasedAt: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ========== FEE TRANSACTION TYPES ==========

/**
 * Fee type enum
 */
export type FeeType = 'WIN_FEE' | 'VERIFICATION_FEE';

/**
 * Fee transaction status enum
 */
export type FeeStatus = 'PENDING' | 'PAID' | 'CANCELLED';

/**
 * Fee transaction list item for admin table view
 * Requirements: 13.1 - Display code, contractor, type, amount, status, actions
 */
export interface FeeListItem {
  id: string;
  code: string;
  type: FeeType;
  amount: number;
  currency: string;
  status: FeeStatus;
  user: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
  };
  project: {
    id: string;
    code: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Full fee transaction detail for admin view
 * Requirements: 13.3 - Full fee details including related project and bid
 */
export interface FeeTransaction {
  id: string;
  code: string;
  type: FeeType;
  amount: number;
  currency: string;
  status: FeeStatus;
  // Relations
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    companyName: string | null;
  };
  projectId: string;
  project: {
    id: string;
    code: string;
    title: string;
  };
  bidId: string;
  bid: {
    id: string;
    code: string;
    price: number;
  };
  // Payment tracking
  paidAt: string | null;
  paidBy: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ========== MATCH TYPES ==========

/**
 * Contact information revealed after match
 * Requirements: 2.1-2.6
 */
export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  address?: string; // Only for contractor viewing project
}

/**
 * Escrow summary for match details
 */
export interface EscrowSummary {
  id: string;
  code: string;
  status: EscrowStatus;
  amount: number;
  releasedAmount: number;
  currency: string;
}

/**
 * Fee summary for match details
 */
export interface FeeSummary {
  id: string;
  code: string;
  type: FeeType;
  amount: number;
  status: FeeStatus;
  currency: string;
}

/**
 * Match details for admin view
 * Requirements: 10.2 - Full details of homeowner, contractor, escrow, and fees
 */
export interface MatchDetails {
  project: Project;
  bid: Bid;
  contractor: ContactInfo;
  homeowner: ContactInfo;
  escrow: EscrowSummary;
  fee: FeeSummary;
}

/**
 * Match list item for admin table view
 * Requirements: 12.1 - Display project code, homeowner, contractor, escrow status, actions
 */
export interface MatchListItem {
  id: string;
  project: {
    id: string;
    code: string;
    title: string;
    status: ProjectStatus;
    matchedAt: string | null;
  };
  homeowner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  contractor: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
  };
  escrow: {
    id: string;
    code: string;
    status: EscrowStatus;
    amount: number;
  };
  fee: {
    id: string;
    code: string;
    status: FeeStatus;
    amount: number;
  };
  createdAt: string;
}

// ========== DISPUTE TYPES ==========

/**
 * Dispute status enum
 */
export type DisputeStatus = 'OPEN' | 'RESOLVED';

/**
 * Dispute resolution type
 */
export type DisputeResolutionType = 'REFUND_TO_HOMEOWNER' | 'RELEASE_TO_CONTRACTOR';

/**
 * Dispute list item for admin table view
 * Requirements: 16.3
 */
export interface DisputeListItem {
  id: string;
  escrowId: string;
  escrowCode: string;
  project: {
    id: string;
    code: string;
    title: string;
  };
  raisedBy: {
    id: string;
    name: string;
    role: 'HOMEOWNER' | 'CONTRACTOR';
  };
  reason: string;
  status: DisputeStatus;
  createdAt: string;
}

/**
 * Full dispute detail for admin view
 * Requirements: 16.3, 16.4
 */
export interface Dispute {
  id: string;
  escrow: Escrow;
  project: Project;
  bid: Bid;
  homeowner: ContactInfo;
  contractor: ContactInfo;
  raisedBy: {
    id: string;
    name: string;
    role: 'HOMEOWNER' | 'CONTRACTOR';
  };
  reason: string;
  status: DisputeStatus;
  resolution: DisputeResolutionType | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

// ========== NOTIFICATION TYPES ==========

/**
 * Notification type enum
 * Requirements: 14.1-14.5
 */
export type NotificationType =
  | 'BID_SELECTED'
  | 'BID_NOT_SELECTED'
  | 'ESCROW_HELD'
  | 'ESCROW_RELEASED'
  | 'ESCROW_PARTIAL_RELEASED'
  | 'ESCROW_REFUNDED'
  | 'ESCROW_DISPUTED'
  | 'MILESTONE_REQUESTED'
  | 'MILESTONE_CONFIRMED'
  | 'MILESTONE_DISPUTED'
  | 'DISPUTE_RESOLVED';

/**
 * Notification data payload
 */
export interface NotificationData {
  projectId?: string;
  projectCode?: string;
  bidId?: string;
  bidCode?: string;
  escrowId?: string;
  milestoneId?: string;
  [key: string]: unknown;
}

/**
 * Notification for user
 * Requirements: 14.1-14.5
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data: NotificationData | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}


// ========== CHAT TYPES ==========

/**
 * Message type enum
 * Requirements: 2.2 - Support TEXT, IMAGE, FILE, SYSTEM types
 */
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

/**
 * Message attachment type
 * Requirements: 2.3 - Store attachment metadata
 */
export interface MessageAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

/**
 * Read receipt for multi-participant tracking
 * Requirements: 18.1, 18.3 - Track read status per participant
 */
export interface ReadReceipt {
  userId: string;
  readAt: string;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

/**
 * Message in a conversation
 * Requirements: 2.1-2.5
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  attachments: MessageAttachment[];
  isRead: boolean;
  readAt: string | null;
  readBy: ReadReceipt[];
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

/**
 * Conversation participant
 * Requirements: 3.1-3.4
 */
export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt: string | null;
  isActive: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  };
}

/**
 * Conversation with relations
 * Requirements: 1.1-1.5
 */
export interface Conversation {
  id: string;
  projectId: string | null;
  isClosed: boolean;
  closedAt: string | null;
  closedBy: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    code: string;
    title: string;
    status: string;
  } | null;
  participants: ConversationParticipant[];
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
}
