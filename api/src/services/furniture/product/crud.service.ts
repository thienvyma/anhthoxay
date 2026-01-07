/**
 * Product Base CRUD Service
 *
 * Handles CRUD operations for FurnitureProductBase
 *
 * **Feature: furniture-product-restructure**
 * **Requirements: 9.1-9.7, 3.2-3.4**
 */

import {
  PrismaClient,
  Prisma,
  FurnitureProductBase,
  FurnitureProductMapping,
  FurnitureProductVariant,
} from '@prisma/client';
import { FurnitureServiceError } from '../furniture.error';
import {
  CreateProductBaseInput,
  UpdateProductBaseInput,
  ProductBaseWithDetails,
  GetProductBasesAdminQuery,
  PaginatedProductBases,
  ProductBaseGroup,
} from '../furniture.types';
import { calculateVariantPrice, calculatePriceRange } from './calculation.service';

/**
 * Transform Prisma result to ProductBaseWithDetails
 */
export function transformToProductBaseWithDetails(
  base: FurnitureProductBase & {
    category: { id: string; name: string };
    variants: Array<
      FurnitureProductVariant & {
        material: { id: string; name: string };
      }
    >;
    mappings: FurnitureProductMapping[];
  }
): ProductBaseWithDetails {
  const priceRange = calculatePriceRange(base.variants);

  return {
    id: base.id,
    name: base.name,
    categoryId: base.categoryId,
    category: {
      id: base.category.id,
      name: base.category.name,
    },
    description: base.description,
    imageUrl: base.imageUrl,
    allowFitIn: base.allowFitIn,
    order: base.order,
    isActive: base.isActive,
    variants: base.variants.map((v) => ({
      id: v.id,
      productBaseId: v.productBaseId,
      materialId: v.materialId,
      material: {
        id: v.material.id,
        name: v.material.name,
      },
      pricePerUnit: v.pricePerUnit,
      pricingType: v.pricingType,
      length: v.length,
      width: v.width,
      calculatedPrice: v.calculatedPrice,
      imageUrl: v.imageUrl,
      order: v.order,
      isActive: v.isActive,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    })),
    mappings: base.mappings.map((m) => ({
      id: m.id,
      productBaseId: m.productBaseId,
      projectName: m.projectName,
      buildingCode: m.buildingCode,
      apartmentType: m.apartmentType,
      createdAt: m.createdAt,
    })),
    variantCount: base.variants.length,
    priceRange,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
  };
}

/**
 * Create a new product base with variants in a single transaction
 *
 * **Feature: furniture-product-restructure, Property 14**
 * **Validates: Requirements 3.2, 9.3**
 */
export async function createProductBase(
  prisma: PrismaClient,
  input: CreateProductBaseInput
): Promise<ProductBaseWithDetails> {
  // Validate at least one variant
  if (!input.variants || input.variants.length === 0) {
    throw new FurnitureServiceError(
      'VARIANT_REQUIRED',
      'At least one variant is required when creating a product',
      400
    );
  }

  // Validate category exists
  const category = await prisma.furnitureCategory.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) {
    throw new FurnitureServiceError('CATEGORY_NOT_FOUND', 'Category not found', 404);
  }

  // Validate all materials exist
  const materialIds = input.variants.map((v) => v.materialId);
  const materials = await prisma.furnitureMaterial.findMany({
    where: { id: { in: materialIds } },
  });
  if (materials.length !== materialIds.length) {
    throw new FurnitureServiceError('MATERIAL_NOT_FOUND', 'One or more materials not found', 404);
  }

  // Check for duplicate materialIds in input
  const uniqueMaterialIds = new Set(materialIds);
  if (uniqueMaterialIds.size !== materialIds.length) {
    throw new FurnitureServiceError(
      'DUPLICATE_VARIANT_MATERIAL',
      'Duplicate material IDs in variants',
      400
    );
  }

  // Prepare variant data with calculated prices
  const variantsData = input.variants.map((variant) => {
    const calculatedPrice = calculateVariantPrice(
      variant.pricePerUnit,
      variant.pricingType,
      variant.length,
      variant.width
    );

    return {
      materialId: variant.materialId,
      pricePerUnit: variant.pricePerUnit,
      pricingType: variant.pricingType,
      length: variant.length,
      width: variant.width ?? null,
      calculatedPrice,
      imageUrl: variant.imageUrl ?? null,
      order: variant.order ?? 0,
      isActive: variant.isActive ?? true,
    };
  });

  // Prepare mappings data
  const mappingsData =
    input.mappings?.map((mapping) => ({
      projectName: mapping.projectName,
      buildingCode: mapping.buildingCode,
      apartmentType: mapping.apartmentType,
    })) ?? [];

  try {
    // Create product base with variants and mappings in a single transaction
    const productBase = await prisma.furnitureProductBase.create({
      data: {
        name: input.name,
        categoryId: input.categoryId,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        allowFitIn: input.allowFitIn ?? false,
        order: input.order ?? 0,
        isActive: input.isActive ?? true,
        variants: {
          create: variantsData,
        },
        mappings: {
          create: mappingsData,
        },
      },
      include: {
        category: true,
        variants: {
          include: {
            material: true,
          },
          orderBy: [{ order: 'asc' }, { material: { name: 'asc' } }],
        },
        mappings: {
          orderBy: [{ projectName: 'asc' }, { buildingCode: 'asc' }, { apartmentType: 'asc' }],
        },
      },
    });

    return transformToProductBaseWithDetails(productBase);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('name') && target.includes('categoryId')) {
          throw new FurnitureServiceError(
            'DUPLICATE_PRODUCT_NAME',
            'A product with this name already exists in this category',
            409
          );
        }
      }
    }
    throw error;
  }
}

