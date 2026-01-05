import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { blogPostsApi, blogCategoriesApi } from '../../api';
import { useToast } from '../../components/Toast';
import { useResponsive } from '../../../hooks/useResponsive';
import type { BlogPost, BlogCategory } from '../../types';

// Import components
import {
  CategoriesSidebar,
  PostsList,
  CategoryModal,
  PostEditorModal,
  INITIAL_POST_FORM,
  INITIAL_CATEGORY_FORM,
  generateSlug,
} from './components';
import type { PostFormData, CategoryFormData } from './components';

export function BlogManagerPage() {
  const toast = useToast();
  const { isMobile } = useResponsive();

  // Categories state
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(INITIAL_CATEGORY_FORM);

  // Posts state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postForm, setPostForm] = useState<PostFormData>(INITIAL_POST_FORM);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Data fetching
  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const data = await blogCategoriesApi.list();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Không thể tải danh mục');
    } finally {
      setLoadingCategories(false);
    }
  }, [toast]);

  const loadPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      const params: { status?: string; categoryId?: string; search?: string } = {};
      if (filterStatus) params.status = filterStatus;
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (searchTerm) params.search = searchTerm;
      const data = await blogPostsApi.list(params);
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Không thể tải bài viết');
    } finally {
      setLoadingPosts(false);
    }
  }, [filterStatus, selectedCategoryId, searchTerm, toast]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Category handlers
  const handleOpenCategoryModal = useCallback((category?: BlogCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        color: category.color || tokens.color.info,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm(INITIAL_CATEGORY_FORM);
    }
    setShowCategoryModal(true);
  }, []);

  const handleCloseCategoryModal = useCallback(() => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm(INITIAL_CATEGORY_FORM);
  }, []);

  const handleCategoryNameChange = useCallback((name: string) => {
    setCategoryForm(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name),
    }));
  }, [editingCategory]);

  const handleSaveCategory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await blogCategoriesApi.update(editingCategory.id, categoryForm);
        toast.success('Đã cập nhật danh mục!');
      } else {
        await blogCategoriesApi.create(categoryForm);
        toast.success('Đã tạo danh mục mới!');
      }
      await loadCategories();
      handleCloseCategoryModal();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error('Lưu danh mục thất bại');
    }
  }, [editingCategory, categoryForm, loadCategories, handleCloseCategoryModal, toast]);

  const handleDeleteCategory = useCallback(async (id: string) => {
    if (!confirm('Xóa danh mục này? Tất cả bài viết trong danh mục sẽ không thể truy cập!')) return;
    try {
      await blogCategoriesApi.delete(id);
      if (selectedCategoryId === id) setSelectedCategoryId(null);
      await loadCategories();
      toast.success('Đã xóa danh mục!');
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Xóa danh mục thất bại');
    }
  }, [selectedCategoryId, loadCategories, toast]);

  // Post handlers
  const handleOpenPostEditor = useCallback((post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setPostForm({
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
    } else {
      setEditingPost(null);
      setPostForm({ ...INITIAL_POST_FORM, categoryId: selectedCategoryId || '' });
    }
    setShowPostEditor(true);
  }, [selectedCategoryId]);

  const handleClosePostEditor = useCallback(() => {
    setShowPostEditor(false);
    setEditingPost(null);
    setPostForm(INITIAL_POST_FORM);
  }, []);

  const handlePostTitleChange = useCallback((title: string) => {
    setPostForm(prev => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : generateSlug(title),
    }));
  }, [editingPost]);

  const handleSavePost = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await blogPostsApi.update(editingPost.id, postForm);
        toast.success('Đã cập nhật bài viết!');
      } else {
        await blogPostsApi.create(postForm);
        toast.success('Đã tạo bài viết mới!');
      }
      await loadPosts();
      handleClosePostEditor();
    } catch (error) {
      console.error('Failed to save post:', error);
      toast.error('Lưu bài viết thất bại');
    }
  }, [editingPost, postForm, loadPosts, handleClosePostEditor, toast]);

  const handleDeletePost = useCallback(async (id: string) => {
    if (!confirm('Xóa bài viết này?')) return;
    try {
      await blogPostsApi.delete(id);
      await loadPosts();
      toast.success('Đã xóa bài viết!');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Xóa bài viết thất bại');
    }
  }, [loadPosts, toast]);

  // Computed values
  const totalPosts = useMemo(() => {
    return categories.reduce((sum, cat) => sum + (cat._count?.posts || 0), 0);
  }, [categories]);

  // Loading state
  if (loadingCategories && loadingPosts && categories.length === 0 && posts.length === 0) {
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
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 16, marginBottom: 24 
      }}>
        <div>
          <h1 style={{ color: tokens.color.text, fontSize: isMobile ? 24 : 28, fontWeight: 700, margin: 0 }}>
            Quản lý Blog
          </h1>
          <p style={{ color: tokens.color.muted, margin: '8px 0 0' }}>
            {categories.length} danh mục · {totalPosts} bài viết
          </p>
        </div>
        <Button onClick={() => handleOpenPostEditor()} icon="ri-add-line">
          Tạo bài viết
        </Button>
      </div>

      {/* Main Content Card */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
          minHeight: 500,
        }}>
          {/* Left Column - Categories */}
          <CategoriesSidebar
            categories={categories}
            loading={loadingCategories}
            selectedId={selectedCategoryId}
            totalPosts={totalPosts}
            onSelect={setSelectedCategoryId}
            onAdd={() => handleOpenCategoryModal()}
            onEdit={handleOpenCategoryModal}
            onDelete={handleDeleteCategory}
            isMobile={isMobile}
          />

          {/* Right Column - Posts */}
          <div style={{ 
            borderLeft: isMobile ? 'none' : `1px solid ${tokens.color.border}`,
            borderTop: isMobile ? `1px solid ${tokens.color.border}` : 'none',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Filters */}
            <div style={{ 
              padding: '16px 20px', borderBottom: `1px solid ${tokens.color.border}`,
              background: tokens.color.surfaceAlt,
            }}>
              <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <i className="ri-search-line" style={{ 
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', 
                    fontSize: 16, color: tokens.color.muted 
                  }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm bài viết..."
                    style={{
                      width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
                      background: tokens.color.surfaceAlt, border: `1px solid ${tokens.color.border}`,
                      borderRadius: tokens.radius.sm, color: tokens.color.text, fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
                <div style={{ width: isMobile ? '100%' : 160 }}>
                  <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={[
                      { value: '', label: 'Tất cả' },
                      { value: 'DRAFT', label: 'Nháp' },
                      { value: 'PUBLISHED', label: 'Đã xuất bản' },
                      { value: 'ARCHIVED', label: 'Lưu trữ' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Posts List */}
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              <PostsList
                posts={posts}
                loading={loadingPosts}
                onEdit={handleOpenPostEditor}
                onDelete={handleDeletePost}
                onCreateNew={() => handleOpenPostEditor()}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <AnimatePresence>
        {showCategoryModal && (
          <CategoryModal
            editingCategory={editingCategory}
            formData={categoryForm}
            onNameChange={handleCategoryNameChange}
            onFormChange={setCategoryForm}
            onSubmit={handleSaveCategory}
            onClose={handleCloseCategoryModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPostEditor && (
          <PostEditorModal
            editingPost={editingPost}
            formData={postForm}
            categories={categories}
            onTitleChange={handlePostTitleChange}
            onFormChange={setPostForm}
            onSubmit={handleSavePost}
            onClose={handleClosePostEditor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
