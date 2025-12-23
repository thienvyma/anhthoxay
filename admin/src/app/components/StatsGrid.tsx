// StatsGrid Component - ANH THỢ XÂY Admin Dashboard
// Responsive grid layout for stats cards with skeleton loader
//
// **Feature: admin-dashboard-enhancement**
// **Requirements: 1.1, 7.1, 7.2, 7.3, 8.1**

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { tokens } from '@app/shared';
import { StatsCard } from './StatsCard';
import { ResponsiveGrid } from '../../components/responsive';
import { useResponsive } from '../../hooks/useResponsive';
import type { DashboardStats } from '../api/dashboard';

export interface StatsGridProps {
  /** Dashboard stats data */
  stats: DashboardStats | null;
  /** Loading state */
  loading?: boolean;
}

interface StatCardConfig {
  key: string;
  icon: string;
  label: string;
  color: string;
  route: string;
  getValue: (stats: DashboardStats) => number;
  getPendingCount?: (stats: DashboardStats) => number;
}

const STAT_CARDS: StatCardConfig[] = [
  {
    key: 'leads',
    icon: 'ri-contacts-book-line',
    label: 'Tổng khách hàng',
    color: tokens.color.primary,
    route: '/leads',
    getValue: (s) => s.leads.total,
    getPendingCount: (s) => s.leads.new,
  },
  {
    key: 'projects',
    icon: 'ri-building-line',
    label: 'Công trình',
    color: '#3b82f6',
    route: '/bidding',
    getValue: (s) => s.projects.total,
    getPendingCount: (s) => s.projects.pending,
  },
  {
    key: 'bids',
    icon: 'ri-auction-line',
    label: 'Bids',
    color: '#8b5cf6',
    route: '/bidding',
    getValue: (s) => s.bids.total,
    getPendingCount: (s) => s.bids.pending,
  },
  {
    key: 'contractors',
    icon: 'ri-building-2-line',
    label: 'Nhà thầu',
    color: '#f59e0b',
    route: '/contractors',
    getValue: (s) => s.contractors.total,
    getPendingCount: (s) => s.contractors.pending,
  },
  {
    key: 'interiorQuotes',
    icon: 'ri-home-smile-line',
    label: 'Báo giá nội thất',
    color: '#10b981',
    route: '/interior',
    getValue: (s) => s.interiorQuotes.total,
  },
  {
    key: 'blogPosts',
    icon: 'ri-quill-pen-line',
    label: 'Bài viết',
    color: '#ec4899',
    route: '/blog-manager',
    getValue: (s) => s.blogPosts.total,
  },
  {
    key: 'users',
    icon: 'ri-user-settings-line',
    label: 'Tài khoản',
    color: '#06b6d4',
    route: '/users',
    getValue: (s) => s.users.total,
  },
  {
    key: 'media',
    icon: 'ri-gallery-line',
    label: 'Media',
    color: '#84cc16',
    route: '/media',
    getValue: (s) => s.media.total,
  },
];

/**
 * StatsGrid displays stats cards in a responsive grid layout.
 * - Desktop (>1024px): 4 columns
 * - Tablet (768-1024px): 3 columns
 * - Mobile (<768px): 2 columns
 *
 * **Feature: admin-dashboard-enhancement**
 * **Requirements: 1.1, 7.1, 7.2, 7.3, 8.1**
 */
export function StatsGrid({ stats, loading = false }: StatsGridProps) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  return (
    <ResponsiveGrid
      cols={{ mobile: 2, tablet: 3, desktop: 4 }}
      gap={{ mobile: 12, tablet: 16, desktop: 20 }}
      style={{ marginBottom: isMobile ? 24 : 32 }}
    >
      {STAT_CARDS.map((card, index) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <StatsCard
            icon={card.icon}
            label={card.label}
            value={stats ? card.getValue(stats) : 0}
            color={card.color}
            pendingCount={stats && card.getPendingCount ? card.getPendingCount(stats) : undefined}
            onClick={() => navigate(card.route)}
            loading={loading}
          />
        </motion.div>
      ))}
    </ResponsiveGrid>
  );
}
