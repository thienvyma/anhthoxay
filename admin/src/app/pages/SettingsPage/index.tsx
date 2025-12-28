/**
 * Settings Page - System configuration with responsive tabs
 *
 * Requirements: 5.1, 5.2
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  const [isReady, setIsReady] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [promoSettings, setPromoSettings] = useState<PromoSettings>(defaultPromoSettings);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(defaultHeaderConfig);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(defaultFooterConfig);

  // Fetch settings on mount - using settingsApi
  useEffect(() => {
    let isCancelled = false;
    
    const fetchSettings = async () => {
      setIsReady(false);
      setFetchError(null);
      
      try {
        const [companyData, promoData] = await Promise.all([
          settingsApi.get('company').catch(() => null),
          settingsApi.get('promo').catch(() => null),
        ]);

        if (isCancelled) return;

        // Company settings
        if (companyData?.value && typeof companyData.value === 'object') {
          setCompanySettings((prev) => ({ ...prev, ...(companyData.value as CompanySettings) }));
        }

        // Promo settings
        if (promoData?.value && typeof promoData.value === 'object') {
          setPromoSettings((prev) => ({ ...prev, ...(promoData.value as PromoSettings) }));
        }
        
        if (!isCancelled) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        if (!isCancelled) {
          setFetchError('Không thể tải cài đặt. Vui lòng thử lại.');
          setIsReady(true); // Still show UI with defaults
        }
      }
    };

    fetchSettings();
    
    return () => {
      isCancelled = true;
    };
  }, []);

  // Stable callbacks using refs
  const showSavedMessage = useCallback((message: string) => {
    toast.success(message);
  }, [toast]);

  const handleError = useCallback((message: string) => {
    toast.error(message);
  }, [toast]);

  // Build tabs with content - all tabs are rendered but only active one is visible
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

  // Show error toast when fetch fails
  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError);
    }
  }, [fetchError, toast]);

  // Show loading state until ready
  if (!isReady) {
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
        {/* Loading indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: `3px solid ${tokens.color.border}`,
              borderTopColor: tokens.color.primary,
            }}
          />
        </div>
      </div>
    );
  }

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
