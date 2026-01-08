/**
 * Media Service Module
 *
 * Handles business logic for media asset operations including upload,
 * deletion, and file serving. Uses IStorage abstraction for persistent storage.
 *
 * **Feature: media-gallery-isolation, high-traffic-resilience**
 * **Requirements: 1.1, 1.2, 1.3, 1.5**
 */

import { PrismaClient, MediaAsset } from '@prisma/client';
import sharp from 'sharp';
import { getStorage, IStorage, StorageError } from './storage';
import { logger } from '../utils/logger';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface UploadFileInput {
  buffer: Buffer;
  mimeType: string;
  filename?: string;
}

export interface UploadResult {
  asset: MediaAsset;
}

// ============================================
// ERROR CLASS
// ============================================

export class MediaServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.name = 'MediaServiceError';
    this.statusCode = statusCode;
  }
}


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get MIME type from file extension
 * @param filename - File name with extension
 * @returns MIME type string
 */
export function getMimeType(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'webp':
      return 'image/webp';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

// ============================================
// MEDIA SERVICE CLASS
// ============================================

export class MediaService {
  private storage: IStorage;

  constructor(
    private prisma: PrismaClient,
  ) {
    this.storage = getStorage();
    logger.info('MediaService initialized', { storageType: this.storage.getType() });
  }

  // ============================================
  // MEDIA CRUD OPERATIONS
  // ============================================

  /**
   * Get all media assets
   */
  async getAllMedia(): Promise<MediaAsset[]> {
    return this.prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a media asset by ID
   */
  async getMediaById(id: string): Promise<MediaAsset | null> {
    return this.prisma.mediaAsset.findUnique({ where: { id } });
  }

  /**
   * Upload a media file (images are optimized to WebP)
   * Files are stored in cloud storage (S3/R2) for persistence
   */
  async uploadMedia(input: UploadFileInput): Promise<UploadResult> {
    const { buffer, mimeType, filename } = input;
    const id = crypto.randomUUID();

    try {
      // Optimize images to WebP
      if (mimeType.startsWith('image/') && !mimeType.includes('svg')) {
        const optimized = await sharp(buffer).webp({ quality: 85 }).toBuffer();
        const metadata = await sharp(buffer).metadata();
        const webpFilename = `${id}.webp`;

        // Upload to cloud storage
        const storageFile = await this.storage.upload(webpFilename, optimized, {
          contentType: 'image/webp',
          isPublic: true,
          cacheControl: 'public, max-age=31536000', // 1 year cache
        });

        const asset = await this.prisma.mediaAsset.create({
          data: {
            id,
            url: storageFile.url,
            mimeType: 'image/webp',
            width: metadata.width || null,
            height: metadata.height || null,
            size: optimized.length,
          },
        });

        logger.info('Media uploaded', { id, type: 'image/webp', size: optimized.length });
        return { asset };
      }

      // Non-image files (or SVG)
      const ext = (filename?.split('.').pop() || 'bin').toLowerCase();
      const savedFilename = `${id}.${ext}`;

      // Upload to cloud storage
      const storageFile = await this.storage.upload(savedFilename, buffer, {
        contentType: mimeType,
        isPublic: true,
        cacheControl: 'public, max-age=31536000',
      });

      const asset = await this.prisma.mediaAsset.create({
        data: {
          id,
          url: storageFile.url,
          mimeType,
          size: buffer.length,
        },
      });

      logger.info('Media uploaded', { id, type: mimeType, size: buffer.length });
      return { asset };
    } catch (error) {
      logger.error('Media upload failed', { 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      if (error instanceof StorageError) {
        throw new MediaServiceError(error.code, error.message, error.statusCode);
      }
      throw new MediaServiceError('UPLOAD_FAILED', 'Failed to upload media', 500);
    }
  }

  /**
   * Delete a media asset by ID
   * @throws MediaServiceError if asset not found
   */
  async deleteMedia(id: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });

    if (!asset) {
      throw new MediaServiceError('NOT_FOUND', 'Media asset not found', 404);
    }

    try {
      // Extract filename from URL
      const filename = this.extractFilenameFromUrl(asset.url);
      
      if (filename) {
        // Delete from cloud storage
        await this.storage.delete(filename);
        logger.info('Media file deleted from storage', { id, filename });
      }

      // Delete from database
      await this.prisma.mediaAsset.delete({ where: { id } });
      logger.info('Media asset deleted', { id });
    } catch (error) {
      logger.error('Media delete failed', { 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Still delete from database even if storage delete fails
      await this.prisma.mediaAsset.delete({ where: { id } });
    }
  }

  /**
   * Extract filename from URL
   */
  private extractFilenameFromUrl(url: string): string | null {
    try {
      // Handle both full URLs and relative paths
      if (url.startsWith('/media/')) {
        return url.replace('/media/', '');
      }
      
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      return parts[parts.length - 1] || null;
    } catch {
      // If URL parsing fails, try to extract filename directly
      const parts = url.split('/');
      return parts[parts.length - 1] || null;
    }
  }

  // ============================================
  // FILE SERVING
  // ============================================

  /**
   * Get file buffer and content type by filename
   * Downloads from cloud storage
   * @throws MediaServiceError if file not found
   */
  async getFile(filename: string): Promise<{ buffer: Buffer; contentType: string }> {
    try {
      const buffer = await this.storage.download(filename);
      
      if (!buffer) {
        throw new MediaServiceError('NOT_FOUND', 'File not found', 404);
      }

      const contentType = getMimeType(filename);
      return { buffer, contentType };
    } catch (error) {
      if (error instanceof MediaServiceError) {
        throw error;
      }
      
      logger.error('File download failed', { 
        filename, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new MediaServiceError('NOT_FOUND', 'File not found', 404);
    }
  }

  /**
   * Get public URL for a file
   */
  getFileUrl(filename: string): string {
    return this.storage.getUrl(filename);
  }

  /**
   * Check if storage is available
   */
  async isStorageAvailable(): Promise<boolean> {
    return this.storage.isAvailable();
  }

  /**
   * Get storage type
   */
  getStorageType(): 'local' | 's3' | 'r2' {
    return this.storage.getType();
  }
}
