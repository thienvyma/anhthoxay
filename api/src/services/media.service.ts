/**
 * Media Service Module
 *
 * Handles business logic for media asset operations including upload,
 * deletion, and file serving. Separates data access and business logic
 * from HTTP handling.
 *
 * **Feature: media-gallery-isolation**
 * **Requirements: 1.1, 1.2, 1.3**
 */

import { PrismaClient, MediaAsset } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

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
    default:
      return 'application/octet-stream';
  }
}

// ============================================
// MEDIA SERVICE CLASS
// ============================================

export class MediaService {
  private mediaDir: string;

  constructor(
    private prisma: PrismaClient,
    mediaDir?: string
  ) {
    this.mediaDir = mediaDir || path.resolve(process.cwd(), process.env.MEDIA_DIR || '.media');
    this.ensureMediaDir();
  }

  /**
   * Ensure media directory exists
   */
  private ensureMediaDir(): void {
    if (!fs.existsSync(this.mediaDir)) {
      fs.mkdirSync(this.mediaDir, { recursive: true });
    }
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
   */
  async uploadMedia(input: UploadFileInput): Promise<UploadResult> {
    const { buffer, mimeType, filename } = input;
    const id = crypto.randomUUID();

    // Optimize images to WebP
    if (mimeType.startsWith('image/')) {
      const optimized = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      const metadata = await sharp(buffer).metadata();
      const webpFilename = `${id}.webp`;

      fs.writeFileSync(path.join(this.mediaDir, webpFilename), optimized);

      const asset = await this.prisma.mediaAsset.create({
        data: {
          id,
          url: `/media/${webpFilename}`,
          mimeType: 'image/webp',
          width: metadata.width || null,
          height: metadata.height || null,
          size: optimized.length,
        },
      });

      return { asset };
    }

    // Non-image files
    const ext = (filename?.split('.').pop() || 'bin').toLowerCase();
    const savedFilename = `${id}.${ext}`;

    fs.writeFileSync(path.join(this.mediaDir, savedFilename), buffer);

    const asset = await this.prisma.mediaAsset.create({
      data: {
        id,
        url: `/media/${savedFilename}`,
        mimeType,
        size: buffer.length,
      },
    });

    return { asset };
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

    // Delete file from disk
    const filename = asset.url.split('/').pop() as string;
    const filePath = path.join(this.mediaDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await this.prisma.mediaAsset.delete({ where: { id } });
  }


  // ============================================
  // FILE SERVING
  // ============================================

  /**
   * Get file buffer and content type by filename
   * @throws MediaServiceError if file not found
   */
  getFile(filename: string): { buffer: Buffer; contentType: string } {
    const filePath = path.join(this.mediaDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new MediaServiceError('NOT_FOUND', 'File not found', 404);
    }

    const buffer = fs.readFileSync(filePath);
    const contentType = getMimeType(filename);

    return { buffer, contentType };
  }
}
