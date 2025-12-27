/**
 * PdfPreview - Live preview component for PDF settings
 * Renders a visual representation of how the PDF will look
 * Similar to SectionEditor preview pattern
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import type { FurniturePdfSettings } from '../types';

interface PdfPreviewProps {
  settings: FurniturePdfSettings;
}

// Sample data for preview
const SAMPLE_DATA = {
  developerName: 'Vingroup',
  projectName: 'Vinhomes Grand Park',
  buildingName: 'Tòa S1.01',
  unitNumber: 'S1.01.1205',
  apartmentType: '2PN',
  items: [
    { name: 'Sofa góc L', quantity: 1, price: 15000000 },
    { name: 'Bàn trà kính', quantity: 1, price: 3500000 },
    { name: 'Giường ngủ 1m8', quantity: 1, price: 12000000 },
    { name: 'Tủ quần áo 4 cánh', quantity: 1, price: 8500000 },
  ],
  basePrice: 39000000,
  fees: [
    { name: 'Phí vận chuyển', type: 'FIXED' as const, value: 500000, amount: 500000 },
    { name: 'Phí lắp đặt', type: 'PERCENTAGE' as const, value: 5, amount: 1950000 },
  ],
  totalPrice: 41450000,
  createdAt: new Date().toISOString(),
};

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

export function PdfPreview({ settings }: PdfPreviewProps) {
  const [scale, setScale] = useState(1);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + settings.validityDays);

  return (
    <div
      style={{
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.color.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Preview Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${tokens.color.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <span style={{ color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>
          <i className="ri-file-pdf-line" style={{ marginRight: 6 }} />
          Live Preview (A4)
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              border: `1px solid ${tokens.color.border}`,
              background: 'transparent',
              color: tokens.color.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            <i className="ri-subtract-line" />
          </motion.button>
          <span style={{ color: tokens.color.text, fontSize: 12, minWidth: 40, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setScale(Math.min(1.5, scale + 0.1))}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              border: `1px solid ${tokens.color.border}`,
              background: 'transparent',
              color: tokens.color.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            <i className="ri-add-line" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setScale(1)}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: `1px solid ${tokens.color.border}`,
              background: 'transparent',
              color: tokens.color.muted,
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Reset
          </motion.button>
        </div>
      </div>

      {/* Preview Content */}
      <div
        style={{
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 16,
          background: 'rgba(0,0,0,0.3)',
        }}
      >
        <motion.div
          animate={{ scale }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            transformOrigin: 'top center',
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
        >
          {/* A4 Preview Container */}
          <div
            style={{
              width: '100%',
              aspectRatio: '210 / 297',
              padding: '40px 35px',
              boxSizing: 'border-box',
              fontFamily: '"Noto Sans", Arial, sans-serif',
              fontSize: settings.bodyTextSize * 0.8,
              color: settings.textColor,
              position: 'relative',
            }}
          >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  fontSize: settings.companyNameSize * 0.8,
                  fontWeight: 700,
                  color: settings.primaryColor,
                  marginBottom: 4,
                }}
              >
                {settings.companyName}
              </div>
              <div
                style={{
                  fontSize: settings.documentTitleSize * 0.8,
                  fontWeight: 600,
                  color: settings.textColor,
                }}
              >
                {settings.documentTitle}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: settings.bodyTextSize * 0.7, color: settings.mutedColor }}>
              <div>Ngày: {new Date().toLocaleDateString('vi-VN')}</div>
              {settings.showQuotationCode && <div>Mã: ABCD1234</div>}
            </div>
          </div>
          <div
            style={{
              height: 1,
              background: settings.borderColor,
              marginTop: 12,
            }}
          />
        </div>

        {/* Apartment Info */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: settings.sectionTitleSize * 0.8,
              fontWeight: 600,
              color: settings.primaryColor,
              marginBottom: 8,
            }}
          >
            {settings.apartmentInfoTitle}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '4px 8px', fontSize: settings.bodyTextSize * 0.7 }}>
            <span style={{ color: settings.mutedColor }}>Chủ đầu tư:</span>
            <span>{SAMPLE_DATA.developerName}</span>
            <span style={{ color: settings.mutedColor }}>Dự án:</span>
            <span>{SAMPLE_DATA.projectName}</span>
            <span style={{ color: settings.mutedColor }}>Tòa nhà:</span>
            <span>{SAMPLE_DATA.buildingName}</span>
            <span style={{ color: settings.mutedColor }}>Số căn hộ:</span>
            <span>{SAMPLE_DATA.unitNumber}</span>
            <span style={{ color: settings.mutedColor }}>Loại căn hộ:</span>
            <span>{SAMPLE_DATA.apartmentType}</span>
          </div>
        </div>

        {/* Selection Type */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: settings.sectionTitleSize * 0.8,
              fontWeight: 600,
              color: settings.primaryColor,
              marginBottom: 8,
            }}
          >
            {settings.selectionTypeTitle}
          </div>
          <div style={{ fontSize: settings.bodyTextSize * 0.7 }}>
            <div>Tự chọn sản phẩm</div>
          </div>
        </div>

        {/* Products Table */}
        {settings.showItemsTable && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: settings.sectionTitleSize * 0.8,
                fontWeight: 600,
                color: settings.primaryColor,
                marginBottom: 8,
              }}
            >
              {settings.productsTitle}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: settings.bodyTextSize * 0.65 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${settings.borderColor}` }}>
                  <th style={{ textAlign: 'left', padding: '4px 0', color: settings.mutedColor, fontWeight: 500 }}>Sản phẩm</th>
                  <th style={{ textAlign: 'right', padding: '4px 0', color: settings.mutedColor, fontWeight: 500, width: 40 }}>SL</th>
                  <th style={{ textAlign: 'right', padding: '4px 0', color: settings.mutedColor, fontWeight: 500, width: 70 }}>Đơn giá</th>
                  <th style={{ textAlign: 'right', padding: '4px 0', color: settings.mutedColor, fontWeight: 500, width: 70 }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_DATA.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '3px 0' }}>{item.name}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatCurrency(item.price)}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Price Details */}
        {settings.showFeeDetails && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: settings.sectionTitleSize * 0.8,
                fontWeight: 600,
                color: settings.primaryColor,
                marginBottom: 8,
              }}
            >
              {settings.priceDetailsTitle}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: settings.bodyTextSize * 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: 200, marginBottom: 4 }}>
                <span style={{ color: settings.mutedColor }}>Giá cơ bản:</span>
                <span>{formatCurrency(SAMPLE_DATA.basePrice)} VNĐ</span>
              </div>
              {SAMPLE_DATA.fees.map((fee, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', width: 200, marginBottom: 4 }}>
                  <span style={{ color: settings.mutedColor }}>
                    {fee.name}{fee.type === 'PERCENTAGE' ? ` (${fee.value}%)` : ''}:
                  </span>
                  <span>{formatCurrency(fee.amount)} VNĐ</span>
                </div>
              ))}
              <div style={{ height: 1, background: settings.borderColor, width: 200, margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', width: 200 }}>
                <span style={{ fontWeight: 600, color: settings.primaryColor }}>{settings.totalLabel}:</span>
                <span style={{ fontWeight: 700, color: settings.primaryColor, fontSize: settings.bodyTextSize * 0.85 }}>
                  {formatCurrency(SAMPLE_DATA.totalPrice)} VNĐ
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Contact Info */}
        {settings.showContactInfo && (settings.contactPhone || settings.contactEmail || settings.contactAddress || settings.contactWebsite) && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: settings.sectionTitleSize * 0.8,
                fontWeight: 600,
                color: settings.primaryColor,
                marginBottom: 8,
              }}
            >
              {settings.contactInfoTitle}
            </div>
            <div style={{ fontSize: settings.bodyTextSize * 0.7 }}>
              {settings.contactPhone && <div>Điện thoại: {settings.contactPhone}</div>}
              {settings.contactEmail && <div>Email: {settings.contactEmail}</div>}
              {settings.contactAddress && <div>Địa chỉ: {settings.contactAddress}</div>}
              {settings.contactWebsite && <div>Website: {settings.contactWebsite}</div>}
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {settings.additionalNotes && (
          <div style={{ marginBottom: 12, fontSize: settings.bodyTextSize * 0.7, color: settings.mutedColor }}>
            {settings.additionalNotes}
          </div>
        )}

        {/* Validity Date */}
        {settings.showValidityDate && settings.validityDays > 0 && (
          <div style={{ textAlign: 'center', fontSize: settings.footerTextSize * 0.8, color: settings.mutedColor, marginBottom: 8 }}>
            Báo giá có hiệu lực đến: {validUntil.toLocaleDateString('vi-VN')}
          </div>
        )}

            {/* Footer */}
            <div
              style={{
                position: 'absolute',
                bottom: 30,
                left: 35,
                right: 35,
                textAlign: 'center',
                fontSize: settings.footerTextSize * 0.8,
                color: settings.mutedColor,
              }}
            >
              <div style={{ marginBottom: 4 }}>{settings.footerNote}</div>
              <div>{settings.footerCopyright}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default PdfPreview;
