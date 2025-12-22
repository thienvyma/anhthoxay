/**
 * Project Details Form Components
 *
 * Step 2 (Location) and Step 3 (Details) of project creation wizard:
 * - Region selection
 * - Address input
 * - Area, budget, timeline inputs
 * - Special requirements textarea
 *
 * **Feature: code-refactoring**
 * **Requirements: 4.1, 4.2, 7.2, 7.3**
 */

import { motion } from 'framer-motion';
import type { Region } from '../../../api';

// ============================================================================
// Project Location Component (Step 2)
// ============================================================================

export interface ProjectLocationProps {
  regionId: string;
  address: string;
  regions: Region[];
  errors: {
    regionId?: string;
  };
  onUpdate: (field: 'regionId' | 'address', value: string) => void;
}

export function ProjectLocation({
  regionId,
  address,
  regions,
  errors,
  onUpdate,
}: ProjectLocationProps) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 24 }}>
        Vị trí dự án
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Region Select */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#e4e7ec', fontSize: 14 }}>
            Khu vực <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            className="input"
            value={regionId}
            onChange={(e) => onUpdate('regionId', e.target.value)}
            style={{ borderColor: errors.regionId ? '#ef4444' : undefined }}
          >
            <option value="">Chọn khu vực</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {errors.regionId && (
            <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
              {errors.regionId}
            </span>
          )}
        </div>

        {/* Address Input */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#e4e7ec', fontSize: 14 }}>
            Địa chỉ cụ thể
          </label>
          <input
            type="text"
            className="input"
            placeholder="VD: 123 Nguyễn Văn A, Phường X, Quận Y"
            value={address}
            onChange={(e) => onUpdate('address', e.target.value)}
          />
          <span style={{ color: '#71717a', fontSize: 12, marginTop: 4, display: 'block' }}>
            Địa chỉ chỉ hiển thị cho nhà thầu được chọn
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Project Details Component (Step 3)
// ============================================================================

export interface ProjectDetailsProps {
  area: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
  requirements: string;
  errors: {
    budgetMax?: string;
  };
  onUpdate: (field: 'area' | 'budgetMin' | 'budgetMax' | 'timeline' | 'requirements', value: string) => void;
}

export function ProjectDetails({
  area,
  budgetMin,
  budgetMax,
  timeline,
  requirements,
  errors,
  onUpdate,
}: ProjectDetailsProps) {
  const formatCurrency = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 24 }}>
        Chi tiết dự án
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Area Input */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#e4e7ec', fontSize: 14 }}>
            Diện tích (m²)
          </label>
          <input
            type="number"
            className="input"
            placeholder="VD: 50"
            value={area}
            onChange={(e) => onUpdate('area', e.target.value)}
          />
        </div>

        {/* Budget Range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: '#e4e7ec', fontSize: 14 }}>
              Ngân sách tối thiểu (VNĐ)
            </label>
            <input
              type="number"
              className="input"
              placeholder="VD: 5000000"
              value={budgetMin}
              onChange={(e) => onUpdate('budgetMin', e.target.value)}
            />
            {budgetMin && (
              <span style={{ color: '#71717a', fontSize: 12, marginTop: 4, display: 'block' }}>
                {formatCurrency(budgetMin)} VNĐ
              </span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: '#e4e7ec', fontSize: 14 }}>
              Ngân sách tối đa (VNĐ)
            </label>
            <input
              type="number"
              className="input"
              placeholder="VD: 10000000"
              value={budgetMax}
              onChange={(e) => onUpdate('budgetMax', e.target.value)}
              style={{ borderColor: errors.budgetMax ? '#ef4444' : undefined }}
            />
            {errors.budgetMax ? (
              <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
                {errors.budgetMax}
              </span>
            ) : budgetMax ? (
              <span style={{ color: '#71717a', fontSize: 12, marginTop: 4, display: 'block' }}>
                {formatCurrency(budgetMax)} VNĐ
              </span>
            ) : null}
          </div>
        </div>

        {/* Timeline Input */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#e4e7ec', fontSize: 14 }}>
            Timeline mong muốn
          </label>
          <input
            type="text"
            className="input"
            placeholder="VD: 2-3 tuần"
            value={timeline}
            onChange={(e) => onUpdate('timeline', e.target.value)}
          />
        </div>

        {/* Requirements Textarea */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#e4e7ec', fontSize: 14 }}>
            Yêu cầu đặc biệt
          </label>
          <textarea
            className="input"
            rows={3}
            placeholder="Các yêu cầu đặc biệt khác..."
            value={requirements}
            onChange={(e) => onUpdate('requirements', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
