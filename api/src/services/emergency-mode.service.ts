/**
 * Emergency Mode Service
 *
 * Coordinates emergency mode features for DDoS mitigation and attack response.
 * Provides centralized control for:
 * - Stricter rate limits
 * - Increased CAPTCHA challenge rate
 * - Auto-detection of attacks
 * - Coordinated response across all security features
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.5, 14.6**
 */

import { getRedisClient, isRedisConnected } from '../config/redis';
import { getIPBlockingService } from './ip-blocking.service';
import { updateEmergencyConfig } from '../middleware/emergency-rate-limiter';
import { logger } from '../utils/logger';

// ============================================
// CAPTCHA Challenge Rate Configuration
// ============================================

export interface CaptchaChallengeConfig {
  /** Base challenge rate (0.0 to 1.0) - probability of requiring CAPTCHA */
  baseChallengeRate: number;
  /** Challenge rate in emergency mode (0.0 to 1.0) */
  emergencyChallengeRate: number;
  /** Challenge rate for suspicious IPs (0.0 to 1.0) */
  suspiciousChallengeRate: number;
  /** Whether to always require CAPTCHA in emergency mode */
  alwaysRequireInEmergency: boolean;
  /** Paths that always require CAPTCHA */
  alwaysRequirePaths: string[];
  /** Paths that never require CAPTCHA */
  neverRequirePaths: string[];
}

const DEFAULT_CAPTCHA_CONFIG: CaptchaChallengeConfig = {
  baseChallengeRate: 0.0,           // No CAPTCHA by default
  emergencyChallengeRate: 1.0,      // Always require in emergency
  suspiciousChallengeRate: 0.8,     // 80% chance for suspicious IPs
  alwaysRequireInEmergency: true,
  alwaysRequirePaths: ['/api/auth/login', '/api/auth/signup', '/api/leads'],
  neverRequirePaths: ['/health', '/health/live', '/health/ready', '/metrics'],
};

let captchaChallengeConfig: CaptchaChallengeConfig = { ...DEFAULT_CAPTCHA_CONFIG };

// Track suspicious IPs for CAPTCHA challenge rate
const suspiciousIPsForCaptcha: Map<string, { count: number; lastSeen: number }> = new Map();

// ============================================
// Types and Interfaces
// ============================================

export interface EmergencyModeStatus {
  isActive: boolean;
  activatedAt?: Date;
  activatedBy?: string;
  reason?: string;
  autoActivated: boolean;
  expiresAt?: Date;
}

export interface EmergencyModeConfig {
  /** Rate limit multiplier (0.1 to 1.0) */
  rateLimitMultiplier: number;
  /** Window multiplier (1.0 to 10.0) */
  windowMultiplier: number;
  /** Whether CAPTCHA is required for all forms */
  requireCaptcha: boolean;
  /** Auto-expire duration in ms (default: 1 hour) */
  autoExpireDuration: number;
  /** Threshold for auto-activation (blocked IPs count) */
  autoActivationThreshold: number;
  /** Threshold for auto-activation (violations per minute) */
  violationsPerMinuteThreshold: number;
}

export interface AttackMetrics {
  blockedIPsCount: number;
  violationsLastMinute: number;
  violationsLastHour: number;
  suspiciousRequestsCount: number;
  emergencyBlocksCount: number;
}

// ============================================
// Constants
// ============================================

const EMERGENCY_STATUS_KEY = 'emergency_mode:status';
const VIOLATIONS_MINUTE_KEY = 'emergency_mode:violations:minute';
const VIOLATIONS_HOUR_KEY = 'emergency_mode:violations:hour';

const DEFAULT_CONFIG: EmergencyModeConfig = {
  rateLimitMultiplier: 0.5,
  windowMultiplier: 2,
  requireCaptcha: true,
  autoExpireDuration: 60 * 60 * 1000, // 1 hour
  autoActivationThreshold: 20, // 20 blocked IPs
  violationsPerMinuteThreshold: 100, // 100 violations per minute
};

