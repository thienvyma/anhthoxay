/**
 * Bid Service
 *
 * Business logic for bid management including CRUD operations,
 * contractor verification, project state validation, and bid anonymization.
 *
 * **Feature: bidding-phase2-core, bidding-phase4-communication**
 * **Requirements: 6.1-6.6, 7.1-7.7, 8.1-8.5, 9.1-9.5, 12.1, 12.2**
 */

import { PrismaClient } from '@prisma/client';
import { generateBidCode } from '../utils/code-generator';
import { createLogger } from '../utils/logger';
import { NotificationService } from './notification.service';
import { NotificationChannelService } from './notification-channel.service';
import type {
  CreateBidInput,
  UpdateBidInput,
  BidQuery,
  AdminBidQuery,
  BidAttachment,
} from '../schemas/bid.schema';

// ============================================
// CONSTANTS
// ============================================

/**
 * Anonymous name labels for homeowner view
 * Requirements: 9.3 - Show anonymous identifier (Nhà thầu A, B, C)
 */
const ANONYMOUS_LABELS = [
  'Nhà thầu A', 'Nhà thầu B', 'Nhà thầu C', 'Nhà thầu D', 'Nhà thầu E',
  'Nhà thầu F', 'Nhà thầu G', 'Nhà thầu H', 'Nhà thầu I', 'Nhà thầu J',
  'Nhà thầu K', 'Nhà thầu L', 'Nhà thầu M', 'Nhà thầu N', 'Nhà thầu O',
  'Nhà thầu P', 'Nhà thầu Q', 'Nhà thầu R', 'Nhà thầu S', 'Nhà thầu T',
];


// ============================================
// TYPES
// ============================================

export interface BidWithRelations {
  id: string;
  code: string;
  projectId: string;
  contractorId: string;
  price: number;
  timeline: string;
  proposal: string;
  attachments: BidAttachment[];
  responseTimeHours: number | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    code: string;
    title: string;
    status: string;
    bidDeadline: Date | null;
  };
  contractor: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    rating: number;
    totalProjects: number;
    verificationStatus: string;
  };
}

export interface AnonymousBid {
  id: string;
  code: string;
  anonymousName: string;
  contractorRating: number;
  contractorTotalProjects: number;
  contractorCompletedProjects: number;
  price: number;
  timeline: string;
  proposal: string;
  attachments: BidAttachment[];
  status: string;
  createdAt: string;
}

