import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import type { HeaderConfig, FooterConfig } from './types';
import { glass } from './types';
import { settingsApi, pagesApi } from '../../api';
import { 
  HeaderEditor, 
  FooterEditor, 
  MobileMenuEditor, 
  defaultMobileMenuConfig 
} from './components';
import type { MobileMenuConfig } from './components';

interface LayoutTabProps {
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
  onHeaderChange: (config: HeaderConfig) => void;
  onFooterChange: (config: FooterConfig) => void;
  onShowMessage: (message: string) => void;
  onError: (message: string) => void;
}

// Sub-tabs for Layout
type LayoutSubTab = 'header' | 'footer' | 'mobile';

// ATH pages list
const ATH_PAGES = ['home', 'about', 'contact', 'blog', 'bao-gia', 'noi-that'];

export function LayoutTab({
  headerConfig,
  footerConfig,
  onHeaderChange,
  onFooterChange,
  onShowMessage,
  onError,
}: LayoutTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<LayoutSubTab>('header');
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingFooter, setSavingFooter] = useState(false);
  const [savingMobile, setSavingMobile] = useState(false);
  const [mobileMenuConfig, setMobileMenuConfig] = useState<MobileMenuConfig>(defaultMobileMenuConfig);
  const [isLoading, setIsLoading] = useState(true);

  // Load header/footer config from API on mount
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        setIsLoading(true);
        const page = await pagesApi.get('home');
        
        const headerConfigStr = page?.headerConfig as string | undefined;
        if (headerConfigStr && typeof headerConfigStr === 'string') {
          try {
            const parsed = JSON.parse(headerConfigStr);
            const adminHeaderConfig: HeaderConfig = {
              logo: parsed.logo ? {
                text: parsed.logo.text,
                icon: parsed.logo.icon,
                animateIcon: parsed.logo.animateIcon,
              } : undefined,
              navigation: parsed.links?.map((link: { href: string; label: string; icon?: string; highlight?: boolean }) => ({
                label: link.label,
                route: link.href,
                icon: link.icon || '',
                highlight: link.highlight || false,
              })),
              cta: parsed.ctaButton ? {
                text: parsed.ctaButton.text,
                link: parsed.ctaButton.icon || parsed.ctaButton.href,
                links: parsed.ctaButton.links?.map((link: { text: string; href: string; icon?: string }) => ({
                  text: link.text,
                  href: link.href,
                  icon: link.icon,
                })),
              } : undefined,
            };
            onHeaderChange(adminHeaderConfig);
          } catch (e) {
            console.warn('Failed to parse headerConfig:', e);
          }
        }
        
        const footerConfigStr = page?.footerConfig as string | undefined;
        if (footerConfigStr && typeof footerConfigStr === 'string') {
          try {
            const parsed = JSON.parse(footerConfigStr);
            const adminFooterConfig: FooterConfig = {
              brand: parsed.brand ? {
                text: parsed.brand.text,
                icon: parsed.brand.icon,
                tagline: parsed.brand.description,
              } : undefined,
              quickLinks: parsed.quickLinks?.map((link: { href: string; label: string }) => ({
                label: link.label,
                link: link.href,
              })),
              newsletter: parsed.newsletter,
              social: parsed.socialLinks?.map((s: { platform: string; url: string; icon: string }) => ({
                platform: s.platform,
                url: s.url,
                icon: s.icon,
              })),
              copyright: parsed.copyright ? { text: parsed.copyright } : undefined,
            };
            onFooterChange(adminFooterConfig);
          } catch (e) {
            console.warn('Failed to parse footerConfig:', e);
          }
        }
      } catch (err) {
        console.warn('Failed to load layout config:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConfigs();
  }, [onHeaderChange, onFooterChange]);

  // Load mobile menu config from API on mount
  useEffect(() => {
    settingsApi.get('mobileMenu')
      .then(data => {
        if (data?.value) {
          const loadedConfig = data.value as MobileMenuConfig;
          const itemsWithHighlight = loadedConfig.items?.map(item => ({
            ...item,
            highlight: item.highlight ?? false,
          })) || [];
          setMobileMenuConfig(prev => ({ 
            ...prev, 
            ...loadedConfig,
            items: itemsWithHighlight,
          }));
        } else {
          settingsApi.update('mobileMenu', { value: defaultMobileMenuConfig })
            .catch(() => { /* Silently fail */ });
        }
      })
      .catch(() => {
        settingsApi.update('mobileMenu', { value: defaultMobileMenuConfig })
          .catch(() => { /* Silently fail */ });
      });
  }, []);

  // Sub-tabs config
  const SUB_TABS: Array<{ id: LayoutSubTab; label: string; icon: string }> = [
    { id: 'header', label: 'Header', icon: 'ri-layout-top-2-line' },
    { id: 'footer', label: 'Footer', icon: 'ri-layout-bottom-2-line' },
    { id: 'mobile', label: 'Mobile Menu', icon: 'ri-smartphone-line' },
  ];

  // Helper function to ensure page exists before updating
  const ensurePageExists = useCallback(async (slug: string) => {
    try {
      await pagesApi.get(slug);
    } catch {
      const titleMap: Record<string, string> = {
        home: 'Trang chủ',
        about: 'Giới thiệu',
        contact: 'Liên hệ',
        blog: 'Blog',
        'bao-gia': 'Báo giá',
        'noi-that': 'Nội thất',
      };
      await pagesApi.create({ slug, title: titleMap[slug] || slug });
    }
  }, []);

  // Save header config to all pages
  const handleSaveHeader = useCallback(async () => {
    try {
      setSavingHeader(true);
      const landingHeaderConfig = {
        logo: {
          text: headerConfig.logo?.text || 'Anh Thợ Xây',
          icon: headerConfig.logo?.icon || 'ri-building-2-fill',
          animateIcon: headerConfig.logo?.animateIcon ?? true,
        },
        links:
          headerConfig.navigation?.map((nav) => ({
            href: nav.route,
            label: nav.label,
            icon: nav.icon || undefined,
            highlight: nav.highlight || false,
          })) || [],
        ctaButton: headerConfig.cta
          ? {
              text: headerConfig.cta.text,
              href: headerConfig.cta.links?.[0]?.href || headerConfig.cta.link,
              icon: headerConfig.cta.link?.startsWith('ri-')
                ? headerConfig.cta.link
                : 'ri-price-tag-3-line',
              links: headerConfig.cta.links?.map((link) => ({
                text: link.text,
                href: link.href,
                icon: link.icon,
              })),
            }
          : undefined,
        showMobileMenu: true,
      };
      const headerConfigStr = JSON.stringify(landingHeaderConfig);

      await Promise.all(ATH_PAGES.map((slug) => ensurePageExists(slug)));
      await Promise.all(
        ATH_PAGES.map((slug) => pagesApi.update(slug, { headerConfig: headerConfigStr }))
      );
      onShowMessage('✅ Header đã được lưu!');
    } catch (error) {
      console.error('Error saving header:', error);
      onError('Lưu header thất bại.');
    } finally {
      setSavingHeader(false);
    }
  }, [headerConfig, onShowMessage, onError, ensurePageExists]);

  // Save footer config to all pages
  const handleSaveFooter = useCallback(async () => {
    try {
      setSavingFooter(true);
      const landingFooterConfig = {
        brand: {
          text: footerConfig.brand?.text || 'Anh Thợ Xây',
          icon: footerConfig.brand?.icon || 'ri-building-2-fill',
          description: footerConfig.brand?.tagline || '',
        },
        quickLinks:
          footerConfig.quickLinks?.map((link) => ({
            href: link.link,
            label: link.label,
          })) || [],
        newsletter: footerConfig.newsletter,
        socialLinks:
          footerConfig.social?.map((s) => ({
            platform: s.platform.toLowerCase(),
            url: s.url,
            icon: s.icon,
          })) || [],
        copyright: footerConfig.copyright?.text || `© ${new Date().getFullYear()} Anh Thợ Xây`,
      };
      const footerConfigStr = JSON.stringify(landingFooterConfig);

      await Promise.all(ATH_PAGES.map((slug) => ensurePageExists(slug)));
      await Promise.all(
        ATH_PAGES.map((slug) => pagesApi.update(slug, { footerConfig: footerConfigStr }))
      );
      onShowMessage('✅ Footer đã được lưu!');
    } catch (error) {
      console.error('Error saving footer:', error);
      onError('Lưu footer thất bại.');
    } finally {
      setSavingFooter(false);
    }
  }, [footerConfig, onShowMessage, onError, ensurePageExists]);

  // Save mobile menu config
  const handleSaveMobileMenu = useCallback(async () => {
    try {
      setSavingMobile(true);
      await settingsApi.update('mobileMenu', { value: mobileMenuConfig });
      onShowMessage('✅ Mobile Menu đã được lưu!');
    } catch (error) {
      console.error('Error saving mobile menu:', error);
      onError('Lưu mobile menu thất bại.');
    } finally {
      setSavingMobile(false);
    }
  }, [mobileMenuConfig, onShowMessage, onError]);

  // Sync from Header to Mobile Menu
  const syncFromHeader = useCallback(() => {
    const newItems = headerConfig.navigation?.map(nav => ({
      label: nav.label,
      href: nav.route,
      icon: nav.icon?.replace('-line', '-fill') || 'ri-link',
      highlight: nav.highlight || false,
    })) || [];
    setMobileMenuConfig(prev => ({ ...prev, items: newItems }));
    onShowMessage('✅ Đã đồng bộ từ Header!');
  }, [headerConfig.navigation, onShowMessage]);

  // Show loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: 48,
          color: tokens.color.muted,
        }}
      >
        <i className="ri-loader-4-line" style={{ fontSize: 24, marginRight: 12, animation: 'spin 1s linear infinite' }} />
        Đang tải cấu hình...
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Sub-tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: 4,
        background: glass.background,
        borderRadius: tokens.radius.md,
        border: glass.border,
      }}>
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: activeSubTab === tab.id ? 'rgba(245,211,147,0.15)' : 'transparent',
              border: activeSubTab === tab.id ? `1px solid ${tokens.color.primary}40` : '1px solid transparent',
              borderRadius: tokens.radius.sm,
              color: activeSubTab === tab.id ? tokens.color.primary : tokens.color.muted,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header Tab Content */}
      {activeSubTab === 'header' && (
        <HeaderEditor
          headerConfig={headerConfig}
          onHeaderChange={onHeaderChange}
          onSave={handleSaveHeader}
          saving={savingHeader}
        />
      )}

      {/* Footer Tab Content */}
      {activeSubTab === 'footer' && (
        <FooterEditor
          footerConfig={footerConfig}
          onFooterChange={onFooterChange}
          onSave={handleSaveFooter}
          saving={savingFooter}
        />
      )}

      {/* Mobile Menu Tab Content */}
      {activeSubTab === 'mobile' && (
        <MobileMenuEditor
          mobileMenuConfig={mobileMenuConfig}
          onConfigChange={setMobileMenuConfig}
          onSave={handleSaveMobileMenu}
          onSyncFromHeader={syncFromHeader}
          saving={savingMobile}
        />
      )}
    </motion.div>
  );
}
