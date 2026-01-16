/**
 * Firestore Type Definitions
 * TypeScript interfaces for all Firestore collections matching Prisma models
 * 
 * @module types/firestore.types
 * @requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import type { FirestoreDocument } from '../services/firestore/base.firestore';

// ============================================
// ENUMS & CONSTANTS
// ============================================

/**
 * User roles in the system
 */
export type UserRole = 'ADMIN' | 'MANAGER' | 'CONTRACTOR' | 'HOMEOWNER' | 'WORKER' | 'USER';

/**
 * Verification status for contractors
 */
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

/**
 * Lead status
 */
export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED';

/**
 * Lead source
 */
export type LeadSource = 'QUOTE_FORM' | 'CONTACT_FORM' | 'FURNITURE_QUOTE';

/**
 * Blog post status
 */
export type BlogPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/**
 * Blog comment status
 */
export type BlogCommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Project status
 */
export type ProjectStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'REJECTED' 
  | 'OPEN' 
  | 'BIDDING_CLOSED' 
  | 'MATCHED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

/**
 * Bid status
 */
export type BidStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'SELECTED' 
  | 'NOT_SELECTED' 
  | 'WITHDRAWN';

/**
 * Escrow status
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
 * Fee transaction type
 */
export type FeeTransactionType = 'WIN_FEE' | 'VERIFICATION_FEE';

/**
 * Fee transaction status
 */
export type FeeTransactionStatus = 'PENDING' | 'PAID' | 'CANCELLED';

/**
 * Milestone status
 */
export type MilestoneStatus = 'PENDING' | 'REQUESTED' | 'CONFIRMED' | 'DISPUTED';

/**
 * Message type
 */
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

/**
 * Notification type
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
  | 'DISPUTE_RESOLVED'
  | 'NEW_MESSAGE'
  | 'BID_DEADLINE_REMINDER'
  | 'NO_BIDS_REMINDER'
  | 'ESCROW_PENDING'
  | 'REVIEW_REMINDER';

/**
 * Scheduled notification status
 */
export type ScheduledNotificationStatus = 'PENDING' | 'SENT' | 'CANCELLED';

/**
 * Review report reason
 */
export type ReviewReportReason = 'spam' | 'offensive' | 'fake' | 'irrelevant';

/**
 * Review report status
 */
export type ReviewReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

/**
 * Badge type
 */
export type BadgeType = 'ACTIVE_CONTRACTOR' | 'HIGH_QUALITY' | 'FAST_RESPONDER';

/**
 * Service fee type
 */
export type ServiceFeeType = 'FIXED' | 'PERCENTAGE';

/**
 * API key scope
 */
export type ApiKeyScope = 'READ_ONLY' | 'READ_WRITE' | 'FULL_ACCESS';

/**
 * API key status
 */
export type ApiKeyStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

// ============================================
// NESTED TYPES
// ============================================

/**
 * Certificate structure for contractor profile
 */
export interface Certificate {
  name: string;
  imageUrl: string;
  issuedDate?: string;
}

/**
 * Attachment structure for bids and messages
 */
export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

/**
 * Escrow transaction log entry
 */
export interface EscrowTransaction {
  type: 'DEPOSIT' | 'RELEASE' | 'PARTIAL_RELEASE' | 'REFUND';
  amount: number;
  date: Date;
  note?: string;
  adminId?: string;
}

/**
 * Status history entry for leads
 */
export interface StatusHistoryEntry {
  from: string;
  to: string;
  changedAt: Date;
  changedBy?: string;
}

/**
 * Read receipt for messages
 */
export interface ReadReceipt {
  userId: string;
  readAt: Date;
}

// ============================================
// USER & AUTH DOCUMENTS
// ============================================

/**
 * User document stored in `users/{userId}`
 * @requirements 2.1
 */
export interface FirestoreUser extends FirestoreDocument {
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  
  // Contractor specific fields
  companyName?: string;
  businessLicense?: string;
  taxCode?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: Date;
  verificationNote?: string;
  rating: number;
  totalProjects: number;
  
  // Email unsubscribe
  unsubscribeToken?: string;
}

/**
 * Input type for creating a user
 * @requirements 2.4
 */
export type CreateUserInput = Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating a user
 * @requirements 2.4
 */
export type UpdateUserInput = Partial<Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Contractor profile stored in `users/{userId}/profile/contractor`
 */
