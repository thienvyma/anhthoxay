import type { BlockProps } from '../types';

export function DividerBlock({ block, isDark }: BlockProps) {
  const { data: blockData } = block;
  const dividerStyle = (blockData.style as string) || 'solid';
  const baseOpacity = isDark ? 0.15 : 0.2;
  const accentOpacity = isDark ? 0.05 : 0.08;

  if (dividerStyle === 'dashed') {
    return (
      <div key={block.id} style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            style={{
              width: i === 3 ? 8 : 16,
              height: i === 3 ? 8 : 2,
              borderRadius: i === 3 ? '50%' : 1,
              background: i === 3 
                ? 'linear-gradient(135deg, #F5D393, #EFB679)'
                : `rgba(245, 211, 147, ${baseOpacity + Math.abs(3 - i) * accentOpacity})`,
              boxShadow: i === 3 ? '0 0 8px rgba(245, 211, 147, 0.3)' : 'none',
            }}
          />
        ))}
      </div>
    );
  }

  if (dividerStyle === 'dotted') {
    const dotBaseOpacity = isDark ? 0.2 : 0.25;
    const dotAccentOpacity = isDark ? 0.1 : 0.12;
    return (
      <div key={block.id} style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              width: i === 2 ? 8 : 5,
              height: i === 2 ? 8 : 5,
              borderRadius: '50%',
              background: i === 2 
                ? 'linear-gradient(135deg, #F5D393, #EFB679)'
                : `rgba(245, 211, 147, ${dotBaseOpacity + Math.abs(2 - i) * dotAccentOpacity})`,
              boxShadow: i === 2 ? `0 0 10px rgba(245, 211, 147, ${isDark ? 0.4 : 0.5})` : 'none',
            }}
          />
        ))}
      </div>
    );
  }

  // Default solid style
  const lineOpacity = isDark ? 0.35 : 0.4;
  const dotOpacity = isDark ? 0.25 : 0.3;
  return (
    <div key={block.id} style={{ margin: '28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, rgba(245, 211, 147, ${lineOpacity}))` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: `rgba(245, 211, 147, ${dotOpacity})` }} />
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(135deg, #F5D393, #EFB679)', boxShadow: `0 0 8px rgba(245, 211, 147, ${isDark ? 0.3 : 0.4})` }} />
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: `rgba(245, 211, 147, ${dotOpacity})` }} />
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, transparent, rgba(245, 211, 147, ${lineOpacity}))` }} />
    </div>
  );
}
