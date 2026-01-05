/**
 * QuotationResultStep - Step 9: Quotation Result
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.4, 7.6, 7.7, 7.8**
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { furnitureAPI, ProductVariantForLanding } from '../../../api/furniture';
import type { Selections, QuotationResultData, SelectedProduct } from '../types';
import { formatCurrency, calculateUnitNumber } from '../constants';

interface QuotationResultStepProps {
  selections: Selections;
  quotationResult: QuotationResultData;
  quotationId: string | null;
  getProductDisplayPrice: (variant: ProductVariantForLanding, fitInSelected: boolean, quantity: number) => number;
  onReset: () => void;
}

export const QuotationResultStep = memo(function QuotationResultStep({
  selections,
  quotationResult,
  quotationId,
  getProductDisplayPrice,
  onReset,
}: QuotationResultStepProps) {
  const handleDownloadPDF = async () => {
    if (!quotationId) return;
    try {
      await furnitureAPI.downloadQuotationPdf(quotationId);
    } catch (err) {
      console.error('Download PDF error:', err);
    }
  };

  return (
    <motion.div
      key="step9"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Success Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <i
            className="ri-checkbox-circle-fill"
            style={{ fontSize: '2.5rem', color: tokens.color.primary }}
          />
        </motion.div>
        <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: tokens.color.text }}>
          Báo giá của bạn
        </h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: tokens.color.muted }}>
          Chúng tôi sẽ liên hệ với bạn sớm nhất
        </p>
      </div>

      {/* Quotation Card */}
      <QuotationCard
        selections={selections}
        quotationResult={quotationResult}
        quotationId={quotationId}
        getProductDisplayPrice={getProductDisplayPrice}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {quotationId && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPDF}
            style={{
              flex: 1,
              padding: '0.875rem',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.primary}`,
              background: 'transparent',
              color: tokens.color.primary,
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <i className="ri-download-line" />
            Tải PDF
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          style={{
            flex: 1,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: 'none',
            background: tokens.color.primary,
            color: '#111',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <i className="ri-refresh-line" />
          Báo giá mới
        </motion.button>
      </div>
    </motion.div>
  );
});

// Sub-component: QuotationCard
interface QuotationCardProps {
  selections: Selections;
  quotationResult: QuotationResultData;
  quotationId: string | null;
  getProductDisplayPrice: (variant: ProductVariantForLanding, fitInSelected: boolean, quantity: number) => number;
}

const QuotationCard = memo(function QuotationCard({
  selections,
  quotationResult,
  quotationId,
  getProductDisplayPrice,
}: QuotationCardProps) {
  return (
    <div
      style={{
        borderRadius: tokens.radius.md,
        background: tokens.color.background,
        border: `1px solid ${tokens.color.border}`,
        overflow: 'hidden',
        marginBottom: '1rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: `1px solid ${tokens.color.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: tokens.color.primary, fontSize: '1.25rem', fontFamily: 'serif' }}>
            ANH THỢ XÂY
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: tokens.color.text, marginTop: '0.25rem' }}>
            BÁO GIÁ NỘI THẤT
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: tokens.color.muted }}>
          <div>Ngày: <span style={{ color: tokens.color.primary }}>{new Date().toLocaleDateString('vi-VN')}</span></div>
          {quotationId && <div>Mã: <span style={{ color: tokens.color.primary }}>{quotationId.slice(-8).toUpperCase()}</span></div>}
        </div>
      </div>

      {/* Apartment Info */}
      <ApartmentInfo selections={selections} />

      {/* Selection Type */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${tokens.color.border}` }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: tokens.color.primary, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <i className="ri-checkbox-circle-line" style={{ marginRight: '0.35rem' }} />
          NỘI THẤT ĐÃ CHỌN
        </div>
        <div style={{ fontSize: '0.85rem', color: tokens.color.text }}>
          <span><i className="ri-sofa-line" style={{ marginRight: '0.35rem', color: tokens.color.primary }} />{selections.products.length} sản phẩm</span>
        </div>
      </div>

      {/* Products Table */}
      {selections.products.length > 0 && (
        <ProductsTable products={selections.products} getProductDisplayPrice={getProductDisplayPrice} />
      )}

      {/* Price Details */}
      <PriceDetails quotationResult={quotationResult} />

      {/* Footer Note */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          background: tokens.color.surface,
          borderTop: `1px solid ${tokens.color.border}`,
          textAlign: 'center',
          fontSize: '0.7rem',
          color: tokens.color.muted,
          fontStyle: 'italic',
        }}
      >
        Báo giá này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo thời điểm và điều kiện cụ thể.
      </div>
    </div>
  );
});

const ApartmentInfo = memo(function ApartmentInfo({ selections }: { selections: Selections }) {
  return (
    <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${tokens.color.border}` }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: tokens.color.primary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <i className="ri-building-line" style={{ marginRight: '0.35rem' }} />
        THÔNG TIN CĂN HỘ
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: tokens.color.muted }}>Chủ đầu tư:</span>
          <span style={{ color: tokens.color.primary, fontWeight: 500 }}>{selections.developer?.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: tokens.color.muted }}>Dự án:</span>
          <span style={{ color: tokens.color.primary, fontWeight: 500 }}>{selections.project?.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: tokens.color.muted }}>Tòa nhà:</span>
          <span style={{ color: tokens.color.primary, fontWeight: 500 }}>{selections.building?.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: tokens.color.muted }}>Căn hộ:</span>
          <span style={{ color: tokens.color.primary, fontWeight: 500 }}>
            {selections.floor && selections.axis !== null && selections.building && 
              calculateUnitNumber(selections.building.code, selections.floor, selections.axis)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: tokens.color.muted }}>Loại:</span>
          <span style={{ color: tokens.color.primary, fontWeight: 500 }}>{selections.apartmentTypeDetail?.apartmentType.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
});

