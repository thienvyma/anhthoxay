/**
 * Firestore Services Index
 * 
 * Re-exports all Firestore services for easy importing.
 * 
 * @module services/firestore
 */

// Base service
export {
  BaseFirestoreService,
  SubcollectionFirestoreService,
  timestampToDate,
  dateToTimestamp,
  type FirestoreDocument,
  type FilterOperator,
  type WhereClause,
  type OrderByClause,
  type QueryOptions,
  type PaginatedResult,
  type BatchUpdateItem,
} from './base.firestore';

// Settings service
export {
  SettingsFirestoreService,
  getSettingsFirestoreService,
} from './settings.firestore';

// Region service
export {
  RegionFirestoreService,
  RegionFirestoreError,
  getRegionFirestoreService,
  type RegionTreeNode,
  type RegionQueryOptions,
  type CreateRegionInput,
  type UpdateRegionInput,
} from './region.firestore';

// Service Fee service
export {
  ServiceFeeFirestoreService,
  ServiceFeeFirestoreError,
  getServiceFeeFirestoreService,
  type CreateServiceFeeInput,
  type UpdateServiceFeeInput,
} from './service-fee.firestore';

// Users service
export {
  UsersFirestoreService,
  UsersFirestoreError,
  getUsersFirestoreService,
  type CreateUserInput,
  type UpdateUserInput,
  type CreateContractorProfileInput,
  type UpdateContractorProfileInput,
  type UserQueryOptions,
} from './users.firestore';

// Leads service
export {
  LeadsFirestoreService,
  LeadsFirestoreError,
  getLeadsFirestoreService,
  type CreateLeadInput as CreateLeadFirestoreInput,
  type CreateLeadResult,
  type UpdateLeadInput as UpdateLeadFirestoreInput,
  type LeadsQueryParams,
  type RelatedLeadSummary,
  type RelatedLeadsResult,
  type MergeLeadsInput as MergeLeadsFirestoreInput,
  type MergeLeadsResult,
  type DailyLeadCount,
  type LeadsStatsResult,
} from './leads.firestore';

// Blog service
export {
  BlogCategoryFirestoreService,
  BlogPostFirestoreService,
  BlogCommentFirestoreService,
  BlogFirestoreError,
  getBlogCategoryFirestoreService,
  getBlogPostFirestoreService,
  getBlogCommentFirestoreService,
  type CreateBlogCategoryInput,
  type UpdateBlogCategoryInput,
  type CreateBlogPostInput,
  type UpdateBlogPostInput,
  type CreateBlogCommentInput,
  type BlogPostQueryParams,
  type BlogCommentQueryParams,
} from './blog.firestore';

// Pricing service
export {
  FormulaFirestoreService,
  ServiceCategoryFirestoreService,
  UnitPriceFirestoreService,
  MaterialCategoryFirestoreService,
  MaterialFirestoreService,
  QuoteCalculationService,
  PricingFirestoreError,
  getFormulaFirestoreService,
  getServiceCategoryFirestoreService,
  getUnitPriceFirestoreService,
  getMaterialCategoryFirestoreService,
  getMaterialFirestoreService,
  getQuoteCalculationService,
  generateSlug,
  type FormulaDoc,
  type ServiceCategoryDoc,
  type ServiceCategoryWithFormula,
  type UnitPriceDoc,
  type MaterialCategoryDoc,
  type MaterialCategoryWithCount,
  type MaterialDoc,
  type MaterialWithCategory,
  type CreateFormulaInput,
  type UpdateFormulaInput,
  type CreateServiceCategoryInput as CreateServiceCategoryFirestoreInput,
  type UpdateServiceCategoryInput as UpdateServiceCategoryFirestoreInput,
  type CreateUnitPriceInput as CreateUnitPriceFirestoreInput,
  type UpdateUnitPriceInput as UpdateUnitPriceFirestoreInput,
  type CreateMaterialCategoryInput as CreateMaterialCategoryFirestoreInput,
  type UpdateMaterialCategoryInput as UpdateMaterialCategoryFirestoreInput,
  type CreateMaterialInput as CreateMaterialFirestoreInput,
  type UpdateMaterialInput as UpdateMaterialFirestoreInput,
  type QuoteCalculationInput,
  type QuoteCalculationResult,
  type SelectedMaterial,
} from './pricing.firestore';

