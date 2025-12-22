/**
 * Badge Schema
 *
 * Zod validation schemas for contractor badges.
 *
 * **Feature: bidding-phase5-review**
 * **Requirements: 21.1, 21.2, 21.3, 21.4**
 */

import { z } from 'zod';

// ============================================
// CONSTANTS
// ============================================

/**
 * Badge types and their criteria
 * Requirements: 21.1, 21.2, 21.3
 */
export const BADGE_TYPES = {
  /** Requirement 21.1: Completes 10 projects */
  ACTIVE_CONTRACTOR: 'ACTIVE_CONTRACTOR',
  /** Requirement 21.2: Maintains 4.5+ rating for 6 months */
  HIGH_QUALITY: 'HIGH_QUALITY',
  /** Requirement 21.3: Responds to 90%+ bids within 24h */
  FAST_RESPONDER: 'FAST_RESPONDER',
} as const;

export type BadgeType = (typeof BADGE_TYPES)[keyof typeof BADGE_TYPES];

/**
 * Badge criteria thresholds
 */
export const BADGE_CRITERIA = {
  ACTIVE_CONTRACTOR: {
    minCompletedProjects: 10,
  },
  HIGH_QUALITY: {
    minRating: 4.5,
    minMonths: 6,
  },
  FAST_RESPONDER: {
    minResponseRate: 90, // percentage
    maxResponseTimeHours: 24,
  },
} as const;

/**
 * Badge display information (Vietnamese)
 */
export const BADGE_INFO: Record<BadgeType, { name: string; description: string; icon: string }> = {
  ACTIVE_CONTRACTOR: {
    name: 'Nhà thầu Tích cực',
    description: 'Đã hoàn thành 10 dự án trở lên',
    icon: '🏆',
  },
  HIGH_QUALITY: {
    name: 'Chất lượng Cao',
    description: 'Duy trì đánh giá 4.5+ trong 6 tháng',
    icon: '⭐',
  },
  FAST_RESPONDER: {
    name: 'Phản hồi Nhanh',
    description: 'Phản hồi 90%+ yêu cầu trong 24 giờ',
    icon: '⚡',
  },
};

// ============================================
// SCHEMAS
// ============================================

/**
 * Badge type enum schema
 */
export const BadgeTypeSchema = z.enum([
  BADGE_TYPES.ACTIVE_CONTRACTOR,
  BADGE_TYPES.HIGH_QUALITY,
  BADGE_TYPES.FAST_RESPONDER,
]);

/**
 * Badge response schema
 */
export const BadgeResponseSchema = z.object({
  id: z.string(),
  contractorId: z.string(),
  badgeType: BadgeTypeSchema,
  awardedAt: z.date(),
  info: z.object({
    name: z.string(),
    description: z.string(),
    icon: z.string(),
  }),
});

/**
 * Badge list query schema
 */
export const BadgeQuerySchema = z.object({
  contractorId: z.string().optional(),
  badgeType: BadgeTypeSchema.optional(),
});

// ============================================
// TYPES
// ============================================

export type BadgeResponse = z.infer<typeof BadgeResponseSchema>;
export type BadgeQuery = z.infer<typeof BadgeQuerySchema>;
