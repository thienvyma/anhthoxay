/**
 * Content Hash Utility
 *
 * Generates deterministic hash-based filenames for cache busting.
 * Same content always produces the same hash, enabling immutable caching.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 2.3**
 */

import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export interface ContentHashOptions {
  /** Hash algorithm to use (default: sha256) */
  algorithm?: 'sha256' | 'sha1' | 'md5';
  /** Length of hash to include in filename (default: 8) */
  hashLength?: number;
  /** Whether to include original filename (default: false) */
  includeOriginalName?: boolean;
}

export interface HashedFilename {
  /** Full filename with hash */
  filename: string;
  /** Just the hash portion */
  hash: string;
  /** File extension */
  extension: string;
  /** Original filename (if provided) */
  originalName?: string;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_ALGORITHM = 'sha256';
const DEFAULT_HASH_LENGTH = 8;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a hash from buffer content
 *
 * @param buffer - File content as Buffer
 * @param algorithm - Hash algorithm to use
 * @returns Hex-encoded hash string
 */
export function generateHash(
  buffer: Buffer,
  algorithm: 'sha256' | 'sha1' | 'md5' = DEFAULT_ALGORITHM
): string {
  return crypto.createHash(algorithm).update(buffer).digest('hex');
}

/**
 * Get file extension from filename or MIME type
 *
 * @param filename - Original filename (optional)
 * @param mimeType - MIME type (optional)
 * @returns File extension without dot
 */
export function getExtension(filename?: string, mimeType?: string): string {
  // Try to get extension from filename first
  if (filename) {
    const parts = filename.split('.');
    if (parts.length > 1) {
      const ext = parts.pop();
      return ext ? ext.toLowerCase() : '';
    }
  }

  // Fall back to MIME type
  if (mimeType) {
    const mimeExtensions: Record<string, string> = {
      'image/webp': 'webp',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/x-icon': 'ico',
      'application/pdf': 'pdf',
      'application/json': 'json',
      'text/plain': 'txt',
      'text/html': 'html',
      'text/css': 'css',
      'application/javascript': 'js',
      'font/woff': 'woff',
      'font/woff2': 'woff2',
      'font/ttf': 'ttf',
      'font/otf': 'otf',
      'application/octet-stream': 'bin',
    };
    return mimeExtensions[mimeType] || 'bin';
  }

  return 'bin';
}

/**
 * Sanitize filename for safe filesystem use
 *
 * @param name - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(name: string): string {
  // Remove path separators and special characters
  return name
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50); // Limit length
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Generate a content-hash based filename
 *
 * Creates a deterministic filename based on file content.
 * Same content always produces the same filename, enabling
 * immutable caching with long cache durations.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 2.3**
 *
 * @param buffer - File content as Buffer
 * @param options - Configuration options
 * @returns Hashed filename info
 *
 * @example
 * ```ts
 * const result = generateContentHashFilename(imageBuffer, {
 *   mimeType: 'image/webp',
 * });
 * // result.filename = 'a1b2c3d4.webp'
 * // result.hash = 'a1b2c3d4'
 *
 * // With original name
 * const result2 = generateContentHashFilename(imageBuffer, {
 *   originalFilename: 'my-photo.jpg',
 *   mimeType: 'image/webp',
 *   includeOriginalName: true,
 * });
 * // result2.filename = 'my-photo-a1b2c3d4.webp'
 * ```
 */
export function generateContentHashFilename(
  buffer: Buffer,
  options: ContentHashOptions & {
    originalFilename?: string;
    mimeType?: string;
  } = {}
): HashedFilename {
  const {
    algorithm = DEFAULT_ALGORITHM,
    hashLength = DEFAULT_HASH_LENGTH,
    includeOriginalName = false,
    originalFilename,
    mimeType,
  } = options;

  // Generate hash from content
  const fullHash = generateHash(buffer, algorithm);
  const hash = fullHash.slice(0, hashLength);

  // Get file extension
  const extension = getExtension(originalFilename, mimeType);

  // Build filename
  let filename: string;
  if (includeOriginalName && originalFilename) {
    // Extract name without extension
    const nameParts = originalFilename.split('.');
    if (nameParts.length > 1) {
      nameParts.pop(); // Remove extension
    }
    const baseName = sanitizeFilename(nameParts.join('.'));
    filename = `${baseName}-${hash}.${extension}`;
  } else {
    filename = `${hash}.${extension}`;
  }

  return {
    filename,
    hash,
    extension,
    originalName: originalFilename,
  };
}

/**
 * Check if a filename contains a content hash
 *
 * @param filename - Filename to check
 * @param hashLength - Expected hash length (default: 8)
 * @returns true if filename appears to contain a content hash
 */
export function hasContentHash(filename: string, hashLength = DEFAULT_HASH_LENGTH): boolean {
  // Pattern: either {hash}.{ext} or {name}-{hash}.{ext}
  const hashPattern = new RegExp(`[a-f0-9]{${hashLength}}\\.[a-z0-9]+$`, 'i');
  return hashPattern.test(filename);
}

/**
 * Extract hash from a content-hashed filename
 *
 * @param filename - Filename with hash
 * @param hashLength - Expected hash length (default: 8)
 * @returns Hash string or null if not found
 */
export function extractHash(filename: string, hashLength = DEFAULT_HASH_LENGTH): string | null {
  // Pattern: capture hash before extension
  const hashPattern = new RegExp(`([a-f0-9]{${hashLength}})\\.[a-z0-9]+$`, 'i');
  const match = filename.match(hashPattern);
  return match ? match[1] : null;
}

/**
 * Verify that a file's content matches its hash-based filename
 *
 * @param buffer - File content
 * @param filename - Filename with hash
 * @param options - Hash options
 * @returns true if content matches the hash in filename
 */
export function verifyContentHash(
  buffer: Buffer,
  filename: string,
  options: ContentHashOptions = {}
): boolean {
  const { algorithm = DEFAULT_ALGORITHM, hashLength = DEFAULT_HASH_LENGTH } = options;

  const extractedHash = extractHash(filename, hashLength);
  if (!extractedHash) {
    return false;
  }

  const contentHash = generateHash(buffer, algorithm).slice(0, hashLength);
  return extractedHash.toLowerCase() === contentHash.toLowerCase();
}

export default {
  generateContentHashFilename,
  generateHash,
  getExtension,
  hasContentHash,
  extractHash,
  verifyContentHash,
};
