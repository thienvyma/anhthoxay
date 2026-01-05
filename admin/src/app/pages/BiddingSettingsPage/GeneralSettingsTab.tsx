/**
 * General Settings Tab - Cấu hình Đấu thầu chung
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { biddingSettingsApi } from '../../api';

interface BiddingSettings {
  id: string;
  maxBidsPerProject: number;
  defaultBidDuration: number;
  minBidDuration: number;
  maxBidDuration: number;
  escrowPercentage: number;
  escrowMinAmount: number;
  escrowMaxAmount: number | null;
  verificationFee: number;
  winFeePercentage: number;
  autoApproveHomeowner: boolean;
  autoApproveProject: boolean;
}

const defaultSettings: BiddingSettings = {
  id: 'default',
  maxBidsPerProject: 20,
  defaultBidDuration: 7,
  minBidDuration: 3,
  maxBidDuration: 30,
  escrowPercentage: 10,
  escrowMinAmount: 1000000,
  escrowMaxAmount: null,
  verificationFee: 500000,
  winFeePercentage: 5,
  autoApproveHomeowner: true,
  autoApproveProject: false,
};

const glass = {
  background: tokens.color.surfaceAlt,
  border: `1px solid ${tokens.color.border}`,
};


export const GeneralSettingsTab = memo(function GeneralSettingsTab() {
  const toast = useToast();
  const [settings, setSettings] = useState<BiddingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await biddingSettingsApi.get();
        setSettings(data);
      } catch (error) {
        console.error('Failed to fetch bidding settings:', error);
        toast.error('Không thể tải cấu hình đấu thầu');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (settings.minBidDuration > settings.maxBidDuration) {
      newErrors.minBidDuration = 'Thời gian tối thiểu không được lớn hơn tối đa';
    }
    if (settings.defaultBidDuration < settings.minBidDuration) {
      newErrors.defaultBidDuration = 'Thời gian mặc định không được nhỏ hơn tối thiểu';
    }
    if (settings.defaultBidDuration > settings.maxBidDuration) {
      newErrors.defaultBidDuration = 'Thời gian mặc định không được lớn hơn tối đa';
    }
    if (settings.escrowMaxAmount !== null && settings.escrowMinAmount > settings.escrowMaxAmount) {
      newErrors.escrowMinAmount = 'Số tiền tối thiểu không được lớn hơn tối đa';
    }
    if (settings.maxBidsPerProject < 1 || settings.maxBidsPerProject > 100) {
      newErrors.maxBidsPerProject = 'Số bid tối đa phải từ 1 đến 100';
    }
    if (settings.escrowPercentage < 0 || settings.escrowPercentage > 100) {
      newErrors.escrowPercentage = 'Phần trăm đặt cọc phải từ 0 đến 100';
    }
    if (settings.winFeePercentage < 0 || settings.winFeePercentage > 100) {
      newErrors.winFeePercentage = 'Phần trăm phí thắng thầu phải từ 0 đến 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [settings]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại các trường có lỗi');
      return;
    }
    try {
      setSaving(true);
      await biddingSettingsApi.update({
        maxBidsPerProject: settings.maxBidsPerProject,
        defaultBidDuration: settings.defaultBidDuration,
        minBidDuration: settings.minBidDuration,
        maxBidDuration: settings.maxBidDuration,
        escrowPercentage: settings.escrowPercentage,
        escrowMinAmount: settings.escrowMinAmount,
        escrowMaxAmount: settings.escrowMaxAmount,
        verificationFee: settings.verificationFee,
        winFeePercentage: settings.winFeePercentage,
        autoApproveHomeowner: settings.autoApproveHomeowner,
        autoApproveProject: settings.autoApproveProject,
      });
      toast.success('Cấu hình đấu giá đã được lưu!');
    } catch (error) {
      console.error('Failed to save bidding settings:', error);
      toast.error('Lưu cấu hình thất bại');
    } finally {
      setSaving(false);
    }
  }, [settings, validate, toast]);

  const updateField = useCallback(
    <K extends keyof BiddingSettings>(field: K, value: BiddingSettings[K]) => {
      setSettings((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, color: tokens.color.muted }}
      >
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 24, marginRight: 12 }}
        />
        Đang tải cấu hình...
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card icon="ri-auction-line" title="Cấu hình Bidding" subtitle="Số lượng bid và thời gian đấu giá">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Input label="Số bid tối đa/công trình" type="number" value={settings.maxBidsPerProject}
            onChange={(v) => updateField('maxBidsPerProject', parseInt(v) || 0)} error={errors.maxBidsPerProject} fullWidth />
          <Input label="Thời gian bid mặc định (ngày)" type="number" value={settings.defaultBidDuration}
            onChange={(v) => updateField('defaultBidDuration', parseInt(v) || 0)} error={errors.defaultBidDuration} fullWidth />
          <Input label="Thời gian bid tối thiểu (ngày)" type="number" value={settings.minBidDuration}
            onChange={(v) => updateField('minBidDuration', parseInt(v) || 0)} error={errors.minBidDuration} fullWidth />
          <Input label="Thời gian bid tối đa (ngày)" type="number" value={settings.maxBidDuration}
            onChange={(v) => updateField('maxBidDuration', parseInt(v) || 0)} error={errors.maxBidDuration} fullWidth />
        </div>
      </Card>

      <Card icon="ri-safe-2-line" title="Cấu hình Escrow" subtitle="Đặt cọc và bảo đảm">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Input label="Phần trăm đặt cọc (%)" type="number" value={settings.escrowPercentage}
            onChange={(v) => updateField('escrowPercentage', parseFloat(v) || 0)} error={errors.escrowPercentage} fullWidth />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Input label="Số tiền tối thiểu (VNĐ)" type="number" value={settings.escrowMinAmount}
              onChange={(v) => updateField('escrowMinAmount', parseFloat(v) || 0)} error={errors.escrowMinAmount} fullWidth />
            <span style={{ fontSize: 12, color: tokens.color.muted }}>≈ {formatCurrency(settings.escrowMinAmount)} VNĐ</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Input label="Số tiền tối đa (VNĐ)" type="number" value={settings.escrowMaxAmount ?? ''}
              onChange={(v) => updateField('escrowMaxAmount', v ? parseFloat(v) : null)} placeholder="Để trống = không giới hạn" fullWidth />
            {settings.escrowMaxAmount && <span style={{ fontSize: 12, color: tokens.color.muted }}>≈ {formatCurrency(settings.escrowMaxAmount)} VNĐ</span>}
          </div>
        </div>
      </Card>

      <Card icon="ri-money-dollar-circle-line" title="Cấu hình Phí" subtitle="Phí xác minh và phí thắng thầu">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Input label="Phí xác minh nhà thầu (VNĐ)" type="number" value={settings.verificationFee}
              onChange={(v) => updateField('verificationFee', parseFloat(v) || 0)} fullWidth />
            <span style={{ fontSize: 12, color: tokens.color.muted }}>≈ {formatCurrency(settings.verificationFee)} VNĐ</span>
          </div>
          <Input label="Phí thắng thầu (%)" type="number" value={settings.winFeePercentage}
            onChange={(v) => updateField('winFeePercentage', parseFloat(v) || 0)} error={errors.winFeePercentage} fullWidth />
        </div>
      </Card>

      <Card icon="ri-checkbox-circle-line" title="Tự động duyệt" subtitle="Cấu hình tự động phê duyệt">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: glass.background, borderRadius: tokens.radius.md, border: glass.border, cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.autoApproveHomeowner} onChange={(e) => updateField('autoApproveHomeowner', e.target.checked)}
              style={{ width: 20, height: 20, accentColor: tokens.color.primary }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Tự động duyệt Chủ nhà</p>
              <p style={{ color: tokens.color.muted, fontSize: 12, margin: '4px 0 0' }}>Chủ nhà đăng ký sẽ được tự động kích hoạt tài khoản</p>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: glass.background, borderRadius: tokens.radius.md, border: glass.border, cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.autoApproveProject} onChange={(e) => updateField('autoApproveProject', e.target.checked)}
              style={{ width: 20, height: 20, accentColor: tokens.color.primary }} />
            <div>
              <p style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Tự động duyệt Công trình</p>
              <p style={{ color: tokens.color.muted, fontSize: 12, margin: '4px 0 0' }}>Công trình đăng mới sẽ được tự động phê duyệt để đấu giá</p>
            </div>
          </label>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? <><motion.i className="ri-loader-4-line" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} /> Đang lưu...</> : <><i className="ri-save-line" /> Lưu thay đổi</>}
        </Button>
      </div>
    </motion.div>
  );
});
