/**
 * Firebase Storage Implementation
 *
 * Implements IStorage interface using Firebase Cloud Storage.
 * Provides file upload, download, delete, and listing operations.
 *
 * **Feature: firebase-migration**
 * **Requirements: 9.1, 9.2, 9.3, 9.4**
 */

import { getFirebaseStorage } from '../firebase-admin.service';
import { logger } from '../../utils/logger';
import {
  IStorage,
  StorageFile,
  UploadOptions,
  ListOptions,
  ListResult,
  StorageError,
} from './storage.interface';

// ============================================
// TYPES
// ============================================

export interface FirebaseStorageConfig {
  /** Firebase Storage bucket name (without gs://) */
  bucketName: string;
  /** Base URL for public access (optional, uses Firebase default if not set) */
  publicBaseUrl?: string;
  /** Default cache control header */
  defaultCacheControl?: string;
}

// ============================================
// FIREBASE STORAGE CLASS
// ============================================

/**
 * Firebase Storage implementation
 *
 * Uses Firebase Admin SDK to interact with Cloud Storage.
 * Supports public and signed URLs for file access.
 */
export class FirebaseStorage implements IStorage {
  private bucketName: string;
  private publicBaseUrl?: string;
  private defaultCacheControl: string;

  constructor(config: FirebaseStorageConfig) {
    this.bucketName = config.bucketName;
    this.publicBaseUrl = config.publicBaseUrl;
    this.defaultCacheControl = config.defaultCacheControl || 'public, max-age=31536000';
  }

  /**
   * Get the Firebase Storage bucket
   */
  private async getBucket() {
    const storage = await getFirebaseStorage();
    return storage.bucket(this.bucketName);
  }

