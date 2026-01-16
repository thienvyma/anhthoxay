/**
 * Pricing Firestore Service
 * 
 * Handles pricing-related entities in Firestore:
 * - Service Categories (hạng mục thi công) in `serviceCategories/{categoryId}`
 * - Unit Prices (đơn giá thi công) in `unitPrices/{priceId}`
 * - Material Categories (danh mục vật dụng) in `materialCategories/{categoryId}`
 * - Materials (vật dụng cơ bản) in `materials/{materialId}`
 * - Formulas (công thức tính giá) in `formulas/{formulaId}`
 * 
 * @module services/firestore/pricing.firestore
 * @requirements 3.4
 */

import { BaseFirestoreService, FirestoreDocument, QueryOptions } from './base.firestore';
import { logger } from '../../utils/logger';

// ============================================
// ERROR CLASS
// ============================================

export class PricingFirestoreError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.name = 'PricingFirestoreError';
    this.statusCode = statusCode;
  }
}

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Formula document
 */
export interface FormulaDoc extends FirestoreDocument {
  name: string;
  expression: string;
  description?: string;
  isActive: boolean;
}

/**
 * Service Category document
 */
export interface ServiceCategoryDoc extends FirestoreDocument {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  coefficient: number;
  formulaId?: string | null;
  order: number;
  isActive: boolean;
  /** Array of material category IDs that can be used with this service category */
  materialCategoryIds: string[];
}

/**
 * Service Category with formula relation
 */
export interface ServiceCategoryWithFormula extends ServiceCategoryDoc {
  formula: FormulaDoc | null;
  allowMaterials: boolean;
}

/**
 * Unit Price document
 */
export interface UnitPriceDoc extends FirestoreDocument {
  category: string;
  name: string;
  price: number;
  tag: string;
  unit: string;
  description?: string;
  isActive: boolean;
}

/**
 * Material Category document
 */
export interface MaterialCategoryDoc extends FirestoreDocument {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

/**
 * Material Category with count
 */
export interface MaterialCategoryWithCount extends MaterialCategoryDoc {
  materialsCount: number;
}

/**
 * Material document
 */
export interface MaterialDoc extends FirestoreDocument {
  name: string;
  categoryId: string;
  imageUrl?: string | null;
  price: number;
  description?: string;
  order: number;
  isActive: boolean;
}

/**
 * Material with category
 */
export interface MaterialWithCategory extends MaterialDoc {
  category: MaterialCategoryDoc;
}

// ============================================
// INPUT TYPES
// ============================================

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

// ============================================
// FORMULA FIRESTORE SERVICE
// ============================================

export class FormulaFirestoreService extends BaseFirestoreService<FormulaDoc> {
  constructor() {
    super('formulas');
  }

  /**
   * Get all active formulas
   */
  async getAllActive(): Promise<FormulaDoc[]> {
    return this.query({
      where: [{ field: 'isActive', operator: '==', value: true }],
    });
  }

  /**
   * Create a new formula
   */
  async createFormula(input: CreateFormulaInput): Promise<FormulaDoc> {
    const data = {
      name: input.name,
      expression: input.expression,
      description: input.description,
      isActive: input.isActive ?? true,
    };

    return this.create(data);
  }

  /**
   * Update a formula
   */
  async updateFormula(id: string, input: UpdateFormulaInput): Promise<FormulaDoc> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new PricingFirestoreError('NOT_FOUND', 'Formula not found', 404);
    }

    return this.update(id, input);
  }

  /**
   * Delete a formula
   */
  async deleteFormula(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new PricingFirestoreError('NOT_FOUND', 'Formula not found', 404);
    }

    await this.delete(id);
    logger.info('Deleted formula', { id });
  }
}

// ============================================
// SERVICE CATEGORY FIRESTORE SERVICE
// ============================================

export class ServiceCategoryFirestoreService extends BaseFirestoreService<ServiceCategoryDoc> {
  private formulaService: FormulaFirestoreService;

  constructor() {
    super('serviceCategories');
    this.formulaService = new FormulaFirestoreService();
  }

