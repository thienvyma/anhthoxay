import type { PreviewProps } from './types';

export function FurnitureQuotePreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>{data.title || 'Báo Giá Nội Thất'}</h2>
        <p style={{ fontSize: 14, color: '#666' }}>{data.subtitle || 'Chọn căn hộ và nhận báo giá nội thất ngay'}</p>
      </div>
      
      {/* Step Indicator */}
      <StepIndicator />
      
      {/* Content Box */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', maxWidth: data.maxWidth || 900, margin: '0 auto' }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 12 }}>Chọn chủ đầu tư</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['Vinhomes', 'Novaland', 'Masterise'].map((item, idx) => (
            <div key={idx} style={{ padding: '16px', background: idx === 0 ? 'rgba(245,211,147,0.1)' : '#f9fafb', border: `1px solid ${idx === 0 ? '#f5d393' : '#e5e7eb'}`, borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}>
              <i className="ri-building-4-line" style={{ fontSize: 24, color: '#f5d393', marginBottom: 8, display: 'block' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Info */}
      <p style={{ fontSize: 11, color: '#999', marginTop: 16, textAlign: 'center' }}>
        <i className="ri-information-line" style={{ marginRight: 4 }} />
        Quy trình 7 bước: Chọn căn hộ → Chọn nội thất → Điền thông tin → Nhận báo giá
      </p>
    </div>
  );
}

function StepIndicator() {
  const steps = ['Chủ đầu tư', 'Dự án', 'Tòa nhà', 'Căn hộ', 'Nội thất', 'Thông tin', 'Kết quả'];
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
      {steps.map((step, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ 
            width: 28, height: 28, borderRadius: '50%', 
            background: idx === 0 ? '#f5d393' : '#e5e7eb', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: idx === 0 ? '#111' : '#666', fontWeight: 600, fontSize: 12,
          }}>
            {idx + 1}
          </div>
          <span style={{ fontSize: 11, color: idx === 0 ? '#111' : '#999' }}>{step}</span>
          {idx < 6 && <div style={{ width: 20, height: 2, background: '#e5e7eb', marginLeft: 4 }} />}
        </div>
      ))}
    </div>
  );
}
