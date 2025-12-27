import type { PreviewProps, DataRecord } from './types';

export function StatsPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        {(data.stats || []).map((stat: DataRecord) => (
          <div key={stat._id || stat.label} style={{ textAlign: 'center', padding: 16, background: '#fff', borderRadius: 8 }}>
            <i className={stat.icon} style={{ fontSize: 32, color: '#f5d393', marginBottom: 8, display: 'block' }} />
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{stat.prefix}{stat.value}{stat.suffix}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
