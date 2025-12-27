import type { PreviewProps } from './types';

export function FeaturedBlogPostsPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {Array.from({ length: data.limit || 3 }).map((_, idx) => (
          <div key={idx} style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: 120, background: 'linear-gradient(135deg, rgba(245,211,147,0.3), rgba(239,182,121,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ri-article-line" style={{ fontSize: 32, color: '#F5D393', opacity: 0.5 }} />
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ height: 12, background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
