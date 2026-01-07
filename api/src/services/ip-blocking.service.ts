/**
 * IP Blocking Service
 *
 * Provides IP blocking functionality for DDoS mitigation and abuse prevention.
 * Tracks rate limit violations per IP and automatically blocks IPs that exceed thresholds.
 * Uses Redis for distributed tracking across multiple instances with in-memory fallback.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**
 */

import { getRedisClient, isRedisConnected } from '../config/redis';
import { logger } from '../utils/logger';

// ============================================
// Types and Interfaces
// ============================================

export interface IPBlockingConfig {
  threshold: number;            // Number of violations before blocking (default: 50)
  window: number;               // Time window in ms (default: 5 minutes)
  blockDuration: number;        // Block duration in ms (default: 1 hour)
  emergencyThreshold: number;   // Threshold for emergency mode (default: 25)
  emergencyBlockDuration: number; // Block duration in emergency mode (default: 2 hours)
}

export interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: Date;
  expiresAt: Date;
  violationCount: number;
  blockedBy?: string;           // Admin ID if manual block
  isEmergencyBlock: boolean;
}

export interface BlockedIPRecord {
  ip: string;
  reason: string;
  blockedAt: number;            // Unix timestamp
  expiresAt: number;            // Unix timestamp
  violationCount: number;
  blockedBy?: string;
  isEmergencyBlock: boolean;
}

export interface IPViolationStats {
  ip: string;
  count: number;
  firstViolation: number;
  lastViolation: number;
}

// ============================================
// Constants
// ============================================

const BLOCKED_IP_KEY_PREFIX = 'blocked_ip';
const IP_VIOLATIONS_KEY_PREFIX = 'ip_violations';
const EMERGENCY_MODE_KEY = 'ip_blocking:emergency_mode';

const DEFAULT_CONFIG: IPBlockingConfig = {
  threshold: 50,                    // 50 violations
  window: 5 * 60 * 1000,            // 5 minutes
  blockDuration: 60 * 60 * 1000,    // 1 hour
  emergencyThreshold: 25,           // 25 violations in emergency mode
  emergencyBlockDuration: 2 * 60 * 60 * 1000, // 2 hours
};

// In-memory fallback stores
const inMemoryBlockedIPs: Map<string, BlockedIPRecord> = new Map();
const inMemoryViolations: Map<string, { count: number; timestamps: number[] }> = new Map();
let inMemoryEmergencyMode = false;

// ============================================
// IP Blocking Service Class
// ============================================

class IPBlockingService {
  private config: IPBlockingConfig;

  constructor(config: Partial<IPBlockingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if an IP is blocked
   * 
   * @param ip - The IP address to check
   * @returns true if the IP is blocked
   * 
   * **Property 7: IP Blocking Enforcement**
   * **Validates: Requirements 14.1, 14.2**
   */
  async isBlocked(ip: string): Promise<boolean> {
    const redis = getRedisClient();
    
    if (!redis || !isRedisConnected()) {
      return this.isBlockedInMemory(ip);
    }

    try {
      const key = `${BLOCKED_IP_KEY_PREFIX}:${ip}`;
      const record = await redis.get(key);
      
      if (!record) {
        return false;
      }

      const blocked: BlockedIPRecord = JSON.parse(record);
      
      // Check if block has expired
      if (Date.now() > blocked.expiresAt) {
        await redis.del(key);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[IP_BLOCKING] Failed to check blocked status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip,
      });
      return this.isBlockedInMemory(ip);
    }
  }

