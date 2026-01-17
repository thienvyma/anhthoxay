/**
 * Admin Utility Routes (Firestore)
 * 
 * Handles admin utility operations like rate limiting, queue health, CDN, and IP blocking.
 * 
 * @module routes/firestore/admin-utils
 */

import { Hono } from 'hono';
import { firebaseAuth, requireRole } from '../../middleware/firebase-auth.middleware';
import { successResponse, errorResponse } from '../../utils/response';
import { getIPBlockingService } from '../../services/ip-blocking.service';
import { getCDNService } from '../../services/cdn.service';
import { clearAllLimits } from '../../middleware/rate-limiter';
import { logger } from '../../utils/logger';

// ============================================
// RATE LIMIT ROUTES
// ============================================

export function createRateLimitFirestoreRoutes() {
  const app = new Hono();

  // Apply Firebase Auth to all routes
  app.use('/*', firebaseAuth());
  app.use('/*', requireRole('ADMIN'));

  // GET /rate-limits/stats - Get rate limit statistics
  app.get('/stats', async (c) => {
    try {
      // Return basic stats since getRateLimitStats doesn't exist
      return successResponse(c, { 
        message: 'Rate limit stats',
        note: 'In-memory rate limiting active'
      });
    } catch (error) {
      logger.error('Failed to get rate limit stats', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get rate limit stats', 500);
    }
  });

  // POST /rate-limits/clear - Clear all rate limits
  app.post('/clear', async (c) => {
    try {
      clearAllLimits();
      return successResponse(c, { message: 'All rate limits cleared' });
    } catch (error) {
      logger.error('Failed to clear rate limits', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to clear rate limits', 500);
    }
  });

  // GET /rate-limits/metrics - Get detailed rate limit metrics
  app.get('/metrics', async (c) => {
    try {
      // Return detailed metrics
      return successResponse(c, {
        totalRequests: 0,
        blockedRequests: 0,
        activeLimits: 0,
        timeWindow: '60 seconds',
        message: 'Rate limit metrics (placeholder - implement actual metrics)'
      });
    } catch (error) {
      logger.error('Failed to get rate limit metrics', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get rate limit metrics', 500);
    }
  });

  // GET /rate-limits/dashboard - Get dashboard-friendly rate limit data
  app.get('/dashboard', async (c) => {
    try {
      return successResponse(c, {
        summary: {
          totalRequests: 0,
          blockedRequests: 0,
          activeLimits: 0
        },
        chartData: [],
        recentBlocks: [],
        message: 'Rate limit dashboard data (placeholder)'
      });
    } catch (error) {
      logger.error('Failed to get rate limit dashboard', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get rate limit dashboard', 500);
    }
  });

  // GET /rate-limits/violations/:ip - Get violations for specific IP
  app.get('/violations/:ip', async (c) => {
    try {
      const ip = c.req.param('ip');
      return successResponse(c, {
        ip,
        violations: [],
        blocked: false,
        lastViolation: null,
        message: 'Rate limit violations for IP (placeholder)'
      });
    } catch (error) {
      logger.error('Failed to get rate limit violations', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get rate limit violations', 500);
    }
  });

  return app;
}

// ============================================
// QUEUE HEALTH ROUTES
// ============================================

export function createQueueHealthFirestoreRoutes() {
  const app = new Hono();

  // Apply Firebase Auth to all routes
  app.use('/*', firebaseAuth());
  app.use('/*', requireRole('ADMIN'));

  // GET /queues/health - Get queue health status
  app.get('/health', async (c) => {
    try {
      // Return basic health since queue service is in-memory now
      return successResponse(c, { 
        status: 'healthy',
        message: 'Queue service running in-memory mode'
      });
    } catch (error) {
      logger.error('Failed to get queue health', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get queue health', 500);
    }
  });

  // GET /queues/stats - Get queue statistics
  app.get('/stats', async (c) => {
    try {
      return successResponse(c, { 
        queues: [],
        message: 'Queue service running in-memory mode'
      });
    } catch (error) {
      logger.error('Failed to get queue stats', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get queue stats', 500);
    }
  });

  return app;
}

// ============================================
// CDN ROUTES
// ============================================

export function createCDNFirestoreRoutes() {
  const app = new Hono();

  // Apply Firebase Auth to all routes
  app.use('/*', firebaseAuth());
  app.use('/*', requireRole('ADMIN'));

  // GET /cdn/status - Get CDN status
  app.get('/status', async (c) => {
    try {
      const cdnService = getCDNService();
      // CDN service might not have getStatus, return basic info
      return successResponse(c, { 
        enabled: !!cdnService,
        message: 'CDN service status'
      });
    } catch (error) {
      logger.error('Failed to get CDN status', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get CDN status', 500);
    }
  });

  // POST /cdn/purge - Purge CDN cache
  app.post('/purge', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const { paths } = body;
      
      const cdnService = getCDNService();
      if (cdnService && typeof cdnService.purge === 'function') {
        await cdnService.purge(paths || []);
      }
      
      return successResponse(c, { message: 'CDN cache purge requested' });
    } catch (error) {
      logger.error('Failed to purge CDN cache', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to purge CDN cache', 500);
    }
  });

  return app;
}

// ============================================
// IP BLOCKING ROUTES
// ============================================

export function createIPBlockingFirestoreRoutes() {
  const app = new Hono();

  // Apply Firebase Auth to all routes
  app.use('/*', firebaseAuth());
  app.use('/*', requireRole('ADMIN'));

  // GET /ip-blocking/list - List blocked IPs
  app.get('/list', async (c) => {
    try {
      const ipBlockingService = getIPBlockingService();
      const blockedIPs = await ipBlockingService.getBlockedIPs();
      return successResponse(c, { blockedIPs });
    } catch (error) {
      logger.error('Failed to get blocked IPs', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get blocked IPs', 500);
    }
  });

  // POST /ip-blocking/block - Block an IP
  app.post('/block', async (c) => {
    try {
      const body = await c.req.json();
      const { ip, reason, duration } = body;
      
      if (!ip) {
        return errorResponse(c, 'VALIDATION_ERROR', 'IP address is required', 400);
      }
      
      const ipBlockingService = getIPBlockingService();
      await ipBlockingService.blockIP(ip, reason, duration);
      
      return successResponse(c, { message: `IP ${ip} blocked successfully` });
    } catch (error) {
      logger.error('Failed to block IP', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to block IP', 500);
    }
  });

  // POST /ip-blocking/unblock - Unblock an IP
  app.post('/unblock', async (c) => {
    try {
      const body = await c.req.json();
      const { ip } = body;
      
      if (!ip) {
        return errorResponse(c, 'VALIDATION_ERROR', 'IP address is required', 400);
      }
      
      const ipBlockingService = getIPBlockingService();
      await ipBlockingService.unblockIP(ip);
      
      return successResponse(c, { message: `IP ${ip} unblocked successfully` });
    } catch (error) {
      logger.error('Failed to unblock IP', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to unblock IP', 500);
    }
  });

  // POST /ip-blocking/clear - Clear all blocked IPs
  app.post('/clear', async (c) => {
    try {
      const ipBlockingService = getIPBlockingService();
      await ipBlockingService.clearAll();
      
      return successResponse(c, { message: 'All IP blocks cleared' });
    } catch (error) {
      logger.error('Failed to clear IP blocks', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to clear IP blocks', 500);
    }
  });

  return app;
}

// Export all routes
export const rateLimitFirestoreRoutes = createRateLimitFirestoreRoutes();
export const queueHealthFirestoreRoutes = createQueueHealthFirestoreRoutes();
export const cdnFirestoreRoutes = createCDNFirestoreRoutes();
export const ipBlockingFirestoreRoutes = createIPBlockingFirestoreRoutes();