interface ProductsTableProps {
  products: SelectedProduct[];
  getProductDisplayPrice: (variant: ProductVariantForLanding, fitInSelected: boolean, quantity: number) => number;
}

const ProductsTable = memo(function ProductsTable({ products, getProductDisplayPrice }: ProductsTableProps) {
  return (
    <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${tokens.color.border}` }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: tokens.color.primary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <i className="ri-list-check" style={{ marginRight: '0.35rem' }} />
        SẢN PHẨM ĐÃ CHỌN
      </div>
      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 50px 90px 100px',
          gap: '0.5rem',
          padding: '0.5rem 0',
          borderBottom: `1px solid ${tokens.color.border}`,
          fontSize: '0.7rem',
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
      {products.map((item) => {
        const itemTotal = getProductDisplayPrice(item.variant, item.fitInSelected, item.quantity);
        return (
          <div
            key={item.variant.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 50px 90px 100px',
              gap: '0.5rem',
              padding: '0.6rem 0',
              borderBottom: `1px dashed ${tokens.color.border}`,
              fontSize: '0.8rem',
            }}
          >
            <div style={{ color: tokens.color.text }}>
              <div>{item.productName}</div>
              <div style={{ fontSize: '0.7rem', color: tokens.color.muted }}>
                {item.variant.materialName}
                {item.fitInSelected && (
                  <span style={{ marginLeft: '0.25rem', color: tokens.color.primary }}>+ Fit-in</span>
                )}
              </div>
            </div>
            <span style={{ textAlign: 'right', color: tokens.color.text }}>x{item.quantity}</span>
            <span style={{ textAlign: 'right', color: tokens.color.muted }}>{formatCurrency(item.variant.calculatedPrice)}</span>
            <span style={{ textAlign: 'right', color: tokens.color.primary, fontWeight: 600 }}>
              {formatCurrency(itemTotal)}
            </span>
          </div>
        );
      })}
    </div>
  );
});

const PriceDetails = memo(function PriceDetails({ quotationResult }: { quotationResult: QuotationResultData }) {
  return (
    <div style={{ padding: '1rem 1.25rem' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: tokens.color.primary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <i className="ri-money-dollar-circle-line" style={{ marginRight: '0.35rem' }} />
        CHI TIẾT GIÁ
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: tokens.color.muted }}>Giá nội thất:</span>
          <span style={{ color: tokens.color.text, fontWeight: 500 }}>{formatCurrency(quotationResult.basePrice)} đ</span>
        </div>
        {quotationResult.fitInFeesTotal && quotationResult.fitInFeesTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: tokens.color.muted }}>Phí Fit-in:</span>
            <span style={{ color: tokens.color.text, fontWeight: 500 }}>{formatCurrency(quotationResult.fitInFeesTotal)} đ</span>
          </div>
        )}
        {quotationResult.fees.map((fee, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: tokens.color.muted }}>
              {fee.name}{fee.type === 'PERCENTAGE' ? ` (${fee.value}%)` : ''}:
            </span>
            <span style={{ color: tokens.color.text, fontWeight: 500 }}>{formatCurrency(fee.amount)} đ</span>
          </div>
        ))}
        {/* Total */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.75rem',
            marginTop: '0.5rem',
            borderTop: `2px solid ${tokens.color.primary}`,
          }}
        >
          <span style={{ fontWeight: 700, color: tokens.color.primary, fontSize: '0.9rem' }}>TỔNG CỘNG:</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 700, color: tokens.color.primary }}>
            {formatCurrency(quotationResult.totalPrice)} đ
          </span>
        </div>
      </div>
    </div>
  );
});
