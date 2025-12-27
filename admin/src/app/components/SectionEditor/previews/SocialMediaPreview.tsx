import type { PreviewProps, DataRecord } from './types';

export function SocialMediaPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24, textAlign: 'center' }}>
      {data.title && <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>{data.title}</h2>}
      {data.subtitle && <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{data.subtitle}</p>}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {(data.links || []).map((link: DataRecord, idx: number) => (
          <div key={idx} style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <i className={link.icon || 'ri-link'} style={{ fontSize: 20, color: '#f5d393' }} />
          </div>
        ))}
        {(!data.links || data.links.length === 0) && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ri-facebook-fill" style={{ fontSize: 20, color: '#1877F2' }} />
            </div>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ri-instagram-fill" style={{ fontSize: 20, color: '#E4405F' }} />
            </div>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ri-youtube-fill" style={{ fontSize: 20, color: '#FF0000' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
