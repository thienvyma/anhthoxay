/**
 * Zod Schemas Index
 *
 * Central export point for all validation schemas organized by domain.
 * Import schemas from this file for consistent validation across the API.
 *
 * **Feature: api-refactoring**
 * **Requirements: 5.4**
 */

// ============================================
// AUTH SCHEMAS
// ============================================
export {
  loginSchema,
  registerSchema,
  refreshSchema,
  changePasswordSchema,
  accountTypeEnum,
  roleEnum,
  type LoginInput,
  type RegisterInput,
  type RefreshInput,
  type ChangePasswordInput,
  type AccountType,
  type Role,
} from './auth.schema';

// ============================================
// PAGE SCHEMAS
// ============================================
export {
  createPageSchema,
  updatePageSchema,
  createSectionSchema,
  updateSectionSchema,
  sectionKinds,
  type CreatePageInput,
  type UpdatePageInput,
  type CreateSectionInput,
  type UpdateSectionInput,
  type SectionKind,
} from './pages.schema';

// ============================================
// PRICING SCHEMAS
// ============================================
export {
  createServiceCategorySchema,
  updateServiceCategorySchema,
  createUnitPriceSchema,
  updateUnitPriceSchema,
  createMaterialCategorySchema,
  updateMaterialCategorySchema,
  createMaterialSchema,
  updateMaterialSchema,
  createFormulaSchema,
  updateFormulaSchema,
  calculateQuoteSchema,
  type CreateServiceCategoryInput,
  type UpdateServiceCategoryInput,
  type CreateUnitPriceInput,
  type UpdateUnitPriceInput,
  type CreateMaterialCategoryInput,
  type UpdateMaterialCategoryInput,
  type CreateMaterialInput,
  type UpdateMaterialInput,
  type CreateFormulaInput,
  type UpdateFormulaInput,
  type CalculateQuoteInput,
} from './pricing.schema';

// ============================================
// LEADS SCHEMAS
// ============================================
export {
  createLeadSchema,
  updateLeadSchema,
  leadsQuerySchema,
  type CreateLeadInput,
  type UpdateLeadInput,
  type LeadsQueryInput,
} from './leads.schema';

// ============================================
// BLOG SCHEMAS
// ============================================
export {
  createBlogCategorySchema,
  updateBlogCategorySchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  blogPostFilterSchema,
  createBlogCommentSchema,
  type CreateBlogCategoryInput,
  type UpdateBlogCategoryInput,
  type CreateBlogPostInput,
  type UpdateBlogPostInput,
  type BlogPostFilter,
  type CreateBlogCommentInput,
} from './blog.schema';

// ============================================
// MEDIA SCHEMAS
// ============================================
export {
  updateMediaSchema,
  type UpdateMediaInput,
} from './media.schema';

// ============================================
// SETTINGS SCHEMAS
// ============================================
export {
  updateSettingsSchema,
  type UpdateSettingsInput,
} from './settings.schema';

// ============================================
// USERS SCHEMAS
// ============================================
export {
  UserRoleSchema,
  UserStatusSchema,
  CreateUserSchema,
  UpdateUserSchema,
  ListUsersQuerySchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ListUsersQuery,
} from './users.schema';

// ============================================
// CONTRACTOR SCHEMAS
// ============================================
export {
  certificateSchema,
  CreateContractorProfileSchema,
  UpdateContractorProfileSchema,
  ListContractorsQuerySchema,
  VerifyContractorSchema,
  verificationStatusEnum,
  type Certificate,
  type CreateContractorProfileInput,
  type UpdateContractorProfileInput,
  type ListContractorsQuery,
  type VerifyContractorInput,
  type VerificationStatus,
} from './contractor.schema';

// ============================================
// REGION SCHEMAS
// ============================================
export {
  regionLevelEnum,
  CreateRegionSchema,
  UpdateRegionSchema,
  RegionQuerySchema,
  type RegionLevel,
  type CreateRegionInput,
  type UpdateRegionInput,
  type RegionQuery,
} from './region.schema';

// ============================================
// BIDDING SETTINGS SCHEMAS
// ============================================
export {
  UpdateBiddingSettingsSchema,
  type UpdateBiddingSettingsInput,
  type PublicBiddingSettings,
  type BiddingSettings,
} from './bidding-settings.schema';

