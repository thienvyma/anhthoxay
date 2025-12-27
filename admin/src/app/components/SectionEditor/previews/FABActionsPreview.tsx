import type { PreviewProps, DataRecord } from './types';

export function FABActionsPreview({ data }: PreviewProps) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 24, textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Nút nổi góc màn hình</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'flex-end' }}>
        {(data.actions || []).map((action: DataRecord, idx: number) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: action.color || '#f5d393', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <i className={action.icon || 'ri-phone-fill'} style={{ fontSize: 18, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 10, color: '#666' }}>{action.label}</span>
          </div>
        ))}
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: data.mainColor || '#f5d393', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          <i className={data.mainIcon || 'ri-customer-service-2-fill'} style={{ fontSize: 24, color: '#111' }} />
        </div>
      </div>
    </div>
  );
}
