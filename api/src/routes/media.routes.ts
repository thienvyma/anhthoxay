/**
 * Media Routes Module
 * 
 * Handles media asset operations including upload, retrieval, and deletion.
 * Supports image optimization with Sharp and tracks media usage across the system.
 * 
 * **Feature: api-refactoring**
 * **Requirements: 1.1, 1.2, 1.3, 3.5, 6.1, 6.2**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';

// ============================================
// TYPES
// ============================================

interface UploadedFile {
  arrayBuffer?: () => Promise<ArrayBuffer>;
  buffer?: ArrayBuffer;
  type?: string;
  name?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize media URL - extract just the /media/xxx part
 * @param url - Full or relative URL
 * @returns Normalized URL or null
 */
function normalizeMediaUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/media\/[^"'\s?#]+/);
  return match ? match[0] : null;
}

/**
 * Get MIME type from file extension
 * @param filename - File name with extension
 * @returns MIME type string
 */
function getMimeType(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'webp': return 'image/webp';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    default: return 'application/octet-stream';
  }
}

// ============================================
// MEDIA ROUTES FACTORY
// ============================================

/**
 * Create media routes with dependency injection
 * @param prisma - Prisma client instance
 * @param mediaDir - Directory path for media storage
 * @returns Hono app with media routes
 */
