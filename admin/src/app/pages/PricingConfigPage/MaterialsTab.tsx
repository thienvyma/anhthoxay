import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { IconPicker } from '../../components/IconPicker';
import { mediaApi, materialsApi, materialCategoriesApi } from '../../api';
import { useToast } from '../../components/Toast';
import type { MaterialsTabProps, Material, MaterialCategory } from './types';

type SubTab = 'materials' | 'categories';

export function MaterialsTab({ materials, categories, onRefresh }: MaterialsTabProps) {
  const toast = useToast();
  const [subTab, setSubTab] = useState<SubTab>('materials');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // View mode: 'grid' or 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Material state
  const [editingItem, setEditingItem] = useState<Material | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: '', categoryId: '', imageUrl: '', price: 0, unit: '', description: '', isActive: true });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category state
  const [editingCategory, setEditingCategory] = useState<MaterialCategory | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '', description: '', order: 0 });

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + ' đ';

  // Filter materials by category and search
  const filteredItems = useMemo(() => {
    let items = materials;
    if (selectedCategoryId) {
      items = items.filter(m => m.categoryId === selectedCategoryId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(m => m.name.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));
    }
    return items;
  }, [materials, selectedCategoryId, searchQuery]);

  // Count materials per category
  const categoryMaterialCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    materials.forEach(m => {
      counts[m.categoryId] = (counts[m.categoryId] || 0) + 1;
    });
    return counts;
  }, [materials]);

  // Material handlers
  const resetForm = () => {
    setForm({ name: '', categoryId: categories[0]?.id || '', imageUrl: '', price: 0, unit: '', description: '', isActive: true });
    setEditingItem(null);
    setIsCreating(false);
  };

  const handleEdit = (item: Material) => {
    setEditingItem(item);
    setForm({ name: item.name, categoryId: item.categoryId, imageUrl: item.imageUrl || '', price: item.price, unit: item.unit || '', description: item.description || '', isActive: item.isActive });
    setIsCreating(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await mediaApi.uploadFile(file);
      const fullUrl = result.url.startsWith('http') ? result.url : `${API_URL}${result.url}`;
      setForm(prev => ({ ...prev, imageUrl: fullUrl }));
      toast.success('Upload ảnh thành công!');
    } catch (error) {
      toast.error('Upload thất bại: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.categoryId) { toast.error('Vui lòng chọn danh mục'); return; }
    try {
      const materialData = {
        name: form.name,
        categoryId: form.categoryId,
        imageUrl: form.imageUrl || null,
        price: form.price,
        unit: form.unit || null,
        description: form.description || undefined,
        isActive: form.isActive,
      };
      if (editingItem) {
        await materialsApi.update(editingItem.id, materialData);
      } else {
        await materialsApi.create(materialData);
      }
      toast.success(editingItem ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
      onRefresh();
      resetForm();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa vật dụng này?')) return;
    try {
      await materialsApi.delete(id);
      toast.success('Đã xóa');
      onRefresh();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
  };

  // Category handlers
  const resetCategoryForm = () => {
    setCategoryForm({ name: '', icon: '', description: '', order: 0 });
    setEditingCategory(null);
    setIsCreatingCategory(false);
  };

  const handleEditCategory = (cat: MaterialCategory) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, icon: cat.icon || '', description: cat.description || '', order: cat.order });
    setIsCreatingCategory(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) { toast.error('Vui lòng nhập tên danh mục'); return; }
    try {
      const categoryData = {
        name: categoryForm.name,
        icon: categoryForm.icon || undefined,
        description: categoryForm.description || undefined,
        order: categoryForm.order,
      };
      if (editingCategory) {
        await materialCategoriesApi.update(editingCategory.id, categoryData);
      } else {
        await materialCategoriesApi.create(categoryData);
      }
      toast.success(editingCategory ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
      onRefresh();
      resetCategoryForm();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      await materialCategoriesApi.delete(id);
      toast.success('Đã xóa');
      onRefresh();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
  };

  const handleAddMaterial = () => {
    resetForm();
    setForm(prev => ({ ...prev, categoryId: selectedCategoryId || categories[0]?.id || '' }));
    setIsCreating(true);
  };

  return (
    <>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <Button variant={subTab === 'materials' ? 'primary' : 'outline'} onClick={() => setSubTab('materials')}>
          <i className="ri-box-3-line" /> Vật dụng
        </Button>
        <Button variant={subTab === 'categories' ? 'primary' : 'outline'} onClick={() => setSubTab('categories')}>
          <i className="ri-folder-line" /> Danh mục
        </Button>
      </div>

      {subTab === 'materials' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, minHeight: 500 }}>
          {/* Sidebar - Category List */}
          <Card style={{ padding: 0, height: 'fit-content', position: 'sticky', top: 20 }}>
            <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${tokens.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.color.text, fontWeight: 600, fontSize: 14 }}>
                <i className="ri-folder-line" style={{ marginRight: 8 }} />Danh mục
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { resetCategoryForm(); setIsCreatingCategory(true); }}
                style={{ width: 24, height: 24, borderRadius: 6, background: tokens.color.primary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="ri-add-line" style={{ fontSize: 14, color: '#111' }} />
              </motion.button>
            </div>
            
            {/* All items */}
            <motion.div
              whileHover={{ background: 'rgba(255,255,255,0.05)' }}
              onClick={() => setSelectedCategoryId(null)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: selectedCategoryId === null ? 'rgba(245,211,147,0.1)' : 'transparent',
                borderLeft: selectedCategoryId === null ? `3px solid ${tokens.color.primary}` : '3px solid transparent',
              }}
            >
              <span style={{ color: selectedCategoryId === null ? tokens.color.primary : tokens.color.text, fontSize: 14, fontWeight: selectedCategoryId === null ? 600 : 400 }}>
                <i className="ri-apps-line" style={{ marginRight: 8 }} />Tất cả sản phẩm
              </span>
              <span style={{ color: tokens.color.muted, fontSize: 12 }}>{materials.length}</span>
            </motion.div>

            {/* Category items */}
            {categories.map(cat => (
              <motion.div
                key={cat.id}
                whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                onClick={() => setSelectedCategoryId(cat.id)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: selectedCategoryId === cat.id ? 'rgba(245,211,147,0.1)' : 'transparent',
                  borderLeft: selectedCategoryId === cat.id ? `3px solid ${tokens.color.primary}` : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  {cat.icon && <i className={cat.icon} style={{ color: selectedCategoryId === cat.id ? tokens.color.primary : tokens.color.muted, fontSize: 16 }} />}
                  <span style={{ 
                    color: selectedCategoryId === cat.id ? tokens.color.primary : tokens.color.text, 
                    fontSize: 14, 
                    fontWeight: selectedCategoryId === cat.id ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{cat.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: tokens.color.muted, fontSize: 12 }}>{categoryMaterialCounts[cat.id] || 0}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); handleEditCategory(cat); }}
                    style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: tokens.color.muted, opacity: 0.6 }}
                  >
                    <i className="ri-edit-line" style={{ fontSize: 14 }} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </Card>

          {/* Main Content - Materials */}
          <Card style={{ padding: 0 }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${tokens.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ color: tokens.color.text, fontWeight: 600, fontSize: 14 }}>
                <i className="ri-box-3-line" style={{ marginRight: 8 }} />
                Sản phẩm ({filteredItems.length})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* View Mode Toggle */}
                <div style={{ display: 'flex', background: tokens.color.background, borderRadius: tokens.radius.sm, padding: 2 }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('grid')}
                    style={{
                      padding: '6px 10px',
                      background: viewMode === 'grid' ? tokens.color.primary : 'transparent',
                      border: 'none',
                      borderRadius: tokens.radius.sm,
                      color: viewMode === 'grid' ? '#111' : tokens.color.muted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <i className="ri-grid-fill" style={{ fontSize: 16 }} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('table')}
                    style={{
                      padding: '6px 10px',
                      background: viewMode === 'table' ? tokens.color.primary : 'transparent',
                      border: 'none',
                      borderRadius: tokens.radius.sm,
                      color: viewMode === 'table' ? '#111' : tokens.color.muted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <i className="ri-list-check" style={{ fontSize: 16 }} />
                  </motion.button>
                </div>
                <Button onClick={handleAddMaterial} size="small">
                  <i className="ri-add-line" /> Thêm sản phẩm
                </Button>
              </div>
            </div>

            {/* Search */}
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${tokens.color.border}` }}>
              <div style={{ position: 'relative' }}>
                <i className="ri-search-line" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.color.muted }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Products Display */}
            <div style={{ overflowX: 'auto' }}>
              {filteredItems.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: tokens.color.muted }}>
                  <i className="ri-inbox-line" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.5 }} />
                  {searchQuery ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid View */
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 16,
                    padding: 16,
                  }}
                >
                  {filteredItems.map(item => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -4, boxShadow: tokens.shadow.md }}
                      style={{
                        background: tokens.color.background,
                        borderRadius: tokens.radius.lg,
                        border: `1px solid ${tokens.color.border}`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                      onClick={() => handleEdit(item)}
                    >
                      {/* Image Container */}
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          paddingTop: '75%',
                          background: tokens.color.surface,
                          overflow: 'hidden',
                        }}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: `linear-gradient(135deg, ${tokens.color.background}, ${tokens.color.surface})`,
                            }}
                          >
                            <i className="ri-image-line" style={{ fontSize: 48, color: tokens.color.muted, opacity: 0.5 }} />
                          </div>
                        )}

                        {/* Status Badge */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            padding: '4px 10px',
                            borderRadius: tokens.radius.sm,
                            background: item.isActive ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {item.isActive ? 'Hoạt động' : 'Ẩn'}
                        </div>

                        {/* Category Badge */}
                        {item.category?.name && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 10,
                              left: 10,
                              padding: '4px 10px',
                              borderRadius: tokens.radius.sm,
                              background: 'rgba(0, 0, 0, 0.7)',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            {item.category.name}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ padding: 14 }}>
                        <h3
                          style={{
                            margin: 0,
                            color: tokens.color.text,
                            fontSize: 14,
                            fontWeight: 600,
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.name}
                        </h3>

                        {item.description && (
                          <p
                            style={{
                              margin: '4px 0 0',
                              color: tokens.color.muted,
                              fontSize: 12,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.description}
                          </p>
                        )}

                        {/* Price */}
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span
                            style={{
                              color: tokens.color.primary,
                              fontSize: 16,
                              fontWeight: 700,
                            }}
                          >
                            {formatPrice(item.price)}
                          </span>
                          {item.unit && (
                            <span style={{ color: tokens.color.muted, fontSize: 12 }}>
                              /{item.unit}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div
                          style={{
                            marginTop: 12,
                            display: 'flex',
                            gap: 8,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(item)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${tokens.color.border}`,
                              borderRadius: tokens.radius.sm,
                              color: tokens.color.primary,
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                            }}
                          >
                            <i className="ri-edit-line" style={{ fontSize: 14 }} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(item.id)}
                            style={{
                              padding: '8px 12px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: tokens.radius.sm,
                              color: '#ef4444',
                              fontSize: 13,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* Table View */
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                      <th style={{ padding: '12px 20px', textAlign: 'left', color: tokens.color.muted, fontSize: 13, fontWeight: 500 }}>Sản phẩm</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 13, fontWeight: 500 }}>Danh mục</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.muted, fontSize: 13, fontWeight: 500 }}>Giá</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 13, fontWeight: 500 }}>Trạng thái</th>
                      <th style={{ padding: '12px 20px', textAlign: 'right', color: tokens.color.muted, fontSize: 13, fontWeight: 500 }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <motion.tr
                        key={item.id}
                        whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                        style={{ borderBottom: `1px solid ${tokens.color.border}`, cursor: 'pointer' }}
                        onClick={() => handleEdit(item)}
                      >
                        <td style={{ padding: '12px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ri-image-line" style={{ color: tokens.color.muted }} />
                              </div>
                            )}
                            <div>
                              <div style={{ color: tokens.color.text, fontWeight: 500, fontSize: 14 }}>{item.name}</div>
                              {item.description && <div style={{ color: tokens.color.muted, fontSize: 12, marginTop: 2 }}>{item.description.slice(0, 50)}{item.description.length > 50 ? '...' : ''}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: tokens.color.muted, fontSize: 13 }}>{item.category?.name || 'N/A'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span style={{ color: tokens.color.primary, fontWeight: 600 }}>{formatPrice(item.price)}</span>
                          {item.unit && <span style={{ color: tokens.color.muted, fontSize: 12, marginLeft: 4 }}>/{item.unit}</span>}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 6, background: item.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: item.isActive ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 500 }}>
                            {item.isActive ? 'Hiện' : 'Ẩn'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEdit(item)} style={{ padding: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${tokens.color.border}`, borderRadius: 6, cursor: 'pointer', color: tokens.color.primary }}>
                              <i className="ri-edit-line" />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDelete(item.id)} style={{ padding: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, cursor: 'pointer', color: '#ef4444' }}>
                              <i className="ri-delete-bin-line" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

      ) : (
        /* Categories Tab - Keep original grid layout */
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <Button onClick={() => { resetCategoryForm(); setIsCreatingCategory(true); }}><i className="ri-add-line" /> Thêm danh mục</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {categories.map(cat => (
              <Card key={cat.id} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {cat.icon && <i className={cat.icon} style={{ fontSize: 24, color: tokens.color.primary }} />}
                    <div>
                      <h3 style={{ color: tokens.color.text, margin: 0, fontSize: 16 }}>{cat.name}</h3>
                      {cat.description && <p style={{ color: tokens.color.muted, margin: '4px 0 0', fontSize: 13 }}>{cat.description}</p>}
                    </div>
                  </div>
                  <span style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: tokens.color.muted, fontSize: 12 }}>{cat._count?.materials || 0} vật dụng</span>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <Button variant="outline" size="small" onClick={() => handleEditCategory(cat)}><i className="ri-edit-line" /> Sửa</Button>
                  <Button variant="outline" size="small" onClick={() => handleDeleteCategory(cat.id)} style={{ color: '#ef4444' }}><i className="ri-delete-bin-line" /> Xóa</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Material Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
              style={{ background: tokens.color.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ color: tokens.color.text, margin: '0 0 24px' }}>{editingItem ? 'Sửa vật dụng' : 'Thêm vật dụng mới'}</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <Input label="Tên vật dụng" value={form.name} onChange={val => setForm({ ...form, name: val })} placeholder="VD: Sơn Dulux" />
                <Select label="Danh mục" value={form.categoryId} onChange={val => setForm({ ...form, categoryId: val })} options={categories.map(c => ({ value: c.id, label: c.name }))} />
                <div>
                  <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>Hình ảnh</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} style={{ display: 'none' }} />
                  {form.imageUrl ? (
                    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${tokens.color.border}` }}>
                      <img src={form.imageUrl} alt="Preview" style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8 }}>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => fileInputRef.current?.click()}
                          style={{ padding: '8px 12px', background: 'rgba(59,130,246,0.9)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14 }}><i className="ri-refresh-line" /></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleRemoveImage}
                          style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14 }}><i className="ri-delete-bin-line" /></motion.button>
                      </div>
                    </div>
                  ) : (
                    <motion.div whileHover={{ borderColor: tokens.color.primary }} onClick={() => !uploading && fileInputRef.current?.click()}
                      style={{ height: 180, border: `2px dashed ${tokens.color.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: uploading ? 'wait' : 'pointer', background: 'rgba(255,255,255,0.02)' }}>
                      {uploading ? (
                        <><motion.i className="ri-loader-4-line" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 32, color: tokens.color.primary }} /><span style={{ color: tokens.color.muted, fontSize: 13 }}>Đang tải lên...</span></>
                      ) : (
                        <><i className="ri-upload-cloud-2-line" style={{ fontSize: 40, color: tokens.color.muted }} /><span style={{ color: tokens.color.muted, fontSize: 13 }}>Click để tải ảnh lên</span></>
                      )}
                    </motion.div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input label="Giá (VNĐ)" type="number" value={form.price} onChange={val => setForm({ ...form, price: parseInt(val) || 0 })} />
                  <Input label="Đơn vị" value={form.unit} onChange={val => setForm({ ...form, unit: val })} placeholder="VD: thùng, m², cái" />
                </div>
                <Input label="Mô tả" value={form.description} onChange={val => setForm({ ...form, description: val })} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /><span style={{ color: tokens.color.text }}>Hoạt động</span>
                </label>
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={resetForm}>Hủy</Button>
                <Button onClick={handleSave}>{editingItem ? 'Cập nhật' : 'Tạo mới'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCreatingCategory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetCategoryForm}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
              style={{ background: tokens.color.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 450 }}>
              <h2 style={{ color: tokens.color.text, margin: '0 0 24px' }}>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <Input label="Tên danh mục" value={categoryForm.name} onChange={val => setCategoryForm({ ...categoryForm, name: val })} placeholder="VD: Sơn, Gạch" />
                <IconPicker label="Icon" value={categoryForm.icon} onChange={val => setCategoryForm({ ...categoryForm, icon: val })} placeholder="Chọn icon cho danh mục" />
                <Input label="Mô tả" value={categoryForm.description} onChange={val => setCategoryForm({ ...categoryForm, description: val })} />
                <Input label="Thứ tự" type="number" value={categoryForm.order} onChange={val => setCategoryForm({ ...categoryForm, order: parseInt(val) || 0 })} />
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={resetCategoryForm}>Hủy</Button>
                <Button onClick={handleSaveCategory}>{editingCategory ? 'Cập nhật' : 'Tạo mới'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
