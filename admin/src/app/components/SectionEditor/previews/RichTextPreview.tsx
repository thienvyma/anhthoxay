import { resolveMediaUrl } from '@app/shared';
import type { PreviewProps } from './types';

interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export function RichTextPreview({ data }: PreviewProps) {
  const content = data.content || data.html || '';
  const layout = (data.layout as string) || 'default';
  const textAlign = (data.textAlign as string) || 'left';
  const maxWidth = (data.maxWidth as string) || 'wide';
  const showDecorations = data.showDecorations !== false;
  const backgroundImage = data.backgroundImage ? resolveMediaUrl(data.backgroundImage as string) : '';
  const backgroundOverlay = (data.backgroundOverlay as number) ?? 70;
  
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

  // Max width mapping for preview
  const maxWidthMap: Record<string, string> = {
    narrow: '70%',
    default: '85%',
    wide: '100%',
    full: '100%',
  };
  const previewMaxWidth = maxWidthMap[maxWidth] || '100%';

  const renderContent = (isDark = false) => {
    if (!isBlocksFormat) {
      return (
        <div 
          style={{ 
            color: isDark ? 'rgba(255,255,255,0.85)' : '#374151', 
            lineHeight: 1.7, 
            textAlign: textAlign as 'left' | 'center' | 'right',
            maxWidth: previewMaxWidth,
            margin: textAlign === 'center' ? '0 auto' : textAlign === 'right' ? '0 0 0 auto' : '0',
          }} 
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      );
    }
    
    return (
      <div style={{ 
        color: isDark ? 'rgba(255,255,255,0.85)' : '#374151', 
        lineHeight: 1.7, 
        textAlign: textAlign as 'left' | 'center' | 'right',
        maxWidth: previewMaxWidth,
        margin: textAlign === 'center' ? '0 auto' : textAlign === 'right' ? '0 0 0 auto' : '0',
      }}>
        {blocks.map((block) => isDark ? renderBlockLight(block, textAlign) : renderBlock(block, textAlign))}
      </div>
    );
  };

  // Layout badge
  const layoutLabels: Record<string, string> = {
    default: 'Card',
    centered: 'Căn giữa',
    'split-left': 'Ảnh trái',
    'split-right': 'Ảnh phải',
    'full-width': 'Full width',
  };

  // Split layout preview - seamless design matching landing page
  if (layout === 'split-left' || layout === 'split-right') {
    const isImageLeft = layout === 'split-left';
    
    // Get image ratio from slider (default 40%)
    const imagePercent = (data.imageRatio as number) || 40;
    const contentPercent = 100 - imagePercent;
    
    // Generate grid template based on ratio
    const gridTemplate = backgroundImage 
      ? `${imagePercent}fr ${contentPercent}fr`
      : '1fr';
    
    return (
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 12,
          padding: '6px 10px',
          background: 'rgba(167, 139, 250, 0.1)',
          borderRadius: 6,
          width: 'fit-content',
        }}>
          <i className="ri-layout-column-line" style={{ color: '#a78bfa', fontSize: 14 }} />
          <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 500 }}>{layoutLabels[layout]}</span>
          <span style={{ fontSize: 11, color: '#a78bfa', opacity: 0.7 }}>({imagePercent}% : {contentPercent}%)</span>
          {!backgroundImage && (
            <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 8 }}>⚠️ Chưa có ảnh</span>
          )}
        </div>
        {/* Seamless container - no gap */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: gridTemplate, 
          alignItems: 'stretch',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          {isImageLeft && backgroundImage && (
            <div style={{ 
              position: 'relative',
              minHeight: 180,
            }}>
              <img 
                src={backgroundImage} 
                alt="" 
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }} 
              />
              {/* Glass fade overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 30,
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(19, 19, 22, 0.6))',
              }} />
            </div>
          )}
          <div style={{ 
            background: 'linear-gradient(135deg, #1a1b1e 0%, #131316 100%)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Glass divider line */}
            <div style={{
              position: 'absolute',
              top: 12,
              bottom: 12,
              [isImageLeft ? 'left' : 'right']: 0,
              width: 1,
              background: 'linear-gradient(180deg, transparent, rgba(245, 211, 147, 0.25), transparent)',
            }} />
            {renderContent(true)}
          </div>
          {!isImageLeft && backgroundImage && (
            <div style={{ 
              position: 'relative',
              minHeight: 180,
            }}>
              <img 
                src={backgroundImage} 
                alt="" 
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }} 
              />
              {/* Glass fade overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 30,
                height: '100%',
                background: 'linear-gradient(270deg, transparent, rgba(19, 19, 22, 0.6))',
              }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full-width layout preview
  if (layout === 'full-width') {
    return (
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 12,
          padding: '6px 10px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: 6,
          width: 'fit-content',
        }}>
          <i className="ri-fullscreen-line" style={{ color: '#3B82F6', fontSize: 14 }} />
          <span style={{ fontSize: 12, color: '#3B82F6', fontWeight: 500 }}>{layoutLabels[layout]}</span>
        </div>
        <div style={{ 
          background: backgroundImage 
            ? `linear-gradient(rgba(0,0,0,${backgroundOverlay / 100}), rgba(0,0,0,${backgroundOverlay / 100})), url(${backgroundImage}) center/cover`
            : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: 8, 
          padding: 24,
        }}>
          {renderContent(true)}
        </div>
      </div>
    );
  }

  // Centered layout preview
  if (layout === 'centered') {
    return (
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 12,
          padding: '6px 10px',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: 6,
          width: 'fit-content',
        }}>
          <i className="ri-align-center" style={{ color: '#F59E0B', fontSize: 14 }} />
          <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 500 }}>{layoutLabels[layout]}</span>
        </div>
        <div style={{ textAlign: 'center', background: '#0b0c0f', borderRadius: 8, padding: 20 }}>
          {showDecorations && (
            <div style={{ 
              width: 60, 
              height: 3, 
              background: 'linear-gradient(90deg, #F5D393, #EFB679)', 
              margin: '0 auto 16px',
              borderRadius: 2,
            }} />
          )}
          {renderContent(true)}
          {showDecorations && (
            <div style={{ 
              width: 60, 
              height: 3, 
              background: 'linear-gradient(90deg, #F5D393, #EFB679)', 
              margin: '16px auto 0',
              borderRadius: 2,
            }} />
          )}
        </div>
      </div>
    );
  }
  
  // Default card layout
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 12,
        padding: '6px 10px',
        background: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 6,
        width: 'fit-content',
      }}>
        <i className="ri-layout-4-line" style={{ color: '#10B981', fontSize: 14 }} />
        <span style={{ fontSize: 12, color: '#10B981', fontWeight: 500 }}>{layoutLabels[layout]}</span>
      </div>
      <div style={{ 
        background: 'linear-gradient(135deg, #1a1b1e 0%, #131316 100%)',
        borderRadius: 8, 
        padding: 20,
        border: '1px solid rgba(245, 211, 147, 0.1)',
      }}>
        {renderContent(true)}
      </div>
    </div>
  );
}

// Light theme block renderer for dark backgrounds
function renderBlockLight(block: Block, textAlign: string) {
  const { type, data: blockData } = block;
  const blockAlign = (blockData.align as string) || textAlign;

  switch (type) {
    case 'heading': {
      const level = (blockData.level as number) || 2;
      const fontSize = level === 1 ? 22 : level === 2 ? 18 : 15;
      return (
        <div
          key={block.id}
          style={{
            fontSize,
            fontWeight: 600,
            color: '#F5D393',
            marginBottom: 8,
            marginTop: level === 1 ? 16 : 12,
            textAlign: blockAlign as 'left' | 'center' | 'right',
            fontFamily: 'Playfair Display, serif',
          }}
        >
          {(blockData.text as string) || ''}
        </div>
      );
    }

    case 'paragraph': {
      const backgroundColor = blockData.backgroundColor as string | undefined;
      const textColor = (blockData.textColor as string) || 'rgba(255,255,255,0.85)';
      return (
        <p
          key={block.id}
          style={{
            marginBottom: 8,
            color: textColor,
            backgroundColor: backgroundColor || undefined,
            padding: backgroundColor ? '12px 16px' : undefined,
            borderRadius: backgroundColor ? 8 : undefined,
            textAlign: blockAlign as 'left' | 'center' | 'right',
          }}
          dangerouslySetInnerHTML={{ __html: (blockData.text as string) || '' }}
        />
      );
    }
    
    case 'list': {
      const items = (blockData.items as string[]) || [];
      const isOrdered = blockData.ordered as boolean;
      return (
        <div
          key={block.id}
          style={{
            margin: '16px 0',
            padding: '12px 16px',
            background: 'rgba(245, 211, 147, 0.03)',
            borderRadius: 8,
            border: '1px solid rgba(245, 211, 147, 0.08)',
            position: 'relative',
          }}
        >
          {/* Corner accents */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 24,
            height: 24,
            borderTop: '2px solid rgba(245, 211, 147, 0.25)',
            borderLeft: '2px solid rgba(245, 211, 147, 0.25)',
            borderRadius: '8px 0 0 0',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 24,
            height: 24,
            borderBottom: '2px solid rgba(245, 211, 147, 0.25)',
            borderRight: '2px solid rgba(245, 211, 147, 0.25)',
            borderRadius: '0 0 8px 0',
            pointerEvents: 'none',
          }} />
          
          {isOrdered ? (
            <ol style={{ margin: 0, paddingLeft: 16, listStyle: 'none', counterReset: 'item' }}>
              {items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: idx === items.length - 1 ? 0 : 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F5D393, #EFB679)',
                    color: '#111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>{item}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: idx === items.length - 1 ? 0 : 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F5D393, #EFB679)',
                    flexShrink: 0,
                    marginTop: 6,
                    boxShadow: '0 0 6px rgba(245, 211, 147, 0.4)',
                  }} />
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    
    case 'quote': {
      const quoteText = typeof blockData.text === 'string' ? blockData.text : '';
      const quoteAuthor = typeof blockData.author === 'string' ? blockData.author : '';
      const glassColor = typeof blockData.glassColor === 'string' ? blockData.glassColor : '#F5D393';
      const textColor = typeof blockData.textColor === 'string' ? blockData.textColor : 'rgba(255,255,255,0.9)';

      return (
        <div
          key={block.id}
          style={{
            margin: '16px 0',
            padding: '14px 18px',
            background: `linear-gradient(90deg, ${glassColor}18 0%, ${glassColor}08 40%, transparent 100%)`,
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
    
    case 'image': {
      const imgUrl = typeof blockData.url === 'string' ? blockData.url : '';
      const imgCaption = typeof blockData.caption === 'string' ? blockData.caption : '';
      const resolvedUrl = imgUrl ? resolveMediaUrl(imgUrl) : '';
      return resolvedUrl ? (
        <figure key={block.id} style={{ margin: '16px 0', position: 'relative' }}>
          {/* Image with glass effect */}
          <div style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            <img 
              src={resolvedUrl} 
              alt="" 
              style={{ 
                width: '100%', 
                height: 'auto',
                display: 'block',
                objectFit: 'cover' 
              }} 
            />
            {/* Glass overlays */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 20,
              background: 'linear-gradient(180deg, rgba(19, 19, 22, 0.4), transparent)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 20,
              background: 'linear-gradient(0deg, rgba(19, 19, 22, 0.4), transparent)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              border: '1px solid rgba(245, 211, 147, 0.1)',
              borderRadius: 8,
              pointerEvents: 'none',
            }} />
          </div>
          {imgCaption && (
            <figcaption style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontStyle: 'italic' }}>
              {imgCaption}
            </figcaption>
          )}
        </figure>
      ) : null;
    }
    
    case 'divider': {
      const dividerStyle = (blockData.style as string) || 'solid';
      
      if (dividerStyle === 'dashed') {
        return (
          <div key={block.id} style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === 3 ? 8 : 16,
                  height: i === 3 ? 8 : 2,
                  borderRadius: i === 3 ? '50%' : 1,
                  background: i === 3 
                    ? 'linear-gradient(135deg, #F5D393, #EFB679)'
                    : `rgba(245, 211, 147, ${0.15 + Math.abs(3 - i) * 0.05})`,
                  boxShadow: i === 3 ? '0 0 8px rgba(245, 211, 147, 0.3)' : 'none',
                }}
              />
            ))}
          </div>
        );
      }
      
      if (dividerStyle === 'dotted') {
        return (
          <div key={block.id} style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === 2 ? 8 : 5,
                  height: i === 2 ? 8 : 5,
                  borderRadius: '50%',
                  background: i === 2 
                    ? 'linear-gradient(135deg, #F5D393, #EFB679)'
                    : `rgba(245, 211, 147, ${0.2 + Math.abs(2 - i) * 0.1})`,
                  boxShadow: i === 2 ? '0 0 10px rgba(245, 211, 147, 0.4)' : 'none',
                }}
              />
            ))}
          </div>
        );
      }
      
      // Default solid style
      return (
        <div key={block.id} style={{ margin: '28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(245, 211, 147, 0.35))' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(245, 211, 147, 0.25)' }} />
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(135deg, #F5D393, #EFB679)', boxShadow: '0 0 8px rgba(245, 211, 147, 0.3)' }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(245, 211, 147, 0.25)' }} />
          </div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg, transparent, rgba(245, 211, 147, 0.35))' }} />
        </div>
      );
    }
    
    default:
      return renderBlock(block, textAlign);
  }
}

