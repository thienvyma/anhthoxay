/**
 * Configuration Hot Reload Service
 *
 * Provides hot-reloadable configuration without server restart.
 * Uses in-memory configuration (Redis removed).
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6**
 */

import { z } from 'zod';
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
  source: 'manual' | 'default';
}

export type ConfigChangeHandler<T = unknown> = (event: ConfigChangeEvent<T>) => void;

// ============================================
// Default Configuration
// ============================================

const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  global: { maxAttempts: 100, windowMs: 60000 },
  login: { maxAttempts: 5, windowMs: 60000 },
  leads: { maxAttempts: 5, windowMs: 60000 },
};

const DEFAULT_FEATURE_FLAGS: FeatureFlagsConfig = {
  enableReadReplica: false,
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

// ============================================
// Hot Reload Service Class
// ============================================

class HotReloadService {
  private currentConfig: RuntimeConfig;
  private changeHandlers: Map<string, Set<ConfigChangeHandler>> = new Map();

  constructor() {
    this.currentConfig = { ...DEFAULT_RUNTIME_CONFIG };
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    logger.info('[HOT_RELOAD] Service initialized (in-memory mode)', {
      configVersion: this.currentConfig.version,
    });
  }

  /**
   * Validate configuration against schema
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
   */
  private async applyConfig(newConfig: RuntimeConfig, source: 'manual' | 'default'): Promise<void> {
    const oldConfig = this.currentConfig;

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
   * Notify change handlers of configuration changes
   */
  private notifyChanges(oldConfig: RuntimeConfig, newConfig: RuntimeConfig, source: 'manual' | 'default'): void {
    const now = new Date();

    if (JSON.stringify(oldConfig.rateLimits) !== JSON.stringify(newConfig.rateLimits)) {
      this.notifyHandlers('rateLimits', {
        key: 'rateLimits',
        oldValue: oldConfig.rateLimits,
        newValue: newConfig.rateLimits,
        changedAt: now,
        source,
      });
    }

    if (JSON.stringify(oldConfig.featureFlags) !== JSON.stringify(newConfig.featureFlags)) {
      this.notifyHandlers('featureFlags', {
        key: 'featureFlags',
        oldValue: oldConfig.featureFlags,
        newValue: newConfig.featureFlags,
        changedAt: now,
        source,
      });
    }

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

  get<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] {
    return this.currentConfig[key];
  }

  getAll(): RuntimeConfig {
    return { ...this.currentConfig };
  }

  getRateLimits(): RateLimitConfig {
    return { ...this.currentConfig.rateLimits };
  }

  getFeatureFlags(): FeatureFlagsConfig {
    return { ...this.currentConfig.featureFlags };
  }

  getCacheTTL(): CacheTTLConfig {
    return { ...this.currentConfig.cacheTTL };
  }

  isFeatureEnabled(flag: keyof FeatureFlagsConfig): boolean {
    return this.currentConfig.featureFlags[flag];
  }

  onChange<K extends keyof RuntimeConfig>(key: K, handler: ConfigChangeHandler<RuntimeConfig[K]>): () => void {
    if (!this.changeHandlers.has(key)) {
      this.changeHandlers.set(key, new Set());
    }

    const handlers = this.changeHandlers.get(key);
    if (handlers) {
      handlers.add(handler as ConfigChangeHandler);
    }

    return () => {
      const handlersSet = this.changeHandlers.get(key);
      if (handlersSet) {
        handlersSet.delete(handler as ConfigChangeHandler);
      }
    };
  }

  async update(updates: Partial<RuntimeConfig>): Promise<{ success: true } | { success: false; errors: string[] }> {
    const newConfig: RuntimeConfig = {
      ...this.currentConfig,
      ...updates,
      version: (this.currentConfig.version || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    const validationResult = this.validateConfig(newConfig);
    if (validationResult.success === false) {
      logger.warn('[HOT_RELOAD] Invalid configuration update rejected', {
        errors: validationResult.errors,
      });
      return { success: false, errors: validationResult.errors };
    }

    await this.applyConfig(validationResult.config, 'manual');
    return { success: true };
  }

  async reset(): Promise<void> {
    const defaultConfig: RuntimeConfig = {
      ...DEFAULT_RUNTIME_CONFIG,
      version: (this.currentConfig.version || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    await this.applyConfig(defaultConfig, 'default');
    logger.info('[HOT_RELOAD] Configuration reset to defaults');
  }

  getStatus(): {
    configVersion: number | undefined;
    updatedAt: string | undefined;
  } {
    return {
      configVersion: this.currentConfig.version,
      updatedAt: this.currentConfig.updatedAt,
    };
  }

  cleanup(): void {
    this.changeHandlers.clear();
    logger.info('[HOT_RELOAD] Service cleaned up');
  }
}

// ============================================
// Singleton Instance
// ============================================

let hotReloadService: HotReloadService | null = null;

export function getHotReloadService(): HotReloadService {
  if (!hotReloadService) {
    hotReloadService = new HotReloadService();
  }
  return hotReloadService;
}

export async function initializeHotReload(): Promise<HotReloadService> {
  const service = getHotReloadService();
  await service.initialize();
  return service;
}

export function resetHotReloadService(): void {
  if (hotReloadService) {
    hotReloadService.cleanup();
  }
  hotReloadService = null;
}

// ============================================
// Convenience Functions
// ============================================

export function getRateLimitConfig(): RateLimitConfig {
  const service = getHotReloadService();
  return service.getRateLimits();
}

export function getFeatureFlags(): FeatureFlagsConfig {
  const service = getHotReloadService();
  return service.getFeatureFlags();
}

export function getCacheTTLConfig(): CacheTTLConfig {
  const service = getHotReloadService();
  return service.getCacheTTL();
}

export function isFeatureEnabled(flag: keyof FeatureFlagsConfig): boolean {
  const service = getHotReloadService();
  return service.isFeatureEnabled(flag);
}

export { HotReloadService };
