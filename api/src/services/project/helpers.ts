/**
 * Project Service Helpers
 *
 * Helper functions for project management.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 7.3**
 */

import type { ProjectWithRelations, PrismaProjectRaw } from './types';
import { PROJECT_ERROR_STATUS_MAP } from './constants';

// ============================================
// PRISMA INCLUDE HELPERS
// ============================================

/**
 * Get standard include for project queries
 */
export function getProjectInclude() {
  return {
    owner: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    region: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    _count: {
      select: {
        bids: true,
      },
    },
  };
}

// ============================================
// JSON PARSING HELPERS
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

// ============================================
// TRANSFORM HELPERS
// ============================================

/**
 * Transform project from Prisma to response format
 */
export function transformProject(project: PrismaProjectRaw): ProjectWithRelations {
  return {
    id: project.id,
    code: project.code,
    ownerId: project.ownerId,
    title: project.title,
    description: project.description,
    categoryId: project.categoryId,
    regionId: project.regionId,
    address: project.address,
    area: project.area,
    budgetMin: project.budgetMin,
    budgetMax: project.budgetMax,
    timeline: project.timeline,
    images: parseJsonArray(project.images),
    requirements: project.requirements,
    status: project.status,
    reviewedBy: project.reviewedBy,
    reviewedAt: project.reviewedAt,
    reviewNote: project.reviewNote,
    bidDeadline: project.bidDeadline,
    maxBids: project.maxBids,
    selectedBidId: project.selectedBidId,
    matchedAt: project.matchedAt,
    publishedAt: project.publishedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    owner: project.owner,
    category: project.category,
    region: project.region,
    _count: project._count,
  };
}

// ============================================
// PROJECT ERROR CLASS
// ============================================

export class ProjectError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ProjectError';
    this.statusCode = statusCode || PROJECT_ERROR_STATUS_MAP[code] || 500;
  }
}
