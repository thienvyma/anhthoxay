/**
 * StepSelector Component - Steps 1-4 for Apartment Selection
 * Feature: furniture-quotation
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { memo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import type {
  FurnitureDeveloper,
  FurnitureProject,
  FurnitureBuilding,
} from '../../api/furniture';

// ============================================
// TYPES
// ============================================

export interface StepSelectorProps {
  currentStep: number;
  selections: {
    developer: FurnitureDeveloper | null;
    project: FurnitureProject | null;
    building: FurnitureBuilding | null;
    floor: number | null;
    axis: number | null;
  };
  onSelect: {
    developer: (dev: FurnitureDeveloper) => void;
    project: (proj: FurnitureProject) => void;
    building: (bld: FurnitureBuilding) => void;
    floorAxis: (floor: number, axis: number) => Promise<void>;
  };
  developers: FurnitureDeveloper[];
  projects: FurnitureProject[];
  buildings: FurnitureBuilding[];
  onBack: () => void;
  onError: (message: string) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate unit number from building code, floor, and axis
 * Format: {buildingCode}.{floor padded to 2 digits}{axis padded to 2 digits}
 * Example: LBV A.1503 for floor 15, axis 3
 * Requirements: 6.5
 */
export const calculateUnitNumber = (buildingCode: string, floor: number, axis: number): string => {
  return `${buildingCode}.${floor.toString().padStart(2, '0')}${axis.toString().padStart(2, '0')}`;
};

// ============================================
// SELECTION CARD COMPONENT
// ============================================

