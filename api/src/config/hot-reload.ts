/**
 * Configuration Hot Reload Service
 *
 * Provides hot-reloadable configuration without server restart.
 * Polls configuration from Redis and applies changes dynamically.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6**
 */

import { z } from 'zod';
import { getRedisClient, isRedisConnected } from './redis';
import { logger } from '../utils/logger';

// ============================================
// Configuration Schemas
// ============================================

/**
 * Rate limit configuration schema
 */
export const RateLimitConfigSchema = z.object({
  global: z.object({
    maxAttempts: z.number().int().min(1).max(10000),
    windowMs: z.number().int().min(1000).max(3600000),
  }),
  login: z.object({
    maxAttempts: z.number().int().min(1).max(100),
    windowMs: z.number().int().min(1000).max(3600000),
  }),
  leads: z.object({
    maxAttempts: z.number().int().min(1).max(100),
    windowMs: z.number().int().min(1000).max(3600000),
  }),
});

/**
 * Feature flags configuration schema
 */
export const FeatureFlagsConfigSchema = z.object({
  enableReadReplica: z.boolean(),
  enableIPBlocking: z.boolean(),
  emergencyMode: z.boolean(),
  enableCDNHeaders: z.boolean(),
  enableCorrelationId: z.boolean(),
});

/**
 * Cache TTL configuration schema (in seconds)
 */
export const CacheTTLConfigSchema = z.object({
  categories: z.number().int().min(0).max(86400),
  materials: z.number().int().min(0).max(86400),
  settings: z.number().int().min(0).max(86400),
  regions: z.number().int().min(0).max(86400),
  blog: z.number().int().min(0).max(86400),
});

/**
 * Complete runtime configuration schema
 */
export const RuntimeConfigSchema = z.object({
  rateLimits: RateLimitConfigSchema,
  featureFlags: FeatureFlagsConfigSchema,
  cacheTTL: CacheTTLConfigSchema,
  version: z.number().int().min(0).optional(),
  updatedAt: z.string().datetime().optional(),
});

// ============================================
// Types
// ============================================

export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export type FeatureFlagsConfig = z.infer<typeof FeatureFlagsConfigSchema>;
export type CacheTTLConfig = z.infer<typeof CacheTTLConfigSchema>;
export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;

export interface ConfigChangeEvent<T = unknown> {
  key: string;
  oldValue: T;
  newValue: T;
  changedAt: Date;
  source: 'redis' | 'manual' | 'default';
}

export type ConfigChangeHandler<T = unknown> = (event: ConfigChangeEvent<T>) => void;

export interface HotReloadConfig {
  /** Poll interval in milliseconds (default: 30000) */
  pollInterval: number;
  /** Redis key prefix for configuration */
  redisKeyPrefix: string;
  /** Whether to log configuration changes */
  logChanges: boolean;
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  global: { maxAttempts: 100, windowMs: 60000 },
  login: { maxAttempts: 5, windowMs: 60000 },
  leads: { maxAttempts: 5, windowMs: 60000 },
};

const DEFAULT_FEATURE_FLAGS: FeatureFlagsConfig = {
  enableReadReplica: true,
  enableIPBlocking: true,
  emergencyMode: false,
  enableCDNHeaders: true,
  enableCorrelationId: true,
};

const DEFAULT_CACHE_TTL: CacheTTLConfig = {
  categories: 300,
  materials: 300,
  settings: 60,
  regions: 3600,
  blog: 300,
};

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  rateLimits: DEFAULT_RATE_LIMITS,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  cacheTTL: DEFAULT_CACHE_TTL,
  version: 0,
};

const DEFAULT_HOT_RELOAD_CONFIG: HotReloadConfig = {
  pollInterval: 30000,
  redisKeyPrefix: 'config:runtime',
  logChanges: true,
};

// ============================================
// Hot Reload Service Class
// ============================================

class HotReloadService {
  private config: HotReloadConfig;
  private currentConfig: RuntimeConfig;
  private pollInterval: NodeJS.Timeout | null = null;
  private changeHandlers: Map<string, Set<ConfigChangeHandler>> = new Map();
  private lastPollTime: Date | null = null;
  private pollErrors = 0;
  private maxPollErrors = 5;