// Pages service
export {
  PageFirestoreService,
  SectionFirestoreService,
  PagesFirestoreError,
  getPageFirestoreService,
  getSectionFirestoreService,
  type PageDoc,
  type SectionDoc,
  type PageWithSections,
  type PageWithSectionCount,
  type CreatePageInput as CreatePageFirestoreInput,
  type UpdatePageInput as UpdatePageFirestoreInput,
  type CreateSectionInput as CreateSectionFirestoreInput,
  type UpdateSectionInput as UpdateSectionFirestoreInput,
} from './pages.firestore';

// Project service
export {
  ProjectFirestoreService,
  BidSubcollectionService,
  ProjectFirestoreError,
  getProjectFirestoreService,
  PROJECT_STATUS_TRANSITIONS,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectQueryParams,
  type ProjectWithBidCount,
  type PublicProject,
} from './project.firestore';

// Bid service
export {
  BidFirestoreService,
  BidSubcollectionService as BidSubcollection,
  BidFirestoreError,
  getBidFirestoreService,
  BID_STATUS_TRANSITIONS,
  type CreateBidInput as CreateBidFirestoreInput,
  type UpdateBidInput as UpdateBidFirestoreInput,
  type BidQueryParams,
  type BidWithProject,
  type BidWithContractor,
  type BidWithRelations,
  type AnonymousBid,
  type PaginatedBidResult,
} from './bid.firestore';

// Escrow service
export {
  EscrowFirestoreService,
  MilestoneSubcollectionService,
  EscrowFirestoreError,
  getEscrowFirestoreService,
  ESCROW_STATUS_TRANSITIONS,
  type CreateEscrowInput,
  type EscrowQueryParams,
  type EscrowWithRelations,
  type PaginatedEscrowResult,
  type EscrowAmount,
  type PartialReleaseInput,
  type RefundInput,
  type DisputeInput,
} from './escrow.firestore';

// Fee service
export {
  FeeFirestoreService,
  FeeFirestoreError,
  getFeeFirestoreService,
  FEE_STATUS_TRANSITIONS,
  type CreateFeeInput as CreateFeeFirestoreInput,
  type FeeQueryParams,
  type FeeWithRelations,
  type PaginatedFeeResult,
  type WinFeeCalculation,
  type MarkFeePaidInput,
  type CancelFeeInput,
} from './fee.firestore';

// Chat service
export {
  ChatFirestoreService,
  ChatFirestoreError,
  chatFirestoreService,
  type CreateConversationInput,
  type SendMessageInput,
  type ConversationQuery,
  type AdminConversationQuery,
  type MessageQuery,
  type SearchMessagesQuery,
  type ConversationWithDetails,
  type ParticipantWithUser,
  type ConversationListResult,
  type MessageListResult,
} from './chat.firestore';

// Notification service
export {
  NotificationFirestoreService,
  NotificationFirestoreError,
  notificationFirestoreService,
  type CreateNotificationInput,
  type NotificationQuery,
  type NotificationListResult,
  type NotificationData,
} from './notification.firestore';

// Notification Template service
export {
  NotificationTemplateFirestoreService,
  NotificationTemplateFirestoreError,
  notificationTemplateFirestoreService,
  type NotificationTemplateType,
  type CreateNotificationTemplateInput,
  type UpdateNotificationTemplateInput,
  type RenderedTemplate,
} from './notification-template.firestore';

// Scheduled Notification service
export {
  ScheduledNotificationFirestoreService,
  ScheduledNotificationFirestoreError,
  scheduledNotificationFirestoreService,
  type CreateScheduledNotificationInput,
  type ScheduledNotificationQuery,
  type ScheduledNotificationListResult,
} from './scheduled-notification.firestore';

// Review service
export {
  ReviewFirestoreService,
  ReviewReportFirestoreService,
  ReviewFirestoreError,
  getReviewFirestoreService,
  getReviewReportFirestoreService,
  type CreateReviewInput as CreateReviewFirestoreInput,
  type UpdateReviewInput as UpdateReviewFirestoreInput,
  type AddResponseInput as AddResponseFirestoreInput,
  type ReviewQueryParams,
  type CreateReportInput as CreateReportFirestoreInput,
  type ResolveReportInput as ResolveReportFirestoreInput,
  type ReportQueryParams,
  type ReviewSummary,
  type ReviewWithRelations,
} from './review.firestore';

// Ranking service
export {
  RankingFirestoreService,
  RankingFirestoreError,
  getRankingFirestoreService,
  RANKING_WEIGHTS,
  MAX_FEATURED_CONTRACTORS,
  type RankingScore,
  type RankingQueryParams,
  type FeaturedQueryParams,
  type ContractorStats,
  type MonthlyStats,
  type RankingWithContractor,
} from './ranking.firestore';

