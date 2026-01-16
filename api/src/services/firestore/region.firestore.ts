/**
 * Region Firestore Service
 * 
 * Handles region storage with parent-child references in Firestore.
 * Regions are stored in `regions/{regionId}` collection.
 * 
 * @module services/firestore/region.firestore
 * @requirements 3.8
 */

import { BaseFirestoreService, type QueryOptions } from './base.firestore';
import type { FirestoreRegion } from '../../types/firestore.types';
import { logger } from '../../utils/logger';

// ============================================
// TYPES
// ============================================

/**
 * Region tree node with children
 */
export interface RegionTreeNode extends FirestoreRegion {
  children: RegionTreeNode[];
}

/**
 * Query options for regions
 */
export interface RegionQueryOptions {
  flat?: boolean;
  parentId?: string | null;
  level?: number;
  isActive?: boolean;
}

/**
 * Input for creating a region
 */
export type CreateRegionInput = Omit<FirestoreRegion, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input for updating a region
 */
export type UpdateRegionInput = Partial<Omit<FirestoreRegion, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================
// REGION ERROR CLASS
// ============================================

export class RegionFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'RegionFirestoreError';

    const statusMap: Record<string, number> = {
      REGION_NOT_FOUND: 404,
      PARENT_NOT_FOUND: 404,
      SLUG_EXISTS: 409,
      INVALID_PARENT: 400,
      CIRCULAR_REFERENCE: 400,
      MAX_LEVEL_EXCEEDED: 400,
      HAS_CHILDREN: 400,
    };

    this.statusCode = statusCode || statusMap[code] || 500;
  }
}

// ============================================
// REGION FIRESTORE SERVICE CLASS
// ============================================

/**
 * Firestore service for region management
 */
export class RegionFirestoreService extends BaseFirestoreService<FirestoreRegion> {
  constructor() {
    super('regions');
  }

  // ============================================
  // PUBLIC QUERY METHODS
  // ============================================

  /**
   * Get all regions (flat or tree structure)
   * 
   * @param options - Query options
   * @returns Array of regions (flat) or tree structure
   */
  async getAll(options: RegionQueryOptions = {}): Promise<FirestoreRegion[] | RegionTreeNode[]> {
    const { flat = false, parentId, level, isActive } = options;

    const whereClause: QueryOptions<FirestoreRegion>['where'] = [];

    // Build where clauses
    if (parentId !== undefined) {
      whereClause.push({
        field: 'parentId',
        operator: '==',
        value: parentId || null,
      });
    }

    if (level !== undefined) {
      whereClause.push({
        field: 'level',
        operator: '==',
        value: level,
      });
    }

    if (isActive !== undefined) {
      whereClause.push({
        field: 'isActive',
        operator: '==',
        value: isActive,
      });
    }

    const queryOptions: QueryOptions<FirestoreRegion> = {
      where: whereClause,
      orderBy: [
        { field: 'level', direction: 'asc' },
        { field: 'order', direction: 'asc' },
        { field: 'name', direction: 'asc' },
      ],
    };

    const regions = await this.query(queryOptions);

    if (flat) {
      return regions;
    }

    // Build tree structure
    return this.buildTree(regions);
  }

