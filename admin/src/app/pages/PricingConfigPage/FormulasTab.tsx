import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { formulasApi } from '../../api';
import type { FormulasTabProps, Formula } from './types';

export function FormulasTab({ formulas, unitPrices, onRefresh }: FormulasTabProps) {
  const toast = useToast();
  const [editingItem, setEditingItem] = useState<Formula | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: '', expression: '', description: '', isActive: true });

  const resetForm = () => {
    setForm({ name: '', expression: '', description: '', isActive: true });
    setEditingItem(null);
    setIsCreating(false);
  };

  const handleEdit = (item: Formula) => {
    setEditingItem(item);
    setForm({ name: item.name, expression: item.expression, description: item.description || '', isActive: item.isActive });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.expression.trim()) {
      toast.error('Vui lòng nhập tên và biểu thức');
      return;
    }
    try {
      if (editingItem) {
        await formulasApi.update(editingItem.id, form);
        toast.success('Cập nhật thành công!');
      } else {
        await formulasApi.create(form);
        toast.success('Tạo mới thành công!');
      }
      onRefresh();
      resetForm();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa công thức này?')) return;
    try {
      await formulasApi.delete(id);
      toast.success('Đã xóa');
      onRefresh();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    }
  };

  const insertTag = (tag: string) => {
    setForm(prev => ({ ...prev, expression: prev.expression + tag }));
  };

  return (
    <>
      {/* Info Card */}
      <Card style={{ padding: 20, marginBottom: 24, background: 'rgba(245,211,147,0.05)', border: '1px solid rgba(245,211,147,0.2)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <i className="ri-information-line" style={{ color: tokens.color.primary, fontSize: 20 }} />
          <div>
            <h4 style={{ color: tokens.color.primary, margin: '0 0 8px' }}>Hướng dẫn viết công thức</h4>
            <p style={{ color: tokens.color.muted, margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              Sử dụng các TAG từ bảng đơn giá và biến <code style={{ background: tokens.color.surfaceHover, padding: '2px 6px', borderRadius: 4 }}>DIEN_TICH</code> (diện tích khách nhập).<br />
              Ví dụ: <code style={{ background: tokens.color.surfaceHover, padding: '2px 6px', borderRadius: 4 }}>DIEN_TICH * CONG_SON + DIEN_TICH * SON_LOT</code>
            </p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Button onClick={() => { resetForm(); setIsCreating(true); }}>
          <i className="ri-add-line" /> Thêm công thức
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
        {formulas.map(item => (
          <Card key={item.id} style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <h3 style={{ color: tokens.color.text, margin: 0, fontSize: 18 }}>{item.name}</h3>
              <span style={{
                padding: '4px 8px', borderRadius: 6,
                background: item.isActive ? tokens.color.successBg : tokens.color.errorBg,
                color: item.isActive ? tokens.color.success : tokens.color.error, fontSize: 12,
              }}>
                {item.isActive ? 'Hoạt động' : 'Tắt'}
              </span>
            </div>
            {item.description && <p style={{ color: tokens.color.muted, margin: '0 0 12px', fontSize: 14 }}>{item.description}</p>}
            <div style={{
              background: tokens.color.surfaceAlt, padding: 12, borderRadius: 8, marginBottom: 16,
              fontFamily: 'monospace', fontSize: 13, color: tokens.color.primary, overflowX: 'auto',
            }}>
              {item.expression}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" size="small" onClick={() => handleEdit(item)}><i className="ri-edit-line" /> Sửa</Button>
              <Button variant="outline" size="small" onClick={() => handleDelete(item.id)} style={{ color: tokens.color.error }}><i className="ri-delete-bin-line" /> Xóa</Button>
            </div>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm}
            style={{ position: 'fixed', inset: 0, background: tokens.color.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
              style={{ background: tokens.color.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
              <h2 style={{ color: tokens.color.text, margin: '0 0 24px' }}>{editingItem ? 'Sửa công thức' : 'Thêm công thức mới'}</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <Input label="Tên công thức" value={form.name} onChange={val => setForm({ ...form, name: val })} placeholder="VD: Công thức sơn cơ bản" />
                <div>
                  <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>Biểu thức</label>
                  <textarea
                    value={form.expression}
                    onChange={e => setForm({ ...form, expression: e.target.value })}
                    placeholder="VD: DIEN_TICH * CONG_SON"
                    style={{
                      width: '100%', padding: 12, borderRadius: 8, minHeight: 80, boxSizing: 'border-box',
                      background: tokens.color.surfaceHover, border: `1px solid ${tokens.color.border}`,
                      color: tokens.color.text, fontFamily: 'monospace', fontSize: 14, resize: 'vertical',
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>TAG có sẵn (click để thêm)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Button variant="outline" size="small" onClick={() => insertTag('DIEN_TICH')}>DIEN_TICH</Button>
                    {unitPrices.map(p => (
                      <Button key={p.id} variant="outline" size="small" onClick={() => insertTag(p.tag)}>{p.tag}</Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>Toán tử</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['+', '-', '*', '/', '(', ')'].map(op => (
                      <Button key={op} variant="outline" size="small" onClick={() => insertTag(` ${op} `)}>{op}</Button>
                    ))}
                  </div>
                </div>
                <Input label="Mô tả" value={form.description} onChange={val => setForm({ ...form, description: val })} placeholder="Mô tả công thức" />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                  <span style={{ color: tokens.color.text }}>Hoạt động</span>
                </label>
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={resetForm}>Hủy</Button>
                <Button onClick={handleSave}>{editingItem ? 'Cập nhật' : 'Tạo mới'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
