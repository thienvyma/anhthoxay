import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
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
              <Reorder.Item key={block.id} value={block} style={{ listStyle: 'none' }}>
                <BlockItem
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
              </Reorder.Item>
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


// Block Item Component
function BlockItem({
  block,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  block: Block;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddAfter: () => void;
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
          cursor: 'grab',
        }}
      >
        <i className="ri-draggable" style={{ color: tokens.color.muted, fontSize: 16 }} />
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
        </div>
      );

    case 'paragraph':
      return (
        <TextArea
          label="Nội dung"
          value={(data.text as string) || ''}
          onChange={(v) => onUpdate({ text: v })}
          rows={4}
          fullWidth
        />
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
        <p style={{ marginBottom: 12, color: '#374151' }}>
          {(data.text as string) || ''}
        </p>
      );

    case 'list': {
      const items = (data.items as string[]) || [];
      const ListTag = data.ordered ? 'ol' : 'ul';
      return (
        <ListTag style={{ marginBottom: 12, paddingLeft: 24, color: '#374151' }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
          ))}
        </ListTag>
      );
    }

    case 'quote': {
      const quoteText = typeof data.text === 'string' ? data.text : '';
      const quoteAuthor = typeof data.author === 'string' ? data.author : '';
      return (
        <blockquote style={{
          borderLeft: '4px solid #F5D393',
          paddingLeft: 16,
          marginLeft: 0,
          marginBottom: 12,
          fontStyle: 'italic',
          color: '#4b5563',
        }}>
          <p style={{ margin: 0 }}>{quoteText}</p>
          {quoteAuthor && (
            <footer style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>
              — {quoteAuthor}
            </footer>
          )}
        </blockquote>
      );
    }

    case 'image': {
      const imgUrl = typeof data.url === 'string' ? data.url : '';
      const imgAlt = typeof data.alt === 'string' ? data.alt : '';
      const imgCaption = typeof data.caption === 'string' ? data.caption : '';
      return imgUrl ? (
        <figure style={{ marginBottom: 12 }}>
          <img
            src={imgUrl}
            alt={imgAlt}
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
          {imgCaption && (
            <figcaption style={{ marginTop: 8, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
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

    case 'divider':
      return (
        <hr style={{
          border: 'none',
          borderTop: `1px ${(data.style as string) || 'solid'} #e5e7eb`,
          margin: '24px 0',
        }} />
      );

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
