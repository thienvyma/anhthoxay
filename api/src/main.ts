/**
 * ANH THỢ XÂY API - Main Entry Point
 *
 * This file handles:
 * - Environment setup
 * - Middleware configuration
 * - Route mounting
 * - Server startup
 *
 * **Feature: api-refactoring**
 * **Requirements: 1.1, 1.4**
 */

import { hostname } from 'os';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { User } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Prisma singleton import
import { prisma } from './utils/prisma';

// Middleware imports
import { rateLimit } from './middleware';
import { securityHeaders } from './middleware/security-headers';
import { correlationId } from './middleware/correlation-id';
import { errorHandler } from './middleware/error-handler';
import { createCorsMiddleware } from './config/cors';
import { successResponse } from './utils/response';

// Route imports
import { createAuthRoutes } from './routes/auth.routes';
import { createPagesRoutes, createSectionsRoutes } from './routes/pages.routes';
import { createMediaRoutes } from './routes/media.routes';
import { createLeadsRoutes } from './routes/leads.routes';
import { createPricingRoutes } from './routes/pricing.routes';
import { createBlogRoutes } from './routes/blog.routes';
import { createSettingsRoutes } from './routes/settings.routes';
import { createIntegrationsRoutes } from './routes/integrations.routes';
import { createUsersRoutes } from './routes/users.routes';
import { createContractorRoutes, createAdminContractorRoutes } from './routes/contractor.routes';
import { createRegionRoutes, createAdminRegionRoutes } from './routes/region.routes';
import { createBiddingSettingsRoutes, createAdminBiddingSettingsRoutes } from './routes/bidding-settings.routes';
import { createServiceFeeRoutes, createAdminServiceFeeRoutes } from './routes/service-fee.routes';
import { createPublicProjectRoutes, createHomeownerProjectRoutes, createAdminProjectRoutes } from './routes/project.routes';
import { createContractorBidRoutes, createAdminBidRoutes } from './routes/bid.routes';
import { createAdminEscrowRoutes } from './routes/escrow.routes';
import { createAdminFeeRoutes } from './routes/fee.routes';
import { createAdminMatchRoutes } from './routes/match.routes';
import { createHomeownerDisputeRoutes, createContractorDisputeRoutes, createAdminDisputeRoutes } from './routes/dispute.routes';
import { createChatRoutes, createAdminChatRoutes } from './routes/chat.routes';
import { createNotificationRoutes } from './routes/notification.routes';
import { createNotificationTemplateRoutes } from './routes/notification-template.routes';
import { createAdminScheduledNotificationRoutes } from './routes/scheduled-notification.routes';
import { createUnsubscribeRoutes } from './routes/unsubscribe.routes';
import { 
  createHomeownerReviewRoutes, 
  createContractorReviewRoutes, 
  createPublicReviewRoutes, 
  createAdminReviewRoutes 
} from './routes/review.routes';
import { createPublicRankingRoutes, createAdminRankingRoutes } from './routes/ranking.routes';
import { createPublicReportRoutes, createAdminReportRoutes } from './routes/report.routes';
import { createSavedProjectRoutes } from './routes/saved-project.routes';
import { createActivityRoutes } from './routes/activity.routes';
import { createAdminDashboardRoutes } from './routes/dashboard.routes';
import { createFurniturePublicRoutes, createFurnitureAdminRoutes } from './routes/furniture.routes';

// Service imports
import { AuthService } from './services/auth.service';

// ============================================
// ENVIRONMENT SETUP
// ============================================

