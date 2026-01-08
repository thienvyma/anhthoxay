// ActivityFeed Component - NỘI THẤT NHANH Admin Dashboard
// Displays recent activity items with icons, titles, descriptions, and timestamps
//
// **Feature: admin-dashboard-enhancement**
// **Requirements: 4.1, 4.2, 4.3, 4.4**

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../../theme';
import { Card } from './Card';
import type { ActivityItem, ActivityType } from '../api/dashboard';

export interface ActivityFeedProps {
  /** Activity items to display */
  items: ActivityItem[];
  /** Loading state */
  loading?: boolean;
}

interface ActivityConfig {
  icon: string;
  color: string;
  bgColor: string;
  getRoute: (entityId: string) => string;
}

const ACTIVITY_CONFIG: Record<ActivityType, ActivityConfig> = {
  LEAD: {
    icon: 'ri-contacts-book-line',
    color: tokens.color.primary,
    bgColor: `${tokens.color.primary}20`,
    getRoute: () => '/leads',
  },
  PROJECT: {
    icon: 'ri-building-line',
    color: tokens.color.info,
    bgColor: 'rgba(59,130,246,0.2)',
    getRoute: (id) => `/bidding?project=${id}`,
  },
  BID: {
    icon: 'ri-auction-line',
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.2)',
    getRoute: (id) => `/bidding?bid=${id}`,
  },
  CONTRACTOR: {
    icon: 'ri-building-2-line',
    color: tokens.color.warning,
    bgColor: 'rgba(245,158,11,0.2)',
    getRoute: (id) => `/contractors?id=${id}`,
  },
};

/**
 * Formats a date string to relative time (e.g., "5 phút trước", "2 giờ trước")
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'Vừa xong';
  } else if (diffMin < 60) {
    return `${diffMin} phút trước`;
  } else if (diffHour < 24) {
    return `${diffHour} giờ trước`;
  } else if (diffDay < 7) {
    return `${diffDay} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}

/**
 * ActivityFeed displays recent activity items from multiple sources.
 * Shows icon, title, description, and timestamp for each item.
 *
 * **Feature: admin-dashboard-enhancement**
 * **Requirements: 4.1, 4.2, 4.3, 4.4**
 */
export function ActivityFeed({ items, loading = false }: ActivityFeedProps) {
  const navigate = useNavigate();

  const renderLoadingState = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: tokens.radius.md,
              background: tokens.color.surfaceHover,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: '70%',
                height: 14,
                background: tokens.color.surfaceHover,
                borderRadius: tokens.radius.sm,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                width: '50%',
                height: 12,
                background: tokens.color.surfaceHover,
                borderRadius: tokens.radius.sm,
              }}
            />
          </div>
          <div
            style={{
              width: 60,
              height: 12,
              background: tokens.color.surfaceHover,
              borderRadius: tokens.radius.sm,
            }}
          />
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div
      style={{
        textAlign: 'center',
        padding: 40,
        color: tokens.color.muted,
      }}
    >
      <i
        className="ri-history-line"
        style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.5 }}
      />
      Chưa có hoạt động nào
    </div>
  );

  const renderActivityItem = (item: ActivityItem, index: number) => {
    const config = ACTIVITY_CONFIG[item.type];

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ x: 4 }}
        onClick={() => navigate(config.getRoute(item.entityId))}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: 12,
          marginLeft: -12,
          marginRight: -12,
          borderRadius: tokens.radius.md,
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = tokens.color.surfaceAlt;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: tokens.radius.md,
            background: config.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: config.color,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          <i className={config.icon} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: tokens.color.text,
              fontWeight: 500,
              fontSize: 14,
              marginBottom: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </div>
          <div
            style={{
              color: tokens.color.muted,
              fontSize: 13,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.description}
          </div>
        </div>

        {/* Timestamp */}
        <div
          style={{
            color: tokens.color.muted,
            fontSize: 12,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {formatRelativeTime(item.createdAt)}
        </div>
      </motion.div>
    );
  };

  return (
    <Card title="Hoạt động gần đây" icon="ri-history-line">
      {loading ? (
        renderLoadingState()
      ) : items.length === 0 ? (
        renderEmptyState()
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((item, index) => renderActivityItem(item, index))}
        </div>
      )}
    </Card>
  );
}
