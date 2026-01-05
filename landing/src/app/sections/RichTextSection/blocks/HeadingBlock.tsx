import type { Block } from '../types';

interface HeadingBlockProps {
  block: Block;
  textAlign: string;
}

export function HeadingBlock({ block, textAlign }: HeadingBlockProps) {
  const { data } = block;
  const blockAlign = (data.align as string) || textAlign;
  const level = (data.level as number) || 2;
  const text = (data.text as string) || '';
  const style = { textAlign: blockAlign as 'left' | 'center' | 'right' };
  
  if (level === 1) return <h1 key={block.id} style={style}>{text}</h1>;
  if (level === 2) return <h2 key={block.id} style={style}>{text}</h2>;
  return <h3 key={block.id} style={style}>{text}</h3>;
}
