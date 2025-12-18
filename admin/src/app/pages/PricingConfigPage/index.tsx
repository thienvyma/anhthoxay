import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { ServiceCategoriesTab } from './ServiceCategoriesTab';
import { UnitPricesTab } from './UnitPricesTab';
import { MaterialsTab } from './MaterialsTab';
import { FormulasTab } from './FormulasTab';
import type { TabType, ServiceCategory, UnitPrice, Material, MaterialCategory, Formula } from './types';
import { serviceCategoriesApi, unitPricesApi, materialsApi, materialCategoriesApi, formulasApi } from '../../api';

const TABS: Array<{ key: TabType; icon: string; label: string }> = [
  { key: 'service-categories', icon: 'ri-tools-line', label: 'Hạng mục' },
  { key: 'unit-prices', icon: 'ri-money-dollar-circle-line', label: 'Đơn giá' },
  { key: 'materials', icon: 'ri-paint-brush-line', label: 'Vật dụng' },
  { key: 'formulas', icon: 'ri-calculator-line', label: 'Công thức' },
];

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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: tokens.color.primary }}
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <motion.button
            key={tab.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              minWidth: 120,
              padding: '12px 16px',
              background: activeTab === tab.key ? tokens.color.primary : 'transparent',
              border: 'none',
              borderRadius: 8,
              color: activeTab === tab.key ? '#111' : tokens.color.muted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: activeTab === tab.key ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            <i className={tab.icon} />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'service-categories' && (
        <ServiceCategoriesTab
          categories={serviceCategories}
          formulas={formulas}
          materialCategories={materialCategories}
          onRefresh={fetchAllData}
        />
      )}
      {activeTab === 'unit-prices' && (
        <UnitPricesTab unitPrices={unitPrices} onRefresh={fetchAllData} />
      )}
      {activeTab === 'materials' && (
        <MaterialsTab materials={materials} categories={materialCategories} onRefresh={fetchAllData} />
      )}
      {activeTab === 'formulas' && (
        <FormulasTab formulas={formulas} unitPrices={unitPrices} onRefresh={fetchAllData} />
      )}
    </div>
  );
}
