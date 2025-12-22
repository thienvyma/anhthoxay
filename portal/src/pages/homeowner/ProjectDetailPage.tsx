/**
 * Homeowner Project Detail Page
 *
 * Displays:
 * - Project info and images (Requirement 6.1)
 * - Bid list with anonymized contractor info (Requirement 6.2)
 * - Select bid functionality (Requirement 6.4)
 * - Contact info after match (Requirement 6.5)
 * - Bid comparison functionality (Requirements 20.1-20.4)
 * - Print support (Requirement 27.1)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.4, 27.1**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { LazyImage } from '../../components/LazyImage';
import { BidComparison, MAX_COMPARISON_BIDS, validateBidComparisonSelection } from '../../components/BidComparison';
import { PrintButton, PrintHeader, PrintFooter } from '../../components/PrintSupport';
import {
  projectsApi,
  type Project,
  type Bid,
  type ProjectStatus,
  type MatchDetails,
} from '../../api';

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

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBidsLoading, setIsBidsLoading] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Bid comparison state - Requirements 20.1, 20.2
  const [comparisonBidIds, setComparisonBidIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const loadProject = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const projectData = await projectsApi.getProject(id);
      setProject(projectData);

      // Load bids if project is in bidding phase
      if (['OPEN', 'BIDDING_CLOSED'].includes(projectData.status)) {
        setIsBidsLoading(true);
        try {
          const bidsResult = await projectsApi.getProjectBids(id, { limit: 50 });
          setBids(bidsResult.data);
        } catch (err) {
          console.error('Failed to load bids:', err);
        } finally {
          setIsBidsLoading(false);
        }
      }

      // Load match details if project is matched
      if (['MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(projectData.status)) {
        try {
          const match = await projectsApi.getMatchDetails(id);
          setMatchDetails(match);
        } catch (err) {
          console.error('Failed to load match details:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Không thể tải thông tin dự án');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleSelectBid = async () => {
    if (!id || !selectedBidId) return;
    setIsSubmitting(true);
    try {
      const match = await projectsApi.selectBid(id, selectedBidId);
      setMatchDetails(match);
      setShowConfirmModal(false);
      setShowComparison(false);
      setComparisonBidIds([]);
      await loadProject();
    } catch (err) {
      console.error('Failed to select bid:', err);
      setError('Không thể chọn đề xuất. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle bid comparison toggle
   * Requirements: 20.1 - Allow selecting up to 3 bids for comparison
   */
  const handleComparisonToggle = (bidId: string) => {
    setComparisonBidIds((prev) => {
      if (prev.includes(bidId)) {
        // Remove from comparison
        return prev.filter((id) => id !== bidId);
      }
      
      // Validate before adding
      const validation = validateBidComparisonSelection(prev, bidId);
      if (!validation.canAdd) {
        // Could show a toast here, but for now just don't add
        return prev;
      }
      
      return [...prev, bidId];
    });
  };

  /**
   * Handle bid selection from comparison view
   * Requirements: 20.4
   */
  const handleSelectBidFromComparison = (bidId: string) => {
    setSelectedBidId(bidId);
    setShowConfirmModal(true);
  };

  /**
   * Get bids selected for comparison
   */
  const getComparisonBids = (): Bid[] => {
    return bids.filter((bid) => comparisonBidIds.includes(bid.id));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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

  if (isLoading) {
    return (
      <Layout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <i className="ri-loader-4-line spinner" style={{ fontSize: 32, color: '#f5d393' }} />
          <p style={{ color: '#a1a1aa', marginTop: 12 }}>Đang tải...</p>
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <i className="ri-error-warning-line" style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }} />
          <h2 style={{ color: '#e4e7ec', marginBottom: 8 }}>{error || 'Không tìm thấy dự án'}</h2>
          <button className="btn btn-secondary" onClick={() => navigate('/homeowner/projects')}>
            Quay lại danh sách
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}
        >
          <Link to="/homeowner/projects" style={{ color: '#a1a1aa', textDecoration: 'none' }}>
            Dự án
          </Link>
          <i className="ri-arrow-right-s-line" style={{ color: '#71717a' }} />
          <span style={{ color: '#e4e7ec' }}>{project.title}</span>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24 }}
          className="no-print"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span
                  className="badge"
                  style={{
                    background: `${STATUS_COLORS[project.status]}20`,
                    color: STATUS_COLORS[project.status],
                  }}
                >
                  {STATUS_LABELS[project.status]}
                </span>
                <span style={{ fontSize: 13, color: '#71717a' }}>{project.code}</span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e4e7ec' }}>{project.title}</h1>
            </div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Print Button - Requirement 27.1 */}
              <PrintButton
                label="In"
                documentTitle={`Dự án ${project.code} - ${project.title}`}
              />
              
              {project.status === 'DRAFT' && (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/homeowner/projects/${id}/edit`)}
                  >
                    <i className="ri-edit-line" style={{ marginRight: 8 }} />
                    Chỉnh sửa
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/homeowner/projects/${id}/submit`)}
                  >
                    Gửi duyệt
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Print Header - only visible when printing */}
        <PrintHeader
          title={project.title}
          subtitle="Chi tiết dự án"
          code={project.code}
          showDate={true}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }} className="print-container">
          {/* Main Content */}
          <div>
            {/* Images - Requirement 6.1 */}
            {project.images && project.images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
                style={{ padding: 20, marginBottom: 24 }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: 12,
                    background: '#1a1a1f',
                  }}
                >
                  <LazyImage
                    src={project.images[activeImageIndex]}
                    alt={`${project.title} - Ảnh ${activeImageIndex + 1}`}
                    aspectRatio="16/9"
                    objectFit="cover"
                    borderRadius={8}
                    showSkeleton={true}
                    wrapperStyle={{ width: '100%', height: '100%' }}
                  />
                </div>
                {project.images.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                    {project.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 6,
                          overflow: 'hidden',
                          border: idx === activeImageIndex ? '2px solid #f5d393' : '2px solid transparent',
                          padding: 0,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <LazyImage
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          aspectRatio="1/1"
                          objectFit="cover"
                          borderRadius={4}
                          showSkeleton={true}
                          rootMargin="50px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card"
              style={{ padding: 20, marginBottom: 24 }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec', marginBottom: 12 }}>
                Mô tả dự án
              </h3>
              <p style={{ color: '#a1a1aa', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {project.description}
              </p>
              {project.requirements && (
                <>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#e4e7ec', marginTop: 20, marginBottom: 8 }}>
                    Yêu cầu đặc biệt
                  </h4>
                  <p style={{ color: '#a1a1aa', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {project.requirements}
                  </p>
                </>
              )}
            </motion.div>

            {/* Bids Section - Requirement 6.2, 6.3, 20.1, 20.2 */}
            {['OPEN', 'BIDDING_CLOSED'].includes(project.status) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
                style={{ padding: 20 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec' }}>
                    Đề xuất từ nhà thầu
                    <span style={{ marginLeft: 8, color: '#71717a', fontWeight: 400 }}>
                      ({bids.length})
                    </span>
                  </h3>
                  
                  {/* Compare Selected Button - Requirement 20.1 */}
                  {project.status === 'BIDDING_CLOSED' && bids.length >= 2 && (
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        opacity: comparisonBidIds.length >= 2 ? 1 : 0.5,
                      }}
                      onClick={() => setShowComparison(true)}
                      disabled={comparisonBidIds.length < 2}
                    >
                      <i className="ri-scales-3-line" style={{ marginRight: 8 }} />
                      So sánh ({comparisonBidIds.length}/{MAX_COMPARISON_BIDS})
                    </button>
                  )}
                </div>

                {isBidsLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <i className="ri-loader-4-line spinner" style={{ fontSize: 24, color: '#f5d393' }} />
                  </div>
                ) : bids.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {bids.map((bid, index) => {
                      const displayName = bid.anonymousName || `Nhà thầu ${String.fromCharCode(65 + index)}`;
                      
                      return (
                      <div
                        key={bid.id}
                        style={{
                          padding: 16,
                          background: selectedBidId === bid.id ? 'rgba(245, 211, 147, 0.1)' : comparisonBidIds.includes(bid.id) ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                          border: selectedBidId === bid.id ? '1px solid rgba(245, 211, 147, 0.3)' : comparisonBidIds.includes(bid.id) ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #27272a',
                          borderRadius: 12,
                          cursor: project.status === 'BIDDING_CLOSED' && bid.status === 'PENDING' ? 'pointer' : 'default',
                        }}
                        onClick={() => {
                          if (project.status === 'BIDDING_CLOSED' && bid.status === 'PENDING') {
                            setSelectedBidId(bid.id);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Comparison Checkbox - Only for PENDING bids in BIDDING_CLOSED status */}
                            {project.status === 'BIDDING_CLOSED' && bid.status === 'PENDING' && (
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={comparisonBidIds.includes(bid.id)}
                                  onChange={() => handleComparisonToggle(bid.id)}
                                  disabled={!comparisonBidIds.includes(bid.id) && comparisonBidIds.length >= MAX_COMPARISON_BIDS}
                                  style={{
                                    width: 18,
                                    height: 18,
                                    cursor: 'pointer',
                                    accentColor: '#3b82f6',
                                  }}
                                  title={comparisonBidIds.includes(bid.id) ? 'Bỏ chọn so sánh' : comparisonBidIds.length >= MAX_COMPARISON_BIDS ? `Chỉ có thể so sánh tối đa ${MAX_COMPARISON_BIDS} đề xuất` : 'Chọn để so sánh'}
                                />
                              </label>
                            )}
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: '#f5d393',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#0b0c0f',
                                fontWeight: 600,
                              }}
                            >
                              {String.fromCharCode(65 + index)}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 600, color: '#e4e7ec' }}>
                                  {displayName}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: '#71717a', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {bid.contractorRating ? (
                                  <span>⭐ {bid.contractorRating.toFixed(1)}</span>
                                ) : (
                                  <span>Chưa có đánh giá</span>
                                )}
                                {(bid.contractorCompletedProjects !== undefined && bid.contractorCompletedProjects > 0) && (
                                  <span style={{ color: '#22c55e' }}>
                                    • ✓ {bid.contractorCompletedProjects} công trình hoàn thành
                                  </span>
                                )}
                                {bid.contractorTotalProjects !== undefined && bid.contractorTotalProjects > 0 && (
                                  <span>• {bid.contractorTotalProjects} dự án</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>
                              {formatCurrency(bid.price)}
                            </div>
                            <div style={{ fontSize: 12, color: '#71717a' }}>
                              {bid.timeline}
                            </div>
                          </div>
                        </div>
                        
                        <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.5, marginBottom: 12 }}>
                          {bid.proposal.length > 200 ? bid.proposal.substring(0, 200) + '...' : bid.proposal}
                        </p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#71717a' }}>
                            Gửi {formatDate(bid.createdAt)}
                          </span>
                          {project.status === 'BIDDING_CLOSED' && bid.status === 'PENDING' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '8px 16px', fontSize: 13 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBidId(bid.id);
                                setShowConfirmModal(true);
                              }}
                            >
                              Chọn nhà thầu này
                            </button>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#71717a' }}>
                    <i className="ri-file-list-3-line" style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
                    <p>Chưa có đề xuất nào</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Match Details - Requirement 6.5 */}
            {matchDetails && ['MATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(project.status) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
                style={{ padding: 20 }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec', marginBottom: 20 }}>
                  Thông tin nhà thầu
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: '#f5d393',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0b0c0f',
                      fontWeight: 600,
                      fontSize: 20,
                    }}
                  >
                    {matchDetails.contractor?.name?.charAt(0) || 'N'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#e4e7ec', fontSize: 16 }}>
                      {matchDetails.contractor?.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#71717a' }}>
                      {matchDetails.contractor?.rating ? `⭐ ${matchDetails.contractor.rating.toFixed(1)}` : 'Chưa có đánh giá'}
                      {matchDetails.contractor?.totalProjects && ` • ${matchDetails.contractor.totalProjects} dự án`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Email</div>
                    <a href={`mailto:${matchDetails.contractor?.email}`} style={{ color: '#f5d393', textDecoration: 'none' }}>
                      {matchDetails.contractor?.email}
                    </a>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Điện thoại</div>
                    <a href={`tel:${matchDetails.contractor?.phone}`} style={{ color: '#f5d393', textDecoration: 'none' }}>
                      {matchDetails.contractor?.phone}
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }}>
                    <i className="ri-chat-1-line" style={{ marginRight: 8 }} />
                    Nhắn tin
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 1 }}>
                    <i className="ri-phone-line" style={{ marginRight: 8 }} />
                    Gọi điện
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Project Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
              style={{ padding: 20, marginBottom: 20 }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec', marginBottom: 16 }}>
                Thông tin dự án
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Danh mục</div>
                  <div style={{ color: '#e4e7ec' }}>{project.category?.name || 'Chưa xác định'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Khu vực</div>
                  <div style={{ color: '#e4e7ec' }}>{project.region?.name || 'Chưa xác định'}</div>
                </div>
                {project.area && (
                  <div>
                    <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Diện tích</div>
                    <div style={{ color: '#e4e7ec' }}>{project.area} m²</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Ngân sách</div>
                  <div style={{ color: '#e4e7ec' }}>
                    {project.budgetMin && project.budgetMax
                      ? `${formatCurrency(project.budgetMin)} - ${formatCurrency(project.budgetMax)}`
                      : project.budgetMin
                      ? `Từ ${formatCurrency(project.budgetMin)}`
                      : project.budgetMax
                      ? `Đến ${formatCurrency(project.budgetMax)}`
                      : 'Chưa xác định'}
                  </div>
                </div>
                {project.timeline && (
                  <div>
                    <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Timeline</div>
                    <div style={{ color: '#e4e7ec' }}>{project.timeline}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Ngày tạo</div>
                  <div style={{ color: '#e4e7ec' }}>{formatDate(project.createdAt)}</div>
                </div>
              </div>
            </motion.div>

            {/* Bidding Status Card */}
            {project.status === 'OPEN' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card"
                style={{ padding: 20, marginBottom: 20 }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec', marginBottom: 16 }}>
                  Trạng thái đấu giá
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#71717a' }}>Số đề xuất</span>
                    <span style={{ color: '#e4e7ec', fontWeight: 600 }}>
                      {project.bidCount || 0} / {project.maxBids || 20}
                    </span>
                  </div>
                  {project.bidDeadline && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#71717a' }}>Hạn nhận đề xuất</span>
                      <span
                        style={{
                          color: getDaysRemaining(project.bidDeadline)?.includes('hết') ? '#ef4444' : '#f59e0b',
                          fontWeight: 600,
                        }}
                      >
                        {getDaysRemaining(project.bidDeadline)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Escrow Info Card */}
            {matchDetails?.escrow && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
                style={{ padding: 20, marginBottom: 20 }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec', marginBottom: 16 }}>
                  Thông tin đặt cọc
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#71717a' }}>Số tiền</span>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>
                      {formatCurrency(matchDetails.escrow.amount)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#71717a' }}>Trạng thái</span>
                    <span
                      className="badge"
                      style={{
                        background: matchDetails.escrow.status === 'HELD' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: matchDetails.escrow.status === 'HELD' ? '#22c55e' : '#f59e0b',
                      }}
                    >
                      {matchDetails.escrow.status === 'HELD' ? 'Đã giữ' : matchDetails.escrow.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rejected Note */}
            {project.status === 'REJECTED' && project.reviewNote && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card"
                style={{
                  padding: 20,
                  marginBottom: 20,
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ef4444', marginBottom: 12 }}>
                  <i className="ri-error-warning-line" style={{ marginRight: 8 }} />
                  Lý do từ chối
                </h3>
                <p style={{ color: '#a1a1aa', lineHeight: 1.5 }}>{project.reviewNote}</p>
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: 16, width: '100%' }}
                  onClick={() => navigate(`/homeowner/projects/${id}/edit`)}
                >
                  Chỉnh sửa và gửi lại
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Confirm Modal - Requirement 6.4 */}
        {showConfirmModal && selectedBidId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card"
              style={{ padding: 24, maxWidth: 480, width: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e4e7ec', marginBottom: 16 }}>
                Xác nhận chọn nhà thầu
              </h2>
              
              <p style={{ color: '#a1a1aa', marginBottom: 20, lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn chọn nhà thầu này? Sau khi xác nhận:
              </p>
              
              <ul style={{ color: '#a1a1aa', marginBottom: 24, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Bạn sẽ cần đặt cọc để bắt đầu dự án</li>
                <li>Thông tin liên hệ của nhà thầu sẽ được hiển thị</li>
                <li>Các đề xuất khác sẽ bị từ chối</li>
              </ul>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleSelectBid}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line spinner" style={{ marginRight: 8 }} />
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác nhận'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bid Comparison Modal - Requirements 20.1, 20.2, 20.3, 20.4 */}
        {showComparison && comparisonBidIds.length >= 2 && (
          <BidComparison
            bids={getComparisonBids()}
            onSelectBid={handleSelectBidFromComparison}
            onClose={() => setShowComparison(false)}
            isSelecting={isSubmitting}
            selectingBidId={selectedBidId}
          />
        )}

        {/* Print Footer - only visible when printing */}
        <PrintFooter
          text="Tài liệu này chỉ có giá trị tham khảo. Vui lòng liên hệ để xác nhận thông tin."
        />
      </div>
    </Layout>
  );
}
