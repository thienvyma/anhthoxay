/**
 * Media Routes Module
 * 
 * Handles media asset operations including upload, retrieval, and deletion.
 * Supports image optimization with Sharp and tracks media usage across the system.
 * Uses content-hash based filenames for CDN cache busting.
 * 
 * **Feature: api-refactoring, high-traffic-resilience**
 * **Requirements: 1.1, 1.2, 1.3, 2.3, 3.5, 6.1, 6.2**
 * 
 * **UPDATED**: Now uses storage abstraction for S3/R2/Local support
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';
import { generateContentHashFilename } from '../utils/content-hash';
import { getStorage, getStorageType } from '../services/storage';
import { logger } from '../utils/logger';

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
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'webp': return 'image/webp';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls': return 'application/vnd.ms-excel';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
}

// ============================================
// MEDIA ROUTES FACTORY
// ============================================

/**
 * Create media routes with dependency injection
 */
export function createMediaRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);
  
  // Get storage instance (S3/R2 or Local based on env)
  const storage = getStorage();
  const storageType = getStorageType();
  
  logger.info('Media routes initialized', { storageType });


  // ============================================
  // MEDIA LIST & UPLOAD ROUTES
  // ============================================

  /**
   * @route GET /media
   * @description Get all gallery media assets
   * @access Admin, Manager
   */
  app.get('/', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const media = await prisma.mediaAsset.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return successResponse(c, media);
    } catch {
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get media', 500);
    }
  });

  /**
   * @route POST /media
   * @description Upload a new media file for gallery (creates MediaAsset record)
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
        
        // Generate content-hash based filename for cache busting
        const { filename } = generateContentHashFilename(optimized, {
          mimeType: 'image/webp',
          originalFilename: file.name,
        });
        
        // Upload to storage (S3/R2 or Local)
        await storage.upload(filename, optimized, {
          contentType: 'image/webp',
          cacheControl: 'public, max-age=31536000, immutable',
          isPublic: true,
        });
        
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

      // Non-image files - use content hash
      const { filename } = generateContentHashFilename(buffer, {
        mimeType,
        originalFilename: file.name,
      });
      
      // Upload to storage
      await storage.upload(filename, buffer, {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable',
        isPublic: true,
      });
      
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
      logger.error('Upload failed', { error: error instanceof Error ? error.message : 'Unknown' });
      return errorResponse(c, 'INTERNAL_ERROR', 'Upload failed', 500);
    }
  });


  /**
   * @route POST /media/upload-file
   * @description Upload file only (NO MediaAsset record) - for furniture, materials, etc.
   * @access Admin, Manager
   */
  app.post('/upload-file', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const body = await c.req.parseBody();
      const file = body.file as UploadedFile | undefined;
      
      if (!file) {
        return errorResponse(c, 'VALIDATION_ERROR', 'File is required', 400);
      }

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

      const mimeType = file.type || 'application/octet-stream';

      // Optimize images to WebP
      if (mimeType.startsWith('image/')) {
        const optimized = await sharp(buffer).webp({ quality: 85 }).toBuffer();
        const metadata = await sharp(buffer).metadata();
        
        const { filename } = generateContentHashFilename(optimized, {
          mimeType: 'image/webp',
          originalFilename: file.name,
        });
        
        await storage.upload(filename, optimized, {
          contentType: 'image/webp',
          cacheControl: 'public, max-age=31536000, immutable',
          isPublic: true,
        });
        
        return successResponse(c, {
          url: `/media/${filename}`,
          mimeType: 'image/webp',
          width: metadata.width || null,
          height: metadata.height || null,
          size: optimized.length,
        }, 201);
      }

      const { filename } = generateContentHashFilename(buffer, {
        mimeType,
        originalFilename: file.name,
      });
      
      await storage.upload(filename, buffer, {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable',
        isPublic: true,
      });
      
      return successResponse(c, {
        url: `/media/${filename}`,
        mimeType,
        size: buffer.length,
      }, 201);
    } catch (error) {
      logger.error('Upload file failed', { error: error instanceof Error ? error.message : 'Unknown' });
      return errorResponse(c, 'INTERNAL_ERROR', 'Upload failed', 500);
    }
  });

  /**
   * @route POST /media/user-upload
   * @description Upload a file for authenticated users (NO MediaAsset record)
   * @access Authenticated users (CONTRACTOR, HOMEOWNER, ADMIN, MANAGER)
   */
  app.post('/user-upload', authenticate(), async (c) => {
    try {
      const body = await c.req.parseBody();
      const file = body.file as UploadedFile | undefined;
      
      if (!file) {
        return errorResponse(c, 'VALIDATION_ERROR', 'File is required', 400);
      }

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

      // Limit file size to 10MB for user uploads
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (buffer.length > MAX_FILE_SIZE) {
        return errorResponse(c, 'VALIDATION_ERROR', 'File size exceeds 10MB limit', 400);
      }

      const id = crypto.randomUUID();
      const mimeType = file.type || 'application/octet-stream';

      // Optimize images to WebP
      if (mimeType.startsWith('image/')) {
        const optimized = await sharp(buffer).webp({ quality: 85 }).toBuffer();
        const metadata = await sharp(buffer).metadata();
        const filename = `${id}.webp`;
        
        await storage.upload(filename, optimized, {
          contentType: 'image/webp',
          cacheControl: 'public, max-age=31536000',
          isPublic: true,
        });
        
        return successResponse(c, {
          url: `/media/${filename}`,
          mimeType: 'image/webp',
          width: metadata.width || null,
          height: metadata.height || null,
          size: optimized.length,
        }, 201);
      }

      // Non-image files (PDF, DOC, etc.)
      const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
      const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
      if (!allowedExtensions.includes(ext)) {
        return errorResponse(c, 'VALIDATION_ERROR', 'File type not allowed. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT', 400);
      }
      
      const filename = `${id}.${ext}`;
      
      await storage.upload(filename, buffer, {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000',
        isPublic: true,
      });
      
      return successResponse(c, {
        url: `/media/${filename}`,
        mimeType,
        size: buffer.length,
      }, 201);
    } catch (error) {
      logger.error('User upload failed', { error: error instanceof Error ? error.message : 'Unknown' });
      return errorResponse(c, 'INTERNAL_ERROR', 'Upload failed', 500);
    }
  });


  // ============================================
  // MEDIA METADATA UPDATE ROUTE
  // ============================================

  /**
   * @route PUT /media/:id
   * @description Update media metadata (alt, caption, tags, isFeatured)
   * @access Admin, Manager
   */
  app.put('/:id', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      
      const asset = await prisma.mediaAsset.findUnique({ where: { id } });
      if (!asset) {
        return errorResponse(c, 'NOT_FOUND', 'Media asset not found', 404);
      }

      const updated = await prisma.mediaAsset.update({
        where: { id },
        data: {
          alt: body.alt !== undefined ? body.alt : asset.alt,
          caption: body.caption !== undefined ? body.caption : asset.caption,
          tags: body.tags !== undefined ? body.tags : asset.tags,
          isFeatured: body.isFeatured !== undefined ? body.isFeatured : asset.isFeatured,
          isActive: body.isActive !== undefined ? body.isActive : asset.isActive,
          displayOrder: body.displayOrder !== undefined ? body.displayOrder : asset.displayOrder,
        },
      });

      return successResponse(c, updated);
    } catch (error) {
      logger.error('Update media error', { error: error instanceof Error ? error.message : 'Unknown' });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update media', 500);
    }
  });

  // ============================================
  // FEATURED & GALLERY ROUTES (for landing page sections)
  // ============================================

  /**
   * @route GET /media/featured
   * @description Get all featured media for slideshow (public)
   * @access Public
   */
  app.get('/featured', async (c) => {
    try {
      const featured = await prisma.mediaAsset.findMany({
        where: { isFeatured: true, isActive: true },
        orderBy: { displayOrder: 'asc' },
      });
      return successResponse(c, featured);
    } catch (error) {
      logger.error('Get featured error', { error: error instanceof Error ? error.message : 'Unknown' });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get featured media', 500);
    }
  });

  /**
   * @route GET /media/gallery
   * @description Get all media for gallery with pagination (public)
   * @access Public
   */
  app.get('/gallery', async (c) => {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '12');
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        prisma.mediaAsset.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.mediaAsset.count({ where: { isActive: true } }),
      ]);

      return successResponse(c, {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Get gallery error', { error: error instanceof Error ? error.message : 'Unknown' });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get gallery', 500);
    }
  });


  // ============================================
  // MEDIA FILE SERVING & DELETE ROUTES
  // ============================================

  /**
   * @route GET /media/:filename
   * @description Serve a media file by filename
   * @access Public
   * 
   * For S3/R2 storage: redirects to CDN URL
   * For Local storage: serves file directly
   */
  app.get('/:filename', async (c) => {
    try {
      const filename = c.req.param('filename');
      
      // For S3/R2 storage, redirect to public URL
      if (storageType !== 'local') {
        const publicUrl = storage.getUrl(filename);
        return c.redirect(publicUrl, 302);
      }
      
      // For local storage, serve file directly
      const buffer = await storage.download(filename);
      
      if (!buffer) {
        return errorResponse(c, 'NOT_FOUND', 'File not found', 404);
      }

      const contentType = getMimeType(filename);

      return new Response(new Uint8Array(buffer), {
        headers: { 
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (error) {
      logger.error('Get file error', { error: error instanceof Error ? error.message : 'Unknown' });
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

      // Delete file from storage
      const filename = asset.url.split('/').pop();
      if (!filename) {
        return errorResponse(c, 'INTERNAL_ERROR', 'Invalid media URL format', 500);
      }
      
      await storage.delete(filename);

      // Delete from database
      await prisma.mediaAsset.delete({ where: { id } });

      return successResponse(c, { ok: true });
    } catch (error) {
      logger.error('Delete media error', { error: error instanceof Error ? error.message : 'Unknown' });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete media', 500);
    }
  });

  /**
   * @route GET /media/storage/status
   * @description Get storage status and type
   * @access Admin
   */
  app.get('/storage/status', authenticate(), requireRole('ADMIN'), async (c) => {
    try {
      const isAvailable = await storage.isAvailable();
      
      return successResponse(c, {
        type: storageType,
        isAvailable,
        isSharedStorage: storageType !== 'local',
      });
    } catch (error) {
      logger.error('Storage status error', { error: error instanceof Error ? error.message : 'Unknown' });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get storage status', 500);
    }
  });

  return app;
}

export default { createMediaRoutes };
