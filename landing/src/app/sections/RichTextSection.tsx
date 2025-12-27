import { tokens, resolveMediaUrl } from '@app/shared';
import { motion } from 'framer-motion';
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
    // New layout options
    layout?: 'default' | 'centered' | 'split-left' | 'split-right' | 'full-width';
    textAlign?: 'left' | 'center' | 'right';
    backgroundImage?: string;
    backgroundOverlay?: number;
    showDecorations?: boolean;
    verticalPadding?: 'small' | 'medium' | 'large';
    // Image ratio for split layouts (percentage, 15-70)
    imageRatio?: number;
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
function renderBlock(block: Block, textAlign: string): React.ReactNode {
  const { type, data } = block;
  // Get block-level alignment if specified, otherwise use section default
  const blockAlign = (data.align as string) || textAlign;
  
  switch (type) {
    case 'heading': {
      const level = (data.level as number) || 2;
      const text = (data.text as string) || '';
      const style = { textAlign: blockAlign as 'left' | 'center' | 'right' };
      if (level === 1) return <h1 key={block.id} style={style}>{text}</h1>;
      if (level === 2) return <h2 key={block.id} style={style}>{text}</h2>;
      return <h3 key={block.id} style={style}>{text}</h3>;
    }
    
    case 'paragraph': {
      const paragraphText = (data.text as string) || '';
      const paragraphAlign = (blockAlign as 'left' | 'center' | 'right') || 'left';
      const backgroundColor = data.backgroundColor as string | undefined;
      const textColor = data.textColor as string | undefined;
      
      return (
        <p 
          key={block.id} 
          style={{ 
            textAlign: paragraphAlign,
            backgroundColor: backgroundColor || undefined,
            color: textColor || undefined,
            padding: backgroundColor ? '16px 20px' : undefined,
            borderRadius: backgroundColor ? 8 : undefined,
            margin: backgroundColor ? '20px 0' : undefined,
          }}
          dangerouslySetInnerHTML={{ __html: paragraphText }}
        />
      );
    }
    
    case 'list': {
      const items = (data.items as string[]) || [];
      const isOrdered = data.ordered as boolean;
      return (
        <div
          key={block.id}
          className="rich-text-list-block"
          style={{
            margin: '28px 0',
            padding: '20px 24px',
            background: 'rgba(245, 211, 147, 0.03)',
            borderRadius: 12,
            border: '1px solid rgba(245, 211, 147, 0.08)',
            position: 'relative',
          }}
        >
          {/* Decorative corner accent */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 40,
              height: 40,
              borderTop: '2px solid rgba(245, 211, 147, 0.3)',
              borderLeft: '2px solid rgba(245, 211, 147, 0.3)',
              borderRadius: '12px 0 0 0',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 40,
              height: 40,
              borderBottom: '2px solid rgba(245, 211, 147, 0.3)',
              borderRight: '2px solid rgba(245, 211, 147, 0.3)',
              borderRadius: '0 0 12px 0',
              pointerEvents: 'none',
            }}
          />
          
          {isOrdered ? (
            <ol style={{ margin: 0, paddingLeft: 24, listStyle: 'none', counterReset: 'item' }}>
              {items.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: idx === items.length - 1 ? 0 : 14,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    lineHeight: 1.7,
                  }}
                >
                  <span
                    style={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                      color: '#111',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>{item}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {items.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: idx === items.length - 1 ? 0 : 14,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    lineHeight: 1.7,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                      flexShrink: 0,
                      marginTop: 8,
                      boxShadow: `0 0 8px ${tokens.color.primary}50`,
                    }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>{item}</span>
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
    
    case 'image': {
      const imgUrl = typeof data.url === 'string' ? data.url : '';
      const imgAlt = typeof data.alt === 'string' ? data.alt : '';
      const imgCaption = typeof data.caption === 'string' ? data.caption : '';
      
      if (!imgUrl) return null;
      
      // Resolve media URL for images uploaded via admin
      const resolvedUrl = resolveMediaUrl(imgUrl);
      
      return (
        <figure 
          key={block.id} 
          className="rich-text-image-block"
          style={{ 
            margin: '32px 0',
            position: 'relative',
          }}
        >
          {/* Glass divider top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 30,
              background: 'linear-gradient(180deg, rgba(19, 19, 22, 0.8), transparent)',
              zIndex: 1,
              pointerEvents: 'none',
              borderRadius: '12px 12px 0 0',
            }}
          />
          
          {/* Image container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              overflow: 'hidden',
              borderRadius: 12,
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            }}
          >
            <img 
              src={resolvedUrl} 
              alt={imgAlt}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'cover',
              }}
            />
            
            {/* Glass overlay edges */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 40,
                background: 'linear-gradient(180deg, rgba(19, 19, 22, 0.5), transparent)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 40,
                background: 'linear-gradient(0deg, rgba(19, 19, 22, 0.5), transparent)',
                pointerEvents: 'none',
              }}
            />
            
            {/* Subtle border glow */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '1px solid rgba(245, 211, 147, 0.15)',
                borderRadius: 12,
                pointerEvents: 'none',
              }}
            />
          </div>
          
          {/* Glass divider bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: imgCaption ? 40 : 0,
              left: 0,
              right: 0,
              height: 30,
              background: 'linear-gradient(0deg, rgba(19, 19, 22, 0.8), transparent)',
              zIndex: 1,
              pointerEvents: 'none',
              borderRadius: '0 0 12px 12px',
            }}
          />
          
          {imgCaption && (
            <figcaption
              style={{
                textAlign: 'center',
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
                marginTop: 16,
                fontStyle: 'italic',
              }}
            >
              {imgCaption}
            </figcaption>
          )}
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
      const dividerStyle = (data.style as string) || 'solid';
      
      // Different divider styles
      if (dividerStyle === 'dashed') {
        return (
          <div
            key={block.id}
            style={{
              margin: '40px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === 3 ? 12 : 24,
                  height: i === 3 ? 12 : 3,
                  borderRadius: i === 3 ? '50%' : 2,
                  background: i === 3 
                    ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`
                    : `rgba(245, 211, 147, ${0.15 + Math.abs(3 - i) * 0.05})`,
                  boxShadow: i === 3 ? `0 0 12px ${tokens.color.primary}40` : 'none',
                }}
              />
            ))}
          </div>
        );
      }
      
      if (dividerStyle === 'dotted') {
        return (
          <div
            key={block.id}
            style={{
              margin: '40px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === 2 ? 10 : 6,
                  height: i === 2 ? 10 : 6,
                  borderRadius: '50%',
                  background: i === 2 
                    ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`
                    : `rgba(245, 211, 147, ${0.2 + Math.abs(2 - i) * 0.1})`,
                  boxShadow: i === 2 ? `0 0 16px ${tokens.color.primary}50` : 'none',
                }}
              />
            ))}
          </div>
        );
      }
      
      // Default solid style - elegant gradient line with center ornament
      return (
        <div
          key={block.id}
          style={{
            margin: '48px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* Left line */}
          <div
            style={{
              flex: 1,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(245, 211, 147, 0.4))',
            }}
          />
          
          {/* Center ornament */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: `rgba(245, 211, 147, 0.3)`,
              }}
            />
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                boxShadow: `0 0 12px ${tokens.color.primary}40`,
              }}
            />
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: `rgba(245, 211, 147, 0.3)`,
              }}
            />
          </div>
          
          {/* Right line */}
          <div
            style={{
              flex: 1,
              height: 1,
              background: 'linear-gradient(270deg, transparent, rgba(245, 211, 147, 0.4))',
            }}
          />
        </div>
      );
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
  
  const layout = data.layout || 'default';
  const textAlign = data.textAlign || 'left';
  const showDecorations = data.showDecorations !== false;
  const backgroundImage = resolveMediaUrl(data.backgroundImage);
  const backgroundOverlay = data.backgroundOverlay ?? 70;
  
  // Determine max width based on setting - default to wide for consistency with other sections
  const maxWidthMap: Record<string, string> = {
    narrow: '700px',
    default: '900px',
    wide: '1100px',
    full: '100%',
  };
  const maxWidth = maxWidthMap[data.maxWidth || 'wide'] || '1100px';
  
  // Determine padding based on setting
  const paddingMap: Record<string, string> = {
    none: '24px',
    small: '32px 40px',
    normal: '48px 40px',
    large: '64px 48px',
  };
  const padding = paddingMap[data.padding || 'normal'] || '48px 40px';

  // Vertical padding for section
  const verticalPaddingMap: Record<string, string> = {
    small: '40px',
    medium: '80px',
    large: '120px',
  };
  const verticalPadding = verticalPaddingMap[data.verticalPadding || 'medium'] || '80px';

  // Render content
  const renderContent = () => (
    <div
      style={{
        lineHeight: 1.8,
        color: 'rgba(255,255,255,0.85)',
        fontSize: 16,
        textAlign: textAlign as 'left' | 'center' | 'right',
      }}
    >
      {isBlocks ? (
        blocks.map((block) => renderBlock(block, textAlign))
      ) : data.html ? (
        <div dangerouslySetInnerHTML={{ __html: data.html }} />
      ) : (
        <SimpleMarkdown>{content}</SimpleMarkdown>
      )}
    </div>
  );

  // Full-width layout with background image
  if (layout === 'full-width') {
    return (
      <section
        style={{
          position: 'relative',
          padding: `${verticalPadding} 24px`,
          background: backgroundImage
            ? `linear-gradient(rgba(0,0,0,${backgroundOverlay / 100}), rgba(0,0,0,${backgroundOverlay / 100})), url(${backgroundImage})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Animated light effect */}
        {showDecorations && !backgroundImage && (
          <motion.div
            animate={{
              background: [
                'radial-gradient(600px circle at 20% 30%, rgba(255,255,255,0.03), transparent 50%)',
                'radial-gradient(600px circle at 80% 70%, rgba(255,255,255,0.03), transparent 50%)',
                'radial-gradient(600px circle at 20% 30%, rgba(255,255,255,0.03), transparent 50%)',
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          />
        )}
        
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <div style={{ maxWidth, margin: textAlign === 'center' ? '0 auto' : textAlign === 'right' ? '0 0 0 auto' : '0' }}>
            {renderContent()}
          </div>
        </div>
        
        <style>{getStyles()}</style>
      </section>
    );
  }

  // Split layout (image + content) - seamless design with glass divider
  if (layout === 'split-left' || layout === 'split-right') {
    const isImageLeft = layout === 'split-left';
    
    // Get image ratio from slider (default 40%)
    const imagePercent = data.imageRatio || 40;
    const contentPercent = 100 - imagePercent;
    
    // Generate grid template based on ratio
    const gridTemplate = backgroundImage 
      ? `${imagePercent}fr ${contentPercent}fr`
      : '1fr';
    
    return (
      <section
        style={{
          maxWidth: 1400,
          margin: `${verticalPadding} auto`,
          padding: '0 24px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            alignItems: 'stretch',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            position: 'relative',
          }}
          className="rich-text-split-grid"
        >
          {/* Image side - Left */}
          {isImageLeft && backgroundImage && (
            <div
              style={{
                position: 'relative',
                minHeight: 400,
              }}
            >
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
              {/* Glass divider overlay on right edge */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 40,
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(19, 19, 22, 0.7))',
                  pointerEvents: 'none',
                }}
              />
            </div>
          )}
          
          {/* Content side */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(26, 27, 30, 0.6) 0%, rgba(19, 19, 22, 0.4) 100%)',
              backdropFilter: 'blur(20px)',
              padding,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}
            className="rich-text-content"
          >
            {/* Glass divider line */}
            <div
              style={{
                position: 'absolute',
                top: 20,
                bottom: 20,
                [isImageLeft ? 'left' : 'right']: 0,
                width: 1,
                background: 'linear-gradient(180deg, transparent 0%, rgba(245, 211, 147, 0.3) 20%, rgba(245, 211, 147, 0.3) 80%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
            {renderContent()}
          </div>
          
          {/* Image side - Right */}
          {!isImageLeft && backgroundImage && (
            <div
              style={{
                position: 'relative',
                minHeight: 400,
              }}
            >
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
              {/* Glass divider overlay on left edge */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 40,
                  height: '100%',
                  background: 'linear-gradient(270deg, transparent, rgba(19, 19, 22, 0.7))',
                  pointerEvents: 'none',
                }}
              />
            </div>
          )}
        </motion.div>
        
        <style>{getStyles()}</style>
      </section>
    );
  }

  // Centered layout
  if (layout === 'centered') {
    return (
      <section
        style={{
          maxWidth: 1200,
          margin: `${verticalPadding} auto`,
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        {/* Decorative top line */}
        {showDecorations && (
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{
              width: 80,
              height: 3,
              background: `linear-gradient(90deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              margin: '0 auto 32px',
              borderRadius: 2,
            }}
          />
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            maxWidth,
            margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(26, 27, 30, 0.6) 0%, rgba(19, 19, 22, 0.4) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(245, 211, 147, 0.1)',
            borderRadius: 16,
            padding,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          }}
          className="rich-text-content rich-text-centered"
        >
          {renderContent()}
        </motion.div>
        
        {/* Decorative bottom line */}
        {showDecorations && (
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              width: 80,
              height: 3,
              background: `linear-gradient(90deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              margin: '32px auto 0',
              borderRadius: 2,
            }}
          />
        )}
        
        <style>{getStyles()}</style>
      </section>
    );
  }

  // Default layout (card style)
  return (
    <section
      style={{
        maxWidth: 1200,
        margin: `${verticalPadding} auto`,
        padding: '0 24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          background: 'linear-gradient(135deg, rgba(26, 27, 30, 0.6) 0%, rgba(19, 19, 22, 0.4) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(245, 211, 147, 0.1)',
          borderRadius: 16,
          padding,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          maxWidth,
          margin: textAlign === 'center' ? '0 auto' : textAlign === 'right' ? '0 0 0 auto' : '0',
        }}
        className="rich-text-content"
      >
        {renderContent()}
      </motion.div>

      <style>{getStyles()}</style>
    </section>
  );
}

function getStyles() {
  return `
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

    .rich-text-content h1 { font-size: clamp(32px, 5vw, 42px); }
    .rich-text-content h2 { font-size: clamp(26px, 4vw, 32px); }
    .rich-text-content h3 { font-size: clamp(20px, 3vw, 24px); }
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

    .rich-text-content p:last-child {
      margin-bottom: 0;
    }

    .rich-text-centered h1,
    .rich-text-centered h2,
    .rich-text-centered h3,
    .rich-text-centered h4,
    .rich-text-centered p {
      text-align: center;
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
      padding-left: 0;
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
    }

    .rich-text-content figure {
      margin: 32px 0;
    }

    .rich-text-content figure img {
      width: 100%;
      height: auto;
      display: block;
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
      
      .rich-text-split-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;
}
