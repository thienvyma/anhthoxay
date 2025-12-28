import type { Block } from './types';
import {
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  QuoteBlock,
  ImageBlock,
  DividerBlock,
  CalloutBlock,
  ColumnsBlock,
} from './blocks';

interface BlockRendererProps {
  block: Block;
  textAlign: string;
  isDark?: boolean;
}

export function BlockRenderer({ block, textAlign, isDark = false }: BlockRendererProps) {
  const props = { block, textAlign, isDark };

  switch (block.type) {
    case 'heading':
      return <HeadingBlock {...props} />;
    case 'paragraph':
      return <ParagraphBlock {...props} />;
    case 'list':
      return <ListBlock {...props} />;
    case 'quote':
      return <QuoteBlock {...props} />;
    case 'image':
      return <ImageBlock {...props} />;
    case 'divider':
      return <DividerBlock {...props} />;
    case 'callout':
      return <CalloutBlock {...props} />;
    case 'columns':
      return <ColumnsBlock {...props} />;
    default:
      return null;
  }
}
