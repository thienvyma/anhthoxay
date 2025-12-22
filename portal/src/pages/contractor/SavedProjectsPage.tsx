/**
 * Saved Projects Page
 *
 * Displays:
 * - List of saved projects with deadline countdown (Requirement 21.3)
 * - Mark expired projects (Requirement 21.5)
 * - Unsave functionality
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 21.3, 21.5**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { savedProjectsApi, type SavedProject } from '../../api';
import { useToast } from '../../components/Toast';

export function SavedProjectsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load saved projects
  const loadSavedProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await savedProjectsApi.getSavedProjects({
        page: currentPage,
        limit: 12,
      });
      setSavedProjects(result.data);
      setTotalPages(result.meta.totalPages);
      setTotalCount(result.meta.total);
    } catch (error) {
      console.error('Failed to load saved projects:', error);
      showToast('Không thể tải danh sách dự án đã lưu', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, showToast]);

  useEffect(() => {
    loadSavedProjects();
  }, [loadSavedProjects]);

  // Unsave project
  const handleUnsave = async (projectId: string) => {
    try {
      await savedProjectsApi.unsaveProject(projectId);
      setSavedProjects((prev) => prev.filter((sp) => sp.projectId !== projectId));
      setTotalCount((prev) => prev - 1);
      showToast('Đã bỏ lưu dự án', 'success');
    } catch (error) {
      console.error('Failed to unsave project:', error);
      showToast('Không thể bỏ lưu dự án', 'error');
    }
  };

  // Navigate to project detail
  const handleViewProject = (projectId: string) => {
    navigate(`/contractor/marketplace/${projectId}`);
  };

  // Navigate to bid creation
  const handleBid = (projectId: string) => {
    navigate(`/contractor/marketplace/${projectId}/bid`);
  };

  // Formatters
  const formatBudget = (min?: number, max?: number): string => {
    if (!min && !max) return 'Thương lượng';
    const format = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
    if (min && max) return `${format(min)} - ${format(max)} VNĐ`;
    if (min) return `Từ ${format(min)} VNĐ`;
    if (max) return `Đến ${format(max)} VNĐ`;
    return 'Thương lượng';
  };

  /**
   * Get deadline countdown text
   * Requirements: 21.3
   */
  const getDeadlineCountdown = (deadline?: string): { text: string; isUrgent: boolean; isExpired: boolean } => {
    if (!deadline) return { text: 'Không có hạn', isUrgent: false, isExpired: false };
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) return { text: 'Đã hết hạn', isUrgent: true, isExpired: true };
    if (diffHours < 24) return { text: `Còn ${diffHours} giờ`, isUrgent: true, isExpired: false };
    if (diffDays === 1) return { text: 'Còn 1 ngày', isUrgent: true, isExpired: false };
    if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, isUrgent: true, isExpired: false };
    return { text: `Còn ${diffDays} ngày`, isUrgent: false, isExpired: false };
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24 }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e4e7ec', marginBottom: 4 }}>
            Dự án đã lưu
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: 14 }}>
            Quản lý các dự án bạn quan tâm và muốn đấu giá
          </p>
        </motion.div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 16, color: '#71717a', fontSize: 14 }}
        >
          {isLoading ? 'Đang tải...' : `${totalCount} dự án đã lưu`}
        </motion.div>

        {/* Saved Projects List */}
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card"
                style={{ padding: 20, height: 280, background: '#1a1a1f' }}
              >
                <div
                  style={{
                    width: '60%',
                    height: 20,
                    background: '#27272a',
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                />
                <div
                  style={{
                    width: '40%',
                    height: 16,
                    background: '#27272a',
                    borderRadius: 4,
                    marginBottom: 20,
                  }}
                />
                <div
                  style={{
                    width: '100%',
                    height: 60,
                    background: '#27272a',
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
          </div>
        ) : savedProjects.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {savedProjects.map((savedProject, index) => {
              const deadline = getDeadlineCountdown(savedProject.project.bidDeadline);
              const isExpired = savedProject.isExpired || deadline.isExpired;

              return (
                <motion.div
                  key={savedProject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="card"
                  style={{
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: isExpired ? 0.6 : 1,
                    position: 'relative',
                  }}
                  onClick={() => !isExpired && handleViewProject(savedProject.projectId)}
                  onMouseEnter={(e) => {
                    if (!isExpired) {
                      e.currentTarget.style.borderColor = '#3f3f46';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#27272a';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Expired Overlay - Requirement 21.5 */}
                  {isExpired && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Đã hết hạn
                    </div>
                  )}

                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        background: isExpired
                          ? 'rgba(113, 113, 122, 0.2)'
                          : 'rgba(59, 130, 246, 0.2)',
                        color: isExpired ? '#71717a' : '#3b82f6',
                      }}
                    >
                      {isExpired ? 'Đã đóng' : 'Đang mở'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Unsave Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnsave(savedProject.projectId);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          color: '#f5d393',
                          transition: 'color 0.2s',
                        }}
                        aria-label="Bỏ lưu"
                      >
                        <i className="ri-bookmark-fill" style={{ fontSize: 18 }} />
                      </button>
                      <span style={{ fontSize: 12, color: '#71717a' }}>
                        {savedProject.project.code}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#e4e7ec',
                      marginBottom: 8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {savedProject.project.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: 13,
                      color: '#a1a1aa',
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
                    {savedProject.project.description}
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
                      <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>
                        Khu vực
                      </div>
                      <div style={{ fontSize: 13, color: '#e4e7ec' }}>
                        {savedProject.project.region?.name || 'Chưa xác định'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>
                        Hạng mục
                      </div>
                      <div style={{ fontSize: 13, color: '#e4e7ec' }}>
                        {savedProject.project.category?.name || 'Chưa xác định'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>
                        Ngân sách
                      </div>
                      <div style={{ fontSize: 13, color: '#f5d393' }}>
                        {formatBudget(savedProject.project.budgetMin, savedProject.project.budgetMax)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>
                        Đã lưu
                      </div>
                      <div style={{ fontSize: 13, color: '#e4e7ec' }}>
                        {formatDate(savedProject.savedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Footer - Deadline Countdown (Requirement 21.3) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 12,
                      borderTop: '1px solid #27272a',
                      marginTop: 'auto',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: '#71717a' }}>
                        <i className="ri-file-list-3-line" style={{ marginRight: 4 }} />
                        {savedProject.project.bidCount || 0} đề xuất
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: deadline.isExpired
                            ? '#71717a'
                            : deadline.isUrgent
                            ? '#ef4444'
                            : '#f59e0b',
                        }}
                      >
                        <i className="ri-time-line" style={{ marginRight: 4 }} />
                        {deadline.text}
                      </span>
                    </div>
                  </div>

                  {/* Bid Button */}
                  {!isExpired && (
                    <div style={{ marginTop: 16 }}>
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px 16px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBid(savedProject.projectId);
                        }}
                      >
                        <i className="ri-auction-line" style={{ marginRight: 8 }} />
                        Gửi đề xuất
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
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
              className="ri-bookmark-line"
              style={{ fontSize: 48, color: '#71717a', marginBottom: 16, display: 'block' }}
            />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 8 }}>
              Chưa có dự án nào được lưu
            </h3>
            <p style={{ color: '#a1a1aa', marginBottom: 24 }}>
              Lưu các dự án bạn quan tâm từ Marketplace để theo dõi và đấu giá sau
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/contractor/marketplace')}
            >
              <i className="ri-search-line" style={{ marginRight: 8 }} />
              Khám phá Marketplace
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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    background: currentPage === pageNum ? '#f5d393' : 'transparent',
                    color: currentPage === pageNum ? '#0b0c0f' : '#a1a1aa',
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '8px 12px', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}

export default SavedProjectsPage;
