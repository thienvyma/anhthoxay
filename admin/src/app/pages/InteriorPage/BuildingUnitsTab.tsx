/**
 * Building Units Tab - Manage interior building units with matrix view
 * Task 22.1: Full implementation with matrix grid and CRUD
 * Requirements: 4.1-4.7
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { interiorBuildingUnitsApi, interiorBuildingsApi, interiorLayoutsApi } from '../../api';
import type {
  InteriorBuildingUnit,
  InteriorBuilding,
  InteriorUnitLayout,
  CreateBuildingUnitInput,
  UpdateBuildingUnitInput,
  UnitType,
  UnitPosition,
} from '../../types';

const UNIT_TYPES: { value: UnitType; label: string }[] = [
  { value: 'STUDIO', label: 'Studio' },
  { value: '1PN', label: '1 Phòng ngủ' },
  { value: '2PN', label: '2 Phòng ngủ' },
  { value: '3PN', label: '3 Phòng ngủ' },
  { value: '4PN', label: '4 Phòng ngủ' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'SHOPHOUSE', label: 'Shophouse' },
];

const UNIT_POSITIONS: { value: UnitPosition; label: string }[] = [
  { value: 'CORNER', label: 'Góc' },
  { value: 'EDGE', label: 'Biên' },
  { value: 'MIDDLE', label: 'Giữa' },
];

const DIRECTIONS = ['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'];
const VIEWS = ['Hồ bơi', 'Công viên', 'Sông', 'Thành phố', 'Nội khu', 'Đường phố'];


// ========== UNIT MODAL ==========

interface UnitModalProps {
  unit?: InteriorBuildingUnit | null;
  building: InteriorBuilding;
  layouts: InteriorUnitLayout[];
  axis?: string;
  floor?: number;
  onClose: () => void;
  onSave: (data: CreateBuildingUnitInput | UpdateBuildingUnitInput) => Promise<void>;
  onDelete?: (unitId: string) => Promise<void>;
}

function UnitModal({ unit, building, layouts, axis, floor, onClose, onSave, onDelete }: UnitModalProps) {
  const [form, setForm] = useState<CreateBuildingUnitInput>({
    buildingId: building.id,
    axis: unit?.axis || axis || building.axisLabels[0] || 'A',
    unitType: unit?.unitType || '2PN',
    bedrooms: unit?.bedrooms || 2,
    bathrooms: unit?.bathrooms || 2,
    position: unit?.position || 'MIDDLE',
    direction: unit?.direction || '',
    view: unit?.view || '',
    floorStart: unit?.floorStart || floor || building.startFloor,
    floorEnd: unit?.floorEnd || undefined,
    layoutId: unit?.layoutId || '',
    notes: unit?.notes || '',
    isActive: unit?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter layouts by unit type
  const filteredLayouts = useMemo(() => {
    return layouts.filter((l) => l.unitType === form.unitType);
  }, [layouts, form.unitType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.layoutId) {
      setError('Vui lòng chọn layout');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const updateField = useCallback(
    <K extends keyof CreateBuildingUnitInput>(field: K, value: CreateBuildingUnitInput[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Reset layoutId when unitType changes
  useEffect(() => {
    if (!filteredLayouts.find((l) => l.id === form.layoutId)) {
      setForm((prev) => ({ ...prev, layoutId: '' }));
    }
  }, [form.unitType, filteredLayouts, form.layoutId]);

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9998,
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(600px, 95vw)',
            maxHeight: '90vh',
            overflow: 'auto',
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.color.border}`,
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${tokens.color.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              background: tokens.color.surface,
              zIndex: 1,
            }}
          >
            <h3 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
              {unit ? 'Chỉnh sửa căn hộ' : 'Thêm căn hộ mới'}
            </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: tokens.color.muted,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <i className="ri-close-line" style={{ fontSize: 20 }} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {error && (
            <div
              style={{
                padding: '10px 12px',
                background: `${tokens.color.error}20`,
                border: `1px solid ${tokens.color.error}40`,
                borderRadius: tokens.radius.md,
                color: tokens.color.error,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Axis & Unit Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Trục
                </label>
                <select
                  value={form.axis}
                  onChange={(e) => updateField('axis', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                >
                  {building.axisLabels.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Loại căn hộ
                </label>
                <select
                  value={form.unitType}
                  onChange={(e) => updateField('unitType', e.target.value as UnitType)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                >
                  {UNIT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bedrooms & Bathrooms */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Phòng ngủ
                </label>
                <input
                  type="number"
                  value={form.bedrooms}
                  onChange={(e) => updateField('bedrooms', parseInt(e.target.value) || 0)}
                  min={0}
                  max={10}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Phòng tắm
                </label>
                <input
                  type="number"
                  value={form.bathrooms || ''}
                  onChange={(e) => updateField('bathrooms', e.target.value ? parseInt(e.target.value) : undefined)}
                  min={0}
                  max={10}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Vị trí
                </label>
                <select
                  value={form.position || 'MIDDLE'}
                  onChange={(e) => updateField('position', e.target.value as UnitPosition)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                >
                  {UNIT_POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Direction & View */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  Hướng
                </label>
                <select
                  value={form.direction || ''}
                  onChange={(e) => updateField('direction', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                >
                  <option value="">-- Chọn hướng --</option>
                  {DIRECTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
                >
                  View
                </label>
                <select
                  value={form.view || ''}
                  onChange={(e) => updateField('view', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                >
                  <option value="">-- Chọn view --</option>
                  {VIEWS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Floor Range */}
            <div
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <h4 style={{ margin: '0 0 12px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
                <i className="ri-stack-line" style={{ marginRight: 8 }} />
                Phạm vi tầng
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}
                  >
                    Từ tầng
                  </label>
                  <input
                    type="number"
                    value={form.floorStart || building.startFloor}
                    onChange={(e) => updateField('floorStart', parseInt(e.target.value) || building.startFloor)}
                    min={building.startFloor}
                    max={building.endFloor || building.startFloor + building.totalFloors - 1}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: tokens.radius.sm,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{ display: 'block', color: tokens.color.muted, fontSize: 12, marginBottom: 4 }}
                  >
                    Đến tầng (để trống = tất cả)
                  </label>
                  <input
                    type="number"
                    value={form.floorEnd || ''}
                    onChange={(e) =>
                      updateField('floorEnd', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="Tất cả"
                    min={form.floorStart || building.startFloor}
                    max={building.endFloor || building.startFloor + building.totalFloors - 1}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: tokens.radius.sm,
                      border: `1px solid ${tokens.color.border}`,
                      background: tokens.color.background,
                      color: tokens.color.text,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Layout Selection */}
            <div>
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Layout <span style={{ color: tokens.color.error }}>*</span>
              </label>
              {filteredLayouts.length === 0 ? (
                <div
                  style={{
                    padding: 16,
                    background: `${tokens.color.warning}10`,
                    border: `1px solid ${tokens.color.warning}40`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.warning,
                    fontSize: 13,
                  }}
                >
                  <i className="ri-alert-line" style={{ marginRight: 8 }} />
                  Không có layout nào cho loại căn hộ {form.unitType}. Vui lòng tạo layout trước.
                </div>
              ) : (
                <select
                  value={form.layoutId}
                  onChange={(e) => updateField('layoutId', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                    background: tokens.color.background,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                  }}
                >
                  <option value="">-- Chọn layout --</option>
                  {filteredLayouts.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code}) - {l.grossArea}m²
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Notes */}
            <div>
              <label
                style={{ display: 'block', color: tokens.color.muted, fontSize: 13, marginBottom: 6 }}
              >
                Ghi chú
              </label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Ghi chú thêm..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.color.border}`,
                  background: tokens.color.background,
                  color: tokens.color.text,
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Active Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label
                htmlFor="isActive"
                style={{ color: tokens.color.text, fontSize: 14, cursor: 'pointer' }}
              >
                Hiển thị trên trang báo giá
              </label>
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              marginTop: 24,
              paddingTop: 16,
              borderTop: `1px solid ${tokens.color.border}`,
            }}
          >
            {unit && onDelete ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  if (confirm('Bạn có chắc muốn xóa căn hộ này?')) {
                    await onDelete(unit.id);
                    onClose();
                  }
                }}
                style={{
                  padding: '10px 16px',
                  background: `${tokens.color.error}20`,
                  border: `1px solid ${tokens.color.error}40`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.error,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                <i className="ri-delete-bin-line" style={{ marginRight: 6 }} />
                Xóa
              </motion.button>
            ) : (
              <div />
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Hủy
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={saving || filteredLayouts.length === 0}
              style={{
                padding: '10px 20px',
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                border: 'none',
                borderRadius: tokens.radius.md,
                color: '#111',
                fontSize: 14,
                fontWeight: 600,
                cursor: saving || filteredLayouts.length === 0 ? 'not-allowed' : 'pointer',
                opacity: saving || filteredLayouts.length === 0 ? 0.7 : 1,
              }}
            >
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <motion.i
                    className="ri-loader-4-line"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Đang lưu...
                </span>
              ) : unit ? (
                'Cập nhật'
              ) : (
                'Thêm mới'
              )}
            </motion.button>
            </div>
          </div>
        </form>
        </motion.div>
      </div>
    </>,
    document.body
  );
}


// ========== MATRIX CELL ==========

interface MatrixCellProps {
  unit?: InteriorBuildingUnit;
  axis: string;
  floor: number;
  onClick: () => void;
}

function MatrixCell({ unit, axis, floor, onClick }: MatrixCellProps) {
  const hasUnit = !!unit;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={unit ? `${unit.layout?.name || 'N/A'} - ${unit.unitType}` : `Thêm căn ${axis} tầng ${floor}`}
      style={{
        width: 80,
        height: 60,
        padding: 4,
        borderRadius: tokens.radius.sm,
        border: `1px solid ${hasUnit ? tokens.color.primary + '40' : tokens.color.border}`,
        background: hasUnit ? `${tokens.color.primary}10` : 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      {hasUnit ? (
        <>
          <span
            style={{
              fontSize: 10,
              color: tokens.color.primary,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {unit.layout?.code || 'N/A'}
          </span>
          <span style={{ fontSize: 9, color: tokens.color.muted }}>{unit.unitType}</span>
        </>
      ) : (
        <i className="ri-add-line" style={{ fontSize: 16, color: tokens.color.muted }} />
      )}
    </motion.button>
  );
}

// ========== MAIN COMPONENT ==========

export function BuildingUnitsTab() {
  const [buildings, setBuildings] = useState<InteriorBuilding[]>([]);
  const [layouts, setLayouts] = useState<InteriorUnitLayout[]>([]);
  const [units, setUnits] = useState<InteriorBuildingUnit[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<InteriorBuildingUnit | null>(null);
  const [selectedAxis, setSelectedAxis] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);

  const selectedBuilding = useMemo(
    () => buildings.find((b) => b.id === selectedBuildingId),
    [buildings, selectedBuildingId]
  );

  // Generate floor range
  const floors = useMemo(() => {
    if (!selectedBuilding) return [];
    const start = selectedBuilding.startFloor;
    const end = selectedBuilding.endFloor || start + selectedBuilding.totalFloors - 1;
    const result: number[] = [];
    for (let i = end; i >= start; i--) {
      result.push(i);
    }
    return result;
  }, [selectedBuilding]);

  // Create unit map for quick lookup
  const unitMap = useMemo(() => {
    const map = new Map<string, InteriorBuildingUnit>();
    units.forEach((u) => {
      // A unit can span multiple floors
      const start = u.floorStart;
      const end = u.floorEnd || start;
      for (let f = start; f <= end; f++) {
        map.set(`${u.axis}-${f}`, u);
      }
    });
    return map;
  }, [units]);

  // Fetch buildings
  const fetchBuildings = useCallback(async () => {
    try {
      const response = await interiorBuildingsApi.list({ limit: 100 });
      setBuildings(response.data || []);
      if (response.data && response.data.length > 0 && !selectedBuildingId) {
        setSelectedBuildingId(response.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch buildings:', err);
    }
  }, [selectedBuildingId]);

  // Fetch layouts
  const fetchLayouts = useCallback(async () => {
    try {
      const response = await interiorLayoutsApi.list({ limit: 100 });
      setLayouts(response.data || []);
    } catch (err) {
      console.error('Failed to fetch layouts:', err);
    }
  }, []);

  // Fetch units for selected building
  const fetchUnits = useCallback(async () => {
    if (!selectedBuildingId) {
      setUnits([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await interiorBuildingUnitsApi.getByBuilding(selectedBuildingId);
      setUnits(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách căn hộ');
    } finally {
      setLoading(false);
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    fetchBuildings();
    fetchLayouts();
  }, [fetchBuildings, fetchLayouts]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Handle cell click
  const handleCellClick = useCallback(
    (axis: string, floor: number) => {
      const existingUnit = unitMap.get(`${axis}-${floor}`);
      if (existingUnit) {
        setEditingUnit(existingUnit);
      } else {
        setEditingUnit(null);
        setSelectedAxis(axis);
        setSelectedFloor(floor);
      }
      setShowModal(true);
    },
    [unitMap]
  );

  // Create unit
  const handleCreate = async (data: CreateBuildingUnitInput) => {
    await interiorBuildingUnitsApi.create(data);
    await fetchUnits();
  };

  // Update unit
  const handleUpdate = async (data: UpdateBuildingUnitInput) => {
    if (!editingUnit) return;
    await interiorBuildingUnitsApi.update(editingUnit.id, data);
    await fetchUnits();
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Building Selector */}
          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: tokens.color.background,
              color: tokens.color.text,
              fontSize: 14,
              outline: 'none',
              minWidth: 250,
            }}
          >
            <option value="">-- Chọn tòa nhà --</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.development?.name || 'N/A'})
              </option>
            ))}
          </select>

          {selectedBuilding && (
            <span style={{ color: tokens.color.muted, fontSize: 13 }}>
              {selectedBuilding.totalFloors} tầng • {selectedBuilding.axisLabels.length} trục •{' '}
              {units.length} căn hộ
            </span>
          )}
        </div>

        {selectedBuilding && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingUnit(null);
              setSelectedAxis(selectedBuilding.axisLabels[0] || 'A');
              setSelectedFloor(selectedBuilding.startFloor);
              setShowModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              border: 'none',
              borderRadius: tokens.radius.md,
              color: '#111',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <i className="ri-add-line" style={{ fontSize: 18 }} />
            Thêm căn hộ
          </motion.button>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border}`,
          overflow: 'hidden',
        }}
      >
        {!selectedBuildingId ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-building-2-line" style={{ fontSize: 48, color: tokens.color.muted }} />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>
              Vui lòng chọn tòa nhà để xem ma trận căn hộ
            </p>
          </div>
        ) : loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <motion.i
              className="ri-loader-4-line"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 32, color: tokens.color.primary }}
            />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>Đang tải...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-error-warning-line" style={{ fontSize: 48, color: tokens.color.error }} />
            <p style={{ color: tokens.color.error, marginTop: 12 }}>{error}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchUnits}
              style={{
                marginTop: 12,
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.text,
                cursor: 'pointer',
              }}
            >
              Thử lại
            </motion.button>
          </div>
        ) : selectedBuilding ? (
          <div style={{ padding: 16, overflowX: 'auto' }}>
            {/* Matrix Header */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <div
                style={{
                  width: 50,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tokens.color.muted,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Tầng
              </div>
              {selectedBuilding.axisLabels.map((axis) => (
                <div
                  key={axis}
                  style={{
                    width: 80,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${tokens.color.primary}20`,
                    borderRadius: tokens.radius.sm,
                    color: tokens.color.primary,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {axis}
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {floors.map((floor) => (
              <div key={floor} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <div
                  style={{
                    width: 50,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: tokens.radius.sm,
                    color: tokens.color.text,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {floor}
                </div>
                {selectedBuilding.axisLabels.map((axis) => (
                  <MatrixCell
                    key={`${axis}-${floor}`}
                    unit={unitMap.get(`${axis}-${floor}`)}
                    axis={axis}
                    floor={floor}
                    onClick={() => handleCellClick(axis, floor)}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Legend */}
      {selectedBuilding && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: tokens.color.surface,
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: tokens.radius.sm,
                background: `${tokens.color.primary}10`,
                border: `1px solid ${tokens.color.primary}40`,
              }}
            />
            <span style={{ color: tokens.color.muted, fontSize: 12 }}>Đã có layout</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: tokens.radius.sm,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${tokens.color.border}`,
              }}
            />
            <span style={{ color: tokens.color.muted, fontSize: 12 }}>Chưa có layout</span>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && selectedBuilding && (
          <UnitModal
            unit={editingUnit}
            building={selectedBuilding}
            layouts={layouts}
            axis={selectedAxis}
            floor={selectedFloor}
            onClose={() => {
              setShowModal(false);
              setEditingUnit(null);
            }}
            onSave={async (data) => {
              if (editingUnit) {
                await handleUpdate(data as UpdateBuildingUnitInput);
              } else {
                await handleCreate(data as CreateBuildingUnitInput);
              }
            }}
            onDelete={async (unitId) => {
              await interiorBuildingUnitsApi.delete(unitId);
              await fetchUnits();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
