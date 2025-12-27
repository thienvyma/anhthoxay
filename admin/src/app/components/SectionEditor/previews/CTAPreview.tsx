import type { PreviewProps } from './types';

export function CTAPreview({ data }: PreviewProps) {
  return (
    <div style={{ textAlign: 'center', padding: 60, background: 'linear-gradient(135deg, rgba(245, 211, 147, 0.15) 0%, rgba(239, 182, 121, 0.1) 100%)', borderRadius: 16, border: '1px solid rgba(245, 211, 147, 0.2)' }}>
      {data.title && <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, color: '#F5D393' }}>{data.title}</h2>}
      {data.subtitle && <p style={{ fontSize: 18, marginBottom: 32, color: 'rgba(255,255,255,0.7)' }}>{data.subtitle}</p>}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {data.primaryButton?.text && (
          <button style={{ padding: '16px 40px', background: 'linear-gradient(135deg, #F5D393, #EFB679)', color: '#111', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700 }}>
            {data.primaryButton.text}
          </button>
        )}
        {data.secondaryButton?.text && (
          <button style={{ padding: '16px 40px', background: 'transparent', color: '#F5D393', border: '2px solid #F5D393', borderRadius: 12, fontSize: 16, fontWeight: 700 }}>
            {data.secondaryButton.text}
          </button>
        )}
      </div>
    </div>
  );
}
