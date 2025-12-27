/**
 * QuotationResult Component - Step 7 for displaying quotation results
 * Feature: furniture-quotation
 * Requirements: 7.6, 7.7, 7.8, 11.2
 */

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import {
  furnitureAPI,
  FurnitureFee,
  FurnitureCombo,
  FurnitureProduct,
  QuotationItem,
  FeeBreakdown,
} from '../../api/furniture';

// ============================================
// TYPES
// ============================================

export interface SelectedProduct {
  product: FurnitureProduct;
  quantity: number;
}

export interface QuotationSelections {
  developer: { id: string; name: string } | null;
  project: { id: string; name: string; code: string } | null;
  building: { id: string; name: string; code: string; maxFloor: number; maxAxis: number } | null;
  floor: number | null;
  axis: number | null;
  layout: { id: string; apartmentType: string } | null;
  apartmentTypeDetail: { id: string; apartmentType: string; imageUrl: string | null; description: string | null } | null;
  selectionType: 'COMBO' | 'CUSTOM' | null;
  combo: FurnitureCombo | null;
  products: SelectedProduct[];
}

export interface LeadData {
  name: string;
  phone: string;
  email?: string;
}

export interface QuotationResultProps {
  selections: QuotationSelections;
  leadData: LeadData;
  onComplete: () => void;
  onBack: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export interface QuotationResultData {
  basePrice: number;
  fees: FeeBreakdown[];
  totalPrice: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format currency in Vietnamese format
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Calculate unit number from building code, floor, and axis
 * Format: {buildingCode}.{floor padded to 2 digits}{axis padded to 2 digits}
 * **Validates: Requirements 6.5**
 */
const calculateUnitNumber = (buildingCode: string, floor: number, axis: number): string => {
  return `${buildingCode}.${floor.toString().padStart(2, '0')}${axis.toString().padStart(2, '0')}`;
};

/**
 * Calculate quotation pricing
 * - basePrice = sum of item prices * quantities
 * - Filter fees by applicability matching selectionType
 * - Apply FIXED fees directly, PERCENTAGE fees as basePrice * value / 100
 * **Validates: Requirements 4.5, 7.6**
 */
const calculateQuotation = (
  items: QuotationItem[],
  fees: FurnitureFee[],
  selectionType: 'COMBO' | 'CUSTOM'
): QuotationResultData => {
  // Calculate base price
  const basePrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Filter applicable fees
  const applicableFees = fees.filter(
    (fee) => fee.applicability === 'BOTH' || fee.applicability === selectionType
  );

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

  // Calculate total
  const totalFees = feesBreakdown.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPrice = basePrice + totalFees;

  return {
    basePrice,
    fees: feesBreakdown,
    totalPrice,
  };
};

// ============================================
// NAVIGATION BUTTONS COMPONENT
// ============================================

const NavigationButtons = memo(function NavigationButtons({
  onBack,
  onNext,
  backLabel = 'Quay lại',
  nextLabel = 'Tiếp tục',
  nextDisabled = false,
  showBack = true,
  loading = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
  loading?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
      {showBack && onBack && (
        <button
          onClick={onBack}
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: 'transparent',
            color: tokens.color.text,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <i className="ri-arrow-left-line" /> {backLabel}
        </button>
      )}
      {onNext && (
        <motion.button
          whileHover={!nextDisabled && !loading ? { scale: 1.02 } : {}}
          whileTap={!nextDisabled && !loading ? { scale: 0.98 } : {}}
          onClick={onNext}
          disabled={nextDisabled || loading}
          style={{
            flex: 2,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: 'none',
            background: nextDisabled || loading ? tokens.color.muted : tokens.color.primary,
            color: nextDisabled || loading ? tokens.color.text : '#111',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: nextDisabled || loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: nextDisabled || loading ? 0.5 : 1,
          }}
        >
          {loading ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block' }}
              >
                <i className="ri-loader-4-line" />
              </motion.span>
              Đang xử lý...
            </>
          ) : (
            <>
              {nextLabel} <i className="ri-arrow-right-line" />
            </>
          )}
        </motion.button>
      )}
    </div>
  );
});

// ============================================
// QUOTATION PREVIEW COMPONENT
// Requirements: 7.7 - Display itemized breakdown
// ============================================

const QuotationPreview = memo(function QuotationPreview({
  selections,
  quotationResult,
}: {
  selections: QuotationSelections;
  quotationResult: QuotationResultData;
}) {
  const unitNumber = useMemo(() => {
    if (selections.building && selections.floor && selections.axis !== null) {
      return calculateUnitNumber(selections.building.code, selections.floor, selections.axis);
    }
    return '';
  }, [selections.building, selections.floor, selections.axis]);

  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: tokens.radius.md,
        background: tokens.color.background,
        marginBottom: '1.5rem',
      }}
    >
      {/* Apartment Info */}
      <div
        style={{
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: `1px solid ${tokens.color.border}`,
        }}
      >
        <div style={{ fontSize: '0.875rem', color: tokens.color.muted }}>Căn hộ</div>
        <div style={{ fontWeight: 600, color: tokens.color.text }}>
          {selections.building?.name} - {unitNumber}
        </div>
        <div style={{ fontSize: '0.875rem', color: tokens.color.muted }}>
          {selections.apartmentTypeDetail?.apartmentType.toUpperCase()}
        </div>
      </div>

