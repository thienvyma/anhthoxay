/**
 * Project Firestore Service
 * 
 * Business logic for project management using Firestore.
 * Stores projects in `projects/{projectId}` with bids as subcollection.
 * 
 * @module services/firestore/project.firestore
 * @requirements 5.1, 5.2, 5.5
 */

import { BaseFirestoreService, SubcollectionFirestoreService, type QueryOptions, type PaginatedResult } from './base.firestore';
import type { 
  FirestoreProject, 
  FirestoreBid, 
  ProjectStatus, 
  BidStatus 
} from '../../types/firestore.types';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

/**
 * Input for creating a project
 */
export interface CreateProjectInput {
  ownerId: string;
  title: string;
  description: string;
  categoryId: string;
  regionId: string;
  address: string;
  area?: number;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  images?: string[];
  requirements?: string;
  maxBids?: number;
}

/**
 * Input for updating a project
 */
export interface UpdateProjectInput {
  title?: string;
  description?: string;
  categoryId?: string;
  regionId?: string;
  address?: string;
  area?: number;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  images?: string[];
  requirements?: string;
  maxBids?: number;
}

/**
 * Query parameters for listing projects
 */
export interface ProjectQueryParams {
  status?: ProjectStatus | ProjectStatus[];
  ownerId?: string;
  categoryId?: string;
  regionId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'bidDeadline' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Project with bid count
 */
export interface ProjectWithBidCount extends FirestoreProject {
  bidCount: number;
}

/**
 * Public project view (limited info)
 */
export interface PublicProject {
  id: string;
  code: string;
  title: string;
  description: string;
  categoryId: string;
  regionId: string;
  area?: number;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  images?: string[];
  requirements?: string;
  status: ProjectStatus;
  bidDeadline?: Date;
  bidCount: number;
  createdAt: Date;
  publishedAt?: Date;
}

/**
 * Valid status transitions for projects
 */
export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['OPEN', 'REJECTED'],
  REJECTED: ['PENDING_APPROVAL', 'CANCELLED'],
  OPEN: ['BIDDING_CLOSED', 'CANCELLED'],
  BIDDING_CLOSED: ['MATCHED', 'OPEN', 'CANCELLED'],
  MATCHED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

// ============================================
// PROJECT FIRESTORE SERVICE
// ============================================

/**
 * Firestore service for project management
 * @requirements 5.1, 5.2, 5.5
 */
export class ProjectFirestoreService extends BaseFirestoreService<FirestoreProject> {
  private bidService: BidSubcollectionService;
  private codeCounter = 0;

  constructor() {
    super('projects');
    this.bidService = new BidSubcollectionService();
  }

  // ============================================
  // CODE GENERATION
  // ============================================

  /**
   * Generate unique project code
   */
  private async generateCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Use timestamp + counter for uniqueness
    this.codeCounter++;
    const sequence = this.codeCounter.toString().padStart(4, '0');
    
    return `PRJ${year}${month}${sequence}`;
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new project
   * @requirements 5.1
   */
  async createProject(data: CreateProjectInput): Promise<FirestoreProject> {
    const code = await this.generateCode();
    
    const projectData: Omit<FirestoreProject, 'id' | 'createdAt' | 'updatedAt'> = {
      code,
      ownerId: data.ownerId,
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      regionId: data.regionId,
      address: data.address,
      area: data.area,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      timeline: data.timeline,
      images: data.images || [],
      requirements: data.requirements,
      status: 'DRAFT',
      maxBids: data.maxBids || 10,
    };

    const project = await this.create(projectData);
    
    logger.info('Project created', { projectId: project.id, code: project.code });
    
    return project;
  }

