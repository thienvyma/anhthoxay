// QuickActions Component - NỘI THẤT NHANH Admin Dashboard
// Action buttons with icons and optional badges for quick navigation
//
// **Feature: admin-dashboard-enhancement**
// **Requirements: 5.1, 5.2, 5.3, 5.4**

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../../theme';
import { Card } from './Card';
import type { DashboardStats } from '../api/dashboard';

export interface QuickActionsProps {
  /** Dashboard stats for badge counts */
  stats: DashboardStats | null;
}

interface QuickActionConfig {
  key: string;
  icon: string;
  label: string;
  route: string;
  color: string;
  getBadgeCount?: (stats: DashboardStats) => number;
}

const QUICK_ACTIONS: QuickActionConfig[] = [
  {
    key: 'manage-leads',
    icon: 'ri-contacts-book-line',
    label: 'Quản lý khách hàng',
    route: '/leads',
    color: tokens.color.primary,
    getBadgeCount: (s) => s.leads.new,
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
    key: 'manage-furniture',
    icon: 'ri-sofa-line',
    label: 'Quản lý nội thất',
    route: '/furniture',
    color: tokens.color.info,
  },
  {
    key: 'manage-users',
    icon: 'ri-user-settings-line',
    label: 'Quản lý tài khoản',
    route: '/users',
    color: '#06b6d4',
  },
  {
    key: 'settings',
    icon: 'ri-settings-3-line',
    label: 'Cài đặt',
    route: '/settings',
    color: tokens.color.warning,
  },
];

/**
 * QuickActions displays action buttons with icons and optional badges.
 * Provides quick navigation to frequently used admin functions.
 *
 * **Feature: admin-dashboard-enhancement**
 * **Requirements: 5.1, 5.2, 5.3, 5.4**
 */
export function QuickActions({ stats }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <Card title="Thao tác nhanh" icon="ri-flashlight-line">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {QUICK_ACTIONS.map((action, index) => {
          const badgeCount = stats && action.getBadgeCount ? action.getBadgeCount(stats) : 0;

          return (
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
                position: 'relative',
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${action.color}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = tokens.color.border;
              }}
            >
              {/* Badge */}
              {badgeCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
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
                    boxShadow: `0 2px 8px ${tokens.color.warning}40`,
                  }}
                >
                  {badgeCount}
                </motion.div>
              )}

              {/* Icon */}
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

              {/* Label */}
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
          );
        })}
      </div>
    </Card>
  );
}
