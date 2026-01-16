/**
 * Furniture Product Firestore Service
 * 
 * Handles Firestore operations for:
 * - Product Bases - `furnitureProductBases/{baseId}`
 * - Product Variants - `furnitureProductBases/{baseId}/variants/{variantId}`
 * - Categories - `furnitureCategories/{categoryId}`
 * - Materials - `furnitureMaterials/{materialId}`
 * - Fees - `furnitureFees/{feeId}`
 * - Product Mappings - `furnitureProductMappings/{mappingId}`
 * 
 * @module services/firestore/furniture-product.firestore
 * @requirements 8.2
 */

import { BaseFirestoreService, SubcollectionFirestoreService, type QueryOptions } from './base.firestore';
import type {
  FirestoreFurnitureCategory,
  FirestoreFurnitureMaterial,
  FirestoreFurnitureFee,
  FirestoreFurnitureProductBase,
  FirestoreFurnitureProductVariant,
  ServiceFeeType,
} from '../../types/firestore.types';

// ============================================
// ERROR CLASS
// ============================================

export class FurnitureProductFirestoreError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = 'FurnitureProductFirestoreError';
  }
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateMaterialInput {
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateMaterialInput {
  name?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateFeeInput {
  name: string;
  code: string;
  type: ServiceFeeType;
  value: number;
  applicability?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateFeeInput {
  name?: string;
  code?: string;
  type?: ServiceFeeType;
  value?: number;
  applicability?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface CreateVariantInput {
  materialId: string;
  pricePerUnit: number;
  pricingType: 'LINEAR' | 'M2';
  length: number;
  width?: number | null;
  imageUrl?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface UpdateVariantInput {
  materialId?: string;
  pricePerUnit?: number;
  pricingType?: 'LINEAR' | 'M2';
  length?: number;
  width?: number | null;
  imageUrl?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface ProductMappingInput {
  projectName: string;
  buildingCode: string;
  apartmentType: string;
}

export interface CreateProductBaseInput {
  name: string;
  categoryId: string;
  description?: string | null;
  imageUrl?: string | null;
  allowFitIn?: boolean;
  order?: number;
  isActive?: boolean;
  variants: CreateVariantInput[];
  mappings?: ProductMappingInput[];
}

export interface UpdateProductBaseInput {
  name?: string;
  categoryId?: string;
  description?: string | null;
  imageUrl?: string | null;
  allowFitIn?: boolean;
  order?: number;
  isActive?: boolean;
}

// ============================================
// EXTENDED TYPES
// ============================================

export interface CategoryWithCount extends FirestoreFurnitureCategory {
  productCount: number;
}

export interface VariantWithMaterial extends FirestoreFurnitureProductVariant {
  material?: FirestoreFurnitureMaterial;
}

export interface ProductBaseWithDetails extends FirestoreFurnitureProductBase {
  category?: FirestoreFurnitureCategory;
  variants: VariantWithMaterial[];
  mappings: ProductMapping[];
  variantCount: number;
  priceRange: { min: number; max: number } | null;
}

export interface ProductMapping {
  id: string;
  productBaseId: string;
  projectName: string;
  buildingCode: string;
  apartmentType: string;
  createdAt: Date;
}

export interface ProductBaseGroup {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string | null;
  imageUrl: string | null;
  allowFitIn: boolean;
  variants: ProductVariantForLanding[];
  priceRange: { min: number; max: number } | null;
  variantCount: number;
}

export interface ProductVariantForLanding {
  id: string;
  materialId: string;
  materialName: string;
  calculatedPrice: number;
  imageUrl: string | null;
}

export interface GetProductBasesAdminQuery {
  categoryId?: string;
  materialId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'order' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedProductBases {
  products: ProductBaseWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Calculate variant price based on pricing type
 */
export function calculateVariantPrice(
  pricePerUnit: number,
  pricingType: 'LINEAR' | 'M2',
  length: number,
  width?: number | null
): number {
  if (pricePerUnit < 0) {
    throw new FurnitureProductFirestoreError(
      'INVALID_DIMENSIONS',
      'pricePerUnit must be a non-negative number',
      400
    );
  }
  if (length < 0) {
    throw new FurnitureProductFirestoreError(
      'INVALID_DIMENSIONS',
      'length must be a non-negative number',
      400
    );
  }

  if (pricingType === 'M2') {
    if (width === undefined || width === null) {
      throw new FurnitureProductFirestoreError(
        'WIDTH_REQUIRED_FOR_M2',
        'Width is required when pricingType is M2',
        400
      );
    }
    if (width < 0) {
      throw new FurnitureProductFirestoreError(
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
export function calculatePriceRange(
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

// ============================================
// CATEGORY SERVICE
// ============================================

export class FurnitureCategoryFirestoreService extends BaseFirestoreService<FirestoreFurnitureCategory> {
  constructor() {
    super('furnitureCategories');
  }

  /**
   * Get all categories with product count
   */
  async getCategories(activeOnly = false): Promise<CategoryWithCount[]> {
    const options: QueryOptions<FirestoreFurnitureCategory> = {
      orderBy: [{ field: 'order', direction: 'asc' }],
    };

    if (activeOnly) {
      options.where = [{ field: 'isActive', operator: '==', value: true }];
    }

    const categories = await this.query(options);

    // Get product counts for each category
    const productService = getFurnitureProductBaseFirestoreService();
    const categoriesWithCount: CategoryWithCount[] = [];

    for (const category of categories) {
      const count = await productService.count({
        where: [{ field: 'categoryId', operator: '==', value: category.id }],
      });
      categoriesWithCount.push({ ...category, productCount: count });
    }

    return categoriesWithCount;
  }

  /**
   * Create a new category
   */
  async createCategory(input: CreateCategoryInput): Promise<FirestoreFurnitureCategory> {
    // Check for duplicate name
    const existing = await this.query({
      where: [{ field: 'name', operator: '==', value: input.name }],
      limit: 1,
    });

    if (existing.length > 0) {
      throw new FurnitureProductFirestoreError(
        'CONFLICT',
        'Category with this name already exists',
        409
      );
    }

    return this.create({
      name: input.name,
      description: input.description,
      icon: input.icon,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
    });
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, input: UpdateCategoryInput): Promise<FirestoreFurnitureCategory> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureProductFirestoreError('NOT_FOUND', 'Category not found', 404);
    }

    // Check for duplicate name if name is being changed
    if (input.name && input.name !== existing.name) {
      const duplicate = await this.query({
        where: [{ field: 'name', operator: '==', value: input.name }],
        limit: 1,
      });

      if (duplicate.length > 0) {
        throw new FurnitureProductFirestoreError(
          'CONFLICT',
          'Category with this name already exists',
          409
        );
      }
    }

    return this.update(id, input);
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureProductFirestoreError('NOT_FOUND', 'Category not found', 404);
    }

    // Check if category has products
    const productService = getFurnitureProductBaseFirestoreService();
    const count = await productService.count({
      where: [{ field: 'categoryId', operator: '==', value: id }],
    });

    if (count > 0) {
      throw new FurnitureProductFirestoreError(
        'CONFLICT',
        'Cannot delete category with existing products',
        409
      );
    }

    await this.delete(id);
  }
}

// ============================================
// MATERIAL SERVICE
// ============================================

export class FurnitureMaterialFirestoreService extends BaseFirestoreService<FirestoreFurnitureMaterial> {
  constructor() {
    super('furnitureMaterials');
  }

  /**
   * Get all materials
   */
  async getMaterials(activeOnly = false): Promise<FirestoreFurnitureMaterial[]> {
    const options: QueryOptions<FirestoreFurnitureMaterial> = {
      orderBy: [{ field: 'order', direction: 'asc' }],
    };

    if (activeOnly) {
      options.where = [{ field: 'isActive', operator: '==', value: true }];
    }

    return this.query(options);
  }

  /**
   * Create a new material
   */
  async createMaterial(input: CreateMaterialInput): Promise<FirestoreFurnitureMaterial> {
    // Check for duplicate name
    const existing = await this.query({
      where: [{ field: 'name', operator: '==', value: input.name }],
      limit: 1,
    });

    if (existing.length > 0) {
      throw new FurnitureProductFirestoreError(
        'CONFLICT',
        'Material with this name already exists',
        409
      );
    }

    return this.create({
      name: input.name,
      description: input.description,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
    });
  }

  /**
   * Update a material
   */
  async updateMaterial(id: string, input: UpdateMaterialInput): Promise<FirestoreFurnitureMaterial> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureProductFirestoreError('NOT_FOUND', 'Material not found', 404);
    }

    return this.update(id, input);
  }

  /**
   * Delete a material
   */
  async deleteMaterial(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureProductFirestoreError('NOT_FOUND', 'Material not found', 404);
    }

    await this.delete(id);
  }
}

// ============================================
// FEE SERVICE
// ============================================

export class FurnitureFeeFirestoreService extends BaseFirestoreService<FirestoreFurnitureFee> {
  constructor() {
    super('furnitureFees');
  }

  /**
   * Get all fees
   */
  async getFees(activeOnly = false): Promise<FirestoreFurnitureFee[]> {
    const options: QueryOptions<FirestoreFurnitureFee> = {
      orderBy: [{ field: 'order', direction: 'asc' }],
    };

    if (activeOnly) {
      options.where = [{ field: 'isActive', operator: '==', value: true }];
    }

    return this.query(options);
  }

  /**
   * Get fee by code
   */
  async getFeeByCode(code: string): Promise<FirestoreFurnitureFee | null> {
    const fees = await this.query({
      where: [{ field: 'code', operator: '==', value: code }],
      limit: 1,
    });
    return fees[0] || null;
  }

  /**
   * Get the FIT_IN fee
   */
  async getFitInFee(): Promise<FirestoreFurnitureFee | null> {
    return this.getFeeByCode('FIT_IN');
  }

  /**
   * Get the FIT_IN fee value
   */
  async getFitInFeeValue(): Promise<number> {
    const fitInFee = await this.getFitInFee();
    if (!fitInFee) {
      throw new FurnitureProductFirestoreError(
        'FIT_IN_FEE_NOT_CONFIGURED',
        'FIT_IN fee not found in system',
        500
      );
    }
    return fitInFee.value;
  }

  /**
   * Create a new fee
   */
  async createFee(input: CreateFeeInput): Promise<FirestoreFurnitureFee> {
    // Check for duplicate code
    const existing = await this.getFeeByCode(input.code);
    if (existing) {
      throw new FurnitureProductFirestoreError(
        'CONFLICT',
        'Fee with this code already exists',
        409
      );
    }

    return this.create({
      name: input.name,
      code: input.code,
      type: input.type,
      value: input.value,
      applicability: input.applicability ?? 'BOTH',
      description: input.description,
      isActive: input.isActive ?? true,
      order: input.order ?? 0,
    });
  }

  /**
   * Update a fee
   */
  async updateFee(id: string, input: UpdateFeeInput): Promise<FirestoreFurnitureFee> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureProductFirestoreError('NOT_FOUND', 'Fee not found', 404);
    }

    // Check for duplicate code if code is being changed
    if (input.code && input.code !== existing.code) {
      const duplicate = await this.getFeeByCode(input.code);
      if (duplicate) {
        throw new FurnitureProductFirestoreError(
          'CONFLICT',
          'Fee with this code already exists',
          409
        );
      }
    }

    return this.update(id, input);
  }

  /**
   * Delete a fee
   */
  async deleteFee(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureProductFirestoreError('NOT_FOUND', 'Fee not found', 404);
    }

    await this.delete(id);
  }
}


// ============================================
// PRODUCT VARIANT SUBCOLLECTION SERVICE
// ============================================

export class FurnitureProductVariantFirestoreService extends SubcollectionFirestoreService<FirestoreFurnitureProductVariant> {
  constructor() {
    super('furnitureProductBases', 'variants');
  }

  /**
   * Get all variants for a product base
   */
  async getVariants(productBaseId: string, activeOnly = false): Promise<VariantWithMaterial[]> {
    const options: QueryOptions<FirestoreFurnitureProductVariant> = {
      orderBy: [{ field: 'order', direction: 'asc' }],
    };

    if (activeOnly) {
      options.where = [{ field: 'isActive', operator: '==', value: true }];
    }

    const variants = await this.query(productBaseId, options);

    // Fetch material info for each variant
    const materialService = getFurnitureMaterialFirestoreService();
    const variantsWithMaterial: VariantWithMaterial[] = [];

    for (const variant of variants) {
      const material = await materialService.getById(variant.materialId);
      variantsWithMaterial.push({
        ...variant,
        material: material || undefined,
      });
    }

    return variantsWithMaterial;
  }

  /**
   * Create a new variant
   */
  async createVariant(productBaseId: string, input: CreateVariantInput): Promise<VariantWithMaterial> {
    // Verify product base exists
    const productService = getFurnitureProductBaseFirestoreService();
    const productBase = await productService.getById(productBaseId);
    if (!productBase) {
      throw new FurnitureProductFirestoreError('PRODUCT_BASE_NOT_FOUND', 'Product base not found', 404);
    }

    // Verify material exists
    const materialService = getFurnitureMaterialFirestoreService();
    const material = await materialService.getById(input.materialId);
    if (!material) {
      throw new FurnitureProductFirestoreError('MATERIAL_NOT_FOUND', 'Material not found', 404);
    }

    // Check for duplicate material in this product
    const existingVariants = await this.getVariants(productBaseId);
    const duplicate = existingVariants.find(v => v.materialId === input.materialId);
    if (duplicate) {
      throw new FurnitureProductFirestoreError(
        'DUPLICATE_VARIANT_MATERIAL',
        'A variant with this material already exists for this product',
        409
      );
    }

    // Calculate price
    const calculatedPrice = calculateVariantPrice(
      input.pricePerUnit,
      input.pricingType,
      input.length,
      input.width
    );

    const variant = await this.create(productBaseId, {
      productBaseId,
      materialId: input.materialId,
      pricePerUnit: input.pricePerUnit,
      pricingType: input.pricingType,
      length: input.length,
      width: input.width ?? undefined,
      calculatedPrice,
      imageUrl: input.imageUrl ?? undefined,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
    });

    return { ...variant, material };
  }

  /**
   * Update a variant
   */
  async updateVariant(productBaseId: string, variantId: string, input: UpdateVariantInput): Promise<VariantWithMaterial> {
    const existing = await this.getById(productBaseId, variantId);
    if (!existing) {
      throw new FurnitureProductFirestoreError('VARIANT_NOT_FOUND', 'Variant not found', 404);
    }

    // If material is being changed, verify it exists and check for duplicates
    let material: FirestoreFurnitureMaterial | null = null;
    if (input.materialId && input.materialId !== existing.materialId) {
      const materialService = getFurnitureMaterialFirestoreService();
      material = await materialService.getById(input.materialId);
      if (!material) {
        throw new FurnitureProductFirestoreError('MATERIAL_NOT_FOUND', 'Material not found', 404);
      }

      // Check for duplicate
      const existingVariants = await this.getVariants(productBaseId);
      const duplicate = existingVariants.find(v => v.materialId === input.materialId && v.id !== variantId);
      if (duplicate) {
        throw new FurnitureProductFirestoreError(
          'DUPLICATE_VARIANT_MATERIAL',
          'A variant with this material already exists for this product',
          409
        );
      }
    }

    // Calculate new price if dimensions changed
    const updateData: Partial<FirestoreFurnitureProductVariant> = { ...input };
    const pricePerUnit = input.pricePerUnit ?? existing.pricePerUnit;
    const pricingType = input.pricingType ?? existing.pricingType;
    const length = input.length ?? existing.length;
    const width = input.width !== undefined ? input.width : existing.width;

    if (input.pricePerUnit !== undefined || input.pricingType !== undefined || 
        input.length !== undefined || input.width !== undefined) {
      updateData.calculatedPrice = calculateVariantPrice(pricePerUnit, pricingType, length, width);
    }

    const variant = await this.update(productBaseId, variantId, updateData);

    // Fetch material
    const materialService = getFurnitureMaterialFirestoreService();
    const variantMaterial = material || await materialService.getById(variant.materialId);

    return { ...variant, material: variantMaterial || undefined };
  }

  /**
   * Delete a variant
   */
  async deleteVariant(productBaseId: string, variantId: string): Promise<void> {
    const existing = await this.getById(productBaseId, variantId);
    if (!existing) {
      throw new FurnitureProductFirestoreError('VARIANT_NOT_FOUND', 'Variant not found', 404);
    }

    // Check if this is the last variant
    const variants = await this.getVariants(productBaseId);
    if (variants.length <= 1) {
      throw new FurnitureProductFirestoreError(
        'LAST_VARIANT_DELETE',
        'Cannot delete the last variant of a product. Delete the product base instead.',
        400
      );
    }

    await this.delete(productBaseId, variantId);
  }
}

// ============================================
// PRODUCT MAPPING SERVICE
// ============================================

export class FurnitureProductMappingFirestoreService extends BaseFirestoreService<ProductMapping & { updatedAt: Date }> {
  constructor() {
    super('furnitureProductMappings');
  }

  /**
   * Get mappings for a product base
   */
  async getMappings(productBaseId: string): Promise<ProductMapping[]> {
    const mappings = await this.query({
      where: [{ field: 'productBaseId', operator: '==', value: productBaseId }],
      orderBy: [
        { field: 'projectName', direction: 'asc' },
        { field: 'buildingCode', direction: 'asc' },
        { field: 'apartmentType', direction: 'asc' },
      ],
    });

    return mappings.map(m => ({
      id: m.id,
      productBaseId: m.productBaseId,
      projectName: m.projectName,
      buildingCode: m.buildingCode,
      apartmentType: m.apartmentType,
      createdAt: m.createdAt,
    }));
  }

  /**
   * Add a mapping to a product base
   */
  async addMapping(productBaseId: string, input: ProductMappingInput): Promise<ProductMapping> {
    // Verify product base exists
    const productService = getFurnitureProductBaseFirestoreService();
    const productBase = await productService.getById(productBaseId);
    if (!productBase) {
      throw new FurnitureProductFirestoreError('NOT_FOUND', 'Product base not found', 404);
    }

    // Check for duplicate mapping
    const existing = await this.query({
      where: [
        { field: 'productBaseId', operator: '==', value: productBaseId },
        { field: 'projectName', operator: '==', value: input.projectName },
        { field: 'buildingCode', operator: '==', value: input.buildingCode },
        { field: 'apartmentType', operator: '==', value: input.apartmentType },
      ],
      limit: 1,
    });

    if (existing.length > 0) {
      throw new FurnitureProductFirestoreError(
        'DUPLICATE_MAPPING',
        'This mapping already exists for this product',
        409
      );
    }

    const mapping = await this.create({
      productBaseId,
      projectName: input.projectName,
      buildingCode: input.buildingCode,
      apartmentType: input.apartmentType,
    });

    return {
      id: mapping.id,
      productBaseId: mapping.productBaseId,
      projectName: mapping.projectName,
      buildingCode: mapping.buildingCode,
      apartmentType: mapping.apartmentType,
      createdAt: mapping.createdAt,
    };
  }

  /**
   * Remove a mapping
   */
  async removeMapping(mappingId: string): Promise<void> {
    const existing = await this.getById(mappingId);
    if (!existing) {
      throw new FurnitureProductFirestoreError('NOT_FOUND', 'Mapping not found', 404);
    }

    await this.delete(mappingId);
  }

  /**
   * Bulk create mappings for multiple products
   */
  async bulkCreateMappings(
    productBaseIds: string[],
    mapping: ProductMappingInput
  ): Promise<{
    success: boolean;
    created: number;
    skipped: number;
    errors: Array<{ productBaseId: string; error: string }>;
  }> {
    if (!productBaseIds || productBaseIds.length === 0) {
      throw new FurnitureProductFirestoreError(
        'INVALID_INPUT',
        'At least one product base ID is required',
        400
      );
    }

    let created = 0;
    let skipped = 0;
    const errors: Array<{ productBaseId: string; error: string }> = [];

    for (const productBaseId of productBaseIds) {
      try {
        await this.addMapping(productBaseId, mapping);
        created++;
      } catch (error) {
        if (error instanceof FurnitureProductFirestoreError && error.code === 'DUPLICATE_MAPPING') {
          skipped++;
        } else {
          errors.push({
            productBaseId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return {
      success: errors.length === 0,
      created,
      skipped,
      errors,
    };
  }
}

// ============================================
// PRODUCT BASE SERVICE
// ============================================

export class FurnitureProductBaseFirestoreService extends BaseFirestoreService<FirestoreFurnitureProductBase> {
  constructor() {
    super('furnitureProductBases');
  }

  /**
   * Get a product base with all details
   */
  async getProductBaseWithDetails(id: string): Promise<ProductBaseWithDetails | null> {
    const productBase = await this.getById(id);
    if (!productBase) {
      return null;
    }

    // Fetch category
    const categoryService = getFurnitureCategoryFirestoreService();
    const category = await categoryService.getById(productBase.categoryId);

    // Fetch variants
    const variantService = getFurnitureProductVariantFirestoreService();
    const variants = await variantService.getVariants(id);

    // Fetch mappings
    const mappingService = getFurnitureProductMappingFirestoreService();
    const mappings = await mappingService.getMappings(id);

    // Calculate price range
    const priceRange = calculatePriceRange(variants);

    return {
      ...productBase,
      category: category || undefined,
      variants,
      mappings,
      variantCount: variants.length,
      priceRange,
    };
  }

  /**
   * Create a product base with variants
   */
  async createProductBase(input: CreateProductBaseInput): Promise<ProductBaseWithDetails> {
    // Validate at least one variant
    if (!input.variants || input.variants.length === 0) {
      throw new FurnitureProductFirestoreError(
        'VARIANT_REQUIRED',
        'At least one variant is required when creating a product',
        400
      );
    }

    // Validate category exists
    const categoryService = getFurnitureCategoryFirestoreService();
    const category = await categoryService.getById(input.categoryId);
    if (!category) {
      throw new FurnitureProductFirestoreError('CATEGORY_NOT_FOUND', 'Category not found', 404);
    }

    // Validate all materials exist
    const materialService = getFurnitureMaterialFirestoreService();
    const materialIds = input.variants.map(v => v.materialId);
    for (const materialId of materialIds) {
      const material = await materialService.getById(materialId);
      if (!material) {
        throw new FurnitureProductFirestoreError('MATERIAL_NOT_FOUND', 'One or more materials not found', 404);
      }
    }

    // Check for duplicate materialIds in input
    const uniqueMaterialIds = new Set(materialIds);
    if (uniqueMaterialIds.size !== materialIds.length) {
      throw new FurnitureProductFirestoreError(
        'DUPLICATE_VARIANT_MATERIAL',
        'Duplicate material IDs in variants',
        400
      );
    }

    // Check for duplicate product name in category
    const existing = await this.query({
      where: [
        { field: 'name', operator: '==', value: input.name },
        { field: 'categoryId', operator: '==', value: input.categoryId },
      ],
      limit: 1,
    });

    if (existing.length > 0) {
      throw new FurnitureProductFirestoreError(
        'DUPLICATE_PRODUCT_NAME',
        'A product with this name already exists in this category',
        409
      );
    }

    // Create product base
    const productBase = await this.create({
      name: input.name,
      categoryId: input.categoryId,
      description: input.description ?? undefined,
      imageUrl: input.imageUrl ?? undefined,
      allowFitIn: input.allowFitIn ?? false,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
    });

    // Create variants
    const variantService = getFurnitureProductVariantFirestoreService();
    const variants: VariantWithMaterial[] = [];
    for (const variantInput of input.variants) {
      const variant = await variantService.createVariant(productBase.id, variantInput);
      variants.push(variant);
    }

    // Create mappings
    const mappingService = getFurnitureProductMappingFirestoreService();
    const mappings: ProductMapping[] = [];
    if (input.mappings) {
      for (const mappingInput of input.mappings) {
        const mapping = await mappingService.addMapping(productBase.id, mappingInput);
        mappings.push(mapping);
      }
    }

    // Calculate price range
    const priceRange = calculatePriceRange(variants);

    return {
      ...productBase,
      category,
      variants,
      mappings,
      variantCount: variants.length,
      priceRange,
    };
  }

  /**
   * Update a product base
   */
  async updateProductBase(id: string, input: UpdateProductBaseInput): Promise<ProductBaseWithDetails> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureProductFirestoreError('PRODUCT_BASE_NOT_FOUND', 'Product base not found', 404);
    }

    // If name or categoryId is changing, validate unique constraint
    if (input.name !== undefined || input.categoryId !== undefined) {
      const newName = input.name ?? existing.name;
      const newCategoryId = input.categoryId ?? existing.categoryId;

      const duplicate = await this.query({
        where: [
          { field: 'name', operator: '==', value: newName },
          { field: 'categoryId', operator: '==', value: newCategoryId },
        ],
        limit: 1,
      });

      if (duplicate.length > 0 && duplicate[0].id !== id) {
        throw new FurnitureProductFirestoreError(
          'DUPLICATE_PRODUCT_NAME',
          'A product with this name already exists in this category',
          409
        );
      }
    }

    // If categoryId is changing, validate it exists
    if (input.categoryId !== undefined) {
      const categoryService = getFurnitureCategoryFirestoreService();
      const category = await categoryService.getById(input.categoryId);
      if (!category) {
        throw new FurnitureProductFirestoreError('CATEGORY_NOT_FOUND', 'Category not found', 404);
      }
    }

    await this.update(id, input);

    // Return full details
    const result = await this.getProductBaseWithDetails(id);
    if (!result) {
      throw new FurnitureProductFirestoreError('PRODUCT_BASE_NOT_FOUND', 'Product base not found', 404);
    }

    return result;
  }

  /**
   * Delete a product base
   */
  async deleteProductBase(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureProductFirestoreError('PRODUCT_BASE_NOT_FOUND', 'Product base not found', 404);
    }

    // Delete all variants
    const variantService = getFurnitureProductVariantFirestoreService();
    await variantService.deleteAll(id);

    // Delete all mappings
    const mappingService = getFurnitureProductMappingFirestoreService();
    const mappings = await mappingService.getMappings(id);
    for (const mapping of mappings) {
      await mappingService.delete(mapping.id);
    }

    // Delete product base
    await this.delete(id);
  }

  /**
   * Get products grouped for landing page
   */
  async getProductBasesGrouped(query?: {
    categoryId?: string;
    projectName?: string;
    buildingCode?: string;
    apartmentType?: string;
  }): Promise<ProductBaseGroup[]> {
    const { categoryId, projectName, buildingCode, apartmentType } = query || {};

    // Build where clause
    const whereClause: Array<{ field: keyof FirestoreFurnitureProductBase | string; operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains' | 'array-contains-any'; value: unknown }> = [
      { field: 'isActive', operator: '==', value: true },
    ];

    if (categoryId) {
      whereClause.push({ field: 'categoryId', operator: '==', value: categoryId });
    }

    const options: QueryOptions<FirestoreFurnitureProductBase> = {
      where: whereClause,
      orderBy: [{ field: 'order', direction: 'asc' }, { field: 'name', direction: 'asc' }],
    };

    const productBases = await this.query(options);

    // Filter by mappings if apartment filters provided
    let filteredBases = productBases;
    if (projectName || buildingCode || apartmentType) {
      const mappingService = getFurnitureProductMappingFirestoreService();
      filteredBases = [];

      for (const base of productBases) {
        const mappings = await mappingService.getMappings(base.id);
        const hasMatch = mappings.some(m => {
          if (projectName && m.projectName !== projectName) return false;
          if (buildingCode && m.buildingCode !== buildingCode) return false;
          if (apartmentType && m.apartmentType !== apartmentType) return false;
          return true;
        });

        if (hasMatch) {
          filteredBases.push(base);
        }
      }
    }

    // Build result
    const categoryService = getFurnitureCategoryFirestoreService();
    const variantService = getFurnitureProductVariantFirestoreService();
    const materialService = getFurnitureMaterialFirestoreService();

    const result: ProductBaseGroup[] = [];

    for (const base of filteredBases) {
      const category = await categoryService.getById(base.categoryId);
      const variants = await variantService.getVariants(base.id, true);

      if (variants.length === 0) continue;

      const variantsForLanding: ProductVariantForLanding[] = [];
      for (const variant of variants) {
        const material = variant.material || await materialService.getById(variant.materialId);
        variantsForLanding.push({
          id: variant.id,
          materialId: variant.materialId,
          materialName: material?.name || 'Unknown',
          calculatedPrice: variant.calculatedPrice,
          imageUrl: variant.imageUrl ?? null,
        });
      }

      const priceRange = calculatePriceRange(variants);

      result.push({
        id: base.id,
        name: base.name,
        categoryId: base.categoryId,
        categoryName: category?.name || 'Unknown',
        description: base.description ?? null,
        imageUrl: base.imageUrl ?? null,
        allowFitIn: base.allowFitIn,
        variants: variantsForLanding,
        priceRange,
        variantCount: variants.length,
      });
    }

    return result;
  }

  /**
   * Get products for admin with pagination
   */
  async getProductBasesForAdmin(query?: GetProductBasesAdminQuery): Promise<PaginatedProductBases> {
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
    const adminWhereClause: Array<{ field: keyof FirestoreFurnitureProductBase | string; operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains' | 'array-contains-any'; value: unknown }> = [];

    if (categoryId) {
      adminWhereClause.push({ field: 'categoryId', operator: '==', value: categoryId });
    }
    if (isActive !== undefined) {
      adminWhereClause.push({ field: 'isActive', operator: '==', value: isActive });
    }

    const options: QueryOptions<FirestoreFurnitureProductBase> = {
      where: adminWhereClause.length > 0 ? adminWhereClause : undefined,
    };

    // Build orderBy
    if (sortBy === 'name') {
      options.orderBy = [{ field: 'name', direction: sortOrder }];
    } else if (sortBy === 'createdAt') {
      options.orderBy = [{ field: 'createdAt', direction: sortOrder }];
    } else if (sortBy === 'updatedAt') {
      options.orderBy = [{ field: 'updatedAt', direction: sortOrder }];
    } else {
      options.orderBy = [{ field: 'order', direction: sortOrder }, { field: 'name', direction: 'asc' }];
    }

    // Get all products (we'll filter and paginate manually for materialId filter)
    let productBases = await this.query(options);

    // Filter by material if provided
    if (materialId) {
      const variantService = getFurnitureProductVariantFirestoreService();
      const filtered: FirestoreFurnitureProductBase[] = [];

      for (const base of productBases) {
        const variants = await variantService.getVariants(base.id);
        if (variants.some(v => v.materialId === materialId)) {
          filtered.push(base);
        }
      }

      productBases = filtered;
    }

    const total = productBases.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedBases = productBases.slice(startIndex, startIndex + limit);

    // Get full details for each product
    const products: ProductBaseWithDetails[] = [];
    for (const base of paginatedBases) {
      const details = await this.getProductBaseWithDetails(base.id);
      if (details) {
        products.push(details);
      }
    }

    return {
      products,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

// ============================================
// SINGLETON INSTANCES
// ============================================

let categoryServiceInstance: FurnitureCategoryFirestoreService | null = null;
let materialServiceInstance: FurnitureMaterialFirestoreService | null = null;
let feeServiceInstance: FurnitureFeeFirestoreService | null = null;
let variantServiceInstance: FurnitureProductVariantFirestoreService | null = null;
let mappingServiceInstance: FurnitureProductMappingFirestoreService | null = null;
let productBaseServiceInstance: FurnitureProductBaseFirestoreService | null = null;

export function getFurnitureCategoryFirestoreService(): FurnitureCategoryFirestoreService {
  if (!categoryServiceInstance) {
    categoryServiceInstance = new FurnitureCategoryFirestoreService();
  }
  return categoryServiceInstance;
}

export function getFurnitureMaterialFirestoreService(): FurnitureMaterialFirestoreService {
  if (!materialServiceInstance) {
    materialServiceInstance = new FurnitureMaterialFirestoreService();
  }
  return materialServiceInstance;
}

export function getFurnitureFeeFirestoreService(): FurnitureFeeFirestoreService {
  if (!feeServiceInstance) {
    feeServiceInstance = new FurnitureFeeFirestoreService();
  }
  return feeServiceInstance;
}

export function getFurnitureProductVariantFirestoreService(): FurnitureProductVariantFirestoreService {
  if (!variantServiceInstance) {
    variantServiceInstance = new FurnitureProductVariantFirestoreService();
  }
  return variantServiceInstance;
}

export function getFurnitureProductMappingFirestoreService(): FurnitureProductMappingFirestoreService {
  if (!mappingServiceInstance) {
    mappingServiceInstance = new FurnitureProductMappingFirestoreService();
  }
  return mappingServiceInstance;
}

export function getFurnitureProductBaseFirestoreService(): FurnitureProductBaseFirestoreService {
  if (!productBaseServiceInstance) {
    productBaseServiceInstance = new FurnitureProductBaseFirestoreService();
  }
  return productBaseServiceInstance;
}
