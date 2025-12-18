import { Link } from 'react-router-dom';
import { tokens, API_URL } from '@app/shared';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface MobileMenuItem {
  href: string;
  label: string;
  icon?: string;
}

interface MobileMenuConfig {
  items: MobileMenuItem[];
  showLogo: boolean;
  showCTA: boolean;
  ctaText: string;
  ctaLink: string;
  socialLinks: Array<{ platform: string; url: string; icon: string }>;
}

interface MobileMenuProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  menuItems?: MobileMenuItem[];
}

// Default config
const defaultConfig: MobileMenuConfig = {
  items: [
    { href: '/', label: 'Trang chủ', icon: 'ri-home-fill' },
    { href: '/bao-gia', label: 'Báo giá', icon: 'ri-calculator-fill' },
    { href: '/blog', label: 'Blog', icon: 'ri-article-fill' },
    { href: '/chinh-sach', label: 'Chính sách', icon: 'ri-shield-check-fill' },
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

export function MobileMenu({ currentRoute, menuItems }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<MobileMenuConfig>(defaultConfig);

  // Load config from API on mount
  useEffect(() => {
    setMounted(true);
    
    // Fetch mobile menu config from settings API
    fetch(`${API_URL}/settings/mobileMenu`)
      .then(res => {
        if (res.ok) return res.json();
        // If 404, use default config
        return null;
      })
      .then(json => {
        // Unwrap standardized response format { success: true, data: T }
        const data = json ? (json.data || json) : null;
        if (data?.value) {
          // Merge with defaults to ensure all fields exist
          setConfig(prev => ({
            ...prev,
            ...data.value,
            items: data.value.items?.length > 0 ? data.value.items : prev.items,
            socialLinks: data.value.socialLinks?.length > 0 ? data.value.socialLinks : prev.socialLinks,
          }));
        }
      })
      .catch(err => {
        console.warn('Failed to load mobile menu config, using defaults:', err);
      });
  }, []);

  // Use provided menu items, or config items, or defaults
  // Priority: props > API config > defaults
  // ALWAYS ensure we have items - never show empty menu
  let items: MobileMenuItem[];
  if (menuItems && menuItems.length > 0) {
    items = menuItems;
  } else if (config.items && config.items.length > 0) {
    items = config.items;
  } else {
    items = defaultConfig.items;
  }
  
  // Safety check - if still empty, use hardcoded defaults
  if (!items || items.length === 0) {
    items = [
      { href: '/', label: 'Trang chủ', icon: 'ri-home-fill' },
      { href: '/bao-gia', label: 'Báo giá', icon: 'ri-calculator-fill' },
      { href: '/blog', label: 'Blog', icon: 'ri-article-fill' },
      { href: '/chinh-sach', label: 'Chính sách', icon: 'ri-shield-check-fill' },
    ];
  }

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [currentRoute]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Menu overlay content
  const menuOverlay = isOpen ? (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Menu Panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '85%',
          maxWidth: 380,
          background: '#0c0c10',
          borderLeft: `1px solid ${tokens.color.border}`,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* Close Button */}
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            type="button"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: tokens.color.text,
              fontSize: 22,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Logo */}
        <div
          style={{
            padding: '0 24px 24px',
            color: tokens.color.primary,
            fontFamily: tokens.font.display,
            fontSize: 26,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <i className="ri-building-2-fill" />
          Anh Thợ Xây
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>
          {items.map((item) => {
            const isActive = currentRoute === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 16px',
                  marginBottom: 6,
                  borderRadius: 12,
                  textDecoration: 'none',
                  fontSize: 16,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? tokens.color.primary : tokens.color.text,
                  background: isActive ? 'rgba(245,211,147,0.12)' : 'rgba(255,255,255,0.03)',
                  border: isActive ? `1px solid ${tokens.color.primary}40` : '1px solid transparent',
                }}
              >
                <i className={item.icon || 'ri-arrow-right-line'} style={{ fontSize: 20 }} />
                <span>{item.label}</span>
                {isActive && (
                  <i className="ri-checkbox-circle-fill" style={{ marginLeft: 'auto', fontSize: 16 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={{ padding: '20px 16px', borderTop: `1px solid ${tokens.color.border}` }}>
          {/* CTA Button */}
          {config.showCTA && (
            <a
              href={config.ctaLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '14px 20px',
                borderRadius: 12,
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                color: '#111',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 15,
                marginBottom: 16,
              }}
            >
              <i className="ri-phone-fill" />
              {config.ctaText}
            </a>
          )}

          {/* Social Links */}
          {config.socialLinks.length > 0 && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {config.socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${tokens.color.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tokens.color.muted,
                    fontSize: 18,
                    textDecoration: 'none',
                  }}
                >
                  <i className={social.icon} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={handleToggle}
        className="mobile-menu-toggle"
        aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
        type="button"
      >
        <i className={isOpen ? 'ri-close-line' : 'ri-menu-line'} />
      </button>

      {/* Portal to body */}
      {mounted && createPortal(menuOverlay, document.body)}
    </>
  );
}
