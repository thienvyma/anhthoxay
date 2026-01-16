/**
 * QuotationResult Utility Functions
 * Feature: furniture-quotation
 * Requirements: 4.5, 6.5, 7.6, 8.4
 */

import { FurnitureFee, QuotationItem, FeeBreakdown } from '../../../api/furniture';
import { QuotationResultData } from './types';

// Re-export from @app/shared for backward compatibility
export { formatCurrency, calculateUnitNumber } from '@app/shared';

/**
 * Calculate quotation pricing
 * - basePrice = sum of item prices * quantities
 * - fitInFeesTotal = sum of Fit-in fees for items with fitInSelected
 * - Apply FIXED fees directly, PERCENTAGE fees as basePrice * value / 100
 * 
 * **Feature: furniture-product-mapping**
 * **Validates: Requirements 4.5, 7.6, 8.4**
 */
export const calculateQuotation = (
  items: QuotationItem[],
  fees: FurnitureFee[]
): QuotationResultData => {
  // Calculate base price
  const basePrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate Fit-in fees total - Requirements: 8.4
  const fitInFeesTotal = items.reduce((sum, item) => {
    if (item.fitInSelected && item.fitInFee) {
      return sum + (item.fitInFee * item.quantity);
    }
    return sum;
  }, 0);

  // Filter active fees (excluding FIT_IN which is handled per-item)
  const applicableFees = fees.filter((fee) => fee.isActive && fee.code !== 'FIT_IN');

  // Calculate fee amounts
  const feesBreakdown: FeeBreakdown[] = applicableFees.map((fee) => {
    const amount = fee.type === 'FIXED' ? fee.value : (basePrice * fee.value) / 100;
    return {
      name: fee.name,
      type: fee.type,
      value: fee.value,
      amount,
    };
  });

  // Calculate total (basePrice + fitInFeesTotal + other fees)
  const totalFees = feesBreakdown.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPrice = basePrice + fitInFeesTotal + totalFees;

  return {
    basePrice,
    fitInFeesTotal,
    fees: feesBreakdown,
    totalPrice,
  };
};
