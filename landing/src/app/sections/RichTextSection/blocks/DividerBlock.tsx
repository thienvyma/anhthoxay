import { tokens } from '@app/shared';
import type { Block } from '../types';

interface DividerBlockProps {
  block: Block;
}

const baseStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center' };
const gradient = `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`;

function DashedDivider() {
  return (
    <div style={{ ...baseStyle, margin: '40px 0', gap: 8 }}>
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{
          width: i === 3 ? 12 : 24, height: i === 3 ? 12 : 3,
          borderRadius: i === 3 ? '50%' : 2,
          background: i === 3 ? gradient : `rgba(245, 211, 147, ${0.15 + Math.abs(3 - i) * 0.05})`,
          boxShadow: i === 3 ? `0 0 12px ${tokens.color.primary}40` : 'none',
        }} />
      ))}
    </div>
  );
}

function DottedDivider() {
  return (
    <div style={{ ...baseStyle, margin: '40px 0', gap: 12 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          width: i === 2 ? 10 : 6, height: i === 2 ? 10 : 6, borderRadius: '50%',
          background: i === 2 ? gradient : `rgba(245, 211, 147, ${0.2 + Math.abs(2 - i) * 0.1})`,
          boxShadow: i === 2 ? `0 0 16px ${tokens.color.primary}50` : 'none',
        }} />
      ))}
    </div>
  );
}

function SolidDivider() {
  const dot = (size: number, glow?: boolean) => ({
    width: size, height: size, borderRadius: '50%',
    background: glow ? gradient : 'rgba(245, 211, 147, 0.3)',
    boxShadow: glow ? `0 0 12px ${tokens.color.primary}40` : 'none',
  });
  return (
    <div style={{ ...baseStyle, margin: '48px 0', gap: 16 }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(245, 211, 147, 0.4))' }} />
      <div style={{ ...baseStyle, gap: 6 }}>
        <div style={dot(6)} /><div style={dot(10, true)} /><div style={dot(6)} />
      </div>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg, transparent, rgba(245, 211, 147, 0.4))' }} />
    </div>
  );
}

export function DividerBlock({ block }: DividerBlockProps) {
  const style = (block.data.style as string) || 'solid';
  if (style === 'dashed') return <DashedDivider />;
  if (style === 'dotted') return <DottedDivider />;
  return <SolidDivider />;
}
