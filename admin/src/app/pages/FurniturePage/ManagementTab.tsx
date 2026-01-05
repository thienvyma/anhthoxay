/**
 * ManagementTab - Furniture Project Data Management
 * Feature: furniture-quotation
 * Refactored: 3-column layout with EntityColumn components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { tokens } from '../../../theme';
import { ResponsiveActionBar } from '../../../components/responsive';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import {
  furnitureDevelopersApi,
  furnitureProjectsApi,
  furnitureBuildingsApi,
  furnitureLayoutsApi,
  furnitureApartmentTypesApi,
  furnitureDataApi,
} from '../../api/furniture';
import { mediaApi } from '../../api/content';
import {
  EntityColumn,
  MetricsGrid,
  ApartmentTypeCards,
  BuildingInfoCard,
  ManagementModals,
} from './components';
import type { ModalType } from './components/ManagementModals';
import type {
  ManagementTabProps,
  FurnitureDeveloper,
  FurnitureProject,
  FurnitureBuilding,
  FurnitureLayout,
  FurnitureApartmentType,
  MetricsGridCell,
  CreateDeveloperInput,
  CreateProjectInput,
  CreateBuildingInput,
  CreateLayoutInput,
  CreateApartmentTypeInput,
  UpdateDeveloperInput,
  UpdateLayoutInput,
  UpdateApartmentTypeInput,
} from './types';

export function ManagementTab({
  developers,
  projects,
  buildings,
  layouts,
  apartmentTypes,
  onRefresh,
}: ManagementTabProps) {
  const toast = useToast();

  // Selection state
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');

  // Local data state
  const [localLayouts, setLocalLayouts] = useState<FurnitureLayout[]>(layouts);
  const [localApartmentTypes, setLocalApartmentTypes] = useState<FurnitureApartmentType[]>(apartmentTypes);

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<
    FurnitureDeveloper | FurnitureProject | FurnitureBuilding | FurnitureLayout | FurnitureApartmentType | null
  >(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [developerForm, setDeveloperForm] = useState<CreateDeveloperInput & { imageUrl?: string }>({ name: '', imageUrl: '' });
  const [projectForm, setProjectForm] = useState<CreateProjectInput & { imageUrl?: string }>({ name: '', code: '', developerId: '', imageUrl: '' });
  const [buildingForm, setBuildingForm] = useState<CreateBuildingInput & { imageUrl?: string }>({ name: '', code: '', projectId: '', maxFloor: 1, maxAxis: 0, imageUrl: '' });
  const [layoutForm, setLayoutForm] = useState<CreateLayoutInput>({ buildingCode: '', axis: 0, apartmentType: '' });
  const [apartmentTypeForm, setApartmentTypeForm] = useState<CreateApartmentTypeInput>({ buildingCode: '', apartmentType: '', imageUrl: '', description: '' });

  // Sync/Import state
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [importFiles, setImportFiles] = useState<{ duAn: File | null; layouts: File | null; apartmentTypes: File | null }>({ duAn: null, layouts: null, apartmentTypes: null });

  // Computed values
  const filteredProjects = useMemo(
    () => (selectedDeveloperId ? projects.filter((p) => p.developerId === selectedDeveloperId) : []),
    [projects, selectedDeveloperId]
  );

  const filteredBuildings = useMemo(
    () => (selectedProjectId ? buildings.filter((b) => b.projectId === selectedProjectId) : []),
    [buildings, selectedProjectId]
  );

  const selectedDeveloper = useMemo(
    () => developers.find((d) => d.id === selectedDeveloperId),
    [developers, selectedDeveloperId]
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const selectedBuilding = useMemo(
    () => buildings.find((b) => b.id === selectedBuildingId),
    [buildings, selectedBuildingId]
  );

  // Child counts for display
  const developerChildCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    developers.forEach((d) => {
      counts[d.id] = projects.filter((p) => p.developerId === d.id).length;
    });
    return counts;
  }, [developers, projects]);

  const projectChildCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.id] = buildings.filter((b) => b.projectId === p.id).length;
    });
    return counts;
  }, [projects, buildings]);

  // Fetch building data when selected
  useEffect(() => {
    if (selectedBuilding) {
      const fetchBuildingData = async () => {
        try {
          const [layoutsData, apartmentTypesData] = await Promise.all([
            furnitureLayoutsApi.list(selectedBuilding.code),
            furnitureApartmentTypesApi.list(selectedBuilding.code),
          ]);
          setLocalLayouts(layoutsData);
          setLocalApartmentTypes(apartmentTypesData);
        } catch (error) {
          console.error('Failed to fetch building data:', error);
          toast.error('Không thể tải dữ liệu tòa nhà');
        }
      };
      fetchBuildingData();
    } else {
      setLocalLayouts([]);
      setLocalApartmentTypes([]);
    }
  }, [selectedBuilding, toast]);

  // Reset selections when parent changes
  useEffect(() => {
    if (selectedDeveloperId && !developers.find((d) => d.id === selectedDeveloperId)) {
      setSelectedDeveloperId('');
    }
  }, [developers, selectedDeveloperId]);

  useEffect(() => {
    if (selectedProjectId && !filteredProjects.find((p) => p.id === selectedProjectId)) {
      setSelectedProjectId('');
      setSelectedBuildingId('');
    }
  }, [filteredProjects, selectedProjectId]);

  useEffect(() => {
    if (selectedBuildingId && !filteredBuildings.find((b) => b.id === selectedBuildingId)) {
      setSelectedBuildingId('');
    }
  }, [filteredBuildings, selectedBuildingId]);

  // Clear child selections when parent changes
  const handleSelectDeveloper = useCallback((id: string) => {
    setSelectedDeveloperId(id);
    setSelectedProjectId('');
    setSelectedBuildingId('');
  }, []);

  const handleSelectProject = useCallback((id: string) => {
    setSelectedProjectId(id);
    setSelectedBuildingId('');
  }, []);

  // Modal handlers
  const openModal = useCallback(
    (type: ModalType, item?: FurnitureDeveloper | FurnitureProject | FurnitureBuilding | FurnitureLayout | FurnitureApartmentType) => {
      setModalType(type);
      setEditingItem(item || null);

      if (type === 'developer') {
        const dev = item as FurnitureDeveloper;
        setDeveloperForm({ name: dev?.name || '', imageUrl: dev?.imageUrl || '' });
      } else if (type === 'project') {
        const project = item as FurnitureProject;
        setProjectForm({ name: project?.name || '', code: project?.code || '', developerId: project?.developerId || selectedDeveloperId || '', imageUrl: project?.imageUrl || '' });
      } else if (type === 'building') {
        const building = item as FurnitureBuilding;
        setBuildingForm({ name: building?.name || '', code: building?.code || '', projectId: building?.projectId || selectedProjectId || '', maxFloor: building?.maxFloor || 1, maxAxis: building?.maxAxis || 0, imageUrl: building?.imageUrl || '' });
      } else if (type === 'layout') {
        const layout = item as FurnitureLayout;
        setLayoutForm({ buildingCode: layout?.buildingCode || selectedBuilding?.code || '', axis: layout?.axis || 0, apartmentType: layout?.apartmentType || '' });
      } else if (type === 'apartmentType') {
        const apt = item as FurnitureApartmentType;
        setApartmentTypeForm({ buildingCode: apt?.buildingCode || selectedBuilding?.code || '', apartmentType: apt?.apartmentType || '', imageUrl: apt?.imageUrl || '', description: apt?.description || '' });
      }
    },
    [selectedDeveloperId, selectedProjectId, selectedBuilding]
  );

  const closeModal = useCallback(() => {
    setModalType(null);
    setEditingItem(null);
    setImportFiles({ duAn: null, layouts: null, apartmentTypes: null });
  }, []);

  // CRUD handlers
  const handleSaveDeveloper = async () => {
    if (!developerForm.name.trim()) { toast.error('Vui lòng nhập tên chủ đầu tư'); return; }
    setLoading(true);
    try {
      const data = { name: developerForm.name, imageUrl: developerForm.imageUrl || undefined };
      if (editingItem) {
        await furnitureDevelopersApi.update(editingItem.id, data as UpdateDeveloperInput);
        toast.success('Cập nhật chủ đầu tư thành công');
      } else {
        await furnitureDevelopersApi.create(data);
        toast.success('Thêm chủ đầu tư thành công');
      }
      onRefresh();
      closeModal();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
    finally { setLoading(false); }
  };

  const handleDeleteDeveloper = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa chủ đầu tư này?')) return;
    try {
      await furnitureDevelopersApi.delete(id);
      toast.success('Đã xóa chủ đầu tư');
      if (selectedDeveloperId === id) setSelectedDeveloperId('');
      onRefresh();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
  };

  const handleSaveProject = async () => {
    if (!projectForm.name.trim() || !projectForm.code.trim() || !projectForm.developerId) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    setLoading(true);
    try {
      if (editingItem) {
        await furnitureProjectsApi.update(editingItem.id, { name: projectForm.name, code: projectForm.code, imageUrl: projectForm.imageUrl || undefined });
        toast.success('Cập nhật dự án thành công');
      } else {
        await furnitureProjectsApi.create({ name: projectForm.name, code: projectForm.code, developerId: projectForm.developerId, imageUrl: projectForm.imageUrl || undefined });
        toast.success('Thêm dự án thành công');
      }
      onRefresh();
      closeModal();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
    finally { setLoading(false); }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa dự án này?')) return;
    try {
      await furnitureProjectsApi.delete(id);
      toast.success('Đã xóa dự án');
      if (selectedProjectId === id) setSelectedProjectId('');
      onRefresh();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
  };

  const handleSaveBuilding = async () => {
    if (!buildingForm.name.trim() || !buildingForm.code.trim() || !buildingForm.projectId) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    if (buildingForm.maxFloor < 1) { toast.error('Số tầng phải lớn hơn 0'); return; }
    setLoading(true);
    try {
      if (editingItem) {
        await furnitureBuildingsApi.update(editingItem.id, { name: buildingForm.name, code: buildingForm.code, maxFloor: buildingForm.maxFloor, maxAxis: buildingForm.maxAxis, imageUrl: buildingForm.imageUrl || undefined });
        toast.success('Cập nhật tòa nhà thành công');
      } else {
        await furnitureBuildingsApi.create({ name: buildingForm.name, code: buildingForm.code, projectId: buildingForm.projectId, maxFloor: buildingForm.maxFloor, maxAxis: buildingForm.maxAxis, imageUrl: buildingForm.imageUrl || undefined });
        toast.success('Thêm tòa nhà thành công');
      }
      onRefresh();
      closeModal();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
    finally { setLoading(false); }
  };

  const handleDeleteBuilding = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tòa nhà này?')) return;
    try {
      await furnitureBuildingsApi.delete(id);
      toast.success('Đã xóa tòa nhà');
      if (selectedBuildingId === id) setSelectedBuildingId('');
      onRefresh();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
  };

  const handleSaveLayout = async () => {
    if (!layoutForm.buildingCode.trim() || !layoutForm.apartmentType.trim()) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    setLoading(true);
    try {
      if (editingItem) {
        await furnitureLayoutsApi.update(editingItem.id, { apartmentType: layoutForm.apartmentType } as UpdateLayoutInput);
        toast.success('Cập nhật layout thành công');
      } else {
        await furnitureLayoutsApi.create(layoutForm);
        toast.success('Thêm layout thành công');
      }
      if (selectedBuilding) {
        const layoutsData = await furnitureLayoutsApi.list(selectedBuilding.code);
        setLocalLayouts(layoutsData);
      }
      closeModal();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
    finally { setLoading(false); }
  };

  const handleDeleteLayout = async (id: string) => {
    try {
      await furnitureLayoutsApi.delete(id);
      toast.success('Đã xóa layout');
      if (selectedBuilding) {
        const layoutsData = await furnitureLayoutsApi.list(selectedBuilding.code);
        setLocalLayouts(layoutsData);
      }
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
  };

  const handleSaveApartmentType = async () => {
    if (!apartmentTypeForm.buildingCode.trim() || !apartmentTypeForm.apartmentType.trim()) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    setLoading(true);
    try {
      if (editingItem) {
        await furnitureApartmentTypesApi.update(editingItem.id, { apartmentType: apartmentTypeForm.apartmentType, imageUrl: apartmentTypeForm.imageUrl || null, description: apartmentTypeForm.description || null } as UpdateApartmentTypeInput);
        toast.success('Cập nhật loại căn hộ thành công');
      } else {
        await furnitureApartmentTypesApi.create(apartmentTypeForm);
        toast.success('Thêm loại căn hộ thành công');
      }
      if (selectedBuilding) {
        const apartmentTypesData = await furnitureApartmentTypesApi.list(selectedBuilding.code);
        setLocalApartmentTypes(apartmentTypesData);
      }
      closeModal();
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
    finally { setLoading(false); }
  };

  const handleDeleteApartmentType = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa loại căn hộ này?')) return;
    try {
      await furnitureApartmentTypesApi.delete(id);
      toast.success('Đã xóa loại căn hộ');
      if (selectedBuilding) {
        const apartmentTypesData = await furnitureApartmentTypesApi.list(selectedBuilding.code);
        setLocalApartmentTypes(apartmentTypesData);
      }
    } catch (error) { toast.error('Lỗi: ' + (error as Error).message); }
  };

  // Image upload handler for apartment type only
  const handleApartmentTypeImageUpload = async (file: File) => {
    try {
      const result = await mediaApi.uploadFile(file);
      setApartmentTypeForm((prev) => ({ ...prev, imageUrl: result.url }));
      toast.success('Tải ảnh lên thành công');
    } catch (error) { toast.error('Lỗi tải ảnh: ' + (error as Error).message); }
  };

  // Import/Export/Sync handlers
  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await furnitureDataApi.export();
      const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      };
      downloadCSV(result.duAn, 'DuAn.csv');
      downloadCSV(result.layouts, 'LayoutIDs.csv');
      downloadCSV(result.apartmentTypes, 'ApartmentType.csv');
      toast.success('Xuất dữ liệu thành công');
    } catch (error) { toast.error('Lỗi xuất dữ liệu: ' + (error as Error).message); }
    finally { setLoading(false); }
  };

  const handleImport = async () => {
    if (!importFiles.duAn || !importFiles.layouts || !importFiles.apartmentTypes) { toast.error('Vui lòng chọn đủ 3 file CSV'); return; }
    setLoading(true);
    try {
      const result = await furnitureDataApi.import(importFiles as { duAn: File; layouts: File; apartmentTypes: File });
      toast.success(`Import thành công: ${result.developers} chủ đầu tư, ${result.projects} dự án, ${result.buildings} tòa nhà`);
      onRefresh();
      closeModal();
    } catch (error) { toast.error('Lỗi import: ' + (error as Error).message); }
    finally { setLoading(false); }
  };

  const handleSyncPull = async () => {
    if (!spreadsheetId.trim()) { toast.error('Vui lòng nhập Spreadsheet ID'); return; }
    setLoading(true);
    try {
      const result = await furnitureDataApi.syncPull(spreadsheetId);
      if (result.success) {
        toast.success(`Đồng bộ thành công: ${result.counts.developers} chủ đầu tư, ${result.counts.projects} dự án`);
        onRefresh();
        closeModal();
      } else { toast.error('Lỗi đồng bộ: ' + result.error); }
    } catch (error) { toast.error('Lỗi đồng bộ: ' + (error as Error).message); }
    finally { setLoading(false); }
  };

  const handleSyncPush = async () => {
    if (!spreadsheetId.trim()) { toast.error('Vui lòng nhập Spreadsheet ID'); return; }
    setLoading(true);
    try {
      const result = await furnitureDataApi.syncPush(spreadsheetId);
      if (result.success) { toast.success('Đẩy dữ liệu lên Google Sheets thành công'); closeModal(); }
      else { toast.error('Lỗi đồng bộ: ' + result.error); }
    } catch (error) { toast.error('Lỗi đồng bộ: ' + (error as Error).message); }
    finally { setLoading(false); }
  };

  // Cell click handler for metrics grid
  const handleCellClick = (cell: MetricsGridCell) => {
    if (cell.layoutId) {
      const layout = localLayouts.find((l) => l.id === cell.layoutId);
      if (layout) openModal('layout', layout);
    } else {
      setLayoutForm({ buildingCode: selectedBuilding?.code || '', axis: cell.axis, apartmentType: '' });
      setModalType('layout');
      setEditingItem(null);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h3 style={{ color: tokens.color.text, margin: 0, fontSize: 20, fontWeight: 600 }}>Quản lý Dự án</h3>
        <ResponsiveActionBar justify="end" style={{ flex: 1 }}>
          <Button variant="outline" onClick={() => setModalType('import')} disabled={loading}><i className="ri-upload-2-line" /> Import CSV</Button>
          <Button variant="outline" onClick={handleExport} disabled={loading}><i className="ri-download-2-line" /> Export CSV</Button>
          <Button variant="outline" onClick={() => setModalType('sync')} disabled={loading}><i className="ri-refresh-line" /> Sync Sheet</Button>
          <Button onClick={onRefresh} disabled={loading}><i className="ri-refresh-line" /> Làm mới</Button>
        </ResponsiveActionBar>
      </div>

      {/* 3-Column Selection */}
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <EntityColumn
            type="developer"
            items={developers}
            selectedId={selectedDeveloperId}
            onSelect={handleSelectDeveloper}
            onAdd={() => openModal('developer')}
            onEdit={(item) => openModal('developer', item)}
            onDelete={handleDeleteDeveloper}
            childCounts={developerChildCounts}
          />
          <EntityColumn
            type="project"
            items={filteredProjects}
            selectedId={selectedProjectId}
            onSelect={handleSelectProject}
            onAdd={() => openModal('project')}
            onEdit={(item) => openModal('project', item)}
            onDelete={handleDeleteProject}
            childCounts={projectChildCounts}
            disabled={!selectedDeveloperId}
            emptyMessage={selectedDeveloperId ? 'Chưa có dự án' : 'Chọn chủ đầu tư trước'}
          />
          <EntityColumn
            type="building"
            items={filteredBuildings}
            selectedId={selectedBuildingId}
            onSelect={setSelectedBuildingId}
            onAdd={() => openModal('building')}
            onEdit={(item) => openModal('building', item)}
            onDelete={handleDeleteBuilding}
            disabled={!selectedProjectId}
            emptyMessage={selectedProjectId ? 'Chưa có tòa nhà' : 'Chọn dự án trước'}
          />
        </div>
      </Card>

      {/* Building Detail Section */}
      {selectedBuilding ? (
        <>
          <BuildingInfoCard
            building={selectedBuilding}
            developer={selectedDeveloper}
            project={selectedProject}
            apartmentTypesCount={localApartmentTypes.length}
          />
          <ApartmentTypeCards
            building={selectedBuilding}
            apartmentTypes={localApartmentTypes}
            onAdd={() => openModal('apartmentType')}
            onEdit={(apt) => openModal('apartmentType', apt)}
            onDelete={handleDeleteApartmentType}
          />
          <MetricsGrid
            building={selectedBuilding}
            layouts={localLayouts}
            onCellClick={handleCellClick}
          />
        </>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <i className="ri-building-2-line" style={{ fontSize: 48, color: tokens.color.muted, marginBottom: 16, display: 'block' }} />
            <h4 style={{ color: tokens.color.text, margin: '0 0 8px' }}>Chọn tòa nhà để xem chi tiết</h4>
            <p style={{ color: tokens.color.muted, margin: 0 }}>Chọn chủ đầu tư → dự án → tòa nhà từ các cột ở trên</p>
          </div>
        </Card>
      )}

      {/* Modals */}
      <ManagementModals
        modalType={modalType}
        onClose={closeModal}
        loading={loading}
        editingItem={editingItem}
        developerForm={developerForm}
        setDeveloperForm={setDeveloperForm}
        onSaveDeveloper={handleSaveDeveloper}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        onSaveProject={handleSaveProject}
        developers={developers}
        buildingForm={buildingForm}
        setBuildingForm={setBuildingForm}
        onSaveBuilding={handleSaveBuilding}
        projects={projects}
        layoutForm={layoutForm}
        setLayoutForm={setLayoutForm}
        onSaveLayout={handleSaveLayout}
        onDeleteLayout={handleDeleteLayout}
        apartmentTypeForm={apartmentTypeForm}
        setApartmentTypeForm={setApartmentTypeForm}
        onSaveApartmentType={handleSaveApartmentType}
        onApartmentTypeImageUpload={handleApartmentTypeImageUpload}
        spreadsheetId={spreadsheetId}
        setSpreadsheetId={setSpreadsheetId}
        onSyncPull={handleSyncPull}
        onSyncPush={handleSyncPush}
        importFiles={importFiles}
        setImportFiles={setImportFiles}
        onImport={handleImport}
      />
    </div>
  );
}

export default ManagementTab;
