/**
 * Furniture Product Service
 *
 * Handles business logic for:
 * - Products (Sản phẩm nội thất) - LEGACY
 * - Product Base (NEW - furniture-product-restructure)
 * - Product Variants (NEW - furniture-product-restructure)
 * - Product Mappings (apartment-product mapping)
 *
 * NOTE: FurnitureProduct is now legacy. New products should use
 * FurnitureProductBase + FurnitureProductVariant (see furniture-product-restructure spec)
 *
 * **Feature: furniture-quotation, furniture-product-restructure**
 * **Requirements: 2.1-2.5, 3.1-3.6, 4.1-4.7, 9.1-9.7**
 */

import { PrismaClient, Prisma, FurnitureProduct, FurnitureProductMapping, FurnitureProductBase, FurnitureProductVariant } from '@prisma/client';
import { FurnitureServiceError } from './furniture.error';
import {
  GetProductsQuery,
  FurnitureProductWithCategory,
  ProductGroup,
  ProductVariant,
  CreateProductInput,
  UpdateProductInput,
  ProductMappingInput,
  CreateProductBaseInput,
  UpdateProductBaseInput,
  ProductBaseWithDetails,
  ProductBaseGroup,
  GetProductBasesAdminQuery,
  PaginatedProductBases,
  CreateVariantInput,
  UpdateVariantInput,
} from './furniture.types';