  /**
   * Get all active service categories with formulas
   */
  async getAllActive(): Promise<ServiceCategoryWithFormula[]> {
    const categories = await this.query({
      where: [{ field: 'isActive', operator: '==', value: true }],
      orderBy: [{ field: 'order', direction: 'asc' }],
    });

    // Fetch formulas for categories that have formulaId
    const formulaIds = categories
      .map(c => c.formulaId)
      .filter((id): id is string => !!id);
    
    const uniqueFormulaIds = [...new Set(formulaIds)];
    const formulas: Map<string, FormulaDoc> = new Map();

    for (const formulaId of uniqueFormulaIds) {
      const formula = await this.formulaService.getById(formulaId);
      if (formula) {
        formulas.set(formulaId, formula);
      }
    }

    return categories.map(category => ({
      ...category,
      formula: category.formulaId ? formulas.get(category.formulaId) || null : null,
      allowMaterials: (category.materialCategoryIds?.length || 0) > 0,
    }));
  }

  /**
   * Get a service category by ID with formula
   */
  async getByIdWithFormula(id: string): Promise<ServiceCategoryWithFormula | null> {
    const category = await this.getById(id);
    if (!category) return null;

    let formula: FormulaDoc | null = null;
    if (category.formulaId) {
      formula = await this.formulaService.getById(category.formulaId);
    }

    return {
      ...category,
      formula,
      allowMaterials: (category.materialCategoryIds?.length || 0) > 0,
    };
  }

  /**
   * Create a new service category
   */
  async createCategory(input: CreateServiceCategoryInput): Promise<ServiceCategoryWithFormula> {
    const slug = generateSlug(input.name);

    // Check for duplicate slug
    const existing = await this.query({
      where: [{ field: 'slug', operator: '==', value: slug }],
      limit: 1,
    });

    if (existing.length > 0) {
      throw new PricingFirestoreError(
        'CONFLICT',
        'Service category with this name already exists',
        409
      );
    }

    const data = {
      name: input.name,
      slug,
      description: input.description,
      icon: input.icon,
      coefficient: input.coefficient ?? 1.0,
      formulaId: input.formulaId ?? null,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
      materialCategoryIds: input.materialCategoryIds ?? [],
    };

    const category = await this.create(data);

    let formula: FormulaDoc | null = null;
    if (category.formulaId) {
      formula = await this.formulaService.getById(category.formulaId);
    }

    logger.info('Created service category', { id: category.id, name: category.name });

    return {
      ...category,
      formula,
      allowMaterials: (category.materialCategoryIds?.length || 0) > 0,
    };
  }

  /**
   * Update a service category
   */
  async updateCategory(id: string, input: UpdateServiceCategoryInput): Promise<ServiceCategoryWithFormula> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new PricingFirestoreError('NOT_FOUND', 'Service category not found', 404);
    }

    const updateData: Partial<ServiceCategoryDoc> = { ...input };

    // Update slug if name changed
    if (input.name) {
      updateData.slug = generateSlug(input.name);
    }

    const category = await this.update(id, updateData);

    let formula: FormulaDoc | null = null;
    if (category.formulaId) {
      formula = await this.formulaService.getById(category.formulaId);
    }

    logger.info('Updated service category', { id: category.id });

    return {
      ...category,
      formula,
      allowMaterials: (category.materialCategoryIds?.length || 0) > 0,
    };
  }

  /**
   * Delete a service category
   */
  async deleteCategory(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new PricingFirestoreError('NOT_FOUND', 'Service category not found', 404);
    }

    await this.delete(id);
    logger.info('Deleted service category', { id });
  }
}

// ============================================
// UNIT PRICE FIRESTORE SERVICE
// ============================================

export class UnitPriceFirestoreService extends BaseFirestoreService<UnitPriceDoc> {
  constructor() {
    super('unitPrices');
  }

  /**
   * Get all active unit prices
   */
  async getAllActive(): Promise<UnitPriceDoc[]> {
    return this.query({
      where: [{ field: 'isActive', operator: '==', value: true }],
      orderBy: [{ field: 'category', direction: 'asc' }],
    });
  }

  /**
   * Get unit price by tag
   */
  async getByTag(tag: string): Promise<UnitPriceDoc | null> {
    const results = await this.query({
      where: [{ field: 'tag', operator: '==', value: tag }],
      limit: 1,
    });
    return results[0] || null;
  }

