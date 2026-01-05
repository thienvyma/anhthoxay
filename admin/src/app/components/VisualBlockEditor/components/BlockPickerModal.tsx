import { motion } from 'framer-motion';
import { tokens } from '../../../../theme';
import { Button } from '../../Button';
import type { BlockType } from '../types';
import { BLOCK_TEMPLATES } from '../constants';

interface BlockPickerModalProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export function BlockPickerModal({ onSelect, onClose }: BlockPickerModalProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: tokens.color.overlay, zIndex: 9998 }}
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
          <h3 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>Chọn loại Block</h3>
        </div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {BLOCK_TEMPLATES.map((template) => (
            <motion.button
              key={template.type}
              whileHover={{ scale: 1.02, background: `${tokens.color.primary}1A` }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(template.type)}
              style={{
                padding: 12,
                background: tokens.color.surfaceAlt,
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
