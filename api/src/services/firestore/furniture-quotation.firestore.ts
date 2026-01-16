/**
 * Furniture Quotation Firestore Service
 * 
 * Handles Firestore operations for:
 * - Quotations - `furnitureQuotations/{quotationId}`
 * 
 * @module services/firestore/furniture-quotation.firestore
 * @requirements 8.3
 */

import { BaseFirestoreService, type QueryOptions } from './base.firestore';
import type { FirestoreFurnitureQuotation, FirestoreFurnitureFee } from '../../types/firestore.types';
import { getLeadsFirestoreService } from './leads.firestore';

// ============================================
// ERROR CLASS
// ============================================

export class FurnitureQuotationFirestoreError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = 'FurnitureQuotationFirestoreError';
  }
}

// ============================================
// INPUT TYPES
// ============================================

export interface QuotationItem {
  productId: string;
  name: string;
  material?: string;
  price: number;
  quantity: number;
  fitInSelected?: boolean;
  fitInFee?: number;
}

export interface FeeBreakdown {
  name: string;
  type: string;
  value: number;
  amount: number;
}

export interface QuotationCalculation {
  basePrice: number;
  fitInFeesTotal: number;
  feesBreakdown: FeeBreakdown[];
  totalPrice: number;
}

export interface CreateQuotationInput {
  leadId: string;
  developerName: string;
  projectName: string;
  buildingName: string;
  buildingCode: string;
  floor: number;
  axis: number;
  apartmentType: string;
  layoutImageUrl?: string;
  items: QuotationItem[];
  fees: FirestoreFurnitureFee[];
}

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Calculate variant price based on pricing type
 * - LINEAR: pricePerUnit × length
 * - M2: pricePerUnit × length × width
 */
