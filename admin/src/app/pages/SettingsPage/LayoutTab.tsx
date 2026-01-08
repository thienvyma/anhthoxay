import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { useResponsive } from '../../../hooks/useResponsive';
import type { HeaderConfig, FooterConfig } from './types';
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

export function LayoutTab({
  headerConfig,
  footerConfig,
  onHeaderChange,
  onFooterChange,
  onShowMessage,
  onError,
}: LayoutTabProps) {
  const { isMobile } = useResponsive();
  const [activeSubTab, setActiveSubTab] = useState<LayoutSubTab>('header');
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingFooter, setSavingFooter] = useState(false);
  const [savingMobile, setSavingMobile] = useState(false);
  const [mobileMenuConfig, setMobileMenuConfig] = useState<MobileMenuConfig>(defaultMobileMenuConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load all pages from API (dynamic, not hardcoded)
  // Throws on API failure so callers can handle appropriately
  const loadAllPages = useCallback(async () => {
    const pages = await pagesApi.list();
    return pages;
  }, []);

  // Load header/footer config from API on mount
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        setIsLoading(true);
        
        // Load all pages first
        let pages;
        try {
          pages = await loadAllPages();
        } catch (err) {
          console.error('Failed to load pages:', err);
          onError('Không thể tải danh sách trang. Vui lòng thử lại.');
          setIsLoading(false);
          return;
        }
        
        // Get home page for header/footer config (source of truth)
        const homePage = pages.find(p => p.slug === 'home');
        if (!homePage) {
          onError('Không tìm thấy trang chủ (home). Vui lòng tạo trang home trước.');
          setIsLoading(false);
          return;
        }
        
        const headerConfigStr = homePage?.headerConfig as string | undefined;
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
        
        const footerConfigStr = homePage?.footerConfig as string | undefined;
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
  }, [onHeaderChange, onFooterChange, loadAllPages]);

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

  // Save header config to ALL pages (dynamic list from API)
  const handleSaveHeader = useCallback(async () => {
    try {
      setSavingHeader(true);
      
      // Refresh pages list to get latest
      let pages;
      try {
        pages = await loadAllPages();
      } catch (err) {
        console.error('Failed to load pages for header save:', err);
        onError('Không thể tải danh sách trang. Vui lòng thử lại.');
        return;
      }
      
      const pageSlugs = pages.map(p => p.slug);
      
      // Check if there are any pages to save to
      if (pageSlugs.length === 0) {
        onError('Không có trang nào để lưu header. Vui lòng tạo ít nhất một trang.');
        return;
      }
      
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

      // Save to ALL pages with Promise.allSettled to handle partial failures
      const results = await Promise.allSettled(
        pageSlugs.map((slug) => pagesApi.update(slug, { headerConfig: headerConfigStr }))
      );
      
      // Count successes and failures
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length > 0) {
        const failedSlugs = pageSlugs.filter((_, i) => results[i].status === 'rejected');
        console.error('Failed to save header to pages:', failedSlugs, failures.map(f => (f as PromiseRejectedResult).reason));
        
        if (successes > 0) {
          onShowMessage(`⚠️ Header đã lưu cho ${successes}/${pageSlugs.length} trang.`);
          onError(`Không thể lưu cho: ${failedSlugs.join(', ')}`);
        } else {
          onError('Lưu header thất bại cho tất cả các trang.');
        }
      } else {
        onShowMessage(`✅ Header đã được lưu cho ${successes} trang!`);
      }
    } catch (error) {
      console.error('Error saving header:', error);
      onError('Lưu header thất bại.');
    } finally {
      setSavingHeader(false);
    }
  }, [headerConfig, onShowMessage, onError, loadAllPages]);

  // Save footer config to ALL pages (dynamic list from API)
  const handleSaveFooter = useCallback(async () => {
    try {
      setSavingFooter(true);
      
      // Refresh pages list to get latest
      let pages;
      try {
        pages = await loadAllPages();
      } catch (err) {
        console.error('Failed to load pages for footer save:', err);
        onError('Không thể tải danh sách trang. Vui lòng thử lại.');
        return;
      }
      
      const pageSlugs = pages.map(p => p.slug);
      
      // Check if there are any pages to save to
      if (pageSlugs.length === 0) {
        onError('Không có trang nào để lưu footer. Vui lòng tạo ít nhất một trang.');
        return;
      }
      
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

      // Save to ALL pages with Promise.allSettled to handle partial failures
      const results = await Promise.allSettled(
        pageSlugs.map((slug) => pagesApi.update(slug, { footerConfig: footerConfigStr }))
      );
      
      // Count successes and failures
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length > 0) {
        const failedSlugs = pageSlugs.filter((_, i) => results[i].status === 'rejected');
        console.error('Failed to save footer to pages:', failedSlugs, failures.map(f => (f as PromiseRejectedResult).reason));
        
        if (successes > 0) {
          onShowMessage(`⚠️ Footer đã lưu cho ${successes}/${pageSlugs.length} trang.`);
          onError(`Không thể lưu cho: ${failedSlugs.join(', ')}`);
        } else {
          onError('Lưu footer thất bại cho tất cả các trang.');
        }
      } else {
        onShowMessage(`✅ Footer đã được lưu cho ${successes} trang!`);
      }
    } catch (error) {
      console.error('Error saving footer:', error);
      onError('Lưu footer thất bại.');
    } finally {
      setSavingFooter(false);
    }
  }, [footerConfig, onShowMessage, onError, loadAllPages]);

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
      {/* Sub-tabs - Responsive: dropdown on mobile, tabs on desktop */}
      {isMobile ? (
        // Mobile: Dropdown mode
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 16px',
              backgroundColor: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.text,
              fontSize: 14,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i 
                className={SUB_TABS.find(t => t.id === activeSubTab)?.icon || ''} 
                style={{ fontSize: 18, color: tokens.color.primary }} 
              />
              {SUB_TABS.find(t => t.id === activeSubTab)?.label}
            </span>
            <i
              className={isDropdownOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
              style={{ fontSize: 20, color: tokens.color.textMuted }}
            />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                backgroundColor: tokens.color.surface,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                boxShadow: tokens.shadow.md,
                zIndex: tokens.zIndex.dropdown,
                overflow: 'hidden',
              }}
            >
              {SUB_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSubTab(tab.id);
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: tab.id === activeSubTab ? tokens.color.surfaceHover : 'transparent',
                    border: 'none',
                    color: tokens.color.text,
                    fontSize: 14,
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: '44px',
                  }}
                >
                  <i className={tab.icon} style={{ fontSize: 18 }} />
                  {tab.label}
                  {tab.id === activeSubTab && (
                    <i
                      className="ri-check-line"
                      style={{ marginLeft: 'auto', color: tokens.color.primary }}
                    />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      ) : (
        // Desktop: Tab bar with border-bottom style (matching ResponsiveTabs)
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              gap: 4,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingBottom: 4,
              borderBottom: `1px solid ${tokens.color.border}`,
            }}
          >
            {SUB_TABS.map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 24px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${isActive ? tokens.color.primary : 'transparent'}`,
                    color: isActive ? tokens.color.primary : tokens.color.text,
                    fontSize: 14,
                    fontWeight: isActive ? 500 : 400,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    minHeight: '44px',
                    transition: 'all 0.2s',
                    marginBottom: '-1px',
                  }}
                >
                  <i className={tab.icon} style={{ fontSize: 18 }} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
