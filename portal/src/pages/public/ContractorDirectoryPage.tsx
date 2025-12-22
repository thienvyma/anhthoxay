/**
 * Public Contractor Directory Page
 *
 * Displays:
 * - Verified contractors only (Requirement 14.1)
 * - Profile, rating, reviews display (Requirement 14.2)
 * - Region and specialty filters (Requirement 14.3)
 * - Sort by rating and projects (Requirement 14.4)
 * - Login redirect on contact (Requirement 14.5)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 14.1, 14.2, 14.3, 14.4, 14.5**
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import {
  marketplaceApi,
  type Region,
  type ContractorRanking,
  type RankingQuery,
} from '../../api';

// Specialty options for filtering
const SPECIALTIES = [
  { value: '', label: 'Tất cả chuyên môn' },
  { value: 'Sơn', label: 'Sơn' },
  { value: 'Ốp lát', label: 'Ốp lát' },
  { value: 'Điện', label: 'Điện' },
  { value: 'Nước', label: 'Nước' },
  { value: 'Xây dựng', label: 'Xây dựng' },
  { value: 'Nội thất', label: 'Nội thất' },
  { value: 'Cơ khí', label: 'Cơ khí' },
];

export function ContractorDirectoryPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [contractors, setContractors] = useState<ContractorRanking[]>([]);
  const [featuredContractors, setFeaturedContractors] = useState<ContractorRanking[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state from URL params
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialRegion = searchParams.get('region') || '';
  const initialSpecialty = searchParams.get('specialty') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'totalScore-desc';

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState(initialSort.split('-')[0] || 'totalScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (initialSort.split('-')[1] as 'asc' | 'desc') || 'desc'
  );

  // Load filter options and featured contractors
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [regionsData, featuredData] = await Promise.all([
          marketplaceApi.getRegions(),
          marketplaceApi.getFeaturedContractors({ limit: 4 }),
        ]);
        setRegions(regionsData);
        setFeaturedContractors(featuredData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };
    loadInitialData();
  }, []);

  // Load contractors - Requirement 14.1: Only verified contractors
  const loadContractors = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: RankingQuery = {
        page: currentPage,
        limit: 12,
      };

      if (selectedRegion) {
        query.regionId = selectedRegion;
      }
      if (selectedSpecialty) {
        query.specialty = selectedSpecialty;
      }

      const result = await marketplaceApi.getContractors(query);

      // Client-side sorting (if API doesn't support it)
      let sortedData = [...result.data];
      if (sortBy === 'totalScore') {
        sortedData.sort((a, b) =>
          sortOrder === 'desc' ? b.totalScore - a.totalScore : a.totalScore - b.totalScore
        );
      } else if (sortBy === 'ratingScore') {
        sortedData.sort((a, b) =>
          sortOrder === 'desc' ? b.ratingScore - a.ratingScore : a.ratingScore - b.ratingScore
        );
      } else if (sortBy === 'projectsScore') {
        sortedData.sort((a, b) =>
          sortOrder === 'desc' ? b.projectsScore - a.projectsScore : a.projectsScore - b.projectsScore
        );
      }

      // Client-side search filtering
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        sortedData = sortedData.filter(
          (c) =>
            c.contractor?.name?.toLowerCase().includes(searchLower) ||
            c.contractor?.profile?.description?.toLowerCase().includes(searchLower)
        );
      }

      setContractors(sortedData);
      setTotalPages(result.meta.totalPages);
      setTotalCount(result.meta.total);
    } catch (error) {
      console.error('Failed to load contractors:', error);
      setContractors([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedRegion, selectedSpecialty, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    loadContractors();
  }, [loadContractors]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (selectedRegion) params.set('region', selectedRegion);
    if (selectedSpecialty) params.set('specialty', selectedSpecialty);
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'totalScore' || sortOrder !== 'desc') {
      params.set('sort', `${sortBy}-${sortOrder}`);
    }
    setSearchParams(params, { replace: true });
  }, [currentPage, selectedRegion, selectedSpecialty, searchQuery, sortBy, sortOrder, setSearchParams]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Requirement 14.5: Login redirect on contact
  const handleContactClick = (contractorId: string) => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: `/contractors/${contractorId}` } });
      return;
    }
    // If authenticated, could navigate to chat or profile
    navigate(`/contractors/${contractorId}`);
  };

  // Formatters
  const formatRating = (score: number): string => {
    // Convert score (0-100) to rating (0-5)
    const rating = (score / 100) * 5;
    return rating.toFixed(1);
  };

  const renderStars = (score: number) => {
    const rating = (score / 100) * 5;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <i key={`full-${i}`} className="ri-star-fill" style={{ color: '#f5d393' }} />
        ))}
        {hasHalfStar && <i className="ri-star-half-fill" style={{ color: '#f5d393' }} />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <i key={`empty-${i}`} className="ri-star-line" style={{ color: '#71717a' }} />
        ))}
      </div>
    );
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
              Anh Thợ Xây
            </h1>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link
              to="/marketplace"
              style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: 14 }}
            >
              Marketplace
            </Link>
            <Link
              to="/contractors"
              style={{ color: '#f5d393', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
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
            Danh sách <span style={{ color: '#f5d393' }}>nhà thầu</span>
          </h2>
          <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.6 }}>
            Tìm kiếm nhà thầu uy tín đã được xác minh trên nền tảng
          </p>
        </motion.div>
      </section>

      {/* Featured Contractors */}
      {featuredContractors.length > 0 && (
        <section style={{ padding: '0 24px 40px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#e4e7ec', marginBottom: 20 }}>
              <i className="ri-star-line" style={{ marginRight: 8, color: '#f5d393' }} />
              Nhà thầu nổi bật
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {featuredContractors.map((ranking, index) => (
                <motion.div
                  key={ranking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 211, 147, 0.1) 0%, rgba(245, 211, 147, 0.05) 100%)',
                    borderRadius: 16,
                    padding: 20,
                    border: '1px solid rgba(245, 211, 147, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => handleContactClick(ranking.contractorId)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: '#f5d393',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#0b0c0f',
                      }}
                    >
                      {ranking.contractor?.name?.charAt(0) || 'N'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#e4e7ec' }}>
                        {ranking.contractor?.name || 'Nhà thầu'}
                      </div>
                      <div style={{ fontSize: 12, color: '#f5d393' }}>
                        <i className="ri-verified-badge-fill" style={{ marginRight: 4 }} />
                        Đã xác minh
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {renderStars(ranking.ratingScore)}
                    <span style={{ fontSize: 14, color: '#e4e7ec' }}>
                      {formatRating(ranking.ratingScore)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#a1a1aa' }}>
                    {ranking.contractor?.totalProjects || 0} dự án hoàn thành
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filters - Requirements 14.3, 14.4 */}
      <section style={{ padding: '0 24px 40px' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            background: '#131316',
            borderRadius: 16,
            padding: 20,
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
                  placeholder="Tìm kiếm nhà thầu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </form>

            {/* Region Filter - Requirement 14.3 */}
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

            {/* Specialty Filter - Requirement 14.3 */}
            <select
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                handleFilterChange();
              }}
              className="input"
            >
              {SPECIALTIES.map((specialty) => (
                <option key={specialty.value} value={specialty.value}>
                  {specialty.label}
                </option>
              ))}
            </select>

            {/* Sort - Requirement 14.4 */}
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
              <option value="totalScore-desc">Điểm cao nhất</option>
              <option value="ratingScore-desc">Đánh giá cao nhất</option>
              <option value="projectsScore-desc">Nhiều dự án nhất</option>
              <option value="totalScore-asc">Điểm thấp nhất</option>
            </select>
          </div>
        </div>
      </section>

      {/* Contractors List - Requirements 14.1, 14.2 */}
      <section style={{ padding: '0 24px 60px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Results count */}
          <div style={{ marginBottom: 16, color: '#71717a', fontSize: 14 }}>
            {isLoading ? 'Đang tải...' : `${totalCount} nhà thầu đã xác minh`}
          </div>

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
                    height: 200,
                    border: '1px solid #27272a',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#27272a',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          width: '60%',
                          height: 20,
                          background: '#27272a',
                          borderRadius: 4,
                          marginBottom: 8,
                        }}
                      />
                      <div
                        style={{
                          width: '40%',
                          height: 16,
                          background: '#27272a',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : contractors.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 20,
              }}
            >
              {contractors.map((ranking, index) => (
                <motion.div
                  key={ranking.id}
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
                  }}
                  onClick={() => handleContactClick(ranking.contractorId)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3f3f46';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#27272a';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >

                  {/* Header - Requirement 14.2: Profile display */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#27272a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        fontWeight: 700,
                        color: '#e4e7ec',
                        flexShrink: 0,
                      }}
                    >
                      {ranking.contractor?.avatar ? (
                        <img
                          src={ranking.contractor.avatar}
                          alt={ranking.contractor.name}
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        ranking.contractor?.name?.charAt(0) || 'N'
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: '#e4e7ec',
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ranking.contractor?.name || 'Nhà thầu'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            color: '#22c55e',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          <i className="ri-verified-badge-fill" style={{ marginRight: 4 }} />
                          Đã xác minh
                        </span>
                        {ranking.isFeatured && (
                          <span
                            style={{
                              background: 'rgba(245, 211, 147, 0.2)',
                              color: '#f5d393',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            <i className="ri-star-fill" style={{ marginRight: 4 }} />
                            Nổi bật
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating - Requirement 14.2 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    {renderStars(ranking.ratingScore)}
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e4e7ec' }}>
                      {formatRating(ranking.ratingScore)}
                    </span>
                    <span style={{ fontSize: 12, color: '#71717a' }}>
                      ({ranking.contractor?.totalProjects || 0} dự án)
                    </span>
                  </div>

                  {/* Description */}
                  {ranking.contractor?.profile?.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: '#a1a1aa',
                        marginBottom: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.5,
                      }}
                    >
                      {ranking.contractor.profile.description}
                    </p>
                  )}

                  {/* Specialties */}
                  {ranking.contractor?.profile?.specialties && ranking.contractor.profile.specialties.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                      {ranking.contractor.profile.specialties.slice(0, 3).map((specialty, i) => (
                        <span
                          key={i}
                          style={{
                            background: '#27272a',
                            color: '#a1a1aa',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        >
                          {specialty}
                        </span>
                      ))}
                      {ranking.contractor.profile.specialties.length > 3 && (
                        <span
                          style={{
                            color: '#71717a',
                            fontSize: 12,
                            padding: '4px 0',
                          }}
                        >
                          +{ranking.contractor.profile.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Contact Button - Requirement 14.5 */}
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '10px 16px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContactClick(ranking.contractorId);
                    }}
                  >
                    <i className="ri-message-3-line" style={{ marginRight: 8 }} />
                    {isAuthenticated ? 'Liên hệ' : 'Đăng nhập để liên hệ'}
                  </button>
                </motion.div>
              ))}
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
                className="ri-user-search-line"
                style={{ fontSize: 48, color: '#71717a', marginBottom: 16, display: 'block' }}
              />
              <h4 style={{ fontSize: 18, color: '#e4e7ec', marginBottom: 8 }}>
                Không tìm thấy nhà thầu
              </h4>
              <p style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 24 }}>
                Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedRegion('');
                  setSelectedSpecialty('');
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
            Bạn cần tìm nhà thầu?
          </h3>
          <p style={{ color: '#a1a1aa', fontSize: 16, marginBottom: 24 }}>
            Đăng dự án của bạn và nhận báo giá từ nhiều nhà thầu uy tín
          </p>
          <Link
            to="/auth/register"
            className="btn btn-primary"
            style={{ textDecoration: 'none', padding: '14px 32px', fontSize: 16 }}
          >
            Đăng dự án ngay
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
            © 2024 Anh Thợ Xây. All rights reserved.
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
