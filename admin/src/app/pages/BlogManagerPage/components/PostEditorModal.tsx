import { motion } from 'framer-motion';
import { tokens } from '../../../../theme';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { OptimizedImageUpload } from '../../../components/OptimizedImageUpload';
import { MarkdownEditor } from '../../../components/MarkdownEditor';
import { mediaApi } from '../../../api';
import type { BlogPost, BlogCategory } from '../../../types';
import type { PostFormData } from './types';

interface PostEditorModalProps {
  editingPost: BlogPost | null;
  formData: PostFormData;
  categories: BlogCategory[];
  onTitleChange: (title: string) => void;
  onFormChange: React.Dispatch<React.SetStateAction<PostFormData>>;
  onSubmit: (status?: 'DRAFT' | 'PUBLISHED') => void;
  onClose: () => void;
}

export function PostEditorModal({ 
  editingPost, 
  formData, 
  categories, 
  onTitleChange, 
  onFormChange, 
  onSubmit, 
  onClose 
}: PostEditorModalProps) {
  const handleSaveDraft = () => {
    onSubmit('DRAFT');
  };

  const handlePublish = () => {
    onSubmit('PUBLISHED');
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: tokens.color.overlay,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 1300, padding: 24, overflowY: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: tokens.color.surface,
          borderRadius: '20px', border: `1px solid ${tokens.color.border}`,
          width: '100%', maxWidth: 900, marginTop: 32, marginBottom: 32,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: `1px solid ${tokens.color.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: tokens.color.surface,
          zIndex: 10, borderRadius: '20px 20px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '14px',
              background: `${tokens.color.primary}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: tokens.color.primary,
            }}>
              <i className={editingPost ? 'ri-edit-line' : 'ri-add-line'} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
                {editingPost ? 'Sửa bài viết' : 'Tạo bài viết mới'}
              </h2>
              <p style={{ fontSize: 13, color: tokens.color.muted, margin: 0 }}>
                {editingPost ? 'Cập nhật thông tin' : 'Điền thông tin bài viết'}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: 36, height: 36, background: tokens.color.surfaceHover,
              border: `1px solid ${tokens.color.border}`, borderRadius: '10px',
              color: tokens.color.muted, cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="ri-close-line" />
          </motion.button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="Tiêu đề" value={formData.title} onChange={onTitleChange}
                placeholder="Tiêu đề bài viết..." required fullWidth />
            </div>

            <Input label="Slug (URL)" value={formData.slug}
              onChange={(value) => onFormChange(prev => ({ ...prev, slug: value }))}
              placeholder="tieu-de-bai-viet" required fullWidth />

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                Danh mục *
              </label>
              <Select
                value={formData.categoryId}
                onChange={(val) => onFormChange(prev => ({ ...prev, categoryId: val }))}
                options={[
                  { value: '', label: 'Chọn danh mục' },
                  ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
                ]}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                Tóm tắt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => onFormChange(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Tóm tắt ngắn gọn..." rows={2}
                style={{
                  width: '100%', padding: '12px 14px', background: tokens.color.background,
                  border: `1px solid ${tokens.color.border}`, borderRadius: '10px',
                  color: tokens.color.text, fontSize: 14, outline: 'none',
                  resize: 'vertical', fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                Nội dung *
              </label>
              <MarkdownEditor
                value={formData.content}
                onChange={(value) => onFormChange(prev => ({ ...prev, content: value }))}
                placeholder="Viết nội dung bài viết..." minHeight={300}
                onImageUpload={async (file) => {
                  const result = await mediaApi.uploadFile(file, 'blog');
                  return result.url;
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <OptimizedImageUpload
                label="Ảnh đại diện" value={formData.featuredImage}
                onChange={(url) => onFormChange(prev => ({ ...prev, featuredImage: url }))}
                aspectRatio="16/9" maxWidth={1920} maxHeight={1080}
              />
            </div>

            <Input label="Tags (phân cách bởi dấu phẩy)" value={formData.tags}
              onChange={(value) => onFormChange(prev => ({ ...prev, tags: value }))}
              placeholder="xây dựng, cải tạo, tips" fullWidth />

            {/* Chỉ hiện dropdown trạng thái khi đang sửa bài */}
            {editingPost && (
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                  Trạng thái
                </label>
                <Select
                  value={formData.status}
                  onChange={(val) => onFormChange(prev => ({ ...prev, status: val as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }))}
                  options={[
                    { value: 'DRAFT', label: 'Nháp' },
                    { value: 'PUBLISHED', label: 'Xuất bản' },
                    { value: 'ARCHIVED', label: 'Lưu trữ' },
                  ]}
                />
              </div>
            )}

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ 
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                background: formData.isFeatured ? 'rgba(245,211,147,0.08)' : tokens.color.surfaceAlt,
                border: `1px solid ${formData.isFeatured ? tokens.color.primary : tokens.color.border}`,
                borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <input type="checkbox" checked={formData.isFeatured}
                  onChange={(e) => onFormChange(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: tokens.color.primary }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: formData.isFeatured ? tokens.color.primary : tokens.color.text }}>
                    <i className="ri-star-fill" style={{ marginRight: 6 }} />
                    Nổi bật trên trang chủ
                  </div>
                  <div style={{ fontSize: 12, color: tokens.color.muted }}>
                    Hiển thị trong phần "Featured Blog Posts"
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', gap: 12, paddingTop: 20, 
            borderTop: `1px solid ${tokens.color.border}`,
            flexWrap: 'wrap',
          }}>
            {editingPost ? (
              // Khi sửa bài: hiện nút Cập nhật
              <>
                <Button type="button" onClick={handlePublish} fullWidth icon="ri-save-line">
                  Cập nhật
                </Button>
                <Button type="button" variant="secondary" onClick={onClose} fullWidth>
                  Hủy
                </Button>
              </>
            ) : (
              // Khi tạo mới: hiện 2 nút Lưu nháp và Xuất bản
              <>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleSaveDraft}
                  style={{ flex: 1 }}
                  icon="ri-draft-line"
                >
                  Lưu nháp
                </Button>
                <Button 
                  type="button" 
                  onClick={handlePublish}
                  style={{ flex: 2 }}
                  icon="ri-send-plane-fill"
                >
                  <i className="ri-global-line" style={{ marginRight: 6 }} />
                  Xuất bản ngay
                </Button>
              </>
            )}
          </div>

          {/* Hint text */}
          {!editingPost && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', 
              background: `${tokens.color.info}10`,
              border: `1px solid ${tokens.color.info}30`,
              borderRadius: tokens.radius.md,
              marginTop: -8,
            }}>
              <i className="ri-information-line" style={{ color: tokens.color.info, fontSize: 18 }} />
              <span style={{ fontSize: 13, color: tokens.color.textMuted }}>
                <strong style={{ color: tokens.color.text }}>Lưu nháp:</strong> Chỉ lưu, chưa hiển thị trên website. 
                <strong style={{ color: tokens.color.primary, marginLeft: 8 }}>Xuất bản:</strong> Hiển thị ngay trên website.
              </span>
            </div>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
}
