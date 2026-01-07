/**
 * Product Calculation Service
 *
 * Handles price calculations for furniture products
 *
 * **Feature: furniture-product-mapping, Property 6: Calculated Price Formula**
 * **Requirements: 3.4**
 */

import { FurnitureServiceError } from '../furniture.error';

/**
 * Calculate product price from dimensions
 * - M2 (mét vuông): pricePerUnit × length × width
 * - LINEAR (mét dài): pricePerUnit × length
 *
 * **Feature: furniture-product-mapping, Property 6: Calculated Price Formula**
 * **Validates: Requirements 3.4**
 */
export function calculateProductPrice(
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

/**
 * Calculate variant price based on pricing type
 * Helper method for variant creation/update
 */
export function calculateVariantPrice(
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
