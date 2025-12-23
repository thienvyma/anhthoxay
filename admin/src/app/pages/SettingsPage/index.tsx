/**
 * Settings Page - System configuration with responsive tabs
 *
 * Requirements: 5.1, 5.2
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { tokens } from '@app/shared';
import { useToast } from '../../components/Toast';
import { settingsApi } from '../../api';
import { ResponsiveTabs, Tab } from '../../../components/responsive';
import { LayoutTab } from './LayoutTab';
import { CompanyTab } from './CompanyTab';
import { PromoTab } from './PromoTab';
import { AccountTab } from './AccountTab';
import { GoogleSheetsTab } from './GoogleSheetsTab';
import {
  type SettingsTab,
  type CompanySettings,
  type PromoSettings,
  type HeaderConfig,
  type FooterConfig,
  defaultCompanySettings,
  defaultPromoSettings,
  defaultHeaderConfig,
  defaultFooterConfig,
} from './types';

export function SettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // State
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [promoSettings, setPromoSettings] = useState<PromoSettings>(defaultPromoSettings);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(defaultHeaderConfig);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(defaultFooterConfig);

  // Fetch settings on mount - using settingsApi
  // If settings don't exist, save defaults to database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [companyData, promoData] = await Promise.all([
          settingsApi.get('company').catch(() => null),
          settingsApi.get('promo').catch(() => null),
        ]);

        // Company settings
        if (companyData?.value && typeof companyData.value === 'object') {
          setCompanySettings((prev) => ({ ...prev, ...(companyData.value as CompanySettings) }));
        } else {
          // Save default company settings to database
          await settingsApi.update('company', { value: defaultCompanySettings }).catch((e) => console.warn('Failed to save default company settings:', e));
        }

        // Promo settings
        if (promoData?.value && typeof promoData.value === 'object') {
          setPromoSettings((prev) => ({ ...prev, ...(promoData.value as PromoSettings) }));
        } else {
          // Save default promo settings to database
          await settingsApi.update('promo', { value: defaultPromoSettings }).catch((e) => console.warn('Failed to save default promo settings:', e));
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Show floating toast message
  const showSavedMessage = useCallback((message: string) => {
    toast.success(message);
  }, [toast]);

  // Error handler
  const handleError = useCallback((message: string) => {
    toast.error(message);
  }, [toast]);

  // Build tabs with content
  const tabs: Tab[] = useMemo(
    () => [
      {
        id: 'account',
        label: 'Tài khoản',
        icon: 'ri-user-settings-line',
        content: (
          <AccountTab
            onShowMessage={showSavedMessage}
            onError={handleError}
          />
        ),
      },
      {
        id: 'layout',
        label: 'Layout',
        icon: 'ri-layout-line',
        content: (
          <LayoutTab
            headerConfig={headerConfig}
            footerConfig={footerConfig}
            onHeaderChange={setHeaderConfig}
            onFooterChange={setFooterConfig}
            onShowMessage={showSavedMessage}
            onError={handleError}
          />
        ),
      },
      {
        id: 'company',
        label: 'Công ty',
        icon: 'ri-building-2-line',
        content: (
          <CompanyTab
            settings={companySettings}
            onChange={setCompanySettings}
            onShowMessage={showSavedMessage}
            onError={handleError}
          />
        ),
      },
      {
        id: 'promo',
        label: 'Quảng cáo',
        icon: 'ri-megaphone-line',
        content: (
          <PromoTab
            settings={promoSettings}
            onChange={setPromoSettings}
            onShowMessage={showSavedMessage}
            onError={handleError}
          />
        ),
      },
      {
        id: 'integrations',
        label: 'Tích hợp',
        icon: 'ri-plug-line',
        content: <GoogleSheetsTab />,
      },
    ],
    [companySettings, promoSettings, headerConfig, footerConfig, showSavedMessage, handleError]
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: tokens.radius.lg,
            background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#111',
          }}>
            <i className="ri-settings-3-line" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
              Cài Đặt
            </h1>
            <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
              Quản lý cấu hình website và thông tin công ty
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Tabs */}
      <ResponsiveTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as SettingsTab)}
        mobileMode="dropdown"
        iconOnlyMobile={false}
        testId="settings-page-tabs"
      />
    </div>
  );
}