  /**
   * Create a new unit price
   */
  async createUnitPrice(input: CreateUnitPriceInput): Promise<UnitPriceDoc> {
    // Check for duplicate tag
    const existing = await this.getByTag(input.tag);
    if (existing) {
      throw new PricingFirestoreError(
        'CONFLICT',
        'Unit price with this tag already exists',
        409
      );
    }

    const data = {
      category: input.category,
      name: input.name,
      price: input.price,
      tag: input.tag,
      unit: input.unit,
      description: input.description,
      isActive: input.isActive ?? true,
    };

    const unitPrice = await this.create(data);
    logger.info('Created unit price', { id: unitPrice.id, tag: unitPrice.tag });
    return unitPrice;
  }

  /**
   * Update a unit price
   */
  async updateUnitPrice(id: string, input: UpdateUnitPriceInput): Promise<UnitPriceDoc> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new PricingFirestoreError('NOT_FOUND', 'Unit price not found', 404);
    }

    // Check for duplicate tag if tag is being changed
    if (input.tag && input.tag !== existing.tag) {
      const duplicate = await this.getByTag(input.tag);
      if (duplicate) {
        throw new PricingFirestoreError(
          'CONFLICT',
          'Unit price with this tag already exists',
          409
        );
      }
    }

    const unitPrice = await this.update(id, input);
    logger.info('Updated unit price', { id: unitPrice.id });
    return unitPrice;
  }

  /**
   * Delete a unit price
   */
  async deleteUnitPrice(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new PricingFirestoreError('NOT_FOUND', 'Unit price not found', 404);
    }

    await this.delete(id);
    logger.info('Deleted unit price', { id });
  }
}

// ============================================
// MATERIAL CATEGORY FIRESTORE SERVICE
// ============================================

export class MaterialCategoryFirestoreService extends BaseFirestoreService<MaterialCategoryDoc> {
  constructor() {
    super('materialCategories');
  }

  /**
   * Get all active material categories with material count
   */
  async getAllActiveWithCount(): Promise<MaterialCategoryWithCount[]> {
    const categories = await this.query({
      where: [{ field: 'isActive', operator: '==', value: true }],
      orderBy: [{ field: 'order', direction: 'asc' }],
    });

    // Get material counts for each category
    const materialService = new MaterialFirestoreService();
    const results: MaterialCategoryWithCount[] = [];

    for (const category of categories) {
      const count = await materialService.countByCategory(category.id);
      results.push({
        ...category,
        materialsCount: count,
      });
    }

    return results;
  }

  /**
   * Get a material category by ID
   */
  async getCategoryById(id: string): Promise<MaterialCategoryDoc | null> {
    return this.getById(id);
  }

  /**
   * Create a new material category
   */
  async createCategory(input: CreateMaterialCategoryInput): Promise<MaterialCategoryDoc> {
    const slug = generateSlug(input.name);

    // Check for duplicate slug
    const existing = await this.query({
      where: [{ field: 'slug', operator: '==', value: slug }],
      limit: 1,
    });

    if (existing.length > 0) {
      throw new PricingFirestoreError(
        'CONFLICT',
        'Material category with this name already exists',
        409
      );
    }

    const data = {
      name: input.name,
      slug,
      description: input.description,
      icon: input.icon,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
    };

    const category = await this.create(data);
    logger.info('Created material category', { id: category.id, name: category.name });
    return category;
  }

  /**
   * Update a material category
   */
  async updateCategory(id: string, input: UpdateMaterialCategoryInput): Promise<MaterialCategoryDoc> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new PricingFirestoreError('NOT_FOUND', 'Material category not found', 404);
    }

    const updateData: Partial<MaterialCategoryDoc> = { ...input };

    // Update slug if name changed
    if (input.name) {
      updateData.slug = generateSlug(input.name);
    }

    const category = await this.update(id, updateData);
    logger.info('Updated material category', { id: category.id });
    return category;
  }

  /**
   * Delete a material category (only if no materials exist)
   */
  async deleteCategory(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new PricingFirestoreError('NOT_FOUND', 'Material category not found', 404);
    }

    // Check if category has materials
    const materialService = new MaterialFirestoreService();
    const count = await materialService.countByCategory(id);
    if (count > 0) {
      throw new PricingFirestoreError(
        'CONFLICT',
        'Không thể xóa danh mục đang có vật dụng',
        409
      );
    }

    await this.delete(id);
    logger.info('Deleted material category', { id });
  }
}

