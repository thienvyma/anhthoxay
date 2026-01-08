import { Link } from 'react-router-dom';
import { tokens, API_URL } from '@app/shared';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface MobileMenuItem {
  href: string;
  label: string;
  icon?: string;
  highlight?: boolean;
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

const defaultConfig: MobileMenuConfig = {
  items: [
    { href: '/', label: 'Trang chủ', icon: 'ri-home-fill' },
    { href: '/bao-gia', label: 'Báo giá', icon: 'ri-calculator-fill' },
    { href: '/noi-that', label: 'Nội thất', icon: 'ri-home-smile-fill' },
    { href: '/blog', label: 'Blog', icon: 'ri-article-fill' },
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

  useEffect(() => {
    setMounted(true);
    
    fetch(`${API_URL}/settings/mobileMenu`)
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        const responseData = json?.data || json;
        const configValue = responseData?.value;
        
        if (configValue && typeof configValue === 'object') {
          setConfig(prev => ({
            ...prev,
            ...configValue,
            items: configValue.items?.length > 0 ? configValue.items : prev.items,
            socialLinks: configValue.socialLinks?.length > 0 ? configValue.socialLinks : prev.socialLinks,
          }));
        }
      })
      .catch(() => { /* Silent fail, use default config */ });
  }, []);

  const items = menuItems?.length ? menuItems : config.items?.length ? config.items : defaultConfig.items;

  useEffect(() => { setIsOpen(false); }, [currentRoute]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = () => setIsOpen(false);

  const menuOverlay = isOpen ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
      <div onClick={handleClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
      }} />

      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '85%', maxWidth: 380,
        background: '#0c0c10',
        borderLeft: `1px solid ${tokens.color.border}`,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.25s ease-out',
      }}>
        {/* Close Button */}
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleClose} type="button" style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: tokens.color.text, fontSize: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Logo */}
        <div style={{
          padding: '0 24px 24px',
          color: tokens.color.primary,
          fontFamily: tokens.font.display,
          fontSize: 26,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <i className="ri-home-smile-fill" />
          Nội Thất Nhanh
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>
          {items.map((item, idx) => {
            const isActive = currentRoute === item.href;
            const isHighlight = item.highlight === true;
            
            // Highlight item - Style giống PC (subtle gradient background, border, sparkling icon)
            if (isHighlight) {
              return (
                <Link key={`${item.href}-${idx}`} to={item.href} onClick={handleClose} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px', marginBottom: 8, borderRadius: 12,
                  textDecoration: 'none', fontSize: 16, fontWeight: 600,
                  color: tokens.color.primary,
                  background: `linear-gradient(135deg, ${tokens.color.primary}15, ${tokens.color.accent}15)`,
                  border: `1px solid ${tokens.color.primary}40`,
                  boxShadow: `0 2px 8px ${tokens.color.primary}20`,
                }}>
                  <i className={item.icon || 'ri-star-fill'} style={{ fontSize: 20 }} />
                  <span>{item.label}</span>
                  <i className="ri-sparkling-fill" style={{ 
                    marginLeft: 'auto', 
                    fontSize: 14,
                    animation: 'sparkle 2s ease-in-out infinite',
                  }} />
                </Link>
              );
            }
            
            // Normal item
            return (
              <Link key={`${item.href}-${idx}`} to={item.href} onClick={handleClose} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px', marginBottom: 6, borderRadius: 12,
                textDecoration: 'none', fontSize: 16,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? tokens.color.primary : tokens.color.text,
                background: isActive ? 'rgba(245,211,147,0.12)' : 'rgba(255,255,255,0.03)',
                border: isActive ? `1px solid ${tokens.color.primary}40` : '1px solid transparent',
              }}>
                <i className={item.icon || 'ri-arrow-right-line'} style={{ fontSize: 20 }} />
                <span>{item.label}</span>
                {isActive && <i className="ri-checkbox-circle-fill" style={{ marginLeft: 'auto', fontSize: 16 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={{ padding: '20px 16px', borderTop: `1px solid ${tokens.color.border}` }}>
          {config.showCTA && (
            <a href={config.ctaLink} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px 20px', borderRadius: 12, marginBottom: 16,
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              color: '#111', textDecoration: 'none', fontWeight: 600, fontSize: 15,
            }}>
              <i className="ri-phone-fill" />
              {config.ctaText}
            </a>
          )}

          {config.socialLinks.length > 0 && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {config.socialLinks.map((social, idx) => (
                <a key={`social-${idx}`} href={social.url} target="_blank" rel="noopener noreferrer" style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${tokens.color.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: tokens.color.muted, fontSize: 18, textDecoration: 'none',
                }}>
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
      <button onClick={() => setIsOpen(p => !p)} className="mobile-menu-toggle"
        aria-label={isOpen ? 'Đóng menu' : 'Mở menu'} type="button">
        <i className={isOpen ? 'ri-close-line' : 'ri-menu-line'} />
      </button>
      {mounted && createPortal(menuOverlay, document.body)}
    </>
  );
}
