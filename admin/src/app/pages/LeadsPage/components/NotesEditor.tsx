import { useState } from 'react';
import { tokens } from '@app/shared';
import { Button } from '../../../components/Button';
import type { NotesEditorProps } from '../types';

/**
 * NotesEditor - Editable notes field with save functionality
 */
export function NotesEditor({ initialNotes, onSave }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Thêm ghi chú..."
        style={{
          width: '100%',
          minHeight: 80,
          padding: 12,
          background: 'rgba(0,0,0,0.2)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: 8,
          color: tokens.color.text,
          fontSize: 14,
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Button 
          variant="outline" 
          size="small" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu ghi chú'}
        </Button>
        {saved && (
          <span style={{ color: '#10b981', fontSize: 13 }}>
            <i className="ri-check-line" /> Đã lưu
          </span>
        )}
      </div>
    </div>
  );
}
