/**
 * Match CRUD Service
 *
 * Handles list, get, and cancel operations for matches.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 2.1-2.6, 9.1-9.5, 10.1-10.3**
 */

import { PrismaClient } from '@prisma/client';
import { EscrowService } from '../escrow.service';
import { FeeService } from '../fee.service';
import type { MatchQuery, CancelMatchInput } from '../../schemas/match.schema';
import {
  MatchError,
  MatchDetails,
  MatchListResult,
  MatchListItem,
  VALID_PROJECT_TRANSITIONS,
} from './types';

// ============================================
// MATCH CRUD SERVICE CLASS
// ============================================

export class MatchCrudService {
  private prisma: PrismaClient;
  private escrowService: EscrowService;
  private feeService: FeeService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.escrowService = new EscrowService(prisma);
    this.feeService = new FeeService(prisma);
  }

  // ============================================
  // CONTACT REVEAL
  // ============================================

  /**
   * Get match details by bid ID for contractor
   * Requirements: 9.1-9.5 - Contractor views match details for their selected bid
   *
   * @param bidId - The bid ID
   * @param contractorId - The contractor user ID
   * @returns Match details with homeowner contact info
   */
  async getMatchDetailsByBid(
    bidId: string,
    contractorId: string
  ): Promise<MatchDetails> {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        contractor: { select: { id: true } },
        project: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            escrow: {
              select: {
                id: true,
                code: true,
                amount: true,
                releasedAmount: true,
                status: true,
              },
            },
            feeTransactions: {
              where: { type: 'WIN_FEE', userId: contractorId },
              select: {
                id: true,
                code: true,
                amount: true,
                status: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!bid) {
      throw new MatchError('BID_NOT_FOUND', 'Bid not found', 404);
    }

    // Requirements: 9.1-9.4 - Validate contractor owns this bid
    if (bid.contractorId !== contractorId) {
      throw new MatchError(
        'NOT_BID_OWNER',
        'You are not the owner of this bid',
        403
      );
    }

    // Check if bid is SELECTED
    if (bid.status !== 'SELECTED') {
      throw new MatchError(
        'BID_NOT_SELECTED',
        'This bid has not been selected',
        400
      );
    }

    const project = bid.project;

    // Requirements: 2.5 - If project is NOT in MATCHED status, no contact info
    const isMatched = ['MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(
      project.status
    );

    const matchDetails: MatchDetails = {
      project: {
        id: project.id,
        code: project.code,
        title: project.title,
        description: project.description,
        status: project.status,
        area: project.area,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax,
        timeline: project.timeline,
        matchedAt: project.matchedAt,
      },
      bid: {
        id: bid.id,
        code: bid.code,
        price: bid.price,
        timeline: bid.timeline,
        proposal: bid.proposal,
        status: bid.status,
      },
      escrow: project.escrow,
      fee: project.feeTransactions[0] || null,
    };

    // Requirements: 2.2, 2.3, 2.4 - Reveal homeowner info and address to contractor
    if (isMatched) {
      matchDetails.homeowner = {
        name: project.owner.name,
        phone: project.owner.phone,
        email: project.owner.email,
      };
      matchDetails.project.address = project.address;
    }

    return matchDetails;
  }

  /**
   * Get match details with contact information reveal
   * Requirements: 2.1-2.6 - Reveal contact info based on user role and project status
   *
   * @param projectId - The project ID
   * @param userId - The requesting user ID
   * @returns Match details with appropriate contact info
   */
  async getMatchDetails(
    projectId: string,
    userId: string
  ): Promise<MatchDetails> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        selectedBid: {
          include: {
            contractor: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        escrow: {
          select: {
            id: true,
            code: true,
            amount: true,
            releasedAmount: true,
            status: true,
          },
        },
        feeTransactions: {
          where: { type: 'WIN_FEE' },
          select: {
            id: true,
            code: true,
            amount: true,
            status: true,
          },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new MatchError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Determine user's role in this project
    const isHomeowner = project.ownerId === userId;
    const isContractor = project.selectedBid?.contractorId === userId;

    // Requirements: 2.6 - If user is not involved, return 403
    if (!isHomeowner && !isContractor) {
      throw new MatchError(
        'NOT_INVOLVED',
        'You are not involved in this project',
        403
      );
    }

    // Requirements: 2.5 - If project is NOT in MATCHED status, no contact info
    const isMatched = ['MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(
      project.status
    );

    const matchDetails: MatchDetails = {
      project: {
        id: project.id,
        code: project.code,
        title: project.title,
        description: project.description,
        status: project.status,
        area: project.area,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax,
        timeline: project.timeline,
        matchedAt: project.matchedAt,
      },
      bid: project.selectedBid
        ? {
            id: project.selectedBid.id,
            code: project.selectedBid.code,
            price: project.selectedBid.price,
            timeline: project.selectedBid.timeline,
            proposal: project.selectedBid.proposal,
            status: project.selectedBid.status,
          }
        : {
            id: '',
            code: '',
            price: 0,
            timeline: '',
            proposal: '',
            status: '',
          },
      escrow: project.escrow,
      fee: project.feeTransactions[0] || null,
    };

    if (isMatched && project.selectedBid) {
      // Requirements: 2.1, 2.4 - Reveal contractor info to homeowner
      if (isHomeowner) {
        matchDetails.contractor = {
          name: project.selectedBid.contractor.name,
          phone: project.selectedBid.contractor.phone,
          email: project.selectedBid.contractor.email,
        };
      }

      // Requirements: 2.2, 2.3, 2.4 - Reveal homeowner info and address to contractor
      if (isContractor) {
        matchDetails.homeowner = {
          name: project.owner.name,
          phone: project.owner.phone,
          email: project.owner.email,
        };
        matchDetails.project.address = project.address;
      }
    }

    return matchDetails;
  }

  // ============================================
  // ADMIN OPERATIONS
  // ============================================

  /**
   * List matched projects (admin)
   * Requirements: 10.1 - Return projects with PENDING_MATCH or MATCHED status
   *
   * @param query - Query parameters
   * @returns Paginated list of matched projects
   */
  async listMatches(query: MatchQuery): Promise<MatchListResult> {
    const {
      escrowStatus,
      feeStatus,
      dateFrom,
      dateTo,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause - include PENDING_MATCH for admin approval
    const where: Record<string, unknown> = {
      status: { in: ['PENDING_MATCH', 'MATCHED', 'IN_PROGRESS', 'COMPLETED'] },
      selectedBidId: { not: null },
    };

    if (dateFrom || dateTo) {
      where.matchedAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { title: { contains: search } },
        { owner: { name: { contains: search } } },
      ];
    }

    // Get projects with relations
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          selectedBid: {
            include: {
              contractor: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          escrow: {
            select: {
              id: true,
              code: true,
              amount: true,
              status: true,
            },
          },
          feeTransactions: {
            where: { type: 'WIN_FEE' },
            select: {
              id: true,
              code: true,
              amount: true,
              status: true,
            },
            take: 1,
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    // Filter by escrow/fee status in memory (Prisma doesn't support nested filtering well)
    let filteredProjects = projects;

    if (escrowStatus) {
      filteredProjects = filteredProjects.filter(
        (p) => p.escrow?.status === escrowStatus
      );
    }

    if (feeStatus) {
      filteredProjects = filteredProjects.filter(
        (p) => p.feeTransactions[0]?.status === feeStatus
      );
    }

    const data: MatchListItem[] = filteredProjects.map((p) => ({
      project: {
        id: p.id,
        code: p.code,
        title: p.title,
        status: p.status,
        matchedAt: p.matchedAt,
      },
      homeowner: {
        id: p.owner.id,
        name: p.owner.name,
        email: p.owner.email,
      },
      contractor: p.selectedBid
        ? {
            id: p.selectedBid.contractor.id,
            name: p.selectedBid.contractor.name,
            email: p.selectedBid.contractor.email,
          }
        : { id: '', name: '', email: '' },
      escrow: p.escrow,
      fee: p.feeTransactions[0] || null,
    }));

    return {
      data,
      meta: {
        total: escrowStatus || feeStatus ? data.length : total,
        page,
        limit,
        totalPages: Math.ceil(
          (escrowStatus || feeStatus ? data.length : total) / limit
        ),
      },
    };
  }

  /**
   * Get match details for admin
   * Requirements: 10.2 - Return full details including both party info
   *
   * @param projectId - The project ID
   * @returns Full match details
   */
  async getMatchDetailsAdmin(projectId: string): Promise<MatchDetails> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        selectedBid: {
          include: {
            contractor: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        escrow: {
          select: {
            id: true,
            code: true,
            amount: true,
            releasedAmount: true,
            status: true,
          },
        },
        feeTransactions: {
          where: { type: 'WIN_FEE' },
          select: {
            id: true,
            code: true,
            amount: true,
            status: true,
          },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new MatchError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Admin sees all info
    return {
      project: {
        id: project.id,
        code: project.code,
        title: project.title,
        description: project.description,
        status: project.status,
        address: project.address,
        area: project.area,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax,
        timeline: project.timeline,
        matchedAt: project.matchedAt,
      },
      bid: project.selectedBid
        ? {
            id: project.selectedBid.id,
            code: project.selectedBid.code,
            price: project.selectedBid.price,
            timeline: project.selectedBid.timeline,
            proposal: project.selectedBid.proposal,
            status: project.selectedBid.status,
          }
        : {
            id: '',
            code: '',
            price: 0,
            timeline: '',
            proposal: '',
            status: '',
          },
      homeowner: {
        name: project.owner.name,
        phone: project.owner.phone,
        email: project.owner.email,
      },
      contractor: project.selectedBid
        ? {
            name: project.selectedBid.contractor.name,
            phone: project.selectedBid.contractor.phone,
            email: project.selectedBid.contractor.email,
          }
        : undefined,
      escrow: project.escrow,
      fee: project.feeTransactions[0] || null,
    };
  }

  // ============================================
  // CANCEL OPERATIONS
  // ============================================

  /**
   * Validate project status transition
   * Requirements: 11.1-11.6 - Define valid status transitions
   *
   * @param currentStatus - Current project status
   * @param newStatus - Target status
   * @returns true if valid, throws error otherwise
   */
  validateProjectTransition(currentStatus: string, newStatus: string): boolean {
    const validNextStatuses = VALID_PROJECT_TRANSITIONS[currentStatus] || [];

    if (!validNextStatuses.includes(newStatus)) {
      throw new MatchError(
        'INVALID_PROJECT_STATUS_TRANSITION',
        `Cannot transition project from ${currentStatus} to ${newStatus}`,
        400
      );
    }

    return true;
  }

  /**
   * Cancel a matched project
   * Requirements: 8.5, 11.5 - Handle escrow refund and fee cancellation
   *
   * @param projectId - The project ID
   * @param userId - The user ID (homeowner or admin)
   * @param data - Cancel reason
   * @returns Updated project
   */
  async cancelMatch(
    projectId: string,
    userId: string,
    data: CancelMatchInput
  ): Promise<{ id: string; code: string; status: string }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        escrow: true,
        feeTransactions: {
          where: { status: 'PENDING' },
        },
      },
    });

    if (!project) {
      throw new MatchError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check if user is owner or admin (admin check would be done at route level)
    if (project.ownerId !== userId) {
      throw new MatchError(
        'NOT_PROJECT_OWNER',
        'You are not the owner of this project',
        403
      );
    }

    // Validate transition
    this.validateProjectTransition(project.status, 'CANCELLED');

    // Cancel in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update project status
      const updated = await tx.project.update({
        where: { id: projectId },
        data: {
          status: 'CANCELLED',
          selectedBidId: null,
        },
      });

      // Revert selected bid to APPROVED if it was SELECTED
      if (project.selectedBidId) {
        await tx.bid.update({
          where: { id: project.selectedBidId },
          data: { status: 'APPROVED' },
        });
      }

      return updated;
    });

    // Handle escrow refund if exists and not already refunded
    if (
      project.escrow &&
      ['PENDING', 'HELD', 'PARTIAL_RELEASED'].includes(project.escrow.status)
    ) {
      await this.escrowService.refund(project.escrow.id, userId, {
        reason: data.reason,
      });
    }

    // Cancel pending fee transactions
    for (const fee of project.feeTransactions) {
      await this.feeService.cancel(fee.id, userId, {
        reason: data.reason,
      });
    }

    return {
      id: result.id,
      code: result.code,
      status: result.status,
    };
  }

  /**
   * Cancel match as admin
   * Requirements: 10.3 - Admin can cancel match
   *
   * @param projectId - The project ID
   * @param adminId - The admin user ID
   * @param data - Cancel reason
   * @returns Updated project
   */
  async cancelMatchAdmin(
    projectId: string,
    adminId: string,
    data: CancelMatchInput
  ): Promise<{ id: string; code: string; status: string }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        escrow: true,
        feeTransactions: {
          where: { status: 'PENDING' },
        },
      },
    });

    if (!project) {
      throw new MatchError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Validate transition
    this.validateProjectTransition(project.status, 'CANCELLED');

    // Cancel in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update project status
      const updated = await tx.project.update({
        where: { id: projectId },
        data: {
          status: 'CANCELLED',
          selectedBidId: null,
        },
      });

      // Revert selected bid to APPROVED if it was SELECTED
      if (project.selectedBidId) {
        await tx.bid.update({
          where: { id: project.selectedBidId },
          data: { status: 'APPROVED' },
        });
      }

      return updated;
    });

    // Handle escrow refund if exists
    if (
      project.escrow &&
      ['PENDING', 'HELD', 'PARTIAL_RELEASED'].includes(project.escrow.status)
    ) {
      await this.escrowService.refund(project.escrow.id, adminId, {
        reason: `Admin cancelled: ${data.reason}`,
      });
    }

    // Cancel pending fee transactions
    for (const fee of project.feeTransactions) {
      await this.feeService.cancel(fee.id, adminId, {
        reason: `Admin cancelled: ${data.reason}`,
      });
    }

    return {
      id: result.id,
      code: result.code,
      status: result.status,
    };
  }
}
