export interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface BlockProps {
  block: Block;
  textAlign: string;
  isDark?: boolean;
}

export interface LayoutPreviewProps {
  content: string;
  blocks: Block[];
  isBlocksFormat: boolean;
  backgroundImage: string;
  backgroundOverlay: number;
  textAlign: string;
  maxWidth: string;
  showDecorations: boolean;
  imageRatio?: number;
  renderContent: (isDark?: boolean) => React.ReactNode;
}

export const layoutLabels: Record<string, string> = {
  default: 'Card',
  centered: 'Căn giữa',
  'split-left': 'Ảnh trái',
  'split-right': 'Ảnh phải',
  'full-width': 'Full width',
};

export const maxWidthMap: Record<string, string> = {
  narrow: '70%',
  default: '85%',
  wide: '100%',
  full: '100%',
};
