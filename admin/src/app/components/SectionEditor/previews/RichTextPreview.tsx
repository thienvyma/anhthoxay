import type { PreviewProps } from './types';

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export function RichTextPreview({ data }: PreviewProps) {
  const content = data.content || data.html || '';
  
  let blocks: Block[] = [];
  let isBlocksFormat = false;
  
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      blocks = parsed;
      isBlocksFormat = true;
    }
  } catch {
    // Not JSON, treat as markdown/html
  }
  
  if (!content) {
    return <p style={{ color: '#999', fontStyle: 'italic' }}>Chưa có nội dung...</p>;
  }
  
  if (!isBlocksFormat) {
    return (
      <div style={{ color: '#111', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content }} />
    );
  }
  
  return (
    <div style={{ color: '#374151', lineHeight: 1.7 }}>
      {blocks.map((block) => renderBlock(block))}
    </div>
  );
}

function renderBlock(block: Block) {
  const { type, data: blockData } = block;
  
  switch (type) {
    case 'heading': {
      const level = (blockData.level as number) || 2;
      const fontSize = level === 1 ? 28 : level === 2 ? 22 : 18;
      return (
        <div key={block.id} style={{ fontSize, fontWeight: 600, color: '#111827', marginBottom: 12, marginTop: level === 1 ? 24 : 16 }}>
          {(blockData.text as string) || ''}
        </div>
      );
    }
    
    case 'paragraph':
      return (
        <p key={block.id} style={{ marginBottom: 12, color: '#374151' }}>
          {(blockData.text as string) || ''}
        </p>
      );
    
    case 'list': {
      const items = (blockData.items as string[]) || [];
      const ListTag = blockData.ordered ? 'ol' : 'ul';
      return (
        <ListTag key={block.id} style={{ marginBottom: 12, paddingLeft: 24, color: '#374151' }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
          ))}
        </ListTag>
      );
    }
    
    case 'quote': {
      const quoteText = typeof blockData.text === 'string' ? blockData.text : '';
      const quoteAuthor = typeof blockData.author === 'string' ? blockData.author : '';
      return (
        <blockquote key={block.id} style={{ borderLeft: '4px solid #F5D393', paddingLeft: 16, marginLeft: 0, marginBottom: 12, fontStyle: 'italic', color: '#4b5563' }}>
          <p style={{ margin: 0 }}>{quoteText}</p>
          {quoteAuthor && (
            <footer style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>— {quoteAuthor}</footer>
          )}
        </blockquote>
      );
    }
    
    case 'image': {
      const imgUrl = typeof blockData.url === 'string' ? blockData.url : '';
      const imgAlt = typeof blockData.alt === 'string' ? blockData.alt : '';
      const imgCaption = typeof blockData.caption === 'string' ? blockData.caption : '';
      return imgUrl ? (
        <figure key={block.id} style={{ marginBottom: 12 }}>
          <img src={imgUrl} alt={imgAlt} style={{ maxWidth: '100%', borderRadius: 8 }} />
          {imgCaption && (
            <figcaption style={{ marginTop: 8, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>{imgCaption}</figcaption>
          )}
        </figure>
      ) : null;
    }
    
    case 'callout': {
      const calloutType = (blockData.type as string) || 'info';
      const colors: Record<string, { bg: string; border: string; text: string }> = {
        info: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
        success: { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
        warning: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' },
        error: { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B' },
      };
      const color = colors[calloutType] || colors.info;
      return (
        <div key={block.id} style={{ padding: 16, background: color.bg, borderLeft: `4px solid ${color.border}`, borderRadius: 4, marginBottom: 12, color: color.text }}>
          <i className={(blockData.icon as string) || 'ri-information-line'} style={{ marginRight: 8 }} />
          {(blockData.text as string) || ''}
        </div>
      );
    }
    
    case 'divider': {
      const style = (blockData.style as string) || 'solid';
      return <hr key={block.id} style={{ border: 'none', borderTop: `2px ${style} #e5e7eb`, margin: '24px 0' }} />;
    }
    
    case 'columns': {
      const left = typeof blockData.left === 'string' ? blockData.left : '';
      const right = typeof blockData.right === 'string' ? blockData.right : '';
      return (
        <div key={block.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 12 }}>
          <div style={{ color: '#374151' }}>{left}</div>
          <div style={{ color: '#374151' }}>{right}</div>
        </div>
      );
    }
    
    default:
      return null;
  }
}
