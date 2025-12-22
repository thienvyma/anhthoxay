/**
 * Dispute Service
 *
 * Business logic for dispute management including raising disputes,
 * resolving disputes, and listing disputes for admin.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 16.1-16.6**
 */

import { PrismaClient } from '@prisma/client';
import type {
  RaiseDisputeInput,
  ResolveDisputeInput,
  DisputeQuery,
  DisputeResolutionType,
} from '../schemas/dispute.schema';
import { EscrowService } from './escrow.service';
import { NotificationService } from './notification.service';

// ============================================
// TYPES
// ============================================

export interface DisputeInfo {
  id: string;
  escrowId: string;
  escrowCode: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  bidId: string;
  bidCode: string;
  homeownerId: string;
  homeownerName: string;
  homeownerEmail: string;
  homeownerPhone: string | null;
  contractorId: string;
  contractorName: string;
  contractorEmail: string;
  contractorPhone: string | null;
  escrowAmount: number;
  escrowReleasedAmount: number;
  disputeReason: string;
  disputedBy: string;
  disputedByRole: 'HOMEOWNER' | 'CONTRACTOR';
  disputedByName: string;
  evidence: string[];
  status: 'OPEN' | 'RESOLVED_REFUND' | 'RESOLVED_RELEASE';
  resolution: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeListResult {
  data: DisputeInfo[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// DISPUTE SERVICE CLASS
// ============================================

export class DisputeService {
  private prisma: PrismaClient;
  private escrowService: EscrowService;
  private notificationService: NotificationService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.escrowService = new EscrowService(prisma);
    this.notificationService = new NotificationService(prisma);
  }

  // ============================================
  // RAISE DISPUTE (Homeowner or Contractor)
  // ============================================

  /**
   * Raise a dispute on an escrow
   * Requirements: 16.1, 16.2 - Homeowner or contractor raises dispute with reason and evidence
   *
   * @param projectId - The project ID
   * @param userId - The user raising the dispute
   * @param input - Dispute input with reason and evidence
   * @returns Updated escrow with dispute info
   */
  async raiseDispute(
    projectId: string,
    userId: string,
    input: RaiseDisputeInput
  ): Promise<DisputeInfo> {
    // Get project with escrow and related info
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        escrow: true,
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
      },
    });

    if (!project) {
      throw new DisputeError('PROJECT_NOT_FOUND', 'Dự án không tồn tại', 404);
    }

    if (!project.escrow) {
      throw new DisputeError(
        'ESCROW_NOT_FOUND',
        'Không tìm thấy escrow cho dự án này',
        404
      );
    }

    if (!project.selectedBid) {
      throw new DisputeError(
        'BID_NOT_FOUND',
        'Dự án chưa có bid được chọn',
        400
      );
    }

    // Validate user is either homeowner or contractor
    const isHomeowner = project.ownerId === userId;
    const isContractor = project.selectedBid.contractorId === userId;

    if (!isHomeowner && !isContractor) {
      throw new DisputeError(
        'UNAUTHORIZED',
        'Bạn không có quyền tạo tranh chấp cho dự án này',
        403
      );
    }

    // Validate escrow status allows dispute
    const allowedStatuses = ['HELD', 'PARTIAL_RELEASED'];
    if (!allowedStatuses.includes(project.escrow.status)) {
      throw new DisputeError(
        'INVALID_ESCROW_STATUS',
        `Không thể tạo tranh chấp khi escrow ở trạng thái ${project.escrow.status}`,
        400
      );
    }

    // Check if already disputed
    if (project.escrow.status === 'DISPUTED') {
      throw new DisputeError(
        'ALREADY_DISPUTED',
        'Escrow đã trong trạng thái tranh chấp',
        400
      );
    }

