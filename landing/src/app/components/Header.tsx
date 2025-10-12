import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { tokens } from '@app/shared';

export interface HeaderLink {
  href: string;
  label: string;
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
  };
  showMobileMenu?: boolean;
}

interface HeaderProps {
  config?: HeaderConfig;
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  mobileMenuComponent?: React.ReactNode;
}

export function Header({ config, mobileMenuComponent }: HeaderProps) {
  const { scrollY } = useScroll();
  const location = useLocation();
  
  // Scroll-based animations
  const headerBg = useTransform(
    scrollY,
    [0, 100],
    ['rgba(11,12,15,0.4)', 'rgba(11,12,15,0.98)']
  );
  const headerBlur = useTransform(scrollY, [0, 100], [8, 20]);
  const headerShadow = useTransform(
    scrollY,
    [0, 100],
    ['0 0 0 rgba(0,0,0,0)', '0 4px 24px rgba(0,0,0,0.4)']
  );

  // Default config
  const defaultConfig: HeaderConfig = {
    logo: {
      text: 'Restaurant',
      icon: 'ri-restaurant-2-line',
      animateIcon: true,
    },
    links: [
      { href: '/menu', label: 'Menu', icon: 'ri-restaurant-line' },
      { href: '/about', label: 'About', icon: 'ri-information-line' },
      { href: '/gallery', label: 'Gallery', icon: 'ri-image-line' },
      { href: '/blog', label: 'Blog', icon: 'ri-article-line' },
      { href: '/contact', label: 'Contact', icon: 'ri-map-pin-line' },
    ],
    ctaButton: {
      text: 'Đặt bàn ngay',
      href: 'tel:+84123456789',
      icon: 'ri-phone-line',
    },
    showMobileMenu: true,
  };

  const mergedConfig = { ...defaultConfig, ...config };
  const { logo, links, ctaButton, showMobileMenu } = mergedConfig;

  const containerStyle = {
    maxWidth: 1400,
    margin: '0 auto',
  };

  return (
    <motion.header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10000,
        background: headerBg,
        backdropFilter: `blur(${headerBlur}px)`,
        boxShadow: headerShadow,
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
          padding: '20px 24px',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ color: tokens.color.primary }}
          >
          {logo?.imageUrl && logo.imageUrl.trim() ? (
            /* Image Logo */
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={`http://localhost:4202${logo.imageUrl}`}
                alt={logo.text || 'Restaurant Logo'}
                style={{
                  maxHeight: 50,
                  maxWidth: 200,
                  objectFit: 'contain',
                }}
              />
            </div>
          ) : (
            /* Text + Icon Logo (Fallback) */
            <div
              style={{
                color: tokens.color.primary,
                fontFamily: tokens.font.display,
                fontSize: tokens.font.size.h3,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
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
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {/* Desktop Links */}
          {links?.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                style={{ textDecoration: 'none' }}
                className="desktop-only"
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  style={{
                    color: isActive ? tokens.color.primary : tokens.color.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 15,
                    fontWeight: isActive ? 600 : 500,
                    transition: 'color 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = tokens.color.primary)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = isActive ? tokens.color.primary : tokens.color.text)
                  }
                >
                  {item.icon && (
                    <i className={item.icon} style={{ fontSize: 18 }} />
                  )}
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      style={{
                        position: 'absolute',
                        bottom: -8,
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

          {/* CTA Button */}
          {ctaButton && (
            <motion.a
              href={ctaButton.href}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                color: '#111',
                padding: '8px 20px',
                borderRadius: tokens.radius.pill,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(245,211,147,0.3)',
              }}
              className="desktop-only"
            >
              {ctaButton.icon && <i className={ctaButton.icon} />}
              {ctaButton.text}
            </motion.a>
          )}

          {/* Mobile Menu */}
          {showMobileMenu && mobileMenuComponent}
        </nav>
      </div>
    </motion.header>
  );
}

