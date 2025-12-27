import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { tokens } from '@app/shared';
import { Button } from './Button';
import { Input, TextArea } from './Input';
import { ImageDropzone } from './ImageDropzone';

// Block types
type BlockType = 'heading' | 'paragraph' | 'list' | 'quote' | 'image' | 'divider' | 'callout' | 'columns';

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

interface VisualBlockEditorProps {
  value: string; // JSON string of blocks or markdown
  onChange: (value: string) => void;
  label?: string;
}

// Block templates
const BLOCK_TEMPLATES: Array<{ type: BlockType; icon: string; label: string; description: string }> = [
  { type: 'heading', icon: 'ri-heading', label: 'Tiêu đề', description: 'Heading lớn hoặc nhỏ' },
  { type: 'paragraph', icon: 'ri-text', label: 'Đoạn văn', description: 'Văn bản thông thường' },
  { type: 'list', icon: 'ri-list-unordered', label: 'Danh sách', description: 'Bullet hoặc số' },
  { type: 'quote', icon: 'ri-double-quotes-l', label: 'Trích dẫn', description: 'Quote nổi bật' },
  { type: 'image', icon: 'ri-image-line', label: 'Hình ảnh', description: 'Ảnh với caption' },
  { type: 'callout', icon: 'ri-information-line', label: 'Callout', description: 'Hộp thông báo' },
  { type: 'divider', icon: 'ri-separator', label: 'Đường kẻ', description: 'Phân cách nội dung' },
  { type: 'columns', icon: 'ri-layout-column-line', label: '2 Cột', description: 'Chia 2 cột text' },
];

const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

// Default data for each block type
function getDefaultBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'heading':
      return { text: 'Tiêu đề mới', level: 2 };
    case 'paragraph':
      return { text: 'Nhập nội dung văn bản tại đây...' };
    case 'list':
      return { items: ['Mục 1', 'Mục 2', 'Mục 3'], ordered: false };
    case 'quote':
      return { text: 'Trích dẫn nổi bật...', author: '' };
    case 'image':
      return { url: '', alt: '', caption: '' };
    case 'callout':
      return { text: 'Thông tin quan trọng...', type: 'info', icon: 'ri-information-line' };
    case 'divider':
      return { style: 'solid' };
    case 'columns':
      return { left: 'Nội dung cột trái...', right: 'Nội dung cột phải...' };
    default:
      return {};
  }
}

// Parse value (JSON blocks or convert from markdown) - moved outside component
function parseValue(val: string): Block[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Convert markdown to blocks
    return markdownToBlocks(val);
  }
  return [];
}

// Convert markdown to blocks - moved outside component
function markdownToBlocks(md: string): Block[] {
  const lines = md.split('\n');
  const result: Block[] = [];
  let currentParagraph = '';

  for (const line of lines) {
    if (line.startsWith('# ')) {
      if (currentParagraph) {
        result.push({
          id: generateId(),
          type: 'paragraph',
          data: { text: currentParagraph.trim() },
        });
        currentParagraph = '';
      }
      result.push({
        id: generateId(),
        type: 'heading',
        data: { text: line.slice(2), level: 1 },
      });
    } else if (line.startsWith('## ')) {
      if (currentParagraph) {
        result.push({
          id: generateId(),
          type: 'paragraph',
          data: { text: currentParagraph.trim() },
        });
        currentParagraph = '';
      }
      result.push({
        id: generateId(),
        type: 'heading',
        data: { text: line.slice(3), level: 2 },
      });
    } else if (line.startsWith('### ')) {
      if (currentParagraph) {
        result.push({
          id: generateId(),
          type: 'paragraph',
          data: { text: currentParagraph.trim() },
        });
        currentParagraph = '';
      }
      result.push({
        id: generateId(),
        type: 'heading',
        data: { text: line.slice(4), level: 3 },
      });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (currentParagraph) {
        result.push({
          id: generateId(),
          type: 'paragraph',
          data: { text: currentParagraph.trim() },
        });
        currentParagraph = '';
      }
      const items = [line.slice(2)];
      result.push({ id: generateId(), type: 'list', data: { items, ordered: false } });
    } else if (line.startsWith('> ')) {
      if (currentParagraph) {
        result.push({
          id: generateId(),
          type: 'paragraph',
          data: { text: currentParagraph.trim() },
        });
        currentParagraph = '';
      }
      result.push({
        id: generateId(),
        type: 'quote',
        data: { text: line.slice(2), author: '' },
      });
    } else if (line.trim() === '---') {
      if (currentParagraph) {
        result.push({
          id: generateId(),
          type: 'paragraph',
          data: { text: currentParagraph.trim() },
        });
        currentParagraph = '';
      }
      result.push({ id: generateId(), type: 'divider', data: { style: 'solid' } });
    } else if (line.trim()) {
      currentParagraph += (currentParagraph ? '\n' : '') + line;
    } else if (currentParagraph) {
      result.push({
        id: generateId(),
        type: 'paragraph',
        data: { text: currentParagraph.trim() },
      });
      currentParagraph = '';
    }
  }

  if (currentParagraph) {
    result.push({
      id: generateId(),
      type: 'paragraph',
      data: { text: currentParagraph.trim() },
    });
  }

  return result.length > 0
    ? result
    : [{ id: generateId(), type: 'paragraph', data: { text: '' } }];
}

