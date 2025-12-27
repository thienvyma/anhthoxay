import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { mediaApi } from '../api';

interface ImageDropzoneProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  onPickExisting?: () => void;
  label?: string;
  height?: number;
  /** Use gallery upload (creates MediaAsset). Default: false (uses uploadFile) */
  useGalleryUpload?: boolean;
}

export type { ImageDropzoneProps };

// Smart image processing utility
async function processImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function ImageDropzone({ value, onChange, onRemove, label, height = 200, useGalleryUpload = false }: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((f) => f.type.startsWith('image/'));
    
    if (imageFile) {
      await uploadFile(imageFile);
    } else {
      setErrorMessage('Please drop an image file (JPG, PNG, GIF, etc.)');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setErrorMessage(null);
      setUploadProgress(0);
      
      // Simulate processing progress
      setUploadProgress(20);
      
      // Process image: resize and compress
      const processedBlob = await processImage(file);
      setUploadProgress(60);
      
      // Create a new file from the processed blob
      const processedFile = new File(
        [processedBlob], 
        file.name.replace(/\.[^.]+$/, '.jpg'), 
        { type: 'image/jpeg' }
      );

      const formData = new FormData();
      formData.append('file', processedFile);

      setUploadProgress(80);
      // Use gallery upload (creates MediaAsset) or file upload (no MediaAsset)
      const response = useGalleryUpload 
        ? await mediaApi.upload(formData)
        : await mediaApi.uploadFile(formData);
      setUploadProgress(100);
      
      onChange(response.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload image';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  // Upload overlay component (rendered via Portal)
  const uploadOverlay = (
    <AnimatePresence mode="wait">
      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'all',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              width: '100%',
              maxWidth: 400,
              padding: 40,
              background: 'rgba(31, 41, 55, 0.8)',
              borderRadius: tokens.radius.lg,
              border: `1px solid ${tokens.color.border}`,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 64,
                height: 64,
                border: '4px solid rgba(245, 211, 147, 0.2)',
                borderTop: `4px solid ${tokens.color.primary}`,
                borderRadius: '50%',
              }}
            />
            <div style={{ width: '100%' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 12,
                color: tokens.color.text,
                fontSize: 16,
                fontWeight: 600,
              }}>
                <span>Processing Image</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${tokens.color.primary} 0%, #f9e7b8 100%)`,
                    borderRadius: 4,
                    boxShadow: `0 0 10px ${tokens.color.primary}`,
                  }}
                />
              </div>
              <p style={{ 
                color: tokens.color.muted, 
                fontSize: 14, 
                marginTop: 12,
                textAlign: 'center'
              }}>
                Optimizing and uploading your image...
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Render upload overlay via Portal - escapes modal stacking context */}
      {typeof document !== 'undefined' && createPortal(uploadOverlay, document.body)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
        {label && (
          <label style={{ 
            color: tokens.color.text, 
            fontSize: 14, 
            fontWeight: 500,
            display: 'block'
          }}>
            {label}
          </label>
        )}
        
        <div style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {value ? (
            <motion.div
              key="image-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ position: 'relative', borderRadius: tokens.radius.md, overflow: 'hidden' }}
            >
              <img
                src={resolveMediaUrl(value)}
                alt="Uploaded"
                style={{
                  width: '100%',
                  height: `${height}px`,
                  objectFit: 'cover',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  display: 'block',
                }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%)',
                  borderRadius: tokens.radius.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  zIndex: 2,
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClick}
                  type="button"
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: tokens.radius.md,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                    zIndex: 3,
                  }}
                >
                  <i className="ri-upload-2-line" style={{ fontSize: 16 }} />
                  Change
                </motion.button>
                {onRemove && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemove();
                    }}
                    type="button"
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: tokens.radius.md,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                      zIndex: 3,
                    }}
                  >
                    <i className="ri-delete-bin-line" style={{ fontSize: 16 }} />
                    Remove
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="upload-zone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={!isUploading ? handleClick : undefined}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                height: `${height}px`,
                border: `2px dashed ${
                  isDragging 
                    ? tokens.color.primary
                    : errorMessage
                    ? '#ef4444'
                    : tokens.color.border
                }`,
                borderRadius: tokens.radius.md,
                background: isDragging 
                  ? 'linear-gradient(135deg, rgba(245, 211, 147, 0.1) 0%, rgba(245, 211, 147, 0.05) 100%)'
                  : errorMessage
                  ? 'rgba(239, 68, 68, 0.05)'
                  : 'rgba(255, 255, 255, 0.02)',
                cursor: isUploading ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1,
              }}
            >
              <AnimatePresence mode="wait">
                {errorMessage ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                      color: '#ef4444',
                    }}
                  >
                    <i className="ri-error-warning-line" style={{ fontSize: 48 }} />
                    <p style={{ fontSize: 14, fontWeight: 500, textAlign: 'center', maxWidth: 250 }}>
                      {errorMessage}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: tokens.radius.md,
                        background: 'linear-gradient(135deg, rgba(245, 211, 147, 0.15) 0%, rgba(245, 211, 147, 0.05) 100%)',
                        border: `1px solid ${tokens.color.primary}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i 
                        className={isDragging ? 'ri-download-2-line' : 'ri-image-add-line'} 
                        style={{ 
                          fontSize: 28, 
                          color: tokens.color.primary,
                        }} 
                      />
                    </motion.div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ 
                        color: tokens.color.text, 
                        fontSize: 14, 
                        fontWeight: 600,
                        marginBottom: 4,
                      }}>
                        {isDragging ? 'Drop your image here' : 'Drop image here or click to browse'}
                      </p>
                      <p style={{ 
                        color: tokens.color.muted, 
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        justifyContent: 'center',
                      }}>
                        <i className="ri-image-line" style={{ fontSize: 14 }} />
                        Any size • Auto-optimized to 1920×1080
                      </p>
                      <div style={{
                        marginTop: 8,
                        padding: '6px 12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: tokens.radius.sm,
                        fontSize: 11,
                        color: 'rgb(96, 165, 250)',
                        fontWeight: 500,
                      }}>
                        JPG, PNG, GIF, WebP supported
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
    </div>
    </>
  );
}

