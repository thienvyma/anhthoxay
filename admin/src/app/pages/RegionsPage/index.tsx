/**
 * Regions Management Page
 *
 * Admin page for managing regions with tree view, CRUD operations.
 *
 * **Feature: bidding-phase1-foundation**
 * **Requirements: REQ-3.4**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { regionsApi } from '../../api';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { RegionTreeItem } from './RegionTreeItem';
import { RegionModal } from './RegionModal';
import { DeleteModal } from './DeleteModal';
import { LEVEL_LABELS, LEVEL_COLORS, defaultFormData, type Region, type RegionTreeNode, type RegionFormData } from './types';

interface RegionsPageProps {
  embedded?: boolean;
}

export function RegionsPage({ embedded = false }: RegionsPageProps) {
  const toast = useToast();
  const [regions, setRegions] = useState<RegionTreeNode[]>([]);
  const [flatRegions, setFlatRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<RegionFormData>(defaultFormData);

  // Load regions
  const loadRegions = useCallback(async () => {
    setLoading(true);
    try {
      const [treeData, flatData] = await Promise.all([
        regionsApi.list({ flat: false }),
        regionsApi.list({ flat: true }),
      ]);
      // Ensure we always have arrays even if API returns null/undefined
      const treeArray = Array.isArray(treeData) ? treeData : [];
      const flatArray = Array.isArray(flatData) ? flatData : [];
      setRegions(treeArray as RegionTreeNode[]);
      setFlatRegions(flatArray as Region[]);
      const firstLevelIds = treeArray.map((r) => r.id);
      setExpandedIds(new Set(firstLevelIds));
    } catch (error) {
      console.error('Failed to load regions:', error);
      toast.error('Không thể tải danh sách khu vực');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  // Handlers
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(flatRegions.map((r) => r.id)));
  }, [flatRegions]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleOpenCreateModal = useCallback(
    (parentId?: string) => {
      const parent = parentId ? flatRegions.find((r) => r.id === parentId) : null;
      setEditingRegion(null);
      setFormData({
        name: '',
        slug: '',
        parentId: parentId || null,
        level: parent ? parent.level + 1 : 1,
        isActive: true,
        order: 0,
      });
      setShowModal(true);
    },
    [flatRegions]
  );

  const handleOpenEditModal = useCallback((region: Region) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      slug: region.slug,
      parentId: region.parentId,
      level: region.level,
      isActive: region.isActive,
      order: region.order,
    });
    setShowModal(true);
  }, []);

  const handleOpenDeleteModal = useCallback((region: Region) => {
    setEditingRegion(region);
    setShowDeleteModal(true);
  }, []);

  const generateSlug = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }, []);

  const handleNameChange = useCallback(
    (name: string) => {
      setFormData((prev) => ({
        ...prev,
        name,
        slug: editingRegion ? prev.slug : generateSlug(name),
      }));
    },
    [editingRegion, generateSlug]
  );

  const handleFormChange = useCallback((data: Partial<RegionFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên khu vực');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Vui lòng nhập slug');
      return;
    }

    setSaving(true);
    try {
      if (editingRegion) {
        await regionsApi.update(editingRegion.id, {
          name: formData.name,
          slug: formData.slug,
          parentId: formData.parentId || undefined,
          isActive: formData.isActive,
          order: formData.order,
        });
        toast.success('Đã cập nhật khu vực thành công!');
      } else {
        await regionsApi.create({
          name: formData.name,
          slug: formData.slug,
          parentId: formData.parentId || undefined,
          level: formData.level,
          isActive: formData.isActive,
          order: formData.order,
        });
        toast.success('Đã tạo khu vực mới thành công!');
      }
      setShowModal(false);
      loadRegions();
    } catch (error) {
      console.error('Failed to save region:', error);
      toast.error(error instanceof Error ? error.message : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  }, [formData, editingRegion, toast, loadRegions]);

  const handleDelete = useCallback(async () => {
    if (!editingRegion) return;
    setSaving(true);
    try {
      await regionsApi.delete(editingRegion.id);
      toast.success('Đã xóa khu vực thành công!');
      setShowDeleteModal(false);
      setEditingRegion(null);
      loadRegions();
    } catch (error) {
      console.error('Failed to delete region:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể xóa khu vực');
    } finally {
      setSaving(false);
    }
  }, [editingRegion, toast, loadRegions]);

  const handleToggleActive = useCallback(
    async (region: Region) => {
      try {
        await regionsApi.update(region.id, { isActive: !region.isActive });
        toast.success(region.isActive ? 'Đã tắt khu vực' : 'Đã bật khu vực');
        loadRegions();
      } catch (error) {
        console.error('Failed to toggle region:', error);
        toast.error('Không thể thay đổi trạng thái');
      }
    },
    [toast, loadRegions]
  );

  // Filter regions by search
  const filterRegions = useCallback((nodes: RegionTreeNode[], searchTerm: string): RegionTreeNode[] => {
    if (!searchTerm.trim()) return nodes;
    const term = searchTerm.toLowerCase();

    const filterNode = (node: RegionTreeNode): RegionTreeNode | null => {
      const matchesSearch = node.name.toLowerCase().includes(term) || node.slug.toLowerCase().includes(term);
      const filteredChildren = node.children
        .map((child) => filterNode(child))
        .filter((child): child is RegionTreeNode => child !== null);

      if (matchesSearch || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };

    return nodes.map((node) => filterNode(node)).filter((node): node is RegionTreeNode => node !== null);
  }, []);

  const filteredRegions = filterRegions(regions, search);

  return (
    <div>
      {/* Header - hidden when embedded */}
      {!embedded && (
        <div
          style={{
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h2 style={{ color: tokens.color.text, fontSize: 24, fontWeight: 600, margin: 0 }}>Quản lý Khu vực</h2>
            <p style={{ color: tokens.color.muted, fontSize: 14, margin: '4px 0 0' }}>
              Quản lý danh sách khu vực theo cấp bậc (Tỉnh/TP → Quận/Huyện → Phường/Xã)
            </p>
          </div>
          <Button onClick={() => handleOpenCreateModal()}>
            <i className="ri-add-line" style={{ marginRight: 8 }} />
            Thêm khu vực
          </Button>
        </div>
      )}

      {/* Search & Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 250, maxWidth: 400 }}>
          <Input placeholder="Tìm kiếm khu vực..." value={search} onChange={setSearch} icon="ri-search-line" fullWidth />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={expandAll} size="small">
            <i className="ri-expand-diagonal-line" style={{ marginRight: 4 }} />
            Mở rộng
          </Button>
          <Button variant="secondary" onClick={collapseAll} size="small">
            <i className="ri-collapse-diagonal-line" style={{ marginRight: 4 }} />
            Thu gọn
          </Button>
        </div>
      </div>

      {/* Level Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[1, 2, 3].map((level) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, background: LEVEL_COLORS[level] }} />
            <span style={{ color: tokens.color.muted, fontSize: 13 }}>
              Cấp {level}: {LEVEL_LABELS[level]}
            </span>
          </div>
        ))}
      </div>

      {/* Regions Tree */}
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: tokens.color.muted }}>
            <motion.i
              className="ri-loader-4-line"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 32 }}
            />
            <p>Đang tải...</p>
          </div>
        ) : filteredRegions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: tokens.color.muted }}>
            <i className="ri-map-pin-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
            <p>{search ? 'Không tìm thấy khu vực phù hợp' : 'Chưa có khu vực nào'}</p>
            {!search && (
              <Button onClick={() => handleOpenCreateModal()} style={{ marginTop: 16 }}>
                <i className="ri-add-line" style={{ marginRight: 8 }} />
                Thêm khu vực đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            {filteredRegions.map((region) => (
              <RegionTreeItem
                key={region.id}
                region={region}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
                onToggleActive={handleToggleActive}
                onAddChild={handleOpenCreateModal}
                level={0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ marginTop: 16, display: 'flex', gap: 24, color: tokens.color.muted, fontSize: 13 }}>
        <span>Tổng: {flatRegions.length} khu vực</span>
        <span>Đang hoạt động: {flatRegions.filter((r) => r.isActive).length}</span>
        <span>Đã tắt: {flatRegions.filter((r) => !r.isActive).length}</span>
      </div>

      {/* Modals */}
      <RegionModal
        show={showModal}
        editingRegion={editingRegion}
        formData={formData}
        flatRegions={flatRegions}
        regions={regions}
        saving={saving}
        onFormChange={handleFormChange}
        onNameChange={handleNameChange}
        onSave={handleSave}
        onClose={() => setShowModal(false)}
      />

      <DeleteModal
        show={showDeleteModal}
        region={editingRegion}
        saving={saving}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
