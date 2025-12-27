import type { PreviewProps, DataRecord } from './types';

export function FeaturesPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {(data.features || data.values || []).map((item: DataRecord) => (
          <div key={item._id || item.title} style={{ padding: 16, background: '#fff', borderRadius: 8, textAlign: 'center' }}>
            <i className={item.icon} style={{ fontSize: 32, color: '#f5d393', marginBottom: 12, display: 'block' }} />
            <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 6 }}>{item.title}</h4>
            <p style={{ fontSize: 13, color: '#666' }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
