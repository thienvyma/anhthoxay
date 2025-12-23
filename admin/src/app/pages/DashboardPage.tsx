/**
 * DashboardPage - ANH THỢ XÂY Admin Dashboard
 * Main dashboard page with comprehensive system statistics
 *
 * Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.4
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { Card } from '../components/Card';
import { StatsGrid } from '../components/StatsGrid';
import { PendingItemsSection } from '../components/PendingItemsSection';
import { ActivityFeed } from '../components/ActivityFeed';
import { QuickActions } from '../components/QuickActions';
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

// Auto-refresh interval: 5 minutes
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

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

    // Auto-refresh every 5 minutes
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

  // Loading spinner component
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
            Quản lý website Anh Thợ Xây - Dịch vụ cải tạo nhà chuyên nghiệp
          </p>
        </div>

        {/* Landing Page Badge */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(245,211,147,0.4)',
              '0 0 0 10px rgba(245,211,147,0)',
              '0 0 0 0 rgba(245,211,147,0)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            padding: isMobile ? '10px 16px' : '12px 20px',
            background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            borderRadius: tokens.radius.md,
            color: '#111',
            fontWeight: 600,
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
        </motion.div>
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

      {/* Stats Grid */}
      <StatsGrid stats={stats} loading={loading} />

      {/* Pending Items Section */}
      {stats && (
        <PendingItemsSection
          projects={stats.pendingItems.projects}
          bids={stats.pendingItems.bids}
          contractors={stats.pendingItems.contractors}
          loading={loading}
        />
      )}

      {/* Charts Row 1: Line Chart + Conversion Rate */}
      <ResponsiveGrid
        cols={{ mobile: 1, tablet: 1, desktop: 2 }}
        gap={{ mobile: 16, tablet: 20, desktop: 20 }}
        style={{ marginBottom: isMobile ? 24 : 32 }}
      >
        {/* Line Chart - takes 2/3 on desktop */}
        <div style={{ gridColumn: isMobile || isTablet ? 'span 1' : 'span 1' }}>
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

        {/* Conversion Rate Card */}
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
        <QuickActions stats={stats} />
      </ResponsiveGrid>
    </div>
  );
}
