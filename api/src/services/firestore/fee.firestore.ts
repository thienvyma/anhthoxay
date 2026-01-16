/**
 * Fee Firestore Service
 * 
 * Business logic for fee transaction management using Firestore.
 * Stores fee transactions in `feeTransactions/{transactionId}`.
 * 
 * @module services/firestore/fee.firestore
 * @requirements 5.4
 */

import { BaseFirestoreService, type QueryOptions } from './base.firestore';
import type { 
  FirestoreFeeTransaction, 
  FeeTransactionType,
  FeeTransactionStatus 
} from '../../types/firestore.types';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

/**
 * Input for creating a fee transaction
 */
export interface CreateFeeInput {
  userId: string;
  projectId: string;
  bidId: string;
  type: FeeTransactionType;
  amount: number;
  currency?: string;
}

/**
 * Query parameters for listing fee transactions
 */
export interface FeeQueryParams {
  status?: FeeTransactionStatus | FeeTransactionStatus[];
  type?: FeeTransactionType;
  userId?: string;
  projectId?: string;
  code?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fee transaction with relations
 */
export interface FeeWithRelations extends FirestoreFeeTransaction {
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
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

/**
 * Paginated fee result
 */
export interface PaginatedFeeResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Win fee calculation result
 */
export interface WinFeeCalculation {
  amount: number;
  percentage: number;
  bidPrice: number;
}

/**
 * Input for marking fee as paid
 */
export interface MarkFeePaidInput {
  note?: string;
}

/**
 * Input for cancelling fee
 */
export interface CancelFeeInput {
  reason: string;
}

/**
 * Valid status transitions for fee transactions
 */
export const FEE_STATUS_TRANSITIONS: Record<FeeTransactionStatus, FeeTransactionStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

// ============================================
// FEE FIRESTORE SERVICE
// ============================================

/**
 * Firestore service for fee transaction management
 * @requirements 5.4
 */
export class FeeFirestoreService extends BaseFirestoreService<FirestoreFeeTransaction> {
  private codeCounter = 0;

  constructor() {
    super('feeTransactions');
  }

  // ============================================
  // CODE GENERATION
  // ============================================