const SelectionCard = memo(function SelectionCard({
  title,
  subtitle,
  icon,
  isSelected,
  onClick,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  isSelected?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        padding: '1rem 1.25rem',
        borderRadius: tokens.radius.md,
        background: isSelected ? `${tokens.color.primary}15` : tokens.color.surface,
        border: `2px solid ${isSelected ? tokens.color.primary : tokens.color.border}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        transition: 'all 0.2s ease',
      }}
    >
      <i className={icon || 'ri-building-line'} style={{ fontSize: '1.5rem', color: tokens.color.primary }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: tokens.color.text }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: '0.8rem', color: tokens.color.muted }}>{subtitle}</div>
        )}
      </div>
      {isSelected && (
        <i className="ri-check-circle-fill" style={{ fontSize: '1.25rem', color: tokens.color.primary }} />
      )}
    </motion.div>
  );
});

// ============================================
// NAVIGATION BUTTONS COMPONENT
// ============================================

const NavigationButtons = memo(function NavigationButtons({
  onBack,
  onNext,
  backLabel = 'Quay lại',
  nextLabel = 'Tiếp tục',
  nextDisabled = false,
  showBack = true,
}: {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
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
      {onNext && (
        <motion.button
          whileHover={!nextDisabled ? { scale: 1.02 } : {}}
          whileTap={!nextDisabled ? { scale: 0.98 } : {}}
          onClick={onNext}
          disabled={nextDisabled}
          style={{
            flex: 2,
            padding: '0.875rem',
            borderRadius: tokens.radius.md,
            border: 'none',
            background: nextDisabled ? tokens.color.muted : tokens.color.primary,
            color: nextDisabled ? tokens.color.text : '#111',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: nextDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: nextDisabled ? 0.5 : 1,
          }}
        >
          {nextLabel} <i className="ri-arrow-right-line" />
        </motion.button>
      )}
    </div>
  );
});

// ============================================
// STEP 1: DEVELOPER SELECTION
// Requirements: 6.1
// ============================================

const Step1Developer = memo(function Step1Developer({
  developers,
  selectedDeveloper,
  onSelect,
}: {
  developers: FurnitureDeveloper[];
  selectedDeveloper: FurnitureDeveloper | null;
  onSelect: (dev: FurnitureDeveloper) => void;
}) {
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
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {developers.map((dev) => (
          <SelectionCard
            key={dev.id}
            title={dev.name}
            icon="ri-building-4-line"
            isSelected={selectedDeveloper?.id === dev.id}
            onClick={() => onSelect(dev)}
          />
        ))}
      </div>
      {developers.length === 0 && (
        <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
          Chưa có dữ liệu chủ đầu tư
        </p>
      )}
    </motion.div>
  );
});

// ============================================
// STEP 2: PROJECT SELECTION
// Requirements: 6.2
// ============================================

const Step2Project = memo(function Step2Project({
  projects,
  selectedProject,
  selectedDeveloper,
  onSelect,
  onBack,
}: {
  projects: FurnitureProject[];
  selectedProject: FurnitureProject | null;
  selectedDeveloper: FurnitureDeveloper | null;
  onSelect: (proj: FurnitureProject) => void;
  onBack: () => void;
}) {
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
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {projects.map((proj) => (
          <SelectionCard
            key={proj.id}
            title={proj.name}
            subtitle={`Mã: ${proj.code}`}
            icon="ri-community-line"
            isSelected={selectedProject?.id === proj.id}
            onClick={() => onSelect(proj)}
          />
        ))}
      </div>
      {projects.length === 0 && (
        <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
          Chưa có dự án nào
        </p>
      )}
      <NavigationButtons onBack={onBack} showBack={true} />
    </motion.div>
  );
});

// ============================================
// STEP 3: BUILDING SELECTION
// Requirements: 6.3
// ============================================

const Step3Building = memo(function Step3Building({
  buildings,
  selectedBuilding,
  selectedProject,
  onSelect,
  onBack,
}: {
  buildings: FurnitureBuilding[];
  selectedBuilding: FurnitureBuilding | null;
  selectedProject: FurnitureProject | null;
  onSelect: (bld: FurnitureBuilding) => void;
  onBack: () => void;
}) {
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
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {buildings.map((bld) => (
          <SelectionCard
            key={bld.id}
            title={bld.name}
            subtitle={`Mã: ${bld.code} • ${bld.maxFloor} tầng • ${bld.maxAxis + 1} trục`}
            icon="ri-building-line"
            isSelected={selectedBuilding?.id === bld.id}
            onClick={() => onSelect(bld)}
          />
        ))}
      </div>
      {buildings.length === 0 && (
        <p style={{ textAlign: 'center', color: tokens.color.muted, padding: '2rem' }}>
          Chưa có tòa nhà nào
        </p>
      )}
      <NavigationButtons onBack={onBack} showBack={true} />
    </motion.div>
  );
});

// ============================================
// STEP 4: FLOOR AND AXIS SELECTION
// Requirements: 6.4, 6.5
// ============================================

const Step4FloorAxis = memo(function Step4FloorAxis({
  building,
  selectedFloor,
  selectedAxis,
  onFloorChange,
  onAxisChange,
  onNext,
  onBack,
  onError,
}: {
  building: FurnitureBuilding;
  selectedFloor: number | null;
  selectedAxis: number | null;
  onFloorChange: (floor: number | null) => void;
  onAxisChange: (axis: number | null) => void;
  onNext: () => void;
  onBack: () => void;
  onError: (message: string) => void;
}) {
  const handleNext = useCallback(() => {
    if (selectedFloor && selectedAxis !== null) {
      onNext();
    } else {
      onError('Vui lòng chọn tầng và trục');
    }
  }, [selectedFloor, selectedAxis, onNext, onError]);

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: tokens.color.text }}>
        <i className="ri-home-line" style={{ marginRight: '0.5rem', color: tokens.color.primary }} />
        Chọn căn hộ
      </h3>
      <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: tokens.color.muted }}>
        Tòa: <strong style={{ color: tokens.color.primary }}>{building.name}</strong>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Floor Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: tokens.color.text }}>
            Tầng
          </label>
          <select
            value={selectedFloor || ''}
            onChange={(e) => onFloorChange(parseInt(e.target.value) || null)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: '1rem',
            }}
          >
            <option value="">Chọn tầng</option>
            {Array.from({ length: building.maxFloor }, (_, i) => i + 1).map((floor) => (
              <option key={floor} value={floor}>
                Tầng {floor}
              </option>
            ))}
          </select>
        </div>

        {/* Axis Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: tokens.color.text }}>
            Trục
          </label>
          <select
            value={selectedAxis !== null ? selectedAxis : ''}
            onChange={(e) => onAxisChange(e.target.value !== '' ? parseInt(e.target.value) : null)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: '1rem',
            }}
          >
            <option value="">Chọn trục</option>
            {Array.from({ length: building.maxAxis + 1 }, (_, i) => i).map((axis) => (
              <option key={axis} value={axis}>
                Trục {axis.toString().padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Unit Number Preview - Requirements: 6.5 */}
      {selectedFloor && selectedAxis !== null && (
        <div
          style={{
            padding: '1rem',
            borderRadius: tokens.radius.md,
            background: `${tokens.color.primary}15`,
            border: `1px solid ${tokens.color.primary}`,
            marginBottom: '1rem',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: tokens.color.muted }}>Số căn hộ:</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: tokens.color.primary }}>
            {calculateUnitNumber(building.code, selectedFloor, selectedAxis)}
          </div>
        </div>
      )}

      <NavigationButtons
        onBack={onBack}
        onNext={handleNext}
        nextDisabled={!selectedFloor || selectedAxis === null}
        showBack={true}
      />
    </motion.div>
  );
});

// ============================================
// MAIN STEP SELECTOR COMPONENT
// Requirements: 6.1, 6.2, 6.3, 6.4
// ============================================

export const StepSelector = memo(function StepSelector({
  currentStep,
  selections,
  onSelect,
  developers,
  projects,
  buildings,
  onBack,
  onError,
}: StepSelectorProps) {
  // Local state for floor/axis before confirmation
  const [localFloor, setLocalFloor] = useState<number | null>(selections.floor);
  const [localAxis, setLocalAxis] = useState<number | null>(selections.axis);

  // Sync local state when selections change
  const handleFloorChange = useCallback((floor: number | null) => {
    setLocalFloor(floor);
  }, []);

  const handleAxisChange = useCallback((axis: number | null) => {
    setLocalAxis(axis);
  }, []);

  const handleFloorAxisNext = useCallback(async () => {
    if (localFloor && localAxis !== null) {
      await onSelect.floorAxis(localFloor, localAxis);
    }
  }, [localFloor, localAxis, onSelect]);

  // Render based on current step
  switch (currentStep) {
    case 1:
      return (
        <Step1Developer
          developers={developers}
          selectedDeveloper={selections.developer}
          onSelect={onSelect.developer}
        />
      );

    case 2:
      return (
        <Step2Project
          projects={projects}
          selectedProject={selections.project}
          selectedDeveloper={selections.developer}
          onSelect={onSelect.project}
          onBack={onBack}
        />
      );

    case 3:
      return (
        <Step3Building
          buildings={buildings}
          selectedBuilding={selections.building}
          selectedProject={selections.project}
          onSelect={onSelect.building}
          onBack={onBack}
        />
      );

    case 4:
      if (!selections.building) return null;
      return (
        <Step4FloorAxis
          building={selections.building}
          selectedFloor={localFloor}
          selectedAxis={localAxis}
          onFloorChange={handleFloorChange}
          onAxisChange={handleAxisChange}
          onNext={handleFloorAxisNext}
          onBack={onBack}
          onError={onError}
        />
      );

    default:
      return null;
  }
});

export default StepSelector;
