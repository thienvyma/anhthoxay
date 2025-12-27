import type { PreviewProps } from './types';

export function QuickContactPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: 'linear-gradient(135deg, #f5d393 0%, #efb679 100%)', borderRadius: 8, padding: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 16 }}>{data.title || 'Liên Hệ Nhanh'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#111' }}>
            <i className="ri-phone-fill" style={{ fontSize: 18 }} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>{data.phone}</span>
          </div>
        )}
        {data.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#111' }}>
            <i className="ri-mail-fill" style={{ fontSize: 18 }} />
            <span style={{ fontSize: 14 }}>{data.email}</span>
          </div>
        )}
        {data.address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#111' }}>
            <i className="ri-map-pin-fill" style={{ fontSize: 18 }} />
            <span style={{ fontSize: 14 }}>{data.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}
