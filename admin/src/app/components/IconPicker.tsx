import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../theme';

// Danh sách icon phổ biến cho dự án xây dựng/cải tạo nhà
const ICON_CATEGORIES = {
  'Xây dựng': [
    'ri-building-2-line', 'ri-building-2-fill', 'ri-building-line', 'ri-building-fill',
    'ri-home-line', 'ri-home-fill', 'ri-home-2-line', 'ri-home-2-fill',
    'ri-home-4-line', 'ri-home-4-fill', 'ri-home-gear-line', 'ri-home-gear-fill',
    'ri-hammer-line', 'ri-hammer-fill', 'ri-tools-line', 'ri-tools-fill',
    'ri-paint-brush-line', 'ri-paint-brush-fill', 'ri-paint-line', 'ri-paint-fill',
    'ri-ruler-line', 'ri-ruler-fill', 'ri-ruler-2-line', 'ri-ruler-2-fill',
    'ri-scissors-line', 'ri-scissors-fill', 'ri-scissors-cut-line', 'ri-scissors-cut-fill',
  ],
  'Vật liệu': [
    'ri-drop-line', 'ri-drop-fill', 'ri-water-flash-line', 'ri-water-flash-fill',
    'ri-lightbulb-line', 'ri-lightbulb-fill', 'ri-lightbulb-flash-line', 'ri-lightbulb-flash-fill',
    'ri-plug-line', 'ri-plug-fill', 'ri-plug-2-line', 'ri-plug-2-fill',
    'ri-flashlight-line', 'ri-flashlight-fill', 'ri-battery-charge-line', 'ri-battery-charge-fill',
    'ri-layout-grid-line', 'ri-layout-grid-fill', 'ri-grid-line', 'ri-grid-fill',
  ],
  'Liên hệ': [
    'ri-phone-line', 'ri-phone-fill', 'ri-smartphone-line', 'ri-smartphone-fill',
    'ri-mail-line', 'ri-mail-fill', 'ri-mail-send-line', 'ri-mail-send-fill',
    'ri-map-pin-line', 'ri-map-pin-fill', 'ri-map-pin-2-line', 'ri-map-pin-2-fill',
    'ri-time-line', 'ri-time-fill', 'ri-calendar-line', 'ri-calendar-fill',
    'ri-user-line', 'ri-user-fill', 'ri-team-line', 'ri-team-fill',
    'ri-customer-service-line', 'ri-customer-service-fill', 'ri-customer-service-2-line', 'ri-customer-service-2-fill',
  ],
  'Mạng xã hội': [
    'ri-facebook-fill', 'ri-facebook-line', 'ri-facebook-circle-fill', 'ri-facebook-circle-line',
    'ri-instagram-fill', 'ri-instagram-line', 'ri-youtube-fill', 'ri-youtube-line',
    'ri-tiktok-fill', 'ri-tiktok-line', 'ri-twitter-x-fill', 'ri-twitter-x-line',
    'ri-linkedin-fill', 'ri-linkedin-line', 'ri-whatsapp-fill', 'ri-whatsapp-line',
    'ri-telegram-fill', 'ri-telegram-line', 'ri-messenger-fill', 'ri-messenger-line',
  ],
  'Hành động': [
    'ri-arrow-right-line', 'ri-arrow-right-fill', 'ri-arrow-right-circle-line', 'ri-arrow-right-circle-fill',
    'ri-arrow-right-s-line', 'ri-arrow-right-s-fill', 'ri-external-link-line', 'ri-external-link-fill',
    'ri-download-line', 'ri-download-fill', 'ri-upload-line', 'ri-upload-fill',
    'ri-share-line', 'ri-share-fill', 'ri-share-forward-line', 'ri-share-forward-fill',
    'ri-send-plane-line', 'ri-send-plane-fill', 'ri-cursor-line', 'ri-cursor-fill',
  ],
  'Đánh giá': [
    'ri-star-line', 'ri-star-fill', 'ri-star-half-line', 'ri-star-half-fill',
    'ri-heart-line', 'ri-heart-fill', 'ri-heart-3-line', 'ri-heart-3-fill',
    'ri-thumb-up-line', 'ri-thumb-up-fill', 'ri-thumb-down-line', 'ri-thumb-down-fill',
    'ri-medal-line', 'ri-medal-fill', 'ri-award-line', 'ri-award-fill',
    'ri-trophy-line', 'ri-trophy-fill', 'ri-vip-crown-line', 'ri-vip-crown-fill',
  ],
  'Thông tin': [
    'ri-information-line', 'ri-information-fill', 'ri-question-line', 'ri-question-fill',
    'ri-error-warning-line', 'ri-error-warning-fill', 'ri-alert-line', 'ri-alert-fill',
    'ri-checkbox-circle-line', 'ri-checkbox-circle-fill', 'ri-close-circle-line', 'ri-close-circle-fill',
    'ri-check-line', 'ri-check-fill', 'ri-close-line', 'ri-close-fill',
    'ri-add-line', 'ri-add-fill', 'ri-subtract-line', 'ri-subtract-fill',
  ],
  'Nội dung': [
    'ri-article-line', 'ri-article-fill', 'ri-file-text-line', 'ri-file-text-fill',
    'ri-book-line', 'ri-book-fill', 'ri-book-open-line', 'ri-book-open-fill',
    'ri-image-line', 'ri-image-fill', 'ri-image-2-line', 'ri-image-2-fill',
    'ri-video-line', 'ri-video-fill', 'ri-movie-line', 'ri-movie-fill',
    'ri-gallery-line', 'ri-gallery-fill', 'ri-camera-line', 'ri-camera-fill',
  ],
  'Biểu tượng': [
    'ri-flag-line', 'ri-flag-fill', 'ri-flag-2-line', 'ri-flag-2-fill',
    'ri-shield-check-line', 'ri-shield-check-fill', 'ri-shield-star-line', 'ri-shield-star-fill',
    'ri-verified-badge-line', 'ri-verified-badge-fill', 'ri-hand-heart-line', 'ri-hand-heart-fill',
    'ri-service-line', 'ri-service-fill', 'ri-settings-line', 'ri-settings-fill',
    'ri-magic-line', 'ri-magic-fill', 'ri-sparkling-line', 'ri-sparkling-fill',
  ],
  'Số liệu': [
    'ri-bar-chart-line', 'ri-bar-chart-fill', 'ri-bar-chart-2-line', 'ri-bar-chart-2-fill',
    'ri-pie-chart-line', 'ri-pie-chart-fill', 'ri-line-chart-line', 'ri-line-chart-fill',
    'ri-funds-line', 'ri-funds-fill', 'ri-percent-line', 'ri-percent-fill',
    'ri-money-dollar-circle-line', 'ri-money-dollar-circle-fill', 'ri-wallet-line', 'ri-wallet-fill',
    'ri-price-tag-line', 'ri-price-tag-fill', 'ri-price-tag-3-line', 'ri-price-tag-3-fill',
  ],
};

