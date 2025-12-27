/**
 * ComboTab - Furniture Combo Management
 *
 * Feature: furniture-quotation
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { ResponsiveModal, ResponsiveTable, TableColumn } from '../../../components/responsive';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, TextArea } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { furnitureCombosApi } from '../../api/furniture';
import { mediaApi } from '../../api/content';
import type {
  ComboTabProps,
  FurnitureCombo,
  CreateComboInput,
  UpdateComboInput,
  ComboItemInput,
} from './types';

// ========== MODAL TYPES ==========
type ModalType = 'combo' | 'deleteCombo' | null;

// ========== APARTMENT TYPE OPTIONS ==========
const APARTMENT_TYPE_OPTIONS = [
  { value: '1pn', label: '1 Phòng ngủ' },
  { value: '2pn', label: '2 Phòng ngủ' },
  { value: '3pn', label: '3 Phòng ngủ' },
  { value: '1pn+', label: '1 Phòng ngủ+' },
  { value: 'penhouse', label: 'Penhouse' },
  { value: 'shophouse', label: 'Shophouse' },
];

// ========== COMPONENT ==========
export function ComboTab({ combos, products, onRefresh }: ComboTabProps) {
  const toast = useToast();

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingCombo, setEditingCombo] = useState<FurnitureCombo | null>(null);
  const [deletingComboId, setDeletingComboId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Form state
  const [comboForm, setComboForm] = useState<CreateComboInput>({
    name: '',
    apartmentTypes: [],
    price: 0,
    imageUrl: '',
    description: '',
    isActive: true,
    items: [],
  });

  // Image upload ref
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ========== HELPERS ==========
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const parseApartmentTypes = (apartmentTypesJson: string): string[] => {
    try {
      return JSON.parse(apartmentTypesJson);
    } catch {
      return [];
    }
  };

  // ========== MODAL HANDLERS ==========
  const openComboModal = useCallback(
    (combo?: FurnitureCombo) => {
      setModalType('combo');
      setEditingCombo(combo || null);

      if (combo) {
        const apartmentTypes = parseApartmentTypes(combo.apartmentTypes);
        const items: ComboItemInput[] =
          combo.items?.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })) || [];

        setComboForm({
          name: combo.name,
          apartmentTypes,
          price: combo.price,
          imageUrl: combo.imageUrl || '',
          description: combo.description || '',
          isActive: combo.isActive,
          items,
        });
      } else {
        setComboForm({
          name: '',
          apartmentTypes: [],
          price: 0,
          imageUrl: '',
          description: '',
          isActive: true,
          items: [],
        });
      }
    },
    []
  );

  const openDeleteComboModal = useCallback((comboId: string) => {
    setDeletingComboId(comboId);
    setModalType('deleteCombo');
  }, []);

  const closeModal = useCallback(() => {
    setModalType(null);
    setEditingCombo(null);
    setDeletingComboId('');
  }, []);

  // ========== COMBO CRUD HANDLERS ==========
  const handleSaveCombo = async () => {
    if (!comboForm.name.trim()) {
      toast.error('Vui lòng nhập tên combo');
      return;
    }
    if (comboForm.apartmentTypes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một loại căn hộ');
      return;
    }
    if (comboForm.price <= 0) {
      toast.error('Giá combo phải lớn hơn 0');
      return;
    }

    setLoading(true);
    try {
      if (editingCombo) {
        await furnitureCombosApi.update(editingCombo.id, comboForm as UpdateComboInput);
        toast.success('Cập nhật combo thành công');
      } else {
        await furnitureCombosApi.create(comboForm);
        toast.success('Thêm combo thành công');
      }
      onRefresh();
      closeModal();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCombo = async () => {
    if (!deletingComboId) return;
    setLoading(true);
    try {
      await furnitureCombosApi.delete(deletingComboId);
      toast.success('Đã xóa combo');
      onRefresh();
      closeModal();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateCombo = async (comboId: string) => {
    setLoading(true);
    try {
      await furnitureCombosApi.duplicate(comboId);
      toast.success('Đã nhân bản combo');
      onRefresh();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (combo: FurnitureCombo) => {
    setLoading(true);
    try {
      await furnitureCombosApi.update(combo.id, { isActive: !combo.isActive });
      toast.success(combo.isActive ? 'Đã ẩn combo' : 'Đã hiển thị combo');
      onRefresh();
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ========== IMAGE UPLOAD HANDLER ==========
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await mediaApi.uploadFile(file);
      setComboForm((prev) => ({ ...prev, imageUrl: result.url }));
      toast.success('Tải ảnh lên thành công');
    } catch (error) {
      toast.error('Lỗi tải ảnh: ' + (error as Error).message);
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // ========== APARTMENT TYPE HANDLERS ==========
  const handleToggleApartmentType = (type: string) => {
    setComboForm((prev) => {
      const types = prev.apartmentTypes || [];
      if (types.includes(type)) {
        return { ...prev, apartmentTypes: types.filter((t) => t !== type) };
      }
      return { ...prev, apartmentTypes: [...types, type] };
    });
  };

  // ========== PRODUCT SELECTION HANDLERS ==========
  const handleToggleProduct = (productId: string) => {
    setComboForm((prev) => {
      const items = prev.items || [];
      const existingIndex = items.findIndex((item) => item.productId === productId);
      if (existingIndex >= 0) {
        return { ...prev, items: items.filter((item) => item.productId !== productId) };
      }
      return { ...prev, items: [...items, { productId, quantity: 1 }] };
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setComboForm((prev) => {
      const items = prev.items || [];
      return {
        ...prev,
        items: items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        ),
      };
    });
  };

  const isProductSelected = (productId: string) => {
    return (comboForm.items || []).some((item) => item.productId === productId);
  };

  const getProductQuantity = (productId: string) => {
    const item = (comboForm.items || []).find((item) => item.productId === productId);
    return item?.quantity || 1;
  };

  // ========== TABLE COLUMNS ==========
  const columns: TableColumn<FurnitureCombo>[] = useMemo(
    () => [
      {
        key: 'name' as keyof FurnitureCombo,
        header: 'Tên Combo',
        priority: 1,
        render: (_, row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: row.imageUrl
                  ? `url(${row.imageUrl}) center/cover`
                  : `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {!row.imageUrl && (
                <i className="ri-gift-line" style={{ fontSize: 20, color: '#0b0c0f' }} />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: tokens.color.text }}>{row.name}</div>
              {row.description && (
                <div
                  style={{
                    fontSize: 12,
                    color: tokens.color.muted,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.description}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'apartmentTypes' as keyof FurnitureCombo,
        header: 'Loại căn hộ',
        priority: 2,
        hideOnMobile: true,
        render: (value) => {
          const types = parseApartmentTypes(value as string);
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {types.map((type) => (
                <span
                  key={type}
                  style={{
                    background: `${tokens.color.primary}20`,
                    color: tokens.color.primary,
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  {type.toUpperCase()}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        key: 'price' as keyof FurnitureCombo,
        header: 'Giá',
        priority: 3,
        align: 'right',
        render: (value) => (
          <span style={{ fontWeight: 600, color: tokens.color.primary }}>
            {formatPrice(value as number)}
          </span>
        ),
      },
      {
        key: 'isActive' as keyof FurnitureCombo,
        header: 'Trạng thái',
        priority: 4,
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
            <i className={value ? 'ri-eye-line' : 'ri-eye-off-line'} />
            {value ? 'Hiển thị' : 'Đã ẩn'}
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
          Quản lý Combo Nội thất
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button onClick={onRefresh} disabled={loading} variant="outline">
            <i className="ri-refresh-line" /> Làm mới
          </Button>
          <Button onClick={() => openComboModal()} disabled={loading}>
            <i className="ri-add-line" /> Thêm Combo
          </Button>
        </div>
      </div>

      {/* Combo Table */}
      <Card>
        <ResponsiveTable
          data={combos}
          columns={columns}
          loading={loading}
          emptyMessage="Chưa có combo nào. Nhấn 'Thêm Combo' để tạo mới."
          getRowKey={(row) => row.id}
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="ghost"
                size="small"
                onClick={() => handleDuplicateCombo(row.id)}
                disabled={loading}
              >
                <i className="ri-file-copy-line" />
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => openComboModal(row)}
                disabled={loading}
              >
                <i className="ri-edit-line" />
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => openDeleteComboModal(row.id)}
                disabled={loading}
                style={{ color: tokens.color.error }}
              >
                <i className="ri-delete-bin-line" />
              </Button>
            </div>
          )}
        />
      </Card>


      {/* Combo Form Modal */}
      <ResponsiveModal
        isOpen={modalType === 'combo'}
        onClose={closeModal}
        title={editingCombo ? 'Sửa Combo' : 'Thêm Combo'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleSaveCombo} loading={loading}>
              {editingCombo ? 'Cập nhật' : 'Thêm'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Basic Info */}
          <Input
            label="Tên Combo"
            value={comboForm.name}
            onChange={(val) => setComboForm((prev) => ({ ...prev, name: val }))}
            placeholder="VD: Combo Phòng khách Hiện đại"
            required
            fullWidth
          />

          {/* Apartment Types Multi-select */}
          <div>
            <label
              style={{
                display: 'block',
                color: tokens.color.text,
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Loại căn hộ áp dụng <span style={{ color: tokens.color.error }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {APARTMENT_TYPE_OPTIONS.map((option) => {
                const isSelected = (comboForm.apartmentTypes || []).includes(option.value);
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleToggleApartmentType(option.value)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: `2px solid ${isSelected ? tokens.color.primary : tokens.color.border}`,
                      background: isSelected
                        ? `linear-gradient(135deg, ${tokens.color.primary}20, ${tokens.color.accent}10)`
                        : 'transparent',
                      color: isSelected ? tokens.color.primary : tokens.color.text,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.2s',
                    }}
                  >
                    {isSelected && <i className="ri-check-line" style={{ marginRight: 4 }} />}
                    {option.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Price */}
          <Input
            label="Giá Combo (VNĐ)"
            type="number"
            value={comboForm.price}
            onChange={(val) => setComboForm((prev) => ({ ...prev, price: parseFloat(val) || 0 }))}
            placeholder="0"
            required
            fullWidth
          />

          {/* Image upload */}
          <div>
            <label
              style={{
                display: 'block',
                color: tokens.color.text,
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Hình ảnh
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 12,
                  border: `1px dashed ${tokens.color.border}`,
                  background: comboForm.imageUrl
                    ? `url(${comboForm.imageUrl}) center/cover`
                    : tokens.color.surfaceHover,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {!comboForm.imageUrl && (
                  <i className="ri-image-add-line" style={{ fontSize: 32, color: tokens.color.muted }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => imageInputRef.current?.click()}
                  loading={uploadingImage}
                  style={{ marginBottom: 8 }}
                >
                  <i className="ri-upload-2-line" /> Tải ảnh lên
                </Button>
                {comboForm.imageUrl && (
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setComboForm((prev) => ({ ...prev, imageUrl: '' }))}
                    style={{ color: tokens.color.error, marginLeft: 8 }}
                  >
                    <i className="ri-delete-bin-line" /> Xóa
                  </Button>
                )}
                <p style={{ fontSize: 12, color: tokens.color.muted, margin: '8px 0 0' }}>
                  Hỗ trợ: JPG, PNG, WebP. Tối đa 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <TextArea
            label="Mô tả"
            value={comboForm.description || ''}
            onChange={(val) => setComboForm((prev) => ({ ...prev, description: val }))}
            placeholder="Mô tả chi tiết về combo..."
            rows={3}
            fullWidth
          />

          {/* Product Selection */}
          <div>
            <label
              style={{
                display: 'block',
                color: tokens.color.text,
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 12,
              }}
            >
              Sản phẩm trong Combo ({(comboForm.items || []).length} sản phẩm)
            </label>
            <div
              style={{
                maxHeight: 300,
                overflowY: 'auto',
                border: `1px solid ${tokens.color.border}`,
                borderRadius: 12,
                padding: 12,
              }}
            >
              {products.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {products.map((product) => {
                    const selected = isProductSelected(product.id);
                    const quantity = getProductQuantity(product.id);
                    return (
                      <motion.div
                        key={product.id}
                        whileHover={{ scale: 1.01 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: 12,
                          borderRadius: 10,
                          background: selected
                            ? `linear-gradient(135deg, ${tokens.color.primary}10, ${tokens.color.accent}05)`
                            : tokens.color.surfaceHover,
                          border: `1px solid ${selected ? tokens.color.primary : 'transparent'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => handleToggleProduct(product.id)}
                      >
                        {/* Checkbox */}
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: `2px solid ${selected ? tokens.color.primary : tokens.color.border}`,
                            background: selected ? tokens.color.primary : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {selected && (
                            <i className="ri-check-line" style={{ fontSize: 14, color: '#0b0c0f' }} />
                          )}
                        </div>

                        {/* Product Image */}
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: product.imageUrl
                              ? `url(${product.imageUrl}) center/cover`
                              : tokens.color.surface,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {!product.imageUrl && (
                            <i className="ri-image-line" style={{ fontSize: 16, color: tokens.color.muted }} />
                          )}
                        </div>

                        {/* Product Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 500,
                              color: tokens.color.text,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {product.name}
                          </div>
                          <div style={{ fontSize: 12, color: tokens.color.primary, fontWeight: 600 }}>
                            {formatPrice(product.price)}
                          </div>
                        </div>

                        {/* Quantity Input */}
                        {selected && (
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span style={{ fontSize: 12, color: tokens.color.muted }}>SL:</span>
                            <input
                              type="number"
                              min={1}
                              value={quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(product.id, parseInt(e.target.value) || 1)
                              }
                              style={{
                                width: 60,
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: `1px solid ${tokens.color.border}`,
                                background: tokens.color.surface,
                                color: tokens.color.text,
                                fontSize: 13,
                                textAlign: 'center',
                              }}
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 32,
                    color: tokens.color.muted,
                  }}
                >
                  <i className="ri-shopping-bag-line" style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
                  Chưa có sản phẩm nào. Vui lòng thêm sản phẩm trong tab Catalog.
                </div>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              id="combo-active"
              checked={comboForm.isActive}
              onChange={(e) => setComboForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="combo-active" style={{ color: tokens.color.text, cursor: 'pointer' }}>
              Hiển thị combo cho khách hàng
            </label>
          </div>
        </div>
      </ResponsiveModal>

      {/* Delete Combo Confirmation Modal */}
      <ResponsiveModal
        isOpen={modalType === 'deleteCombo'}
        onClose={closeModal}
        title="Xác nhận xóa Combo"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteCombo} loading={loading}>
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
            Bạn có chắc muốn xóa combo này?
          </p>
          <p style={{ color: tokens.color.muted, fontSize: 13 }}>
            Hành động này không thể hoàn tác.
          </p>
        </div>
      </ResponsiveModal>
    </div>
  );
}

export default ComboTab;
