import type { LayoutPreviewProps } from '../types';
import { layoutLabels } from '../types';

export function FullWidthPreview({ 
  backgroundImage, 
  backgroundOverlay,
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
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 6,
        width: 'fit-content',
      }}>
        <i className="ri-fullscreen-line" style={{ color: '#3B82F6', fontSize: 14 }} />
        <span style={{ fontSize: 12, color: '#3B82F6', fontWeight: 500 }}>{layoutLabels['full-width']}</span>
      </div>
      <div style={{ 
        background: backgroundImage 
          ? `linear-gradient(rgba(0,0,0,${backgroundOverlay / 100}), rgba(0,0,0,${backgroundOverlay / 100})), url(${backgroundImage}) center/cover`
          : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: 8, 
        padding: 24,
      }}>
        {renderContent(true)}
      </div>
    </div>
  );
}
