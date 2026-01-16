/**
 * Blog Firestore Service
 * Handles blog posts, categories, and comments using Firestore
 * 
 * Collections:
 * - blogCategories/{categoryId}
 * - blogPosts/{postId}
 * - blogPosts/{postId}/comments/{commentId}
 * 
 * @module services/firestore/blog.firestore
 * @requirements 3.3
 */

import {
  BaseFirestoreService,
  SubcollectionFirestoreService,
  type QueryOptions,
  type PaginatedResult,
  type WhereClause,
} from './base.firestore';
import type {
  FirestoreBlogCategory,
  FirestoreBlogPost,
  FirestoreBlogComment,
  BlogPostStatus,
  BlogCommentStatus,
} from '../../types/firestore.types';
import { logger } from '../../utils/logger';

// ============================================
// ERROR CLASS
// ============================================

export class BlogFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'BlogFirestoreError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateBlogCategoryInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface UpdateBlogCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
}

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  categoryId: string;
  authorId: string;
  tags?: string[];
  status?: BlogPostStatus;
  isFeatured?: boolean;
}

export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  categoryId?: string;
  tags?: string[];
  status?: BlogPostStatus;
  isFeatured?: boolean;
}

export interface CreateBlogCommentInput {
  postId: string;
  name: string;
  email: string;
  content: string;
}

export interface BlogPostQueryParams {
  status?: BlogPostStatus;
  categoryId?: string;
  isFeatured?: boolean;
  authorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BlogCommentQueryParams {
  status?: BlogCommentStatus;
  postId?: string;
  page?: number;
  limit?: number;
}

// ============================================
// BLOG CATEGORY SERVICE
// ============================================

export class BlogCategoryFirestoreService extends BaseFirestoreService<FirestoreBlogCategory> {
  constructor() {
    super('blogCategories');
  }

  /**
   * Get all categories with optional post count
   */
  async getAllCategories(): Promise<FirestoreBlogCategory[]> {
    return this.query({
      orderBy: [{ field: 'name', direction: 'asc' }],
    });
  }

  /**
   * Get category by slug
   */
  async getBySlug(slug: string): Promise<FirestoreBlogCategory | null> {
    const categories = await this.query({
      where: [{ field: 'slug', operator: '==', value: slug }],
      limit: 1,
    });
    return categories.length > 0 ? categories[0] : null;
  }

  /**
   * Create a new category
   */
  async createCategory(input: CreateBlogCategoryInput): Promise<FirestoreBlogCategory> {
    // Check for duplicate slug
    const existing = await this.getBySlug(input.slug);
    if (existing) {
      throw new BlogFirestoreError('CONFLICT', 'Category with this slug already exists', 409);
    }

    const category = await this.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      color: input.color,
    });

    logger.info('Created blog category', { id: category.id, slug: input.slug });
    return category;
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, input: UpdateBlogCategoryInput): Promise<FirestoreBlogCategory> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new BlogFirestoreError('NOT_FOUND', 'Category not found', 404);
    }

    // Check for duplicate slug if changing
    if (input.slug && input.slug !== existing.slug) {
      const duplicate = await this.getBySlug(input.slug);
      if (duplicate) {
        throw new BlogFirestoreError('CONFLICT', 'Category with this slug already exists', 409);
      }
    }

    const updated = await this.update(id, input);
    logger.info('Updated blog category', { id });
    return updated;
  }

  /**
   * Delete a category (only if no posts)
   */
  async deleteCategory(id: string, postService: BlogPostFirestoreService): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new BlogFirestoreError('NOT_FOUND', 'Category not found', 404);
    }

    // Check if category has posts
    const postCount = await postService.countByCategory(id);
    if (postCount > 0) {
      throw new BlogFirestoreError('CONFLICT', 'Không thể xóa danh mục đang có bài viết', 409);
    }

    await this.delete(id);
    logger.info('Deleted blog category', { id });
  }
}

// ============================================
// BLOG POST SERVICE
// ============================================

export class BlogPostFirestoreService extends BaseFirestoreService<FirestoreBlogPost> {
  constructor() {
    super('blogPosts');
  }

  /**
   * Get post by slug
   */
  async getBySlug(slug: string): Promise<FirestoreBlogPost | null> {
    const posts = await this.query({
      where: [{ field: 'slug', operator: '==', value: slug }],
      limit: 1,
    });
    return posts.length > 0 ? posts[0] : null;
  }

