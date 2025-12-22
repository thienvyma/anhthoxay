/**
 * Homeowner Projects List Page
 *
 * Displays:
 * - Status tabs (draft, active, completed) (Requirement 5.1)
 * - Filter by status and date (Requirement 5.2)
 * - Project cards with key info (Requirement 5.3)
 * - Edit/Delete actions for DRAFT projects
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 5.1, 5.2, 5.3**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { projectsApi, type Project, type ProjectStatus, type ProjectQuery } from '../../api';
import { useToast } from '../../components/Toast';

type TabStatus = 'all' | 'draft' | 'active' | 'completed';

interface Tab {
  id: TabStatus;
  label: string;
  statuses: ProjectStatus[];
  icon: string;
}

const TABS: Tab[] = [
  { id: 'all', label: 'Tất cả', statuses: [], icon: 'ri-list-check' },
  { id: 'draft', label: 'Nháp', statuses: ['DRAFT', 'PENDING_APPROVAL', 'REJECTED'], icon: 'ri-draft-line' },
  { id: 'active', label: 'Đang hoạt động', statuses: ['OPEN', 'BIDDING_CLOSED', 'PENDING_MATCH', 'MATCHED', 'IN_PROGRESS'], icon: 'ri-auction-line' },
  { id: 'completed', label: 'Hoàn thành', statuses: ['COMPLETED', 'CANCELLED'], icon: 'ri-check-double-line' },
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  REJECTED: 'Bị từ chối',
  OPEN: 'Đang đấu giá',
  BIDDING_CLOSED: 'Hết hạn đấu giá',
  PENDING_MATCH: 'Chờ duyệt kết nối',
  MATCHED: 'Đã chọn nhà thầu',
  IN_PROGRESS: 'Đang thi công',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  DRAFT: '#71717a',
  PENDING_APPROVAL: '#f59e0b',
  REJECTED: '#ef4444',
  OPEN: '#3b82f6',
  BIDDING_CLOSED: '#8b5cf6',
  PENDING_MATCH: '#a855f7',
  MATCHED: '#22c55e',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#22c55e',
  CANCELLED: '#71717a',
};

export function ProjectsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  // Get initial values from URL params
  const initialTab = (searchParams.get('tab') as TabStatus) || 'all';
  const initialStatus = searchParams.get('status') as ProjectStatus | null;
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSearch = searchParams.get('search') || '';
  
  const [activeTab, setActiveTab] = useState<TabStatus>(initialTab);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const tab = TABS.find(t => t.id === activeTab);
      const query: ProjectQuery = {
        page: currentPage,
        limit: 12,
        sortBy,
        sortOrder,
      };

      // If specific status from URL, use it
      if (initialStatus && activeTab === 'all') {
        query.status = initialStatus;
      } else if (tab && tab.statuses.length === 1) {
        query.status = tab.statuses[0];
      }

      if (searchQuery) {
        query.search = searchQuery;
      }

      const result = await projectsApi.getProjects(query);
      
      // If tab has multiple statuses, filter client-side (API might not support multiple statuses)
      let filteredData = result.data;
      if (tab && tab.statuses.length > 1) {
        filteredData = result.data.filter(p => tab.statuses.includes(p.status));
      }
      
      setProjects(filteredData);
      setTotalPages(result.meta.totalPages);
      setTotalCount(result.meta.total);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage, searchQuery, sortBy, sortOrder, initialStatus]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('tab', activeTab);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (searchQuery) params.set('search', searchQuery);
    setSearchParams(params, { replace: true });
  }, [activeTab, currentPage, searchQuery, setSearchParams]);

  const handleTabChange = (tabId: TabStatus) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProjects();
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    
    setDeletingId(projectToDelete.id);
    try {
      await projectsApi.deleteProject(projectToDelete.id);
      toast.showSuccess('Đã xóa dự án thành công');
      setShowDeleteModal(false);
      setProjectToDelete(null);
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.showError('Không thể xóa dự án. Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/homeowner/projects/${projectId}/edit`);
  };

  // Cho phép sửa: DRAFT, REJECTED, OPEN, BIDDING_CLOSED (chưa match)
  const canEdit = (status: ProjectStatus) =>
    ['DRAFT', 'REJECTED', 'OPEN', 'BIDDING_CLOSED'].includes(status);
  
  // Cho phép xóa: DRAFT, REJECTED (chưa submit hoặc bị từ chối)
  const canDelete = (status: ProjectStatus) => ['DRAFT', 'REJECTED'].includes(status);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatBudget = (min?: number, max?: number): string => {
    if (!min && !max) return 'Chưa xác định';
    const format = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
    if (min && max) return `${format(min)} - ${format(max)} VNĐ`;
    if (min) return `Từ ${format(min)} VNĐ`;
    if (max) return `Đến ${format(max)} VNĐ`;
    return 'Chưa xác định';
  };

  const getDaysRemaining = (deadline?: string): string | null => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);
    
    if (diffDays < 0) return 'Đã hết hạn';
    if (diffDays === 0) return 'Hết hạn hôm nay';
    if (diffDays === 1) return 'Còn 1 ngày';
    return `Còn ${diffDays} ngày`;
  };

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Dự án của tôi
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Quản lý và theo dõi tất cả dự án
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/homeowner/projects/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <i className="ri-add-line" style={{ fontSize: 18 }} />
            Tạo dự án mới
          </button>
        </motion.div>

        {/* Tabs - Requirement 5.1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === tab.id ? 'rgba(245, 211, 147, 0.15)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              <i className={tab.icon} style={{ fontSize: 16 }} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Search and Filters - Requirement 5.2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 200 }}>
            <div style={{ position: 'relative' }}>
              <i
                className="ri-search-line"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: 18,
                }}
              />
              <input
                type="text"
                placeholder="Tìm kiếm dự án..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </form>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder as 'asc' | 'desc');
            }}
            className="input"
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="createdAt-desc">Mới nhất</option>
            <option value="createdAt-asc">Cũ nhất</option>
            <option value="title-asc">Tên A-Z</option>
            <option value="title-desc">Tên Z-A</option>
          </select>
        </motion.div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 14 }}
        >
          {isLoading ? 'Đang tải...' : `${totalCount} dự án`}
        </motion.div>

        {/* Project Cards - Requirement 5.3 */}
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="card"
                style={{ padding: 20, height: 200, background: 'var(--bg-tertiary)' }}
              >
                <div
                  style={{
                    width: '60%',
                    height: 20,
                    background: 'var(--border)',
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                />
                <div
                  style={{
                    width: '40%',
                    height: 16,
                    background: 'var(--border)',
                    borderRadius: 4,
                    marginBottom: 20,
                  }}
                />
                <div
                  style={{
                    width: '100%',
                    height: 40,
                    background: 'var(--border)',
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Link
                  to={`/homeowner/projects/${project.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="card"
                    style={{
                      padding: 20,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      height: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span
                        className="badge"
                        style={{
                          background: `${STATUS_COLORS[project.status]}20`,
                          color: STATUS_COLORS[project.status],
                        }}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {project.code}
                        </span>
                        {/* Action buttons for DRAFT/REJECTED */}
                        {(canEdit(project.status) || canDelete(project.status)) && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {canEdit(project.status) && (
                              <button
                                onClick={(e) => handleEditClick(e, project.id)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  border: 'none',
                                  background: 'var(--bg-tertiary)',
                                  color: 'var(--primary)',
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                title="Sửa dự án"
                              >
                                <i className="ri-edit-line" />
                              </button>
                            )}
                            {canDelete(project.status) && (
                              <button
                                onClick={(e) => handleDeleteClick(e, project)}
                                disabled={deletingId === project.id}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  border: 'none',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: 'var(--error)',
                                  cursor: deletingId === project.id ? 'not-allowed' : 'pointer',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  opacity: deletingId === project.id ? 0.5 : 1,
                                }}
                                title="Xóa dự án"
                              >
                                <i className={deletingId === project.id ? 'ri-loader-4-line' : 'ri-delete-bin-line'} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 8,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {project.title}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        marginBottom: 16,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.5,
                        minHeight: 39,
                      }}
                    >
                      {project.description}
                    </p>

                    {/* Info Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                          Khu vực
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                          {project.region?.name || 'Chưa xác định'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                          Ngân sách
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                          {formatBudget(project.budgetMin, project.budgetMax)}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 12,
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {project.status === 'OPEN' && (
                          <>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              <i className="ri-file-list-3-line" style={{ marginRight: 4 }} />
                              {project.bidCount || 0} đề xuất
                            </span>
                            {project.bidDeadline && (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: getDaysRemaining(project.bidDeadline)?.includes('hết') ? 'var(--error)' : 'var(--warning)',
                                }}
                              >
                                <i className="ri-time-line" style={{ marginRight: 4 }} />
                                {getDaysRemaining(project.bidDeadline)}
                              </span>
                            )}
                          </>
                        )}
                        {project.status === 'DRAFT' && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Tạo {formatDate(project.createdAt)}
                          </span>
                        )}
                        {(project.status === 'COMPLETED' || project.status === 'CANCELLED') && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {formatDate(project.createdAt)}
                          </span>
                        )}
                      </div>
                      <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card"
            style={{
              padding: 60,
              textAlign: 'center',
            }}
          >
            <i
              className="ri-folder-open-line"
              style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16, display: 'block' }}
            />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Chưa có dự án nào
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              {activeTab === 'draft'
                ? 'Bạn chưa có dự án nháp nào'
                : activeTab === 'active'
                ? 'Bạn chưa có dự án đang hoạt động'
                : activeTab === 'completed'
                ? 'Bạn chưa có dự án hoàn thành'
                : 'Tạo dự án đầu tiên để bắt đầu'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/homeowner/projects/new')}
            >
              <i className="ri-add-line" style={{ marginRight: 8 }} />
              Tạo dự án mới
            </button>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              marginTop: 32,
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '8px 12px', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              <i className="ri-arrow-left-s-line" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: 'none',
                    background: currentPage === pageNum ? 'var(--primary)' : 'transparent',
                    color: currentPage === pageNum ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '8px 12px', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && projectToDelete && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="card"
              style={{
                padding: 24,
                maxWidth: 400,
                width: '90%',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <i className="ri-delete-bin-line" style={{ fontSize: 24, color: 'var(--error)' }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Xóa dự án?
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  Bạn có chắc muốn xóa dự án <strong>"{projectToDelete.title}"</strong>? 
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  style={{ flex: 1 }}
                  disabled={deletingId !== null}
                >
                  Hủy
                </button>
                <button
                  className="btn"
                  onClick={handleConfirmDelete}
                  disabled={deletingId !== null}
                  style={{
                    flex: 1,
                    background: 'var(--error)',
                    color: '#fff',
                    opacity: deletingId !== null ? 0.7 : 1,
                  }}
                >
                  {deletingId !== null ? (
                    <>
                      <i className="ri-loader-4-line" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                      Đang xóa...
                    </>
                  ) : (
                    'Xóa dự án'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
}