  /**
   * Update a project
   */
  async updateProject(id: string, data: UpdateProjectInput): Promise<FirestoreProject> {
    const project = await this.update(id, data);
    
    logger.info('Project updated', { projectId: id });
    
    return project;
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * Get projects by owner
   * @requirements 5.1
   */
  async getByOwner(ownerId: string, params: ProjectQueryParams = {}): Promise<PaginatedResult<ProjectWithBidCount>> {
    const { status, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const options: QueryOptions<FirestoreProject> = {
      where: [{ field: 'ownerId', operator: '==', value: ownerId }],
      orderBy: [{ field: sortBy, direction: sortOrder }],
      limit,
    };

    if (status) {
      if (Array.isArray(status)) {
        if (options.where) {
          options.where.push({ field: 'status', operator: 'in', value: status });
        }
      } else {
        if (options.where) {
          options.where.push({ field: 'status', operator: '==', value: status });
        }
      }
    }

    const result = await this.queryPaginated(options);
    
    // Add bid counts
    const projectsWithCounts = await Promise.all(
      result.data.map(async (project) => {
        const bidCount = await this.bidService.countBids(project.id);
        return { ...project, bidCount };
      })
    );

    return {
      ...result,
      data: projectsWithCounts,
    };
  }

  /**
   * Get open projects (for contractors)
   * @requirements 5.5
   */
  async getOpenProjects(params: ProjectQueryParams = {}): Promise<PaginatedResult<PublicProject>> {
    const { categoryId, regionId, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const options: QueryOptions<FirestoreProject> = {
      where: [{ field: 'status', operator: '==', value: 'OPEN' }],
      orderBy: [{ field: sortBy, direction: sortOrder }],
      limit,
    };

    if (categoryId) {
      if (options.where) {
        options.where.push({ field: 'categoryId', operator: '==', value: categoryId });
      }
    }

    if (regionId) {
      if (options.where) {
        options.where.push({ field: 'regionId', operator: '==', value: regionId });
      }
    }

    const result = await this.queryPaginated(options);
    
    // Transform to public view and add bid counts
    const publicProjects = await Promise.all(
      result.data.map(async (project) => {
        const bidCount = await this.bidService.countBids(project.id);
        return this.toPublicProject(project, bidCount);
      })
    );

    return {
      ...result,
      data: publicProjects,
    };
  }

  /**
   * Get public project by ID (limited info, no address)
   */
  async getPublicById(id: string): Promise<PublicProject | null> {
    const project = await this.getById(id);
    
    if (!project || project.status !== 'OPEN') {
      return null;
    }

    const bidCount = await this.bidService.countBids(id);
    return this.toPublicProject(project, bidCount);
  }

  /**
   * Transform project to public view
   */
  private toPublicProject(project: FirestoreProject, bidCount: number): PublicProject {
    return {
      id: project.id,
      code: project.code,
      title: project.title,
      description: project.description,
      categoryId: project.categoryId,
      regionId: project.regionId,
      area: project.area,
      budgetMin: project.budgetMin,
      budgetMax: project.budgetMax,
      timeline: project.timeline,
      images: project.images,
      requirements: project.requirements,
      status: project.status,
      bidDeadline: project.bidDeadline,
      bidCount,
      createdAt: project.createdAt,
      publishedAt: project.publishedAt,
    };
  }

  // ============================================
  // STATUS OPERATIONS
  // ============================================

  /**
   * Check if status transition is valid
   */
  isValidTransition(currentStatus: ProjectStatus, newStatus: ProjectStatus): boolean {
    const validTransitions = PROJECT_STATUS_TRANSITIONS[currentStatus] || [];
    return validTransitions.includes(newStatus);
  }

  /**
   * Submit project for approval
   */
  async submit(id: string, ownerId: string, bidDeadline: Date): Promise<FirestoreProject> {
    const project = await this.getById(id);
    
    if (!project) {
      throw new ProjectFirestoreError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.ownerId !== ownerId) {
      throw new ProjectFirestoreError('PROJECT_ACCESS_DENIED', 'Access denied', 403);
    }

    if (!this.isValidTransition(project.status, 'PENDING_APPROVAL')) {
      throw new ProjectFirestoreError(
        'PROJECT_INVALID_TRANSITION',
        `Cannot submit project in ${project.status} status`,
        400
      );
    }

    return this.update(id, {
      status: 'PENDING_APPROVAL',
      bidDeadline,
    } as Partial<FirestoreProject>);
  }

  /**
   * Approve project (admin)
   */
  async approve(id: string, adminId: string, note?: string): Promise<FirestoreProject> {
    const project = await this.getById(id);
    
    if (!project) {
      throw new ProjectFirestoreError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (!this.isValidTransition(project.status, 'OPEN')) {
      throw new ProjectFirestoreError(
        'PROJECT_INVALID_TRANSITION',
        `Cannot approve project in ${project.status} status`,
        400
      );
    }

    return this.update(id, {
      status: 'OPEN',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNote: note,
      publishedAt: new Date(),
    } as Partial<FirestoreProject>);
  }

  /**
   * Reject project (admin)
   */
  async reject(id: string, adminId: string, note: string): Promise<FirestoreProject> {
    const project = await this.getById(id);
    
    if (!project) {
      throw new ProjectFirestoreError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (!this.isValidTransition(project.status, 'REJECTED')) {
      throw new ProjectFirestoreError(
        'PROJECT_INVALID_TRANSITION',
        `Cannot reject project in ${project.status} status`,
        400
      );
    }

    return this.update(id, {
      status: 'REJECTED',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNote: note,
    } as Partial<FirestoreProject>);
  }

  /**
   * Transition project status
   */
  async transitionStatus(id: string, newStatus: ProjectStatus): Promise<FirestoreProject> {
    const project = await this.getById(id);
    
    if (!project) {
      throw new ProjectFirestoreError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (!this.isValidTransition(project.status, newStatus)) {
      throw new ProjectFirestoreError(
        'PROJECT_INVALID_TRANSITION',
        `Cannot transition from ${project.status} to ${newStatus}`,
        400
      );
    }

    const updateData: Partial<FirestoreProject> = { status: newStatus };
    
    if (newStatus === 'MATCHED') {
      updateData.matchedAt = new Date();
    }

    return this.update(id, updateData as Partial<Omit<FirestoreProject, 'id' | 'createdAt' | 'updatedAt'>>);
  }

  // ============================================
  // BID OPERATIONS
  // ============================================

  /**
   * Get bids for a project
   * @requirements 5.2
   */
  async getBids(projectId: string, status?: BidStatus | BidStatus[]): Promise<FirestoreBid[]> {
    return this.bidService.getBids(projectId, status);
  }

  /**
   * Add a bid to a project
   * @requirements 5.2
   */
  async addBid(projectId: string, bidData: Omit<FirestoreBid, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>): Promise<FirestoreBid> {
    const project = await this.getById(projectId);
    
    if (!project) {
      throw new ProjectFirestoreError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    if (project.status !== 'OPEN') {
      throw new ProjectFirestoreError(
        'PROJECT_NOT_OPEN',
        'Can only add bids to OPEN projects',
        400
      );
    }

    // Check bid deadline
    if (project.bidDeadline && project.bidDeadline <= new Date()) {
      throw new ProjectFirestoreError(
        'BID_DEADLINE_PASSED',
        'Project bid deadline has passed',
        400
      );
    }

    // Check max bids
    const bidCount = await this.bidService.countBids(projectId);
    if (bidCount >= project.maxBids) {
      throw new ProjectFirestoreError(
        'BID_MAX_REACHED',
        'Project has reached maximum number of bids',
        400
      );
    }

    return this.bidService.addBid(projectId, bidData);
  }

  /**
   * Get bid service for direct access
   */
  getBidService(): BidSubcollectionService {
    return this.bidService;
  }
}

// ============================================
// BID SUBCOLLECTION SERVICE
// ============================================

/**
 * Service for managing bids as subcollection of projects
 * @requirements 5.2
 */
export class BidSubcollectionService extends SubcollectionFirestoreService<FirestoreBid> {
  private codeCounter = 0;

  constructor() {
    super('projects', 'bids');
  }

  /**
   * Generate unique bid code
   */
  private async generateCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    this.codeCounter++;
    const sequence = this.codeCounter.toString().padStart(4, '0');
    
    return `BID${year}${month}${sequence}`;
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
   * Add a bid to a project
   */
  async addBid(projectId: string, bidData: Omit<FirestoreBid, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>): Promise<FirestoreBid> {
    const code = await this.generateCode();
    
    const fullBidData: Omit<FirestoreBid, 'id' | 'createdAt' | 'updatedAt'> = {
      ...bidData,
      code,
      projectId,
    };

    return this.create(projectId, fullBidData);
  }

  /**
   * Get bid by ID
   */
  async getBidById(projectId: string, bidId: string): Promise<FirestoreBid | null> {
    return this.getById(projectId, bidId);
  }

  /**
   * Update bid status
   */
  async updateBidStatus(
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
      where: [
        { field: 'contractorId', operator: '==', value: contractorId },
      ],
    });
    // Filter out withdrawn and rejected bids
    const activeBids = bids.filter(bid => !['WITHDRAWN', 'REJECTED'].includes(bid.status));
    return activeBids.length > 0;
  }
}

// ============================================
// ERROR CLASS
// ============================================

export class ProjectFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'ProjectFirestoreError';

    const statusMap: Record<string, number> = {
      PROJECT_NOT_FOUND: 404,
      PROJECT_ACCESS_DENIED: 403,
      PROJECT_INVALID_TRANSITION: 400,
      PROJECT_NOT_OPEN: 400,
      BID_DEADLINE_PASSED: 400,
      BID_MAX_REACHED: 400,
      BID_NOT_FOUND: 404,
      BID_ALREADY_EXISTS: 409,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let projectFirestoreService: ProjectFirestoreService | null = null;

export function getProjectFirestoreService(): ProjectFirestoreService {
  if (!projectFirestoreService) {
    projectFirestoreService = new ProjectFirestoreService();
  }
  return projectFirestoreService;
}

export default ProjectFirestoreService;