      {/* Selection Type */}
      <div
        style={{
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: `1px solid ${tokens.color.border}`,
        }}
      >
        <div style={{ fontSize: '0.875rem', color: tokens.color.muted }}>Loại nội thất</div>
        <div style={{ fontWeight: 600, color: tokens.color.text }}>
          {selections.selectionType === 'COMBO' ? (
            <>
              <i className="ri-gift-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
              Combo: {selections.combo?.name}
            </>
          ) : (
            <>
              <i className="ri-settings-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
              Tùy chỉnh ({selections.products.length} sản phẩm)
            </>
          )}
        </div>
      </div>

      {/* Items List (for Custom selection) */}
      {selections.selectionType === 'CUSTOM' && selections.products.length > 0 && (
        <div
          style={{
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: `1px solid ${tokens.color.border}`,
          }}
        >
          <div style={{ fontSize: '0.875rem', color: tokens.color.muted, marginBottom: '0.5rem' }}>
            Chi tiết sản phẩm
          </div>
          {selections.products.map((item) => (
            <div
              key={item.product.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {item.product.imageUrl && (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: tokens.radius.sm,
                      background: `url(${resolveMediaUrl(item.product.imageUrl)}) center/cover`,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div>
                  <div style={{ fontSize: '0.875rem', color: tokens.color.text }}>
                    {item.product.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: tokens.color.muted }}>
                    {formatCurrency(item.product.price)} x {item.quantity}
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 600, color: tokens.color.text }}>
                {formatCurrency(item.product.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: tokens.color.muted }}>Giá nội thất</span>
          <span style={{ fontWeight: 600, color: tokens.color.text }}>
            {formatCurrency(quotationResult.basePrice)}
          </span>
        </div>
        {quotationResult.fees.map((fee, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: tokens.color.muted }}>
              {fee.name} {fee.type === 'PERCENTAGE' && `(${fee.value}%)`}
            </span>
            <span style={{ color: tokens.color.text }}>{formatCurrency(fee.amount)}</span>
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '0.75rem',
            marginTop: '0.5rem',
            borderTop: `2px solid ${tokens.color.border}`,
          }}
        >
          <span style={{ fontWeight: 700, color: tokens.color.text }}>Tổng cộng</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: tokens.color.primary }}>
            {formatCurrency(quotationResult.totalPrice)}
          </span>
        </div>
      </div>
    </div>
  );
});

// ============================================
// SUCCESS VIEW COMPONENT
// ============================================