function renderBlock(block: Block, textAlign: string) {
  const { type, data: blockData } = block;
  const blockAlign = (blockData.align as string) || textAlign;

  switch (type) {
    case 'heading': {
      const level = (blockData.level as number) || 2;
      const fontSize = level === 1 ? 24 : level === 2 ? 20 : 16;
      return (
        <div
          key={block.id}
          style={{
            fontSize,
            fontWeight: 600,
            color: '#111827',
            marginBottom: 12,
            marginTop: level === 1 ? 20 : 14,
            textAlign: blockAlign as 'left' | 'center' | 'right',
          }}
        >
          {(blockData.text as string) || ''}
        </div>
      );
    }

    case 'paragraph': {
      const backgroundColor = blockData.backgroundColor as string | undefined;
      const textColor = (blockData.textColor as string) || '#374151';
      return (
        <p
          key={block.id}
          style={{
            marginBottom: 12,
            color: textColor,
            backgroundColor: backgroundColor || undefined,
            padding: backgroundColor ? '12px 16px' : undefined,
            borderRadius: backgroundColor ? 8 : undefined,
            textAlign: blockAlign as 'left' | 'center' | 'right',
          }}
          dangerouslySetInnerHTML={{ __html: (blockData.text as string) || '' }}
        />
      );
    }
    
    case 'list': {
      const items = (blockData.items as string[]) || [];
      const isOrdered = blockData.ordered as boolean;
      return (
        <div
          key={block.id}
          style={{
            margin: '16px 0',
            padding: '12px 16px',
            background: 'rgba(245, 211, 147, 0.05)',
            borderRadius: 8,
            border: '1px solid rgba(245, 211, 147, 0.1)',
            position: 'relative',
          }}
        >
          {/* Corner accents */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 24,
            height: 24,
            borderTop: '2px solid rgba(245, 211, 147, 0.3)',
            borderLeft: '2px solid rgba(245, 211, 147, 0.3)',
            borderRadius: '8px 0 0 0',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 24,
            height: 24,
            borderBottom: '2px solid rgba(245, 211, 147, 0.3)',
            borderRight: '2px solid rgba(245, 211, 147, 0.3)',
            borderRadius: '0 0 8px 0',
            pointerEvents: 'none',
          }} />
          
          {isOrdered ? (
            <ol style={{ margin: 0, paddingLeft: 16, listStyle: 'none', counterReset: 'item' }}>
              {items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: idx === items.length - 1 ? 0 : 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F5D393, #EFB679)',
                    color: '#111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 1,
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ color: '#374151' }}>{item}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: idx === items.length - 1 ? 0 : 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F5D393, #EFB679)',
                    flexShrink: 0,
                    marginTop: 6,
                    boxShadow: '0 0 6px rgba(245, 211, 147, 0.4)',
                  }} />
                  <span style={{ color: '#374151' }}>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    
    case 'quote': {
      const quoteText = typeof blockData.text === 'string' ? blockData.text : '';
      const quoteAuthor = typeof blockData.author === 'string' ? blockData.author : '';
      const glassColor = typeof blockData.glassColor === 'string' ? blockData.glassColor : '#F5D393';
      const textColor = typeof blockData.textColor === 'string' ? blockData.textColor : '#4b5563';

      return (
        <div
          key={block.id}
          style={{
            margin: '16px 0',
            padding: '14px 18px',
            background: `linear-gradient(90deg, ${glassColor}20 0%, ${glassColor}10 40%, transparent 100%)`,
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
    
    case 'image': {
      const imgUrl = typeof blockData.url === 'string' ? blockData.url : '';
      const imgAlt = typeof blockData.alt === 'string' ? blockData.alt : '';
      const imgCaption = typeof blockData.caption === 'string' ? blockData.caption : '';
      const resolvedUrl = imgUrl ? resolveMediaUrl(imgUrl) : '';
      return resolvedUrl ? (
        <figure key={block.id} style={{ marginBottom: 12, textAlign: blockAlign as 'left' | 'center' | 'right' }}>
          <img src={resolvedUrl} alt={imgAlt} style={{ maxWidth: '100%', borderRadius: 8 }} />
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
        <div key={block.id} style={{ padding: 12, background: color.bg, borderLeft: `4px solid ${color.border}`, borderRadius: 4, marginBottom: 12, color: color.text, fontSize: 13 }}>
          <i className={(blockData.icon as string) || 'ri-information-line'} style={{ marginRight: 8 }} />
          {(blockData.text as string) || ''}
        </div>
      );
    }
    
    case 'divider': {
      const dividerStyle = (blockData.style as string) || 'solid';
      
      if (dividerStyle === 'dashed') {
        return (
          <div key={block.id} style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === 3 ? 8 : 16,
                  height: i === 3 ? 8 : 2,
                  borderRadius: i === 3 ? '50%' : 1,
                  background: i === 3 
                    ? 'linear-gradient(135deg, #F5D393, #EFB679)'
                    : `rgba(245, 211, 147, ${0.2 + Math.abs(3 - i) * 0.08})`,
                  boxShadow: i === 3 ? '0 0 8px rgba(245, 211, 147, 0.4)' : 'none',
                }}
              />
            ))}
          </div>
        );
      }
      
      if (dividerStyle === 'dotted') {
        return (
          <div key={block.id} style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === 2 ? 8 : 5,
                  height: i === 2 ? 8 : 5,
                  borderRadius: '50%',
                  background: i === 2 
                    ? 'linear-gradient(135deg, #F5D393, #EFB679)'
                    : `rgba(245, 211, 147, ${0.25 + Math.abs(2 - i) * 0.12})`,
                  boxShadow: i === 2 ? '0 0 10px rgba(245, 211, 147, 0.5)' : 'none',
                }}
              />
            ))}
          </div>
        );
      }
      
      // Default solid style
      return (
        <div key={block.id} style={{ margin: '28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(245, 211, 147, 0.4))' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(245, 211, 147, 0.3)' }} />
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(135deg, #F5D393, #EFB679)', boxShadow: '0 0 8px rgba(245, 211, 147, 0.4)' }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(245, 211, 147, 0.3)' }} />
          </div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg, transparent, rgba(245, 211, 147, 0.4))' }} />
        </div>
      );
    }
    
    case 'columns': {
      const left = typeof blockData.left === 'string' ? blockData.left : '';
      const right = typeof blockData.right === 'string' ? blockData.right : '';
      return (
        <div key={block.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
          <div style={{ color: '#374151', fontSize: 13 }}>{left}</div>
          <div style={{ color: '#374151', fontSize: 13 }}>{right}</div>
        </div>
      );
    }
    
    default:
      return null;
  }
}
