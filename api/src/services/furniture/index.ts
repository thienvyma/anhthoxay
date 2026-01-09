/**
 * Furniture Service Module
 *
 * Re-exports all furniture services and types for easy importing.
 * Also provides a facade class for backward compatibility.
 *
 * **Feature: furniture-quotation**
 */

import { PrismaClient, FurnitureFee } from '@prisma/client';

// Export error class
export { FurnitureServiceError } from './furniture.error';

// Export all types
export * from './furniture.types';

// Export individual services
export { FurnitureDeveloperService } from './furniture-developer.service';
export { FurnitureLayoutService } from './furniture-layout.service';
export { FurnitureCategoryService } from './furniture-category.service';
export { FurnitureProductService } from './furniture-product.service';
export { FurnitureFeeService } from './furniture-fee.service';
export { FurnitureQuotationService } from './furniture-quotation.service';
export { FurnitureImportExportService } from './furniture-import-export.service';

// Import services for facade
import { FurnitureDeveloperService } from './furniture-developer.service';
import { FurnitureLayoutService } from './furniture-layout.service';
import { FurnitureCategoryService } from './furniture-category.service';
import { FurnitureProductService } from './furniture-product.service';
import { FurnitureFeeService } from './furniture-fee.service';
import { FurnitureQuotationService } from './furniture-quotation.service';
import { FurnitureImportExportService } from './furniture-import-export.service';

// Import types for facade
import {
  CreateDeveloperInput,
  UpdateDeveloperInput,
  CreateProjectInput,
  UpdateProjectInput,
  CreateBuildingInput,
  UpdateBuildingInput,
  CreateLayoutInput,
  UpdateLayoutInput,
  CreateApartmentTypeInput,
  UpdateApartmentTypeInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  GetProductsQuery,
  CreateProductInput,
  UpdateProductInput,
  ProductMappingInput,
  CreateFeeInput,
  UpdateFeeInput,
  CreateQuotationInput,
  QuotationItem,
  CreateProductBaseInput,
  UpdateProductBaseInput,
  GetProductBasesAdminQuery,
  CreateVariantInput,
  UpdateVariantInput,
} from './furniture.types';

/**
 * FurnitureService Facade
 *
 * Provides backward compatibility by delegating to individual services.
 * New code should import individual services directly.
 */
export class FurnitureService {
  private developerService: FurnitureDeveloperService;
  private layoutService: FurnitureLayoutService;
  private categoryService: FurnitureCategoryService;
  private productService: FurnitureProductService;
  private feeService: FurnitureFeeService;
  private quotationService: FurnitureQuotationService;
  private importExportService: FurnitureImportExportService;

  constructor(private prisma: PrismaClient) {
    this.developerService = new FurnitureDeveloperService(prisma);
    this.layoutService = new FurnitureLayoutService(prisma);
    this.categoryService = new FurnitureCategoryService(prisma);
    this.productService = new FurnitureProductService(prisma);
    this.feeService = new FurnitureFeeService(prisma);
    this.quotationService = new FurnitureQuotationService(prisma);
    this.importExportService = new FurnitureImportExportService(prisma);
  }

  // ============================================
  // DEVELOPERS
  // ============================================
  getDevelopers() {
    return this.developerService.getDevelopers();
  }
  createDeveloper(input: CreateDeveloperInput) {
    return this.developerService.createDeveloper(input);
  }
  updateDeveloper(id: string, input: UpdateDeveloperInput) {
    return this.developerService.updateDeveloper(id, input);
  }
  deleteDeveloper(id: string) {
    return this.developerService.deleteDeveloper(id);
  }

  // ============================================
  // PROJECTS
  // ============================================
  getProjects(developerId?: string) {
    return this.developerService.getProjects(developerId);
  }
  createProject(input: CreateProjectInput) {
    return this.developerService.createProject(input);
  }
  updateProject(id: string, input: UpdateProjectInput) {
    return this.developerService.updateProject(id, input);
  }
  deleteProject(id: string) {
    return this.developerService.deleteProject(id);
  }

  // ============================================
  // BUILDINGS
  // ============================================
  getBuildings(projectId?: string) {
    return this.developerService.getBuildings(projectId);
  }
  createBuilding(input: CreateBuildingInput) {
    return this.developerService.createBuilding(input);
  }
  updateBuilding(id: string, input: UpdateBuildingInput) {
    return this.developerService.updateBuilding(id, input);
  }
  deleteBuilding(id: string) {
    return this.developerService.deleteBuilding(id);
  }

