/**
 * Interior Page - Main interior management page with tab navigation
 *
 * Tabs: Developers, Developments, Buildings, Units, Layouts, Packages,
 *       Furniture, Surcharges, Settings, RoomTypes, Quotes
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
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
  | 'quotes';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
  description: string;
}

const tabs: Tab[] = [
  { id: 'developers', label: 'Chủ đầu tư', icon: 'ri-building-4-line', description: 'Quản lý chủ đầu tư' },
  { id: 'developments', label: 'Dự án', icon: 'ri-community-line', description: 'Quản lý dự án' },
  { id: 'buildings', label: 'Tòa nhà', icon: 'ri-building-line', description: 'Quản lý tòa nhà' },
  { id: 'units', label: 'Căn hộ', icon: 'ri-home-4-line', description: 'Quản lý căn hộ theo trục' },
  { id: 'layouts', label: 'Layout', icon: 'ri-layout-4-line', description: 'Quản lý bản vẽ layout' },
  { id: 'packages', label: 'Gói nội thất', icon: 'ri-gift-line', description: 'Quản lý gói nội thất' },
  { id: 'furniture', label: 'Catalog', icon: 'ri-sofa-line', description: 'Catalog đồ nội thất' },
  { id: 'surcharges', label: 'Phụ phí', icon: 'ri-add-circle-line', description: 'Quản lý phụ phí' },
  { id: 'settings', label: 'Cài đặt', icon: 'ri-settings-3-line', description: 'Cấu hình báo giá' },
  { id: 'room-types', label: 'Loại phòng', icon: 'ri-door-line', description: 'Quản lý loại phòng' },
  { id: 'quotes', label: 'Báo giá', icon: 'ri-file-list-3-line', description: 'Lịch sử báo giá' },
];

export function InteriorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('developers');

  const renderContent = () => {
    switch (activeTab) {
      case 'developers':
        return <DevelopersTab />;
      case 'developments':
        return <DevelopmentsTab />;
      case 'buildings':
        return <BuildingsTab />;
      case 'units':
        return <BuildingUnitsTab />;
      case 'layouts':
        return <LayoutsTab />;
      case 'packages':
        return <PackagesTab />;
      case 'furniture':
        return <FurnitureCatalogTab />;
      case 'surcharges':
        return <SurchargesTab />;
      case 'settings':
        return <QuoteSettingsTab />;
      case 'room-types':
        return <RoomTypesTab />;
      case 'quotes':
        return <QuotesTab />;
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
          gap: 6,
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
                gap: 6,
                padding: '10px 14px',
                background: isActive
                  ? `linear-gradient(135deg, ${tokens.color.primary}20, ${tokens.color.primary}10)`
                  : 'transparent',
                border: isActive ? `1px solid ${tokens.color.primary}40` : '1px solid transparent',
                borderRadius: tokens.radius.md,
                color: isActive ? tokens.color.primary : tokens.color.muted,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              title={tab.description}
            >
              <i className={tab.icon} style={{ fontSize: 16 }} />
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
