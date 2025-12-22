/**
 * UnitStep - Step 4: Select unit by code or floor+axis
 */

import { tokens, API_URL } from '@app/shared';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import type { Building, BuildingUnit, Layout } from '../types';

interface UnitStepProps {
  building: Building | null;
  selected: BuildingUnit | null;
  onSelect: (unit: BuildingUnit, layout: Layout) => void;
  onBack: () => void;
}

type InputMode = 'code' | 'selector';

export function UnitStep({ building, selected, onSelect, onBack }: UnitStepProps) {
  const [mode, setMode] = useState<InputMode>('selector');
  const [unitCode, setUnitCode] = useState(selected?.code || '');
  const [floor, setFloor] = useState<number | ''>(selected?.floor || '');
  const [axis, setAxis] = useState(selected?.axis || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitInfo, setUnitInfo] = useState<{ unit: BuildingUnit; layout: Layout } | null>(
    null
  );

  // Generate floors array (endFloor defaults to startFloor + totalFloors - 1 if not set)
  const floors = building
    ? Array.from(
        { length: (building.endFloor ?? (building.startFloor + building.totalFloors - 1)) - building.startFloor + 1 },
        (_, i) => building.startFloor + i
      )
    : [];

  // Generate unit code from floor + axis
  const generateUnitCode = useCallback(
    (f: number, a: string) => {
      if (!building || !f || !a) return '';
      return building.unitCodeFormat
        .replace('{building}', building.code)
        .replace('{floor}', String(f))
        .replace('{axis}', a);
    },
    [building]
  );

  // Fetch unit info
  const fetchUnit = useCallback(
    async (code: string) => {
      if (!building || !code) return;

      try {
        setLoading(true);
        setError(null);
        setUnitInfo(null);

        const response = await fetch(
          `${API_URL}/api/interior/buildings/${building.id}/units/lookup?code=${encodeURIComponent(code)}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Không tìm thấy căn hộ với mã này');
          }
          throw new Error('Có lỗi xảy ra');
        }

        const json = await response.json();
        const data = json.data || json;
        setUnitInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    },
    [building]
  );

  // Auto-fetch when floor + axis selected
  useEffect(() => {
    if (mode === 'selector' && floor && axis) {
      const code = generateUnitCode(floor as number, axis);
      if (code) {
        fetchUnit(code);
      }
    }
  }, [mode, floor, axis, generateUnitCode, fetchUnit]);

  const handleCodeSubmit = () => {
    if (unitCode.trim()) {
      fetchUnit(unitCode.trim());
    }
  };

  const handleContinue = () => {
    if (unitInfo) {
      onSelect(unitInfo.unit, unitInfo.layout);
    }
  };

  if (!building) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: tokens.color.error }}>Vui lòng chọn tòa nhà trước</p>
      </div>
    );
  }

  return (
    <div>
      <BackButton onClick={onBack} />
      <h2 style={headerStyle}>Chọn Căn Hộ</h2>
      <p style={subtitleStyle}>Nhập mã căn hộ hoặc chọn tầng và trục</p>

      {/* Mode Tabs */}
      <div style={tabsStyle}>
        <button
          onClick={() => setMode('selector')}
          style={{
            ...tabStyle,
            ...(mode === 'selector' ? activeTabStyle : {}),
          }}
        >
          <i className="ri-grid-line" style={{ marginRight: '0.5rem' }} />
          Chọn Tầng & Trục
        </button>
        <button
          onClick={() => setMode('code')}
          style={{
            ...tabStyle,
            ...(mode === 'code' ? activeTabStyle : {}),
          }}
        >
          <i className="ri-keyboard-line" style={{ marginRight: '0.5rem' }} />
          Nhập Mã Căn
        </button>
      </div>

      {/* Input Section */}
      <div style={inputSectionStyle}>
        {mode === 'code' ? (
          <div>
            <label style={labelStyle}>Mã căn hộ</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                placeholder={`VD: ${building.code}.15.A`}
                style={inputStyle}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCodeSubmit}
                disabled={!unitCode.trim() || loading}
                style={searchButtonStyle}
              >
                {loading ? (
                  <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <i className="ri-search-line" />
                )}
              </motion.button>
            </div>
            <p style={hintStyle}>
              Format: {building.unitCodeFormat.replace('{building}', building.code)}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Tầng</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value ? Number(e.target.value) : '')}
                style={selectStyle}
              >
                <option value="">Chọn tầng</option>
                {floors.map((f) => (
                  <option key={f} value={f}>
                    Tầng {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Trục</label>
              <select
                value={axis}
                onChange={(e) => setAxis(e.target.value)}
                style={selectStyle}
              >
                <option value="">Chọn trục</option>
                {building.axisLabels.map((a) => (
                  <option key={a} value={a}>
                    Trục {a}
                  </option>
                ))}
              </select>
            </div>
            {floor && axis && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ color: tokens.color.textMuted, fontSize: '0.875rem' }}>
                  Mã căn hộ:{' '}
                  <strong style={{ color: tokens.color.primary }}>
                    {generateUnitCode(floor as number, axis)}
                  </strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={errorStyle}
        >
          <i className="ri-error-warning-line" style={{ marginRight: '0.5rem' }} />
          {error}
        </motion.div>
      )}

      {/* Unit Info */}
      {unitInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={unitInfoStyle}
        >
          <h3 style={{ margin: '0 0 1rem', color: tokens.color.text, fontSize: '1rem' }}>
            <i className="ri-home-4-line" style={{ marginRight: '0.5rem' }} />
            Thông tin căn hộ
          </h3>
          <div style={infoGridStyle}>
            <InfoItem label="Mã căn" value={unitInfo.unit.code} />
            <InfoItem label="Loại căn" value={unitInfo.unit.unitType} />
            <InfoItem label="Phòng ngủ" value={`${unitInfo.unit.bedrooms} PN`} />
            <InfoItem label="Phòng tắm" value={`${unitInfo.unit.bathrooms} PT`} />
            <InfoItem label="DT tim tường" value={`${unitInfo.layout.grossArea} m²`} />
            <InfoItem label="DT thông thủy" value={`${unitInfo.layout.netArea} m²`} />
            {unitInfo.unit.direction && (
              <InfoItem label="Hướng" value={unitInfo.unit.direction} />
            )}
            {unitInfo.unit.view && <InfoItem label="View" value={unitInfo.unit.view} />}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            style={continueButtonStyle}
          >
            Tiếp tục
            <i className="ri-arrow-right-line" style={{ marginLeft: '0.5rem' }} />
          </motion.button>
        </motion.div>
      )}
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

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div style={{ color: tokens.color.textMuted, fontSize: '0.75rem' }}>{label}</div>
      <div style={{ color: tokens.color.text, fontWeight: 500 }}>{value ?? '-'}</div>
    </div>
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

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1.5rem',
  background: tokens.color.surface,
  padding: '0.25rem',
  borderRadius: tokens.radius.md,
};

const tabStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  background: 'transparent',
  border: 'none',
  borderRadius: tokens.radius.sm,
  color: tokens.color.textMuted,
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
  transition: 'all 0.2s',
};

const activeTabStyle: React.CSSProperties = {
  background: tokens.color.primary,
  color: tokens.color.background,
};

const inputSectionStyle: React.CSSProperties = {
  background: tokens.color.surface,
  padding: '1.5rem',
  borderRadius: tokens.radius.lg,
  marginBottom: '1rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: tokens.color.text,
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem 1rem',
  background: tokens.color.background,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  color: tokens.color.text,
  fontSize: '1rem',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: tokens.color.background,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  color: tokens.color.text,
  fontSize: '1rem',
  outline: 'none',
  cursor: 'pointer',
};

const searchButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  background: tokens.color.primary,
  border: 'none',
  borderRadius: tokens.radius.md,
  color: tokens.color.background,
  cursor: 'pointer',
  fontSize: '1rem',
  minHeight: '44px', // Touch target
};

const hintStyle: React.CSSProperties = {
  color: tokens.color.textMuted,
  fontSize: '0.75rem',
  marginTop: '0.5rem',
};

const errorStyle: React.CSSProperties = {
  background: `${tokens.color.error}15`,
  border: `1px solid ${tokens.color.error}30`,
  borderRadius: tokens.radius.md,
  padding: '1rem',
  color: tokens.color.error,
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
};

const unitInfoStyle: React.CSSProperties = {
  background: `${tokens.color.primary}10`,
  border: `1px solid ${tokens.color.primary}30`,
  borderRadius: tokens.radius.lg,
  padding: '1.5rem',
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 120px), 1fr))',
  gap: 'clamp(0.75rem, 2vw, 1rem)',
  marginBottom: '1.5rem',
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

export default UnitStep;
