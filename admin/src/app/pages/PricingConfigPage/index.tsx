/**
 * Pricing Config Page - Pricing configuration with responsive tabs
 *
 * Requirements: 5.1, 5.2
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { ResponsiveTabs, Tab } from '../../../components/responsive';
import { ServiceCategoriesTab } from './ServiceCategoriesTab';
import { UnitPricesTab } from './UnitPricesTab';
import { MaterialsTab } from './MaterialsTab';
import { FormulasTab } from './FormulasTab';
import type { TabType, ServiceCategory, UnitPrice, Material, MaterialCategory, Formula } from './types';
import { serviceCategoriesApi, unitPricesApi, materialsApi, materialCategoriesApi, formulasApi } from '../../api';

export function PricingConfigPage() {
  const [activeTab, setActiveTab] = useState<TabType>('service-categories');
  const [loading, setLoading] = useState(true);

  // Shared data
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [unitPrices, setUnitPrices] = useState<UnitPrice[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialCategories, setMaterialCategories] = useState<MaterialCategory[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);

  const fetchAllData = useCallback(async () => {
    try {
      const [scData, upData, matData, mcData, fData] = await Promise.all([
        serviceCategoriesApi.list(),
        unitPricesApi.list(),
        materialsApi.list(),
        materialCategoriesApi.list(),
        formulasApi.list(),
      ]);
      setServiceCategories(scData as ServiceCategory[]);
      setUnitPrices(upData as UnitPrice[]);
      setMaterials(matData as Material[]);
      setMaterialCategories(mcData as MaterialCategory[]);
      setFormulas(fData as Formula[]);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Build tabs with content
  const tabs: Tab[] = useMemo(
    () => [
      {
        id: 'service-categories',
        label: 'Hạng mục',
        icon: 'ri-tools-line',
        content: (
          <ServiceCategoriesTab
            categories={serviceCategories}
            formulas={formulas}
            materialCategories={materialCategories}
            onRefresh={fetchAllData}
          />
        ),
      },
      {
        id: 'unit-prices',
        label: 'Đơn giá',
        icon: 'ri-money-dollar-circle-line',
        content: <UnitPricesTab unitPrices={unitPrices} onRefresh={fetchAllData} />,
      },
      {
        id: 'materials',
        label: 'Vật dụng',
        icon: 'ri-paint-brush-line',
        content: <MaterialsTab materials={materials} categories={materialCategories} onRefresh={fetchAllData} />,
      },
      {
        id: 'formulas',
        label: 'Công thức',
        icon: 'ri-calculator-line',
        content: <FormulasTab formulas={formulas} unitPrices={unitPrices} onRefresh={fetchAllData} />,
      },
    ],
    [serviceCategories, unitPrices, materials, materialCategories, formulas, fetchAllData]
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${tokens.color.border}`, borderTopColor: tokens.color.primary }}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: tokens.color.text, fontSize: 28, fontWeight: 700, margin: 0 }}>Cấu hình báo giá</h1>
        <p style={{ color: tokens.color.muted, margin: '8px 0 0' }}>Quản lý hạng mục, đơn giá, vật dụng và công thức tính giá</p>
      </div>

      {/* Responsive Tabs */}
      <ResponsiveTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        mobileMode="dropdown"
        iconOnlyMobile={false}
        testId="pricing-config-tabs"
      />
    </div>
  );
}
