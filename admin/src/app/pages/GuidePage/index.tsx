/**
 * GuidePage - User Guide with Tab Navigation
 *
 * Provides comprehensive documentation for Admin and Manager users
 * with 7 tabs covering different aspects of the system.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 1.1, 1.2, 1.3**
 */

import { useState, useMemo } from 'react';
import { tokens } from '../../../theme';
import { useResponsive } from '../../../hooks/useResponsive';
import { ResponsiveTabs, Tab } from '../../../components/responsive';
import {
  OverviewTab,
  LeadsTab,
  BlogTab,
  ProjectsTab,
  ContractorsTab,
  SettingsTab,
  ApiKeysGuideTab,
} from './tabs';

type GuideTabId = 'overview' | 'leads' | 'blog' | 'projects' | 'contractors' | 'settings' | 'api-keys';

export function GuidePage() {
  const { isMobile, breakpoint } = useResponsive();
  const [activeTab, setActiveTab] = useState<GuideTabId>('overview');

  // Build tabs with content
  const tabs: Tab[] = useMemo(
    () => [
      {
        id: 'overview',
        label: 'Tổng quan',
        icon: 'ri-home-4-line',
        content: <OverviewTab />,
      },
      {
        id: 'leads',
        label: 'Quản lý Leads',
        icon: 'ri-contacts-book-line',
        content: <LeadsTab />,
      },
      {
        id: 'blog',
        label: 'Quản lý Blog',
        icon: 'ri-quill-pen-line',
        content: <BlogTab />,
      },
      {
        id: 'projects',
        label: 'Quản lý Công trình',
        icon: 'ri-building-line',
        content: <ProjectsTab />,
      },
      {
        id: 'contractors',
        label: 'Quản lý Nhà thầu',
        icon: 'ri-user-star-line',
        content: <ContractorsTab />,
      },
      {
        id: 'settings',
        label: 'Cài đặt',
        icon: 'ri-settings-3-line',
        content: <SettingsTab />,
      },
      {
        id: 'api-keys',
        label: 'API Keys',
        icon: 'ri-key-2-line',
        content: <ApiKeysGuideTab />,
      },
    ],
    []
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px' : '24px 20px' }} data-breakpoint={breakpoint}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: tokens.radius.lg,
              background: `${tokens.color.primary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: tokens.color.primary,
            }}
          >
            <i className="ri-book-open-line" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
              Hướng dẫn sử dụng
            </h1>
            <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
              Tài liệu hướng dẫn chi tiết cho Admin và Manager
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Tabs */}
      <ResponsiveTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as GuideTabId)}
        mobileMode="dropdown"
        iconOnlyMobile={false}
        testId="guide-page-tabs"
      />
    </div>
  );
}

export default GuidePage;
