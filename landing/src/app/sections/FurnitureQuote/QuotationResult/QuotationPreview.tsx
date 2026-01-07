/**
 * QuotationPreview Component
 * Feature: furniture-quotation
 * Requirements: 7.7 - Display itemized breakdown
 */

import { memo, useMemo } from 'react';
import { tokens, resolveMediaUrl } from '@app/shared';
import { QuotationSelections, QuotationResultData } from './types';
import { formatCurrency, calculateUnitNumber } from './utils';

// ============================================
// QUOTATION PREVIEW COMPONENT
// Requirements: 7.7 - Display itemized breakdown
// ============================================

interface QuotationPreviewProps {
  selections: QuotationSelections;
  quotationResult: QuotationResultData;
}

export const QuotationPreview = memo(function QuotationPreview({
  selections,
  quotationResult,
}: QuotationPreviewProps) {
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

export default QuotationPreview;
