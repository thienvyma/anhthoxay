import { useState } from 'react';
import { tokens } from '@app/shared';
import { Button } from '../../../components/Button';
import { furnitureQuotationsApi } from '../../../api/furniture';
import type { FurnitureQuotationHistoryProps } from '../types';

/**
 * FurnitureQuotationHistory - Displays list of furniture quotations for a lead
 * Requirements: 8.1, 8.3, 11.3
 */
export function FurnitureQuotationHistory({ quotations, loading }: FurnitureQuotationHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null);
  
  // Handle PDF export
  const handleExportPdf = async (quotationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent expanding/collapsing
    setExportingPdfId(quotationId);
    try {
      const blobUrl = await furnitureQuotationsApi.exportPdf(quotationId);
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `bao-gia-${quotationId.slice(-8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Không thể xuất PDF. Vui lòng thử lại.');
    } finally {
      setExportingPdfId(null);
    }
  };
  
  if (loading) {
    return (
      <div style={{ marginTop: 16 }}>
        <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>
          <i className="ri-sofa-line" style={{ marginRight: 4 }} />
          Lịch sử báo giá nội thất
        </label>
        <div style={{ 
          padding: 20, 
          textAlign: 'center', 
          color: tokens.color.muted,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 8,
        }}>
          <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} /> Đang tải...
        </div>
      </div>
    );
  }
  
  if (quotations.length === 0) {
    return null;
  }
  
  return (
    <div style={{ marginTop: 16 }}>
      <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>
        <i className="ri-sofa-line" style={{ marginRight: 4 }} />
        Lịch sử báo giá nội thất ({quotations.length})
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {quotations.map((quotation) => {
          const isExpanded = expandedId === quotation.id;
          const items = typeof quotation.items === 'string' ? JSON.parse(quotation.items) : (quotation.items || []);
          const fees = typeof quotation.fees === 'string' ? JSON.parse(quotation.fees) : (quotation.fees || []);
          const isExporting = exportingPdfId === quotation.id;
          
          return (
            <div 
              key={quotation.id}
              style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {/* Summary Row - Clickable */}
              <div 
                onClick={() => setExpandedId(isExpanded ? null : quotation.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Date */}
                <div style={{ 
                  minWidth: 80, 
                  fontSize: 12, 
                  color: tokens.color.muted,
                }}>
                  {new Date(quotation.createdAt).toLocaleDateString('vi-VN')}
                </div>
                
                {/* Unit Number */}
                <div style={{ 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{ 
                    fontWeight: 500, 
                    color: tokens.color.text,
                    fontSize: 14,
                  }}>
                    {quotation.unitNumber}
                  </span>
                  <span style={{ 
                    fontSize: 12, 
                    color: tokens.color.muted,
                  }}>
                    ({quotation.apartmentType})
                  </span>
                </div>
                
                {/* Selection Type Badge */}
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(59,130,246,0.2)',
                  color: '#3b82f6',
                  fontSize: 11,
                  fontWeight: 500,
                }}>
                  Tùy chọn ({items.length})
                </span>
                
                {/* Total Price */}
                <div style={{ 
                  fontWeight: 600, 
                  color: tokens.color.primary,
                  fontSize: 14,
                  minWidth: 120,
                  textAlign: 'right',
                }}>
                  {new Intl.NumberFormat('vi-VN').format(quotation.totalPrice)} VNĐ
                </div>
                
                {/* Expand Icon */}
                <i 
                  className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} 
                  style={{ color: tokens.color.muted, fontSize: 18 }}
                />
              </div>
              
              {/* Expanded Details */}
              {isExpanded && (
                <div style={{ 
                  padding: '0 16px 16px',
                  borderTop: `1px solid ${tokens.color.border}`,
                }}>
                  {/* Apartment Info */}
                  <div style={{ 
                    marginTop: 12, 
                    padding: '8px 12px', 
                    background: 'rgba(245,211,147,0.1)', 
                    borderRadius: 6,
                    borderLeft: `3px solid ${tokens.color.primary}`,
                  }}>
                    <div style={{ fontSize: 11, color: tokens.color.muted, marginBottom: 4 }}>Thông tin căn hộ</div>
                    <div style={{ color: tokens.color.text, fontWeight: 500 }}>
                      {quotation.unitNumber}
                    </div>
                    <div style={{ fontSize: 12, color: tokens.color.muted, marginTop: 2 }}>
                      {quotation.developerName} • {quotation.projectName} • {quotation.buildingName}
                    </div>
                  </div>
                  
                  {/* Items */}
                  {items.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: tokens.color.muted, marginBottom: 6 }}>Sản phẩm đã chọn:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {items.map((item: { name: string; price: number; quantity: number }, idx: number) => (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '4px 8px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: 4,
                            fontSize: 12,
                          }}>
                            <span style={{ color: tokens.color.text }}>
                              {item.name} {item.quantity > 1 && <span style={{ color: tokens.color.muted }}>x{item.quantity}</span>}
                            </span>
                            <span style={{ color: tokens.color.muted }}>
                              {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} VNĐ
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Price Breakdown */}
                  <div style={{ marginTop: 12 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px 0', color: tokens.color.muted }}>Giá cơ bản:</td>
                          <td style={{ padding: '4px 0', color: tokens.color.text, textAlign: 'right' }}>
                            {new Intl.NumberFormat('vi-VN').format(quotation.basePrice)} VNĐ
                          </td>
                        </tr>
                        {fees.map((fee: { name: string; type: string; value: number; amount: number }, idx: number) => (
                          <tr key={idx}>
                            <td style={{ padding: '4px 0', color: tokens.color.muted }}>
                              {fee.name} {fee.type === 'PERCENTAGE' && `(${fee.value}%)`}:
                            </td>
                            <td style={{ padding: '4px 0', color: tokens.color.text, textAlign: 'right' }}>
                              {new Intl.NumberFormat('vi-VN').format(fee.amount)} VNĐ
                            </td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: `1px solid ${tokens.color.border}` }}>
                          <td style={{ padding: '8px 0', color: tokens.color.primary, fontWeight: 600 }}>Tổng cộng:</td>
                          <td style={{ padding: '8px 0', color: tokens.color.primary, fontWeight: 600, textAlign: 'right' }}>
                            {new Intl.NumberFormat('vi-VN').format(quotation.totalPrice)} VNĐ
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Export PDF Button */}
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outline"
                      size="small"
                      icon={isExporting ? 'ri-loader-4-line' : 'ri-file-pdf-line'}
                      onClick={(e) => handleExportPdf(quotation.id, e)}
                      disabled={isExporting}
                      style={{ 
                        opacity: isExporting ? 0.7 : 1,
                      }}
                    >
                      {isExporting ? 'Đang xuất...' : 'Xuất PDF'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
