/**
 * ProjectStep - Step 2: Select Project
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.4, 6.2**
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { FurnitureProject, FurnitureDeveloper } from '../../../api/furniture';
import { SelectionCard, Pagination, NavigationButtons } from '../components';
import { ITEMS_PER_PAGE } from '../constants';

interface ProjectStepProps {
  projects: FurnitureProject[];
  selectedProject: FurnitureProject | null;
  selectedDeveloper: FurnitureDeveloper | null;
  currentPage: number;
  onSelect: (proj: FurnitureProject) => void;
  onPageChange: (page: number) => void;
  onBack: () => void;
}

export const ProjectStep = memo(function ProjectStep({
  projects,
  selectedProject,
  selectedDeveloper,
  currentPage,
  onSelect,
  onPageChange,
  onBack,
}: ProjectStepProps) {
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const paginatedProjects = projects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
        <i className="ri-community-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
        Chọn dự án
      </h3>
      <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: tokens.color.muted }}>
        Chủ đầu tư: <strong style={{ color: tokens.color.primary }}>{selectedDeveloper?.name}</strong>
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
          {paginatedProjects.map((proj) => (
            <SelectionCard
              key={proj.id}
              title={proj.name}
              subtitle={`Mã: ${proj.code}`}
              icon="ri-community-line"
              isSelected={selectedProject?.id === proj.id}
              onClick={() => onSelect(proj)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={projects.length}
      />
      
      {projects.length === 0 && (
        <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
          Chưa có dự án nào
        </p>
      )}
      
      <NavigationButtons onBack={onBack} showBack={true} />
    </motion.div>
  );
});