  /**
   * Upload a file to Firebase Storage
   */
  async upload(key: string, data: Buffer, options: UploadOptions): Promise<StorageFile> {
    try {
      const bucket = await this.getBucket();
      const file = bucket.file(key);

      // Prepare metadata
      const metadata: Record<string, string> = {
        contentType: options.contentType,
        cacheControl: options.cacheControl || this.defaultCacheControl,
        ...options.metadata,
      };

      // Upload the file
      await file.save(data, {
        metadata: {
          contentType: options.contentType,
          cacheControl: options.cacheControl || this.defaultCacheControl,
          metadata: options.metadata,
        },
        resumable: false, // Disable resumable for small files
      });

      // Make public if requested
      if (options.isPublic) {
        await file.makePublic();
      }

      // Get the URL
      const url = options.isPublic
        ? this.getPublicUrl(key)
        : await this.getSignedUrl(key);

      logger.info('Firebase Storage: File uploaded', {
        key,
        size: data.length,
        contentType: options.contentType,
        isPublic: options.isPublic,
      });

      return {
        key,
        url,
        size: data.length,
        contentType: options.contentType,
        metadata,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Firebase Storage: Upload failed', { key, error: message });
      throw new StorageError('UPLOAD_FAILED', `Failed to upload file: ${message}`, 500);
    }
  }

  /**
   * Download a file from Firebase Storage
   */
  async download(key: string): Promise<Buffer | null> {
    try {
      const bucket = await this.getBucket();
      const file = bucket.file(key);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }

      // Download the file
      const [data] = await file.download();
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Firebase Storage: Download failed', { key, error: message });
      return null;
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async delete(key: string): Promise<boolean> {
    try {
      const bucket = await this.getBucket();
      const file = bucket.file(key);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return false;
      }

      // Delete the file
      await file.delete();

      logger.info('Firebase Storage: File deleted', { key });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Firebase Storage: Delete failed', { key, error: message });
      return false;
    }
  }

  /**
   * Check if a file exists in Firebase Storage
   */
  async exists(key: string): Promise<boolean> {
    try {
      const bucket = await this.getBucket();
      const file = bucket.file(key);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Firebase Storage: Exists check failed', { key, error: message });
      return false;
    }
  }

  /**
   * Get file metadata without downloading
   */
  async getMetadata(key: string): Promise<StorageFile | null> {
    try {
      const bucket = await this.getBucket();
      const file = bucket.file(key);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }

      // Get metadata
      const [metadata] = await file.getMetadata();

      return {
        key,
        url: this.getPublicUrl(key),
        size: parseInt(metadata.size as string, 10) || 0,
        contentType: metadata.contentType || 'application/octet-stream',
        lastModified: metadata.updated ? new Date(metadata.updated) : undefined,
        metadata: metadata.metadata as Record<string, string> | undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Firebase Storage: Get metadata failed', { key, error: message });
      return null;
    }
  }

  /**
   * List files in Firebase Storage
   */
  async list(options?: ListOptions): Promise<ListResult> {
    try {
      const bucket = await this.getBucket();

      const [files, , apiResponse] = await bucket.getFiles({
        prefix: options?.prefix,
        maxResults: options?.maxKeys || 1000,
        pageToken: options?.continuationToken,
      });

      const storageFiles: StorageFile[] = await Promise.all(
        files.map(async (file) => {
          const [metadata] = await file.getMetadata();
          return {
            key: file.name,
            url: this.getPublicUrl(file.name),
            size: parseInt(metadata.size as string, 10) || 0,
            contentType: metadata.contentType || 'application/octet-stream',
            lastModified: metadata.updated ? new Date(metadata.updated) : undefined,
            metadata: metadata.metadata as Record<string, string> | undefined,
          };
        })
      );

      // Type-safe access to apiResponse
      const response = apiResponse as { nextPageToken?: string } | undefined;

      return {
        files: storageFiles,
        isTruncated: !!response?.nextPageToken,
        nextContinuationToken: response?.nextPageToken,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Firebase Storage: List failed', { error: message });
      throw new StorageError('LIST_FAILED', `Failed to list files: ${message}`, 500);
    }
  }

  /**
   * Get the public URL for a file
   */
  getUrl(key: string): string {
    return this.getPublicUrl(key);
  }

  /**
   * Get storage type identifier
   */
  getType(): 'local' | 's3' | 'r2' {
    // Return 's3' as Firebase Storage is compatible with S3-like operations
    // This maintains compatibility with existing code
    return 's3';
  }

  /**
   * Check if storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const bucket = await this.getBucket();
      await bucket.getMetadata();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Firebase Storage: Availability check failed', { error: message });
      return false;
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Get public URL for a file
   */
  private getPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${key}`;
    }
    // Default Firebase Storage public URL format
    return `https://storage.googleapis.com/${this.bucketName}/${encodeURIComponent(key)}`;
  }

  /**
   * Get signed URL for private file access
   */
  private async getSignedUrl(key: string, expiresInMs = 3600000): Promise<string> {
    try {
      const bucket = await this.getBucket();
      const file = bucket.file(key);

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInMs,
      });

      return url;
    } catch (error) {
      // Fall back to public URL if signed URL fails
      logger.warn('Firebase Storage: Failed to generate signed URL, using public URL', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.getPublicUrl(key);
    }
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create Firebase Storage instance from environment variables
 *
 * Required env vars:
 * - FIREBASE_STORAGE_BUCKET: Bucket name (e.g., 'noithatnhanh-f8f72.appspot.com')
 *
 * Optional env vars:
 * - FIREBASE_STORAGE_PUBLIC_URL: Custom public URL base
 * - FIREBASE_STORAGE_CACHE_CONTROL: Default cache control header
 *
 * @returns FirebaseStorage instance or null if not configured
 */
export function createFirebaseStorageFromEnv(): FirebaseStorage | null {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

  if (!bucketName) {
    return null;
  }

  return new FirebaseStorage({
    bucketName,
    publicBaseUrl: process.env.FIREBASE_STORAGE_PUBLIC_URL,
    defaultCacheControl: process.env.FIREBASE_STORAGE_CACHE_CONTROL,
  });
}
