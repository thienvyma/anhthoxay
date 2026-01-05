/**
 * DeveloperStep - Step 1: Select Developer
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.4, 6.1**
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { FurnitureDeveloper } from '../../../api/furniture';
import { SelectionCard, Pagination } from '../components';
import { ITEMS_PER_PAGE } from '../constants';

interface DeveloperStepProps {
  developers: FurnitureDeveloper[];
  selectedDeveloper: FurnitureDeveloper | null;
  currentPage: number;
  onSelect: (dev: FurnitureDeveloper) => void;
  onPageChange: (page: number) => void;
}

export const DeveloperStep = memo(function DeveloperStep({
  developers,
  selectedDeveloper,
  currentPage,
  onSelect,
  onPageChange,
}: DeveloperStepProps) {
  const totalPages = Math.ceil(developers.length / ITEMS_PER_PAGE);
  const paginatedDevelopers = developers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
        <i className="ri-building-4-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
        Chọn chủ đầu tư
      </h3>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'grid', gap: '0.75rem' }}
        >
          {paginatedDevelopers.map((dev) => (
            <SelectionCard
              key={dev.id}
              title={dev.name}
              icon="ri-building-4-line"
              isSelected={selectedDeveloper?.id === dev.id}
              onClick={() => onSelect(dev)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={developers.length}
      />
      
      {developers.length === 0 && (
        <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
          Chưa có dữ liệu chủ đầu tư
        </p>
      )}
    </motion.div>
  );
});
