import type { Block, CalloutColors } from '../types';

interface CalloutBlockProps {
  block: Block;
}

export function CalloutBlock({ block }: CalloutBlockProps) {
  const { data } = block;
  const calloutType = (data.type as string) || 'info';
  const calloutText = (data.text as string) || '';
  const icon = (data.icon as string) || 'ri-information-line';
  
  const colors: Record<string, CalloutColors> = {
    info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3B82F6' },
    success: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10B981' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#F59E0B' },
    error: { bg: 'rgba(239, 68, 68, 0.1)', border: '#EF4444' },
  };
  const color = colors[calloutType] || colors.info;
  
  return (
    <div
      key={block.id}
      className="rich-text-callout"
      style={{
        padding: '16px 20px',
        background: color.bg,
        borderLeft: `4px solid ${color.border}`,
        borderRadius: 8,
        margin: '24px 0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <i className={icon} style={{ fontSize: 20, color: color.border, flexShrink: 0, marginTop: 2 }} />
      <span style={{ color: 'rgba(255,255,255,0.9)' }}>{calloutText}</span>
    </div>
  );
}
