/**
 * Bidding Management Page - Consolidated view for all bidding-related management
 *
 * Combines: Projects, Bids, Matches, Fees, Disputes into one page with tabs
 * Settings moved to BiddingSettingsPage
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { ProjectsPage } from '../ProjectsPage';
import { BidsPage } from '../BidsPage';
import { MatchesPage } from '../MatchesPage';
import { FeesPage } from '../FeesPage';
import { DisputesPage } from '../DisputesPage';

type TabType = 'projects' | 'bids' | 'matches' | 'fees' | 'disputes';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
  description: string;
}

const tabs: Tab[] = [
  { id: 'projects', label: 'Công trình', icon: 'ri-building-4-line', description: 'Quản lý công trình' },
  { id: 'bids', label: 'Bid', icon: 'ri-auction-line', description: 'Quản lý đề xuất thầu' },
  { id: 'matches', label: 'Match', icon: 'ri-link', description: 'Quản lý ghép nối' },
  { id: 'fees', label: 'Phí', icon: 'ri-money-dollar-circle-line', description: 'Quản lý phí giao dịch' },
  { id: 'disputes', label: 'Tranh chấp', icon: 'ri-error-warning-line', description: 'Quản lý tranh chấp' },
];

export function BiddingManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('projects');

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <ProjectsPage embedded />;
      case 'bids':
        return <BidsPage embedded />;
      case 'matches':
        return <MatchesPage embedded />;
      case 'fees':
        return <FeesPage embedded />;
      case 'disputes':
        return <DisputesPage embedded />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          padding: 8,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: isActive
                  ? `linear-gradient(135deg, ${tokens.color.primary}20, ${tokens.color.primary}10)`
                  : 'transparent',
                border: isActive ? `1px solid ${tokens.color.primary}40` : '1px solid transparent',
                borderRadius: tokens.radius.md,
                color: isActive ? tokens.color.primary : tokens.color.muted,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              title={tab.description}
            >
              <i className={tab.icon} style={{ fontSize: 18 }} />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}
