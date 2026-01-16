/**
 * Emergency Mode Service
 *
 * Coordinates emergency mode features for DDoS mitigation and attack response.
 * Uses in-memory storage.
 */

import { getIPBlockingService } from './ip-blocking.service';
import { updateEmergencyConfig } from '../middleware/emergency-rate-limiter';
import { logger } from '../utils/logger';

// ============================================
// CAPTCHA Challenge Rate Configuration
// ============================================

export interface CaptchaChallengeConfig {
  baseChallengeRate: number;
  emergencyChallengeRate: number;
  suspiciousChallengeRate: number;
  alwaysRequireInEmergency: boolean;
  alwaysRequirePaths: string[];
  neverRequirePaths: string[];
}

const DEFAULT_CAPTCHA_CONFIG: CaptchaChallengeConfig = {
  baseChallengeRate: 0.0,
  emergencyChallengeRate: 1.0,
  suspiciousChallengeRate: 0.8,
  alwaysRequireInEmergency: true,
  alwaysRequirePaths: ['/api/auth/login', '/api/auth/signup', '/api/leads'],
  neverRequirePaths: ['/health', '/health/live', '/health/ready', '/metrics'],
};

let captchaChallengeConfig: CaptchaChallengeConfig = { ...DEFAULT_CAPTCHA_CONFIG };
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
  rateLimitMultiplier: number;
  windowMultiplier: number;
  requireCaptcha: boolean;
  autoExpireDuration: number;
  autoActivationThreshold: number;
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

const DEFAULT_CONFIG: EmergencyModeConfig = {
  rateLimitMultiplier: 0.5,
  windowMultiplier: 2,
  requireCaptcha: true,
  autoExpireDuration: 60 * 60 * 1000,
  autoActivationThreshold: 20,
  violationsPerMinuteThreshold: 100,
};

