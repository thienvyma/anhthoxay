/**
 * Portal API Types
 *
 * Shared type definitions for the Portal API
 *
 * **Feature: code-refactoring**
 * **Requirements: 2.2, 2.3**
 */

import type { User } from '../auth/AuthContext';

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================
// PROJECT TYPES
// ============================================

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

export interface ServiceCategory {
  id: string;
  name: string;
  slug?: string;
}

export interface Region {
  id: string;
  name: string;
  slug?: string;
  parentId?: string;
  level?: number;
}

export interface Project {
  id: string;
  code: string;
  title: string;
  description: string;
  category?: ServiceCategory;
  categoryId?: string;
  region?: Region;
  regionId?: string;
  address?: string;
  area?: number;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  images?: string[];
  requirements?: string;
  status: ProjectStatus;
  bidDeadline?: string;
  bidCount?: number;
  maxBids?: number;
  owner?: User;
  reviewNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProjectInput {
  title: string;
  description: string;
  categoryId: string;
  regionId: string;
  address?: string;
  area?: number;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  images?: string[];
  requirements?: string;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  categoryId?: string;
  regionId?: string;
  address?: string;
  area?: number;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  images?: string[];
  requirements?: string;
}

export interface ProjectQuery {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MarketplaceQuery {
  page?: number;
  limit?: number;
  regionId?: string;
  categoryId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// BID TYPES
// ============================================

export type BidStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SELECTED'
  | 'NOT_SELECTED'
  | 'WITHDRAWN';

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Bid {
  id: string;
  code: string;
  project?: Project;
  projectId?: string;
  contractor?: Contractor;
  contractorId?: string;
  // Anonymous fields for homeowner view
  anonymousName?: string;
  contractorRating?: number;
  contractorTotalProjects?: number;
  contractorCompletedProjects?: number;
  price: number;
  timeline: string;
  proposal: string;
  attachments?: Attachment[];
  status: BidStatus;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBidInput {
  projectId: string;
  price: number;
  timeline: string;
  proposal: string;
  attachments?: Attachment[];
}

export interface UpdateBidInput {
  price?: number;
  timeline?: string;
  proposal?: string;
  attachments?: Attachment[];
}

export interface BidQuery {
  page?: number;
  limit?: number;
  status?: BidStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// CONTRACTOR TYPES
// ============================================

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface Certificate {
  name: string;
  imageUrl: string;
  issuedDate?: string;
}

export interface ContractorProfile {
  id: string;
  userId: string;
  description?: string;
  experience?: number;
  specialties?: string[];
  serviceAreas?: string[];
  portfolioImages?: string[];
  certificates?: Certificate[];
  idCardFront?: string;
  idCardBack?: string;
  businessLicenseImage?: string;
  submittedAt?: string;
}

export interface Contractor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  rating?: number;
  totalProjects?: number;
  verificationStatus: VerificationStatus;
  profile?: ContractorProfile;
}

export interface ContractorQuery {
  page?: number;
  limit?: number;
  regionId?: string;
  specialty?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateContractorProfileInput {
  description?: string;
  experience?: number;
  specialties?: string[];
  serviceAreas?: string[];
  portfolioImages?: string[];
  certificates?: Certificate[];
  idCardFront?: string;
  idCardBack?: string;
  businessLicenseImage?: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

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
  | 'DISPUTE_RESOLVED'
  | 'NEW_BID'
  | 'PROJECT_APPROVED'
  | 'PROJECT_REJECTED'
  | 'NEW_MESSAGE';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  types: Record<NotificationType, boolean>;
}

// ============================================
// CHAT TYPES
// ============================================

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  type: MessageType;
  attachments?: Attachment[];
  isDeleted: boolean;
  readBy?: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  projectId: string;
  project?: Project;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  isClosed: boolean;
  closedAt?: string;
  closedReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationQuery {
  page?: number;
  limit?: number;
}

export interface MessageQuery {
  page?: number;
  limit?: number;
  before?: string;
}

export interface SendMessageInput {
  content: string;
  type?: MessageType;
  attachments?: Attachment[];
}

// ============================================
// MATCH TYPES
// ============================================

export interface MatchDetails {
  project: Project;
  bid: Bid;
  contractor?: Contractor;
  homeowner?: User;
  escrow?: Escrow;
  fee?: FeeTransaction;
  milestones?: Milestone[];
}

export interface Escrow {
  id: string;
  code: string;
  projectId: string;
  bidId: string;
  homeownerId: string;
  amount: number;
  releasedAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface FeeTransaction {
  id: string;
  code: string;
  userId: string;
  projectId: string;
  bidId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  escrowId: string;
  projectId: string;
  name: string;
  percentage: number;
  releasePercentage: number;
  status: string;
  requestedAt?: string;
  confirmedAt?: string;
  createdAt: string;
}

// ============================================
// RANKING TYPES
// ============================================

export interface ContractorRanking {
  id: string;
  contractorId: string;
  contractor?: Contractor;
  totalScore: number;
  ratingScore: number;
  projectsScore: number;
  responseScore: number;
  verificationScore: number;
  rank?: number;
  isFeatured: boolean;
  featuredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RankingQuery {
  page?: number;
  limit?: number;
  regionId?: string;
  specialty?: string;
}

// ============================================
// SAVED PROJECT TYPES
// ============================================

export interface SavedProject {
  id: string;
  projectId: string;
  project: Project;
  savedAt: string;
  isExpired: boolean;
}

// ============================================
// ACTIVITY TYPES
// ============================================

export type ActivityType =
  | 'PROJECT_CREATED'
  | 'PROJECT_SUBMITTED'
  | 'PROJECT_APPROVED'
  | 'PROJECT_REJECTED'
  | 'BID_SUBMITTED'
  | 'BID_APPROVED'
  | 'BID_REJECTED'
  | 'BID_SELECTED'
  | 'MATCH_CREATED'
  | 'PROJECT_STARTED'
  | 'PROJECT_COMPLETED'
  | 'REVIEW_WRITTEN';

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ============================================
// REVIEW TYPES
// ============================================

export interface Review {
  id: string;
  projectId: string;
  project?: Project;
  reviewerId: string;
  reviewer?: User;
  revieweeId: string;
  reviewee?: User;
  rating: number;
  comment?: string;
  response?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface CreateReviewInput {
  projectId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  isPublic?: boolean;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface BiddingSettings {
  maxBidsPerProject: number;
  defaultBidDuration: number;
  minBidDuration: number;
  maxBidDuration: number;
  escrowPercentage: number;
  escrowMinAmount: number;
  escrowMaxAmount?: number;
  verificationFee: number;
  winFeePercentage: number;
}