// ============================================
// MATERIAL FIRESTORE SERVICE
// ============================================

export class MaterialFirestoreService extends BaseFirestoreService<MaterialDoc> {
  constructor() {
    super('materials');
  }

  /**
   * Get all active materials, optionally filtered by category
   */
  async getAllActive(categoryId?: string): Promise<MaterialWithCategory[]> {
    const whereClause: QueryOptions<MaterialDoc>['where'] = [
      { field: 'isActive', operator: '==', value: true },
    ];

    if (categoryId) {
      whereClause.push({ field: 'categoryId', operator: '==', value: categoryId });
    }

    const materials = await this.query({
      where: whereClause,
      orderBy: [{ field: 'order', direction: 'asc' }],
    });

    // Fetch categories
    const categoryService = new MaterialCategoryFirestoreService();
    const categoryIds = [...new Set(materials.map(m => m.categoryId))];
    const categories: Map<string, MaterialCategoryDoc> = new Map();

    for (const catId of categoryIds) {
      const category = await categoryService.getById(catId);
      if (category) {
        categories.set(catId, category);
      }
    }

    return materials
      .filter(material => categories.has(material.categoryId))
      .map(material => ({
        ...material,
        category: categories.get(material.categoryId) as MaterialCategoryDoc,
      }));
  }

  /**
   * Get materials by IDs
   */
  async getByIds(ids: string[]): Promise<MaterialDoc[]> {
    if (ids.length === 0) return [];

    const materials: MaterialDoc[] = [];
    for (const id of ids) {
      const material = await this.getById(id);
      if (material) {
        materials.push(material);
      }
    }
    return materials;
  }

  /**
   * Count materials by category
   */
  async countByCategory(categoryId: string): Promise<number> {
    return this.count({
      where: [{ field: 'categoryId', operator: '==', value: categoryId }],
    });
  }

  /**
   * Create a new material
   */
  async createMaterial(input: CreateMaterialInput): Promise<MaterialWithCategory> {
    // Verify category exists
    const categoryService = new MaterialCategoryFirestoreService();
    const category = await categoryService.getById(input.categoryId);
    if (!category) {
      throw new PricingFirestoreError('NOT_FOUND', 'Material category not found', 404);
    }

    const data = {
      name: input.name,
      categoryId: input.categoryId,
      imageUrl: input.imageUrl ?? null,
      price: input.price,
      description: input.description,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
    };

    const material = await this.create(data);
    logger.info('Created material', { id: material.id, name: material.name });

    return {
      ...material,
      category,
    };
  }

  /**
   * Update a material
   */
  async updateMaterial(id: string, input: UpdateMaterialInput): Promise<MaterialWithCategory> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new PricingFirestoreError('NOT_FOUND', 'Material not found', 404);
    }

    // Verify category exists if categoryId is being changed
    const categoryService = new MaterialCategoryFirestoreService();
    const categoryId = input.categoryId ?? existing.categoryId;
    const category = await categoryService.getById(categoryId);
    if (!category) {
      throw new PricingFirestoreError('NOT_FOUND', 'Material category not found', 404);
    }

    const material = await this.update(id, input);
    logger.info('Updated material', { id: material.id });

    return {
      ...material,
      category,
    };
  }

  /**
   * Delete a material
   */
  async deleteMaterial(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new PricingFirestoreError('NOT_FOUND', 'Material not found', 404);
    }

    await this.delete(id);
    logger.info('Deleted material', { id });
  }
}

// ============================================
// QUOTE CALCULATION SERVICE
// ============================================

export interface QuoteCalculationInput {
  categoryId: string;
  area: number;
  materialIds?: string[];
}

export interface SelectedMaterial {
  id: string;
  name: string;
  price: number;
}

export interface QuoteCalculationResult {
  category: {
    id: string;
    name: string;
    coefficient: number;
  };
  area: number;
  basePrice: number;
  priceWithCoefficient: number;
  materials: SelectedMaterial[];
  materialsTotal: number;
  total: number;
}

export class QuoteCalculationService {
  private serviceCategoryService: ServiceCategoryFirestoreService;
  private unitPriceService: UnitPriceFirestoreService;
  private materialService: MaterialFirestoreService;

  constructor() {
    this.serviceCategoryService = new ServiceCategoryFirestoreService();
    this.unitPriceService = new UnitPriceFirestoreService();
    this.materialService = new MaterialFirestoreService();
  }

