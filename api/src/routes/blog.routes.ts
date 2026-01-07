/**
 * Blog Routes Module
 * 
 * Handles CRUD operations for blog posts, categories, and comments.
 * Blog posts support drafts, publishing, and categorization.
 * Comments support moderation workflow (PENDING -> APPROVED/REJECTED).
 * 
 * **Feature: api-refactoring, security-hardening**
 * **Requirements: 1.1, 1.2, 1.3, 3.5, 5.1, 6.1, 6.2, 4.1-4.8**
 */

import { Hono } from 'hono';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { createAuthMiddleware, getUser } from '../middleware/auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/response';
import { rateLimiter } from '../middleware/rate-limiter';
import { cache } from '../middleware/cache';

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Schema for creating a blog category
 */
const CreateBlogCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được trống').max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang'),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Mã màu không hợp lệ').optional(),
});

/**
 * Schema for updating a blog category
 */
const UpdateBlogCategorySchema = CreateBlogCategorySchema.partial();

/**
 * Schema for creating a blog post
 */
const CreateBlogPostSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được trống').max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang'),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1, 'Nội dung không được trống'),
  featuredImage: z.string().optional().transform(val => (!val || val === '') ? null : val),
  categoryId: z.string().min(1, 'Chọn danh mục'),
  tags: z.string().max(200).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  isFeatured: z.boolean().default(false),
});

/**
 * Schema for updating a blog post
 */
const UpdateBlogPostSchema = CreateBlogPostSchema.partial();

/**
 * Schema for filtering blog posts
 */
const BlogPostFilterSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.string().optional(),
});

// ============================================
// COMMENT SCHEMAS
// ============================================

/**
 * Schema for creating a blog comment
 * 
 * **Feature: security-hardening**
 * **Validates: Requirements 4.1, 4.2**
 */
const CreateCommentSchema = z.object({
  name: z.string()
    .min(1, 'Tên không được trống')
    .max(100, 'Tên tối đa 100 ký tự')
    .refine(s => s.trim().length > 0, 'Tên không được chỉ chứa khoảng trắng'),
  email: z.string().email('Email không hợp lệ'),
  content: z.string()
    .min(1, 'Nội dung không được trống')
    .max(2000, 'Nội dung tối đa 2000 ký tự')
    .refine(s => s.trim().length > 0, 'Nội dung không được chỉ chứa khoảng trắng'),
});

/**
 * Schema for updating comment status (approve/reject)
 * 
 * **Feature: security-hardening**
 * **Validates: Requirements 4.4, 4.5**
 */
const UpdateCommentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    message: 'Trạng thái phải là APPROVED hoặc REJECTED',
  }),
});

/**
 * Schema for filtering comments (admin listing)
 * 
 * **Feature: security-hardening**
 * **Validates: Requirements 4.7**
 */
const CommentFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  postId: z.string().optional(),
});

// ============================================
// TYPES
// ============================================

type CreateBlogCategoryInput = z.infer<typeof CreateBlogCategorySchema>;
type UpdateBlogCategoryInput = z.infer<typeof UpdateBlogCategorySchema>;
type CreateBlogPostInput = z.infer<typeof CreateBlogPostSchema>;
type UpdateBlogPostInput = z.infer<typeof UpdateBlogPostSchema>;
type BlogPostFilter = z.infer<typeof BlogPostFilterSchema>;
type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
type UpdateCommentStatusInput = z.infer<typeof UpdateCommentStatusSchema>;
type CommentFilter = z.infer<typeof CommentFilterSchema>;

// ============================================
// BLOG ROUTES FACTORY
// ============================================

/**
 * Create blog routes with dependency injection
 * @param prisma - Prisma client instance
 * @returns Hono app with blog routes
 */
