import { resolveMediaUrl } from '@app/shared';
import { SimpleMarkdown } from '../../utils/simpleMarkdown';
import type { RichTextSectionProps } from './types';
import { parseContent, getMaxWidth, getPadding, getVerticalPadding } from './utils';
import { BlockRenderer } from './BlockRenderer';
import { FullWidthLayout, SplitLayout, CenteredLayout, DefaultLayout } from './layouts';

export function RichTextSection({ data }: RichTextSectionProps) {
  const content = data.content || data.html || '';
  const { isBlocks, blocks } = parseContent(content);
  
  const layout = data.layout || 'default';
  const textAlign = data.textAlign || 'left';
  const showDecorations = data.showDecorations !== false;
  const backgroundImage = resolveMediaUrl(data.backgroundImage);
  const backgroundOverlay = data.backgroundOverlay ?? 70;
  
  const maxWidth = getMaxWidth(data.maxWidth);
  const padding = getPadding(data.padding);
  const verticalPadding = getVerticalPadding(data.verticalPadding);

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
        blocks.map((block) => <BlockRenderer key={block.id} block={block} textAlign={textAlign} />)
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
      <FullWidthLayout
        verticalPadding={verticalPadding}
        backgroundImage={backgroundImage}
        backgroundOverlay={backgroundOverlay}
        showDecorations={showDecorations}
        maxWidth={maxWidth}
        textAlign={textAlign}
        renderContent={renderContent}
      />
    );
  }

  // Split layout (image + content)
  if (layout === 'split-left' || layout === 'split-right') {
    return (
      <SplitLayout
        verticalPadding={verticalPadding}
        backgroundImage={backgroundImage}
        padding={padding}
        imageRatio={data.imageRatio}
        isImageLeft={layout === 'split-left'}
        renderContent={renderContent}
      />
    );
  }

  // Centered layout
  if (layout === 'centered') {
    return (
      <CenteredLayout
        verticalPadding={verticalPadding}
        showDecorations={showDecorations}
        maxWidth={maxWidth}
        padding={padding}
        renderContent={renderContent}
      />
    );
  }

  // Default layout (card style)
  return (
    <DefaultLayout
      verticalPadding={verticalPadding}
      maxWidth={maxWidth}
      padding={padding}
      textAlign={textAlign}
      renderContent={renderContent}
    />
  );
}
