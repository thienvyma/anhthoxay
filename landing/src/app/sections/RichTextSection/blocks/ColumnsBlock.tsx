import type { Block } from '../types';

interface ColumnsBlockProps {
  block: Block;
}

export function ColumnsBlock({ block }: ColumnsBlockProps) {
  const { data } = block;
  const left = typeof data.left === 'string' ? data.left : '';
  const right = typeof data.right === 'string' ? data.right : '';
  
  return (
    <div
      key={block.id}
      className="rich-text-columns"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: 32,
        margin: '24px 0',
      }}
    >
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}
