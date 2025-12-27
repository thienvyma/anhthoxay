import type { PreviewProps, DataRecord } from './types';

export function TestimonialsPreview({ data }: PreviewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>{data.title}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
        {(data.testimonials || []).slice(0, 2).map((t: DataRecord) => (
          <div key={t._id || t.name} style={{ background: '#fffbeb', borderRadius: 8, padding: 16, border: '1px solid #fde68a' }}>
            <div style={{ fontWeight: 600, color: '#111' }}>{t.name}</div>
            <div style={{ fontSize: 12, color: '#78350F' }}>{t.role}</div>
            <p style={{ fontSize: 13, color: '#451a03', marginTop: 8 }}>{t.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