  // ============================================
  // LAYOUTS
  // ============================================
  getLayouts(buildingCode: string) {
    return this.layoutService.getLayouts(buildingCode);
  }
  getLayoutByAxis(buildingCode: string, axis: number) {
    return this.layoutService.getLayoutByAxis(buildingCode, axis);
  }
  createLayout(input: CreateLayoutInput) {
    return this.layoutService.createLayout(input);
  }
  updateLayout(id: string, input: UpdateLayoutInput) {
    return this.layoutService.updateLayout(id, input);
  }
  deleteLayout(id: string) {
    return this.layoutService.deleteLayout(id);
  }

  // ============================================
  // APARTMENT TYPES
  // ============================================
  getApartmentTypes(buildingCode: string, type?: string) {
    return this.layoutService.getApartmentTypes(buildingCode, type);
  }
  createApartmentType(input: CreateApartmentTypeInput) {
    return this.layoutService.createApartmentType(input);
  }
  updateApartmentType(id: string, input: UpdateApartmentTypeInput) {
    return this.layoutService.updateApartmentType(id, input);
  }
  deleteApartmentType(id: string) {
    return this.layoutService.deleteApartmentType(id);
  }

  // ============================================
  // CATEGORIES
  // ============================================
  getCategories() {
    return this.categoryService.getCategories();
  }
  createCategory(input: CreateCategoryInput) {
    return this.categoryService.createCategory(input);
  }
  updateCategory(id: string, input: UpdateCategoryInput) {
    return this.categoryService.updateCategory(id, input);
  }
  deleteCategory(id: string) {
    return this.categoryService.deleteCategory(id);
  }

  // ============================================
  // PRODUCTS (LEGACY)
  // ============================================
  getProducts(query?: GetProductsQuery | string) {
    return this.productService.getProducts(query);
  }
  getProductsGrouped(query?: GetProductsQuery | string) {
    return this.productService.getProductsGrouped(query);
  }
  getProductById(id: string) {
    return this.productService.getProductById(id);
  }
  createProduct(input: CreateProductInput) {
    return this.productService.createProduct(input);
  }
  updateProduct(id: string, input: UpdateProductInput) {
    return this.productService.updateProduct(id, input);
  }
  deleteProduct(id: string) {
    return this.productService.deleteProduct(id);
  }

  // ============================================
  // PRODUCT MAPPINGS (for FurnitureProductBase)
  // ============================================
  addProductMapping(productBaseId: string, input: ProductMappingInput) {
    return this.productService.addProductMapping(productBaseId, input);
  }
  removeProductMapping(mappingId: string) {
    return this.productService.removeProductMapping(mappingId);
  }
  getProductMappings(productBaseId: string) {
    return this.productService.getProductMappings(productBaseId);
  }
  bulkCreateMappings(productBaseIds: string[], mapping: ProductMappingInput) {
    return this.productService.bulkCreateMappings(productBaseIds, mapping);
  }

  // ============================================
  // PRODUCT BASE CRUD (NEW - furniture-product-restructure)
  // ============================================
  createProductBase(input: CreateProductBaseInput) {
    return this.productService.createProductBase(input);
  }
  getProductBasesGrouped(query?: {
    categoryId?: string;
    projectName?: string;
    buildingCode?: string;
    apartmentType?: string;
  }) {
    return this.productService.getProductBasesGrouped(query);
  }
  getProductBasesForAdmin(query?: GetProductBasesAdminQuery) {
    return this.productService.getProductBasesForAdmin(query);
  }
  getProductBaseById(id: string) {
    return this.productService.getProductBaseById(id);
  }
  updateProductBase(id: string, input: UpdateProductBaseInput) {
    return this.productService.updateProductBase(id, input);
  }
  deleteProductBase(id: string) {
    return this.productService.deleteProductBase(id);
  }

  // ============================================
  // VARIANT CRUD (NEW - furniture-product-restructure)
  // ============================================
  createVariant(productBaseId: string, input: CreateVariantInput) {
    return this.productService.createVariant(productBaseId, input);
  }
  updateVariant(variantId: string, input: UpdateVariantInput) {
    return this.productService.updateVariant(variantId, input);
  }
  deleteVariant(variantId: string) {
    return this.productService.deleteVariant(variantId);
  }
  getVariantById(variantId: string) {
    return this.productService.getVariantById(variantId);
  }

