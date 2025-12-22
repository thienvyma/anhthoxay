/**
 * Homeowner Dashboard Page
 *
 * Displays:
 * - Welcome message with name (Requirement 4.1)
 * - Project summary cards (Requirement 4.2)
 * - Recent activity feed (Requirement 4.3)
 * - Quick action button to create project (Requirement 4.4)
 * - Pending actions section (Requirement 4.5)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 4.1, 4.2, 4.3, 4.4, 4.5**
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Layout } from '../../components/Layout';
import { HomeownerOnboarding } from '../../components/Onboarding';
import { projectsApi, activityApi, type Project, type Activity, type ProjectStatus } from '../../api';

interface ProjectStats {
  draft: number;
  active: number;
  inProgress: number;
  completed: number;
}

interface PendingAction {
  id: string;
  type: 'review_bids' | 'write_review' | 'confirm_milestone';
  title: string;
  description: string;
  projectId: string;
  projectTitle: string;
  createdAt: string;
}

export function HomeownerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<ProjectStats>({ draft: 0, active: 0, inProgress: 0, completed: 0 });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Default empty result for error cases
      const emptyResult = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      
      // Load projects to calculate stats
      const [draftRes, activeRes, inProgressRes, completedRes] = await Promise.all([
        projectsApi.getProjects({ status: 'DRAFT', limit: 1 }).catch(() => emptyResult),
        projectsApi.getProjects({ status: 'OPEN', limit: 100 }).catch(() => emptyResult),
        projectsApi.getProjects({ status: 'IN_PROGRESS', limit: 1 }).catch(() => emptyResult),
        projectsApi.getProjects({ status: 'COMPLETED', limit: 1 }).catch(() => emptyResult),
      ]);

      setStats({
        draft: draftRes?.meta?.total ?? 0,
        active: activeRes?.meta?.total ?? 0,
        inProgress: inProgressRes?.meta?.total ?? 0,
        completed: completedRes?.meta?.total ?? 0,
      });

      // Calculate pending actions from active projects
      const pendingActionsFromProjects: PendingAction[] = [];
      
      // Check for projects with bids to review (BIDDING_CLOSED status)
      try {
        const biddingClosedRes = await projectsApi.getProjects({ status: 'BIDDING_CLOSED', limit: 10 });
        const projects = biddingClosedRes?.data ?? [];
        projects.forEach((project: Project) => {
          if ((project.bidCount ?? 0) > 0) {
            pendingActionsFromProjects.push({
              id: `review-${project.id}`,
              type: 'review_bids',
              title: 'Xem xét đề xuất',
              description: `${project.bidCount} đề xuất đang chờ xem xét`,
              projectId: project.id,
              projectTitle: project.title,
              createdAt: project.createdAt,
            });
          }
        });
      } catch {
        // Ignore error for pending actions
      }

      // Check for completed projects needing review
      // Note: In a real implementation, we'd check if review has been written
      // const matchedRes = await projectsApi.getProjects({ status: 'MATCHED', limit: 10 });
      
      setPendingActions(pendingActionsFromProjects);

      // Load recent activities
      try {
        const activitiesRes = await activityApi.getActivities({ limit: 5 });
        setRecentActivities(activitiesRes?.data ?? []);
      } catch {
        // Activity API might not be implemented yet
        setRecentActivities([]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string): string => {
    const icons: Record<string, string> = {
      PROJECT_CREATED: 'ri-add-circle-line',
      PROJECT_SUBMITTED: 'ri-send-plane-line',
      PROJECT_APPROVED: 'ri-checkbox-circle-line',
      PROJECT_REJECTED: 'ri-close-circle-line',
      BID_SELECTED: 'ri-trophy-line',
      MATCH_CREATED: 'ri-handshake-line',
      PROJECT_STARTED: 'ri-play-circle-line',
      PROJECT_COMPLETED: 'ri-check-double-line',
      REVIEW_WRITTEN: 'ri-star-line',
    };
    return icons[type] || 'ri-notification-line';
  };

  const getActivityColor = (type: string): string => {
    const colors: Record<string, string> = {
      PROJECT_CREATED: 'var(--info)',
      PROJECT_SUBMITTED: 'var(--warning)',
      PROJECT_APPROVED: 'var(--success)',
      PROJECT_REJECTED: 'var(--error)',
      BID_SELECTED: 'var(--primary)',
      MATCH_CREATED: 'var(--success)',
      PROJECT_STARTED: 'var(--info)',
      PROJECT_COMPLETED: 'var(--success)',
      REVIEW_WRITTEN: 'var(--primary)',
    };
    return colors[type] || 'var(--text-muted)';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const statCards = [
    { label: 'Dự án nháp', value: stats.draft, icon: 'ri-draft-line', color: 'var(--text-muted)', status: 'DRAFT' as ProjectStatus },
    { label: 'Đang đấu giá', value: stats.active, icon: 'ri-auction-line', color: 'var(--info)', status: 'OPEN' as ProjectStatus },
    { label: 'Đang thi công', value: stats.inProgress, icon: 'ri-hammer-line', color: 'var(--warning)', status: 'IN_PROGRESS' as ProjectStatus },
    { label: 'Hoàn thành', value: stats.completed, icon: 'ri-check-double-line', color: 'var(--success)', status: 'COMPLETED' as ProjectStatus },
  ];

  return (
    <Layout>
      {/* Homeowner Onboarding Tour */}
      <HomeownerOnboarding />
      
      <div style={{ padding: 24 }}>
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--error-muted)',
              border: '1px solid var(--error)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <i className="ri-error-warning-line" style={{ fontSize: 20, color: 'var(--error)' }} />
            <span style={{ color: 'var(--text-primary)' }}>{error}</span>
            <button
              onClick={loadDashboardData}
              style={{
                marginLeft: 'auto',
                background: 'var(--error)',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Thử lại
            </button>
          </motion.div>
        )}

        {/* Welcome Section - Requirement 4.1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Xin chào, {user?.name || 'Chủ nhà'}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Quản lý dự án và theo dõi tiến độ của bạn
          </p>
        </motion.div>

        {/* Quick Actions - Requirement 4.4 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 32 }}
        >
          <button
            className="btn btn-primary create-project-btn"
            onClick={() => navigate('/homeowner/projects/new')}
            style={{
              padding: '16px 28px',
              fontSize: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <i className="ri-add-line" style={{ fontSize: 20 }} />
            Tạo dự án mới
          </button>
        </motion.div>

        {/* Stats Cards - Requirement 4.2 */}
        <div
          className="project-list"
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
              style={{ padding: 20, cursor: 'pointer' }}
              onClick={() => navigate(`/homeowner/projects?status=${stat.status}`)}
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
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Two Column Layout for Activity and Pending Actions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          {/* Recent Activity - Requirement 4.3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
            style={{ padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                Hoạt động gần đây
              </h3>
              <Link
                to="/homeowner/activity"
                style={{ color: 'var(--primary)', fontSize: 13, textDecoration: 'none' }}
              >
                Xem tất cả
              </Link>
            </div>
            
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <i className="ri-loader-4-line spinner" style={{ fontSize: 24 }} />
              </div>
            ) : (recentActivities?.length ?? 0) > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 12,
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: `${getActivityColor(activity.type)}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className={getActivityIcon(activity.type)}
                        style={{ fontSize: 18, color: getActivityColor(activity.type) }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {activity.title}
                      </div>
                      {activity.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {activity.description}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {formatTimeAgo(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: 40,
                  color: 'var(--text-muted)',
                }}
              >
                <i className="ri-history-line" style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
                <p>Chưa có hoạt động nào</p>
              </div>
            )}
          </motion.div>

          {/* Pending Actions - Requirement 4.5 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card bid-list"
            style={{ padding: 24 }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
              Cần xử lý
              {(pendingActions?.length ?? 0) > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    padding: '2px 8px',
                    background: 'var(--error)',
                    color: 'white',
                    fontSize: 12,
                    borderRadius: 10,
                  }}
                >
                  {pendingActions?.length ?? 0}
                </span>
              )}
            </h3>
            
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <i className="ri-loader-4-line spinner" style={{ fontSize: 24 }} />
              </div>
            ) : (pendingActions?.length ?? 0) > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingActions.map((action) => (
                  <div
                    key={action.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: 'var(--warning-muted)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (action.type === 'review_bids') {
                        navigate(`/homeowner/projects/${action.projectId}`);
                      } else if (action.type === 'write_review') {
                        navigate(`/homeowner/projects/${action.projectId}/review`);
                      }
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'var(--warning-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className={
                          action.type === 'review_bids'
                            ? 'ri-file-list-3-line'
                            : action.type === 'write_review'
                            ? 'ri-star-line'
                            : 'ri-checkbox-circle-line'
                        }
                        style={{ fontSize: 18, color: 'var(--warning)' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {action.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {action.projectTitle}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {action.description}
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'var(--text-muted)' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: 40,
                  color: 'var(--text-muted)',
                }}
              >
                <i className="ri-checkbox-circle-line" style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
                <p>Không có việc cần xử lý</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
