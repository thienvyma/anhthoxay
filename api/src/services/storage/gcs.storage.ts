/**
 * Google Cloud Storage Implementation
 *
 * Native GCS storage using signed URLs for uploads.
 * Used for production deployments on GCP.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 1.5**
 */

import {
  IStorage,
  StorageFile,
  UploadOptions,
  ListOptions,
  ListResult,
  StorageError,
} from './storage.interface';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

export interface GCSConfig {
  /** GCS bucket name */
  bucket: string;
  /** Project ID (optional, uses default) */
  projectId?: string;
  /** Public URL prefix for files */
  publicUrl?: string;
}

// ============================================
// GCS STORAGE IMPLEMENTATION
// ============================================

/**
 * Google Cloud Storage Implementation
 *
 * Uses the GCS JSON API with Application Default Credentials.
 * On Cloud Run, credentials are automatically provided.
 */
export class GCSStorage implements IStorage {
  private config: GCSConfig;
  private baseUrl: string;

  constructor(config: GCSConfig) {
    this.config = config;
    this.baseUrl = `https://storage.googleapis.com/upload/storage/v1/b/${config.bucket}/o`;
  }

  /**
   * Get access token from metadata server (Cloud Run)
   */
  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(
        'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
        {
          headers: { 'Metadata-Flavor': 'Google' },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`);
      }

      const data = await response.json() as { access_token: string };
      return data.access_token;
    } catch (error) {
      logger.error('Failed to get GCS access token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new StorageError('AUTH_FAILED', 'Failed to authenticate with GCS');
    }
  }

  async upload(key: string, data: Buffer, options: UploadOptions): Promise<StorageFile> {
    try {
      const token = await this.getAccessToken();
      const uploadUrl = `${this.baseUrl}?uploadType=media&name=${encodeURIComponent(key)}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': options.contentType,
          'Content-Length': data.length.toString(),
          ...(options.cacheControl && { 'Cache-Control': options.cacheControl }),
        },
        body: new Uint8Array(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('GCS upload failed', { key, status: response.status, error: errorText });
        throw new StorageError('UPLOAD_FAILED', `Failed to upload file: ${response.status}`);
      }

      // Make object public if requested
      if (options.isPublic) {
        await this.makePublic(key, token);
      }

      logger.debug('File uploaded to GCS', { key, size: data.length });

      return {
        key,
        url: this.getUrl(key),
        size: data.length,
        contentType: options.contentType,
        lastModified: new Date(),
        metadata: options.metadata,
      };
    } catch (error) {
      if (error instanceof StorageError) throw error;

      logger.error('GCS upload error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new StorageError('UPLOAD_FAILED', `Failed to upload file: ${key}`);
    }
  }

  /**
   * Make an object publicly readable
   */
  private async makePublic(key: string, token: string): Promise<void> {
    try {
      const aclUrl = `https://storage.googleapis.com/storage/v1/b/${this.config.bucket}/o/${encodeURIComponent(key)}/acl`;

      const response = await fetch(aclUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity: 'allUsers',
          role: 'READER',
        }),
      });

      if (!response.ok) {
        logger.warn('Failed to make object public', { key, status: response.status });
      }
    } catch (error) {
      logger.warn('Failed to make object public', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async download(key: string): Promise<Buffer | null> {
    try {
      const token = await this.getAccessToken();
      const url = `https://storage.googleapis.com/storage/v1/b/${this.config.bucket}/o/${encodeURIComponent(key)}?alt=media`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        logger.error('GCS download failed', { key, status: response.status });
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error('GCS download error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const url = `https://storage.googleapis.com/storage/v1/b/${this.config.bucket}/o/${encodeURIComponent(key)}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204 || response.status === 200) {
        logger.debug('File deleted from GCS', { key });
        return true;
      }

      if (response.status === 404) {
        return false;
      }

      logger.error('GCS delete failed', { key, status: response.status });
      return false;
    } catch (error) {
      logger.error('GCS delete error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const metadata = await this.getMetadata(key);
    return metadata !== null;
  }

  async getMetadata(key: string): Promise<StorageFile | null> {
    try {
      const token = await this.getAccessToken();
      const url = `https://storage.googleapis.com/storage/v1/b/${this.config.bucket}/o/${encodeURIComponent(key)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as {
        name: string;
        size: string;
        contentType: string;
        updated: string;
        metadata?: Record<string, string>;
      };

      return {
        key: data.name,
        url: this.getUrl(data.name),
        size: parseInt(data.size, 10),
        contentType: data.contentType,
        lastModified: new Date(data.updated),
        metadata: data.metadata,
      };
    } catch (error) {
      logger.error('GCS metadata error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async list(options?: ListOptions): Promise<ListResult> {
    try {
      const token = await this.getAccessToken();
      const params = new URLSearchParams();
      
      if (options?.prefix) {
        params.set('prefix', options.prefix);
      }
      if (options?.maxKeys) {
        params.set('maxResults', options.maxKeys.toString());
      }
      if (options?.continuationToken) {
        params.set('pageToken', options.continuationToken);
      }

      const url = `https://storage.googleapis.com/storage/v1/b/${this.config.bucket}/o?${params}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return { files: [], isTruncated: false };
      }

      const data = await response.json() as {
        items?: Array<{
          name: string;
          size: string;
          contentType: string;
          updated: string;
        }>;
        nextPageToken?: string;
      };

      const files: StorageFile[] = (data.items || []).map((item) => ({
        key: item.name,
        url: this.getUrl(item.name),
        size: parseInt(item.size, 10),
        contentType: item.contentType,
        lastModified: new Date(item.updated),
      }));

      return {
        files,
        isTruncated: !!data.nextPageToken,
        nextContinuationToken: data.nextPageToken,
      };
    } catch (error) {
      logger.error('GCS list error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { files: [], isTruncated: false };
    }
  }

  getUrl(key: string): string {
    if (this.config.publicUrl) {
      const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
      return `${this.config.publicUrl}/${normalizedKey}`;
    }
    return `https://storage.googleapis.com/${this.config.bucket}/${key}`;
  }

  getType(): 's3' | 'r2' | 'local' {
    // Return 's3' for compatibility with existing code
    return 's3';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const url = `https://storage.googleapis.com/storage/v1/b/${this.config.bucket}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Create GCS storage from environment variables
 */
export function createGCSStorageFromEnv(): GCSStorage | null {
  const bucket = process.env.GCS_BUCKET || process.env.S3_BUCKET;

  if (!bucket) {
    return null;
  }

  // Check if we're on GCP (metadata server available)
  // This will be validated at runtime
  return new GCSStorage({
    bucket,
    projectId: process.env.GCP_PROJECT_ID,
    publicUrl: process.env.GCS_PUBLIC_URL || process.env.S3_PUBLIC_URL,
  });
}