    // Update escrow to DISPUTED status
    const updatedEscrow = await this.prisma.escrow.update({
      where: { id: project.escrow.id },
      data: {
        status: 'DISPUTED',
        disputeReason: input.reason,
        disputedBy: userId,
        // Store evidence as JSON in transactions or a separate field
        transactions: this.addDisputeTransaction(
          project.escrow.transactions,
          userId,
          input.reason,
          input.evidence
        ),
      },
    });

    // Create notifications for both parties
    await this.notificationService.createEscrowNotification({
      escrowId: updatedEscrow.id,
      escrowCode: updatedEscrow.code,
      projectId: project.id,
      projectCode: project.code,
      homeownerId: project.ownerId,
      contractorId: project.selectedBid.contractorId,
      status: 'DISPUTED',
    });

    // Return dispute info
    return this.buildDisputeInfo(
      updatedEscrow,
      project,
      project.selectedBid,
      project.owner,
      project.selectedBid.contractor,
      isHomeowner ? 'HOMEOWNER' : 'CONTRACTOR',
      input.evidence || []
    );
  }

  // ============================================
  // RESOLVE DISPUTE (Admin)
  // ============================================

  /**
   * Resolve a dispute (admin only)
   * Requirements: 16.4, 16.5, 16.6 - Admin resolves with refund or release
   *
   * @param escrowId - The escrow ID
   * @param adminId - The admin user ID
   * @param input - Resolution input
   * @returns Updated dispute info
   */
  async resolveDispute(
    escrowId: string,
    adminId: string,
    input: ResolveDisputeInput
  ): Promise<DisputeInfo> {
    // Get escrow with related info
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
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
          },
        },
        bid: {
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
      },
    });

    if (!escrow) {
      throw new DisputeError('ESCROW_NOT_FOUND', 'Escrow không tồn tại', 404);
    }

    // Validate escrow is in DISPUTED status
    if (escrow.status !== 'DISPUTED') {
      throw new DisputeError(
        'NOT_DISPUTED',
        'Escrow không ở trạng thái tranh chấp',
        400
      );
    }

    // Determine new status based on resolution
    const newStatus: 'REFUNDED' | 'RELEASED' =
      input.resolution === 'REFUND_TO_HOMEOWNER' ? 'REFUNDED' : 'RELEASED';

    // Update escrow with resolution
    const updatedEscrow = await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: newStatus,
        disputeResolvedAt: new Date(),
        disputeResolution: input.note,
        releasedBy: newStatus === 'RELEASED' ? adminId : undefined,
        releasedAt: newStatus === 'RELEASED' ? new Date() : undefined,
        releasedAmount:
          newStatus === 'RELEASED' ? escrow.amount : escrow.releasedAmount,
        transactions: this.addResolutionTransaction(
          escrow.transactions,
          adminId,
          input.resolution,
          input.note,
          escrow.amount - escrow.releasedAmount
        ),
      },
    });

    // Create notifications for both parties
    await this.notificationService.createEscrowNotification({
      escrowId: updatedEscrow.id,
      escrowCode: updatedEscrow.code,
      projectId: escrow.project.id,
      projectCode: escrow.project.code,
      homeownerId: escrow.project.ownerId,
      contractorId: escrow.bid.contractorId,
      status: newStatus,
      amount: escrow.amount - escrow.releasedAmount,
    });

    // Parse evidence from transactions
    const evidence = this.extractEvidence(updatedEscrow.transactions);

    // Determine who raised the dispute
    const disputedByRole: 'HOMEOWNER' | 'CONTRACTOR' =
      escrow.disputedBy === escrow.project.ownerId ? 'HOMEOWNER' : 'CONTRACTOR';

    return this.buildDisputeInfo(
      updatedEscrow,
      escrow.project,
      escrow.bid,
      escrow.project.owner,
      escrow.bid.contractor,
      disputedByRole,
      evidence,
      input.resolution === 'REFUND_TO_HOMEOWNER'
        ? 'RESOLVED_REFUND'
        : 'RESOLVED_RELEASE'
    );
  }

  // ============================================
  // LIST DISPUTES (Admin)
  // ============================================

  /**
   * List disputes for admin
   * Requirements: 16.3 - Admin reviews disputes
   *
   * @param query - Query parameters
   * @returns Paginated list of disputes
   */
  async listDisputes(query: DisputeQuery): Promise<DisputeListResult> {
    const { status, projectId, raisedBy, page, limit, sortBy, sortOrder } =
      query;
    const skip = (page - 1) * limit;

    // Build where clause
    const statusFilter = this.mapStatusToEscrowStatus(status);
    const where = {
      ...(statusFilter && { status: statusFilter }),
      ...(projectId && { projectId }),
      ...(raisedBy && { disputedBy: raisedBy }),
      // Only include escrows that have been disputed (have disputeReason)
      disputeReason: { not: null },
    };

    const [escrows, total] = await Promise.all([
      this.prisma.escrow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
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
            },
          },
          bid: {
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
        },
      }),
      this.prisma.escrow.count({ where }),
    ]);

    const disputes = escrows.map((escrow) => {
      const disputedByRole: 'HOMEOWNER' | 'CONTRACTOR' =
        escrow.disputedBy === escrow.project.ownerId
          ? 'HOMEOWNER'
          : 'CONTRACTOR';
      const evidence = this.extractEvidence(escrow.transactions);
      const disputeStatus = this.mapEscrowStatusToDisputeStatus(escrow.status);

      return this.buildDisputeInfo(
        escrow,
        escrow.project,
        escrow.bid,
        escrow.project.owner,
        escrow.bid.contractor,
        disputedByRole,
        evidence,
        disputeStatus
      );
    });

    return {
      data: disputes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get dispute by escrow ID
   *
   * @param escrowId - The escrow ID
   * @returns Dispute info or null
   */
  async getByEscrowId(escrowId: string): Promise<DisputeInfo | null> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
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
          },
        },
        bid: {
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
      },
    });

    if (!escrow || !escrow.disputeReason) {
      return null;
    }

    const disputedByRole: 'HOMEOWNER' | 'CONTRACTOR' =
      escrow.disputedBy === escrow.project.ownerId ? 'HOMEOWNER' : 'CONTRACTOR';
    const evidence = this.extractEvidence(escrow.transactions);
    const disputeStatus = this.mapEscrowStatusToDisputeStatus(escrow.status);

    return this.buildDisputeInfo(
      escrow,
      escrow.project,
      escrow.bid,
      escrow.project.owner,
      escrow.bid.contractor,
      disputedByRole,
      evidence,
      disputeStatus
    );
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Add dispute transaction to transactions log
   */
  private addDisputeTransaction(
    existingTransactions: string | null,
    userId: string,
    reason: string,
    evidence?: string[]
  ): string {
    const transactions = this.parseTransactions(existingTransactions);
    transactions.push({
      type: 'DISPUTED',
      date: new Date().toISOString(),
      note: reason,
      adminId: userId,
      evidence: evidence || [],
    });
    return JSON.stringify(transactions);
  }

  /**
   * Add resolution transaction to transactions log
   */
  private addResolutionTransaction(
    existingTransactions: string | null,
    adminId: string,
    resolution: DisputeResolutionType,
    note: string,
    amount: number
  ): string {
    const transactions = this.parseTransactions(existingTransactions);
    transactions.push({
      type: resolution === 'REFUND_TO_HOMEOWNER' ? 'REFUND' : 'FULL_RELEASE',
      amount,
      date: new Date().toISOString(),
      note: `Dispute resolved: ${note}`,
      adminId,
    });
    return JSON.stringify(transactions);
  }

  /**
   * Parse transactions JSON
   */
  private parseTransactions(json: string | null): Array<{
    type: string;
    amount?: number;
    date: string;
    note?: string;
    adminId?: string;
    evidence?: string[];
  }> {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Extract evidence from transactions
   */
  private extractEvidence(transactions: string | null): string[] {
    const parsed = this.parseTransactions(transactions);
    const disputeTransaction = parsed.find((t) => t.type === 'DISPUTED');
    return disputeTransaction?.evidence || [];
  }

  /**
   * Map dispute status to escrow status for filtering
   */
  private mapStatusToEscrowStatus(
    status?: 'OPEN' | 'RESOLVED_REFUND' | 'RESOLVED_RELEASE'
  ): string | { in: string[] } | undefined {
    if (!status) {
      // Return all disputed escrows (DISPUTED, REFUNDED, RELEASED with disputeReason)
      return { in: ['DISPUTED', 'REFUNDED', 'RELEASED'] };
    }

    switch (status) {
      case 'OPEN':
        return 'DISPUTED';
      case 'RESOLVED_REFUND':
        return 'REFUNDED';
      case 'RESOLVED_RELEASE':
        return 'RELEASED';
      default:
        return undefined;
    }
  }

  /**
   * Map escrow status to dispute status
   */
  private mapEscrowStatusToDisputeStatus(
    escrowStatus: string
  ): 'OPEN' | 'RESOLVED_REFUND' | 'RESOLVED_RELEASE' {
    switch (escrowStatus) {
      case 'DISPUTED':
        return 'OPEN';
      case 'REFUNDED':
        return 'RESOLVED_REFUND';
      case 'RELEASED':
        return 'RESOLVED_RELEASE';
      default:
        return 'OPEN';
    }
  }

  /**
   * Build dispute info from escrow and related data
   */
  private buildDisputeInfo(
    escrow: {
      id: string;
      code: string;
      projectId: string;
      bidId: string;
      homeownerId: string;
      amount: number;
      releasedAmount: number;
      disputeReason: string | null;
      disputedBy: string | null;
      disputeResolvedAt: Date | null;
      disputeResolution: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    project: {
      id: string;
      code: string;
      title: string;
    },
    bid: {
      id: string;
      code: string;
    },
    homeowner: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    },
    contractor: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    },
    disputedByRole: 'HOMEOWNER' | 'CONTRACTOR',
    evidence: string[],
    status?: 'OPEN' | 'RESOLVED_REFUND' | 'RESOLVED_RELEASE'
  ): DisputeInfo {
    const disputedByName =
      disputedByRole === 'HOMEOWNER' ? homeowner.name : contractor.name;

    return {
      id: escrow.id,
      escrowId: escrow.id,
      escrowCode: escrow.code,
      projectId: project.id,
      projectCode: project.code,
      projectTitle: project.title,
      bidId: bid.id,
      bidCode: bid.code,
      homeownerId: homeowner.id,
      homeownerName: homeowner.name,
      homeownerEmail: homeowner.email,
      homeownerPhone: homeowner.phone,
      contractorId: contractor.id,
      contractorName: contractor.name,
      contractorEmail: contractor.email,
      contractorPhone: contractor.phone,
      escrowAmount: escrow.amount,
      escrowReleasedAmount: escrow.releasedAmount,
      disputeReason: escrow.disputeReason || '',
      disputedBy: escrow.disputedBy || '',
      disputedByRole,
      disputedByName,
      evidence,
      status: status || 'OPEN',
      resolution: escrow.disputeResolution,
      resolvedAt: escrow.disputeResolvedAt,
      resolvedBy: null, // Could be extracted from transactions if needed
      createdAt: escrow.createdAt,
      updatedAt: escrow.updatedAt,
    };
  }
}

// ============================================
// DISPUTE ERROR CLASS
// ============================================

export class DisputeError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'DisputeError';

    const statusMap: Record<string, number> = {
      PROJECT_NOT_FOUND: 404,
      ESCROW_NOT_FOUND: 404,
      BID_NOT_FOUND: 400,
      UNAUTHORIZED: 403,
      INVALID_ESCROW_STATUS: 400,
      ALREADY_DISPUTED: 400,
      NOT_DISPUTED: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