  /**
   * Get region by slug
   * 
   * @param slug - Region slug
   * @returns Region or null if not found
   */
  async getBySlug(slug: string): Promise<FirestoreRegion | null> {
    const results = await this.query({
      where: [{ field: 'slug', operator: '==', value: slug }],
      limit: 1,
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get children of a region
   * 
   * @param parentId - Parent region ID
   * @returns Array of child regions
   */
  async getChildren(parentId: string): Promise<FirestoreRegion[]> {
    return this.query({
      where: [{ field: 'parentId', operator: '==', value: parentId }],
      orderBy: [
        { field: 'order', direction: 'asc' },
        { field: 'name', direction: 'asc' },
      ],
    });
  }

  /**
   * Get regions by level
   * 
   * @param level - Region level (1: Province, 2: District, 3: Ward)
   * @returns Array of regions at the specified level
   */
  async getByLevel(level: number): Promise<FirestoreRegion[]> {
    return this.query({
      where: [{ field: 'level', operator: '==', value: level }],
      orderBy: [
        { field: 'order', direction: 'asc' },
        { field: 'name', direction: 'asc' },
      ],
    });
  }

  // ============================================
  // ADMIN CRUD METHODS
  // ============================================

  /**
   * Create a new region
   * 
   * @param data - Region data
   * @returns Created region
   * @throws RegionFirestoreError if validation fails
   */
  async createRegion(data: CreateRegionInput): Promise<FirestoreRegion> {
    // Check if slug already exists
    const existingSlug = await this.getBySlug(data.slug);
    if (existingSlug) {
      throw new RegionFirestoreError('SLUG_EXISTS', 'Slug đã tồn tại');
    }

    // Validate and set level based on parent
    let level = data.level;
    if (data.parentId) {
      const parent = await this.getById(data.parentId);
      if (!parent) {
        throw new RegionFirestoreError('PARENT_NOT_FOUND', 'Khu vực cha không tồn tại');
      }

      // Auto-set level based on parent
      level = parent.level + 1;
      if (level > 3) {
        throw new RegionFirestoreError('MAX_LEVEL_EXCEEDED', 'Không thể tạo khu vực cấp 4 trở lên');
      }
    }

    const regionData: Omit<FirestoreRegion, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      slug: data.slug,
      parentId: data.parentId || undefined,
      level,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
    };

    const region = await this.create(regionData);
    logger.debug('Region created', { id: region.id, name: region.name });
    
    return region;
  }

  /**
   * Update an existing region
   * 
   * @param id - Region ID
   * @param data - Update data
   * @returns Updated region
   * @throws RegionFirestoreError if validation fails
   */
  async updateRegion(id: string, data: UpdateRegionInput): Promise<FirestoreRegion> {
    // Check if region exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new RegionFirestoreError('REGION_NOT_FOUND', 'Khu vực không tồn tại');
    }

    // Check if new slug conflicts
    if (data.slug && data.slug !== existing.slug) {
      const existingSlug = await this.getBySlug(data.slug);
      if (existingSlug) {
        throw new RegionFirestoreError('SLUG_EXISTS', 'Slug đã tồn tại');
      }
    }

    // Validate parent change
    let level = data.level;
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new RegionFirestoreError('INVALID_PARENT', 'Khu vực không thể là cha của chính nó');
      }

      if (data.parentId) {
        const parent = await this.getById(data.parentId);
        if (!parent) {
          throw new RegionFirestoreError('PARENT_NOT_FOUND', 'Khu vực cha không tồn tại');
        }

        // Check for circular reference
        const isCircular = await this.checkCircularReference(id, data.parentId);
        if (isCircular) {
          throw new RegionFirestoreError('CIRCULAR_REFERENCE', 'Không thể tạo tham chiếu vòng');
        }

        level = parent.level + 1;
        if (level > 3) {
          throw new RegionFirestoreError('MAX_LEVEL_EXCEEDED', 'Không thể di chuyển khu vực đến cấp 4 trở lên');
        }
      } else {
        // Moving to root level
        level = 1;
      }
    }

    const updateData: Partial<Omit<FirestoreRegion, 'id' | 'createdAt' | 'updatedAt'>> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.parentId !== undefined) updateData.parentId = data.parentId || undefined;
    if (level !== undefined) updateData.level = level;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.order !== undefined) updateData.order = data.order;

    const region = await this.update(id, updateData);
    logger.debug('Region updated', { id, changes: Object.keys(updateData) });
    
    return region;
  }

  /**
   * Delete a region
   * 
   * @param id - Region ID
   * @returns Success result
   * @throws RegionFirestoreError if region has children
   */
  async deleteRegion(id: string): Promise<{ success: boolean; message: string }> {
    // Check if region exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new RegionFirestoreError('REGION_NOT_FOUND', 'Khu vực không tồn tại');
    }

    // Check if region has children
    const children = await this.getChildren(id);
    if (children.length > 0) {
      throw new RegionFirestoreError(
        'HAS_CHILDREN',
        'Không thể xóa khu vực có khu vực con. Vui lòng xóa các khu vực con trước.'
      );
    }

    await this.delete(id);
    logger.debug('Region deleted', { id });

    return {
      success: true,
      message: 'Đã xóa khu vực thành công',
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Build tree structure from flat list of regions
   * 
   * @param regions - Flat array of regions
   * @returns Tree structure with nested children
   */
  buildTree(regions: FirestoreRegion[]): RegionTreeNode[] {
    const regionMap = new Map<string, RegionTreeNode>();
    const roots: RegionTreeNode[] = [];

    // First pass: create nodes with empty children arrays
    for (const region of regions) {
      regionMap.set(region.id, { ...region, children: [] });
    }

    // Second pass: build tree structure
    for (const region of regions) {
      const node = regionMap.get(region.id);
      if (!node) continue;

      if (region.parentId && regionMap.has(region.parentId)) {
        const parent = regionMap.get(region.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    // Sort children by order, then by name
    const sortChildren = (nodes: RegionTreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name, 'vi');
      });
      for (const node of nodes) {
        sortChildren(node.children);
      }
    };

    sortChildren(roots);

    return roots;
  }

  /**
   * Check for circular reference when updating parent
   * 
   * @param regionId - Region being updated
   * @param newParentId - New parent ID
   * @returns True if circular reference would be created
   */
  private async checkCircularReference(regionId: string, newParentId: string): Promise<boolean> {
    let currentId: string | null | undefined = newParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === regionId) {
        return true;
      }

      if (visited.has(currentId)) {
        return true; // Already visited, circular detected
      }

      visited.add(currentId);

      const region = await this.getById(currentId);
      currentId = region?.parentId;
    }

    return false;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let regionServiceInstance: RegionFirestoreService | null = null;

/**
 * Get singleton instance of RegionFirestoreService
 */
export function getRegionFirestoreService(): RegionFirestoreService {
  if (!regionServiceInstance) {
    regionServiceInstance = new RegionFirestoreService();
  }
  return regionServiceInstance;
}

export default RegionFirestoreService;
