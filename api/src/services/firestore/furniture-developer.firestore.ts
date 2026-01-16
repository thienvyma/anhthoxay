/**
 * Furniture Developer Firestore Service
 * 
 * Handles Firestore operations for:
 * - Developers (Chủ đầu tư) - `furnitureDevelopers/{developerId}`
 * - Projects (Dự án) - `furnitureProjects/{projectId}`
 * - Buildings (Tòa nhà) - `furnitureBuildings/{buildingId}`
 * - Layouts (Layout căn hộ) - `furnitureLayouts/{layoutId}`
 * 
 * @module services/firestore/furniture-developer.firestore
 * @requirements 8.1
 */

import { BaseFirestoreService, type QueryOptions } from './base.firestore';
import type {
  FirestoreFurnitureDeveloper,
  FirestoreFurnitureProject,
  FirestoreFurnitureBuilding,
  FirestoreFurnitureLayout,
  FirestoreFurnitureApartmentType,
} from '../../types/firestore.types';

// ============================================
// ERROR CLASS
// ============================================

export class FurnitureDeveloperFirestoreError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = 'FurnitureDeveloperFirestoreError';
  }
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateDeveloperInput {
  name: string;
  imageUrl?: string;
}

export interface UpdateDeveloperInput {
  name?: string;
  imageUrl?: string;
}

export interface CreateProjectInput {
  name: string;
  code: string;
  developerId: string;
  imageUrl?: string;
}

export interface UpdateProjectInput {
  name?: string;
  code?: string;
  imageUrl?: string;
}

export interface CreateBuildingInput {
  name: string;
  code: string;
  projectId: string;
  maxFloor: number;
  maxAxis: number;
  imageUrl?: string;
}

export interface UpdateBuildingInput {
  name?: string;
  code?: string;
  imageUrl?: string;
  maxFloor?: number;
  maxAxis?: number;
}

export interface CreateLayoutInput {
  buildingCode: string;
  axis: number;
  apartmentType: string;
}

export interface UpdateLayoutInput {
  apartmentType?: string;
}

export interface CreateApartmentTypeInput {
  buildingCode: string;
  apartmentType: string;
  imageUrl?: string;
  description?: string;
}

export interface UpdateApartmentTypeInput {
  apartmentType?: string;
  imageUrl?: string;
  description?: string;
}

// ============================================
// EXTENDED TYPES
// ============================================

export interface ProjectWithDeveloper extends FirestoreFurnitureProject {
  developer?: FirestoreFurnitureDeveloper;
}

export interface BuildingWithProject extends FirestoreFurnitureBuilding {
  project?: FirestoreFurnitureProject;
}

// ============================================
// DEVELOPER SERVICE
// ============================================

export class FurnitureDeveloperFirestoreService extends BaseFirestoreService<FirestoreFurnitureDeveloper> {
  constructor() {
    super('furnitureDevelopers');
  }

  /**
   * Get all developers ordered by name
   */
  async getDevelopers(): Promise<FirestoreFurnitureDeveloper[]> {
    return this.query({
      orderBy: [{ field: 'name', direction: 'asc' }],
    });
  }

  /**
   * Create a new developer
   */
  async createDeveloper(input: CreateDeveloperInput): Promise<FirestoreFurnitureDeveloper> {
    // Check for duplicate name
    const existing = await this.query({
      where: [{ field: 'name', operator: '==', value: input.name }],
      limit: 1,
    });

    if (existing.length > 0) {
      throw new FurnitureDeveloperFirestoreError(
        'CONFLICT',
        'Developer with this name already exists',
        409
      );
    }

    return this.create(input);
  }

