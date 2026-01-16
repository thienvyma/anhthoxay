/**
 * Blog Firestore Routes
 * 
 * Routes for blog posts, categories, and comments using Firestore backend.
 * Includes public endpoints and admin management endpoints.
 * 
 * @module routes/firestore/blog.firestore.routes
 * @requirements 3.3
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { firebaseAuth, requireRole, getCurrentUid } from '../../middleware/firebase-auth.middleware';
import { validate, validateQuery, getValidatedBody, getValidatedQuery } from '../../middleware/validation';
import { rateLimiter } from '../../middleware/rate-limiter';
import { cache } from '../../middleware/cache';
import {
  getBlogCategoryFirestoreService,
  getBlogPostFirestoreService,
  getBlogCommentFirestoreService,
  BlogFirestoreError,
} from '../../services/firestore/blog.firestore';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';
import { logger } from '../../utils/logger';

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
  featuredImage: z.string().optional().transform(val => (!val || val === '') ? undefined : val),
  categoryId: z.string().min(1, 'Chọn danh mục'),
  tags: z.union([
    z.string().max(200).optional().transform(val => val ? val.split(',').map(t => t.trim()) : undefined),
    z.array(z.string()).optional(),
  ]),
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
  isFeatured: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  search: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
});

/**
 * Schema for creating a blog comment
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
 * Schema for updating comment status
 */
const UpdateCommentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    message: 'Trạng thái phải là APPROVED hoặc REJECTED',
  }),
});

/**
 * Schema for filtering comments
 */
const CommentFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  postId: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
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
// PUBLIC ROUTES
// ============================================

/**
 * Create public blog routes
 */
