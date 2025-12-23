// PendingItemsSection Component - ANH THỢ XÂY Admin Dashboard
// Tabbed interface showing pending items requiring admin attention
//
// **Feature: admin-dashboard-enhancement**
// **Requirements: 2.1, 2.2, 2.3, 2.4, 2.5**

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { tokens } from '@app/shared';
import { Card } from './Card';
import type { PendingProject, PendingBid, PendingContractor } from '../api/dashboard';

export interface PendingItemsSectionProps {
  /** Pending projects awaiting approval */
  projects: PendingProject[];
  /** Pending bids awaiting approval */
  bids: PendingBid[];
  /** Pending contractors awaiting verification */
  contractors: PendingContractor[];
  /** Loading state */
  loading?: boolean;
}

type TabType = 'projects' | 'bids' | 'contractors';

interface TabConfig {
  key: TabType;
  label: string;
  icon: string;
  emptyMessage: string;
  emptyIcon: string;
}

const TABS: TabConfig[] = [
  {
    key: 'projects',
    label: 'Công trình chờ duyệt',
    icon: 'ri-building-line',
    emptyMessage: 'Không có công trình nào chờ duyệt',
    emptyIcon: 'ri-building-line',
  },
  {
    key: 'bids',
    label: 'Bids chờ duyệt',
    icon: 'ri-auction-line',
    emptyMessage: 'Không có bid nào chờ duyệt',
    emptyIcon: 'ri-auction-line',
  },
  {
    key: 'contractors',
    label: 'Nhà thầu chờ xác minh',
    icon: 'ri-building-2-line',
    emptyMessage: 'Không có nhà thầu nào chờ xác minh',
    emptyIcon: 'ri-building-2-line',
  },
];

/**
 * PendingItemsSection displays a tabbed interface for pending items.
 * Shows up to 5 most recent items per category.
 *
 * **Feature: admin-dashboard-enhancement**
 * **Requirements: 2.1, 2.2, 2.3, 2.4, 2.5**
 */
export function PendingItemsSection({
  projects,
  bids,
  contractors,
  loading = false,
}: PendingItemsSectionProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('projects');

  const totalPending = projects.length + bids.length + contractors.length;

  // Don't render if no pending items
  if (!loading && totalPending === 0) {
    return null;
  }

  const getCount = (tab: TabType): number => {
    switch (tab) {
      case 'projects':
        return projects.length;
      case 'bids':
        return bids.length;
      case 'contractors':
        return contractors.length;
    }
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderProjectItem = (project: PendingProject) => (
    <motion.div
      key={project.id}
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/bidding?project=${project.id}`)}
      style={{
        padding: 16,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: tokens.radius.md,
            background: 'rgba(59,130,246,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6',
            fontSize: 18,
          }}
        >
          <i className="ri-building-line" />
        </div>
        <div>
          <div style={{ color: tokens.color.text, fontWeight: 500, marginBottom: 2 }}>
            {project.code}
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 13 }}>
            {project.title} · {project.ownerName}
          </div>
        </div>
      </div>
      <div style={{ color: tokens.color.muted, fontSize: 12 }}>
        {formatDate(project.createdAt)}
      </div>
    </motion.div>
  );

  const renderBidItem = (bid: PendingBid) => (
    <motion.div
      key={bid.id}
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/bidding?bid=${bid.id}`)}
      style={{
        padding: 16,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: tokens.radius.md,
            background: 'rgba(139,92,246,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8b5cf6',
            fontSize: 18,
          }}
        >
          <i className="ri-auction-line" />
        </div>
        <div>
          <div style={{ color: tokens.color.text, fontWeight: 500, marginBottom: 2 }}>
            {bid.code}
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 13 }}>
            {bid.projectCode} · {bid.contractorName}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: tokens.color.primary, fontWeight: 600, fontSize: 14 }}>
          {formatPrice(bid.price)}
        </div>
        <div style={{ color: tokens.color.muted, fontSize: 12 }}>
          {formatDate(bid.createdAt)}
        </div>
      </div>
    </motion.div>
  );

  const renderContractorItem = (contractor: PendingContractor) => (
    <motion.div
      key={contractor.id}
      whileHover={{ x: 4 }}
      onClick={() => navigate(`/contractors?id=${contractor.id}`)}
      style={{
        padding: 16,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: tokens.color.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#111',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {contractor.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ color: tokens.color.text, fontWeight: 500, marginBottom: 2 }}>
            {contractor.name}
          </div>
          <div style={{ color: tokens.color.muted, fontSize: 13 }}>
            {contractor.email}
            {contractor.companyName && ` · ${contractor.companyName}`}
          </div>
        </div>
      </div>
      <div style={{ color: tokens.color.muted, fontSize: 12 }}>
        {formatDate(contractor.submittedAt)}
      </div>
    </motion.div>
  );

  const renderEmptyState = (tab: TabConfig) => (
    <div
      style={{
        textAlign: 'center',
        padding: 40,
        color: tokens.color.muted,
      }}
    >
      <i
        className={tab.emptyIcon}
        style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.5 }}
      />
      {tab.emptyMessage}
    </div>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: tokens.radius.md,
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: '60%',
                    height: 14,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: tokens.radius.sm,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    width: '40%',
                    height: 12,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: tokens.radius.sm,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    const currentTab = TABS.find((t) => t.key === activeTab) ?? TABS[0];

    switch (activeTab) {
      case 'projects':
        return projects.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projects.map(renderProjectItem)}
          </div>
        ) : (
          renderEmptyState(currentTab)
        );
      case 'bids':
        return bids.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bids.map(renderBidItem)}
          </div>
        ) : (
          renderEmptyState(currentTab)
        );
      case 'contractors':
        return contractors.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contractors.map(renderContractorItem)}
          </div>
        ) : (
          renderEmptyState(currentTab)
        );
    }
  };

  return (
    <Card
      title="Cần xử lý"
      icon="ri-notification-badge-line"
      style={{ marginBottom: 32 }}
    >
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          borderBottom: `1px solid ${tokens.color.border}`,
          paddingBottom: 12,
        }}
      >
        {TABS.map((tab) => {
          const count = getCount(tab.key);
          const isActive = activeTab === tab.key;

          return (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px',
                background: isActive ? `${tokens.color.primary}20` : 'transparent',
                border: `1px solid ${isActive ? tokens.color.primary : 'transparent'}`,
                borderRadius: tokens.radius.md,
                color: isActive ? tokens.color.primary : tokens.color.muted,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
              }}
            >
              <i className={tab.icon} />
              <span className="tab-label">{tab.label}</span>
              {count > 0 && (
                <span
                  style={{
                    minWidth: 20,
                    height: 20,
                    padding: '0 6px',
                    background: isActive ? tokens.color.primary : tokens.color.warning,
                    borderRadius: tokens.radius.pill,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .tab-label {
            display: none;
          }
        }
      `}</style>
    </Card>
  );
}
