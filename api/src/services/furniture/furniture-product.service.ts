/**
 * Furniture Product Service (Facade)
 *
 * This is a facade that delegates to specialized sub-services.
 * Maintains backward compatibility with existing code.
 *
 * **Feature: furniture-quotation, furniture-product-restructure**
 * **Requirements: 2.1-2.5, 3.1-3.6, 4.1-4.7, 9.1-9.7**
 */

import {
  PrismaClient,
  FurnitureProduct,
  FurnitureProductMapping,
  FurnitureProductVariant,
} from '@prisma/client';
import {
  GetProductsQuery,
  FurnitureProductWithCategory,
  ProductGroup,
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

// Import from sub-services
import * as calculationService from './product/calculation.service';
import * as crudService from './product/crud.service';
import * as mappingService from './product/mapping.service';
import * as variantService from './product/variant.service';
import * as legacyService from './product/legacy.service';

export class FurnitureProductService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // PRICE CALCULATION
  // ============================================

  calculateProductPrice(
    pricePerUnit: number,
    pricingType: 'M2' | 'LINEAR',
    length: number,
    width?: number
  ): number {
    return calculationService.calculateProductPrice(pricePerUnit, pricingType, length, width);
  }

  // ============================================
  // PRODUCTS (LEGACY - Read-only)
  // ============================================

  async getProducts(query?: GetProductsQuery | string): Promise<FurnitureProductWithCategory[]> {
    return legacyService.getProducts(this.prisma, query);
  }

  async getProductsGrouped(query?: GetProductsQuery | string): Promise<ProductGroup[]> {
    return legacyService.getProductsGrouped(this.prisma, query);
  }

  async getProductById(id: string): Promise<FurnitureProductWithCategory | null> {
    return legacyService.getProductById(this.prisma, id);
  }

  /** @deprecated Use createProductBase instead */
  async createProduct(input: CreateProductInput): Promise<FurnitureProduct> {
    return legacyService.createProduct(input);
  }

  /** @deprecated Use updateProductBase instead */
  async updateProduct(id: string, input: UpdateProductInput): Promise<FurnitureProduct> {
    return legacyService.updateProduct(id, input);
  }

  /** @deprecated Use deleteProductBase instead */
  async deleteProduct(id: string): Promise<void> {
    return legacyService.deleteProduct(id);
  }

  // ============================================
  // PRODUCT MAPPINGS
  // ============================================

  async addProductMapping(
    productBaseId: string,
    input: ProductMappingInput
  ): Promise<FurnitureProductMapping> {
    return mappingService.addProductMapping(this.prisma, productBaseId, input);
  }

  async removeProductMapping(mappingId: string): Promise<void> {
    return mappingService.removeProductMapping(this.prisma, mappingId);
  }

  async getProductMappings(productBaseId: string): Promise<FurnitureProductMapping[]> {
    return mappingService.getProductMappings(this.prisma, productBaseId);
  }

  async bulkCreateMappings(
    productBaseIds: string[],
    mapping: ProductMappingInput
  ): Promise<{
    success: boolean;
    created: number;
    skipped: number;
    errors: Array<{ productBaseId: string; error: string }>;
  }> {
    return mappingService.bulkCreateMappings(this.prisma, productBaseIds, mapping);
  }

  // ============================================
  // PRODUCT BASE CRUD
  // ============================================

  async createProductBase(input: CreateProductBaseInput): Promise<ProductBaseWithDetails> {
    return crudService.createProductBase(this.prisma, input);
  }

  async getProductBasesGrouped(query?: {
    categoryId?: string;
    projectName?: string;
    buildingCode?: string;
    apartmentType?: string;
  }): Promise<ProductBaseGroup[]> {
    return crudService.getProductBasesGrouped(this.prisma, query);
  }

  async getProductBasesForAdmin(query?: GetProductBasesAdminQuery): Promise<PaginatedProductBases> {
    return crudService.getProductBasesForAdmin(this.prisma, query);
  }

  async getProductBaseById(id: string): Promise<ProductBaseWithDetails | null> {
    return crudService.getProductBaseById(this.prisma, id);
  }

  async updateProductBase(
    id: string,
    input: UpdateProductBaseInput
  ): Promise<ProductBaseWithDetails> {
    return crudService.updateProductBase(this.prisma, id, input);
  }

  async deleteProductBase(id: string): Promise<void> {
    return crudService.deleteProductBase(this.prisma, id);
  }

  // ============================================
  // VARIANT CRUD
  // ============================================

  async createVariant(
    productBaseId: string,
    input: CreateVariantInput
  ): Promise<FurnitureProductVariant & { material: { id: string; name: string } }> {
    return variantService.createVariant(this.prisma, productBaseId, input);
  }

  async updateVariant(
    variantId: string,
    input: UpdateVariantInput
  ): Promise<FurnitureProductVariant & { material: { id: string; name: string } }> {
    return variantService.updateVariant(this.prisma, variantId, input);
  }

  async deleteVariant(variantId: string): Promise<void> {
    return variantService.deleteVariant(this.prisma, variantId);
  }

  async getVariantById(
    variantId: string
  ): Promise<(FurnitureProductVariant & { material: { id: string; name: string } }) | null> {
    return variantService.getVariantById(this.prisma, variantId);
  }
}
