/**
 * UnitStep - Step 4: Select Floor and Axis
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.4, 6.4, 6.5**
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { FurnitureBuilding } from '../../../api/furniture';
import { NavigationButtons } from '../components';
import { calculateUnitNumber } from '../constants';

interface UnitStepProps {
  building: FurnitureBuilding;
  floor: number | null;
  axis: number | null;
  onFloorChange: (floor: number | null) => void;
  onAxisChange: (axis: number | null) => void;
  onNext: () => void;
  onBack: () => void;
  nextDisabled: boolean;
}

export const UnitStep = memo(function UnitStep({
  building,
  floor,
  axis,
  onFloorChange,
  onAxisChange,
  onNext,
  onBack,
  nextDisabled,
}: UnitStepProps) {
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
            value={floor || ''}
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
            {Array.from({ length: building.maxFloor }, (_, i) => i + 1).map((f) => (
              <option key={f} value={f}>
                Tầng {f}
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
            value={axis !== null ? axis : ''}
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
            {Array.from({ length: building.maxAxis + 1 }, (_, i) => i).map((a) => (
              <option key={a} value={a}>
                Trục {a.toString().padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Unit Number Preview */}
      {floor && axis !== null && (
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
            {calculateUnitNumber(building.code, floor, axis)}
          </div>
        </div>
      )}

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={nextDisabled}
        showBack={true}
      />
    </motion.div>
  );
});
