/**
 * Rate Limit Dashboard Page
 *
 * Displays rate limit violations, top violating IPs and endpoints.
 *
 * **Feature: production-scalability**
 * **Requirements: 7.5**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { rateLimitApi, type RateLimitDashboard } from '../../api/rate-limit';
import { useResponsive } from '../../../hooks/useResponsive';
import { ResponsiveGrid, ResponsiveStack } from '../../../components/responsive';

// Auto-refresh interval: 30 seconds
const AUTO_REFRESH_INTERVAL = 30 * 1000;

// ============================================
// COMPONENTS
// ============================================

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const { isMobile } = useResponsive();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: isMobile ? 16 : 20,
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.lg,
      }}
    >
      <div
        style={{
          width: isMobile ? 36 : 44,
          height: isMobile ? 36 : 44,
          borderRadius: tokens.radius.md,
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontSize: isMobile ? 18 : 22,
          marginBottom: 12,
        }}
      >
        <i className={icon} />
      </div>
      <div
        style={{
          color: tokens.color.text,
          fontSize: isMobile ? 24 : 28,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {value.toLocaleString()}
      </div>
      <div style={{ color: tokens.color.muted, fontSize: isMobile ? 12 : 13 }}>
        {label}
      </div>
    </motion.div>
  );
}

function TopViolatingIPsTable({
  data,
  loading,
}: {
  data: { ip: string; count: number }[];
  loading: boolean;
}) {
  const { isMobile } = useResponsive();

  if (loading) {
    return (
      <div
        style={{
          height: 200,
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
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: tokens.color.muted,
        }}
      >
        <i
          className="ri-shield-check-line"
          style={{ fontSize: 48, marginBottom: 16, display: 'block' }}
        />
        <p style={{ margin: 0 }}>Không có vi phạm rate limit trong giờ qua</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: isMobile ? 13 : 14,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                borderBottom: `1px solid ${tokens.color.border}`,
                color: tokens.color.muted,
                fontWeight: 500,
              }}
            >
              #
            </th>
            <th
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                borderBottom: `1px solid ${tokens.color.border}`,
                color: tokens.color.muted,
                fontWeight: 500,
              }}
            >
              IP Address
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: '12px 16px',
                borderBottom: `1px solid ${tokens.color.border}`,
                color: tokens.color.muted,
                fontWeight: 500,
              }}
            >
              Violations
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.ip}>
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  color: tokens.color.muted,
                }}
              >
                {index + 1}
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  color: tokens.color.text,
                  fontFamily: 'monospace',
                }}
              >
                {item.ip}
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  textAlign: 'right',
                }}
              >
                <span
                  style={{
                    padding: '4px 12px',
                    background:
                      item.count >= 10
                        ? `${tokens.color.error}20`
                        : item.count >= 5
                          ? `${tokens.color.warning}20`
                          : `${tokens.color.info}20`,
                    color:
                      item.count >= 10
                        ? tokens.color.error
                        : item.count >= 5
                          ? tokens.color.warning
                          : tokens.color.info,
                    borderRadius: tokens.radius.pill,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {item.count}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopViolatingEndpointsTable({
  data,
  loading,
}: {
  data: { path: string; count: number; uniqueIPs: number }[];
  loading: boolean;
}) {
  const { isMobile } = useResponsive();

  if (loading) {
    return (
      <div
        style={{
          height: 200,
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
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: tokens.color.muted,
        }}
      >
        <i
          className="ri-route-line"
          style={{ fontSize: 48, marginBottom: 16, display: 'block' }}
        />
        <p style={{ margin: 0 }}>Không có endpoint nào bị vi phạm</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: isMobile ? 13 : 14,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                borderBottom: `1px solid ${tokens.color.border}`,
                color: tokens.color.muted,
                fontWeight: 500,
              }}
            >
              Endpoint
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: '12px 16px',
                borderBottom: `1px solid ${tokens.color.border}`,
                color: tokens.color.muted,
                fontWeight: 500,
              }}
            >
              Violations
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: '12px 16px',
                borderBottom: `1px solid ${tokens.color.border}`,
                color: tokens.color.muted,
                fontWeight: 500,
              }}
            >
              Unique IPs
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.path}>
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  color: tokens.color.text,
                  fontFamily: 'monospace',
                  fontSize: 13,
                }}
              >
                {item.path}
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  textAlign: 'right',
                  color: tokens.color.text,
                  fontWeight: 600,
                }}
              >
                {item.count}
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${tokens.color.border}`,
                  textAlign: 'right',
                  color: tokens.color.muted,
                }}
              >
                {item.uniqueIPs}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertThresholdInfo({
  threshold,
}: {
  threshold: { threshold: number; windowMinutes: number; description: string };
}) {
  return (
    <div
      style={{
        padding: 16,
        background: `${tokens.color.warning}10`,
        border: `1px solid ${tokens.color.warning}30`,
        borderRadius: tokens.radius.md,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <i
        className="ri-alarm-warning-line"
        style={{ fontSize: 20, color: tokens.color.warning, marginTop: 2 }}
      />
      <div>
        <div
          style={{
            color: tokens.color.text,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          Alert Threshold
        </div>
        <div style={{ color: tokens.color.muted, fontSize: 13 }}>
          {threshold.description}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export function RateLimitPage() {
  const [dashboard, setDashboard] = useState<RateLimitDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { isMobile, isTablet, breakpoint } = useResponsive();

  const loadDashboard = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const data = await rateLimitApi.getDashboard();
      setDashboard(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load rate limit dashboard:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard(false);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const handleRefresh = () => {
    loadDashboard();
  };

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
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <i className="ri-shield-line" style={{ color: tokens.color.primary }} />
            Rate Limit Monitoring
          </h2>
          <p
            style={{
              color: tokens.color.muted,
              fontSize: isMobile ? 14 : 16,
              margin: 0,
            }}
          >
            Theo dõi vi phạm rate limit và phát hiện tấn công
          </p>
        </div>

        <ResponsiveStack
          direction={{ mobile: 'row', tablet: 'row', desktop: 'row' }}
          align="center"
          gap={12}
        >
          {lastUpdated && (
            <span style={{ color: tokens.color.muted, fontSize: 13 }}>
              Cập nhật: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: tokens.color.primary,
              border: 'none',
              borderRadius: tokens.radius.md,
              color: '#111',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            <motion.i
              className="ri-refresh-line"
              animate={loading ? { rotate: 360 } : {}}
              transition={loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            />
            Làm mới
          </motion.button>
        </ResponsiveStack>
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
              onClick={handleRefresh}
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

      {/* Summary Cards */}
      <ResponsiveGrid
        cols={{ mobile: 2, tablet: 4, desktop: 4 }}
        gap={{ mobile: 12, tablet: 16, desktop: 20 }}
        style={{ marginBottom: isMobile ? 24 : 32 }}
      >
        <SummaryCard
          icon="ri-error-warning-line"
          label="Tổng vi phạm"
          value={dashboard?.summary.totalViolations ?? 0}
          color={tokens.color.error}
        />
        <SummaryCard
          icon="ri-time-line"
          label="Giờ qua"
          value={dashboard?.summary.lastHourViolations ?? 0}
          color={tokens.color.warning}
        />
        <SummaryCard
          icon="ri-route-line"
          label="Endpoints"
          value={dashboard?.summary.uniqueEndpoints ?? 0}
          color={tokens.color.info}
        />
        <SummaryCard
          icon="ri-computer-line"
          label="Unique IPs"
          value={dashboard?.summary.uniqueIPs ?? 0}
          color={tokens.color.primary}
        />
      </ResponsiveGrid>

      {/* Alert Threshold Info */}
      {dashboard?.alertThreshold && (
        <div style={{ marginBottom: isMobile ? 24 : 32 }}>
          <AlertThresholdInfo threshold={dashboard.alertThreshold} />
        </div>
      )}

      {/* Tables */}
      <ResponsiveGrid
        cols={{ mobile: 1, tablet: 1, desktop: 2 }}
        gap={{ mobile: 16, tablet: 20, desktop: 20 }}
      >
        <Card title="Top Violating IPs" icon="ri-computer-line">
          <TopViolatingIPsTable
            data={dashboard?.topViolatingIPs ?? []}
            loading={loading}
          />
        </Card>

        <Card title="Top Violating Endpoints" icon="ri-route-line">
          <TopViolatingEndpointsTable
            data={dashboard?.topViolatingEndpoints ?? []}
            loading={loading}
          />
        </Card>
      </ResponsiveGrid>
    </div>
  );
}

export default RateLimitPage;
