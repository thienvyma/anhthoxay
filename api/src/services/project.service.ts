/**
 * Project Service
 *
 * Business logic for project management including CRUD operations,
 * status transitions, and access control.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 2.1-2.6, 3.1-3.6, 4.1-4.5, 5.1-5.5**
 */

import { PrismaClient } from '@prisma/client';
import { generateProjectCode } from '../utils/code-generator';
import { ScheduledNotificationService } from './scheduled-notification';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQuery,
  PublicProjectQuery,
  AdminProjectQuery,
  ProjectStatus,
} from '../schemas/project.schema';

// ============================================
// CONSTANTS
// ============================================

/**
 * Valid status transitions for projects
 * Requirements: 2.1-2.6
 */
export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['OPEN', 'REJECTED'],
  REJECTED: ['PENDING_APPROVAL', 'CANCELLED'],
  OPEN: ['BIDDING_CLOSED', 'CANCELLED'],
  BIDDING_CLOSED: ['MATCHED', 'OPEN', 'CANCELLED'],
  MATCHED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

// ============================================
// TYPES
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
// PROJECT SERVICE CLASS
// ============================================

export class ProjectService {
  private prisma: PrismaClient;
  private scheduledNotificationService: ScheduledNotificationService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.scheduledNotificationService = new ScheduledNotificationService(prisma);
  }

  // ============================================
  // HOMEOWNER OPERATIONS
  // ============================================

  /**
   * Create a new project
   * Requirements: 3.1 - Save with DRAFT status and return with generated code
   */
  async create(ownerId: string, data: CreateProjectInput): Promise<ProjectWithRelations> {
    // Validate owner exists and is a homeowner
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new ProjectError('OWNER_NOT_FOUND', 'Owner not found', 404);
    }

    if (owner.role !== 'HOMEOWNER') {
      throw new ProjectError('NOT_HOMEOWNER', 'Only homeowners can create projects', 403);
    }

    // Validate category exists
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new ProjectError('CATEGORY_NOT_FOUND', 'Category not found', 400);
    }

    // Validate region exists and is active
    const region = await this.prisma.region.findUnique({
      where: { id: data.regionId },
    });

    if (!region) {
      throw new ProjectError('REGION_NOT_FOUND', 'Region not found', 400);
    }

    if (!region.isActive) {
      throw new ProjectError('REGION_NOT_ACTIVE', 'Region is not active', 400);
    }

    // Generate unique project code
    const { code } = await generateProjectCode(this.prisma);

    // Get default maxBids from BiddingSettings
    const settings = await this.prisma.biddingSettings.findUnique({
      where: { id: 'default' },
    });
    const maxBids = settings?.maxBidsPerProject ?? 20;

    // Create project
    const project = await this.prisma.project.create({
      data: {
        code,
        ownerId,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        regionId: data.regionId,
        address: data.address,
        area: data.area,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        timeline: data.timeline,
        images: data.images ? JSON.stringify(data.images) : null,
        requirements: data.requirements,
        status: 'DRAFT',
        maxBids,
      },
      include: this.getProjectInclude(),
    });

    return this.transformProject(project);
  }

  /**
   * Update a project
   * Requirements: 3.2 - Allow updates if status is DRAFT, REJECTED, OPEN, or BIDDING_CLOSED
   */
  async update(
    id: string,
    ownerId: string,
    data: UpdateProjectInput
  ): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check ownership
    if (project.ownerId !== ownerId) {
      throw new ProjectError('PROJECT_ACCESS_DENIED', 'Access denied', 403);
    }

    // Check status allows update (DRAFT, REJECTED, OPEN, BIDDING_CLOSED)
    // Not allowed: PENDING_APPROVAL, PENDING_MATCH, MATCHED, IN_PROGRESS, COMPLETED, CANCELLED
    if (!['DRAFT', 'REJECTED', 'OPEN', 'BIDDING_CLOSED'].includes(project.status)) {
      throw new ProjectError(
        'PROJECT_INVALID_STATUS',
        'Không thể sửa dự án ở trạng thái này',
        400
      );
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await this.prisma.serviceCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new ProjectError('CATEGORY_NOT_FOUND', 'Category not found', 400);
      }
    }

    // Validate region if provided
    if (data.regionId) {
      const region = await this.prisma.region.findUnique({
        where: { id: data.regionId },
      });
      if (!region) {
        throw new ProjectError('REGION_NOT_FOUND', 'Region not found', 400);
      }
      if (!region.isActive) {
        throw new ProjectError('REGION_NOT_ACTIVE', 'Region is not active', 400);
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.regionId !== undefined) updateData.regionId = data.regionId;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.area !== undefined) updateData.area = data.area;
    if (data.budgetMin !== undefined) updateData.budgetMin = data.budgetMin;
    if (data.budgetMax !== undefined) updateData.budgetMax = data.budgetMax;
    if (data.timeline !== undefined) updateData.timeline = data.timeline;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.requirements !== undefined) updateData.requirements = data.requirements;

    const updated = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: this.getProjectInclude(),
    });

    return this.transformProject(updated);
  }

  /**
   * Submit project for approval
   * Requirements: 3.3, 3.4 - Change status to PENDING_APPROVAL and validate bidDeadline
   */
  async submit(id: string, ownerId: string, bidDeadline: Date): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check ownership
    if (project.ownerId !== ownerId) {
      throw new ProjectError('PROJECT_ACCESS_DENIED', 'Access denied', 403);
    }

    // Check status allows submission
    if (project.status !== 'DRAFT') {
      throw new ProjectError(
        'PROJECT_INVALID_STATUS',
        'Can only submit projects in DRAFT status',
        400
      );
    }

    // Validate bidDeadline against BiddingSettings
    const settings = await this.prisma.biddingSettings.findUnique({
      where: { id: 'default' },
    });

    const minDays = settings?.minBidDuration ?? 3;
    const maxDays = settings?.maxBidDuration ?? 30;

    const now = new Date();
    const minDeadline = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000);
    const maxDeadline = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

    if (bidDeadline < minDeadline) {
      throw new ProjectError(
        'PROJECT_DEADLINE_TOO_SHORT',
        `Bid deadline must be at least ${minDays} days from now`,
        400
      );
    }

    if (bidDeadline > maxDeadline) {
      throw new ProjectError(
        'PROJECT_DEADLINE_TOO_LONG',
        `Bid deadline cannot exceed ${maxDays} days from now`,
        400
      );
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: 'PENDING_APPROVAL',
        bidDeadline,
      },
      include: this.getProjectInclude(),
    });

    return this.transformProject(updated);
  }

  /**
   * Delete a project
   * Requirements: 3.5 - Allow deletion if status is DRAFT or REJECTED
   */
  async delete(id: string, ownerId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check ownership
    if (project.ownerId !== ownerId) {
      throw new ProjectError('PROJECT_ACCESS_DENIED', 'Access denied', 403);
    }

    // Check status allows deletion (DRAFT or REJECTED only)
    if (!['DRAFT', 'REJECTED'].includes(project.status)) {
      throw new ProjectError(
        'PROJECT_INVALID_STATUS',
        'Chỉ có thể xóa dự án ở trạng thái Nháp hoặc Bị từ chối',
        400
      );
    }

    await this.prisma.project.delete({
      where: { id },
    });
  }

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
        include: this.getProjectInclude(),
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((p) => this.transformProject(p)),
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
      include: this.getProjectInclude(),
    });

    if (!project) {
      return null;
    }

    // Check ownership
    if (project.ownerId !== ownerId) {
      throw new ProjectError('PROJECT_ACCESS_DENIED', 'Access denied', 403);
    }

    return this.transformProject(project);
  }


  // ============================================
  // PUBLIC OPERATIONS
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
      images: this.parseJsonArray(p.images),
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
      images: this.parseJsonArray(project.images),
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
  // ADMIN OPERATIONS
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
        include: this.getProjectInclude(),
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((p) => this.transformProject(p)),
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
      include: this.getProjectInclude(),
    });

    if (!project) {
      return null;
    }

    return this.transformProject(project);
  }

  /**
   * Approve a project
   * Requirements: 4.3, 4.5 - Change status to OPEN, set publishedAt, validate deadline
   * Requirements: 20.1, 20.2 - Schedule bid deadline and no-bids reminders
   */
  async approve(id: string, adminId: string, note?: string): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check status allows approval
    if (project.status !== 'PENDING_APPROVAL') {
      throw new ProjectError(
        'PROJECT_INVALID_STATUS',
        'Can only approve projects in PENDING_APPROVAL status',
        400
      );
    }

    // Validate bidDeadline is in the future
    if (!project.bidDeadline || project.bidDeadline <= new Date()) {
      throw new ProjectError(
        'PROJECT_DEADLINE_PAST',
        'Bid deadline must be in the future',
        400
      );
    }

    const publishedAt = new Date();

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: 'OPEN',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: note ?? null,
        publishedAt,
      },
      include: this.getProjectInclude(),
    });

    // Schedule bid deadline reminder (24h before deadline)
    // Requirements: 20.1
    try {
      await this.scheduledNotificationService.scheduleBidDeadlineReminder(
        project.id,
        project.ownerId,
        project.bidDeadline
      );
    } catch (error) {
      // Log but don't fail the approval
      console.error('Failed to schedule bid deadline reminder:', error);
    }

    // Schedule no-bids reminder (3 days after publish)
    // Requirements: 20.2
    try {
      await this.scheduledNotificationService.scheduleNoBidsReminder(
        project.id,
        project.ownerId,
        publishedAt
      );
    } catch (error) {
      // Log but don't fail the approval
      console.error('Failed to schedule no-bids reminder:', error);
    }

    return this.transformProject(updated);
  }

  /**
   * Reject a project
   * Requirements: 4.4 - Change status to REJECTED and store rejection note
   */
  async reject(id: string, adminId: string, note: string): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check status allows rejection
    if (project.status !== 'PENDING_APPROVAL') {
      throw new ProjectError(
        'PROJECT_INVALID_STATUS',
        'Can only reject projects in PENDING_APPROVAL status',
        400
      );
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
      include: this.getProjectInclude(),
    });

    return this.transformProject(updated);
  }


  // ============================================
  // STATUS TRANSITION HELPERS
  // ============================================

  /**
   * Check if a status transition is valid
   * Requirements: 2.1-2.6
   */
  isValidTransition(currentStatus: ProjectStatus, newStatus: ProjectStatus): boolean {
    const allowedTransitions = PROJECT_STATUS_TRANSITIONS[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Transition project status
   * Requirements: 2.1-2.6 - Validate transition before applying
   */
  async transitionStatus(
    id: string,
    newStatus: ProjectStatus,
    userId?: string
  ): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    const currentStatus = project.status as ProjectStatus;

    if (!this.isValidTransition(currentStatus, newStatus)) {
      throw new ProjectError(
        'PROJECT_INVALID_TRANSITION',
        `Cannot transition from ${currentStatus} to ${newStatus}`,
        400
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    // Set additional fields based on transition
    if (newStatus === 'MATCHED') {
      updateData.matchedAt = new Date();
    }

    if (userId) {
      updateData.reviewedBy = userId;
      updateData.reviewedAt = new Date();
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: this.getProjectInclude(),
    });

    return this.transformProject(updated);
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Get standard include for project queries
   */
  private getProjectInclude() {
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

  /**
   * Parse JSON string to array
   */
  private parseJsonArray(json: string | null): string[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Transform project from Prisma to response format
   */
  private transformProject(project: {
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
  }): ProjectWithRelations {
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
      images: this.parseJsonArray(project.images),
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

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      PROJECT_NOT_FOUND: 404,
      OWNER_NOT_FOUND: 404,
      CATEGORY_NOT_FOUND: 400,
      REGION_NOT_FOUND: 400,
      REGION_NOT_ACTIVE: 400,
      PROJECT_ACCESS_DENIED: 403,
      NOT_HOMEOWNER: 403,
      PROJECT_INVALID_STATUS: 400,
      PROJECT_INVALID_TRANSITION: 400,
      PROJECT_DEADLINE_PAST: 400,
      PROJECT_DEADLINE_TOO_SHORT: 400,
      PROJECT_DEADLINE_TOO_LONG: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