export function VisualBlockEditor({ value, onChange, label }: VisualBlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseValue(value));
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'preview'>('visual');

  // Sync blocks when value prop changes (e.g., when loading section data)
  useEffect(() => {
    const newBlocks = parseValue(value);
    // Only update if the parsed content is different
    const currentJson = JSON.stringify(blocks);
    const newJson = JSON.stringify(newBlocks);
    if (currentJson !== newJson) {
      setBlocks(newBlocks);
    }
  }, [value]);

  // Convert blocks to output (JSON for storage, can be rendered as HTML on frontend)
  const saveBlocks = useCallback(
    (newBlocks: Block[]) => {
      setBlocks(newBlocks);
      onChange(JSON.stringify(newBlocks));
    },
    [onChange]
  );

  const addBlock = (type: BlockType, afterId?: string) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      data: getDefaultBlockData(type),
    };

    let newBlocks: Block[];
    if (afterId) {
      const idx = blocks.findIndex(b => b.id === afterId);
      newBlocks = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
    } else {
      newBlocks = [...blocks, newBlock];
    }

    saveBlocks(newBlocks);
    setShowBlockPicker(false);
    setEditingBlockId(newBlock.id);
  };

  const updateBlock = (id: string, data: Record<string, unknown>) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, data: { ...b.data, ...data } } : b);
    saveBlocks(newBlocks);
  };

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    saveBlocks(newBlocks.length > 0 ? newBlocks : [{ id: generateId(), type: 'paragraph', data: { text: '' } }]);
    if (editingBlockId === id) setEditingBlockId(null);
  };

  const duplicateBlock = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const newBlock = { ...blocks[idx], id: generateId() };
    const newBlocks = [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
    saveBlocks(newBlocks);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: tokens.color.text }}>{label}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 500,
                background: viewMode === 'visual' ? tokens.color.primary : 'transparent',
                color: viewMode === 'visual' ? '#111' : tokens.color.muted,
                border: `1px solid ${viewMode === 'visual' ? tokens.color.primary : tokens.color.border}`,
                borderRadius: tokens.radius.sm,
                cursor: 'pointer',
              }}
            >
              <i className="ri-edit-line" style={{ marginRight: 4 }} />
              Chỉnh sửa
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 500,
                background: viewMode === 'preview' ? tokens.color.primary : 'transparent',
                color: viewMode === 'preview' ? '#111' : tokens.color.muted,
                border: `1px solid ${viewMode === 'preview' ? tokens.color.primary : tokens.color.border}`,
                borderRadius: tokens.radius.sm,
                cursor: 'pointer',
              }}
            >
              <i className="ri-eye-line" style={{ marginRight: 4 }} />
              Xem trước
            </button>
          </div>
        </div>
      )}

      {viewMode === 'visual' ? (
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          minHeight: 300,
        }}>
          {/* Blocks List */}
          <Reorder.Group
            axis="y"
            values={blocks}
            onReorder={saveBlocks}
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {blocks.map((block) => (
              <DraggableBlockItem
                key={block.id}
                block={block}
                isEditing={editingBlockId === block.id}
                onEdit={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                onUpdate={(data) => updateBlock(block.id, data)}
                onDelete={() => deleteBlock(block.id)}
                onDuplicate={() => duplicateBlock(block.id)}
                onAddAfter={() => {
                  setShowBlockPicker(true);
                }}
              />
            ))}
          </Reorder.Group>

          {/* Add Block Button */}
          <div style={{ padding: 16, borderTop: `1px solid ${tokens.color.border}` }}>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowBlockPicker(true)}
              icon="ri-add-line"
              fullWidth
            >
              Thêm Block
            </Button>
          </div>
        </div>
      ) : (
        <div style={{
          background: '#fff',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          padding: 24,
          minHeight: 300,
        }}>
          <BlocksPreview blocks={blocks} />
        </div>
      )}

      {/* Block Picker Modal */}
      <AnimatePresence>
        {showBlockPicker && (
          <BlockPickerModal
            onSelect={(type) => addBlock(type)}
            onClose={() => setShowBlockPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


// Draggable Block Item wrapper with drag controls
function DraggableBlockItem({
  block,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddAfter,
}: {
  block: Block;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddAfter: () => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={dragControls}
      style={{ listStyle: 'none' }}
    >
      <BlockItem
        block={block}
        isEditing={isEditing}
        onEdit={onEdit}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onAddAfter={onAddAfter}
        dragControls={dragControls}
      />
    </Reorder.Item>
  );
}

// Block Item Component
function BlockItem({
  block,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onDuplicate,
  dragControls,
}: {
  block: Block;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddAfter: () => void;
  dragControls?: ReturnType<typeof useDragControls>;
}) {
  const template = BLOCK_TEMPLATES.find(t => t.type === block.type);

  return (
    <motion.div
      layout
      style={{
        borderBottom: `1px solid ${tokens.color.border}`,
        background: isEditing ? 'rgba(245, 211, 147, 0.05)' : 'transparent',
      }}
    >
      {/* Block Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
        }}
      >
        {/* Drag Handle - chỉ kéo từ đây */}
        <div
          onPointerDown={(e) => dragControls?.start(e)}
          style={{
            cursor: 'grab',
            padding: '4px',
            marginLeft: '-4px',
            borderRadius: tokens.radius.sm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Kéo để sắp xếp"
        >
          <i className="ri-draggable" style={{ color: tokens.color.muted, fontSize: 16 }} />
        </div>
        <i className={template?.icon || 'ri-question-line'} style={{ color: tokens.color.primary, fontSize: 16 }} />
        <span style={{ fontSize: 13, color: tokens.color.text, fontWeight: 500, flex: 1 }}>
          {template?.label || block.type}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            style={{
              padding: 4,
              background: isEditing ? tokens.color.primary : 'transparent',
              border: 'none',
              borderRadius: tokens.radius.sm,
              color: isEditing ? '#111' : tokens.color.muted,
              cursor: 'pointer',
            }}
          >
            <i className="ri-edit-line" style={{ fontSize: 14 }} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDuplicate}
            style={{
              padding: 4,
              background: 'transparent',
              border: 'none',
              borderRadius: tokens.radius.sm,
              color: tokens.color.muted,
              cursor: 'pointer',
            }}
          >
            <i className="ri-file-copy-line" style={{ fontSize: 14 }} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            style={{
              padding: 4,
              background: 'transparent',
              border: 'none',
              borderRadius: tokens.radius.sm,
              color: '#EF4444',
              cursor: 'pointer',
            }}
          >
            <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
          </motion.button>
        </div>
      </div>

      {/* Block Editor */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.1)' }}>
              <BlockEditor block={block} onUpdate={onUpdate} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Alignment selector component
function AlignmentSelector({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const currentAlign = value || 'left';
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
        Căn chỉnh
      </label>
      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { value: 'left', icon: 'ri-align-left', label: 'Trái' },
          { value: 'center', icon: 'ri-align-center', label: 'Giữa' },
          { value: 'right', icon: 'ri-align-right', label: 'Phải' },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.label}
            style={{
              padding: '6px 12px',
              background: currentAlign === opt.value ? tokens.color.primary : 'rgba(255,255,255,0.05)',
              color: currentAlign === opt.value ? '#111' : tokens.color.text,
              border: `1px solid ${currentAlign === opt.value ? tokens.color.primary : tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            <i className={opt.icon} />
          </button>
        ))}
      </div>
    </div>
  );
}

// Rich Text Input with formatting toolbar
function RichTextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const textareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (node) {
        // Auto-resize
        node.style.height = 'auto';
        node.style.height = Math.max(100, node.scrollHeight) + 'px';
      }
    },
    [value]
  );

  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = document.querySelector(`textarea[data-rich-input="${label}"]`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      const newValue = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
      onChange(newValue);
    }
  };

  const insertLink = () => {
    if (linkText && linkUrl) {
      const linkHtml = `<a href="${linkUrl}">${linkText}</a>`;
      const textarea = document.querySelector(`textarea[data-rich-input="${label}"]`) as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const newValue = value.substring(0, start) + linkHtml + value.substring(start);
        onChange(newValue);
      }
      setShowLinkModal(false);
      setLinkText('');
      setLinkUrl('');
    }
  };

  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
        {label}
      </label>
      
      {/* Formatting Toolbar */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: 8,
        background: 'rgba(0,0,0,0.2)',
        borderRadius: `${tokens.radius.sm} ${tokens.radius.sm} 0 0`,
        border: `1px solid ${tokens.color.border}`,
        borderBottom: 'none',
        flexWrap: 'wrap',
      }}>
        {/* Bold */}
        <button
          type="button"
          onClick={() => wrapSelection('<strong>', '</strong>')}
          title="In đậm (Ctrl+B)"
          style={{
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.sm,
            color: tokens.color.text,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          B
        </button>
        
        {/* Italic */}
        <button
          type="button"
          onClick={() => wrapSelection('<em>', '</em>')}
          title="In nghiêng (Ctrl+I)"
          style={{
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.sm,
            color: tokens.color.text,
            cursor: 'pointer',
            fontSize: 13,
            fontStyle: 'italic',
          }}
        >
          I
        </button>
        
        {/* Underline */}
        <button
          type="button"
          onClick={() => wrapSelection('<u>', '</u>')}
          title="Gạch chân"
          style={{
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.sm,
            color: tokens.color.text,
            cursor: 'pointer',
            fontSize: 13,
            textDecoration: 'underline',
          }}
        >
          U
        </button>
        
        <div style={{ width: 1, background: tokens.color.border, margin: '0 4px' }} />
        
        {/* Link */}
        <button
          type="button"
          onClick={() => setShowLinkModal(true)}
          title="Chèn link"
          style={{
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.sm,
            color: tokens.color.text,
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <i className="ri-link" style={{ fontSize: 14 }} />
          Link
        </button>

        <div style={{ width: 1, background: tokens.color.border, margin: '0 4px' }} />

        {/* Color Picker - chỉ dùng input color */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="color"
            defaultValue="#F5D393"
            onChange={(e) => {
              const color = e.target.value;
              wrapSelection(`<span style="color:${color}">`, '</span>');
            }}
            title="Chọn màu chữ"
            style={{
              width: 28,
              height: 24,
              padding: 0,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              cursor: 'pointer',
              background: 'transparent',
            }}
          />
          <span style={{ fontSize: 11, color: tokens.color.muted }}>Màu</span>
        </div>
        
        {/* Highlight */}
        <button
          type="button"
          onClick={() => wrapSelection('<mark>', '</mark>')}
          title="Highlight"
          style={{
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.sm,
            color: tokens.color.text,
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <i className="ri-mark-pen-line" style={{ fontSize: 14 }} />
        </button>
      </div>
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        data-rich-input={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          minHeight: 100,
          padding: 12,
          borderRadius: `0 0 ${tokens.radius.sm} ${tokens.radius.sm}`,
          border: `1px solid ${tokens.color.border}`,
          background: tokens.color.background,
          color: tokens.color.text,
          fontSize: 14,
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
        }}
        placeholder="Nhập nội dung... Có thể dùng HTML tags như <strong>, <em>, <a href='...'>"
      />
      
      <p style={{ marginTop: 6, fontSize: 11, color: tokens.color.muted }}>
        💡 Chọn text rồi click nút để format. Hỗ trợ HTML: &lt;strong&gt;, &lt;em&gt;, &lt;a href="..."&gt;, &lt;span style="color:..."&gt;
      </p>
      
      {/* Link Modal */}
      {showLinkModal && (
        <>
          <div
            onClick={() => setShowLinkModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 9998,
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(400px, 90vw)',
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.lg,
            padding: 20,
            zIndex: 9999,
          }}>
            <h4 style={{ margin: '0 0 16px', color: tokens.color.text, fontSize: 16 }}>
              <i className="ri-link" style={{ marginRight: 8 }} />
              Chèn Link
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input
                label="Văn bản hiển thị"
                value={linkText}
                onChange={setLinkText}
                placeholder="Ví dụ: Click vào đây"
                fullWidth
              />
              <Input
                label="URL"
                value={linkUrl}
                onChange={setLinkUrl}
                placeholder="https://example.com"
                fullWidth
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button variant="secondary" size="small" onClick={() => setShowLinkModal(false)}>
                  Hủy
                </Button>
                <Button variant="primary" size="small" onClick={insertLink} disabled={!linkText || !linkUrl}>
                  Chèn
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Block Editor for each type
function BlockEditor({ block, onUpdate }: { block: Block; onUpdate: (data: Record<string, unknown>) => void }) {
  const { type, data } = block;

  switch (type) {
    case 'heading':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Nội dung tiêu đề"
            value={(data.text as string) || ''}
            onChange={(v) => onUpdate({ text: v })}
            fullWidth
          />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
                Cấp độ
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onUpdate({ level })}
                    style={{
                      padding: '6px 16px',
                      background: data.level === level ? tokens.color.primary : 'rgba(255,255,255,0.05)',
                      color: data.level === level ? '#111' : tokens.color.text,
                      border: `1px solid ${data.level === level ? tokens.color.primary : tokens.color.border}`,
                      borderRadius: tokens.radius.sm,
                      cursor: 'pointer',
                      fontSize: 14 - level,
                      fontWeight: 600,
                    }}
                  >
                    H{level}
                  </button>
                ))}
              </div>
            </div>
            <AlignmentSelector value={data.align as string} onChange={(v) => onUpdate({ align: v })} />
          </div>
        </div>
      );

    case 'paragraph':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <RichTextInput
            label="Nội dung"
            value={(data.text as string) || ''}
            onChange={(v) => onUpdate({ text: v })}
          />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <AlignmentSelector value={data.align as string} onChange={(v) => onUpdate({ align: v })} />
            <div>
              <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
                Màu nền
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={(data.backgroundColor as string) || '#ffffff'}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value === '#ffffff' ? undefined : e.target.value })}
                  style={{
                    width: 36,
                    height: 28,
                    padding: 0,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.sm,
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
                <span style={{ fontSize: 11, color: tokens.color.muted }}>
                  {(data.backgroundColor as string) || 'Không'}
                </span>
                {(data.backgroundColor as string) && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ backgroundColor: undefined })}
                    style={{
                      padding: '2px 6px',
                      fontSize: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${tokens.color.border}`,
                      borderRadius: tokens.radius.sm,
                      color: tokens.color.muted,
                      cursor: 'pointer',
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
                Màu chữ
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={(data.textColor as string) || '#374151'}
                  onChange={(e) => onUpdate({ textColor: e.target.value === '#374151' ? undefined : e.target.value })}
                  style={{
                    width: 36,
                    height: 28,
                    padding: 0,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.sm,
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
                <span style={{ fontSize: 11, color: tokens.color.muted }}>
                  {(data.textColor as string) || 'Mặc định'}
                </span>
                {(data.textColor as string) && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ textColor: undefined })}
                    style={{
                      padding: '2px 6px',
                      fontSize: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${tokens.color.border}`,
                      borderRadius: tokens.radius.sm,
                      color: tokens.color.muted,
                      cursor: 'pointer',
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case 'list':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => onUpdate({ ordered: false })}
              style={{
                padding: '6px 12px',
                background: !data.ordered ? tokens.color.primary : 'rgba(255,255,255,0.05)',
                color: !data.ordered ? '#111' : tokens.color.text,
                border: `1px solid ${!data.ordered ? tokens.color.primary : tokens.color.border}`,
                borderRadius: tokens.radius.sm,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <i className="ri-list-unordered" style={{ marginRight: 6 }} />
              Bullet
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ ordered: true })}
              style={{
                padding: '6px 12px',
                background: data.ordered ? tokens.color.primary : 'rgba(255,255,255,0.05)',
                color: data.ordered ? '#111' : tokens.color.text,
                border: `1px solid ${data.ordered ? tokens.color.primary : tokens.color.border}`,
                borderRadius: tokens.radius.sm,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <i className="ri-list-ordered" style={{ marginRight: 6 }} />
              Số
            </button>
          </div>
          <TextArea
            label="Các mục (mỗi dòng 1 mục)"
            value={((data.items as string[]) || []).join('\n')}
            onChange={(v) => onUpdate({ items: v.split('\n').filter(Boolean) })}
            rows={4}
            fullWidth
          />
        </div>
      );

    case 'quote':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TextArea
            label="Nội dung trích dẫn"
            value={(data.text as string) || ''}
            onChange={(v) => onUpdate({ text: v })}
            rows={3}
            fullWidth
          />
          <Input
            label="Tác giả (tùy chọn)"
            value={(data.author as string) || ''}
            onChange={(v) => onUpdate({ author: v })}
            fullWidth
          />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
                Màu glass
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={(data.glassColor as string) || '#F5D393'}
                  onChange={(e) => onUpdate({ glassColor: e.target.value })}
                  style={{
                    width: 36,
                    height: 28,
                    padding: 0,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.sm,
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
                <span style={{ fontSize: 11, color: tokens.color.muted }}>
                  {(data.glassColor as string) || '#F5D393'}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdate({ glassColor: '#F5D393' })}
                  style={{
                    padding: '2px 6px',
                    fontSize: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.sm,
                    color: tokens.color.muted,
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
                Màu chữ
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={(data.textColor as string) || '#4b5563'}
                  onChange={(e) => onUpdate({ textColor: e.target.value === '#4b5563' ? undefined : e.target.value })}
                  style={{
                    width: 36,
                    height: 28,
                    padding: 0,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.sm,
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
                <span style={{ fontSize: 11, color: tokens.color.muted }}>
                  {(data.textColor as string) || 'Mặc định'}
                </span>
                {(data.textColor as string) && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ textColor: undefined })}
                    style={{
                      padding: '2px 6px',
                      fontSize: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${tokens.color.border}`,
                      borderRadius: tokens.radius.sm,
                      color: tokens.color.muted,
                      cursor: 'pointer',
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case 'image':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ImageDropzone
            value={(data.url as string) || ''}
            onChange={(url) => onUpdate({ url })}
            onRemove={() => onUpdate({ url: '' })}
            height={150}
          />
          <Input
            label="Alt text"
            value={(data.alt as string) || ''}
            onChange={(v) => onUpdate({ alt: v })}
            placeholder="Mô tả hình ảnh"
            fullWidth
          />
          <Input
            label="Caption (tùy chọn)"
            value={(data.caption as string) || ''}
            onChange={(v) => onUpdate({ caption: v })}
            fullWidth
          />
        </div>
      );

    case 'callout':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
              Loại
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'info', label: 'Thông tin', color: '#3B82F6', icon: 'ri-information-line' },
                { value: 'success', label: 'Thành công', color: '#10B981', icon: 'ri-checkbox-circle-line' },
                { value: 'warning', label: 'Cảnh báo', color: '#F59E0B', icon: 'ri-alert-line' },
                { value: 'error', label: 'Lỗi', color: '#EF4444', icon: 'ri-error-warning-line' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate({ type: opt.value, icon: opt.icon })}
                  style={{
                    padding: '6px 12px',
                    background: data.type === opt.value ? `${opt.color}20` : 'rgba(255,255,255,0.05)',
                    color: data.type === opt.value ? opt.color : tokens.color.text,
                    border: `1px solid ${data.type === opt.value ? opt.color : tokens.color.border}`,
                    borderRadius: tokens.radius.sm,
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <i className={opt.icon} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <TextArea
            label="Nội dung"
            value={(data.text as string) || ''}
            onChange={(v) => onUpdate({ text: v })}
            rows={3}
            fullWidth
          />
        </div>
      );

    case 'divider':
      return (
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
            Kiểu đường kẻ
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['solid', 'dashed', 'dotted'].map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => onUpdate({ style })}
                style={{
                  padding: '8px 16px',
                  background: data.style === style ? tokens.color.primary : 'rgba(255,255,255,0.05)',
                  color: data.style === style ? '#111' : tokens.color.text,
                  border: `1px solid ${data.style === style ? tokens.color.primary : tokens.color.border}`,
                  borderRadius: tokens.radius.sm,
                  cursor: 'pointer',
                  fontSize: 13,
                  textTransform: 'capitalize',
                }}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      );

    case 'columns':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <TextArea
            label="Cột trái"
            value={(data.left as string) || ''}
            onChange={(v) => onUpdate({ left: v })}
            rows={4}
            fullWidth
          />
          <TextArea
            label="Cột phải"
            value={(data.right as string) || ''}
            onChange={(v) => onUpdate({ right: v })}
            rows={4}
            fullWidth
          />
        </div>
      );

    default:
      return <p style={{ color: tokens.color.muted }}>Editor chưa hỗ trợ block này</p>;
  }
}


// Block Picker Modal
function BlockPickerModal({ onSelect, onClose }: { onSelect: (type: BlockType) => void; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 9998,
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(500px, 90vw)',
          background: 'rgba(20,21,26,0.98)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.lg,
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 16, borderBottom: `1px solid ${tokens.color.border}` }}>
          <h3 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
            Chọn loại Block
          </h3>
        </div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {BLOCK_TEMPLATES.map((template) => (
            <motion.button
              key={template.type}
              whileHover={{ scale: 1.02, background: 'rgba(245, 211, 147, 0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(template.type)}
              style={{
                padding: 12,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: tokens.radius.sm,
                background: `${tokens.color.primary}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className={template.icon} style={{ fontSize: 18, color: tokens.color.primary }} />
              </div>
              <div>
                <div style={{ color: tokens.color.text, fontSize: 14, fontWeight: 500 }}>{template.label}</div>
                <div style={{ color: tokens.color.muted, fontSize: 12 }}>{template.description}</div>
              </div>
            </motion.button>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${tokens.color.border}`, textAlign: 'right' }}>
          <Button variant="secondary" size="small" onClick={onClose}>Hủy</Button>
        </div>
      </motion.div>
    </>
  );
}

// Blocks Preview Component
function BlocksPreview({ blocks }: { blocks: Block[] }) {
  if (blocks.length === 0) {
    return <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Chưa có nội dung...</p>;
  }

  return (
    <div style={{ color: '#374151', lineHeight: 1.7 }}>
      {blocks.map((block) => (
        <BlockPreviewItem key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockPreviewItem({ block }: { block: Block }) {
  const { type, data } = block;

  switch (type) {
    case 'heading': {
      const level = (data.level as number) || 2;
      const fontSize = level === 1 ? 28 : level === 2 ? 22 : 18;
      return (
        <div style={{ fontSize, fontWeight: 600, color: '#111827', marginBottom: 12, marginTop: level === 1 ? 24 : 16 }}>
          {(data.text as string) || ''}
        </div>
      );
    }

    case 'paragraph':
      return (
        <p 
          style={{ 
            marginBottom: 12, 
            color: (data.textColor as string) || '#374151',
            backgroundColor: data.backgroundColor ? (data.backgroundColor as string) : undefined,
            padding: data.backgroundColor ? '12px 16px' : undefined,
            borderRadius: data.backgroundColor ? 8 : undefined,
            textAlign: (data.align as 'left' | 'center' | 'right') || 'left',
          }}
          dangerouslySetInnerHTML={{ __html: (data.text as string) || '' }}
        />
      );

    case 'list': {
      const items = (data.items as string[]) || [];
      const isOrdered = data.ordered as boolean;
      return (
        <div
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
      const quoteText = typeof data.text === 'string' ? data.text : '';
      const quoteAuthor = typeof data.author === 'string' ? data.author : '';
      const glassColor = typeof data.glassColor === 'string' ? data.glassColor : '#F5D393';
      const textColor = typeof data.textColor === 'string' ? data.textColor : '#4b5563';
      
      return (
        <div
          style={{
            margin: '16px 0',
            padding: '10px 16px',
            background: `linear-gradient(90deg, ${glassColor}20 0%, ${glassColor}10 40%, transparent 100%)`,
            borderRadius: 6,
            textAlign: 'center',
          }}
        >
          <blockquote style={{ margin: 0, padding: 0 }}>
            <p style={{
              margin: 0,
              fontSize: 14,
              fontStyle: 'italic',
              color: textColor,
              lineHeight: 1.6,
            }}>
              " {quoteText} "
            </p>
            {quoteAuthor && (
              <footer style={{ marginTop: 8, textAlign: 'center' }}>
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
      const imgUrl = typeof data.url === 'string' ? data.url : '';
      const imgAlt = typeof data.alt === 'string' ? data.alt : '';
      const imgCaption = typeof data.caption === 'string' ? data.caption : '';
      return imgUrl ? (
        <figure style={{ margin: '16px 0', position: 'relative' }}>
          {/* Image with glass effect */}
          <div style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            <img
              src={imgUrl}
              alt={imgAlt}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {/* Glass overlays */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 20,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 20,
              background: 'linear-gradient(0deg, rgba(255,255,255,0.3), transparent)',
              pointerEvents: 'none',
            }} />
          </div>
          {imgCaption && (
            <figcaption style={{ marginTop: 8, fontSize: 13, color: '#6b7280', textAlign: 'center', fontStyle: 'italic' }}>
              {imgCaption}
            </figcaption>
          )}
        </figure>
      ) : null;
    }

    case 'callout': {
      const colors: Record<string, { bg: string; border: string; text: string }> = {
        info: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
        success: { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
        warning: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' },
        error: { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B' },
      };
      const style = colors[(data.type as string) || 'info'];
      return (
        <div style={{
          background: style.bg,
          borderLeft: `4px solid ${style.border}`,
          padding: 16,
          borderRadius: 8,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <i className={(data.icon as string) || 'ri-information-line'} style={{ fontSize: 20, color: style.border }} />
          <p style={{ margin: 0, color: style.text }}>{(data.text as string) || ''}</p>
        </div>
      );
    }

    case 'divider': {
      const dividerStyle = (data.style as string) || 'solid';
      
      if (dividerStyle === 'dashed') {
        return (
          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
        <div style={{ margin: '28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
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

    case 'columns':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 12 }}>
          <div style={{ color: '#374151' }}>{(data.left as string) || ''}</div>
          <div style={{ color: '#374151' }}>{(data.right as string) || ''}</div>
        </div>
      );

    default:
      return null;
  }
}