  // ============================================
  // FEES
  // ============================================
  getFees(activeOnly = false) {
    return this.feeService.getFees(activeOnly);
  }
  getActiveFees() {
    return this.feeService.getActiveFees();
  }
  getFitInFee() {
    return this.feeService.getFitInFee();
  }
  getFitInFeeValue() {
    return this.feeService.getFitInFeeValue();
  }
  createFee(input: CreateFeeInput) {
    return this.feeService.createFee(input);
  }
  updateFee(id: string, input: UpdateFeeInput) {
    return this.feeService.updateFee(id, input);
  }
  deleteFee(id: string) {
    return this.feeService.deleteFee(id);
  }

  // ============================================
  // QUOTATIONS
  // ============================================
  createQuotation(input: CreateQuotationInput) {
    return this.quotationService.createQuotation(input);
  }
  getQuotationsByLead(leadId: string) {
    return this.quotationService.getQuotationsByLead(leadId);
  }
  getQuotationById(id: string) {
    return this.quotationService.getQuotationById(id);
  }

  // ============================================
  // CALCULATION UTILITIES
  // ============================================
  calculateProductPrice(
    pricePerUnit: number,
    pricingType: 'M2' | 'LINEAR',
    length: number,
    width?: number
  ) {
    return this.productService.calculateProductPrice(
      pricePerUnit,
      pricingType,
      length,
      width
    );
  }

  calculateVariantPrice(
    pricePerUnit: number,
    pricingType: 'LINEAR' | 'M2',
    length: number,
    width?: number | null
  ) {
    return this.quotationService.calculateVariantPrice(
      pricePerUnit,
      pricingType,
      length,
      width
    );
  }

  calculatePriceRange(
    variants: Array<{ calculatedPrice: number; isActive: boolean }>
  ) {
    return this.quotationService.calculatePriceRange(variants);
  }

  calculateFitInFee(
    calculatedPrice: number,
    feeType: 'FIXED' | 'PERCENTAGE',
    feeValue: number
  ) {
    return this.quotationService.calculateFitInFee(
      calculatedPrice,
      feeType,
      feeValue
    );
  }

  calculateLineTotal(
    calculatedPrice: number,
    fitInFee: number,
    quantity: number
  ) {
    return this.quotationService.calculateLineTotal(
      calculatedPrice,
      fitInFee,
      quantity
    );
  }

  calculateGrandTotal(
    subtotal: number,
    fitInFeesTotal: number,
    otherFees: number[]
  ) {
    return this.quotationService.calculateGrandTotal(
      subtotal,
      fitInFeesTotal,
      otherFees
    );
  }

  calculateUnitNumber(buildingCode: string, floor: number, axis: number) {
    return this.quotationService.calculateUnitNumber(buildingCode, floor, axis);
  }

  calculateQuotation(items: QuotationItem[], fees: FurnitureFee[]) {
    return this.quotationService.calculateQuotation(items, fees);
  }

  // ============================================
  // METRICS GRID
  // ============================================
  generateMetricsGrid(buildingCode: string, maxFloor: number, maxAxis: number) {
    return this.layoutService.generateMetricsGrid(buildingCode, maxFloor, maxAxis);
  }

  // ============================================
  // CSV IMPORT/EXPORT
  // ============================================
  parseCSV<T extends object>(content: string) {
    return this.importExportService.parseCSV<T>(content);
  }

  generateCSV<T extends Record<string, unknown>>(data: T[], headers: string[]) {
    return this.importExportService.generateCSV(data, headers);
  }

  importFromCSV(files: { duAn: string; layouts: string; apartmentTypes: string }) {
    return this.importExportService.importFromCSV(files);
  }

  exportToCSV() {
    return this.importExportService.exportToCSV();
  }

  // ============================================
  // CATALOG CSV IMPORT/EXPORT
  // ============================================
  exportCatalogToCSV() {
    return this.importExportService.exportCatalogToCSV();
  }

  importCatalogFromCSV(files: {
    categories?: string;
    materials?: string;
    productBases?: string;
    variants?: string;
    fees?: string;
  }) {
    return this.importExportService.importCatalogFromCSV(files);
  }
}
