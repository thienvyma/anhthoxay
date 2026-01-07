/**
 * Local Filesystem Storage Implementation
 *
 * Stores files on the local filesystem.
 * Used for development and single-instance deployments.
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 1.5**
 */

import fs from 'fs';
import path from 'path';
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
// LOCAL STORAGE IMPLEMENTATION
// ============================================

export class LocalStorage implements IStorage {
  private baseDir: string;
  private baseUrl: string;

  /**
   * Create a local storage instance
   *
   * @param baseDir - Base directory for file storage
   * @param baseUrl - Base URL for file access (e.g., '/media')
   */
  constructor(baseDir?: string, baseUrl?: string) {
    this.baseDir = baseDir || path.resolve(process.cwd(), process.env.MEDIA_DIR || '.media');
    this.baseUrl = baseUrl || '/media';
    this.ensureDirectory(this.baseDir);
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Get full file path
   */
  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal
    const sanitizedKey = key.replace(/\.\./g, '').replace(/^\/+/, '');
    return path.join(this.baseDir, sanitizedKey);
  }

  /**
   * Get metadata file path
   */
  private getMetadataPath(key: string): string {
    return `${this.getFilePath(key)}.meta.json`;
  }

  async upload(key: string, data: Buffer, options: UploadOptions): Promise<StorageFile> {
    const filePath = this.getFilePath(key);
    const metadataPath = this.getMetadataPath(key);

    try {
      // Ensure parent directory exists
      const dir = path.dirname(filePath);
      this.ensureDirectory(dir);

      // Write file
      fs.writeFileSync(filePath, data);

      // Write metadata
      const metadata = {
        contentType: options.contentType,
        size: data.length,
        uploadedAt: new Date().toISOString(),
        cacheControl: options.cacheControl,
        customMetadata: options.metadata,
      };
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      logger.debug('File uploaded to local storage', { key, size: data.length });

      return {
        key,
        url: this.getUrl(key),
        size: data.length,
        contentType: options.contentType,
        lastModified: new Date(),
        metadata: options.metadata,
      };
    } catch (error) {
      logger.error('Failed to upload file to local storage', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new StorageError('UPLOAD_FAILED', `Failed to upload file: ${key}`);
    }
  }

  async download(key: string): Promise<Buffer | null> {
    const filePath = this.getFilePath(key);

    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return fs.readFileSync(filePath);
    } catch (error) {
      logger.error('Failed to download file from local storage', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    const metadataPath = this.getMetadataPath(key);

    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      fs.unlinkSync(filePath);

      // Also delete metadata file if exists
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
      }

      logger.debug('File deleted from local storage', { key });
      return true;
    } catch (error) {
      logger.error('Failed to delete file from local storage', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    return fs.existsSync(filePath);
  }

  async getMetadata(key: string): Promise<StorageFile | null> {
    const filePath = this.getFilePath(key);
    const metadataPath = this.getMetadataPath(key);

    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const stats = fs.statSync(filePath);
      let contentType = 'application/octet-stream';
      let customMetadata: Record<string, string> | undefined;

      // Read metadata file if exists
      if (fs.existsSync(metadataPath)) {
        const metaContent = fs.readFileSync(metadataPath, 'utf-8');
        const meta = JSON.parse(metaContent);
        contentType = meta.contentType || contentType;
        customMetadata = meta.customMetadata;
      }

      return {
        key,
        url: this.getUrl(key),
        size: stats.size,
        contentType,
        lastModified: stats.mtime,
        metadata: customMetadata,
      };
    } catch (error) {
      logger.error('Failed to get file metadata from local storage', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async list(options?: ListOptions): Promise<ListResult> {
    const prefix = options?.prefix || '';
    const maxKeys = options?.maxKeys || 1000;

    try {
      const files: StorageFile[] = [];
      const searchDir = prefix ? path.join(this.baseDir, prefix) : this.baseDir;

      if (!fs.existsSync(searchDir)) {
        return { files: [], isTruncated: false };
      }

      const entries = this.listFilesRecursive(searchDir, this.baseDir);

      for (const entry of entries) {
        if (files.length >= maxKeys) {
          return {
            files,
            isTruncated: true,
            nextContinuationToken: entry,
          };
        }

        // Skip metadata files
        if (entry.endsWith('.meta.json')) {
          continue;
        }

        const metadata = await this.getMetadata(entry);
        if (metadata) {
          files.push(metadata);
        }
      }

      return { files, isTruncated: false };
    } catch (error) {
      logger.error('Failed to list files from local storage', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { files: [], isTruncated: false };
    }
  }

  /**
   * Recursively list files in directory
   */
  private listFilesRecursive(dir: string, baseDir: string): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        files.push(...this.listFilesRecursive(fullPath, baseDir));
      } else {
        files.push(relativePath.replace(/\\/g, '/'));
      }
    }

    return files;
  }

  getUrl(key: string): string {
    // Ensure key starts with /
    const normalizedKey = key.startsWith('/') ? key : `/${key}`;
    return `${this.baseUrl}${normalizedKey}`;
  }

  getType(): 'local' {
    return 'local';
  }

  async isAvailable(): Promise<boolean> {
    try {
      this.ensureDirectory(this.baseDir);
      // Try to write and delete a test file
      const testFile = path.join(this.baseDir, '.storage-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return true;
    } catch {
      return false;
    }
  }
}
