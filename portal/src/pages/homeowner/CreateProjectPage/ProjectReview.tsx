/**
 * Project Review Component
 *
 * Step 5 of project creation wizard:
 * - Summary of all entered information
 * - Basic info, location, details, images preview
 *
 * **Feature: code-refactoring**
 * **Requirements: 4.1, 4.2, 7.5**
 */

import { motion } from 'framer-motion';
import { LazyImage } from '../../../components/LazyImage';
import type { ServiceCategory, Region } from '../../../api';

export interface ProjectReviewProps {
  title: string;
  description: string;
  categoryId: string;
  regionId: string;
  address: string;
  area: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
  requirements: string;
  images: string[];
  categories: ServiceCategory[];
  regions: Region[];
}

export function ProjectReview({
  title,
  description,
  categoryId,
  regionId,
  address,
  area,
  budgetMin,
  budgetMax,
  timeline,
  requirements,
  images,
  categories,
  regions,
}: ProjectReviewProps) {
  const formatCurrency = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 24 }}>
        Xác nhận thông tin
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Basic Info */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#71717a', marginBottom: 12, textTransform: 'uppercase' }}>
            Thông tin cơ bản
          </h3>
          <div style={{ background: '#1a1a1f', borderRadius: 8, padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#71717a', fontSize: 12 }}>Tiêu đề</span>
              <p style={{ color: '#e4e7ec', marginTop: 2 }}>{title}</p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#71717a', fontSize: 12 }}>Danh mục</span>
              <p style={{ color: '#e4e7ec', marginTop: 2 }}>
                {categories.find(c => c.id === categoryId)?.name || '-'}
              </p>
            </div>
            <div>
              <span style={{ color: '#71717a', fontSize: 12 }}>Mô tả</span>
              <p style={{ color: '#e4e7ec', marginTop: 2, whiteSpace: 'pre-wrap' }}>{description}</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#71717a', marginBottom: 12, textTransform: 'uppercase' }}>
            Vị trí
          </h3>
          <div style={{ background: '#1a1a1f', borderRadius: 8, padding: 16 }}>
            <div style={{ marginBottom: address ? 12 : 0 }}>
              <span style={{ color: '#71717a', fontSize: 12 }}>Khu vực</span>
              <p style={{ color: '#e4e7ec', marginTop: 2 }}>
                {regions.find(r => r.id === regionId)?.name || '-'}
              </p>
            </div>
            {address && (
              <div>
                <span style={{ color: '#71717a', fontSize: 12 }}>Địa chỉ</span>
                <p style={{ color: '#e4e7ec', marginTop: 2 }}>{address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#71717a', marginBottom: 12, textTransform: 'uppercase' }}>
            Chi tiết
          </h3>
          <div style={{ background: '#1a1a1f', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {area && (
                <div>
                  <span style={{ color: '#71717a', fontSize: 12 }}>Diện tích</span>
                  <p style={{ color: '#e4e7ec', marginTop: 2 }}>{area} m²</p>
                </div>
              )}
              {(budgetMin || budgetMax) && (
                <div>
                  <span style={{ color: '#71717a', fontSize: 12 }}>Ngân sách</span>
                  <p style={{ color: '#e4e7ec', marginTop: 2 }}>
                    {budgetMin && budgetMax
                      ? `${formatCurrency(budgetMin)} - ${formatCurrency(budgetMax)} VNĐ`
                      : budgetMin
                      ? `Từ ${formatCurrency(budgetMin)} VNĐ`
                      : `Đến ${formatCurrency(budgetMax)} VNĐ`}
                  </p>
                </div>
              )}
              {timeline && (
                <div>
                  <span style={{ color: '#71717a', fontSize: 12 }}>Timeline</span>
                  <p style={{ color: '#e4e7ec', marginTop: 2 }}>{timeline}</p>
                </div>
              )}
            </div>
            {requirements && (
              <div style={{ marginTop: 16 }}>
                <span style={{ color: '#71717a', fontSize: 12 }}>Yêu cầu đặc biệt</span>
                <p style={{ color: '#e4e7ec', marginTop: 2, whiteSpace: 'pre-wrap' }}>{requirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#71717a', marginBottom: 12, textTransform: 'uppercase' }}>
              Hình ảnh ({images.length})
            </h3>
            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 8,
              }}
            >
              {images.map((url, index) => (
                <div
                  key={index}
                  style={{
                    width: 80,
                    height: 80,
                    flexShrink: 0,
                  }}
                >
                  <LazyImage
                    src={url}
                    alt={`Ảnh ${index + 1}`}
                    aspectRatio="1/1"
                    objectFit="cover"
                    borderRadius={8}
                    showSkeleton={true}
                    rootMargin="50px"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
