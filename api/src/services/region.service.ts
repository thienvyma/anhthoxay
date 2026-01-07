/**
 * Region Service
 *
 * Business logic for region management (CRUD operations and tree building).
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-3.2**
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 3.4, 3.6** - Uses read replica for list/get operations
 */

import { PrismaClient } from '@prisma/client';
import { dbRead, dbWrite, dbReadPrimary } from '../utils/db';
import type { CreateRegionInput, UpdateRegionInput, RegionQuery } from '../schemas/region.schema';

// ============================================
// TYPES
// ============================================

export interface Region {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegionTreeNode extends Region {
  children: RegionTreeNode[];
}

// ============================================
// REGION SERVICE CLASS
// ============================================

export class RegionService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================
  // PUBLIC FUNCTIONS
  // ============================================

  /**
   * Get all regions (flat or tree structure)
   *
   * **Feature: high-traffic-resilience**
   * Uses read replica for better performance on list operations.
   * **Validates: Requirements 3.4, 3.6**
   */
  async getAll(query: RegionQuery): Promise<Region[] | RegionTreeNode[]> {
    const { flat, parentId, level, isActive } = query;

    const where = {
      ...(parentId !== undefined && { parentId: parentId || null }),
      ...(level !== undefined && { level }),
      ...(isActive !== undefined && { isActive }),
    };

    // Use read replica for list operations
    const regions = await dbRead((prisma) =>
      prisma.region.findMany({
        where,
        orderBy: [{ level: 'asc' }, { order: 'asc' }, { name: 'asc' }],
      })
    );

    if (flat) {
      return regions;
    }

    // Build tree structure
    return this.buildTree(regions);
  }

  /**
   * Get region by ID
   *
   * **Feature: high-traffic-resilience**
   * Uses read replica for better performance.
   * **Validates: Requirements 3.4, 3.6**
   */
  async getById(id: string): Promise<Region | null> {
    return dbRead((prisma) =>
      prisma.region.findUnique({
        where: { id },
      })
    );
  }

  /**
   * Get region by slug
   *
   * **Feature: high-traffic-resilience**
   * Uses read replica for better performance.
   * **Validates: Requirements 3.4, 3.6**
   */
  async getBySlug(slug: string): Promise<Region | null> {
    return dbRead((prisma) =>
      prisma.region.findUnique({
        where: { slug },
      })
    );
  }

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================

  /**
   * Create a new region
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   */
  async create(data: CreateRegionInput): Promise<Region> {
    // Check if slug already exists - use primary for consistency after write
    const existingSlug = await dbReadPrimary((prisma) =>
      prisma.region.findUnique({
        where: { slug: data.slug },
      })
    );

    if (existingSlug) {
      throw new RegionError('SLUG_EXISTS', 'Slug đã tồn tại');
    }

    // If parentId is provided, validate it exists and set level
    let level = data.level;
    if (data.parentId) {
      const parent = await dbReadPrimary((prisma) =>
        prisma.region.findUnique({
          where: { id: data.parentId },
        })
      );

      if (!parent) {
        throw new RegionError('PARENT_NOT_FOUND', 'Khu vực cha không tồn tại');
      }

      // Auto-set level based on parent
      level = parent.level + 1;
      if (level > 3) {
        throw new RegionError('MAX_LEVEL_EXCEEDED', 'Không thể tạo khu vực cấp 4 trở lên');
      }
    }

    return dbWrite((prisma) =>
      prisma.region.create({
        data: {
          name: data.name,
          slug: data.slug,
          parentId: data.parentId || null,
          level,
          isActive: data.isActive ?? true,
          order: data.order ?? 0,
        },
      })
    );
  }

  /**
   * Update an existing region
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   */
  async update(id: string, data: UpdateRegionInput): Promise<Region> {
    // Check if region exists - use primary for consistency
    const existing = await dbReadPrimary((prisma) =>
      prisma.region.findUnique({
        where: { id },
      })
    );

    if (!existing) {
      throw new RegionError('REGION_NOT_FOUND', 'Khu vực không tồn tại');
    }

    // Check if new slug already exists (if changing slug)
    if (data.slug && data.slug !== existing.slug) {
      const existingSlug = await dbReadPrimary((prisma) =>
        prisma.region.findUnique({
          where: { slug: data.slug },
        })
      );

      if (existingSlug) {
        throw new RegionError('SLUG_EXISTS', 'Slug đã tồn tại');
      }
    }

    // If changing parentId, validate and update level
    let level = data.level;
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new RegionError('INVALID_PARENT', 'Khu vực không thể là cha của chính nó');
      }

      if (data.parentId) {
        const parent = await dbReadPrimary((prisma) =>
          prisma.region.findUnique({
            where: { id: data.parentId },
          })
        );

        if (!parent) {
          throw new RegionError('PARENT_NOT_FOUND', 'Khu vực cha không tồn tại');
        }

        // Check for circular reference
        const isCircular = await this.checkCircularReference(id, data.parentId);
        if (isCircular) {
          throw new RegionError('CIRCULAR_REFERENCE', 'Không thể tạo tham chiếu vòng');
        }

        level = parent.level + 1;
        if (level > 3) {
          throw new RegionError('MAX_LEVEL_EXCEEDED', 'Không thể di chuyển khu vực đến cấp 4 trở lên');
        }
      } else {
        // Moving to root level
        level = 1;
      }
    }

    return dbWrite((prisma) =>
      prisma.region.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.parentId !== undefined && { parentId: data.parentId || null }),
          ...(level !== undefined && { level }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.order !== undefined && { order: data.order }),
        },
      })
    );
  }

  /**
   * Delete a region
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    // Check if region exists - use primary for consistency
    const existing = await dbReadPrimary((prisma) =>
      prisma.region.findUnique({
        where: { id },
        include: { children: true },
      })
    );

    if (!existing) {
      throw new RegionError('REGION_NOT_FOUND', 'Khu vực không tồn tại');
    }

    // Check if region has children
    if (existing.children.length > 0) {
      throw new RegionError('HAS_CHILDREN', 'Không thể xóa khu vực có khu vực con. Vui lòng xóa các khu vực con trước.');
    }

    await dbWrite((prisma) =>
      prisma.region.delete({
        where: { id },
      })
    );

    return {
      success: true,
      message: 'Đã xóa khu vực thành công',
    };
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Build tree structure from flat list of regions
   */
  buildTree(regions: Region[]): RegionTreeNode[] {
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
   * **Feature: high-traffic-resilience**
   * Uses primary database for consistency during write operations.
   */
  private async checkCircularReference(regionId: string, newParentId: string): Promise<boolean> {
    let currentId: string | null = newParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === regionId) {
        return true;
      }

      if (visited.has(currentId)) {
        return true; // Already visited, circular detected
      }

      visited.add(currentId);

      const idToQuery = currentId;
      const region = await dbReadPrimary((prisma) =>
        prisma.region.findUnique({
          where: { id: idToQuery },
          select: { parentId: true },
        })
      );

      currentId = region?.parentId || null;
    }

    return false;
  }
}

// ============================================
// REGION ERROR CLASS
// ============================================

export class RegionError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode?: number) {
    super(message);
    this.code = code;
    this.name = 'RegionError';

    // Map error codes to HTTP status codes
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
