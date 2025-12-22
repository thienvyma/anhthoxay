/**
 * Project Images Upload Component
 *
 * Step 4 of project creation wizard:
 * - Drag and drop image upload
 * - Image preview grid
 * - Remove image functionality
 * - Upload progress indicator
 *
 * **Feature: code-refactoring**
 * **Requirements: 4.1, 4.2, 7.4**
 */

import { motion } from 'framer-motion';
import { LazyImage } from '../../../components/LazyImage';

export const MAX_PROJECT_IMAGES = 10;

export interface ProjectImagesProps {
  images: string[];
  uploadingImages: boolean;
  errors: {
    images?: string;
  };
  onImageUpload: (files: FileList) => void;
  onRemoveImage: (index: number) => void;
}

export function ProjectImages({
  images,
  uploadingImages,
  errors,
  onImageUpload,
  onRemoveImage,
}: ProjectImagesProps) {
  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 24 }}>
        Hình ảnh dự án
      </h2>

      <div>
        {/* Upload Area */}
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            border: '2px dashed #27272a',
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: 20,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#f5d393';
            e.currentTarget.style.background = 'rgba(245, 211, 147, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#27272a';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && onImageUpload(e.target.files)}
            disabled={uploadingImages}
          />
          {uploadingImages ? (
            <>
              <i className="ri-loader-4-line spinner" style={{ fontSize: 40, color: '#f5d393', marginBottom: 12 }} />
              <span style={{ color: '#a1a1aa' }}>Đang tải lên...</span>
            </>
          ) : (
            <>
              <i className="ri-upload-cloud-2-line" style={{ fontSize: 40, color: '#71717a', marginBottom: 12 }} />
              <span style={{ color: '#e4e7ec', marginBottom: 4 }}>Kéo thả hoặc click để tải ảnh</span>
              <span style={{ color: '#71717a', fontSize: 13 }}>
                Tối đa {MAX_PROJECT_IMAGES} ảnh, mỗi ảnh không quá 5MB
              </span>
            </>
          )}
        </label>

        {/* Error Message */}
        {errors.images && (
          <span style={{ color: '#ef4444', fontSize: 12, marginBottom: 12, display: 'block' }}>
            {errors.images}
          </span>
        )}

        {/* Image Grid */}
        {images.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 12,
            }}
          >
            {images.map((url, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <LazyImage
                  src={url}
                  alt={`Ảnh ${index + 1}`}
                  aspectRatio="1/1"
                  objectFit="cover"
                  borderRadius={8}
                  showSkeleton={true}
                  wrapperStyle={{ width: '100%', height: '100%' }}
                />
                <button
                  onClick={() => onRemoveImage(index)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <i className="ri-close-line" style={{ fontSize: 14 }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Image Count */}
        <p style={{ color: '#71717a', fontSize: 13, marginTop: 16 }}>
          {images.length}/{MAX_PROJECT_IMAGES} ảnh đã tải lên
        </p>
      </div>
    </motion.div>
  );
}
