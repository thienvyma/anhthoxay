/**
 * IP Blocking Routes
 *
 * Admin endpoints for managing IP blocking.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**
 *
 * @route /api/admin/ip-blocking
 */

import { Hono } from 'hono';
import { PrismaClient, User } from '@prisma/client';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { 
  getIPBlockingService,
  getSuspiciousPatternConfig,
  updateSuspiciousPatternConfig,
  getSuspiciousStats,
  clearSuspiciousTracking,
} from '../services/ip-blocking.service';
import { 
  getEmergencyConfig, 
  updateEmergencyConfig, 
  resetEmergencyConfig 
} from '../middleware/emergency-rate-limiter';
import { getEmergencyModeService } from '../services/emergency-mode.service';
import { 
  getCaptchaChallengeConfig, 
  updateCaptchaChallengeConfig, 
  resetCaptchaChallengeConfig,
  getSuspiciousIPCountForCaptcha,
} from '../services/emergency-mode.service';
import { logger } from '../utils/logger';
import {
  BlockIPSchema,
  UnblockIPSchema,
  UpdateConfigSchema,
  ListBlockedIPsQuerySchema,
  UpdateEmergencyConfigSchema,
  UpdateSuspiciousPatternConfigSchema,
  ActivateEmergencyModeSchema,
  UpdateCaptchaChallengeConfigSchema,
  type BlockIPInput,
  type UnblockIPInput,
  type UpdateConfigInput,
  type ListBlockedIPsQuery,
  type UpdateEmergencyConfigInput,
  type UpdateSuspiciousPatternConfigInput,
  type ActivateEmergencyModeInput,
  type UpdateCaptchaChallengeConfigInput,
} from '../schemas/ip-blocking.schema';

// ============================================
// IP BLOCKING ROUTES FACTORY
// ============================================

/**
 * Create IP Blocking routes with dependency injection
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**
 *
 * @param prisma - Prisma client instance
 * @returns Hono app with IP blocking routes
 */
