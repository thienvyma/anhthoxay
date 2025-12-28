import type { BlockProps } from '../types';

export function QuoteBlock({ block, isDark }: BlockProps) {
  const { data: blockData } = block;
  const quoteText = typeof blockData.text === 'string' ? blockData.text : '';
  const quoteAuthor = typeof blockData.author === 'string' ? blockData.author : '';
  const glassColor = typeof blockData.glassColor === 'string' ? blockData.glassColor : '#F5D393';
  const defaultTextColor = isDark ? 'rgba(255,255,255,0.9)' : '#4b5563';
  const textColor = typeof blockData.textColor === 'string' ? blockData.textColor : defaultTextColor;
  const bgOpacity = isDark ? '18' : '20';

  return (
    <div
      key={block.id}
      style={{
        margin: '16px 0',
        padding: '14px 18px',
        background: `linear-gradient(90deg, ${glassColor}${bgOpacity} 0%, ${glassColor}${isDark ? '08' : '10'} 40%, transparent 100%)`,
        borderRadius: 8,
        textAlign: 'center',
      }}
    >
      <blockquote style={{ margin: 0, padding: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontStyle: 'italic',
            color: textColor,
            lineHeight: 1.7,
          }}
        >
          " {quoteText} "
        </p>
        {quoteAuthor && (
          <footer style={{ marginTop: 10, textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: glassColor, fontWeight: 500, fontStyle: 'normal' }}>
              {quoteAuthor}
            </span>
          </footer>
        )}
      </blockquote>
    </div>
  );
}