  /**
   * Calculate quote based on service category, area, and materials
   */
  async calculateQuote(input: QuoteCalculationInput): Promise<QuoteCalculationResult> {
    // Get category with formula
    const category = await this.serviceCategoryService.getByIdWithFormula(input.categoryId);
    if (!category) {
      throw new PricingFirestoreError('NOT_FOUND', 'Category not found', 404);
    }

    const allowMaterials = (category.materialCategoryIds?.length || 0) > 0;

    // Get unit prices
    const unitPrices = await this.unitPriceService.getAllActive();
    const priceMap: Record<string, number> = {};
    unitPrices.forEach(p => { priceMap[p.tag] = p.price; });
    priceMap['DIEN_TICH'] = input.area;

    // Calculate base price from formula
    let basePrice = 0;
    if (category.formula) {
      // Simple expression evaluation (e.g., "DIEN_TICH * DON_GIA_SON")
      const expr = category.formula.expression;
      const tokens = expr.split(/\s*([+\-*/])\s*/);
      let result = 0;
      let operator = '+';
      for (const token of tokens) {
        if (['+', '-', '*', '/'].includes(token)) {
          operator = token;
        } else {
          const value = priceMap[token] || parseFloat(token) || 0;
          switch (operator) {
            case '+': result += value; break;
            case '-': result -= value; break;
            case '*': result *= value; break;
            case '/': result = value !== 0 ? result / value : result; break;
          }
        }
      }
      basePrice = result;
    }

    // Apply coefficient
    const priceWithCoefficient = basePrice * category.coefficient;

    // Add materials
    let materialsTotal = 0;
    const selectedMaterials: SelectedMaterial[] = [];
    if (input.materialIds && input.materialIds.length > 0 && allowMaterials) {
      const materials = await this.materialService.getByIds(input.materialIds);
      materials.forEach(m => {
        materialsTotal += m.price;
        selectedMaterials.push({ id: m.id, name: m.name, price: m.price });
      });
    }

    const total = priceWithCoefficient + materialsTotal;

    return {
      category: { id: category.id, name: category.name, coefficient: category.coefficient },
      area: input.area,
      basePrice,
      priceWithCoefficient,
      materials: selectedMaterials,
      materialsTotal,
      total,
    };
  }
}

// ============================================
// SINGLETON INSTANCES
// ============================================

let formulaServiceInstance: FormulaFirestoreService | null = null;
let serviceCategoryServiceInstance: ServiceCategoryFirestoreService | null = null;
let unitPriceServiceInstance: UnitPriceFirestoreService | null = null;
let materialCategoryServiceInstance: MaterialCategoryFirestoreService | null = null;
let materialServiceInstance: MaterialFirestoreService | null = null;
let quoteCalculationServiceInstance: QuoteCalculationService | null = null;

export function getFormulaFirestoreService(): FormulaFirestoreService {
  if (!formulaServiceInstance) {
    formulaServiceInstance = new FormulaFirestoreService();
  }
  return formulaServiceInstance;
}

export function getServiceCategoryFirestoreService(): ServiceCategoryFirestoreService {
  if (!serviceCategoryServiceInstance) {
    serviceCategoryServiceInstance = new ServiceCategoryFirestoreService();
  }
  return serviceCategoryServiceInstance;
}

export function getUnitPriceFirestoreService(): UnitPriceFirestoreService {
  if (!unitPriceServiceInstance) {
    unitPriceServiceInstance = new UnitPriceFirestoreService();
  }
  return unitPriceServiceInstance;
}

export function getMaterialCategoryFirestoreService(): MaterialCategoryFirestoreService {
  if (!materialCategoryServiceInstance) {
    materialCategoryServiceInstance = new MaterialCategoryFirestoreService();
  }
  return materialCategoryServiceInstance;
}

export function getMaterialFirestoreService(): MaterialFirestoreService {
  if (!materialServiceInstance) {
    materialServiceInstance = new MaterialFirestoreService();
  }
  return materialServiceInstance;
}

export function getQuoteCalculationService(): QuoteCalculationService {
  if (!quoteCalculationServiceInstance) {
    quoteCalculationServiceInstance = new QuoteCalculationService();
  }
  return quoteCalculationServiceInstance;
}
