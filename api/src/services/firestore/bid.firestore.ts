/**
 * Bid Firestore Service
 * 
 * Business logic for bid management using Firestore.
 * Bids are stored as subcollection of projects: `projects/{projectId}/bids/{bidId}`
 * 
 * @module services/firestore/bid.firestore
 * @requirements 5.2
 */

import { BaseFirestoreService, SubcollectionFirestoreService, type QueryOptions } from './base.firestore';
import type { 
  FirestoreBid, 
  FirestoreProject,
  FirestoreUser,
  BidStatus,
  Attachment 
} from '../../types/firestore.types';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

/**
 * Input for creating a bid
 */
export interface CreateBidInput {
  projectId: string;
  contractorId: string;
  price: number;
  timeline: string;
  proposal: string;
  attachments?: Attachment[];
}

/**
 * Input for updating a bid
 */
export interface UpdateBidInput {
  price?: number;
  timeline?: string;
  proposal?: string;
  attachments?: Attachment[];
}

/**
 * Query parameters for listing bids
 */
export interface BidQueryParams {
  status?: BidStatus | BidStatus[];
  projectId?: string;
  contractorId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'price';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Bid with project info
 */
export interface BidWithProject extends FirestoreBid {
  project?: {
    id: string;
    code: string;
    title: string;
    status: string;
    bidDeadline?: Date;
  };
}

/**
 * Bid with contractor info
 */
export interface BidWithContractor extends FirestoreBid {
  contractor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    rating: number;
    totalProjects: number;
    verificationStatus: string;
  };
}

/**
 * Full bid with relations
 */
export interface BidWithRelations extends FirestoreBid {
  project?: {
    id: string;
    code: string;
    title: string;
    status: string;
    bidDeadline?: Date;
  };
  contractor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    rating: number;
    totalProjects: number;
    verificationStatus: string;
  };
}

/**
 * Anonymous bid for homeowner view
 */
export interface AnonymousBid {
  id: string;
  code: string;
  anonymousName: string;
  contractorRating: number;
  contractorTotalProjects: number;
  price: number;
  timeline: string;
  proposal: string;
  attachments?: Attachment[];
  status: BidStatus;
  createdAt: Date;
}

/**
 * Paginated result
 */
export interface PaginatedBidResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Valid status transitions for bids
 */
export const BID_STATUS_TRANSITIONS: Record<BidStatus, BidStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED', 'WITHDRAWN'],
  APPROVED: ['SELECTED', 'NOT_SELECTED', 'WITHDRAWN'],
  REJECTED: [],
  SELECTED: [],
  NOT_SELECTED: [],
  WITHDRAWN: [],
};

/**
 * Anonymous name labels for homeowner view
 */
const ANONYMOUS_LABELS = [
  'Nhà thầu A', 'Nhà thầu B', 'Nhà thầu C', 'Nhà thầu D', 'Nhà thầu E',
  'Nhà thầu F', 'Nhà thầu G', 'Nhà thầu H', 'Nhà thầu I', 'Nhà thầu J',
  'Nhà thầu K', 'Nhà thầu L', 'Nhà thầu M', 'Nhà thầu N', 'Nhà thầu O',
];

// ============================================
// BID FIRESTORE SERVICE
// ============================================

/**
 * Firestore service for bid management
 * @requirements 5.2
 */
export class BidFirestoreService {
  private bidSubcollection: BidSubcollectionService;
  private projectService: BaseFirestoreService<FirestoreProject>;
  private userService: BaseFirestoreService<FirestoreUser>;
  private codeCounter = 0;

  constructor() {
    this.bidSubcollection = new BidSubcollectionService();
    this.projectService = new BaseFirestoreService<FirestoreProject>('projects');
    this.userService = new BaseFirestoreService<FirestoreUser>('users');
  }

  // ============================================
  // CODE GENERATION
  // ============================================

