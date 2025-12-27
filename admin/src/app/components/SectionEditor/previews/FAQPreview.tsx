import type { PreviewProps, DataRecord } from './types';

export function FAQPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24 }}>
      {data.title && <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 16, textAlign: 'center' }}>{data.title}</h2>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(data.items || []).slice(0, 3).map((item: DataRecord, idx: number) => (
          <div key={idx} style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>{item.question || 'Câu hỏi?'}</h4>
              <i className="ri-arrow-down-s-line" style={{ fontSize: 18, color: '#666' }} />
            </div>
          </div>
        ))}
        {(!data.items || data.items.length === 0) && (
          <>
            <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Câu hỏi thường gặp 1?</h4>
                <i className="ri-arrow-down-s-line" style={{ fontSize: 18, color: '#666' }} />
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>Câu hỏi thường gặp 2?</h4>
                <i className="ri-arrow-down-s-line" style={{ fontSize: 18, color: '#666' }} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
