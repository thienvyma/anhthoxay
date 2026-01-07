/**
 * Escrow Service
 *
 * Business logic for escrow management including creation, status transitions,
 * amount calculations, and admin operations.
 *
 * **Feature: bidding-phase3-matching, bidding-phase4-communication**
 * **Requirements: 3.3, 3.4, 3.5, 4.1-4.6, 5.1-5.7, 12.5, 20.3**
 */

import { PrismaClient } from '@prisma/client';
import { generateEscrowCode } from '../utils/code-generator';
import { createLogger } from '../utils/logger';
import { NotificationService } from './notification.service';
import { NotificationChannelService } from './notification-channel.service';
import { ScheduledNotificationService } from './scheduled-notification';
import type {
  EscrowQuery,
  ConfirmEscrowInput,
  ReleaseEscrowInput,
  PartialReleaseEscrowInput,
  RefundEscrowInput,
  DisputeEscrowInput,
  EscrowTransaction,
} from '../schemas/escrow.schema';

// ============================================
// TYPES
// ============================================

export interface EscrowWithRelations {
  id: string;
  code: string;
  projectId: string;
  bidId: string;
  homeownerId: string;
  amount: number;
  releasedAmount: number;
  currency: string;
  status: string;
  transactions: EscrowTransaction[];
  disputeReason: string | null;
  disputedBy: string | null;
  disputeResolvedAt: Date | null;
  disputeResolution: string | null;
  confirmedBy: string | null;
  confirmedAt: Date | null;
  releasedBy: string | null;
  releasedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    code: string;
    title: string;
    status: string;
  };
  bid?: {
    id: string;
    code: string;
    price: number;
    status: string;
  };
  homeowner?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface EscrowListResult {
  data: EscrowWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EscrowAmount {
  amount: number;
  percentage: number;
  minApplied: boolean;
  maxApplied: boolean;
}

// ============================================
// VALID STATUS TRANSITIONS
// ============================================

/**
 * Valid status transitions for escrow
 * Requirements: 4.1-4.5 - Define valid status transitions
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['HELD', 'CANCELLED'],
  HELD: ['PARTIAL_RELEASED', 'RELEASED', 'REFUNDED', 'DISPUTED'],
  PARTIAL_RELEASED: ['RELEASED', 'REFUNDED', 'DISPUTED'],
  // Terminal states - no further transitions
  RELEASED: [],
  REFUNDED: [],
  CANCELLED: [],
  DISPUTED: ['RELEASED', 'REFUNDED'], // Admin can resolve dispute
};

// ============================================
// ESCROW SERVICE CLASS
// ============================================

export class EscrowService {
  private prisma: PrismaClient;
  private notificationService: NotificationService;
  private notificationChannelService: NotificationChannelService;
  private scheduledNotificationService: ScheduledNotificationService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.notificationService = new NotificationService(prisma);
    this.notificationChannelService = new NotificationChannelService(prisma);
    this.scheduledNotificationService = new ScheduledNotificationService(prisma);
  }

  // ============================================
  // CALCULATIONS
  // ============================================

  /**
   * Calculate escrow amount based on bid price and settings
   * Requirements: 3.3, 3.4, 3.5 - Calculate with min/max constraints
   * 
   * @param bidPrice - The bid price
   * @returns Calculated escrow amount with metadata
   */
  async calculateAmount(bidPrice: number): Promise<EscrowAmount> {
    // Get bidding settings
    const settings = await this.prisma.biddingSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      throw new EscrowError(
        'SETTINGS_NOT_FOUND',
        'Bidding settings not found',
        500
      );
    }

    const { escrowPercentage, escrowMinAmount, escrowMaxAmount } = settings;

    // Calculate base amount
    let amount = (bidPrice * escrowPercentage) / 100;
    let minApplied = false;
    let maxApplied = false;

    // Requirements: 3.4 - Enforce minimum amount
    if (amount < escrowMinAmount) {
      amount = escrowMinAmount;
      minApplied = true;
    }

    // Requirements: 3.5 - Enforce maximum amount if configured
    if (escrowMaxAmount && amount > escrowMaxAmount) {
      amount = escrowMaxAmount;
      maxApplied = true;
    }

    return {
      amount,
      percentage: escrowPercentage,
      minApplied,
      maxApplied,
    };
  }

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  /**
   * Create a new escrow
   * Requirements: 3.1, 3.2, 4.1 - Create with unique code and PENDING status
   * Requirements: 20.3 - Schedule escrow pending reminder
   * 
   * @param projectId - The project ID
   * @param bidId - The bid ID
   * @param homeownerId - The homeowner (depositor) ID
   * @param amount - The escrow amount
   * @returns Created escrow
   */
  async create(
    projectId: string,
    bidId: string,
    homeownerId: string,
    amount: number
  ): Promise<EscrowWithRelations> {
    // Generate unique escrow code
    const { code } = await generateEscrowCode(this.prisma);

    // Create initial transaction log
    const initialTransaction: EscrowTransaction = {
      type: 'CREATED',
      amount,
      date: new Date().toISOString(),
      note: 'Escrow created',
    };

    const createdAt = new Date();

    // Create escrow
    const escrow = await this.prisma.escrow.create({
      data: {
        code,
        projectId,
        bidId,
        homeownerId,
        amount,
        releasedAmount: 0,
        status: 'PENDING',
        transactions: JSON.stringify([initialTransaction]),
      },
      include: this.getEscrowInclude(),
    });

    // Schedule escrow pending reminder (48h after creation)
    // Requirements: 20.3
    try {
      await this.scheduledNotificationService.scheduleEscrowPendingReminder(
        escrow.id,
        projectId,
        homeownerId,
        createdAt
      );
    } catch (error) {
      // Log but don't fail the escrow creation
      const logger = createLogger();
      logger.error('Failed to schedule escrow pending reminder', {
        operation: 'escrow.create',
        escrowId: escrow.id,
        escrowCode: escrow.code,
        projectId,
        homeownerId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return this.transformEscrow(escrow);
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * Get escrow by ID
   * Requirements: 5.2 - Return full escrow details
   * 
   * @param id - The escrow ID
   * @returns Escrow or null
   */
  async getById(id: string): Promise<EscrowWithRelations | null> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
      include: this.getEscrowInclude(),
    });

    if (!escrow) {
      return null;
    }

    return this.transformEscrow(escrow);
  }

  /**
   * Get escrow by project ID
   * 
   * @param projectId - The project ID
   * @returns Escrow or null
   */
  async getByProject(projectId: string): Promise<EscrowWithRelations | null> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { projectId },
      include: this.getEscrowInclude(),
    });

    if (!escrow) {
      return null;
    }

    return this.transformEscrow(escrow);
  }

  /**
   * List escrows with filtering and pagination
   * Requirements: 5.1 - Return all escrows with filtering
   * 
   * @param query - Query parameters
   * @returns Paginated list of escrows
   */
  async list(query: EscrowQuery): Promise<EscrowListResult> {
    const { status, projectId, homeownerId, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(projectId && { projectId }),
      ...(homeownerId && { homeownerId }),
    };

    const [escrows, total] = await Promise.all([
      this.prisma.escrow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.getEscrowInclude(),
      }),
      this.prisma.escrow.count({ where }),
    ]);

    return {
      data: escrows.map((e) => this.transformEscrow(e)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // STATUS TRANSITION OPERATIONS
  // ============================================

  /**
   * Validate status transition
   * Requirements: 4.2-4.5 - Validate transitions
   * 
   * @param currentStatus - Current escrow status
   * @param newStatus - Target status
   * @returns true if valid, throws error otherwise
   */
  validateTransition(currentStatus: string, newStatus: string): boolean {
    const validNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
    
    if (!validNextStatuses.includes(newStatus)) {
      throw new EscrowError(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from ${currentStatus} to ${newStatus}`,
        400
      );
    }

    return true;
  }

  /**
   * Confirm escrow deposit (admin)
   * Requirements: 5.3 - Change status from PENDING to HELD
   * 
   * @param id - The escrow ID
   * @param adminId - The admin user ID
   * @param data - Confirmation data
   * @returns Updated escrow
   */
  async confirmDeposit(
    id: string,
    adminId: string,
    data?: ConfirmEscrowInput
  ): Promise<EscrowWithRelations> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
    });

    if (!escrow) {
      throw new EscrowError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    // Validate transition
    this.validateTransition(escrow.status, 'HELD');

    // Add transaction log
    const transactions = this.parseTransactions(escrow.transactions);
    transactions.push({
      type: 'DEPOSIT_CONFIRMED',
      amount: escrow.amount,
      date: new Date().toISOString(),
      note: data?.note || 'Deposit confirmed by admin',
      adminId,
    });

    // Update escrow
    const updated = await this.prisma.escrow.update({
      where: { id },
      data: {
        status: 'HELD',
        confirmedBy: adminId,
        confirmedAt: new Date(),
        transactions: JSON.stringify(transactions),
      },
      include: this.getEscrowInclude(),
    });

    // Cancel any pending escrow reminders since deposit is now confirmed
    try {
      await this.scheduledNotificationService.cancelByEscrow(id);
    } catch (error) {
      // Log but don't fail the confirmation
      const logger = createLogger();
      logger.error('Failed to cancel escrow pending reminders', {
        operation: 'escrow.confirmDeposit',
        escrowId: id,
        escrowCode: escrow.code,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return this.transformEscrow(updated);
  }

  /**
   * Release escrow (admin)
   * Requirements: 5.4, 12.5 - Change status to RELEASED, notify both parties
   * 
   * @param id - The escrow ID
   * @param adminId - The admin user ID
   * @param data - Release data
   * @returns Updated escrow
   */
  async release(
    id: string,
    adminId: string,
    data?: ReleaseEscrowInput
  ): Promise<EscrowWithRelations> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            ownerId: true,
          },
        },
        bid: {
          select: {
            contractorId: true,
          },
        },
      },
    });

    if (!escrow) {
      throw new EscrowError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    // Validate transition
    this.validateTransition(escrow.status, 'RELEASED');

    // Calculate remaining amount to release
    const remainingAmount = escrow.amount - escrow.releasedAmount;

    // Add transaction log
    const transactions = this.parseTransactions(escrow.transactions);
    transactions.push({
      type: 'FULL_RELEASE',
      amount: remainingAmount,
      date: new Date().toISOString(),
      note: data?.note || 'Full escrow released by admin',
      adminId,
    });

    // Update escrow
    const updated = await this.prisma.escrow.update({
      where: { id },
      data: {
        status: 'RELEASED',
        releasedAmount: escrow.amount,
        releasedBy: adminId,
        releasedAt: new Date(),
        transactions: JSON.stringify(transactions),
      },
      include: this.getEscrowInclude(),
    });

    // Requirements: 12.5 - Notify both parties when escrow is released
    try {
      const projectCode = escrow.project?.code || '';
      const homeownerId = escrow.project?.ownerId;
      const contractorId = escrow.bid?.contractorId;

      if (homeownerId && contractorId) {
        // Create in-app notifications
        await this.notificationService.createEscrowNotification({
          escrowId: updated.id,
          escrowCode: updated.code,
          projectId: escrow.projectId,
          projectCode,
          homeownerId,
          contractorId,
          status: 'RELEASED',
          amount: escrow.amount,
        });

        // Send via configured channels (email/SMS) to homeowner
        await this.notificationChannelService.send({
          userId: homeownerId,
          type: 'ESCROW_RELEASED',
          title: 'Đặt cọc đã được giải phóng',
          content: `Escrow ${updated.code} cho dự án ${projectCode} đã được giải phóng hoàn toàn.`,
          data: {
            projectId: escrow.projectId,
            projectCode,
            escrowId: updated.id,
            escrowCode: updated.code,
            amount: escrow.amount,
          },
          channels: ['EMAIL', 'SMS'],
        });

        // Send via configured channels (email/SMS) to contractor
        await this.notificationChannelService.send({
          userId: contractorId,
          type: 'ESCROW_RELEASED',
          title: 'Đặt cọc đã được giải phóng',
          content: `Escrow ${updated.code} cho dự án ${projectCode} đã được giải phóng hoàn toàn.`,
          data: {
            projectId: escrow.projectId,
            projectCode,
            escrowId: updated.id,
            escrowCode: updated.code,
            amount: escrow.amount,
          },
          channels: ['EMAIL', 'SMS'],
        });
      }
    } catch (error) {
      // Log error but don't fail the release
      const logger = createLogger();
      logger.error('Failed to send ESCROW_RELEASED notifications', {
        operation: 'escrow.release',
        escrowId: updated.id,
        escrowCode: updated.code,
        projectId: escrow.projectId,
        projectCode: escrow.project?.code,
        homeownerId: escrow.project?.ownerId,
        contractorId: escrow.bid?.contractorId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return this.transformEscrow(updated);
  }

  /**
   * Partially release escrow (admin)
   * Requirements: 5.5 - Change status to PARTIAL_RELEASED
   * 
   * @param id - The escrow ID
   * @param adminId - The admin user ID
   * @param data - Partial release data with amount
   * @returns Updated escrow
   */
  async partialRelease(
    id: string,
    adminId: string,
    data: PartialReleaseEscrowInput
  ): Promise<EscrowWithRelations> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
    });

    if (!escrow) {
      throw new EscrowError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    // Validate transition (only from HELD or PARTIAL_RELEASED)
    if (!['HELD', 'PARTIAL_RELEASED'].includes(escrow.status)) {
      throw new EscrowError(
        'INVALID_STATUS_TRANSITION',
        `Cannot partially release escrow in ${escrow.status} status`,
        400
      );
    }

    // Validate amount
    const remainingAmount = escrow.amount - escrow.releasedAmount;
    if (data.amount > remainingAmount) {
      throw new EscrowError(
        'INVALID_RELEASE_AMOUNT',
        `Cannot release ${data.amount}. Only ${remainingAmount} remaining`,
        400
      );
    }

    // Add transaction log
    const transactions = this.parseTransactions(escrow.transactions);
    transactions.push({
      type: 'PARTIAL_RELEASE',
      amount: data.amount,
      date: new Date().toISOString(),
      note: data.note || 'Partial escrow released by admin',
      adminId,
    });

    const newReleasedAmount = escrow.releasedAmount + data.amount;
    const newStatus = newReleasedAmount >= escrow.amount ? 'RELEASED' : 'PARTIAL_RELEASED';

    // Update escrow
    const updated = await this.prisma.escrow.update({
      where: { id },
      data: {
        status: newStatus,
        releasedAmount: newReleasedAmount,
        releasedBy: newStatus === 'RELEASED' ? adminId : escrow.releasedBy,
        releasedAt: newStatus === 'RELEASED' ? new Date() : escrow.releasedAt,
        transactions: JSON.stringify(transactions),
      },
      include: this.getEscrowInclude(),
    });

    return this.transformEscrow(updated);
  }

  /**
   * Refund escrow (admin)
   * Requirements: 5.6 - Change status to REFUNDED
   * 
   * @param id - The escrow ID
   * @param adminId - The admin user ID
   * @param data - Refund data with reason
   * @returns Updated escrow
   */
  async refund(
    id: string,
    adminId: string,
    data: RefundEscrowInput
  ): Promise<EscrowWithRelations> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
    });

    if (!escrow) {
      throw new EscrowError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    // Validate transition
    this.validateTransition(escrow.status, 'REFUNDED');

    // Add transaction log
    const transactions = this.parseTransactions(escrow.transactions);
    transactions.push({
      type: 'REFUND',
      amount: escrow.amount - escrow.releasedAmount,
      date: new Date().toISOString(),
      note: data.reason,
      adminId,
    });

    // Update escrow
    const updated = await this.prisma.escrow.update({
      where: { id },
      data: {
        status: 'REFUNDED',
        transactions: JSON.stringify(transactions),
      },
      include: this.getEscrowInclude(),
    });

    return this.transformEscrow(updated);
  }

  /**
   * Mark escrow as disputed (admin)
   * Requirements: 5.7 - Change status to DISPUTED
   * 
   * @param id - The escrow ID
   * @param adminId - The admin user ID
   * @param data - Dispute data with reason
   * @returns Updated escrow
   */
  async markDisputed(
    id: string,
    adminId: string,
    data: DisputeEscrowInput
  ): Promise<EscrowWithRelations> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id },
    });

    if (!escrow) {
      throw new EscrowError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    // Validate transition
    this.validateTransition(escrow.status, 'DISPUTED');

    // Add transaction log
    const transactions = this.parseTransactions(escrow.transactions);
    transactions.push({
      type: 'DISPUTED',
      date: new Date().toISOString(),
      note: data.reason,
      adminId,
    });

    // Update escrow
    const updated = await this.prisma.escrow.update({
      where: { id },
      data: {
        status: 'DISPUTED',
        disputeReason: data.reason,
        disputedBy: adminId,
        transactions: JSON.stringify(transactions),
      },
      include: this.getEscrowInclude(),
    });

    return this.transformEscrow(updated);
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Get standard include for escrow queries
   */
  private getEscrowInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
        },
      },
      bid: {
        select: {
          id: true,
          code: true,
          price: true,
          status: true,
        },
      },
      homeowner: {
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
   * Parse transactions JSON string to array
   */
  private parseTransactions(json: string | null): EscrowTransaction[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Transform escrow from Prisma to response format
   */
  private transformEscrow(escrow: {
    id: string;
    code: string;
    projectId: string;
    bidId: string;
    homeownerId: string;
    amount: number;
    releasedAmount: number;
    currency: string;
    status: string;
    transactions: string | null;
    disputeReason: string | null;
    disputedBy: string | null;
    disputeResolvedAt: Date | null;
    disputeResolution: string | null;
    confirmedBy: string | null;
    confirmedAt: Date | null;
    releasedBy: string | null;
    releasedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    project?: {
      id: string;
      code: string;
      title: string;
      status: string;
    };
    bid?: {
      id: string;
      code: string;
      price: number;
      status: string;
    };
    homeowner?: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
  }): EscrowWithRelations {
    return {
      id: escrow.id,
      code: escrow.code,
      projectId: escrow.projectId,
      bidId: escrow.bidId,
      homeownerId: escrow.homeownerId,
      amount: escrow.amount,
      releasedAmount: escrow.releasedAmount,
      currency: escrow.currency,
      status: escrow.status,
      transactions: this.parseTransactions(escrow.transactions),
      disputeReason: escrow.disputeReason,
      disputedBy: escrow.disputedBy,
      disputeResolvedAt: escrow.disputeResolvedAt,
      disputeResolution: escrow.disputeResolution,
      confirmedBy: escrow.confirmedBy,
      confirmedAt: escrow.confirmedAt,
      releasedBy: escrow.releasedBy,
      releasedAt: escrow.releasedAt,
      createdAt: escrow.createdAt,
      updatedAt: escrow.updatedAt,
      project: escrow.project,
      bid: escrow.bid,
      homeowner: escrow.homeowner,
    };
  }
}

// ============================================
// ESCROW ERROR CLASS
// ============================================

export class EscrowError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'EscrowError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      ESCROW_NOT_FOUND: 404,
      SETTINGS_NOT_FOUND: 500,
      INVALID_STATUS_TRANSITION: 400,
      INVALID_RELEASE_AMOUNT: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
