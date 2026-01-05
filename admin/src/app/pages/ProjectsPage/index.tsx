/**
 * Projects Management Page
 *
 * Admin page for managing construction projects.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 10.1, 10.2, 10.3, 10.4**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { projectsApi, regionsApi, serviceCategoriesApi } from '../../api';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ResponsiveStack } from '../../../components/responsive';
import { useResponsive } from '../../../hooks/useResponsive';
import { ProjectTable } from './ProjectTable';
import { ProjectDetailModal } from './ProjectDetailModal';
import { ApprovalModal } from './ApprovalModal';
import { TABS, STATUS_COLORS, type ProjectStatus, type ProjectListItem, type Project } from './types';
import type { Region, ServiceCategory } from '../../types';

interface ProjectsPageProps {
  embedded?: boolean;
}

export function ProjectsPage({ embedded = false }: ProjectsPageProps) {
  const toast = useToast();
  const { isMobile } = useResponsive();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // Filter options
  const [regions, setRegions] = useState<Region[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectListItem | null>(null);
  const [projectDetail, setProjectDetail] = useState<Project | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Approval form states
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalNote, setApprovalNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Load projects
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const result = await projectsApi.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        regionId: regionFilter || undefined,
        categoryId: categoryFilter || undefined,
        search: search || undefined,
        page,
        limit: 20,
      });
      setProjects(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Không thể tải danh sách công trình');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, regionFilter, categoryFilter, search, page, toast]);

  // Load tab counts
  const loadTabCounts = useCallback(async () => {
    try {
      const statuses: (ProjectStatus | undefined)[] = [
        undefined, // ALL
        'PENDING_APPROVAL',
        'OPEN',
        'REJECTED',
        'BIDDING_CLOSED',
        'MATCHED',
      ];
      const results = await Promise.all(
        statuses.map((status) => projectsApi.list({ status, limit: 1 }))
      );
      const counts: Record<string, number> = {
        ALL: results[0].total,
        PENDING_APPROVAL: results[1].total,
        OPEN: results[2].total,
        REJECTED: results[3].total,
        BIDDING_CLOSED: results[4].total,
        MATCHED: results[5].total,
      };
      setTabCounts(counts);
    } catch (error) {
      console.error('Failed to load tab counts:', error);
    }
  }, []);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const [regionsData, categoriesData] = await Promise.all([
        regionsApi.list({ flat: true }),
        serviceCategoriesApi.list(),
      ]);
      setRegions(regionsData as Region[]);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadTabCounts();
  }, [loadTabCounts]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Handlers
  const handleViewDetail = useCallback(async (project: ProjectListItem) => {
    setSelectedProject(project);
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const detail = await projectsApi.get(project.id);
      setProjectDetail(detail);
    } catch (error) {
      console.error('Failed to load project detail:', error);
      toast.error('Không thể tải thông tin chi tiết');
    } finally {
      setLoadingDetail(false);
    }
  }, [toast]);

  const handleOpenApprovalModal = useCallback((project: ProjectListItem, action: 'approve' | 'reject') => {
    setSelectedProject(project);
    setApprovalAction(action);
    setApprovalNote('');
    setShowApprovalModal(true);
  }, []);

  const handleApproval = useCallback(async () => {
    if (!selectedProject) return;
    setSaving(true);
    try {
      if (approvalAction === 'approve') {
        await projectsApi.approve(selectedProject.id, approvalNote || undefined);
        toast.success('Đã duyệt công trình thành công!');
      } else {
        if (!approvalNote.trim()) {
          toast.error('Vui lòng nhập lý do từ chối');
          setSaving(false);
          return;
        }
        await projectsApi.reject(selectedProject.id, approvalNote);
        toast.success('Đã từ chối công trình');
      }
      setShowApprovalModal(false);
      setShowDetailModal(false);
      setSelectedProject(null);
      loadProjects();
      loadTabCounts();
    } catch (error) {
      console.error('Failed to process approval:', error);
      toast.error(error instanceof Error ? error.message : 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  }, [selectedProject, approvalAction, approvalNote, toast, loadProjects, loadTabCounts]);

  const closeModals = useCallback(() => {
    setShowDetailModal(false);
    setShowApprovalModal(false);
    setSelectedProject(null);
    setProjectDetail(null);
    setApprovalNote('');
  }, []);

  return (
    <div>
      {/* Header - hidden when embedded */}
      {!embedded && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: tokens.color.text, fontSize: isMobile ? 20 : 24, fontWeight: 600, margin: 0 }}>
            Quản lý Công trình
          </h2>
          <p style={{ color: tokens.color.muted, fontSize: 14, margin: '4px 0 0' }}>
            Xét duyệt và quản lý các công trình đăng ký
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 24, 
        flexWrap: 'wrap',
        overflowX: isMobile ? 'auto' : undefined,
        paddingBottom: isMobile ? 4 : 0,
      }}>
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.status;
          const count = tabCounts[tab.status] || 0;
          const color = tab.status === 'ALL' ? tokens.color.primary : STATUS_COLORS[tab.status as ProjectStatus];
          return (
            <motion.button
              key={tab.status}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setStatusFilter(tab.status);
                setPage(1);
              }}
              style={{
                padding: isMobile ? '8px 12px' : '10px 20px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${isActive ? color : tokens.color.border}`,
                background: isActive ? `${color}15` : 'transparent',
                color: isActive ? color : tokens.color.muted,
                cursor: 'pointer',
                fontSize: isMobile ? 12 : 14,
                fontWeight: isActive ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                minHeight: '44px',
              }}
            >
              {isMobile ? tab.label.slice(0, 8) : tab.label}
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: tokens.radius.sm,
                  background: isActive ? color : tokens.color.border,
                  color: isActive ? '#fff' : tokens.color.muted,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Filters */}
      <ResponsiveStack
        direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div style={{ flex: 1, minWidth: isMobile ? '100%' : 200, maxWidth: isMobile ? '100%' : 400 }}>
          <Input
            placeholder="Tìm theo mã hoặc tiêu đề..."
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            fullWidth
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => {
            setRegionFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '10px 16px',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            color: tokens.color.text,
            fontSize: 14,
            minWidth: isMobile ? '100%' : 150,
            minHeight: '44px',
          }}
        >
          <option value="">Tất cả khu vực</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '10px 16px',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            color: tokens.color.text,
            fontSize: 14,
            minWidth: isMobile ? '100%' : 150,
            minHeight: '44px',
          }}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </ResponsiveStack>

      {/* Projects Table */}
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          overflow: 'hidden',
        }}
      >
        <ProjectTable
          projects={projects}
          loading={loading}
          onViewDetail={handleViewDetail}
          onApprove={(project) => handleOpenApprovalModal(project, 'approve')}
          onReject={(project) => handleOpenApprovalModal(project, 'reject')}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <ResponsiveStack
          direction={{ mobile: 'row', tablet: 'row', desktop: 'row' }}
          justify="center"
          align="center"
          gap={8}
          style={{ marginTop: 24 }}
        >
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <i className="ri-arrow-left-line" />
          </Button>
          <span style={{ padding: '8px 16px', color: tokens.color.text, fontSize: isMobile ? 12 : 14 }}>
            {isMobile ? `${page}/${totalPages}` : `Trang ${page} / ${totalPages} (${total} công trình)`}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <i className="ri-arrow-right-line" />
          </Button>
        </ResponsiveStack>
      )}

      {/* Detail Modal */}
      <ProjectDetailModal
        show={showDetailModal}
        project={selectedProject}
        detail={projectDetail}
        loading={loadingDetail}
        onClose={closeModals}
        onApprove={() => selectedProject && handleOpenApprovalModal(selectedProject, 'approve')}
        onReject={() => selectedProject && handleOpenApprovalModal(selectedProject, 'reject')}
      />

      {/* Approval Modal */}
      <ApprovalModal
        show={showApprovalModal}
        project={selectedProject}
        action={approvalAction}
        note={approvalNote}
        saving={saving}
        onNoteChange={setApprovalNote}
        onConfirm={handleApproval}
        onClose={() => setShowApprovalModal(false)}
      />
    </div>
  );
}
