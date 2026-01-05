/**
 * External API - Blog Routes
 *
 * API key authenticated routes for blog management
 */

import { Hono } from 'hono';
import { PrismaClient, Prisma } from '@prisma/client';
import { validateQuery, getValidatedQuery } from '../../middleware/validation';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/response';
import { BlogPostFilterSchema, BlogPostFilter } from './schemas';
import type { ApiKeyAuthFn } from './types';

/**
 * Create blog routes for external API
 */
export function createBlogRoutes(prisma: PrismaClient, apiKeyAuth: ApiKeyAuthFn) {
  const app = new Hono();

  /**
   * @route GET /blog/posts
   * @description Get blog posts via API key
   * @access API Key (blog permission required)
   */
  app.get('/posts', apiKeyAuth(), validateQuery(BlogPostFilterSchema), async (c) => {
    try {
      const { status, categoryId, page, limit } = getValidatedQuery<BlogPostFilter>(c);
      const skip = (page - 1) * limit;

      const where: Prisma.BlogPostWhereInput = {};

      if (status) {
        where.status = status;
      }
      if (categoryId) {
        where.categoryId = categoryId;
      }

      const [total, posts] = await Promise.all([
        prisma.blogPost.count({ where }),
        prisma.blogPost.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            category: true,
            author: { select: { name: true } },
          },
        }),
      ]);

      return paginatedResponse(c, posts, { total, page, limit });
    } catch (error) {
      console.error('External API - Get blog posts error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get blog posts', 500);
    }
  });

  /**
   * @route GET /blog/posts/:slug
   * @description Get a single blog post by slug via API key
   * @access API Key (blog permission required)
   */
  app.get('/posts/:slug', apiKeyAuth(), async (c) => {
    try {
      const slug = c.req.param('slug');

      const post = await prisma.blogPost.findUnique({
        where: { slug },
        include: {
          category: true,
          author: { select: { name: true } },
        },
      });

      if (!post) {
        return errorResponse(c, 'NOT_FOUND', 'Blog post not found', 404);
      }

      return successResponse(c, post);
    } catch (error) {
      console.error('External API - Get blog post error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get blog post', 500);
    }
  });

  /**
   * @route GET /blog/categories
   * @description Get blog categories via API key
   * @access API Key (blog permission required)
   */
  app.get('/categories', apiKeyAuth(), async (c) => {
    try {
      const categories = await prisma.blogCategory.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } },
      });
      return successResponse(c, categories);
    } catch (error) {
      console.error('External API - Get blog categories error:', error);
      return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get blog categories', 500);
    }
  });

  return app;
}
