import { motion, AnimatePresence, useDragControls, Reorder } from 'framer-motion';
import { tokens } from '../../../../theme';
import type { Block, BlockItemProps } from '../types';
import { BLOCK_TEMPLATES } from '../constants';
import { BlockEditor } from './BlockEditor';

interface DraggableBlockItemProps extends BlockItemProps {
  block: Block;
}

export function DraggableBlockItem({
  block,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddAfter,
}: DraggableBlockItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item value={block} dragListener={false} dragControls={dragControls} style={{ listStyle: 'none' }}>
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

function BlockItem({
  block,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onDuplicate,
  dragControls,
}: BlockItemProps & { dragControls?: ReturnType<typeof useDragControls> }) {
  const template = BLOCK_TEMPLATES.find(t => t.type === block.type);

  return (
    <motion.div layout style={{ borderBottom: `1px solid ${tokens.color.border}`, background: isEditing ? `${tokens.color.primary}0D` : 'transparent' }}>
      {/* Block Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
        {/* Drag Handle */}
        <div
          onPointerDown={(e) => dragControls?.start(e)}
          style={{ cursor: 'grab', padding: '4px', marginLeft: '-4px', borderRadius: tokens.radius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Kéo để sắp xếp"
        >
          <i className="ri-draggable" style={{ color: tokens.color.muted, fontSize: 16 }} />
        </div>
        <i className={template?.icon || 'ri-question-line'} style={{ color: tokens.color.primary, fontSize: 16 }} />
        <span style={{ fontSize: 13, color: tokens.color.text, fontWeight: 500, flex: 1 }}>{template?.label || block.type}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onEdit}
            style={{ padding: 4, background: isEditing ? tokens.color.primary : 'transparent', border: 'none', borderRadius: tokens.radius.sm, color: isEditing ? '#111' : tokens.color.muted, cursor: 'pointer' }}>
            <i className="ri-edit-line" style={{ fontSize: 14 }} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onDuplicate}
            style={{ padding: 4, background: 'transparent', border: 'none', borderRadius: tokens.radius.sm, color: tokens.color.muted, cursor: 'pointer' }}>
            <i className="ri-file-copy-line" style={{ fontSize: 14 }} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onDelete}
            style={{ padding: 4, background: 'transparent', border: 'none', borderRadius: tokens.radius.sm, color: '#EF4444', cursor: 'pointer' }}>
            <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
          </motion.button>
        </div>
      </div>

      {/* Block Editor */}
      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.1)' }}>
              <BlockEditor block={block} onUpdate={onUpdate} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