// In-memory storage
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

  async getStatus(): Promise<EmergencyModeStatus> {
    return { ...inMemoryStatus };
  }

  async activate(options: {
    reason: string;
    activatedBy?: string;
    duration?: number;
    autoActivated?: boolean;
  }): Promise<void> {
    const { reason, activatedBy, duration, autoActivated = false } = options;
    const now = Date.now();
    const expiresAt = now + (duration || this.config.autoExpireDuration);

    inMemoryStatus = {
      isActive: true,
      activatedAt: new Date(now),
      activatedBy,
      reason,
      autoActivated,
      expiresAt: new Date(expiresAt),
    };

    const ipBlockingService = getIPBlockingService();
    await ipBlockingService.enableEmergencyMode();

    updateEmergencyConfig({
      rateLimitMultiplier: this.config.rateLimitMultiplier,
      windowMultiplier: this.config.windowMultiplier,
      requireCaptcha: this.config.requireCaptcha,
    });

    logger.warn('[EMERGENCY_MODE] Emergency mode ACTIVATED', {
      reason,
      activatedBy,
      autoActivated,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  }

  async deactivate(deactivatedBy?: string): Promise<void> {
    inMemoryStatus = { isActive: false, autoActivated: false };

    const ipBlockingService = getIPBlockingService();
    await ipBlockingService.disableEmergencyMode();

    logger.info('[EMERGENCY_MODE] Emergency mode DEACTIVATED', { deactivatedBy });
  }

  async recordViolation(): Promise<void> {
    const now = Date.now();
    const minuteAgo = now - 60 * 1000;
    const hourAgo = now - 60 * 60 * 1000;

    inMemoryViolationsMinute = inMemoryViolationsMinute.filter(t => t > minuteAgo);
    inMemoryViolationsMinute.push(now);

    inMemoryViolationsHour = inMemoryViolationsHour.filter(t => t > hourAgo);
    inMemoryViolationsHour.push(now);

    await this.checkAutoActivation();
  }

  async getMetrics(): Promise<AttackMetrics> {
    const ipBlockingService = getIPBlockingService();
    const blockedIPs = await ipBlockingService.getBlockedIPs();

    return {
      blockedIPsCount: blockedIPs.length,
      violationsLastMinute: inMemoryViolationsMinute.length,
      violationsLastHour: inMemoryViolationsHour.length,
      suspiciousRequestsCount: blockedIPs.filter(ip => ip.isEmergencyBlock).length,
      emergencyBlocksCount: blockedIPs.filter(ip => ip.isEmergencyBlock).length,
    };
  }

  private async checkAutoActivation(): Promise<void> {
    const status = await this.getStatus();
    if (status.isActive) return;

    const metrics = await this.getMetrics();

    if (metrics.blockedIPsCount >= this.config.autoActivationThreshold) {
      await this.activate({
        reason: `Auto-activated: ${metrics.blockedIPsCount} IPs blocked`,
        autoActivated: true,
      });
      return;
    }

    if (metrics.violationsLastMinute >= this.config.violationsPerMinuteThreshold) {
      await this.activate({
        reason: `Auto-activated: ${metrics.violationsLastMinute} violations/min`,
        autoActivated: true,
      });
    }
  }

  startPeriodicCheck(intervalMs = 30000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        const status = await this.getStatus();

        if (status.isActive && status.expiresAt && status.expiresAt <= new Date()) {
          await this.deactivate();
          return;
        }

        if (!status.isActive) {
          await this.checkAutoActivation();
        }
      } catch (error) {
        logger.error('[EMERGENCY_MODE] Periodic check failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, intervalMs);
  }

  stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getConfig(): EmergencyModeConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<EmergencyModeConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (inMemoryStatus.isActive) {
      updateEmergencyConfig({
        rateLimitMultiplier: this.config.rateLimitMultiplier,
        windowMultiplier: this.config.windowMultiplier,
        requireCaptcha: this.config.requireCaptcha,
      });
    }
  }

  async clearMetrics(): Promise<void> {
    inMemoryViolationsMinute = [];
    inMemoryViolationsHour = [];
  }
}

// ============================================
// Singleton Instance
// ============================================

let emergencyModeService: EmergencyModeService | null = null;

export function getEmergencyModeService(config?: Partial<EmergencyModeConfig>): EmergencyModeService {
  if (!emergencyModeService) {
    emergencyModeService = new EmergencyModeService(config);
  }
  return emergencyModeService;
}

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

export function getCaptchaChallengeConfig(): CaptchaChallengeConfig {
  return { ...captchaChallengeConfig };
}

export function updateCaptchaChallengeConfig(config: Partial<CaptchaChallengeConfig>): void {
  captchaChallengeConfig = { ...captchaChallengeConfig, ...config };
}

export function resetCaptchaChallengeConfig(): void {
  captchaChallengeConfig = { ...DEFAULT_CAPTCHA_CONFIG };
}

export function recordSuspiciousIPForCaptcha(ip: string): void {
  const now = Date.now();
  const existing = suspiciousIPsForCaptcha.get(ip);
  
  if (existing) {
    existing.count++;
    existing.lastSeen = now;
  } else {
    suspiciousIPsForCaptcha.set(ip, { count: 1, lastSeen: now });
  }
}

export function isSuspiciousIPForCaptcha(ip: string): boolean {
  const entry = suspiciousIPsForCaptcha.get(ip);
  if (!entry) return false;
  
  if (Date.now() - entry.lastSeen > 30 * 60 * 1000) {
    suspiciousIPsForCaptcha.delete(ip);
    return false;
  }
  
  return entry.count >= 3;
}

export async function shouldRequireCaptcha(
  ip: string,
  path: string,
  isSuspicious = false
): Promise<{ required: boolean; reason: string }> {
  if (captchaChallengeConfig.neverRequirePaths.some(p => path.startsWith(p))) {
    return { required: false, reason: 'path_excluded' };
  }
  
  const isAlwaysRequirePath = captchaChallengeConfig.alwaysRequirePaths.some(p => path.startsWith(p));
  
  let isEmergency = false;
  try {
    const service = getEmergencyModeService();
    const status = await service.getStatus();
    isEmergency = status.isActive;
  } catch {
    // Ignore errors
  }
  
  if (isEmergency && captchaChallengeConfig.alwaysRequireInEmergency) {
    return { required: true, reason: 'emergency_mode' };
  }
  
  if (isEmergency) {
    const shouldChallenge = Math.random() < captchaChallengeConfig.emergencyChallengeRate;
    if (shouldChallenge) {
      return { required: true, reason: 'emergency_challenge_rate' };
    }
  }
  
  const isSuspiciousIP = isSuspicious || isSuspiciousIPForCaptcha(ip);
  if (isSuspiciousIP) {
    const shouldChallenge = Math.random() < captchaChallengeConfig.suspiciousChallengeRate;
    if (shouldChallenge) {
      return { required: true, reason: 'suspicious_ip' };
    }
  }
  
  if (isAlwaysRequirePath) {
    return { required: true, reason: 'always_require_path' };
  }
  
  if (captchaChallengeConfig.baseChallengeRate > 0) {
    const shouldChallenge = Math.random() < captchaChallengeConfig.baseChallengeRate;
    if (shouldChallenge) {
      return { required: true, reason: 'base_challenge_rate' };
    }
  }
  
  return { required: false, reason: 'not_required' };
}

export function clearSuspiciousIPsForCaptcha(): void {
  suspiciousIPsForCaptcha.clear();
}

export function getSuspiciousIPCountForCaptcha(): number {
  return suspiciousIPsForCaptcha.size;
}

// Cleanup old suspicious IP entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const expireTime = 30 * 60 * 1000;
  
  for (const [ip, entry] of suspiciousIPsForCaptcha.entries()) {
    if (now - entry.lastSeen > expireTime) {
      suspiciousIPsForCaptcha.delete(ip);
    }
  }
}, 5 * 60 * 1000);