export class FurnitureProductService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // PRICE CALCULATION
  // ============================================

  /**
   * Calculate product price from dimensions
   * - M2 (mét vuông): pricePerUnit × length × width
   * - LINEAR (mét dài): pricePerUnit × length
   *
   * **Feature: furniture-product-mapping, Property 6: Calculated Price Formula**
   * **Validates: Requirements 3.4**
   */
  calculateProductPrice(
    pricePerUnit: number,
    pricingType: 'M2' | 'LINEAR',
    length: number,
    width?: number
  ): number {
    if (pricePerUnit < 0) {
      throw new FurnitureServiceError(
        'INVALID_DIMENSIONS',
        'pricePerUnit must be a non-negative number',
        400
      );
    }
    if (length < 0) {
      throw new FurnitureServiceError(
        'INVALID_DIMENSIONS',
        'length must be a non-negative number',
        400
      );
    }

    if (pricingType === 'M2') {
      if (width === undefined || width === null) {
        throw new FurnitureServiceError(
          'WIDTH_REQUIRED_FOR_M2',
          'Width is required when pricingType is M2',
          400
        );
      }
      if (width < 0) {
        throw new FurnitureServiceError(
          'INVALID_DIMENSIONS',
          'width must be a non-negative number',
          400
        );
      }
      return pricePerUnit * length * width;
    }

    return pricePerUnit * length;
  }

  // ============================================
  // PRODUCTS (LEGACY - Read-only)
  // ============================================
  // ⚠️ DEPRECATED: FurnitureProduct is READ-ONLY.
  // New products MUST use FurnitureProductBase + FurnitureProductVariant.
  // See: furniture-product-restructure spec for details.
  // **Feature: furniture-product-restructure**
  // **Validates: Requirements 2.7, 10.3**
  // ============================================

  /**
   * Get all active products, optionally filtered by category
   * NOTE: Legacy FurnitureProduct - READ-ONLY for backward compatibility
   */
  async getProducts(
    query?: GetProductsQuery | string
  ): Promise<FurnitureProductWithCategory[]> {
    const queryParams: GetProductsQuery =
      typeof query === 'string' ? { categoryId: query } : query || {};

    const { categoryId } = queryParams;

    const whereClause: Prisma.FurnitureProductWhereInput = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
    };

    return this.prisma.furnitureProduct.findMany({
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
  async getProductsGrouped(
    query?: GetProductsQuery | string
  ): Promise<ProductGroup[]> {
    const products = await this.getProducts(query);

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
  async getProductById(id: string): Promise<FurnitureProductWithCategory | null> {
    return this.prisma.furnitureProduct.findUnique({
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
  async createProduct(_input: CreateProductInput): Promise<FurnitureProduct> {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateProduct(_id: string, _input: UpdateProductInput): Promise<FurnitureProduct> {
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
  async deleteProduct(_id: string): Promise<void> {
    throw new FurnitureServiceError(
      'LEGACY_TABLE_READ_ONLY',
      'FurnitureProduct table is read-only. Use deleteProductBase instead.',
      400
    );
  }

  // ============================================
  // PRODUCT MAPPINGS (for FurnitureProductBase)
  // ============================================

  /**
   * Add a mapping to a product base
   * NOTE: Mappings now reference FurnitureProductBase, not FurnitureProduct
   */
  async addProductMapping(
    productBaseId: string,
    input: ProductMappingInput
  ): Promise<FurnitureProductMapping> {
    // Verify product base exists
    const productBase = await this.prisma.furnitureProductBase.findUnique({
      where: { id: productBaseId },
    });
    if (!productBase) {
      throw new FurnitureServiceError('NOT_FOUND', 'Product base not found', 404);
    }

    try {
      return await this.prisma.furnitureProductMapping.create({
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
  async removeProductMapping(mappingId: string): Promise<void> {
    try {
      await this.prisma.furnitureProductMapping.delete({
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
  async getProductMappings(productBaseId: string): Promise<FurnitureProductMapping[]> {
    return this.prisma.furnitureProductMapping.findMany({
      where: { productBaseId },
      orderBy: [
        { projectName: 'asc' },
        { buildingCode: 'asc' },
        { apartmentType: 'asc' },
      ],
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
  async bulkCreateMappings(
    productBaseIds: string[],
    mapping: ProductMappingInput
  ): Promise<{ success: boolean; created: number; skipped: number; errors: Array<{ productBaseId: string; error: string }> }> {
    if (!productBaseIds || productBaseIds.length === 0) {
      throw new FurnitureServiceError(
        'INVALID_INPUT',
        'At least one product base ID is required',
        400
      );
    }

    // Verify all product bases exist
    const existingBases = await this.prisma.furnitureProductBase.findMany({
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
        await this.prisma.furnitureProductMapping.create({
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

  // ============================================
  // PRODUCT BASE CRUD (NEW - furniture-product-restructure)
  // ============================================

  /**
   * Calculate variant price based on pricing type
   * Helper method for variant creation/update
   */
  private calculateVariantPrice(
    pricePerUnit: number,
    pricingType: 'LINEAR' | 'M2',
    length: number,
    width?: number | null
  ): number {
    if (pricePerUnit < 0) {
      throw new FurnitureServiceError(
        'INVALID_DIMENSIONS',
        'pricePerUnit must be a non-negative number',
        400
      );
    }
    if (length < 0) {
      throw new FurnitureServiceError(
        'INVALID_DIMENSIONS',
        'length must be a non-negative number',
        400
      );
    }

    if (pricingType === 'M2') {
      if (width === undefined || width === null) {
        throw new FurnitureServiceError(
          'WIDTH_REQUIRED_FOR_M2',
          'Width is required when pricingType is M2',
          400
        );
      }
      if (width < 0) {
        throw new FurnitureServiceError(
          'INVALID_DIMENSIONS',
          'width must be a non-negative number',
          400
        );
      }
      return pricePerUnit * length * width;
    }

    return pricePerUnit * length;
  }

  /**
   * Calculate price range from variants
   */
  private calculatePriceRange(
    variants: Array<{ calculatedPrice: number; isActive: boolean }>
  ): { min: number; max: number } | null {
    const activeVariants = variants.filter((v) => v.isActive);

    if (activeVariants.length === 0) {
      return null;
    }

    const prices = activeVariants.map((v) => v.calculatedPrice);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  /**
   * Create a new product base with variants in a single transaction
   *
   * **Feature: furniture-product-restructure, Property 14**
   * **Validates: Requirements 3.2, 9.3**
   */
  async createProductBase(input: CreateProductBaseInput): Promise<ProductBaseWithDetails> {
    // Validate at least one variant
    if (!input.variants || input.variants.length === 0) {
      throw new FurnitureServiceError(
        'VARIANT_REQUIRED',
        'At least one variant is required when creating a product',
        400
      );
    }

    // Validate category exists
    const category = await this.prisma.furnitureCategory.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      throw new FurnitureServiceError('CATEGORY_NOT_FOUND', 'Category not found', 404);
    }

    // Validate all materials exist
    const materialIds = input.variants.map((v) => v.materialId);
    const materials = await this.prisma.furnitureMaterial.findMany({
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
      const calculatedPrice = this.calculateVariantPrice(
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
    const mappingsData = input.mappings?.map((mapping) => ({
      projectName: mapping.projectName,
      buildingCode: mapping.buildingCode,
      apartmentType: mapping.apartmentType,
    })) ?? [];

    try {
      // Create product base with variants and mappings in a single transaction
      const productBase = await this.prisma.furnitureProductBase.create({
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
            orderBy: [
              { projectName: 'asc' },
              { buildingCode: 'asc' },
              { apartmentType: 'asc' },
            ],
          },
        },
      });

      // Transform to ProductBaseWithDetails
      return this.transformToProductBaseWithDetails(productBase);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
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
   * Get products grouped by ProductBase with nested variants for Landing page
   * Filters by apartment mapping if provided
   * Excludes inactive variants
   *
   * **Feature: furniture-product-restructure, Property 11, 12**
   * **Validates: Requirements 9.1, 9.7, 4.6**
   */
  async getProductBasesGrouped(query?: {
    categoryId?: string;
    projectName?: string;
    buildingCode?: string;
    apartmentType?: string;
  }): Promise<ProductBaseGroup[]> {
    const { categoryId, projectName, buildingCode, apartmentType } = query || {};

    // Build where clause
    const whereClause: Prisma.FurnitureProductBaseWhereInput = {
      isActive: true,
      // Only include products with at least one active variant
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

    const productBases = await this.prisma.furnitureProductBase.findMany({
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
      const priceRange = this.calculatePriceRange(activeVariants);

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
  async getProductBasesForAdmin(
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
    const total = await this.prisma.furnitureProductBase.count({
      where: whereClause,
    });

    // Get paginated products
    const productBases = await this.prisma.furnitureProductBase.findMany({
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
          orderBy: [
            { projectName: 'asc' },
            { buildingCode: 'asc' },
            { apartmentType: 'asc' },
          ],
        },
      },
    });

    // Transform to ProductBaseWithDetails[]
    const products = productBases.map((base) =>
      this.transformToProductBaseWithDetails(base)
    );

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single product base by ID with all details
   */
  async getProductBaseById(id: string): Promise<ProductBaseWithDetails | null> {
    const productBase = await this.prisma.furnitureProductBase.findUnique({
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
          orderBy: [
            { projectName: 'asc' },
            { buildingCode: 'asc' },
            { apartmentType: 'asc' },
          ],
        },
      },
    });

    if (!productBase) {
      return null;
    }

    return this.transformToProductBaseWithDetails(productBase);
  }

  /**
   * Update a product base (partial updates)
   * Does not update variants - use variant-specific methods
   *
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.4, 3.3**
   */
  async updateProductBase(
    id: string,
    input: UpdateProductBaseInput
  ): Promise<ProductBaseWithDetails> {
    // Check if product base exists
    const existing = await this.prisma.furnitureProductBase.findUnique({
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
      const duplicate = await this.prisma.furnitureProductBase.findFirst({
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
      const category = await this.prisma.furnitureCategory.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        throw new FurnitureServiceError('CATEGORY_NOT_FOUND', 'Category not found', 404);
      }
    }

    // Update product base
    const productBase = await this.prisma.furnitureProductBase.update({
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
          orderBy: [
            { projectName: 'asc' },
            { buildingCode: 'asc' },
            { apartmentType: 'asc' },
          ],
        },
      },
    });

    return this.transformToProductBaseWithDetails(productBase);
  }

  /**
   * Delete a product base
   * Cascade deletes variants (handled by Prisma)
   * Checks if referenced by quotations
   *
   * **Feature: furniture-product-restructure**
   * **Validates: Requirements 9.6, 3.4**
   */
  async deleteProductBase(id: string): Promise<void> {
    // Check if product base exists
    const existing = await this.prisma.furnitureProductBase.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });
    if (!existing) {
      throw new FurnitureServiceError('PRODUCT_BASE_NOT_FOUND', 'Product base not found', 404);
    }

    // Check if any variant is referenced by quotations
    // NOTE: This check looks for variant IDs in quotation items JSON
    // In a real implementation, you might want a more robust check
    const variantIds = existing.variants.map((v) => v.id);
    if (variantIds.length > 0) {
      const quotationsWithVariants = await this.prisma.furnitureQuotation.findFirst({
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
    await this.prisma.furnitureProductBase.delete({
      where: { id },
    });
  }

  // ============================================
  // VARIANT CRUD (NEW - furniture-product-restructure)
  // ============================================

  /**
   * Create a new variant for a product base
   * - Validates unique (productBaseId, materialId)
   * - Auto-calculates calculatedPrice
   * - Validates width for M2 type
   *
   * **Feature: furniture-product-restructure, Property 2**
   * **Validates: Requirements 4.2, 4.3, 4.7**
   */
  async createVariant(
    productBaseId: string,
    input: CreateVariantInput
  ): Promise<FurnitureProductVariant & { material: { id: string; name: string } }> {
    // Verify product base exists
    const productBase = await this.prisma.furnitureProductBase.findUnique({
      where: { id: productBaseId },
    });
    if (!productBase) {
      throw new FurnitureServiceError('PRODUCT_BASE_NOT_FOUND', 'Product base not found', 404);
    }

    // Verify material exists
    const material = await this.prisma.furnitureMaterial.findUnique({
      where: { id: input.materialId },
    });
    if (!material) {
      throw new FurnitureServiceError('MATERIAL_NOT_FOUND', 'Material not found', 404);
    }

    // Calculate price (validates width for M2 type)
    const calculatedPrice = this.calculateVariantPrice(
      input.pricePerUnit,
      input.pricingType,
      input.length,
      input.width
    );

    try {
      const variant = await this.prisma.furnitureProductVariant.create({
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
  async updateVariant(
    variantId: string,
    input: UpdateVariantInput
  ): Promise<FurnitureProductVariant & { material: { id: string; name: string } }> {
    // Get existing variant
    const existing = await this.prisma.furnitureProductVariant.findUnique({
      where: { id: variantId },
    });
    if (!existing) {
      throw new FurnitureServiceError('VARIANT_NOT_FOUND', 'Variant not found', 404);
    }

    // If materialId is changing, validate it exists and check unique constraint
    if (input.materialId !== undefined && input.materialId !== existing.materialId) {
      const material = await this.prisma.furnitureMaterial.findUnique({
        where: { id: input.materialId },
      });
      if (!material) {
        throw new FurnitureServiceError('MATERIAL_NOT_FOUND', 'Material not found', 404);
      }

      // Check for duplicate (productBaseId, materialId)
      const duplicate = await this.prisma.furnitureProductVariant.findFirst({
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
      calculatedPrice = this.calculateVariantPrice(pricePerUnit, pricingType, length, width);
    }

    const variant = await this.prisma.furnitureProductVariant.update({
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
  async deleteVariant(variantId: string): Promise<void> {
    // Get existing variant with product base info
    const existing = await this.prisma.furnitureProductVariant.findUnique({
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

    await this.prisma.furnitureProductVariant.delete({
      where: { id: variantId },
    });
  }

  /**
   * Get a single variant by ID
   */
  async getVariantById(
    variantId: string
  ): Promise<(FurnitureProductVariant & { material: { id: string; name: string } }) | null> {
    return this.prisma.furnitureProductVariant.findUnique({
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

  /**
   * Transform Prisma result to ProductBaseWithDetails
   */
  private transformToProductBaseWithDetails(
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
    const priceRange = this.calculatePriceRange(base.variants);

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
}
