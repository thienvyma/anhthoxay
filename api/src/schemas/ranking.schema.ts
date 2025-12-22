/**
 * Ranking Zod Schemas
 *
 * Validation schemas for contractor ranking operations.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 7.1-7.5, 8.1-8.4, 13.1-13.4**
 */

import { z } from 'zod';

// ============================================
// CONSTANTS
// ============================================

/**
 * Score weights for ranking calculation
 * Requirements: 7.1-7.4 - Weighted ranking formula
 */
export const RANKING_WEIGHTS = {
  rating: 0.4,      // 40% weight
  projects: 0.3,    // 30% weight
  response: 0.15,   // 15% weight
  verification: 0.15, // 15% weight
} as const;

/**
 * Maximum featured contractors to display
 * Requirements: 8.2 - Show top 10 by ranking score
 */
export const MAX_FEATURED_CONTRACTORS = 10;

/**
 * Default featured contractors limit
 */
export const DEFAULT_FEATURED_LIMIT = 10;

// ============================================
// RESPONSE TIME FILTER RANGES
// ============================================

/**
 * Response time filter ranges in hours
 * Requirements: 22.4 - Filter by response time ranges
 */
export const RESPONSE_TIME_RANGES = {
  FAST: { max: 2 },        // Under 2 hours
  NORMAL: { min: 2, max: 24 }, // 2-24 hours
  SLOW: { min: 24 },       // Over 24 hours
} as const;

export type ResponseTimeRange = keyof typeof RESPONSE_TIME_RANGES;

// ============================================
// RANKING QUERY SCHEMA
// ============================================

/**
 * Schema for querying contractor rankings
 * Requirements: 13.1, 13.2 - List rankings with filters
 * Requirements: 22.4 - Filter by response time ranges
 */
export const RankingQuerySchema = z.object({
  regionId: z.string().optional(),
  specialty: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  isFeatured: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  responseTimeRange: z.enum(['FAST', 'NORMAL', 'SLOW']).optional(),
  maxResponseTime: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['totalScore', 'rank', 'averageRating', 'totalProjects', 'completedProjects', 'averageResponseTime']).default('totalScore'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// FEATURED QUERY SCHEMA
// ============================================

/**
 * Schema for querying featured contractors
 * Requirements: 8.2 - Get featured contractors with limit
 */
export const FeaturedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_FEATURED_CONTRACTORS).default(DEFAULT_FEATURED_LIMIT),
  regionId: z.string().optional(),
});

// ============================================
// SET FEATURED SCHEMA
// ============================================

/**
 * Schema for admin setting featured status
 * Requirements: 8.4 - Admin can manually feature contractors
 */
export const SetFeaturedSchema = z.object({
  isFeatured: z.boolean(),
});

// ============================================
// STATISTICS QUERY SCHEMA
// ============================================

/**
 * Schema for querying contractor statistics
 * Requirements: 6.1-6.4 - Contractor statistics
 */
export const StatsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type RankingQuery = z.infer<typeof RankingQuerySchema>;
export type FeaturedQuery = z.infer<typeof FeaturedQuerySchema>;
export type SetFeaturedInput = z.infer<typeof SetFeaturedSchema>;
export type StatsQuery = z.infer<typeof StatsQuerySchema>;
