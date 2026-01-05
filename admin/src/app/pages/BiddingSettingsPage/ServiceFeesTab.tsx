/**
 * Service Fees Tab - Quản lý Phí dịch vụ
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { serviceFeesApi, type ServiceFee } from '../../api';

interface FeeFormData {
  name: string;
  code: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  description: string;
  isActive: boolean;
}

const defaultFeeFormData: FeeFormData = {
  name: '',
  code: '',
  type: 'FIXED',
  value: 0,
  description: '',
  isActive: true,
};

const glass = {
  background: tokens.color.surfaceAlt,
  border: `1px solid ${tokens.color.border}`,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  color: tokens.color.muted,
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '16px',
  color: tokens.color.text,
  fontSize: 14,
};


export const ServiceFeesTab = memo(function ServiceFeesTab() {
  const toast = useToast();
  const [fees, setFees] = useState<ServiceFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<ServiceFee | null>(null);
  const [formData, setFormData] = useState<FeeFormData>(defaultFeeFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await serviceFeesApi.list();
      setFees(data);
    } catch (error) {
      console.error('Failed to fetch service fees:', error);
      toast.error('Không thể tải danh sách phí dịch vụ');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const formatCurrency = (value: number): string => new Intl.NumberFormat('vi-VN').format(value);
  const formatFeeValue = (fee: ServiceFee): string => fee.type === 'PERCENTAGE' ? `${fee.value}%` : formatCurrency(fee.value) + ' VNĐ';

  const handleAddFee = useCallback(() => {
    setEditingFee(null);
    setFormData(defaultFeeFormData);
    setErrors({});
    setShowModal(true);
  }, []);

  const handleEditFee = useCallback((fee: ServiceFee) => {
    setEditingFee(fee);
    setFormData({ name: fee.name, code: fee.code, type: fee.type, value: fee.value, description: fee.description || '', isActive: fee.isActive });
    setErrors({});
    setShowModal(true);
  }, []);

  const validateFee = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Tên phí không được để trống';
    if (!formData.code.trim()) newErrors.code = 'Mã phí không được để trống';
    else if (!/^[A-Z][A-Z0-9_]*$/.test(formData.code)) newErrors.code = 'Mã phí phải viết hoa, bắt đầu bằng chữ cái';
    if (formData.value < 0) newErrors.value = 'Giá trị phí không được âm';
    if (formData.type === 'PERCENTAGE' && formData.value > 100) newErrors.value = 'Phần trăm phí phải từ 0 đến 100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSaveFee = useCallback(async () => {
    if (!validateFee()) return;
    try {
      setSaving(true);
      if (editingFee) {
        await serviceFeesApi.update(editingFee.id, { name: formData.name, code: formData.code, type: formData.type, value: formData.value, description: formData.description || null, isActive: formData.isActive });
        toast.success('Đã cập nhật phí dịch vụ!');
      } else {
        await serviceFeesApi.create({ name: formData.name, code: formData.code, type: formData.type, value: formData.value, description: formData.description || undefined, isActive: formData.isActive });
        toast.success('Đã tạo phí dịch vụ mới!');
      }
      setShowModal(false);
      fetchFees();
    } catch (error) {
      console.error('Failed to save service fee:', error);
      toast.error(error instanceof Error ? error.message : 'Lưu phí dịch vụ thất bại');
    } finally {
      setSaving(false);
    }
  }, [editingFee, formData, validateFee, toast, fetchFees]);

  const handleToggleFeeActive = useCallback(async (fee: ServiceFee) => {
    try {
      await serviceFeesApi.update(fee.id, { isActive: !fee.isActive });
      toast.success(`Đã ${fee.isActive ? 'tắt' : 'bật'} phí "${fee.name}"`);
      fetchFees();
    } catch (error) {
      console.error('Failed to toggle service fee:', error);
      toast.error('Không thể thay đổi trạng thái phí');
    }
  }, [toast, fetchFees]);

  const handleDeleteFee = useCallback(async (fee: ServiceFee) => {
    if (!confirm(`Bạn có chắc muốn xóa phí "${fee.name}"?`)) return;
    try {
      await serviceFeesApi.delete(fee.id);
      toast.success('Đã xóa phí dịch vụ!');
      fetchFees();
    } catch (error) {
      console.error('Failed to delete service fee:', error);
      toast.error('Không thể xóa phí dịch vụ');
    }
  }, [toast, fetchFees]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, color: tokens.color.muted }}>
        <motion.i className="ri-loader-4-line" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 24, marginRight: 12 }} />
        Đang tải danh sách phí...
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card icon="ri-money-dollar-circle-line" title="Phí dịch vụ" subtitle="Quản lý các loại phí trong hệ thống đấu giá"
        actions={<Button variant="primary" onClick={handleAddFee}><i className="ri-add-line" /> Thêm phí mới</Button>}>
        {fees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: tokens.color.muted }}>
            <i className="ri-inbox-line" style={{ fontSize: 48, marginBottom: 16, display: 'block', opacity: 0.5 }} />
            <p style={{ margin: '0 0 16px' }}>Chưa có phí dịch vụ nào</p>
            <Button variant="outline" onClick={handleAddFee}><i className="ri-add-line" /> Thêm phí đầu tiên</Button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: glass.border }}>
                  <th style={thStyle}>Tên phí</th>
                  <th style={thStyle}>Mã</th>
                  <th style={thStyle}>Loại</th>
                  <th style={thStyle}>Giá trị</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id} style={{ borderBottom: glass.border }}>
                    <td style={tdStyle}>
                      <div>
                        <p style={{ color: tokens.color.text, fontWeight: 600, margin: 0 }}>{fee.name}</p>
                        {fee.description && <p style={{ color: tokens.color.muted, fontSize: 12, margin: '4px 0 0' }}>{fee.description}</p>}
                      </div>
                    </td>
                    <td style={tdStyle}><code style={{ background: tokens.color.surfaceHover, padding: '2px 8px', borderRadius: 4, fontSize: 12, color: tokens.color.accent }}>{fee.code}</code></td>
                    <td style={tdStyle}>
                      <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: fee.type === 'PERCENTAGE' ? 'rgba(147,197,253,0.2)' : 'rgba(167,243,208,0.2)', color: fee.type === 'PERCENTAGE' ? '#93c5fd' : '#a7f3d0' }}>
                        {fee.type === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}
                      </span>
                    </td>
                    <td style={tdStyle}><span style={{ color: tokens.color.primary, fontWeight: 600 }}>{formatFeeValue(fee)}</span></td>
                    <td style={tdStyle}>
                      <button onClick={() => handleToggleFeeActive(fee)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: fee.isActive ? '#a7f3d0' : tokens.color.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className={fee.isActive ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} />
                        {fee.isActive ? 'Đang bật' : 'Đã tắt'}
                      </button>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button variant="ghost" onClick={() => handleEditFee(fee)}><i className="ri-edit-line" /></Button>
                        <Button variant="ghost" onClick={() => handleDeleteFee(fee)}><i className="ri-delete-bin-line" style={{ color: '#f87171' }} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: tokens.color.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: tokens.color.surface, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{editingFee ? 'Chỉnh sửa phí dịch vụ' : 'Thêm phí dịch vụ mới'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: tokens.color.muted, cursor: 'pointer', fontSize: 20 }}><i className="ri-close-line" /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input label="Tên phí" value={formData.name} onChange={(v) => setFormData((prev) => ({ ...prev, name: v }))} error={errors.name} placeholder="VD: Phí xác minh nhà thầu" fullWidth />
                <Input label="Mã phí" value={formData.code} onChange={(v) => setFormData((prev) => ({ ...prev, code: v.toUpperCase() }))} error={errors.code} placeholder="VD: VERIFICATION_FEE" fullWidth />
                <div>
                  <label style={{ display: 'block', color: tokens.color.text, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Loại phí</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: formData.type === 'FIXED' ? `${tokens.color.primary}15` : glass.background, border: formData.type === 'FIXED' ? `1px solid ${tokens.color.primary}` : glass.border, borderRadius: tokens.radius.md, cursor: 'pointer' }}>
                      <input type="radio" name="feeType" checked={formData.type === 'FIXED'} onChange={() => setFormData((prev) => ({ ...prev, type: 'FIXED' }))} style={{ accentColor: tokens.color.primary }} />
                      <span style={{ color: tokens.color.text, fontSize: 14 }}>Cố định (VNĐ)</span>
                    </label>
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: formData.type === 'PERCENTAGE' ? `${tokens.color.primary}15` : glass.background, border: formData.type === 'PERCENTAGE' ? `1px solid ${tokens.color.primary}` : glass.border, borderRadius: tokens.radius.md, cursor: 'pointer' }}>
                      <input type="radio" name="feeType" checked={formData.type === 'PERCENTAGE'} onChange={() => setFormData((prev) => ({ ...prev, type: 'PERCENTAGE' }))} style={{ accentColor: tokens.color.primary }} />
                      <span style={{ color: tokens.color.text, fontSize: 14 }}>Phần trăm (%)</span>
                    </label>
                  </div>
                </div>
                <Input label={formData.type === 'PERCENTAGE' ? 'Giá trị (%)' : 'Giá trị (VNĐ)'} type="number" value={formData.value} onChange={(v) => setFormData((prev) => ({ ...prev, value: parseFloat(v) || 0 }))} error={errors.value} fullWidth />
                <Input label="Mô tả (tùy chọn)" value={formData.description} onChange={(v) => setFormData((prev) => ({ ...prev, description: v }))} placeholder="Mô tả ngắn về phí này" fullWidth />
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: glass.background, borderRadius: tokens.radius.md, border: glass.border, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))} style={{ width: 18, height: 18, accentColor: tokens.color.primary }} />
                  <span style={{ color: tokens.color.text, fontSize: 14 }}>Kích hoạt phí này</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
                <Button variant="primary" onClick={handleSaveFee} disabled={saving}>
                  {saving ? <><motion.i className="ri-loader-4-line" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} /> Đang lưu...</> : <><i className="ri-save-line" /> {editingFee ? 'Cập nhật' : 'Tạo mới'}</>}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
