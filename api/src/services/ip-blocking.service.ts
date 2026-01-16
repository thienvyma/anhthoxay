/**
 * IP Blocking Service
 *
 * Provides IP blocking functionality for DDoS mitigation and abuse prevention.
 * Tracks rate limit violations per IP and automatically blocks IPs that exceed thresholds.
 * Uses in-memory storage.
 */

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

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG: IPBlockingConfig = {
  threshold: 50,                    // 50 violations
  window: 5 * 60 * 1000,            // 5 minutes
  blockDuration: 60 * 60 * 1000,    // 1 hour
  emergencyThreshold: 25,           // 25 violations in emergency mode
  emergencyBlockDuration: 2 * 60 * 60 * 1000, // 2 hours
};

// In-memory stores
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
   */
  async isBlocked(ip: string): Promise<boolean> {
    return this.isBlockedInMemory(ip);
  }

  /**
   * Record a rate limit violation for an IP
   */
  async recordViolation(ip: string): Promise<void> {
    const isEmergency = await this.isEmergencyMode();
    await this.recordViolationInMemory(ip, isEmergency);
  }

  /**
   * Get violation count for an IP in the current window
   */
  async getViolationCount(ip: string): Promise<number> {
    return this.getViolationCountInMemory(ip);
  }

  /**
   * Block an IP address
   */
  async blockIP(
    ip: string, 
    reason: string, 
    duration?: number,
    blockedBy?: string,
    isEmergencyBlock = false
  ): Promise<void> {
    const now = Date.now();
    const blockDuration = duration || this.config.blockDuration;
    const expiresAt = now + blockDuration;
    
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

    this.blockIPInMemory(record);
  }

  /**
   * Unblock an IP address
   */
  async unblockIP(ip: string): Promise<void> {
    inMemoryBlockedIPs.delete(ip);
    inMemoryViolations.delete(ip);
    logger.info('[IP_BLOCKING] IP unblocked', { ip });
  }

  /**
   * Get list of all blocked IPs
   */
  async getBlockedIPs(): Promise<BlockedIP[]> {
    return this.getBlockedIPsFromMemory();
  }

  /**
   * Get details of a blocked IP
   */
  async getBlockedIPDetails(ip: string): Promise<BlockedIP | null> {
    const record = inMemoryBlockedIPs.get(ip);
    if (!record || record.expiresAt <= Date.now()) {
      return null;
    }
    return this.recordToBlockedIP(record);
  }

  /**
   * Enable emergency mode with stricter rate limits
   */
  async enableEmergencyMode(): Promise<void> {
    inMemoryEmergencyMode = true;
    logger.warn('[IP_BLOCKING] Emergency mode enabled');
  }

  /**
   * Disable emergency mode
   */
  async disableEmergencyMode(): Promise<void> {
    inMemoryEmergencyMode = false;
    logger.info('[IP_BLOCKING] Emergency mode disabled');
  }

  /**
   * Check if emergency mode is active
   */
  async isEmergencyMode(): Promise<boolean> {
    return inMemoryEmergencyMode;
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
  // In-Memory Methods
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

    logger.debug('[IP_BLOCKING] Recorded violation', {
      ip,
      violationCount: entry.count,
      threshold,
      isEmergency,
    });
    
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
    
    logger.warn('[IP_BLOCKING] IP blocked', {
      ip: record.ip,
      reason: record.reason,
      expiresAt: new Date(record.expiresAt).toISOString(),
      violationCount: record.violationCount,
      isEmergencyBlock: record.isEmergencyBlock,
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
  }
}

// ============================================
// Suspicious Pattern Detection
// ============================================

export interface SuspiciousPatternConfig {
  suspiciousUserAgents: string[];
  rapidRequestThreshold: number;
  rapidRequestWindow: number;
  autoEmergencyMode: boolean;
  autoEmergencyThreshold: number;
}

const DEFAULT_SUSPICIOUS_CONFIG: SuspiciousPatternConfig = {
  suspiciousUserAgents: [
    'curl', 'wget', 'python-requests', 'go-http-client',
    'java/', 'libwww-perl', 'scrapy', 'bot', 'crawler', 'spider',
  ],
  rapidRequestThreshold: 10,
  rapidRequestWindow: 1000,
  autoEmergencyMode: true,
  autoEmergencyThreshold: 10,
};

let suspiciousConfig: SuspiciousPatternConfig = { ...DEFAULT_SUSPICIOUS_CONFIG };
const suspiciousIPsCount = new Map<string, number>();
const rapidRequestTracking = new Map<string, number[]>();

export function getSuspiciousPatternConfig(): SuspiciousPatternConfig {
  return { ...suspiciousConfig };
}

export function updateSuspiciousPatternConfig(config: Partial<SuspiciousPatternConfig>): void {
  suspiciousConfig = { ...suspiciousConfig, ...config };
}

export function isSuspiciousUserAgent(userAgent: string | undefined): boolean {
  if (!userAgent) return true;
  const lowerUA = userAgent.toLowerCase();
  return suspiciousConfig.suspiciousUserAgents.some(pattern => 
    lowerUA.includes(pattern.toLowerCase())
  );
}

export function trackRapidRequests(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - suspiciousConfig.rapidRequestWindow;
  
  let timestamps = rapidRequestTracking.get(ip) || [];
  timestamps = timestamps.filter(t => t > windowStart);
  timestamps.push(now);
  rapidRequestTracking.set(ip, timestamps);
  
  return timestamps.length >= suspiciousConfig.rapidRequestThreshold;
}

export async function recordSuspiciousIP(ip: string, reason: string): Promise<void> {
  const count = (suspiciousIPsCount.get(ip) || 0) + 1;
  suspiciousIPsCount.set(ip, count);
  
  logger.warn('[IP_BLOCKING] Suspicious activity detected', { ip, reason, count });
  
  if (suspiciousConfig.autoEmergencyMode) {
    const totalSuspicious = suspiciousIPsCount.size;
    
    if (totalSuspicious >= suspiciousConfig.autoEmergencyThreshold) {
      const ipBlockingService = getIPBlockingService();
      const isEmergency = await ipBlockingService.isEmergencyMode();
      
      if (!isEmergency) {
        logger.warn('[IP_BLOCKING] Auto-enabling emergency mode', {
          suspiciousIPCount: totalSuspicious,
          threshold: suspiciousConfig.autoEmergencyThreshold,
        });
        await ipBlockingService.enableEmergencyMode();
      }
    }
  }
}

export function clearSuspiciousTracking(): void {
  suspiciousIPsCount.clear();
  rapidRequestTracking.clear();
}

export function getSuspiciousStats(): { totalSuspiciousIPs: number; rapidRequestIPs: number } {
  return {
    totalSuspiciousIPs: suspiciousIPsCount.size,
    rapidRequestIPs: rapidRequestTracking.size,
  };
}

// Cleanup old rapid request tracking every minute
setInterval(() => {
  const now = Date.now();
  const windowStart = now - suspiciousConfig.rapidRequestWindow * 60;
  
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

export function getIPBlockingService(config?: Partial<IPBlockingConfig>): IPBlockingService {
  if (!ipBlockingService) {
    ipBlockingService = new IPBlockingService(config);
  }
  return ipBlockingService;
}

export function resetIPBlockingService(): void {
  ipBlockingService = null;
}

export const CONSTANTS = {
  DEFAULT_CONFIG,
};

export { IPBlockingService };
