/**
 * Storage Module
 *
 * Provides a unified storage interface with automatic provider selection.
 * Supports Google Cloud Storage, AWS S3, Cloudflare R2, and local filesystem.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 1.5**
 */

import { IStorage, StorageFile, UploadOptions, ListOptions, ListResult, StorageError } from './storage.interface';
import { LocalStorage } from './local.storage';
import { createS3StorageFromEnv } from './s3.storage';
import { createGCSStorageFromEnv } from './gcs.storage';
import { logger } from '../../utils/logger';
import { isClusterMode } from '../../config/cluster';

// Re-export types and classes
export { IStorage, StorageFile, UploadOptions, ListOptions, ListResult, StorageError };
export { LocalStorage } from './local.storage';
export { S3Storage, createS3StorageFromEnv } from './s3.storage';
export { GCSStorage, createGCSStorageFromEnv } from './gcs.storage';

// ============================================
// STORAGE FACTORY
// ============================================

let storageInstance: IStorage | null = null;

/**
 * Get the storage instance
 *
 * Automatically selects the appropriate storage provider:
 * - GCS if on Google Cloud (recommended for GCP deployments)
 * - S3/R2 if configured
 * - Local filesystem otherwise (development)
 *
 * In cluster mode, warns if using local storage.
 *
 * @returns Storage instance
 */
export function getStorage(): IStorage {
  if (storageInstance) {
    return storageInstance;
  }

  // Priority 1: Try GCS (for GCP deployments)
  const gcsStorage = createGCSStorageFromEnv();
  if (gcsStorage) {
    logger.info('Using Google Cloud Storage', { bucket: process.env.GCS_BUCKET || process.env.S3_BUCKET });
    storageInstance = gcsStorage;
    return storageInstance;
  }

  // Priority 2: Try S3/R2
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
      'Configure GCS_BUCKET or S3_BUCKET for shared storage.'
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
 * @returns true if GCS or S3/R2 storage is configured
 */
export function isSharedStorageConfigured(): boolean {
  return createGCSStorageFromEnv() !== null || createS3StorageFromEnv() !== null;
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
 */
export async function downloadFile(key: string): Promise<Buffer | null> {
  return getStorage().download(key);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(key: string): Promise<boolean> {
  return getStorage().delete(key);
}

/**
 * Get public URL for a file
 */
export function getFileUrl(key: string): string {
  return getStorage().getUrl(key);
}

/**
 * Check if storage is available
 */
export async function isStorageAvailable(): Promise<boolean> {
  return getStorage().isAvailable();
}
