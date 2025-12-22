/**
 * Profile Form Component
 *
 * Handles basic info form (description, experience), specialties, and service areas
 *
 * **Feature: code-refactoring**
 * **Requirements: 4.1, 4.2 - Extract form logic and validation**
 */

import { motion } from 'framer-motion';
import type { Region } from '../../../api';

// Specialty options
export const SPECIALTY_OPTIONS = [
  'Xây dựng',
  'Sơn',
  'Ốp lát',
  'Điện',
  'Nước',
  'Mộc',
  'Nhôm kính',
  'Thạch cao',
  'Chống thấm',
  'Cơ khí',
  'Nội thất',
  'Cảnh quan',
];

export interface ProfileFormProps {
  description: string;
  setDescription: (value: string) => void;
  experience: string;
  setExperience: (value: string) => void;
  specialties: string[];
  toggleSpecialty: (specialty: string) => void;
  serviceAreas: string[];
  toggleServiceArea: (regionId: string) => void;
  regions: Region[];
}

export function ProfileForm({
  description,
  setDescription,
  experience,
  setExperience,
  specialties,
  toggleSpecialty,
  serviceAreas,
  toggleServiceArea,
  regions,
}: ProfileFormProps) {
  return (
    <>
      {/* Basic Info - Requirement 12.1, 12.2 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card"
        style={{ padding: 24, marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 20 }}>
          Thông tin cơ bản
        </h2>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 500,
              color: '#e4e7ec',
              marginBottom: 8,
            }}
          >
            Giới thiệu <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả về bản thân hoặc công ty của bạn..."
            className="input"
            rows={4}
            style={{ resize: 'vertical', minHeight: 100 }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#e4e7ec',
                marginBottom: 8,
              }}
            >
              Số năm kinh nghiệm
            </label>
            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="VD: 5"
              className="input"
              min="0"
              max="50"
            />
          </div>
        </div>
      </motion.div>

      {/* Specialties - Requirement 12.2 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
        style={{ padding: 24, marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 20 }}>
          Chuyên môn
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SPECIALTY_OPTIONS.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => toggleSpecialty(specialty)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: specialties.includes(specialty)
                  ? '1px solid #f5d393'
                  : '1px solid #3f3f46',
                background: specialties.includes(specialty)
                  ? 'rgba(245, 211, 147, 0.15)'
                  : 'transparent',
                color: specialties.includes(specialty) ? '#f5d393' : '#a1a1aa',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.2s',
              }}
            >
              {specialty}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Service Areas - Requirement 12.2 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card"
        style={{ padding: 24, marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 20 }}>
          Khu vực hoạt động
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {regions.map((region) => (
            <button
              key={region.id}
              type="button"
              onClick={() => toggleServiceArea(region.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: serviceAreas.includes(region.id)
                  ? '1px solid #3b82f6'
                  : '1px solid #3f3f46',
                background: serviceAreas.includes(region.id)
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'transparent',
                color: serviceAreas.includes(region.id) ? '#3b82f6' : '#a1a1aa',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.2s',
              }}
            >
              {region.name}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