export function createBlogRoutes(prisma: PrismaClient) {
  const app = new Hono();
  const { authenticate, requireRole } = createAuthMiddleware(prisma);

  // ============================================
  // CATEGORY ROUTES
  // ============================================

  /**
   * @route GET /blog/categories
   * @description Get all blog categories with post count
   * @access Public
   */
  app.get('/categories', async (c) => {
    try {
      const categories = await prisma.blogCategory.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } },
      });
      return successResponse(c, categories);
    } catch (error) {
      console.error('Get blog categories error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get blog categories', 500);
    }
  });

  /**
   * @route POST /blog/categories
   * @description Create a new blog category
   * @access Admin, Manager
   */
  app.post(
    '/categories',
    authenticate(),
    requireRole('ADMIN', 'MANAGER'),
    validate(CreateBlogCategorySchema),
    async (c) => {
      try {
        const body = getValidatedBody<CreateBlogCategoryInput>(c);

        const category = await prisma.blogCategory.create({
          data: body,
        });

        return successResponse(c, category, 201);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            return errorResponse(c, 'CONFLICT', 'Category with this slug already exists', 409);
          }
        }
        console.error('Create blog category error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create blog category', 500);
      }
    }
  );

  /**
   * @route PUT /blog/categories/:id
   * @description Update a blog category
   * @access Admin, Manager
   */
  app.put(
    '/categories/:id',
    authenticate(),
    requireRole('ADMIN', 'MANAGER'),
    validate(UpdateBlogCategorySchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const body = getValidatedBody<UpdateBlogCategoryInput>(c);

        const category = await prisma.blogCategory.update({
          where: { id },
          data: body,
        });

        return successResponse(c, category);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return errorResponse(c, 'NOT_FOUND', 'Category not found', 404);
          }
          if (error.code === 'P2002') {
            return errorResponse(c, 'CONFLICT', 'Category with this slug already exists', 409);
          }
        }
        console.error('Update blog category error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update blog category', 500);
      }
    }
  );

  /**
   * @route DELETE /blog/categories/:id
   * @description Delete a blog category
   * @access Admin, Manager
   */
  app.delete(
    '/categories/:id',
    authenticate(),
    requireRole('ADMIN', 'MANAGER'),
    async (c) => {
      try {
        const id = c.req.param('id');

        // Check if category has posts
        const postCount = await prisma.blogPost.count({ where: { categoryId: id } });
        if (postCount > 0) {
          return errorResponse(
            c,
            'CONFLICT',
            'Không thể xóa danh mục đang có bài viết',
            409
          );
        }

        await prisma.blogCategory.delete({ where: { id } });

        return successResponse(c, { ok: true });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return errorResponse(c, 'NOT_FOUND', 'Category not found', 404);
          }
        }
        console.error('Delete blog category error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete blog category', 500);
      }
    }
  );

  // ============================================
  // POST ROUTES
  // ============================================

  /**
   * @route GET /blog/posts
   * @description Get all blog posts with optional filtering
   * @access Public
   * @cache 5 minutes
   * @query status - Filter by status (DRAFT, PUBLISHED, ARCHIVED)
   * @query categoryId - Filter by category ID
   */
  app.get('/posts', cache({ ttl: 300, keyPrefix: 'cache:blog:posts' }), validateQuery(BlogPostFilterSchema), async (c) => {
    try {
      const filter = getValidatedQuery<BlogPostFilter>(c);
      const where: Prisma.BlogPostWhereInput = {};

      if (filter.status) {
        where.status = filter.status;
      }
      if (filter.categoryId) {
        where.categoryId = filter.categoryId;
      }

      const posts = await prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          author: { select: { name: true } },
          _count: { select: { comments: true } },
        },
      });

      return successResponse(c, posts);
    } catch (error) {
      console.error('Get blog posts error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get blog posts', 500);
    }
  });

  /**
   * @route GET /blog/posts/:slug
   * @description Get a single blog post by slug
   * @access Public
   */
  app.get('/posts/:slug', async (c) => {
    try {
      const slug = c.req.param('slug');

      const post = await prisma.blogPost.findUnique({
        where: { slug },
        include: {
          category: true,
          author: { select: { name: true, email: true } },
          comments: { where: { status: 'APPROVED' } },
          _count: { select: { comments: true } },
        },
      });

      if (!post) {
        return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
      }

      return successResponse(c, post);
    } catch (error) {
      console.error('Get blog post error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get blog post', 500);
    }
  });

  /**
   * @route POST /blog/posts
   * @description Create a new blog post
   * @access Admin, Manager
   */
  app.post(
    '/posts',
    authenticate(),
    requireRole('ADMIN', 'MANAGER'),
    validate(CreateBlogPostSchema),
    async (c) => {
      try {
        const body = getValidatedBody<CreateBlogPostInput>(c);
        const user = getUser(c);

        const post = await prisma.blogPost.create({
          data: {
            ...body,
            authorId: user.sub,
            publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
          },
        });

        return successResponse(c, post, 201);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            return errorResponse(c, 'CONFLICT', 'Post with this slug already exists', 409);
          }
          if (error.code === 'P2003') {
            return errorResponse(c, 'VALIDATION_ERROR', 'Invalid category ID', 400);
          }
        }
        console.error('Create blog post error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create blog post', 500);
      }
    }
  );

  /**
   * @route PUT /blog/posts/:id
   * @description Update a blog post
   * @access Admin, Manager
   */
  app.put(
    '/posts/:id',
    authenticate(),
    requireRole('ADMIN', 'MANAGER'),
    validate(UpdateBlogPostSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const body = getValidatedBody<UpdateBlogPostInput>(c);

        // Get current post to check status change
        const currentPost = await prisma.blogPost.findUnique({
          where: { id },
          select: { status: true, publishedAt: true },
        });

        if (!currentPost) {
          return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
        }

        // Set publishedAt when status changes to PUBLISHED
        const updateData: Prisma.BlogPostUpdateInput = { ...body };
        if (body.status === 'PUBLISHED' && currentPost.status !== 'PUBLISHED' && !currentPost.publishedAt) {
          updateData.publishedAt = new Date();
        }

        const post = await prisma.blogPost.update({
          where: { id },
          data: updateData,
        });

        return successResponse(c, post);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
          }
          if (error.code === 'P2002') {
            return errorResponse(c, 'CONFLICT', 'Post with this slug already exists', 409);
          }
          if (error.code === 'P2003') {
            return errorResponse(c, 'VALIDATION_ERROR', 'Invalid category ID', 400);
          }
        }
        console.error('Update blog post error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update blog post', 500);
      }
    }
  );

  /**
   * @route DELETE /blog/posts/:id
   * @description Delete a blog post and its comments
   * @access Admin, Manager
   */
  app.delete(
    '/posts/:id',
    authenticate(),
    requireRole('ADMIN', 'MANAGER'),
    async (c) => {
      try {
        const id = c.req.param('id');

        // Delete comments first, then post
        await prisma.blogComment.deleteMany({ where: { postId: id } });
        await prisma.blogPost.delete({ where: { id } });

        return successResponse(c, { ok: true });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
          }
        }
        console.error('Delete blog post error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete blog post', 500);
      }
    }
  );

  // ============================================
  // COMMENT ROUTES - PUBLIC
  // ============================================

  /**
   * @route POST /blog/posts/:postId/comments
   * @description Submit a new comment on a blog post
   * @access Public (rate limited)
   * 
   * **Feature: security-hardening**
   * **Validates: Requirements 4.1, 4.3, 4.8**
   */
  app.post(
    '/posts/:postId/comments',
    rateLimiter({ maxAttempts: 5, windowMs: 60 * 1000 }), // 5 comments per minute
    validate(CreateCommentSchema),
    async (c) => {
      try {
        const postId = c.req.param('postId');
        const body = getValidatedBody<CreateCommentInput>(c);

        // Check if post exists
        const post = await prisma.blogPost.findUnique({
          where: { id: postId },
          select: { id: true },
        });

        if (!post) {
          return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
        }

        // Create comment with PENDING status
        const comment = await prisma.blogComment.create({
          data: {
            postId,
            name: body.name,
            email: body.email,
            content: body.content,
            status: 'PENDING',
          },
        });

        return successResponse(c, comment, 201);
      } catch (error) {
        console.error('Create blog comment error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to create comment', 500);
      }
    }
  );

  /**
   * @route GET /blog/posts/:postId/comments
   * @description Get approved comments for a blog post
   * @access Public
   * 
   * **Feature: security-hardening**
   * **Validates: Requirements 4.6**
   */
  app.get('/posts/:postId/comments', async (c) => {
    try {
      const postId = c.req.param('postId');

      // Check if post exists
      const post = await prisma.blogPost.findUnique({
        where: { id: postId },
        select: { id: true },
      });

      if (!post) {
        return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
      }

      // Only return APPROVED comments for public access
      const comments = await prisma.blogComment.findMany({
        where: {
          postId,
          status: 'APPROVED',
        },
        orderBy: { createdAt: 'desc' },
      });

      return successResponse(c, comments);
    } catch (error) {
      console.error('Get blog comments error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get comments', 500);
    }
  });

  // ============================================
  // COMMENT ROUTES - ADMIN/MANAGER
  // ============================================

  /**
   * @route GET /blog/comments
   * @description List all comments with optional filtering
   * @access Admin, Manager
   * 
   * **Feature: security-hardening**
   * **Validates: Requirements 4.7**
   */
  app.get(
    '/comments',
    authenticate(),
    requireRole('ADMIN', 'MANAGER'),
    validateQuery(CommentFilterSchema),
    async (c) => {
      try {
        const filter = getValidatedQuery<CommentFilter>(c);
        const where: Prisma.BlogCommentWhereInput = {};

        if (filter.status) {
          where.status = filter.status;
        }
        if (filter.postId) {
          where.postId = filter.postId;
        }

        const comments = await prisma.blogComment.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            post: {
              select: { id: true, title: true, slug: true },
            },
          },
        });

        return successResponse(c, comments);
      } catch (error) {
        console.error('List blog comments error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list comments', 500);
      }
    }
  );

  /**
   * @route PUT /blog/comments/:id/status
   * @description Approve or reject a comment
   * @access Admin, Manager
   * 
   * **Feature: security-hardening**
   * **Validates: Requirements 4.4, 4.5**
   */
  app.put(
    '/comments/:id/status',
    authenticate(),
    requireRole('ADMIN', 'MANAGER'),
    validate(UpdateCommentStatusSchema),
    async (c) => {
      try {
        const id = c.req.param('id');
        const body = getValidatedBody<UpdateCommentStatusInput>(c);

        const comment = await prisma.blogComment.update({
          where: { id },
          data: { status: body.status },
        });

        return successResponse(c, comment);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return errorResponse(c, 'NOT_FOUND', 'Comment not found', 404);
          }
        }
        console.error('Update comment status error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to update comment status', 500);
      }
    }
  );

  /**
   * @route DELETE /blog/comments/:id
   * @description Delete a comment
   * @access Admin, Manager
   * 
   * **Feature: security-hardening**
   * **Validates: Requirements 4.4, 4.5**
   */
  app.delete(
    '/comments/:id',
    authenticate(),
    requireRole('ADMIN', 'MANAGER'),
    async (c) => {
      try {
        const id = c.req.param('id');

        await prisma.blogComment.delete({ where: { id } });

        return successResponse(c, { ok: true });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return errorResponse(c, 'NOT_FOUND', 'Comment not found', 404);
          }
        }
        console.error('Delete comment error:', error);
        return errorResponse(c, 'INTERNAL_ERROR', 'Failed to delete comment', 500);
      }
    }
  );

  return app;
}

export default { createBlogRoutes };
