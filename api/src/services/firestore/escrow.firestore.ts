/**
 * Escrow Firestore Service
 * 
 * Business logic for escrow management using Firestore.
 * Stores escrows in `escrows/{escrowId}` with milestones as subcollection.
 * 
 * @module services/firestore/escrow.firestore
 * @requirements 5.3
 */

import { BaseFirestoreService, SubcollectionFirestoreService, type QueryOptions } from './base.firestore';
import type { 
  FirestoreEscrow, 
  FirestoreMilestone,
  EscrowStatus,
  EscrowTransaction 
} from '../../types/firestore.types';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

/**
 * Input for creating an escrow
 */
export interface CreateEscrowInput {
  projectId: string;
  bidId: string;
  homeownerId: string;
  amount: number;
  currency?: string;
}

/**
 * Query parameters for listing escrows
 */
export interface EscrowQueryParams {
  status?: EscrowStatus | EscrowStatus[];
  projectId?: string;
  homeownerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Escrow with relations
 */
export interface EscrowWithRelations extends FirestoreEscrow {
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
    phone?: string;
  };
  milestones?: FirestoreMilestone[];
}

/**
 * Paginated escrow result
 */
export interface PaginatedEscrowResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}


/**
 * Escrow amount calculation result
 */
export interface EscrowAmount {
  amount: number;
  percentage: number;
  minApplied: boolean;
  maxApplied: boolean;
}

/**
 * Input for partial release
 */
export interface PartialReleaseInput {
  amount: number;
  note?: string;
}

/**
 * Input for refund
 */
export interface RefundInput {
  reason: string;
}

/**
 * Input for dispute
 */
export interface DisputeInput {
  reason: string;
}

/**
 * Valid status transitions for escrow
 */
export const ESCROW_STATUS_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  PENDING: ['HELD', 'CANCELLED'],
  HELD: ['PARTIAL_RELEASED', 'RELEASED', 'REFUNDED', 'DISPUTED'],
  PARTIAL_RELEASED: ['RELEASED', 'REFUNDED', 'DISPUTED'],
  RELEASED: [],
  REFUNDED: [],
  CANCELLED: [],
  DISPUTED: ['RELEASED', 'REFUNDED'],
};

/**
 * Default milestones configuration
 */
const DEFAULT_MILESTONES = [
  {
    name: '50% Completion',
    percentage: 50,
    releasePercentage: 50,
  },
  {
    name: '100% Completion',
    percentage: 100,
    releasePercentage: 50,
  },
];

// ============================================
// ESCROW FIRESTORE SERVICE
// ============================================

/**
 * Firestore service for escrow management
 * @requirements 5.3
 */
export class EscrowFirestoreService extends BaseFirestoreService<FirestoreEscrow> {
  private milestoneService: MilestoneSubcollectionService;
  private codeCounter = 0;

  constructor() {
    super('escrows');
    this.milestoneService = new MilestoneSubcollectionService();
  }

  // ============================================
  // CODE GENERATION
  // ============================================

