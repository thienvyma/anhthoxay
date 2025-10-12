import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { tokens } from '@app/shared';
import { useState, useEffect } from 'react';

interface MobileMenuProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export function MobileMenu({ currentRoute, onNavigate }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

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

  const menuItems = [
    { route: '/', label: 'Trang chủ', icon: 'ri-home-fill' },
    { route: '/menu', label: 'Thực đơn', icon: 'ri-restaurant-fill' },
    { route: '/about', label: 'Về chúng tôi', icon: 'ri-information-fill' },
    { route: '/gallery', label: 'Thư viện', icon: 'ri-gallery-fill' },
    { route: '/contact', label: 'Liên hệ', icon: 'ri-phone-fill' },
  ];

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
        style={{
          display: 'none',
          background: 'transparent',
          border: 'none',
          color: tokens.color.text,
          fontSize: 28,
          cursor: 'pointer',
          padding: 8,
          zIndex: 10001,
          position: 'relative',
        }}
        className="mobile-menu-toggle"
      >
        <motion.i
          className={isOpen ? 'ri-close-line' : 'ri-menu-line'}
          animate={{ rotate: isOpen ? 180 : 0 }}
        />
      </motion.button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                zIndex: 10002,
                backdropFilter: 'blur(10px)',
              }}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '80%',
                maxWidth: 400,
                background: 'rgba(11,12,15,0.98)',
                backdropFilter: 'blur(40px)',
                borderLeft: `1px solid ${tokens.color.border}`,
                zIndex: 10003,
                display: 'flex',
                flexDirection: 'column',
                padding: '80px 32px 32px',
              }}
            >
              {/* Logo/Brand */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  color: tokens.color.primary,
                  fontFamily: tokens.font.display,
                  fontSize: 32,
                  marginBottom: 48,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <i className="ri-restaurant-2-fill" />
                Restaurant
              </motion.div>

              {/* Navigation Items */}
              <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {menuItems.map((item, index) => {
                  const isActive = currentRoute === item.route;
                  return (
                    <Link
                      key={item.route}
                      to={item.route}
                      onClick={() => setIsOpen(false)}
                      style={{ textDecoration: 'none' }}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileHover={{ x: 8 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: '20px 24px',
                          borderRadius: tokens.radius.lg,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          fontSize: 18,
                          fontWeight: 500,
                          color: isActive ? tokens.color.primary : tokens.color.text,
                          background: isActive ? 'rgba(245,211,147,0.1)' : 'transparent',
                          border: isActive ? `1px solid ${tokens.color.primary}40` : '1px solid transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        <i className={item.icon} style={{ fontSize: 24 }} />
                        {item.label}
                        {isActive && (
                          <motion.i
                            className="ri-arrow-right-line"
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            style={{ marginLeft: 'auto' }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  borderTop: `1px solid ${tokens.color.border}`,
                  paddingTop: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <a
                  href="tel:+84123456789"
                  style={{
                    padding: '16px 24px',
                    borderRadius: tokens.radius.lg,
                    background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                    color: '#111',
                    textDecoration: 'none',
                    fontWeight: 600,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    fontSize: 16,
                  }}
                >
                  <i className="ri-phone-fill" />
                  Gọi đặt bàn ngay
                </a>

                {/* Social Links */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                  {['facebook', 'instagram', 'youtube', 'twitter'].map((social) => (
                    <motion.a
                      key={social}
                      href={`https://${social}.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.2, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${tokens.color.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: tokens.color.muted,
                        fontSize: 20,
                        textDecoration: 'none',
                      }}
                    >
                      <i className={`ri-${social}-fill`} />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>
        {`
          @media (max-width: 768px) {
            .mobile-menu-toggle {
              display: block !important;
            }
          }
        `}
      </style>
    </>
  );
}


