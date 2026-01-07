/**
 * useQuotationActions Hook
 * Feature: furniture-quotation
 * Requirements: 7.8 - Save quotation to database
 */

import { useState, useCallback } from 'react';
import { furnitureAPI, QuotationItem } from '../../../api/furniture';
import { QuotationSelections, LeadData, QuotationResultData } from './types';

interface UseQuotationActionsResult {
  submitting: boolean;
  submitted: boolean;
  quotationId: string | null;
  handleSubmit: () => Promise<void>;
}

/**
 * Hook to handle quotation submission
 * Requirements: 7.8, 11.2 - Save quotation to database
 */
export function useQuotationActions(
  selections: QuotationSelections,
  leadData: LeadData,
  quotationResult: QuotationResultData | null,
  onError: (message: string) => void,
  onSuccess: (message: string) => void
): UseQuotationActionsResult {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quotationId, setQuotationId] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!quotationResult) {
      onError('Vui lòng chọn nội thất trước');
      return;
    }

    if (!selections.developer || !selections.project || !selections.building) {
      onError('Thiếu thông tin căn hộ');
      return;
    }

    if (selections.floor === null || selections.axis === null) {
      onError('Thiếu thông tin tầng và trục');
      return;
    }

    if (!selections.apartmentTypeDetail) {
      onError('Thiếu thông tin loại căn hộ');
      return;
    }

    setSubmitting(true);

    try {
      // Build items array
      const items: QuotationItem[] = selections.products.map((p) => ({
        productId: p.product.id,
        name: p.product.name,
        price: p.product.price,
        quantity: p.quantity,
      }));

      // Create quotation via API
      // Requirements: 7.8, 11.2 - Include all required fields
      const quotation = await furnitureAPI.createQuotation({
        leadData: {
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
        },
        developerName: selections.developer.name,
        projectName: selections.project.name,
        buildingName: selections.building.name,
        buildingCode: selections.building.code,
        floor: selections.floor,
        axis: selections.axis,
        apartmentType: selections.apartmentTypeDetail.apartmentType,
        layoutImageUrl: selections.apartmentTypeDetail.imageUrl || undefined,
        items,
      });

      // Save quotation ID for PDF download
      setQuotationId(quotation.id);
      setSubmitted(true);
      onSuccess('Báo giá đã được tạo thành công!');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo báo giá');
    } finally {
      setSubmitting(false);
    }
  }, [selections, quotationResult, leadData, onError, onSuccess]);

  return { submitting, submitted, quotationId, handleSubmit };
}

export default useQuotationActions;