  /**
   * Generate unique escrow code
   */
  private generateCode(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    this.codeCounter++;
    const sequence = this.codeCounter.toString().padStart(4, '0');
    
    return `ESC${year}${month}${sequence}`;
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new escrow
   * @requirements 5.3
   */
  async createEscrow(data: CreateEscrowInput): Promise<FirestoreEscrow> {
    const code = this.generateCode();
    
    const initialTransaction: EscrowTransaction = {
      type: 'DEPOSIT',
      amount: data.amount,
      date: new Date(),
      note: 'Escrow created',
    };

    const escrowData: Omit<FirestoreEscrow, 'id' | 'createdAt' | 'updatedAt'> = {
      code,
      projectId: data.projectId,
      bidId: data.bidId,
      homeownerId: data.homeownerId,
      amount: data.amount,
      releasedAmount: 0,
      currency: data.currency || 'VND',
      status: 'PENDING',
      transactions: [initialTransaction],
    };

    const escrow = await this.create(escrowData);
    
    logger.info('Escrow created', { escrowId: escrow.id, code: escrow.code });
    
    return escrow;
  }


  /**
   * Get escrow by project ID
   */
  async getByProject(projectId: string): Promise<FirestoreEscrow | null> {
    const escrows = await this.query({
      where: [{ field: 'projectId', operator: '==', value: projectId }],
      limit: 1,
    });
    
    return escrows.length > 0 ? escrows[0] : null;
  }

  /**
   * Get escrow by bid ID
   */
  async getByBid(bidId: string): Promise<FirestoreEscrow | null> {
    const escrows = await this.query({
      where: [{ field: 'bidId', operator: '==', value: bidId }],
      limit: 1,
    });
    
    return escrows.length > 0 ? escrows[0] : null;
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * List escrows with filtering and pagination
   */
  async list(params: EscrowQueryParams = {}): Promise<PaginatedEscrowResult<FirestoreEscrow>> {
    const { 
      status, 
      projectId, 
      homeownerId, 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = params;

    const options: QueryOptions<FirestoreEscrow> = {
      where: [],
      orderBy: [{ field: sortBy, direction: sortOrder }],
      limit: limit + 1, // Fetch one extra to check hasMore
    };

    if (status) {
      if (Array.isArray(status)) {
        options.where?.push({ field: 'status', operator: 'in', value: status });
      } else {
        options.where?.push({ field: 'status', operator: '==', value: status });
      }
    }

    if (projectId) {
      options.where?.push({ field: 'projectId', operator: '==', value: projectId });
    }

    if (homeownerId) {
      options.where?.push({ field: 'homeownerId', operator: '==', value: homeownerId });
    }

    const allEscrows = await this.query(options);
    
    // Manual pagination since Firestore doesn't support offset
    const start = (page - 1) * limit;
    const paginatedData = allEscrows.slice(start, start + limit);
    const total = allEscrows.length;

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

  // ============================================
  // STATUS TRANSITION OPERATIONS
  // ============================================

  /**
   * Check if status transition is valid
   */
  isValidTransition(currentStatus: EscrowStatus, newStatus: EscrowStatus): boolean {
    const validTransitions = ESCROW_STATUS_TRANSITIONS[currentStatus] || [];
    return validTransitions.includes(newStatus);
  }

  /**
   * Confirm escrow deposit (admin)
   */
  async confirmDeposit(id: string, adminId: string, note?: string): Promise<FirestoreEscrow> {
    const escrow = await this.getById(id);
    
    if (!escrow) {
      throw new EscrowFirestoreError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    if (!this.isValidTransition(escrow.status, 'HELD')) {
      throw new EscrowFirestoreError(
        'ESCROW_INVALID_TRANSITION',
        `Cannot confirm escrow in ${escrow.status} status`,
        400
      );
    }

    const transactions = escrow.transactions || [];
    transactions.push({
      type: 'DEPOSIT',
      amount: escrow.amount,
      date: new Date(),
      note: note || 'Deposit confirmed by admin',
      adminId,
    });

    const updated = await this.update(id, {
      status: 'HELD',
      confirmedBy: adminId,
      confirmedAt: new Date(),
      transactions,
    } as Partial<Omit<FirestoreEscrow, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Escrow deposit confirmed', { escrowId: id, adminId });
    
    return updated;
  }


  /**
   * Release escrow fully (admin)
   */
  async release(id: string, adminId: string, note?: string): Promise<FirestoreEscrow> {
    const escrow = await this.getById(id);
    
    if (!escrow) {
      throw new EscrowFirestoreError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    if (!this.isValidTransition(escrow.status, 'RELEASED')) {
      throw new EscrowFirestoreError(
        'ESCROW_INVALID_TRANSITION',
        `Cannot release escrow in ${escrow.status} status`,
        400
      );
    }

    const remainingAmount = escrow.amount - escrow.releasedAmount;
    const transactions = escrow.transactions || [];
    transactions.push({
      type: 'RELEASE',
      amount: remainingAmount,
      date: new Date(),
      note: note || 'Full escrow released by admin',
      adminId,
    });

    const updated = await this.update(id, {
      status: 'RELEASED',
      releasedAmount: escrow.amount,
      releasedBy: adminId,
      releasedAt: new Date(),
      transactions,
    } as Partial<Omit<FirestoreEscrow, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Escrow released', { escrowId: id, adminId });
    
    return updated;
  }

  /**
   * Partially release escrow (admin)
   */
  async partialRelease(id: string, adminId: string, data: PartialReleaseInput): Promise<FirestoreEscrow> {
    const escrow = await this.getById(id);
    
    if (!escrow) {
      throw new EscrowFirestoreError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    if (!['HELD', 'PARTIAL_RELEASED'].includes(escrow.status)) {
      throw new EscrowFirestoreError(
        'ESCROW_INVALID_TRANSITION',
        `Cannot partially release escrow in ${escrow.status} status`,
        400
      );
    }

    const remainingAmount = escrow.amount - escrow.releasedAmount;
    if (data.amount > remainingAmount) {
      throw new EscrowFirestoreError(
        'ESCROW_INVALID_AMOUNT',
        `Cannot release ${data.amount}. Only ${remainingAmount} remaining`,
        400
      );
    }

    const transactions = escrow.transactions || [];
    transactions.push({
      type: 'PARTIAL_RELEASE',
      amount: data.amount,
      date: new Date(),
      note: data.note || 'Partial escrow released by admin',
      adminId,
    });

    const newReleasedAmount = escrow.releasedAmount + data.amount;
    const newStatus: EscrowStatus = newReleasedAmount >= escrow.amount ? 'RELEASED' : 'PARTIAL_RELEASED';

    const updated = await this.update(id, {
      status: newStatus,
      releasedAmount: newReleasedAmount,
      releasedBy: newStatus === 'RELEASED' ? adminId : escrow.releasedBy,
      releasedAt: newStatus === 'RELEASED' ? new Date() : escrow.releasedAt,
      transactions,
    } as Partial<Omit<FirestoreEscrow, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Escrow partially released', { escrowId: id, amount: data.amount, adminId });
    
    return updated;
  }

  /**
   * Refund escrow (admin)
   */
  async refund(id: string, adminId: string, data: RefundInput): Promise<FirestoreEscrow> {
    const escrow = await this.getById(id);
    
    if (!escrow) {
      throw new EscrowFirestoreError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    if (!this.isValidTransition(escrow.status, 'REFUNDED')) {
      throw new EscrowFirestoreError(
        'ESCROW_INVALID_TRANSITION',
        `Cannot refund escrow in ${escrow.status} status`,
        400
      );
    }

    const refundAmount = escrow.amount - escrow.releasedAmount;
    const transactions = escrow.transactions || [];
    transactions.push({
      type: 'REFUND',
      amount: refundAmount,
      date: new Date(),
      note: data.reason,
      adminId,
    });

    const updated = await this.update(id, {
      status: 'REFUNDED',
      transactions,
    } as Partial<Omit<FirestoreEscrow, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Escrow refunded', { escrowId: id, adminId });
    
    return updated;
  }


  /**
   * Mark escrow as disputed (admin or user)
   */
  async markDisputed(id: string, userId: string, data: DisputeInput): Promise<FirestoreEscrow> {
    const escrow = await this.getById(id);
    
    if (!escrow) {
      throw new EscrowFirestoreError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    if (!this.isValidTransition(escrow.status, 'DISPUTED')) {
      throw new EscrowFirestoreError(
        'ESCROW_INVALID_TRANSITION',
        `Cannot dispute escrow in ${escrow.status} status`,
        400
      );
    }

    const transactions = escrow.transactions || [];
    transactions.push({
      type: 'REFUND', // Using REFUND type for dispute logging
      amount: 0,
      date: new Date(),
      note: `Disputed: ${data.reason}`,
    });

    const updated = await this.update(id, {
      status: 'DISPUTED',
      disputeReason: data.reason,
      disputedBy: userId,
      transactions,
    } as Partial<Omit<FirestoreEscrow, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Escrow disputed', { escrowId: id, userId });
    
    return updated;
  }

  /**
   * Resolve dispute (admin)
   */
  async resolveDispute(
    id: string, 
    adminId: string, 
    resolution: 'RELEASE' | 'REFUND',
    note?: string
  ): Promise<FirestoreEscrow> {
    const escrow = await this.getById(id);
    
    if (!escrow) {
      throw new EscrowFirestoreError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    if (escrow.status !== 'DISPUTED') {
      throw new EscrowFirestoreError(
        'ESCROW_INVALID_TRANSITION',
        'Can only resolve disputed escrows',
        400
      );
    }

    const newStatus: EscrowStatus = resolution === 'RELEASE' ? 'RELEASED' : 'REFUNDED';
    const transactions = escrow.transactions || [];
    
    if (resolution === 'RELEASE') {
      const remainingAmount = escrow.amount - escrow.releasedAmount;
      transactions.push({
        type: 'RELEASE',
        amount: remainingAmount,
        date: new Date(),
        note: note || 'Dispute resolved - released to contractor',
        adminId,
      });
    } else {
      const refundAmount = escrow.amount - escrow.releasedAmount;
      transactions.push({
        type: 'REFUND',
        amount: refundAmount,
        date: new Date(),
        note: note || 'Dispute resolved - refunded to homeowner',
        adminId,
      });
    }

    const updated = await this.update(id, {
      status: newStatus,
      releasedAmount: resolution === 'RELEASE' ? escrow.amount : escrow.releasedAmount,
      releasedBy: resolution === 'RELEASE' ? adminId : escrow.releasedBy,
      releasedAt: resolution === 'RELEASE' ? new Date() : escrow.releasedAt,
      disputeResolvedAt: new Date(),
      disputeResolution: note || `Resolved by ${resolution.toLowerCase()}`,
      transactions,
    } as Partial<Omit<FirestoreEscrow, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Escrow dispute resolved', { escrowId: id, resolution, adminId });
    
    return updated;
  }

  /**
   * Cancel escrow (admin)
   */
  async cancel(id: string, adminId: string, reason?: string): Promise<FirestoreEscrow> {
    const escrow = await this.getById(id);
    
    if (!escrow) {
      throw new EscrowFirestoreError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    if (!this.isValidTransition(escrow.status, 'CANCELLED')) {
      throw new EscrowFirestoreError(
        'ESCROW_INVALID_TRANSITION',
        `Cannot cancel escrow in ${escrow.status} status`,
        400
      );
    }

    const transactions = escrow.transactions || [];
    transactions.push({
      type: 'REFUND',
      amount: 0,
      date: new Date(),
      note: reason || 'Escrow cancelled',
      adminId,
    });

    const updated = await this.update(id, {
      status: 'CANCELLED',
      transactions,
    } as Partial<Omit<FirestoreEscrow, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Escrow cancelled', { escrowId: id, adminId });
    
    return updated;
  }

  // ============================================
  // MILESTONE OPERATIONS
  // ============================================

  /**
   * Create default milestones for an escrow
   */
  async createDefaultMilestones(escrowId: string, projectId: string): Promise<FirestoreMilestone[]> {
    const escrow = await this.getById(escrowId);
    
    if (!escrow) {
      throw new EscrowFirestoreError('ESCROW_NOT_FOUND', 'Escrow not found', 404);
    }

    // Check if milestones already exist
    const existingMilestones = await this.milestoneService.getAll(escrowId);
    if (existingMilestones.length > 0) {
      throw new EscrowFirestoreError(
        'MILESTONES_ALREADY_EXIST',
        'Milestones already exist for this escrow',
        409
      );
    }

    const milestones: FirestoreMilestone[] = [];
    
    for (const config of DEFAULT_MILESTONES) {
      const milestone = await this.milestoneService.create(escrowId, {
        escrowId,
        projectId,
        name: config.name,
        percentage: config.percentage,
        releasePercentage: config.releasePercentage,
        status: 'PENDING',
      });
      milestones.push(milestone);
    }
    
    logger.info('Default milestones created', { escrowId, count: milestones.length });
    
    return milestones;
  }

  /**
   * Get milestones for an escrow
   */
  async getMilestones(escrowId: string): Promise<FirestoreMilestone[]> {
    return this.milestoneService.getAll(escrowId);
  }

  /**
   * Get milestone service for direct access
   */
  getMilestoneService(): MilestoneSubcollectionService {
    return this.milestoneService;
  }
}


// ============================================
// MILESTONE SUBCOLLECTION SERVICE
// ============================================

/**
 * Service for managing milestones as subcollection of escrows
 * @requirements 5.3
 */
export class MilestoneSubcollectionService extends SubcollectionFirestoreService<FirestoreMilestone> {
  constructor() {
    super('escrows', 'milestones');
  }

  /**
   * Get milestones ordered by percentage
   */
  async getOrdered(escrowId: string): Promise<FirestoreMilestone[]> {
    const milestones = await this.query(escrowId, {
      orderBy: [{ field: 'percentage', direction: 'asc' }],
    });
    return milestones;
  }

  /**
   * Request milestone completion (contractor)
   */
  async requestCompletion(
    escrowId: string,
    milestoneId: string,
    contractorId: string
  ): Promise<FirestoreMilestone> {
    const milestone = await this.getById(escrowId, milestoneId);
    
    if (!milestone) {
      throw new EscrowFirestoreError('MILESTONE_NOT_FOUND', 'Milestone not found', 404);
    }

    if (milestone.status !== 'PENDING') {
      throw new EscrowFirestoreError(
        'MILESTONE_INVALID_STATUS',
        `Cannot request completion for milestone in ${milestone.status} status`,
        400
      );
    }

    // Check if previous milestones are completed
    const allMilestones = await this.getOrdered(escrowId);
    const previousMilestones = allMilestones.filter(
      m => m.percentage < milestone.percentage && m.status !== 'CONFIRMED'
    );

    if (previousMilestones.length > 0) {
      throw new EscrowFirestoreError(
        'PREVIOUS_MILESTONE_NOT_COMPLETED',
        'Previous milestones must be confirmed before requesting this one',
        400
      );
    }

    const updated = await this.update(escrowId, milestoneId, {
      status: 'REQUESTED',
      requestedAt: new Date(),
      requestedBy: contractorId,
    } as Partial<Omit<FirestoreMilestone, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Milestone completion requested', { escrowId, milestoneId, contractorId });
    
    return updated;
  }

  /**
   * Confirm milestone completion (homeowner)
   */
  async confirmCompletion(
    escrowId: string,
    milestoneId: string,
    homeownerId: string
  ): Promise<FirestoreMilestone> {
    const milestone = await this.getById(escrowId, milestoneId);
    
    if (!milestone) {
      throw new EscrowFirestoreError('MILESTONE_NOT_FOUND', 'Milestone not found', 404);
    }

    if (milestone.status !== 'REQUESTED') {
      throw new EscrowFirestoreError(
        'MILESTONE_INVALID_STATUS',
        `Cannot confirm milestone in ${milestone.status} status`,
        400
      );
    }

    const updated = await this.update(escrowId, milestoneId, {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      confirmedBy: homeownerId,
    } as Partial<Omit<FirestoreMilestone, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Milestone confirmed', { escrowId, milestoneId, homeownerId });
    
    return updated;
  }

  /**
   * Dispute milestone (homeowner)
   */
  async disputeMilestone(
    escrowId: string,
    milestoneId: string,
    homeownerId: string,
    reason: string
  ): Promise<FirestoreMilestone> {
    const milestone = await this.getById(escrowId, milestoneId);
    
    if (!milestone) {
      throw new EscrowFirestoreError('MILESTONE_NOT_FOUND', 'Milestone not found', 404);
    }

    if (milestone.status !== 'REQUESTED') {
      throw new EscrowFirestoreError(
        'MILESTONE_INVALID_STATUS',
        `Cannot dispute milestone in ${milestone.status} status`,
        400
      );
    }

    const updated = await this.update(escrowId, milestoneId, {
      status: 'DISPUTED',
      disputedAt: new Date(),
      disputeReason: reason,
    } as Partial<Omit<FirestoreMilestone, 'id' | 'createdAt' | 'updatedAt'>>);
    
    logger.info('Milestone disputed', { escrowId, milestoneId, homeownerId, reason });
    
    return updated;
  }

  /**
   * Get milestones by project ID
   */
  async getByProjectId(projectId: string): Promise<FirestoreMilestone[]> {
    // Since milestones are subcollection of escrows, we need to search across all escrows
    // This is a limitation of Firestore subcollections
    // In practice, you'd typically have the escrowId available
    const db = await this.getDb();
    const escrowsSnapshot = await db.collection('escrows')
      .where('projectId', '==', projectId)
      .get();
    
    const milestones: FirestoreMilestone[] = [];
    
    for (const escrowDoc of escrowsSnapshot.docs) {
      const escrowMilestones = await this.getAll(escrowDoc.id);
      milestones.push(...escrowMilestones);
    }
    
    return milestones.sort((a, b) => a.percentage - b.percentage);
  }

  /**
   * Get Firestore instance (expose for cross-collection queries)
   */
  protected async getDb() {
    const { getFirestore } = await import('../firebase-admin.service');
    return getFirestore();
  }
}

// ============================================
// ERROR CLASS
// ============================================

export class EscrowFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'EscrowFirestoreError';

    const statusMap: Record<string, number> = {
      ESCROW_NOT_FOUND: 404,
      MILESTONE_NOT_FOUND: 404,
      ESCROW_INVALID_TRANSITION: 400,
      ESCROW_INVALID_AMOUNT: 400,
      MILESTONE_INVALID_STATUS: 400,
      PREVIOUS_MILESTONE_NOT_COMPLETED: 400,
      MILESTONES_ALREADY_EXIST: 409,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let escrowFirestoreService: EscrowFirestoreService | null = null;

export function getEscrowFirestoreService(): EscrowFirestoreService {
  if (!escrowFirestoreService) {
    escrowFirestoreService = new EscrowFirestoreService();
  }
  return escrowFirestoreService;
}

export default EscrowFirestoreService;
