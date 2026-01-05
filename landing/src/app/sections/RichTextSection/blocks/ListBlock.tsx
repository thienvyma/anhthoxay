import { tokens } from '@app/shared';
import type { Block } from '../types';

interface ListBlockProps {
  block: Block;
}

const gradient = `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`;
const cornerStyle = (pos: 'top-left' | 'bottom-right') => ({
  position: 'absolute' as const, width: 40, height: 40, pointerEvents: 'none' as const,
  ...(pos === 'top-left' 
    ? { top: 0, left: 0, borderTop: '2px solid rgba(245, 211, 147, 0.3)', borderLeft: '2px solid rgba(245, 211, 147, 0.3)', borderRadius: '12px 0 0 0' }
    : { bottom: 0, right: 0, borderBottom: '2px solid rgba(245, 211, 147, 0.3)', borderRight: '2px solid rgba(245, 211, 147, 0.3)', borderRadius: '0 0 12px 0' }),
});

function ListItem({ item, idx, isLast, isOrdered }: { item: string; idx: number; isLast: boolean; isOrdered: boolean }) {
  return (
    <li style={{ marginBottom: isLast ? 0 : 14, display: 'flex', alignItems: 'flex-start', gap: 12, lineHeight: 1.7 }}>
      {isOrdered ? (
        <span style={{ minWidth: 28, height: 28, borderRadius: '50%', background: gradient, color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{idx + 1}</span>
      ) : (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: gradient, flexShrink: 0, marginTop: 8, boxShadow: `0 0 8px ${tokens.color.primary}50` }} />
      )}
      <span style={{ color: 'rgba(255,255,255,0.85)' }}>{item}</span>
    </li>
  );
}

export function ListBlock({ block }: ListBlockProps) {
  const items = (block.data.items as string[]) || [];
  const isOrdered = block.data.ordered as boolean;
  const ListTag = isOrdered ? 'ol' : 'ul';
  
  return (
    <div key={block.id} className="rich-text-list-block" style={{ margin: '28px 0', padding: '20px 24px', background: 'rgba(245, 211, 147, 0.03)', borderRadius: 12, border: '1px solid rgba(245, 211, 147, 0.08)', position: 'relative' }}>
      <div style={cornerStyle('top-left')} />
      <div style={cornerStyle('bottom-right')} />
      <ListTag style={{ margin: 0, paddingLeft: isOrdered ? 24 : 0, listStyle: 'none', ...(isOrdered && { counterReset: 'item' }) }}>
        {items.map((item, idx) => <ListItem key={idx} item={item} idx={idx} isLast={idx === items.length - 1} isOrdered={isOrdered} />)}
      </ListTag>
    </div>
  );
}
