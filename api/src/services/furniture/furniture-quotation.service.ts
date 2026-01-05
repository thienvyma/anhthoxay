/**
 * Furniture Quotation Service
 *
 * Handles business logic for:
 * - Quotations (Báo giá)
 * - Calculation utilities
 *
 * **Feature: furniture-quotation, furniture-product-mapping, furniture-product-restructure**
 * **Requirements: 7.8, 8.1-8.3, 11.1-11.5**
 */

import { PrismaClient, FurnitureQuotation, FurnitureFee } from '@prisma/client';
import { FurnitureServiceError } from './furniture.error';
import {
  CreateQuotationInput,
  QuotationItem,
  QuotationCalculation,
  FeeBreakdown,
} from './furniture.types';

export class FurnitureQuotationService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // CALCULATION UTILITIES
  // ============================================

  /**
   * Calculate variant price based on pricing type
   * - LINEAR: pricePerUnit × length
   * - M2: pricePerUnit × length × width
   *
   * **Feature: furniture-product-restructure, Property 5**
   * **Validates: Requirements 11.1, 4.3**
   */
  calculateVariantPrice(
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
   * Calculate price range from active variants
   *
   * **Feature: furniture-product-restructure, Property 6**
   * **Validates: Requirements 11.2, 6.2**
   */
  calculatePriceRange(
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
   *
   * **Feature: furniture-product-restructure, Property 7**
   * **Validates: Requirements 11.3, 7.4**
   */
  calculateFitInFee(
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
   *
   * **Feature: furniture-product-restructure, Property 8**
   * **Validates: Requirements 11.4, 7.5**
   */
  calculateLineTotal(
    calculatedPrice: number,
    fitInFee: number,
    quantity: number
  ): number {
    return (calculatedPrice + fitInFee) * quantity;
  }

  /**
   * Calculate grand total for a quotation
   * Formula: subtotal + fitInFeesTotal + sum of other fees
   *
   * **Feature: furniture-product-restructure, Property 9**
   * **Validates: Requirements 11.5, 8.5**
   */
  calculateGrandTotal(
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
  calculateUnitNumber(buildingCode: string, floor: number, axis: number): string {
    const floorStr = floor.toString().padStart(2, '0');
    const axisStr = axis.toString().padStart(2, '0');
    return `${buildingCode}.${floorStr}${axisStr}`;
  }

  /**
   * Calculate quotation pricing with Fit-in fee support
   *
   * **Feature: furniture-product-mapping, Property 7**
   * **Validates: Requirements 4.4, 4.5, 7.6**
   */
  calculateQuotation(
    items: QuotationItem[],
    fees: FurnitureFee[]
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
  // QUOTATIONS
  // ============================================

  async createQuotation(input: CreateQuotationInput): Promise<FurnitureQuotation> {
    const lead = await this.prisma.customerLead.findUnique({
      where: { id: input.leadId },
    });
    if (!lead) {
      throw new FurnitureServiceError('NOT_FOUND', 'Lead not found', 404);
    }

    const unitNumber = this.calculateUnitNumber(
      input.buildingCode,
      input.floor,
      input.axis
    );

    const calculation = this.calculateQuotation(input.items, input.fees);

    return this.prisma.furnitureQuotation.create({
      data: {
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
        items: JSON.stringify(input.items),
        basePrice: calculation.basePrice,
        fees: JSON.stringify(calculation.feesBreakdown),
        totalPrice: calculation.totalPrice,
      },
    });
  }

  async getQuotationsByLead(leadId: string): Promise<FurnitureQuotation[]> {
    return this.prisma.furnitureQuotation.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQuotationById(id: string): Promise<FurnitureQuotation> {
    const quotation = await this.prisma.furnitureQuotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new FurnitureServiceError('NOT_FOUND', 'Quotation not found', 404);
    }

    return quotation;
  }
}
