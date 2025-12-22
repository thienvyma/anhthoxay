/**
 * Project Basic Info Form Component
 *
 * Step 1 of project creation wizard:
 * - Title input with validation
 * - Category selection
 * - Description textarea with character count
 *
 * **Feature: code-refactoring**
 * **Requirements: 4.1, 4.2, 7.1**
 */

import { motion } from 'framer-motion';
import type { ServiceCategory } from '../../../api';

export interface ProjectBasicInfoProps {
  title: string;
  description: string;
  categoryId: string;
  categories: ServiceCategory[];
  errors: {
    title?: string;
    description?: string;
    categoryId?: string;
  };
  onUpdate: (field: 'title' | 'description' | 'categoryId', value: string) => void;
}

export function ProjectBasicInfo({
  title,
  description,
  categoryId,
  categories,
  errors,
  onUpdate,
}: ProjectBasicInfoProps) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 24 }}>
        Thông tin cơ bản
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Title Input */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#e4e7ec', fontSize: 14 }}>
            Tiêu đề dự án <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="VD: Sơn lại căn hộ 2 phòng ngủ"
            value={title}
            onChange={(e) => onUpdate('title', e.target.value)}
            style={{ borderColor: errors.title ? '#ef4444' : undefined }}
          />
          {errors.title && (
            <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
              {errors.title}
            </span>
          )}
        </div>

        {/* Category Select */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#e4e7ec', fontSize: 14 }}>
            Danh mục <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            className="input"
            value={categoryId}
            onChange={(e) => onUpdate('categoryId', e.target.value)}
            style={{ borderColor: errors.categoryId ? '#ef4444' : undefined }}
          >
            <option value="">Chọn danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
              {errors.categoryId}
            </span>
          )}
        </div>

        {/* Description Textarea */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#e4e7ec', fontSize: 14 }}>
            Mô tả chi tiết <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            className="input"
            rows={5}
            placeholder="Mô tả chi tiết về dự án, yêu cầu cụ thể..."
            value={description}
            onChange={(e) => onUpdate('description', e.target.value)}
            style={{ borderColor: errors.description ? '#ef4444' : undefined, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {errors.description ? (
              <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.description}</span>
            ) : (
              <span />
            )}
            <span style={{ color: '#71717a', fontSize: 12 }}>
              {description.length}/50 ký tự tối thiểu
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
