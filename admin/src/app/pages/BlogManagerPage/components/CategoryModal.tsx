import { motion } from 'framer-motion';
import { tokens } from '../../../../theme';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import type { BlogCategory } from '../../../types';
import type { CategoryFormData } from './types';

interface CategoryModalProps {
  editingCategory: BlogCategory | null;
  formData: CategoryFormData;
  onNameChange: (name: string) => void;
  onFormChange: React.Dispatch<React.SetStateAction<CategoryFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function CategoryModal({ 
  editingCategory, 
  formData, 
  onNameChange, 
  onFormChange, 
  onSubmit, 
  onClose 
}: CategoryModalProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: tokens.color.overlay, backdropFilter: 'blur(4px)', zIndex: 9998,
        }}
      />
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 20,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            width: 'min(500px, 100%)',
            background: 'rgba(20,21,26,0.98)',
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.color.border}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ 
            padding: 20, borderBottom: `1px solid ${tokens.color.border}`, 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: tokens.color.text, margin: 0 }}>
              {editingCategory ? 'Sửa danh mục' : 'Tạo danh mục mới'}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: tokens.color.muted, cursor: 'pointer', fontSize: 22 }}
            >
              <i className="ri-close-line" />
            </motion.button>
          </div>

          <form onSubmit={onSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Tên danh mục"
              value={formData.name}
              onChange={onNameChange}
              placeholder="Ví dụ: Tin Tức, Mẹo Hay"
              required
              fullWidth
            />
            <Input
              label="Slug (URL)"
              value={formData.slug}
              onChange={(value) => onFormChange(prev => ({ ...prev, slug: value }))}
              placeholder="tin-tuc"
              required
              fullWidth
            />
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => onFormChange(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả ngắn về danh mục..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: tokens.color.surfaceAlt,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text, fontSize: 14, outline: 'none',
                  resize: 'vertical', fontFamily: 'inherit',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                Màu sắc
              </label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => onFormChange(prev => ({ ...prev, color: e.target.value }))}
                  style={{
                    width: 50, height: 40, borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.surfaceAlt, cursor: 'pointer',
                  }}
                />
                <Input
                  value={formData.color}
                  onChange={(value) => onFormChange(prev => ({ ...prev, color: value }))}
                  placeholder="#3b82f6"
                  fullWidth
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, paddingTop: 12 }}>
              <Button type="submit" fullWidth icon={editingCategory ? 'ri-save-line' : 'ri-add-line'}>
                {editingCategory ? 'Cập nhật' : 'Tạo danh mục'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} fullWidth>
                Hủy
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
