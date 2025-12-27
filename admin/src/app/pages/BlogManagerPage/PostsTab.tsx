import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { OptimizedImageUpload } from '../../components/OptimizedImageUpload';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { blogPostsApi, blogCategoriesApi, mediaApi } from '../../api';
import { BlogPost, BlogCategory } from '../../types';
import { useToast } from '../../components/Toast';

interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  categoryId: string;
  tags: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
}

const INITIAL_FORM: PostFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featuredImage: '',
  categoryId: '',
  tags: '',
  status: 'DRAFT',
  isFeatured: false,
};

export function PostsTab() {
  const toast = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState<PostFormData>(INITIAL_FORM);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params: { status?: string; categoryId?: string; search?: string } = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.categoryId = filterCategory;
      if (searchTerm) params.search = searchTerm;
      const data = await blogPostsApi.list(params);
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, searchTerm]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await blogCategoriesApi.list();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadCategories();
  }, [loadPosts, loadCategories]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false);
    setEditingPost(null);
    setFormData(INITIAL_FORM);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await blogPostsApi.update(editingPost.id, formData);
        toast.success('Bài viết đã được cập nhật!');
      } else {
        await blogPostsApi.create(formData);
        toast.success('Bài viết mới đã được tạo!');
      }
      await loadPosts();
      handleCloseEditor();
    } catch (error) {
      console.error('Failed to save post:', error);
      toast.error('Lưu bài viết thất bại');
    }
  }, [editingPost, formData, loadPosts, handleCloseEditor, toast]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Xóa bài viết này?')) return;
    try {
      await blogPostsApi.delete(id);
      await loadPosts();
      toast.success('Bài viết đã được xóa!');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Xóa bài viết thất bại');
    }
  }, [loadPosts, toast]);

  const handleEdit = useCallback((post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featuredImage: post.featuredImage || '',
      categoryId: post.categoryId,
      tags: post.tags || '',
      status: post.status,
      isFeatured: post.isFeatured,
    });
    setShowEditor(true);
  }, []);

  const handleTitleChange = useCallback((title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : generateSlug(title),
    }));
  }, [editingPost]);

  if (loading && posts.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 48, display: 'block', marginBottom: 16, color: tokens.color.primary }}
        />
        <p style={{ color: tokens.color.muted }}>Đang tải...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <Button onClick={() => setShowEditor(true)} icon="ri-add-line">
          Tạo Post Mới
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }} icon="ri-filter-3-line" title="Bộ lọc">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <i className="ri-search-line" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: tokens.color.muted }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              style={{
                width: '100%',
                paddingLeft: 40,
                paddingRight: 16,
                paddingTop: 10,
                paddingBottom: 10,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
          />
          <Select
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: '', label: 'Tất cả categories' },
              ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
            ]}
          />
        </div>
      </Card>

      {/* Posts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onEdit={handleEdit} onDelete={handleDelete} />
        ))}

        {posts.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 60 }}>
            <i className="ri-article-line" style={{ fontSize: 64, color: tokens.color.border, marginBottom: 16, display: 'block' }} />
            <p style={{ color: tokens.color.muted, marginBottom: 20 }}>Chưa có bài viết nào</p>
            <Button onClick={() => setShowEditor(true)} icon="ri-add-line" variant="secondary">
              Tạo Post Đầu Tiên
            </Button>
          </Card>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <PostEditorModal
          editingPost={editingPost}
          formData={formData}
          categories={categories}
          onTitleChange={handleTitleChange}
          onFormChange={setFormData}
          onSubmit={handleSubmit}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}


// Sub-components
interface PostCardProps {
  post: BlogPost;
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
}

function PostCard({ post, onEdit, onDelete }: PostCardProps) {
  return (
    <Card hoverable style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', gap: 20 }}>
        {post.featuredImage && (
          <img
            src={resolveMediaUrl(post.featuredImage)}
            alt={post.title}
            style={{
              width: 120,
              height: 120,
              objectFit: 'cover',
              borderRadius: 10,
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: tokens.color.text, marginBottom: 4 }}>{post.title}</h3>
              <p style={{ fontSize: 12, color: tokens.color.muted }}>/{post.slug}</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit(post)}
                style={{
                  padding: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.primary,
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                <i className="ri-edit-line" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(post.id)}
                style={{
                  padding: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.error,
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                <i className="ri-delete-bin-line" />
              </motion.button>
            </div>
          </div>

          {post.excerpt && (
            <p style={{ color: tokens.color.muted, fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>{post.excerpt}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: tokens.color.muted, flexWrap: 'wrap' }}>
            <StatusBadge status={post.status} />
            {post.isFeatured && <FeaturedBadge />}
            {post.category && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: post.category.color || tokens.color.primary }} />
                {post.category.name}
              </span>
            )}
            {post.publishedAt && (
              <span><i className="ri-calendar-line" style={{ marginRight: 4 }} />
                {new Date(post.publishedAt).toLocaleDateString('vi-VN')}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    PUBLISHED: { bg: 'rgba(52,211,153,0.15)', text: '#34D399' },
    ARCHIVED: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
    DRAFT: { bg: 'rgba(161,161,170,0.15)', text: '#A1A1AA' },
  };
  const c = colors[status as keyof typeof colors] || colors.DRAFT;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 16, background: c.bg, color: c.text, fontSize: 11, fontWeight: 600 }}>
      {status}
    </span>
  );
}

function FeaturedBadge() {
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: 16,
      background: 'rgba(245,211,147,0.15)',
      color: tokens.color.primary,
      fontSize: 11,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}>
      <i className="ri-star-fill" style={{ fontSize: 12 }} />
      Featured
    </span>
  );
}

interface PostEditorModalProps {
  editingPost: BlogPost | null;
  formData: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    categoryId: string;
    tags: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    isFeatured: boolean;
  };
  categories: BlogCategory[];
  onTitleChange: (title: string) => void;
  onFormChange: React.Dispatch<React.SetStateAction<PostEditorModalProps['formData']>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function PostEditorModal({ editingPost, formData, categories, onTitleChange, onFormChange, onSubmit, onClose }: PostEditorModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1300,
        padding: 24,
        overflowY: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(12,12,16,0.95)',
          backdropFilter: 'blur(24px)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          width: '100%',
          maxWidth: 900,
          marginTop: 32,
          marginBottom: 32,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'rgba(12,12,16,0.95)',
          backdropFilter: 'blur(24px)',
          zIndex: 10,
          borderRadius: '20px 20px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: '#0b0c0f',
            }}>
              <i className={editingPost ? 'ri-edit-line' : 'ri-add-line'} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
                {editingPost ? 'Sửa Bài Viết' : 'Tạo Bài Viết Mới'}
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
              width: 36,
              height: 36,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: tokens.color.muted,
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="ri-close-line" />
          </motion.button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Tiêu đề"
                value={formData.title}
                onChange={onTitleChange}
                placeholder="Tiêu đề bài viết..."
                required
                fullWidth
              />
            </div>

            <Input
              label="Slug (URL)"
              value={formData.slug}
              onChange={(value) => onFormChange(prev => ({ ...prev, slug: value }))}
              placeholder="tieu-de-bai-viet"
              required
              fullWidth
            />

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                Category *
              </label>
              <Select
                value={formData.categoryId}
                onChange={(val) => onFormChange(prev => ({ ...prev, categoryId: val }))}
                options={[
                  { value: '', label: 'Chọn category' },
                  ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
                ]}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                Excerpt (Tóm tắt)
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => onFormChange(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Tóm tắt ngắn gọn..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: '10px',
                  color: tokens.color.text,
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
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
                placeholder="Viết nội dung bài viết..."
                minHeight={300}
                onImageUpload={async (file) => {
                  const result = await mediaApi.uploadFile(file);
                  return result.url;
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <OptimizedImageUpload
                label="Featured Image"
                value={formData.featuredImage}
                onChange={(url) => onFormChange(prev => ({ ...prev, featuredImage: url }))}
                aspectRatio="16/9"
                maxWidth={1920}
                maxHeight={1080}
              />
            </div>

            <Input
              label="Tags (phân cách bởi dấu phẩy)"
              value={formData.tags}
              onChange={(value) => onFormChange(prev => ({ ...prev, tags: value }))}
              placeholder="xây dựng, cải tạo, tips"
              fullWidth
            />

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                Trạng thái
              </label>
              <Select
                value={formData.status}
                onChange={(val) => onFormChange(prev => ({ ...prev, status: val as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }))}
                options={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'ARCHIVED', label: 'Archived' },
                ]}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                padding: '14px 18px',
                background: formData.isFeatured ? 'rgba(245,211,147,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${formData.isFeatured ? tokens.color.primary : tokens.color.border}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
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

          <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: `1px solid ${tokens.color.border}` }}>
            <Button type="submit" fullWidth icon={editingPost ? 'ri-save-line' : 'ri-add-line'}>
              {editingPost ? 'Cập nhật' : 'Tạo Post'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} fullWidth>
              Hủy
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
