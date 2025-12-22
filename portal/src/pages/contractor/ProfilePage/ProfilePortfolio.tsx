/**
 * Profile Portfolio Component
 *
 * Handles portfolio image upload and management
 *
 * **Feature: code-refactoring**
 * **Requirements: 4.1, 4.2 - Extract portfolio section**
 */

import { motion } from 'framer-motion';
import { LazyImage } from '../../../components/LazyImage';

export const MAX_PORTFOLIO_IMAGES = 10;

export interface ProfilePortfolioProps {
  portfolioImages: string[];
  uploadingPortfolio: boolean;
  onPortfolioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePortfolioImage: (index: number) => void;
}

export function ProfilePortfolio({
  portfolioImages,
  uploadingPortfolio,
  onPortfolioUpload,
  onRemovePortfolioImage,
}: ProfilePortfolioProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card"
      style={{ padding: 24, marginBottom: 24 }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 8 }}>
        Ảnh portfolio
      </h2>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>
        Tải lên ảnh các công trình đã thực hiện (tối đa {MAX_PORTFOLIO_IMAGES} ảnh)
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {portfolioImages.map((url, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              width: 120,
              height: 120,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <LazyImage
              src={url}
              alt={`Portfolio ${index + 1}`}
              aspectRatio="1/1"
              objectFit="cover"
              borderRadius={8}
              showSkeleton={true}
              wrapperStyle={{ width: '100%', height: '100%' }}
            />
            <button
              type="button"
              onClick={() => onRemovePortfolioImage(index)}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.9)',
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

        {portfolioImages.length < MAX_PORTFOLIO_IMAGES && (
          <label
            style={{
              width: 120,
              height: 120,
              borderRadius: 8,
              border: '2px dashed #3f3f46',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploadingPortfolio ? 'wait' : 'pointer',
              opacity: uploadingPortfolio ? 0.5 : 1,
            }}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={onPortfolioUpload}
              disabled={uploadingPortfolio}
              style={{ display: 'none' }}
            />
            {uploadingPortfolio ? (
              <i className="ri-loader-4-line spinner" style={{ fontSize: 24, color: '#71717a' }} />
            ) : (
              <>
                <i className="ri-add-line" style={{ fontSize: 24, color: '#71717a' }} />
                <span style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>Thêm ảnh</span>
              </>
            )}
          </label>
        )}
      </div>
    </motion.div>
  );
}
