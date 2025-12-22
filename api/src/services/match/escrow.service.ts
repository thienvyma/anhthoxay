/**
 * Match Escrow Service
 *
 * Handles escrow-related operations in the context of match management.
 * Provides match-specific escrow functionality by wrapping the core EscrowService.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 8.1-8.5**
 */

import { PrismaClient } from '@prisma/client';
import { EscrowService } from '../escrow.service';
import { FeeService } from '../fee.service';
import { MatchError } from './types';

// ============================================
// MATCH ESCROW SERVICE CLASS
// ============================================

export class MatchEscrowService {
  private prisma: PrismaClient;
  private escrowService: EscrowService;
  private feeService: FeeService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.escrowService = new EscrowService(prisma);
    this.feeService = new FeeService(prisma);
  }

  /**
   * Calculate escrow amount for a bid
   * Requirements: 8.1 - Calculate escrow based on bid price and settings
   *
   * @param bidPrice - The bid price
   * @returns Calculated escrow amount
   */
  async calculateEscrowAmount(bidPrice: number): Promise<{ amount: number }> {
    return this.escrowService.calculateAmount(bidPrice);
  }

  /**
   * Create escrow for a matched project
   * Requirements: 8.2 - Create escrow when bid is selected
   *
   * @param projectId - The project ID
   * @param bidId - The selected bid ID
   * @param homeownerId - The homeowner user ID
   * @param amount - The escrow amount
   * @returns Created escrow
   */
  async createMatchEscrow(
    projectId: string,
    bidId: string,
    homeownerId: string,
    amount: number
  ) {
    return this.escrowService.create(projectId, bidId, homeownerId, amount);
  }

  /**
   * Get escrow status for a project
   * Requirements: 8.3 - Check escrow status
   *
   * @param projectId - The project ID
   * @returns Escrow details or null
   */
  async getProjectEscrow(projectId: string) {
    return this.prisma.escrow.findUnique({
      where: { projectId },
      select: {
        id: true,
        code: true,
        amount: true,
        releasedAmount: true,
        status: true,
        confirmedAt: true,
        releasedAt: true,
      },
    });
  }

  /**
   * Handle escrow refund when match is cancelled
   * Requirements: 8.5 - Refund escrow on match cancellation
   *
   * @param projectId - The project ID
   * @param userId - The user ID performing the cancellation
   * @param reason - The cancellation reason
   * @returns Refund result or null if no escrow
   */
  async handleMatchCancellationEscrow(
    projectId: string,
    userId: string,
    reason: string
  ) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { projectId },
    });

    if (!escrow) {
      return null;
    }

    // Only refund if escrow is in a refundable state
    if (['PENDING', 'HELD', 'PARTIAL_RELEASED'].includes(escrow.status)) {
      return this.escrowService.refund(escrow.id, userId, { reason });
    }

    return null;
  }

  /**
   * Handle fee cancellation when match is cancelled
   * Requirements: 8.5 - Cancel pending fees on match cancellation
   *
   * @param projectId - The project ID
   * @param userId - The user ID performing the cancellation
   * @param reason - The cancellation reason
   */
  async handleMatchCancellationFees(
    projectId: string,
    userId: string,
    reason: string
  ) {
    const pendingFees = await this.prisma.feeTransaction.findMany({
      where: {
        projectId,
        status: 'PENDING',
      },
    });

    for (const fee of pendingFees) {
      await this.feeService.cancel(fee.id, userId, { reason });
    }
  }

  /**
   * Validate that escrow is in HELD status for project operations
   * Requirements: 8.4 - Validate escrow status before operations
   *
   * @param projectId - The project ID
   * @returns true if escrow is held, throws error otherwise
   */
  async validateEscrowHeld(projectId: string): Promise<boolean> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { projectId },
    });

    if (!escrow) {
      throw new MatchError(
        'ESCROW_NOT_FOUND',
        'Escrow not found for this project',
        404
      );
    }

    if (escrow.status !== 'HELD') {
      throw new MatchError(
        'ESCROW_NOT_HELD',
        `Escrow must be in HELD status. Current status: ${escrow.status}`,
        400
      );
    }

    return true;
  }

  /**
   * Get escrow and fee summary for a match
   * Requirements: 10.2 - Return escrow and fee details for admin
   *
   * @param projectId - The project ID
   * @returns Escrow and fee summary
   */
  async getMatchFinancialSummary(projectId: string) {
    const [escrow, fees] = await Promise.all([
      this.prisma.escrow.findUnique({
        where: { projectId },
        select: {
          id: true,
          code: true,
          amount: true,
          releasedAmount: true,
          status: true,
          confirmedAt: true,
          releasedAt: true,
        },
      }),
      this.prisma.feeTransaction.findMany({
        where: { projectId },
        select: {
          id: true,
          code: true,
          type: true,
          amount: true,
          status: true,
          paidAt: true,
        },
      }),
    ]);

    return {
      escrow,
      fees,
      totalFees: fees.reduce((sum, f) => sum + f.amount, 0),
      pendingFees: fees.filter((f) => f.status === 'PENDING').length,
      paidFees: fees.filter((f) => f.status === 'PAID').length,
    };
  }
}