/**
 * Get a single product base by ID with all details
 */
export async function getProductBaseById(
  prisma: PrismaClient,
  id: string
): Promise<ProductBaseWithDetails | null> {
  const productBase = await prisma.furnitureProductBase.findUnique({
    where: { id },
    include: {
      category: true,
      variants: {
        include: {
          material: true,
        },
        orderBy: [{ order: 'asc' }, { material: { name: 'asc' } }],
      },
      mappings: {
        orderBy: [{ projectName: 'asc' }, { buildingCode: 'asc' }, { apartmentType: 'asc' }],
      },
    },
  });

  if (!productBase) {
    return null;
  }

  return transformToProductBaseWithDetails(productBase);
}


/**
 * Get products grouped by ProductBase with nested variants for Landing page
 * Filters by apartment mapping if provided
 * Excludes inactive variants
 *
 * **Feature: furniture-product-restructure, Property 11, 12**
 * **Validates: Requirements 9.1, 9.7, 4.6**
 */
export async function getProductBasesGrouped(
  prisma: PrismaClient,
  query?: {
    categoryId?: string;
    projectName?: string;
    buildingCode?: string;
    apartmentType?: string;
  }
): Promise<ProductBaseGroup[]> {
  const { categoryId, projectName, buildingCode, apartmentType } = query || {};

  // Build where clause
  const whereClause: Prisma.FurnitureProductBaseWhereInput = {
    isActive: true,
    variants: {
      some: {
        isActive: true,
      },
    },
    ...(categoryId ? { categoryId } : {}),
  };

  // If apartment filters provided, filter by mappings
  if (projectName || buildingCode || apartmentType) {
    whereClause.mappings = {
      some: {
        ...(projectName ? { projectName } : {}),
        ...(buildingCode ? { buildingCode } : {}),
        ...(apartmentType ? { apartmentType } : {}),
      },
    };
  }

  const productBases = await prisma.furnitureProductBase.findMany({
    where: whereClause,
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        include: {
          material: true,
        },
        orderBy: [{ order: 'asc' }, { material: { name: 'asc' } }],
      },
    },
  });

  // Transform to ProductBaseGroup[]
  return productBases.map((base) => {
    const activeVariants = base.variants;
    const priceRange = calculatePriceRange(activeVariants);

    return {
      id: base.id,
      name: base.name,
      categoryId: base.categoryId,
      categoryName: base.category.name,
      description: base.description,
      imageUrl: base.imageUrl,
      allowFitIn: base.allowFitIn,
      variants: activeVariants.map((v) => ({
        id: v.id,
        materialId: v.materialId,
        materialName: v.material.name,
        calculatedPrice: v.calculatedPrice,
        imageUrl: v.imageUrl,
      })),
      priceRange,
      variantCount: activeVariants.length,
    };
  });
}

/**
 * Get products for Admin with pagination, filtering, and sorting
 * Includes all variants and mappings
 *
 * **Feature: furniture-product-restructure**
 * **Validates: Requirements 9.2**
 */
