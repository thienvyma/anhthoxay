/**
 * useQuotation Hook
 * Manages quotation calculation and submission
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.2, 3.3**
 */

import { useState, useCallback } from 'react';
import { resolveMediaUrl } from '@app/shared';
import { furnitureAPI, FurnitureFee, QuotationItem, ProductVariantForLanding } from '../../../api/furniture';
import type { Selections, QuotationResultData } from '../types';
import type { LeadData } from '../LeadForm';

export interface UseQuotationReturn {
  quotationResult: QuotationResultData | null;
  quotationId: string | null;
  submitting: boolean;
  calculateQuotation: () => Promise<boolean>;
  getProductDisplayPrice: (variant: ProductVariantForLanding, fitInSelected: boolean, quantity: number) => number;
  resetQuotation: () => void;
}

export function useQuotation(
  selections: Selections,
  fees: FurnitureFee[],
  fitInFee: FurnitureFee | null,
  leadData: LeadData,
  onError: (message: string) => void,
  onSuccess: (message: string) => void
): UseQuotationReturn {
  const [quotationResult, setQuotationResult] = useState<QuotationResultData | null>(null);
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getProductDisplayPrice = useCallback((
    variant: ProductVariantForLanding, 
    fitInSelected: boolean, 
    quantity: number
  ): number => {
    let price = variant.calculatedPrice * quantity;
    if (fitInSelected && fitInFee) {
      const fitInAmount = fitInFee.type === 'FIXED' 
        ? fitInFee.value * quantity
        : (variant.calculatedPrice * fitInFee.value / 100) * quantity;
      price += fitInAmount;
    }
    return price;
  }, [fitInFee]);

  const calculateQuotation = useCallback(async (): Promise<boolean> => {
    if (selections.products.length === 0) {
      onError('Vui lòng chọn ít nhất một sản phẩm');
      return false;
    }

    // Validate lead data exists
    if (!leadData.id && (!leadData.name || !leadData.phone)) {
      onError('Vui lòng quay lại bước 6 để nhập thông tin liên hệ');
      return false;
    }

    setSubmitting(true);

    try {
      let basePrice = 0;
      let fitInFeesTotal = 0;
      const items: QuotationItem[] = [];
      
      selections.products.forEach((p) => {
        const itemBasePrice = p.variant.calculatedPrice * p.quantity;
        basePrice += itemBasePrice;
        
        // Calculate Fit-in fee if selected
        let itemFitInFee = 0;
        if (p.fitInSelected && fitInFee) {
          itemFitInFee = fitInFee.type === 'FIXED' 
            ? fitInFee.value * p.quantity
            : (p.variant.calculatedPrice * fitInFee.value / 100) * p.quantity;
          fitInFeesTotal += itemFitInFee;
        }
        
        items.push({
          productId: p.variant.id,
          name: p.productName,
          material: p.variant.materialName,
          price: p.variant.calculatedPrice,
          quantity: p.quantity,
          fitInSelected: p.fitInSelected,
          fitInFee: itemFitInFee > 0 ? itemFitInFee : undefined,
        });
      });

      // Apply other fees (excluding FIT_IN which is handled per product)
      const feesBreakdown = fees
        .filter(f => f.isActive && f.code !== 'FIT_IN')
        .map((f) => ({
          name: f.name,
          type: f.type,
          value: f.value,
          amount: f.type === 'FIXED' ? f.value : (basePrice * f.value) / 100,
        }));

      const totalOtherFees = feesBreakdown.reduce((sum, f) => sum + f.amount, 0);
      const totalPrice = basePrice + fitInFeesTotal + totalOtherFees;

      // Create quotation via API
      if (selections.developer && selections.project && selections.building && 
          selections.floor && selections.axis !== null && selections.apartmentTypeDetail) {
        
        const quotationPayload: Parameters<typeof furnitureAPI.createQuotation>[0] = {
          developerName: selections.developer.name,
          projectName: selections.project.name,
          buildingName: selections.building.name,
          buildingCode: selections.building.code,
          floor: selections.floor,
          axis: selections.axis,
          apartmentType: selections.apartmentTypeDetail.apartmentType,
          items,
        };

        // Only add layoutImageUrl if it's a valid non-empty string
        if (selections.apartmentTypeDetail.imageUrl && selections.apartmentTypeDetail.imageUrl.trim() !== '') {
          quotationPayload.layoutImageUrl = resolveMediaUrl(selections.apartmentTypeDetail.imageUrl);
        }

        // If leadId exists, use it; otherwise pass leadData
        if (leadData.id) {
          quotationPayload.leadId = leadData.id;
        } else {
          quotationPayload.leadData = {
            name: leadData.name,
            phone: leadData.phone,
            email: leadData.email || undefined,
          };
        }

        const quotation = await furnitureAPI.createQuotation(quotationPayload);
        
        setQuotationId(quotation.id);
        setQuotationResult({ basePrice, fitInFeesTotal, fees: feesBreakdown, totalPrice });
        onSuccess('Báo giá đã được tạo thành công!');
        return true;
      }

      setQuotationResult({ basePrice, fitInFeesTotal, fees: feesBreakdown, totalPrice });
      onSuccess('Báo giá đã được tạo thành công!');
      return true;
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [selections, fees, fitInFee, leadData, onError, onSuccess]);

  const resetQuotation = useCallback(() => {
    setQuotationResult(null);
    setQuotationId(null);
  }, []);

  return {
    quotationResult,
    quotationId,
    submitting,
    calculateQuotation,
    getProductDisplayPrice,
    resetQuotation,
  };
}
