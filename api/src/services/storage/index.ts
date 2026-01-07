/**
 * Storage Module
 *
 * Provides a unified storage interface with automatic provider selection.
 * Supports local filesystem, AWS S3, and Cloudflare R2.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 1.5**
 */

import { IStorage, StorageFile, UploadOptions, ListOptions, ListResult, StorageError } from './storage.interface';
import { LocalStorage } from './local.storage';
import { createS3StorageFromEnv } from './s3.storage';
import { logger } from '../../utils/logger';
import { isClusterMode } from '../../config/cluster';

// Re-export types and classes
export { IStorage, StorageFile, UploadOptions, ListOptions, ListResult, StorageError };
export { LocalStorage } from './local.storage';
export { S3Storage, createS3StorageFromEnv } from './s3.storage';

// ============================================
// STORAGE FACTORY
// ============================================

let storageInstance: IStorage | null = null;

/**
 * Get the storage instance
 *
 * Automatically selects the appropriate storage provider:
 * - S3/R2 if configured (recommended for production)
 * - Local filesystem otherwise (development)
 *
 * In cluster mode, warns if using local storage.
 *
 * @returns Storage instance
 *
 * @example
 * ```ts
 * const storage = getStorage();
 * await storage.upload('images/photo.jpg', buffer, { contentType: 'image/jpeg' });
 * ```
 */
export function getStorage(): IStorage {
  if (storageInstance) {
    return storageInstance;
  }

  // Try to create S3 storage from environment
  const s3Storage = createS3StorageFromEnv();

  if (s3Storage) {
    logger.info('Using S3/R2 storage', { type: s3Storage.getType() });
    storageInstance = s3Storage;
    return storageInstance;
  }

  // Fall back to local storage
  const clusterMode = isClusterMode();
  
  if (clusterMode) {
    logger.warn(
      'Using local storage in cluster mode - files will not be shared across instances! ' +
      'Configure S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY for shared storage.'
    );
  } else {
    logger.info('Using local filesystem storage');
  }

  storageInstance = new LocalStorage();
  return storageInstance;
}

/**
 * Reset storage instance (for testing)
 */
export function resetStorage(): void {
  storageInstance = null;
}

/**
 * Check if shared storage is configured
 *
 * @returns true if S3/R2 storage is configured
 */
export function isSharedStorageConfigured(): boolean {
  return createS3StorageFromEnv() !== null;
}

/**
 * Get storage type
 *
 * @returns 'local', 's3', or 'r2'
 */
export function getStorageType(): 'local' | 's3' | 'r2' {
  return getStorage().getType();
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Upload a file to storage
 *
 * @param key - File key/path
 * @param data - File data
 * @param options - Upload options
 * @returns Uploaded file info
 */
export async function uploadFile(
  key: string,
  data: Buffer,
  options: UploadOptions
): Promise<StorageFile> {
  return getStorage().upload(key, data, options);
}

/**
 * Download a file from storage
 *
 * @param key - File key/path
 * @returns File data or null
 */
export async function downloadFile(key: string): Promise<Buffer | null> {
  return getStorage().download(key);
}

/**
 * Delete a file from storage
 *
 * @param key - File key/path
 * @returns true if deleted
 */
export async function deleteFile(key: string): Promise<boolean> {
  return getStorage().delete(key);
}

/**
 * Get public URL for a file
 *
 * @param key - File key/path
 * @returns Public URL
 */
export function getFileUrl(key: string): string {
  return getStorage().getUrl(key);
}

/**
 * Check if storage is available
 *
 * @returns true if storage is operational
 */
export async function isStorageAvailable(): Promise<boolean> {
  return getStorage().isAvailable();
}
