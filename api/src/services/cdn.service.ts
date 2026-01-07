/**
 * CDN Service
 *
 * Handles CDN cache invalidation/purge operations.
 * Supports Cloudflare CDN API for cache purging.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 2.4, 2.6**
 */

import { logger } from '../utils/logger';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CDNConfig {
  /** CDN provider (currently only cloudflare supported) */
  provider: 'cloudflare' | 'none';
  /** CDN domain for asset URLs */
  domain?: string;
  /** Cloudflare Zone ID */
  zoneId?: string;
  /** Cloudflare API Token with cache purge permissions */
  apiToken?: string;
  /** Whether CDN is enabled */
  enabled: boolean;
}

export interface PurgeResult {
  success: boolean;
  purgedPaths: string[];
  failedPaths: string[];
  message?: string;
  provider: string;
}

export interface PurgeOptions {
  /** Specific paths to purge */
  paths?: string[];
  /** Purge all cached content (use with caution) */
  purgeAll?: boolean;
  /** Purge by cache tags (Cloudflare Enterprise) */
  tags?: string[];
  /** Purge by prefix (Cloudflare Enterprise) */
  prefixes?: string[];
}

// ============================================
// CDN SERVICE
// ============================================

/**
 * CDN Service for cache management
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 2.4, 2.6**
 */
export class CDNService {
  private config: CDNConfig;

  constructor(config?: Partial<CDNConfig>) {
    this.config = {
      provider: (process.env.CDN_PROVIDER as 'cloudflare' | 'none') || 'none',
      domain: process.env.CDN_DOMAIN,
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      enabled: process.env.CDN_ENABLED === 'true',
      ...config,
    };
  }

  /**
   * Check if CDN is configured and enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && this.config.provider !== 'none';
  }

  /**
   * Get CDN configuration (without sensitive data)
   */
  getConfig(): Omit<CDNConfig, 'apiToken'> & { apiToken?: string } {
    const { apiToken, ...safeConfig } = this.config;
    return {
      ...safeConfig,
      apiToken: apiToken ? '***' : undefined,
    };
  }

  /**
   * Purge specific paths from CDN cache
   *
   * **Requirements: 2.4**
   *
   * @param options - Purge options
   * @returns Purge result
   */
  async purge(options: PurgeOptions): Promise<PurgeResult> {
    if (!this.isEnabled()) {
      return {
        success: true,
        purgedPaths: [],
        failedPaths: [],
        message: 'CDN not enabled, skipping purge',
        provider: 'none',
      };
    }

    switch (this.config.provider) {
      case 'cloudflare':
        return this.purgeCloudflare(options);
      default:
        return {
          success: false,
          purgedPaths: [],
          failedPaths: options.paths || [],
          message: `Unsupported CDN provider: ${this.config.provider}`,
          provider: this.config.provider,
        };
    }
  }

  /**
   * Purge all CDN cache (use with caution)
   *
   * @returns Purge result
   */
  async purgeAll(): Promise<PurgeResult> {
    return this.purge({ purgeAll: true });
  }

  /**
   * Purge media files by URLs
   *
   * @param urls - Array of media URLs to purge
   * @returns Purge result
   */
  async purgeMedia(urls: string[]): Promise<PurgeResult> {
    const paths = urls.map((url) => this.normalizeUrl(url));
    return this.purge({ paths });
  }

  /**
   * Purge API cache by paths
   *
   * @param apiPaths - Array of API paths to purge (e.g., ['/api/regions', '/api/settings'])
   * @returns Purge result
   */
  async purgeApi(apiPaths: string[]): Promise<PurgeResult> {
    const paths = apiPaths.map((p) => this.normalizeUrl(p));
    return this.purge({ paths });
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Normalize URL to full CDN URL
   */
  private normalizeUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const domain = this.config.domain || '';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${domain}${normalizedPath}`;
  }

  /**
   * Purge cache using Cloudflare API
   *
   * @see https://developers.cloudflare.com/api/operations/zone-purge
   */
  private async purgeCloudflare(options: PurgeOptions): Promise<PurgeResult> {
    const { zoneId, apiToken } = this.config;

    if (!zoneId || !apiToken) {
      logger.warn('Cloudflare CDN not configured: missing zoneId or apiToken');
      return {
        success: false,
        purgedPaths: [],
        failedPaths: options.paths || [],
        message: 'Cloudflare CDN not configured',
        provider: 'cloudflare',
      };
    }

    try {
      const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;

      // Build request body based on options
      let body: Record<string, unknown>;
      if (options.purgeAll) {
        body = { purge_everything: true };
      } else if (options.tags && options.tags.length > 0) {
        body = { tags: options.tags };
      } else if (options.prefixes && options.prefixes.length > 0) {
        body = { prefixes: options.prefixes };
      } else if (options.paths && options.paths.length > 0) {
        // Cloudflare requires full URLs for file purge
        const files = options.paths.map((p) => this.normalizeUrl(p));
        body = { files };
      } else {
        return {
          success: false,
          purgedPaths: [],
          failedPaths: [],
          message: 'No paths, tags, or prefixes specified for purge',
          provider: 'cloudflare',
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json() as {
        success: boolean;
        errors?: Array<{ message: string }>;
        result?: { id: string };
      };

      if (result.success) {
        logger.info('CDN cache purged successfully', {
          provider: 'cloudflare',
          purgeAll: options.purgeAll,
          pathCount: options.paths?.length || 0,
        });

        return {
          success: true,
          purgedPaths: options.paths || (options.purgeAll ? ['*'] : []),
          failedPaths: [],
          message: 'Cache purged successfully',
          provider: 'cloudflare',
        };
      } else {
        const errorMessage = result.errors?.map((e) => e.message).join(', ') || 'Unknown error';
        logger.error('CDN cache purge failed', {
          provider: 'cloudflare',
          error: errorMessage,
        });

        return {
          success: false,
          purgedPaths: [],
          failedPaths: options.paths || [],
          message: errorMessage,
          provider: 'cloudflare',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('CDN cache purge error', {
        provider: 'cloudflare',
        error: errorMessage,
      });

      return {
        success: false,
        purgedPaths: [],
        failedPaths: options.paths || [],
        message: errorMessage,
        provider: 'cloudflare',
      };
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let cdnServiceInstance: CDNService | null = null;

/**
 * Get CDN service singleton instance
 */
export function getCDNService(): CDNService {
  if (!cdnServiceInstance) {
    cdnServiceInstance = new CDNService();
  }
  return cdnServiceInstance;
}

/**
 * Reset CDN service instance (for testing)
 */
export function resetCDNService(): void {
  cdnServiceInstance = null;
}

export default { CDNService, getCDNService, resetCDNService };