  /**
   * Update a developer
   */
  async updateDeveloper(id: string, input: UpdateDeveloperInput): Promise<FirestoreFurnitureDeveloper> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Developer not found', 404);
    }

    // Check for duplicate name if name is being changed
    if (input.name && input.name !== existing.name) {
      const duplicate = await this.query({
        where: [{ field: 'name', operator: '==', value: input.name }],
        limit: 1,
      });

      if (duplicate.length > 0) {
        throw new FurnitureDeveloperFirestoreError(
          'CONFLICT',
          'Developer with this name already exists',
          409
        );
      }
    }

    return this.update(id, input);
  }

  /**
   * Delete a developer
   */
  async deleteDeveloper(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Developer not found', 404);
    }

    // Check if developer has projects
    const projectService = getFurnitureProjectFirestoreService();
    const projects = await projectService.getProjectsByDeveloper(id);
    if (projects.length > 0) {
      throw new FurnitureDeveloperFirestoreError(
        'CONFLICT',
        'Cannot delete developer with existing projects',
        409
      );
    }

    await this.delete(id);
  }
}

// ============================================
// PROJECT SERVICE
// ============================================

export class FurnitureProjectFirestoreService extends BaseFirestoreService<FirestoreFurnitureProject> {
  constructor() {
    super('furnitureProjects');
  }

  /**
   * Get all projects, optionally filtered by developer
   */
  async getProjects(developerId?: string): Promise<ProjectWithDeveloper[]> {
    const options: QueryOptions<FirestoreFurnitureProject> = {
      orderBy: [{ field: 'name', direction: 'asc' }],
    };

    if (developerId) {
      options.where = [{ field: 'developerId', operator: '==', value: developerId }];
    }

    const projects = await this.query(options);

    // Fetch developer info for each project
    const developerService = getFurnitureDeveloperFirestoreService();
    const projectsWithDeveloper: ProjectWithDeveloper[] = [];

    for (const project of projects) {
      const developer = await developerService.getById(project.developerId);
      projectsWithDeveloper.push({
        ...project,
        developer: developer || undefined,
      });
    }

    return projectsWithDeveloper;
  }

  /**
   * Get projects by developer ID
   */
  async getProjectsByDeveloper(developerId: string): Promise<FirestoreFurnitureProject[]> {
    return this.query({
      where: [{ field: 'developerId', operator: '==', value: developerId }],
      orderBy: [{ field: 'name', direction: 'asc' }],
    });
  }

  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput): Promise<ProjectWithDeveloper> {
    // Verify developer exists
    const developerService = getFurnitureDeveloperFirestoreService();
    const developer = await developerService.getById(input.developerId);
    if (!developer) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Developer not found', 404);
    }

    // Check for duplicate code within developer
    const existing = await this.query({
      where: [
        { field: 'developerId', operator: '==', value: input.developerId },
        { field: 'code', operator: '==', value: input.code },
      ],
      limit: 1,
    });

    if (existing.length > 0) {
      throw new FurnitureDeveloperFirestoreError(
        'CONFLICT',
        'Project with this code already exists for this developer',
        409
      );
    }

    const project = await this.create(input);
    return { ...project, developer };
  }

  /**
   * Update a project
   */
  async updateProject(id: string, input: UpdateProjectInput): Promise<ProjectWithDeveloper> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Project not found', 404);
    }

    // Check for duplicate code if code is being changed
    if (input.code && input.code !== existing.code) {
      const duplicate = await this.query({
        where: [
          { field: 'developerId', operator: '==', value: existing.developerId },
          { field: 'code', operator: '==', value: input.code },
        ],
        limit: 1,
      });

      if (duplicate.length > 0) {
        throw new FurnitureDeveloperFirestoreError(
          'CONFLICT',
          'Project with this code already exists for this developer',
          409
        );
      }
    }

    const project = await this.update(id, input);

    // Fetch developer
    const developerService = getFurnitureDeveloperFirestoreService();
    const developer = await developerService.getById(project.developerId);

    return { ...project, developer: developer || undefined };
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Project not found', 404);
    }

    // Check if project has buildings
    const buildingService = getFurnitureBuildingFirestoreService();
    const buildings = await buildingService.getBuildingsByProject(id);
    if (buildings.length > 0) {
      throw new FurnitureDeveloperFirestoreError(
        'CONFLICT',
        'Cannot delete project with existing buildings',
        409
      );
    }

    await this.delete(id);
  }
}

// ============================================
// BUILDING SERVICE
// ============================================

