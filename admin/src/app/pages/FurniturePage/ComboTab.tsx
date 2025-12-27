/**
 * ComboTab - Furniture Combo Management
 *
 * Feature: furniture-quotation
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useState, useCallback, useRef } from 'react';
import { tokens } from '@app/shared';
import { ResponsiveModal } from '../../../components/responsive';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { furnitureCombosApi } from '../../api/furniture';
import { mediaApi } from '../../api/content';
import { ComboTable, ComboForm } from './components';
import type {
  ComboTabProps,
  FurnitureCombo,
  CreateComboInput,
  UpdateComboInput,
  ComboItemInput,
} from './types';

// ========== MODAL TYPES ==========
type ModalType = 'combo' | 'deleteCombo' | null;

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

  // ========== RENDER ==========
  return (
    <div style={{ padding: 24 }}>
      {/* Combo Table with Header */}
      <ComboTable
        combos={combos}
        loading={loading}
        onAddCombo={() => openComboModal()}
        onEditCombo={openComboModal}
        onDeleteCombo={openDeleteComboModal}
        onDuplicateCombo={handleDuplicateCombo}
        onToggleStatus={handleToggleStatus}
        onRefresh={onRefresh}
      />

      {/* Combo Form Modal */}
      <ComboForm
        isOpen={modalType === 'combo'}
        editingCombo={editingCombo}
        formData={comboForm}
        products={products}
        loading={loading}
        uploadingImage={uploadingImage}
        onClose={closeModal}
        onSave={handleSaveCombo}
        onFormChange={setComboForm}
        onImageUpload={handleImageUpload}
        onToggleApartmentType={handleToggleApartmentType}
        onToggleProduct={handleToggleProduct}
        onUpdateQuantity={handleUpdateQuantity}
      />

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
