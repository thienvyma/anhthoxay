import type { PreviewProps, DataRecord } from './types';
import { tokens } from '../../../../theme';

export function FooterSocialPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 24, textAlign: 'center' }}>
      {data.title && <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f5d393', marginBottom: 12 }}>{data.title}</h3>}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        {(data.platforms || []).map((p: DataRecord, idx: number) => (
          <div key={idx} style={{ width: 40, height: 40, borderRadius: '50%', background: tokens.color.surfaceHover, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`ri-${p.name}-fill`} style={{ fontSize: 18, color: '#fff' }} />
          </div>
        ))}
        {(!data.platforms || data.platforms.length === 0) && (
          <>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: tokens.color.surfaceHover, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ri-facebook-fill" style={{ fontSize: 18, color: '#fff' }} />
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: tokens.color.surfaceHover, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ri-youtube-fill" style={{ fontSize: 18, color: '#fff' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
