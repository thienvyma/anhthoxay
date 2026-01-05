/**
 * EntityColumn - Reusable column component for Developer/Project/Building lists
 * Feature: furniture-quotation
 */

import { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../../theme';
import { Button } from '../../../components/Button';
import type { FurnitureDeveloper, FurnitureProject, FurnitureBuilding } from '../types';

type EntityType = 'developer' | 'project' | 'building';
type EntityItem = FurnitureDeveloper | FurnitureProject | FurnitureBuilding;

interface EntityColumnProps {
  type: EntityType;
  items: EntityItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (item: EntityItem) => void;
  onDelete: (id: string) => void;
  // For counting children
  childCounts?: Record<string, number>;
  disabled?: boolean;
  emptyMessage?: string;
}

const COLUMN_CONFIG: Record<EntityType, { title: string; icon: string; searchPlaceholder: string }> = {
  developer: {
    title: 'Chủ đầu tư',
    icon: 'ri-building-4-line',
    searchPlaceholder: 'Tìm chủ đầu tư...',
  },
  project: {
    title: 'Dự án',
    icon: 'ri-community-line',
    searchPlaceholder: 'Tìm dự án...',
  },
  building: {
    title: 'Tòa nhà',
    icon: 'ri-building-line',
    searchPlaceholder: 'Tìm tòa nhà...',
  },
};

const MAX_VISIBLE_ITEMS = 50;

export const EntityColumn = memo(function EntityColumn({
  type,
  items,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  childCounts = {},
  disabled = false,
  emptyMessage,
}: EntityColumnProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const config = COLUMN_CONFIG[type];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items.slice(0, MAX_VISIBLE_ITEMS);
    const query = searchQuery.toLowerCase();
    return items
      .filter((item) => {
        const name = item.name.toLowerCase();
        const code = 'code' in item ? (item as FurnitureProject | FurnitureBuilding).code.toLowerCase() : '';
        return name.includes(query) || code.includes(query);
      })
      .slice(0, MAX_VISIBLE_ITEMS);
  }, [items, searchQuery]);

  const getItemSubtitle = (item: EntityItem) => {
    if (type === 'developer') {
      const count = childCounts[item.id] || 0;
      return `${count} dự án`;
    }
    if (type === 'project') {
      const proj = item as FurnitureProject;
      const count = childCounts[item.id] || 0;
      return `${proj.code} • ${count} tòa`;
    }
    if (type === 'building') {
      const bld = item as FurnitureBuilding;
      return `${bld.code} • ${bld.maxFloor}T ${bld.maxAxis + 1}Tr`;
    }
    return '';
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: 280,
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.color.border}`,
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${tokens.color.border}`,
          background: tokens.color.surfaceHover,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className={config.icon} style={{ color: tokens.color.primary, fontSize: 18 }} />
            <span style={{ color: tokens.color.text, fontWeight: 600, fontSize: 14 }}>{config.title}</span>
            <span
              style={{
                background: `${tokens.color.primary}20`,
                color: tokens.color.primary,
                padding: '2px 8px',
                borderRadius: tokens.radius.sm,
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {items.length}
            </span>
          </div>
          <Button variant="ghost" size="small" onClick={onAdd} style={{ padding: '4px 8px' }}>
            <i className="ri-add-line" style={{ fontSize: 16 }} />
          </Button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <i
            className="ri-search-line"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: tokens.color.muted,
              fontSize: 14,
            }}
          />
          <input
            type="text"
            placeholder={config.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              borderRadius: tokens.radius.sm,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minHeight: 200,
          maxHeight: 400,
        }}
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isSelected = selectedId === item.id;
            const imageUrl = item.imageUrl;

            return (
              <motion.div
                key={item.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 8,
                  borderRadius: tokens.radius.md,
                  background: isSelected ? `${tokens.color.primary}15` : 'transparent',
                  border: isSelected ? `1px solid ${tokens.color.primary}50` : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: tokens.radius.sm,
                    background: imageUrl ? `url(${imageUrl}) center/cover` : `${tokens.color.primary}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {!imageUrl && (
                    <i className={config.icon} style={{ color: tokens.color.primary, fontSize: 18, opacity: 0.5 }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: tokens.color.text,
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ color: tokens.color.muted, fontSize: 11 }}>{getItemSubtitle(item)}</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 2, opacity: 0.7 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                    }}
                    style={{
                      padding: 4,
                      background: 'transparent',
                      border: 'none',
                      color: tokens.color.muted,
                      cursor: 'pointer',
                      borderRadius: 4,
                    }}
                  >
                    <i className="ri-edit-line" style={{ fontSize: 14 }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    style={{
                      padding: 4,
                      background: 'transparent',
                      border: 'none',
                      color: tokens.color.error,
                      cursor: 'pointer',
                      borderRadius: 4,
                    }}
                  >
                    <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: tokens.color.muted }}>
            <i className={config.icon} style={{ fontSize: 32, opacity: 0.3, display: 'block', marginBottom: 8 }} />
            <span style={{ fontSize: 12 }}>
              {emptyMessage || (searchQuery ? 'Không tìm thấy' : `Chưa có ${config.title.toLowerCase()}`)}
            </span>
          </div>
        )}

        {items.length > MAX_VISIBLE_ITEMS && !searchQuery && (
          <div style={{ textAlign: 'center', padding: 8, color: tokens.color.muted, fontSize: 11 }}>
            Hiển thị {MAX_VISIBLE_ITEMS}/{items.length}. Dùng tìm kiếm để lọc.
          </div>
        )}
      </div>
    </div>
  );
});

export default EntityColumn;
