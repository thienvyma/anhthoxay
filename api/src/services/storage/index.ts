/**
 * Storage Module
 *
 * Provides a unified storage interface with automatic provider selection.
 * Supports AWS S3, Cloudflare R2, Firebase Storage, and local filesystem.
 *
 * **Feature: firebase-migration**
 */

import { IStorage, StorageFile, UploadOptions, ListOptions, ListResult, StorageError } from './storage.interface';
import { LocalStorage } from './local.storage';
import { createS3StorageFromEnv } from './s3.storage';
import { createFirebaseStorageFromEnv } from './firebase.storage';
import { logger } from '../../utils/logger';
import { isClusterMode } from '../../config/cluster';

// Re-export types and classes
export { IStorage, StorageFile, UploadOptions, ListOptions, ListResult, StorageError };
export { LocalStorage } from './local.storage';
export { S3Storage, createS3StorageFromEnv } from './s3.storage';
export { FirebaseStorage, createFirebaseStorageFromEnv } from './firebase.storage';

// ============================================
// STORAGE FACTORY
// ============================================

let storageInstance: IStorage | null = null;

/**
 * Get the storage instance
 *
 * Automatically selects the appropriate storage provider:
 * - Firebase Storage if configured (priority 1)
 * - S3/R2 if configured (priority 2)
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

  // Priority 1: Try Firebase Storage
  const firebaseStorage = createFirebaseStorageFromEnv();
  if (firebaseStorage) {
    logger.info('Using Firebase Storage', { bucket: process.env.FIREBASE_STORAGE_BUCKET });
    storageInstance = firebaseStorage;
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
      'Configure FIREBASE_STORAGE_BUCKET or S3_BUCKET for shared storage.'
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

/**
 * List all files in storage
 */
export async function listFiles(options?: ListOptions): Promise<ListResult> {
  return getStorage().list(options);
}
