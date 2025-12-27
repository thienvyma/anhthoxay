/**
 * LayoutSelector Component - Step 5 for Layout Selection
 * Feature: furniture-quotation
 * Requirements: 6.7, 6.8, 6.9, 6.10
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { furnitureAPI, FurnitureApartmentType } from '../../api/furniture';

// ============================================
// TYPES
// ============================================

export interface LayoutSelectorProps {
  buildingCode: string;
  axis: number;
  apartmentType: string;
  onSelect: (apartmentType: FurnitureApartmentType) => void;
  onBack: () => void;
  onError: (message: string) => void;
}

// ============================================
// LIGHTBOX COMPONENT
// Requirements: 6.9 - Click image to open full-size preview
// ============================================

const ImageLightbox = memo(function ImageLightbox({
  imageUrl,
  alt,
  description,
  onClose,
}: {
  imageUrl: string;
  alt: string;
  description?: string | null;
  onClose: () => void;
}) {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Close Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className="ri-close-line" />
      </motion.button>

      {/* Image */}
      <motion.img
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        src={resolveMediaUrl(imageUrl)}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: tokens.radius.md,
        }}
      />

      {/* Description Caption */}
      {description && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            background: 'rgba(0,0,0,0.7)',
            borderRadius: tokens.radius.md,
            color: '#fff',
            fontSize: 16,
            maxWidth: '80vw',
            textAlign: 'center',
          }}
        >
          {description}
        </motion.div>
      )}
    </motion.div>
  );
});


// ============================================
// LAYOUT CARD COMPONENT
// Requirements: 6.8 - Display image and description for each layout
// ============================================

