/**
 * Region Tree Item Component
 *
 * Displays a single region in the tree view with actions.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import type { Region, RegionTreeNode } from './types';
import { LEVEL_LABELS, LEVEL_COLORS } from './types';

interface RegionTreeItemProps {
  region: RegionTreeNode;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (region: Region) => void;
  onDelete: (region: Region) => void;
  onToggleActive: (region: Region) => void;
  onAddChild: (parentId: string) => void;
  level: number;
}

export const RegionTreeItem = memo(function RegionTreeItem({
  region,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleActive,
  onAddChild,
  level,
}: RegionTreeItemProps) {
  const isExpanded = expandedIds.has(region.id);
  const hasChildren = region.children.length > 0;
  const canAddChild = region.level < 3;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          marginLeft: level * 24,
          borderRadius: tokens.radius.md,
          background: region.isActive ? 'transparent' : 'rgba(255,255,255,0.02)',
          opacity: region.isActive ? 1 : 0.6,
          transition: 'background 0.2s',
        }}
        whileHover={{ background: 'rgba(255,255,255,0.05)' }}
      >
        {/* Expand/Collapse Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => hasChildren && onToggleExpand(region.id)}
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: hasChildren ? tokens.color.text : 'transparent',
            cursor: hasChildren ? 'pointer' : 'default',
            fontSize: 16,
          }}
        >
          <i className={isExpanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'} />
        </motion.button>

        {/* Level Indicator */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: LEVEL_COLORS[region.level],
            flexShrink: 0,
          }}
        />

        {/* Region Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: tokens.color.text, fontWeight: 500, fontSize: 14 }}>
              {region.name}
            </span>
            <span style={{ color: tokens.color.muted, fontSize: 12 }}>
              ({region.slug})
            </span>
            {!region.isActive && (
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                Đã tắt
              </span>
            )}
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 12, marginTop: 2 }}>
            {LEVEL_LABELS[region.level]}
            {hasChildren && ` • ${region.children.length} khu vực con`}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4 }}>
          <ActionButton
            icon={region.isActive ? 'ri-toggle-fill' : 'ri-toggle-line'}
            title={region.isActive ? 'Tắt khu vực' : 'Bật khu vực'}
            onClick={() => onToggleActive(region)}
            color={region.isActive ? '#10B981' : tokens.color.muted}
          />
          {canAddChild && (
            <ActionButton
              icon="ri-add-line"
              title="Thêm khu vực con"
              onClick={() => onAddChild(region.id)}
              color={tokens.color.primary}
            />
          )}
          <ActionButton
            icon="ri-edit-line"
            title="Chỉnh sửa"
            onClick={() => onEdit(region)}
            color={tokens.color.text}
          />
          <ActionButton
            icon="ri-delete-bin-line"
            title="Xóa"
            onClick={() => onDelete(region)}
            color={tokens.color.error}
          />
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            {region.children.map((child) => (
              <RegionTreeItem
                key={child.id}
                region={child}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
                onAddChild={onAddChild}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// Action button component
function ActionButton({
  icon,
  title,
  onClick,
  color,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      style={{
        padding: 6,
        background: 'transparent',
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.sm,
        color,
        cursor: 'pointer',
        fontSize: 14,
      }}
    >
      <i className={icon} />
    </motion.button>
  );
}
