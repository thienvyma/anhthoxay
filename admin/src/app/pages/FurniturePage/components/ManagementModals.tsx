/**
 * ManagementModals - All modals for ManagementTab
 * Feature: furniture-quotation
 */

import { useRef } from 'react';
import { tokens } from '@app/shared';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { Input, TextArea } from '../../../components/Input';
import { Select } from '../../../components/Select';
import type {
  FurnitureDeveloper,
  FurnitureProject,
  FurnitureBuilding,
  FurnitureLayout,
  FurnitureApartmentType,
  CreateDeveloperInput,
  CreateProjectInput,
  CreateBuildingInput,
  CreateLayoutInput,
  CreateApartmentTypeInput,
} from '../types';

export type ModalType = 'developer' | 'project' | 'building' | 'layout' | 'apartmentType' | 'sync' | 'import' | null;

interface ManagementModalsProps {
  modalType: ModalType;
  onClose: () => void;
  loading: boolean;
  editingItem: FurnitureDeveloper | FurnitureProject | FurnitureBuilding | FurnitureLayout | FurnitureApartmentType | null;

  // Developer
  developerForm: CreateDeveloperInput & { imageUrl?: string };
  setDeveloperForm: React.Dispatch<React.SetStateAction<CreateDeveloperInput & { imageUrl?: string }>>;
  onSaveDeveloper: () => void;

  // Project
  projectForm: CreateProjectInput & { imageUrl?: string };
  setProjectForm: React.Dispatch<React.SetStateAction<CreateProjectInput & { imageUrl?: string }>>;
  onSaveProject: () => void;
  developers: FurnitureDeveloper[];

  // Building
  buildingForm: CreateBuildingInput & { imageUrl?: string };
  setBuildingForm: React.Dispatch<React.SetStateAction<CreateBuildingInput & { imageUrl?: string }>>;
  onSaveBuilding: () => void;
  projects: FurnitureProject[];

  // Layout
  layoutForm: CreateLayoutInput;
  setLayoutForm: React.Dispatch<React.SetStateAction<CreateLayoutInput>>;
  onSaveLayout: () => void;
  onDeleteLayout: (id: string) => void;

  // Apartment Type
  apartmentTypeForm: CreateApartmentTypeInput;
  setApartmentTypeForm: React.Dispatch<React.SetStateAction<CreateApartmentTypeInput>>;
  onSaveApartmentType: () => void;
  onApartmentTypeImageUpload: (file: File) => void;

  // Sync
  spreadsheetId: string;
  setSpreadsheetId: (val: string) => void;
  onSyncPull: () => void;
  onSyncPush: () => void;

  // Import
  importFiles: { duAn: File | null; layouts: File | null; apartmentTypes: File | null };
  setImportFiles: React.Dispatch<React.SetStateAction<{ duAn: File | null; layouts: File | null; apartmentTypes: File | null }>>;
  onImport: () => void;
}

// Image Upload Component
function ImageUpload({
  imageUrl,
  onClear,
  onUpload,
  label = 'Ảnh',
}: {
  imageUrl?: string;
  onClear: () => void;
  onUpload: (file: File) => void;
  label?: string;
}) {
  return (
    <div>
      <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block', fontWeight: 500 }}>
        {label}
      </label>
      {imageUrl ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={imageUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: 150,
              borderRadius: 8,
              border: `1px solid ${tokens.color.border}`,
            }}
          />
          <Button
            variant="danger"
            size="small"
            onClick={onClear}
            style={{ position: 'absolute', top: 8, right: 8 }}
          >
            <i className="ri-close-line" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) onUpload(file);
            };
            input.click();
          }}
          style={{
            border: `2px dashed ${tokens.color.border}`,
            borderRadius: 8,
            padding: 24,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = tokens.color.primary;
            e.currentTarget.style.background = `${tokens.color.primary}10`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = tokens.color.border;
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <i className="ri-image-add-line" style={{ fontSize: 24, color: tokens.color.muted, marginBottom: 4, display: 'block' }} />
          <span style={{ color: tokens.color.muted, fontSize: 13 }}>Click để tải ảnh lên</span>
        </div>
      )}
    </div>
  );
}

