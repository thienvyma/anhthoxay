import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, Reorder } from 'framer-motion';
import { tokens } from '../../../theme';
import { Button } from '../Button';
import type { Block, BlockType, VisualBlockEditorProps } from './types';
import { generateId, parseValue } from './utils';
import { getDefaultBlockData } from './constants';
import { DraggableBlockItem, BlockPickerModal, BlocksPreview } from './components';

export function VisualBlockEditor({ value, onChange, label }: VisualBlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseValue(value));
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'preview'>('visual');

  // Sync blocks when value prop changes
  useEffect(() => {
    const newBlocks = parseValue(value);
    const currentJson = JSON.stringify(blocks);
    const newJson = JSON.stringify(newBlocks);
    if (currentJson !== newJson) {
      setBlocks(newBlocks);
    }
  }, [value]);

  const saveBlocks = useCallback(
    (newBlocks: Block[]) => {
      setBlocks(newBlocks);
      onChange(JSON.stringify(newBlocks));
    },
    [onChange]
  );

  const addBlock = (type: BlockType, afterId?: string) => {
    const newBlock: Block = { id: generateId(), type, data: getDefaultBlockData(type) };
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
            <button type="button" onClick={() => setViewMode('visual')}
              style={{ padding: '4px 12px', fontSize: 12, fontWeight: 500, background: viewMode === 'visual' ? tokens.color.primary : 'transparent', color: viewMode === 'visual' ? '#111' : tokens.color.muted, border: `1px solid ${viewMode === 'visual' ? tokens.color.primary : tokens.color.border}`, borderRadius: tokens.radius.sm, cursor: 'pointer' }}>
              <i className="ri-edit-line" style={{ marginRight: 4 }} />Chỉnh sửa
            </button>
            <button type="button" onClick={() => setViewMode('preview')}
              style={{ padding: '4px 12px', fontSize: 12, fontWeight: 500, background: viewMode === 'preview' ? tokens.color.primary : 'transparent', color: viewMode === 'preview' ? '#111' : tokens.color.muted, border: `1px solid ${viewMode === 'preview' ? tokens.color.primary : tokens.color.border}`, borderRadius: tokens.radius.sm, cursor: 'pointer' }}>
              <i className="ri-eye-line" style={{ marginRight: 4 }} />Xem trước
            </button>
          </div>
        </div>
      )}

      {viewMode === 'visual' ? (
        <div style={{ background: tokens.color.surfaceAlt, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, minHeight: 300 }}>
          <Reorder.Group axis="y" values={blocks} onReorder={saveBlocks} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {blocks.map((block) => (
              <DraggableBlockItem
                key={block.id}
                block={block}
                isEditing={editingBlockId === block.id}
                onEdit={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                onUpdate={(data) => updateBlock(block.id, data)}
                onDelete={() => deleteBlock(block.id)}
                onDuplicate={() => duplicateBlock(block.id)}
                onAddAfter={() => setShowBlockPicker(true)}
              />
            ))}
          </Reorder.Group>
          <div style={{ padding: 16, borderTop: `1px solid ${tokens.color.border}` }}>
            <Button variant="secondary" size="small" onClick={() => setShowBlockPicker(true)} icon="ri-add-line" fullWidth>
              Thêm Block
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: 24, minHeight: 300 }}>
          <BlocksPreview blocks={blocks} />
        </div>
      )}

      <AnimatePresence>
        {showBlockPicker && (
          <BlockPickerModal onSelect={(type) => addBlock(type)} onClose={() => setShowBlockPicker(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
