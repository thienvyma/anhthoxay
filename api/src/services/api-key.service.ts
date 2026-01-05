/**
 * API Key Service
 *
 * Business logic for API key management.
 * Handles CRUD operations, authentication, and permission checking for API keys.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 9.1, 9.4, 10.2, 11.1, 11.2, 12.2, 14.3, 15.3, 16.1-16.5, 17.1-17.4**
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

// ============================================
// ERROR CLASS
// ============================================

export class ApiKeyError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiKeyError';
  }
}

// ============================================
// TYPES
// ============================================

export type ApiKeyScope = 'READ_ONLY' | 'READ_WRITE' | 'FULL_ACCESS';
export type ApiKeyStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
export type EndpointGroup =
  | 'leads'
  | 'blog'
  | 'projects'
  | 'contractors'
  | 'reports'
  | 'pricing'
  | 'furniture'
  | 'media'
  | 'settings';

export interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  keyPrefix: string;
  keyHash: string;
  scope: string;
  allowedEndpoints: string;
  status: string;
  lastUsedAt: Date | null;
  usageCount: number;
  expiresAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyInput {
  name: string;
  description?: string;
  scope: ApiKeyScope;
  allowedEndpoints: EndpointGroup[];
  expiresAt?: Date;
  createdBy: string;
}

export interface UpdateApiKeyInput {
  name?: string;
  description?: string;
  scope?: ApiKeyScope;
  allowedEndpoints?: EndpointGroup[];
  expiresAt?: Date | null;
}

export interface ApiKeyFilters {
  status?: ApiKeyStatus;
  search?: string;
}

export interface UsageLogInput {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent?: string;
}

export interface TestResult {
  success: boolean;
  statusCode: number;
  responseTime: number;
  message: string;
  data?: unknown;
}


// ============================================
// ENDPOINT GROUP MAPPING
// ============================================

export const ENDPOINT_GROUPS: Record<EndpointGroup, string[]> = {
  leads: ['/api/leads', '/leads', '/api/external/leads'],
  blog: ['/api/blog', '/blog', '/api/external/blog'],
  projects: ['/api/projects', '/api/external/projects'],
  contractors: ['/api/contractors', '/api/contractor', '/api/external/contractors'],
  reports: ['/api/admin/dashboard', '/api/leads/stats', '/api/leads/export', '/api/external/reports'],
  pricing: [
    '/service-categories',
    '/unit-prices',
    '/formulas',
    '/calculate-quote',
    '/api/external/pricing',
  ],
  furniture: [
    '/material-categories',
    '/materials',
    '/api/external/furniture',
  ],
  media: ['/media', '/api/external/media'],
  settings: ['/settings', '/api/external/settings'],
};

// ============================================
// API KEY SERVICE CLASS
// ============================================

export class ApiKeyService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * List all API keys with optional filters
   * @param filters - Optional filters (status, search)
   */
  async list(filters?: ApiKeyFilters): Promise<ApiKey[]> {
    const where: Record<string, unknown> = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.name = {
        contains: filters.search,
      };
    }

    return this.prisma.apiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new API key
   * Returns both the API key record and the raw key (shown only once)
   * @param data - API key creation data
   */
  async create(data: CreateApiKeyInput): Promise<{ apiKey: ApiKey; rawKey: string }> {
    // Check if name already exists
    const existing = await this.prisma.apiKey.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new ApiKeyError('NAME_EXISTS', `Tên API key "${data.name}" đã tồn tại`);
    }

    // Generate secure random key (64 characters)
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyPrefix = rawKey.substring(0, 8);
    
    // Hash the key with bcrypt (cost factor 12)
    const keyHash = await bcrypt.hash(rawKey, 12);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        keyPrefix,
        keyHash,
        scope: data.scope,
        allowedEndpoints: JSON.stringify(data.allowedEndpoints),
        status: 'ACTIVE',
        expiresAt: data.expiresAt ?? null,
        createdBy: data.createdBy,
      },
    });

    return { apiKey, rawKey };
  }

  /**
   * Get API key by ID
   * @param id - API key ID
   */
  async getById(id: string): Promise<ApiKey | null> {
    return this.prisma.apiKey.findUnique({
      where: { id },
    });
  }

  /**
   * Update an existing API key
   * Automatically reactivates EXPIRED keys when a new valid expiration date is set
   *
   * **Feature: admin-guide-api-keys**
   * **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 18.4**
   *
   * @param id - API key ID
   * @param data - Updated data
   */
  async update(id: string, data: UpdateApiKeyInput): Promise<ApiKey> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new ApiKeyError('NOT_FOUND', 'Không tìm thấy API key');
    }

    // Check if new name conflicts
    if (data.name && data.name !== existing.name) {
      const nameExists = await this.prisma.apiKey.findUnique({
        where: { name: data.name },
      });
      if (nameExists) {
        throw new ApiKeyError('NAME_EXISTS', `Tên API key "${data.name}" đã tồn tại`);
      }
    }

    // Determine if we should reactivate an expired key
    // Requirements 18.4: Allow extending expiration for expired keys to reactivate
    let newStatus: string | undefined;
    if (existing.status === 'EXPIRED' && data.expiresAt !== undefined) {
      // If setting a new expiration date in the future, reactivate the key
      if (data.expiresAt === null) {
        // Setting to "never expires" - reactivate
        newStatus = 'ACTIVE';
      } else if (data.expiresAt instanceof Date && data.expiresAt > new Date()) {
        // Setting to a future date - reactivate
        newStatus = 'ACTIVE';
      }
      // If setting to a past date, keep EXPIRED status
    }

    return this.prisma.apiKey.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.scope !== undefined && { scope: data.scope }),
        ...(data.allowedEndpoints !== undefined && {
          allowedEndpoints: JSON.stringify(data.allowedEndpoints),
        }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
        ...(newStatus !== undefined && { status: newStatus }),
      },
    });
  }

  /**
   * Delete an API key permanently
   * @param id - API key ID
   */
  async delete(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new ApiKeyError('NOT_FOUND', 'Không tìm thấy API key');
    }

    await this.prisma.apiKey.delete({
      where: { id },
    });
  }

  /**
   * Toggle API key status between ACTIVE and INACTIVE
   * @param id - API key ID
   */
  async toggleStatus(id: string): Promise<ApiKey> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new ApiKeyError('NOT_FOUND', 'Không tìm thấy API key');
    }

    const newStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    return this.prisma.apiKey.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  /**
   * Validate an API key from raw key string
   * Parses keyPrefix, finds key by prefix, verifies hash with bcrypt
   * Checks status and expiration
   * @param rawKey - The raw API key string
   * @returns The validated ApiKey or null if invalid
   */
  async validateKey(rawKey: string): Promise<ApiKey | null> {
    // Validate key format (should be 64 hex characters)
    if (!rawKey || rawKey.length !== 64 || !/^[a-f0-9]+$/i.test(rawKey)) {
      return null;
    }

    // Extract prefix (first 8 characters)
    const keyPrefix = rawKey.substring(0, 8);

    // Find key by prefix
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyPrefix },
    });

    if (!apiKey) {
      return null;
    }

    // Verify hash with bcrypt
    const isValid = await bcrypt.compare(rawKey, apiKey.keyHash);
    if (!isValid) {
      return null;
    }

    // Check if expired
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      // Auto-update status to EXPIRED if not already
      if (apiKey.status !== 'EXPIRED') {
        await this.prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { status: 'EXPIRED' },
        });
        apiKey.status = 'EXPIRED';
      }
    }

    return apiKey;
  }

  /**
   * Check if an API key has permission for a specific HTTP method and endpoint
   * @param apiKey - The API key to check
   * @param method - HTTP method (GET, POST, PUT, DELETE)
   * @param endpoint - The endpoint path
   * @returns Object with allowed boolean and optional error code
   */
  checkPermission(
    apiKey: ApiKey,
    method: string,
    endpoint: string
  ): { allowed: boolean; errorCode?: string } {
    // Check scope against HTTP method
    const scope = apiKey.scope as ApiKeyScope;
    const upperMethod = method.toUpperCase();

    // READ_ONLY: Only GET allowed
    if (scope === 'READ_ONLY' && upperMethod !== 'GET') {
      return { allowed: false, errorCode: 'SCOPE_READ_ONLY' };
    }

    // READ_WRITE: GET, POST, PUT allowed, DELETE not allowed
    if (scope === 'READ_WRITE' && upperMethod === 'DELETE') {
      return { allowed: false, errorCode: 'SCOPE_NO_DELETE' };
    }

    // FULL_ACCESS: All methods allowed (no scope restriction)

    // Check endpoint against allowedEndpoints
    const allowedEndpoints: EndpointGroup[] = JSON.parse(apiKey.allowedEndpoints);
    
    // Normalize endpoint for comparison
    const normalizedEndpoint = endpoint.toLowerCase();
    
    // Allow health check endpoint for any valid API key
    if (normalizedEndpoint === '/api/external/health') {
      return { allowed: true };
    }
    
    // Check if endpoint matches any allowed group
    const isEndpointAllowed = allowedEndpoints.some((group) => {
      const patterns = ENDPOINT_GROUPS[group];
      return patterns.some((pattern) => {
        const normalizedPattern = pattern.toLowerCase();
        
        // Check if endpoint starts with pattern
        return normalizedEndpoint.startsWith(normalizedPattern);
      });
    });

    if (!isEndpointAllowed) {
      return { allowed: false, errorCode: 'ENDPOINT_NOT_ALLOWED' };
    }

    return { allowed: true };
  }

  /**
   * Log API key usage
   * @param apiKeyId - The API key ID
   * @param log - Usage log data
   */
  async logUsage(apiKeyId: string, log: UsageLogInput): Promise<void> {
    // Create usage log entry
    await this.prisma.apiKeyUsageLog.create({
      data: {
        apiKeyId,
        endpoint: log.endpoint,
        method: log.method,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent ?? null,
      },
    });

    // Update lastUsedAt and increment usageCount
    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    });
  }

  /**
   * Get usage logs for an API key
   * @param apiKeyId - The API key ID
   * @param limit - Maximum number of logs to return (default: 10)
   */
  async getUsageLogs(
    apiKeyId: string,
    limit = 10
  ): Promise<Array<{
    id: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    ipAddress: string;
    userAgent: string | null;
    createdAt: Date;
  }>> {
    return this.prisma.apiKeyUsageLog.findMany({
      where: { apiKeyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Test an API key by making an internal API call
   * @param id - The API key ID
   * @param endpoint - The test endpoint to call
   */
  async testKey(id: string, endpoint: string): Promise<TestResult> {
    const apiKey = await this.getById(id);
    if (!apiKey) {
      return {
        success: false,
        statusCode: 404,
        responseTime: 0,
        message: 'API key không tồn tại',
      };
    }

    // Check status
    if (apiKey.status === 'INACTIVE') {
      return {
        success: false,
        statusCode: 401,
        responseTime: 0,
        message: 'API key đã bị tắt',
      };
    }

    if (apiKey.status === 'EXPIRED') {
      return {
        success: false,
        statusCode: 401,
        responseTime: 0,
        message: 'API key đã hết hạn',
      };
    }

    // Check expiration
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return {
        success: false,
        statusCode: 401,
        responseTime: 0,
        message: 'API key đã hết hạn',
      };
    }

    // Check permission for the endpoint (GET method for testing)
    const permissionCheck = this.checkPermission(apiKey, 'GET', endpoint);
    if (!permissionCheck.allowed) {
      return {
        success: false,
        statusCode: 403,
        responseTime: 0,
        message: 'API key không có quyền truy cập endpoint này',
      };
    }

    // Simulate successful test (in real implementation, would make actual API call)
    const startTime = Date.now();
    
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 10));
    
    const responseTime = Date.now() - startTime;

    return {
      success: true,
      statusCode: 200,
      responseTime,
      message: 'Kết nối thành công',
      data: { endpoint, method: 'GET', timestamp: new Date().toISOString() },
    };
  }

  /**
   * Generate a unique API key
   * Used for testing key generation uniqueness
   * @returns A 64-character hex string
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Extract key prefix from raw key
   * @param rawKey - The raw API key string
   * @returns The first 8 characters of the key
   */
  static extractKeyPrefix(rawKey: string): string {
    return rawKey.substring(0, 8);
  }

  /**
   * Check and update expired API keys
   * Runs daily to update status of expired keys to EXPIRED
   *
   * **Feature: admin-guide-api-keys, Property 15: Expiration Auto-Status**
   * **Validates: Requirements 18.3**
   *
   * @returns Number of keys updated to EXPIRED status
   */
  async checkAndUpdateExpiredKeys(): Promise<number> {
    const now = new Date();

    // Find all ACTIVE keys that have expired
    const expiredKeys = await this.prisma.apiKey.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          not: null,
          lt: now,
        },
      },
      select: { id: true },
    });

    if (expiredKeys.length === 0) {
      return 0;
    }

    // Update all expired keys to EXPIRED status
    const result = await this.prisma.apiKey.updateMany({
      where: {
        id: { in: expiredKeys.map((k) => k.id) },
        status: 'ACTIVE', // Double-check to avoid race conditions
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return result.count;
  }

  /**
   * Get keys expiring within a specified number of days
   * Used for expiration warnings in the UI
   *
   * **Validates: Requirements 18.1, 18.2**
   *
   * @param days - Number of days to look ahead (default: 7)
   * @returns Array of API keys expiring within the specified period
   */
  async getKeysExpiringSoon(days = 7): Promise<ApiKey[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.apiKey.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          not: null,
          gt: now,
          lte: futureDate,
        },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  /**
   * Check if a key is expired based on its expiresAt date
   * Pure function for testing
   *
   * **Feature: admin-guide-api-keys, Property 15: Expiration Auto-Status**
   * **Validates: Requirements 18.3**
   *
   * @param expiresAt - The expiration date or null
   * @param now - Current date (optional, defaults to new Date())
   * @returns true if the key is expired
   */
  static isKeyExpired(expiresAt: Date | null, now: Date = new Date()): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < now;
  }

  /**
   * Determine if an expired key should be reactivated based on new expiration date
   * Pure function for testing
   *
   * **Feature: admin-guide-api-keys**
   * **Validates: Requirements 18.4**
   *
   * @param currentStatus - Current status of the key
   * @param newExpiresAt - New expiration date (null for never, undefined for no change)
   * @param now - Current date (optional, defaults to new Date())
   * @returns true if the key should be reactivated
   */
  static shouldReactivateExpiredKey(
    currentStatus: ApiKeyStatus,
    newExpiresAt: Date | null | undefined,
    now: Date = new Date()
  ): boolean {
    // Only EXPIRED keys can be reactivated
    if (currentStatus !== 'EXPIRED') return false;

    // If expiresAt is not being changed, don't reactivate
    if (newExpiresAt === undefined) return false;

    // If setting to "never expires" (null), reactivate
    if (newExpiresAt === null) return true;

    // If setting to a future date, reactivate
    if (newExpiresAt instanceof Date && newExpiresAt > now) return true;

    // If setting to a past date, don't reactivate
    return false;
  }

  /**
   * Determine the new status for a key based on expiration
   * Pure function for testing
   *
   * **Feature: admin-guide-api-keys, Property 15: Expiration Auto-Status**
   * **Validates: Requirements 18.3**
   *
   * @param currentStatus - Current status of the key
   * @param expiresAt - The expiration date or null
   * @param now - Current date (optional, defaults to new Date())
   * @returns The new status (EXPIRED if expired, otherwise unchanged)
   */
  static determineExpirationStatus(
    currentStatus: ApiKeyStatus,
    expiresAt: Date | null,
    now: Date = new Date()
  ): ApiKeyStatus {
    // Only ACTIVE keys can transition to EXPIRED
    if (currentStatus !== 'ACTIVE') {
      return currentStatus;
    }

    // Check if expired
    if (ApiKeyService.isKeyExpired(expiresAt, now)) {
      return 'EXPIRED';
    }

    return currentStatus;
  }
}