export interface BidListResult {
  data: BidWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AnonymousBidListResult {
  data: AnonymousBid[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}


// ============================================
// BID SERVICE CLASS
// ============================================

export class BidService {
  private prisma: PrismaClient;
  private notificationService: NotificationService;
  private notificationChannelService: NotificationChannelService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.notificationService = new NotificationService(prisma);
    this.notificationChannelService = new NotificationChannelService(prisma);
  }

  // ============================================
  // CONTRACTOR OPERATIONS
  // ============================================

  /**
   * Create a new bid
   * Requirements: 7.1-7.5 - Validate contractor, project, deadline, maxBids, uniqueness
   * Optimized: Combined contractor and project queries to reduce N+1 patterns
   */
  async create(contractorId: string, data: CreateBidInput): Promise<BidWithRelations> {
    // Optimized: Fetch contractor and project in parallel to avoid sequential queries
    const [contractor, project, existingBid] = await Promise.all([
      // Validate contractor exists and is verified - select only needed fields
      this.prisma.user.findUnique({
        where: { id: contractorId },
        select: {
          id: true,
          verificationStatus: true,
        },
      }),
      // Validate project exists - select only needed fields
      this.prisma.project.findUnique({
        where: { id: data.projectId },
        select: {
          id: true,
          status: true,
          bidDeadline: true,
          maxBids: true,
          ownerId: true,
          code: true,
          publishedAt: true,
          _count: { select: { bids: true } },
        },
      }),
      // Requirements: 7.5, 6.5 - Check contractor hasn't already bid (exclude WITHDRAWN bids)
      this.prisma.bid.findFirst({
        where: {
          projectId: data.projectId,
          contractorId,
          status: { notIn: ['WITHDRAWN', 'REJECTED'] }, // Allow re-bidding after withdraw or rejection
        },
        select: { id: true }, // Only need to check existence
      }),
    ]);

    if (!contractor) {
      throw new BidError('CONTRACTOR_NOT_FOUND', 'Contractor not found', 404);
    }

    // Requirements: 7.1 - Contractor must be VERIFIED
    if (contractor.verificationStatus !== 'VERIFIED') {
      throw new BidError(
        'CONTRACTOR_NOT_VERIFIED',
        'Only verified contractors can submit bids',
        403
      );
    }

    if (!project) {
      throw new BidError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Requirements: 7.2 - Project must be OPEN
    if (project.status !== 'OPEN') {
      throw new BidError(
        'BID_PROJECT_NOT_OPEN',
        'Can only bid on projects with OPEN status',
        400
      );
    }

    // Requirements: 7.3 - Deadline must not have passed
    if (!project.bidDeadline || project.bidDeadline <= new Date()) {
      throw new BidError(
        'BID_DEADLINE_PASSED',
        'Project bid deadline has passed',
        400
      );
    }

    // Requirements: 7.4 - Check maxBids limit
    if (project._count.bids >= project.maxBids) {
      throw new BidError(
        'BID_MAX_REACHED',
        'Project has reached maximum number of bids',
        400
      );
    }

    if (existingBid) {
      throw new BidError(
        'BID_ALREADY_EXISTS',
        'You have already submitted a bid for this project',
        409
      );
    }

    // Generate unique bid code
    const { code } = await generateBidCode(this.prisma);

    // Calculate response time (hours from project publish to bid creation)
    // Requirements: 22.1 - Calculate time from project publish to bid creation
    let responseTimeHours: number | null = null;
    if (project.publishedAt) {
      const now = new Date();
      responseTimeHours = (now.getTime() - project.publishedAt.getTime()) / (1000 * 60 * 60);
      responseTimeHours = Math.round(responseTimeHours * 10) / 10; // Round to 1 decimal
    }

    // Create bid
    const bid = await this.prisma.bid.create({
      data: {
        code,
        projectId: data.projectId,
        contractorId,
        price: data.price,
        timeline: data.timeline,
        proposal: data.proposal,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
        responseTimeHours,
        status: 'PENDING',
      },
      include: this.getBidInclude(),
    });

    // Requirements: 12.1 - Notify homeowner when bid is received
    try {
      // Create in-app notification
      await this.notificationService.createBidReceivedNotification({
        bidId: bid.id,
        bidCode: bid.code,
        projectId: project.id,
        projectCode: project.code,
        homeownerId: project.ownerId,
      });

      // Send via configured channels (email/SMS)
      await this.notificationChannelService.send({
        userId: project.ownerId,
        type: 'BID_RECEIVED',
        title: 'Bạn nhận được bid mới',
        content: `Dự án ${project.code} vừa nhận được một bid mới từ nhà thầu. Vui lòng kiểm tra và xem xét.`,
        data: {
          projectId: project.id,
          projectCode: project.code,
          bidId: bid.id,
          bidCode: bid.code,
        },
        channels: ['EMAIL'],
      });
    } catch (error) {
      // Log error but don't fail the bid creation
      const logger = createLogger();
      logger.error('Failed to send BID_RECEIVED notification', {
        operation: 'bid.create',
        bidId: bid.id,
        bidCode: bid.code,
        projectId: project.id,
        projectCode: project.code,
        homeownerId: project.ownerId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return this.transformBid(bid);
  }


  /**
   * Update a bid
   * Requirements: 7.6 - Only allow updates if bid status is PENDING
   * Optimized: Use select to limit returned fields for validation
   */
  async update(
    id: string,
    contractorId: string,
    data: UpdateBidInput
  ): Promise<BidWithRelations> {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      select: {
        id: true,
        contractorId: true,
        status: true,
        project: { 
          select: { 
            bidDeadline: true, 
            status: true,
          },
        },
      },
    });

    if (!bid) {
      throw new BidError('BID_NOT_FOUND', 'Bid not found', 404);
    }

    // Check ownership
    if (bid.contractorId !== contractorId) {
      throw new BidError('BID_ACCESS_DENIED', 'Access denied', 403);
    }

    // Check status allows update
    if (bid.status !== 'PENDING') {
      throw new BidError(
        'BID_INVALID_STATUS',
        'Can only update bids in PENDING status',
        400
      );
    }

    // Check project deadline hasn't passed
    if (!bid.project.bidDeadline || bid.project.bidDeadline <= new Date()) {
      throw new BidError(
        'BID_DEADLINE_PASSED',
        'Project bid deadline has passed',
        400
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (data.price !== undefined) updateData.price = data.price;
    if (data.timeline !== undefined) updateData.timeline = data.timeline;
    if (data.proposal !== undefined) updateData.proposal = data.proposal;
    if (data.attachments !== undefined) {
      updateData.attachments = JSON.stringify(data.attachments);
    }

    const updated = await this.prisma.bid.update({
      where: { id },
      data: updateData,
      include: this.getBidInclude(),
    });

    return this.transformBid(updated);
  }

  /**
   * Withdraw a bid
   * Requirements: 7.7 - Change status to WITHDRAWN if PENDING or APPROVED
   * Optimized: Use select to limit returned fields for validation
   */
  async withdraw(id: string, contractorId: string): Promise<BidWithRelations> {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      select: {
        id: true,
        contractorId: true,
        status: true,
      },
    });

    if (!bid) {
      throw new BidError('BID_NOT_FOUND', 'Bid not found', 404);
    }

    // Check ownership
    if (bid.contractorId !== contractorId) {
      throw new BidError('BID_ACCESS_DENIED', 'Access denied', 403);
    }

    // Check status allows withdrawal
    if (!['PENDING', 'APPROVED'].includes(bid.status)) {
      throw new BidError(
        'BID_INVALID_STATUS',
        'Can only withdraw bids in PENDING or APPROVED status',
        400
      );
    }

    const updated = await this.prisma.bid.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
      include: this.getBidInclude(),
    });

    return this.transformBid(updated);
  }


  /**
   * Get bids by contractor
   * Requirements: 7.1-7.7 - List contractor's own bids
   */
  async getByContractor(contractorId: string, query: BidQuery): Promise<BidListResult> {
    const { status, projectId, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      contractorId,
      ...(status && { status }),
      ...(projectId && { projectId }),
    };

    const [bids, total] = await Promise.all([
      this.prisma.bid.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.getBidInclude(),
      }),
      this.prisma.bid.count({ where }),
    ]);