  /**
   * Generate unique bid code
   */
  private generateCode(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    this.codeCounter++;
    const sequence = this.codeCounter.toString().padStart(4, '0');
    
    return `BID${year}${month}${sequence}`;
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new bid
   * @requirements 5.2
   */
  async create(contractorId: string, data: CreateBidInput): Promise<BidWithRelations> {
    // Validate contractor exists and is verified
    const contractor = await this.userService.getById(contractorId);
    
    if (!contractor) {
      throw new BidFirestoreError('CONTRACTOR_NOT_FOUND', 'Contractor not found', 404);
    }

    if (contractor.verificationStatus !== 'VERIFIED') {
      throw new BidFirestoreError(
        'CONTRACTOR_NOT_VERIFIED',
        'Only verified contractors can submit bids',
        403
      );
    }

    // Validate project exists and is OPEN
    const project = await this.projectService.getById(data.projectId);
    
    if (!project) {
      throw new BidFirestoreError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.status !== 'OPEN') {
      throw new BidFirestoreError(
        'BID_PROJECT_NOT_OPEN',
        'Can only bid on projects with OPEN status',
        400
      );
    }

    // Check bid deadline
    if (project.bidDeadline && project.bidDeadline <= new Date()) {
      throw new BidFirestoreError(
        'BID_DEADLINE_PASSED',
        'Project bid deadline has passed',
        400
      );
    }

    // Check max bids
    const existingBids = await this.bidSubcollection.getBids(data.projectId);
    const activeBids = existingBids.filter(b => !['WITHDRAWN', 'REJECTED'].includes(b.status));
    
    if (activeBids.length >= project.maxBids) {
      throw new BidFirestoreError(
        'BID_MAX_REACHED',
        'Project has reached maximum number of bids',
        400
      );
    }

    // Check contractor hasn't already bid
    const hasExistingBid = await this.bidSubcollection.hasContractorBid(data.projectId, contractorId);
    if (hasExistingBid) {
      throw new BidFirestoreError(
        'BID_ALREADY_EXISTS',
        'You have already submitted a bid for this project',
        409
      );
    }

    // Calculate response time
    let responseTimeHours: number | undefined;
    if (project.publishedAt) {
      const now = new Date();
      responseTimeHours = (now.getTime() - project.publishedAt.getTime()) / (1000 * 60 * 60);
      responseTimeHours = Math.round(responseTimeHours * 10) / 10;
    }

    const code = this.generateCode();
    
    const bidData: Omit<FirestoreBid, 'id' | 'createdAt' | 'updatedAt'> = {
      code,
      projectId: data.projectId,
      contractorId,
      price: data.price,
      timeline: data.timeline,
      proposal: data.proposal,
      attachments: data.attachments,
      responseTimeHours,
      status: 'PENDING',
    };

    const bid = await this.bidSubcollection.create(data.projectId, bidData);
    
    logger.info('Bid created', { bidId: bid.id, code: bid.code, projectId: data.projectId });

    return {
      ...bid,
      project: {
        id: project.id,
        code: project.code,
        title: project.title,
        status: project.status,
        bidDeadline: project.bidDeadline,
      },
      contractor: {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        totalProjects: contractor.totalProjects,
        verificationStatus: contractor.verificationStatus,
      },
    };
  }

  /**
   * Get bid by ID
   */
  async getById(projectId: string, bidId: string): Promise<FirestoreBid | null> {
    return this.bidSubcollection.getById(projectId, bidId);
  }

  /**
   * Get bid with relations
   */
  async getByIdWithRelations(projectId: string, bidId: string): Promise<BidWithRelations | null> {
    const bid = await this.bidSubcollection.getById(projectId, bidId);
    
    if (!bid) {
      return null;
    }

    const [project, contractor] = await Promise.all([
      this.projectService.getById(projectId),
      this.userService.getById(bid.contractorId),
    ]);

    return {
      ...bid,
      project: project ? {
        id: project.id,
        code: project.code,
        title: project.title,
        status: project.status,
        bidDeadline: project.bidDeadline,
      } : undefined,
      contractor: contractor ? {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        totalProjects: contractor.totalProjects,
        verificationStatus: contractor.verificationStatus,
      } : undefined,
    };
  }

  /**
   * Update a bid
   */
  async update(
    projectId: string,
    bidId: string,
    contractorId: string,
    data: UpdateBidInput
  ): Promise<BidWithRelations> {
    const bid = await this.bidSubcollection.getById(projectId, bidId);
    
    if (!bid) {
      throw new BidFirestoreError('BID_NOT_FOUND', 'Bid not found', 404);
    }

    if (bid.contractorId !== contractorId) {
      throw new BidFirestoreError('BID_ACCESS_DENIED', 'Access denied', 403);
    }

    if (bid.status !== 'PENDING') {
      throw new BidFirestoreError(
        'BID_INVALID_STATUS',
        'Can only update bids in PENDING status',
        400
      );
    }

    // Check project deadline
    const project = await this.projectService.getById(projectId);
    if (project?.bidDeadline && project.bidDeadline <= new Date()) {
      throw new BidFirestoreError(
        'BID_DEADLINE_PASSED',
        'Project bid deadline has passed',
        400
      );
    }

    const updatedBid = await this.bidSubcollection.update(projectId, bidId, data);
    
    logger.info('Bid updated', { bidId, projectId });

    const contractor = await this.userService.getById(contractorId);

    return {
      ...updatedBid,
      project: project ? {
        id: project.id,
        code: project.code,
        title: project.title,
        status: project.status,
        bidDeadline: project.bidDeadline,
      } : undefined,
      contractor: contractor ? {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        totalProjects: contractor.totalProjects,
        verificationStatus: contractor.verificationStatus,
      } : undefined,
    };
  }

  /**
   * Withdraw a bid
   */
  async withdraw(projectId: string, bidId: string, contractorId: string): Promise<BidWithRelations> {
    const bid = await this.bidSubcollection.getById(projectId, bidId);
    
    if (!bid) {
      throw new BidFirestoreError('BID_NOT_FOUND', 'Bid not found', 404);
    }

    if (bid.contractorId !== contractorId) {
      throw new BidFirestoreError('BID_ACCESS_DENIED', 'Access denied', 403);
    }

    if (!['PENDING', 'APPROVED'].includes(bid.status)) {
      throw new BidFirestoreError(
        'BID_INVALID_STATUS',
        'Can only withdraw bids in PENDING or APPROVED status',
        400
      );
    }

    const updatedBid = await this.bidSubcollection.updateStatus(projectId, bidId, 'WITHDRAWN');
    
    logger.info('Bid withdrawn', { bidId, projectId });

    const [project, contractor] = await Promise.all([
      this.projectService.getById(projectId),
      this.userService.getById(contractorId),
    ]);

    return {
      ...updatedBid,
      project: project ? {
        id: project.id,
        code: project.code,
        title: project.title,
        status: project.status,
        bidDeadline: project.bidDeadline,
      } : undefined,
      contractor: contractor ? {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        totalProjects: contractor.totalProjects,
        verificationStatus: contractor.verificationStatus,
      } : undefined,
    };
  }

  // ============================================
  // STATUS TRANSITIONS
  // ============================================

  /**
   * Check if status transition is valid
   */
  isValidTransition(currentStatus: BidStatus, newStatus: BidStatus): boolean {
    const validTransitions = BID_STATUS_TRANSITIONS[currentStatus] || [];
    return validTransitions.includes(newStatus);
  }

  /**
   * Approve a bid (admin)
   */
  async approve(
    projectId: string,
    bidId: string,
    adminId: string,
    note?: string
  ): Promise<BidWithRelations> {
    const bid = await this.bidSubcollection.getById(projectId, bidId);
    
    if (!bid) {
      throw new BidFirestoreError('BID_NOT_FOUND', 'Bid not found', 404);
    }

    if (bid.status !== 'PENDING') {
      throw new BidFirestoreError(
        'BID_INVALID_STATUS',
        'Can only approve bids in PENDING status',
        400
      );
    }

    const project = await this.projectService.getById(projectId);
    if (project?.status !== 'OPEN') {
      throw new BidFirestoreError(
        'BID_PROJECT_NOT_OPEN',
        'Cannot approve bid for a project that is not OPEN',
        400
      );
    }

    const updatedBid = await this.bidSubcollection.updateStatus(projectId, bidId, 'APPROVED', {
      reviewedBy: adminId,
      reviewNote: note,
    });
    
    logger.info('Bid approved', { bidId, projectId, adminId });

    const contractor = await this.userService.getById(bid.contractorId);

    return {
      ...updatedBid,
      project: project ? {
        id: project.id,
        code: project.code,
        title: project.title,
        status: project.status,
        bidDeadline: project.bidDeadline,
      } : undefined,
      contractor: contractor ? {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        totalProjects: contractor.totalProjects,
        verificationStatus: contractor.verificationStatus,
      } : undefined,
    };
  }

  /**
   * Reject a bid (admin)
   */
  async reject(
    projectId: string,
    bidId: string,
    adminId: string,
    note: string
  ): Promise<BidWithRelations> {
    const bid = await this.bidSubcollection.getById(projectId, bidId);
    
    if (!bid) {
      throw new BidFirestoreError('BID_NOT_FOUND', 'Bid not found', 404);
    }

    if (bid.status !== 'PENDING') {
      throw new BidFirestoreError(
        'BID_INVALID_STATUS',
        'Can only reject bids in PENDING status',
        400
      );
    }

    const updatedBid = await this.bidSubcollection.updateStatus(projectId, bidId, 'REJECTED', {
      reviewedBy: adminId,
      reviewNote: note,
    });
    
    logger.info('Bid rejected', { bidId, projectId, adminId });

    const [project, contractor] = await Promise.all([
      this.projectService.getById(projectId),
      this.userService.getById(bid.contractorId),
    ]);

    return {
      ...updatedBid,
      project: project ? {
        id: project.id,
        code: project.code,
        title: project.title,
        status: project.status,
        bidDeadline: project.bidDeadline,
      } : undefined,
      contractor: contractor ? {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        totalProjects: contractor.totalProjects,
        verificationStatus: contractor.verificationStatus,
      } : undefined,
    };
  }

  /**
   * Select a bid (homeowner selects, creates match)
   */
  async select(projectId: string, bidId: string): Promise<FirestoreBid> {
    const bid = await this.bidSubcollection.getById(projectId, bidId);
    
    if (!bid) {
      throw new BidFirestoreError('BID_NOT_FOUND', 'Bid not found', 404);
    }

    if (bid.status !== 'PENDING' && bid.status !== 'APPROVED') {
      throw new BidFirestoreError(
        'BID_INVALID_STATUS',
        'Can only select bids in PENDING or APPROVED status',
        400
      );
    }

    const updatedBid = await this.bidSubcollection.updateStatus(projectId, bidId, 'SELECTED');
    
    logger.info('Bid selected', { bidId, projectId });

    return updatedBid;
  }

  /**
   * Mark other bids as not selected
   */
  async markOthersNotSelected(projectId: string, selectedBidId: string): Promise<void> {
    const bids = await this.bidSubcollection.getBids(projectId);
    
    for (const bid of bids) {
      if (bid.id !== selectedBidId && ['PENDING', 'APPROVED'].includes(bid.status)) {
        await this.bidSubcollection.updateStatus(projectId, bid.id, 'NOT_SELECTED');
      }
    }
    
    logger.info('Other bids marked as not selected', { projectId, selectedBidId });
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * Get bids by contractor
   */
  async getByContractor(
    contractorId: string,
    params: BidQueryParams = {}
  ): Promise<PaginatedBidResult<BidWithProject>> {
    const { status, page = 1, limit = 20 } = params;

    // Get all projects first (we need to search across all project subcollections)
    const projects = await this.projectService.query({
      limit: 1000, // Get all projects
    });

    const allBids: BidWithProject[] = [];

    // Search for contractor's bids in each project
    for (const project of projects) {
      const bids = await this.bidSubcollection.getBids(project.id, status);
      const contractorBids = bids.filter(b => b.contractorId === contractorId);
      
      for (const bid of contractorBids) {
        allBids.push({
          ...bid,
          project: {
            id: project.id,
            code: project.code,
            title: project.title,
            status: project.status,
            bidDeadline: project.bidDeadline,
          },
        });
      }
    }

    // Sort by createdAt desc
    allBids.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate
    const total = allBids.length;
    const start = (page - 1) * limit;
    const data = allBids.slice(start, start + limit);

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
   * Get bids for a project (homeowner view - anonymous)
   */
  async getBidsByProject(
    projectId: string,
    ownerId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedBidResult<AnonymousBid>> {
    const { page = 1, limit = 20 } = params;

    // Verify project ownership
    const project = await this.projectService.getById(projectId);
    
    if (!project) {
      throw new BidFirestoreError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.ownerId !== ownerId) {
      throw new BidFirestoreError('PROJECT_ACCESS_DENIED', 'Access denied', 403);
    }

    // Get PENDING bids
    const bids = await this.bidSubcollection.getBids(projectId, 'PENDING');

    // Get contractor info for each bid
    const anonymousBids: AnonymousBid[] = [];
    
    for (let i = 0; i < bids.length; i++) {
      const bid = bids[i];
      const contractor = await this.userService.getById(bid.contractorId);
      
      anonymousBids.push({
        id: bid.id,
        code: bid.code,
        anonymousName: ANONYMOUS_LABELS[i] || `Nhà thầu ${i + 1}`,
        contractorRating: contractor?.rating || 0,
        contractorTotalProjects: contractor?.totalProjects || 0,
        price: bid.price,
        timeline: bid.timeline,
        proposal: bid.proposal,
        attachments: bid.attachments,
        status: bid.status,
        createdAt: bid.createdAt,
      });
    }

    // Paginate
    const total = anonymousBids.length;
    const start = (page - 1) * limit;
    const data = anonymousBids.slice(start, start + limit);

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
   * Get all bids for admin
   */
  async getAdminList(params: BidQueryParams = {}): Promise<PaginatedBidResult<BidWithRelations>> {
    const { status, projectId, contractorId, page = 1, limit = 20 } = params;

    let projects: FirestoreProject[];
    
    if (projectId) {
      const project = await this.projectService.getById(projectId);
      projects = project ? [project] : [];
    } else {
      projects = await this.projectService.query({ limit: 1000 });
    }

    const allBids: BidWithRelations[] = [];

    for (const project of projects) {
      const bids = await this.bidSubcollection.getBids(project.id, status);
      
      for (const bid of bids) {
        if (contractorId && bid.contractorId !== contractorId) {
          continue;
        }

        const contractor = await this.userService.getById(bid.contractorId);
        
        allBids.push({
          ...bid,
          project: {
            id: project.id,
            code: project.code,
            title: project.title,
            status: project.status,
            bidDeadline: project.bidDeadline,
          },
          contractor: contractor ? {
            id: contractor.id,
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
            rating: contractor.rating,
            totalProjects: contractor.totalProjects,
            verificationStatus: contractor.verificationStatus,
          } : undefined,
        });
      }
    }

    // Sort by createdAt desc
    allBids.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate
    const total = allBids.length;
    const start = (page - 1) * limit;
    const data = allBids.slice(start, start + limit);

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
   * Get bid subcollection service for direct access
   */
  getBidSubcollection(): BidSubcollectionService {
    return this.bidSubcollection;
  }
}

// ============================================
// BID SUBCOLLECTION SERVICE
// ============================================

/**
 * Service for managing bids as subcollection of projects
 */
export class BidSubcollectionService extends SubcollectionFirestoreService<FirestoreBid> {
  constructor() {
    super('projects', 'bids');
  }

  /**
   * Get bids for a project
   */
  async getBids(projectId: string, status?: BidStatus | BidStatus[]): Promise<FirestoreBid[]> {
    const options: QueryOptions<FirestoreBid> = {
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    };

    if (status) {
      if (Array.isArray(status)) {
        options.where = [{ field: 'status', operator: 'in', value: status }];
      } else {
        options.where = [{ field: 'status', operator: '==', value: status }];
      }
    }

    return this.query(projectId, options);
  }

  /**
   * Count bids for a project
   */
  async countBids(projectId: string, status?: BidStatus): Promise<number> {
    const bids = await this.getBids(projectId, status);
    return bids.length;
  }

  /**
   * Update bid status
   */
  async updateStatus(
    projectId: string,
    bidId: string,
    status: BidStatus,
    reviewData?: { reviewedBy?: string; reviewNote?: string }
  ): Promise<FirestoreBid> {
    const updateData: Partial<FirestoreBid> = {
      status,
      ...(reviewData?.reviewedBy && { reviewedBy: reviewData.reviewedBy }),
      ...(reviewData?.reviewNote && { reviewNote: reviewData.reviewNote }),
      reviewedAt: new Date(),
    };

    return this.update(projectId, bidId, updateData as Partial<Omit<FirestoreBid, 'id' | 'createdAt' | 'updatedAt'>>);
  }

  /**
   * Check if contractor already has a bid on project
   */
  async hasContractorBid(projectId: string, contractorId: string): Promise<boolean> {
    const bids = await this.query(projectId, {
      where: [{ field: 'contractorId', operator: '==', value: contractorId }],
    });
    // Filter out withdrawn and rejected bids
    const activeBids = bids.filter(bid => !['WITHDRAWN', 'REJECTED'].includes(bid.status));
    return activeBids.length > 0;
  }
}

// ============================================
// ERROR CLASS
// ============================================

export class BidFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'BidFirestoreError';

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

// ============================================
// SINGLETON INSTANCE
// ============================================

let bidFirestoreService: BidFirestoreService | null = null;

export function getBidFirestoreService(): BidFirestoreService {
  if (!bidFirestoreService) {
    bidFirestoreService = new BidFirestoreService();
  }
  return bidFirestoreService;
}

export default BidFirestoreService;
