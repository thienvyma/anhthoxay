/**
 * Public Marketplace Page
 *
 * Displays:
 * - Project list with OPEN status (Requirement 13.1)
 * - Limited project info - no address, no owner (Requirement 13.2)
 * - Login redirect on bid click (Requirement 13.3)
 * - Region and category filters (Requirement 13.4)
 * - Statistics display (Requirement 13.5)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 13.1, 13.2, 13.3, 13.4, 13.5**
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
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

interface MarketplaceStats {
  totalProjects: number;
  totalContractors: number;
  completedProjects: number;
}

export function PublicMarketplacePage() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<MarketplaceStats>({
    totalProjects: 0,
    totalContractors: 0,
    completedProjects: 0,
  });

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

  // Load filter options and stats
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

    // Load mock stats (in real app, this would be an API call)
    setStats({
      totalProjects: 500,
      totalContractors: 200,
      completedProjects: 450,
    });

    loadFilterOptions();
  }, []);

  // Load projects - Requirement 13.1: Only OPEN status
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

      // Client-side budget filtering
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

  // Requirement 13.3: Login redirect on bid click
  const handleBidClick = (projectId: string) => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: `/marketplace/${projectId}` } });
      return;
    }
    // If authenticated, redirect based on role
    if (user?.role === 'CONTRACTOR') {
      navigate(`/contractor/marketplace/${projectId}/bid`);
    } else {
      navigate('/auth/register', { state: { accountType: 'contractor' } });
    }
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
    <div style={{ minHeight: '100vh', background: '#0b0c0f' }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(11, 12, 15, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #27272a',
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f5d393' }}>
              Nội Thất Nhanh
            </h1>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link
              to="/marketplace"
              style={{ color: '#f5d393', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
            >
              Marketplace
            </Link>
            <Link
              to="/contractors"
              style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: 14 }}
            >
              Nhà thầu
            </Link>
            
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link
                  to={user?.role === 'CONTRACTOR' ? '/contractor' : '/homeowner'}
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', padding: '10px 20px' }}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => logout()}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                <Link
                  to="/auth/login"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none', padding: '10px 20px' }}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/auth/register"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', padding: '10px 20px' }}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '60px 24px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: 800, margin: '0 auto' }}
        >
          <h2 style={{ fontSize: 42, fontWeight: 700, color: '#e4e7ec', marginBottom: 16 }}>
            Sàn giao dịch <span style={{ color: '#f5d393' }}>xây dựng</span>
          </h2>
          <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.6 }}>
            Kết nối chủ nhà với nhà thầu uy tín. Đăng dự án, nhận báo giá cạnh tranh, chọn nhà thầu phù hợp.
          </p>
        </motion.div>
      </section>

      {/* Stats - Requirement 13.5 */}
      <section style={{ padding: '40px 24px', background: '#131316' }}>
        <div
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 32,
          }}
        >
          {[
            { value: `${stats.completedProjects}+`, label: 'Dự án đã hoàn thành' },
            { value: `${stats.totalContractors}+`, label: 'Nhà thầu xác minh' },
            { value: '98%', label: 'Khách hàng hài lòng' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 36, fontWeight: 700, color: '#f5d393' }}>
                {stat.value}
              </div>
              <div style={{ color: '#a1a1aa', fontSize: 14, marginTop: 4 }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Filters - Requirement 13.4 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: '#131316',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              border: '1px solid #27272a',
            }}
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
                      color: '#71717a',
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
              </select>
            </div>
          </motion.div>

          {/* Results count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <span style={{ color: '#71717a', fontSize: 14 }}>
              {isLoading ? 'Đang tải...' : `${totalCount} dự án đang tìm nhà thầu`}
            </span>
          </motion.div>

          {/* Project Cards - Requirements 13.1, 13.2 */}
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
                  style={{
                    background: '#131316',
                    borderRadius: 16,
                    padding: 20,
                    height: 280,
                    border: '1px solid #27272a',
                  }}
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
                    style={{
                      background: '#131316',
                      borderRadius: 16,
                      padding: 20,
                      border: '1px solid #27272a',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3f3f46';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#27272a';
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
                        style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#3b82f6',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        Đang mở
                      </span>
                      <span style={{ fontSize: 12, color: '#71717a' }}>{project.code}</span>
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
                      {project.title}
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
                      {project.description}
                    </p>

                    {/* Info Grid - No owner info, no address (Requirement 13.2) */}
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
                          {project.region?.name || 'Chưa xác định'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>
                          Hạng mục
                        </div>
                        <div style={{ fontSize: 13, color: '#e4e7ec' }}>
                          {project.category?.name || 'Chưa xác định'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>
                          Ngân sách
                        </div>
                        <div style={{ fontSize: 13, color: '#f5d393' }}>
                          {formatBudget(project.budgetMin, project.budgetMax)}
                        </div>
                      </div>
                      {project.area && (
                        <div>
                          <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>
                            Diện tích
                          </div>
                          <div style={{ fontSize: 13, color: '#e4e7ec' }}>
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
                        borderTop: '1px solid #27272a',
                        marginTop: 'auto',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: '#71717a' }}>
                          <i className="ri-file-list-3-line" style={{ marginRight: 4 }} />
                          {project.bidCount || 0}/{project.maxBids || 20} đề xuất
                        </span>
                        {deadline && (
                          <span
                            style={{
                              fontSize: 12,
                              color: deadline.isUrgent ? '#ef4444' : '#f59e0b',
                            }}
                          >
                            <i className="ri-time-line" style={{ marginRight: 4 }} />
                            {deadline.text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bid Button - Requirement 13.3: Login redirect */}
                    <div style={{ marginTop: 16 }}>
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '12px 16px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBidClick(project.id);
                        }}
                      >
                        <i className="ri-auction-line" style={{ marginRight: 8 }} />
                        {isAuthenticated ? 'Gửi đề xuất' : 'Đăng nhập để đấu giá'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: '#131316',
                borderRadius: 16,
                padding: 60,
                textAlign: 'center',
                border: '1px solid #27272a',
              }}
            >
              <i
                className="ri-file-list-3-line"
                style={{ fontSize: 48, color: '#71717a', marginBottom: 16, display: 'block' }}
              />
              <h4 style={{ fontSize: 18, color: '#e4e7ec', marginBottom: 8 }}>
                Không tìm thấy dự án
              </h4>
              <p style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 24 }}>
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
      </section>

      {/* CTA Section */}
      <section style={{ padding: '60px 24px', background: '#131316' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontSize: 28, fontWeight: 600, color: '#e4e7ec', marginBottom: 16 }}>
            Bạn là nhà thầu?
          </h3>
          <p style={{ color: '#a1a1aa', fontSize: 16, marginBottom: 24 }}>
            Đăng ký ngay để nhận thông báo về các dự án phù hợp với chuyên môn của bạn
          </p>
          <Link
            to="/auth/register"
            className="btn btn-primary"
            style={{ textDecoration: 'none', padding: '14px 32px', fontSize: 16 }}
          >
            Đăng ký làm nhà thầu
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid #27272a' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p style={{ color: '#71717a', fontSize: 14 }}>
            © 2024 Nội Thất Nhanh. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ color: '#71717a', fontSize: 14, textDecoration: 'none' }}>
              Điều khoản
            </a>
            <a href="#" style={{ color: '#71717a', fontSize: 14, textDecoration: 'none' }}>
              Chính sách
            </a>
            <a href="#" style={{ color: '#71717a', fontSize: 14, textDecoration: 'none' }}>
              Liên hệ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
