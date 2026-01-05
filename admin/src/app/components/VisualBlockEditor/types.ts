// Block types
export type BlockType = 'heading' | 'paragraph' | 'list' | 'quote' | 'image' | 'divider' | 'callout' | 'columns';

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

export interface VisualBlockEditorProps {
  value: string; // JSON string of blocks or markdown
  onChange: (value: string) => void;
  label?: string;
}

export interface BlockTemplate {
  type: BlockType;
  icon: string;
  label: string;
  description: string;
}

export interface BlockItemProps {
  block: Block;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddAfter: () => void;
}