// ============================================
// SERVICE FEE SCHEMAS
// ============================================
export {
  serviceFeeTypeEnum,
  CreateServiceFeeSchema,
  UpdateServiceFeeSchema,
  ServiceFeeQuerySchema,
  type ServiceFeeType,
  type CreateServiceFeeInput,
  type UpdateServiceFeeInput,
  type ServiceFeeQuery,
  type ServiceFee,
} from './service-fee.schema';

// ============================================
// PROJECT SCHEMAS
// ============================================
export {
  projectStatusEnum,
  CreateProjectSchema,
  UpdateProjectSchema,
  SubmitProjectSchema,
  ProjectQuerySchema,
  PublicProjectQuerySchema,
  AdminProjectQuerySchema,
  ApproveProjectSchema,
  RejectProjectSchema,
  type ProjectStatus,
  type CreateProjectInput,
  type UpdateProjectInput,
  type SubmitProjectInput,
  type ProjectQuery,
  type PublicProjectQuery,
  type AdminProjectQuery,
  type ApproveProjectInput,
  type RejectProjectInput,
} from './project.schema';

// ============================================
// BID SCHEMAS
// ============================================
export {
  bidStatusEnum,
  BidAttachmentSchema,
  CreateBidSchema,
  UpdateBidSchema,
  BidQuerySchema,
  AdminBidQuerySchema,
  ApproveBidSchema,
  RejectBidSchema,
  type BidStatus,
  type BidAttachment,
  type CreateBidInput,
  type UpdateBidInput,
  type BidQuery,
  type AdminBidQuery,
  type ApproveBidInput,
  type RejectBidInput,
} from './bid.schema';

// ============================================
// MILESTONE SCHEMAS
// ============================================
export {
  milestoneStatusEnum,
  RequestMilestoneSchema,
  ConfirmMilestoneSchema,
  DisputeMilestoneSchema,
  MilestoneQuerySchema,
  type MilestoneStatus,
  type RequestMilestoneInput,
  type ConfirmMilestoneInput,
  type DisputeMilestoneInput,
  type MilestoneQuery,
} from './milestone.schema';

// ============================================
// ESCROW SCHEMAS
// ============================================
export {
  escrowStatusEnum,
  EscrowTransactionSchema,
  CreateEscrowSchema,
  UpdateEscrowSchema,
  EscrowQuerySchema,
  ConfirmEscrowSchema,
  ReleaseEscrowSchema,
  PartialReleaseEscrowSchema,
  RefundEscrowSchema,
  DisputeEscrowSchema,
  type EscrowStatus,
  type EscrowTransaction,
  type CreateEscrowInput,
  type UpdateEscrowInput,
  type EscrowQuery,
  type ConfirmEscrowInput,
  type ReleaseEscrowInput,
  type PartialReleaseEscrowInput,
  type RefundEscrowInput,
  type DisputeEscrowInput,
} from './escrow.schema';

// ============================================
// FEE TRANSACTION SCHEMAS
// ============================================
export {
  feeTypeEnum,
  feeStatusEnum,
  CreateFeeSchema,
  FeeQuerySchema,
  MarkFeePaidSchema,
  CancelFeeSchema,
  FeeExportQuerySchema,
  type FeeType,
  type FeeStatus,
  type CreateFeeInput,
  type FeeQuery,
  type MarkFeePaidInput,
  type CancelFeeInput,
  type FeeExportQuery,
} from './fee.schema';

// ============================================
// MATCH SCHEMAS
// ============================================
export {
  SelectBidSchema,
  MatchQuerySchema,
  CancelMatchSchema,
  StartProjectSchema,
  CompleteProjectSchema,
  type SelectBidInput,
  type MatchQuery,
  type CancelMatchInput,
  type StartProjectInput,
  type CompleteProjectInput,
} from './match.schema';

// ============================================
// NOTIFICATION SCHEMAS
// ============================================
export {
  notificationTypeEnum,
  CreateNotificationSchema,
  NotificationQuerySchema,
  MarkNotificationReadSchema,
  type NotificationType,
  type CreateNotificationInput,
  type NotificationQuery,
  type MarkNotificationReadInput,
} from './notification.schema';

