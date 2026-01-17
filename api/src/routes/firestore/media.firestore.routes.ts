/**
 * Media Routes (Firestore/Firebase Storage)
 * 
 * Handles media asset operations using Firebase Storage.
 * 
 * @module routes/firestore/media
 */

import { Hono } from 'hono';
import sharp from 'sharp';
import { firebaseAuth, requireRole, getCurrentUid } from '../../middleware/firebase-auth.middleware';
import { successResponse, errorResponse } from '../../utils/response';
import { generateContentHashFilename } from '../../utils/content-hash';
import { FirebaseStorage } from '../../services/storage/firebase.storage';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

interface UploadedFile {
  arrayBuffer?: () => Promise<ArrayBuffer>;
  buffer?: ArrayBuffer;
  type?: string;
  name?: string;
}

export type MediaFolder = 
  | 'blog'
  | 'portfolio'
  | 'projects'
  | 'documents'
  | 'avatars'
  | 'products'
  | 'gallery'
  | 'temp';

const VALID_FOLDERS: MediaFolder[] = ['blog', 'portfolio', 'projects', 'documents', 'avatars', 'products', 'gallery', 'temp'];

// ============================================
// MEDIA ROUTES
// ============================================

export function createMediaFirestoreRoutes() {
  const app = new Hono();
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'noithatnhanh-f8f72.appspot.com';
  const storage = new FirebaseStorage({ bucketName });

  // ============================================
  // POST /media/upload - Upload media file
  // ============================================
  app.post('/upload', firebaseAuth(), async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as UploadedFile | null;
      const folder = (formData.get('folder') as MediaFolder) || 'gallery';
      const alt = formData.get('alt') as string | null;

      if (!file) {
        return errorResponse(c, 'VALIDATION_ERROR', 'No file provided', 400);
      }

      if (!VALID_FOLDERS.includes(folder)) {
        return errorResponse(c, 'VALIDATION_ERROR', `Invalid folder. Must be one of: ${VALID_FOLDERS.join(', ')}`, 400);
      }

      // Get file buffer
      let buffer: Buffer;
      if (file.arrayBuffer) {
        buffer = Buffer.from(await file.arrayBuffer());
      } else if (file.buffer) {
        buffer = Buffer.from(file.buffer);
      } else {
        return errorResponse(c, 'VALIDATION_ERROR', 'Invalid file format', 400);
      }

      const contentType = file.type || 'application/octet-stream';
      const originalName = file.name || 'file';

      // Generate content-hash filename
      const filename = generateContentHashFilename(buffer, { originalFilename: originalName });
      const path = `${folder}/${filename}`;

      // Optimize images
      let finalBuffer = buffer;
      let finalContentType = contentType;

      if (contentType.startsWith('image/') && !contentType.includes('svg')) {
        try {
          const image = sharp(buffer);
          const metadata = await image.metadata();

          // Resize if too large
          if (metadata.width && metadata.width > 2000) {
            finalBuffer = await image
              .resize(2000, undefined, { withoutEnlargement: true })
              .webp({ quality: 85 })
              .toBuffer();
            finalContentType = 'image/webp';
          } else {
            finalBuffer = await image.webp({ quality: 85 }).toBuffer();
            finalContentType = 'image/webp';
          }
        } catch (err) {
          logger.warn('Image optimization failed, using original', { error: err });
        }
      }

      // Upload to Firebase Storage
      const result = await storage.upload(path, finalBuffer, {
        contentType: finalContentType,
        metadata: {
          originalName,
          folder,
          alt: alt || '',
          uploadedBy: getCurrentUid(c),
        },
      });

      return successResponse(c, {
        id: path,
        url: result.url,
        filename,
        folder,
        contentType: finalContentType,
        size: finalBuffer.length,
        alt: alt || '',
      }, 201);
    } catch (error) {
      logger.error('Upload failed', { error });
      return errorResponse(c, 'UPLOAD_ERROR', 'Failed to upload file', 500);
    }
  });

  // ============================================
  // GET /media/:folder/:filename - Get media file URL
  // ============================================
  app.get('/:folder/:filename', async (c) => {
    try {
      const folder = c.req.param('folder');
      const filename = c.req.param('filename');
      const path = `${folder}/${filename}`;

      const exists = await storage.exists(path);
      if (!exists) {
        return errorResponse(c, 'NOT_FOUND', 'File not found', 404);
      }

      const url = await storage.getUrl(path);
      return successResponse(c, { url });
    } catch (error) {
      logger.error('Get file failed', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get file', 500);
    }
  });

  // ============================================
  // DELETE /media/:folder/:filename - Delete media file
  // ============================================
  app.delete('/:folder/:filename', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const folder = c.req.param('folder');
      const filename = c.req.param('filename');
      const path = `${folder}/${filename}`;

      await storage.delete(path);
      return successResponse(c, { message: 'File deleted successfully' });
    } catch (error) {
      logger.error('Delete file failed', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete file', 500);
    }
  });

  // ============================================
  // GET /media/list/:folder - List files in folder
  // ============================================
  app.get('/list/:folder', firebaseAuth(), async (c) => {
    try {
      const folder = c.req.param('folder') as MediaFolder;

      if (!VALID_FOLDERS.includes(folder)) {
        return errorResponse(c, 'VALIDATION_ERROR', 'Invalid folder', 400);
      }

      const result = await storage.list({ prefix: folder });
      return successResponse(c, { files: result.files });
    } catch (error) {
      logger.error('List files failed', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list files', 500);
    }
  });

  // ============================================
  // GET /media - List all media (method mismatch fix - frontend expects GET)
  // ============================================
  app.get('/', async (c) => {
    try {
      const result = await storage.list({ prefix: '' });
      return successResponse(c, { files: result.files });
    } catch (error) {
      logger.error('List all media failed', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list media', 500);
    }
  });

  // ============================================
  // POST /media - Upload media (method mismatch fix - frontend uses POST /media)
  // ============================================
  app.post('/', firebaseAuth(), async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as UploadedFile | null;
      const folder = (formData.get('folder') as MediaFolder) || 'gallery';
      const alt = formData.get('alt') as string | null;

      if (!file) {
        return errorResponse(c, 'VALIDATION_ERROR', 'No file provided', 400);
      }

      if (!VALID_FOLDERS.includes(folder)) {
        return errorResponse(c, 'VALIDATION_ERROR', `Invalid folder. Must be one of: ${VALID_FOLDERS.join(', ')}`, 400);
      }

      // Get file buffer
      let buffer: Buffer;
      if (file.arrayBuffer) {
        buffer = Buffer.from(await file.arrayBuffer());
      } else if (file.buffer) {
        buffer = Buffer.from(file.buffer);
      } else {
        return errorResponse(c, 'VALIDATION_ERROR', 'Invalid file format', 400);
      }

      const contentType = file.type || 'application/octet-stream';
      const originalName = file.name || 'file';

      // Generate content-hash filename
      const filename = generateContentHashFilename(buffer, { originalFilename: originalName });
      const path = `${folder}/${filename}`;

      // Optimize images
      let finalBuffer = buffer;
      let finalContentType = contentType;

      if (contentType.startsWith('image/') && !contentType.includes('svg')) {
        try {
          const image = sharp(buffer);
          const metadata = await image.metadata();

          // Resize if too large
          if (metadata.width && metadata.width > 2000) {
            finalBuffer = await image
              .resize(2000, undefined, { withoutEnlargement: true })
              .webp({ quality: 85 })
              .toBuffer();
            finalContentType = 'image/webp';
          } else {
            finalBuffer = await image.webp({ quality: 85 }).toBuffer();
            finalContentType = 'image/webp';
          }
        } catch (err) {
          logger.warn('Image optimization failed, using original', { error: err });
        }
      }

      // Upload to Firebase Storage
      const result = await storage.upload(path, finalBuffer, {
        contentType: finalContentType,
        metadata: {
          originalName,
          folder,
          alt: alt || '',
          uploadedBy: getCurrentUid(c),
        },
      });

      return successResponse(c, {
        id: path,
        url: result.url,
        filename,
        folder,
        contentType: finalContentType,
        size: finalBuffer.length,
        alt: alt || '',
      }, 201);
    } catch (error) {
      logger.error('Upload via POST /media failed', { error });
      return errorResponse(c, 'UPLOAD_ERROR', 'Failed to upload file', 500);
    }
  });

  // ============================================
  // POST /media/upload-file - Upload raw file without creating MediaAsset record
  // (handle frontend calls to /media/upload-file)
  // ============================================
  app.post('/upload-file', firebaseAuth(), async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as UploadedFile | null;
      const folder = (formData.get('folder') as MediaFolder) || 'gallery';

      if (!file) {
        return errorResponse(c, 'VALIDATION_ERROR', 'No file provided', 400);
      }

      if (!VALID_FOLDERS.includes(folder)) {
        return errorResponse(c, 'VALIDATION_ERROR', `Invalid folder. Must be one of: ${VALID_FOLDERS.join(', ')}`, 400);
      }

      // Get file buffer
      let buffer: Buffer;
      if (file.arrayBuffer) {
        buffer = Buffer.from(await file.arrayBuffer());
      } else if (file.buffer) {
        buffer = Buffer.from(file.buffer);
      } else {
        return errorResponse(c, 'VALIDATION_ERROR', 'Invalid file format', 400);
      }

      const contentType = file.type || 'application/octet-stream';
      const originalName = file.name || 'file';

      // Generate content-hash filename
      const filename = generateContentHashFilename(buffer, { originalFilename: originalName });
      const path = `${folder}/${filename}`;

      // Optimize images (same logic as upload)
      let finalBuffer = buffer;
      let finalContentType = contentType;

      if (contentType.startsWith('image/') && !contentType.includes('svg')) {
        try {
          const image = sharp(buffer);
          const metadata = await image.metadata();
          if (metadata.width && metadata.width > 2000) {
            finalBuffer = await image.resize(2000, undefined, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
            finalContentType = 'image/webp';
          } else {
            finalBuffer = await image.webp({ quality: 85 }).toBuffer();
            finalContentType = 'image/webp';
          }
        } catch (err) {
          logger.warn('Image optimization failed for upload-file, using original', { error: err });
        }
      }

      // Upload to Firebase Storage
      const result = await storage.upload(path, finalBuffer, {
        contentType: finalContentType,
        metadata: {
          originalName,
          folder,
          uploadedBy: getCurrentUid(c),
        },
      });

      return successResponse(c, {
        url: result.url,
        mimeType: finalContentType,
        width: undefined,
        height: undefined,
        size: finalBuffer.length,
      }, 201);
    } catch (error) {
      logger.error('Upload-file failed', { error });
      return errorResponse(c, 'UPLOAD_ERROR', 'Failed to upload file', 500);
    }
  });
  // ============================================
  // PUT /media/:param - Update media (method mismatch fix - frontend uses PUT for delete)
  // ============================================
  app.put('/:param', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      const param = c.req.param('param');
      // Assuming param is folder/filename format
      const pathParts = param.split('/');
      if (pathParts.length !== 2) {
        return errorResponse(c, 'VALIDATION_ERROR', 'Invalid path format', 400);
      }

      const [folder, filename] = pathParts;
      const path = `${folder}/${filename}`;

      await storage.delete(path);
      return successResponse(c, { message: 'File deleted successfully' });
    } catch (error) {
      logger.error('Delete via PUT /media/:param failed', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete file', 500);
    }
  });

  // ============================================
  // GET /media/featured - Get featured media (method mismatch fix)
  // ============================================
  app.get('/featured', async (c) => {
    try {
      // Return empty array for now - featured media logic can be implemented later
      return successResponse(c, { files: [] });
    } catch (error) {
      logger.error('Get featured media failed', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get featured media', 500);
    }
  });

  // ============================================
  // PUT /media/featured - Update featured media (method mismatch fix)
  // ============================================
  app.put('/featured', firebaseAuth(), requireRole('ADMIN', 'MANAGER'), async (c) => {
    try {
      // Placeholder for featured media update logic
      return successResponse(c, { message: 'Featured media updated' });
    } catch (error) {
      logger.error('Update featured media failed', { error });
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update featured media', 500);
    }
  });

  return app;
}

export const mediaFirestoreRoutes = createMediaFirestoreRoutes();
