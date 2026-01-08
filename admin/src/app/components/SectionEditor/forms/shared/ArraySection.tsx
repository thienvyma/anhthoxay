/**
 * ArraySection Component
 * Manages array of items with add/remove functionality
 * Requirements: 3.4
 */

import { motion } from 'framer-motion';
import { tokens } from '../../../../../theme';
import { Button } from '../../../Button';
import type { DataRecord } from './types';

interface ArraySectionProps {
  label: string;
  items: DataRecord[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  renderItem: (item: DataRecord, idx: number) => React.JSX.Element;
}

export function ArraySection({
  label,
  items,
  onAdd,
  onRemove,
  renderItem,
}: ArraySectionProps) {
  return (
    <div
      style={{
        background: `${tokens.color.primary}15`,
        border: `1px solid ${tokens.color.primary}30`,
        borderRadius: tokens.radius.md,
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <label style={{ fontWeight: 600, fontSize: 14, color: tokens.color.text }}>
          {label}
        </label>
        <Button size="small" onClick={onAdd} icon="ri-add-line">
          Thêm
        </Button>
      </div>
      {items.map((item, idx) => (
        <motion.div
          key={item._id || idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 12,
            background: tokens.color.surfaceAlt,
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.muted }}>
              #{idx + 1}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onRemove(idx)}
              style={{
                padding: 6,
                background: `${tokens.color.error}15`,
                border: `1px solid ${tokens.color.error}30`,
                borderRadius: tokens.radius.sm,
                color: tokens.color.error,
                cursor: 'pointer',
              }}
            >
              <i className="ri-delete-bin-line" />
            </motion.button>
          </div>
          {renderItem(item, idx)}
        </motion.div>
      ))}
      {items.length === 0 && (
        <div
          style={{
            color: tokens.color.muted,
            fontSize: 13,
            textAlign: 'center',
            padding: 16,
          }}
        >
          Chưa có mục nào. Nhấn "Thêm" để thêm mới.
        </div>
      )}
    </div>
  );
}
