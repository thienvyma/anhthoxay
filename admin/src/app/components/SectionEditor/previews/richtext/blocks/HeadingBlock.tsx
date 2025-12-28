import type { BlockProps } from '../types';

export function HeadingBlock({ block, textAlign, isDark }: BlockProps) {
  const { data: blockData } = block;
  const blockAlign = (blockData.align as string) || textAlign;
  const level = (blockData.level as number) || 2;
  
  const fontSize = isDark 
    ? (level === 1 ? 22 : level === 2 ? 18 : 15)
    : (level === 1 ? 24 : level === 2 ? 20 : 16);

  return (
    <div
      key={block.id}
      style={{
        fontSize,
        fontWeight: 600,
        color: isDark ? '#F5D393' : '#111827',
        marginBottom: isDark ? 8 : 12,
        marginTop: level === 1 ? (isDark ? 16 : 20) : (isDark ? 12 : 14),
        textAlign: blockAlign as 'left' | 'center' | 'right',
        fontFamily: isDark ? 'Playfair Display, serif' : undefined,
      }}
    >
      {(blockData.text as string) || ''}
    </div>
  );
}
