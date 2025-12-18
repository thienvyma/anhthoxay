/**
 * Quote Service Module
 *
 * Handles business logic for quote calculation:
 * - Calculate quote based on service category, area, and materials
 * - Evaluate formula expressions
 * - Apply coefficients and material prices
 *
 * Separates data access and business logic from HTTP handling.
 *
 * **Feature: api-refactoring**
 * **Requirements: 2.1, 2.2, 2.3**
 */

import { PrismaClient, ServiceCategory, Formula, Material } from '@prisma/client';

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * Input for quote calculation
 */
export interface CalculateQuoteInput {
  categoryId: string;
  area: number;
  materialIds?: string[];
}

/**
 * Selected material in quote result
 */
export interface SelectedMaterial {
  id: string;
  name: string;
  price: number;
}

/**
 * Category info in quote result
 */
export interface QuoteCategoryInfo {
  id: string;
  name: string;
  coefficient: number;
}

/**
 * Quote calculation result
 */
export interface QuoteResult {
  category: QuoteCategoryInfo;
  area: number;
  basePrice: number;
  priceWithCoefficient: number;
  materials: SelectedMaterial[];
  materialsTotal: number;
  total: number;
}

/**
 * Service category with formula and material categories for quote calculation
 */
interface ServiceCategoryWithRelations extends ServiceCategory {
  formula: Formula | null;
  materialCategories: Array<{ materialCategoryId: string }>;
}

// ============================================
// ERROR CLASS
// ============================================

export class QuoteServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.name = 'QuoteServiceError';
    this.statusCode = statusCode;
  }
}

// ============================================
// QUOTE SERVICE CLASS
// ============================================

export class QuoteService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Evaluate a simple mathematical expression with variable substitution
   * Supports: +, -, *, / operators
   * @param expression - Formula expression (e.g., "DIEN_TICH * DON_GIA_SON")
   * @param variables - Map of variable names to values
   * @returns Calculated result
   */
  evaluateExpression(expression: string, variables: Record<string, number>): number {
    const tokens = expression.split(/\s*([+\-*/])\s*/);
    let result = 0;
    let operator = '+';

    for (const token of tokens) {
      if (['+', '-', '*', '/'].includes(token)) {
        operator = token;
      } else {
        const value = variables[token] ?? (parseFloat(token) || 0);
        switch (operator) {
          case '+':
            result += value;
            break;
          case '-':
            result -= value;
            break;
          case '*':
            result *= value;
            break;
          case '/':
            result = value !== 0 ? result / value : result;
            break;
        }
      }
    }

    return result;
  }

  /**
   * Calculate quote based on service category, area, and optional materials
   * @param input - Quote calculation input
   * @returns Quote calculation result
   * @throws QuoteServiceError if category not found
   */
  async calculateQuote(input: CalculateQuoteInput): Promise<QuoteResult> {
    const { categoryId, area, materialIds } = input;

    // Get category with formula and material categories
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      include: {
        formula: true,
        materialCategories: true,
      },
    }) as ServiceCategoryWithRelations | null;

    if (!category) {
      throw new QuoteServiceError('NOT_FOUND', 'Category not found', 404);
    }

    const allowMaterials = category.materialCategories.length > 0;

    // Get unit prices and build price map
    const unitPrices = await this.prisma.unitPrice.findMany({
      where: { isActive: true },
    });

    const priceMap: Record<string, number> = {};
    unitPrices.forEach((p) => {
      priceMap[p.tag] = p.price;
    });
    priceMap['DIEN_TICH'] = area;

    // Calculate base price from formula
    let basePrice = 0;
    if (category.formula) {
      basePrice = this.evaluateExpression(category.formula.expression, priceMap);
    }

    // Apply coefficient
    const priceWithCoefficient = basePrice * category.coefficient;

    // Add materials
    let materialsTotal = 0;
    const selectedMaterials: SelectedMaterial[] = [];

    if (materialIds && materialIds.length > 0 && allowMaterials) {
      const materials = await this.prisma.material.findMany({
        where: { id: { in: materialIds } },
      });

      materials.forEach((m: Material) => {
        materialsTotal += m.price;
        selectedMaterials.push({
          id: m.id,
          name: m.name,
          price: m.price,
        });
      });
    }

    const total = priceWithCoefficient + materialsTotal;

    return {
      category: {
        id: category.id,
        name: category.name,
        coefficient: category.coefficient,
      },
      area,
      basePrice,
      priceWithCoefficient,
      materials: selectedMaterials,
      materialsTotal,
      total,
    };
  }
}
