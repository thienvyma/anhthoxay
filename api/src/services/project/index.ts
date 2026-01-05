/**
 * Project Service
 *
 * Business logic for project management including CRUD operations,
 * status transitions, and access control.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 2.1-2.6, 3.1-3.6, 4.1-4.5, 5.1-5.5, 7.5**
 */

import { PrismaClient } from '@prisma/client';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQuery,
  PublicProjectQuery,
  AdminProjectQuery,
  ProjectStatus,
} from '../../schemas/project.schema';
import type {
  ProjectWithRelations,
  PublicProject,
  ProjectListResult,
  PublicProjectListResult,
} from './types';
import { ProjectCrudService } from './crud.service';
import { ProjectQueryService } from './query.service';
import { ProjectStatusService } from './status.service';

// Re-export types
export type {
  ProjectWithRelations,
  PublicProject,
  ProjectListResult,
  PublicProjectListResult,
  PrismaProjectRaw,
} from './types';

// Re-export constants
export { PROJECT_STATUS_TRANSITIONS, PROJECT_ERROR_STATUS_MAP } from './constants';

// Re-export helpers
export {
  getProjectInclude,
  parseJsonArray,
  transformProject,
  ProjectError,
} from './helpers';

// ============================================
// PROJECT SERVICE CLASS
// ============================================

/**
 * Main ProjectService class that delegates to specialized services
 * Maintains backward compatibility with existing API
 */
export class ProjectService {
  private crudService: ProjectCrudService;
  private queryService: ProjectQueryService;
  private statusService: ProjectStatusService;

  constructor(prisma: PrismaClient) {
    this.crudService = new ProjectCrudService(prisma);
    this.queryService = new ProjectQueryService(prisma);
    this.statusService = new ProjectStatusService(prisma);
  }

  // ============================================
  // CRUD OPERATIONS (delegated to ProjectCrudService)
  // ============================================

  async create(ownerId: string, data: CreateProjectInput): Promise<ProjectWithRelations> {
    return this.crudService.create(ownerId, data);
  }

  async update(
    id: string,
    ownerId: string,
    data: UpdateProjectInput
  ): Promise<ProjectWithRelations> {
    return this.crudService.update(id, ownerId, data);
  }

  async delete(id: string, ownerId: string): Promise<void> {
    return this.crudService.delete(id, ownerId);
  }

  // ============================================
  // QUERY OPERATIONS (delegated to ProjectQueryService)
  // ============================================

  async getByOwner(ownerId: string, query: ProjectQuery): Promise<ProjectListResult> {
    return this.queryService.getByOwner(ownerId, query);
  }

  async getByIdForOwner(id: string, ownerId: string): Promise<ProjectWithRelations | null> {
    return this.queryService.getByIdForOwner(id, ownerId);
  }

  async getPublicList(query: PublicProjectQuery): Promise<PublicProjectListResult> {
    return this.queryService.getPublicList(query);
  }

  async getPublicById(id: string): Promise<PublicProject | null> {
    return this.queryService.getPublicById(id);
  }

  async getAdminList(query: AdminProjectQuery): Promise<ProjectListResult> {
    return this.queryService.getAdminList(query);
  }

  async getAdminById(id: string): Promise<ProjectWithRelations | null> {
    return this.queryService.getAdminById(id);
  }

  // ============================================
  // STATUS OPERATIONS (delegated to ProjectStatusService)
  // ============================================

  async submit(id: string, ownerId: string, bidDeadline: Date): Promise<ProjectWithRelations> {
    return this.statusService.submit(id, ownerId, bidDeadline);
  }

  async approve(id: string, adminId: string, note?: string): Promise<ProjectWithRelations> {
    return this.statusService.approve(id, adminId, note);
  }

  async reject(id: string, adminId: string, note: string): Promise<ProjectWithRelations> {
    return this.statusService.reject(id, adminId, note);
  }

  isValidTransition(currentStatus: ProjectStatus, newStatus: ProjectStatus): boolean {
    return this.statusService.isValidTransition(currentStatus, newStatus);
  }

  async transitionStatus(
    id: string,
    newStatus: ProjectStatus,
    userId?: string
  ): Promise<ProjectWithRelations> {
    return this.statusService.transitionStatus(id, newStatus, userId);
  }
}
