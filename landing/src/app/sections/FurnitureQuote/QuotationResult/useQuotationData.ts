/**
 * useQuotationData Hook
 * Feature: furniture-quotation
 * Requirements: 7.6 - Fetch applicable fees and calculate quotation
 */

import { useState, useEffect } from 'react';
import { furnitureAPI, FurnitureFee, QuotationItem } from '../../../api/furniture';
import { QuotationSelections, QuotationResultData } from './types';
import { calculateQuotation } from './utils';

interface UseQuotationDataResult {
  fees: FurnitureFee[];
  loading: boolean;
  quotationResult: QuotationResultData | null;
}

/**
 * Hook to fetch fees and calculate quotation
 * Requirements: 7.6 - Fetch applicable fees
 */
export function useQuotationData(
  selections: QuotationSelections,
  onError: (message: string) => void
): UseQuotationDataResult {
  const [fees, setFees] = useState<FurnitureFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotationResult, setQuotationResult] = useState<QuotationResultData | null>(null);

  // Fetch fees on mount
  useEffect(() => {
    setLoading(true);
    furnitureAPI.getFees()
      .then((allFees) => {
        setFees(allFees);
      })
      .catch((err) => {
        onError(err instanceof Error ? err.message : 'Không thể tải danh sách phí');
      })
      .finally(() => setLoading(false));
  }, [onError]);

  // Calculate quotation when fees are loaded
  useEffect(() => {
    if (!loading && selections.products.length > 0) {
      const items: QuotationItem[] = selections.products.map((p) => ({
        productId: p.product.id,
        name: p.product.name,
        price: p.product.price,
        quantity: p.quantity,
      }));

      const result = calculateQuotation(items, fees);
      setQuotationResult(result);
    }
  }, [loading, fees, selections]);

  return { fees, loading, quotationResult };
}

export default useQuotationData;
