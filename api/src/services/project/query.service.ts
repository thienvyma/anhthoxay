/**
 * Project Query Service
 *
 * Query operations for project management.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 7.1, 7.4**
 */

import { PrismaClient } from '@prisma/client';
import type {
  ProjectQuery,
  PublicProjectQuery,
  AdminProjectQuery,
} from '../../schemas/project.schema';
import type {
  ProjectWithRelations,
  PublicProject,
  ProjectListResult,
  PublicProjectListResult,
} from './types';
import { getProjectInclude, transformProject, parseJsonArray, ProjectError } from './helpers';

// ============================================
// PROJECT QUERY SERVICE
// ============================================

export class ProjectQueryService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // HOMEOWNER QUERIES
  // ============================================

  /**
   * Get projects by owner
   * Requirements: 3.6 - Return only projects owned by user
   */
  async getByOwner(ownerId: string, query: ProjectQuery): Promise<ProjectListResult> {
    const { status, page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      ownerId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { code: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: getProjectInclude(),
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((p) => transformProject(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get project by ID for owner
   * Requirements: 3.7 - Return full project information including bids count
   */
  async getByIdForOwner(id: string, ownerId: string): Promise<ProjectWithRelations | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: getProjectInclude(),
    });

    if (!project) {
      return null;
    }

    // Check ownership
    if (project.ownerId !== ownerId) {
      throw new ProjectError('PROJECT_ACCESS_DENIED', 'Access denied', 403);
    }

    return transformProject(project);
  }

  // ============================================
  // PUBLIC QUERIES
  // ============================================

  /**
   * Get public project list
   * Requirements: 5.1, 5.4, 5.5, 5.6 - Return only OPEN projects, filter, sort
   */
  async getPublicList(query: PublicProjectQuery): Promise<PublicProjectListResult> {
    const { regionId, categoryId, page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = {
      status: 'OPEN',
      bidDeadline: { gt: now }, // Requirements: 5.5 - Exclude expired
      ...(regionId && { regionId }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { code: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    // Build orderBy based on sortBy
    let orderBy: Record<string, string> | Record<string, Record<string, string>>;
    if (sortBy === 'bidCount') {
      orderBy = { bids: { _count: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true } },
          region: { select: { id: true, name: true } },
          bids: {
            where: { status: 'APPROVED' },
            select: { price: true },
            orderBy: { price: 'asc' },
            take: 1,
          },
          _count: { select: { bids: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    // Transform to public format (hide sensitive info)
    const data: PublicProject[] = projects.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      description: p.description,
      category: p.category,
      region: p.region,
      // address is HIDDEN - Requirements: 5.2, 12.1
      area: p.area,
      budgetMin: p.budgetMin,
      budgetMax: p.budgetMax,
      timeline: p.timeline,
      images: parseJsonArray(p.images),
      requirements: p.requirements,
      status: p.status,
      bidDeadline: p.bidDeadline?.toISOString() ?? null,
      bidCount: p._count.bids,
      lowestBidPrice: p.bids[0]?.price ?? null,
      createdAt: p.createdAt.toISOString(),
      publishedAt: p.publishedAt?.toISOString() ?? null,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get public project by ID
   * Requirements: 5.2 - Return limited info, hide address and owner contact
   */
  async getPublicById(id: string): Promise<PublicProject | null> {
    const now = new Date();

    const project = await this.prisma.project.findFirst({
      where: {
        id,
        status: 'OPEN',
        bidDeadline: { gt: now },
      },
      include: {
        category: { select: { id: true, name: true } },
        region: { select: { id: true, name: true } },
        bids: {
          where: { status: 'APPROVED' },
          select: { price: true },
          orderBy: { price: 'asc' },
          take: 1,
        },
        _count: { select: { bids: true } },
      },
    });

    if (!project) {
      return null;
    }

    return {
      id: project.id,
      code: project.code,
      title: project.title,
      description: project.description,
      category: project.category,
      region: project.region,
      // address is HIDDEN - Requirements: 5.2, 12.1
      area: project.area,
      budgetMin: project.budgetMin,
      budgetMax: project.budgetMax,
      timeline: project.timeline,
      images: parseJsonArray(project.images),
      requirements: project.requirements,
      status: project.status,
      bidDeadline: project.bidDeadline?.toISOString() ?? null,
      bidCount: project._count.bids,
      lowestBidPrice: project.bids[0]?.price ?? null,
      createdAt: project.createdAt.toISOString(),
      publishedAt: project.publishedAt?.toISOString() ?? null,
    };
  }

  // ============================================
  // ADMIN QUERIES
  // ============================================

  /**
   * Get admin project list
   * Requirements: 4.1 - Return all projects with filtering
   */
  async getAdminList(query: AdminProjectQuery): Promise<ProjectListResult> {
    const { status, regionId, categoryId, page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(regionId && { regionId }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { code: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: getProjectInclude(),
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((p) => transformProject(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get project by ID for admin
   * Requirements: 4.2 - Return full project details including owner information
   */
  async getAdminById(id: string): Promise<ProjectWithRelations | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: getProjectInclude(),
    });

    if (!project) {
      return null;
    }

    return transformProject(project);
  }
}