export function ManagementModals(props: ManagementModalsProps) {
  const {
    modalType,
    onClose,
    loading,
    editingItem,
    developerForm,
    setDeveloperForm,
    onSaveDeveloper,
    projectForm,
    setProjectForm,
    onSaveProject,
    developers,
    buildingForm,
    setBuildingForm,
    onSaveBuilding,
    projects,
    layoutForm,
    setLayoutForm,
    onSaveLayout,
    onDeleteLayout,
    apartmentTypeForm,
    setApartmentTypeForm,
    onSaveApartmentType,
    onApartmentTypeImageUpload,
    spreadsheetId,
    setSpreadsheetId,
    onSyncPull,
    onSyncPush,
    importFiles,
    setImportFiles,
    onImport,
  } = props;

  const duAnFileRef = useRef<HTMLInputElement>(null);
  const layoutsFileRef = useRef<HTMLInputElement>(null);
  const apartmentTypesFileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Developer Modal */}
      <ResponsiveModal
        isOpen={modalType === 'developer'}
        onClose={onClose}
        title={editingItem ? 'Sửa chủ đầu tư' : 'Thêm chủ đầu tư'}
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            <Button onClick={onSaveDeveloper} loading={loading}>{editingItem ? 'Cập nhật' : 'Tạo mới'}</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <Input
            label="Tên chủ đầu tư"
            value={developerForm.name}
            onChange={(val) => setDeveloperForm((prev) => ({ ...prev, name: val }))}
            placeholder="VD: Masterise Homes"
            required
          />
        </div>
      </ResponsiveModal>

      {/* Project Modal */}
      <ResponsiveModal
        isOpen={modalType === 'project'}
        onClose={onClose}
        title={editingItem ? 'Sửa dự án' : 'Thêm dự án'}
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            <Button onClick={onSaveProject} loading={loading}>{editingItem ? 'Cập nhật' : 'Tạo mới'}</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <Input
            label="Tên dự án"
            value={projectForm.name}
            onChange={(val) => setProjectForm((prev) => ({ ...prev, name: val }))}
            placeholder="VD: Lumiere Boulevard"
            required
          />
          <Input
            label="Mã dự án"
            value={projectForm.code}
            onChange={(val) => setProjectForm((prev) => ({ ...prev, code: val }))}
            placeholder="VD: LBV"
            required
          />
          {!editingItem && (
            <Select
              label="Chủ đầu tư"
              value={projectForm.developerId}
              onChange={(val) => setProjectForm((prev) => ({ ...prev, developerId: val }))}
              options={[
                { value: '', label: '-- Chọn chủ đầu tư --' },
                ...developers.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          )}
        </div>
      </ResponsiveModal>

      {/* Building Modal */}
      <ResponsiveModal
        isOpen={modalType === 'building'}
        onClose={onClose}
        title={editingItem ? 'Sửa tòa nhà' : 'Thêm tòa nhà'}
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            <Button onClick={onSaveBuilding} loading={loading}>{editingItem ? 'Cập nhật' : 'Tạo mới'}</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <Input
            label="Tên tòa nhà"
            value={buildingForm.name}
            onChange={(val) => setBuildingForm((prev) => ({ ...prev, name: val }))}
            placeholder="VD: Daisy 1"
            required
          />
          <Input
            label="Mã tòa nhà"
            value={buildingForm.code}
            onChange={(val) => setBuildingForm((prev) => ({ ...prev, code: val }))}
            placeholder="VD: LBV A"
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input
              label="Số tầng"
              type="number"
              value={buildingForm.maxFloor}
              onChange={(val) => setBuildingForm((prev) => ({ ...prev, maxFloor: parseInt(val) || 1 }))}
              required
            />
            <Input
              label="Số trục"
              type="number"
              value={buildingForm.maxAxis}
              onChange={(val) => setBuildingForm((prev) => ({ ...prev, maxAxis: parseInt(val) || 0 }))}
              required
            />
          </div>
          {!editingItem && (
            <Select
              label="Dự án"
              value={buildingForm.projectId}
              onChange={(val) => setBuildingForm((prev) => ({ ...prev, projectId: val }))}
              options={[
                { value: '', label: '-- Chọn dự án --' },
                ...projects.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
              ]}
            />
          )}
        </div>
      </ResponsiveModal>

      {/* Layout Modal */}
      <ResponsiveModal
        isOpen={modalType === 'layout'}
        onClose={onClose}
        title={editingItem ? 'Sửa layout' : 'Thêm layout'}
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            {editingItem && (
              <Button variant="danger" onClick={() => { onDeleteLayout(editingItem.id); onClose(); }}>Xóa</Button>
            )}
            <Button onClick={onSaveLayout} loading={loading}>{editingItem ? 'Cập nhật' : 'Tạo mới'}</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <Input
            label="Mã tòa nhà"
            value={layoutForm.buildingCode}
            onChange={(val) => setLayoutForm((prev) => ({ ...prev, buildingCode: val }))}
            placeholder="VD: LBV A"
            disabled={!!editingItem}
            required
          />
          <Input
            label="Trục"
            type="number"
            value={layoutForm.axis}
            onChange={(val) => setLayoutForm((prev) => ({ ...prev, axis: parseInt(val) || 0 }))}
            disabled={!!editingItem}
            required
          />
          <Input
            label="Loại căn hộ"
            value={layoutForm.apartmentType}
            onChange={(val) => setLayoutForm((prev) => ({ ...prev, apartmentType: val }))}
            placeholder="VD: 1pn, 2pn, 3pn"
            required
          />
        </div>
      </ResponsiveModal>

      {/* Apartment Type Modal */}
      <ResponsiveModal
        isOpen={modalType === 'apartmentType'}
        onClose={onClose}
        title={editingItem ? 'Sửa loại căn hộ' : 'Thêm loại căn hộ'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            <Button onClick={onSaveApartmentType} loading={loading}>{editingItem ? 'Cập nhật' : 'Tạo mới'}</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input
              label="Mã tòa nhà"
              value={apartmentTypeForm.buildingCode}
              onChange={(val) => setApartmentTypeForm((prev) => ({ ...prev, buildingCode: val }))}
              placeholder="VD: LBV A"
              disabled={!!editingItem}
              required
            />
            <Input
              label="Loại căn hộ"
              value={apartmentTypeForm.apartmentType}
              onChange={(val) => setApartmentTypeForm((prev) => ({ ...prev, apartmentType: val }))}
              placeholder="VD: 1pn, 2pn, 3pn"
              required
            />
          </div>
          <ImageUpload
            imageUrl={apartmentTypeForm.imageUrl}
            onClear={() => setApartmentTypeForm((prev) => ({ ...prev, imageUrl: '' }))}
            onUpload={onApartmentTypeImageUpload}
            label="Ảnh layout"
          />
          <TextArea
            label="Mô tả"
            value={apartmentTypeForm.description || ''}
            onChange={(val) => setApartmentTypeForm((prev) => ({ ...prev, description: val }))}
            placeholder="Mô tả chi tiết về loại căn hộ..."
            rows={3}
          />
        </div>
      </ResponsiveModal>

      {/* Sync Modal */}
      <ResponsiveModal
        isOpen={modalType === 'sync'}
        onClose={onClose}
        title="Đồng bộ Google Sheets"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            <Button variant="secondary" onClick={onSyncPull} loading={loading}>
              <i className="ri-download-2-line" /> Pull
            </Button>
            <Button onClick={onSyncPush} loading={loading}>
              <i className="ri-upload-2-line" /> Push
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <Input
            label="Spreadsheet ID"
            value={spreadsheetId}
            onChange={setSpreadsheetId}
            placeholder="VD: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            required
          />
          <div style={{ background: `${tokens.color.primary}10`, padding: 16, borderRadius: 8 }}>
            <p style={{ color: tokens.color.text, margin: 0, fontSize: 13 }}>
              <strong>Pull:</strong> Đọc từ Google Sheets → Database
            </p>
            <p style={{ color: tokens.color.text, margin: '8px 0 0', fontSize: 13 }}>
              <strong>Push:</strong> Đẩy từ Database → Google Sheets
            </p>
          </div>
        </div>
      </ResponsiveModal>

      {/* Import Modal */}
      <ResponsiveModal
        isOpen={modalType === 'import'}
        onClose={onClose}
        title="Import dữ liệu từ CSV"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            <Button onClick={onImport} loading={loading} disabled={!importFiles.duAn || !importFiles.layouts || !importFiles.apartmentTypes}>
              <i className="ri-upload-2-line" /> Import
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {/* DuAn.csv */}
          <div>
            <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block', fontWeight: 500 }}>
              DuAn.csv <span style={{ color: tokens.color.error }}>*</span>
            </label>
            <input ref={duAnFileRef} type="file" accept=".csv" onChange={(e) => setImportFiles((prev) => ({ ...prev, duAn: e.target.files?.[0] || null }))} style={{ display: 'none' }} />
            <Button variant={importFiles.duAn ? 'secondary' : 'outline'} onClick={() => duAnFileRef.current?.click()} fullWidth>
              {importFiles.duAn ? <><i className="ri-check-line" /> {importFiles.duAn.name}</> : <><i className="ri-file-add-line" /> Chọn file DuAn.csv</>}
            </Button>
          </div>

          {/* LayoutIDs.csv */}
          <div>
            <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block', fontWeight: 500 }}>
              LayoutIDs.csv <span style={{ color: tokens.color.error }}>*</span>
            </label>
            <input ref={layoutsFileRef} type="file" accept=".csv" onChange={(e) => setImportFiles((prev) => ({ ...prev, layouts: e.target.files?.[0] || null }))} style={{ display: 'none' }} />
            <Button variant={importFiles.layouts ? 'secondary' : 'outline'} onClick={() => layoutsFileRef.current?.click()} fullWidth>
              {importFiles.layouts ? <><i className="ri-check-line" /> {importFiles.layouts.name}</> : <><i className="ri-file-add-line" /> Chọn file LayoutIDs.csv</>}
            </Button>
          </div>

          {/* ApartmentType.csv */}
          <div>
            <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block', fontWeight: 500 }}>
              ApartmentType.csv <span style={{ color: tokens.color.error }}>*</span>
            </label>
            <input ref={apartmentTypesFileRef} type="file" accept=".csv" onChange={(e) => setImportFiles((prev) => ({ ...prev, apartmentTypes: e.target.files?.[0] || null }))} style={{ display: 'none' }} />
            <Button variant={importFiles.apartmentTypes ? 'secondary' : 'outline'} onClick={() => apartmentTypesFileRef.current?.click()} fullWidth>
              {importFiles.apartmentTypes ? <><i className="ri-check-line" /> {importFiles.apartmentTypes.name}</> : <><i className="ri-file-add-line" /> Chọn file ApartmentType.csv</>}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}

export default ManagementModals;
