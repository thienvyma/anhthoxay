import { tokens } from '@app/shared';
import type { QuoteDataDisplayProps } from '../types';

/**
 * QuoteDataDisplay - Displays quote data in a formatted table
 * Supports both pricing quote and furniture quotation formats
 */
export function QuoteDataDisplay({ quoteData }: QuoteDataDisplayProps) {
  if (!quoteData) return null;
  
  try {
    const data = JSON.parse(quoteData);
    
    // Check if this is a furniture quotation format (has unitNumber)
    const isFurnitureQuote = data.unitNumber || data.buildingCode;
    
    if (isFurnitureQuote) {
      // Parse items and fees if they are JSON strings
      const items = typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []);
      const fees = typeof data.fees === 'string' ? JSON.parse(data.fees) : (data.fees || []);
      
      return (
        <div style={{ marginTop: 8 }}>
          {/* Apartment Info */}
          <div style={{ 
            marginBottom: 12, 
            padding: '8px 12px', 
            background: 'rgba(245,211,147,0.1)', 
            borderRadius: 6,
            borderLeft: `3px solid ${tokens.color.primary}`,
          }}>
            <div style={{ fontSize: 11, color: tokens.color.muted, marginBottom: 4 }}>Thông tin căn hộ</div>
            <div style={{ color: tokens.color.text, fontWeight: 500 }}>
              {data.unitNumber || `${data.buildingCode}.${String(data.floor).padStart(2, '0')}${String(data.axis).padStart(2, '0')}`}
            </div>
            <div style={{ fontSize: 12, color: tokens.color.muted, marginTop: 2 }}>
              {data.developerName} • {data.projectName} • {data.buildingName}
            </div>
            <div style={{ fontSize: 12, color: tokens.color.muted }}>
              Loại căn hộ: <span style={{ color: tokens.color.text }}>{data.apartmentType}</span>
            </div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {/* Selection Type */}
              <tr>
                <td style={{ padding: '4px 8px', color: tokens.color.muted }}>Loại chọn:</td>
                <td style={{ padding: '4px 8px', color: tokens.color.text }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(59,130,246,0.2)',
                    color: '#3b82f6',
                    fontSize: 12,
                  }}>
                    Tùy chọn ({items.length} sản phẩm)
                  </span>
                </td>
              </tr>
              
              {/* Items */}
              {items.length > 0 && (
                <tr>
                  <td colSpan={2} style={{ padding: '8px', paddingTop: 12 }}>
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
                  </td>
                </tr>
              )}
              
              {/* Base Price */}
              <tr>
                <td style={{ padding: '4px 8px', color: tokens.color.muted }}>Giá cơ bản:</td>
                <td style={{ padding: '4px 8px', color: tokens.color.text }}>
                  {new Intl.NumberFormat('vi-VN').format(data.basePrice)} VNĐ
                </td>
              </tr>
              
              {/* Fees */}
              {fees.length > 0 && fees.map((fee: { name: string; type: string; value: number; amount: number }, idx: number) => (
                <tr key={idx}>
                  <td style={{ padding: '4px 8px', color: tokens.color.muted }}>
                    {fee.name} {fee.type === 'PERCENTAGE' && `(${fee.value}%)`}:
                  </td>
                  <td style={{ padding: '4px 8px', color: tokens.color.text }}>
                    {new Intl.NumberFormat('vi-VN').format(fee.amount)} VNĐ
                  </td>
                </tr>
              ))}
              
              {/* Total */}
              <tr style={{ borderTop: `1px solid ${tokens.color.border}` }}>
                <td style={{ padding: '8px', color: tokens.color.primary, fontWeight: 600 }}>Tổng cộng:</td>
                <td style={{ padding: '8px', color: tokens.color.primary, fontWeight: 600 }}>
                  {new Intl.NumberFormat('vi-VN').format(data.totalPrice)} VNĐ
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    
    // Original pricing quote format
    return (
      <div style={{ marginTop: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {data.categoryName && (
              <tr>
                <td style={{ padding: '4px 8px', color: tokens.color.muted }}>Hạng mục:</td>
                <td style={{ padding: '4px 8px', color: tokens.color.text }}>{data.categoryName}</td>
              </tr>
            )}
            {data.area && (
              <tr>
                <td style={{ padding: '4px 8px', color: tokens.color.muted }}>Diện tích:</td>
                <td style={{ padding: '4px 8px', color: tokens.color.text }}>{data.area} m²</td>
              </tr>
            )}
            {data.baseCost !== undefined && (
              <tr>
                <td style={{ padding: '4px 8px', color: tokens.color.muted }}>Chi phí cơ bản:</td>
                <td style={{ padding: '4px 8px', color: tokens.color.text }}>
                  {new Intl.NumberFormat('vi-VN').format(data.baseCost)} VNĐ
                </td>
              </tr>
            )}
            {data.materialsCost !== undefined && data.materialsCost > 0 && (
              <tr>
                <td style={{ padding: '4px 8px', color: tokens.color.muted }}>Vật dụng:</td>
                <td style={{ padding: '4px 8px', color: tokens.color.text }}>
                  {new Intl.NumberFormat('vi-VN').format(data.materialsCost)} VNĐ
                </td>
              </tr>
            )}
            {data.grandTotal !== undefined && (
              <tr style={{ borderTop: `1px solid ${tokens.color.border}` }}>
                <td style={{ padding: '8px', color: tokens.color.primary, fontWeight: 600 }}>Tổng cộng:</td>
                <td style={{ padding: '8px', color: tokens.color.primary, fontWeight: 600 }}>
                  {new Intl.NumberFormat('vi-VN').format(data.grandTotal)} VNĐ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  } catch {
    return (
      <pre style={{
        background: 'rgba(0,0,0,0.3)',
        padding: 8,
        borderRadius: 6,
        color: tokens.color.muted,
        fontSize: 11,
        overflow: 'auto',
        marginTop: 8,
      }}>
        {quoteData}
      </pre>
    );
  }
}
