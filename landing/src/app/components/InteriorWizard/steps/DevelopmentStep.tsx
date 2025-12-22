/**
 * DevelopmentStep - Step 2: Select development
 */

import { tokens, API_URL, resolveMediaUrl } from '@app/shared';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { Development } from '../types';
import { SelectionCard } from '../SelectionCard';
import { SkeletonLoader } from '../SkeletonLoader';

interface DevelopmentStepProps {
  developerId: string;
  selected: Development | null;
  onSelect: (development: Development) => void;
  onBack: () => void;
}

export function DevelopmentStep({
  developerId,
  selected,
  onSelect,
  onBack,
}: DevelopmentStepProps) {
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (developerId) {
      fetchDevelopments();
    }
  }, [developerId]);

  const fetchDevelopments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_URL}/api/interior/developments?developerId=${developerId}`
      );
      if (!response.ok) throw new Error('Failed to fetch developments');
      const json = await response.json();
      // Handle standardized response: { success: true, data: [...], meta: {...} }
      const data = json.data || json;
      setDevelopments(Array.isArray(data) ? data : data.items || []);
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
        <h2 style={headerStyle}>Chọn Dự Án</h2>
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
        <button onClick={fetchDevelopments} style={retryButtonStyle}>
          Thử lại
        </button>
      </div>
    );
  }

  if (developments.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <BackButton onClick={onBack} />
        <i
          className="ri-building-2-line"
          style={{ fontSize: '3rem', color: tokens.color.textMuted, marginBottom: '1rem' }}
        />
        <p style={{ color: tokens.color.textMuted }}>Chưa có dự án nào</p>
      </div>
    );
  }

  return (
    <div>
      <BackButton onClick={onBack} />
      <h2 style={headerStyle}>Chọn Dự Án</h2>
      <p style={subtitleStyle}>Chọn dự án để xem các tòa nhà</p>

      <div style={gridStyle}>
        {developments.map((development, index) => (
          <motion.div
            key={development.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SelectionCard
              title={development.name}
              subtitle={development.address}
              imageUrl={
                development.thumbnail
                  ? resolveMediaUrl(development.thumbnail)
                  : undefined
              }
              isSelected={selected?.id === development.id}
              onClick={() => onSelect(development)}
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

export default DevelopmentStep;