export interface FirestoreContractorProfile extends FirestoreDocument {
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
  submittedAt?: Date;
}

// ============================================
// REGION DOCUMENTS
// ============================================

/**
 * Region document stored in `regions/{regionId}`
 */
export interface FirestoreRegion extends FirestoreDocument {
  name: string;
  slug: string;
  parentId?: string;
  level: number;
  isActive: boolean;
  order: number;
}

// ============================================
// LEAD DOCUMENTS
// ============================================

/**
 * Customer lead document stored in `leads/{leadId}`
 */
export interface FirestoreLead extends FirestoreDocument {
  name: string;
  phone: string;
  normalizedPhone?: string;
  email?: string;
  content: string;
  source: LeadSource;
  status: LeadStatus;
  quoteData?: string;
  notes?: string;
  statusHistory?: StatusHistoryEntry[];
  
  // Duplicate management
  submissionCount: number;
  isPotentialDuplicate: boolean;
  hasRelatedLeads: boolean;
  relatedLeadCount: number;
  potentialDuplicateIds?: string[];
  
  // Soft-delete for merged leads
  mergedIntoId?: string;
  mergedAt?: Date;
}

// ============================================
// BLOG DOCUMENTS
// ============================================

/**
 * Blog category stored in `blogCategories/{categoryId}`
 */
