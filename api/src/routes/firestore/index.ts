/**
 * Firestore Routes Index
 * 
 * Re-exports all Firestore-based route factories.
 * These routes use Firestore instead of Prisma/PostgreSQL.
 * 
 * @module routes/firestore
 */

// Auth routes
export { authFirestoreRoutes, createAuthFirestoreRoutes } from './auth.firestore.routes';

// Settings routes
export { createSettingsFirestoreRoutes } from './settings.firestore.routes';

// Region routes
export { 
  createRegionFirestoreRoutes, 
  createAdminRegionFirestoreRoutes 
} from './region.firestore.routes';

// Service Fee routes
export { 
  createServiceFeeFirestoreRoutes, 
  createAdminServiceFeeFirestoreRoutes 
} from './service-fee.firestore.routes';

// Users routes
export { usersFirestoreRoutes } from './users.firestore.routes';

// Contractor routes
export { 
  contractorFirestoreRoutes, 
  adminContractorFirestoreRoutes 
} from './contractor.firestore.routes';

// Leads routes
export { 
  createLeadsFirestoreRoutes, 
  createAdminLeadsFirestoreRoutes 
} from './leads.firestore.routes';

// Blog routes
export {
  createBlogFirestoreRoutes,
  createAdminBlogFirestoreRoutes,
} from './blog.firestore.routes';

// Pricing routes
export {
  createPricingFirestoreRoutes,
  createAdminPricingFirestoreRoutes,
} from './pricing.firestore.routes';

// Pages routes
export {
  createPagesFirestoreRoutes,
  createSectionsFirestoreRoutes,
} from './pages.firestore.routes';

// Project routes
export {
  createPublicProjectFirestoreRoutes,
  createHomeownerProjectFirestoreRoutes,
  createAdminProjectFirestoreRoutes,
} from './project.firestore.routes';

// Bid routes
export {
  createContractorBidFirestoreRoutes,
  createAdminBidFirestoreRoutes,
} from './bid.firestore.routes';

// Escrow routes
export {
  createAdminEscrowFirestoreRoutes,
} from './escrow.firestore.routes';

// Fee routes
export {
  createAdminFeeFirestoreRoutes,
} from './fee.firestore.routes';

// Match routes
export {
  createHomeownerMatchFirestoreRoutes,
  createAdminMatchFirestoreRoutes,
} from './match.firestore.routes';

// Chat routes
export {
  chatFirestoreRoutes,
  adminChatFirestoreRoutes,
} from './chat.firestore.routes';

// Notification routes
export { notificationFirestoreRoutes } from './notification.firestore.routes';

// Notification Template routes
export { notificationTemplateFirestoreRoutes } from './notification-template.firestore.routes';

// Scheduled Notification routes
export { scheduledNotificationFirestoreRoutes } from './scheduled-notification.firestore.routes';

// Review routes
export {
  createHomeownerReviewFirestoreRoutes,
  createContractorReviewFirestoreRoutes,
  createPublicReviewFirestoreRoutes,
  createAdminReviewFirestoreRoutes,
} from './review.firestore.routes';

// Ranking routes
export {
  createPublicRankingFirestoreRoutes,
  createContractorRankingFirestoreRoutes,
  createAdminRankingFirestoreRoutes,
} from './ranking.firestore.routes';

// Report routes
export {
  createPublicReportFirestoreRoutes,
  createAdminReportFirestoreRoutes,
} from './report.firestore.routes';

// Furniture routes
export {
  createFurnitureFirestorePublicRoutes,
  createFurnitureFirestoreAdminRoutes,
} from './furniture.firestore.routes';


// Health routes
export { 
  createHealthFirestoreRoutes, 
  healthFirestoreRoutes,
  setShutdownState,
  setFirebaseReadyCheck,
} from './health.firestore.routes';


// Media routes
export { createMediaFirestoreRoutes, mediaFirestoreRoutes } from './media.firestore.routes';


// Admin utility routes
export {
  createRateLimitFirestoreRoutes,
  createQueueHealthFirestoreRoutes,
  createCDNFirestoreRoutes,
  createIPBlockingFirestoreRoutes,
  rateLimitFirestoreRoutes,
  queueHealthFirestoreRoutes,
  cdnFirestoreRoutes,
  ipBlockingFirestoreRoutes,
} from './admin-utils.firestore.routes';

// Dashboard routes
export {
  createDashboardFirestoreRoutes,
  dashboardFirestoreRoutes,
} from './dashboard.firestore.routes';

// Bidding Settings routes
export {
  createBiddingSettingsFirestoreRoutes,
  createAdminBiddingSettingsFirestoreRoutes,
} from './bidding-settings.firestore.routes';

// Disputes routes
export {
  createAdminDisputesFirestoreRoutes,
} from './disputes.firestore.routes';
