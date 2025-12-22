/**
 * BuildingStep - Step 3: Select building
 */

import { tokens, API_URL, resolveMediaUrl } from '@app/shared';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { Building } from '../types';
import { SelectionCard } from '../SelectionCard';
import { SkeletonLoader } from '../SkeletonLoader';

interface BuildingStepProps {
  developmentId: string;
  selected: Building | null;
  onSelect: (building: Building) => void;
  onBack: () => void;
}

export function BuildingStep({
  developmentId,
  selected,
  onSelect,
  onBack,
}: BuildingStepProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (developmentId) {
      fetchBuildings();
    }
  }, [developmentId]);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_URL}/api/interior/buildings?developmentId=${developmentId}`
      );
      if (!response.ok) throw new Error('Failed to fetch buildings');
      const json = await response.json();
      // Handle standardized response: { success: true, data: [...], meta: {...} }
      const data = json.data || json;
      setBuildings(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <BackButton onClick={onBack} />
        <h2 style={headerStyle}>Chọn Tòa Nhà</h2>
        <SkeletonLoader count={4} type="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <BackButton onClick={onBack} />
        <i
          className="ri-error-warning-line"
          style={{ fontSize: '3rem', color: tokens.color.error, marginBottom: '1rem' }}
        />
        <p style={{ color: tokens.color.error, marginBottom: '1rem' }}>{error}</p>
        <button onClick={fetchBuildings} style={retryButtonStyle}>
          Thử lại
        </button>
      </div>
    );
  }

  if (buildings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <BackButton onClick={onBack} />
        <i
          className="ri-building-3-line"
          style={{ fontSize: '3rem', color: tokens.color.textMuted, marginBottom: '1rem' }}
        />
        <p style={{ color: tokens.color.textMuted }}>Chưa có tòa nhà nào</p>
      </div>
    );
  }

  return (
    <div>
      <BackButton onClick={onBack} />
      <h2 style={headerStyle}>Chọn Tòa Nhà</h2>
      <p style={subtitleStyle}>Chọn tòa nhà để xem các căn hộ</p>

      <div style={gridStyle}>
        {buildings.map((building, index) => (
          <motion.div
            key={building.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SelectionCard
              title={building.name}
              subtitle={`${building.totalFloors} tầng • ${building.axisLabels.length} trục`}
              imageUrl={
                building.floorPlanImage
                  ? resolveMediaUrl(building.floorPlanImage)
                  : undefined
              }
              isSelected={selected?.id === building.id}
              onClick={() => onSelect(building)}
            />
          </motion.div>
        ))}
      </div>
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
  gap: 'clamp(0.75rem, 2vw, 1rem)',
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

export default BuildingStep;
