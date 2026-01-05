import type { PreviewProps } from './types';
import { tokens } from '../../../../theme';

export function QuoteFormPreview({ data }: PreviewProps) {
  const layoutStyle = data.layout === 'glass' 
    ? { background: tokens.color.surfaceHover, backdropFilter: 'blur(10px)', border: '1px solid tokens.color.border' }
    : data.layout === 'simple'
    ? { background: 'transparent' }
    : { background: 'linear-gradient(135deg, rgba(245,211,147,0.1) 0%, rgba(239,182,121,0.05) 100%)', border: '1px solid rgba(245,211,147,0.2)' };
  
  const fields: { label: string; type: string }[] = [];
  if (data.showNameField !== false) fields.push({ label: 'Họ tên *', type: 'text' });
  if (data.showPhoneField !== false) fields.push({ label: 'Số điện thoại *', type: 'text' });
  if (data.showEmailField !== false) fields.push({ label: 'Email', type: 'text' });
  if (data.showAddressField === true) fields.push({ label: 'Địa chỉ', type: 'text' });
  if (data.showContentField !== false) fields.push({ label: 'Nội dung yêu cầu', type: 'textarea' });
  
  // Add custom fields
  if (data.customFields && Array.isArray(data.customFields)) {
    for (const cf of data.customFields) {
      fields.push({ label: `${cf.label}${cf.required ? ' *' : ''}`, type: cf.type || 'text' });
    }
  }

  return (
    <div style={{ borderRadius: 8, padding: 24, ...layoutStyle }}>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8, textAlign: 'center' }}>{data.title || 'Đăng kí tư vấn'}</h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 20, textAlign: 'center' }}>{data.subtitle || 'Điền thông tin để nhận báo giá nhanh chóng'}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fields.map((field, idx) => (
          <div key={idx}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>{field.label}</label>
            <div style={{ height: field.type === 'textarea' ? 80 : 40, background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb' }} />
          </div>
        ))}
        <button style={{ padding: '12px 24px', background: data.buttonColor || '#f5d393', color: '#111', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, marginTop: 8 }}>
          {data.buttonText || 'Gửi Yêu Cầu'}
        </button>
      </div>
      {data.customFields && data.customFields.length > 0 && (
        <p style={{ fontSize: 11, color: '#999', marginTop: 12, textAlign: 'center' }}>
          + {data.customFields.length} trường tùy chỉnh
        </p>
      )}
    </div>
  );
}
