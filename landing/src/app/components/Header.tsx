import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { tokens, resolveMediaUrl } from '@app/shared';
import { useState, useRef, useEffect } from 'react';

export interface HeaderLink {
  href: string;
  label: string;
  icon?: string;
  highlight?: boolean; // Làm nổi bật link đặc biệt
}

export interface CTALink {
  text: string;
  href: string;
  icon?: string;
}

export interface HeaderConfig {
  logo?: {
    text?: string;
    icon?: string;
    imageUrl?: string;
    animateIcon?: boolean;
  };
  links?: HeaderLink[];
  ctaButton?: {
    text?: string;
    href?: string;
    icon?: string;
    // Support multiple links for dropdown
    links?: CTALink[];
  };
  showMobileMenu?: boolean;
}

interface HeaderProps {
  config?: HeaderConfig;
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  mobileMenuComponent?: React.ReactNode;
}

// Dropdown component for CTA and Auth
function Dropdown({ 
  trigger, 
  items, 
  isOpen, 
  onToggle, 
  onClose,
  align = 'right'
}: { 
  trigger: React.ReactNode; 
  items: Array<{ label: string; href: string; icon?: string; external?: boolean }>;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  align?: 'left' | 'right';
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div onClick={onToggle} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              [align]: 0,
              minWidth: 180,
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              boxShadow: tokens.shadow.lg,
              overflow: 'hidden',
              zIndex: 1000,
            }}
          >
            {items.map((item, index) => (
              item.external ? (
                <a
                  key={index}
                  href={item.href}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    color: tokens.color.text,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    borderBottom: index < items.length - 1 ? `1px solid ${tokens.color.border}` : 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = tokens.color.surfaceHover;
                    e.currentTarget.style.color = tokens.color.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = tokens.color.text;
                  }}
                >
                  {item.icon && <i className={item.icon} style={{ fontSize: 16 }} />}
                  {item.label}
                </a>
              ) : (
                <Link
                  key={index}
                  to={item.href}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    color: tokens.color.text,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    borderBottom: index < items.length - 1 ? `1px solid ${tokens.color.border}` : 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = tokens.color.surfaceHover;
                    e.currentTarget.style.color = tokens.color.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = tokens.color.text;
                  }}
                >
                  {item.icon && <i className={item.icon} style={{ fontSize: 16 }} />}
                  {item.label}
                </Link>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header({ config, mobileMenuComponent }: HeaderProps) {
  const location = useLocation();
  const [ctaDropdownOpen, setCtaDropdownOpen] = useState(false);

  // Default config - NỘI THẤT NHANH
  const defaultConfig: HeaderConfig = {
    logo: {
      text: 'Nội Thất Nhanh',
      icon: 'ri-home-smile-line',
      animateIcon: true,
    },
    links: [
      { href: '/', label: 'Trang chủ', icon: 'ri-home-line' },
      { href: '/bao-gia', label: 'Báo giá', icon: 'ri-calculator-line' },
      { href: '/noi-that', label: 'Nội thất', icon: 'ri-home-smile-line' },
      { href: '/blog', label: 'Blog', icon: 'ri-article-line' },
      { href: '/chinh-sach', label: 'Chính sách', icon: 'ri-shield-check-line' },
    ],
    ctaButton: {
      text: 'Báo giá ngay',
      icon: 'ri-price-tag-3-line',
      // Multiple links for dropdown
      links: [
        { text: 'Báo giá xây dựng', href: '/bao-gia', icon: 'ri-calculator-line' },
        { text: 'Báo giá nội thất', href: '/noi-that', icon: 'ri-home-smile-line' },
      ],
    },
    showMobileMenu: true,
  };

  const mergedConfig = { ...defaultConfig, ...config };
  const { logo, links, ctaButton, showMobileMenu } = mergedConfig;

  // Check if CTA should be dropdown (multiple links) or single link
  const ctaLinks = ctaButton?.links;
  const isCTADropdown = ctaLinks && ctaLinks.length > 1;

  const containerStyle = {
    maxWidth: 1400,
    margin: '0 auto',
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10000,
        background: 'rgba(11,12,15,0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...containerStyle,
          padding: '16px 24px',
          position: 'relative',
        }}
      >
        {/* Mobile: Empty spacer for centering logo */}
        <div className="mobile-only" style={{ width: 44 }} />

        {/* Logo - Centered on mobile */}
        <Link 
          to="/" 
          style={{ 
            textDecoration: 'none',
            position: 'relative',
            zIndex: 1,
          }}
          className="header-logo"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ color: tokens.color.primary }}
          >
          {logo?.imageUrl && logo.imageUrl.trim() ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={resolveMediaUrl(logo.imageUrl)}
                alt={logo.text || 'Nội Thất Nhanh Logo'}
                className="header-logo-img"
                style={{
                  height: 'clamp(38px, 8vw, 48px)', // Responsive height: 38px mobile min, 48px desktop
                  maxWidth: 'clamp(140px, 25vw, 200px)', // Responsive width: 140px mobile min, 200px desktop
                  objectFit: 'contain',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                color: tokens.color.primary,
                fontFamily: tokens.font.display,
                fontSize: 'clamp(18px, 3vw, 24px)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {logo?.icon && (
                <motion.i
                  className={logo.icon}
                  animate={
                    logo.animateIcon
                      ? { rotate: [0, 10, -10, 0] }
                      : undefined
                  }
                  transition={
                    logo.animateIcon
                      ? { duration: 2, repeat: Infinity, repeatDelay: 3 }
                      : undefined
                  }
                />
              )}
              {logo?.text}
            </div>
          )}
          </motion.div>
        </Link>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* Desktop Links */}
          {links?.map((item, index) => {
            const isActive = location.pathname === item.href;
            const isHighlight = item.highlight;
            
            return (
              <Link
                key={`nav-${item.href}-${index}`}
                to={item.href}
                style={{ textDecoration: 'none' }}
                className="desktop-only"
              >
                <motion.div
                  whileHover={{ y: -2, scale: isHighlight ? 1.05 : 1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    color: isHighlight 
                      ? tokens.color.primary 
                      : isActive 
                        ? tokens.color.primary 
                        : tokens.color.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 14,
                    fontWeight: isHighlight ? 600 : isActive ? 600 : 500,
                    transition: 'all 0.2s',
                    position: 'relative',
                    padding: isHighlight ? '6px 12px' : '6px 0',
                    background: isHighlight 
                      ? `linear-gradient(135deg, ${tokens.color.primary}15, ${tokens.color.accent}15)` 
                      : 'transparent',
                    border: isHighlight 
                      ? `1px solid ${tokens.color.primary}40` 
                      : 'none',
                    borderRadius: isHighlight ? tokens.radius.pill : 0,
                    boxShadow: isHighlight 
                      ? `0 2px 8px ${tokens.color.primary}20` 
                      : 'none',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = tokens.color.primary)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = isHighlight || isActive ? tokens.color.primary : tokens.color.text)
                  }
                >
                  {item.icon && (
                    <i className={item.icon} style={{ fontSize: 16 }} />
                  )}
                  {item.label}
                  {isHighlight && (
                    <motion.i 
                      className="ri-sparkling-fill" 
                      style={{ fontSize: 12, marginLeft: 2 }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {isActive && !isHighlight && (
                    <motion.div
                      layoutId="activeTab"
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: tokens.color.primary,
                        borderRadius: 2,
                      }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}

          {/* CTA Button - Single or Dropdown */}
          {ctaButton && (
            <div className="desktop-only">
              {isCTADropdown ? (
                <Dropdown
                  isOpen={ctaDropdownOpen}
                  onToggle={() => setCtaDropdownOpen(!ctaDropdownOpen)}
                  onClose={() => setCtaDropdownOpen(false)}
                  items={ctaLinks.map(link => ({
                    label: link.text,
                    href: link.href,
                    icon: link.icon,
                  }))}
                  trigger={
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                        color: '#111',
                        padding: '8px 16px',
                        borderRadius: tokens.radius.pill,
                        fontWeight: 600,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 12px rgba(245,211,147,0.3)',
                        cursor: 'pointer',
                      }}
                    >
                      {ctaButton.icon && <i className={ctaButton.icon} />}
                      {ctaButton.text}
                      <i className="ri-arrow-down-s-line" style={{ fontSize: 16 }} />
                    </motion.div>
                  }
                />
              ) : (
                <Link to={ctaButton.href || ctaLinks?.[0]?.href || '/bao-gia'} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                      color: '#111',
                      padding: '8px 16px',
                      borderRadius: tokens.radius.pill,
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(245,211,147,0.3)',
                    }}
                  >
                    {ctaButton.icon && <i className={ctaButton.icon} />}
                    {ctaButton.text || ctaLinks?.[0]?.text || 'Báo giá ngay'}
                  </motion.div>
                </Link>
              )}
            </div>
          )}

          {/* Mobile Menu */}
          {showMobileMenu && mobileMenuComponent}
        </nav>
      </div>
    </motion.header>
  );
}
