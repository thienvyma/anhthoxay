import type { PreviewProps } from './types';

export function FeaturedSlideshowPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8, textAlign: 'center' }}>{data.title}</h2>}
      {data.subtitle && <p style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>{data.subtitle}</p>}
      
      {/* Slideshow Preview */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#e5e7eb' }}>
        <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(139,92,246,0.2))' }}>
            <div style={{ textAlign: 'center' }}>
              <i className="ri-slideshow-3-line" style={{ fontSize: 48, color: '#ec4899', opacity: 0.5 }} />
              <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>Ảnh nổi bật từ Media Library</p>
            </div>
          </div>
          
          {/* Navigation Arrows */}
          {data.showNavigation !== false && (
            <>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ri-arrow-left-s-line" style={{ color: '#fff', fontSize: 20 }} />
              </div>
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ri-arrow-right-s-line" style={{ color: '#fff', fontSize: 20 }} />
              </div>
            </>
          )}
        </div>
        
        {/* Pagination Dots */}
        {data.showPagination !== false && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: 12, background: '#fff' }}>
            <div style={{ width: 20, height: 8, borderRadius: 4, background: '#ec4899' }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#d1d5db' }} />
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#d1d5db' }} />
          </div>
        )}
      </div>
      
      {/* Options Info */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
        {data.autoplay !== false && (
          <span style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ri-play-circle-line" /> Tự động: {data.autoplayDelay || 5000}ms
          </span>
        )}
      </div>
    </div>
  );
}