export interface FirestoreBlogCategory extends FirestoreDocument {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

/**
 * Blog post stored in `blogPosts/{postId}`
 */
export interface FirestoreBlogPost extends FirestoreDocument {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  categoryId: string;
  authorId: string;
  tags?: string[];
  status: BlogPostStatus;
  isFeatured: boolean;
  publishedAt?: Date;
}

/**
 * Blog comment stored in `blogPosts/{postId}/comments/{commentId}`
 */
export interface FirestoreBlogComment extends FirestoreDocument {
  postId: string;
  name: string;
  email: string;
  content: string;
  status: BlogCommentStatus;
}

// ============================================
// PRICING DOCUMENTS
// ============================================

/**
 * Service category stored in `serviceCategories/{categoryId}`
 */
export interface FirestoreServiceCategory extends FirestoreDocument {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  coefficient: number;
  formulaId?: string;
  materialCategoryIds?: string[];
  order: number;
  isActive: boolean;
}

/**
 * Unit price stored in `unitPrices/{priceId}`
 */
export interface FirestoreUnitPrice extends FirestoreDocument {
  category: string;
  name: string;
  price: number;
  tag: string;
  unit: string;
  description?: string;
  isActive: boolean;
}

/**
 * Material category stored in `materialCategories/{categoryId}`
 */
export interface FirestoreMaterialCategory extends FirestoreDocument {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

/**
 * Material stored in `materials/{materialId}`
 */
export interface FirestoreMaterial extends FirestoreDocument {
  name: string;
  categoryId: string;
  imageUrl?: string;
  price: number;
  unit?: string;
  description?: string;
  order: number;
  isActive: boolean;
}

/**
 * Formula stored in `formulas/{formulaId}`
 */
export interface FirestoreFormula extends FirestoreDocument {
  name: string;
  expression: string;
  description?: string;
  isActive: boolean;
}

// ============================================
// PROJECT & BIDDING DOCUMENTS
// ============================================

/**
 * Project stored in `projects/{projectId}`
 */
export interface FirestoreProject extends FirestoreDocument {
  code: string;
  ownerId: string;
  title: string;
  description: string;
  categoryId: string;
  regionId: string;
  address: string;
  area?: number;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  images?: string[];
  requirements?: string;
  status: ProjectStatus;
  bidDeadline?: Date;
  maxBids: number;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNote?: string;
  selectedBidId?: string;
  matchedAt?: Date;
  publishedAt?: Date;
}

/**
 * Bid stored in `projects/{projectId}/bids/{bidId}`
 */
export interface FirestoreBid extends FirestoreDocument {
  code: string;
  projectId: string;
  contractorId: string;
  price: number;
  timeline: string;
  proposal: string;
  attachments?: Attachment[];
  responseTimeHours?: number;
  status: BidStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNote?: string;
}

/**
 * Escrow stored in `escrows/{escrowId}`
 */
export interface FirestoreEscrow extends FirestoreDocument {
  code: string;
  projectId: string;
  bidId: string;
  homeownerId: string;
  amount: number;
  releasedAmount: number;
  currency: string;
  status: EscrowStatus;
  transactions?: EscrowTransaction[];
  disputeReason?: string;
  disputedBy?: string;
  disputeResolvedAt?: Date;
  disputeResolution?: string;
  confirmedBy?: string;
  confirmedAt?: Date;
  releasedBy?: string;
  releasedAt?: Date;
}

/**
 * Project milestone stored in `escrows/{escrowId}/milestones/{milestoneId}`
 */
export interface FirestoreMilestone extends FirestoreDocument {
  escrowId: string;
  projectId: string;
  name: string;
  percentage: number;
  releasePercentage: number;
  status: MilestoneStatus;
  requestedAt?: Date;
  requestedBy?: string;
  confirmedAt?: Date;
  confirmedBy?: string;
  disputedAt?: Date;
  disputeReason?: string;
}

/**
 * Fee transaction stored in `feeTransactions/{transactionId}`
 */
export interface FirestoreFeeTransaction extends FirestoreDocument {
  code: string;
  userId: string;
  projectId: string;
  bidId: string;
  type: FeeTransactionType;
  amount: number;
  currency: string;
  status: FeeTransactionStatus;
  paidAt?: Date;
  paidBy?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancelReason?: string;
}

// ============================================
// CHAT & NOTIFICATION DOCUMENTS
// ============================================

/**
 * Conversation stored in `conversations/{conversationId}`
 */
export interface FirestoreConversation extends FirestoreDocument {
  projectId?: string;
  participantIds: string[];
  isClosed: boolean;
  closedAt?: Date;
  closedBy?: string;
}

/**
 * Conversation participant stored in `conversations/{conversationId}/participants/{participantId}`
 */
export interface FirestoreConversationParticipant extends FirestoreDocument {
  conversationId: string;
  userId: string;
  lastReadAt?: Date;
  isActive: boolean;
}

/**
 * Message stored in `conversations/{conversationId}/messages/{messageId}`
 */
export interface FirestoreMessage extends FirestoreDocument {
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  attachments?: Attachment[];
  isRead: boolean;
  readAt?: Date;
  readBy?: ReadReceipt[];
  isDeleted: boolean;
  deletedAt?: Date;
}

/**
 * Notification stored in `users/{userId}/notifications/{notificationId}`
 */
export interface FirestoreNotification extends FirestoreDocument {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  channels?: string[];
  isRead: boolean;
  readAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  emailError?: string;
  smsSent: boolean;
  smsSentAt?: Date;
  smsError?: string;
}

/**
 * Notification preference stored in `users/{userId}/preferences/notification`
 */
export interface FirestoreNotificationPreference extends FirestoreDocument {
  userId: string;
  emailEnabled: boolean;
  emailBidReceived: boolean;
  emailBidApproved: boolean;
  emailProjectMatched: boolean;
  emailNewMessage: boolean;
  emailEscrowReleased: boolean;
  smsEnabled: boolean;
  smsBidReceived: boolean;
  smsBidApproved: boolean;
  smsProjectMatched: boolean;
  smsNewMessage: boolean;
  smsEscrowReleased: boolean;
}

/**
 * Notification template stored in `notificationTemplates/{type}`
 */
export interface FirestoreNotificationTemplate extends FirestoreDocument {
  type: string;
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  inAppTitle: string;
  inAppBody: string;
  variables: string[];
  version: number;
}

/**
 * Scheduled notification stored in `scheduledNotifications/{id}`
 */
export interface FirestoreScheduledNotification extends FirestoreDocument {
  type: string;
  userId: string;
  projectId?: string;
  escrowId?: string;
  scheduledFor: Date;
  status: ScheduledNotificationStatus;
  sentAt?: Date;
  cancelledAt?: Date;
}

// ============================================
// REVIEW & RANKING DOCUMENTS
// ============================================

/**
 * Review stored in `reviews/{reviewId}`
 */
export interface FirestoreReview extends FirestoreDocument {
  projectId: string;
  reviewerId: string;
  contractorId: string;
  rating: number;
  comment?: string;
  images?: string[];
  qualityRating?: number;
  timelinessRating?: number;
  communicationRating?: number;
  valueRating?: number;
  response?: string;
  respondedAt?: Date;
  isPublic: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  helpfulCount: number;
}

/**
 * Review helpfulness vote stored in `reviews/{reviewId}/helpfulVotes/{voteId}`
 */
export interface FirestoreReviewHelpfulness extends FirestoreDocument {
  reviewId: string;
  userId: string;
}

/**
 * Review report stored in `reviewReports/{reportId}`
 */
export interface FirestoreReviewReport extends FirestoreDocument {
  reviewId: string;
  reporterId: string;
  reason: ReviewReportReason;
  description?: string;
  status: ReviewReportStatus;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
}

/**
 * Contractor ranking stored in `rankings/{contractorId}`
 */
export interface FirestoreContractorRanking extends FirestoreDocument {
  contractorId: string;
  ratingScore: number;
  projectsScore: number;
  responseScore: number;
  verificationScore: number;
  totalScore: number;
  rank: number;
  previousRank?: number;
  isFeatured: boolean;
  featuredAt?: Date;
  featuredBy?: string;
  totalProjects: number;
  completedProjects: number;
  totalReviews: number;
  averageRating: number;
  averageResponseTime: number;
  calculatedAt: Date;
}

/**
 * Contractor badge stored in `users/{userId}/badges/{badgeId}`
 */
export interface FirestoreContractorBadge extends FirestoreDocument {
  contractorId: string;
  badgeType: BadgeType;
  awardedAt: Date;
}

/**
 * Saved project stored in `users/{userId}/savedProjects/{projectId}`
 */
export interface FirestoreSavedProject extends FirestoreDocument {
  contractorId: string;
  projectId: string;
  savedAt: Date;
}

// ============================================
// SETTINGS & CONFIGURATION DOCUMENTS
// ============================================

/**
 * Settings document stored in `settings/{key}`
 */
export interface FirestoreSettings extends FirestoreDocument {
  key: string;
  value: unknown;
}

/**
 * Bidding settings stored in `settings/bidding`
 */
export interface FirestoreBiddingSettings extends FirestoreDocument {
  maxBidsPerProject: number;
  defaultBidDuration: number;
  minBidDuration: number;
  maxBidDuration: number;
  escrowPercentage: number;
  escrowMinAmount: number;
  escrowMaxAmount?: number;
  verificationFee: number;
  winFeePercentage: number;
  autoApproveHomeowner: boolean;
  autoApproveProject: boolean;
}

/**
 * Furniture PDF settings stored in `settings/furniturePdf`
 */
export interface FirestoreFurniturePdfSettings extends FirestoreDocument {
  // Company info
  companyName: string;
  companyTagline: string;
  companyLogo?: string;

