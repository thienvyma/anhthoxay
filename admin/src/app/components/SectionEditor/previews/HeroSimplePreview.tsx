import type { PreviewProps } from './types';

export function HeroSimplePreview({ data }: PreviewProps) {
  return (
    <div style={{ 
      position: 'relative', 
      minHeight: 250, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: data.textAlign === 'center' ? 'center' : data.textAlign === 'right' ? 'flex-end' : 'flex-start',
      overflow: 'hidden', 
      borderRadius: 8,
      background: data.backgroundImage 
        ? `linear-gradient(rgba(0,0,0,${(data.backgroundOverlay || 60) / 100}), rgba(0,0,0,${(data.backgroundOverlay || 60) / 100})), url(${data.backgroundImage})` 
        : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div style={{ position: 'relative', textAlign: data.textAlign || 'center', padding: 40, maxWidth: 800 }}>
        {data.subtitle && (
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(245,211,147,0.15)', border: '1px solid rgba(245,211,147,0.3)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#f5d393', marginBottom: 16 }}>
            {data.subtitle}
          </div>
        )}
        {data.title && <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12, color: '#f5d393' }}>{data.title}</h1>}
        {data.description && <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{data.description}</p>}
      </div>
    </div>
  );
}