// In-memory fallback
let inMemoryStatus: EmergencyModeStatus = {
  isActive: false,
  autoActivated: false,
};
let inMemoryViolationsMinute: number[] = [];
let inMemoryViolationsHour: number[] = [];

// ============================================
// Emergency Mode Service Class
// ============================================

class EmergencyModeService {
  private config: EmergencyModeConfig;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<EmergencyModeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current emergency mode status
   */
  async getStatus(): Promise<EmergencyModeStatus> {
    const redis = getRedisClient();

    if (!redis || !isRedisConnected()) {
      return { ...inMemoryStatus };
    }

    try {
      const statusJson = await redis.get(EMERGENCY_STATUS_KEY);
      if (!statusJson) {
        return { isActive: false, autoActivated: false };
      }

      const status = JSON.parse(statusJson);
      return {
        isActive: status.isActive,
        activatedAt: status.activatedAt ? new Date(status.activatedAt) : undefined,
        activatedBy: status.activatedBy,
        reason: status.reason,
        autoActivated: status.autoActivated,
        expiresAt: status.expiresAt ? new Date(status.expiresAt) : undefined,
      };
    } catch (error) {
      logger.error('[EMERGENCY_MODE] Failed to get status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { ...inMemoryStatus };
    }
  }

  /**
   * Activate emergency mode
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  async activate(options: {
    reason: string;
    activatedBy?: string;
    duration?: number;
    autoActivated?: boolean;
  }): Promise<void> {
    const { reason, activatedBy, duration, autoActivated = false } = options;
    const now = Date.now();
    const expiresAt = now + (duration || this.config.autoExpireDuration);

    const status: EmergencyModeStatus = {
      isActive: true,
      activatedAt: new Date(now),
      activatedBy,
      reason,
      autoActivated,
      expiresAt: new Date(expiresAt),
    };

    // Update in-memory status
    inMemoryStatus = status;

    // Enable emergency mode in IP blocking service
    const ipBlockingService = getIPBlockingService();
    await ipBlockingService.enableEmergencyMode();

    // Update emergency rate limiter config
    updateEmergencyConfig({
      rateLimitMultiplier: this.config.rateLimitMultiplier,
      windowMultiplier: this.config.windowMultiplier,
      requireCaptcha: this.config.requireCaptcha,
    });

    // Store in Redis
    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      try {
        const ttlSeconds = Math.ceil((expiresAt - now) / 1000);
        await redis.setex(
          EMERGENCY_STATUS_KEY,
          ttlSeconds,
          JSON.stringify({
            ...status,
            activatedAt: status.activatedAt?.getTime(),
            expiresAt: status.expiresAt?.getTime(),
          })
        );
      } catch (error) {
        logger.error('[EMERGENCY_MODE] Failed to store status in Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.warn('[EMERGENCY_MODE] Emergency mode ACTIVATED', {
      reason,
      activatedBy,
      autoActivated,
      expiresAt: new Date(expiresAt).toISOString(),
      config: {
        rateLimitMultiplier: this.config.rateLimitMultiplier,
        windowMultiplier: this.config.windowMultiplier,
        requireCaptcha: this.config.requireCaptcha,
      },
    });
  }

  /**
   * Deactivate emergency mode
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  async deactivate(deactivatedBy?: string): Promise<void> {
    // Update in-memory status
    inMemoryStatus = { isActive: false, autoActivated: false };

    // Disable emergency mode in IP blocking service
    const ipBlockingService = getIPBlockingService();
    await ipBlockingService.disableEmergencyMode();

    // Remove from Redis
    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      try {
        await redis.del(EMERGENCY_STATUS_KEY);
      } catch (error) {
        logger.error('[EMERGENCY_MODE] Failed to remove status from Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('[EMERGENCY_MODE] Emergency mode DEACTIVATED', {
      deactivatedBy,
    });
  }

  /**
   * Record a rate limit violation for attack detection
   */
  async recordViolation(): Promise<void> {
    const now = Date.now();
    const minuteAgo = now - 60 * 1000;
    const hourAgo = now - 60 * 60 * 1000;

    // Update in-memory tracking
    inMemoryViolationsMinute = inMemoryViolationsMinute.filter(t => t > minuteAgo);
    inMemoryViolationsMinute.push(now);

    inMemoryViolationsHour = inMemoryViolationsHour.filter(t => t > hourAgo);
    inMemoryViolationsHour.push(now);

    // Update Redis
    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      try {
        const pipeline = redis.pipeline();
        
        // Minute tracking
        pipeline.zremrangebyscore(VIOLATIONS_MINUTE_KEY, 0, minuteAgo);
        pipeline.zadd(VIOLATIONS_MINUTE_KEY, now, `${now}-${Math.random()}`);
        pipeline.expire(VIOLATIONS_MINUTE_KEY, 120);
        
        // Hour tracking
        pipeline.zremrangebyscore(VIOLATIONS_HOUR_KEY, 0, hourAgo);
        pipeline.zadd(VIOLATIONS_HOUR_KEY, now, `${now}-${Math.random()}`);
        pipeline.expire(VIOLATIONS_HOUR_KEY, 3700);
        
        await pipeline.exec();
      } catch (error) {
        logger.debug('[EMERGENCY_MODE] Failed to record violation in Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Check if we should auto-activate emergency mode
    await this.checkAutoActivation();
  }

  /**
   * Get attack metrics
   */
  async getMetrics(): Promise<AttackMetrics> {
    const ipBlockingService = getIPBlockingService();
    const blockedIPs = await ipBlockingService.getBlockedIPs();

    let violationsLastMinute = inMemoryViolationsMinute.length;
    let violationsLastHour = inMemoryViolationsHour.length;

    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      try {
        const now = Date.now();
        const minuteAgo = now - 60 * 1000;
        const hourAgo = now - 60 * 60 * 1000;

        const [minuteCount, hourCount] = await Promise.all([
          redis.zcount(VIOLATIONS_MINUTE_KEY, minuteAgo, now),
          redis.zcount(VIOLATIONS_HOUR_KEY, hourAgo, now),
        ]);

        violationsLastMinute = minuteCount;
        violationsLastHour = hourCount;
      } catch (error) {
        logger.debug('[EMERGENCY_MODE] Failed to get metrics from Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      blockedIPsCount: blockedIPs.length,
      violationsLastMinute,
      violationsLastHour,
      suspiciousRequestsCount: blockedIPs.filter(ip => ip.isEmergencyBlock).length,
      emergencyBlocksCount: blockedIPs.filter(ip => ip.isEmergencyBlock).length,
    };
  }

  /**
   * Check if emergency mode should be auto-activated
   */
  private async checkAutoActivation(): Promise<void> {
    const status = await this.getStatus();
    if (status.isActive) return;

    const metrics = await this.getMetrics();

    // Check blocked IPs threshold
    if (metrics.blockedIPsCount >= this.config.autoActivationThreshold) {
      await this.activate({
        reason: `Auto-activated: ${metrics.blockedIPsCount} IPs blocked (threshold: ${this.config.autoActivationThreshold})`,
        autoActivated: true,
      });
      return;
    }

    // Check violations per minute threshold
    if (metrics.violationsLastMinute >= this.config.violationsPerMinuteThreshold) {
      await this.activate({
        reason: `Auto-activated: ${metrics.violationsLastMinute} violations/min (threshold: ${this.config.violationsPerMinuteThreshold})`,
        autoActivated: true,
      });
      return;
    }
  }

  /**
   * Start periodic check for auto-activation and expiration
   */
  startPeriodicCheck(intervalMs = 30000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        const status = await this.getStatus();

        // Check for expiration
        if (status.isActive && status.expiresAt && status.expiresAt <= new Date()) {
          logger.info('[EMERGENCY_MODE] Emergency mode expired, deactivating');
          await this.deactivate();
          return;
        }

        // Check for auto-activation
        if (!status.isActive) {
          await this.checkAutoActivation();
        }
      } catch (error) {
        logger.error('[EMERGENCY_MODE] Periodic check failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, intervalMs);

    logger.info('[EMERGENCY_MODE] Periodic check started', { intervalMs });
  }

  /**
   * Stop periodic check
   */
  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('[EMERGENCY_MODE] Periodic check stopped');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): EmergencyModeConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EmergencyModeConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Also update emergency rate limiter config if emergency mode is active
    if (inMemoryStatus.isActive) {
      updateEmergencyConfig({
        rateLimitMultiplier: this.config.rateLimitMultiplier,
        windowMultiplier: this.config.windowMultiplier,
        requireCaptcha: this.config.requireCaptcha,
      });
    }

    logger.info('[EMERGENCY_MODE] Configuration updated', { config: this.config });
  }

  /**
   * Clear all metrics (for testing)
   */
  async clearMetrics(): Promise<void> {
    inMemoryViolationsMinute = [];
    inMemoryViolationsHour = [];

    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      try {
        await redis.del(VIOLATIONS_MINUTE_KEY, VIOLATIONS_HOUR_KEY);
      } catch (error) {
        logger.debug('[EMERGENCY_MODE] Failed to clear metrics from Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let emergencyModeService: EmergencyModeService | null = null;

/**
 * Get or create the emergency mode service singleton
 */
export function getEmergencyModeService(config?: Partial<EmergencyModeConfig>): EmergencyModeService {
  if (!emergencyModeService) {
    emergencyModeService = new EmergencyModeService(config);
  }
  return emergencyModeService;
}

/**
 * Reset the emergency mode service (for testing)
 */
export function resetEmergencyModeService(): void {
  if (emergencyModeService) {
    emergencyModeService.stopPeriodicCheck();
  }
  emergencyModeService = null;
  inMemoryStatus = { isActive: false, autoActivated: false };
  inMemoryViolationsMinute = [];
  inMemoryViolationsHour = [];
}

export { EmergencyModeService };

// ============================================
// CAPTCHA Challenge Rate Functions
// ============================================

/**
 * Get current CAPTCHA challenge configuration
 */
export function getCaptchaChallengeConfig(): CaptchaChallengeConfig {
  return { ...captchaChallengeConfig };
}

/**
 * Update CAPTCHA challenge configuration
 * 
 * **Validates: Requirements 14.5, 14.6**
 */
export function updateCaptchaChallengeConfig(config: Partial<CaptchaChallengeConfig>): void {
  captchaChallengeConfig = { ...captchaChallengeConfig, ...config };
  logger.info('[EMERGENCY_MODE] CAPTCHA challenge config updated', { config: captchaChallengeConfig });
}

/**
 * Reset CAPTCHA challenge configuration to defaults
 */
export function resetCaptchaChallengeConfig(): void {
  captchaChallengeConfig = { ...DEFAULT_CAPTCHA_CONFIG };
  logger.info('[EMERGENCY_MODE] CAPTCHA challenge config reset to defaults');
}

/**
 * Record a suspicious IP for CAPTCHA challenge rate increase
 * 
 * **Validates: Requirements 14.5**
 */
export function recordSuspiciousIPForCaptcha(ip: string): void {
  const now = Date.now();
  const existing = suspiciousIPsForCaptcha.get(ip);
  
  if (existing) {
    existing.count++;
    existing.lastSeen = now;
  } else {
    suspiciousIPsForCaptcha.set(ip, { count: 1, lastSeen: now });
  }
  
  logger.debug('[EMERGENCY_MODE] Recorded suspicious IP for CAPTCHA', {
    ip,
    count: suspiciousIPsForCaptcha.get(ip)?.count,
  });
}

/**
 * Check if an IP is marked as suspicious for CAPTCHA purposes
 */
export function isSuspiciousIPForCaptcha(ip: string): boolean {
  const entry = suspiciousIPsForCaptcha.get(ip);
  if (!entry) return false;
  
  // Expire after 30 minutes
  if (Date.now() - entry.lastSeen > 30 * 60 * 1000) {
    suspiciousIPsForCaptcha.delete(ip);
    return false;
  }
  
  return entry.count >= 3; // Suspicious after 3 incidents
}

/**
 * Determine if CAPTCHA should be required for a request
 * 
 * This function implements the CAPTCHA challenge rate logic:
 * - In emergency mode: always require CAPTCHA (if configured)
 * - For suspicious IPs: high probability of requiring CAPTCHA
 * - For normal requests: based on base challenge rate
 * 
 * **Validates: Requirements 14.5, 14.6**
 * 
 * @param ip - Client IP address
 * @param path - Request path
 * @param isSuspicious - Whether the request is flagged as suspicious
 * @returns Whether CAPTCHA should be required
 */
export async function shouldRequireCaptcha(
  ip: string,
  path: string,
  isSuspicious = false
): Promise<{ required: boolean; reason: string }> {
  // Check never-require paths first
  if (captchaChallengeConfig.neverRequirePaths.some(p => path.startsWith(p))) {
    return { required: false, reason: 'path_excluded' };
  }
  
  // Check always-require paths
  const isAlwaysRequirePath = captchaChallengeConfig.alwaysRequirePaths.some(p => path.startsWith(p));
  
  // Check emergency mode
  let isEmergency = false;
  try {
    const service = getEmergencyModeService();
    const status = await service.getStatus();
    isEmergency = status.isActive;
  } catch {
    // Ignore errors
  }
  
  // In emergency mode with alwaysRequireInEmergency, require CAPTCHA
  if (isEmergency && captchaChallengeConfig.alwaysRequireInEmergency) {
    return { required: true, reason: 'emergency_mode' };
  }
  
  // In emergency mode, use emergency challenge rate
  if (isEmergency) {
    const shouldChallenge = Math.random() < captchaChallengeConfig.emergencyChallengeRate;
    if (shouldChallenge) {
      return { required: true, reason: 'emergency_challenge_rate' };
    }
  }
  
  // Check if IP is suspicious
  const isSuspiciousIP = isSuspicious || isSuspiciousIPForCaptcha(ip);
  if (isSuspiciousIP) {
    const shouldChallenge = Math.random() < captchaChallengeConfig.suspiciousChallengeRate;
    if (shouldChallenge) {
      return { required: true, reason: 'suspicious_ip' };
    }
  }
  
  // Always require for certain paths
  if (isAlwaysRequirePath) {
    return { required: true, reason: 'always_require_path' };
  }
  
  // Base challenge rate
  if (captchaChallengeConfig.baseChallengeRate > 0) {
    const shouldChallenge = Math.random() < captchaChallengeConfig.baseChallengeRate;
    if (shouldChallenge) {
      return { required: true, reason: 'base_challenge_rate' };
    }
  }
  
  return { required: false, reason: 'not_required' };
}

/**
 * Clear suspicious IP tracking for CAPTCHA (for testing)
 */
export function clearSuspiciousIPsForCaptcha(): void {
  suspiciousIPsForCaptcha.clear();
}

/**
 * Get suspicious IP count for CAPTCHA
 */
export function getSuspiciousIPCountForCaptcha(): number {
  return suspiciousIPsForCaptcha.size;
}

// Cleanup old suspicious IP entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const expireTime = 30 * 60 * 1000; // 30 minutes
  
  for (const [ip, entry] of suspiciousIPsForCaptcha.entries()) {
    if (now - entry.lastSeen > expireTime) {
      suspiciousIPsForCaptcha.delete(ip);
    }
  }
}, 5 * 60 * 1000);