  /**
   * Get posts with filtering and pagination
   */
  async getPosts(params: BlogPostQueryParams = {}): Promise<PaginatedResult<FirestoreBlogPost>> {
    const { status, categoryId, isFeatured, authorId, search, page = 1, limit = 20 } = params;

    const whereClause: WhereClause<FirestoreBlogPost>[] = [];

    if (status) {
      whereClause.push({ field: 'status', operator: '==', value: status });
    }

    if (categoryId) {
      whereClause.push({ field: 'categoryId', operator: '==', value: categoryId });
    }

    if (isFeatured !== undefined) {
      whereClause.push({ field: 'isFeatured', operator: '==', value: isFeatured });
    }

    if (authorId) {
      whereClause.push({ field: 'authorId', operator: '==', value: authorId });
    }

    // Use publishedAt for ordering when status filter is applied (matches Firestore index)
    // Otherwise use createdAt for general queries
    const orderByField = status ? 'publishedAt' : 'createdAt';
    
    const queryOptions: QueryOptions<FirestoreBlogPost> = {
      where: whereClause.length > 0 ? whereClause : undefined,
      orderBy: [{ field: orderByField, direction: 'desc' }],
    };

    // Get all matching posts
    let posts = await this.query(queryOptions);

    // Apply search filter (client-side since Firestore doesn't support full-text search)
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchLower)) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Calculate pagination
    const total = posts.length;
    const startIndex = (page - 1) * limit;
    const paginatedPosts = posts.slice(startIndex, startIndex + limit);

    return {
      data: paginatedPosts,
      hasMore: startIndex + limit < total,
      total,
    };
  }

  /**
   * Get published posts (for public access)
   */
  async getPublishedPosts(params: Omit<BlogPostQueryParams, 'status'> = {}): Promise<PaginatedResult<FirestoreBlogPost>> {
    return this.getPosts({ ...params, status: 'PUBLISHED' });
  }

  /**
   * Get featured posts
   */
  async getFeaturedPosts(limit = 5): Promise<FirestoreBlogPost[]> {
    return this.query({
      where: [
        { field: 'status', operator: '==', value: 'PUBLISHED' },
        { field: 'isFeatured', operator: '==', value: true },
      ],
      orderBy: [{ field: 'publishedAt', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Count posts by category
   */
  async countByCategory(categoryId: string): Promise<number> {
    return this.count({
      where: [{ field: 'categoryId', operator: '==', value: categoryId }],
    });
  }

  /**
   * Create a new post
   */
  async createPost(input: CreateBlogPostInput): Promise<FirestoreBlogPost> {
    // Check for duplicate slug
    const existing = await this.getBySlug(input.slug);
    if (existing) {
      throw new BlogFirestoreError('CONFLICT', 'Post with this slug already exists', 409);
    }

    const status = input.status || 'DRAFT';
    const publishedAt = status === 'PUBLISHED' ? new Date() : undefined;

    const post = await this.create({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      featuredImage: input.featuredImage,
      categoryId: input.categoryId,
      authorId: input.authorId,
      tags: input.tags,
      status,
      isFeatured: input.isFeatured || false,
      publishedAt,
    });

    logger.info('Created blog post', { id: post.id, slug: input.slug });
    return post;
  }

  /**
   * Update a post
   */
  async updatePost(id: string, input: UpdateBlogPostInput): Promise<FirestoreBlogPost> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new BlogFirestoreError('NOT_FOUND', 'Blog post not found', 404);
    }

    // Check for duplicate slug if changing
    if (input.slug && input.slug !== existing.slug) {
      const duplicate = await this.getBySlug(input.slug);
      if (duplicate) {
        throw new BlogFirestoreError('CONFLICT', 'Post with this slug already exists', 409);
      }
    }

    // Set publishedAt when status changes to PUBLISHED
    const updateData: Partial<FirestoreBlogPost> = { ...input };
    if (input.status === 'PUBLISHED' && existing.status !== 'PUBLISHED' && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updated = await this.update(id, updateData);
    logger.info('Updated blog post', { id });
    return updated;
  }

  /**
   * Delete a post and its comments
   */
  async deletePost(id: string, commentService: BlogCommentFirestoreService): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new BlogFirestoreError('NOT_FOUND', 'Blog post not found', 404);
    }

    // Delete all comments first
    await commentService.deleteAllForPost(id);

    // Delete the post
    await this.delete(id);
    logger.info('Deleted blog post', { id });
  }
}

// ============================================
// BLOG COMMENT SERVICE (SUBCOLLECTION)
// ============================================

export class BlogCommentFirestoreService extends SubcollectionFirestoreService<FirestoreBlogComment> {
  constructor() {
    super('blogPosts', 'comments');
  }

  /**
   * Create a new comment
   */
  async createComment(input: CreateBlogCommentInput): Promise<FirestoreBlogComment> {
    const comment = await this.create(input.postId, {
      postId: input.postId,
      name: input.name,
      email: input.email,
      content: input.content,
      status: 'PENDING',
    });

    logger.info('Created blog comment', { id: comment.id, postId: input.postId });
    return comment;
  }

  /**
   * Get approved comments for a post
   */
  async getApprovedComments(postId: string): Promise<FirestoreBlogComment[]> {
    return this.query(postId, {
      where: [{ field: 'status', operator: '==', value: 'APPROVED' }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get all comments for a post (admin)
   */
  async getCommentsForPost(postId: string): Promise<FirestoreBlogComment[]> {
    return this.query(postId, {
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get all comments across all posts with filtering (admin)
   * Note: This requires querying all posts and their comments
   */
  async getAllComments(params: BlogCommentQueryParams = {}): Promise<PaginatedResult<FirestoreBlogComment>> {
    const { status, postId, page = 1, limit = 20 } = params;

    // If postId is specified, query that post's comments directly
    if (postId) {
      let comments = await this.getAll(postId);
      
      if (status) {
        comments = comments.filter(c => c.status === status);
      }

      // Sort by createdAt desc
      comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = comments.length;
      const startIndex = (page - 1) * limit;
      const paginatedComments = comments.slice(startIndex, startIndex + limit);

      return {
        data: paginatedComments,
        hasMore: startIndex + limit < total,
        total,
      };
    }

    // For all comments, we need to use a collection group query
    const db = await this.getDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = db.collectionGroup('comments');

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allComments: FirestoreBlogComment[] = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        postId: data.postId,
        name: data.name,
        email: data.email,
        content: data.content,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as FirestoreBlogComment;
    });

    const total = allComments.length;
    const startIndex = (page - 1) * limit;
    const paginatedComments = allComments.slice(startIndex, startIndex + limit);

    return {
      data: paginatedComments,
      hasMore: startIndex + limit < total,
      total,
    };
  }

  /**
   * Update comment status
   */
  async updateCommentStatus(postId: string, commentId: string, status: BlogCommentStatus): Promise<FirestoreBlogComment> {
    const comment = await this.getById(postId, commentId);
    if (!comment) {
      throw new BlogFirestoreError('NOT_FOUND', 'Comment not found', 404);
    }

    const updated = await this.update(postId, commentId, { status });
    logger.info('Updated comment status', { id: commentId, status });
    return updated;
  }

  /**
   * Delete a comment
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    const comment = await this.getById(postId, commentId);
    if (!comment) {
      throw new BlogFirestoreError('NOT_FOUND', 'Comment not found', 404);
    }

    await this.delete(postId, commentId);
    logger.info('Deleted comment', { id: commentId, postId });
  }

  /**
   * Delete all comments for a post
   */
  async deleteAllForPost(postId: string): Promise<void> {
    await this.deleteAll(postId);
    logger.info('Deleted all comments for post', { postId });
  }

  /**
   * Get comment by ID (searches across all posts if postId not provided)
   * Note: If postId is not provided, this will search through all posts which is less efficient
   */
  async getCommentById(commentId: string, postId?: string): Promise<{ comment: FirestoreBlogComment; postId: string } | null> {
    if (postId) {
      const comment = await this.getById(postId, commentId);
      return comment ? { comment, postId } : null;
    }

    // Search across all posts using collection group query
    // Note: This requires a composite index on the comments collection group
    const db = await this.getDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = db.collectionGroup('comments');
    const snapshot = await query.get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const doc of snapshot.docs as any[]) {
      if (doc.id === commentId) {
        const data = doc.data();
        // Extract postId from the document path: blogPosts/{postId}/comments/{commentId}
        const pathParts = doc.ref.path.split('/');
        const extractedPostId = pathParts[1]; // blogPosts/{postId}/comments/{commentId}
        
        return {
          comment: {
            id: doc.id,
            postId: data.postId || extractedPostId,
            name: data.name,
            email: data.email,
            content: data.content,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as FirestoreBlogComment,
          postId: extractedPostId,
        };
      }
    }

    return null;
  }

  /**
   * Get Firestore instance (expose for collection group queries)
   */
  async getDb() {
    return super.getDb();
  }
}

// ============================================
// SINGLETON INSTANCES
// ============================================

let blogCategoryService: BlogCategoryFirestoreService | null = null;
let blogPostService: BlogPostFirestoreService | null = null;
let blogCommentService: BlogCommentFirestoreService | null = null;

export function getBlogCategoryFirestoreService(): BlogCategoryFirestoreService {
  if (!blogCategoryService) {
    blogCategoryService = new BlogCategoryFirestoreService();
  }
  return blogCategoryService;
}

export function getBlogPostFirestoreService(): BlogPostFirestoreService {
  if (!blogPostService) {
    blogPostService = new BlogPostFirestoreService();
  }
  return blogPostService;
}

export function getBlogCommentFirestoreService(): BlogCommentFirestoreService {
  if (!blogCommentService) {
    blogCommentService = new BlogCommentFirestoreService();
  }
  return blogCommentService;
}

export default {
  BlogCategoryFirestoreService,
  BlogPostFirestoreService,
  BlogCommentFirestoreService,
  getBlogCategoryFirestoreService,
  getBlogPostFirestoreService,
  getBlogCommentFirestoreService,
};
