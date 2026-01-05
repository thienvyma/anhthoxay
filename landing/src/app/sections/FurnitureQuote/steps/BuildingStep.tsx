/**
 * BuildingStep - Step 3: Select Building
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.4, 6.3**
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { FurnitureBuilding, FurnitureProject } from '../../../api/furniture';
import { SelectionCard, Pagination, NavigationButtons } from '../components';
import { ITEMS_PER_PAGE } from '../constants';

interface BuildingStepProps {
  buildings: FurnitureBuilding[];
  selectedBuilding: FurnitureBuilding | null;
  selectedProject: FurnitureProject | null;
  currentPage: number;
  onSelect: (bld: FurnitureBuilding) => void;
  onPageChange: (page: number) => void;
  onBack: () => void;
}

export const BuildingStep = memo(function BuildingStep({
  buildings,
  selectedBuilding,
  selectedProject,
  currentPage,
  onSelect,
  onPageChange,
  onBack,
}: BuildingStepProps) {
  const totalPages = Math.ceil(buildings.length / ITEMS_PER_PAGE);
  const paginatedBuildings = buildings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
        <i className="ri-building-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
        Chọn tòa nhà
      </h3>
      <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: tokens.color.muted }}>
        Dự án: <strong style={{ color: tokens.color.primary }}>{selectedProject?.name}</strong>
      </p>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'grid', gap: '0.75rem' }}
        >
          {paginatedBuildings.map((bld) => (
            <SelectionCard
              key={bld.id}
              title={bld.name}
              subtitle={`Mã: ${bld.code} • ${bld.maxFloor} tầng • ${bld.maxAxis + 1} trục`}
              icon="ri-building-line"
              isSelected={selectedBuilding?.id === bld.id}
              onClick={() => onSelect(bld)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={buildings.length}
      />
      
      {buildings.length === 0 && (
        <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
          Chưa có tòa nhà nào
        </p>
      )}
      
      <NavigationButtons onBack={onBack} showBack={true} />
    </motion.div>
  );
});