function findProjectRoot(startPath: string): string {
  let currentPath = startPath;
  while (currentPath !== path.dirname(currentPath)) {
    if (
      fs.existsSync(path.join(currentPath, '.env')) ||
      fs.existsSync(path.join(currentPath, 'infra', 'prisma', 'schema.prisma'))
    ) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  return startPath;
}

const projectRoot = findProjectRoot(process.cwd());
const envPath = path.join(projectRoot, '.env');

// Set DATABASE_URL to correct absolute path
const dbPath = path.join(projectRoot, 'infra', 'prisma', 'dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;

// Load other env vars from .env file
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && match[1] !== 'DATABASE_URL') {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
}

console.log('🔧 ANH THỢ XÂY API Starting...');
console.log('📁 Project root:', projectRoot);
console.log('🗄️ DATABASE_URL:', process.env.DATABASE_URL);

// ============================================
// APP INITIALIZATION
// ============================================

const app = new Hono<{ Variables: { user?: User; correlationId: string } }>();
const authService = new AuthService(prisma);

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// Security Headers (must be before other middleware)
app.use('*', securityHeaders());

// Correlation ID middleware (for request tracing)
app.use('*', correlationId());

// CORS (using new config module)
app.use('*', createCorsMiddleware());

// JWT Auth Middleware - Attach user to context from Bearer token (with blacklist check)
app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const isBlacklisted = await authService.isBlacklisted(token);
    if (!isBlacklisted) {
      const { payload, error } = authService.verifyAccessTokenWithError(token);
      if (payload && !error) {
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (user) {
          c.set('user', user);
        }
      }
    }
  }
  await next();
});

// Rate limiting
const isDev = process.env.NODE_ENV !== 'production';
app.use('/api/auth/login', rateLimit({ windowMs: 1 * 60 * 1000, max: isDev ? 100 : 20 }));
app.use('/leads', rateLimit({ windowMs: 60 * 1000, max: isDev ? 100 : 30 }));
app.use('*', rateLimit({ windowMs: 60 * 1000, max: isDev ? 500 : 200 }));

// ============================================
// HEALTH CHECK & ROOT
// ============================================

app.get('/health', (c) => 
  successResponse(c, { ok: true, service: 'ath-api', host: hostname() })
);

app.get('/', (c) =>
  successResponse(c, {
    message: 'Anh Thợ Xây API',
    endpoints: ['/health', '/api/auth/login', '/pages/:slug', '/service-categories', '/materials', '/leads'],
  })
);

// ============================================
// ROUTE MOUNTING
// ============================================

// Auth routes
app.route('/api/auth', createAuthRoutes(prisma));

// Pages & Sections routes
app.route('/pages', createPagesRoutes(prisma));
app.route('/sections', createSectionsRoutes(prisma));

// Media routes
app.route('/media', createMediaRoutes(prisma));

// Leads routes
app.route('/leads', createLeadsRoutes(prisma));

// Pricing routes (service-categories, unit-prices, materials, formulas, calculate-quote)
const pricingRoutes = createPricingRoutes(prisma);
app.route('/', pricingRoutes);

// Blog routes
app.route('/blog', createBlogRoutes(prisma));

// Settings routes
app.route('/settings', createSettingsRoutes(prisma));

// Integrations routes
app.route('/integrations', createIntegrationsRoutes(prisma));

// Users management routes (Admin only)
app.route('/api/users', createUsersRoutes(prisma));

// Contractor routes
app.route('/api/contractor', createContractorRoutes(prisma));
app.route('/api/admin/contractors', createAdminContractorRoutes(prisma));

// Region routes
app.route('/api/regions', createRegionRoutes(prisma));
app.route('/api/admin/regions', createAdminRegionRoutes(prisma));

// Bidding Settings routes
app.route('/api/settings/bidding', createBiddingSettingsRoutes(prisma));
app.route('/api/admin/settings/bidding', createAdminBiddingSettingsRoutes(prisma));

// Service Fee routes
app.route('/api/service-fees', createServiceFeeRoutes(prisma));
app.route('/api/admin/service-fees', createAdminServiceFeeRoutes(prisma));

// Project routes
app.route('/api/projects', createPublicProjectRoutes(prisma));
app.route('/api/homeowner/projects', createHomeownerProjectRoutes(prisma));
app.route('/api/admin/projects', createAdminProjectRoutes(prisma));

// Bid routes
app.route('/api/contractor/bids', createContractorBidRoutes(prisma));
app.route('/api/admin/bids', createAdminBidRoutes(prisma));

// Escrow routes (Admin only)
app.route('/api/admin/escrows', createAdminEscrowRoutes(prisma));

