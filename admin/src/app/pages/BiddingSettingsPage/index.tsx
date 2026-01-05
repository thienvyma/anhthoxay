/**
 * Bidding Settings Page - Consolidated view for all bidding-related settings
 *
 * Combines: General Settings, Service Fees, Regions, Notification Templates, Chat
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { ChatPage } from '../ChatPage';
import { NotificationTemplatesPage } from '../NotificationTemplatesPage';
import { RegionsPage } from '../RegionsPage';
import { GeneralSettingsTab } from './GeneralSettingsTab';
import { ServiceFeesTab } from './ServiceFeesTab';

type TabType = 'general' | 'service-fees' | 'regions' | 'templates' | 'chat';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
  description: string;
}

const tabs: Tab[] = [
  { id: 'general', label: 'Cài đặt chung', icon: 'ri-settings-3-line', description: 'Cấu hình bidding, escrow, phí' },
  { id: 'service-fees', label: 'Phí dịch vụ', icon: 'ri-money-dollar-circle-line', description: 'Quản lý các loại phí' },
  { id: 'regions', label: 'Khu vực', icon: 'ri-map-pin-line', description: 'Quản lý khu vực' },
  { id: 'templates', label: 'Mẫu thông báo', icon: 'ri-mail-settings-line', description: 'Quản lý mẫu thông báo' },
  { id: 'chat', label: 'Chat', icon: 'ri-chat-3-line', description: 'Quản lý cuộc hội thoại' },
];

export function BiddingSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettingsTab />;
      case 'service-fees':
        return <ServiceFeesTab />;
      case 'regions':
        return <RegionsPage embedded />;
      case 'templates':
        return <NotificationTemplatesPage embedded />;
      case 'chat':
        return <ChatPage embedded />;
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
          background: tokens.color.surfaceAlt,
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
                background: isActive ? `${tokens.color.primary}15` : 'transparent',
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
