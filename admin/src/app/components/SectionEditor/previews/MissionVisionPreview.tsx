import type { PreviewProps } from './types';

export function MissionVisionPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
      {data.subtitle && <p style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 }}>{data.subtitle}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {data.mission && (
          <div style={{ padding: 20, background: '#fff', borderRadius: 8, borderLeft: '4px solid #f5d393' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <i className={data.mission.icon || 'ri-flag-line'} style={{ fontSize: 24, color: '#f5d393' }} />
              <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: 0 }}>{data.mission.title || 'Sứ Mệnh'}</h4>
            </div>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>{data.mission.content || 'Nội dung sứ mệnh...'}</p>
          </div>
        )}
        {data.vision && (
          <div style={{ padding: 20, background: '#fff', borderRadius: 8, borderLeft: '4px solid #3B82F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <i className={data.vision.icon || 'ri-eye-line'} style={{ fontSize: 24, color: '#3B82F6' }} />
              <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: 0 }}>{data.vision.title || 'Tầm Nhìn'}</h4>
            </div>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>{data.vision.content || 'Nội dung tầm nhìn...'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
