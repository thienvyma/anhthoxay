/**
 * Project Service Types
 *
 * Type definitions for project management.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 7.1, 7.2**
 */

// ============================================
// PROJECT TYPES
// ============================================

export interface ProjectWithRelations {
  id: string;
  code: string;
  ownerId: string;
  title: string;
  description: string;
  categoryId: string;
  regionId: string;
  address: string;
  area: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  timeline: string | null;
  images: string[];
  requirements: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  bidDeadline: Date | null;
  maxBids: number;
  selectedBidId: string | null;
  matchedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  region: {
    id: string;
    name: string;
    slug: string;
  };
  _count: {
    bids: number;
  };
}

export interface PublicProject {
  id: string;
  code: string;
  title: string;
  description: string;
  category: { id: string; name: string };
  region: { id: string; name: string };
  area: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  timeline: string | null;
  images: string[];
  requirements: string | null;
  status: string;
  bidDeadline: string | null;
  bidCount: number;
  lowestBidPrice: number | null;
  createdAt: string;
  publishedAt: string | null;
}

export interface ProjectListResult {
  data: ProjectWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PublicProjectListResult {
  data: PublicProject[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// PRISMA RAW PROJECT TYPE
// ============================================

export interface PrismaProjectRaw {
  id: string;
  code: string;
  ownerId: string;
  title: string;
  description: string;
  categoryId: string;
  regionId: string;
  address: string;
  area: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  timeline: string | null;
  images: string | null;
  requirements: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  bidDeadline: Date | null;
  maxBids: number;
  selectedBidId: string | null;
  matchedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  region: {
    id: string;
    name: string;
    slug: string;
  };
  _count: {
    bids: number;
  };
}
