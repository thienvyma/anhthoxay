import { tokens, API_URL, resolveMediaUrl } from '@app/shared';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { Developer } from '../types';
import { SelectionCard } from '../SelectionCard';
import { SkeletonLoader } from '../SkeletonLoader';

interface DeveloperStepProps {
  selected: Developer | null;
  onSelect: (developer: Developer) => void;
}

export function DeveloperStep({ selected, onSelect }: DeveloperStepProps) {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/interior/developers`);
      if (!response.ok) throw new Error('Failed to fetch developers');
      const json = await response.json();
      // Handle standardized response: { success: true, data: [...], meta: {...} }
      const data = json.data || json;
      // data is now array directly from paginatedResponse
      setDevelopers(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: tokens.color.text,
            marginBottom: '1rem',
            textAlign: 'center',
          }}
        >
          Chọn Chủ Đầu Tư
        </h2>
        <SkeletonLoader count={4} type="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <i
          className="ri-error-warning-line"
          style={{ fontSize: '3rem', color: tokens.color.error, marginBottom: '1rem' }}
        />
        <p style={{ color: tokens.color.error, marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={fetchDevelopers}
          style={{
            padding: '0.75rem 1.5rem',
            background: tokens.color.primary,
            color: '#fff',
            border: 'none',
            borderRadius: tokens.radius.md,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (developers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <i
          className="ri-building-line"
          style={{ fontSize: '3rem', color: tokens.color.textMuted, marginBottom: '1rem' }}
        />
        <p style={{ color: tokens.color.textMuted }}>Chưa có chủ đầu tư nào</p>
      </div>
    );
  }

  return (
    <div>
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: tokens.color.text,
          marginBottom: '0.5rem',
          textAlign: 'center',
        }}
      >
        Chọn Chủ Đầu Tư
      </h2>
      <p
        style={{
          color: tokens.color.textMuted,
          textAlign: 'center',
          marginBottom: '1.5rem',
        }}
      >
        Chọn chủ đầu tư để xem các dự án
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
          gap: 'clamp(0.75rem, 2vw, 1rem)',
        }}
      >
        {developers.map((developer, index) => (
          <motion.div
            key={developer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SelectionCard
              title={developer.name}
              imageUrl={developer.logo ? resolveMediaUrl(developer.logo) : undefined}
              isSelected={selected?.id === developer.id}
              onClick={() => onSelect(developer)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default DeveloperStep;
