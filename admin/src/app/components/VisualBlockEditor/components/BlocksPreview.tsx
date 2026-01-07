import DOMPurify, { Config } from 'dompurify';
import { tokens } from '../../../../theme';
import type { Block } from '../types';

// Configure DOMPurify for block content
const DOMPURIFY_CONFIG: Config = {
  ALLOWED_TAGS: ['br', 'strong', 'em', 'b', 'i', 'u', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
};

interface BlocksPreviewProps {
  blocks: Block[];
}

export function BlocksPreview({ blocks }: BlocksPreviewProps) {
  if (blocks.length === 0) {
    return <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Chưa có nội dung...</p>;
  }

  return (
    <div style={{ color: '#374151', lineHeight: 1.7 }}>
      {blocks.map((block) => (
        <BlockPreviewItem key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockPreviewItem({ block }: { block: Block }) {
  const { type, data } = block;

  switch (type) {
    case 'heading': {
      const level = (data.level as number) || 2;
      const fontSize = level === 1 ? 28 : level === 2 ? 22 : 18;
      return (
        <div style={{ fontSize, fontWeight: 600, color: '#111827', marginBottom: 12, marginTop: level === 1 ? 24 : 16 }}>
          {(data.text as string) || ''}
        </div>
      );
    }

    case 'paragraph':
      return (
        <p
          style={{
            marginBottom: 12,
            color: (data.textColor as string) || '#374151',
            backgroundColor: data.backgroundColor ? (data.backgroundColor as string) : undefined,
            padding: data.backgroundColor ? '12px 16px' : undefined,
            borderRadius: data.backgroundColor ? 8 : undefined,
            textAlign: (data.align as 'left' | 'center' | 'right') || 'left',
          }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((data.text as string) || '', DOMPURIFY_CONFIG) }}
        />
      );

    case 'list': {
      const items = (data.items as string[]) || [];
      const isOrdered = data.ordered as boolean;
      return (
        <div style={{ margin: '16px 0', padding: '12px 16px', background: `${tokens.color.primary}08`, borderRadius: 8, border: `1px solid ${tokens.color.primary}15`, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: `2px solid ${tokens.color.primary}4D`, borderLeft: `2px solid ${tokens.color.primary}4D`, borderRadius: '8px 0 0 0', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottom: `2px solid ${tokens.color.primary}4D`, borderRight: `2px solid ${tokens.color.primary}4D`, borderRadius: '0 0 8px 0', pointerEvents: 'none' }} />
          {isOrdered ? (
            <ol style={{ margin: 0, paddingLeft: 16, listStyle: 'none', counterReset: 'item' }}>
              {items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: idx === items.length - 1 ? 0 : 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ minWidth: 20, height: 20, borderRadius: '50%', background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`, color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{idx + 1}</span>
                  <span style={{ color: '#374151' }}>{item}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: idx === items.length - 1 ? 0 : 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`, flexShrink: 0, marginTop: 6, boxShadow: `0 0 6px ${tokens.color.primary}66` }} />
                  <span style={{ color: '#374151' }}>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    case 'quote': {
      const quoteText = typeof data.text === 'string' ? data.text : '';
      const quoteAuthor = typeof data.author === 'string' ? data.author : '';
      const glassColor = typeof data.glassColor === 'string' ? data.glassColor : '#F5D393';
      const textColor = typeof data.textColor === 'string' ? data.textColor : '#4b5563';
      return (
        <div style={{ margin: '16px 0', padding: '10px 16px', background: `linear-gradient(90deg, ${glassColor}20 0%, ${glassColor}10 40%, transparent 100%)`, borderRadius: 6, textAlign: 'center' }}>
          <blockquote style={{ margin: 0, padding: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontStyle: 'italic', color: textColor, lineHeight: 1.6 }}>" {quoteText} "</p>
            {quoteAuthor && (
              <footer style={{ marginTop: 8, textAlign: 'center' }}>
                <span style={{ fontSize: 12, color: glassColor, fontWeight: 500, fontStyle: 'normal' }}>{quoteAuthor}</span>
              </footer>
            )}
          </blockquote>
        </div>
      );
    }

    case 'image': {
      const imgUrl = typeof data.url === 'string' ? data.url : '';
      const imgAlt = typeof data.alt === 'string' ? data.alt : '';
      const imgCaption = typeof data.caption === 'string' ? data.caption : '';
      return imgUrl ? (
        <figure style={{ margin: '16px 0', position: 'relative' }}>
          <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <img src={imgUrl} alt={imgAlt} style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, background: 'linear-gradient(0deg, rgba(255,255,255,0.3), transparent)', pointerEvents: 'none' }} />
          </div>
          {imgCaption && <figcaption style={{ marginTop: 8, fontSize: 13, color: '#6b7280', textAlign: 'center', fontStyle: 'italic' }}>{imgCaption}</figcaption>}
        </figure>
      ) : null;
    }

    case 'callout': {
      const colors: Record<string, { bg: string; border: string; text: string }> = {
        info: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
        success: { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
        warning: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' },
        error: { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B' },
      };
      const style = colors[(data.type as string) || 'info'];
      return (
        <div style={{ background: style.bg, borderLeft: `4px solid ${style.border}`, padding: 16, borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <i className={(data.icon as string) || 'ri-information-line'} style={{ fontSize: 20, color: style.border }} />
          <p style={{ margin: 0, color: style.text }}>{(data.text as string) || ''}</p>
        </div>
      );
    }

    case 'divider': {
      const dividerStyle = (data.style as string) || 'solid';
      if (dividerStyle === 'dashed') {
        return (
          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} style={{ width: i === 3 ? 8 : 16, height: i === 3 ? 8 : 2, borderRadius: i === 3 ? '50%' : 1, background: i === 3 ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})` : `${tokens.color.primary}${Math.round((0.2 + Math.abs(3 - i) * 0.08) * 255).toString(16).padStart(2, '0')}`, boxShadow: i === 3 ? `0 0 8px ${tokens.color.primary}66` : 'none' }} />
            ))}
          </div>
        );
      }
      if (dividerStyle === 'dotted') {
        return (
          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: i === 2 ? 8 : 5, height: i === 2 ? 8 : 5, borderRadius: '50%', background: i === 2 ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})` : `${tokens.color.primary}${Math.round((0.25 + Math.abs(2 - i) * 0.12) * 255).toString(16).padStart(2, '0')}`, boxShadow: i === 2 ? `0 0 10px ${tokens.color.primary}80` : 'none' }} />
            ))}
          </div>
        );
      }
      return (
        <div style={{ margin: '28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${tokens.color.primary}66)` }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: `${tokens.color.primary}4D` }} />
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`, boxShadow: `0 0 8px ${tokens.color.primary}66` }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: `${tokens.color.primary}4D` }} />
          </div>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, transparent, ${tokens.color.primary}66)` }} />
        </div>
      );
    }

    case 'columns':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 12 }}>
          <div style={{ color: '#374151' }}>{(data.left as string) || ''}</div>
          <div style={{ color: '#374151' }}>{(data.right as string) || ''}</div>
        </div>
      );

    default:
      return null;
  }
}
