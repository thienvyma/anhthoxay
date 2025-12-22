/**
 * Region Modal Component
 *
 * Modal for creating/editing regions.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import type { Region, RegionTreeNode, RegionFormData } from './types';
import { LEVEL_LABELS, LEVEL_COLORS } from './types';

interface RegionModalProps {
  show: boolean;
  editingRegion: Region | null;
  formData: RegionFormData;
  flatRegions: Region[];
  regions: RegionTreeNode[];
  saving: boolean;
  onFormChange: (data: Partial<RegionFormData>) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const RegionModal = memo(function RegionModal({
  show,
  editingRegion,
  formData,
  flatRegions,
  regions,
  saving,
  onFormChange,
  onNameChange,
  onSave,
  onClose,
}: RegionModalProps) {
  // Get available parent options
  const getParentOptions = () => {
    const options: Array<{ value: string; label: string }> = [
      { value: '', label: '-- Không có (Cấp cao nhất) --' },
    ];

    const isDescendant = (node: RegionTreeNode, targetId: string): boolean => {
      for (const child of node.children) {
        if (child.id === targetId || isDescendant(child, targetId)) {
          return true;
        }
      }
      return false;
    };

    const addOptions = (nodes: RegionTreeNode[], prefix = '') => {
      for (const node of nodes) {
        if (editingRegion && (node.id === editingRegion.id || isDescendant(node, editingRegion.id))) {
          continue;
        }
        if (node.level < 3) {
          options.push({
            value: node.id,
            label: `${prefix}${node.name} (${LEVEL_LABELS[node.level]})`,
          });
          if (node.children.length > 0) {
            addOptions(node.children, prefix + '  ');
          }
        }
      }
    };

    addOptions(regions);
    return options;
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9998 }}
          />
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: 'min(500px, 100%)',
                background: tokens.color.surface,
                borderRadius: tokens.radius.lg,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: 24,
                  borderBottom: `1px solid ${tokens.color.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {editingRegion ? 'Chỉnh sửa khu vực' : 'Thêm khu vực mới'}
                </h3>
                <button
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: tokens.color.muted,
                    cursor: 'pointer',
                    fontSize: 20,
                  }}
                >
                  <i className="ri-close-line" />
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input
                  label="Tên khu vực"
                  value={formData.name}
                  onChange={onNameChange}
                  placeholder="VD: Quận 1, Bình Thạnh..."
                  required
                  fullWidth
                />

                <Input
                  label="Slug (URL)"
                  value={formData.slug}
                  onChange={(v) => onFormChange({ slug: v })}
                  placeholder="VD: quan-1, binh-thanh..."
                  required
                  fullWidth
                />

                <Select
                  label="Khu vực cha"
                  value={formData.parentId || ''}
                  onChange={(v) => {
                    const parent = flatRegions.find((r) => r.id === v);
                    onFormChange({
                      parentId: v || null,
                      level: parent ? parent.level + 1 : 1,
                    });
                  }}
                  options={getParentOptions()}
                />

                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Thứ tự"
                      type="number"
                      value={formData.order}
                      onChange={(v) => onFormChange({ order: parseInt(v) || 0 })}
                      fullWidth
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        color: tokens.color.text,
                        fontSize: 14,
                        fontWeight: 500,
                        marginBottom: 8,
                      }}
                    >
                      Cấp độ
                    </label>
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(12,12,16,0.6)',
                        border: `1px solid ${tokens.color.border}`,
                        borderRadius: 12,
                        color: LEVEL_COLORS[formData.level],
                        fontSize: 14,
                      }}
                    >
                      Cấp {formData.level}: {LEVEL_LABELS[formData.level]}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => onFormChange({ isActive: e.target.checked })}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <span style={{ color: tokens.color.text, fontSize: 14 }}>Kích hoạt</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: 24,
                  borderTop: `1px solid ${tokens.color.border}`,
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'flex-end',
                }}
              >
                <Button variant="secondary" onClick={onClose}>
                  Hủy
                </Button>
                <Button onClick={onSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : editingRegion ? 'Cập nhật' : 'Tạo mới'}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});