export function createMediaRoutes(prisma: PrismaClient, mediaDir?: string) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  
  // Resolve media directory
  const resolvedMediaDir = mediaDir || path.resolve(process.cwd(), process.env.MEDIA_DIR || '.media');
  if (!fs.existsSync(resolvedMediaDir)) {
    fs.mkdirSync(resolvedMediaDir, { recursive: true });
  }


  // ============================================
  // MEDIA LIST & UPLOAD ROUTES
  // ============================================

  /**
   * @route GET /media
   * @description Get all media assets
   * @access Admin, Manager
   */
  app.get('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const media = await prisma.mediaAsset.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return successResponse(c, media);
    } catch (error) {
      console.error('Get media error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get media', 500);
    }
  });

  /**
   * @route POST /media
   * @description Upload a new media file (images are optimized to WebP)
   * @access Admin, Manager
   */
  app.post('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const body = await c.req.parseBody();
      const file = body.file as UploadedFile | undefined;
      
      if (!file) {
        return errorResponse(c, 'VALIDATION_ERROR', 'File is required', 400);
      }

      // Get buffer from file
      let buffer: Buffer;
      if (file.arrayBuffer) {
        buffer = Buffer.from(await file.arrayBuffer());
      } else if (Buffer.isBuffer(file)) {
        buffer = file;
      } else if (file.buffer) {
        buffer = Buffer.from(file.buffer);
      } else {
        return errorResponse(c, 'VALIDATION_ERROR', 'Unsupported file format', 400);
      }

      const id = crypto.randomUUID();
      const mimeType = file.type || 'application/octet-stream';

      // Optimize images to WebP
      if (mimeType.startsWith('image/')) {
        const optimized = await sharp(buffer).webp({ quality: 85 }).toBuffer();
        const metadata = await sharp(buffer).metadata();
        const filename = `${id}.webp`;
        
        fs.writeFileSync(path.join(resolvedMediaDir, filename), optimized);
        
        const asset = await prisma.mediaAsset.create({
          data: {
            id,
            url: `/media/${filename}`,
            mimeType: 'image/webp',
            width: metadata.width || null,
            height: metadata.height || null,
            size: optimized.length,
          },
        });
        
        return successResponse(c, asset, 201);
      }

      // Non-image files
      const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
      const filename = `${id}.${ext}`;
      
      fs.writeFileSync(path.join(resolvedMediaDir, filename), buffer);
      
      const asset = await prisma.mediaAsset.create({
        data: {
          id,
          url: `/media/${filename}`,
          mimeType,
          size: buffer.length,
        },
      });
      
      return successResponse(c, asset, 201);
    } catch (error) {
      console.error('Upload error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Upload failed', 500);
    }
  });

  // ============================================
  // MEDIA SYNC & USAGE ROUTES
  // ============================================

  /**
   * @route POST /media/sync
   * @description Sync media - scan all images in DB and create MediaAsset if not exists
   * @access Admin only
   */
  app.post('/sync', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const allUrls = new Set<string>();

      // Collect URLs from Materials
      const materials = await prisma.material.findMany({
        where: { imageUrl: { not: null } },
        select: { imageUrl: true },
      });
      materials.forEach((m) => {
        const url = normalizeMediaUrl(m.imageUrl);
        if (url) allUrls.add(url);
      });

      // Collect URLs from Blog Posts
      const blogPosts = await prisma.blogPost.findMany({
        where: { featuredImage: { not: null } },
        select: { featuredImage: true },
      });
      blogPosts.forEach((b) => {
        const url = normalizeMediaUrl(b.featuredImage);
        if (url) allUrls.add(url);
      });

      // Collect URLs from Sections
      const sections = await prisma.section.findMany();
      sections.forEach((s) => {
        const dataStr = typeof s.data === 'string' ? s.data : JSON.stringify(s.data);
        const urlMatches = dataStr.match(/\/media\/[^"'\s?#]+/g) || [];
        urlMatches.forEach((url) => allUrls.add(url));
      });

      // Get existing media URLs
      const existingMedia = await prisma.mediaAsset.findMany({ select: { url: true } });
      const existingUrls = new Set(
        existingMedia.map((m) => normalizeMediaUrl(m.url)).filter(Boolean)
      );

      // Find missing URLs and create MediaAsset
      const missingUrls = [...allUrls].filter((url) => !existingUrls.has(url));
      let created = 0;

      for (const url of missingUrls) {
        const filename = url.replace('/media/', '');
        const filePath = path.join(resolvedMediaDir, filename);

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

          await prisma.mediaAsset.create({
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

      return successResponse(c, {
        message: `Synced ${created} new media files`,
        totalFound: allUrls.size,
        alreadyExists: existingUrls.size,
        created,
      });
    } catch (error) {
      console.error('Media sync error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to sync media', 500);
    }
  });


  /**
   * @route GET /media/usage
   * @description Track where images are used across the system
   * @access Admin, Manager
   */
  app.get('/usage', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      // Get all media
      const allMedia = await prisma.mediaAsset.findMany();

      // Get materials with images - normalize URLs
      const materials = await prisma.material.findMany({
        where: { imageUrl: { not: null } },
        select: { imageUrl: true },
      });
      const materialUrls = new Set(
        materials.map((m) => normalizeMediaUrl(m.imageUrl)).filter(Boolean) as string[]
      );

      // Get blog posts with featured images - normalize URLs
      const blogPosts = await prisma.blogPost.findMany({
        where: { featuredImage: { not: null } },
        select: { featuredImage: true },
      });
      const blogUrls = new Set(
        blogPosts.map((b) => normalizeMediaUrl(b.featuredImage)).filter(Boolean) as string[]
      );

      // Get sections with images in data
      const sections = await prisma.section.findMany();
      const sectionUrls = new Set<string>();
      sections.forEach((s) => {
        const dataStr = typeof s.data === 'string' ? s.data : JSON.stringify(s.data);
        const urlMatches = dataStr.match(/\/media\/[^"'\s?#]+/g) || [];
        urlMatches.forEach((url) => sectionUrls.add(url));
      });

      // Categorize media
      const usage: Record<string, { usedIn: string[]; count: number }> = {};

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

      return successResponse(c, {
        usage,
        summary: {
          total: allMedia.length,
          materials: allMedia.filter((m) => usage[m.id]?.usedIn.includes('materials')).length,
          blog: allMedia.filter((m) => usage[m.id]?.usedIn.includes('blog')).length,
          sections: allMedia.filter((m) => usage[m.id]?.usedIn.includes('sections')).length,
          unused: allMedia.filter((m) => usage[m.id]?.count === 0).length,
        },
      });
    } catch (error) {
      console.error('Media usage error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get media usage', 500);
    }
  });

  // ============================================
  // MEDIA FILE SERVING & DELETE ROUTES
  // ============================================

  /**
   * @route GET /media/:filename
   * @description Serve a media file by filename
   * @access Public
   */
  app.get('/:filename', async (c) => {
    try {
      const filename = c.req.param('filename');
      const filePath = path.join(resolvedMediaDir, filename);

      if (!fs.existsSync(filePath)) {
        return errorResponse(c, 'NOT_FOUND', 'File not found', 404);
      }

      const buf = fs.readFileSync(filePath);
      const contentType = getMimeType(filename);

      return new Response(buf, {
        headers: { 'Content-Type': contentType },
      });
    } catch (error) {
      console.error('Get file error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get file', 500);
    }
  });

  /**
   * @route DELETE /media/:id
   * @description Delete a media asset by ID
   * @access Admin, Manager
   */
  app.delete('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      const asset = await prisma.mediaAsset.findUnique({ where: { id } });

      if (!asset) {
        return errorResponse(c, 'NOT_FOUND', 'Media asset not found', 404);
      }

      // Delete file from disk
      const filename = asset.url.split('/').pop() as string;
      const filePath = path.join(resolvedMediaDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      await prisma.mediaAsset.delete({ where: { id } });

      return successResponse(c, { ok: true });
    } catch (error) {
      console.error('Delete media error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete media', 500);
    }
  });

  return app;
}

export default { createMediaRoutes };