    return {
      data: bids.map((b) => this.transformBid(b)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get bid by ID for contractor
   */
  async getByIdForContractor(id: string, contractorId: string): Promise<BidWithRelations | null> {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      include: this.getBidInclude(),
    });

    if (!bid) {
      return null;
    }

    // Check ownership
    if (bid.contractorId !== contractorId) {
      throw new BidError('BID_ACCESS_DENIED', 'Access denied', 403);
    }

    return this.transformBid(bid);
  }


  // ============================================
  // HOMEOWNER OPERATIONS
  // ============================================

  /**
   * Get bids for a project (homeowner view)
   * Requirements: 9.1-9.5 - Return all bids with anonymous info (hide contact until matched)
   * 
   * NEW FLOW:
   * - All PENDING bids are shown with anonymous name (Nhà thầu A, B, C...)
   * - Homeowner can select any PENDING bid
   * - Admin approves the match (final step)
   * - Contact info only revealed after admin approval
   * 
   * Optimized: Added completedProjects to contractor select, use proper select fields
   */
  async getBidsByProject(
    projectId: string,
    ownerId: string,
    query: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}
  ): Promise<AnonymousBidListResult> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Verify project ownership - select only needed fields
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!project) {
      throw new BidError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.ownerId !== ownerId) {
      throw new BidError('PROJECT_ACCESS_DENIED', 'Access denied', 403);
    }

    // Return PENDING bids (exclude REJECTED, WITHDRAWN, SELECTED)
    const where = {
      projectId,
      status: { in: ['PENDING'] },
    };

    const [bids, total] = await Promise.all([
      this.prisma.bid.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          contractor: {
            select: {
              id: true,
              name: true,
              rating: true,
              totalProjects: true,
              ranking: {
                select: {
                  completedProjects: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.bid.count({ where }),
    ]);

    // Transform to anonymous format
    const data: AnonymousBid[] = bids.map((bid, index) => {
      return {
        id: bid.id,
        code: bid.code,
        anonymousName: ANONYMOUS_LABELS[index] || `Nhà thầu ${index + 1}`,
        contractorRating: bid.contractor.rating,
        contractorTotalProjects: bid.contractor.totalProjects,
        contractorCompletedProjects: bid.contractor.ranking?.completedProjects ?? 0,
        price: bid.price,
        timeline: bid.timeline,
        proposal: bid.proposal,
        attachments: this.parseJsonArray(bid.attachments),
        status: bid.status,
        createdAt: bid.createdAt.toISOString(),
      };
    });

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
   * @deprecated Use getBidsByProject instead
   * Get approved bids for a project (homeowner view) - kept for backward compatibility
   */
  async getApprovedByProject(
    projectId: string,
    ownerId: string,
    query: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}
  ): Promise<AnonymousBidListResult> {
    // Delegate to new method that shows all bids
    return this.getBidsByProject(projectId, ownerId, query);
  }


  // ============================================
  // ADMIN OPERATIONS
  // ============================================

  /**
   * Get admin bid list
   * Requirements: 8.1 - Return all bids with filtering
   */
  async getAdminList(query: AdminBidQuery): Promise<BidListResult> {
    const { status, projectId, contractorId, page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(projectId && { projectId }),
      ...(contractorId && { contractorId }),
      ...(search && {
        OR: [
          { code: { contains: search } },
          { proposal: { contains: search } },
        ],
      }),
    };

    const [bids, total] = await Promise.all([
      this.prisma.bid.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.getBidInclude(),
      }),
      this.prisma.bid.count({ where }),
    ]);

    return {
      data: bids.map((b) => this.transformBid(b)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get bid by ID for admin
   * Requirements: 8.2 - Return full bid details including contractor profile
   */
  async getAdminById(id: string): Promise<BidWithRelations | null> {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      include: this.getBidInclude(),
    });

    if (!bid) {
      return null;
    }

    return this.transformBid(bid);
  }


  /**
   * Approve a bid
   * Requirements: 8.3, 8.5, 12.2 - Change status to APPROVED, validate project is OPEN, notify contractor
   * Optimized: Use select to limit returned fields for validation
   */
  async approve(id: string, adminId: string, note?: string): Promise<BidWithRelations> {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        contractorId: true,
        project: { 
          select: { 
            id: true, 
            code: true, 
            status: true,
          },
        },
      },
    });

    if (!bid) {
      throw new BidError('BID_NOT_FOUND', 'Bid not found', 404);
    }

    // Check status allows approval
    if (bid.status !== 'PENDING') {
      throw new BidError(
        'BID_INVALID_STATUS',
        'Can only approve bids in PENDING status',
        400
      );
    }

    // Requirements: 8.5 - Validate project is still OPEN
    if (bid.project.status !== 'OPEN') {
      throw new BidError(
        'BID_PROJECT_NOT_OPEN',
        'Cannot approve bid for a project that is not OPEN',
        400
      );
    }

    const updated = await this.prisma.bid.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: note ?? null,
      },
      include: this.getBidInclude(),
    });

    // Requirements: 12.2 - Notify contractor when bid is approved
    try {
      // Create in-app notification
      await this.notificationService.createBidApprovedNotification({
        bidId: updated.id,
        bidCode: updated.code,
        projectId: bid.project.id,
        projectCode: bid.project.code,
        contractorId: bid.contractorId,
      });

      // Send via configured channels (email/SMS)
      await this.notificationChannelService.send({
        userId: bid.contractorId,
        type: 'BID_APPROVED',
        title: 'Bid của bạn đã được duyệt',
        content: `Bid ${updated.code} của bạn cho dự án ${bid.project.code} đã được admin duyệt. Chủ nhà có thể xem và chọn bid của bạn.`,
        data: {
          projectId: bid.project.id,
          projectCode: bid.project.code,
          bidId: updated.id,
          bidCode: updated.code,
        },
        channels: ['EMAIL', 'SMS'],
      });
    } catch (error) {
      // Log error but don't fail the bid approval
      const logger = createLogger();
      logger.error('Failed to send BID_APPROVED notification', {
        operation: 'bid.approve',
        bidId: updated.id,
        bidCode: updated.code,
        projectId: bid.project.id,
        projectCode: bid.project.code,
        contractorId: bid.contractorId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return this.transformBid(updated);
  }

  /**
   * Reject a bid
   * Requirements: 8.4 - Change status to REJECTED and store rejection note
   * Optimized: Use select to limit returned fields for validation
   */
  async reject(id: string, adminId: string, note: string): Promise<BidWithRelations> {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!bid) {
      throw new BidError('BID_NOT_FOUND', 'Bid not found', 404);
    }

    // Check status allows rejection
    if (bid.status !== 'PENDING') {
      throw new BidError(
        'BID_INVALID_STATUS',
        'Can only reject bids in PENDING status',
        400
      );
    }

    const updated = await this.prisma.bid.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
      include: this.getBidInclude(),
    });

    return this.transformBid(updated);
  }


  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Get standard include for bid queries
   */
  private getBidInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          bidDeadline: true,
        },
      },
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          rating: true,
          totalProjects: true,
          verificationStatus: true,
        },
      },
    };
  }

  /**
   * Parse JSON string to array
   */
  private parseJsonArray(json: string | null): BidAttachment[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Transform bid from Prisma to response format
   */
  private transformBid(bid: {
    id: string;
    code: string;
    projectId: string;
    contractorId: string;
    price: number;
    timeline: string;
    proposal: string;
    attachments: string | null;
    responseTimeHours: number | null;
    status: string;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    reviewNote: string | null;
    createdAt: Date;
    updatedAt: Date;
    project: {
      id: string;
      code: string;
      title: string;
      status: string;
      bidDeadline: Date | null;
    };
    contractor: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      rating: number;
      totalProjects: number;
      verificationStatus: string;
    };
  }): BidWithRelations {
    return {
      id: bid.id,
      code: bid.code,
      projectId: bid.projectId,
      contractorId: bid.contractorId,
      price: bid.price,
      timeline: bid.timeline,
      proposal: bid.proposal,
      attachments: this.parseJsonArray(bid.attachments),
      responseTimeHours: bid.responseTimeHours,
      status: bid.status,
      reviewedBy: bid.reviewedBy,
      reviewedAt: bid.reviewedAt,
      reviewNote: bid.reviewNote,
      createdAt: bid.createdAt,
      updatedAt: bid.updatedAt,
      project: bid.project,
      contractor: bid.contractor,
    };
  }
}


// ============================================
// BID ERROR CLASS
// ============================================

export class BidError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'BidError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      BID_NOT_FOUND: 404,
      PROJECT_NOT_FOUND: 404,
      CONTRACTOR_NOT_FOUND: 404,
      BID_ACCESS_DENIED: 403,
      PROJECT_ACCESS_DENIED: 403,
      CONTRACTOR_NOT_VERIFIED: 403,
      BID_INVALID_STATUS: 400,
      BID_PROJECT_NOT_OPEN: 400,
      BID_DEADLINE_PASSED: 400,
      BID_MAX_REACHED: 400,
      BID_ALREADY_EXISTS: 409,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
