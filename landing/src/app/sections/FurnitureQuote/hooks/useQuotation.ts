/**
 * useQuotation Hook
 * Manages quotation calculation, submission, and email delivery
 * 
 * **Feature: codebase-refactor-large-files, furniture-quotation-email**
 * **Requirements: 3.1, 3.2, 3.3, 3.4, 6.2, 8.4, 1.3**
 */

import { useState, useCallback } from 'react';
import { resolveMediaUrl } from '@app/shared';
import { furnitureAPI, FurnitureFee, QuotationItem, ProductVariantForLanding, SendEmailResponse } from '../../../api/furniture';
import type { Selections, QuotationResultData } from '../types';
import type { LeadData } from '../LeadForm';

/**
 * Email send status for tracking
 * _Requirements: 3.3, 3.4_
 */
export type EmailSendStatus = 'idle' | 'sending' | 'sent' | 'error' | 'rate_limited';

export interface UseQuotationReturn {
  quotationResult: QuotationResultData | null;
  quotationId: string | null;
  submitting: boolean;
  emailStatus: EmailSendStatus;
  emailError: string | null;
  emailErrorCode: string | null;
  calculateQuotation: () => Promise<boolean>;
  sendEmail: (quotationId: string) => Promise<SendEmailResponse>;
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
  const [emailStatus, setEmailStatus] = useState<EmailSendStatus>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailErrorCode, setEmailErrorCode] = useState<string | null>(null);

  /**
   * Send quotation email via API
   * 
   * **Feature: furniture-quotation-email**
   * **Validates: Requirements 3.1, 3.3, 3.4, 6.2, 8.4, 1.3**
   * 
   * @param quotationIdToSend - The quotation ID to send email for
   * @returns SendEmailResponse with success status
   */
  const sendEmail = useCallback(async (quotationIdToSend: string): Promise<SendEmailResponse> => {
    setEmailStatus('sending');
    setEmailError(null);
    setEmailErrorCode(null);

    try {
      const result = await furnitureAPI.sendQuotationEmail(quotationIdToSend);

      if (result.success) {
        setEmailStatus('sent');
        return result;
      } else if (result.error?.code === 'EMAIL_RATE_LIMITED') {
        // _Requirements: 1.3_
        setEmailStatus('rate_limited');
        setEmailError(result.error.message);
        setEmailErrorCode(result.error.code);
        return result;
      } else if (result.error?.code === 'GMAIL_NOT_CONFIGURED') {
        // _Requirements: 6.2_
        setEmailStatus('error');
        setEmailError('Hệ thống email chưa được cấu hình. Vui lòng liên hệ bộ phận hỗ trợ.');
        setEmailErrorCode(result.error.code);
        return result;
      } else {
        // _Requirements: 3.4, 8.4_
        setEmailStatus('error');
        setEmailError(result.error?.message || 'Không thể gửi email. Vui lòng thử lại.');
        setEmailErrorCode(result.error?.code || 'EMAIL_SEND_FAILED');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi email';
      setEmailStatus('error');
      setEmailError(errorMessage);
      setEmailErrorCode('EMAIL_SEND_FAILED');
      return {
        success: false,
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: errorMessage,
        },
      };
    }
  }, []);

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
        
        // Send email after successful quotation creation
        // **Feature: furniture-quotation-email**
        // **Validates: Requirements 3.1**
        if (quotation.id && leadData.email) {
          // Trigger email send asynchronously (don't block the UI)
          sendEmail(quotation.id).then((emailResult) => {
            if (emailResult.success) {
              onSuccess('Báo giá đã được gửi đến email của bạn!');
            } else {
              // Email failed but quotation was created - show partial success
              onSuccess('Báo giá đã được tạo. Vui lòng kiểm tra email hoặc thử gửi lại.');
            }
          });
        } else {
          onSuccess('Báo giá đã được tạo thành công!');
        }
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
  }, [selections, fees, fitInFee, leadData, onError, onSuccess, sendEmail]);

  const resetQuotation = useCallback(() => {
    setQuotationResult(null);
    setQuotationId(null);
    setEmailStatus('idle');
    setEmailError(null);
    setEmailErrorCode(null);
  }, []);

  return {
    quotationResult,
    quotationId,
    submitting,
    emailStatus,
    emailError,
    emailErrorCode,
    calculateQuotation,
    sendEmail,
    getProductDisplayPrice,
    resetQuotation,
  };
}
