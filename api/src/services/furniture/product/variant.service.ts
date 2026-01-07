/**
 * Product Variant Service
 *
 * Handles CRUD operations for FurnitureProductVariant
 *
 * **Feature: furniture-product-restructure**
 * **Requirements: 4.2-4.7**
 */

import { PrismaClient, Prisma, FurnitureProductVariant } from '@prisma/client';
import { FurnitureServiceError } from '../furniture.error';
import { CreateVariantInput, UpdateVariantInput } from '../furniture.types';
import { calculateVariantPrice } from './calculation.service';

export type VariantWithMaterial = FurnitureProductVariant & {
  material: { id: string; name: string };
};

/**
 * Create a new variant for a product base
 * - Validates unique (productBaseId, materialId)
 * - Auto-calculates calculatedPrice
 * - Validates width for M2 type
 *
 * **Feature: furniture-product-restructure, Property 2**
 * **Validates: Requirements 4.2, 4.3, 4.7**
 */
export async function createVariant(
  prisma: PrismaClient,
  productBaseId: string,
  input: CreateVariantInput
): Promise<VariantWithMaterial> {
  // Verify product base exists
  const productBase = await prisma.furnitureProductBase.findUnique({
    where: { id: productBaseId },
  });
  if (!productBase) {
    throw new FurnitureServiceError('PRODUCT_BASE_NOT_FOUND', 'Product base not found', 404);
  }

  // Verify material exists
  const material = await prisma.furnitureMaterial.findUnique({
    where: { id: input.materialId },
  });
  if (!material) {
    throw new FurnitureServiceError('MATERIAL_NOT_FOUND', 'Material not found', 404);
  }

  // Calculate price (validates width for M2 type)
  const calculatedPrice = calculateVariantPrice(
    input.pricePerUnit,
    input.pricingType,
    input.length,
    input.width
  );

  try {
    const variant = await prisma.furnitureProductVariant.create({
      data: {
        productBaseId,
        materialId: input.materialId,
        pricePerUnit: input.pricePerUnit,
        pricingType: input.pricingType,
        length: input.length,
        width: input.width ?? null,
        calculatedPrice,
        imageUrl: input.imageUrl ?? null,
        order: input.order ?? 0,
        isActive: input.isActive ?? true,
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return variant;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new FurnitureServiceError(
          'DUPLICATE_VARIANT_MATERIAL',
          'A variant with this material already exists for this product',
          409
        );
      }
    }
    throw error;
  }
}

/**
 * Update an existing variant
 * - Recalculates price on dimension changes
 * - Validates unique constraint on materialId change
 *
 * **Feature: furniture-product-restructure**
 * **Validates: Requirements 4.4**
 */
export async function updateVariant(
  prisma: PrismaClient,
  variantId: string,
  input: UpdateVariantInput
): Promise<VariantWithMaterial> {
  // Get existing variant
  const existing = await prisma.furnitureProductVariant.findUnique({
    where: { id: variantId },
  });
  if (!existing) {
    throw new FurnitureServiceError('VARIANT_NOT_FOUND', 'Variant not found', 404);
  }

  // If materialId is changing, validate it exists and check unique constraint
  if (input.materialId !== undefined && input.materialId !== existing.materialId) {
    const material = await prisma.furnitureMaterial.findUnique({
      where: { id: input.materialId },
    });
    if (!material) {
      throw new FurnitureServiceError('MATERIAL_NOT_FOUND', 'Material not found', 404);
    }

    // Check for duplicate (productBaseId, materialId)
    const duplicate = await prisma.furnitureProductVariant.findFirst({
      where: {
        productBaseId: existing.productBaseId,
        materialId: input.materialId,
        id: { not: variantId },
      },
    });
    if (duplicate) {
      throw new FurnitureServiceError(
        'DUPLICATE_VARIANT_MATERIAL',
        'A variant with this material already exists for this product',
        409
      );
    }
  }

  // Determine final values for price calculation
  const pricePerUnit = input.pricePerUnit ?? existing.pricePerUnit;
  const pricingType = (input.pricingType ?? existing.pricingType) as 'LINEAR' | 'M2';
  const length = input.length ?? existing.length;
  // Handle width: if explicitly set to null, use null; if undefined, use existing
  const width = input.width === null ? null : (input.width ?? existing.width);

  // Recalculate price if any pricing-related field changed
  let calculatedPrice = existing.calculatedPrice;
  if (
    input.pricePerUnit !== undefined ||
    input.pricingType !== undefined ||
    input.length !== undefined ||
    input.width !== undefined
  ) {
    calculatedPrice = calculateVariantPrice(pricePerUnit, pricingType, length, width);
  }

  const variant = await prisma.furnitureProductVariant.update({
    where: { id: variantId },
    data: {
      ...(input.materialId !== undefined && { materialId: input.materialId }),
      ...(input.pricePerUnit !== undefined && { pricePerUnit: input.pricePerUnit }),
      ...(input.pricingType !== undefined && { pricingType: input.pricingType }),
      ...(input.length !== undefined && { length: input.length }),
      ...(input.width !== undefined && { width: input.width }),
      calculatedPrice,
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: {
      material: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return variant;
}

/**
 * Delete a variant
 * - Prevents deletion of last variant
 *
 * **Feature: furniture-product-restructure, Property 10**
 * **Validates: Requirements 4.5**
 */
export async function deleteVariant(prisma: PrismaClient, variantId: string): Promise<void> {
  // Get existing variant with product base info
  const existing = await prisma.furnitureProductVariant.findUnique({
    where: { id: variantId },
    include: {
      productBase: {
        include: {
          variants: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!existing) {
    throw new FurnitureServiceError('VARIANT_NOT_FOUND', 'Variant not found', 404);
  }

  // Check if this is the last variant
  if (existing.productBase.variants.length <= 1) {
    throw new FurnitureServiceError(
      'LAST_VARIANT_DELETE',
      'Cannot delete the last variant of a product. Delete the product base instead.',
      400
    );
  }

  await prisma.furnitureProductVariant.delete({
    where: { id: variantId },
  });
}

/**
 * Get a single variant by ID
 */
export async function getVariantById(
  prisma: PrismaClient,
  variantId: string
): Promise<VariantWithMaterial | null> {
  return prisma.furnitureProductVariant.findUnique({
    where: { id: variantId },
    include: {
      material: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
