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
 * - Apply FIXED fees directly, PERCENTAGE fees as basePrice * value / 100
 * **Validates: Requirements 4.5, 7.6**
 */
const calculateQuotation = (
  items: QuotationItem[],
  fees: FurnitureFee[]
): QuotationResultData => {
  // Calculate base price
  const basePrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Filter active fees
  const applicableFees = fees.filter((fee) => fee.isActive);

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
          <i className="ri-settings-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
          Tùy chỉnh ({selections.products.length} sản phẩm)
        </div>
      </div>

      {/* Items List */}
      {selections.products.length > 0 && (
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
// Styled to match PDF layout
// ============================================

const SuccessView = memo(function SuccessView({
  quotationResult,
  selections,
  quotationId,
  onNewQuotation,
  onError,
}: {
  quotationResult: QuotationResultData;
  selections: QuotationSelections;
  quotationId: string | null;
  onNewQuotation: () => void;
  onError: (message: string) => void;
}) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const unitNumber = useMemo(() => {
    if (selections.building && selections.floor && selections.axis !== null) {
      return calculateUnitNumber(selections.building.code, selections.floor, selections.axis);
    }
    return '';
  }, [selections.building, selections.floor, selections.axis]);

  const handleDownloadPdf = useCallback(async () => {
    if (!quotationId) {
      onError('Không tìm thấy mã báo giá');
      return;
    }
    setDownloadingPdf(true);
    try {
      await furnitureAPI.downloadQuotationPdf(quotationId);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Không thể tải PDF');
    } finally {
      setDownloadingPdf(false);
    }
  }, [quotationId, onError]);

  // Build items for display
  const items = useMemo(() => {
    return selections.products.map((p) => ({
      name: p.product.name,
      price: p.product.price,
      quantity: p.quantity,
    }));
  }, [selections]);

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* PDF-like Quotation Card */}
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          overflow: 'hidden',
          marginBottom: '1.5rem',
        }}
      >
        {/* Header - Company & Document Info */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 700,
                color: tokens.color.primary,
                fontFamily: tokens.font.display,
              }}
            >
              ANH THỢ XÂY
            </h2>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: tokens.color.text,
              }}
            >
              BÁO GIÁ NỘI THẤT
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: tokens.color.muted }}>
              Ngày: {new Date().toLocaleDateString('vi-VN')}
            </p>
            {quotationId && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: tokens.color.muted }}>
                Mã: {quotationId.slice(-8).toUpperCase()}
              </p>
            )}
          </div>
        </div>

        {/* Apartment Info Section */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: `1px solid ${tokens.color.border}`,
          }}
        >
          <h3
            style={{
              margin: '0 0 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: tokens.color.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <i className="ri-building-line" style={{ marginRight: '0.5rem' }} />
            Thông tin căn hộ
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: tokens.color.muted }}>Chủ đầu tư</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 500, color: tokens.color.text }}>
                {selections.developer?.name}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: tokens.color.muted }}>Dự án</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 500, color: tokens.color.text }}>
                {selections.project?.name}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: tokens.color.muted }}>Tòa nhà</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 500, color: tokens.color.text }}>
                {selections.building?.name}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: tokens.color.muted }}>Số căn hộ</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 500, color: tokens.color.text }}>
                {unitNumber}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: tokens.color.muted }}>Loại căn hộ</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 500, color: tokens.color.text }}>
                {selections.apartmentTypeDetail?.apartmentType.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Selection Type Section */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: `1px solid ${tokens.color.border}`,
          }}
        >
          <h3
            style={{
              margin: '0 0 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: tokens.color.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <i className="ri-checkbox-circle-line" style={{ marginRight: '0.5rem' }} />
            Loại lựa chọn
          </h3>
          <p style={{ margin: 0, fontWeight: 500, color: tokens.color.text }}>
            <i className="ri-settings-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
            Tùy chọn sản phẩm ({selections.products.length} sản phẩm)
          </p>
        </div>

        {/* Items Table Section */}
        {items.length > 0 && (
          <div
            style={{
              padding: '1.5rem',
              borderBottom: `1px solid ${tokens.color.border}`,
            }}
          >
            <h3
              style={{
                margin: '0 0 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: tokens.color.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <i className="ri-list-check" style={{ marginRight: '0.5rem' }} />
              Sản phẩm đã chọn
            </h3>

            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 60px 100px 100px',
                gap: '0.5rem',
                padding: '0.75rem 0',
                borderBottom: `1px solid ${tokens.color.border}`,
                fontSize: '0.75rem',
                color: tokens.color.muted,
                fontWeight: 500,
              }}
            >
              <span>Sản phẩm</span>
              <span style={{ textAlign: 'right' }}>SL</span>
              <span style={{ textAlign: 'right' }}>Đơn giá</span>
              <span style={{ textAlign: 'right' }}>Thành tiền</span>
            </div>

            {/* Table Rows */}
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 100px 100px',
                  gap: '0.5rem',
                  padding: '0.75rem 0',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ color: tokens.color.text }}>{item.name}</span>
                <span style={{ textAlign: 'right', color: tokens.color.text }}>{item.quantity}</span>
                <span style={{ textAlign: 'right', color: tokens.color.muted }}>
                  {formatCurrency(item.price)}
                </span>
                <span style={{ textAlign: 'right', fontWeight: 600, color: tokens.color.text }}>
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Price Breakdown Section */}
        <div style={{ padding: '1.5rem' }}>
          <h3
            style={{
              margin: '0 0 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: tokens.color.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <i className="ri-money-dollar-circle-line" style={{ marginRight: '0.5rem' }} />
            Chi tiết giá
          </h3>

          <div style={{ maxWidth: '350px', marginLeft: 'auto' }}>
            {/* Base Price */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
              }}
            >
              <span style={{ color: tokens.color.muted }}>Giá cơ bản:</span>
              <span style={{ color: tokens.color.text }}>{formatCurrency(quotationResult.basePrice)}</span>
            </div>

            {/* Fees */}
            {quotationResult.fees.map((fee, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                }}
              >
                <span style={{ color: tokens.color.muted }}>
                  {fee.name}
                  {fee.type === 'PERCENTAGE' && ` (${fee.value}%)`}:
                </span>
                <span style={{ color: tokens.color.text }}>{formatCurrency(fee.amount)}</span>
              </div>
            ))}

            {/* Total */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1rem 0 0',
                marginTop: '0.5rem',
                borderTop: `2px solid ${tokens.color.primary}`,
              }}
            >
              <span style={{ fontWeight: 700, color: tokens.color.primary, fontSize: '1rem' }}>
                TỔNG CỘNG:
              </span>
              <span style={{ fontWeight: 700, color: tokens.color.primary, fontSize: '1.25rem' }}>
                {formatCurrency(quotationResult.totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: tokens.color.background,
            borderTop: `1px solid ${tokens.color.border}`,
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.75rem', color: tokens.color.muted }}>
            Báo giá này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo thời điểm và điều kiện cụ thể.
          </p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: tokens.color.muted }}>
            © ANH THỢ XÂY - Đối tác tin cậy cho ngôi nhà của bạn
          </p>
        </div>
      </div>

      {/* Success Message */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: `${tokens.color.success}15`,
          borderRadius: tokens.radius.md,
          border: `1px solid ${tokens.color.success}30`,
        }}
      >
        <i
          className="ri-checkbox-circle-fill"
          style={{ fontSize: '1.5rem', color: tokens.color.success, marginBottom: '0.5rem', display: 'block' }}
        />
        <p style={{ margin: 0, fontWeight: 600, color: tokens.color.text }}>
          Báo giá đã được tạo thành công!
        </p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: tokens.color.muted }}>
          Chúng tôi sẽ liên hệ với bạn sớm nhất
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {quotationId && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            style={{
              flex: 1,
              minWidth: '140px',
              padding: '0.875rem',
              borderRadius: tokens.radius.md,
              border: 'none',
              background: tokens.color.primary,
              color: '#111',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: downloadingPdf ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: downloadingPdf ? 0.7 : 1,
            }}
          >
            {downloadingPdf ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block' }}
                >
                  <i className="ri-loader-4-line" />
                </motion.span>
                Đang tải...
              </>
            ) : (
              <>
                <i className="ri-file-pdf-line" /> Tải PDF
              </>
            )}
          </motion.button>
        )}
        <button
          onClick={onNewQuotation}
          style={{
            flex: 1,
            minWidth: '140px',
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
  const [quotationId, setQuotationId] = useState<string | null>(null);

  // Fetch fees on mount
  // Requirements: 7.6 - Fetch applicable fees
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
  // Requirements: 7.6 - Calculate total using calculateQuotation logic
  useEffect(() => {
    if (!loading && selections.products.length > 0) {
      const items: QuotationItem[] = [];

      selections.products.forEach((p) => {
        items.push({
          productId: p.product.id,
          name: p.product.name,
          price: p.product.price,
          quantity: p.quantity,
        });
      });

      const result = calculateQuotation(items, fees);
      setQuotationResult(result);
    }
  }, [loading, fees, selections]);

  // Handle submit quotation
  // Requirements: 7.8 - Save quotation to database
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
      const items: QuotationItem[] = [];

      selections.products.forEach((p) => {
        items.push({
          productId: p.product.id,
          name: p.product.name,
          price: p.product.price,
          quantity: p.quantity,
        });
      });

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
        quotationId={quotationId}
        onNewQuotation={onComplete}
        onError={onError}
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
