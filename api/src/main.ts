/**
 * NỘI THẤT NHANH API - Main Entry Point
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

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { User } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Prisma singleton import
import { prisma } from './utils/prisma';

// Middleware imports
import { rateLimiter } from './middleware/rate-limiter';
import { 
  loginEmergencyRateLimiter, 
  formEmergencyRateLimiter, 
  globalEmergencyRateLimiter 
} from './middleware/emergency-rate-limiter';
import { 
  suspiciousActivityMiddleware, 
  emergencyModeHeaderMiddleware 
} from './middleware/suspicious-activity';
import { securityHeaders } from './middleware/security-headers';
import { correlationId } from './middleware/correlation-id';
import { errorHandler } from './middleware/error-handler';
import { responseTimeMonitoring } from './middleware/monitoring';
import { prometheusMiddleware } from './middleware/prometheus';
import { createCorsMiddleware } from './config/cors';
import { successResponse } from './utils/response';

// Config imports
import { validateEnvironment } from './config/env-validation';
import { getRedisClient, closeRedisConnection } from './config/redis';
import { initSentry, flushSentry, captureException } from './config/sentry';

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
import { createFurniturePublicRoutes, createFurnitureAdminRoutes } from './routes/furniture';
import { createApiKeysRoutes } from './routes/api-keys.routes';
import { createExternalApiRoutes } from './routes/external-api';
import { createHealthRoutes } from './routes/health.routes';
import { createCDNRoutes } from './routes/cdn.routes';
import { createRateLimitRoutes } from './routes/rate-limit.routes';
import { createMetricsRoutes } from './routes/metrics.routes';
import { createQueueHealthRoutes } from './routes/queue-health.routes';
import { createIPBlockingRoutes } from './routes/ip-blocking.routes';
import { ipBlockingMiddleware } from './middleware/ip-blocking';

// Service imports
import { AuthService } from './services/auth.service';
import { setShutdownState } from './services/health.service';
import { getEmergencyModeService } from './services/emergency-mode.service';

// Shutdown manager import
import { ShutdownManager, registerSignalHandlers } from './utils/shutdown';

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

// Try multiple strategies to find project root
let projectRoot = findProjectRoot(process.cwd());

// If running from dist folder, try to find root from __dirname
if (!fs.existsSync(path.join(projectRoot, '.env'))) {
  // __dirname might be dist/api/src, so go up 3 levels
  const fromDirname = findProjectRoot(path.resolve(__dirname, '..', '..', '..'));
  if (fs.existsSync(path.join(fromDirname, '.env'))) {
    projectRoot = fromDirname;
  }
}

const envPath = path.join(projectRoot, '.env');

// Load env vars from .env file
// .env file takes precedence for DATABASE_URL to allow PostgreSQL configuration
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove surrounding quotes
      value = value.replace(/^["']|["']$/g, '');
      // Set the env var (override existing for DATABASE_URL)
      process.env[key] = value;
    }
  });
}

// Handle DATABASE_URL for SQLite (file: prefix needs absolute path)
// PostgreSQL URLs (postgresql://) are used as-is
if (process.env.DATABASE_URL?.startsWith('file:')) {
  const dbPath = path.join(projectRoot, 'infra', 'prisma', 'dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
}

// eslint-disable-next-line no-console -- Startup logging before logger initialization
console.info('🔧 NỘI THẤT NHANH API Starting...');
// eslint-disable-next-line no-console -- Startup logging before logger initialization
console.info('📁 Project root:', projectRoot);
// eslint-disable-next-line no-console -- Startup logging before logger initialization
console.info(
  '🗄️ DATABASE_URL:',
  process.env.DATABASE_URL?.startsWith('postgresql://')
    ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') // Hide password in logs
    : process.env.DATABASE_URL
);

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

// Run environment validation before any initialization
// This validates DATABASE_URL, JWT_SECRET, and other required variables
// In production, missing required variables will cause the process to exit
validateEnvironment();

// Initialize Sentry error tracking (optional - requires SENTRY_DSN)
// Must be initialized before other services to capture all errors
initSentry();

// Initialize Redis connection (optional - will log warning if not configured)
const redis = getRedisClient();

// Initialize Emergency Mode Service
// Starts periodic check for auto-activation based on attack metrics
// **Feature: high-traffic-resilience**
// **Requirements: 14.5, 14.6**
const emergencyModeService = getEmergencyModeService();
emergencyModeService.startPeriodicCheck(30000); // Check every 30 seconds

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

// Response time monitoring (adds X-Response-Time header, logs slow requests)
app.use('*', responseTimeMonitoring({ slowThreshold: 500 }));

// IP Blocking middleware (blocks IPs that exceed rate limit thresholds)
// **Feature: high-traffic-resilience**
// **Requirements: 14.1, 14.2**
app.use('*', ipBlockingMiddleware());

// Prometheus metrics middleware (records HTTP request metrics)
// **Feature: production-scalability**
// **Requirements: 12.2, 12.3**
app.use('*', prometheusMiddleware());

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

// Rate limiting - Use Redis if available, fallback to in-memory
// In production, use emergency-aware rate limiters that apply stricter limits during attacks
// **Feature: high-traffic-resilience**
// **Requirements: 14.5, 14.6**
const isDev = process.env.NODE_ENV !== 'production';
const useRedisRateLimiter = redis !== null;

// Suspicious activity detection middleware
// Detects suspicious patterns (bots, rapid requests) and increases CAPTCHA challenge rate
// **Feature: high-traffic-resilience**
// **Requirements: 14.5**
app.use('*', suspiciousActivityMiddleware({
  checkUserAgent: true,
  trackRapidRequests: true,
  increaseCaptchaRate: true,
  excludePaths: ['/health', '/health/live', '/health/ready', '/metrics'],
}));

// Emergency mode header middleware
// Adds X-Emergency-Mode header when emergency mode is active
// **Feature: high-traffic-resilience**
// **Requirements: 14.5, 14.6**
app.use('*', emergencyModeHeaderMiddleware());

if (useRedisRateLimiter) {
  // Redis-based rate limiting with emergency mode support (distributed, production-ready)
  // In emergency mode, limits are automatically reduced (50% of normal) and windows extended (2x)
  // **Feature: high-traffic-resilience**
  // **Requirements: 14.5, 14.6**
  app.use('/api/auth/login', loginEmergencyRateLimiter());
  app.use('/leads', formEmergencyRateLimiter());
  app.use('*', globalEmergencyRateLimiter());
} else {
  // In-memory rate limiting (single instance only, no emergency mode support)
  app.use('/api/auth/login', rateLimiter({ windowMs: 1 * 60 * 1000, maxAttempts: isDev ? 100 : 20 }));
  app.use('/leads', rateLimiter({ windowMs: 60 * 1000, maxAttempts: isDev ? 100 : 30 }));
  app.use('*', rateLimiter({ windowMs: 60 * 1000, maxAttempts: isDev ? 500 : 200 }));
}

// ============================================
// HEALTH CHECK & ROOT
// ============================================

// Health check routes (comprehensive health, ready, live endpoints)
app.route('/health', createHealthRoutes(prisma));

// Prometheus metrics endpoint (for Prometheus scraping)
// **Feature: production-scalability**
// **Requirements: 12.1**
app.route('/metrics', createMetricsRoutes());

app.get('/', (c) =>
  successResponse(c, {
    message: 'Nội Thất Nhanh API',
    endpoints: ['/health', '/health/ready', '/health/live', '/metrics', '/api/auth/login', '/pages/:slug', '/service-categories', '/materials', '/leads'],
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

// Rate Limit routes - Feature: production-scalability
app.route('/api/admin/rate-limits', createRateLimitRoutes(prisma));

// Queue Health routes - Feature: production-scalability
// **Requirements: 13.3**
app.route('/api/admin/queues', createQueueHealthRoutes(prisma));

// Furniture routes - Feature: furniture-quotation
app.route('/api/furniture', createFurniturePublicRoutes(prisma));
app.route('/api/admin/furniture', createFurnitureAdminRoutes(prisma));

// API Keys routes - Feature: admin-guide-api-keys
app.route('/api/admin/api-keys', createApiKeysRoutes(prisma));

// CDN routes - Feature: high-traffic-resilience
// **Requirements: 2.4, 2.6**
app.route('/api/admin/cdn', createCDNRoutes(prisma));

// IP Blocking routes - Feature: high-traffic-resilience
// **Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**
app.route('/api/admin/ip-blocking', createIPBlockingRoutes(prisma));

// External API routes - Feature: admin-guide-api-keys (API Key authenticated)
app.route('/api/external', createExternalApiRoutes(prisma));

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.onError(errorHandler());

// ============================================
// START SERVER
// ============================================

const port = parseInt(process.env.PORT || '4202', 10);
// eslint-disable-next-line no-console -- Startup logging
console.info(`🚀 Starting server on port ${port}...`);

const server = serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console -- Startup logging
  console.info(`✅ NỘI THẤT NHANH API running at http://localhost:${info.port}`);
});

// ============================================
// GRACEFUL SHUTDOWN HANDLER
// ============================================

/**
 * Graceful Shutdown Manager
 * Handles connection draining and cleanup during deployment
 * 
 * **Feature: high-traffic-resilience**
 * **Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
 */
const shutdownManager = new ShutdownManager({
  timeout: 30000, // 30 seconds for in-flight requests
  drainDelay: 5000, // 5 seconds for LB to stop routing
  forceExitDelay: 35000, // 35 seconds total before force exit
});

// Set the HTTP server for connection tracking
shutdownManager.setServer(server);

// Set callback to update health check state
shutdownManager.setShutdownStateCallback(setShutdownState);

// Register cleanup handlers
shutdownManager.onShutdown('database', async () => {
  await prisma.$disconnect();
});

shutdownManager.onShutdown('redis', async () => {
  await closeRedisConnection();
});

shutdownManager.onShutdown('sentry', async () => {
  await flushSentry();
});

shutdownManager.onShutdown('emergency-mode', async () => {
  emergencyModeService.stopPeriodicCheck();
});

// Register signal handlers (SIGTERM, SIGINT, uncaughtException)
registerSignalHandlers(shutdownManager);

// Handle unhandled promise rejections (log but don't exit)
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  captureException(reason, { type: 'unhandledRejection' });
  // Don't exit on unhandled rejection, just log it
  // This allows the server to continue running
});

export default app;