export async function getProductBasesForAdmin(
  prisma: PrismaClient,
  query?: GetProductBasesAdminQuery
): Promise<PaginatedProductBases> {
  const {
    categoryId,
    materialId,
    isActive,
    page = 1,
    limit = 20,
    sortBy = 'order',
    sortOrder = 'asc',
  } = query || {};

  // Build where clause
  const whereClause: Prisma.FurnitureProductBaseWhereInput = {
    ...(categoryId ? { categoryId } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  // Filter by material if provided
  if (materialId) {
    whereClause.variants = {
      some: {
        materialId,
      },
    };
  }

  // Build orderBy
  const orderBy: Prisma.FurnitureProductBaseOrderByWithRelationInput[] = [];
  if (sortBy === 'name') {
    orderBy.push({ name: sortOrder });
  } else if (sortBy === 'createdAt') {
    orderBy.push({ createdAt: sortOrder });
  } else if (sortBy === 'updatedAt') {
    orderBy.push({ updatedAt: sortOrder });
  } else {
    orderBy.push({ order: sortOrder });
    orderBy.push({ name: 'asc' });
  }

  // Get total count
  const total = await prisma.furnitureProductBase.count({
    where: whereClause,
  });

  // Get paginated products
  const productBases = await prisma.furnitureProductBase.findMany({
    where: whereClause,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      category: true,
      variants: {
        include: {
          material: true,
        },
        orderBy: [{ order: 'asc' }, { material: { name: 'asc' } }],
      },
      mappings: {
        orderBy: [{ projectName: 'asc' }, { buildingCode: 'asc' }, { apartmentType: 'asc' }],
      },
    },
  });

  // Transform to ProductBaseWithDetails[]
  const products = productBases.map((base) => transformToProductBaseWithDetails(base));

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update a product base (partial updates)
 * Does not update variants - use variant-specific methods
 *
 * **Feature: furniture-product-restructure**
 * **Validates: Requirements 9.4, 3.3**
 */
export async function updateProductBase(
  prisma: PrismaClient,
  id: string,
  input: UpdateProductBaseInput
): Promise<ProductBaseWithDetails> {
  // Check if product base exists
  const existing = await prisma.furnitureProductBase.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new FurnitureServiceError('PRODUCT_BASE_NOT_FOUND', 'Product base not found', 404);
  }

  // If name or categoryId is changing, validate unique constraint
  if (input.name !== undefined || input.categoryId !== undefined) {
    const newName = input.name ?? existing.name;
    const newCategoryId = input.categoryId ?? existing.categoryId;

    // Check for duplicate
    const duplicate = await prisma.furnitureProductBase.findFirst({
      where: {
        name: newName,
        categoryId: newCategoryId,
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new FurnitureServiceError(
        'DUPLICATE_PRODUCT_NAME',
        'A product with this name already exists in this category',
        409
      );
    }
  }

  // If categoryId is changing, validate it exists
  if (input.categoryId !== undefined) {
    const category = await prisma.furnitureCategory.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      throw new FurnitureServiceError('CATEGORY_NOT_FOUND', 'Category not found', 404);
    }
  }

  // Update product base
  const productBase = await prisma.furnitureProductBase.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.allowFitIn !== undefined && { allowFitIn: input.allowFitIn }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: {
      category: true,
      variants: {
        include: {
          material: true,
        },
        orderBy: [{ order: 'asc' }, { material: { name: 'asc' } }],
      },
      mappings: {
        orderBy: [{ projectName: 'asc' }, { buildingCode: 'asc' }, { apartmentType: 'asc' }],
      },
    },
  });

  return transformToProductBaseWithDetails(productBase);
}

/**
 * Delete a product base
 * Cascade deletes variants (handled by Prisma)
 * Checks if referenced by quotations
 *
 * **Feature: furniture-product-restructure**
 * **Validates: Requirements 9.6, 3.4**
 */
export async function deleteProductBase(prisma: PrismaClient, id: string): Promise<void> {
  // Check if product base exists
  const existing = await prisma.furnitureProductBase.findUnique({
    where: { id },
    include: {
      variants: true,
    },
  });
  if (!existing) {
    throw new FurnitureServiceError('PRODUCT_BASE_NOT_FOUND', 'Product base not found', 404);
  }

  // Check if any variant is referenced by quotations
  const variantIds = existing.variants.map((v) => v.id);
  if (variantIds.length > 0) {
    const quotationsWithVariants = await prisma.furnitureQuotation.findFirst({
      where: {
        OR: variantIds.map((variantId) => ({
          items: {
            contains: variantId,
          },
        })),
      },
    });

    if (quotationsWithVariants) {
      throw new FurnitureServiceError(
        'PRODUCT_IN_QUOTATION',
        'Cannot delete product that is referenced by existing quotations',
        409
      );
    }
  }

  // Delete product base (variants and mappings cascade delete)
  await prisma.furnitureProductBase.delete({
    where: { id },
  });
}