export class FurnitureBuildingFirestoreService extends BaseFirestoreService<FirestoreFurnitureBuilding> {
  constructor() {
    super('furnitureBuildings');
  }

  /**
   * Get all buildings, optionally filtered by project
   */
  async getBuildings(projectId?: string): Promise<BuildingWithProject[]> {
    const options: QueryOptions<FirestoreFurnitureBuilding> = {
      orderBy: [{ field: 'name', direction: 'asc' }],
    };

    if (projectId) {
      options.where = [{ field: 'projectId', operator: '==', value: projectId }];
    }

    const buildings = await this.query(options);

    // Fetch project info for each building
    const projectService = getFurnitureProjectFirestoreService();
    const buildingsWithProject: BuildingWithProject[] = [];

    for (const building of buildings) {
      const project = await projectService.getById(building.projectId);
      buildingsWithProject.push({
        ...building,
        project: project || undefined,
      });
    }

    return buildingsWithProject;
  }

  /**
   * Get buildings by project ID
   */
  async getBuildingsByProject(projectId: string): Promise<FirestoreFurnitureBuilding[]> {
    return this.query({
      where: [{ field: 'projectId', operator: '==', value: projectId }],
      orderBy: [{ field: 'name', direction: 'asc' }],
    });
  }

  /**
   * Get building by code
   */
  async getBuildingByCode(code: string): Promise<FirestoreFurnitureBuilding | null> {
    const buildings = await this.query({
      where: [{ field: 'code', operator: '==', value: code }],
      limit: 1,
    });
    return buildings[0] || null;
  }

  /**
   * Create a new building
   */
  async createBuilding(input: CreateBuildingInput): Promise<BuildingWithProject> {
    // Validate maxFloor and maxAxis
    if (input.maxFloor <= 0) {
      throw new FurnitureDeveloperFirestoreError(
        'VALIDATION_ERROR',
        'maxFloor must be greater than 0',
        400
      );
    }
    if (input.maxAxis < 0) {
      throw new FurnitureDeveloperFirestoreError(
        'VALIDATION_ERROR',
        'maxAxis must be greater than or equal to 0',
        400
      );
    }

    // Verify project exists
    const projectService = getFurnitureProjectFirestoreService();
    const project = await projectService.getById(input.projectId);
    if (!project) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Project not found', 404);
    }

    // Check for duplicate code
    const existing = await this.getBuildingByCode(input.code);
    if (existing) {
      throw new FurnitureDeveloperFirestoreError(
        'CONFLICT',
        'Building with this code already exists',
        409
      );
    }

    const building = await this.create(input);
    return { ...building, project };
  }

  /**
   * Update a building
   */
  async updateBuilding(id: string, input: UpdateBuildingInput): Promise<BuildingWithProject> {
    // Validate maxFloor and maxAxis if provided
    if (input.maxFloor !== undefined && input.maxFloor <= 0) {
      throw new FurnitureDeveloperFirestoreError(
        'VALIDATION_ERROR',
        'maxFloor must be greater than 0',
        400
      );
    }
    if (input.maxAxis !== undefined && input.maxAxis < 0) {
      throw new FurnitureDeveloperFirestoreError(
        'VALIDATION_ERROR',
        'maxAxis must be greater than or equal to 0',
        400
      );
    }

    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Building not found', 404);
    }

    // Check for duplicate code if code is being changed
    if (input.code && input.code !== existing.code) {
      const duplicate = await this.getBuildingByCode(input.code);
      if (duplicate) {
        throw new FurnitureDeveloperFirestoreError(
          'CONFLICT',
          'Building with this code already exists',
          409
        );
      }
    }

    const building = await this.update(id, input);

    // Fetch project
    const projectService = getFurnitureProjectFirestoreService();
    const project = await projectService.getById(building.projectId);

    return { ...building, project: project || undefined };
  }

  /**
   * Delete a building
   */
  async deleteBuilding(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Building not found', 404);
    }

    // Check if building has layouts
    const layoutService = getFurnitureLayoutFirestoreService();
    const layouts = await layoutService.getLayoutsByBuilding(existing.code);
    if (layouts.length > 0) {
      throw new FurnitureDeveloperFirestoreError(
        'CONFLICT',
        'Cannot delete building with existing layouts',
        409
      );
    }

    await this.delete(id);
  }
}

