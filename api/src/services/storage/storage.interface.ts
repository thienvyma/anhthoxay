/**
 * Storage Interface
 *
 * Defines the contract for file storage implementations.
 * Supports local filesystem, S3, and Cloudflare R2.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 1.5**
 */

// ============================================
// TYPES
// ============================================

export interface StorageFile {
  /** Unique identifier for the file */
  key: string;
  /** Public URL to access the file */
  url: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  contentType: string;
  /** Last modified timestamp */
  lastModified?: Date;
  /** Optional metadata */
  metadata?: Record<string, string>;
}

export interface UploadOptions {
  /** MIME type of the file */
  contentType: string;
  /** Optional metadata to store with the file */
  metadata?: Record<string, string>;
  /** Cache-Control header value */
  cacheControl?: string;
  /** Whether the file should be publicly accessible */
  isPublic?: boolean;
}

export interface ListOptions {
  /** Prefix to filter files */
  prefix?: string;
  /** Maximum number of files to return */
  maxKeys?: number;
  /** Continuation token for pagination */
  continuationToken?: string;
}

export interface ListResult {
  /** List of files */
  files: StorageFile[];
  /** Whether there are more files */
  isTruncated: boolean;
  /** Token for next page */
  nextContinuationToken?: string;
}

// ============================================
// STORAGE INTERFACE
// ============================================

/**
 * Storage interface for file operations
 *
 * Implementations:
 * - LocalStorage: Local filesystem (development)
 * - S3Storage: AWS S3 or compatible (production)
 * - R2Storage: Cloudflare R2 (production)
 */
export interface IStorage {
  /**
   * Upload a file to storage
   *
   * @param key - Unique key/path for the file
   * @param data - File data as Buffer
   * @param options - Upload options
   * @returns Uploaded file info
   */
  upload(key: string, data: Buffer, options: UploadOptions): Promise<StorageFile>;

  /**
   * Download a file from storage
   *
   * @param key - File key/path
   * @returns File data as Buffer, or null if not found
   */
  download(key: string): Promise<Buffer | null>;

  /**
   * Delete a file from storage
   *
   * @param key - File key/path
   * @returns true if deleted, false if not found
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a file exists
   *
   * @param key - File key/path
   * @returns true if exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file metadata without downloading
   *
   * @param key - File key/path
   * @returns File info or null if not found
   */
  getMetadata(key: string): Promise<StorageFile | null>;

  /**
   * List files in storage
   *
   * @param options - List options
   * @returns List of files with pagination
   */
  list(options?: ListOptions): Promise<ListResult>;

  /**
   * Get the public URL for a file
   *
   * @param key - File key/path
   * @returns Public URL
   */
  getUrl(key: string): string;

  /**
   * Get storage type identifier
   */
  getType(): 'local' | 's3' | 'r2';

  /**
   * Check if storage is available
   */
  isAvailable(): Promise<boolean>;
}

// ============================================
// STORAGE ERROR
// ============================================

export class StorageError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 500) {
    super(message);
    this.code = code;
    this.name = 'StorageError';
    this.statusCode = statusCode;
  }
}
