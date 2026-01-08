/**
 * SuccessView Component - Styled to match PDF layout
 * Feature: furniture-quotation
 * Requirements: 7.7, 8.4
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { furnitureAPI } from '../../../api/furniture';
import { QuotationSelections, QuotationResultData } from './types';
import { formatCurrency, calculateUnitNumber } from './utils';

// ============================================
// SUCCESS VIEW COMPONENT
// Styled to match PDF layout
// ============================================

interface SuccessViewProps {
  quotationResult: QuotationResultData;
  selections: QuotationSelections;
  quotationId: string | null;
  onNewQuotation: () => void;
  onError: (message: string) => void;
}

export const SuccessView = memo(function SuccessView({
  quotationResult,
  selections,
  quotationId,
  onNewQuotation,
  onError,
}: SuccessViewProps) {
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
              NỘI THẤT NHANH
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
        <ApartmentInfoSection selections={selections} unitNumber={unitNumber} />

        {/* Selection Type Section */}
        <SelectionTypeSection productCount={selections.products.length} />

        {/* Items Table Section */}
        {items.length > 0 && <ItemsTableSection items={items} />}

        {/* Price Breakdown Section */}
        <PriceBreakdownSection quotationResult={quotationResult} />

        {/* Footer Note */}
        <FooterNote />
      </div>

      {/* Success Message */}
      <SuccessMessage />

      {/* Actions */}
      <ActionButtons
        quotationId={quotationId}
        downloadingPdf={downloadingPdf}
        onDownloadPdf={handleDownloadPdf}
        onNewQuotation={onNewQuotation}
      />
    </motion.div>
  );
});

// ============================================
// SUB-COMPONENTS
// ============================================

const ApartmentInfoSection = memo(function ApartmentInfoSection({
  selections,
  unitNumber,
}: {
  selections: QuotationSelections;
  unitNumber: string;
}) {
  return (
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
        <InfoItem label="Chủ đầu tư" value={selections.developer?.name} />
        <InfoItem label="Dự án" value={selections.project?.name} />
        <InfoItem label="Tòa nhà" value={selections.building?.name} />
        <InfoItem label="Số căn hộ" value={unitNumber} />
        <InfoItem label="Loại căn hộ" value={selections.apartmentTypeDetail?.apartmentType.toUpperCase()} />
      </div>
    </div>
  );
});

const InfoItem = memo(function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span style={{ fontSize: '0.75rem', color: tokens.color.muted }}>{label}</span>
      <p style={{ margin: '0.25rem 0 0', fontWeight: 500, color: tokens.color.text }}>
        {value || '-'}
      </p>
    </div>
  );
});

const SelectionTypeSection = memo(function SelectionTypeSection({ productCount }: { productCount: number }) {
  return (
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
        Tùy chọn sản phẩm ({productCount} sản phẩm)
      </p>
    </div>
  );
});

const ItemsTableSection = memo(function ItemsTableSection({
  items,
}: {
  items: Array<{ name: string; price: number; quantity: number }>;
}) {
  return (
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
  );
});

const PriceBreakdownSection = memo(function PriceBreakdownSection({
  quotationResult,
}: {
  quotationResult: QuotationResultData;
}) {
  return (
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
        <PriceRow label="Giá nội thất:" value={quotationResult.basePrice} />

        {/* Fit-in Fees Total */}
        {quotationResult.fitInFeesTotal && quotationResult.fitInFeesTotal > 0 && (
          <PriceRow label="Phí Fit-in:" value={quotationResult.fitInFeesTotal} />
        )}

        {/* Other Fees */}
        {quotationResult.fees.map((fee, idx) => (
          <PriceRow
            key={idx}
            label={`${fee.name}${fee.type === 'PERCENTAGE' ? ` (${fee.value}%)` : ''}:`}
            value={fee.amount}
          />
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
  );
});

const PriceRow = memo(function PriceRow({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.5rem 0',
      }}
    >
      <span style={{ color: tokens.color.muted }}>{label}</span>
      <span style={{ color: tokens.color.text }}>{formatCurrency(value)}</span>
    </div>
  );
});

const FooterNote = memo(function FooterNote() {
  return (
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
        © NỘI THẤT NHANH - Đối tác tin cậy cho ngôi nhà của bạn
      </p>
    </div>
  );
});

const SuccessMessage = memo(function SuccessMessage() {
  return (
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
  );
});

const ActionButtons = memo(function ActionButtons({
  quotationId,
  downloadingPdf,
  onDownloadPdf,
  onNewQuotation,
}: {
  quotationId: string | null;
  downloadingPdf: boolean;
  onDownloadPdf: () => void;
  onNewQuotation: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      {quotationId && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDownloadPdf}
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
  );
});

export default SuccessView;
