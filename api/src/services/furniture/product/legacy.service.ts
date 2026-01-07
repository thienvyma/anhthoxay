/**
 * Legacy Product Service
 *
 * Handles legacy FurnitureProduct operations (READ-ONLY)
 *
 * ⚠️ DEPRECATED: FurnitureProduct is READ-ONLY.
 * New products MUST use FurnitureProductBase + FurnitureProductVariant.
 * See: furniture-product-restructure spec for details.
 *
 * **Feature: furniture-product-restructure**
 * **Validates: Requirements 2.7, 10.3**
 */

import { PrismaClient, Prisma, FurnitureProduct } from '@prisma/client';
import { FurnitureServiceError } from '../furniture.error';
import {
  GetProductsQuery,
  FurnitureProductWithCategory,
  ProductGroup,
  ProductVariant,
  CreateProductInput,
  UpdateProductInput,
} from '../furniture.types';

/**
 * Get all active products, optionally filtered by category
 * NOTE: Legacy FurnitureProduct - READ-ONLY for backward compatibility
 */
export async function getProducts(
  prisma: PrismaClient,
  query?: GetProductsQuery | string
): Promise<FurnitureProductWithCategory[]> {
  const queryParams: GetProductsQuery =
    typeof query === 'string' ? { categoryId: query } : query || {};

  const { categoryId } = queryParams;

  const whereClause: Prisma.FurnitureProductWhereInput = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
  };

  return prisma.furnitureProduct.findMany({
    where: whereClause,
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: {
      category: true,
    },
  });
}

/**
 * Get products grouped by name with material variants
 * NOTE: Legacy - uses FurnitureProduct table
 */
export async function getProductsGrouped(
  prisma: PrismaClient,
  query?: GetProductsQuery | string
): Promise<ProductGroup[]> {
  const products = await getProducts(prisma, query);

  const groupMap = new Map<string, ProductVariant[]>();

  for (const product of products) {
    const variant: ProductVariant = {
      id: product.id,
      material: product.material,
      calculatedPrice: product.calculatedPrice,
      allowFitIn: product.allowFitIn,
      imageUrl: product.imageUrl,
      description: product.description,
      categoryId: product.categoryId,
      categoryName: product.category.name,
      order: product.order,
    };

    const existingVariants = groupMap.get(product.name);
    if (existingVariants) {
      existingVariants.push(variant);
    } else {
      groupMap.set(product.name, [variant]);
    }
  }

  const groups: ProductGroup[] = [];
  for (const [name, variants] of groupMap.entries()) {
    variants.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.material.localeCompare(b.material);
    });
    groups.push({ name, variants });
  }

  return groups;
}

/**
 * Get a single product by ID
 */
export async function getProductById(
  prisma: PrismaClient,
  id: string
): Promise<FurnitureProductWithCategory | null> {
  return prisma.furnitureProduct.findUnique({
    where: { id },
    include: { category: true },
  });
}

// ============================================
// PRODUCT CRUD (LEGACY - READ-ONLY)
// ============================================
// ⚠️ DEPRECATED: These methods are disabled.
// Use createProductBase/updateProductBase instead.
// **Feature: furniture-product-restructure**
// **Validates: Requirements 2.7, 10.3**
// ============================================

/**
 * Create a new product (legacy FurnitureProduct)
 * @deprecated Use createProductBase instead. Legacy table is READ-ONLY.
 * @throws FurnitureServiceError with code 'LEGACY_TABLE_READ_ONLY'
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createProduct(_input: CreateProductInput): Promise<FurnitureProduct> {
  throw new FurnitureServiceError(
    'LEGACY_TABLE_READ_ONLY',
    'FurnitureProduct table is read-only. Use createProductBase with FurnitureProductVariant instead.',
    400
  );
}

/**
 * Update an existing product (legacy FurnitureProduct)
 * @deprecated Use updateProductBase instead. Legacy table is READ-ONLY.
 * @throws FurnitureServiceError with code 'LEGACY_TABLE_READ_ONLY'
 */
export async function updateProduct(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input: UpdateProductInput
): Promise<FurnitureProduct> {
  throw new FurnitureServiceError(
    'LEGACY_TABLE_READ_ONLY',
    'FurnitureProduct table is read-only. Use updateProductBase with FurnitureProductVariant instead.',
    400
  );
}

/**
 * Delete a product (legacy)
 * @deprecated Legacy table is READ-ONLY.
 * @throws FurnitureServiceError with code 'LEGACY_TABLE_READ_ONLY'
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteProduct(_id: string): Promise<void> {
  throw new FurnitureServiceError(
    'LEGACY_TABLE_READ_ONLY',
    'FurnitureProduct table is read-only. Use deleteProductBase instead.',
    400
  );
}
