import type { PreviewProps } from './types';

export function HeroPreview({ data }: PreviewProps) {
  return (
    <div style={{ position: 'relative', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }}>
      {data.imageUrl && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src={data.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        </div>
      )}
      <div style={{ position: 'relative', textAlign: 'center', padding: 40, color: '#111', background: 'rgba(255,255,255,0.9)', borderRadius: 8, margin: 20 }}>
        {data.title && <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>{data.title}</h1>}
        {data.subtitle && <p style={{ fontSize: 16, marginBottom: 20 }}>{data.subtitle}</p>}
        {data.ctaText && (
          <button style={{ padding: '12px 32px', background: '#f5d393', color: '#111', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600 }}>
            {data.ctaText}
          </button>
        )}
      </div>
    </div>
  );
}