// ============================================
// LAYOUT SERVICE
// ============================================

export class FurnitureLayoutFirestoreService extends BaseFirestoreService<FirestoreFurnitureLayout> {
  constructor() {
    super('furnitureLayouts');
  }

  /**
   * Get layouts by building code
   */
  async getLayoutsByBuilding(buildingCode: string): Promise<FirestoreFurnitureLayout[]> {
    return this.query({
      where: [{ field: 'buildingCode', operator: '==', value: buildingCode }],
      orderBy: [{ field: 'axis', direction: 'asc' }],
    });
  }

  /**
   * Get layout by building code and axis
   */
  async getLayoutByAxis(buildingCode: string, axis: number): Promise<FirestoreFurnitureLayout | null> {
    const layouts = await this.query({
      where: [
        { field: 'buildingCode', operator: '==', value: buildingCode },
        { field: 'axis', operator: '==', value: axis },
      ],
      limit: 1,
    });
    return layouts[0] || null;
  }

  /**
   * Create a new layout
   */
  async createLayout(input: CreateLayoutInput): Promise<FirestoreFurnitureLayout> {
    const layoutAxis = `${input.buildingCode}_${input.axis.toString().padStart(2, '0')}`;
    const normalizedApartmentType = input.apartmentType.trim().toLowerCase();

    // Check for duplicate
    const existing = await this.getLayoutByAxis(input.buildingCode, input.axis);
    if (existing) {
      throw new FurnitureDeveloperFirestoreError(
        'CONFLICT',
        'Layout for this building code and axis already exists',
        409
      );
    }

    return this.create({
      layoutAxis,
      buildingCode: input.buildingCode,
      axis: input.axis,
      apartmentType: normalizedApartmentType,
    });
  }

  /**
   * Update a layout
   */
  async updateLayout(id: string, input: UpdateLayoutInput): Promise<FirestoreFurnitureLayout> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Layout not found', 404);
    }

    const updateData: Partial<FirestoreFurnitureLayout> = {};
    if (input.apartmentType !== undefined) {
      updateData.apartmentType = input.apartmentType.trim().toLowerCase();
    }

    return this.update(id, updateData);
  }

  /**
   * Delete a layout
   */
  async deleteLayout(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Layout not found', 404);
    }

    await this.delete(id);
  }

  /**
   * Generate a metrics grid for a building
   * Returns a 2D array where rows = floors (1 to maxFloor), columns = axes (0 to maxAxis)
   * Each cell contains the apartmentType from layouts lookup
   */
  async generateMetricsGrid(
    buildingCode: string,
    maxFloor: number,
    maxAxis: number
  ): Promise<(string | null)[][]> {
    const layouts = await this.getLayoutsByBuilding(buildingCode);
    const layoutMap = new Map<number, string>();
    layouts.forEach((layout) => {
      layoutMap.set(layout.axis, layout.apartmentType);
    });

    const grid: (string | null)[][] = [];
    for (let floor = 1; floor <= maxFloor; floor++) {
      const row: (string | null)[] = [];
      for (let axis = 0; axis <= maxAxis; axis++) {
        row.push(layoutMap.get(axis) || null);
      }
      grid.push(row);
    }

    return grid;
  }
}

// ============================================
// APARTMENT TYPE SERVICE
// ============================================

export class FurnitureApartmentTypeFirestoreService extends BaseFirestoreService<FirestoreFurnitureApartmentType> {
  constructor() {
    super('furnitureApartmentTypes');
  }