const LayoutCard = memo(function LayoutCard({
  apartmentType,
  isSelected,
  onSelect,
  onImageClick,
}: {
  apartmentType: FurnitureApartmentType;
  isSelected: boolean;
  onSelect: () => void;
  onImageClick: () => void;
}) {
  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (apartmentType.imageUrl) {
        onImageClick();
      }
    },
    [apartmentType.imageUrl, onImageClick]
  );

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      style={{
        borderRadius: tokens.radius.md,
        background: isSelected ? `${tokens.color.primary}15` : tokens.color.surface,
        border: `2px solid ${isSelected ? tokens.color.primary : tokens.color.border}`,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Image Section */}
      {apartmentType.imageUrl ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 200,
            background: tokens.color.background,
          }}
        >
          <img
            src={resolveMediaUrl(apartmentType.imageUrl)}
            alt={apartmentType.apartmentType}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Zoom Overlay - Requirements: 6.9 */}
          <motion.div
            whileHover={{ opacity: 1 }}
            onClick={handleImageClick}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i
                className="ri-zoom-in-line"
                style={{ fontSize: '1.5rem', color: tokens.color.text }}
              />
            </div>
          </motion.div>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: 200,
            background: tokens.color.background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i
            className="ri-image-line"
            style={{ fontSize: '3rem', color: tokens.color.muted }}
          />
        </div>
      )}

      {/* Content Section */}
      <div style={{ padding: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: tokens.color.text,
              fontSize: '1.1rem',
            }}
          >
            {apartmentType.apartmentType.toUpperCase()}
          </div>
          {isSelected && (
            <i
              className="ri-check-circle-fill"
              style={{ fontSize: '1.25rem', color: tokens.color.primary }}
            />
          )}
        </div>
        {apartmentType.description && (
          <div
            style={{
              fontSize: '0.85rem',
              color: tokens.color.muted,
              lineHeight: 1.5,
            }}
          >
            {apartmentType.description}
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ============================================
// NAVIGATION BUTTONS COMPONENT
// ============================================

const NavigationButtons = memo(function NavigationButtons({
  onBack,
  backLabel = 'Quay lại',
  showBack = true,
}: {
  onBack?: () => void;
  backLabel?: string;
  showBack?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
      {showBack && onBack && (
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: 'transparent',
            color: tokens.color.text,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <i className="ri-arrow-left-line" /> {backLabel}
        </button>
      )}
    </div>
  );
});


// ============================================
// MAIN LAYOUT SELECTOR COMPONENT
// Requirements: 6.7, 6.8, 6.9, 6.10
// ============================================

export const LayoutSelector = memo(function LayoutSelector({
  buildingCode,
  axis,
  apartmentType,
  onSelect,
  onBack,
  onError,
}: LayoutSelectorProps) {
  // State
  const [apartmentTypes, setApartmentTypes] = useState<FurnitureApartmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<FurnitureApartmentType | null>(null);

  // Fetch apartment types from API - Requirements: 6.7, 6.8
  useEffect(() => {
    const fetchApartmentTypes = async () => {
      setLoading(true);
      try {
        const types = await furnitureAPI.getApartmentTypes(buildingCode, apartmentType);
        setApartmentTypes(types);
        
        // If only one option, auto-select it
        if (types.length === 1) {
          setSelectedId(types[0].id);
        }
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Không thể tải thông tin layout');
      } finally {
        setLoading(false);
      }
    };

    if (buildingCode && apartmentType) {
      fetchApartmentTypes();
    }
  }, [buildingCode, apartmentType, onError]);

  // Handle layout selection - Requirements: 6.10
  const handleSelect = useCallback(
    (apt: FurnitureApartmentType) => {
      setSelectedId(apt.id);
      // Proceed to lead form after selection
      onSelect(apt);
    },
    [onSelect]
  );

  // Handle lightbox open - Requirements: 6.9
  const handleOpenLightbox = useCallback((apt: FurnitureApartmentType) => {
    if (apt.imageUrl) {
      setLightboxImage(apt);
    }
  }, []);

  // Handle lightbox close
  const handleCloseLightbox = useCallback(() => {
    setLightboxImage(null);
  }, []);

  // Loading state
  if (loading) {
    return (
      <motion.div
        key="step5-loading"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          gap: '1rem',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: `${tokens.color.border} ${tokens.color.border} ${tokens.color.border} ${tokens.color.primary}`,
          }}
        />
        <p style={{ color: tokens.color.muted }}>Đang tải thông tin layout...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Header */}
      <h3
        style={{
          margin: '0 0 0.5rem',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: tokens.color.text,
        }}
      >
        <i
          className="ri-layout-line"
          style={{ marginRight: '0.5rem', color: tokens.color.primary }}
        />
        Chọn layout căn hộ
      </h3>
      <p
        style={{
          margin: '0 0 1.5rem',
          fontSize: '0.875rem',
          color: tokens.color.muted,
        }}
      >
        Loại căn hộ:{' '}
        <strong style={{ color: tokens.color.primary }}>
          {apartmentType.toUpperCase()}
        </strong>
        {' • '}Trục: <strong style={{ color: tokens.color.primary }}>{axis.toString().padStart(2, '0')}</strong>
      </p>

      {/* Layout Options Grid - Requirements: 6.8 */}
      {apartmentTypes.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {apartmentTypes.map((apt) => (
            <LayoutCard
              key={apt.id}
              apartmentType={apt}
              isSelected={selectedId === apt.id}
              onSelect={() => handleSelect(apt)}
              onImageClick={() => handleOpenLightbox(apt)}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            background: tokens.color.background,
            borderRadius: tokens.radius.md,
            border: `1px dashed ${tokens.color.border}`,
          }}
        >
          <i
            className="ri-layout-line"
            style={{
              fontSize: '3rem',
              color: tokens.color.muted,
              marginBottom: '1rem',
              display: 'block',
            }}
          />
          <p style={{ color: tokens.color.muted, margin: 0 }}>
            Không tìm thấy thông tin layout cho loại căn hộ này
          </p>
        </div>
      )}

      {/* Navigation */}
      <NavigationButtons onBack={onBack} showBack={true} />

      {/* Lightbox - Requirements: 6.9 */}
      <AnimatePresence>
        {lightboxImage && lightboxImage.imageUrl && (
          <ImageLightbox
            imageUrl={lightboxImage.imageUrl}
            alt={lightboxImage.apartmentType}
            description={lightboxImage.description}
            onClose={handleCloseLightbox}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default LayoutSelector;
