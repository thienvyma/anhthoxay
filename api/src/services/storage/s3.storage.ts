/**
 * S3/R2 Storage Implementation
 *
 * Stores files in AWS S3 or Cloudflare R2 (S3-compatible).
 * Used for production multi-instance deployments.
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
  StorageError 
} from './storage.interface';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

export interface S3Config {
  /** S3 bucket name */
  bucket: string;
  /** AWS region or R2 account ID */
  region: string;
  /** S3 endpoint URL (for R2 or custom S3-compatible services) */
  endpoint?: string;
  /** AWS access key ID */
  accessKeyId: string;
  /** AWS secret access key */
  secretAccessKey: string;
  /** Public URL prefix for files (CDN URL) */
  publicUrl?: string;
  /** Whether to use path-style URLs (required for some S3-compatible services) */
  forcePathStyle?: boolean;
}

// ============================================
// S3 STORAGE IMPLEMENTATION
// ============================================

/**
 * S3/R2 Storage Implementation
 *
 * Uses native fetch API for S3 operations to avoid heavy AWS SDK dependency.
 * Compatible with AWS S3, Cloudflare R2, MinIO, and other S3-compatible services.
 */
export class S3Storage implements IStorage {
  private config: S3Config;
  private storageType: 's3' | 'r2';

  constructor(config: S3Config) {
    this.config = config;
    // Detect R2 by endpoint
    this.storageType = config.endpoint?.includes('r2.cloudflarestorage.com') ? 'r2' : 's3';
  }