  /**
   * Get apartment types by building code, optionally filtered by type
   */
  async getApartmentTypes(buildingCode: string, type?: string): Promise<FirestoreFurnitureApartmentType[]> {
    if (type) {
      const normalizedType = type.trim().toLowerCase();
      const exactMatch = await this.query({
        where: [
          { field: 'buildingCode', operator: '==', value: buildingCode },
          { field: 'apartmentType', operator: '==', value: normalizedType },
        ],
        orderBy: [{ field: 'apartmentType', direction: 'asc' }],
      });

      if (exactMatch.length > 0) {
        return exactMatch;
      }
    }

    return this.query({
      where: [{ field: 'buildingCode', operator: '==', value: buildingCode }],
      orderBy: [{ field: 'apartmentType', direction: 'asc' }],
    });
  }

  /**
   * Get all apartment types
   */
  async getAllApartmentTypes(): Promise<FirestoreFurnitureApartmentType[]> {
    return this.query({
      orderBy: [
        { field: 'buildingCode', direction: 'asc' },
        { field: 'apartmentType', direction: 'asc' },
      ],
    });
  }

  /**
   * Create a new apartment type
   */
  async createApartmentType(input: CreateApartmentTypeInput): Promise<FirestoreFurnitureApartmentType> {
    const normalizedType = input.apartmentType.trim().toLowerCase();

    // Check for duplicate
    const existing = await this.query({
      where: [
        { field: 'buildingCode', operator: '==', value: input.buildingCode },
        { field: 'apartmentType', operator: '==', value: normalizedType },
      ],
      limit: 1,
    });

    if (existing.length > 0) {
      throw new FurnitureDeveloperFirestoreError(
        'CONFLICT',
        'Apartment type already exists for this building',
        409
      );
    }

    return this.create({
      buildingCode: input.buildingCode,
      apartmentType: normalizedType,
      imageUrl: input.imageUrl,
      description: input.description,
    });
  }

  /**
   * Update an apartment type
   */
  async updateApartmentType(id: string, input: UpdateApartmentTypeInput): Promise<FirestoreFurnitureApartmentType> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Apartment type not found', 404);
    }

    const updateData: Partial<FirestoreFurnitureApartmentType> = {};
    if (input.apartmentType !== undefined) {
      updateData.apartmentType = input.apartmentType.trim().toLowerCase();
    }
    if (input.imageUrl !== undefined) {
      updateData.imageUrl = input.imageUrl;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    return this.update(id, updateData);
  }

  /**
   * Delete an apartment type
   */
  async deleteApartmentType(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureDeveloperFirestoreError('NOT_FOUND', 'Apartment type not found', 404);
    }

    await this.delete(id);
  }
}

// ============================================
// SINGLETON INSTANCES
// ============================================

let developerServiceInstance: FurnitureDeveloperFirestoreService | null = null;
let projectServiceInstance: FurnitureProjectFirestoreService | null = null;
let buildingServiceInstance: FurnitureBuildingFirestoreService | null = null;
let layoutServiceInstance: FurnitureLayoutFirestoreService | null = null;
let apartmentTypeServiceInstance: FurnitureApartmentTypeFirestoreService | null = null;

export function getFurnitureDeveloperFirestoreService(): FurnitureDeveloperFirestoreService {
  if (!developerServiceInstance) {
    developerServiceInstance = new FurnitureDeveloperFirestoreService();
  }
  return developerServiceInstance;
}

export function getFurnitureProjectFirestoreService(): FurnitureProjectFirestoreService {
  if (!projectServiceInstance) {
    projectServiceInstance = new FurnitureProjectFirestoreService();
  }
  return projectServiceInstance;
}

export function getFurnitureBuildingFirestoreService(): FurnitureBuildingFirestoreService {
  if (!buildingServiceInstance) {
    buildingServiceInstance = new FurnitureBuildingFirestoreService();
  }
  return buildingServiceInstance;
}

export function getFurnitureLayoutFirestoreService(): FurnitureLayoutFirestoreService {
  if (!layoutServiceInstance) {
    layoutServiceInstance = new FurnitureLayoutFirestoreService();
  }
  return layoutServiceInstance;
}

export function getFurnitureApartmentTypeFirestoreService(): FurnitureApartmentTypeFirestoreService {
  if (!apartmentTypeServiceInstance) {
    apartmentTypeServiceInstance = new FurnitureApartmentTypeFirestoreService();
  }
  return apartmentTypeServiceInstance;
}
