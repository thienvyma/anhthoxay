/**
 * Furniture Developer Service
 *
 * Handles business logic for:
 * - Developers (Chủ đầu tư)
 * - Projects (Dự án)
 * - Buildings (Tòa nhà)
 *
 * **Feature: furniture-quotation**
 * **Requirements: 1.10, 1.11, 1.13, 1.14**
 */

import {
  PrismaClient,
  Prisma,
  FurnitureDeveloper,
  FurnitureProject,
  FurnitureBuilding,
} from '@prisma/client';
import { FurnitureServiceError } from './furniture.error';
import {
  CreateDeveloperInput,
  UpdateDeveloperInput,
  CreateProjectInput,
  UpdateProjectInput,
  CreateBuildingInput,
  UpdateBuildingInput,
} from './furniture.types';

export class FurnitureDeveloperService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // DEVELOPERS
  // ============================================

  async getDevelopers(): Promise<FurnitureDeveloper[]> {
    return this.prisma.furnitureDeveloper.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createDeveloper(input: CreateDeveloperInput): Promise<FurnitureDeveloper> {
    try {
      return await this.prisma.furnitureDeveloper.create({
        data: input,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new FurnitureServiceError(
            'CONFLICT',
            'Developer with this name already exists',
            409
          );
        }
      }
      throw error;
    }
  }

  async updateDeveloper(
    id: string,
    input: UpdateDeveloperInput
  ): Promise<FurnitureDeveloper> {
    try {
      return await this.prisma.furnitureDeveloper.update({
        where: { id },
        data: input,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Developer not found', 404);
        }
      }
      throw error;
    }
  }

  async deleteDeveloper(id: string): Promise<void> {
    try {
      await this.prisma.furnitureDeveloper.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Developer not found', 404);
        }
      }
      throw error;
    }
  }

  // ============================================
  // PROJECTS
  // ============================================

  async getProjects(developerId?: string): Promise<FurnitureProject[]> {
    return this.prisma.furnitureProject.findMany({
      where: developerId ? { developerId } : undefined,
      orderBy: { name: 'asc' },
      include: { developer: true },
    });
  }

  async createProject(input: CreateProjectInput): Promise<FurnitureProject> {
    try {
      return await this.prisma.furnitureProject.create({
        data: input,
        include: { developer: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new FurnitureServiceError(
            'CONFLICT',
            'Project with this code already exists for this developer',
            409
          );
        }
        if (error.code === 'P2003') {
          throw new FurnitureServiceError('NOT_FOUND', 'Developer not found', 404);
        }
      }
      throw error;
    }
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<FurnitureProject> {
    try {
      return await this.prisma.furnitureProject.update({
        where: { id },
        data: input,
        include: { developer: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Project not found', 404);
        }
      }
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await this.prisma.furnitureProject.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Project not found', 404);
        }
      }
      throw error;
    }
  }

  // ============================================
  // BUILDINGS
  // ============================================

  async getBuildings(projectId?: string): Promise<FurnitureBuilding[]> {
    return this.prisma.furnitureBuilding.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { name: 'asc' },
      include: { project: true },
    });
  }

  async createBuilding(input: CreateBuildingInput): Promise<FurnitureBuilding> {
    if (input.maxFloor <= 0) {
      throw new FurnitureServiceError(
        'VALIDATION_ERROR',
        'maxFloor must be greater than 0',
        400
      );
    }
    if (input.maxAxis < 0) {
      throw new FurnitureServiceError(
        'VALIDATION_ERROR',
        'maxAxis must be greater than or equal to 0',
        400
      );
    }

    try {
      return await this.prisma.furnitureBuilding.create({
        data: input,
        include: { project: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new FurnitureServiceError('NOT_FOUND', 'Project not found', 404);
        }
      }
      throw error;
    }
  }

  async updateBuilding(
    id: string,
    input: UpdateBuildingInput
  ): Promise<FurnitureBuilding> {
    if (input.maxFloor !== undefined && input.maxFloor <= 0) {
      throw new FurnitureServiceError(
        'VALIDATION_ERROR',
        'maxFloor must be greater than 0',
        400
      );
    }
    if (input.maxAxis !== undefined && input.maxAxis < 0) {
      throw new FurnitureServiceError(
        'VALIDATION_ERROR',
        'maxAxis must be greater than or equal to 0',
        400
      );
    }

    try {
      return await this.prisma.furnitureBuilding.update({
        where: { id },
        data: input,
        include: { project: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Building not found', 404);
        }
      }
      throw error;
    }
  }

  async deleteBuilding(id: string): Promise<void> {
    try {
      await this.prisma.furnitureBuilding.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new FurnitureServiceError('NOT_FOUND', 'Building not found', 404);
        }
      }
      throw error;
    }
  }
}
