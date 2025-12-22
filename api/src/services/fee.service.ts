/**
 * Fee Service
 *
 * Business logic for fee transaction management including creation, status transitions,
 * win fee calculations, and admin operations.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 6.1, 6.2, 6.3, 7.1-7.6, 10.5**
 */

import { PrismaClient } from '@prisma/client';
import { generateFeeCode } from '../utils/code-generator';
import type {
  FeeQuery,
  FeeType,
  FeeStatus,
  MarkFeePaidInput,
  CancelFeeInput,
  FeeExportQuery,
} from '../schemas/fee.schema';

// ============================================
// TYPES
// ============================================

export interface FeeWithRelations {
  id: string;
  code: string;
  userId: string;
  projectId: string;
  bidId: string;
  type: FeeType;
  amount: number;
  currency: string;
  status: FeeStatus;
  paidAt: Date | null;
  paidBy: string | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
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
}

export interface FeeListResult {
  data: FeeWithRelations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WinFeeCalculation {
  amount: number;
  percentage: number;
  bidPrice: number;
}

// ============================================
// VALID STATUS TRANSITIONS
// ============================================

/**
 * Valid status transitions for fee transactions
 * Requirements: 7.5, 7.6 - Status flow
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  // Terminal states - no further transitions
  PAID: [],
  CANCELLED: [],
};

// ============================================
// FEE SERVICE CLASS
// ============================================

export class FeeService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // CALCULATIONS
  // ============================================

  /**
   * Calculate win fee based on bid price and settings
   * Requirements: 6.1, 6.2 - Calculate win fee using BiddingSettings
   * 
   * @param bidPrice - The bid price
   * @returns Calculated win fee with metadata
   */
  async calculateWinFee(bidPrice: number): Promise<WinFeeCalculation> {
    // Get bidding settings
    const settings = await this.prisma.biddingSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      throw new FeeError(
        'SETTINGS_NOT_FOUND',
        'Bidding settings not found',
        500
      );
    }

    // Requirements: 6.1 - Calculate win fee based on winFeePercentage
    const amount = (bidPrice * settings.winFeePercentage) / 100;

