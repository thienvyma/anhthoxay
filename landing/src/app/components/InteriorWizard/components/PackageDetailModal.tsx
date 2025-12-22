/**
 * PackageDetailModal - Full package detail view with item breakdown
 *
 * **Feature: interior-quote-module**
 * **Validates: Requirements 14.7**
 */

import { tokens, API_URL, resolveMediaUrl } from '@app/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { Package, PackageRoomItems } from '../types';

interface PackageDetailModalProps {
  packageId: string;
  onClose: () => void;
  onSelect: (pkg: Package) => void;
}

interface PackageDetail extends Package {
  items: PackageRoomItems[];
  description?: string;
  warrantyMonths?: number;
  installationDays?: number;
}

// Tier labels by number (DB stores tier as 1-4)
const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Cơ bản', color: tokens.color.textMuted },
  2: { label: 'Tiêu chuẩn', color: tokens.color.info },
  3: { label: 'Cao cấp', color: tokens.color.warning },
  4: { label: 'Sang trọng', color: tokens.color.primary },
};

export function PackageDetailModal({ packageId, onClose, onSelect }: PackageDetailModalProps) {
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'gallery' | 'info'>('items');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchPackageDetail();
  }, [packageId]);

  const fetchPackageDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/interior/packages/${packageId}`);
      if (!response.ok) throw new Error('Failed to fetch package');
      const json = await response.json();
      setPkg(json.data || json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const allImages = pkg?.images ? [...pkg.images] : [];
  if (pkg?.thumbnail && !allImages.includes(pkg.thumbnail)) {
    allImages.unshift(pkg.thumbnail);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={overlayStyle}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={modalStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchPackageDetail} onClose={onClose} />
          ) : pkg ? (
            <>
              {/* Header */}
              <div style={headerStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: `${(TIER_LABELS[pkg.tier] || TIER_LABELS[1]).color}20`,
                        color: (TIER_LABELS[pkg.tier] || TIER_LABELS[1]).color,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        borderRadius: tokens.radius.sm,
                      }}
                    >
                      {(TIER_LABELS[pkg.tier] || TIER_LABELS[1]).label}
                    </span>
                    {pkg.isFeatured && (
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: tokens.color.primary,
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          borderRadius: tokens.radius.sm,
                        }}
                      >
                        <i className="ri-star-fill" style={{ marginRight: '0.25rem' }} />
                        Đề xuất
                      </span>
                    )}
                  </div>
                  <h2 style={titleStyle}>{pkg.name}</h2>
                  <p style={priceStyle}>
                    {pkg.basePrice.toLocaleString('vi-VN')}
                    <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>đ</span>
                  </p>
                </div>
                <button onClick={onClose} style={closeButtonStyle}>
                  <i className="ri-close-line" />
                </button>
              </div>

              {/* Tabs */}
              <div style={tabsStyle}>
                <TabButton
                  active={activeTab === 'items'}
                  onClick={() => setActiveTab('items')}
                  icon="ri-list-check"
                  label="Sản phẩm"
                />
                <TabButton
                  active={activeTab === 'gallery'}
                  onClick={() => setActiveTab('gallery')}
                  icon="ri-image-line"
                  label="Hình ảnh"
                  badge={allImages.length}
                />
                <TabButton
                  active={activeTab === 'info'}
                  onClick={() => setActiveTab('info')}
                  icon="ri-information-line"
                  label="Thông tin"
                />
              </div>

              {/* Content */}
              <div style={contentStyle}>
                {activeTab === 'items' && <ItemsTab items={pkg.items || []} />}
                {activeTab === 'gallery' && (
                  <GalleryTab
                    images={allImages}
                    activeIndex={activeImageIndex}
                    onChangeIndex={setActiveImageIndex}
                  />
                )}
                {activeTab === 'info' && <InfoTab pkg={pkg} />}
              </div>

              {/* Footer */}
              <div style={footerStyle}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(pkg)}
                  style={selectButtonStyle}
                >
                  <i className="ri-check-line" style={{ marginRight: '0.5rem' }} />
                  Chọn gói này
                </motion.button>
              </div>
            </>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  badge?: number;
}

function TabButton({ active, onClick, icon, label, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        ...tabButtonStyle,
        color: active ? tokens.color.primary : tokens.color.textMuted,
        borderBottom: active ? `2px solid ${tokens.color.primary}` : '2px solid transparent',
      }}
    >
      <i className={icon} style={{ marginRight: '0.5rem' }} />
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            marginLeft: '0.5rem',
            padding: '0.125rem 0.375rem',
            background: active ? tokens.color.primary : tokens.color.surface,
            color: active ? '#fff' : tokens.color.textMuted,
            fontSize: '0.65rem',
            borderRadius: tokens.radius.pill,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function ItemsTab({ items }: { items: PackageRoomItems[] }) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(items.map((r) => r.room)));

  const toggleRoom = (room: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(room)) {
        next.delete(room);
      } else {
        next.add(room);
      }
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: tokens.color.textMuted }}>
        <i className="ri-inbox-line" style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
        <p>Chưa có thông tin sản phẩm</p>
      </div>
    );
  }

  return (
    <div>
      {items.map((roomItems) => {
        const isExpanded = expandedRooms.has(roomItems.room);
        const roomTotal = roomItems.items.reduce((sum, item) => sum + item.qty * item.price, 0);

        return (
          <div key={roomItems.room} style={roomSectionStyle}>
            <div onClick={() => toggleRoom(roomItems.room)} style={roomHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i
                  className={isExpanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'}
                  style={{ color: tokens.color.textMuted }}
                />
                <i className="ri-home-4-line" style={{ color: tokens.color.primary }} />
                <span style={{ fontWeight: 600 }}>{roomItems.room}</span>
                <span style={{ color: tokens.color.textMuted, fontSize: '0.8rem' }}>
                  ({roomItems.items.length} sản phẩm)
                </span>
              </div>
              <span style={{ color: tokens.color.primary, fontWeight: 600 }}>
                {roomTotal.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={itemsListStyle}>
                    {roomItems.items.map((item, idx) => (
                      <div key={idx} style={itemRowStyle}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 500 }}>{item.name}</span>
                          {(item.brand || item.material) && (
                            <span style={{ color: tokens.color.textMuted, fontSize: '0.8rem', display: 'block' }}>
                              {[item.brand, item.material].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: tokens.color.textMuted }}>x{item.qty}</span>
                          <span style={{ marginLeft: '1rem', fontWeight: 500 }}>
                            {(item.qty * item.price).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

interface GalleryTabProps {
  images: string[];
  activeIndex: number;
  onChangeIndex: (index: number) => void;
}

function GalleryTab({ images, activeIndex, onChangeIndex }: GalleryTabProps) {
  if (images.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: tokens.color.textMuted }}>
        <i className="ri-image-line" style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
        <p>Chưa có hình ảnh</p>
      </div>
    );
  }

  return (
    <div>
      {/* Main Image */}
      <div style={mainImageContainerStyle}>
        <motion.img
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={resolveMediaUrl(images[activeIndex])}
          alt={`Image ${activeIndex + 1}`}
          style={mainImageStyle}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => onChangeIndex((activeIndex - 1 + images.length) % images.length)}
              style={{ ...navButtonStyle, left: '0.5rem' }}
            >
              <i className="ri-arrow-left-s-line" />
            </button>
            <button
              onClick={() => onChangeIndex((activeIndex + 1) % images.length)}
              style={{ ...navButtonStyle, right: '0.5rem' }}
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={thumbnailsContainerStyle}>
          {images.map((img, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChangeIndex(idx)}
              style={{
                ...thumbnailStyle,
                border: idx === activeIndex ? `2px solid ${tokens.color.primary}` : `2px solid transparent`,
              }}
            >
              <img src={resolveMediaUrl(img)} alt={`Thumb ${idx + 1}`} style={thumbnailImgStyle} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoTab({ pkg }: { pkg: PackageDetail }) {
  return (
    <div style={{ padding: '0.5rem 0' }}>
      {/* Description */}
      {pkg.description && (
        <div style={infoSectionStyle}>
          <h4 style={infoLabelStyle}>
            <i className="ri-file-text-line" style={{ marginRight: '0.5rem' }} />
            Mô tả
          </h4>
          <p style={infoValueStyle}>{pkg.description}</p>
        </div>
      )}

      {/* Warranty */}
      <div style={infoSectionStyle}>
        <h4 style={infoLabelStyle}>
          <i className="ri-shield-check-line" style={{ marginRight: '0.5rem' }} />
          Bảo hành
        </h4>
        <p style={infoValueStyle}>
          {pkg.warrantyMonths ? `${pkg.warrantyMonths} tháng` : 'Liên hệ để biết thêm chi tiết'}
        </p>
      </div>

      {/* Installation */}
      <div style={infoSectionStyle}>
        <h4 style={infoLabelStyle}>
          <i className="ri-tools-line" style={{ marginRight: '0.5rem' }} />
          Thời gian lắp đặt
        </h4>
        <p style={infoValueStyle}>
          {pkg.installationDays ? `Khoảng ${pkg.installationDays} ngày` : 'Liên hệ để biết thêm chi tiết'}
        </p>
      </div>

      {/* Price per sqm */}
      {pkg.pricePerSqm && (
        <div style={infoSectionStyle}>
          <h4 style={infoLabelStyle}>
            <i className="ri-ruler-line" style={{ marginRight: '0.5rem' }} />
            Giá trên m²
          </h4>
          <p style={infoValueStyle}>{pkg.pricePerSqm.toLocaleString('vi-VN')}đ/m²</p>
        </div>
      )}

      {/* Items count */}
      <div style={infoSectionStyle}>
        <h4 style={infoLabelStyle}>
          <i className="ri-checkbox-circle-line" style={{ marginRight: '0.5rem' }} />
          Tổng sản phẩm
        </h4>
        <p style={infoValueStyle}>{pkg.totalItems} sản phẩm</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'inline-block' }}
      >
        <i className="ri-loader-4-line" style={{ fontSize: '2rem', color: tokens.color.primary }} />
      </motion.div>
      <p style={{ color: tokens.color.textMuted, marginTop: '1rem' }}>Đang tải thông tin...</p>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
  onClose,
}: {
  error: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <i className="ri-error-warning-line" style={{ fontSize: '2rem', color: tokens.color.error }} />
      <p style={{ color: tokens.color.error, marginTop: '1rem' }}>{error}</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
        <button onClick={onRetry} style={retryButtonStyle}>
          Thử lại
        </button>
        <button onClick={onClose} style={cancelButtonStyle}>
          Đóng
        </button>
      </div>
    </div>
  );
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 'clamp(0.5rem, 2vw, 1rem)',
};

const modalStyle: React.CSSProperties = {
  background: tokens.color.background,
  borderRadius: tokens.radius.lg,
  width: '100%',
  maxWidth: '700px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '1.5rem',
  borderBottom: `1px solid ${tokens.color.border}`,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  fontWeight: 600,
  color: tokens.color.text,
};

const priceStyle: React.CSSProperties = {
  margin: '0.5rem 0 0',
  fontSize: '1.5rem',
  fontWeight: 700,
  color: tokens.color.primary,
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: '1.5rem',
  color: tokens.color.textMuted,
  cursor: 'pointer',
  padding: '0.25rem',
};

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: `1px solid ${tokens.color.border}`,
  padding: '0 1rem',
};

const tabButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '1rem',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '1rem 1.5rem',
};

const footerStyle: React.CSSProperties = {
  padding: '1rem 1.5rem',
  borderTop: `1px solid ${tokens.color.border}`,
};

const selectButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: 'clamp(0.75rem, 2vw, 1rem)',
  background: tokens.color.primary,
  color: tokens.color.background,
  border: 'none',
  borderRadius: tokens.radius.md,
  fontWeight: 600,
  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '44px', // Touch target
};

const roomSectionStyle: React.CSSProperties = {
  marginBottom: '0.5rem',
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  overflow: 'hidden',
};

const roomHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  background: tokens.color.surface,
  cursor: 'pointer',
};

const itemsListStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
};

const itemRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5rem 0',
  borderBottom: `1px solid ${tokens.color.border}`,
  fontSize: '0.875rem',
};

const mainImageContainerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '300px',
  background: tokens.color.surface,
  borderRadius: tokens.radius.md,
  overflow: 'hidden',
};

const mainImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

const navButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.9)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.25rem',
  color: tokens.color.text,
  boxShadow: tokens.shadow.md,
};

const thumbnailsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: '1rem',
  overflowX: 'auto',
  padding: '0.25rem',
};

const thumbnailStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: tokens.radius.sm,
  overflow: 'hidden',
  cursor: 'pointer',
  flexShrink: 0,
};

const thumbnailImgStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const infoSectionStyle: React.CSSProperties = {
  marginBottom: '1.25rem',
};

const infoLabelStyle: React.CSSProperties = {
  margin: '0 0 0.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: tokens.color.text,
  display: 'flex',
  alignItems: 'center',
};

const infoValueStyle: React.CSSProperties = {
  margin: 0,
  color: tokens.color.textMuted,
  fontSize: '0.875rem',
  lineHeight: 1.6,
};

const retryButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  background: tokens.color.primary,
  color: tokens.color.background,
  border: 'none',
  borderRadius: tokens.radius.md,
  cursor: 'pointer',
  fontWeight: 500,
  minHeight: '44px', // Touch target
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  background: tokens.color.surface,
  color: tokens.color.text,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  cursor: 'pointer',
  fontWeight: 500,
};

export default PackageDetailModal;
