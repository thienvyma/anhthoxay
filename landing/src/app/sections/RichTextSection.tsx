import { tokens } from '@app/shared';
import { SimpleMarkdown } from '../utils/simpleMarkdown';

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface RichTextSectionProps {
  data: {
    content?: string;
    html?: string;
    maxWidth?: string;
    padding?: string;
  };
}

// Parse content to determine if it's JSON blocks or markdown/html
function parseContent(content: string): { isBlocks: boolean; blocks: Block[] } {
  if (!content) return { isBlocks: false, blocks: [] };
  
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return { isBlocks: true, blocks: parsed };
    }
  } catch {
    // Not JSON, treat as markdown/html
  }
  
  return { isBlocks: false, blocks: [] };
}

// Render a single block
function renderBlock(block: Block): React.ReactNode {
  const { type, data } = block;
  
  switch (type) {
    case 'heading': {
      const level = (data.level as number) || 2;
      const text = (data.text as string) || '';
      if (level === 1) return <h1 key={block.id}>{text}</h1>;
      if (level === 2) return <h2 key={block.id}>{text}</h2>;
      return <h3 key={block.id}>{text}</h3>;
    }
    
    case 'paragraph':
      return <p key={block.id}>{(data.text as string) || ''}</p>;
    
    case 'list': {
      const items = (data.items as string[]) || [];
      const ListTag = data.ordered ? 'ol' : 'ul';
      return (
        <ListTag key={block.id}>
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ListTag>
      );
    }
    
    case 'quote': {
      const quoteText = typeof data.text === 'string' ? data.text : '';
      const quoteAuthor = typeof data.author === 'string' ? data.author : '';
      return (
        <blockquote key={block.id}>
          <p>{quoteText}</p>
          {quoteAuthor && <footer>— {quoteAuthor}</footer>}
        </blockquote>
      );
    }
    
    case 'image': {
      const imgUrl = typeof data.url === 'string' ? data.url : '';
      const imgAlt = typeof data.alt === 'string' ? data.alt : '';
      const imgCaption = typeof data.caption === 'string' ? data.caption : '';
      
      if (!imgUrl) return null;
      
      return (
        <figure key={block.id}>
          <img src={imgUrl} alt={imgAlt} />
          {imgCaption && <figcaption>{imgCaption}</figcaption>}
        </figure>
      );
    }
    
    case 'callout': {
      const calloutType = (data.type as string) || 'info';
      const calloutText = (data.text as string) || '';
      const icon = (data.icon as string) || 'ri-information-line';
      
      const colors: Record<string, { bg: string; border: string }> = {
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
    
    case 'divider': {
      const style = (data.style as string) || 'solid';
      return <hr key={block.id} style={{ borderStyle: style }} />;
    }
    
    case 'columns': {
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
    
    default:
      return null;
  }
}

export function RichTextSection({ data }: RichTextSectionProps) {
  const content = data.content || data.html || '';
  const { isBlocks, blocks } = parseContent(content);
  
  // Determine max width based on setting
  const maxWidthMap: Record<string, string> = {
    narrow: '600px',
    default: '800px',
    wide: '1000px',
    full: '100%',
  };
  const maxWidth = maxWidthMap[data.maxWidth || 'default'] || '800px';
  
  // Determine padding based on setting
  const paddingMap: Record<string, string> = {
    none: '24px',
    small: '32px 40px',
    normal: '48px 40px',
    large: '64px 48px',
  };
  const padding = paddingMap[data.padding || 'normal'] || '48px 40px';
  
  return (
    <section
      style={{
        maxWidth: 1200,
        margin: '80px auto',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(26, 27, 30, 0.6) 0%, rgba(19, 19, 22, 0.4) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(245, 211, 147, 0.1)',
          borderRadius: 16,
          padding,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          maxWidth,
          margin: '0 auto',
        }}
        className="rich-text-content"
      >
        <div
          style={{
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.85)',
            fontSize: 16,
          }}
        >
          {isBlocks ? (
            // Render JSON blocks
            blocks.map(renderBlock)
          ) : data.html ? (
            // Render raw HTML
            <div dangerouslySetInnerHTML={{ __html: data.html }} />
          ) : (
            // Render markdown
            <SimpleMarkdown>{content}</SimpleMarkdown>
          )}
        </div>
      </div>

      <style>{`
        .rich-text-content h1,
        .rich-text-content h2,
        .rich-text-content h3,
        .rich-text-content h4 {
          font-family: 'Playfair Display', serif;
          color: ${tokens.color.primary};
          font-weight: 700;
          margin-top: 32px;
          margin-bottom: 16px;
          line-height: 1.3;
        }

        .rich-text-content h1 { font-size: 36px; }
        .rich-text-content h2 { font-size: 28px; }
        .rich-text-content h3 { font-size: 22px; }
        .rich-text-content h4 { font-size: 18px; }

        .rich-text-content h1:first-child,
        .rich-text-content h2:first-child,
        .rich-text-content h3:first-child,
        .rich-text-content h4:first-child {
          margin-top: 0;
        }

        .rich-text-content p {
          margin-bottom: 20px;
          line-height: 1.8;
        }

        .rich-text-content ul,
        .rich-text-content ol {
          margin: 20px 0;
          padding-left: 24px;
        }

        .rich-text-content li {
          margin-bottom: 12px;
          line-height: 1.7;
        }

        .rich-text-content li strong {
          color: ${tokens.color.primary};
          font-weight: 600;
        }

        .rich-text-content a {
          color: ${tokens.color.primary};
          text-decoration: none;
          border-bottom: 1px solid rgba(245, 211, 147, 0.3);
          transition: all 0.3s ease;
        }

        .rich-text-content a:hover {
          border-bottom-color: ${tokens.color.primary};
        }

        .rich-text-content blockquote {
          border-left: 4px solid ${tokens.color.primary};
          padding-left: 20px;
          margin: 24px 0;
          font-style: italic;
          color: rgba(255,255,255,0.7);
        }

        .rich-text-content blockquote footer {
          margin-top: 12px;
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          font-style: normal;
        }

        .rich-text-content code {
          background: rgba(0,0,0,0.3);
          padding: 2px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: ${tokens.color.primary};
        }

        .rich-text-content pre {
          background: rgba(0,0,0,0.5);
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 24px 0;
        }

        .rich-text-content pre code {
          background: none;
          padding: 0;
        }

        .rich-text-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 24px 0;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        .rich-text-content figure {
          margin: 24px 0;
        }

        .rich-text-content figcaption {
          text-align: center;
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          margin-top: 12px;
        }

        .rich-text-content hr {
          border: none;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245, 211, 147, 0.3), transparent);
          margin: 40px 0;
        }

        @media (max-width: 768px) {
          .rich-text-content h1 { font-size: 28px; }
          .rich-text-content h2 { font-size: 24px; }
          .rich-text-content h3 { font-size: 20px; }
          .rich-text-content h4 { font-size: 16px; }
        }
      `}</style>
    </section>
  );
}
