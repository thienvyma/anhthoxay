import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { IconPicker } from '../../components/IconPicker';
import type { HeaderConfig, FooterConfig } from './types';
import { glass } from './types';
import { settingsApi, pagesApi } from '../../api';

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

// Mobile Menu Config Type
interface MobileMenuConfig {
  items: Array<{ label: string; href: string; icon: string }>;
  showLogo: boolean;
  showCTA: boolean;
  ctaText: string;
  ctaLink: string;
  socialLinks: Array<{ platform: string; url: string; icon: string }>;
}

const defaultMobileMenuConfig: MobileMenuConfig = {
  items: [
    { label: 'Trang chủ', href: '/', icon: 'ri-home-fill' },
    { label: 'Báo giá', href: '/bao-gia', icon: 'ri-calculator-fill' },
    { label: 'Nội thất', href: '/noi-that', icon: 'ri-home-smile-fill' },
    { label: 'Blog', href: '/blog', icon: 'ri-article-fill' },
    { label: 'Chính sách', href: '/chinh-sach', icon: 'ri-shield-check-fill' },
  ],
  showLogo: true,
  showCTA: true,
  ctaText: 'Liên hệ ngay',
  ctaLink: 'tel:+84123456789',
  socialLinks: [
    { platform: 'Facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' },
    { platform: 'Youtube', url: 'https://youtube.com', icon: 'ri-youtube-fill' },
    { platform: 'Tiktok', url: 'https://tiktok.com', icon: 'ri-tiktok-fill' },
  ],
};

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
        // Load from 'home' page as the source of truth
        const page = await pagesApi.get('home');
        
        const headerConfigStr = page?.headerConfig as string | undefined;
        if (headerConfigStr && typeof headerConfigStr === 'string') {
          try {
            const parsed = JSON.parse(headerConfigStr);
            // Convert from landing format to admin format
            const adminHeaderConfig: HeaderConfig = {
              logo: parsed.logo ? {
                text: parsed.logo.text,
                icon: parsed.logo.icon,
                animateIcon: parsed.logo.animateIcon,
              } : undefined,
              navigation: parsed.links?.map((link: { href: string; label: string; icon?: string }) => ({
                label: link.label,
                route: link.href,
                icon: link.icon,
              })),
              cta: parsed.ctaButton ? {
                text: parsed.ctaButton.text,
                link: parsed.ctaButton.icon || parsed.ctaButton.href,
                // Parse links array for dropdown support
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
            // Convert from landing format to admin format
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
          setMobileMenuConfig(prev => ({ ...prev, ...(data.value as MobileMenuConfig) }));
        }
      })
      .catch(err => {
        console.warn('Failed to load mobile menu config:', err);
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
      // Page doesn't exist, create it
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
            icon: nav.icon,
          })) || [],
        ctaButton: headerConfig.cta
          ? {
              text: headerConfig.cta.text,
              href: headerConfig.cta.links?.[0]?.href || headerConfig.cta.link,
              icon: headerConfig.cta.link?.startsWith('ri-')
                ? headerConfig.cta.link
                : 'ri-price-tag-3-line',
              // Include links array for dropdown support
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

      // Ensure all pages exist before updating
      await Promise.all(ATH_PAGES.map((slug) => ensurePageExists(slug)));

      // Update all pages
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

      // Ensure all pages exist before updating
      await Promise.all(ATH_PAGES.map((slug) => ensurePageExists(slug)));

      // Update all pages
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
      // Save to settings API
      await settingsApi.update('mobileMenu', { key: 'mobileMenu', value: mobileMenuConfig });
      onShowMessage('✅ Mobile Menu đã được lưu!');
    } catch (error) {
      console.error('Error saving mobile menu:', error);
      onError('Lưu mobile menu thất bại.');
    } finally {
      setSavingMobile(false);
    }
  }, [mobileMenuConfig, onShowMessage, onError]);

  // Navigation helpers for Header
  const addNavItem = useCallback(() => {
    const newNav = [...(headerConfig.navigation || []), { label: 'Link mới', route: '/', icon: 'ri-link' }];
    onHeaderChange({ ...headerConfig, navigation: newNav });
  }, [headerConfig, onHeaderChange]);

  const removeNavItem = useCallback((index: number) => {
    const newNav = headerConfig.navigation?.filter((_, i) => i !== index) || [];
    onHeaderChange({ ...headerConfig, navigation: newNav });
  }, [headerConfig, onHeaderChange]);

  const updateNavItem = useCallback((index: number, field: string, value: string) => {
    const newNav = headerConfig.navigation?.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ) || [];
    onHeaderChange({ ...headerConfig, navigation: newNav });
  }, [headerConfig, onHeaderChange]);

  // Quick links helpers for Footer
  const addQuickLink = useCallback(() => {
    const newLinks = [...(footerConfig.quickLinks || []), { label: 'Link mới', link: '/' }];
    onFooterChange({ ...footerConfig, quickLinks: newLinks });
  }, [footerConfig, onFooterChange]);

  const removeQuickLink = useCallback((index: number) => {
    const newLinks = footerConfig.quickLinks?.filter((_, i) => i !== index) || [];
    onFooterChange({ ...footerConfig, quickLinks: newLinks });
  }, [footerConfig, onFooterChange]);

  const updateQuickLink = useCallback((index: number, field: string, value: string) => {
    const newLinks = footerConfig.quickLinks?.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ) || [];
    onFooterChange({ ...footerConfig, quickLinks: newLinks });
  }, [footerConfig, onFooterChange]);

  // Social links helpers for Footer
  const addSocialLink = useCallback(() => {
    const newSocial = [...(footerConfig.social || []), { platform: 'Facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' }];
    onFooterChange({ ...footerConfig, social: newSocial });
  }, [footerConfig, onFooterChange]);

  const removeSocialLink = useCallback((index: number) => {
    const newSocial = footerConfig.social?.filter((_, i) => i !== index) || [];
    onFooterChange({ ...footerConfig, social: newSocial });
  }, [footerConfig, onFooterChange]);

  const updateSocialLink = useCallback((index: number, field: string, value: string) => {
    const newSocial = footerConfig.social?.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ) || [];
    onFooterChange({ ...footerConfig, social: newSocial });
  }, [footerConfig, onFooterChange]);

  // Mobile menu helpers
  const addMobileMenuItem = useCallback(() => {
    setMobileMenuConfig(prev => ({
      ...prev,
      items: [...prev.items, { label: 'Link mới', href: '/', icon: 'ri-link' }],
    }));
  }, []);

  const removeMobileMenuItem = useCallback((index: number) => {
    setMobileMenuConfig(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const updateMobileMenuItem = useCallback((index: number, field: string, value: string) => {
    setMobileMenuConfig(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  }, []);

  const addMobileSocialLink = useCallback(() => {
    setMobileMenuConfig(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: 'Facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' }],
    }));
  }, []);

  const removeMobileSocialLink = useCallback((index: number) => {
    setMobileMenuConfig(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  }, []);

  const updateMobileSocialLink = useCallback((index: number, field: string, value: string) => {
    setMobileMenuConfig(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  }, []);

  // Sync from Header to Mobile Menu
  const syncFromHeader = useCallback(() => {
    const newItems = headerConfig.navigation?.map(nav => ({
      label: nav.label,
      href: nav.route,
      icon: nav.icon?.replace('-line', '-fill') || 'ri-link',
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
        <Card icon="ri-layout-top-2-line" title="Header Configuration" subtitle="Logo, navigation và CTA button">
          {/* Logo */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Logo</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Input
                label="Text"
                value={headerConfig.logo?.text || ''}
                onChange={(v) => onHeaderChange({ ...headerConfig, logo: { ...headerConfig.logo, text: v } })}
                placeholder="Anh Thợ Xây"
                fullWidth
              />
              <IconPicker
                label="Icon"
                value={headerConfig.logo?.icon || ''}
                onChange={(v) => onHeaderChange({ ...headerConfig, logo: { ...headerConfig.logo, icon: v } })}
              />
            </div>
          </div>

          {/* Navigation */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>Navigation Links</h4>
              <Button variant="secondary" size="small" onClick={addNavItem}>
                <i className="ri-add-line" /> Thêm
              </Button>
            </div>
            {headerConfig.navigation?.map((nav, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: 8,
                marginBottom: 8,
                padding: 12,
                background: glass.background,
                borderRadius: tokens.radius.md,
              }}>
                <Input value={nav.label} onChange={(v) => updateNavItem(i, 'label', v)} placeholder="Label" fullWidth />
                <Input value={nav.route} onChange={(v) => updateNavItem(i, 'route', v)} placeholder="/route" fullWidth />
                <IconPicker value={nav.icon || ''} onChange={(v) => updateNavItem(i, 'icon', v)} />
                <Button variant="danger" size="small" onClick={() => removeNavItem(i)}>
                  <i className="ri-delete-bin-line" />
                </Button>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>CTA Button</h4>
            <p style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 12 }}>
              Nếu có nhiều hơn 1 link, nút sẽ hiển thị dạng dropdown. Nếu chỉ có 1 link, sẽ truy cập trực tiếp.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              <Input
                label="Text hiển thị"
                value={headerConfig.cta?.text || ''}
                onChange={(v) => onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, text: v } })}
                placeholder="Báo giá ngay"
                fullWidth
              />
              <IconPicker
                label="Icon"
                value={headerConfig.cta?.link?.startsWith('ri-') ? headerConfig.cta.link : 'ri-price-tag-3-line'}
                onChange={(v) => onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, link: v } })}
              />
            </div>
            
            {/* CTA Links */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>Links trong CTA</span>
                <Button variant="secondary" size="small" onClick={() => {
                  const newLinks = [...(headerConfig.cta?.links || []), { text: 'Link mới', href: '/', icon: 'ri-link' }];
                  onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, links: newLinks } });
                }}>
                  <i className="ri-add-line" /> Thêm link
                </Button>
              </div>
              {(headerConfig.cta?.links || []).map((link, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: 8,
                  marginBottom: 8,
                  padding: 12,
                  background: glass.background,
                  borderRadius: tokens.radius.md,
                }}>
                  <Input 
                    value={link.text} 
                    onChange={(v) => {
                      const newLinks = headerConfig.cta?.links?.map((l, idx) => idx === i ? { ...l, text: v } : l) || [];
                      onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, links: newLinks } });
                    }} 
                    placeholder="Text" 
                    fullWidth 
                  />
                  <Input 
                    value={link.href} 
                    onChange={(v) => {
                      const newLinks = headerConfig.cta?.links?.map((l, idx) => idx === i ? { ...l, href: v } : l) || [];
                      onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, links: newLinks } });
                    }} 
                    placeholder="/link" 
                    fullWidth 
                  />
                  <IconPicker 
                    value={link.icon || ''} 
                    onChange={(v) => {
                      const newLinks = headerConfig.cta?.links?.map((l, idx) => idx === i ? { ...l, icon: v } : l) || [];
                      onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, links: newLinks } });
                    }} 
                  />
                  <Button variant="danger" size="small" onClick={() => {
                    const newLinks = headerConfig.cta?.links?.filter((_, idx) => idx !== i) || [];
                    onHeaderChange({ ...headerConfig, cta: { ...headerConfig.cta, links: newLinks } });
                  }}>
                    <i className="ri-delete-bin-line" />
                  </Button>
                </div>
              ))}
              {(!headerConfig.cta?.links || headerConfig.cta.links.length === 0) && (
                <div style={{ 
                  padding: 16, 
                  background: glass.background, 
                  borderRadius: tokens.radius.md,
                  textAlign: 'center',
                  color: tokens.color.muted,
                  fontSize: 13,
                }}>
                  Chưa có link nào. Thêm ít nhất 1 link để nút CTA hoạt động.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={handleSaveHeader} disabled={savingHeader}>
              <i className={savingHeader ? 'ri-loader-4-line' : 'ri-save-line'} />
              {savingHeader ? 'Đang lưu...' : 'Lưu Header'}
            </Button>
          </div>
        </Card>
      )}

      {/* Footer Tab Content */}
      {activeSubTab === 'footer' && (
        <Card icon="ri-layout-bottom-2-line" title="Footer Configuration" subtitle="Brand, links và social media">
          {/* Brand */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Brand</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Input
                label="Name"
                value={footerConfig.brand?.text || ''}
                onChange={(v) => onFooterChange({ ...footerConfig, brand: { ...footerConfig.brand, text: v } })}
                placeholder="Anh Thợ Xây"
                fullWidth
              />
              <IconPicker
                label="Icon"
                value={footerConfig.brand?.icon || ''}
                onChange={(v) => onFooterChange({ ...footerConfig, brand: { ...footerConfig.brand, icon: v } })}
              />
            </div>
            <Input
              label="Tagline"
              value={footerConfig.brand?.tagline || ''}
              onChange={(v) => onFooterChange({ ...footerConfig, brand: { ...footerConfig.brand, tagline: v } })}
              placeholder="Dịch vụ cải tạo nhà chuyên nghiệp"
              fullWidth
              style={{ marginTop: 12 }}
            />
          </div>

          {/* Quick Links */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>Quick Links</h4>
              <Button variant="secondary" size="small" onClick={addQuickLink}>
                <i className="ri-add-line" /> Thêm
              </Button>
            </div>
            {footerConfig.quickLinks?.map((link, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: 8,
                marginBottom: 8,
                padding: 12,
                background: glass.background,
                borderRadius: tokens.radius.md,
              }}>
                <Input value={link.label} onChange={(v) => updateQuickLink(i, 'label', v)} placeholder="Label" fullWidth />
                <Input value={link.link} onChange={(v) => updateQuickLink(i, 'link', v)} placeholder="/link" fullWidth />
                <Button variant="danger" size="small" onClick={() => removeQuickLink(i)}>
                  <i className="ri-delete-bin-line" />
                </Button>
              </div>
            ))}
          </div>

          {/* Social Links */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>Social Links</h4>
              <Button variant="secondary" size="small" onClick={addSocialLink}>
                <i className="ri-add-line" /> Thêm
              </Button>
            </div>
            {footerConfig.social?.map((social, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: 8,
                marginBottom: 8,
                padding: 12,
                background: glass.background,
                borderRadius: tokens.radius.md,
              }}>
                <Input value={social.platform} onChange={(v) => updateSocialLink(i, 'platform', v)} placeholder="Platform" fullWidth />
                <Input value={social.url} onChange={(v) => updateSocialLink(i, 'url', v)} placeholder="URL" fullWidth />
                <IconPicker value={social.icon} onChange={(v) => updateSocialLink(i, 'icon', v)} />
                <Button variant="danger" size="small" onClick={() => removeSocialLink(i)}>
                  <i className="ri-delete-bin-line" />
                </Button>
              </div>
            ))}
          </div>

          {/* Copyright */}
          <Input
            label="Copyright"
            value={footerConfig.copyright?.text || ''}
            onChange={(v) => onFooterChange({ ...footerConfig, copyright: { text: v } })}
            placeholder={`© ${new Date().getFullYear()} Anh Thợ Xây`}
            fullWidth
            style={{ marginBottom: 24 }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={handleSaveFooter} disabled={savingFooter}>
              <i className={savingFooter ? 'ri-loader-4-line' : 'ri-save-line'} />
              {savingFooter ? 'Đang lưu...' : 'Lưu Footer'}
            </Button>
          </div>
        </Card>
      )}

      {/* Mobile Menu Tab Content */}
      {activeSubTab === 'mobile' && (
        <Card icon="ri-smartphone-line" title="Mobile Menu Configuration" subtitle="Menu hiển thị trên điện thoại và tablet">
          {/* Sync Button */}
          <div style={{ marginBottom: 24, padding: 16, background: 'rgba(245,211,147,0.1)', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.primary}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
                  <i className="ri-refresh-line" style={{ marginRight: 8 }} />
                  Đồng bộ từ Header
                </p>
                <p style={{ color: tokens.color.muted, fontSize: 12, margin: '4px 0 0' }}>
                  Copy navigation links từ Header sang Mobile Menu
                </p>
              </div>
              <Button variant="secondary" size="small" onClick={syncFromHeader}>
                <i className="ri-refresh-line" /> Đồng bộ
              </Button>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>Menu Items</h4>
              <Button variant="secondary" size="small" onClick={addMobileMenuItem}>
                <i className="ri-add-line" /> Thêm
              </Button>
            </div>
            {mobileMenuConfig.items.map((item, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: 8,
                marginBottom: 8,
                padding: 12,
                background: glass.background,
                borderRadius: tokens.radius.md,
              }}>
                <Input value={item.label} onChange={(v) => updateMobileMenuItem(i, 'label', v)} placeholder="Label" fullWidth />
                <Input value={item.href} onChange={(v) => updateMobileMenuItem(i, 'href', v)} placeholder="/link" fullWidth />
                <IconPicker value={item.icon} onChange={(v) => updateMobileMenuItem(i, 'icon', v)} />
                <Button variant="danger" size="small" onClick={() => removeMobileMenuItem(i)}>
                  <i className="ri-delete-bin-line" />
                </Button>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>CTA Button</h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.color.text, marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={mobileMenuConfig.showCTA}
                onChange={(e) => setMobileMenuConfig(prev => ({ ...prev, showCTA: e.target.checked }))}
                style={{ width: 18, height: 18 }}
              />
              Hiển thị nút CTA
            </label>
            {mobileMenuConfig.showCTA && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <Input
                  label="Text"
                  value={mobileMenuConfig.ctaText}
                  onChange={(v) => setMobileMenuConfig(prev => ({ ...prev, ctaText: v }))}
                  placeholder="Liên hệ ngay"
                  fullWidth
                />
                <Input
                  label="Link"
                  value={mobileMenuConfig.ctaLink}
                  onChange={(v) => setMobileMenuConfig(prev => ({ ...prev, ctaLink: v }))}
                  placeholder="tel:+84123456789"
                  fullWidth
                />
              </div>
            )}
          </div>

          {/* Social Links */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>Social Links</h4>
              <Button variant="secondary" size="small" onClick={addMobileSocialLink}>
                <i className="ri-add-line" /> Thêm
              </Button>
            </div>
            {mobileMenuConfig.socialLinks.map((social, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: 8,
                marginBottom: 8,
                padding: 12,
                background: glass.background,
                borderRadius: tokens.radius.md,
              }}>
                <Input value={social.platform} onChange={(v) => updateMobileSocialLink(i, 'platform', v)} placeholder="Platform" fullWidth />
                <Input value={social.url} onChange={(v) => updateMobileSocialLink(i, 'url', v)} placeholder="URL" fullWidth />
                <IconPicker value={social.icon} onChange={(v) => updateMobileSocialLink(i, 'icon', v)} />
                <Button variant="danger" size="small" onClick={() => removeMobileSocialLink(i)}>
                  <i className="ri-delete-bin-line" />
                </Button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={handleSaveMobileMenu} disabled={savingMobile}>
              <i className={savingMobile ? 'ri-loader-4-line' : 'ri-save-line'} />
              {savingMobile ? 'Đang lưu...' : 'Lưu Mobile Menu'}
            </Button>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
