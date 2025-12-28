import { resolveMediaUrl } from '@app/shared';
import type { PreviewProps } from './types';
import { 
  BlockRenderer, 
  SplitLayoutPreview, 
  FullWidthPreview, 
  CenteredPreview, 
  DefaultLayoutPreview,
  maxWidthMap,
} from './richtext';
import type { Block } from './richtext';

export function RichTextPreview({ data }: PreviewProps) {
  const content = data.content || data.html || '';
  const layout = (data.layout as string) || 'default';
  const textAlign = (data.textAlign as string) || 'left';
  const maxWidth = (data.maxWidth as string) || 'wide';
  const showDecorations = data.showDecorations !== false;
  const backgroundImage = data.backgroundImage ? resolveMediaUrl(data.backgroundImage as string) : '';
  const backgroundOverlay = (data.backgroundOverlay as number) ?? 70;
  const imageRatio = (data.imageRatio as number) || 40;
  
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
    // Preview placeholder color - intentional for demo
    return <p style={{ color: '#999', fontStyle: 'italic' }}>Chưa có nội dung...</p>;
  }

  const previewMaxWidth = maxWidthMap[maxWidth] || '100%';

  const renderContent = (isDark = false) => {
    if (!isBlocksFormat) {
      // Preview text colors - intentional for demo content
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
        {blocks.map((block) => (
          <BlockRenderer 
            key={block.id} 
            block={block} 
            textAlign={textAlign} 
            isDark={isDark} 
          />
        ))}
      </div>
    );
  };

  const layoutProps = {
    content,
    blocks,
    isBlocksFormat,
    backgroundImage,
    backgroundOverlay,
    textAlign,
    maxWidth,
    showDecorations,
    imageRatio,
    renderContent,
  };

  // Split layout preview
  if (layout === 'split-left' || layout === 'split-right') {
    return <SplitLayoutPreview {...layoutProps} layout={layout} />;
  }

  // Full-width layout preview
  if (layout === 'full-width') {
    return <FullWidthPreview {...layoutProps} />;
  }

  // Centered layout preview
  if (layout === 'centered') {
    return <CenteredPreview {...layoutProps} />;
  }
  
  // Default card layout
  return <DefaultLayoutPreview {...layoutProps} />;
}
