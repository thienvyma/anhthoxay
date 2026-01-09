/**
 * ApiKeysTab - API Key Management Tab for Settings Page
 *
 * Allows admins to create, view, toggle, and delete API keys for AI agent integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { tokens } from '../../../theme';
import { apiKeysApi } from '../../api';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useResponsive } from '../../../hooks/useResponsive';
import { ResponsiveStack } from '../../../components/responsive';
import {
  ApiKeysList,
  CreateApiKeyModal,
  KeyCreatedModal,
  TestApiKeyModal,
  ApiKeyDetailPanel,
  EditApiKeyModal,
  DeleteApiKeyModal,
} from '../ApiKeysPage/components';
import type { ApiKey, ApiKeyStatus, CreateApiKeyInput, UpdateApiKeyInput } from '../../api/api-keys';

export function ApiKeysTab() {
  const toast = useToast();
  const { isMobile, breakpoint } = useResponsive();

  // State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApiKeyStatus | ''>('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyCreatedModal, setShowKeyCreatedModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [createdRawKey, setCreatedRawKey] = useState('');
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [testingApiKey, setTestingApiKey] = useState<ApiKey | null>(null);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [deletingApiKey, setDeletingApiKey] = useState<ApiKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load API keys
  const loadApiKeys = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiKeysApi.list({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setApiKeys(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách API keys';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  // Handle create API key
  const handleCreateApiKey = async (data: CreateApiKeyInput) => {
    setSaving(true);
    try {
      const result = await apiKeysApi.create(data);
      setApiKeys((prev) => [result.apiKey, ...prev]);
      setShowCreateModal(false);
      setCreatedRawKey(result.rawKey);
      setShowKeyCreatedModal(true);
      toast.success('Đã tạo API key thành công!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tạo API key';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await apiKeysApi.toggleStatus(id);
      setApiKeys((prev) => prev.map((key) => (key.id === id ? updated : key)));
      toast.success(updated.status === 'ACTIVE' ? 'Đã bật API key' : 'Đã tắt API key');
    } catch {
      toast.error('Không thể thay đổi trạng thái');
    }
  };

  // Handle delete - show confirmation modal
  const handleDelete = (apiKey: ApiKey) => {
    setDeletingApiKey(apiKey);
    setShowDeleteModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async (apiKey: ApiKey) => {
    setDeleting(true);
    try {
      await apiKeysApi.delete(apiKey.id);
      setApiKeys((prev) => prev.filter((key) => key.id !== apiKey.id));
      setShowDeleteModal(false);
      setDeletingApiKey(null);
      toast.success('Đã xóa API key');
    } catch {
      toast.error('Không thể xóa API key');
    } finally {
      setDeleting(false);
    }
  };

  // Handle test
  const handleTest = (apiKey: ApiKey) => {
    setTestingApiKey(apiKey);
    setShowTestModal(true);
  };

  // Handle edit
  const handleEdit = (apiKey: ApiKey) => {
    setEditingApiKey(apiKey);
    setShowEditModal(true);
  };

  // Handle update API key
  const handleUpdateApiKey = async (id: string, data: UpdateApiKeyInput): Promise<ApiKey> => {
    setSaving(true);
    try {
      const currentKey = apiKeys.find((k) => k.id === id);
      const wasExpired = currentKey?.status === 'EXPIRED';

      const updated = await apiKeysApi.update(id, data);
      setApiKeys((prev) => prev.map((key) => (key.id === id ? updated : key)));
      if (selectedApiKey?.id === id) {
        setSelectedApiKey(updated);
      }
      setShowEditModal(false);
      setEditingApiKey(null);

      if (wasExpired && updated.status === 'ACTIVE') {
        toast.success('Đã kích hoạt lại API key thành công!');
      } else {
        toast.success('Đã cập nhật API key thành công!');
      }
      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật API key';
      toast.error(errorMessage);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Handle select (for detail panel)
  const handleSelect = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setShowDetailPanel(true);
  };

  // Handle close detail panel
  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedApiKey(null);
  };

  // Handle delete from detail panel
  const handleDeleteFromPanel = () => {
    if (selectedApiKey) {
      handleDelete(selectedApiKey);
      handleCloseDetailPanel();
    }
  };

  // Handle edit from detail panel
  const handleEditFromPanel = () => {
    if (selectedApiKey) {
      handleEdit(selectedApiKey);
    }
  };

  return (
    <div data-breakpoint={breakpoint}>
      {/* Header */}
      <ResponsiveStack
        direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
        align={isMobile ? 'stretch' : 'center'}
        justify="between"
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div>
          <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
            {apiKeys.length} API key trong hệ thống
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} style={{ width: isMobile ? '100%' : 'auto' }}>
          <i className="ri-key-2-line" style={{ marginRight: 8 }} />
          Tạo API Key
        </Button>
      </ResponsiveStack>

      {/* Filters */}
      <ResponsiveStack
        direction={{ mobile: 'column', tablet: 'row', desktop: 'row' }}
        gap={16}
        style={{ marginBottom: 24 }}
      >
        <div style={{ flex: isMobile ? 'none' : '1 1 300px', maxWidth: isMobile ? '100%' : 400 }}>
          <Input placeholder="Tìm theo tên..." value={search} onChange={setSearch} icon="ri-search-line" fullWidth />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApiKeyStatus | '')}
          style={{
            padding: '10px 16px',
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.border}`,
            background: tokens.color.surface,
            color: tokens.color.text,
            fontSize: 14,
            minWidth: isMobile ? '100%' : 150,
            minHeight: '44px',
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Tắt</option>
          <option value="EXPIRED">Hết hạn</option>
        </select>
      </ResponsiveStack>

      {/* API Keys List */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 48,
            color: tokens.color.muted,
          }}
        >
          <i className="ri-loader-4-line ri-spin" style={{ fontSize: 24, marginRight: 8 }} />
          Đang tải...
        </div>
      ) : (
        <ApiKeysList
          apiKeys={apiKeys}
          onToggle={handleToggleStatus}
          onDelete={handleDelete}
          onTest={handleTest}
          onEdit={handleEdit}
          onSelect={handleSelect}
        />
      )}

      {/* Modals */}
      <CreateApiKeyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(rawKey) => {
          setCreatedRawKey(rawKey);
          setShowKeyCreatedModal(true);
        }}
        onSubmit={handleCreateApiKey}
        saving={saving}
      />

      <KeyCreatedModal
        isOpen={showKeyCreatedModal}
        rawKey={createdRawKey}
        onClose={() => {
          setShowKeyCreatedModal(false);
          setCreatedRawKey('');
        }}
      />

      <TestApiKeyModal
        isOpen={showTestModal}
        apiKey={testingApiKey}
        onClose={() => {
          setShowTestModal(false);
          setTestingApiKey(null);
        }}
      />

      {showDetailPanel && (
        <ApiKeyDetailPanel
          apiKey={selectedApiKey}
          onEdit={handleEditFromPanel}
          onDelete={handleDeleteFromPanel}
          onClose={handleCloseDetailPanel}
        />
      )}

      <EditApiKeyModal
        isOpen={showEditModal}
        apiKey={editingApiKey}
        onClose={() => {
          setShowEditModal(false);
          setEditingApiKey(null);
        }}
        onSaved={() => { /* handled in handleUpdateApiKey */ }}
        onSubmit={handleUpdateApiKey}
        saving={saving}
      />

      <DeleteApiKeyModal
        isOpen={showDeleteModal}
        apiKey={deletingApiKey}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingApiKey(null);
        }}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
