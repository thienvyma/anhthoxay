/**
 * Pricing Service Module
 *
 * Handles business logic for pricing-related entities including:
 * - Service Categories (hạng mục thi công)
 * - Unit Prices (đơn giá thi công)
 * - Material Categories (danh mục vật dụng)
 * - Materials (vật dụng cơ bản)
 * - Formulas (công thức tính giá)
 *
 * Separates data access and business logic from HTTP handling.
 *
 * **Feature: api-refactoring**
 * **Requirements: 2.1, 2.2, 2.3**
 *
 * **Feature: high-traffic-resilience**
 * **Requirements: 3.4, 3.6** - Uses read replica for list/get operations
 */

import {
  PrismaClient,
  Prisma,
  ServiceCategory,
  UnitPrice,
  MaterialCategory,
  Material,
  Formula,
} from '@prisma/client';
import { dbRead, dbWrite, dbReadPrimary } from '../utils/db';

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * Service category with formula and material category relations
 */
export interface ServiceCategoryWithRelations extends ServiceCategory {
  formula: Formula | null;
  materialCategories: Array<{
    materialCategoryId: string;
    materialCategory: MaterialCategory;
  }>;
}

/**
 * Transformed service category with convenience fields
 */
export interface ServiceCategoryResult extends ServiceCategory {
  formula: Formula | null;
  materialCategoryIds: string[];
  allowMaterials: boolean;
}

/**
 * Material category with material count
 */
export interface MaterialCategoryWithCount extends MaterialCategory {
  _count: { materials: number };
}

/**
 * Material category with materials
 */
export interface MaterialCategoryWithMaterials extends MaterialCategory {
  materials: Material[];
}

/**
 * Material with category
 */
export interface MaterialWithCategory extends Material {
  category: MaterialCategory;
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateServiceCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  coefficient?: number;
  formulaId?: string | null;
  order?: number;
  isActive?: boolean;
  materialCategoryIds?: string[];
}

export interface UpdateServiceCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
  coefficient?: number;
  formulaId?: string | null;
  order?: number;
  isActive?: boolean;
  materialCategoryIds?: string[];
}

export interface CreateUnitPriceInput {
  category: string;
  name: string;
  price: number;
  tag: string;
  unit: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateUnitPriceInput {
  category?: string;
  name?: string;
  price?: number;
  tag?: string;
  unit?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateMaterialCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateMaterialCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateMaterialInput {
  name: string;
  categoryId: string;
  imageUrl?: string | null;
  price: number;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateMaterialInput {
  name?: string;
  categoryId?: string;
  imageUrl?: string | null;
  price?: number;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateFormulaInput {
  name: string;
  expression: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateFormulaInput {
  name?: string;
  expression?: string;
  description?: string;
  isActive?: boolean;
}

// ============================================
// ERROR CLASS
// ============================================

export class PricingServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.name = 'PricingServiceError';
    this.statusCode = statusCode;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate slug from Vietnamese name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Transform service category with relations to result format
 */
function transformServiceCategory(
  category: ServiceCategoryWithRelations
): ServiceCategoryResult {
  return {
    ...category,
    materialCategoryIds: category.materialCategories.map((mc) => mc.materialCategoryId),
    allowMaterials: category.materialCategories.length > 0,
  };
}

// ============================================
// PRICING SERVICE CLASS
// ============================================

export class PricingService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // SERVICE CATEGORIES
  // ============================================

  /**
   * Get all active service categories with formulas and material categories
   *
   * **Feature: high-traffic-resilience**
   * Uses read replica for better performance on list operations.
   * **Validates: Requirements 3.4, 3.6**
   */
  async getAllServiceCategories(): Promise<ServiceCategoryResult[]> {
    const categories = await dbRead((prisma) =>
      prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          formula: true,
          materialCategories: { include: { materialCategory: true } },
        },
      })
    );

    return categories.map(transformServiceCategory);
  }

  /**
   * Get a single service category by ID
   *
   * **Feature: high-traffic-resilience**
   * Uses read replica for better performance.
   * **Validates: Requirements 3.4, 3.6**
   *
   * @throws PricingServiceError if not found
   */
  async getServiceCategoryById(id: string): Promise<ServiceCategoryResult> {
    const category = await dbRead((prisma) =>
      prisma.serviceCategory.findUnique({
        where: { id },
        include: {
          formula: true,
          materialCategories: { include: { materialCategory: true } },
        },
      })
    );

    if (!category) {
      throw new PricingServiceError('NOT_FOUND', 'Service category not found', 404);
    }

    return transformServiceCategory(category);
  }

  /**
   * Create a new service category
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if name already exists
   */
  async createServiceCategory(
    input: CreateServiceCategoryInput
  ): Promise<ServiceCategoryResult> {
    const { materialCategoryIds, ...categoryData } = input;
    const slug = generateSlug(input.name);

    try {
      const category = await dbWrite((prisma) =>
        prisma.serviceCategory.create({
          data: { ...categoryData, slug },
          include: { formula: true },
        })
      );

      // Create material category relations
      if (materialCategoryIds && materialCategoryIds.length > 0) {
        await dbWrite((prisma) =>
          prisma.serviceCategoryMaterialCategory.createMany({
            data: materialCategoryIds.map((mcId) => ({
              serviceCategoryId: category.id,
              materialCategoryId: mcId,
            })),
          })
        );
      }

      return {
        ...category,
        materialCategoryIds: materialCategoryIds || [],
        allowMaterials: (materialCategoryIds?.length || 0) > 0,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new PricingServiceError(
            'CONFLICT',
            'Service category with this name already exists',
            409
          );
        }
      }
      throw error;
    }
  }

