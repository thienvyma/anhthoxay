/**
 * Media Routes Module
 * 
 * Handles media asset operations including upload, retrieval, and deletion.
 * Supports image optimization with Sharp and tracks media usage across the system.
 * Uses content-hash based filenames for CDN cache busting.
 * 
 * **Feature: api-refactoring, high-traffic-resilience**
 * **Requirements: 1.1, 1.2, 1.3, 2.3, 3.5, 6.1, 6.2**
 */

import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createAuthMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';
import { generateContentHashFilename } from '../utils/content-hash';

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
   * 
   * **Feature: high-traffic-resilience**
   * **Requirements: 2.3** - Uses content hash for cache busting
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
        // **Requirements: 2.3**
        const { filename } = generateContentHashFilename(optimized, {
          mimeType: 'image/webp',
          originalFilename: file.name,
        });
        
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

      // Non-image files - use content hash
      const { filename } = generateContentHashFilename(buffer, {
        mimeType,
        originalFilename: file.name,
      });
      
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
    } catch {
      return errorResponse(c, 'INTERNAL_ERROR', 'Upload failed', 500);
    }
  });

  /**
   * @route POST /media/upload-file
   * @description Upload file only (NO MediaAsset record) - for furniture, materials, etc.
   * @access Admin, Manager
   * 
   * **Feature: high-traffic-resilience**
   * **Requirements: 2.3** - Uses content hash for cache busting
   */
  app.post('/upload-file', authenticate(), requireRole('ADMIN', 'MANAGER'), async (c) => {
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

      const mimeType = file.type || 'application/octet-stream';

      // Optimize images to WebP
      if (mimeType.startsWith('image/')) {
        const optimized = await sharp(buffer).webp({ quality: 85 }).toBuffer();
        const metadata = await sharp(buffer).metadata();
        
        // Generate content-hash based filename for cache busting
        // **Requirements: 2.3**
        const { filename } = generateContentHashFilename(optimized, {
          mimeType: 'image/webp',
          originalFilename: file.name,
        });
        
        fs.writeFileSync(path.join(resolvedMediaDir, filename), optimized);
        
        // Return URL only, no MediaAsset record
        return successResponse(c, {
          url: `/media/${filename}`,
          mimeType: 'image/webp',
          width: metadata.width || null,
          height: metadata.height || null,
          size: optimized.length,
        }, 201);
      }

      // Non-image files - use content hash
      const { filename } = generateContentHashFilename(buffer, {
        mimeType,
        originalFilename: file.name,
      });
      
      fs.writeFileSync(path.join(resolvedMediaDir, filename), buffer);
      
      return successResponse(c, {
        url: `/media/${filename}`,
        mimeType,
        size: buffer.length,
      }, 201);
    } catch {
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

      // Limit file size to 10MB for user uploads
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
        
        fs.writeFileSync(path.join(resolvedMediaDir, filename), optimized);
        
        // Return URL only, no MediaAsset record
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
      
      fs.writeFileSync(path.join(resolvedMediaDir, filename), buffer);
      
      // Return URL only, no MediaAsset record
      return successResponse(c, {
        url: `/media/${filename}`,
        mimeType,
        size: buffer.length,
      }, 201);
    } catch {
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
      console.error('Update media error:', error);
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
      console.error('Get featured error:', error);
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
      console.error('Get gallery error:', error);
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
      const filename = asset.url.split('/').pop();
      if (!filename) {
        return errorResponse(c, 'INTERNAL_ERROR', 'Invalid media URL format', 500);
      }
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