// Badge service
export {
  BadgeFirestoreService,
  BadgeFirestoreError,
  getBadgeFirestoreService,
  BADGE_DEFINITIONS,
  type AwardBadgeInput,
  type BadgeWithDefinition,
} from './badge.firestore';

// Furniture Developer service
export {
  FurnitureDeveloperFirestoreService,
  FurnitureProjectFirestoreService,
  FurnitureBuildingFirestoreService,
  FurnitureLayoutFirestoreService,
  FurnitureApartmentTypeFirestoreService,
  FurnitureDeveloperFirestoreError,
  getFurnitureDeveloperFirestoreService,
  getFurnitureProjectFirestoreService,
  getFurnitureBuildingFirestoreService,
  getFurnitureLayoutFirestoreService,
  getFurnitureApartmentTypeFirestoreService,
  type CreateDeveloperInput as CreateFurnitureDeveloperInput,
  type UpdateDeveloperInput as UpdateFurnitureDeveloperInput,
  type CreateProjectInput as CreateFurnitureProjectInput,
  type UpdateProjectInput as UpdateFurnitureProjectInput,
  type CreateBuildingInput as CreateFurnitureBuildingInput,
  type UpdateBuildingInput as UpdateFurnitureBuildingInput,
  type CreateLayoutInput as CreateFurnitureLayoutInput,
  type UpdateLayoutInput as UpdateFurnitureLayoutInput,
  type CreateApartmentTypeInput as CreateFurnitureApartmentTypeInput,
  type UpdateApartmentTypeInput as UpdateFurnitureApartmentTypeInput,
  type ProjectWithDeveloper,
  type BuildingWithProject,
} from './furniture-developer.firestore';

// Furniture Product service
export {
  FurnitureCategoryFirestoreService,
  FurnitureMaterialFirestoreService,
  FurnitureFeeFirestoreService,
  FurnitureProductVariantFirestoreService,
  FurnitureProductMappingFirestoreService,
  FurnitureProductBaseFirestoreService,
  FurnitureProductFirestoreError,
  getFurnitureCategoryFirestoreService,
  getFurnitureMaterialFirestoreService,
  getFurnitureFeeFirestoreService,
  getFurnitureProductVariantFirestoreService,
  getFurnitureProductMappingFirestoreService,
  getFurnitureProductBaseFirestoreService,
  calculateVariantPrice as calculateFurnitureVariantPrice,
  calculatePriceRange as calculateFurniturePriceRange,
  type CreateCategoryInput as CreateFurnitureCategoryInput,
  type UpdateCategoryInput as UpdateFurnitureCategoryInput,
  type CreateMaterialInput as CreateFurnitureMaterialInput,
  type UpdateMaterialInput as UpdateFurnitureMaterialInput,
  type CreateFeeInput as CreateFurnitureFeeInput,
  type UpdateFeeInput as UpdateFurnitureFeeInput,
  type CreateVariantInput as CreateFurnitureVariantInput,
  type UpdateVariantInput as UpdateFurnitureVariantInput,
  type ProductMappingInput as FurnitureProductMappingInput,
  type CreateProductBaseInput as CreateFurnitureProductBaseInput,
  type UpdateProductBaseInput as UpdateFurnitureProductBaseInput,
  type CategoryWithCount as FurnitureCategoryWithCount,
  type VariantWithMaterial as FurnitureVariantWithMaterial,
  type ProductBaseWithDetails as FurnitureProductBaseWithDetails,
  type ProductMapping as FurnitureProductMapping,
  type ProductBaseGroup as FurnitureProductBaseGroup,
  type ProductVariantForLanding as FurnitureProductVariantForLanding,
  type GetProductBasesAdminQuery as GetFurnitureProductBasesAdminQuery,
  type PaginatedProductBases as PaginatedFurnitureProductBases,
} from './furniture-product.firestore';

// Furniture Quotation service
export {
  FurnitureQuotationFirestoreService,
  FurnitureQuotationFirestoreError,
  getFurnitureQuotationFirestoreService,
  calculateQuotation as calculateFurnitureQuotation,
  calculateUnitNumber as calculateFurnitureUnitNumber,
  calculateFitInFee as calculateFurnitureFitInFee,
  calculateLineTotal as calculateFurnitureLineTotal,
  calculateGrandTotal as calculateFurnitureGrandTotal,
  type QuotationItem as FurnitureQuotationItem,
  type FeeBreakdown as FurnitureFeeBreakdown,
  type QuotationCalculation as FurnitureQuotationCalculation,
  type CreateQuotationInput as CreateFurnitureQuotationInput,
} from './furniture-quotation.firestore';
