import type { LayoutPreviewProps } from '../types';
import { layoutLabels } from '../types';

export function DefaultLayoutPreview({ renderContent }: LayoutPreviewProps) {
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 12,
        padding: '6px 10px',
        background: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 6,
        width: 'fit-content',
      }}>
        <i className="ri-layout-4-line" style={{ color: '#10B981', fontSize: 14 }} />
        <span style={{ fontSize: 12, color: '#10B981', fontWeight: 500 }}>{layoutLabels['default']}</span>
      </div>
      <div style={{ 
        background: 'linear-gradient(135deg, #1a1b1e 0%, #131316 100%)',
        borderRadius: 8, 
        padding: 20,
        border: '1px solid rgba(245, 211, 147, 0.1)',
      }}>
        {renderContent(true)}
      </div>
    </div>
  );
}
