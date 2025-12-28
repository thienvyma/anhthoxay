import type { BlockProps } from '../types';

export function ColumnsBlock({ block }: BlockProps) {
  const { data: blockData } = block;
  const left = typeof blockData.left === 'string' ? blockData.left : '';
  const right = typeof blockData.right === 'string' ? blockData.right : '';

  return (
    <div key={block.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
      <div style={{ color: '#374151', fontSize: 13 }}>{left}</div>
      <div style={{ color: '#374151', fontSize: 13 }}>{right}</div>
    </div>
  );
}
