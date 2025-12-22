/**
 * Profile Certificates Component
 *
 * Handles certificate upload and management
 *
 * **Feature: code-refactoring**
 * **Requirements: 4.1, 4.2 - Extract certificates section**
 */

import { motion } from 'framer-motion';
import { LazyImage } from '../../../components/LazyImage';
import type { Certificate } from '../../../api';

export const MAX_CERTIFICATES = 5;

export interface ProfileCertificatesProps {
  certificates: Certificate[];
  setCertificates: React.Dispatch<React.SetStateAction<Certificate[]>>;
  uploadingCertificate: boolean;
  onCertificateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCertificate: (index: number) => void;
}

export function ProfileCertificates({
  certificates,
  setCertificates,
  uploadingCertificate,
  onCertificateUpload,
  onRemoveCertificate,
}: ProfileCertificatesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="card"
      style={{ padding: 24, marginBottom: 24 }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 8 }}>
        Chứng chỉ
      </h2>
      <p style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>
        Tải lên các chứng chỉ nghề nghiệp (tối đa {MAX_CERTIFICATES} chứng chỉ)
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {certificates.map((cert, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 8,
            }}
          >
            <div style={{ width: 60, height: 60, flexShrink: 0 }}>
              <LazyImage
                src={cert.imageUrl}
                alt={cert.name}
                aspectRatio="1/1"
                objectFit="cover"
                borderRadius={4}
                showSkeleton={true}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={cert.name}
                onChange={(e) => {
                  const newCerts = [...certificates];
                  newCerts[index] = { ...cert, name: e.target.value };
                  setCertificates(newCerts);
                }}
                placeholder="Tên chứng chỉ"
                className="input"
                style={{ marginBottom: 8 }}
              />
              <input
                type="date"
                value={cert.issuedDate || ''}
                onChange={(e) => {
                  const newCerts = [...certificates];
                  newCerts[index] = { ...cert, issuedDate: e.target.value };
                  setCertificates(newCerts);
                }}
                className="input"
                style={{ width: 'auto' }}
              />
            </div>
            <button
              type="button"
              onClick={() => onRemoveCertificate(index)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: 8,
              }}
            >
              <i className="ri-delete-bin-line" style={{ fontSize: 18 }} />
            </button>
          </div>
        ))}
      </div>

      {certificates.length < MAX_CERTIFICATES && (
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px dashed #3f3f46',
            borderRadius: 8,
            cursor: uploadingCertificate ? 'wait' : 'pointer',
            opacity: uploadingCertificate ? 0.5 : 1,
          }}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={onCertificateUpload}
            disabled={uploadingCertificate}
            style={{ display: 'none' }}
          />
          {uploadingCertificate ? (
            <i className="ri-loader-4-line spinner" style={{ color: '#f5d393' }} />
          ) : (
            <i className="ri-add-line" style={{ color: '#a1a1aa' }} />
          )}
          <span style={{ color: '#a1a1aa', fontSize: 14 }}>
            {uploadingCertificate ? 'Đang tải lên...' : 'Thêm chứng chỉ'}
          </span>
        </label>
      )}
    </motion.div>
  );
}
