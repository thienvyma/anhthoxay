/**
 * Maintenance Tab - Database cleanup and system maintenance
 *
 * Features:
 * - GCP Cloud Storage management
 * - Docker images cleanup
 * - Media files cleanup
 * - One-click cleanup all
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { API_URL } from './types';
import { tokenStorage } from '../../store';

// ============================================
// TYPES
// ============================================

interface BucketStats {
  name: string;
  totalSize: number;
  totalSizeMB: string;
  fileCount: number;
}

interface StorageOverview {
  buckets: BucketStats[];
  totalSize: number;
  totalSizeMB: string;
  totalFiles: number;
  error?: string;
}

interface DockerImageService {
  service: string;
  totalVersions: number;
  totalSizeMB: string;
}

interface DockerStats {
  repository: string;
  images: DockerImageService[];
  totalImages: number;
  totalSizeMB: string;
  error?: string;
}

interface MediaStats {
  storageType: string;
  totalFilesInStorage: number;
  totalUsedUrls: number;
  mediaAssetRecords: number;
  estimatedTotalSizeMB: string;
}

interface CleanupResult {
  dryRun: boolean;
  deletedCount: number;
  freedMB: string;
  errors: string[];
  details: string[];
  message: string;
}

interface MaintenanceTabProps {
  onShowMessage: (message: string) => void;
  onError: (message: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export function MaintenanceTab({ onShowMessage, onError }: MaintenanceTabProps) {
  // Storage states
  const [storageOverview, setStorageOverview] = useState<StorageOverview | null>(null);
  const [dockerStats, setDockerStats] = useState<DockerStats | null>(null);
  const [mediaStats, setMediaStats] = useState<MediaStats | null>(null);
  
  // Cleanup results
  const [cloudBuildResult, setCloudBuildResult] = useState<CleanupResult | null>(null);
  const [dockerResult, setDockerResult] = useState<CleanupResult | null>(null);
  const [mediaResult, setMediaResult] = useState<{ deleted: string[]; errors: string[] } | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = tokenStorage.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  // ============================================
  // FETCH STATS
  // ============================================

  const fetchStorageOverview = useCallback(async () => {
    setLoading('storage');
    try {
      const res = await fetch(`${API_URL}/api/maintenance/storage/overview`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setStorageOverview(data.data);
        if (data.data.error) {
          onError(data.data.error);
        }
      } else {
        onError(data.error?.message || 'Không thể tải thống kê storage');
      }
    } catch {
      onError('Lỗi kết nối server');
    } finally {
      setLoading(null);
    }
  }, [getAuthHeaders, onError]);

  const fetchDockerStats = useCallback(async () => {
    setLoading('docker');
    try {
      const res = await fetch(`${API_URL}/api/maintenance/docker/stats`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setDockerStats(data.data);
        if (data.data.error) {
          onError(data.data.error);
        }
      } else {
        onError(data.error?.message || 'Không thể tải thống kê Docker');
      }
    } catch {
      onError('Lỗi kết nối server');
    } finally {
      setLoading(null);
    }
  }, [getAuthHeaders, onError]);

  const fetchMediaStats = useCallback(async () => {
    setLoading('media');
    try {
      const res = await fetch(`${API_URL}/media/cleanup/stats`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setMediaStats(data.data);
      } else {
        onError(data.error?.message || 'Không thể tải thống kê media');
      }
    } catch {
      onError('Lỗi kết nối server');
    } finally {
      setLoading(null);
    }
  }, [getAuthHeaders, onError]);

  const fetchAllStats = useCallback(async () => {
    setLoading('all');
    await Promise.all([fetchStorageOverview(), fetchDockerStats(), fetchMediaStats()]);
    setLoading(null);
    onShowMessage('Đã tải thống kê');
  }, [fetchStorageOverview, fetchDockerStats, fetchMediaStats, onShowMessage]);

  // ============================================
  // CLEANUP ACTIONS
  // ============================================

  const cleanupCloudBuild = useCallback(async (dryRun: boolean) => {
    setLoading('cleanup-cloudbuild');
    setCloudBuildResult(null);
    try {
      const res = await fetch(`${API_URL}/api/maintenance/storage/cleanup-cloudbuild`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ dryRun, maxAgeDays: 30 }),
      });
      const data = await res.json();
      if (data.success) {
        setCloudBuildResult(data.data);
        onShowMessage(data.data.message);
        if (!dryRun) fetchStorageOverview();
      } else {
        onError(data.error?.message || 'Không thể dọn dẹp Cloud Build');
      }
    } catch {
      onError('Lỗi kết nối server');
    } finally {
      setLoading(null);
    }
  }, [getAuthHeaders, onShowMessage, onError, fetchStorageOverview]);

  const cleanupDocker = useCallback(async (dryRun: boolean) => {
    setLoading('cleanup-docker');
    setDockerResult(null);
    try {
      const res = await fetch(`${API_URL}/api/maintenance/docker/cleanup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ dryRun, keepVersions: 3 }),
      });
      const data = await res.json();
      if (data.success) {
        setDockerResult(data.data);
        onShowMessage(data.data.message);
        if (!dryRun) fetchDockerStats();
      } else {
        onError(data.error?.message || 'Không thể dọn dẹp Docker images');
      }
    } catch {
      onError('Lỗi kết nối server');
    } finally {
      setLoading(null);
    }
  }, [getAuthHeaders, onShowMessage, onError, fetchDockerStats]);

  const cleanupMedia = useCallback(async (dryRun: boolean) => {
    setLoading('cleanup-media');
    setMediaResult(null);
    try {
      const res = await fetch(`${API_URL}/media/cleanup/execute`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (data.success) {
        setMediaResult({ deleted: data.data.deleted, errors: data.data.errors });
        onShowMessage(data.data.message);
        if (!dryRun) fetchMediaStats();
      } else {
        onError(data.error?.message || 'Không thể dọn dẹp media');
      }
    } catch {
      onError('Lỗi kết nối server');
    } finally {
      setLoading(null);
    }
  }, [getAuthHeaders, onShowMessage, onError, fetchMediaStats]);

  const cleanupAll = useCallback(async (dryRun: boolean) => {
    if (!dryRun && !window.confirm('Bạn có chắc muốn dọn dẹp TẤT CẢ? Hành động này không thể hoàn tác.')) {
      return;
    }
    setLoading('cleanup-all');
    try {
      const res = await fetch(`${API_URL}/api/maintenance/cleanup-all`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (data.success) {
        setCloudBuildResult(data.data.cloudBuild);
        setDockerResult(data.data.docker);
        setMediaResult(data.data.media);
        onShowMessage(data.data.summary.message);
        if (!dryRun) fetchAllStats();
      } else {
        onError(data.error?.message || 'Không thể dọn dẹp');
      }
    } catch {
      onError('Lỗi kết nối server');
    } finally {
      setLoading(null);
    }
  }, [getAuthHeaders, onShowMessage, onError, fetchAllStats]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header with Refresh All */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: tokens.color.text }}>
            Bảo trì hệ thống
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: tokens.color.muted }}>
            Quản lý và dọn dẹp storage GCP, Docker images, media files
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionButton
            onClick={fetchAllStats}
            loading={loading === 'all'}
            icon="ri-refresh-line"
            label="Tải thống kê"
          />
          <ActionButton
            onClick={() => cleanupAll(true)}
            loading={loading === 'cleanup-all'}
            icon="ri-eye-line"
            label="Preview tất cả"
            variant="secondary"
          />
          <ActionButton
            onClick={() => cleanupAll(false)}
            loading={loading === 'cleanup-all'}
            icon="ri-delete-bin-line"
            label="Dọn dẹp tất cả"
            variant="danger"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Cloud Storage Card */}
        <StatsCard
          title="Cloud Storage"
          icon="ri-cloud-line"
          color={tokens.color.info}
          loading={loading === 'storage'}
          onRefresh={fetchStorageOverview}
          stats={storageOverview ? [
            { label: 'Buckets', value: storageOverview.buckets.length.toString() },
            { label: 'Tổng files', value: storageOverview.totalFiles.toString() },
            { label: 'Dung lượng', value: `${storageOverview.totalSizeMB} MB` },
          ] : null}
          error={storageOverview?.error}
        >
          {storageOverview && storageOverview.buckets.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 12 }}>
              {storageOverview.buckets.map((b) => (
                <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${tokens.color.border}` }}>
                  <span style={{ color: tokens.color.muted }}>{b.name}</span>
                  <span style={{ color: tokens.color.text }}>{b.totalSizeMB} MB</span>
                </div>
              ))}
            </div>
          )}
        </StatsCard>

        {/* Docker Images Card */}
        <StatsCard
          title="Docker Images"
          icon="ri-ship-line"
          color={tokens.color.primary}
          loading={loading === 'docker'}
          onRefresh={fetchDockerStats}
          stats={dockerStats ? [
            { label: 'Services', value: dockerStats.images.length.toString() },
            { label: 'Tổng versions', value: dockerStats.totalImages.toString() },
            { label: 'Dung lượng', value: `${dockerStats.totalSizeMB} MB` },
          ] : null}
          error={dockerStats?.error}
        >
          {dockerStats && dockerStats.images.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 12 }}>
              {dockerStats.images.map((img) => (
                <div key={img.service} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${tokens.color.border}` }}>
                  <span style={{ color: tokens.color.muted }}>{img.service}</span>
                  <span style={{ color: tokens.color.text }}>{img.totalVersions} versions ({img.totalSizeMB} MB)</span>
                </div>
              ))}
            </div>
          )}
        </StatsCard>

        {/* Media Files Card */}
        <StatsCard
          title="Media Files"
          icon="ri-image-line"
          color={tokens.color.success}
          loading={loading === 'media'}
          onRefresh={fetchMediaStats}
          stats={mediaStats ? [
            { label: 'Storage type', value: mediaStats.storageType.toUpperCase() },
            { label: 'Files trong storage', value: mediaStats.totalFilesInStorage.toString() },
            { label: 'Dung lượng', value: `${mediaStats.estimatedTotalSizeMB} MB` },
          ] : null}
        />
      </div>

      {/* Cleanup Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
        {/* Cloud Build Cleanup */}
        <CleanupSection
          title="Dọn dẹp Cloud Build"
          description="Xóa logs và source archives cũ hơn 30 ngày"
          icon="ri-cloud-line"
          color={tokens.color.info}
          loading={loading === 'cleanup-cloudbuild'}
          onDryRun={() => cleanupCloudBuild(true)}
          onExecute={() => {
            if (window.confirm('Xóa logs và source archives cũ hơn 30 ngày?')) {
              cleanupCloudBuild(false);
            }
          }}
          result={cloudBuildResult}
        />

        {/* Docker Cleanup */}
        <CleanupSection
          title="Dọn dẹp Docker Images"
          description="Giữ lại 3 versions gần nhất, xóa cũ hơn"
          icon="ri-ship-line"
          color={tokens.color.primary}
          loading={loading === 'cleanup-docker'}
          onDryRun={() => cleanupDocker(true)}
          onExecute={() => {
            if (window.confirm('Xóa Docker images cũ (giữ 3 versions gần nhất)?')) {
              cleanupDocker(false);
            }
          }}
          result={dockerResult}
        />

        {/* Media Cleanup */}
        <CleanupSection
          title="Dọn dẹp Media"
          description="Xóa files không còn được tham chiếu trong database"
          icon="ri-image-line"
          color={tokens.color.success}
          loading={loading === 'cleanup-media'}
          onDryRun={() => cleanupMedia(true)}
          onExecute={() => {
            if (window.confirm('Xóa media files không sử dụng?')) {
              cleanupMedia(false);
            }
          }}
          result={mediaResult ? {
            dryRun: false,
            deletedCount: mediaResult.deleted.length,
            freedMB: '0',
            errors: mediaResult.errors,
            details: mediaResult.deleted,
            message: `${mediaResult.deleted.length} files`,
          } : null}
        />
      </div>

      {/* Info Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: 16,
          background: `${tokens.color.info}10`,
          border: `1px solid ${tokens.color.info}30`,
          borderRadius: tokens.radius.md,
        }}
      >
        <i className="ri-information-line" style={{ color: tokens.color.info, fontSize: 20, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: tokens.color.text }}>
          <strong>Lưu ý:</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: tokens.color.muted }}>
            <li>Luôn chạy "Preview" trước để xem những gì sẽ bị xóa</li>
            <li>Cloud Build logs/source cũ hơn 30 ngày sẽ bị xóa</li>
            <li>Docker images: Giữ 3 versions gần nhất cho mỗi service</li>
            <li>Media: Chỉ xóa files không còn được tham chiếu trong database</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function ActionButton({
  onClick,
  loading,
  icon,
  label,
  variant = 'primary',
}: {
  onClick: () => void;
  loading: boolean;
  icon: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const styles = {
    primary: { background: tokens.color.primary, color: '#111', border: 'none' },
    secondary: { background: tokens.color.surfaceHover, color: tokens.color.text, border: `1px solid ${tokens.color.border}` },
    danger: { background: tokens.color.error, color: '#fff', border: 'none' },
  };

  return (
    <motion.button
      whileHover={{ opacity: 0.9 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '8px 14px',
        borderRadius: tokens.radius.md,
        fontSize: 13,
        fontWeight: 500,
        cursor: loading ? 'wait' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        ...styles[variant],
      }}
    >
      {loading ? (
        <motion.i className="ri-loader-4-line" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
      ) : (
        <i className={icon} />
      )}
      {label}
    </motion.button>
  );
}

function StatsCard({
  title,
  icon,
  color,
  loading,
  onRefresh,
  stats,
  error,
  children,
}: {
  title: string;
  icon: string;
  color: string;
  loading: boolean;
  onRefresh: () => void;
  stats: { label: string; value: string }[] | null;
  error?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.color.border}`,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: tokens.radius.md,
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              fontSize: 18,
            }}
          >
            <i className={icon} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: tokens.color.text }}>{title}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRefresh}
          disabled={loading}
          style={{
            width: 28,
            height: 28,
            background: tokens.color.surfaceHover,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.sm,
            color: tokens.color.muted,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <motion.i className="ri-loader-4-line" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 14 }} />
          ) : (
            <i className="ri-refresh-line" style={{ fontSize: 14 }} />
          )}
        </motion.button>
      </div>

      {error && (
        <div style={{ padding: 12, background: `${tokens.color.warning}15`, borderRadius: tokens.radius.sm, marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: tokens.color.warning, margin: 0 }}>{error}</p>
        </div>
      )}

      {stats ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: tokens.color.muted }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>{s.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 20, color: tokens.color.muted }}>
          <i className={icon} style={{ fontSize: 32, opacity: 0.3 }} />
          <p style={{ marginTop: 8, fontSize: 12 }}>Nhấn refresh để tải</p>
        </div>
      )}

      {children}
    </div>
  );
}

function CleanupSection({
  title,
  description,
  icon,
  color,
  loading,
  onDryRun,
  onExecute,
  result,
}: {
  title: string;
  description: string;
  icon: string;
  color: string;
  loading: boolean;
  onDryRun: () => void;
  onExecute: () => void;
  result: CleanupResult | null;
}) {
  return (
    <div
      style={{
        background: tokens.color.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.color.border}`,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: tokens.radius.sm,
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            fontSize: 16,
          }}
        >
          <i className={icon} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: tokens.color.text }}>{title}</h4>
          <p style={{ margin: 0, fontSize: 12, color: tokens.color.muted }}>{description}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <motion.button
          whileHover={{ opacity: 0.9 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDryRun}
          disabled={loading}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: tokens.color.surfaceHover,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.sm,
            color: tokens.color.text,
            fontSize: 13,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <i className="ri-eye-line" />
          Preview
        </motion.button>
        <motion.button
          whileHover={{ opacity: 0.9 }}
          whileTap={{ scale: 0.98 }}
          onClick={onExecute}
          disabled={loading}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: tokens.color.error,
            border: 'none',
            borderRadius: tokens.radius.sm,
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {loading ? (
            <motion.i className="ri-loader-4-line" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
          ) : (
            <i className="ri-delete-bin-line" />
          )}
          Xóa
        </motion.button>
      </div>

      {result && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: result.dryRun ? `${tokens.color.info}10` : `${tokens.color.success}10`,
            border: `1px solid ${result.dryRun ? tokens.color.info : tokens.color.success}30`,
            borderRadius: tokens.radius.sm,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <i
              className={result.dryRun ? 'ri-information-line' : 'ri-checkbox-circle-line'}
              style={{ color: result.dryRun ? tokens.color.info : tokens.color.success }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text }}>
              {result.dryRun ? 'Preview' : 'Hoàn thành'}: {result.deletedCount} items ({result.freedMB} MB)
            </span>
          </div>
          {result.details.length > 0 && (
            <div style={{ maxHeight: 120, overflowY: 'auto', fontSize: 11, color: tokens.color.muted }}>
              {result.details.slice(0, 10).map((d, i) => (
                <div key={i} style={{ padding: '2px 0' }}>{d}</div>
              ))}
              {result.details.length > 10 && (
                <div style={{ padding: '4px 0', fontStyle: 'italic' }}>...và {result.details.length - 10} items khác</div>
              )}
            </div>
          )}
          {result.errors.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: tokens.color.error }}>
              Lỗi: {result.errors.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