export function createIPBlockingRoutes(prisma: PrismaClient) {
  const app = new Hono<{ Variables: { user?: User } }>();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // ============================================
  // Admin Routes - IP Blocking Management
  // ============================================

  /**
   * @route GET /api/admin/ip-blocking/blocked
   * @description List all blocked IPs with pagination
   * @access Admin only
   */
  app.get(
    '/blocked',
    authenticate(),
    requireRole('ADMIN'),
    validateQuery(ListBlockedIPsQuerySchema),
    async (c) => {
      try {
        const query = getValidatedQuery<ListBlockedIPsQuery>(c);
        const ipBlockingService = getIPBlockingService();
        
        let blockedIPs = await ipBlockingService.getBlockedIPs();
        
        // Filter by search term
        if (query.search) {
          const searchLower = query.search.toLowerCase();
          blockedIPs = blockedIPs.filter(
            (ip) =>
              ip.ip.toLowerCase().includes(searchLower) ||
              ip.reason.toLowerCase().includes(searchLower)
          );
        }
        
        // Filter by emergency only
        if (query.emergencyOnly) {
          blockedIPs = blockedIPs.filter((ip) => ip.isEmergencyBlock);
        }
        
        // Pagination
        const total = blockedIPs.length;
        const start = (query.page - 1) * query.limit;
        const end = start + query.limit;
        const paginatedIPs = blockedIPs.slice(start, end);
        
        return successResponse(c, {
          blockedIPs: paginatedIPs,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
          },
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to list blocked IPs', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list blocked IPs', 500);
      }
    }
  );

  /**
   * @route GET /api/admin/ip-blocking/blocked/:ip
   * @description Get details of a blocked IP
   * @access Admin only
   */
  app.get(
    '/blocked/:ip',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const ip = c.req.param('ip');
        const ipBlockingService = getIPBlockingService();
        
        const details = await ipBlockingService.getBlockedIPDetails(ip);
        
        if (!details) {
          return errorResponse(c, 'NOT_FOUND', 'IP is not blocked', 404);
        }
        
        // Get violation count
        const violationCount = await ipBlockingService.getViolationCount(ip);
        
        return successResponse(c, {
          ...details,
          currentViolationCount: violationCount,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to get blocked IP details', {
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: c.req.param('ip'),
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get blocked IP details', 500);
      }
    }
  );

  /**
   * @route POST /api/admin/ip-blocking/block
   * @description Manually block an IP address
   * @access Admin only
   */
  app.post(
    '/block',
    authenticate(),
    requireRole('ADMIN'),
    validate(BlockIPSchema),
    async (c) => {
      try {
        const data = getValidatedBody<BlockIPInput>(c);
        const user = c.get('user');
        const ipBlockingService = getIPBlockingService();
        
        // Check if already blocked
        const isBlocked = await ipBlockingService.isBlocked(data.ip);
        if (isBlocked) {
          return errorResponse(c, 'ALREADY_BLOCKED', 'IP is already blocked', 400);
        }
        
        await ipBlockingService.blockIP(
          data.ip,
          data.reason,
          data.duration,
          user?.id
        );
        
        logger.info('[IP_BLOCKING_ROUTES] IP manually blocked', {
          ip: data.ip,
          reason: data.reason,
          blockedBy: user?.id,
          duration: data.duration,
        });
        
        return successResponse(c, {
          message: `IP ${data.ip} has been blocked`,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to block IP', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to block IP', 500);
      }
    }
  );

  /**
   * @route POST /api/admin/ip-blocking/unblock
   * @description Unblock an IP address
   * @access Admin only
   */
  app.post(
    '/unblock',
    authenticate(),
    requireRole('ADMIN'),
    validate(UnblockIPSchema),
    async (c) => {
      try {
        const data = getValidatedBody<UnblockIPInput>(c);
        const user = c.get('user');
        const ipBlockingService = getIPBlockingService();
        
        // Check if blocked
        const isBlocked = await ipBlockingService.isBlocked(data.ip);
        if (!isBlocked) {
          return errorResponse(c, 'NOT_BLOCKED', 'IP is not blocked', 400);
        }
        
        await ipBlockingService.unblockIP(data.ip);
        
        logger.info('[IP_BLOCKING_ROUTES] IP unblocked', {
          ip: data.ip,
          unblockedBy: user?.id,
        });
        
        return successResponse(c, {
          message: `IP ${data.ip} has been unblocked`,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to unblock IP', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to unblock IP', 500);
      }
    }
  );

  /**
   * @route GET /api/admin/ip-blocking/status
   * @description Get IP blocking service status and configuration
   * @access Admin only
   */
  app.get(
    '/status',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const ipBlockingService = getIPBlockingService();
        
        const [blockedIPs, isEmergency] = await Promise.all([
          ipBlockingService.getBlockedIPs(),
          ipBlockingService.isEmergencyMode(),
        ]);
        
        const config = ipBlockingService.getConfig();
        
        return successResponse(c, {
          config,
          emergencyMode: isEmergency,
          stats: {
            totalBlocked: blockedIPs.length,
            emergencyBlocks: blockedIPs.filter((ip) => ip.isEmergencyBlock).length,
            manualBlocks: blockedIPs.filter((ip) => ip.blockedBy).length,
            autoBlocks: blockedIPs.filter((ip) => !ip.blockedBy).length,
          },
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to get status', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get IP blocking status', 500);
      }
    }
  );

  /**
   * @route PUT /api/admin/ip-blocking/config
   * @description Update IP blocking configuration
   * @access Admin only
   */
  app.put(
    '/config',
    authenticate(),
    requireRole('ADMIN'),
    validate(UpdateConfigSchema),
    async (c) => {
      try {
        const data = getValidatedBody<UpdateConfigInput>(c);
        const user = c.get('user');
        const ipBlockingService = getIPBlockingService();
        
        const oldConfig = ipBlockingService.getConfig();
        ipBlockingService.updateConfig(data);
        const newConfig = ipBlockingService.getConfig();
        
        logger.info('[IP_BLOCKING_ROUTES] Configuration updated', {
          updatedBy: user?.id,
          oldConfig,
          newConfig,
        });
        
        return successResponse(c, {
          config: newConfig,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to update config', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update configuration', 500);
      }
    }
  );

  /**
   * @route POST /api/admin/ip-blocking/emergency/enable
   * @description Enable emergency mode with stricter rate limits
   * @access Admin only
   */
  app.post(
    '/emergency/enable',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const user = c.get('user');
        const ipBlockingService = getIPBlockingService();
        
        await ipBlockingService.enableEmergencyMode();
        
        logger.warn('[IP_BLOCKING_ROUTES] Emergency mode enabled', {
          enabledBy: user?.id,
        });
        
        return successResponse(c, {
          message: 'Emergency mode enabled. Stricter rate limits are now in effect.',
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to enable emergency mode', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to enable emergency mode', 500);
      }
    }
  );

  /**
   * @route POST /api/admin/ip-blocking/emergency/disable
   * @description Disable emergency mode
   * @access Admin only
   */
  app.post(
    '/emergency/disable',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const user = c.get('user');
        const ipBlockingService = getIPBlockingService();
        
        await ipBlockingService.disableEmergencyMode();
        
        logger.info('[IP_BLOCKING_ROUTES] Emergency mode disabled', {
          disabledBy: user?.id,
        });
        
        return successResponse(c, {
          message: 'Emergency mode disabled. Normal rate limits restored.',
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to disable emergency mode', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to disable emergency mode', 500);
      }
    }
  );

  /**
   * @route GET /api/admin/ip-blocking/violations/:ip
   * @description Get violation count for a specific IP
   * @access Admin only
   */
  app.get(
    '/violations/:ip',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const ip = c.req.param('ip');
        const ipBlockingService = getIPBlockingService();
        
        const violationCount = await ipBlockingService.getViolationCount(ip);
        const isBlocked = await ipBlockingService.isBlocked(ip);
        const config = ipBlockingService.getConfig();
        const isEmergency = await ipBlockingService.isEmergencyMode();
        
        const threshold = isEmergency ? config.emergencyThreshold : config.threshold;
        
        return successResponse(c, {
          ip,
          violationCount,
          isBlocked,
          threshold,
          isEmergencyMode: isEmergency,
          willBeBlocked: violationCount >= threshold,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to get violations', {
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: c.req.param('ip'),
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get violation count', 500);
      }
    }
  );

  // ============================================
  // Emergency Mode Configuration Routes
  // ============================================

  /**
   * @route GET /api/admin/ip-blocking/emergency/config
   * @description Get emergency mode rate limit configuration
   * @access Admin only
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  app.get(
    '/emergency/config',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const ipBlockingService = getIPBlockingService();
        const isEmergency = await ipBlockingService.isEmergencyMode();
        const emergencyConfig = getEmergencyConfig();
        
        return successResponse(c, {
          isActive: isEmergency,
          config: emergencyConfig,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to get emergency config', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get emergency configuration', 500);
      }
    }
  );

  /**
   * @route PUT /api/admin/ip-blocking/emergency/config
   * @description Update emergency mode rate limit configuration
   * @access Admin only
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  app.put(
    '/emergency/config',
    authenticate(),
    requireRole('ADMIN'),
    validate(UpdateEmergencyConfigSchema),
    async (c) => {
      try {
        const data = getValidatedBody<UpdateEmergencyConfigInput>(c);
        const user = c.get('user');
        
        const oldConfig = getEmergencyConfig();
        updateEmergencyConfig(data);
        const newConfig = getEmergencyConfig();
        
        logger.info('[IP_BLOCKING_ROUTES] Emergency config updated', {
          updatedBy: user?.id,
          oldConfig,
          newConfig,
        });
        
        return successResponse(c, {
          config: newConfig,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to update emergency config', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update emergency configuration', 500);
      }
    }
  );

  /**
   * @route POST /api/admin/ip-blocking/emergency/reset
   * @description Reset emergency mode configuration to defaults
   * @access Admin only
   */
  app.post(
    '/emergency/reset',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const user = c.get('user');
        
        resetEmergencyConfig();
        const newConfig = getEmergencyConfig();
        
        logger.info('[IP_BLOCKING_ROUTES] Emergency config reset to defaults', {
          resetBy: user?.id,
        });
        
        return successResponse(c, {
          message: 'Emergency configuration reset to defaults',
          config: newConfig,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to reset emergency config', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reset emergency configuration', 500);
      }
    }
  );

  // ============================================
  // Suspicious Pattern Detection Routes
  // ============================================

  /**
   * @route GET /api/admin/ip-blocking/suspicious/config
   * @description Get suspicious pattern detection configuration
   * @access Admin only
   * 
   * **Validates: Requirements 14.5**
   */
  app.get(
    '/suspicious/config',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const config = getSuspiciousPatternConfig();
        const stats = getSuspiciousStats();
        
        return successResponse(c, {
          config,
          stats,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to get suspicious config', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get suspicious pattern configuration', 500);
      }
    }
  );

  /**
   * @route PUT /api/admin/ip-blocking/suspicious/config
   * @description Update suspicious pattern detection configuration
   * @access Admin only
   * 
   * **Validates: Requirements 14.5**
   */
  app.put(
    '/suspicious/config',
    authenticate(),
    requireRole('ADMIN'),
    validate(UpdateSuspiciousPatternConfigSchema),
    async (c) => {
      try {
        const data = getValidatedBody<UpdateSuspiciousPatternConfigInput>(c);
        const user = c.get('user');
        
        const oldConfig = getSuspiciousPatternConfig();
        updateSuspiciousPatternConfig(data);
        const newConfig = getSuspiciousPatternConfig();
        
        logger.info('[IP_BLOCKING_ROUTES] Suspicious pattern config updated', {
          updatedBy: user?.id,
          oldConfig,
          newConfig,
        });
        
        return successResponse(c, {
          config: newConfig,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to update suspicious config', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update suspicious pattern configuration', 500);
      }
    }
  );

  /**
   * @route GET /api/admin/ip-blocking/suspicious/stats
   * @description Get suspicious activity statistics
   * @access Admin only
   * 
   * **Validates: Requirements 14.5**
   */
  app.get(
    '/suspicious/stats',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const stats = getSuspiciousStats();
        const ipBlockingService = getIPBlockingService();
        const isEmergency = await ipBlockingService.isEmergencyMode();
        const config = getSuspiciousPatternConfig();
        
        return successResponse(c, {
          stats,
          isEmergencyMode: isEmergency,
          autoEmergencyEnabled: config.autoEmergencyMode,
          autoEmergencyThreshold: config.autoEmergencyThreshold,
          willTriggerEmergency: stats.totalSuspiciousIPs >= config.autoEmergencyThreshold,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to get suspicious stats', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get suspicious activity statistics', 500);
      }
    }
  );

  /**
   * @route POST /api/admin/ip-blocking/suspicious/clear
   * @description Clear suspicious activity tracking data
   * @access Admin only
   */
  app.post(
    '/suspicious/clear',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const user = c.get('user');
        
        clearSuspiciousTracking();
        
        logger.info('[IP_BLOCKING_ROUTES] Suspicious tracking cleared', {
          clearedBy: user?.id,
        });
        
        return successResponse(c, {
          message: 'Suspicious activity tracking data cleared',
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to clear suspicious tracking', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to clear suspicious tracking', 500);
      }
    }
  );

  // ============================================
  // Emergency Mode Status and Metrics Routes
  // ============================================

  /**
   * @route GET /api/admin/ip-blocking/emergency/status
   * @description Get detailed emergency mode status including metrics
   * @access Admin only
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  app.get(
    '/emergency/status',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const emergencyModeService = getEmergencyModeService();
        const [status, metrics, config] = await Promise.all([
          emergencyModeService.getStatus(),
          emergencyModeService.getMetrics(),
          Promise.resolve(emergencyModeService.getConfig()),
        ]);
        
        return successResponse(c, {
          status,
          metrics,
          config,
          thresholds: {
            autoActivationThreshold: config.autoActivationThreshold,
            violationsPerMinuteThreshold: config.violationsPerMinuteThreshold,
          },
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to get emergency status', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get emergency mode status', 500);
      }
    }
  );

  /**
   * @route GET /api/admin/ip-blocking/emergency/metrics
   * @description Get attack metrics for monitoring
   * @access Admin only
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  app.get(
    '/emergency/metrics',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const emergencyModeService = getEmergencyModeService();
        const metrics = await emergencyModeService.getMetrics();
        const status = await emergencyModeService.getStatus();
        
        return successResponse(c, {
          metrics,
          isEmergencyMode: status.isActive,
          autoActivated: status.autoActivated,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to get emergency metrics', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get emergency metrics', 500);
      }
    }
  );

  /**
   * @route POST /api/admin/ip-blocking/emergency/activate
   * @description Manually activate emergency mode with custom settings
   * @access Admin only
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  app.post(
    '/emergency/activate',
    authenticate(),
    requireRole('ADMIN'),
    validate(ActivateEmergencyModeSchema),
    async (c) => {
      try {
        const user = c.get('user');
        const data = getValidatedBody<ActivateEmergencyModeInput>(c);
        const reason = data.reason || 'Manual activation by admin';
        const duration = data.duration;
        
        const emergencyModeService = getEmergencyModeService();
        await emergencyModeService.activate({
          reason,
          activatedBy: user?.id,
          duration,
          autoActivated: false,
        });
        
        const status = await emergencyModeService.getStatus();
        
        logger.warn('[IP_BLOCKING_ROUTES] Emergency mode manually activated', {
          activatedBy: user?.id,
          reason,
          duration,
        });
        
        return successResponse(c, {
          message: 'Emergency mode activated with stricter rate limits and increased CAPTCHA challenge rate',
          status,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to activate emergency mode', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to activate emergency mode', 500);
      }
    }
  );

  /**
   * @route POST /api/admin/ip-blocking/emergency/deactivate
   * @description Manually deactivate emergency mode
   * @access Admin only
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  app.post(
    '/emergency/deactivate',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const user = c.get('user');
        
        const emergencyModeService = getEmergencyModeService();
        await emergencyModeService.deactivate(user?.id);
        
        logger.info('[IP_BLOCKING_ROUTES] Emergency mode manually deactivated', {
          deactivatedBy: user?.id,
        });
        
        return successResponse(c, {
          message: 'Emergency mode deactivated. Normal rate limits and CAPTCHA challenge rates restored.',
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to deactivate emergency mode', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to deactivate emergency mode', 500);
      }
    }
  );

  // ============================================
  // CAPTCHA Challenge Rate Configuration Routes
  // ============================================

  /**
   * @route GET /api/admin/ip-blocking/captcha/config
   * @description Get CAPTCHA challenge rate configuration
   * @access Admin only
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  app.get(
    '/captcha/config',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const ipBlockingService = getIPBlockingService();
        const isEmergency = await ipBlockingService.isEmergencyMode();
        const config = getCaptchaChallengeConfig();
        const suspiciousIPCount = getSuspiciousIPCountForCaptcha();
        
        return successResponse(c, {
          config,
          isEmergencyMode: isEmergency,
          suspiciousIPCount,
          effectiveChallengeRate: isEmergency 
            ? config.emergencyChallengeRate 
            : config.baseChallengeRate,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to get CAPTCHA config', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get CAPTCHA configuration', 500);
      }
    }
  );

  /**
   * @route PUT /api/admin/ip-blocking/captcha/config
   * @description Update CAPTCHA challenge rate configuration
   * @access Admin only
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  app.put(
    '/captcha/config',
    authenticate(),
    requireRole('ADMIN'),
    validate(UpdateCaptchaChallengeConfigSchema),
    async (c) => {
      try {
        const data = getValidatedBody<UpdateCaptchaChallengeConfigInput>(c);
        const user = c.get('user');
        
        const oldConfig = getCaptchaChallengeConfig();
        updateCaptchaChallengeConfig(data);
        const newConfig = getCaptchaChallengeConfig();
        
        logger.info('[IP_BLOCKING_ROUTES] CAPTCHA challenge config updated', {
          updatedBy: user?.id,
          oldConfig,
          newConfig,
        });
        
        return successResponse(c, {
          config: newConfig,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to update CAPTCHA config', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update CAPTCHA configuration', 500);
      }
    }
  );

  /**
   * @route POST /api/admin/ip-blocking/captcha/reset
   * @description Reset CAPTCHA challenge rate configuration to defaults
   * @access Admin only
   */
  app.post(
    '/captcha/reset',
    authenticate(),
    requireRole('ADMIN'),
    async (c) => {
      try {
        const user = c.get('user');
        
        resetCaptchaChallengeConfig();
        const newConfig = getCaptchaChallengeConfig();
        
        logger.info('[IP_BLOCKING_ROUTES] CAPTCHA challenge config reset to defaults', {
          resetBy: user?.id,
        });
        
        return successResponse(c, {
          message: 'CAPTCHA challenge configuration reset to defaults',
          config: newConfig,
        });
      } catch (error) {
        logger.error('[IP_BLOCKING_ROUTES] Failed to reset CAPTCHA config', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to reset CAPTCHA configuration', 500);
      }
    }
  );

  return app;
}

export default { createIPBlockingRoutes };
