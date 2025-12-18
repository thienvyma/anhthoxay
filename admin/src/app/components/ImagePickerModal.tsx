import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { tokens, resolveMediaUrl } from '@app/shared';
import { mediaApi } from '../api';
import type { MediaAsset } from '../types';
import { Button } from './Button';
import { useToast } from './Toast';

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

interface ImagePickerModalProps {
  onSelect: (url: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
  currentUrl?: string;
}

export function ImagePickerModal({ onSelect, onCancel, onClose, currentUrl }: ImagePickerModalProps) {
  const toast = useToast();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handleCancel = onCancel || onClose || (() => {});
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(currentUrl || '');
  const [filter, setFilter] = useState<'all' | 'images' | 'recent'>('all');

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    try {
      const data = await mediaApi.list();
      setMedia(data);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Process and compress image before upload
        const processedBlob = await processImage(file);
        const processedFile = new File(
          [processedBlob],
          file.name.replace(/\.[^.]+$/, '.jpg'),
          { type: 'image/jpeg' }
        );
        await mediaApi.upload(processedFile);
      }
      await loadMedia();
      toast.success('Upload thành công!');
    } catch (error) {
      console.error('Failed to upload:', error);
      toast.error('Upload thất bại. Vui lòng thử ảnh khác.');
    } finally {
      setUploading(false);
    }
  }

  const filteredMedia = media.filter((item) => {
    if (filter === 'images') return item.mimeType?.startsWith('image/') ?? true;
    if (filter === 'recent') {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return new Date(item.createdAt).getTime() > dayAgo;
    }
    return true;
  });

  const modalContent = (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          console.log('[ImagePickerModal] Backdrop clicked:', { 
            isDirectClick: e.target === e.currentTarget 
          });
          if (e.target === e.currentTarget) {
            console.log('[ImagePickerModal] Closing modal');
            handleCancel();
          }
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          pointerEvents: 'auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => {
            console.log('[ImagePickerModal] Modal content clicked, stopping propagation');
            e.stopPropagation();
          }}
          style={{
            width: '100%',
            maxWidth: 1000,
            height: '85vh',
            maxHeight: '85vh',
            background: tokens.color.background,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.lg,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 999999999,
            pointerEvents: 'auto',
          }}
        >
        {/* Header */}
        <div
          style={{
            padding: 24,
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ color: tokens.color.text, fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>
              Select Image
            </h2>
            <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
              Choose from your media library or upload new images
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('[ImagePickerModal] X button clicked');
              handleCancel();
            }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: tokens.color.text,
              fontSize: 20,
              pointerEvents: 'auto',
            }}
          >
            <i className="ri-close-line" />
          </motion.button>
        </div>

        {/* Toolbar */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: `1px solid ${tokens.color.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'space-between',
          }}
        >
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'images', 'recent'] as const).map((f) => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[ImagePickerModal] Filter clicked:', f);
                  setFilter(f);
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: tokens.radius.pill,
                  border: `1px solid ${filter === f ? tokens.color.primary : tokens.color.border}`,
                  background: filter === f ? `${tokens.color.primary}20` : 'transparent',
                  color: filter === f ? tokens.color.primary : tokens.color.text,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize',
                  pointerEvents: 'auto',
                }}
              >
                {f}
              </motion.button>
            ))}
          </div>

          {/* Upload button */}
          <div style={{ pointerEvents: 'auto' }}>
            <input
              ref={(input) => {
                if (input) {
                  (window as unknown as Record<string, HTMLInputElement>).__fileInput = input;
                }
              }}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                console.log('[ImagePickerModal] File input changed, files:', e.target.files?.length);
                handleUpload(e);
              }}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            <Button
              variant="primary"
              size="small"
              icon={uploading ? 'ri-loader-4-line' : 'ri-upload-2-line'}
              loading={uploading}
              onClick={(e) => {
                e?.stopPropagation();
                const input = (window as unknown as Record<string, unknown>).__fileInput as HTMLInputElement | undefined;
                if (input && !uploading) {
                  input.click();
                }
              }}
            >
              Upload Images
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: tokens.color.muted }}>
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 48, display: 'block', marginBottom: 16 }}
              />
              Loading media...
            </div>
          ) : filteredMedia.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: tokens.color.muted }}>
              <i className="ri-image-line" style={{ fontSize: 64, display: 'block', marginBottom: 16, opacity: 0.3 }} />
              <p style={{ fontSize: 16, marginBottom: 8 }}>No images found</p>
              <p style={{ fontSize: 14 }}>Upload some images to get started</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 12,
              }}
            >
              {filteredMedia.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[ImagePickerModal] Image clicked:', item.url);
                    setSelectedUrl(item.url);
                  }}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: tokens.radius.md,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `2px solid ${selectedUrl === item.url ? tokens.color.primary : tokens.color.border}`,
                    background: 'rgba(255,255,255,0.03)',
                    pointerEvents: 'auto',
                  }}
                >
                  <img
                    src={resolveMediaUrl(item.url)}
                    alt={item.alt || 'Media asset'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  {selectedUrl === item.url && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: tokens.color.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#111',
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
                      <i className="ri-check-line" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 16,
            borderTop: `1px solid ${tokens.color.border}`,
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ color: tokens.color.muted, fontSize: 13 }}>
            {selectedUrl ? (
              <>
                <i className="ri-checkbox-circle-line" style={{ color: tokens.color.primary }} /> Selected: {selectedUrl.split('/').pop()}
              </>
            ) : (
              'Click an image to select it'
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => selectedUrl && onSelect(selectedUrl)}
              disabled={!selectedUrl}
            >
              Use Selected Image
            </Button>
          </div>
        </div>
        </motion.div>
      </motion.div>
    </>
  );

  return createPortal(modalContent, document.body);
}

