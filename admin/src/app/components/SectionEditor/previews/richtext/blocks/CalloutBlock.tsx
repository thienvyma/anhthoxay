import type { BlockProps } from '../types';

const calloutColors: Record<string, { bg: string; border: string; text: string }> = {
  info: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  success: { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
  warning: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' },
  error: { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B' },
};

export function CalloutBlock({ block }: BlockProps) {
  const { data: blockData } = block;
  const calloutType = (blockData.type as string) || 'info';
  const color = calloutColors[calloutType] || calloutColors.info;

  return (
    <div 
      key={block.id} 
      style={{ 
        padding: 12, 
        background: color.bg, 
        borderLeft: `4px solid ${color.border}`, 
        borderRadius: 4, 
        marginBottom: 12, 
        color: color.text, 
        fontSize: 13 
      }}
    >
      <i className={(blockData.icon as string) || 'ri-information-line'} style={{ marginRight: 8 }} />
      {(blockData.text as string) || ''}
    </div>
  );
}