  constructor(config: Partial<HotReloadConfig> = {}) {
    this.config = { ...DEFAULT_HOT_RELOAD_CONFIG, ...config };
    this.currentConfig = { ...DEFAULT_RUNTIME_CONFIG };
  }

  /**
   * Initialize the service and load configuration from Redis
   */
  async initialize(): Promise<void> {
    // Try to load from Redis first
    await this.loadFromRedis();
    
    logger.info('[HOT_RELOAD] Service initialized', {
      pollInterval: this.config.pollInterval,
      configVersion: this.currentConfig.version,
    });
  }

  /**
   * Start polling for configuration changes
   * 
   * **Validates: Requirements 15.2**
   */
  startPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.pollInterval = setInterval(async () => {
      try {
        await this.poll();
        this.pollErrors = 0;
      } catch (error) {
        this.pollErrors++;
        logger.error('[HOT_RELOAD] Poll failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          consecutiveErrors: this.pollErrors,
        });

        // Stop polling if too many consecutive errors
        if (this.pollErrors >= this.maxPollErrors) {
          logger.error('[HOT_RELOAD] Too many poll errors, stopping polling');
          this.stopPolling();
        }
      }
    }, this.config.pollInterval);

    logger.info('[HOT_RELOAD] Polling started', {
      intervalMs: this.config.pollInterval,
    });
  }

  /**
   * Stop polling for configuration changes
   */
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      logger.info('[HOT_RELOAD] Polling stopped');
    }
  }

  /**
   * Poll for configuration changes
   */
  private async poll(): Promise<void> {
    this.lastPollTime = new Date();
    await this.loadFromRedis();
  }

  /**
   * Load configuration from Redis
   */
  private async loadFromRedis(): Promise<void> {
    const redis = getRedisClient();
    if (!redis || !isRedisConnected()) {
      logger.debug('[HOT_RELOAD] Redis not available, using current config');
      return;
    }

    try {
      const key = this.config.redisKeyPrefix;
      const configJson = await redis.get(key);

      if (!configJson) {
        // No config in Redis, store current defaults
        await this.saveToRedis(this.currentConfig);
        return;
      }

      const parsedConfig = JSON.parse(configJson);
      
      // Validate the configuration
      const validationResult = this.validateConfig(parsedConfig);
      if (validationResult.success === false) {
        logger.warn('[HOT_RELOAD] Invalid config in Redis, keeping current', {
          errors: validationResult.errors,
        });
        return;
      }

      // Check if version changed
      if (parsedConfig.version === this.currentConfig.version) {
        return; // No changes
      }

      // Apply changes
      await this.applyConfig(validationResult.config, 'redis');
    } catch (error) {
      logger.error('[HOT_RELOAD] Failed to load from Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Save configuration to Redis
   */
  private async saveToRedis(config: RuntimeConfig): Promise<void> {
    const redis = getRedisClient();
    if (!redis || !isRedisConnected()) {
      return;
    }

    try {
      const key = this.config.redisKeyPrefix;
      await redis.set(key, JSON.stringify(config));
    } catch (error) {
      logger.error('[HOT_RELOAD] Failed to save to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate configuration against schema
   * 
   * **Validates: Requirements 15.4, 15.5**
   */
  validateConfig(config: unknown): { success: true; config: RuntimeConfig } | { success: false; errors: string[] } {
    const result = RuntimeConfigSchema.safeParse(config);
    
    if (!result.success) {
      const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, errors };
    }

    return { success: true, config: result.data };
  }

  /**
   * Apply new configuration
   * 
   * **Validates: Requirements 15.1, 15.3, 15.6**
   */
  private async applyConfig(newConfig: RuntimeConfig, source: 'redis' | 'manual' | 'default'): Promise<void> {
    const oldConfig = this.currentConfig;

    // Log changes if enabled
    if (this.config.logChanges) {
      this.logConfigChanges(oldConfig, newConfig, source);
    }

    // Notify handlers of specific changes
    this.notifyChanges(oldConfig, newConfig, source);

    // Update current config
    this.currentConfig = {
      ...newConfig,
      updatedAt: new Date().toISOString(),
    };

    logger.info('[HOT_RELOAD] Configuration applied', {
      source,
      oldVersion: oldConfig.version,
      newVersion: newConfig.version,
    });
  }

  /**
   * Log configuration changes with old and new values
   * 
   * **Validates: Requirements 15.6**
   */
  private logConfigChanges(oldConfig: RuntimeConfig, newConfig: RuntimeConfig, source: string): void {
    const changes: Array<{ path: string; oldValue: unknown; newValue: unknown }> = [];

    // Compare rate limits
    this.compareObjects(oldConfig.rateLimits, newConfig.rateLimits, 'rateLimits', changes);
    
    // Compare feature flags
    this.compareObjects(oldConfig.featureFlags, newConfig.featureFlags, 'featureFlags', changes);
    
    // Compare cache TTL
    this.compareObjects(oldConfig.cacheTTL, newConfig.cacheTTL, 'cacheTTL', changes);

    if (changes.length > 0) {
      logger.info('[HOT_RELOAD] Configuration changes detected', {
        source,
        changeCount: changes.length,
        changes: changes.map(c => ({
          path: c.path,
          old: c.oldValue,
          new: c.newValue,
        })),
      });
    }
  }

  /**
   * Compare two objects and record differences
   */
  private compareObjects(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    prefix: string,
    changes: Array<{ path: string; oldValue: unknown; newValue: unknown }>
  ): void {
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const oldValue = oldObj[key];
      const newValue = newObj[key];
      const path = `${prefix}.${key}`;

      if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
        this.compareObjects(
          oldValue as Record<string, unknown>,
          newValue as Record<string, unknown>,
          path,
          changes
        );
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ path, oldValue, newValue });
      }
    }
  }

  /**
   * Notify change handlers of configuration changes
   */
  private notifyChanges(oldConfig: RuntimeConfig, newConfig: RuntimeConfig, source: 'redis' | 'manual' | 'default'): void {
    const now = new Date();

    // Notify rate limit changes
    if (JSON.stringify(oldConfig.rateLimits) !== JSON.stringify(newConfig.rateLimits)) {
      this.notifyHandlers('rateLimits', {
        key: 'rateLimits',
        oldValue: oldConfig.rateLimits,
        newValue: newConfig.rateLimits,
        changedAt: now,
        source,
      });
    }

    // Notify feature flag changes
    if (JSON.stringify(oldConfig.featureFlags) !== JSON.stringify(newConfig.featureFlags)) {
      this.notifyHandlers('featureFlags', {
        key: 'featureFlags',
        oldValue: oldConfig.featureFlags,
        newValue: newConfig.featureFlags,
        changedAt: now,
        source,
      });
    }

    // Notify cache TTL changes
    if (JSON.stringify(oldConfig.cacheTTL) !== JSON.stringify(newConfig.cacheTTL)) {
      this.notifyHandlers('cacheTTL', {
        key: 'cacheTTL',
        oldValue: oldConfig.cacheTTL,
        newValue: newConfig.cacheTTL,
        changedAt: now,
        source,
      });
    }
  }

  /**
   * Notify handlers for a specific key
   */
  private notifyHandlers(key: string, event: ConfigChangeEvent): void {
    const handlers = this.changeHandlers.get(key);
    if (!handlers || handlers.size === 0) return;

    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        logger.error('[HOT_RELOAD] Change handler error', {
          key,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Get current configuration value
   */
  get<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] {
    return this.currentConfig[key];
  }

  /**
   * Get the full runtime configuration
   */
  getAll(): RuntimeConfig {
    return { ...this.currentConfig };
  }

  /**
   * Get rate limit configuration
   * 
   * **Validates: Requirements 15.1**
   */
  getRateLimits(): RateLimitConfig {
    return { ...this.currentConfig.rateLimits };
  }

  /**
   * Get feature flags configuration
   * 
   * **Validates: Requirements 15.2**
   */
  getFeatureFlags(): FeatureFlagsConfig {
    return { ...this.currentConfig.featureFlags };
  }

  /**
   * Get cache TTL configuration
   * 
   * **Validates: Requirements 15.3**
   */
  getCacheTTL(): CacheTTLConfig {
    return { ...this.currentConfig.cacheTTL };
  }

  /**
   * Check if a feature flag is enabled
   */
  isFeatureEnabled(flag: keyof FeatureFlagsConfig): boolean {
    return this.currentConfig.featureFlags[flag];
  }

  /**
   * Subscribe to configuration changes
   */
  onChange<K extends keyof RuntimeConfig>(key: K, handler: ConfigChangeHandler<RuntimeConfig[K]>): () => void {
    if (!this.changeHandlers.has(key)) {
      this.changeHandlers.set(key, new Set());
    }

    const handlers = this.changeHandlers.get(key);
    if (handlers) {
      handlers.add(handler as ConfigChangeHandler);
    }

    // Return unsubscribe function
    return () => {
      const handlersSet = this.changeHandlers.get(key);
      if (handlersSet) {
        handlersSet.delete(handler as ConfigChangeHandler);
      }
    };
  }

  /**
   * Manually update configuration
   * 
   * **Validates: Requirements 15.4, 15.5**
   */
  async update(updates: Partial<RuntimeConfig>): Promise<{ success: true } | { success: false; errors: string[] }> {
    const newConfig: RuntimeConfig = {
      ...this.currentConfig,
      ...updates,
      version: (this.currentConfig.version || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    // Validate the new configuration
    const validationResult = this.validateConfig(newConfig);
    if (validationResult.success === false) {
      logger.warn('[HOT_RELOAD] Invalid configuration update rejected', {
        errors: validationResult.errors,
      });
      return { success: false, errors: validationResult.errors };
    }

    // Apply the configuration
    await this.applyConfig(validationResult.config, 'manual');

    // Save to Redis
    await this.saveToRedis(this.currentConfig);

    return { success: true };
  }

  /**
   * Trigger manual reload from Redis
   */
  async reload(): Promise<void> {
    logger.info('[HOT_RELOAD] Manual reload triggered');
    await this.loadFromRedis();
  }

  /**
   * Reset configuration to defaults
   */
  async reset(): Promise<void> {
    const defaultConfig: RuntimeConfig = {
      ...DEFAULT_RUNTIME_CONFIG,
      version: (this.currentConfig.version || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    await this.applyConfig(defaultConfig, 'default');
    await this.saveToRedis(this.currentConfig);

    logger.info('[HOT_RELOAD] Configuration reset to defaults');
  }

  /**
   * Get service status
   */
  getStatus(): {
    isPolling: boolean;
    lastPollTime: Date | null;
    pollErrors: number;
    configVersion: number | undefined;
    updatedAt: string | undefined;
  } {
    return {
      isPolling: this.pollInterval !== null,
      lastPollTime: this.lastPollTime,
      pollErrors: this.pollErrors,
      configVersion: this.currentConfig.version,
      updatedAt: this.currentConfig.updatedAt,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopPolling();
    this.changeHandlers.clear();
    logger.info('[HOT_RELOAD] Service cleaned up');
  }
}

// ============================================
// Singleton Instance
// ============================================

let hotReloadService: HotReloadService | null = null;

/**
 * Get or create the hot reload service singleton
 */
export function getHotReloadService(config?: Partial<HotReloadConfig>): HotReloadService {
  if (!hotReloadService) {
    hotReloadService = new HotReloadService(config);
  }
  return hotReloadService;
}

/**
 * Initialize and start the hot reload service
 */
export async function initializeHotReload(config?: Partial<HotReloadConfig>): Promise<HotReloadService> {
  const service = getHotReloadService(config);
  await service.initialize();
  service.startPolling();
  return service;
}

/**
 * Reset the hot reload service (for testing)
 */
export function resetHotReloadService(): void {
  if (hotReloadService) {
    hotReloadService.cleanup();
  }
  hotReloadService = null;
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Get current rate limit configuration
 * Convenience function for use in middleware
 */
export function getRateLimitConfig(): RateLimitConfig {
  const service = getHotReloadService();
  return service.getRateLimits();
}

/**
 * Get current feature flags
 * Convenience function for use in middleware
 */
export function getFeatureFlags(): FeatureFlagsConfig {
  const service = getHotReloadService();
  return service.getFeatureFlags();
}

/**
 * Get current cache TTL configuration
 * Convenience function for use in services
 */
export function getCacheTTLConfig(): CacheTTLConfig {
  const service = getHotReloadService();
  return service.getCacheTTL();
}

/**
 * Check if a feature is enabled
 * Convenience function for use anywhere
 */
export function isFeatureEnabled(flag: keyof FeatureFlagsConfig): boolean {
  const service = getHotReloadService();
  return service.isFeatureEnabled(flag);
}

export { HotReloadService };
