import { resolveMediaUrl } from '@app/shared';
import type { BlockProps } from '../types';

export function ImageBlock({ block, textAlign, isDark }: BlockProps) {
  const { data: blockData } = block;
  const blockAlign = (blockData.align as string) || textAlign;
  const imgUrl = typeof blockData.url === 'string' ? blockData.url : '';
  const imgAlt = typeof blockData.alt === 'string' ? blockData.alt : '';
  const imgCaption = typeof blockData.caption === 'string' ? blockData.caption : '';
  const resolvedUrl = imgUrl ? resolveMediaUrl(imgUrl) : '';

  if (!resolvedUrl) return null;

  if (isDark) {
    return (
      <figure key={block.id} style={{ margin: '16px 0', position: 'relative' }}>
        {/* Image with glass effect */}
        <div style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          <img 
            src={resolvedUrl} 
            alt={imgAlt} 
            style={{ 
              width: '100%', 
              height: 'auto',
              display: 'block',
              objectFit: 'cover' 
            }} 
          />
          {/* Glass overlays */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 20,
            background: 'linear-gradient(180deg, rgba(19, 19, 22, 0.4), transparent)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 20,
            background: 'linear-gradient(0deg, rgba(19, 19, 22, 0.4), transparent)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '1px solid rgba(245, 211, 147, 0.1)',
            borderRadius: 8,
            pointerEvents: 'none',
          }} />
        </div>
        {imgCaption && (
          <figcaption style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontStyle: 'italic' }}>
            {imgCaption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure key={block.id} style={{ marginBottom: 12, textAlign: blockAlign as 'left' | 'center' | 'right' }}>
      <img src={resolvedUrl} alt={imgAlt} style={{ maxWidth: '100%', borderRadius: 8 }} />
      {imgCaption && (
        <figcaption style={{ marginTop: 8, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>{imgCaption}</figcaption>
      )}
    </figure>
  );
}
