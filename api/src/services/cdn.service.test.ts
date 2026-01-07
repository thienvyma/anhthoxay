/**
 * CDN Service Tests
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 2.4, 2.6**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CDNService, resetCDNService } from './cdn.service';

describe('CDN Service', () => {
  beforeEach(() => {
    resetCDNService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should be disabled by default when no env vars set', () => {
      const service = new CDNService();
      expect(service.isEnabled()).toBe(false);
    });

    it('should be enabled when CDN_ENABLED is true', () => {
      const service = new CDNService({
        enabled: true,
        provider: 'cloudflare',
      });
      expect(service.isEnabled()).toBe(true);
    });

    it('should return safe config without API token', () => {
      const service = new CDNService({
        provider: 'cloudflare',
        domain: 'https://cdn.example.com',
        zoneId: 'zone123',
        apiToken: 'secret-token',
        enabled: true,
      });

      const config = service.getConfig();
      expect(config.provider).toBe('cloudflare');
      expect(config.domain).toBe('https://cdn.example.com');
      expect(config.zoneId).toBe('zone123');
      expect(config.apiToken).toBe('***');
    });

    it('should return undefined apiToken when not set', () => {
      const service = new CDNService({
        provider: 'cloudflare',
        enabled: true,
      });

      const config = service.getConfig();
      expect(config.apiToken).toBeUndefined();
    });
  });

  describe('Purge when disabled', () => {
    it('should skip purge when CDN is disabled', async () => {
      const service = new CDNService({ enabled: false });

      const result = await service.purge({ paths: ['/media/test.webp'] });

      expect(result.success).toBe(true);
      expect(result.message).toContain('not enabled');
      expect(result.provider).toBe('none');
      expect(result.purgedPaths).toEqual([]);
    });

    it('should skip purgeAll when CDN is disabled', async () => {
      const service = new CDNService({ enabled: false });

      const result = await service.purgeAll();

      expect(result.success).toBe(true);
      expect(result.message).toContain('not enabled');
    });

    it('should skip purgeMedia when CDN is disabled', async () => {
      const service = new CDNService({ enabled: false });

      const result = await service.purgeMedia(['/media/test.webp']);

      expect(result.success).toBe(true);
      expect(result.message).toContain('not enabled');
    });

    it('should skip purgeApi when CDN is disabled', async () => {
      const service = new CDNService({ enabled: false });

      const result = await service.purgeApi(['/api/regions']);

      expect(result.success).toBe(true);
      expect(result.message).toContain('not enabled');
    });
  });

  describe('Cloudflare purge', () => {
    it('should fail when zoneId is missing', async () => {
      const service = new CDNService({
        enabled: true,
        provider: 'cloudflare',
        apiToken: 'token',
        // zoneId missing
      });

      const result = await service.purge({ paths: ['/media/test.webp'] });

      expect(result.success).toBe(false);
      expect(result.message).toContain('not configured');
    });

    it('should fail when apiToken is missing', async () => {
      const service = new CDNService({
        enabled: true,
        provider: 'cloudflare',
        zoneId: 'zone123',
        // apiToken missing
      });

      const result = await service.purge({ paths: ['/media/test.webp'] });

      expect(result.success).toBe(false);
      expect(result.message).toContain('not configured');
    });

    it('should fail when no paths specified', async () => {
      const service = new CDNService({
        enabled: true,
        provider: 'cloudflare',
        zoneId: 'zone123',
        apiToken: 'token',
      });

      const result = await service.purge({});

      expect(result.success).toBe(false);
      expect(result.message).toContain('No paths');
    });

    it('should call Cloudflare API with correct parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, result: { id: 'purge123' } }),
      });
      global.fetch = mockFetch;

      const service = new CDNService({
        enabled: true,
        provider: 'cloudflare',
        zoneId: 'zone123',
        apiToken: 'token123',
        domain: 'https://cdn.example.com',
      });

      const result = await service.purge({ paths: ['/media/test.webp'] });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.cloudflare.com/client/v4/zones/zone123/purge_cache',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer token123',
            'Content-Type': 'application/json',
          },
        })
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.files).toContain('https://cdn.example.com/media/test.webp');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('cloudflare');
    });

    it('should handle purgeAll correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = mockFetch;

      const service = new CDNService({
        enabled: true,
        provider: 'cloudflare',
        zoneId: 'zone123',
        apiToken: 'token123',
      });

      const result = await service.purgeAll();

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.purge_everything).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should handle Cloudflare API errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
          success: false,
          errors: [{ message: 'Invalid zone' }],
        }),
      });
      global.fetch = mockFetch;

      const service = new CDNService({
        enabled: true,
        provider: 'cloudflare',
        zoneId: 'zone123',
        apiToken: 'token123',
      });

      const result = await service.purge({ paths: ['/media/test.webp'] });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid zone');
    });

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const service = new CDNService({
        enabled: true,
        provider: 'cloudflare',
        zoneId: 'zone123',
        apiToken: 'token123',
      });

      const result = await service.purge({ paths: ['/media/test.webp'] });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });

  describe('URL normalization', () => {
    it('should prepend CDN domain to relative paths', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = mockFetch;

      const service = new CDNService({
        enabled: true,
        provider: 'cloudflare',
        zoneId: 'zone123',
        apiToken: 'token123',
        domain: 'https://cdn.example.com',
      });

      await service.purge({ paths: ['/media/test.webp', 'media/other.jpg'] });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.files).toContain('https://cdn.example.com/media/test.webp');
      expect(callBody.files).toContain('https://cdn.example.com/media/other.jpg');
    });

    it('should not modify absolute URLs', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = mockFetch;

      const service = new CDNService({
        enabled: true,
        provider: 'cloudflare',
        zoneId: 'zone123',
        apiToken: 'token123',
        domain: 'https://cdn.example.com',
      });

      await service.purge({ paths: ['https://other-cdn.com/file.webp'] });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.files).toContain('https://other-cdn.com/file.webp');
    });
  });

  describe('Unsupported provider', () => {
    it('should return error for unsupported provider', async () => {
      const service = new CDNService({
        enabled: true,
        provider: 'unknown' as 'cloudflare',
      });

      const result = await service.purge({ paths: ['/media/test.webp'] });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unsupported CDN provider');
    });
  });
});
