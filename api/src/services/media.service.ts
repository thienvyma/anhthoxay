/**
 * Media Service Module
 *
 * Handles business logic for media asset operations including upload,
 * deletion, sync, and usage tracking. Separates data access and
 * business logic from HTTP handling.
 *
 * **Feature: api-refactoring**
 * **Requirements: 2.1, 2.2, 2.3**
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

export interface SyncResult {
  message: string;
  totalFound: number;
  alreadyExists: number;
  created: number;
}

export interface MediaUsageInfo {
  usedIn: string[];
  count: number;
}

export interface MediaUsageResult {
  usage: Record<string, MediaUsageInfo>;
  summary: {
    total: number;
    materials: number;
    blog: number;
    sections: number;
    unused: number;
  };
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
 * Normalize media URL - extract just the /media/xxx part
 * @param url - Full or relative URL
 * @returns Normalized URL or null
 */
export function normalizeMediaUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/media\/[^"'\s?#]+/);
  return match ? match[0] : null;
}

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

  // ============================================
  // SYNC & USAGE TRACKING
  // ============================================

  /**
   * Sync media - scan all images in DB and create MediaAsset if not exists
   */
  async syncMedia(): Promise<SyncResult> {
    const allUrls = new Set<string>();

    // Collect URLs from Materials
    const materials = await this.prisma.material.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true },
    });
    materials.forEach((m) => {
      const url = normalizeMediaUrl(m.imageUrl);
      if (url) allUrls.add(url);
    });

    // Collect URLs from Blog Posts
    const blogPosts = await this.prisma.blogPost.findMany({
      where: { featuredImage: { not: null } },
      select: { featuredImage: true },
    });
    blogPosts.forEach((b) => {
      const url = normalizeMediaUrl(b.featuredImage);
      if (url) allUrls.add(url);
    });

    // Collect URLs from Sections
    const sections = await this.prisma.section.findMany();
    sections.forEach((s) => {
      const dataStr = typeof s.data === 'string' ? s.data : JSON.stringify(s.data);
      const urlMatches = dataStr.match(/\/media\/[^"'\s?#]+/g) || [];
      urlMatches.forEach((url) => allUrls.add(url));
    });

    // Get existing media URLs
    const existingMedia = await this.prisma.mediaAsset.findMany({ select: { url: true } });
    const existingUrls = new Set(
      existingMedia.map((m) => normalizeMediaUrl(m.url)).filter(Boolean)
    );

    // Find missing URLs and create MediaAsset
    const missingUrls = [...allUrls].filter((url) => !existingUrls.has(url));
    let created = 0;

    for (const url of missingUrls) {
      const filename = url.replace('/media/', '');
      const filePath = path.join(this.mediaDir, filename);

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        let width: number | null = null;
        let height: number | null = null;

        try {
          const metadata = await sharp(filePath).metadata();
          width = metadata.width || null;
          height = metadata.height || null;
        } catch {
          // Not an image or can't read metadata
        }

        await this.prisma.mediaAsset.create({
          data: {
            url,
            alt: filename.replace(/\.[^.]+$/, '').replace(/-/g, ' '),
            mimeType: getMimeType(filename),
            width,
            height,
            size: stats.size,
          },
        });
        created++;
      }
    }

    return {
      message: `Synced ${created} new media files`,
      totalFound: allUrls.size,
      alreadyExists: existingUrls.size,
      created,
    };
  }

  /**
   * Track where images are used across the system
   */
  async getMediaUsage(): Promise<MediaUsageResult> {
    // Get all media
    const allMedia = await this.prisma.mediaAsset.findMany();

    // Get materials with images - normalize URLs
    const materials = await this.prisma.material.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true },
    });
    const materialUrls = new Set(
      materials.map((m) => normalizeMediaUrl(m.imageUrl)).filter(Boolean) as string[]
    );

    // Get blog posts with featured images - normalize URLs
    const blogPosts = await this.prisma.blogPost.findMany({
      where: { featuredImage: { not: null } },
      select: { featuredImage: true },
    });
    const blogUrls = new Set(
      blogPosts.map((b) => normalizeMediaUrl(b.featuredImage)).filter(Boolean) as string[]
    );

    // Get sections with images in data
    const sections = await this.prisma.section.findMany();
    const sectionUrls = new Set<string>();
    sections.forEach((s) => {
      const dataStr = typeof s.data === 'string' ? s.data : JSON.stringify(s.data);
      const urlMatches = dataStr.match(/\/media\/[^"'\s?#]+/g) || [];
      urlMatches.forEach((url) => sectionUrls.add(url));
    });

    // Categorize media
    const usage: Record<string, MediaUsageInfo> = {};

    allMedia.forEach((media) => {
      const normalizedUrl = normalizeMediaUrl(media.url);
      const usedIn: string[] = [];

      if (normalizedUrl && materialUrls.has(normalizedUrl)) {
        usedIn.push('materials');
      }
      if (normalizedUrl && blogUrls.has(normalizedUrl)) {
        usedIn.push('blog');
      }
      if (normalizedUrl && sectionUrls.has(normalizedUrl)) {
        usedIn.push('sections');
      }

      usage[media.id] = { usedIn, count: usedIn.length };
    });

    return {
      usage,
      summary: {
        total: allMedia.length,
        materials: allMedia.filter((m) => usage[m.id]?.usedIn.includes('materials')).length,
        blog: allMedia.filter((m) => usage[m.id]?.usedIn.includes('blog')).length,
        sections: allMedia.filter((m) => usage[m.id]?.usedIn.includes('sections')).length,
        unused: allMedia.filter((m) => usage[m.id]?.count === 0).length,
      },
    };
  }
}
