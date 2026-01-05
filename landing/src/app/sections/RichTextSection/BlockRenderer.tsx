import type { Block } from './types';
import {
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  QuoteBlock,
  ImageBlock,
  CalloutBlock,
  DividerBlock,
  ColumnsBlock,
} from './blocks';

interface BlockRendererProps {
  block: Block;
  textAlign: string;
}

/**
 * Renders a single block based on its type
 */
export function BlockRenderer({ block, textAlign }: BlockRendererProps): React.ReactNode {
  const { type } = block;
  
  switch (type) {
    case 'heading':
      return <HeadingBlock block={block} textAlign={textAlign} />;
    
    case 'paragraph':
      return <ParagraphBlock block={block} textAlign={textAlign} />;
    
    case 'list':
      return <ListBlock block={block} />;
    
    case 'quote':
      return <QuoteBlock block={block} />;
    
    case 'image':
      return <ImageBlock block={block} />;
    
    case 'callout':
      return <CalloutBlock block={block} />;
    
    case 'divider':
      return <DividerBlock block={block} />;
    
    case 'columns':
      return <ColumnsBlock block={block} />;
    
    default:
      return null;
  }
}
