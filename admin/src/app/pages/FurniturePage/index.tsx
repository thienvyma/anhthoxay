/**
 * FurniturePage - Furniture Quotation System Management
 *
 * Feature: furniture-quotation
 * Requirements: 1.1
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { ResponsiveTabs, Tab } from '../../../components/responsive';
import { ManagementTab } from './ManagementTab';
import { CatalogTab } from './CatalogTab';
import { MappingTab } from './MappingTab';
import { SettingsTab } from './SettingsTab';
import { PdfSettingsTab } from './PdfSettingsTab';
import type {
  TabType,
  FurnitureDeveloper,
  FurnitureProject,
  FurnitureBuilding,
  FurnitureLayout,
  FurnitureApartmentType,
  FurnitureCategory,
  FurnitureFee,
  FurniturePdfSettings,
  FurnitureMaterial,
} from './types';
import {
  furnitureDevelopersApi,
  furnitureProjectsApi,
  furnitureBuildingsApi,
  furnitureCategoriesApi,
  furnitureProductBasesApi,
  furnitureFeesApi,
  furniturePdfSettingsApi,
  furnitureMaterialsApi,
} from '../../api/furniture';
import type { ProductBaseWithDetails } from '../../api/furniture';

export function FurniturePage() {
  const [activeTab, setActiveTab] = useState<TabType>('management');
  const [loading, setLoading] = useState(true);

  // Data state
  const [developers, setDevelopers] = useState<FurnitureDeveloper[]>([]);
  const [projects, setProjects] = useState<FurnitureProject[]>([]);
  const [buildings, setBuildings] = useState<FurnitureBuilding[]>([]);
  const [layouts, setLayouts] = useState<FurnitureLayout[]>([]);
  const [apartmentTypes, setApartmentTypes] = useState<FurnitureApartmentType[]>([]);
  const [categories, setCategories] = useState<FurnitureCategory[]>([]);
  const [productBases, setProductBases] = useState<ProductBaseWithDetails[]>([]);
  const [materials, setMaterials] = useState<FurnitureMaterial[]>([]);
  const [fees, setFees] = useState<FurnitureFee[]>([]);
  const [pdfSettings, setPdfSettings] = useState<FurniturePdfSettings | null>(null);

  /**
   * Fetch all data on mount
   * Requirements: 1.1
   */
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        developersData,
        projectsData,
        buildingsData,
        categoriesData,
        productBasesData,
        materialsData,
        feesData,
        pdfSettingsData,
      ] = await Promise.all([
        furnitureDevelopersApi.list(),
        furnitureProjectsApi.list(),
        furnitureBuildingsApi.list(),
        furnitureCategoriesApi.list(),
        furnitureProductBasesApi.list({ limit: 100 }),
        furnitureMaterialsApi.list(),
        furnitureFeesApi.list(),
        furniturePdfSettingsApi.get().catch(() => null),
      ]);

      setDevelopers(developersData);
      setProjects(projectsData);
      setBuildings(buildingsData);
      setCategories(categoriesData);
      setProductBases(productBasesData.products);
      setMaterials(materialsData);
      setFees(feesData);
      setPdfSettings(pdfSettingsData);

      // Layouts and apartmentTypes are fetched per building, so we start with empty arrays
      // They will be populated when a building is selected in ManagementTab
      setLayouts([]);
      setApartmentTypes([]);
    } catch (error) {
      console.error('Failed to fetch furniture data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /**
   * Define tabs array with ResponsiveTabs
   * Requirements: 1.1
   * Tab 1: id='management', label='Quản lý', icon='ri-building-line'
   * Tab 2: id='catalog', label='Catalog', icon='ri-store-line'
   * Tab 3: id='mapping', label='Ánh xạ', icon='ri-links-line'
   * Tab 4: id='settings', label='Phí', icon='ri-money-dollar-circle-line'
   * Tab 5: id='pdf', label='PDF', icon='ri-file-pdf-line'
   */
  const tabs: Tab[] = useMemo(
    () => [
      {
        id: 'management',
        label: 'Quản lý',
        icon: 'ri-building-line',
        content: (
          <ManagementTab
            developers={developers}
            projects={projects}
            buildings={buildings}
            layouts={layouts}
            apartmentTypes={apartmentTypes}
            onRefresh={fetchAllData}
          />
        ),
      },
      {
        id: 'catalog',
        label: 'Catalog',
        icon: 'ri-store-line',
        content: (
          <CatalogTab
            categories={categories}
            productBases={productBases}
            materials={materials}
            onRefresh={fetchAllData}
          />
        ),
      },
      {
        id: 'mapping',
        label: 'Ánh xạ',
        icon: 'ri-links-line',
        content: (
          <MappingTab
            productBases={productBases}
            categories={categories}
            onRefresh={fetchAllData}
          />
        ),
      },
      {
        id: 'settings',
        label: 'Phí',
        icon: 'ri-money-dollar-circle-line',
        content: (
          <SettingsTab
            fees={fees}
            onRefresh={fetchAllData}
          />
        ),
      },
      {
        id: 'pdf',
        label: 'PDF',
        icon: 'ri-file-pdf-line',
        content: (
          <PdfSettingsTab
            pdfSettings={pdfSettings}
            onRefresh={fetchAllData}
          />
        ),
      },
    ],
    [developers, projects, buildings, layouts, apartmentTypes, categories, productBases, materials, fees, pdfSettings, fetchAllData]
  );

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: `3px solid ${tokens.color.border}`,
            borderTopColor: tokens.color.primary,
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: tokens.color.text, fontSize: 28, fontWeight: 700, margin: 0 }}>
          Quản lý Nội thất
        </h1>
        <p style={{ color: tokens.color.muted, margin: '8px 0 0' }}>
          Quản lý dự án, sản phẩm nội thất và cài đặt phí
        </p>
      </div>

      {/* Responsive Tabs with mobileMode="dropdown" */}
      <ResponsiveTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        mobileMode="dropdown"
        iconOnlyMobile={false}
        testId="furniture-page-tabs"
      />
    </div>
  );
}

export default FurniturePage;
