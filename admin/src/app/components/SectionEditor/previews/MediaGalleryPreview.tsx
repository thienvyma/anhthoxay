import type { PreviewProps } from './types';

export function MediaGalleryPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8, textAlign: 'center' }}>{data.title}</h2>}
      {data.subtitle && <p style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>{data.subtitle}</p>}
      
      {/* Gallery Grid Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.columns || 3}, 1fr)`, gap: 12 }}>
        {Array.from({ length: Math.min(data.itemsPerPage || 6, 6) }).map((_, idx) => (
          <div key={idx} style={{ background: '#e5e7eb', borderRadius: 8, overflow: 'hidden', border: '1px solid #d1d5db' }}>
            <div style={{ paddingBottom: '75%', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, rgba(139,92,246,${0.1 + idx * 0.05}), rgba(236,72,153,${0.1 + idx * 0.05}))` }}>
                <i className="ri-image-line" style={{ fontSize: 24, color: '#8b5cf6', opacity: 0.5 }} />
              </div>
            </div>
            {data.showCaptions !== false && (
              <div style={{ padding: 8, background: '#fff' }}>
                <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, width: '70%' }} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Pagination Preview */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
        <button style={{ padding: '8px 12px', background: '#e5e7eb', border: 'none', borderRadius: 6, fontSize: 12, color: '#666' }}>
          <i className="ri-arrow-left-s-line" /> Trước
        </button>
        <button style={{ width: 32, height: 32, background: '#8b5cf6', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600 }}>1</button>
        <button style={{ width: 32, height: 32, background: '#e5e7eb', border: 'none', borderRadius: 6, color: '#666' }}>2</button>
        <button style={{ width: 32, height: 32, background: '#e5e7eb', border: 'none', borderRadius: 6, color: '#666' }}>3</button>
        <button style={{ padding: '8px 12px', background: '#e5e7eb', border: 'none', borderRadius: 6, fontSize: 12, color: '#666' }}>
          Sau <i className="ri-arrow-right-s-line" />
        </button>
      </div>
      
      {/* Info */}
      <p style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 12 }}>
        {data.itemsPerPage || 12} ảnh/trang • {data.columns || 3} cột
      </p>
    </div>
  );
}
