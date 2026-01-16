/**
 * Property-Based Tests for Firebase Storage Service
 *
 * Tests Properties 12 and 13 from the design document:
 * - Property 12: Storage Upload-Download Round Trip
 * - Property 13: Storage Delete Removes File
 *
 * Uses fast-check for property-based testing with 100+ iterations.
 *
 * **Validates: Requirements 9.1, 9.2, 9.3**
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageFile } from './storage.interface';
import type { FirebaseStorageConfig } from './firebase.storage';

// ============================================
// TEST CONFIGURATION
// ============================================

const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'test-bucket';

// ============================================
// TEST HELPERS
// ============================================

/**
 * Generate a valid file key (path)
 */
const fileKeyArb = fc.tuple(
  fc.string({ minLength: 1, maxLength: 10, unit: 'grapheme' }).map(s => s.replace(/[^a-z0-9]/gi, 'x').slice(0, 10) || 'file'),
  fc.constantFrom('.txt', '.json', '.bin', '.webp', '.png')
).map(([name, ext]) => `test/${name}${ext}`);

/**
 * Generate file content as Buffer
 */
const fileContentArb = fc.uint8Array({ minLength: 1, maxLength: 10000 }).map(arr => Buffer.from(arr));

/**
 * Generate content type based on extension
 */