  /**
   * Update a service category
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if not found
   */
  async updateServiceCategory(
    id: string,
    input: UpdateServiceCategoryInput
  ): Promise<ServiceCategoryResult> {
    const { materialCategoryIds, ...categoryData } = input;

    // Update slug if name changed
    const updateData: Record<string, unknown> = { ...categoryData };
    if (categoryData.name) {
      updateData.slug = generateSlug(categoryData.name);
    }

    try {
      const category = await dbWrite((prisma) =>
        prisma.serviceCategory.update({
          where: { id },
          data: updateData,
          include: { formula: true },
        })
      );

      // Update material category relations if provided
      if (materialCategoryIds !== undefined) {
        // Delete existing relations
        await dbWrite((prisma) =>
          prisma.serviceCategoryMaterialCategory.deleteMany({
            where: { serviceCategoryId: id },
          })
        );
        // Create new relations
        if (materialCategoryIds.length > 0) {
          await dbWrite((prisma) =>
            prisma.serviceCategoryMaterialCategory.createMany({
              data: materialCategoryIds.map((mcId) => ({
                serviceCategoryId: id,
                materialCategoryId: mcId,
              })),
            })
          );
        }
      }

      return {
        ...category,
        materialCategoryIds: materialCategoryIds || [],
        allowMaterials: (materialCategoryIds?.length || 0) > 0,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PricingServiceError('NOT_FOUND', 'Service category not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a service category
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if not found
   */
  async deleteServiceCategory(id: string): Promise<void> {
    try {
      // Delete relations first
      await dbWrite((prisma) =>
        prisma.serviceCategoryMaterialCategory.deleteMany({
          where: { serviceCategoryId: id },
        })
      );
      await dbWrite((prisma) =>
        prisma.serviceCategory.delete({ where: { id } })
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PricingServiceError('NOT_FOUND', 'Service category not found', 404);
        }
      }
      throw error;
    }
  }

  // ============================================
  // UNIT PRICES
  // ============================================

  /**
   * Get all active unit prices
   *
   * **Feature: high-traffic-resilience**
   * Uses read replica for better performance on list operations.
   * **Validates: Requirements 3.4, 3.6**
   */
  async getAllUnitPrices(): Promise<UnitPrice[]> {
    return dbRead((prisma) =>
      prisma.unitPrice.findMany({
        where: { isActive: true },
        orderBy: { category: 'asc' },
      })
    );
  }

  /**
   * Create a new unit price
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if tag already exists
   */
  async createUnitPrice(input: CreateUnitPriceInput): Promise<UnitPrice> {
    try {
      return await dbWrite((prisma) =>
        prisma.unitPrice.create({ data: input })
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new PricingServiceError(
            'CONFLICT',
            'Unit price with this tag already exists',
            409
          );
        }
      }
      throw error;
    }
  }

  /**
   * Update a unit price
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if not found
   */
  async updateUnitPrice(id: string, input: UpdateUnitPriceInput): Promise<UnitPrice> {
    try {
      return await dbWrite((prisma) =>
        prisma.unitPrice.update({
          where: { id },
          data: input,
        })
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PricingServiceError('NOT_FOUND', 'Unit price not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a unit price
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if not found
   */
  async deleteUnitPrice(id: string): Promise<void> {
    try {
      await dbWrite((prisma) =>
        prisma.unitPrice.delete({ where: { id } })
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PricingServiceError('NOT_FOUND', 'Unit price not found', 404);
        }
      }
      throw error;
    }
  }

  // ============================================
  // MATERIAL CATEGORIES
  // ============================================

  /**
   * Get all active material categories with material count
   *
   * **Feature: high-traffic-resilience**
   * Uses read replica for better performance on list operations.
   * **Validates: Requirements 3.4, 3.6**
   */
  async getAllMaterialCategories(): Promise<MaterialCategoryWithCount[]> {
    return dbRead((prisma) =>
      prisma.materialCategory.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: { _count: { select: { materials: true } } },
      })
    );
  }

  /**
   * Get a single material category with its materials
   *
   * **Feature: high-traffic-resilience**
   * Uses read replica for better performance.
   * **Validates: Requirements 3.4, 3.6**
   *
   * @throws PricingServiceError if not found
   */
  async getMaterialCategoryById(id: string): Promise<MaterialCategoryWithMaterials> {
    const category = await dbRead((prisma) =>
      prisma.materialCategory.findUnique({
        where: { id },
        include: { materials: true },
      })
    );

    if (!category) {
      throw new PricingServiceError('NOT_FOUND', 'Material category not found', 404);
    }

    return category;
  }

  /**
   * Create a new material category
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if name already exists
   */
  async createMaterialCategory(
    input: CreateMaterialCategoryInput
  ): Promise<MaterialCategory> {
    const slug = generateSlug(input.name);

    try {
      return await dbWrite((prisma) =>
        prisma.materialCategory.create({
          data: { ...input, slug },
        })
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new PricingServiceError(
            'CONFLICT',
            'Material category with this name already exists',
            409
          );
        }
      }
      throw error;
    }
  }

  /**
   * Update a material category
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if not found
   */
  async updateMaterialCategory(
    id: string,
    input: UpdateMaterialCategoryInput
  ): Promise<MaterialCategory> {
    const updateData: Record<string, unknown> = { ...input };
    if (input.name) {
      updateData.slug = generateSlug(input.name);
    }

    try {
      return await dbWrite((prisma) =>
        prisma.materialCategory.update({
          where: { id },
          data: updateData,
        })
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PricingServiceError('NOT_FOUND', 'Material category not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a material category (only if no materials exist)
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if not found or has materials
   */
  async deleteMaterialCategory(id: string): Promise<void> {
    // Check if category has materials - use primary for consistency
    const count = await dbReadPrimary((prisma) =>
      prisma.material.count({ where: { categoryId: id } })
    );
    if (count > 0) {
      throw new PricingServiceError(
        'CONFLICT',
        'Không thể xóa danh mục đang có vật dụng',
        409
      );
    }

    try {
      await dbWrite((prisma) =>
        prisma.materialCategory.delete({ where: { id } })
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PricingServiceError('NOT_FOUND', 'Material category not found', 404);
        }
      }
      throw error;
    }
  }

  // ============================================
  // MATERIALS
  // ============================================

  /**
   * Get all active materials, optionally filtered by category
   *
   * **Feature: high-traffic-resilience**
   * Uses read replica for better performance on list operations.
   * **Validates: Requirements 3.4, 3.6**
   */
  async getAllMaterials(categoryId?: string): Promise<MaterialWithCategory[]> {
    return dbRead((prisma) =>
      prisma.material.findMany({
        where: { isActive: true, ...(categoryId ? { categoryId } : {}) },
        orderBy: [{ order: 'asc' }],
        include: { category: true },
      })
    );
  }

  /**
   * Create a new material
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   */
  async createMaterial(input: CreateMaterialInput): Promise<MaterialWithCategory> {
    return dbWrite((prisma) =>
      prisma.material.create({
        data: input,
        include: { category: true },
      })
    );
  }

  /**
   * Update a material
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if not found
   */
  async updateMaterial(
    id: string,
    input: UpdateMaterialInput
  ): Promise<MaterialWithCategory> {
    try {
      return await dbWrite((prisma) =>
        prisma.material.update({
          where: { id },
          data: input,
          include: { category: true },
        })
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PricingServiceError('NOT_FOUND', 'Material not found', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Delete a material
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if not found
   */
  async deleteMaterial(id: string): Promise<void> {
    try {
      await dbWrite((prisma) =>
        prisma.material.delete({ where: { id } })
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PricingServiceError('NOT_FOUND', 'Material not found', 404);
        }
      }
      throw error;
    }
  }

  // ============================================
  // FORMULAS
  // ============================================

  /**
   * Get all active formulas
   *
   * **Feature: high-traffic-resilience**
   * Uses read replica for better performance on list operations.
   * **Validates: Requirements 3.4, 3.6**
   */
  async getAllFormulas(): Promise<Formula[]> {
    return dbRead((prisma) =>
      prisma.formula.findMany({ where: { isActive: true } })
    );
  }

  /**
   * Create a new formula
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   */
  async createFormula(input: CreateFormulaInput): Promise<Formula> {
    return dbWrite((prisma) =>
      prisma.formula.create({ data: input })
    );
  }

  /**
   * Update a formula
   *
   * **Feature: high-traffic-resilience**
   * Uses primary database for write operations.
   * **Validates: Requirements 3.2**
   *
   * @throws PricingServiceError if not found
   */
  async updateFormula(id: string, input: UpdateFormulaInput): Promise<Formula> {
    try {
      return await dbWrite((prisma) =>
        prisma.formula.update({
          where: { id },
          data: input,
        })
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PricingServiceError('NOT_FOUND', 'Formula not found', 404);
        }
      }
      throw error;
    }
  }
}
