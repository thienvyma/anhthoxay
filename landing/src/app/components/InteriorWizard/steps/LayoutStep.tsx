/**
 * LayoutStep - Step 5: Preview layout
 */

import { tokens, resolveMediaUrl } from '@app/shared';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Layout, BuildingUnit } from '../types';

interface LayoutStepProps {
  layout: Layout | null;
  unit: BuildingUnit | null;
  onContinue: () => void;
  onBack: () => void;
}

type ViewMode = '2d' | '3d';

export function LayoutStep({ layout, unit, onContinue, onBack }: LayoutStepProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('2d');

  if (!layout || !unit) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: tokens.color.error }}>Vui lòng chọn căn hộ trước</p>
      </div>
    );
  }

  const imageUrl =
    viewMode === '2d'
      ? layout.layoutImage
        ? resolveMediaUrl(layout.layoutImage)
        : null
      : layout.layout3DImage
        ? resolveMediaUrl(layout.layout3DImage)
        : null;

  const has3D = !!layout.layout3DImage;

  return (
    <div>
      <BackButton onClick={onBack} />
      <h2 style={headerStyle}>Mặt Bằng Căn Hộ</h2>
      <p style={subtitleStyle}>
        {layout.name} • {unit.code}
      </p>

      {/* View Mode Toggle */}
      {has3D && (
        <div style={toggleContainerStyle}>
          <button
            onClick={() => setViewMode('2d')}
            style={{
              ...toggleButtonStyle,
              ...(viewMode === '2d' ? activeToggleStyle : {}),
            }}
          >
            <i className="ri-layout-line" style={{ marginRight: '0.5rem' }} />
            2D
          </button>
          <button
            onClick={() => setViewMode('3d')}
            style={{
              ...toggleButtonStyle,
              ...(viewMode === '3d' ? activeToggleStyle : {}),
            }}
          >
            <i className="ri-box-3-line" style={{ marginRight: '0.5rem' }} />
            3D
          </button>
        </div>
      )}

      {/* Layout Image */}
      <div style={imageContainerStyle}>
        {imageUrl ? (
          <motion.img
            key={viewMode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            src={imageUrl}
            alt={layout.name}
            style={imageStyle}
          />
        ) : (
          <div style={placeholderStyle}>
            <i className="ri-image-line" style={{ fontSize: '3rem', marginBottom: '1rem' }} />
            <p>Chưa có hình ảnh</p>
          </div>
        )}
      </div>

      {/* Area Summary */}
      <div style={summaryStyle}>
        <h3 style={sectionTitleStyle}>
          <i className="ri-ruler-line" style={{ marginRight: '0.5rem' }} />
          Diện tích
        </h3>
        <div style={areaGridStyle}>
          <AreaItem label="Tim tường" value={`${layout.grossArea} m²`} />
          <AreaItem label="Thông thủy" value={`${layout.netArea} m²`} highlight />
          {layout.carpetArea && (
            <AreaItem label="Thảm" value={`${layout.carpetArea} m²`} />
          )}
          {layout.balconyArea && (
            <AreaItem label="Ban công" value={`${layout.balconyArea} m²`} />
          )}
          {layout.terraceArea && (
            <AreaItem label="Sân thượng" value={`${layout.terraceArea} m²`} />
          )}
        </div>
      </div>

      {/* Room Breakdown */}
      {layout.rooms && layout.rooms.length > 0 && (
        <div style={summaryStyle}>
          <h3 style={sectionTitleStyle}>
            <i className="ri-home-4-line" style={{ marginRight: '0.5rem' }} />
            Phân chia phòng
          </h3>
          <div style={roomListStyle}>
            {layout.rooms.map((room, index) => (
              <div key={index} style={roomItemStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i
                    className={getRoomIcon(room.type)}
                    style={{ color: tokens.color.primary }}
                  />
                  <span style={{ color: tokens.color.text }}>{room.name}</span>
                </div>
                <span style={{ color: tokens.color.textMuted }}>{room.area} m²</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Highlights */}
      {layout.highlights && layout.highlights.length > 0 && (
        <div style={highlightsStyle}>
          {layout.highlights.map((highlight, index) => (
            <span key={index} style={highlightTagStyle}>
              <i className="ri-star-line" style={{ marginRight: '0.25rem' }} />
              {highlight}
            </span>
          ))}
        </div>
      )}

      {/* Continue Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onContinue}
        style={continueButtonStyle}
      >
        Chọn Gói Nội Thất
        <i className="ri-arrow-right-line" style={{ marginLeft: '0.5rem' }} />
      </motion.button>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'transparent',
        border: 'none',
        color: tokens.color.textMuted,
        cursor: 'pointer',
        marginBottom: '1rem',
        padding: '0.5rem',
        fontSize: '0.875rem',
      }}
    >
      <i className="ri-arrow-left-line" />
      Quay lại
    </motion.button>
  );
}

function AreaItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: '0.75rem',
        background: highlight ? `${tokens.color.primary}15` : tokens.color.surface,
        borderRadius: tokens.radius.md,
        textAlign: 'center',
      }}
    >
      <div style={{ color: tokens.color.textMuted, fontSize: '0.75rem' }}>{label}</div>
      <div
        style={{
          color: highlight ? tokens.color.primary : tokens.color.text,
          fontWeight: 600,
          fontSize: '1rem',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function getRoomIcon(roomType: string): string {
  const icons: Record<string, string> = {
    LIVING: 'ri-sofa-line',
    BEDROOM: 'ri-hotel-bed-line',
    BEDROOM_MASTER: 'ri-hotel-bed-line',
    KITCHEN: 'ri-restaurant-line',
    BATHROOM: 'ri-drop-line',
    BATHROOM_ENSUITE: 'ri-drop-line',
    BALCONY: 'ri-sun-line',
    TERRACE: 'ri-sun-line',
    STORAGE: 'ri-archive-line',
    DINING: 'ri-restaurant-2-line',
    OTHER: 'ri-home-line',
  };
  return icons[roomType] || 'ri-home-line';
}

const headerStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  color: tokens.color.text,
  marginBottom: '0.5rem',
  textAlign: 'center',
};

const subtitleStyle: React.CSSProperties = {
  color: tokens.color.textMuted,
  textAlign: 'center',
  marginBottom: '1.5rem',
};

const toggleContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  justifyContent: 'center',
  marginBottom: '1rem',
};

const toggleButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  color: tokens.color.textMuted,
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
  transition: 'all 0.2s',
};

const activeToggleStyle: React.CSSProperties = {
  background: tokens.color.primary,
  borderColor: tokens.color.primary,
  color: tokens.color.background,
};

const imageContainerStyle: React.CSSProperties = {
  background: tokens.color.surface,
  borderRadius: tokens.radius.lg,
  overflow: 'hidden',
  marginBottom: '1.5rem',
  aspectRatio: '16/10',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

const placeholderStyle: React.CSSProperties = {
  color: tokens.color.textMuted,
  textAlign: 'center',
};

const summaryStyle: React.CSSProperties = {
  background: tokens.color.surface,
  borderRadius: tokens.radius.lg,
  padding: '1rem',
  marginBottom: '1rem',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 0.75rem',
  color: tokens.color.text,
  fontSize: '0.875rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
};

const areaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 100px), 1fr))',
  gap: 'clamp(0.375rem, 1vw, 0.5rem)',
};

const roomListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const roomItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0',
  borderBottom: `1px solid ${tokens.color.border}`,
};

const highlightsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  marginBottom: '1.5rem',
};

const highlightTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.25rem 0.75rem',
  background: `${tokens.color.primary}15`,
  borderRadius: tokens.radius.pill,
  color: tokens.color.primary,
  fontSize: '0.75rem',
  fontWeight: 500,
};

const continueButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: 'clamp(0.75rem, 2vw, 1rem)',
  background: tokens.color.primary,
  border: 'none',
  borderRadius: tokens.radius.md,
  color: tokens.color.background,
  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '44px', // Touch target
};

export default LayoutStep;