// ============================================
// DISPUTE SCHEMAS
// ============================================
export {
  disputeStatusEnum,
  disputeResolutionTypeEnum,
  RaiseDisputeSchema,
  ResolveDisputeSchema,
  DisputeQuerySchema,
  type DisputeStatus,
  type DisputeResolutionType,
  type RaiseDisputeInput,
  type ResolveDisputeInput,
  type DisputeQuery,
} from './dispute.schema';

// ============================================
// CHAT SCHEMAS
// ============================================
export {
  messageTypeEnum,
  AttachmentSchema,
  CreateConversationSchema,
  SendMessageSchema,
  MessageQuerySchema,
  ConversationQuerySchema,
  AdminConversationQuerySchema,
  AdminSendSystemMessageSchema,
  CloseConversationSchema,
  SearchMessagesSchema,
  type MessageType,
  type Attachment,
  type CreateConversationInput,
  type SendMessageInput,
  type MessageQuery,
  type ConversationQuery,
  type AdminConversationQuery,
  type AdminSendSystemMessageInput,
  type CloseConversationInput,
  type SearchMessagesQuery,
} from './chat.schema';

// ============================================
// NOTIFICATION PREFERENCE SCHEMAS
// ============================================
export {
  notificationChannelEnum,
  notificationEventTypeEnum,
  UpdateNotificationPreferenceSchema,
  SendNotificationInputSchema,
  BulkSendNotificationInputSchema,
  SendEmailInputSchema,
  SendSMSInputSchema,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationChannel,
  type NotificationEventType,
  type UpdateNotificationPreferenceInput,
  type NotificationPreferenceResponse,
  type SendNotificationInput,
  type BulkSendNotificationInput,
  type SendEmailInput,
  type SendSMSInput,
} from './notification-preference.schema';

// ============================================
// NOTIFICATION TEMPLATE SCHEMAS
// ============================================
export {
  notificationTemplateTypeEnum,
  CreateNotificationTemplateSchema,
  UpdateNotificationTemplateSchema,
  NotificationTemplateQuerySchema,
  RenderTemplateInputSchema,
  DEFAULT_NOTIFICATION_TEMPLATES,
  type NotificationTemplateType,
  type CreateNotificationTemplateInput,
  type UpdateNotificationTemplateInput,
  type NotificationTemplateQuery,
  type RenderTemplateInput,
  type NotificationTemplateResponse,
  type RenderedTemplate,
} from './notification-template.schema';

// ============================================
// SCHEDULED NOTIFICATION SCHEMAS
// ============================================
export {
  SCHEDULED_NOTIFICATION_TYPES,
  SCHEDULED_NOTIFICATION_STATUSES,
  CreateScheduledNotificationSchema,
  ScheduledNotificationQuerySchema,
  type ScheduledNotificationType,
  type ScheduledNotificationStatus,
  type CreateScheduledNotificationInput,
  type ScheduledNotificationQuery,
  type ScheduledNotificationResponse,
  type ScheduledNotificationListResult,
  type JobProcessingResult,
} from './scheduled-notification.schema';

// ============================================
// UNSUBSCRIBE SCHEMAS
// ============================================
export {
  UnsubscribeTokenSchema,
  UnsubscribePreferencesSchema,
  CRITICAL_NOTIFICATION_TYPES,
  isCriticalNotificationType,
  type UnsubscribeTokenInput,
  type UnsubscribePreferencesInput,
  type UnsubscribePageData,
  type UnsubscribeResult,
  type CriticalNotificationType,
} from './unsubscribe.schema';

// ============================================
// REVIEW SCHEMAS
// ============================================
export {
  MAX_REVIEW_IMAGES,
  REVIEW_UPDATE_WINDOW_DAYS,
  CreateReviewSchema,
  UpdateReviewSchema,
  ReviewQuerySchema,
  PublicReviewQuerySchema,
  AdminReviewQuerySchema,
  AddResponseSchema,
  HideReviewSchema,
  type CreateReviewInput,
  type UpdateReviewInput,
  type ReviewQuery,
  type PublicReviewQuery,
  type AdminReviewQuery,
  type AddResponseInput,
  type HideReviewInput,
} from './review.schema';

// ============================================
// RANKING SCHEMAS
// ============================================
export {
  RANKING_WEIGHTS,
  MAX_FEATURED_CONTRACTORS,
  DEFAULT_FEATURED_LIMIT,
  RankingQuerySchema,
  FeaturedQuerySchema,
  SetFeaturedSchema,
  StatsQuerySchema,
  type RankingQuery,
  type FeaturedQuery,
  type SetFeaturedInput,
  type StatsQuery,
} from './ranking.schema';

