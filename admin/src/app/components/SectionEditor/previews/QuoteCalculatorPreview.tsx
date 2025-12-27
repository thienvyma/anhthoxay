import type { PreviewProps } from './types';

export function QuoteCalculatorPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>{data.title || 'Báo Giá & Dự Toán'}</h2>
        <p style={{ fontSize: 14, color: '#666' }}>{data.subtitle || 'Tính toán chi phí cải tạo nhà nhanh chóng và chính xác'}</p>
      </div>
      
      {/* Tab Switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        <button style={{ 
          padding: '10px 20px', borderRadius: 8, border: 'none', 
          background: data.defaultTab !== 'consultation' ? '#f5d393' : '#e5e7eb', 
          color: data.defaultTab !== 'consultation' ? '#111' : '#666',
          fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <i className={data.calculatorTab?.icon || 'ri-calculator-line'} />
          {data.calculatorTab?.label || 'Dự Toán Nhanh'}
        </button>
        <button style={{ 
          padding: '10px 20px', borderRadius: 8, border: 'none', 
          background: data.defaultTab === 'consultation' ? '#f5d393' : '#e5e7eb', 
          color: data.defaultTab === 'consultation' ? '#111' : '#666',
          fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <i className={data.consultationTab?.icon || 'ri-phone-line'} />
          {data.consultationTab?.label || 'Đăng Ký Tư Vấn'}
        </button>
      </div>
      
      {/* Content Box */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', maxWidth: data.maxWidth || 900, margin: '0 auto' }}>
        {data.defaultTab !== 'consultation' ? (
          <CalculatorContent />
        ) : (
          <ConsultationContent data={data} />
        )}
      </div>
    </div>
  );
}

function CalculatorContent() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
        {[{ num: 1, label: 'Hạng mục', active: true }, { num: 2, label: 'Diện tích', active: false }, { num: 3, label: 'Kết quả', active: false }].map((step, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: step.active ? '#f5d393' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.active ? '#111' : '#666', fontWeight: 600 }}>{step.num}</div>
            <span style={{ fontSize: 13, color: step.active ? '#111' : '#999' }}>{step.label}</span>
            {idx < 2 && <div style={{ width: 40, height: 2, background: '#e5e7eb', marginLeft: 4 }} />}
          </div>
        ))}
      </div>
      
      <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 12 }}>Chọn hạng mục thi công</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {['Sơn tường', 'Ốp lát gạch', 'Tháo dỡ'].map((item, idx) => (
          <div key={idx} style={{ padding: '12px 16px', background: idx === 0 ? 'rgba(245,211,147,0.1)' : '#f9fafb', border: `1px solid ${idx === 0 ? '#f5d393' : '#e5e7eb'}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="ri-paint-brush-line" style={{ fontSize: 20, color: '#f5d393' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{item}</span>
            </div>
            <i className="ri-arrow-right-s-line" style={{ color: '#999' }} />
          </div>
        ))}
      </div>
    </>
  );
}

function ConsultationContent({ data }: PreviewProps) {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <i className="ri-customer-service-2-line" style={{ fontSize: 40, color: '#f5d393' }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginTop: 8 }}>{data.consultationTab?.title || 'Đăng Ký Tư Vấn Trực Tiếp'}</h3>
        <p style={{ fontSize: 13, color: '#666' }}>{data.consultationTab?.subtitle || 'Để lại thông tin, chúng tôi sẽ liên hệ bạn trong 24h'}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {['Họ tên *', 'Số điện thoại *', 'Email', 'Nội dung yêu cầu'].map((label, idx) => (
          <div key={idx}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</label>
            <div style={{ height: idx === 3 ? 60 : 40, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }} />
          </div>
        ))}
        <button style={{ padding: '12px 24px', background: '#f5d393', color: '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, marginTop: 8 }}>
          {data.consultationTab?.buttonText || 'Đăng Ký Tư Vấn'}
        </button>
      </div>
    </>
  );
}
