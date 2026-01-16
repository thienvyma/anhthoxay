import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { Button } from '../Button';
import { ImagePickerModal } from '../ImagePickerModal';
import { TemplatePicker } from '../TemplatePicker';
import type { SectionEditorProps, SectionKind } from './types';
import { getDefaultData } from './defaults';
import { getSectionIcon, getSectionDescription } from './utils';
import { renderPreview } from './previews/index';
import { renderFormFields } from './forms';

// Section types that should NOT sync across pages (each page has unique content)
const NO_SYNC_SECTIONS: SectionKind[] = ['HERO_SIMPLE'];

export function SectionEditor({ section, kind, onSave, onCancel }: SectionEditorProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [imagePickerField, setImagePickerField] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  // Default syncAll based on section type - HERO_SIMPLE should NOT sync
  const [syncAll, setSyncAll] = useState(!NO_SYNC_SECTIONS.includes(kind));
  const initialDataRef = useRef<string>('');

  useEffect(() => {
    if (section?.data) {
      setFormData(section.data as Record<string, unknown>);
      initialDataRef.current = JSON.stringify(section.data);
    } else {
      const defaultData = getDefaultData(kind);
      setFormData(defaultData);
      initialDataRef.current = JSON.stringify(defaultData);
    }
  }, [section?.id, kind]);

  // Check if form has been modified
  const hasChanges = () => {
    return JSON.stringify(formData) !== initialDataRef.current;
  };

  // Handle backdrop click - only close if no changes
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (!hasChanges()) {
        onCancel();
      }
      // If has changes, do nothing (don't close)
    }
  };

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSave(formData, syncAll);
    } finally {
      setSaving(false);
    }
  }

  function updateField(path: string, value: unknown) {
    setFormData((prev) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: Record<string, unknown> = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
          current[key] = {};
        } else {
          current[key] = Array.isArray(current[key])
            ? [...(current[key] as unknown[])]
            : { ...(current[key] as Record<string, unknown>) };
        }
        current = current[key] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  }

  function addArrayItem(path: string, defaultItem: unknown) {
    setFormData((prev) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: Record<string, unknown> = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = Array.isArray(current[key])
          ? [...(current[key] as unknown[])]
          : { ...(current[key] as Record<string, unknown>) };
        current = current[key] as Record<string, unknown>;
      }

      const lastKey = keys[keys.length - 1];
      const itemWithId = { ...(defaultItem as Record<string, unknown>), _id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
      current[lastKey] = [...((current[lastKey] as unknown[]) || []), itemWithId];
      return newData;
    });
  }

  function removeArrayItem(path: string, index: number) {
    setFormData((prev) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: Record<string, unknown> = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = Array.isArray(current[key])
          ? [...(current[key] as unknown[])]
          : { ...(current[key] as Record<string, unknown>) };
        current = current[key] as Record<string, unknown>;
      }

      const lastKey = keys[keys.length - 1];
      const arr = [...(current[lastKey] as unknown[])];
      arr.splice(index, 1);
      current[lastKey] = arr;
      return newData;
    });
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          background: tokens.color.overlay,
          zIndex: 9998,
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: showPreview ? 'min(1400px, 100%)' : 'min(900px, 100%)',
            height: 'min(90vh, 100%)',
            maxHeight: '90vh',
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.lg,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: tokens.shadow.lg,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '24px 28px',
              borderBottom: `1px solid ${tokens.color.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: tokens.color.surfaceAlt,
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <i className={getSectionIcon(kind)} style={{ fontSize: 24, color: tokens.color.primary }} />
                <h3 style={{ color: tokens.color.text, fontSize: 22, fontWeight: 700, margin: 0 }}>
                  {section ? 'Edit' : 'Create'} {kind.replace(/_/g, ' ')} Section
                </h3>
              </div>
              <p style={{ color: tokens.color.muted, fontSize: 14, margin: 0 }}>
                {getSectionDescription(kind)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {!section && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTemplatePicker(true)}
                  style={{
                    padding: '8px 16px',
                    background: tokens.color.info,
                    color: '#fff',
                    border: 'none',
                    borderRadius: tokens.radius.md,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <i className="ri-sparkling-line" />
                  Use Template
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  padding: '8px 16px',
                  background: showPreview ? tokens.color.primary : tokens.color.surfaceHover,
                  color: showPreview ? '#111' : tokens.color.text,
                  border: `1px solid ${showPreview ? tokens.color.primary : tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <i className={showPreview ? 'ri-eye-off-line' : 'ri-eye-line'} />
                {showPreview ? 'Hide' : 'Show'} Preview
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCancel}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tokens.color.muted,
                  cursor: 'pointer',
                  fontSize: 24,
                }}
              >
                <i className="ri-close-line" />
              </motion.button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
            {/* Form */}
            <form
              onSubmit={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: showPreview ? '0 0 50%' : 1,
                padding: 28,
                overflowY: 'auto',
                overflowX: 'hidden',
                background: tokens.color.background,
              }}
            >
              {renderFormFields(kind, formData, updateField, addArrayItem, removeArrayItem, setImagePickerField)}
            </form>

            {/* Preview */}
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  flex: '0 0 50%',
                  borderLeft: `1px solid ${tokens.color.border}`,
                  padding: 24,
                  overflowY: 'auto',
                  background: tokens.color.surfaceAlt,
                }}
              >
                <div style={{ marginBottom: 16, color: tokens.color.muted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ri-eye-line" />
                  Live Preview
                </div>
                <div style={{ background: tokens.color.surface, borderRadius: tokens.radius.md, padding: 32, minHeight: 300, border: `1px solid ${tokens.color.border}` }}>
                  {renderPreview(kind, formData)}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '20px 28px',
              borderTop: `1px solid ${tokens.color.border}`,
              display: 'flex',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Hide sync checkbox for section types that should have unique content per page */}
              {section && !NO_SYNC_SECTIONS.includes(kind) && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={syncAll}
                    onChange={(e) => setSyncAll(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span style={{ color: tokens.color.text, fontSize: 13 }}>
                    Đồng bộ tất cả sections cùng loại
                  </span>
                  <i 
                    className="ri-information-line" 
                    style={{ color: tokens.color.muted, fontSize: 14 }}
                    title="Khi bật, thay đổi sẽ được áp dụng cho tất cả sections cùng loại trên mọi trang"
                  />
                </label>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} loading={saving} icon={section ? 'ri-save-line' : 'ri-add-line'}>
                {section ? 'Update Section' : 'Create Section'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Image Picker Modal */}
      <AnimatePresence>
        {imagePickerField && (
          <ImagePickerModal
            currentUrl={(formData[imagePickerField] as string) || ''}
            onSelect={(url) => {
              updateField(imagePickerField, url);
              setImagePickerField(null);
            }}
            onCancel={() => setImagePickerField(null)}
          />
        )}
      </AnimatePresence>

      {/* Template Picker */}
      {showTemplatePicker && (
        <TemplatePicker
          kind={kind}
          onSelect={(templateData) => setFormData(templateData)}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
    </>
  );
}

export type { SectionEditorProps, SectionKind };
