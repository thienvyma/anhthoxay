import type { LayoutPreviewProps } from '../types';
import { layoutLabels } from '../types';

interface SplitLayoutPreviewProps extends LayoutPreviewProps {
  layout: 'split-left' | 'split-right';
}

export function SplitLayoutPreview({ 
  layout, 
  backgroundImage, 
  imageRatio = 40,
  renderContent 
}: SplitLayoutPreviewProps) {
  const isImageLeft = layout === 'split-left';
  const contentPercent = 100 - imageRatio;
  const gridTemplate = backgroundImage 
    ? `${imageRatio}fr ${contentPercent}fr`
    : '1fr';

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 12,
        padding: '6px 10px',
        background: 'rgba(167, 139, 250, 0.1)',
        borderRadius: 6,
        width: 'fit-content',
      }}>
        <i className="ri-layout-column-line" style={{ color: '#a78bfa', fontSize: 14 }} />
        <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 500 }}>{layoutLabels[layout]}</span>
        <span style={{ fontSize: 11, color: '#a78bfa', opacity: 0.7 }}>({imageRatio}% : {contentPercent}%)</span>
        {!backgroundImage && (
          <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 8 }}>⚠️ Chưa có ảnh</span>
        )}
      </div>
      {/* Seamless container - no gap */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: gridTemplate, 
        alignItems: 'stretch',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}>
        {isImageLeft && backgroundImage && (
          <div style={{ 
            position: 'relative',
            minHeight: 180,
          }}>
            <img 
              src={backgroundImage} 
              alt="" 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }} 
            />
            {/* Glass fade overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 30,
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(19, 19, 22, 0.6))',
            }} />
          </div>
        )}
        <div style={{ 
          background: 'linear-gradient(135deg, #1a1b1e 0%, #131316 100%)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Glass divider line */}
          <div style={{
            position: 'absolute',
            top: 12,
            bottom: 12,
            [isImageLeft ? 'left' : 'right']: 0,
            width: 1,
            background: 'linear-gradient(180deg, transparent, rgba(245, 211, 147, 0.25), transparent)',
          }} />
          {renderContent(true)}
        </div>
        {!isImageLeft && backgroundImage && (
          <div style={{ 
            position: 'relative',
            minHeight: 180,
          }}>
            <img 
              src={backgroundImage} 
              alt="" 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }} 
            />
            {/* Glass fade overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 30,
              height: '100%',
              background: 'linear-gradient(270deg, transparent, rgba(19, 19, 22, 0.6))',
            }} />
          </div>
        )}
      </div>
    </div>
  );
}