export function calculateVariantPrice(
  pricePerUnit: number,
  pricingType: 'LINEAR' | 'M2',
  length: number,
  width?: number | null
): number {
  if (pricePerUnit < 0) {
    throw new FurnitureQuotationFirestoreError(
      'INVALID_DIMENSIONS',
      'pricePerUnit must be a non-negative number',
      400
    );
  }
  if (length < 0) {
    throw new FurnitureQuotationFirestoreError(
      'INVALID_DIMENSIONS',
      'length must be a non-negative number',
      400
    );
  }

  if (pricingType === 'M2') {
    if (width === undefined || width === null) {
      throw new FurnitureQuotationFirestoreError(
        'WIDTH_REQUIRED_FOR_M2',
        'Width is required when pricingType is M2',
        400
      );
    }
    if (width < 0) {
      throw new FurnitureQuotationFirestoreError(
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
 * Calculate price range from active variants
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

/**
 * Calculate Fit-in fee based on fee type
 * - FIXED: returns the fee value directly
 * - PERCENTAGE: returns calculatedPrice × value / 100
 */
export function calculateFitInFee(
  calculatedPrice: number,
  feeType: 'FIXED' | 'PERCENTAGE',
  feeValue: number
): number {
  if (feeType === 'FIXED') {
    return feeValue;
  }
  return (calculatedPrice * feeValue) / 100;
}

/**
 * Calculate line total for a product selection
 * Formula: (calculatedPrice + fitInFee) × quantity
 */
export function calculateLineTotal(
  calculatedPrice: number,
  fitInFee: number,
  quantity: number
): number {
  return (calculatedPrice + fitInFee) * quantity;
}

/**
 * Calculate grand total for a quotation
 * Formula: subtotal + fitInFeesTotal + sum of other fees
 */
export function calculateGrandTotal(
  subtotal: number,
  fitInFeesTotal: number,
  otherFees: number[]
): number {
  const otherFeesTotal = otherFees.reduce((sum, fee) => sum + fee, 0);
  return subtotal + fitInFeesTotal + otherFeesTotal;
}

/**
 * Calculate unit number from building code, floor, and axis
 * Format: {buildingCode}.{floor padded to 2 digits}{axis padded to 2 digits}
 */
export function calculateUnitNumber(buildingCode: string, floor: number, axis: number): string {
  const floorStr = floor.toString().padStart(2, '0');
  const axisStr = axis.toString().padStart(2, '0');
  return `${buildingCode}.${floorStr}${axisStr}`;
}

/**
 * Calculate quotation pricing with Fit-in fee support
 */
export function calculateQuotation(
  items: QuotationItem[],
  fees: FirestoreFurnitureFee[]
): QuotationCalculation {
  const basePrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const fitInFeesTotal = items.reduce((sum, item) => {
    if (item.fitInSelected && item.fitInFee) {
      return sum + item.fitInFee * item.quantity;
    }
    return sum;
  }, 0);

  const regularFees = fees.filter((fee) => fee.code !== 'FIT_IN');

  const feesBreakdown: FeeBreakdown[] = regularFees.map((fee) => {
    const amount =
      fee.type === 'FIXED' ? fee.value : (basePrice * fee.value) / 100;
    return {
      name: fee.name,
      type: fee.type,
      value: fee.value,
      amount,
    };
  });

  const totalFees = feesBreakdown.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPrice = basePrice + fitInFeesTotal + totalFees;

  return {
    basePrice,
    fitInFeesTotal,
    feesBreakdown,
    totalPrice,
  };
}

// ============================================
// QUOTATION SERVICE
// ============================================

export class FurnitureQuotationFirestoreService extends BaseFirestoreService<FirestoreFurnitureQuotation> {
  constructor() {
    super('furnitureQuotations');
  }

  /**
   * Create a new quotation
   */
  async createQuotation(input: CreateQuotationInput): Promise<FirestoreFurnitureQuotation> {
    // Verify lead exists
    const leadsService = getLeadsFirestoreService();
    const lead = await leadsService.getById(input.leadId);
    if (!lead) {
      throw new FurnitureQuotationFirestoreError('NOT_FOUND', 'Lead not found', 404);
    }

    const unitNumber = calculateUnitNumber(
      input.buildingCode,
      input.floor,
      input.axis
    );

    const calculation = calculateQuotation(input.items, input.fees);

    return this.create({
      leadId: input.leadId,
      developerName: input.developerName,
      projectName: input.projectName,
      buildingName: input.buildingName,
      buildingCode: input.buildingCode,
      floor: input.floor,
      axis: input.axis,
      unitNumber,
      apartmentType: input.apartmentType,
      layoutImageUrl: input.layoutImageUrl,
      items: input.items,
      basePrice: calculation.basePrice,
      fees: calculation.feesBreakdown,
      totalPrice: calculation.totalPrice,
    });
  }

  /**
   * Get quotations by lead ID
   */
  async getQuotationsByLead(leadId: string): Promise<FirestoreFurnitureQuotation[]> {
    return this.query({
      where: [{ field: 'leadId', operator: '==', value: leadId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get quotation by ID
   */
  async getQuotationById(id: string): Promise<FirestoreFurnitureQuotation> {
    const quotation = await this.getById(id);
    if (!quotation) {
      throw new FurnitureQuotationFirestoreError('NOT_FOUND', 'Quotation not found', 404);
    }
    return quotation;
  }

  /**
   * Get all quotations with pagination
   */
  async getQuotations(options?: {
    page?: number;
    limit?: number;
    leadId?: string;
    projectName?: string;
    buildingCode?: string;
  }): Promise<{
    quotations: FirestoreFurnitureQuotation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, leadId, projectName, buildingCode } = options || {};

    const queryOptions: QueryOptions<FirestoreFurnitureQuotation> = {
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    };

    const whereClause: Array<{ field: keyof FirestoreFurnitureQuotation | string; operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains' | 'array-contains-any'; value: unknown }> = [];

    if (leadId) {
      whereClause.push({ field: 'leadId', operator: '==', value: leadId });
    }
    if (projectName) {
      whereClause.push({ field: 'projectName', operator: '==', value: projectName });
    }
    if (buildingCode) {
      whereClause.push({ field: 'buildingCode', operator: '==', value: buildingCode });
    }

    if (whereClause.length > 0) {
      queryOptions.where = whereClause;
    }

    // Get all matching quotations
    const allQuotations = await this.query(queryOptions);
    const total = allQuotations.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const quotations = allQuotations.slice(startIndex, startIndex + limit);

    return {
      quotations,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Delete a quotation
   */
  async deleteQuotation(id: string): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new FurnitureQuotationFirestoreError('NOT_FOUND', 'Quotation not found', 404);
    }

    await this.delete(id);
  }

  /**
   * Get quotation statistics
   */
  async getQuotationStats(): Promise<{
    totalQuotations: number;
    totalValue: number;
    averageValue: number;
    byProject: Array<{ projectName: string; count: number; totalValue: number }>;
  }> {
    const allQuotations = await this.query({});

    const totalQuotations = allQuotations.length;
    const totalValue = allQuotations.reduce((sum, q) => sum + q.totalPrice, 0);
    const averageValue = totalQuotations > 0 ? totalValue / totalQuotations : 0;

    // Group by project
    const projectMap = new Map<string, { count: number; totalValue: number }>();
    for (const quotation of allQuotations) {
      const existing = projectMap.get(quotation.projectName) || { count: 0, totalValue: 0 };
      projectMap.set(quotation.projectName, {
        count: existing.count + 1,
        totalValue: existing.totalValue + quotation.totalPrice,
      });
    }

    const byProject = Array.from(projectMap.entries()).map(([projectName, data]) => ({
      projectName,
      count: data.count,
      totalValue: data.totalValue,
    }));

    return {
      totalQuotations,
      totalValue,
      averageValue,
      byProject,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let quotationServiceInstance: FurnitureQuotationFirestoreService | null = null;

export function getFurnitureQuotationFirestoreService(): FurnitureQuotationFirestoreService {
  if (!quotationServiceInstance) {
    quotationServiceInstance = new FurnitureQuotationFirestoreService();
  }
  return quotationServiceInstance;
}
