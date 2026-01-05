// Block types for RichTextSection
export type BlockType = 'heading' | 'paragraph' | 'list' | 'quote' | 'image' | 'divider' | 'callout' | 'columns';

export interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface RichTextSectionProps {
  data: {
    content?: string;
    html?: string;
    maxWidth?: string;
    padding?: string;
    // Layout options
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

export interface BlockRendererProps {
  block: Block;
  textAlign: string;
}

export interface CalloutColors {
  bg: string;
  border: string;
}
