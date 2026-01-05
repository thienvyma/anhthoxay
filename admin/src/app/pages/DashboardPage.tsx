/**
 * DashboardPage - ANH THỢ XÂY Admin Dashboard
 * Main dashboard page - Currently focused on quotation management (báo giá nội thất/thi công)
 * Portal features (bidding, contractors) are coming soon
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../theme';
import { Card } from '../components/Card';
import { ActivityFeed } from '../components/ActivityFeed';
import {
  LeadsLineChart,
  LeadsPieChart,
  LeadsBarChart,
  ConversionRateCard,
} from '../components/charts';
import { dashboardApi } from '../api/dashboard';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveGrid, ResponsiveStack } from '../../components/responsive';
import type { DashboardStats, ActivityItem } from '../api/dashboard';
import { useNavigate } from 'react-router-dom';

// Auto-refresh interval: 5 minutes
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

// Coming Soon Badge Component
function ComingSoonBadge() {
  return (
    <span
      style={{
        padding: '4px 10px',
        background: `${tokens.color.warning}20`,
        color: tokens.color.warning,
        fontSize: 11,
        fontWeight: 600,
        borderRadius: tokens.radius.pill,
        marginLeft: 8,
      }}
    >
      Coming Soon
    </span>
  );
}

// Current Stats Grid - Only shows active features
function CurrentStatsGrid({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const activeStats = [
    {
      key: 'leads',
      icon: 'ri-contacts-book-line',
      label: 'Tổng khách hàng',
      color: tokens.color.primary,
      route: '/leads',
      value: stats?.leads.total ?? 0,
      pending: stats?.leads.new,
    },
    {
      key: 'blogPosts',
      icon: 'ri-quill-pen-line',
      label: 'Bài viết',
      color: '#ec4899',
      route: '/blog-manager',
      value: stats?.blogPosts.total ?? 0,
    },
    {
      key: 'users',
      icon: 'ri-user-settings-line',
      label: 'Tài khoản',
      color: '#06b6d4',
      route: '/users',
      value: stats?.users.total ?? 0,
    },
    {
      key: 'media',
      icon: 'ri-gallery-line',
      label: 'Media',
      color: '#84cc16',
      route: '/media',
      value: stats?.media.total ?? 0,
    },
  ];

  return (
    <ResponsiveGrid
      cols={{ mobile: 2, tablet: 4, desktop: 4 }}
      gap={{ mobile: 12, tablet: 16, desktop: 20 }}
      style={{ marginBottom: isMobile ? 24 : 32 }}
    >
      {activeStats.map((stat, index) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(stat.route)}
          style={{
            padding: isMobile ? 16 : 20,
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.lg,
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {stat.pending && stat.pending > 0 && (
            <div
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                minWidth: 20,
                height: 20,
                padding: '0 6px',
                background: tokens.color.warning,
                borderRadius: tokens.radius.pill,
                fontSize: 11,
                fontWeight: 700,
                color: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {stat.pending}
            </div>
          )}
          <div
            style={{
              width: isMobile ? 36 : 44,
              height: isMobile ? 36 : 44,
              borderRadius: tokens.radius.md,
              background: `${stat.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stat.color,
              fontSize: isMobile ? 18 : 22,
              marginBottom: 12,
            }}
          >
            <i className={stat.icon} />
          </div>
          <div
            style={{
              color: tokens.color.text,
              fontSize: isMobile ? 24 : 28,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {loading ? '...' : stat.value.toLocaleString()}
          </div>
          <div style={{ color: tokens.color.muted, fontSize: isMobile ? 12 : 13 }}>
            {stat.label}
          </div>
        </motion.div>
      ))}
    </ResponsiveGrid>
  );
}

// Quick Actions - Only active features
function ActiveQuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      key: 'manage-leads',
      icon: 'ri-contacts-book-line',
      label: 'Quản lý khách hàng',
      route: '/leads',
      color: tokens.color.primary,
    },
    {
      key: 'furniture',
      icon: 'ri-sofa-line',
      label: 'Báo giá nội thất',
      route: '/furniture',
      color: tokens.color.warning,
    },
    {
      key: 'write-blog',
      icon: 'ri-quill-pen-line',
      label: 'Viết bài blog',
      route: '/blog-manager',
      color: '#ec4899',
    },
    {
      key: 'manage-media',
      icon: 'ri-gallery-line',
      label: 'Quản lý media',
      route: '/media',
      color: '#84cc16',
    },
    {
      key: 'pricing',
      icon: 'ri-calculator-line',
      label: 'Cấu hình giá',
      route: '/pricing',
      color: tokens.color.info,
    },
    {
      key: 'settings',
      icon: 'ri-settings-3-line',
      label: 'Cài đặt',
      route: '/settings',
      color: '#8b5cf6',
    },
  ];

  return (
    <Card title="Thao tác nhanh" icon="ri-flashlight-line">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {actions.map((action, index) => (
          <motion.button
            key={action.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(action.route)}
            style={{
              padding: 16,
              background: tokens.color.surfaceAlt,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: tokens.radius.md,
                background: `${action.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: action.color,
                fontSize: 22,
              }}
            >
              <i className={action.icon} />
            </div>
            <span
              style={{
                color: tokens.color.text,
                fontSize: 13,
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>
    </Card>
  );
}


// Coming Soon Section - Portal features
function ComingSoonSection() {
  const { isMobile } = useResponsive();

  const comingSoonFeatures = [
    {
      key: 'projects',
      icon: 'ri-building-line',
      label: 'Công trình',
      description: 'Quản lý công trình từ chủ nhà',
      color: tokens.color.info,
    },
    {
      key: 'bids',
      icon: 'ri-auction-line',
      label: 'Đấu thầu',
      description: 'Quản lý bids từ nhà thầu',
      color: '#8b5cf6',
    },
    {
      key: 'contractors',
      icon: 'ri-building-2-line',
      label: 'Nhà thầu',
      description: 'Xét duyệt và quản lý nhà thầu',
      color: tokens.color.warning,
    },
    {
      key: 'matches',
      icon: 'ri-links-line',
      label: 'Ghép nối',
      description: 'Quản lý ghép nối chủ nhà - nhà thầu',
      color: tokens.color.success,
    },
    {
      key: 'escrow',
      icon: 'ri-safe-2-line',
      label: 'Escrow',
      description: 'Quản lý tiền đặt cọc',
      color: tokens.color.info,
    },
    {
      key: 'disputes',
      icon: 'ri-scales-3-line',
      label: 'Tranh chấp',
      description: 'Giải quyết tranh chấp',
      color: tokens.color.error,
    },
  ];

  return (
    <Card
      title="Tính năng Portal"
      icon="ri-rocket-line"
      actions={<ComingSoonBadge />}
      style={{ marginTop: isMobile ? 24 : 32 }}
    >
      <p
        style={{
          color: tokens.color.muted,
          fontSize: 14,
          margin: '0 0 20px',
        }}
      >
        Các tính năng dưới đây sẽ được kích hoạt khi Portal (app cho chủ nhà và nhà thầu) được triển khai.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {comingSoonFeatures.map((feature) => (
          <div
            key={feature.key}
            style={{
              padding: 16,
              background: tokens.color.surfaceAlt,
              border: `1px dashed ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              opacity: 0.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: tokens.radius.md,
                  background: `${feature.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: feature.color,
                  fontSize: 18,
                }}
              >
                <i className={feature.icon} />
              </div>
              <span style={{ color: tokens.color.text, fontWeight: 500 }}>
                {feature.label}
              </span>
            </div>
            <p style={{ color: tokens.color.muted, fontSize: 13, margin: 0 }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isMobile, isTablet, breakpoint } = useResponsive();

  const loadDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
        setChartsLoading(true);
      }
      setError(null);

      const statsData = await dashboardApi.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setChartsLoading(false);
    }
  }, []);

  const loadActivityFeed = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setActivityLoading(true);
      }

      const activityData = await dashboardApi.getActivityFeed(10);
      setActivity(activityData);
    } catch (err) {
      console.error('Failed to load activity feed:', err);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadActivityFeed();

    const interval = setInterval(() => {
      loadDashboardData(false);
      loadActivityFeed(false);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadDashboardData, loadActivityFeed]);

  const handleRetry = () => {
    loadDashboardData();
    loadActivityFeed();
  };

  const LoadingSpinner = ({ height = 300 }: { height?: number }) => (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.i
        className="ri-loader-4-line"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: 32, color: tokens.color.muted }}
      />
    </div>
  );

  return (
    <div data-breakpoint={breakpoint}>
      {/* Header */}
      <ResponsiveStack
        direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
        align={isMobile ? 'stretch' : 'center'}
        justify="between"
        gap={{ mobile: 16, tablet: 20, desktop: 24 }}
        style={{ marginBottom: isMobile ? 24 : 32 }}
      >
        <div>
          <h2
            style={{
              color: tokens.color.text,
              fontSize: isMobile ? 22 : isTablet ? 24 : 28,
              fontWeight: 700,
              margin: '0 0 8px',
            }}
          >
            Chào mừng đến Admin Dashboard
          </h2>
          <p
            style={{
              color: tokens.color.muted,
              fontSize: isMobile ? 14 : 16,
              margin: 0,
            }}
          >
            Quản lý báo giá nội thất & thi công - Anh Thợ Xây
          </p>
        </div>

        {/* Landing Page Badge */}
        <div
          style={{
            padding: isMobile ? '10px 16px' : '12px 20px',
            background: tokens.color.primary,
            borderRadius: tokens.radius.md,
            color: '#111',
            fontWeight: 500,
            fontSize: isMobile ? 13 : 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            alignSelf: isMobile ? 'flex-start' : 'center',
          }}
        >
          <i className="ri-tv-line" style={{ fontSize: isMobile ? 16 : 18 }} />
          <div>
            <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.7 }}>
              Landing Page
            </div>
            <div>localhost:4200</div>
          </div>
        </div>
      </ResponsiveStack>

      {/* Error State */}
      {error && (
        <Card style={{ marginBottom: isMobile ? 24 : 32, borderColor: tokens.color.error }}>
          <ResponsiveStack
            direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
            align={isMobile ? 'stretch' : 'center'}
            justify="between"
            gap={12}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: tokens.color.error,
              }}
            >
              <i className="ri-error-warning-line" style={{ fontSize: 24 }} />
              <span style={{ fontSize: isMobile ? 14 : 16 }}>{error}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetry}
              style={{
                padding: '8px 16px',
                background: tokens.color.error,
                border: 'none',
                borderRadius: tokens.radius.md,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: '44px',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <i className="ri-refresh-line" />
              Thử lại
            </motion.button>
          </ResponsiveStack>
        </Card>
      )}

      {/* Active Stats Grid */}
      <CurrentStatsGrid stats={stats} loading={loading} />

      {/* Charts Row 1: Line Chart + Conversion Rate */}
      <ResponsiveGrid
        cols={{ mobile: 1, tablet: 1, desktop: 2 }}
        gap={{ mobile: 16, tablet: 20, desktop: 20 }}
        style={{ marginBottom: isMobile ? 24 : 32 }}
      >
        <div>
          <Card title="Leads theo ngày (30 ngày)" icon="ri-line-chart-line">
            {chartsLoading ? (
              <LoadingSpinner height={isMobile ? 250 : 300} />
            ) : stats ? (
              <LeadsLineChart data={stats.leads.dailyLeads} />
            ) : (
              <div
                style={{
                  height: isMobile ? 250 : 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tokens.color.muted,
                }}
              >
                Không có dữ liệu
              </div>
            )}
          </Card>
        </div>

        <Card title="Tỷ lệ chuyển đổi" icon="ri-percent-line">
          {chartsLoading ? (
            <LoadingSpinner height={isMobile ? 180 : 200} />
          ) : stats ? (
            <ConversionRateCard
              rate={stats.leads.conversionRate}
              totalLeads={stats.leads.total}
              convertedLeads={stats.leads.byStatus['CONVERTED'] || 0}
            />
          ) : null}
        </Card>
      </ResponsiveGrid>

      {/* Charts Row 2: Pie Chart + Bar Chart */}
      <ResponsiveGrid
        cols={{ mobile: 1, tablet: 2, desktop: 2 }}
        gap={{ mobile: 16, tablet: 20, desktop: 20 }}
        style={{ marginBottom: isMobile ? 24 : 32 }}
      >
        <Card title="Phân bố theo trạng thái" icon="ri-pie-chart-line">
          {chartsLoading ? (
            <LoadingSpinner height={isMobile ? 250 : 300} />
          ) : stats ? (
            <LeadsPieChart data={stats.leads.byStatus} />
          ) : null}
        </Card>

        <Card title="Phân bố theo nguồn" icon="ri-bar-chart-horizontal-line">
          {chartsLoading ? (
            <LoadingSpinner height={isMobile ? 220 : 250} />
          ) : stats ? (
            <LeadsBarChart data={stats.leads.bySource} />
          ) : null}
        </Card>
      </ResponsiveGrid>

      {/* Activity Feed and Quick Actions */}
      <ResponsiveGrid
        cols={{ mobile: 1, tablet: 1, desktop: 2 }}
        gap={{ mobile: 16, tablet: 20, desktop: 20 }}
      >
        <ActivityFeed items={activity} loading={activityLoading} />
        <ActiveQuickActions />
      </ResponsiveGrid>

      {/* Coming Soon Section - Portal Features */}
      <ComingSoonSection />
    </div>
  );
}
