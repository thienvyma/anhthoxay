/**
 * Contractor Marketplace Page
 *
 * Displays:
 * - Project list with OPEN status (Requirement 9.1)
 * - Filters (region, category, budget) (Requirement 9.2)
 * - Project cards without owner info (Requirement 9.3)
 * - Verification prompt for unverified (Requirement 9.4)
 * - Navigate to bid creation (Requirement 9.5)
 * - Bookmark button to save projects (Requirement 21.1)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 21.1**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Layout } from '../../components/Layout';
import { useSavedProjects } from '../../hooks/useSavedProjects';
import {
  marketplaceApi,
  type Project,
  type Region,
  type ServiceCategory,
  type MarketplaceQuery,
} from '../../api';

// Budget range options for filtering
const BUDGET_RANGES = [
  { label: 'Tất cả ngân sách', min: undefined, max: undefined },
  { label: 'Dưới 50 triệu', min: undefined, max: 50000000 },
  { label: '50 - 100 triệu', min: 50000000, max: 100000000 },
  { label: '100 - 200 triệu', min: 100000000, max: 200000000 },
  { label: '200 - 500 triệu', min: 200000000, max: 500000000 },
  { label: 'Trên 500 triệu', min: 500000000, max: undefined },
];

export function ContractorMarketplacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSaved, toggleSave } = useSavedProjects();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state from URL params
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialRegion = searchParams.get('region') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialBudget = searchParams.get('budget') || '0';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'createdAt-desc';

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBudgetIndex, setSelectedBudgetIndex] = useState(parseInt(initialBudget, 10));
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState(initialSort.split('-')[0] || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (initialSort.split('-')[1] as 'asc' | 'desc') || 'desc'
  );

  // Check verification status
  const isVerified = user?.verificationStatus === 'VERIFIED';

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [regionsData, categoriesData] = await Promise.all([
          marketplaceApi.getRegions(),
          marketplaceApi.getCategories(),
        ]);
        setRegions(regionsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // Load projects
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: MarketplaceQuery = {
        page: currentPage,
        limit: 12,
        sortBy,
        sortOrder,
      };

      if (selectedRegion) {
        query.regionId = selectedRegion;
      }
      if (selectedCategory) {
        query.categoryId = selectedCategory;
      }
      if (searchQuery) {
        query.search = searchQuery;
      }

      const result = await marketplaceApi.getProjects(query);

      // Client-side budget filtering (if API doesn't support it)
      let filteredData = result.data;
      const budgetRange = BUDGET_RANGES[selectedBudgetIndex];
      if (budgetRange.min !== undefined || budgetRange.max !== undefined) {
        filteredData = result.data.filter((project) => {
          const projectBudget = project.budgetMax || project.budgetMin || 0;
          if (budgetRange.min !== undefined && projectBudget < budgetRange.min) return false;
          if (budgetRange.max !== undefined && projectBudget > budgetRange.max) return false;
          return true;
        });
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
  }, [currentPage, selectedRegion, selectedCategory, selectedBudgetIndex, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (selectedRegion) params.set('region', selectedRegion);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedBudgetIndex > 0) params.set('budget', selectedBudgetIndex.toString());
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'createdAt' || sortOrder !== 'desc') {
      params.set('sort', `${sortBy}-${sortOrder}`);
    }
    setSearchParams(params, { replace: true });
  }, [currentPage, selectedRegion, selectedCategory, selectedBudgetIndex, searchQuery, sortBy, sortOrder, setSearchParams]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleBidClick = (projectId: string) => {
    if (!isVerified) {
      // Show verification prompt - handled in UI
      return;
    }
    navigate(`/contractor/marketplace/${projectId}/bid`);
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/contractor/marketplace/${projectId}`);
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

  const getDaysRemaining = (deadline?: string): { text: string; isUrgent: boolean } | null => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 0) return { text: 'Đã hết hạn', isUrgent: true };
    if (diffDays === 0) return { text: 'Hết hạn hôm nay', isUrgent: true };
    if (diffDays === 1) return { text: 'Còn 1 ngày', isUrgent: true };
    if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, isUrgent: true };
    return { text: `Còn ${diffDays} ngày`, isUrgent: false };
  };

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        {/* Verification Banner - Requirement 9.4 */}
        {!isVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <i
              className="ri-shield-check-line"
              style={{ fontSize: 24, color: 'var(--warning)' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                Xác minh tài khoản để đấu giá
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Bạn cần hoàn thiện hồ sơ và được xác minh để có thể gửi đề xuất cho các dự án.
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
              onClick={() => navigate('/contractor/profile')}
            >
              Xác minh ngay
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24 }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Marketplace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Tìm kiếm và đấu giá các dự án phù hợp với chuyên môn của bạn
          </p>
        </motion.div>

        {/* Filters - Requirement 9.2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
          style={{ padding: 20, marginBottom: 24 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {/* Search */}
            <form onSubmit={handleSearch} style={{ gridColumn: 'span 2' }}>
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

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                handleFilterChange();
              }}
              className="input"
            >
              <option value="">Tất cả khu vực</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                handleFilterChange();
              }}
              className="input"
            >
              <option value="">Tất cả hạng mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Budget Filter */}
            <select
              value={selectedBudgetIndex}
              onChange={(e) => {
                setSelectedBudgetIndex(parseInt(e.target.value, 10));
                handleFilterChange();
              }}
              className="input"
            >
              {BUDGET_RANGES.map((range, index) => (
                <option key={index} value={index}>
                  {range.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder as 'asc' | 'desc');
                handleFilterChange();
              }}
              className="input"
            >
              <option value="createdAt-desc">Mới nhất</option>
              <option value="createdAt-asc">Cũ nhất</option>
              <option value="bidDeadline-asc">Sắp hết hạn</option>
              <option value="budgetMax-desc">Ngân sách cao nhất</option>
              <option value="budgetMin-asc">Ngân sách thấp nhất</option>
            </select>
          </div>
        </motion.div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 14 }}
        >
          {isLoading ? 'Đang tải...' : `${totalCount} dự án đang mở`}
        </motion.div>

        {/* Project Cards - Requirements 9.1, 9.3 */}
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
                style={{ padding: 20, height: 280, background: 'var(--bg-tertiary)' }}
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
                    height: 60,
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
            {projects.map((project, index) => {
              const deadline = getDaysRemaining(project.bidDeadline);
              
              return (
                <motion.div
                  key={project.id}
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
                  }}
                  onClick={() => handleViewProject(project.id)}
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
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: 'var(--info)',
                      }}
                    >
                      Đang mở
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Bookmark Button - Requirement 21.1 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSave(project.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          color: isSaved(project.id) ? 'var(--primary)' : 'var(--text-muted)',
                          transition: 'color 0.2s',
                        }}
                        aria-label={isSaved(project.id) ? 'Bỏ lưu' : 'Lưu dự án'}
                      >
                        <i
                          className={isSaved(project.id) ? 'ri-bookmark-fill' : 'ri-bookmark-line'}
                          style={{ fontSize: 18 }}
                        />
                      </button>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{project.code}</span>
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

                  {/* Info Grid - No owner info (Requirement 9.3) */}
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
                        Hạng mục
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        {project.category?.name || 'Chưa xác định'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                        Ngân sách
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--primary)' }}>
                        {formatBudget(project.budgetMin, project.budgetMax)}
                      </div>
                    </div>
                    {project.area && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                          Diện tích
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                          {project.area} m²
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                      marginTop: 'auto',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        <i className="ri-file-list-3-line" style={{ marginRight: 4 }} />
                        {project.bidCount || 0}/{project.maxBids || 20} đề xuất
                      </span>
                      {deadline && (
                        <span
                          style={{
                            fontSize: 12,
                            color: deadline.isUrgent ? 'var(--error)' : 'var(--warning)',
                          }}
                        >
                          <i className="ri-time-line" style={{ marginRight: 4 }} />
                          {deadline.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bid Button - Requirement 9.4, 9.5 */}
                  <div style={{ marginTop: 16 }}>
                    {isVerified ? (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px 16px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBidClick(project.id);
                        }}
                      >
                        <i className="ri-auction-line" style={{ marginRight: 8 }} />
                        Gửi đề xuất
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          borderColor: 'rgba(245, 158, 11, 0.3)',
                          color: 'var(--warning)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/contractor/profile');
                        }}
                      >
                        <i className="ri-shield-check-line" style={{ marginRight: 8 }} />
                        Xác minh để đấu giá
                      </button>
                    )}
                  </div>
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
              className="ri-search-line"
              style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16, display: 'block' }}
            />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Không tìm thấy dự án
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedRegion('');
                setSelectedCategory('');
                setSelectedBudgetIndex(0);
                setSearchQuery('');
                setCurrentPage(1);
              }}
            >
              Xóa bộ lọc
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