export function createBlogFirestoreRoutes() {
  const app = new Hono();
  const categoryService = getBlogCategoryFirestoreService();
  const postService = getBlogPostFirestoreService();
  const commentService = getBlogCommentFirestoreService();

  // ============================================
  // CATEGORY ROUTES (Public)
  // ============================================

  /**
   * @route GET /blog/categories
   * @description Get all blog categories
   * @access Public
   */
  app.get('/categories', async (c) => {
    try {
      const categories = await categoryService.getAllCategories();
      return successResponse(c, categories);
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  // ============================================
  // POST ROUTES (Public)
  // ============================================

  /**
   * @route GET /blog/posts
   * @description Get published blog posts with optional filtering
   * @access Public
   * @cache 5 minutes
   */
  app.get('/posts', cache({ ttl: 300, keyPrefix: 'cache:blog:posts' }), validateQuery(BlogPostFilterSchema), async (c) => {
    try {
      const filter = getValidatedQuery<BlogPostFilter>(c);
      
      // Public endpoint only shows published posts
      const result = await postService.getPublishedPosts({
        categoryId: filter.categoryId,
        isFeatured: filter.isFeatured,
        search: filter.search,
        page: filter.page,
        limit: filter.limit,
      });

      return paginatedResponse(c, result.data, {
        total: result.total || 0,
        page: filter.page || 1,
        limit: filter.limit || 20,
      });
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route GET /blog/posts/featured
   * @description Get featured blog posts
   * @access Public
   */
  app.get('/posts/featured', async (c) => {
    try {
      const limit = parseInt(c.req.query('limit') || '5', 10);
      const posts = await postService.getFeaturedPosts(limit);
      return successResponse(c, posts);
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
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
      const post = await postService.getBySlug(slug);

      if (!post) {
        return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
      }

      // Only show published posts publicly
      if (post.status !== 'PUBLISHED') {
        return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
      }

      // Get approved comments
      const comments = await commentService.getApprovedComments(post.id);

      return successResponse(c, { ...post, comments });
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  // ============================================
  // COMMENT ROUTES (Public)
  // ============================================

  /**
   * @route POST /blog/posts/:postId/comments
   * @description Submit a new comment on a blog post
   * @access Public (rate limited)
   */
  app.post(
    '/posts/:postId/comments',
    rateLimiter({ maxAttempts: 5, windowMs: 60 * 1000 }),
    validate(CreateCommentSchema),
    async (c) => {
      try {
        const postId = c.req.param('postId');
        const body = getValidatedBody<CreateCommentInput>(c);

        // Check if post exists and is published
        const post = await postService.getById(postId);
        if (!post || post.status !== 'PUBLISHED') {
          return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
        }

        const comment = await commentService.createComment({
          postId,
          name: body.name,
          email: body.email,
          content: body.content,
        });

        return successResponse(c, comment, 201);
      } catch (error) {
        if (error instanceof BlogFirestoreError) {
          return errorResponse(c, error.code, error.message, error.statusCode);
        }
        throw error;
      }
    }
  );

  /**
   * @route GET /blog/posts/:postId/comments
   * @description Get approved comments for a blog post
   * @access Public
   */
  app.get('/posts/:postId/comments', async (c) => {
    try {
      const postId = c.req.param('postId');

      // Check if post exists
      const post = await postService.getById(postId);
      if (!post) {
        return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
      }

      const comments = await commentService.getApprovedComments(postId);
      return successResponse(c, comments);
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  return app;
}

// ============================================
// ADMIN/MANAGER ROUTES
// ============================================

/**
 * Create admin blog routes
 */
export function createAdminBlogFirestoreRoutes() {
  const app = new Hono();
  const categoryService = getBlogCategoryFirestoreService();
  const postService = getBlogPostFirestoreService();
  const commentService = getBlogCommentFirestoreService();

  // All routes require authentication and ADMIN or MANAGER role
  app.use('/*', firebaseAuth(), requireRole('ADMIN', 'MANAGER'));

  // ============================================
  // CATEGORY ROUTES (Admin)
  // ============================================

  /**
   * @route POST /admin/blog/categories
   * @description Create a new blog category
   * @access Admin, Manager
   */
  app.post('/categories', validate(CreateBlogCategorySchema), async (c) => {
    try {
      const body = getValidatedBody<CreateBlogCategoryInput>(c);
      const category = await categoryService.createCategory(body);

      logger.info('Blog category created', { id: category.id, slug: body.slug });
      return successResponse(c, category, 201);
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route PUT /admin/blog/categories/:id
   * @description Update a blog category
   * @access Admin, Manager
   */
  app.put('/categories/:id', validate(UpdateBlogCategorySchema), async (c) => {
    try {
      const id = c.req.param('id');
      const body = getValidatedBody<UpdateBlogCategoryInput>(c);
      const category = await categoryService.updateCategory(id, body);

      logger.info('Blog category updated', { id });
      return successResponse(c, category);
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route DELETE /admin/blog/categories/:id
   * @description Delete a blog category
   * @access Admin, Manager
   */
  app.delete('/categories/:id', async (c) => {
    try {
      const id = c.req.param('id');
      await categoryService.deleteCategory(id, postService);

      logger.info('Blog category deleted', { id });
      return successResponse(c, { ok: true });
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  // ============================================
  // POST ROUTES (Admin)
  // ============================================

  /**
   * @route GET /admin/blog/posts
   * @description Get all blog posts with filtering (including drafts)
   * @access Admin, Manager
   */
  app.get('/posts', validateQuery(BlogPostFilterSchema), async (c) => {
    try {
      const filter = getValidatedQuery<BlogPostFilter>(c);
      const result = await postService.getPosts({
        status: filter.status,
        categoryId: filter.categoryId,
        isFeatured: filter.isFeatured,
        search: filter.search,
        page: filter.page,
        limit: filter.limit,
      });

      return paginatedResponse(c, result.data, {
        total: result.total || 0,
        page: filter.page || 1,
        limit: filter.limit || 20,
      });
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route GET /admin/blog/posts/:id
   * @description Get a single blog post by ID (admin view)
   * @access Admin, Manager
   */
  app.get('/posts/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const post = await postService.getById(id);

      if (!post) {
        return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
      }

      // Get all comments (not just approved)
      const comments = await commentService.getCommentsForPost(id);

      return successResponse(c, { ...post, comments });
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route POST /admin/blog/posts
   * @description Create a new blog post
   * @access Admin, Manager
   */
  app.post('/posts', validate(CreateBlogPostSchema), async (c) => {
    try {
      const body = getValidatedBody<CreateBlogPostInput>(c);
      const authorId = getCurrentUid(c);

      const post = await postService.createPost({
        ...body,
        authorId,
        tags: Array.isArray(body.tags) ? body.tags : body.tags ? [body.tags] : undefined,
      });

      logger.info('Blog post created', { id: post.id, slug: body.slug, authorId });
      return successResponse(c, post, 201);
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route PUT /admin/blog/posts/:id
   * @description Update a blog post
   * @access Admin, Manager
   */
  app.put('/posts/:id', validate(UpdateBlogPostSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const body = getValidatedBody<UpdateBlogPostInput>(c);

      const post = await postService.updatePost(id, {
        ...body,
        tags: Array.isArray(body.tags) ? body.tags : body.tags ? [body.tags] : undefined,
      });

      logger.info('Blog post updated', { id });
      return successResponse(c, post);
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route DELETE /admin/blog/posts/:id
   * @description Delete a blog post and its comments
   * @access Admin, Manager
   */
  app.delete('/posts/:id', async (c) => {
    try {
      const id = c.req.param('id');
      await postService.deletePost(id, commentService);

      logger.info('Blog post deleted', { id });
      return successResponse(c, { ok: true });
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  // ============================================
  // COMMENT ROUTES (Admin)
  // ============================================

  /**
   * @route GET /admin/blog/comments
   * @description List all comments with optional filtering
   * @access Admin, Manager
   */
  app.get('/comments', validateQuery(CommentFilterSchema), async (c) => {
    try {
      const filter = getValidatedQuery<CommentFilter>(c);
      const result = await commentService.getAllComments({
        status: filter.status,
        postId: filter.postId,
        page: filter.page,
        limit: filter.limit,
      });

      return paginatedResponse(c, result.data, {
        total: result.total || 0,
        page: filter.page || 1,
        limit: filter.limit || 20,
      });
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route PUT /admin/blog/comments/:id/status
   * @description Approve or reject a comment
   * @access Admin, Manager
   */
  app.put('/comments/:id/status', validate(UpdateCommentStatusSchema), async (c) => {
    try {
      const commentId = c.req.param('id');
      const body = getValidatedBody<UpdateCommentStatusInput>(c);

      // Find the comment to get its postId
      const commentResult = await commentService.getCommentById(commentId);
      if (!commentResult) {
        return errorResponse(c, 'NOT_FOUND', 'Comment not found', 404);
      }

      const comment = await commentService.updateCommentStatus(
        commentResult.postId,
        commentId,
        body.status
      );

      logger.info('Comment status updated', { id: commentId, status: body.status });
      return successResponse(c, comment);
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  /**
   * @route DELETE /admin/blog/comments/:id
   * @description Delete a comment
   * @access Admin, Manager
   */
  app.delete('/comments/:id', async (c) => {
    try {
      const commentId = c.req.param('id');

      // Find the comment to get its postId
      const commentResult = await commentService.getCommentById(commentId);
      if (!commentResult) {
        return errorResponse(c, 'NOT_FOUND', 'Comment not found', 404);
      }

      await commentService.deleteComment(commentResult.postId, commentId);

      logger.info('Comment deleted', { id: commentId });
      return successResponse(c, { ok: true });
    } catch (error) {
      if (error instanceof BlogFirestoreError) {
        return errorResponse(c, error.code, error.message, error.statusCode);
      }
      throw error;
    }
  });

  return app;
}