// Fee routes (Admin only)
app.route('/api/admin/fees', createAdminFeeRoutes(prisma));

// Match routes (Admin only)
app.route('/api/admin/matches', createAdminMatchRoutes(prisma));

// Dispute routes
app.route('/api/homeowner/projects', createHomeownerDisputeRoutes(prisma));
app.route('/api/contractor/bids', createContractorDisputeRoutes(prisma));
app.route('/api/admin/disputes', createAdminDisputeRoutes(prisma));

// Chat routes (Phase 4)
app.route('/api/chat', createChatRoutes(prisma));
app.route('/api/admin/chat', createAdminChatRoutes(prisma));

// Notification routes (Phase 4)
app.route('/api/notifications', createNotificationRoutes(prisma));

// Notification Template routes (Phase 4 - Admin only)
app.route('/api/admin/notification-templates', createNotificationTemplateRoutes(prisma));

// Scheduled Notification routes (Phase 4 - Admin only)
app.route('/api/admin/scheduled-notifications', createAdminScheduledNotificationRoutes(prisma));

// Unsubscribe routes (Phase 4 - Public, accessed via email links)
app.route('/api/unsubscribe', createUnsubscribeRoutes(prisma));

// Review routes (Phase 5)
app.route('/api/homeowner', createHomeownerReviewRoutes(prisma));
app.route('/api/contractor/reviews', createContractorReviewRoutes(prisma));
app.route('/api/reviews', createPublicReviewRoutes(prisma));
app.route('/api/admin/reviews', createAdminReviewRoutes(prisma));

// Ranking routes (Phase 5)
app.route('/api/rankings', createPublicRankingRoutes(prisma));
app.route('/api/admin/rankings', createAdminRankingRoutes(prisma));

// Report routes (Phase 5) - Requirements: 19.1-19.4
app.route('/api/reviews', createPublicReportRoutes(prisma)); // POST /api/reviews/:id/report
app.route('/api/admin/review-reports', createAdminReportRoutes(prisma));

// Saved Project routes (Phase 6) - Requirements: 21.1-21.5
app.route('/api/contractor/saved-projects', createSavedProjectRoutes(prisma));

// Activity routes (Phase 6) - Requirements: 23.1-23.4
app.route('/api/user/activity', createActivityRoutes(prisma));

// Dashboard routes - Feature: admin-dashboard-enhancement
app.route('/api/admin/dashboard', createAdminDashboardRoutes(prisma));

// Furniture routes - Feature: furniture-quotation
app.route('/api/furniture', createFurniturePublicRoutes(prisma));
app.route('/api/admin/furniture', createFurnitureAdminRoutes(prisma));

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.onError(errorHandler());

// ============================================
// START SERVER
// ============================================

const port = parseInt(process.env.PORT || '4202', 10);
console.log(`🚀 Starting server on port ${port}...`);

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`✅ ANH THỢ XÂY API running at http://localhost:${info.port}`);
});

// ============================================
// GRACEFUL SHUTDOWN HANDLER
// ============================================

/**
 * Graceful shutdown handler
 * Closes database connections and server on SIGTERM/SIGINT
 * 
 * **Feature: scalability-audit**
 * **Requirements: 8.4**
 */
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    console.log(`⚠️ Shutdown already in progress, ignoring ${signal}`);
    return;
  }
  
  isShuttingDown = true;
  
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  const shutdownStart = Date.now();
  
  try {
    // Close HTTP server first (stop accepting new connections)
    console.log('📡 Closing HTTP server...');
    server.close();
    console.log('✅ HTTP server closed');
    
    // Close Prisma database connection
    console.log('🗄️ Closing database connection...');
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    
    const shutdownDuration = Date.now() - shutdownStart;
    console.log(`✅ Graceful shutdown completed in ${shutdownDuration}ms`);
    
    process.exit(0);
  } catch (error) {
    const shutdownDuration = Date.now() - shutdownStart;
    console.error(`❌ Error during shutdown after ${shutdownDuration}ms:`, error);
    process.exit(1);
  }
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection, just log it
  // This allows the server to continue running
});

export default app;
