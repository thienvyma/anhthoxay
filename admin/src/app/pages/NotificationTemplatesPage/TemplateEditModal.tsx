/**
 * Template Edit Modal
 *
 * Modal for editing notification templates with preview.
 *
 * **Feature: bidding-phase4-communication**
 * **Requirements: 17.2, 17.3**
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { notificationTemplatesApi, type NotificationTemplate, type RenderedTemplate } from '../../api';

interface TemplateEditModalProps {
  template: NotificationTemplate;
  typeLabel: string;
  onClose: () => void;
  onSave: (data: Partial<NotificationTemplate>) => Promise<void>;
}

// Glass effect styles - will be applied with tokens in component
const getGlassStyle = () => ({
  background: 'rgba(30, 30, 40, 0.95)',
  border: `1px solid ${tokens.color.border}`,
});

type TabType = 'email' | 'sms' | 'inapp' | 'preview';

export function TemplateEditModal({ template, typeLabel, onClose, onSave }: TemplateEditModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('email');
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<RenderedTemplate | null>(null);

  // Form state
  const [emailSubject, setEmailSubject] = useState(template.emailSubject);
  const [emailBody, setEmailBody] = useState(template.emailBody);
  const [smsBody, setSmsBody] = useState(template.smsBody);
  const [inAppTitle, setInAppTitle] = useState(template.inAppTitle);
  const [inAppBody, setInAppBody] = useState(template.inAppBody);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>(() => {
    const vars: Record<string, string> = {};
    template.variables.forEach(v => {
      vars[v] = `[${v}]`;
    });
    return vars;
  });

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave({
        emailSubject,
        emailBody,
        smsBody,
        inAppTitle,
        inAppBody,
        variables: template.variables,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle preview
  const handlePreview = useCallback(async () => {
    try {
      setPreviewing(true);
      const result = await notificationTemplatesApi.render({
        type: template.type,
        variables: previewVariables,
      });
      setPreview(result);
      setActiveTab('preview');
    } catch (error) {
      console.error('Failed to render preview:', error);
    } finally {
      setPreviewing(false);
    }
  }, [template.type, previewVariables]);

  // Tabs
  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'email', label: 'Email', icon: 'ri-mail-line' },
    { id: 'sms', label: 'SMS', icon: 'ri-smartphone-line' },
    { id: 'inapp', label: 'In-App', icon: 'ri-notification-3-line' },
    { id: 'preview', label: 'Preview', icon: 'ri-eye-line' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: tokens.color.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{
          ...getGlassStyle(),
          borderRadius: tokens.radius.xl,
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${tokens.color.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: tokens.color.text, margin: 0 }}>
              {typeLabel}
            </h2>
            <p style={{ fontSize: 13, color: tokens.color.muted, margin: '4px 0 0' }}>
              {template.type} • Version {template.version}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: tokens.color.muted,
              fontSize: 24,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 4,
          padding: '12px 24px',
          borderBottom: `1px solid ${tokens.color.border}`,
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                background: activeTab === tab.id ? tokens.color.primary : 'transparent',
                border: 'none',
                borderRadius: tokens.radius.md,
                color: activeTab === tab.id ? '#111' : tokens.color.text,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {/* Email Tab */}
          {activeTab === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: tokens.color.muted, marginBottom: 6 }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: tokens.color.surfaceHover,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.text,
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: tokens.color.muted, marginBottom: 6 }}>
                  Body (HTML)
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: tokens.color.surfaceHover,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.text,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {/* SMS Tab */}
          {activeTab === 'sms' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: tokens.color.muted, marginBottom: 6 }}>
                SMS Message (max 160 characters)
              </label>
              <textarea
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                maxLength={160}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: tokens.color.surfaceHover,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.text,
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
              <p style={{ fontSize: 12, color: tokens.color.muted, marginTop: 8 }}>
                {smsBody.length}/160 characters
              </p>
            </div>
          )}

          {/* In-App Tab */}
          {activeTab === 'inapp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: tokens.color.muted, marginBottom: 6 }}>
                  Title
                </label>
                <input
                  type="text"
                  value={inAppTitle}
                  onChange={(e) => setInAppTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: tokens.color.surfaceHover,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.text,
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: tokens.color.muted, marginBottom: 6 }}>
                  Body
                </label>
                <textarea
                  value={inAppBody}
                  onChange={(e) => setInAppBody(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: tokens.color.surfaceHover,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.text,
                    fontSize: 14,
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Variables Input */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text, margin: '0 0 12px' }}>
                  Preview Variables
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {template.variables.map((variable) => (
                    <div key={variable}>
                      <label style={{ display: 'block', fontSize: 12, color: tokens.color.muted, marginBottom: 4 }}>
                        {`{{${variable}}}`}
                      </label>
                      <input
                        type="text"
                        value={previewVariables[variable] || ''}
                        onChange={(e) => setPreviewVariables(prev => ({ ...prev, [variable]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: tokens.color.surfaceHover,
                          border: `1px solid ${tokens.color.border}`,
                          borderRadius: tokens.radius.sm,
                          color: tokens.color.text,
                          fontSize: 13,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handlePreview}
                  disabled={previewing}
                  style={{
                    marginTop: 12,
                    padding: '8px 16px',
                    background: tokens.color.accent,
                    border: 'none',
                    borderRadius: tokens.radius.md,
                    color: '#111',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: previewing ? 'not-allowed' : 'pointer',
                    opacity: previewing ? 0.7 : 1,
                  }}
                >
                  {previewing ? 'Đang tạo preview...' : 'Tạo Preview'}
                </button>
              </div>

              {/* Preview Result */}
              {preview && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    background: tokens.color.surfaceAlt,
                    borderRadius: tokens.radius.md,
                    padding: 16,
                  }}>
                    <h5 style={{ fontSize: 12, color: tokens.color.muted, margin: '0 0 8px' }}>
                      <i className="ri-mail-line" style={{ marginRight: 4 }} />
                      Email Preview
                    </h5>
                    <p style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text, margin: '0 0 8px' }}>
                      {preview.emailSubject}
                    </p>
                    <div
                      style={{
                        fontSize: 13,
                        color: tokens.color.text,
                        background: '#fff',
                        padding: 12,
                        borderRadius: tokens.radius.sm,
                      }}
                      dangerouslySetInnerHTML={{ __html: preview.emailBody }}
                    />
                  </div>

                  <div style={{
                    background: tokens.color.surfaceAlt,
                    borderRadius: tokens.radius.md,
                    padding: 16,
                  }}>
                    <h5 style={{ fontSize: 12, color: tokens.color.muted, margin: '0 0 8px' }}>
                      <i className="ri-smartphone-line" style={{ marginRight: 4 }} />
                      SMS Preview
                    </h5>
                    <p style={{ fontSize: 13, color: tokens.color.text, margin: 0 }}>
                      {preview.smsBody}
                    </p>
                  </div>

                  <div style={{
                    background: tokens.color.surfaceAlt,
                    borderRadius: tokens.radius.md,
                    padding: 16,
                  }}>
                    <h5 style={{ fontSize: 12, color: tokens.color.muted, margin: '0 0 8px' }}>
                      <i className="ri-notification-3-line" style={{ marginRight: 4 }} />
                      In-App Preview
                    </h5>
                    <p style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text, margin: '0 0 4px' }}>
                      {preview.inAppTitle}
                    </p>
                    <p style={{ fontSize: 13, color: tokens.color.text, margin: 0 }}>
                      {preview.inAppBody}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${tokens.color.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.text,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: tokens.color.primary,
              border: 'none',
              borderRadius: tokens.radius.md,
              color: '#111',
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