// Flatten all icons for search
const ALL_ICONS = Object.values(ICON_CATEGORIES).flat();

interface IconPickerProps {
  label?: string;
  value: string;
  onChange: (icon: string) => void;
  placeholder?: string;
  allowEmpty?: boolean; // Cho phép không chọn icon
}

export function IconPicker({ label, value, onChange, placeholder = 'Chọn icon...', allowEmpty = false }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search.trim()) return null;
    const query = search.toLowerCase();
    return ALL_ICONS.filter(icon => icon.toLowerCase().includes(query));
  }, [search]);

  const handleSelect = useCallback((icon: string) => {
    onChange(icon);
    setIsOpen(false);
    setSearch('');
  }, [onChange]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: 8,
          color: tokens.color.text,
          fontSize: 14,
          fontWeight: 500,
        }}>
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: tokens.color.surfaceHover,
          border: `1px solid ${isOpen ? tokens.color.primary : tokens.color.border}`,
          borderRadius: tokens.radius.md,
          color: value ? tokens.color.text : tokens.color.muted,
          cursor: 'pointer',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {value ? (
            <>
              <i className={value} style={{ fontSize: 20, color: tokens.color.primary }} />
              <span>{value}</span>
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </div>
        <motion.i
          className="ri-arrow-down-s-line"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 18, color: tokens.color.muted }}
        />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: tokens.color.surface,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              zIndex: 1000,
              maxHeight: 400,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search Input */}
            <div style={{ padding: 12, borderBottom: `1px solid ${tokens.color.border}` }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: tokens.color.surfaceHover,
                borderRadius: tokens.radius.sm,
                padding: '8px 12px',
              }}>
                <i className="ri-search-line" style={{ color: tokens.color.muted }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm icon..."
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: tokens.color.text,
                    fontSize: 14,
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: tokens.color.muted,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <i className="ri-close-line" />
                  </button>
                )}
              </div>
            </div>

            {/* Icon Grid */}
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              {filteredIcons ? (
                // Search Results
                <div>
                  <p style={{ color: tokens.color.muted, fontSize: 12, marginBottom: 8 }}>
                    Tìm thấy {filteredIcons.length} icon
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: 8,
                  }}>
                    {filteredIcons.map((icon) => (
                      <IconButton
                        key={icon}
                        icon={icon}
                        isSelected={value === icon}
                        onClick={() => handleSelect(icon)}
                      />
                    ))}
                  </div>
                  {filteredIcons.length === 0 && (
                    <p style={{ color: tokens.color.muted, textAlign: 'center', padding: 20 }}>
                      Không tìm thấy icon nào
                    </p>
                  )}
                </div>
              ) : (
                // Categories
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
                    <div key={category}>
                      <button
                        onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          background: 'transparent',
                          border: 'none',
                          color: tokens.color.text,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <span>{category}</span>
                        <motion.i
                          className="ri-arrow-down-s-line"
                          animate={{ rotate: activeCategory === category ? 180 : 0 }}
                          style={{ color: tokens.color.muted }}
                        />
                      </button>
                      <AnimatePresence>
                        {(activeCategory === category || activeCategory === null) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(6, 1fr)',
                              gap: 8,
                              paddingTop: 8,
                            }}>
                              {icons.slice(0, activeCategory === category ? icons.length : 12).map((icon) => (
                                <IconButton
                                  key={icon}
                                  icon={icon}
                                  isSelected={value === icon}
                                  onClick={() => handleSelect(icon)}
                                />
                              ))}
                            </div>
                            {activeCategory !== category && icons.length > 12 && (
                              <button
                                onClick={() => setActiveCategory(category)}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  marginTop: 8,
                                  background: tokens.color.surfaceAlt,
                                  border: `1px dashed ${tokens.color.border}`,
                                  borderRadius: tokens.radius.sm,
                                  color: tokens.color.muted,
                                  fontSize: 12,
                                  cursor: 'pointer',
                                }}
                              >
                                +{icons.length - 12} icon khác
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Selection */}
            {value && (
              <div style={{
                padding: 12,
                borderTop: `1px solid ${tokens.color.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className={value} style={{ fontSize: 18, color: tokens.color.primary }} />
                  <span style={{ color: tokens.color.text, fontSize: 13 }}>{value}</span>
                </div>
                <button
                  onClick={() => handleSelect('')}
                  style={{
                    padding: '4px 8px',
                    background: tokens.color.errorBg,
                    border: `1px solid ${tokens.color.error}40`,
                    borderRadius: tokens.radius.sm,
                    color: tokens.color.error,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Xóa
                </button>
              </div>
            )}

            {/* Allow Empty Option */}
            {allowEmpty && !value && (
              <div style={{
                padding: 12,
                borderTop: `1px solid ${tokens.color.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <button
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: tokens.color.surfaceHover,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.sm,
                    color: tokens.color.muted,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <i className="ri-close-circle-line" />
                  Không sử dụng icon
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconButton({ icon, isSelected, onClick }: { icon: string; isSelected: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={icon}
      style={{
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isSelected ? `${tokens.color.primary}20` : tokens.color.surfaceAlt,
        border: `1px solid ${isSelected ? tokens.color.primary : tokens.color.border}`,
        borderRadius: tokens.radius.sm,
        color: isSelected ? tokens.color.primary : tokens.color.text,
        cursor: 'pointer',
        fontSize: 18,
        transition: 'all 0.15s',
      }}
    >
      <i className={icon} />
    </motion.button>
  );
}

export default IconPicker;
