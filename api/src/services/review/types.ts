/**
 * Review Service Types
 *
 * Shared types for review management.
 *
 * **Feature: bidding-phase5-review**
 */

// ============================================
// TYPES
// ============================================

export interface ReviewWithRelations {
  id: string;
  projectId: string;
  reviewerId: string;
  contractorId: string;
  rating: number;
  comment: string | null;
  images: string[];
  qualityRating: number | null;
  timelinessRating: number | null;
  communicationRating: number | null;
  valueRating: number | null;
  response: string | null;
  respondedAt: Date | null;
  isPublic: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    code: string;
    title: string;
    status: string;
  };
  reviewer: {
    id: string;
    name: string;
  };
  contractor: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface PublicReview {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  images: string[];
  qualityRating: number | null;
  timelinessRating: number | null;
  communicationRating: number | null;
  valueRating: number | null;
  response: string | null;
  respondedAt: Date | null;
  helpfulCount: number;
  isMostHelpful: boolean;
  createdAt: Date;
}

export interface ReviewListResult {
  data: ReviewWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PublicReviewListResult {
  data: PublicReview[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  averageQualityRating: number | null;
  averageTimelinessRating: number | null;
  averageCommunicationRating: number | null;
  averageValueRating: number | null;
}

// ============================================
// MULTI-CRITERIA RATING WEIGHTS
// Requirements: 17.2 - Calculate weighted average of all criteria
// ============================================

/**
 * Weights for multi-criteria rating calculation
 * Total weight = 1.0 (100%)
 */
export const MULTI_CRITERIA_WEIGHTS = {
  quality: 0.30,       // Chất lượng công việc - 30%
  timeliness: 0.25,    // Đúng tiến độ - 25%
  communication: 0.20, // Giao tiếp - 20%
  value: 0.25,         // Giá cả hợp lý - 25%
} as const;

/**
 * Calculate weighted average rating from multi-criteria ratings
 * Requirements: 17.2 - Overall rating is weighted average of all criteria
 * 
 * @param criteria - Object containing optional multi-criteria ratings
 * @returns Weighted average rating (1-5) or null if no criteria provided
 */
export function calculateWeightedRating(criteria: {
  qualityRating?: number | null;
  timelinessRating?: number | null;
  communicationRating?: number | null;
  valueRating?: number | null;
}): number | null {
  const ratings: Array<{ value: number; weight: number }> = [];

  if (criteria.qualityRating != null) {
    ratings.push({ value: criteria.qualityRating, weight: MULTI_CRITERIA_WEIGHTS.quality });
  }
  if (criteria.timelinessRating != null) {
    ratings.push({ value: criteria.timelinessRating, weight: MULTI_CRITERIA_WEIGHTS.timeliness });
  }
  if (criteria.communicationRating != null) {
    ratings.push({ value: criteria.communicationRating, weight: MULTI_CRITERIA_WEIGHTS.communication });
  }
  if (criteria.valueRating != null) {
    ratings.push({ value: criteria.valueRating, weight: MULTI_CRITERIA_WEIGHTS.value });
  }

  if (ratings.length === 0) {
    return null;
  }

  const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0);
  const weightedSum = ratings.reduce((sum, r) => sum + r.value * r.weight, 0);
  
  const rawAverage = weightedSum / totalWeight;
  const fixedAverage = parseFloat(rawAverage.toFixed(10));
  const average = Math.round(fixedAverage * 10) / 10;
  
  return Math.max(1, Math.min(5, average));
}

// ============================================
// REVIEW ERROR CLASS
// ============================================

export class ReviewError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ReviewError';

    const statusMap: Record<string, number> = {
      REVIEW_NOT_FOUND: 404,
      PROJECT_NOT_FOUND: 404,
      REVIEW_ACCESS_DENIED: 403,
      NOT_PROJECT_OWNER: 403,
      NOT_CONTRACTOR: 403,
      PROJECT_NOT_COMPLETED: 400,
      NO_SELECTED_BID: 400,
      REVIEW_ALREADY_EXISTS: 409,
      RESPONSE_ALREADY_EXISTS: 409,
      REVIEW_UPDATE_EXPIRED: 400,
      REVIEW_DELETED: 400,
      REVIEW_ALREADY_DELETED: 400,
      REVIEW_ALREADY_HIDDEN: 400,
      REVIEW_NOT_HIDDEN: 400,
      INVALID_RATING: 400,
      TOO_MANY_IMAGES: 400,
      REVIEW_NOT_AVAILABLE: 400,
      ALREADY_VOTED: 409,
      NOT_VOTED: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse JSON string to array
 */
export function parseJsonArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Anonymize reviewer name for public display
 * Requirements: 11.2 - Show anonymized reviewer name
 */
export function anonymizeReviewerName(name: string): string {
  if (!name || name.length < 2) return 'Người dùng';
  const firstChar = name.charAt(0);
  const lastChar = name.charAt(name.length - 1);
  return `${firstChar}***${lastChar}`;
}

/**
 * Get standard include for review queries
 */
export function getReviewInclude() {
  return {
    project: {
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
      },
    },
    reviewer: {
      select: {
        id: true,
        name: true,
      },
    },
    contractor: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    },
  };
}

/**
 * Transform review from Prisma to response format
 */
export function transformReview(review: {
  id: string;
  projectId: string;
  reviewerId: string;
  contractorId: string;
  rating: number;
  comment: string | null;
  images: string | null;
  qualityRating: number | null;
  timelinessRating: number | null;
  communicationRating: number | null;
  valueRating: number | null;
  response: string | null;
  respondedAt: Date | null;
  isPublic: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    code: string;
    title: string;
    status: string;
  };
  reviewer: {
    id: string;
    name: string;
  };
  contractor: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}): ReviewWithRelations {
  return {
    id: review.id,
    projectId: review.projectId,
    reviewerId: review.reviewerId,
    contractorId: review.contractorId,
    rating: review.rating,
    comment: review.comment,
    images: parseJsonArray(review.images),
    qualityRating: review.qualityRating,
    timelinessRating: review.timelinessRating,
    communicationRating: review.communicationRating,
    valueRating: review.valueRating,
    response: review.response,
    respondedAt: review.respondedAt,
    isPublic: review.isPublic,
    isDeleted: review.isDeleted,
    deletedAt: review.deletedAt,
    deletedBy: review.deletedBy,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    project: review.project,
    reviewer: review.reviewer,
    contractor: review.contractor,
  };
}
