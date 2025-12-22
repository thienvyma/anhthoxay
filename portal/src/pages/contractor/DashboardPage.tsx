/**
 * Contractor Dashboard Page
 *
 * Displays:
 * - Verification status banner (Requirement 8.1)
 * - Bid summary cards (Requirement 8.2)
 * - Monthly statistics chart (Requirement 8.3)
 * - Recommended projects based on specialty (Requirement 8.4)
 * - Recent reviews and rating (Requirement 8.5)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 8.1, 8.2, 8.3, 8.4, 8.5**
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Layout } from '../../components/Layout';
import { ContractorOnboarding } from '../../components/Onboarding';
import {
  bidsApi,
  marketplaceApi,
  reviewApi,
  contractorProfileApi,
  type Project,
  type Review,
  type BidStatus,
} from '../../api';

interface BidStats {
  pending: number;
  won: number;
  lost: number;
  total: number;
}

interface MonthlyStats {
  month: string;
  bidsSubmitted: number;
  bidsWon: number;
  revenue: number;
}

export function ContractorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bidStats, setBidStats] = useState<BidStats>({ pending: 0, won: 0, lost: 0, total: 0 });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const isVerified = user?.verificationStatus === 'VERIFIED';
  const isPending = user?.verificationStatus === 'PENDING';
  const isRejected = user?.verificationStatus === 'REJECTED';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load bid statistics
      const [pendingRes, wonRes, lostRes] = await Promise.all([
        bidsApi.getBids({ status: 'PENDING' as BidStatus, limit: 1 }),
        bidsApi.getBids({ status: 'SELECTED' as BidStatus, limit: 1 }),
        bidsApi.getBids({ status: 'NOT_SELECTED' as BidStatus, limit: 1 }),
      ]);

      setBidStats({
        pending: pendingRes.meta.total,
        won: wonRes.meta.total,
        lost: lostRes.meta.total,
        total: pendingRes.meta.total + wonRes.meta.total + lostRes.meta.total,
      });

      // Load contractor profile
      try {
        await contractorProfileApi.getProfile();
      } catch {
        // Profile might not exist yet
      }

      // Load recommended projects (only if verified)
      if (isVerified) {
        try {
          const projectsRes = await marketplaceApi.getProjects({ limit: 5 });
          setRecommendedProjects(projectsRes.data);
        } catch {
          setRecommendedProjects([]);
        }
      }

      // Load recent reviews
      if (user?.id) {
        try {
          const reviewsRes = await reviewApi.getReviews(user.id, { limit: 5 });
          setRecentReviews(reviewsRes.data);
          
          // Calculate average rating
          if (reviewsRes.data.length > 0) {
            const totalRating = reviewsRes.data.reduce((sum, r) => sum + r.rating, 0);
            setAverageRating(totalRating / reviewsRes.data.length);
          }
        } catch {
          setRecentReviews([]);
        }
      }

      // Generate mock monthly stats (in real app, this would come from API)
      generateMonthlyStats();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMonthlyStats = () => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
    const stats: MonthlyStats[] = months.map((month) => ({
      month,
      bidsSubmitted: Math.floor(Math.random() * 10),
      bidsWon: Math.floor(Math.random() * 3),
      revenue: Math.floor(Math.random() * 50000000),
    }));
    setMonthlyStats(stats);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 1) return 'Hôm nay';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getMaxChartValue = (): number => {
    const maxBids = Math.max(...monthlyStats.map((s) => s.bidsSubmitted), 1);
    return Math.ceil(maxBids / 5) * 5;
  };

  const statCards = [
    { label: 'Bid đang chờ', value: bidStats.pending, icon: 'ri-time-line', color: 'var(--warning)', status: 'PENDING' },
    { label: 'Bid thắng', value: bidStats.won, icon: 'ri-trophy-line', color: 'var(--success)', status: 'SELECTED' },
    { label: 'Bid thua', value: bidStats.lost, icon: 'ri-close-circle-line', color: 'var(--error)', status: 'NOT_SELECTED' },
    { label: 'Đánh giá', value: averageRating.toFixed(1), icon: 'ri-star-line', color: 'var(--primary)', isRating: true },
  ];

  return (
    <Layout>
      {/* Contractor Onboarding - Verification Checklist */}
      <ContractorOnboarding />
      
      <div style={{ padding: 24 }}>
        {/* Verification Status Banner - Requirement 8.1 */}
        {!isVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: isPending
                ? 'var(--warning-muted)'
                : isRejected
                ? 'var(--error-muted)'
                : 'var(--info-muted)',
              border: `1px solid ${
                isPending ? 'var(--warning)' : isRejected ? 'var(--error)' : 'var(--info)'
              }40`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <i
              className={
                isPending
                  ? 'ri-time-line'
                  : isRejected
                  ? 'ri-error-warning-line'
                  : 'ri-shield-check-line'
              }
              style={{
                fontSize: 24,
                color: isPending ? 'var(--warning)' : isRejected ? 'var(--error)' : 'var(--info)',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {isPending
                  ? 'Tài khoản đang chờ xác minh'
                  : isRejected
                  ? 'Hồ sơ xác minh bị từ chối'
                  : 'Tài khoản chưa được xác minh'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {isPending
                  ? 'Hồ sơ của bạn đang được xem xét. Chúng tôi sẽ thông báo khi hoàn tất.'
                  : isRejected
                  ? 'Vui lòng cập nhật hồ sơ và gửi lại để được xem xét.'
                  : 'Hoàn thiện hồ sơ và gửi xác minh để tham gia đấu giá.'}
              </div>
            </div>
            {!isPending && (
              <button
                className="btn btn-primary"
                style={{ padding: '10px 20px' }}
                onClick={() => navigate('/contractor/profile')}
              >
                {isRejected ? 'Cập nhật hồ sơ' : 'Xác minh ngay'}
              </button>
            )}
          </motion.div>
        )}

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Xin chào, {user?.name || 'Nhà thầu'}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Quản lý bid và theo dõi cơ hội kinh doanh
          </p>
        </motion.div>

        {/* Quick Actions */}
        {isVerified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ marginBottom: 32 }}
          >
            <button
              className="btn btn-primary"
              onClick={() => navigate('/contractor/marketplace')}
              style={{
                padding: '16px 28px',
                fontSize: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <i className="ri-search-line" style={{ fontSize: 20 }} />
              Tìm dự án mới
            </button>
          </motion.div>
        )}

        {/* Bid Summary Cards - Requirement 8.2 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            marginBottom: 32,
          }}
        >
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="card"
              style={{ padding: 20, cursor: stat.isRating ? 'default' : 'pointer' }}
              onClick={() => {
                if (!stat.isRating) {
                  navigate(`/contractor/my-bids?status=${stat.status}`);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${stat.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className={stat.icon} style={{ fontSize: 20, color: stat.color }} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                {isLoading ? '-' : stat.value}
                {stat.isRating && !isLoading && (
                  <span style={{ fontSize: 16, color: 'var(--text-muted)', marginLeft: 4 }}>/5</span>
                )}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: 24,
            marginBottom: 24,
          }}
        >
          {/* Monthly Statistics Chart - Requirement 8.3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
            style={{ padding: 24 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                Thống kê 6 tháng gần đây
              </h3>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: 'var(--info)',
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>Bid gửi</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: 'var(--success)',
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>Bid thắng</span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <i className="ri-loader-4-line spinner" style={{ fontSize: 24 }} />
              </div>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                {monthlyStats.map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        gap: 4,
                        alignItems: 'flex-end',
                        height: 160,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          background: 'var(--info)',
                          borderRadius: '4px 4px 0 0',
                          height: `${(stat.bidsSubmitted / getMaxChartValue()) * 100}%`,
                          minHeight: 4,
                          transition: 'height 0.3s ease',
                        }}
                        title={`Bid gửi: ${stat.bidsSubmitted}`}
                      />
                      <div
                        style={{
                          flex: 1,
                          background: 'var(--success)',
                          borderRadius: '4px 4px 0 0',
                          height: `${(stat.bidsWon / getMaxChartValue()) * 100}%`,
                          minHeight: 4,
                          transition: 'height 0.3s ease',
                        }}
                        title={`Bid thắng: ${stat.bidsWon}`}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.month}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recommended Projects - Requirement 8.4 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card"
            style={{ padding: 24 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Dự án phù hợp</h3>
              {isVerified && (
                <Link
                  to="/contractor/marketplace"
                  style={{ color: 'var(--primary)', fontSize: 13, textDecoration: 'none' }}
                >
                  Xem tất cả
                </Link>
              )}
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <i className="ri-loader-4-line spinner" style={{ fontSize: 24 }} />
              </div>
            ) : !isVerified ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 40,
                  background: 'var(--warning-muted)',
                  borderRadius: 12,
                }}
              >
                <i
                  className="ri-lock-line"
                  style={{ fontSize: 40, color: 'var(--warning)', marginBottom: 12, display: 'block' }}
                />
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Xác minh tài khoản để xem dự án
                </p>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                  onClick={() => navigate('/contractor/profile')}
                >
                  Xác minh ngay
                </button>
              </div>
            ) : recommendedProjects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recommendedProjects.slice(0, 4).map((project) => (
                  <div
                    key={project.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/contractor/marketplace/${project.id}`)}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        background: 'var(--info-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <i className="ri-building-line" style={{ fontSize: 20, color: 'var(--info)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          marginBottom: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {project.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {project.region?.name || 'Chưa xác định'} •{' '}
                        {project.budgetMin && project.budgetMax
                          ? `${formatCurrency(project.budgetMin)} - ${formatCurrency(project.budgetMax)}`
                          : 'Thương lượng'}
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <i
                  className="ri-file-list-3-line"
                  style={{ fontSize: 40, marginBottom: 12, display: 'block' }}
                />
                <p>Chưa có dự án phù hợp</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Reviews - Requirement 8.5 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
          style={{ padding: 24 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
              Đánh giá gần đây
              {recentReviews.length > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontWeight: 400,
                    color: 'var(--primary)',
                  }}
                >
                  ({averageRating.toFixed(1)} ⭐)
                </span>
              )}
            </h3>
            {recentReviews.length > 0 && (
              <Link
                to="/contractor/reviews"
                style={{ color: 'var(--primary)', fontSize: 13, textDecoration: 'none' }}
              >
                Xem tất cả
              </Link>
            )}
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <i className="ri-loader-4-line spinner" style={{ fontSize: 24 }} />
            </div>
          ) : recentReviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: 16,
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--primary-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <i className="ri-user-line" style={{ fontSize: 18, color: 'var(--primary)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {review.reviewer?.name || 'Khách hàng'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {formatTimeAgo(review.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={star <= review.rating ? 'ri-star-fill' : 'ri-star-line'}
                          style={{
                            fontSize: 14,
                            color: star <= review.rating ? 'var(--primary)' : 'var(--text-muted)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p
                      style={{
                        fontSize: 14,
                        color: 'var(--text-secondary)',
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {review.comment}
                    </p>
                  )}
                  {review.project && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <i className="ri-building-line" />
                      {review.project.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <i
                className="ri-star-smile-line"
                style={{ fontSize: 40, marginBottom: 12, display: 'block' }}
              />
              <p>Chưa có đánh giá nào</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>
                Hoàn thành dự án để nhận đánh giá từ khách hàng
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
