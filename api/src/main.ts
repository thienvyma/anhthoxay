/**
 * NỘI THẤT NHANH API - Main Entry Point (Firebase/Firestore)
 *
 * This file handles:
 * - Environment setup
 * - Middleware configuration
 * - Route mounting (Firestore-based)
 * - Server startup
 *
 * **Feature: firebase-phase3-firestore**
 * **Requirements: 1.1, 1.4, 10.1, 10.5**
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import fs from 'fs';
import path from 'path';

// Firebase Admin SDK
import { initializeFirebaseAdmin } from './services/firebase-admin.service';

// Middleware imports
import { rateLimiter } from './middleware/rate-limiter';
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
import { firebaseAuth } from './middleware/firebase-auth.middleware';

// Config imports
import { validateEnvironment } from './config/env-validation';
import { initSentry, flushSentry, captureException } from './config/sentry';

// Firestore Route imports
import {
  authFirestoreRoutes,
  createSettingsFirestoreRoutes,
  createRegionFirestoreRoutes,
  createAdminRegionFirestoreRoutes,
  createServiceFeeFirestoreRoutes,
  createAdminServiceFeeFirestoreRoutes,
  usersFirestoreRoutes,
  contractorFirestoreRoutes,
  adminContractorFirestoreRoutes,
  createLeadsFirestoreRoutes,
  createAdminLeadsFirestoreRoutes,
  createBlogFirestoreRoutes,
  createAdminBlogFirestoreRoutes,
  createPricingFirestoreRoutes,
  createAdminPricingFirestoreRoutes,
  createPagesFirestoreRoutes,
  createSectionsFirestoreRoutes,
  createPublicProjectFirestoreRoutes,
  createHomeownerProjectFirestoreRoutes,
  createAdminProjectFirestoreRoutes,
  createContractorBidFirestoreRoutes,
  createAdminBidFirestoreRoutes,
  createAdminEscrowFirestoreRoutes,
  createAdminFeeFirestoreRoutes,
  createHomeownerMatchFirestoreRoutes,
  createAdminMatchFirestoreRoutes,
  chatFirestoreRoutes,
  adminChatFirestoreRoutes,
  notificationFirestoreRoutes,
  notificationTemplateFirestoreRoutes,
  scheduledNotificationFirestoreRoutes,
  createHomeownerReviewFirestoreRoutes,
  createContractorReviewFirestoreRoutes,
  createPublicReviewFirestoreRoutes,
  createAdminReviewFirestoreRoutes,
  createPublicRankingFirestoreRoutes,
  createContractorRankingFirestoreRoutes,
  createAdminRankingFirestoreRoutes,
  createPublicReportFirestoreRoutes,
  createAdminReportFirestoreRoutes,
  createFurnitureFirestorePublicRoutes,
  createFurnitureFirestoreAdminRoutes,
  createHealthFirestoreRoutes,
  setShutdownState,
  createMediaFirestoreRoutes,
  createRateLimitFirestoreRoutes,
  createQueueHealthFirestoreRoutes,
  createCDNFirestoreRoutes,
  createIPBlockingFirestoreRoutes,
} from './routes/firestore';

// Metrics routes (no Prisma dependency)
import { createMetricsRoutes } from './routes/metrics.routes';
import { ipBlockingMiddleware } from './middleware/ip-blocking';

// Service imports
import { getEmergencyModeService } from './services/emergency-mode.service';

// Shutdown manager import
import { ShutdownManager, registerSignalHandlers } from './utils/shutdown';

// Firebase User type for context
import type { FirebaseUser } from './middleware/firebase-auth.middleware';

// ============================================
// ENVIRONMENT SETUP
// ============================================

function findProjectRoot(startPath: string): string {
  let currentPath = startPath;
  while (currentPath !== path.dirname(currentPath)) {
    if (fs.existsSync(path.join(currentPath, '.env'))) {
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
      // Set the env var
      process.env[key] = value;
    }
  });
}

// eslint-disable-next-line no-console -- Startup logging before logger initialization
console.info('🔧 NỘI THẤT NHANH API Starting (Firebase/Firestore)...');
// eslint-disable-next-line no-console -- Startup logging before logger initialization
console.info('📁 Project root:', projectRoot);
// eslint-disable-next-line no-console -- Startup logging before logger initialization
console.info('🔥 Firebase Project:', process.env.FIREBASE_PROJECT_ID || 'not configured');

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

// Run environment validation before any initialization
validateEnvironment();

// Initialize Sentry error tracking (optional - requires SENTRY_DSN)
initSentry();

// Initialize Firebase Admin SDK
initializeFirebaseAdmin().then(() => {
  console.info('✅ Firebase Admin SDK initialized');
}).catch((err) => {
  console.error('❌ Failed to initialize Firebase Admin SDK:', err);
});

// Initialize Emergency Mode Service
const emergencyModeService = getEmergencyModeService();
emergencyModeService.startPeriodicCheck(30000); // Check every 30 seconds

// ============================================
// APP INITIALIZATION
// ============================================

const app = new Hono<{ Variables: { user?: FirebaseUser; correlationId: string } }>();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// Security Headers (must be before other middleware)
app.use('*', securityHeaders());

// Correlation ID middleware (for request tracing)
app.use('*', correlationId());

// Response time monitoring (adds X-Response-Time header, logs slow requests)
app.use('*', responseTimeMonitoring({ slowThreshold: 500 }));

// IP Blocking middleware
app.use('*', ipBlockingMiddleware());

// Prometheus metrics middleware
app.use('*', prometheusMiddleware());

// CORS
app.use('*', createCorsMiddleware());

// Firebase Auth Middleware - Attach user to context from Bearer token
app.use('*', firebaseAuth({ optional: true }));

// Rate limiting
const isDev = process.env.NODE_ENV !== 'production';

// Suspicious activity detection middleware
app.use('*', suspiciousActivityMiddleware({
  checkUserAgent: true,
  trackRapidRequests: true,
  increaseCaptchaRate: true,
  excludePaths: ['/health', '/health/live', '/health/ready', '/metrics'],
}));

// Emergency mode header middleware
app.use('*', emergencyModeHeaderMiddleware());

// In-memory rate limiting
app.use('/api/auth/login', rateLimiter({ windowMs: 1 * 60 * 1000, maxAttempts: isDev ? 100 : 20 }));
app.use('/leads', rateLimiter({ windowMs: 60 * 1000, maxAttempts: isDev ? 100 : 30 }));
app.use('*', rateLimiter({ windowMs: 60 * 1000, maxAttempts: isDev ? 500 : 200 }));

// ============================================
// HEALTH CHECK & ROOT
// ============================================

// Health check routes (Firestore)
app.route('/health', createHealthFirestoreRoutes());

// Prometheus metrics endpoint
app.route('/metrics', createMetricsRoutes());

app.get('/', (c) =>
  successResponse(c, {
    message: 'Nội Thất Nhanh API (Firebase/Firestore)',
    version: '3.0.0',
    endpoints: ['/health', '/health/ready', '/health/live', '/metrics', '/api/auth/login', '/pages/:slug', '/service-categories', '/materials', '/leads'],
  })
);

// ============================================
// ROUTE MOUNTING (FIRESTORE-BASED)
// ============================================

// Auth routes (Firebase Auth)
app.route('/api/auth', authFirestoreRoutes);

// Pages & Sections routes (Firestore)
app.route('/pages', createPagesFirestoreRoutes());
app.route('/sections', createSectionsFirestoreRoutes());

// Media routes (Firebase Storage)
app.route('/media', createMediaFirestoreRoutes());

// Leads routes (Firestore)
app.route('/leads', createLeadsFirestoreRoutes());
app.route('/api/admin/leads', createAdminLeadsFirestoreRoutes());

// Pricing routes (Firestore)
app.route('/', createPricingFirestoreRoutes());
app.route('/api/admin/pricing', createAdminPricingFirestoreRoutes());

// Blog routes (Firestore)
app.route('/blog', createBlogFirestoreRoutes());
app.route('/api/admin/blog', createAdminBlogFirestoreRoutes());

// Settings routes (Firestore)
app.route('/settings', createSettingsFirestoreRoutes());

// Users management routes (Firestore)
app.route('/api/users', usersFirestoreRoutes);

// Contractor routes (Firestore)
app.route('/api/contractor', contractorFirestoreRoutes);
app.route('/api/admin/contractors', adminContractorFirestoreRoutes);

// Region routes (Firestore)
app.route('/api/regions', createRegionFirestoreRoutes());
app.route('/api/admin/regions', createAdminRegionFirestoreRoutes());

// Service Fee routes (Firestore)
app.route('/api/service-fees', createServiceFeeFirestoreRoutes());
app.route('/api/admin/service-fees', createAdminServiceFeeFirestoreRoutes());

// Project routes (Firestore)
app.route('/api/projects', createPublicProjectFirestoreRoutes());
app.route('/api/homeowner/projects', createHomeownerProjectFirestoreRoutes());
app.route('/api/admin/projects', createAdminProjectFirestoreRoutes());

// Bid routes (Firestore)
app.route('/api/contractor/bids', createContractorBidFirestoreRoutes());
app.route('/api/admin/bids', createAdminBidFirestoreRoutes());

// Escrow routes (Firestore)
app.route('/api/admin/escrows', createAdminEscrowFirestoreRoutes());

// Fee routes (Firestore)
app.route('/api/admin/fees', createAdminFeeFirestoreRoutes());

// Match routes (Firestore)
app.route('/api/homeowner/matches', createHomeownerMatchFirestoreRoutes());
app.route('/api/admin/matches', createAdminMatchFirestoreRoutes());

// Chat routes (Firestore)
app.route('/api/chat', chatFirestoreRoutes);
app.route('/api/admin/chat', adminChatFirestoreRoutes);

// Notification routes (Firestore)
app.route('/api/notifications', notificationFirestoreRoutes);

// Notification Template routes (Firestore)
app.route('/api/admin/notification-templates', notificationTemplateFirestoreRoutes);

// Scheduled Notification routes (Firestore)
app.route('/api/admin/scheduled-notifications', scheduledNotificationFirestoreRoutes);

// Review routes (Firestore)
app.route('/api/homeowner/reviews', createHomeownerReviewFirestoreRoutes());
app.route('/api/contractor/reviews', createContractorReviewFirestoreRoutes());
app.route('/api/reviews', createPublicReviewFirestoreRoutes());
app.route('/api/admin/reviews', createAdminReviewFirestoreRoutes());

// Ranking routes (Firestore)
app.route('/api/rankings', createPublicRankingFirestoreRoutes());
app.route('/api/contractor/rankings', createContractorRankingFirestoreRoutes());
app.route('/api/admin/rankings', createAdminRankingFirestoreRoutes());

// Report routes (Firestore)
app.route('/api/reviews', createPublicReportFirestoreRoutes()); // POST /api/reviews/:id/report
app.route('/api/admin/review-reports', createAdminReportFirestoreRoutes());

// Furniture routes (Firestore)
app.route('/api/furniture', createFurnitureFirestorePublicRoutes());
app.route('/api/admin/furniture', createFurnitureFirestoreAdminRoutes());

// Rate Limit routes (Firestore)
app.route('/api/admin/rate-limits', createRateLimitFirestoreRoutes());

// Queue Health routes (Firestore)
app.route('/api/admin/queues', createQueueHealthFirestoreRoutes());

// CDN routes (Firestore)
app.route('/api/admin/cdn', createCDNFirestoreRoutes());

// IP Blocking routes (Firestore)
app.route('/api/admin/ip-blocking', createIPBlockingFirestoreRoutes());

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
  console.info(`✅ NỘI THẤT NHANH API (Firebase/Firestore) running at http://localhost:${info.port}`);
});

// ============================================
// GRACEFUL SHUTDOWN HANDLER
// ============================================

const shutdownManager = new ShutdownManager({
  timeout: 30000,
  drainDelay: 5000,
  forceExitDelay: 35000,
});

shutdownManager.setServer(server);
shutdownManager.setShutdownStateCallback(setShutdownState);

// Register cleanup handlers
shutdownManager.onShutdown('firebase', async () => {
  // Firebase Admin SDK cleanup if needed
  // eslint-disable-next-line no-console
  console.info('🔥 Firebase cleanup complete');
});

shutdownManager.onShutdown('sentry', async () => {
  await flushSentry();
});

shutdownManager.onShutdown('emergency-mode', async () => {
  emergencyModeService.stopPeriodicCheck();
});

// Register signal handlers
registerSignalHandlers(shutdownManager);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  captureException(reason, { type: 'unhandledRejection' });
});

export default app;
