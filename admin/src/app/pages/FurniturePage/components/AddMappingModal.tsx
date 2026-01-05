/**
 * AddMappingModal - Modal for adding product-apartment mappings
 *
 * Feature: furniture-product-mapping
 * Requirements: 6.2, 6.3, 6.4
 *
 * This component implements cascading filters:
 * - Project dropdown (fetch from API)
 * - Building dropdown (filtered by selected project)
 * - ApartmentType dropdown (filtered by selected building)
 */

import { useState, useEffect } from 'react';
import { tokens } from '../../../../theme';
import { ResponsiveModal } from '../../../../components/responsive';
import { Button } from '../../../components/Button';
import { Select } from '../../../components/Select';
import {
  furnitureProjectsApi,
  furnitureBuildingsApi,
  furnitureLayoutsApi,
} from '../../../api/furniture';
import type { ProductMappingInput } from '../types';

export interface AddMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (mapping: ProductMappingInput) => void;
}

interface ProjectOption {
  value: string;
  label: string;
}

interface BuildingOption {
  value: string;
  label: string;
  code: string;
}

/**
 * Filters buildings by project name
 * **Property 12: Cascading Filter for Mappings**
 * **Validates: Requirements 6.3**
 */
export function filterBuildingsByProject(
  buildings: Array<{ id: string; name: string; code: string; project?: { name: string } }>,
  projectName: string
): BuildingOption[] {
  return buildings
    .filter((b) => b.project?.name === projectName)
    .map((b) => ({ value: b.id, label: b.name, code: b.code }));
}

/**
 * Extracts unique apartment types from layouts
 * **Property 12: Cascading Filter for Mappings**
 * **Validates: Requirements 6.4**
 */
export function extractApartmentTypesFromLayouts(
  layouts: Array<{ apartmentType: string }>
): string[] {
  return [...new Set(layouts.map((l) => l.apartmentType))];
}

export function AddMappingModal({ isOpen, onClose, onAdd }: AddMappingModalProps) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [allBuildings, setAllBuildings] = useState<
    Array<{ id: string; name: string; code: string; project?: { name: string } }>
  >([]);
  const [apartmentTypes, setApartmentTypes] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedProject, setSelectedProject] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Load projects on mount
  useEffect(() => {
    if (isOpen) {
      setLoadingProjects(true);
      furnitureProjectsApi
        .list()
        .then((data) => {
          setProjects(data.map((p) => ({ value: p.name, label: p.name })));
        })
        .catch(() => setProjects([]))
        .finally(() => setLoadingProjects(false));

      // Also load all buildings for filtering
      furnitureBuildingsApi
        .list()
        .then((data) => {
          setAllBuildings(data);
        })
        .catch(() => setAllBuildings([]));
    }
  }, [isOpen]);

  // Filter buildings when project changes
  // **Property 12: Cascading Filter for Mappings**
  // **Validates: Requirements 6.3**
  useEffect(() => {
    if (selectedProject) {
      setLoadingBuildings(true);
      setSelectedBuilding('');
      setSelectedType('');
      setApartmentTypes([]);

      // Filter buildings by project name
      const filtered = filterBuildingsByProject(allBuildings, selectedProject);
      setBuildings(filtered);
      setLoadingBuildings(false);
    } else {
      setBuildings([]);
      setSelectedBuilding('');
      setSelectedType('');
      setApartmentTypes([]);
    }
  }, [selectedProject, allBuildings]);

  // Load apartment types when building changes
  // **Property 12: Cascading Filter for Mappings**
  // **Validates: Requirements 6.4**
  useEffect(() => {
    if (selectedBuilding) {
      setLoadingTypes(true);
      setSelectedType('');

      const building = buildings.find((b) => b.value === selectedBuilding);
      if (building) {
        furnitureLayoutsApi
          .list(building.code)
          .then((data) => {
            // Get unique apartment types from layouts
            const types = extractApartmentTypesFromLayouts(data);
            setApartmentTypes(types);
          })
          .catch(() => setApartmentTypes([]))
          .finally(() => setLoadingTypes(false));
      }
    } else {
      setApartmentTypes([]);
      setSelectedType('');
    }
  }, [selectedBuilding, buildings]);

  const handleSubmit = async () => {
    const building = buildings.find((b) => b.value === selectedBuilding);
    if (!selectedProject || !building || !selectedType) {
      alert('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    setSaving(true);
    try {
      onAdd({
        projectName: selectedProject,
        buildingCode: building.code,
        apartmentType: selectedType,
      });
      // Reset form
      setSelectedProject('');
      setSelectedBuilding('');
      setSelectedType('');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedProject('');
    setSelectedBuilding('');
    setSelectedType('');
    onClose();
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Thêm ánh xạ căn hộ"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            loading={saving}
            disabled={!selectedProject || !selectedBuilding || !selectedType}
          >
            Thêm
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Select
          label="Dự án *"
          value={selectedProject}
          onChange={setSelectedProject}
          options={projects}
          placeholder={loadingProjects ? 'Đang tải...' : 'Chọn dự án'}
          disabled={loadingProjects}
          fullWidth
        />

        <Select
          label="Tòa nhà *"
          value={selectedBuilding}
          onChange={setSelectedBuilding}
          options={buildings.map((b) => ({
            value: b.value,
            label: `${b.label} (${b.code})`,
          }))}
          placeholder={
            loadingBuildings
              ? 'Đang tải...'
              : selectedProject
                ? 'Chọn tòa nhà'
                : 'Chọn dự án trước'
          }
          disabled={loadingBuildings || !selectedProject}
          fullWidth
        />

        <Select
          label="Loại căn hộ *"
          value={selectedType}
          onChange={setSelectedType}
          options={apartmentTypes.map((t) => ({ value: t, label: t.toUpperCase() }))}
          placeholder={
            loadingTypes
              ? 'Đang tải...'
              : selectedBuilding
                ? 'Chọn loại căn hộ'
                : 'Chọn tòa nhà trước'
          }
          disabled={loadingTypes || !selectedBuilding}
          fullWidth
        />

        <p style={{ color: tokens.color.muted, fontSize: 12, margin: 0 }}>
          Ánh xạ sẽ liên kết sản phẩm với căn hộ cụ thể. Khách hàng chỉ thấy sản phẩm khi
          chọn đúng dự án, tòa nhà và loại căn hộ.
        </p>
      </div>
    </ResponsiveModal>
  );
}

export default AddMappingModal;