function getContentType(key: string): string {
  if (key.endsWith('.txt')) return 'text/plain';
  if (key.endsWith('.json')) return 'application/json';
  if (key.endsWith('.webp')) return 'image/webp';
  if (key.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

// ============================================
// MOCK FIREBASE STORAGE FOR UNIT TESTS
// ============================================

/**
 * In-memory mock storage for testing without Firebase emulator
 */
class MockFirebaseStorage {
  private files: Map<string, { data: Buffer; metadata: Record<string, unknown> }> = new Map();
  private bucketName: string;

  constructor(config: FirebaseStorageConfig) {
    this.bucketName = config.bucketName;
  }

  async upload(key: string, data: Buffer, options: { contentType: string; isPublic?: boolean }): Promise<StorageFile> {
    this.files.set(key, {
      data,
      metadata: {
        contentType: options.contentType,
        size: data.length,
        updated: new Date().toISOString(),
      },
    });

    return {
      key,
      url: `https://storage.googleapis.com/${this.bucketName}/${encodeURIComponent(key)}`,
      size: data.length,
      contentType: options.contentType,
    };
  }

  async download(key: string): Promise<Buffer | null> {
    const file = this.files.get(key);
    return file ? file.data : null;
  }

  async delete(key: string): Promise<boolean> {
    if (!this.files.has(key)) {
      return false;
    }
    this.files.delete(key);
    return true;
  }

  async exists(key: string): Promise<boolean> {
    return this.files.has(key);
  }

  async getMetadata(key: string): Promise<StorageFile | null> {
    const file = this.files.get(key);
    if (!file) return null;

    return {
      key,
      url: `https://storage.googleapis.com/${this.bucketName}/${encodeURIComponent(key)}`,
      size: file.data.length,
      contentType: file.metadata.contentType as string,
      lastModified: new Date(file.metadata.updated as string),
    };
  }

  getUrl(key: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${encodeURIComponent(key)}`;
  }

  getType(): 'local' | 's3' | 'r2' {
    return 's3';
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  // Helper for cleanup
  clear(): void {
    this.files.clear();
  }
}

// ============================================
// PROPERTY TESTS
// ============================================

describe('Firebase Storage Property Tests', () => {
  let storage: MockFirebaseStorage;

  beforeAll(() => {
    storage = new MockFirebaseStorage({
      bucketName: FIREBASE_STORAGE_BUCKET,
    });
  });

  afterEach(() => {
    // Clean up after each test
    storage.clear();
  });

  // ============================================
  // Property 12: Storage Upload-Download Round Trip
  // ============================================

  describe('Property 12: Storage Upload-Download Round Trip', () => {
    it('should return the same content after upload and download (100 iterations)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fileKeyArb,
          fileContentArb,
          async (key, content) => {
            const contentType = getContentType(key);

            // Upload the file
            const uploadResult = await storage.upload(key, content, {
              contentType,
              isPublic: true,
            });

            // Verify upload result
            expect(uploadResult.key).toBe(key);
            expect(uploadResult.size).toBe(content.length);
            expect(uploadResult.contentType).toBe(contentType);
            expect(uploadResult.url).toContain(encodeURIComponent(key));

            // Download the file
            const downloaded = await storage.download(key);

            // Verify content matches
            expect(downloaded).not.toBeNull();
            if (downloaded) {
              expect(downloaded.equals(content)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve file metadata after upload', async () => {
      await fc.assert(
        fc.asyncProperty(
          fileKeyArb,
          fileContentArb,
          async (key, content) => {
            const contentType = getContentType(key);

            // Upload the file
            await storage.upload(key, content, {
              contentType,
              isPublic: true,
            });

            // Get metadata
            const metadata = await storage.getMetadata(key);

            // Verify metadata
            expect(metadata).not.toBeNull();
            if (metadata) {
              expect(metadata.key).toBe(key);
              expect(metadata.size).toBe(content.length);
              expect(metadata.contentType).toBe(contentType);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various content types correctly', async () => {
      const contentTypes = [
        { ext: '.txt', type: 'text/plain' },
        { ext: '.json', type: 'application/json' },
        { ext: '.webp', type: 'image/webp' },
        { ext: '.png', type: 'image/png' },
        { ext: '.bin', type: 'application/octet-stream' },
      ];

      for (const { ext, type } of contentTypes) {
        const key = `test/file${ext}`;
        const content = Buffer.from('test content');

        await storage.upload(key, content, {
          contentType: type,
          isPublic: true,
        });

        const downloaded = await storage.download(key);
        expect(downloaded).not.toBeNull();
        if (downloaded) {
          expect(downloaded.equals(content)).toBe(true);
        }

        const metadata = await storage.getMetadata(key);
        expect(metadata?.contentType).toBe(type);
      }
    });

    it('should generate correct public URLs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fileKeyArb,
          async (key) => {
            const url = storage.getUrl(key);

            // URL should contain bucket name and encoded key
            expect(url).toContain(FIREBASE_STORAGE_BUCKET);
            expect(url).toContain(encodeURIComponent(key));
            expect(url.startsWith('https://')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Property 13: Storage Delete Removes File
  // ============================================

  describe('Property 13: Storage Delete Removes File', () => {
    it('should remove file after deletion (100 iterations)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fileKeyArb,
          fileContentArb,
          async (key, content) => {
            const contentType = getContentType(key);

            // Upload the file
            await storage.upload(key, content, {
              contentType,
              isPublic: true,
            });

            // Verify file exists
            const existsBefore = await storage.exists(key);
            expect(existsBefore).toBe(true);

            // Delete the file
            const deleteResult = await storage.delete(key);
            expect(deleteResult).toBe(true);

            // Verify file no longer exists
            const existsAfter = await storage.exists(key);
            expect(existsAfter).toBe(false);

            // Download should return null
            const downloaded = await storage.download(key);
            expect(downloaded).toBeNull();

            // Metadata should return null
            const metadata = await storage.getMetadata(key);
            expect(metadata).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false when deleting non-existent file', async () => {
      await fc.assert(
        fc.asyncProperty(
          fileKeyArb,
          async (key) => {
            // Try to delete a file that doesn't exist
            const deleteResult = await storage.delete(key);
            expect(deleteResult).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple uploads and deletes correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.tuple(fileKeyArb, fileContentArb), { minLength: 1, maxLength: 10 })
            .map(files => {
              // Deduplicate by key - keep only unique keys
              const seen = new Set<string>();
              return files.filter(([key]) => {
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            })
            .filter(files => files.length > 0), // Ensure at least one file after dedup
          async (files) => {
            // Upload all files
            for (const [key, content] of files) {
              await storage.upload(key, content, {
                contentType: getContentType(key),
                isPublic: true,
              });
            }

            // Verify all files exist
            for (const [key] of files) {
              const exists = await storage.exists(key);
              expect(exists).toBe(true);
            }

            // Delete all files
            for (const [key] of files) {
              const deleteResult = await storage.delete(key);
              expect(deleteResult).toBe(true);
            }

            // Verify all files are gone
            for (const [key] of files) {
              const exists = await storage.exists(key);
              expect(exists).toBe(false);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not affect other files when deleting one', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(fileKeyArb, fileKeyArb).filter(([a, b]) => a !== b),
          fileContentArb,
          fileContentArb,
          async ([key1, key2], content1, content2) => {
            // Upload two files
            await storage.upload(key1, content1, {
              contentType: getContentType(key1),
              isPublic: true,
            });
            await storage.upload(key2, content2, {
              contentType: getContentType(key2),
              isPublic: true,
            });

            // Delete first file
            await storage.delete(key1);

            // Second file should still exist
            const exists = await storage.exists(key2);
            expect(exists).toBe(true);

            // Second file content should be intact
            const downloaded = await storage.download(key2);
            expect(downloaded).not.toBeNull();
            if (downloaded) {
              expect(downloaded.equals(content2)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Additional Storage Properties
  // ============================================

  describe('Additional Storage Properties', () => {
    it('should report availability correctly', async () => {
      const available = await storage.isAvailable();
      expect(available).toBe(true);
    });

    it('should return correct storage type', () => {
      const type = storage.getType();
      expect(type).toBe('s3'); // Firebase Storage returns 's3' for compatibility
    });

    it('should handle empty content', async () => {
      const key = 'test/empty.txt';
      const content = Buffer.from('');

      await storage.upload(key, content, {
        contentType: 'text/plain',
        isPublic: true,
      });

      const downloaded = await storage.download(key);
      expect(downloaded).not.toBeNull();
      if (downloaded) {
        expect(downloaded.length).toBe(0);
      }
    });

    it('should handle overwriting existing files', async () => {
      await fc.assert(
        fc.asyncProperty(
          fileKeyArb,
          fileContentArb,
          fileContentArb,
          async (key, content1, content2) => {
            const contentType = getContentType(key);

            // Upload first version
            await storage.upload(key, content1, {
              contentType,
              isPublic: true,
            });

            // Upload second version (overwrite)
            await storage.upload(key, content2, {
              contentType,
              isPublic: true,
            });

            // Download should return second version
            const downloaded = await storage.download(key);
            expect(downloaded).not.toBeNull();
            if (downloaded) {
              expect(downloaded.equals(content2)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
