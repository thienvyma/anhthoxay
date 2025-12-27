import type { PreviewProps } from './types';

export function ContactInfoPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16 }}>{data.title || 'Thông Tin Liên Hệ'}</h2>
      {data.phone && <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>📞 {data.phone}</p>}
      {data.email && <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>✉️ {data.email}</p>}
      {data.address && <p style={{ fontSize: 14, color: '#666' }}>📍 {data.address}</p>}
    </div>
  );
}
