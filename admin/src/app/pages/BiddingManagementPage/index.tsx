/**
 * Bidding Management Page - Consolidated view for all bidding-related management
 *
 * Combines: Projects, Bids, Matches, Fees, Disputes into one page with tabs
 * Settings moved to BiddingSettingsPage
 *
 * Requirements: 10.1
 */

import { useState, useMemo } from 'react';
import { ResponsiveTabs, Tab } from '../../../components/responsive';
import { ProjectsPage } from '../ProjectsPage';
import { BidsPage } from '../BidsPage';
import { MatchesPage } from '../MatchesPage';
import { FeesPage } from '../FeesPage';
import { DisputesPage } from '../DisputesPage';

type TabType = 'projects' | 'bids' | 'matches' | 'fees' | 'disputes';

export function BiddingManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('projects');

  // Build tabs with content - memoized to prevent unnecessary re-renders
  const tabs: Tab[] = useMemo(
    () => [
      {
        id: 'projects',
        label: 'Công trình',
        icon: 'ri-building-4-line',
        content: <ProjectsPage embedded />,
      },
      {
        id: 'bids',
        label: 'Bid',
        icon: 'ri-auction-line',
        content: <BidsPage embedded />,
      },
      {
        id: 'matches',
        label: 'Match',
        icon: 'ri-link',
        content: <MatchesPage embedded />,
      },
      {
        id: 'fees',
        label: 'Phí',
        icon: 'ri-money-dollar-circle-line',
        content: <FeesPage embedded />,
      },
      {
        id: 'disputes',
        label: 'Tranh chấp',
        icon: 'ri-error-warning-line',
        content: <DisputesPage embedded />,
      },
    ],
    []
  );

  return (
    <ResponsiveTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as TabType)}
      mobileMode="dropdown"
      iconOnlyMobile={false}
      testId="bidding-management-tabs"
    />
  );
}
