import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { useToast } from '../../components/Toast';
import { unitPricesApi } from '../../api';
import type { UnitPricesTabProps, UnitPrice } from './types';
import { UNIT_PRICE_CATEGORIES } from './types';

export function UnitPricesTab({ unitPrices, onRefresh }: UnitPricesTabProps) {
  const toast = useToast();
  const [editingItem, setEditingItem] = useState<UnitPrice | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [form, setForm] = useState({
    category: 'Nhân công',
    name: '',
    price: 0,
    tag: '',
    unit: 'm²',
    description: '',
    isActive: true,
  });

  const resetForm = () => {
    setForm({ category: 'Nhân công', name: '', price: 0, tag: '', unit: 'm²', description: '', isActive: true });
    setEditingItem(null);
    setIsCreating(false);
  };

  const handleEdit = (item: UnitPrice) => {
    setEditingItem(item);
    setForm({
      category: item.category,
      name: item.name,
      price: item.price,
      tag: item.tag,
      unit: item.unit,
      description: item.description || '',
      isActive: item.isActive,
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.tag.trim()) {
      toast.error('Vui lòng nhập tên và TAG');
      return;
    }
    try {
      if (editingItem) {
        await unitPricesApi.update(editingItem.id, form);
        toast.success('Cập nhật thành công!');
      } else {
        await unitPricesApi.create(form);
        toast.success('Tạo mới thành công!');
      }
      onRefresh();
      resetForm();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa đơn giá này?')) return;
    try {
      await unitPricesApi.delete(id);
      toast.success('Đã xóa');
      onRefresh();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  const filteredItems = filterCategory === 'ALL' ? unitPrices : unitPrices.filter(p => p.category === filterCategory);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['ALL', ...UNIT_PRICE_CATEGORIES].map(cat => (
          <Button key={cat} variant={filterCategory === cat ? 'primary' : 'outline'} size="small" onClick={() => setFilterCategory(cat)}>
            {cat === 'ALL' ? 'Tất cả' : cat}
          </Button>
        ))}
        <Button onClick={() => { resetForm(); setIsCreating(true); }}><i className="ri-add-line" /> Thêm đơn giá</Button>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                <th style={{ padding: 16, textAlign: 'left', color: tokens.color.muted }}>Tên</th>
                <th style={{ padding: 16, textAlign: 'left', color: tokens.color.muted }}>Loại</th>
                <th style={{ padding: 16, textAlign: 'left', color: tokens.color.muted }}>TAG</th>
                <th style={{ padding: 16, textAlign: 'right', color: tokens.color.muted }}>Đơn giá</th>
                <th style={{ padding: 16, textAlign: 'center', color: tokens.color.muted }}>Đơn vị</th>
                <th style={{ padding: 16, textAlign: 'center', color: tokens.color.muted }}>Trạng thái</th>
                <th style={{ padding: 16, textAlign: 'right', color: tokens.color.muted }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                  <td style={{ padding: 16 }}>
                    <div style={{ color: tokens.color.text, fontWeight: 500 }}>{item.name}</div>
                    {item.description && <div style={{ color: tokens.color.muted, fontSize: 12 }}>{item.description}</div>}
                  </td>
                  <td style={{ padding: 16 }}>
                    <span style={{ padding: '4px 8px', borderRadius: 6, background: tokens.color.surfaceHover, color: tokens.color.muted, fontSize: 12 }}>{item.category}</span>
                  </td>
                  <td style={{ padding: 16 }}>
                    <code style={{ background: 'rgba(245,211,147,0.1)', color: tokens.color.primary, padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{item.tag}</code>
                  </td>
                  <td style={{ padding: 16, textAlign: 'right', color: tokens.color.primary, fontWeight: 600 }}>{formatPrice(item.price)}</td>
                  <td style={{ padding: 16, textAlign: 'center', color: tokens.color.muted }}>{item.unit}</td>
                  <td style={{ padding: 16, textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: 12,
                      background: item.isActive ? tokens.color.successBg : tokens.color.errorBg,
                      color: item.isActive ? tokens.color.success : tokens.color.error, fontSize: 12,
                    }}>{item.isActive ? 'Hoạt động' : 'Tắt'}</span>
                  </td>
                  <td style={{ padding: 16, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Button variant="outline" size="small" onClick={() => handleEdit(item)}><i className="ri-edit-line" /></Button>
                      <Button variant="outline" size="small" onClick={() => handleDelete(item.id)} style={{ color: tokens.color.error }}><i className="ri-delete-bin-line" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm}
            style={{ position: 'fixed', inset: 0, background: tokens.color.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
              style={{ background: tokens.color.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 500 }}>
              <h2 style={{ color: tokens.color.text, margin: '0 0 24px' }}>{editingItem ? 'Sửa đơn giá' : 'Thêm đơn giá mới'}</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <Input label="Tên" value={form.name} onChange={val => setForm({ ...form, name: val })} placeholder="VD: Công sơn" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Select label="Loại" value={form.category} onChange={val => setForm({ ...form, category: val })} options={UNIT_PRICE_CATEGORIES} />
                  <Input label="TAG (dùng trong công thức)" value={form.tag} onChange={val => setForm({ ...form, tag: val.toUpperCase() })} placeholder="VD: CONG_SON" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                  <Input label="Đơn giá (VNĐ)" type="number" value={form.price} onChange={val => setForm({ ...form, price: parseInt(val) || 0 })} />
                  <Input label="Đơn vị" value={form.unit} onChange={val => setForm({ ...form, unit: val })} placeholder="m², kg, công" />
                </div>
                <Input label="Mô tả" value={form.description} onChange={val => setForm({ ...form, description: val })} />
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
