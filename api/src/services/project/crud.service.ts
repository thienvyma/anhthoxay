/**
 * Project CRUD Service
 *
 * CRUD operations for project management.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 7.1, 7.4**
 */

import { PrismaClient } from '@prisma/client';
import { generateProjectCode } from '../../utils/code-generator';
import type { CreateProjectInput, UpdateProjectInput } from '../../schemas/project.schema';
import type { ProjectWithRelations } from './types';
import { getProjectInclude, transformProject, ProjectError } from './helpers';

// ============================================
// PROJECT CRUD SERVICE
// ============================================

export class ProjectCrudService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new project
   * Requirements: 3.1 - Save with DRAFT status and return with generated code
   * Optimized: Combined validation queries using Promise.all to reduce N+1 patterns
   */
  async create(ownerId: string, data: CreateProjectInput): Promise<ProjectWithRelations> {
    // Optimized: Fetch owner, category, region, and settings in parallel
    const [owner, category, region, settings] = await Promise.all([
      // Validate owner exists and is a homeowner - select only needed fields
      this.prisma.user.findUnique({
        where: { id: ownerId },
        select: {
          id: true,
          role: true,
        },
      }),
      // Validate category exists - select only needed fields
      this.prisma.serviceCategory.findUnique({
        where: { id: data.categoryId },
        select: {
          id: true,
        },
      }),
      // Validate region exists and is active - select only needed fields
      this.prisma.region.findUnique({
        where: { id: data.regionId },
        select: {
          id: true,
          isActive: true,
        },
      }),
      // Get default maxBids from BiddingSettings
      this.prisma.biddingSettings.findUnique({
        where: { id: 'default' },
        select: {
          maxBidsPerProject: true,
        },
      }),
    ]);

    if (!owner) {
      throw new ProjectError('OWNER_NOT_FOUND', 'Owner not found', 404);
    }

    if (owner.role !== 'HOMEOWNER') {
      throw new ProjectError('NOT_HOMEOWNER', 'Only homeowners can create projects', 403);
    }

    if (!category) {
      throw new ProjectError('CATEGORY_NOT_FOUND', 'Category not found', 400);
    }

    if (!region) {
      throw new ProjectError('REGION_NOT_FOUND', 'Region not found', 400);
    }

    if (!region.isActive) {
      throw new ProjectError('REGION_NOT_ACTIVE', 'Region is not active', 400);
    }

    // Generate unique project code
    const { code } = await generateProjectCode(this.prisma);

    const maxBids = settings?.maxBidsPerProject ?? 20;

    // Create project
    const project = await this.prisma.project.create({
      data: {
        code,
        ownerId,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        regionId: data.regionId,
        address: data.address,
        area: data.area,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        timeline: data.timeline,
        images: data.images ? JSON.stringify(data.images) : null,
        requirements: data.requirements,
        status: 'DRAFT',
        maxBids,
      },
      include: getProjectInclude(),
    });

    return transformProject(project);
  }

  /**
   * Update a project
   * Requirements: 3.2 - Allow updates if status is DRAFT, REJECTED, OPEN, or BIDDING_CLOSED
   * Optimized: Combined validation queries using Promise.all when both category and region need validation
   */
  async update(
    id: string,
    ownerId: string,
    data: UpdateProjectInput
  ): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        status: true,
      },
    });

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check ownership
    if (project.ownerId !== ownerId) {
      throw new ProjectError('PROJECT_ACCESS_DENIED', 'Access denied', 403);
    }

    // Check status allows update (DRAFT, REJECTED, OPEN, BIDDING_CLOSED)
    // Not allowed: PENDING_APPROVAL, PENDING_MATCH, MATCHED, IN_PROGRESS, COMPLETED, CANCELLED
    if (!['DRAFT', 'REJECTED', 'OPEN', 'BIDDING_CLOSED'].includes(project.status)) {
      throw new ProjectError(
        'PROJECT_INVALID_STATUS',
        'Không thể sửa dự án ở trạng thái này',
        400
      );
    }

    // Optimized: Validate category and region in parallel if both are provided
    const validationPromises: Promise<unknown>[] = [];
    let categoryPromiseIndex = -1;
    let regionPromiseIndex = -1;

    if (data.categoryId) {
      categoryPromiseIndex = validationPromises.length;
      validationPromises.push(
        this.prisma.serviceCategory.findUnique({
          where: { id: data.categoryId },
          select: { id: true },
        })
      );
    }

    if (data.regionId) {
      regionPromiseIndex = validationPromises.length;
      validationPromises.push(
        this.prisma.region.findUnique({
          where: { id: data.regionId },
          select: { id: true, isActive: true },
        })
      );
    }

    if (validationPromises.length > 0) {
      const results = await Promise.all(validationPromises);

      if (categoryPromiseIndex >= 0 && !results[categoryPromiseIndex]) {
        throw new ProjectError('CATEGORY_NOT_FOUND', 'Category not found', 400);
      }

      if (regionPromiseIndex >= 0) {
        const regionResult = results[regionPromiseIndex] as { id: string; isActive: boolean } | null;
        if (!regionResult) {
          throw new ProjectError('REGION_NOT_FOUND', 'Region not found', 400);
        }
        if (!regionResult.isActive) {
          throw new ProjectError('REGION_NOT_ACTIVE', 'Region is not active', 400);
        }
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.regionId !== undefined) updateData.regionId = data.regionId;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.area !== undefined) updateData.area = data.area;
    if (data.budgetMin !== undefined) updateData.budgetMin = data.budgetMin;
    if (data.budgetMax !== undefined) updateData.budgetMax = data.budgetMax;
    if (data.timeline !== undefined) updateData.timeline = data.timeline;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.requirements !== undefined) updateData.requirements = data.requirements;

    const updated = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: getProjectInclude(),
    });

    return transformProject(updated);
  }

  /**
   * Delete a project
   * Requirements: 3.5 - Allow deletion if status is DRAFT or REJECTED
   * Optimized: Use select to limit returned fields for validation
   */
  async delete(id: string, ownerId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        status: true,
      },
    });

    if (!project) {
      throw new ProjectError('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check ownership
    if (project.ownerId !== ownerId) {
      throw new ProjectError('PROJECT_ACCESS_DENIED', 'Access denied', 403);
    }

    // Check status allows deletion (DRAFT or REJECTED only)
    if (!['DRAFT', 'REJECTED'].includes(project.status)) {
      throw new ProjectError(
        'PROJECT_INVALID_STATUS',
        'Chỉ có thể xóa dự án ở trạng thái Nháp hoặc Bị từ chối',
        400
      );
    }

    await this.prisma.project.delete({
      where: { id },
    });
  }
}