    return {
      amount,
      percentage: settings.winFeePercentage,
      bidPrice,
    };
  }

  /**
   * Get WIN_FEE service fee configuration if available
   * Requirements: 6.2 - Use WIN_FEE service fee configuration
   * 
   * @returns Service fee configuration or null
   */
  async getWinFeeConfig(): Promise<{ type: string; value: number } | null> {
    const serviceFee = await this.prisma.serviceFee.findUnique({
      where: { code: 'WIN_FEE' },
    });

    if (!serviceFee || !serviceFee.isActive) {
      return null;
    }

    return {
      type: serviceFee.type,
      value: serviceFee.value,
    };
  }

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  /**
   * Create a new fee transaction
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5 - Create with unique code and PENDING status
   * 
   * @param type - Fee type (WIN_FEE or VERIFICATION_FEE)
   * @param userId - The contractor user ID
   * @param amount - The fee amount
   * @param projectId - The project ID
   * @param bidId - The bid ID
   * @returns Created fee transaction
   */
  async create(
    type: FeeType,
    userId: string,
    amount: number,
    projectId: string,
    bidId: string
  ): Promise<FeeWithRelations> {
    // Generate unique fee code
    const { code } = await generateFeeCode(this.prisma);

    // Create fee transaction
    const fee = await this.prisma.feeTransaction.create({
      data: {
        code,
        type,
        userId,
        amount,
        projectId,
        bidId,
        status: 'PENDING',
      },
      include: this.getFeeInclude(),
    });

    return this.transformFee(fee);
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * Get fee transaction by ID
   * 
   * @param id - The fee transaction ID
   * @returns Fee transaction or null
   */
  async getById(id: string): Promise<FeeWithRelations | null> {
    const fee = await this.prisma.feeTransaction.findUnique({
      where: { id },
      include: this.getFeeInclude(),
    });

    if (!fee) {
      return null;
    }

    return this.transformFee(fee);
  }

  /**
   * Get fee transaction by code
   * 
   * @param code - The fee transaction code
   * @returns Fee transaction or null
   */
  async getByCode(code: string): Promise<FeeWithRelations | null> {
    const fee = await this.prisma.feeTransaction.findUnique({
      where: { code },
      include: this.getFeeInclude(),
    });

    if (!fee) {
      return null;
    }

    return this.transformFee(fee);
  }

  /**
   * List fee transactions with filtering and pagination
   * Requirements: 10.4 - Return all fees with filtering
   * 
   * @param query - Query parameters
   * @returns Paginated list of fee transactions
   */
  async list(query: FeeQuery): Promise<FeeListResult> {
    const { status, type, userId, projectId, code, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(type && { type }),
      ...(userId && { userId }),
      ...(projectId && { projectId }),
      ...(code && { code: { contains: code } }),
    };

    const [fees, total] = await Promise.all([
      this.prisma.feeTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.getFeeInclude(),
      }),
      this.prisma.feeTransaction.count({ where }),
    ]);

    return {
      data: fees.map((f) => this.transformFee(f)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get fees for export
   * 
   * @param query - Export query parameters
   * @returns List of fee transactions for export
   */
  async getForExport(query: FeeExportQuery): Promise<FeeWithRelations[]> {
    const { status, type, userId, fromDate, toDate } = query;

    const where = {
      ...(status && { status }),
      ...(type && { type }),
      ...(userId && { userId }),
      ...(fromDate || toDate ? {
        createdAt: {
          ...(fromDate && { gte: new Date(fromDate) }),
          ...(toDate && { lte: new Date(toDate) }),
        },
      } : {}),
    };

    const fees = await this.prisma.feeTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: this.getFeeInclude(),
    });

    return fees.map((f) => this.transformFee(f));
  }

  // ============================================
  // STATUS TRANSITION OPERATIONS
  // ============================================

  /**
   * Validate status transition
   * Requirements: 7.6 - Status changes record timestamps
   * 
   * @param currentStatus - Current fee status
   * @param newStatus - Target status
   * @returns true if valid, throws error otherwise
   */
  validateTransition(currentStatus: string, newStatus: string): boolean {
    const validNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
    
    if (!validNextStatuses.includes(newStatus)) {
      throw new FeeError(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from ${currentStatus} to ${newStatus}`,
        400
      );
    }

    return true;
  }

  /**
   * Mark fee as paid (admin)
   * Requirements: 10.5 - Mark fee as paid
   * 
   * @param id - The fee transaction ID
   * @param adminId - The admin user ID
   * @param data - Optional note
   * @returns Updated fee transaction
   */
  async markPaid(
    id: string,
    adminId: string,
    data?: MarkFeePaidInput
  ): Promise<FeeWithRelations> {
    const fee = await this.prisma.feeTransaction.findUnique({
      where: { id },
    });

    if (!fee) {
      throw new FeeError('FEE_NOT_FOUND', 'Fee transaction not found', 404);
    }

    // Validate transition
    this.validateTransition(fee.status, 'PAID');

    // Update fee transaction
    const updated = await this.prisma.feeTransaction.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paidBy: adminId,
      },
      include: this.getFeeInclude(),
    });

    // Suppress unused variable warning - note is for future audit logging
    void data;

    return this.transformFee(updated);
  }

  /**
   * Cancel fee transaction (admin)
   * 
   * @param id - The fee transaction ID
   * @param adminId - The admin user ID
   * @param data - Cancel reason
   * @returns Updated fee transaction
   */
  async cancel(
    id: string,
    adminId: string,
    data: CancelFeeInput
  ): Promise<FeeWithRelations> {
    const fee = await this.prisma.feeTransaction.findUnique({
      where: { id },
    });

    if (!fee) {
      throw new FeeError('FEE_NOT_FOUND', 'Fee transaction not found', 404);
    }

    // Validate transition
    this.validateTransition(fee.status, 'CANCELLED');

    // Update fee transaction
    const updated = await this.prisma.feeTransaction.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: adminId,
        cancelReason: data.reason,
      },
      include: this.getFeeInclude(),
    });

    return this.transformFee(updated);
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Get standard include for fee queries
   */
  private getFeeInclude() {
    return {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
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
    };
  }

  /**
   * Transform fee from Prisma to response format
   */
  private transformFee(fee: {
    id: string;
    code: string;
    userId: string;
    projectId: string;
    bidId: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: Date | null;
    paidBy: string | null;
    cancelledAt: Date | null;
    cancelledBy: string | null;
    cancelReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    user?: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
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
  }): FeeWithRelations {
    return {
      id: fee.id,
      code: fee.code,
      userId: fee.userId,
      projectId: fee.projectId,
      bidId: fee.bidId,
      type: fee.type as FeeType,
      amount: fee.amount,
      currency: fee.currency,
      status: fee.status as FeeStatus,
      paidAt: fee.paidAt,
      paidBy: fee.paidBy,
      cancelledAt: fee.cancelledAt,
      cancelledBy: fee.cancelledBy,
      cancelReason: fee.cancelReason,
      createdAt: fee.createdAt,
      updatedAt: fee.updatedAt,
      user: fee.user,
      project: fee.project,
      bid: fee.bid,
    };
  }
}

// ============================================
// FEE ERROR CLASS
// ============================================

export class FeeError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'FeeError';

    // Map error codes to HTTP status codes
    const statusMap: Record<string, number> = {
      FEE_NOT_FOUND: 404,
      SETTINGS_NOT_FOUND: 500,
      INVALID_STATUS_TRANSITION: 400,
      INVALID_FEE_TYPE: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}