  // Document settings
  documentTitle: string;

  // Colors (hex format)
  primaryColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;

  // Font sizes (in points)
  companyNameSize: number;
  documentTitleSize: number;
  sectionTitleSize: number;
  bodyTextSize: number;
  footerTextSize: number;

  // Section titles (customizable)
  apartmentInfoTitle: string;
  productsTitle: string;
  priceDetailsTitle: string;
  contactInfoTitle: string;
  totalLabel: string;

  // Footer settings
  footerNote: string;
  footerCopyright: string;

  // Contact info (optional, shown in PDF)
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  contactWebsite?: string;

  // Additional notes (shown before footer)
  additionalNotes?: string;
}

/**
 * Service fee stored in `serviceFees/{feeId}`
 */
export interface FirestoreServiceFee extends FirestoreDocument {
  name: string;
  code: string;
  type: ServiceFeeType;
  value: number;
  description?: string;
  isActive: boolean;
}

// ============================================
// CMS DOCUMENTS
// ============================================

/**
 * Page stored in `pages/{pageId}`
 */
export interface FirestorePage extends FirestoreDocument {
  slug: string;
  title: string;
  isActive: boolean;
  headerConfig?: Record<string, unknown>;
  footerConfig?: Record<string, unknown>;
}

/**
 * Page section stored in `pages/{pageId}/sections/{sectionId}`
 */
export interface FirestorePageSection extends FirestoreDocument {
  pageId: string;
  kind: string;
  order: number;
  data: Record<string, unknown>;
}

/**
 * Media asset stored in `mediaAssets/{assetId}`
 */
export interface FirestoreMediaAsset extends FirestoreDocument {
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  size?: number;
  mimeType?: string;
  tags?: string[];
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
}

// ============================================
// FURNITURE DOCUMENTS
// ============================================

/**
 * Furniture developer stored in `furnitureDevelopers/{developerId}`
 */
export interface FirestoreFurnitureDeveloper extends FirestoreDocument {
  name: string;
  imageUrl?: string;
}

/**
 * Furniture project stored in `furnitureProjects/{projectId}`
 */
export interface FirestoreFurnitureProject extends FirestoreDocument {
  name: string;
  code: string;
  imageUrl?: string;
  developerId: string;
}

/**
 * Furniture building stored in `furnitureBuildings/{buildingId}`
 */
export interface FirestoreFurnitureBuilding extends FirestoreDocument {
  name: string;
  code: string;
  imageUrl?: string;
  projectId: string;
  maxFloor: number;
  maxAxis: number;
}

/**
 * Furniture layout stored in `furnitureLayouts/{layoutId}`
 */
export interface FirestoreFurnitureLayout extends FirestoreDocument {
  layoutAxis: string;
  buildingCode: string;
  axis: number;
  apartmentType: string;
}

/**
 * Furniture apartment type stored in `furnitureApartmentTypes/{apartmentTypeId}`
 */
export interface FirestoreFurnitureApartmentType extends FirestoreDocument {
  buildingCode: string;
  apartmentType: string;
  imageUrl?: string;
  description?: string;
}

/**
 * Furniture category stored in `furnitureCategories/{categoryId}`
 */
export interface FirestoreFurnitureCategory extends FirestoreDocument {
  name: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

/**
 * Furniture product base stored in `furnitureProductBases/{baseId}`
 */
export interface FirestoreFurnitureProductBase extends FirestoreDocument {
  name: string;
  categoryId: string;
  description?: string;
  imageUrl?: string;
  allowFitIn: boolean;
  order: number;
  isActive: boolean;
}

/**
 * Furniture product variant stored in `furnitureProductBases/{baseId}/variants/{variantId}`
 */
export interface FirestoreFurnitureProductVariant extends FirestoreDocument {
  productBaseId: string;
  materialId: string;
  pricePerUnit: number;
  pricingType: 'LINEAR' | 'M2';
  length: number;
  width?: number;
  calculatedPrice: number;
  imageUrl?: string;
  order: number;
  isActive: boolean;
}

/**
 * Furniture material stored in `furnitureMaterials/{materialId}`
 */
export interface FirestoreFurnitureMaterial extends FirestoreDocument {
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
}

/**
 * Furniture fee stored in `furnitureFees/{feeId}`
 */
export interface FirestoreFurnitureFee extends FirestoreDocument {
  name: string;
  code: string;
  type: ServiceFeeType;
  value: number;
  applicability: string;
  description?: string;
  isActive: boolean;
  order: number;
}

/**
 * Furniture quotation stored in `furnitureQuotations/{quotationId}`
 */
export interface FirestoreFurnitureQuotation extends FirestoreDocument {
  leadId: string;
  developerName: string;
  projectName: string;
  buildingName: string;
  buildingCode: string;
  floor: number;
  axis: number;
  unitNumber: string;
  apartmentType: string;
  layoutImageUrl?: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  basePrice: number;
  fees: Array<{
    name: string;
    type: string;
    value: number;
    amount: number;
  }>;
  totalPrice: number;
}

// ============================================
// API KEY DOCUMENTS
// ============================================

/**
 * API key stored in `apiKeys/{keyId}`
 */
export interface FirestoreApiKey extends FirestoreDocument {
  name: string;
  description?: string;
  keyPrefix: string;
  keyHash: string;
  scope: ApiKeyScope;
  allowedEndpoints: string[];
  status: ApiKeyStatus;
  lastUsedAt?: Date;
  usageCount: number;
  expiresAt?: Date;
  createdBy: string;
}

/**
 * API key usage log stored in `apiKeys/{keyId}/usageLogs/{logId}`
 */
export interface FirestoreApiKeyUsageLog extends FirestoreDocument {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent?: string;
}

// ============================================
// FILTER TYPES
// ============================================

/**
 * Supported filter operators
 * @requirements 2.5
 */
export type FirestoreFilterOperator = 
  | '==' 
  | '!=' 
  | '<' 
  | '>' 
  | '<=' 
  | '>=' 
  | 'in' 
  | 'array-contains'
  | 'array-contains-any';

/**
 * Generic filter type for queries
 * @requirements 2.5
 */
export interface FirestoreFilter<T> {
  field: keyof T;
  operator: FirestoreFilterOperator;
  value: unknown;
}
