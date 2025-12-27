import type { PreviewProps } from './types';

export function AboutPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
        <div>
          {data.badge && <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(245,211,147,0.2)', color: '#b45309', fontSize: 12, fontWeight: 600, borderRadius: 20, marginBottom: 12 }}>{data.badge}</span>}
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 12 }}>{data.title || 'Về Chúng Tôi'}</h2>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{data.description || 'Mô tả về công ty...'}</p>
        </div>
        <div style={{ height: 200, background: 'linear-gradient(135deg, rgba(245,211,147,0.3), rgba(239,182,121,0.2))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {data.imageUrl ? (
            <img src={data.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
          ) : (
            <i className="ri-building-2-line" style={{ fontSize: 48, color: '#f5d393', opacity: 0.5 }} />
          )}
        </div>
      </div>
    </div>
  );
}
