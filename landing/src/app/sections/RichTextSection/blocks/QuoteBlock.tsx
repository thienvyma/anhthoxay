import { tokens } from '@app/shared';
import type { Block } from '../types';

interface QuoteBlockProps {
  block: Block;
}

export function QuoteBlock({ block }: QuoteBlockProps) {
  const { data } = block;
  const quoteText = typeof data.text === 'string' ? data.text : '';
  const quoteAuthor = typeof data.author === 'string' ? data.author : '';
  const glassColor = typeof data.glassColor === 'string' ? data.glassColor : tokens.color.primary;
  const textColor = typeof data.textColor === 'string' ? data.textColor : 'rgba(255,255,255,0.9)';
  
  return (
    <div
      key={block.id}
      className="rich-text-quote-block"
      style={{
        margin: '24px 0',
        padding: '12px 24px',
        background: `linear-gradient(90deg, ${glassColor}18 0%, ${glassColor}08 40%, transparent 100%)`,
        borderRadius: 8,
        position: 'relative',
      }}
    >
      {/* Quote content */}
      <blockquote
        style={{
          margin: 0,
          padding: 0,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 16,
            fontStyle: 'italic',
            color: textColor,
            lineHeight: 1.7,
          }}
        >
          " {quoteText} "
        </p>
        {quoteAuthor && (
          <footer
            style={{
              marginTop: 10,
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: glassColor,
                fontWeight: 500,
                fontStyle: 'normal',
              }}
            >
              {quoteAuthor}
            </span>
          </footer>
        )}
      </blockquote>
    </div>
  );
}
