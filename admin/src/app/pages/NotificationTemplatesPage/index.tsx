/**
 * Notification Templates Page
 *
 * Admin page for managing notification templates.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 17.1, 17.2**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { useToast } from '../../components/Toast';
import { notificationTemplatesApi, type NotificationTemplate } from '../../api';
import { TemplateEditModal } from './TemplateEditModal';

// Template type labels in Vietnamese
const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  BID_RECEIVED: 'Nhận báo giá mới',
  BID_APPROVED: 'Báo giá được duyệt',
  BID_REJECTED: 'Báo giá bị từ chối',
  BID_SELECTED: 'Được chọn thầu',
  BID_NOT_SELECTED: 'Không được chọn',
  PROJECT_MATCHED: 'Ghép nối thành công',
  PROJECT_APPROVED: 'Công trình được duyệt',
  PROJECT_REJECTED: 'Công trình bị từ chối',
  ESCROW_PENDING: 'Chờ đặt cọc',
  ESCROW_HELD: 'Đặt cọc xác nhận',
  ESCROW_RELEASED: 'Giải phóng escrow',
  ESCROW_PARTIAL_RELEASED: 'Giải phóng một phần',
  ESCROW_REFUNDED: 'Hoàn tiền escrow',
  ESCROW_DISPUTED: 'Tranh chấp escrow',
  NEW_MESSAGE: 'Tin nhắn mới',
  MILESTONE_REQUESTED: 'Yêu cầu xác nhận milestone',
  MILESTONE_CONFIRMED: 'Milestone được xác nhận',
  MILESTONE_DISPUTED: 'Tranh chấp milestone',
  DISPUTE_RESOLVED: 'Tranh chấp đã giải quyết',
  BID_DEADLINE_REMINDER: 'Nhắc hạn nhận báo giá',
  NO_BIDS_REMINDER: 'Nhắc chưa có báo giá',
  ESCROW_PENDING_REMINDER: 'Nhắc đặt cọc',
};

// Glass effect styles
const glass = {
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
};

interface NotificationTemplatesPageProps {
  embedded?: boolean;
}

export function NotificationTemplatesPage({ embedded = false }: NotificationTemplatesPageProps) {
  const toast = useToast();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [availableTypes, setAvailableTypes] = useState<Array<{ type: string; label: string; description: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesData, typesData] = await Promise.all([
        notificationTemplatesApi.list(),
        notificationTemplatesApi.getTypes(),
      ]);
      setTemplates(templatesData);
      setAvailableTypes(typesData);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Không thể tải danh sách mẫu thông báo');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle seed default templates
  const handleSeedTemplates = async () => {
    try {
      setSeeding(true);
      const result = await notificationTemplatesApi.seed();
      toast.success(`Đã tạo ${result.count} mẫu thông báo mặc định`);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to seed templates:', error);
      toast.error('Không thể tạo mẫu thông báo mặc định');
    } finally {
      setSeeding(false);
    }
  };

  // Handle edit template
  const handleEditTemplate = async (type: string) => {
    try {
      const template = await notificationTemplatesApi.get(type);
      setSelectedTemplate(template);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch template:', error);
      toast.error('Không thể tải mẫu thông báo');
    }
  };

  // Handle save template
  const handleSaveTemplate = async (data: Partial<NotificationTemplate>) => {
    if (!selectedTemplate) return;

    try {
      await notificationTemplatesApi.update(selectedTemplate.type, {
        emailSubject: data.emailSubject,
        emailBody: data.emailBody,
        smsBody: data.smsBody,
        inAppTitle: data.inAppTitle,
        inAppBody: data.inAppBody,
        variables: data.variables,
      });
      toast.success('Đã cập nhật mẫu thông báo');
      setIsModalOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Không thể cập nhật mẫu thông báo');
    }
  };

  // Get template by type
  const getTemplateByType = (type: string) => {
    return templates.find(t => t.type === type);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: embedded ? '0' : '24px 20px' }}>
      {/* Header - hidden when embedded */}
      {!embedded && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: tokens.radius.lg,
                background: `${tokens.color.primary}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: tokens.color.primary,
              }}>
                <i className="ri-mail-settings-line" />
              </div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
                  Mẫu Thông Báo
                </h1>
                <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
                  Quản lý nội dung email, SMS và thông báo trong app
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSeedTemplates}
              disabled={seeding}
              style={{
                padding: '10px 20px',
                background: tokens.color.primary,
                border: 'none',
                borderRadius: tokens.radius.md,
                color: '#111',
                fontSize: 14,
                fontWeight: 600,
                cursor: seeding ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: seeding ? 0.7 : 1,
              }}
            >
              <i className={seeding ? 'ri-loader-4-line' : 'ri-add-line'} />
              {seeding ? 'Đang tạo...' : 'Tạo mẫu mặc định'}
            </motion.button>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: tokens.color.muted }}>
          <i className="ri-loader-4-line" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }} />
          <p>Đang tải...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 16,
        }}>
          {availableTypes.map((typeInfo) => {
            const template = getTemplateByType(typeInfo.type);
            const hasTemplate = !!template;

            return (
              <motion.div
                key={typeInfo.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  ...glass,
                  borderRadius: tokens.radius.lg,
                  padding: 20,
                  cursor: 'pointer',
                }}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleEditTemplate(typeInfo.type)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: tokens.color.text, margin: 0 }}>
                      {typeInfo.label || TEMPLATE_TYPE_LABELS[typeInfo.type] || typeInfo.type}
                    </h3>
                    <p style={{ fontSize: 12, color: tokens.color.muted, margin: '4px 0 0' }}>
                      {typeInfo.type}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: tokens.radius.sm,
                    fontSize: 11,
                    fontWeight: 600,
                    background: hasTemplate ? tokens.color.successBg : tokens.color.errorBg,
                    color: hasTemplate ? tokens.color.success : tokens.color.error,
                  }}>
                    {hasTemplate ? 'Đã cấu hình' : 'Chưa cấu hình'}
                  </span>
                </div>

                {hasTemplate && (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 12, color: tokens.color.muted, margin: '0 0 4px' }}>
                        <i className="ri-mail-line" style={{ marginRight: 4 }} />
                        Email Subject:
                      </p>
                      <p style={{
                        fontSize: 13,
                        color: tokens.color.text,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {template.emailSubject}
                      </p>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 12, color: tokens.color.muted, margin: '0 0 4px' }}>
                        <i className="ri-smartphone-line" style={{ marginRight: 4 }} />
                        SMS:
                      </p>
                      <p style={{
                        fontSize: 13,
                        color: tokens.color.text,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {template.smsBody}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: tokens.color.muted }}>
                        Version: {template.version}
                      </span>
                      <span style={{ fontSize: 11, color: tokens.color.muted }}>
                        Variables: {template.variables.length}
                      </span>
                    </div>
                  </>
                )}

                {!hasTemplate && (
                  <p style={{ fontSize: 13, color: tokens.color.muted, margin: 0 }}>
                    Click để tạo mẫu thông báo cho loại này
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && selectedTemplate && (
          <TemplateEditModal
            template={selectedTemplate}
            typeLabel={TEMPLATE_TYPE_LABELS[selectedTemplate.type] || selectedTemplate.type}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveTemplate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
