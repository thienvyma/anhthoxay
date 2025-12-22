/**
 * Profile Documents Component
 *
 * Handles ID card upload (front/back) and business license upload
 *
 * **Feature: code-refactoring**
 * **Requirements: 4.1, 4.2 - Extract document upload section**
 */

import { motion } from 'framer-motion';
import { LazyImage } from '../../../components/LazyImage';

export interface ProfileDocumentsProps {
  idCardFront: string;
  setIdCardFront: (value: string) => void;
  idCardBack: string;
  setIdCardBack: (value: string) => void;
  businessLicenseImage: string;
  setBusinessLicenseImage: (value: string) => void;
  uploadingIdCard: 'front' | 'back' | null;
  uploadingLicense: boolean;
  onIdCardUpload: (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => void;
  onLicenseUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileDocuments({
  idCardFront,
  setIdCardFront,
  idCardBack,
  setIdCardBack,
  businessLicenseImage,
  setBusinessLicenseImage,
  uploadingIdCard,
  uploadingLicense,
  onIdCardUpload,
  onLicenseUpload,
}: ProfileDocumentsProps) {
  return (
    <>
      {/* ID Card Upload - Requirement 12.5 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
        style={{ padding: 24, marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 8 }}>
          CMND/CCCD <span style={{ color: '#ef4444' }}>*</span>
        </h2>
        <p style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>
          Tải lên ảnh CMND/CCCD để xác minh danh tính
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {/* Front side */}
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
              Mặt trước
            </label>
            {idCardFront ? (
              <div style={{ position: 'relative' }}>
                <LazyImage
                  src={idCardFront}
                  alt="CMND mặt trước"
                  objectFit="cover"
                  borderRadius={8}
                  showSkeleton={true}
                  wrapperStyle={{
                    width: '100%',
                    height: 150,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIdCardFront('')}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
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
                  <i className="ri-close-line" style={{ fontSize: 16 }} />
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 150,
                  border: '2px dashed #3f3f46',
                  borderRadius: 8,
                  cursor: uploadingIdCard === 'front' ? 'wait' : 'pointer',
                  opacity: uploadingIdCard === 'front' ? 0.5 : 1,
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onIdCardUpload(e, 'front')}
                  disabled={uploadingIdCard === 'front'}
                  style={{ display: 'none' }}
                />
                {uploadingIdCard === 'front' ? (
                  <i
                    className="ri-loader-4-line spinner"
                    style={{ fontSize: 24, color: '#71717a' }}
                  />
                ) : (
                  <>
                    <i
                      className="ri-upload-cloud-line"
                      style={{ fontSize: 32, color: '#71717a' }}
                    />
                    <span style={{ fontSize: 13, color: '#71717a', marginTop: 8 }}>
                      Tải lên mặt trước
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Back side */}
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
              Mặt sau
            </label>
            {idCardBack ? (
              <div style={{ position: 'relative' }}>
                <LazyImage
                  src={idCardBack}
                  alt="CMND mặt sau"
                  objectFit="cover"
                  borderRadius={8}
                  showSkeleton={true}
                  wrapperStyle={{
                    width: '100%',
                    height: 150,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIdCardBack('')}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
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
                  <i className="ri-close-line" style={{ fontSize: 16 }} />
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 150,
                  border: '2px dashed #3f3f46',
                  borderRadius: 8,
                  cursor: uploadingIdCard === 'back' ? 'wait' : 'pointer',
                  opacity: uploadingIdCard === 'back' ? 0.5 : 1,
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onIdCardUpload(e, 'back')}
                  disabled={uploadingIdCard === 'back'}
                  style={{ display: 'none' }}
                />
                {uploadingIdCard === 'back' ? (
                  <i
                    className="ri-loader-4-line spinner"
                    style={{ fontSize: 24, color: '#71717a' }}
                  />
                ) : (
                  <>
                    <i
                      className="ri-upload-cloud-line"
                      style={{ fontSize: 32, color: '#71717a' }}
                    />
                    <span style={{ fontSize: 13, color: '#71717a', marginTop: 8 }}>
                      Tải lên mặt sau
                    </span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>
      </motion.div>

      {/* Business License - Optional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card"
        style={{ padding: 24, marginBottom: 24 }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 8 }}>
          Giấy phép kinh doanh
        </h2>
        <p style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>
          Tải lên giấy phép kinh doanh (nếu có) để tăng độ tin cậy
        </p>

        {businessLicenseImage ? (
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <LazyImage
              src={businessLicenseImage}
              alt="Giấy phép kinh doanh"
              objectFit="cover"
              borderRadius={8}
              showSkeleton={true}
              wrapperStyle={{
                width: '100%',
                height: 200,
              }}
            />
            <button
              type="button"
              onClick={() => setBusinessLicenseImage('')}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
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
              <i className="ri-close-line" style={{ fontSize: 16 }} />
            </button>
          </div>
        ) : (
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 150,
              maxWidth: 400,
              border: '2px dashed #3f3f46',
              borderRadius: 8,
              cursor: uploadingLicense ? 'wait' : 'pointer',
              opacity: uploadingLicense ? 0.5 : 1,
            }}
          >
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={onLicenseUpload}
              disabled={uploadingLicense}
              style={{ display: 'none' }}
            />
            {uploadingLicense ? (
              <i className="ri-loader-4-line spinner" style={{ fontSize: 24, color: '#71717a' }} />
            ) : (
              <>
                <i className="ri-file-upload-line" style={{ fontSize: 32, color: '#71717a' }} />
                <span style={{ fontSize: 13, color: '#71717a', marginTop: 8 }}>
                  Tải lên giấy phép
                </span>
              </>
            )}
          </label>
        )}
      </motion.div>
    </>
  );
}
