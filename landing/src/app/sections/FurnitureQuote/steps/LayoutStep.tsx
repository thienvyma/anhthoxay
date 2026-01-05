/**
 * LayoutStep - Step 5: Select Layout
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.4, 6.8, 6.9, 6.10**
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { FurnitureApartmentType, FurnitureLayout } from '../../../api/furniture';
import { Pagination, NavigationButtons } from '../components';
import { ITEMS_PER_PAGE } from '../constants';

interface LayoutStepProps {
  apartmentTypes: FurnitureApartmentType[];
  selectedApartmentType: FurnitureApartmentType | null;
  layout: FurnitureLayout | null;
  currentPage: number;
  onSelect: (apt: FurnitureApartmentType) => void;
  onPageChange: (page: number) => void;
  onBack: () => void;
}

export const LayoutStep = memo(function LayoutStep({
  apartmentTypes,
  selectedApartmentType,
  layout,
  currentPage,
  onSelect,
  onPageChange,
  onBack,
}: LayoutStepProps) {
  const totalPages = Math.ceil(apartmentTypes.length / ITEMS_PER_PAGE);
  const paginatedLayouts = apartmentTypes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
        <i className="ri-layout-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
        Chọn layout căn hộ
      </h3>
      <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: tokens.color.muted }}>
        Loại căn hộ: <strong style={{ color: tokens.color.primary }}>{layout?.apartmentType?.toUpperCase()}</strong>
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}
        >
          {paginatedLayouts.map((apt) => (
            <motion.div
              key={apt.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(apt)}
              style={{
                borderRadius: tokens.radius.md,
                background: selectedApartmentType?.id === apt.id ? `${tokens.color.primary}15` : tokens.color.surface,
                border: `2px solid ${selectedApartmentType?.id === apt.id ? tokens.color.primary : tokens.color.border}`,
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              {apt.imageUrl && (
                <div style={{ width: '100%', height: 180, background: tokens.color.background }}>
                  <img
                    src={resolveMediaUrl(apt.imageUrl)}
                    alt={apt.apartmentType}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <div style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 600, color: tokens.color.text, marginBottom: '0.25rem' }}>
                  {apt.apartmentType.toUpperCase()}
                </div>
                {apt.description && (
                  <div style={{ fontSize: '0.8rem', color: tokens.color.muted }}>{apt.description}</div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={apartmentTypes.length}
      />

      {apartmentTypes.length === 0 && (
        <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
          Không tìm thấy thông tin layout
        </p>
      )}

      <NavigationButtons onBack={onBack} showBack={true} />
    </motion.div>
  );
});
