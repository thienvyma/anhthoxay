import type { LayoutPreviewProps } from '../types';
import { layoutLabels } from '../types';

export function CenteredPreview({ 
  showDecorations,
  renderContent 
}: LayoutPreviewProps) {
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 12,
        padding: '6px 10px',
        background: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 6,
        width: 'fit-content',
      }}>
        <i className="ri-align-center" style={{ color: '#F59E0B', fontSize: 14 }} />
        <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 500 }}>{layoutLabels['centered']}</span>
      </div>
      <div style={{ textAlign: 'center', background: '#0b0c0f', borderRadius: 8, padding: 20 }}>
        {showDecorations && (
          <div style={{ 
            width: 60, 
            height: 3, 
            background: 'linear-gradient(90deg, #F5D393, #EFB679)', 
            margin: '0 auto 16px',
            borderRadius: 2,
          }} />
        )}
        {renderContent(true)}
        {showDecorations && (
          <div style={{ 
            width: 60, 
            height: 3, 
            background: 'linear-gradient(90deg, #F5D393, #EFB679)', 
            margin: '16px auto 0',
            borderRadius: 2,
          }} />
        )}
      </div>
    </div>
  );
}
