/**
 * Interior Page - Main interior management page with tab navigation
 *
 * Tabs: Developers, Developments, Buildings, Units, Layouts, Packages,
 *       Furniture, Surcharges, Settings, RoomTypes, Quotes, Sync
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useState, useMemo } from 'react';
import { ResponsiveTabs, Tab } from '../../../components/responsive';
import { DevelopersTab } from './DevelopersTab';
import { DevelopmentsTab } from './DevelopmentsTab';
import { BuildingsTab } from './BuildingsTab';
import { BuildingUnitsTab } from './BuildingUnitsTab';
import { LayoutsTab } from './LayoutsTab';
import { PackagesTab } from './PackagesTab';
import { FurnitureCatalogTab } from './FurnitureCatalogTab';
import { SurchargesTab } from './SurchargesTab';
import { QuoteSettingsTab } from './QuoteSettingsTab';
import { RoomTypesTab } from './RoomTypesTab';
import { QuotesTab } from './QuotesTab';
import { SyncTab } from './SyncTab';

type TabType =
  | 'developers'
  | 'developments'
  | 'buildings'
  | 'units'
  | 'layouts'
  | 'packages'
  | 'furniture'
  | 'surcharges'
  | 'settings'
  | 'room-types'
  | 'quotes'
  | 'sync';

export function InteriorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('developers');

  // Build tabs with content - memoized to prevent unnecessary re-renders
  const tabs: Tab[] = useMemo(
    () => [
      {
        id: 'developers',
        label: 'Chủ đầu tư',
        icon: 'ri-building-4-line',
        content: <DevelopersTab />,
      },
      {
        id: 'developments',
        label: 'Dự án',
        icon: 'ri-community-line',
        content: <DevelopmentsTab />,
      },
      {
        id: 'buildings',
        label: 'Tòa nhà',
        icon: 'ri-building-line',
        content: <BuildingsTab />,
      },
      {
        id: 'units',
        label: 'Căn hộ',
        icon: 'ri-home-4-line',
        content: <BuildingUnitsTab />,
      },
      {
        id: 'layouts',
        label: 'Layout',
        icon: 'ri-layout-4-line',
        content: <LayoutsTab />,
      },
      {
        id: 'packages',
        label: 'Gói nội thất',
        icon: 'ri-gift-line',
        content: <PackagesTab />,
      },
      {
        id: 'furniture',
        label: 'Catalog',
        icon: 'ri-sofa-line',
        content: <FurnitureCatalogTab />,
      },
      {
        id: 'surcharges',
        label: 'Phụ phí',
        icon: 'ri-add-circle-line',
        content: <SurchargesTab />,
      },
      {
        id: 'settings',
        label: 'Cài đặt',
        icon: 'ri-settings-3-line',
        content: <QuoteSettingsTab />,
      },
      {
        id: 'room-types',
        label: 'Loại phòng',
        icon: 'ri-door-line',
        content: <RoomTypesTab />,
      },
      {
        id: 'quotes',
        label: 'Báo giá',
        icon: 'ri-file-list-3-line',
        content: <QuotesTab />,
      },
      {
        id: 'sync',
        label: 'Đồng bộ',
        icon: 'ri-refresh-line',
        content: <SyncTab />,
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
      testId="interior-page-tabs"
    />
  );
}
