import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { useToast } from '../../components/Toast';
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
  API_URL,
  glass,
} from './types';

const TABS: Array<{ id: SettingsTab; label: string; icon: string }> = [
  { id: 'account', label: 'Tài khoản', icon: 'ri-user-settings-line' },
  { id: 'layout', label: 'Layout', icon: 'ri-layout-line' },
  { id: 'company', label: 'Công ty', icon: 'ri-building-2-line' },
  { id: 'promo', label: 'Quảng cáo', icon: 'ri-megaphone-line' },
  { id: 'integrations', label: 'Tích hợp', icon: 'ri-plug-line' },
];

export function SettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // State
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [promoSettings, setPromoSettings] = useState<PromoSettings>(defaultPromoSettings);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(defaultHeaderConfig);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(defaultFooterConfig);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [companyRes, promoRes] = await Promise.all([
          fetch(`${API_URL}/settings/company`, { credentials: 'include' }),
          fetch(`${API_URL}/settings/promo`, { credentials: 'include' }),
        ]);

        if (companyRes.ok) {
          const data = await companyRes.json();
          if (data.value) setCompanySettings((prev) => ({ ...prev, ...data.value }));
        }

        if (promoRes.ok) {
          const data = await promoRes.json();
          if (data.value) setPromoSettings((prev) => ({ ...prev, ...data.value }));
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

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 32,
        padding: 8,
        background: glass.background,
        borderRadius: tokens.radius.lg,
        border: glass.border,
      }}>
        {TABS.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === tab.id ? tokens.color.primary : 'transparent',
              border: 'none',
              borderRadius: tokens.radius.md,
              color: activeTab === tab.id ? '#111' : tokens.color.text,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <i className={tab.icon} />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'account' && (
          <AccountTab
            key="account"
            onShowMessage={showSavedMessage}
            onError={handleError}
          />
        )}

        {activeTab === 'layout' && (
          <LayoutTab
            key="layout"
            headerConfig={headerConfig}
            footerConfig={footerConfig}
            onHeaderChange={setHeaderConfig}
            onFooterChange={setFooterConfig}
            onShowMessage={showSavedMessage}
            onError={handleError}
          />
        )}

        {activeTab === 'company' && (
          <CompanyTab
            key="company"
            settings={companySettings}
            onChange={setCompanySettings}
            onShowMessage={showSavedMessage}
            onError={handleError}
          />
        )}

        {activeTab === 'promo' && (
          <PromoTab
            key="promo"
            settings={promoSettings}
            onChange={setPromoSettings}
            onShowMessage={showSavedMessage}
            onError={handleError}
          />
        )}

        {activeTab === 'integrations' && (
          <GoogleSheetsTab key="integrations" />
        )}
      </AnimatePresence>
    </div>
  );
}