const SuccessView = memo(function SuccessView({
  quotationResult,
  selections,
  onNewQuotation,
}: {
  quotationResult: QuotationResultData;
  selections: QuotationSelections;
  onNewQuotation: () => void;
}) {
  const unitNumber = useMemo(() => {
    if (selections.building && selections.floor && selections.axis !== null) {
      return calculateUnitNumber(selections.building.code, selections.floor, selections.axis);
    }
    return '';
  }, [selections.building, selections.floor, selections.axis]);

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <i
            className="ri-checkbox-circle-fill"
            style={{ fontSize: '4rem', color: tokens.color.primary }}
          />
        </motion.div>
        <h3
          style={{
            margin: '1rem 0 0.5rem',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: tokens.color.text,
          }}
        >
          Báo giá của bạn
        </h3>
        <p style={{ color: tokens.color.muted, margin: 0 }}>
          Chúng tôi sẽ liên hệ với bạn sớm nhất
        </p>
      </div>

      {/* Summary */}
      <div
        style={{
          padding: '1.5rem',
          borderRadius: tokens.radius.md,
          background: tokens.color.background,
          marginBottom: '1.5rem',
        }}
      >
        {/* Apartment Info */}
        <div
          style={{
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: `1px solid ${tokens.color.border}`,
          }}
        >
          <div style={{ fontSize: '0.875rem', color: tokens.color.muted }}>Căn hộ</div>
          <div style={{ fontWeight: 600, color: tokens.color.text }}>
            {selections.building?.name} - {unitNumber}
          </div>
          <div style={{ fontSize: '0.875rem', color: tokens.color.muted }}>
            {selections.apartmentTypeDetail?.apartmentType.toUpperCase()}
          </div>
        </div>

        {/* Price Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: tokens.color.muted }}>Giá nội thất</span>
            <span style={{ fontWeight: 600, color: tokens.color.text }}>
              {formatCurrency(quotationResult.basePrice)}
            </span>
          </div>
          {quotationResult.fees.map((fee, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.color.muted }}>
                {fee.name} {fee.type === 'PERCENTAGE' && `(${fee.value}%)`}
              </span>
              <span style={{ color: tokens.color.text }}>{formatCurrency(fee.amount)}</span>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              marginTop: '0.5rem',
              borderTop: `2px solid ${tokens.color.border}`,
            }}
          >
            <span style={{ fontWeight: 700, color: tokens.color.text }}>Tổng cộng</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: tokens.color.primary }}>
              {formatCurrency(quotationResult.totalPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onNewQuotation}
          style={{
            flex: 1,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: 'transparent',
            color: tokens.color.text,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <i className="ri-refresh-line" /> Báo giá mới
        </button>
      </div>
    </motion.div>
  );
});

// ============================================
// MAIN QUOTATION RESULT COMPONENT
// Requirements: 7.6, 7.7, 7.8
// ============================================

export const QuotationResult = memo(function QuotationResult({
  selections,
  leadData,
  onComplete,
  onBack,
  onError,
  onSuccess,
}: QuotationResultProps) {
  // State
  const [fees, setFees] = useState<FurnitureFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quotationResult, setQuotationResult] = useState<QuotationResultData | null>(null);

  // Fetch fees on mount
  // Requirements: 7.6 - Fetch applicable fees
  useEffect(() => {
    if (selections.selectionType) {
      setLoading(true);
      furnitureAPI
        .getFees(selections.selectionType)
        .then(setFees)
        .catch((err) => {
          onError(err instanceof Error ? err.message : 'Không thể tải danh sách phí');
        })
        .finally(() => setLoading(false));
    }
  }, [selections.selectionType, onError]);

  // Calculate quotation when fees are loaded
  // Requirements: 7.6 - Calculate total using calculateQuotation logic
  useEffect(() => {
    if (!loading && selections.selectionType) {
      const items: QuotationItem[] = [];

      if (selections.selectionType === 'COMBO' && selections.combo) {
        items.push({
          productId: selections.combo.id,
          name: selections.combo.name,
          price: selections.combo.price,
          quantity: 1,
        });
      } else if (selections.selectionType === 'CUSTOM') {
        selections.products.forEach((p) => {
          items.push({
            productId: p.product.id,
            name: p.product.name,
            price: p.product.price,
            quantity: p.quantity,
          });
        });
      }

      const result = calculateQuotation(items, fees, selections.selectionType);
      setQuotationResult(result);
    }
  }, [loading, fees, selections]);

  // Handle submit quotation
  // Requirements: 7.8 - Save quotation to database
  const handleSubmit = useCallback(async () => {
    if (!selections.selectionType || !quotationResult) {
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
      const items: QuotationItem[] = [];

      if (selections.selectionType === 'COMBO' && selections.combo) {
        items.push({
          productId: selections.combo.id,
          name: selections.combo.name,
          price: selections.combo.price,
          quantity: 1,
        });
      } else {
        selections.products.forEach((p) => {
          items.push({
            productId: p.product.id,
            name: p.product.name,
            price: p.product.price,
            quantity: p.quantity,
          });
        });
      }

      // Create quotation via API
      // Requirements: 7.8, 11.2 - Include all required fields
      await furnitureAPI.createQuotation({
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
        selectionType: selections.selectionType,
        comboId: selections.combo?.id,
        comboName: selections.combo?.name,
        items,
      });

      setSubmitted(true);
      onSuccess('Báo giá đã được tạo thành công!');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo báo giá');
    } finally {
      setSubmitting(false);
    }
  }, [selections, quotationResult, leadData, onError, onSuccess]);

  // Loading state
  if (loading) {
    return (
      <motion.div
        key="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: `${tokens.color.border} ${tokens.color.border} ${tokens.color.border} ${tokens.color.primary}`,
          }}
        />
      </motion.div>
    );
  }

  // Success state
  if (submitted && quotationResult) {
    return (
      <SuccessView
        quotationResult={quotationResult}
        selections={selections}
        onNewQuotation={onComplete}
      />
    );
  }

  // Preview state
  return (
    <motion.div
      key="quotation-result"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Header */}
      <h3
        style={{
          margin: '0 0 0.5rem',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: tokens.color.text,
        }}
      >
        <i className="ri-file-list-3-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
        Xác nhận báo giá
      </h3>
      <p
        style={{
          margin: '0 0 1.5rem',
          fontSize: '0.875rem',
          color: tokens.color.muted,
        }}
      >
        Vui lòng kiểm tra thông tin trước khi xác nhận
      </p>

      {/* Quotation Preview */}
      {quotationResult && (
        <QuotationPreview selections={selections} quotationResult={quotationResult} />
      )}

      {/* Navigation Buttons */}
      <NavigationButtons
        onBack={onBack}
        onNext={handleSubmit}
        nextLabel="Xác nhận báo giá"
        nextDisabled={!quotationResult}
        showBack={true}
        loading={submitting}
      />
    </motion.div>
  );
});

export default QuotationResult;
