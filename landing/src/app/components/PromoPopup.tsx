import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';

interface PopupSettings {
  enabled: boolean;
  title: string;
  content: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  showOnce: boolean;
  delaySeconds: number;
}
const POPUP_SHOWN_KEY = 'ath_popup_shown';

export function PromoPopup() {
  const [settings, setSettings] = useState<PopupSettings | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/promo`);
        if (!res.ok) return;
        
        const data = await res.json();
        const popupData = data?.value?.popup || data?.popup;
        if (popupData && popupData.enabled) {
          setSettings(popupData);
        }
      } catch {
        console.warn('Promo settings not available');
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settings?.enabled) return;

    if (settings.showOnce && sessionStorage.getItem(POPUP_SHOWN_KEY)) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
      if (settings.showOnce) {
        sessionStorage.setItem(POPUP_SHOWN_KEY, 'true');
      }
    }, settings.delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [settings]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleButtonClick = useCallback(() => {
    if (settings?.buttonLink) {
      window.location.href = settings.buttonLink;
    }
    setIsVisible(false);
  }, [settings?.buttonLink]);

  if (!settings?.enabled) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 9998,
            }}
          />

          {/* Popup Container - Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            {/* Popup Card */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 560,
                background: 'rgba(20, 20, 24, 0.98)',
                border: '1px solid rgba(245, 211, 147, 0.25)',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), 0 0 50px rgba(245, 211, 147, 0.15)',
                pointerEvents: 'auto',
              }}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <i className="ri-close-line" />
              </button>

              {/* Image */}
              {settings.imageUrl && (
                <div style={{ width: '100%', maxHeight: 280, overflow: 'hidden' }}>
                  <img
                    src={settings.imageUrl}
                    alt={settings.title}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 280,
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div style={{ padding: 32 }}>
                <h3 style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: tokens.color.primary,
                  marginBottom: 16,
                  textAlign: 'center',
                }}>
                  {settings.title}
                </h3>

                <p style={{
                  fontSize: 16,
                  color: tokens.color.text,
                  lineHeight: 1.7,
                  textAlign: 'center',
                  marginBottom: 28,
                }}>
                  {settings.content}
                </p>

                {settings.buttonText && (
                  <button
                    onClick={handleButtonClick}
                    style={{
                      width: '100%',
                      padding: '16px 28px',
                      background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                      border: 'none',
                      borderRadius: 12,
                      color: '#111',
                      fontSize: 17,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = `0 12px 30px ${tokens.color.primary}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {settings.buttonText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
