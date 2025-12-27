import type { PreviewProps } from './types';

export function VideoShowcasePreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8, textAlign: 'center' }}>{data.title}</h2>}
      {data.subtitle && <p style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>{data.subtitle}</p>}
      
      {/* Video Preview */}
      <div style={{ 
        position: 'relative',
        maxWidth: data.maxWidth === 'narrow' ? 800 : data.maxWidth === 'wide' ? 1200 : data.maxWidth === 'full' ? '100%' : 1000,
        margin: '0 auto',
        borderRadius: data.roundedCorners !== false ? 12 : 0,
        overflow: 'hidden',
        background: '#000',
      }}>
        {/* Aspect Ratio Container */}
        <div style={{ 
          paddingBottom: getAspectRatioPadding(data.aspectRatio),
          position: 'relative',
        }}>
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: data.thumbnail ? `url(${data.thumbnail}) center/cover` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          }}>
            {/* Play Button Overlay */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)' }}>
              <i className="ri-play-fill" style={{ fontSize: 36, color: '#fff', marginLeft: 4 }} />
            </div>
            
            {/* Overlay Text */}
            {data.overlayText && (
              <div style={{ position: 'absolute', left: 0, right: 0, padding: 20, textAlign: 'center', ...(data.overlayPosition === 'top' ? { top: 0 } : data.overlayPosition === 'bottom' ? { bottom: 0 } : { top: '50%', transform: 'translateY(calc(-50% + 60px))' }) }}>
                <p style={{ color: '#fff', fontSize: 20, fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.5)', margin: 0 }}>{data.overlayText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Video Source Info */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666', padding: '4px 12px', background: '#e5e7eb', borderRadius: 20 }}>
          <i className={getVideoSourceIcon(data.videoSource)} style={{ color: '#EF4444' }} />
          {getVideoSourceLabel(data.videoSource)}
        </span>
        {data.autoplay !== false && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
            <i className="ri-play-circle-line" /> Autoplay
          </span>
        )}
        {data.loop !== false && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
            <i className="ri-repeat-line" /> Loop
          </span>
        )}
        {data.muted !== false && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
            <i className="ri-volume-mute-line" /> Muted
          </span>
        )}
      </div>
    </div>
  );
}

function getAspectRatioPadding(aspectRatio: string | undefined): string {
  switch (aspectRatio) {
    case '4:3': return '75%';
    case '1:1': return '100%';
    case '9:16': return '177.78%';
    case '21:9': return '42.86%';
    default: return '56.25%';
  }
}

function getVideoSourceIcon(source: string | undefined): string {
  switch (source) {
    case 'youtube': return 'ri-youtube-fill';
    case 'vimeo': return 'ri-vimeo-fill';
    default: return 'ri-video-line';
  }
}

function getVideoSourceLabel(source: string | undefined): string {
  switch (source) {
    case 'youtube': return 'YouTube';
    case 'vimeo': return 'Vimeo';
    default: return 'Video';
  }
}