  /**
   * Generate AWS Signature V4 for S3 requests
   */
  private async signRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: Buffer
  ): Promise<Record<string, string>> {
    const { createHmac, createHash } = await import('crypto');
    
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    
    const service = 's3';
    const region = this.config.region;
    const host = this.getHost();
    
    // Create canonical request
    const payloadHash = body 
      ? createHash('sha256').update(body).digest('hex')
      : 'UNSIGNED-PAYLOAD';
    
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalHeaders = [
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
    ].join('\n') + '\n';
    
    const canonicalRequest = [
      method,
      path,
      '', // query string
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');
    
    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');
    
    // Calculate signature
    const getSignatureKey = (key: string, dateStamp: string, region: string, service: string) => {
      const kDate = createHmac('sha256', `AWS4${key}`).update(dateStamp).digest();
      const kRegion = createHmac('sha256', kDate).update(region).digest();
      const kService = createHmac('sha256', kRegion).update(service).digest();
      const kSigning = createHmac('sha256', kService).update('aws4_request').digest();
      return kSigning;
    };
    
    const signingKey = getSignatureKey(this.config.secretAccessKey, dateStamp, region, service);
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    
    // Create authorization header
    const authorization = `${algorithm} Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    return {
      ...headers,
      'Host': host,
      'X-Amz-Date': amzDate,
      'X-Amz-Content-Sha256': payloadHash,
      'Authorization': authorization,
    };
  }

  /**
   * Get S3 host
   */
  private getHost(): string {
    if (this.config.endpoint) {
      const url = new URL(this.config.endpoint);
      return this.config.forcePathStyle 
        ? url.host 
        : `${this.config.bucket}.${url.host}`;
    }
    return `${this.config.bucket}.s3.${this.config.region}.amazonaws.com`;
  }

  /**
   * Get S3 URL for a key
   */
  private getS3Url(key: string): string {
    const host = this.getHost();
    const protocol = this.config.endpoint?.startsWith('http://') ? 'http' : 'https';
    
    if (this.config.forcePathStyle) {
      return `${protocol}://${host}/${this.config.bucket}/${key}`;
    }
    return `${protocol}://${host}/${key}`;
  }

  /**
   * Get path for S3 request
   */
  private getPath(key: string): string {
    if (this.config.forcePathStyle) {
      return `/${this.config.bucket}/${key}`;
    }
    return `/${key}`;
  }

  async upload(key: string, data: Buffer, options: UploadOptions): Promise<StorageFile> {
    const path = this.getPath(key);
    const url = this.getS3Url(key);
    
    const headers: Record<string, string> = {
      'Content-Type': options.contentType,
      'Content-Length': data.length.toString(),
    };
    
    if (options.cacheControl) {
      headers['Cache-Control'] = options.cacheControl;
    }
    
    // Add custom metadata
    if (options.metadata) {
      for (const [k, v] of Object.entries(options.metadata)) {
        headers[`x-amz-meta-${k}`] = v;
      }
    }
    
    // Set ACL for public files
    if (options.isPublic) {
      headers['x-amz-acl'] = 'public-read';
    }

    try {
      const signedHeaders = await this.signRequest('PUT', path, headers, data);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: signedHeaders,
        body: new Uint8Array(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('S3 upload failed', { key, status: response.status, error: errorText });
        throw new StorageError('UPLOAD_FAILED', `Failed to upload file: ${response.status}`);
      }

      logger.debug('File uploaded to S3', { key, size: data.length });

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
      
      logger.error('S3 upload error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new StorageError('UPLOAD_FAILED', `Failed to upload file: ${key}`);
    }
  }

  async download(key: string): Promise<Buffer | null> {
    const path = this.getPath(key);
    const url = this.getS3Url(key);

    try {
      const signedHeaders = await this.signRequest('GET', path, {});
      
      const response = await fetch(url, {
        method: 'GET',
        headers: signedHeaders,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        logger.error('S3 download failed', { key, status: response.status });
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error('S3 download error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    const path = this.getPath(key);
    const url = this.getS3Url(key);

    try {
      const signedHeaders = await this.signRequest('DELETE', path, {});
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: signedHeaders,
      });

      // S3 returns 204 on successful delete, 404 if not found
      if (response.status === 204 || response.status === 200) {
        logger.debug('File deleted from S3', { key });
        return true;
      }

      if (response.status === 404) {
        return false;
      }

      logger.error('S3 delete failed', { key, status: response.status });
      return false;
    } catch (error) {
      logger.error('S3 delete error', {
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
    const path = this.getPath(key);
    const url = this.getS3Url(key);

    try {
      const signedHeaders = await this.signRequest('HEAD', path, {});
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: signedHeaders,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      const lastModified = response.headers.get('last-modified');

      // Extract custom metadata
      const metadata: Record<string, string> = {};
      response.headers.forEach((value, name) => {
        if (name.startsWith('x-amz-meta-')) {
          metadata[name.replace('x-amz-meta-', '')] = value;
        }
      });

      return {
        key,
        url: this.getUrl(key),
        size: contentLength ? parseInt(contentLength, 10) : 0,
        contentType: contentType || 'application/octet-stream',
        lastModified: lastModified ? new Date(lastModified) : undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };
    } catch (error) {
      logger.error('S3 metadata error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async list(_options?: ListOptions): Promise<ListResult> {
    // S3 ListObjectsV2 implementation would go here
    // For now, return empty list as this is a complex operation
    logger.warn('S3 list operation not fully implemented');
    return { files: [], isTruncated: false };
  }

  getUrl(key: string): string {
    // Use CDN URL if configured
    if (this.config.publicUrl) {
      const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
      return `${this.config.publicUrl}/${normalizedKey}`;
    }
    
    // Otherwise use S3 URL
    return this.getS3Url(key);
  }

  getType(): 's3' | 'r2' {
    return this.storageType;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Try to list bucket (HEAD request to bucket)
      const path = this.config.forcePathStyle ? `/${this.config.bucket}` : '/';
      const host = this.getHost();
      const protocol = this.config.endpoint?.startsWith('http://') ? 'http' : 'https';
      const url = `${protocol}://${host}${path}`;
      
      const signedHeaders = await this.signRequest('HEAD', path, {});
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: signedHeaders,
      });

      return response.ok || response.status === 404; // 404 is ok, means bucket exists but empty
    } catch {
      return false;
    }
  }
}

/**
 * Create S3 storage from environment variables
 */
export function createS3StorageFromEnv(): S3Storage | null {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || process.env.AWS_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Storage({
    bucket,
    region,
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId,
    secretAccessKey,
    publicUrl: process.env.S3_PUBLIC_URL || process.env.CDN_URL,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  });
}