  /**
   * Record a rate limit violation for an IP
   * Automatically blocks the IP if threshold is exceeded
   * 
   * @param ip - The IP address that violated rate limits
   * 
   * **Validates: Requirements 14.1**
   */
  async recordViolation(ip: string): Promise<void> {
    const redis = getRedisClient();
    const isEmergency = await this.isEmergencyMode();
    
    if (!redis || !isRedisConnected()) {
      await this.recordViolationInMemory(ip, isEmergency);
      return;
    }

    try {
      const key = `${IP_VIOLATIONS_KEY_PREFIX}:${ip}`;
      const now = Date.now();
      const windowStart = now - this.config.window;
      const threshold = isEmergency ? this.config.emergencyThreshold : this.config.threshold;

      // Use Redis sorted set for sliding window
      const pipeline = redis.pipeline();
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Add current violation
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      
      // Count violations in window
      pipeline.zcard(key);
      
      // Set expiry
      pipeline.expire(key, Math.ceil(this.config.window / 1000) + 60);
      
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Redis pipeline returned null');
      }

      // Get count from zcard result (index 2)
      const countResult = results[2];
      const violationCount = countResult && countResult[1] ? Number(countResult[1]) : 0;

      logger.debug('[IP_BLOCKING] Recorded violation', {
        ip,
        violationCount,
        threshold,
        isEmergency,
      });

      // Check if threshold exceeded
      if (violationCount >= threshold) {
        const blockDuration = isEmergency 
          ? this.config.emergencyBlockDuration 
          : this.config.blockDuration;
        
        await this.blockIP(
          ip, 
          `Exceeded rate limit threshold (${violationCount} violations in ${this.config.window / 60000} minutes)`,
          blockDuration,
          undefined,
          isEmergency
        );
      }
    } catch (error) {
      logger.error('[IP_BLOCKING] Failed to record violation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip,
      });
      await this.recordViolationInMemory(ip, isEmergency);
    }
  }

  /**
   * Get violation count for an IP in the current window
   * 
   * @param ip - The IP address to check
   * @returns Number of violations in the current window
   */
  async getViolationCount(ip: string): Promise<number> {
    const redis = getRedisClient();
    
    if (!redis || !isRedisConnected()) {
      return this.getViolationCountInMemory(ip);
    }

    try {
      const key = `${IP_VIOLATIONS_KEY_PREFIX}:${ip}`;
      const now = Date.now();
      const windowStart = now - this.config.window;
      
      return await redis.zcount(key, windowStart, now);
    } catch (error) {
      logger.error('[IP_BLOCKING] Failed to get violation count', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip,
      });
      return this.getViolationCountInMemory(ip);
    }
  }

  /**
   * Block an IP address
   * 
   * @param ip - The IP address to block
   * @param reason - Reason for blocking
   * @param duration - Block duration in ms (optional, uses default)
   * @param blockedBy - Admin ID if manual block
   * @param isEmergencyBlock - Whether this is an emergency mode block
   * 
   * **Validates: Requirements 14.1, 14.3**
   */
  async blockIP(
    ip: string, 
    reason: string, 
    duration?: number,
    blockedBy?: string,
    isEmergencyBlock = false
  ): Promise<void> {
    const redis = getRedisClient();
    const now = Date.now();
    const blockDuration = duration || this.config.blockDuration;
    const expiresAt = now + blockDuration;
    
    // Get current violation count
    const violationCount = await this.getViolationCount(ip);

    const record: BlockedIPRecord = {
      ip,
      reason,
      blockedAt: now,
      expiresAt,
      violationCount,
      blockedBy,
      isEmergencyBlock,
    };

    if (!redis || !isRedisConnected()) {
      this.blockIPInMemory(record);
      return;
    }

    try {
      const key = `${BLOCKED_IP_KEY_PREFIX}:${ip}`;
      const ttlSeconds = Math.ceil(blockDuration / 1000);
      
      await redis.setex(key, ttlSeconds, JSON.stringify(record));

      logger.warn('[IP_BLOCKING] IP blocked', {
        ip,
        reason,
        expiresAt: new Date(expiresAt).toISOString(),
        violationCount,
        blockedBy,
        isEmergencyBlock,
      });
    } catch (error) {
      logger.error('[IP_BLOCKING] Failed to block IP in Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip,
      });
      this.blockIPInMemory(record);
    }
  }

  /**
   * Unblock an IP address
   * 
   * @param ip - The IP address to unblock
   * 
   * **Validates: Requirements 14.4**
   */
  async unblockIP(ip: string): Promise<void> {
    const redis = getRedisClient();
    
    // Remove from in-memory store
    inMemoryBlockedIPs.delete(ip);

    if (!redis || !isRedisConnected()) {
      logger.info('[IP_BLOCKING] IP unblocked (in-memory)', { ip });
      return;
    }

    try {
      const key = `${BLOCKED_IP_KEY_PREFIX}:${ip}`;
      await redis.del(key);
      
      // Also clear violation history
      const violationKey = `${IP_VIOLATIONS_KEY_PREFIX}:${ip}`;
      await redis.del(violationKey);

      logger.info('[IP_BLOCKING] IP unblocked', { ip });
    } catch (error) {
      logger.error('[IP_BLOCKING] Failed to unblock IP', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip,
      });
    }
  }

  /**
   * Get list of all blocked IPs
   * 
   * @returns Array of blocked IP records
   * 
   * **Validates: Requirements 14.3**
   */
  async getBlockedIPs(): Promise<BlockedIP[]> {
    const redis = getRedisClient();
    
    if (!redis || !isRedisConnected()) {
      return this.getBlockedIPsFromMemory();
    }

    try {
      const keys = await redis.keys(`${BLOCKED_IP_KEY_PREFIX}:*`);
      const blockedIPs: BlockedIP[] = [];
      const now = Date.now();

      for (const key of keys) {
        const record = await redis.get(key);
        if (record) {
          const blocked: BlockedIPRecord = JSON.parse(record);
          
          // Skip expired entries
          if (blocked.expiresAt <= now) {
            await redis.del(key);
            continue;
          }

          blockedIPs.push({
            ip: blocked.ip,
            reason: blocked.reason,
            blockedAt: new Date(blocked.blockedAt),
            expiresAt: new Date(blocked.expiresAt),
            violationCount: blocked.violationCount,
            blockedBy: blocked.blockedBy,
            isEmergencyBlock: blocked.isEmergencyBlock,
          });
        }
      }

      return blockedIPs.sort((a, b) => b.blockedAt.getTime() - a.blockedAt.getTime());
    } catch (error) {
      logger.error('[IP_BLOCKING] Failed to get blocked IPs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.getBlockedIPsFromMemory();
    }
  }

  /**
   * Get details of a blocked IP
   * 
   * @param ip - The IP address to get details for
   * @returns Blocked IP record or null if not blocked
   */
  async getBlockedIPDetails(ip: string): Promise<BlockedIP | null> {
    const redis = getRedisClient();
    
    if (!redis || !isRedisConnected()) {
      const record = inMemoryBlockedIPs.get(ip);
      if (!record || record.expiresAt <= Date.now()) {
        return null;
      }
      return this.recordToBlockedIP(record);
    }

    try {
      const key = `${BLOCKED_IP_KEY_PREFIX}:${ip}`;
      const record = await redis.get(key);
      
      if (!record) {
        return null;
      }

      const blocked: BlockedIPRecord = JSON.parse(record);
      
      if (blocked.expiresAt <= Date.now()) {
        await redis.del(key);
        return null;
      }

      return this.recordToBlockedIP(blocked);
    } catch (error) {
      logger.error('[IP_BLOCKING] Failed to get blocked IP details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip,
      });
      return null;
    }
  }

  /**
   * Enable emergency mode with stricter rate limits
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  async enableEmergencyMode(): Promise<void> {
    const redis = getRedisClient();
    
    inMemoryEmergencyMode = true;

    if (!redis || !isRedisConnected()) {
      logger.warn('[IP_BLOCKING] Emergency mode enabled (in-memory)');
      return;
    }

    try {
      // Emergency mode lasts for 1 hour by default
      await redis.setex(EMERGENCY_MODE_KEY, 3600, '1');
      logger.warn('[IP_BLOCKING] Emergency mode enabled');
    } catch (error) {
      logger.error('[IP_BLOCKING] Failed to enable emergency mode', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Disable emergency mode
   * 
   * **Validates: Requirements 14.5, 14.6**
   */
  async disableEmergencyMode(): Promise<void> {
    const redis = getRedisClient();
    
    inMemoryEmergencyMode = false;

    if (!redis || !isRedisConnected()) {
      logger.info('[IP_BLOCKING] Emergency mode disabled (in-memory)');
      return;
    }

    try {
      await redis.del(EMERGENCY_MODE_KEY);
      logger.info('[IP_BLOCKING] Emergency mode disabled');
    } catch (error) {
      logger.error('[IP_BLOCKING] Failed to disable emergency mode', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if emergency mode is active
   * 
   * @returns true if emergency mode is active
   */
  async isEmergencyMode(): Promise<boolean> {
    const redis = getRedisClient();
    
    if (!redis || !isRedisConnected()) {
      return inMemoryEmergencyMode;
    }

    try {
      const value = await redis.get(EMERGENCY_MODE_KEY);
      return value === '1';
    } catch (error) {
      logger.error('[IP_BLOCKING] Failed to check emergency mode', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return inMemoryEmergencyMode;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): IPBlockingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<IPBlockingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // In-Memory Fallback Methods
  // ============================================

  private isBlockedInMemory(ip: string): boolean {
    const record = inMemoryBlockedIPs.get(ip);
    if (!record) return false;
    
    if (Date.now() > record.expiresAt) {
      inMemoryBlockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  private async recordViolationInMemory(ip: string, isEmergency: boolean): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.window;
    const threshold = isEmergency ? this.config.emergencyThreshold : this.config.threshold;
    
    let entry = inMemoryViolations.get(ip);
    
    if (!entry) {
      entry = { count: 0, timestamps: [] };
      inMemoryViolations.set(ip, entry);
    }
    
    // Remove expired timestamps
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);
    
    // Add current violation
    entry.timestamps.push(now);
    entry.count = entry.timestamps.length;
    
    // Check threshold
    if (entry.count >= threshold) {
      const blockDuration = isEmergency 
        ? this.config.emergencyBlockDuration 
        : this.config.blockDuration;
      
      await this.blockIP(
        ip,
        `Exceeded rate limit threshold (${entry.count} violations in ${this.config.window / 60000} minutes)`,
        blockDuration,
        undefined,
        isEmergency
      );
    }
  }

  private getViolationCountInMemory(ip: string): number {
    const entry = inMemoryViolations.get(ip);
    if (!entry) return 0;
    
    const windowStart = Date.now() - this.config.window;
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);
    entry.count = entry.timestamps.length;
    
    return entry.count;
  }

  private blockIPInMemory(record: BlockedIPRecord): void {
    inMemoryBlockedIPs.set(record.ip, record);
    
    logger.warn('[IP_BLOCKING] IP blocked (in-memory)', {
      ip: record.ip,
      reason: record.reason,
      expiresAt: new Date(record.expiresAt).toISOString(),
      violationCount: record.violationCount,
    });
  }

  private getBlockedIPsFromMemory(): BlockedIP[] {
    const now = Date.now();
    const blockedIPs: BlockedIP[] = [];
    
    for (const [ip, record] of inMemoryBlockedIPs.entries()) {
      if (record.expiresAt <= now) {
        inMemoryBlockedIPs.delete(ip);
        continue;
      }
      
      blockedIPs.push(this.recordToBlockedIP(record));
    }
    
    return blockedIPs.sort((a, b) => b.blockedAt.getTime() - a.blockedAt.getTime());
  }

  private recordToBlockedIP(record: BlockedIPRecord): BlockedIP {
    return {
      ip: record.ip,
      reason: record.reason,
      blockedAt: new Date(record.blockedAt),
      expiresAt: new Date(record.expiresAt),
      violationCount: record.violationCount,
      blockedBy: record.blockedBy,
      isEmergencyBlock: record.isEmergencyBlock,
    };
  }

  /**
   * Clear all blocked IPs and violations (for testing)
   */
  async clearAll(): Promise<void> {
    inMemoryBlockedIPs.clear();
    inMemoryViolations.clear();
    inMemoryEmergencyMode = false;

    const redis = getRedisClient();
    if (!redis || !isRedisConnected()) return;

    try {
      const blockedKeys = await redis.keys(`${BLOCKED_IP_KEY_PREFIX}:*`);
      const violationKeys = await redis.keys(`${IP_VIOLATIONS_KEY_PREFIX}:*`);
      
      const allKeys = [...blockedKeys, ...violationKeys, EMERGENCY_MODE_KEY];
      
      if (allKeys.length > 0) {
        await redis.del(...allKeys);
      }
    } catch (error) {
      logger.error('[IP_BLOCKING] Failed to clear all data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// ============================================
// Suspicious Pattern Detection
// ============================================

export interface SuspiciousPatternConfig {
  /** User agents to flag as suspicious */
  suspiciousUserAgents: string[];
  /** Request rate threshold per second to trigger pattern detection */
  rapidRequestThreshold: number;
  /** Time window for rapid request detection (ms) */
  rapidRequestWindow: number;
  /** Whether to auto-enable emergency mode on attack detection */
  autoEmergencyMode: boolean;
  /** Number of suspicious IPs to trigger auto emergency mode */
  autoEmergencyThreshold: number;
}

const DEFAULT_SUSPICIOUS_CONFIG: SuspiciousPatternConfig = {
  suspiciousUserAgents: [
    'curl',
    'wget',
    'python-requests',
    'go-http-client',
    'java/',
    'libwww-perl',
    'scrapy',
    'bot',
    'crawler',
    'spider',
  ],
  rapidRequestThreshold: 10,  // 10 requests per second
  rapidRequestWindow: 1000,   // 1 second
  autoEmergencyMode: true,
  autoEmergencyThreshold: 10, // 10 suspicious IPs triggers emergency
};

let suspiciousConfig: SuspiciousPatternConfig = { ...DEFAULT_SUSPICIOUS_CONFIG };
const suspiciousIPsCount = new Map<string, number>();
const rapidRequestTracking = new Map<string, number[]>();

/**
 * Get suspicious pattern configuration
 */
export function getSuspiciousPatternConfig(): SuspiciousPatternConfig {
  return { ...suspiciousConfig };
}

/**
 * Update suspicious pattern configuration
 */
export function updateSuspiciousPatternConfig(config: Partial<SuspiciousPatternConfig>): void {
  suspiciousConfig = { ...suspiciousConfig, ...config };
  logger.info('[IP_BLOCKING] Suspicious pattern config updated', { config: suspiciousConfig });
}

/**
 * Check if a user agent is suspicious
 * 
 * **Validates: Requirements 14.5**
 */
export function isSuspiciousUserAgent(userAgent: string | undefined): boolean {
  if (!userAgent) return true; // No user agent is suspicious
  
  const lowerUA = userAgent.toLowerCase();
  return suspiciousConfig.suspiciousUserAgents.some(pattern => 
    lowerUA.includes(pattern.toLowerCase())
  );
}

/**
 * Track rapid requests from an IP
 * Returns true if the IP is making rapid requests (potential attack)
 * 
 * **Validates: Requirements 14.5**
 */
export function trackRapidRequests(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - suspiciousConfig.rapidRequestWindow;
  
  let timestamps = rapidRequestTracking.get(ip) || [];
  
  // Remove old timestamps
  timestamps = timestamps.filter(t => t > windowStart);
  
  // Add current timestamp
  timestamps.push(now);
  rapidRequestTracking.set(ip, timestamps);
  
  // Check if exceeds threshold
  return timestamps.length >= suspiciousConfig.rapidRequestThreshold;
}

/**
 * Record a suspicious IP and check if emergency mode should be triggered
 * 
 * **Validates: Requirements 14.5, 14.6**
 */
export async function recordSuspiciousIP(ip: string, reason: string): Promise<void> {
  const count = (suspiciousIPsCount.get(ip) || 0) + 1;
  suspiciousIPsCount.set(ip, count);
  
  logger.warn('[IP_BLOCKING] Suspicious activity detected', {
    ip,
    reason,
    count,
  });
  
  // Check if we should auto-enable emergency mode
  if (suspiciousConfig.autoEmergencyMode) {
    const totalSuspicious = suspiciousIPsCount.size;
    
    if (totalSuspicious >= suspiciousConfig.autoEmergencyThreshold) {
      const ipBlockingService = getIPBlockingService();
      const isEmergency = await ipBlockingService.isEmergencyMode();
      
      if (!isEmergency) {
        logger.warn('[IP_BLOCKING] Auto-enabling emergency mode due to suspicious activity', {
          suspiciousIPCount: totalSuspicious,
          threshold: suspiciousConfig.autoEmergencyThreshold,
        });
        await ipBlockingService.enableEmergencyMode();
      }
    }
  }
}

/**
 * Clear suspicious IP tracking (for testing or reset)
 */
export function clearSuspiciousTracking(): void {
  suspiciousIPsCount.clear();
  rapidRequestTracking.clear();
}

/**
 * Get suspicious IP statistics
 */
export function getSuspiciousStats(): { totalSuspiciousIPs: number; rapidRequestIPs: number } {
  return {
    totalSuspiciousIPs: suspiciousIPsCount.size,
    rapidRequestIPs: rapidRequestTracking.size,
  };
}

// Cleanup old rapid request tracking every minute
setInterval(() => {
  const now = Date.now();
  const windowStart = now - suspiciousConfig.rapidRequestWindow * 60; // Keep 1 minute of data
  
  for (const [ip, timestamps] of rapidRequestTracking.entries()) {
    const filtered = timestamps.filter(t => t > windowStart);
    if (filtered.length === 0) {
      rapidRequestTracking.delete(ip);
    } else {
      rapidRequestTracking.set(ip, filtered);
    }
  }
}, 60000);

// ============================================
// Singleton Instance
// ============================================

let ipBlockingService: IPBlockingService | null = null;

/**
 * Get or create the IP blocking service singleton
 */
export function getIPBlockingService(config?: Partial<IPBlockingConfig>): IPBlockingService {
  if (!ipBlockingService) {
    ipBlockingService = new IPBlockingService(config);
  }
  return ipBlockingService;
}

/**
 * Reset the IP blocking service (for testing)
 */
export function resetIPBlockingService(): void {
  ipBlockingService = null;
}

// Export constants for testing
export const CONSTANTS = {
  BLOCKED_IP_KEY_PREFIX,
  IP_VIOLATIONS_KEY_PREFIX,
  EMERGENCY_MODE_KEY,
  DEFAULT_CONFIG,
};

export { IPBlockingService };
