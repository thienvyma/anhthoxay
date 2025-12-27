/**
 * SettingsTab - Furniture Fee Configuration
 *
 * Feature: furniture-quotation
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { ResponsiveModal, ResponsiveTable, TableColumn } from '../../../components/responsive';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, TextArea } from '../../components/Input';
import { Select } from '../../components/Select';
import { useToast } from '../../components/Toast';
import { furnitureFeesApi } from '../../api/furniture';
import type {
  SettingsTabProps,
  FurnitureFee,
  CreateFeeInput,
  UpdateFeeInput,
  FeeType,
  FeeApplicability,
} from './types';

// ========== MODAL TYPES ==========
type ModalType = 'fee' | 'deleteFee' | null;

// ========== FEE TYPE OPTIONS ==========
const FEE_TYPE_OPTIONS = [
  { value: 'FIXED', label: 'Cố định (VNĐ)' },
  { value: 'PERCENTAGE', label: 'Phần trăm (%)' },
];

// ========== APPLICABILITY OPTIONS ==========
const APPLICABILITY_OPTIONS = [
  { value: 'COMBO', label: 'Chỉ Combo' },
  { value: 'CUSTOM', label: 'Chỉ Custom' },
  { value: 'BOTH', label: 'Cả hai' },
];

// ========== COMPONENT ==========
export function SettingsTab({ fees, onRefresh }: SettingsTabProps) {
  const toast = useToast();

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingFee, setEditingFee] = useState<FurnitureFee | null>(null);
  const [deletingFeeId, setDeletingFeeId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Form state
  const [feeForm, setFeeForm] = useState<CreateFeeInput>({
    name: '',
    type: 'FIXED',
    value: 0,
    applicability: 'BOTH',
    description: '',
    order: 0,
    isActive: true,
  });


  // ========== HELPERS ==========
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatFeeValue = (fee: FurnitureFee) => {
    if (fee.type === 'PERCENTAGE') {
      return `${fee.value}%`;
    }
    return formatPrice(fee.value);
  };

  const getApplicabilityLabel = (applicability: FeeApplicability) => {
    const option = APPLICABILITY_OPTIONS.find((opt) => opt.value === applicability);
    return option?.label || applicability;
  };

  const getTypeLabel = (type: FeeType) => {
    const option = FEE_TYPE_OPTIONS.find((opt) => opt.value === type);
    return option?.label || type;
  };

  // ========== MODAL HANDLERS ==========
  const openFeeModal = useCallback((fee?: FurnitureFee) => {
    setModalType('fee');
    setEditingFee(fee || null);
    setFeeForm({
      name: fee?.name || '',
      type: fee?.type || 'FIXED',
      value: fee?.value || 0,
      applicability: fee?.applicability || 'BOTH',
      description: fee?.description || '',
      order: fee?.order || 0,
      isActive: fee?.isActive ?? true,
    });
  }, []);

  const openDeleteFeeModal = useCallback((feeId: string) => {
    setDeletingFeeId(feeId);
    setModalType('deleteFee');
  }, []);

  const closeModal = useCallback(() => {
    setModalType(null);
    setEditingFee(null);
    setDeletingFeeId('');
  }, []);

  // ========== FEE CRUD HANDLERS ==========
  const handleSaveFee = async () => {
    if (!feeForm.name.trim()) {
      toast.error('Vui lòng nhập tên phí');
      return;
    }
    if (feeForm.value <= 0) {
      toast.error('Giá trị phí phải lớn hơn 0');
      return;
    }
    if (feeForm.type === 'PERCENTAGE' && feeForm.value > 100) {
      toast.error('Phần trăm không được vượt quá 100%');
      return;
    }

    setLoading(true);
    try {
      if (editingFee) {
        await furnitureFeesApi.update(editingFee.id, feeForm as UpdateFeeInput);
        toast.success('Cập nhật phí thành công');
      } else {
        await furnitureFeesApi.create(feeForm);
        toast.success('Thêm phí thành công');
      }
      onRefresh();
      closeModal();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFee = async () => {
    if (!deletingFeeId) return;
    setLoading(true);
    try {
      await furnitureFeesApi.delete(deletingFeeId);
      toast.success('Đã xóa phí');
      onRefresh();
      closeModal();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (fee: FurnitureFee) => {
    setLoading(true);
    try {
      await furnitureFeesApi.update(fee.id, { isActive: !fee.isActive });
      toast.success(fee.isActive ? 'Đã ẩn phí' : 'Đã kích hoạt phí');
      onRefresh();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };


  // ========== TABLE COLUMNS ==========
  const columns: TableColumn<FurnitureFee>[] = useMemo(
    () => [
      {
        key: 'name' as keyof FurnitureFee,
        header: 'Tên phí',
        priority: 1,
        render: (_, row) => (
          <div>
            <div style={{ fontWeight: 600, color: tokens.color.text }}>{row.name}</div>
            {row.description && (
              <div
                style={{
                  fontSize: 12,
                  color: tokens.color.muted,
                  maxWidth: 250,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.description}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'type' as keyof FurnitureFee,
        header: 'Loại',
        priority: 2,
        hideOnMobile: true,
        render: (value) => (
          <span
            style={{
              background:
                value === 'FIXED'
                  ? `${tokens.color.info}20`
                  : `${tokens.color.accent}20`,
              color: value === 'FIXED' ? tokens.color.info : tokens.color.accent,
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {getTypeLabel(value as FeeType)}
          </span>
        ),
      },
      {
        key: 'value' as keyof FurnitureFee,
        header: 'Giá trị',
        priority: 3,
        align: 'right',
        render: (_, row) => (
          <span style={{ fontWeight: 600, color: tokens.color.primary }}>
            {formatFeeValue(row)}
          </span>
        ),
      },
      {
        key: 'applicability' as keyof FurnitureFee,
        header: 'Áp dụng',
        priority: 4,
        hideOnMobile: true,
        render: (value) => (
          <span
            style={{
              background: `${tokens.color.muted}20`,
              color: tokens.color.text,
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {getApplicabilityLabel(value as FeeApplicability)}
          </span>
        ),
      },
      {
        key: 'isActive' as keyof FurnitureFee,
        header: 'Trạng thái',
        priority: 5,
        align: 'center',
        render: (value, row) => (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(row);
            }}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 16,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: value
                ? `${tokens.color.success}20`
                : `${tokens.color.muted}20`,
              color: value ? tokens.color.success : tokens.color.muted,
              fontSize: 12,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            <i className={value ? 'ri-check-line' : 'ri-close-line'} />
            {value ? 'Hoạt động' : 'Đã ẩn'}
          </motion.button>
        ),
      },
    ],
    [loading]
  );


  // ========== RENDER ==========
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <h3 style={{ color: tokens.color.text, margin: 0, fontSize: 20, fontWeight: 600 }}>
          Cài đặt Phí
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button onClick={onRefresh} disabled={loading} variant="outline">
            <i className="ri-refresh-line" /> Làm mới
          </Button>
          <Button onClick={() => openFeeModal()} disabled={loading}>
            <i className="ri-add-line" /> Thêm Phí
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card style={{ marginBottom: 24, background: `${tokens.color.info}10`, border: `1px solid ${tokens.color.info}30` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <i className="ri-information-line" style={{ fontSize: 20, color: tokens.color.info, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, color: tokens.color.text, marginBottom: 4 }}>
              Hướng dẫn cài đặt phí
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, color: tokens.color.muted, fontSize: 13, lineHeight: 1.6 }}>
              <li><strong>Cố định (VNĐ):</strong> Phí được cộng trực tiếp vào tổng giá (VD: 500,000 VNĐ)</li>
              <li><strong>Phần trăm (%):</strong> Phí được tính theo % của giá cơ bản (VD: 5%)</li>
              <li><strong>Áp dụng:</strong> Chọn loại báo giá mà phí sẽ được áp dụng (Combo, Custom, hoặc cả hai)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Fees Table */}
      <Card>
        <ResponsiveTable
          data={fees}
          columns={columns}
          loading={loading}
          emptyMessage="Chưa có phí nào. Nhấn 'Thêm Phí' để tạo mới."
          getRowKey={(row) => row.id}
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="ghost"
                size="small"
                onClick={() => openFeeModal(row)}
                disabled={loading}
              >
                <i className="ri-edit-line" />
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => openDeleteFeeModal(row.id)}
                disabled={loading}
                style={{ color: tokens.color.error }}
              >
                <i className="ri-delete-bin-line" />
              </Button>
            </div>
          )}
        />
      </Card>


      {/* Fee Form Modal */}
      <ResponsiveModal
        isOpen={modalType === 'fee'}
        onClose={closeModal}
        title={editingFee ? 'Sửa Phí' : 'Thêm Phí'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleSaveFee} loading={loading}>
              {editingFee ? 'Cập nhật' : 'Thêm'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Tên phí"
            value={feeForm.name}
            onChange={(val) => setFeeForm((prev) => ({ ...prev, name: val }))}
            placeholder="VD: Phí vận chuyển"
            required
            fullWidth
          />

          <Select
            label="Loại phí"
            value={feeForm.type}
            onChange={(val) => setFeeForm((prev) => ({ ...prev, type: val as FeeType }))}
            options={FEE_TYPE_OPTIONS}
          />

          <Input
            label={feeForm.type === 'PERCENTAGE' ? 'Giá trị (%)' : 'Giá trị (VNĐ)'}
            type="number"
            value={feeForm.value}
            onChange={(val) => setFeeForm((prev) => ({ ...prev, value: parseFloat(val) || 0 }))}
            placeholder={feeForm.type === 'PERCENTAGE' ? 'VD: 5' : 'VD: 500000'}
            required
            fullWidth
          />

          <Select
            label="Áp dụng cho"
            value={feeForm.applicability}
            onChange={(val) => setFeeForm((prev) => ({ ...prev, applicability: val as FeeApplicability }))}
            options={APPLICABILITY_OPTIONS}
          />

          <TextArea
            label="Mô tả"
            value={feeForm.description || ''}
            onChange={(val) => setFeeForm((prev) => ({ ...prev, description: val }))}
            placeholder="Mô tả chi tiết về phí..."
            rows={3}
            fullWidth
          />

          <Input
            label="Thứ tự hiển thị"
            type="number"
            value={feeForm.order || 0}
            onChange={(val) => setFeeForm((prev) => ({ ...prev, order: parseInt(val) || 0 }))}
            placeholder="0"
            fullWidth
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              id="fee-active"
              checked={feeForm.isActive}
              onChange={(e) => setFeeForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="fee-active" style={{ color: tokens.color.text, cursor: 'pointer' }}>
              Kích hoạt phí này
            </label>
          </div>
        </div>
      </ResponsiveModal>

      {/* Delete Fee Confirmation Modal */}
      <ResponsiveModal
        isOpen={modalType === 'deleteFee'}
        onClose={closeModal}
        title="Xác nhận xóa Phí"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteFee} loading={loading}>
              Xóa
            </Button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <i
            className="ri-error-warning-line"
            style={{ fontSize: 48, color: tokens.color.warning, marginBottom: 16, display: 'block' }}
          />
          <p style={{ color: tokens.color.text, marginBottom: 8 }}>
            Bạn có chắc muốn xóa phí này?
          </p>
          <p style={{ color: tokens.color.muted, fontSize: 13 }}>
            Hành động này không thể hoàn tác.
          </p>
        </div>
      </ResponsiveModal>
    </div>
  );
}

export default SettingsTab;
