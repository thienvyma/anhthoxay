/**
 * Product Mapping Service
 *
 * Handles product-apartment mappings for FurnitureProductBase
 *
 * **Feature: furniture-product-restructure**
 * **Requirements: 5.5**
 */

import { PrismaClient, Prisma, FurnitureProductMapping } from '@prisma/client';
import { FurnitureServiceError } from '../furniture.error';
import { ProductMappingInput } from '../furniture.types';

/**
 * Add a mapping to a product base
 * NOTE: Mappings now reference FurnitureProductBase, not FurnitureProduct
 */
export async function addProductMapping(
  prisma: PrismaClient,
  productBaseId: string,
  input: ProductMappingInput
): Promise<FurnitureProductMapping> {
  // Verify product base exists
  const productBase = await prisma.furnitureProductBase.findUnique({
    where: { id: productBaseId },
  });
  if (!productBase) {
    throw new FurnitureServiceError('NOT_FOUND', 'Product base not found', 404);
  }

  try {
    return await prisma.furnitureProductMapping.create({
      data: {
        productBaseId,
        projectName: input.projectName,
        buildingCode: input.buildingCode,
        apartmentType: input.apartmentType,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new FurnitureServiceError(
          'DUPLICATE_MAPPING',
          'This mapping already exists for this product',
          409
        );
      }
    }
    throw error;
  }
}

/**
 * Remove a mapping from a product
 */
export async function removeProductMapping(
  prisma: PrismaClient,
  mappingId: string
): Promise<void> {
  try {
    await prisma.furnitureProductMapping.delete({
      where: { id: mappingId },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new FurnitureServiceError('NOT_FOUND', 'Mapping not found', 404);
      }
    }
    throw error;
  }
}

/**
 * Get all mappings for a product base
 */
export async function getProductMappings(
  prisma: PrismaClient,
  productBaseId: string
): Promise<FurnitureProductMapping[]> {
  return prisma.furnitureProductMapping.findMany({
    where: { productBaseId },
    orderBy: [{ projectName: 'asc' }, { buildingCode: 'asc' }, { apartmentType: 'asc' }],
  });
}

/**
 * Bulk create mappings for multiple products in a single operation
 * Creates the same mapping for all specified product bases
 * Skips duplicates and continues with remaining products
 *
 * **Feature: furniture-product-restructure**
 * **Validates: Requirements 5.5**
 */
export async function bulkCreateMappings(
  prisma: PrismaClient,
  productBaseIds: string[],
  mapping: ProductMappingInput
): Promise<{
  success: boolean;
  created: number;
  skipped: number;
  errors: Array<{ productBaseId: string; error: string }>;
}> {
  if (!productBaseIds || productBaseIds.length === 0) {
    throw new FurnitureServiceError(
      'INVALID_INPUT',
      'At least one product base ID is required',
      400
    );
  }

  // Verify all product bases exist
  const existingBases = await prisma.furnitureProductBase.findMany({
    where: { id: { in: productBaseIds } },
    select: { id: true },
  });

  const existingIds = new Set(existingBases.map((b) => b.id));
  const notFoundIds = productBaseIds.filter((id) => !existingIds.has(id));

  const errors: Array<{ productBaseId: string; error: string }> = [];
  let created = 0;
  let skipped = 0;

  // Add errors for non-existent product bases
  for (const id of notFoundIds) {
    errors.push({ productBaseId: id, error: 'Product base not found' });
  }

  // Create mappings for existing product bases
  const validIds = productBaseIds.filter((id) => existingIds.has(id));

  for (const productBaseId of validIds) {
    try {
      await prisma.furnitureProductMapping.create({
        data: {
          productBaseId,
          projectName: mapping.projectName,
          buildingCode: mapping.buildingCode,
          apartmentType: mapping.apartmentType,
        },
      });
      created++;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Duplicate mapping - skip silently
          skipped++;
          continue;
        }
      }
      // Other errors
      errors.push({
        productBaseId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    success: errors.length === 0,
    created,
    skipped,
    errors,
  };
}
