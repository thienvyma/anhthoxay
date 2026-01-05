import { resolveMediaUrl } from '@app/shared';
import type { Block } from '../types';

interface ImageBlockProps {
  block: Block;
}

const glassOverlay = (dir: '180deg' | '0deg', opacity = 0.5) => ({
  position: 'absolute' as const, left: 0, right: 0, height: 40, pointerEvents: 'none' as const,
  background: `linear-gradient(${dir}, rgba(19, 19, 22, ${opacity}), transparent)`,
  ...(dir === '180deg' ? { top: 0 } : { bottom: 0 }),
});

export function ImageBlock({ block }: ImageBlockProps) {
  const { data } = block;
  const imgUrl = typeof data.url === 'string' ? data.url : '';
  const imgAlt = typeof data.alt === 'string' ? data.alt : '';
  const imgCaption = typeof data.caption === 'string' ? data.caption : '';
  
  if (!imgUrl) return null;
  const resolvedUrl = resolveMediaUrl(imgUrl);
  
  return (
    <figure key={block.id} className="rich-text-image-block" style={{ margin: '32px 0', position: 'relative' }}>
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
        <img src={resolvedUrl} alt={imgAlt} style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} />
        <div style={glassOverlay('180deg')} />
        <div style={glassOverlay('0deg')} />
        <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(245, 211, 147, 0.15)', borderRadius: 12, pointerEvents: 'none' }} />
      </div>
      {imgCaption && (
        <figcaption style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 16, fontStyle: 'italic' }}>
          {imgCaption}
        </figcaption>
      )}
    </figure>
  );
}
