/**
 * Milestone Service
 *
 * Business logic for project milestone management including creation,
 * completion requests, confirmations, and disputes.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 15.1-15.6**
 */

import { PrismaClient } from '@prisma/client';
import type {
  RequestMilestoneInput,
  ConfirmMilestoneInput,
  DisputeMilestoneInput,
  MilestoneQuery,
} from '../schemas/milestone.schema';

// ============================================
// TYPES
// ============================================

export interface MilestoneWithRelations {
  id: string;
  escrowId: string;
  projectId: string;
  name: string;
  percentage: number;
  releasePercentage: number;
  status: string;
  requestedAt: Date | null;
  requestedBy: string | null;
  confirmedAt: Date | null;
  confirmedBy: string | null;
  disputedAt: Date | null;
  disputeReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MilestoneListResult {
  data: MilestoneWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// DEFAULT MILESTONES CONFIGURATION
// ============================================

/**
 * Default milestones for a project
 * Requirements: 15.1 - Create default milestones (50% and 100%)
 */
const DEFAULT_MILESTONES = [
  {
    name: '50% Completion',
    percentage: 50,
    releasePercentage: 50, // Release 50% of escrow at this milestone
  },
  {
    name: '100% Completion',
    percentage: 100,
    releasePercentage: 50, // Release remaining 50% of escrow at this milestone
  },
];

// ============================================
// MILESTONE SERVICE CLASS
// ============================================

export class MilestoneService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  /**
   * Create default milestones for a project
   * Requirements: 15.1 - Create default milestones (50%, 100%)
   * 
   * @param escrowId - The escrow ID to associate milestones with
   * @param projectId - The project ID
   * @returns Created milestones
   */
  async createDefaultMilestones(
    escrowId: string,
    projectId: string
  ): Promise<MilestoneWithRelations[]> {
    // Verify escrow exists
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new MilestoneError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new MilestoneError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check if milestones already exist for this escrow
    const existingMilestones = await this.prisma.projectMilestone.findMany({
      where: { escrowId },
    });

    if (existingMilestones.length > 0) {
      throw new MilestoneError(
        'MILESTONES_ALREADY_EXIST',
        'Milestones already exist for this escrow',
        409
      );
    }

    // Create default milestones
    const milestones = await this.prisma.$transaction(
      DEFAULT_MILESTONES.map((milestone) =>
        this.prisma.projectMilestone.create({
          data: {
            escrowId,
            projectId,
            name: milestone.name,
            percentage: milestone.percentage,
            releasePercentage: milestone.releasePercentage,
            status: 'PENDING',
          },
        })
      )
    );

    return milestones;
  }

  // ============================================
  // CONTRACTOR OPERATIONS
  // ============================================

  /**
   * Request milestone completion (contractor)
   * Requirements: 15.2 - Contractor reports milestone completion
   * 
   * @param milestoneId - The milestone ID
   * @param contractorId - The contractor user ID
   * @param data - Request data with optional note
   * @returns Updated milestone
   */
  async requestCompletion(
    milestoneId: string,
    contractorId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _data: RequestMilestoneInput
  ): Promise<MilestoneWithRelations> {
    // Note: _data.note is reserved for future use when we add note field to ProjectMilestone
    const milestone = await this.prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        escrow: {
          include: {
            bid: true,
          },
        },
        project: true,
      },
    });

    if (!milestone) {
      throw new MilestoneError('MILESTONE_NOT_FOUND', 'Milestone not found', 404);
    }

    // Verify contractor owns the bid
    if (milestone.escrow.bid.contractorId !== contractorId) {
      throw new MilestoneError(
        'MILESTONE_ACCESS_DENIED',
        'Access denied - not the contractor for this project',
        403
      );
    }

    // Verify milestone is in PENDING status
    if (milestone.status !== 'PENDING') {
      throw new MilestoneError(
        'MILESTONE_INVALID_STATUS',
        `Cannot request completion for milestone in ${milestone.status} status`,
        400
      );
    }

    // Verify project is IN_PROGRESS
    if (milestone.project.status !== 'IN_PROGRESS') {
      throw new MilestoneError(
        'PROJECT_NOT_IN_PROGRESS',
        'Project must be IN_PROGRESS to request milestone completion',
        400
      );
    }

    // Check if previous milestones are completed (for sequential completion)
    const previousMilestones = await this.prisma.projectMilestone.findMany({
      where: {
        escrowId: milestone.escrowId,
        percentage: { lt: milestone.percentage },
        status: { not: 'CONFIRMED' },
      },
    });

    if (previousMilestones.length > 0) {
      throw new MilestoneError(
        'PREVIOUS_MILESTONE_NOT_COMPLETED',
        'Previous milestones must be confirmed before requesting this one',
        400
      );
    }

    // Update milestone status to REQUESTED
    const updated = await this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'REQUESTED',
        requestedAt: new Date(),
        requestedBy: contractorId,
      },
    });

    return updated;
  }

  // ============================================
  // HOMEOWNER OPERATIONS
  // ============================================

  /**
   * Confirm milestone completion (homeowner)
   * Requirements: 15.3 - Homeowner confirms milestone completion
   * 
   * @param milestoneId - The milestone ID
   * @param homeownerId - The homeowner user ID
   * @param data - Confirmation data with optional note
   * @returns Updated milestone
   */
  async confirmCompletion(
    milestoneId: string,
    homeownerId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _data: ConfirmMilestoneInput
  ): Promise<MilestoneWithRelations> {
    // Note: _data.note is reserved for future use when we add note field to ProjectMilestone
    const milestone = await this.prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        escrow: true,
        project: true,
      },
    });

    if (!milestone) {
      throw new MilestoneError('MILESTONE_NOT_FOUND', 'Milestone not found', 404);
    }

    // Verify homeowner owns the project
    if (milestone.project.ownerId !== homeownerId) {
      throw new MilestoneError(
        'MILESTONE_ACCESS_DENIED',
        'Access denied - not the owner of this project',
        403
      );
    }

    // Verify milestone is in REQUESTED status
    if (milestone.status !== 'REQUESTED') {
      throw new MilestoneError(
        'MILESTONE_INVALID_STATUS',
        `Cannot confirm milestone in ${milestone.status} status`,
        400
      );
    }

    // Update milestone status to CONFIRMED
    const updated = await this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: homeownerId,
      },
    });

    return updated;
  }

  /**
   * Dispute a milestone (homeowner)
   * Requirements: 15.6 - Homeowner disputes milestone
   * 
   * @param milestoneId - The milestone ID
   * @param homeownerId - The homeowner user ID
   * @param data - Dispute data with reason
   * @returns Updated milestone
   */
  async disputeMilestone(
    milestoneId: string,
    homeownerId: string,
    data: DisputeMilestoneInput
  ): Promise<MilestoneWithRelations> {
    const milestone = await this.prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        escrow: true,
        project: true,
      },
    });

    if (!milestone) {
      throw new MilestoneError('MILESTONE_NOT_FOUND', 'Milestone not found', 404);
    }

    // Verify homeowner owns the project
    if (milestone.project.ownerId !== homeownerId) {
      throw new MilestoneError(
        'MILESTONE_ACCESS_DENIED',
        'Access denied - not the owner of this project',
        403
      );
    }

    // Verify milestone is in REQUESTED status (can only dispute after contractor requests)
    if (milestone.status !== 'REQUESTED') {
      throw new MilestoneError(
        'MILESTONE_INVALID_STATUS',
        `Cannot dispute milestone in ${milestone.status} status`,
        400
      );
    }

    // Update milestone and escrow status in a transaction
    const [updatedMilestone] = await this.prisma.$transaction([
      // Update milestone status to DISPUTED
      this.prisma.projectMilestone.update({
        where: { id: milestoneId },
        data: {
          status: 'DISPUTED',
          disputedAt: new Date(),
          disputeReason: data.reason,
        },
      }),
      // Update escrow status to DISPUTED
      this.prisma.escrow.update({
        where: { id: milestone.escrowId },
        data: {
          status: 'DISPUTED',
          disputeReason: data.reason,
          disputedBy: homeownerId,
        },
      }),
    ]);

    return updatedMilestone;
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * Get milestone by ID
   * 
   * @param id - The milestone ID
   * @returns Milestone or null
   */
  async getById(id: string): Promise<MilestoneWithRelations | null> {
    const milestone = await this.prisma.projectMilestone.findUnique({
      where: { id },
    });

    return milestone;
  }

  /**
   * Get milestones by escrow ID
   * 
   * @param escrowId - The escrow ID
   * @returns List of milestones
   */
  async getByEscrowId(escrowId: string): Promise<MilestoneWithRelations[]> {
    const milestones = await this.prisma.projectMilestone.findMany({
      where: { escrowId },
      orderBy: { percentage: 'asc' },
    });

    return milestones;
  }

  /**
   * Get milestones by project ID
   * 
   * @param projectId - The project ID
   * @returns List of milestones
   */
  async getByProjectId(projectId: string): Promise<MilestoneWithRelations[]> {
    const milestones = await this.prisma.projectMilestone.findMany({
      where: { projectId },
      orderBy: { percentage: 'asc' },
    });

    return milestones;
  }

  /**
   * List milestones with filtering and pagination
   * 
   * @param query - Query parameters
   * @returns Paginated list of milestones
   */
  async list(query: MilestoneQuery): Promise<MilestoneListResult> {
    const { projectId, escrowId, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(projectId && { projectId }),
      ...(escrowId && { escrowId }),
      ...(status && { status }),
    };

    const [milestones, total] = await Promise.all([
      this.prisma.projectMilestone.findMany({
        where,
        skip,
        take: limit,
        orderBy: { percentage: 'asc' },
      }),
      this.prisma.projectMilestone.count({ where }),
    ]);

    return {
      data: milestones,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

// ============================================
// MILESTONE ERROR CLASS
// ============================================

export class MilestoneError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'MilestoneError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      MILESTONE_NOT_FOUND: 404,
      ESCROW_NOT_FOUND: 404,
      PROJECT_NOT_FOUND: 404,
      MILESTONE_ACCESS_DENIED: 403,
      MILESTONE_INVALID_STATUS: 400,
      PROJECT_NOT_IN_PROGRESS: 400,
      PREVIOUS_MILESTONE_NOT_COMPLETED: 400,
      MILESTONES_ALREADY_EXIST: 409,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