// ============================================
// REPORT SCHEMAS
// ============================================
export {
  REPORT_REASONS,
  REPORT_STATUSES,
  RESOLUTION_ACTIONS,
  CreateReportSchema,
  ResolveReportSchema,
  ReportQuerySchema,
  type ReportReason,
  type ReportStatus,
  type ResolutionAction,
  type CreateReportInput,
  type ResolveReportInput,
  type ReportQuery,
} from './report.schema';

// ============================================
// BADGE SCHEMAS
// ============================================
export {
  BADGE_TYPES,
  BADGE_CRITERIA,
  BADGE_INFO,
  BadgeTypeSchema,
  BadgeResponseSchema,
  BadgeQuerySchema,
  type BadgeType,
  type BadgeResponse,
  type BadgeQuery,
} from './badge.schema';

// ============================================
// ACTIVITY SCHEMAS
// ============================================
export {
  ActivityTypeEnum,
  ActivityQuerySchema,
  type ActivityType,
  type ActivityQuery,
  type Activity,
} from './activity.schema';

// ============================================
// SAVED PROJECT SCHEMAS
// ============================================
export {
  ListSavedProjectsQuerySchema,
  type ListSavedProjectsQuery,
  type SavedProjectResponse,
} from './saved-project.schema';

// ============================================
// FURNITURE SCHEMAS
// ============================================
export {
  // Developer schemas
  createDeveloperSchema,
  updateDeveloperSchema,
  // Project schemas
  createProjectSchema,
  updateProjectSchema,
  // Building schemas
  createBuildingSchema,
  updateBuildingSchema,
  // Layout schemas
  createLayoutSchema,
  updateLayoutSchema,
  // Apartment Type schemas
  createApartmentTypeSchema,
  updateApartmentTypeSchema,
  // Category schemas
  createCategorySchema,
  updateCategorySchema,
  // Product schemas
  pricingTypeEnum,
  productMappingInputSchema,
  addProductMappingSchema,
  createProductSchema,
  updateProductSchema,
  // Fee schemas
  feeTypeEnum as furnitureFeeTypeEnum,
  feeApplicabilityEnum,
  createFeeSchema as createFurnitureFeeSchema,
  updateFeeSchema as updateFurnitureFeeSchema,
  // Quotation schemas
  quotationItemSchema,
  createQuotationSchema,
  // Query schemas
  queryProjectsSchema,
  queryBuildingsSchema,
  queryLayoutsSchema,
  queryLayoutByAxisSchema,
  queryApartmentTypesSchema,
  queryProductsSchema,
  queryFeesSchema,
  queryQuotationsSchema,
  // Types
  type CreateDeveloperInput,
  type UpdateDeveloperInput,
  type CreateProjectInput as CreateFurnitureProjectInput,
  type UpdateProjectInput as UpdateFurnitureProjectInput,
  type CreateBuildingInput,
  type UpdateBuildingInput,
  type CreateLayoutInput,
  type UpdateLayoutInput,
  type CreateApartmentTypeInput,
  type UpdateApartmentTypeInput,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type ProductMappingInput,
  type AddProductMappingInput,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateFeeInput as CreateFurnitureFeeInput,
  type UpdateFeeInput as UpdateFurnitureFeeInput,
  type QuotationItemInput,
  type CreateQuotationInput,
  type QueryProjectsInput,
  type QueryBuildingsInput,
  type QueryLayoutsInput,
  type QueryLayoutByAxisInput,
  type QueryApartmentTypesInput,
  type QueryProductsInput,
  type QueryFeesInput,
  type QueryQuotationsInput,
} from './furniture.schema';

// ============================================
// API KEY SCHEMAS
// ============================================
export {
  apiKeyScopeEnum,
  apiKeyStatusEnum,
  endpointGroupEnum,
  CreateApiKeySchema,
  UpdateApiKeySchema,
  ListApiKeysQuerySchema,
  type ApiKeyScope,
  type ApiKeyStatus,
  type EndpointGroup,
  type CreateApiKeyInput,
  type UpdateApiKeyInput,
  type ListApiKeysQuery,
} from './api-key.schema';
