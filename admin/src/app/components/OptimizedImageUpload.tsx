import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '@app/shared';
import { tokens } from '../../theme';
import { ImageDropzone } from './ImageDropzone';
import { ImagePickerModal } from './ImagePickerModal';

interface OptimizedImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  aspectRatio?: string; // e.g., '16/9', '4/3', '1/1'
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * OptimizedImageUpload Component
 * 
 * Enhanced image upload with:
 * - Drag & drop support
 * - Image picker modal with Unsplash integration
 * - Preview with optimization
 * - Manual URL input
 * - Responsive design
 */
export function OptimizedImageUpload({
  value,
  onChange,
  label = 'Image',
  required = false,
  aspectRatio = '16/9',
  maxWidth = 1920,
  maxHeight = 1080,
}: OptimizedImageUploadProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleRemove = () => {
    onChange('');
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Label */}
      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        fontSize: 14, 
        fontWeight: 600, 
        color: tokens.color.text 
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: tokens.radius.sm,
          background: `linear-gradient(135deg, ${tokens.color.primary}20, ${tokens.color.accent}20)`,
          border: `1px solid ${tokens.color.primary}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          color: tokens.color.primary,
        }}>
          <i className="ri-image-line" />
        </div>
        {label}
        {required && <span style={{ color: tokens.color.error }}>*</span>}
      </label>

      {/* Image Preview or Upload Zone */}
      {value ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'relative',
            borderRadius: tokens.radius.lg,
            overflow: 'hidden',
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surfaceAlt,
            aspectRatio: aspectRatio,
          }}
        >
          <img
            src={resolveMediaUrl(value)}
            alt="Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          
          {/* Overlay with Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: tokens.color.overlay,
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowPicker(true)}
              style={{
                padding: '12px 20px',
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                color: '#111',
                border: 'none',
                borderRadius: tokens.radius.md,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="ri-refresh-line" style={{ fontSize: 16 }} />
              Thay đổi
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRemove}
              style={{
                padding: '12px 20px',
                background: 'rgba(239,68,68,0.2)',
                color: tokens.color.error,
                border: `1px solid ${tokens.color.error}40`,
                borderRadius: tokens.radius.md,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <i className="ri-delete-bin-line" style={{ fontSize: 16 }} />
              Xóa
            </motion.button>
          </motion.div>

          {/* Image Info */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 12,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{ 
              fontSize: 12, 
              color: tokens.color.text, 
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {value}
            </p>
          </div>
        </motion.div>
      ) : (
        <ImageDropzone
          value={value}
          onChange={onChange}
          onRemove={handleRemove}
          label=""
          height={200}
        />
      )}

      {/* Action Buttons */}
      {!value && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: 12 
        }}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPicker(true)}
            style={{
              padding: '12px 16px',
              background: tokens.color.surfaceHover,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <i className="ri-gallery-line" style={{ fontSize: 16 }} />
            Chọn từ thư viện
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUrlInput(!showUrlInput)}
            style={{
              padding: '12px 16px',
              background: tokens.color.surfaceHover,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <i className="ri-link" style={{ fontSize: 16 }} />
            Nhập URL
          </motion.button>
        </div>
      )}

      {/* URL Input */}
      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: 'hidden',
            }}
          >
            <div style={{ 
              display: 'flex', 
              gap: 8,
              padding: 16,
              background: tokens.color.surfaceAlt,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
            }}>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: tokens.color.surfaceAlt,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.sm,
                  color: tokens.color.text,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                style={{
                  padding: '10px 20px',
                  background: urlInput.trim() 
                    ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`
                    : tokens.color.surfaceHover,
                  color: urlInput.trim() ? '#111' : tokens.color.muted,
                  border: 'none',
                  borderRadius: tokens.radius.sm,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <i className="ri-check-line" style={{ fontSize: 16 }} />
                OK
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Picker Modal */}
      {showPicker && (
        <ImagePickerModal
          onSelect={(url) => {
            onChange(url);
            setShowPicker(false);
          }}
          onCancel={() => setShowPicker(false)}
          currentUrl={value}
        />
      )}

      {/* Helper Text */}
      <p style={{ 
        fontSize: 12, 
        color: tokens.color.muted, 
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <i className="ri-information-line" style={{ fontSize: 14 }} />
        Khuyến nghị: {aspectRatio} aspect ratio, tối đa {maxWidth}x{maxHeight}px
      </p>
    </div>
  );
}