  /**
   * Generate unique fee code
   */
  private generateCode(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    this.codeCounter++;
    const sequence = this.codeCounter.toString().padStart(4, '0');
    
    return `FEE${year}${month}${sequence}`;
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new fee transaction
   * @requirements 5.4
   */
  async createFee(data: CreateFeeInput): Promise<FirestoreFeeTransaction> {
    const code = this.generateCode();
    
    const feeData: Omit<FirestoreFeeTransaction, 'id' | 'createdAt' | 'updatedAt'> = {
      code,
      userId: data.userId,
      projectId: data.projectId,
      bidId: data.bidId,
      type: data.type,
      amount: data.amount,
      currency: data.currency || 'VND',
      status: 'PENDING',
    };

    const fee = await this.create(feeData);
    
    logger.info('Fee transaction created', { feeId: fee.id, code: fee.code, type: fee.type });
    
    return fee;
  }

  /**
   * Get fee by code
   */
  async getByCode(code: string): Promise<FirestoreFeeTransaction | null> {
    const fees = await this.query({
      where: [{ field: 'code', operator: '==', value: code }],
      limit: 1,
    });
    
    return fees.length > 0 ? fees[0] : null;
  }

  /**
   * Get fees by project ID
   */
  async getByProject(projectId: string): Promise<FirestoreFeeTransaction[]> {
    return this.query({
      where: [{ field: 'projectId', operator: '==', value: projectId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get fees by user ID
   */
  async getByUser(userId: string): Promise<FirestoreFeeTransaction[]> {
    return this.query({
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get fee by bid ID
   */
  async getByBid(bidId: string): Promise<FirestoreFeeTransaction | null> {
    const fees = await this.query({
      where: [{ field: 'bidId', operator: '==', value: bidId }],
      limit: 1,
    });
    
    return fees.length > 0 ? fees[0] : null;
  }


  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * List fee transactions with filtering and pagination
   */
  async list(params: FeeQueryParams = {}): Promise<PaginatedFeeResult<FirestoreFeeTransaction>> {
    const { 
      status, 
      type,
      userId, 
      projectId,
      fromDate,
      toDate,
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = params;

    const options: QueryOptions<FirestoreFeeTransaction> = {
      where: [],
      orderBy: [{ field: sortBy, direction: sortOrder }],
    };

    if (status) {
      if (Array.isArray(status)) {
        options.where?.push({ field: 'status', operator: 'in', value: status });
      } else {
        options.where?.push({ field: 'status', operator: '==', value: status });
      }
    }

    if (type) {
      options.where?.push({ field: 'type', operator: '==', value: type });
    }

    if (userId) {
      options.where?.push({ field: 'userId', operator: '==', value: userId });
    }

    if (projectId) {
      options.where?.push({ field: 'projectId', operator: '==', value: projectId });
    }

    if (fromDate) {
      options.where?.push({ field: 'createdAt', operator: '>=', value: fromDate });
    }

    if (toDate) {
      options.where?.push({ field: 'createdAt', operator: '<=', value: toDate });
    }

    const allFees = await this.query(options);
    
    // Manual pagination
    const start = (page - 1) * limit;
    const paginatedData = allFees.slice(start, start + limit);
    const total = allFees.length;

    return {
      data: paginatedData,
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
   */
  async getForExport(params: FeeQueryParams = {}): Promise<FirestoreFeeTransaction[]> {
    const { status, type, userId, fromDate, toDate } = params;

    const options: QueryOptions<FirestoreFeeTransaction> = {
      where: [],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    };

    if (status) {
      if (Array.isArray(status)) {
        options.where?.push({ field: 'status', operator: 'in', value: status });
      } else {
        options.where?.push({ field: 'status', operator: '==', value: status });
      }
    }

    if (type) {
      options.where?.push({ field: 'type', operator: '==', value: type });
    }

    if (userId) {
      options.where?.push({ field: 'userId', operator: '==', value: userId });
    }

    if (fromDate) {
      options.where?.push({ field: 'createdAt', operator: '>=', value: fromDate });
    }

    if (toDate) {
      options.where?.push({ field: 'createdAt', operator: '<=', value: toDate });
    }

    return this.query(options);
  }

  // ============================================
  // STATUS TRANSITION OPERATIONS
  // ============================================

  /**
   * Check if status transition is valid
   */
  isValidTransition(currentStatus: FeeTransactionStatus, newStatus: FeeTransactionStatus): boolean {
    const validTransitions = FEE_STATUS_TRANSITIONS[currentStatus] || [];
    return validTransitions.includes(newStatus);
  }

  /**
   * Mark fee as paid (admin)
   */
  async markPaid(id: string, adminId: string): Promise<FirestoreFeeTransaction> {
    const fee = await this.getById(id);
    
    if (!fee) {
      throw new FeeFirestoreError('FEE_NOT_FOUND', 'Fee transaction not found', 404);
    }

    if (!this.isValidTransition(fee.status, 'PAID')) {
      throw new FeeFirestoreError(
        'FEE_INVALID_TRANSITION',
        `Cannot mark fee as paid in ${fee.status} status`,
        400
      );
    }

    const updated = await this.update(id, {
      status: 'PAID',
      paidAt: new Date(),
      paidBy: adminId,
    } as Partial<Omit<FirestoreFeeTransaction, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Fee marked as paid', { feeId: id, adminId });
    
    return updated;
  }

  /**
   * Cancel fee transaction (admin)
   */
  async cancel(id: string, adminId: string, data: CancelFeeInput): Promise<FirestoreFeeTransaction> {
    const fee = await this.getById(id);
    
    if (!fee) {
      throw new FeeFirestoreError('FEE_NOT_FOUND', 'Fee transaction not found', 404);
    }

    if (!this.isValidTransition(fee.status, 'CANCELLED')) {
      throw new FeeFirestoreError(
        'FEE_INVALID_TRANSITION',
        `Cannot cancel fee in ${fee.status} status`,
        400
      );
    }

    const updated = await this.update(id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: adminId,
      cancelReason: data.reason,
    } as Partial<Omit<FirestoreFeeTransaction, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Fee cancelled', { feeId: id, adminId, reason: data.reason });
    
    return updated;
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get fee statistics
   */
  async getStats(params: { userId?: string; projectId?: string } = {}): Promise<{
    totalPending: number;
    totalPaid: number;
    totalCancelled: number;
    pendingAmount: number;
    paidAmount: number;
  }> {
    const options: QueryOptions<FirestoreFeeTransaction> = {
      where: [],
    };

    if (params.userId) {
      options.where?.push({ field: 'userId', operator: '==', value: params.userId });
    }

    if (params.projectId) {
      options.where?.push({ field: 'projectId', operator: '==', value: params.projectId });
    }

    const fees = await this.query(options);

    const stats = {
      totalPending: 0,
      totalPaid: 0,
      totalCancelled: 0,
      pendingAmount: 0,
      paidAmount: 0,
    };

    for (const fee of fees) {
      switch (fee.status) {
        case 'PENDING':
          stats.totalPending++;
          stats.pendingAmount += fee.amount;
          break;
        case 'PAID':
          stats.totalPaid++;
          stats.paidAmount += fee.amount;
          break;
        case 'CANCELLED':
          stats.totalCancelled++;
          break;
      }
    }

    return stats;
  }
}

// ============================================
// ERROR CLASS
// ============================================

export class FeeFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'FeeFirestoreError';

    const statusMap: Record<string, number> = {
      FEE_NOT_FOUND: 404,
      FEE_INVALID_TRANSITION: 400,
      SETTINGS_NOT_FOUND: 500,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let feeFirestoreService: FeeFirestoreService | null = null;

export function getFeeFirestoreService(): FeeFirestoreService {
  if (!feeFirestoreService) {
    feeFirestoreService = new FeeFirestoreService();
  }
  return feeFirestoreService;
}

export default FeeFirestoreService;
