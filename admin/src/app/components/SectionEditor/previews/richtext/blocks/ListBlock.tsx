import type { BlockProps } from '../types';

export function ListBlock({ block, isDark }: BlockProps) {
  const { data: blockData } = block;
  const items = (blockData.items as string[]) || [];
  const isOrdered = blockData.ordered as boolean;
  
  const bgOpacity = isDark ? 0.03 : 0.05;
  const borderOpacity = isDark ? 0.08 : 0.1;
  const cornerOpacity = isDark ? 0.25 : 0.3;
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : '#374151';

  return (
    <div
      key={block.id}
      style={{
        margin: '16px 0',
        padding: '12px 16px',
        background: `rgba(245, 211, 147, ${bgOpacity})`,
        borderRadius: 8,
        border: `1px solid rgba(245, 211, 147, ${borderOpacity})`,
        position: 'relative',
      }}
    >
      {/* Corner accents */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 24,
        height: 24,
        borderTop: `2px solid rgba(245, 211, 147, ${cornerOpacity})`,
        borderLeft: `2px solid rgba(245, 211, 147, ${cornerOpacity})`,
        borderRadius: '8px 0 0 0',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderBottom: `2px solid rgba(245, 211, 147, ${cornerOpacity})`,
        borderRight: `2px solid rgba(245, 211, 147, ${cornerOpacity})`,
        borderRadius: '0 0 8px 0',
        pointerEvents: 'none',
      }} />
      
      {isOrdered ? (
        <ol style={{ margin: 0, paddingLeft: 16, listStyle: 'none', counterReset: 'item' }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: idx === items.length - 1 ? 0 : 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{
                minWidth: 20,
                height: 20,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F5D393, #EFB679)',
                color: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                marginTop: 1,
              }}>
                {idx + 1}
              </span>
              <span style={{ color: textColor }}>{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: idx === items.length - 1 ? 0 : 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F5D393, #EFB679)',
                flexShrink: 0,
                marginTop: 6,
                boxShadow: '0 0 6px rgba(245, 211, 147, 0.4)',
              }} />
              <span style={{ color: textColor }}>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
