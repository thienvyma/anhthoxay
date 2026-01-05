/**
 * useSelections Hook
 * Manages selection state and handlers for FurnitureQuote
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.2, 3.3**
 */

import { useState, useCallback } from 'react';
import { furnitureAPI, ProductVariantForLanding } from '../../../api/furniture';
import type { Selections, SelectedProduct } from '../types';
import { MIN_QUANTITY, MAX_QUANTITY } from '../constants';

type FurnitureDeveloper = Selections['developer'];
type FurnitureProject = Selections['project'];
type FurnitureBuilding = Selections['building'];
type FurnitureLayout = Selections['layout'];
type FurnitureApartmentType = Selections['apartmentTypeDetail'];

const initialSelections: Selections = {
  developer: null,
  project: null,
  building: null,
  floor: null,
  axis: null,
  layout: null,
  apartmentTypeDetail: null,
  products: [],
};

export interface UseSelectionsReturn {
  selections: Selections;
  handleDeveloperSelect: (dev: NonNullable<FurnitureDeveloper>) => void;
  handleProjectSelect: (proj: NonNullable<FurnitureProject>) => void;
  handleBuildingSelect: (bld: NonNullable<FurnitureBuilding>) => void;
  handleFloorAxisSelect: (floor: number, axis: number) => Promise<FurnitureLayout | null>;
  handleApartmentTypeSelect: (apt: NonNullable<FurnitureApartmentType>) => void;
  handleProductSelect: (productBaseId: string, productName: string, variant: ProductVariantForLanding, allowFitIn: boolean) => void;
  handleProductRemove: (productBaseId: string) => void;
  handleProductQuantityChange: (productBaseId: string, quantity: number) => void;
  handleFitInToggle: (productBaseId: string) => void;
  setFloor: (floor: number | null) => void;
  setAxis: (axis: number | null) => void;
  resetSelections: () => void;
}

export function useSelections(building: FurnitureBuilding | null): UseSelectionsReturn {
  const [selections, setSelections] = useState<Selections>(initialSelections);

  const handleDeveloperSelect = useCallback((dev: NonNullable<FurnitureDeveloper>) => {
    setSelections((prev) => ({
      ...prev,
      developer: dev,
      project: null,
      building: null,
      floor: null,
      axis: null,
      layout: null,
      apartmentTypeDetail: null,
      products: [],
    }));
  }, []);

  const handleProjectSelect = useCallback((proj: NonNullable<FurnitureProject>) => {
    setSelections((prev) => ({
      ...prev,
      project: proj,
      building: null,
      floor: null,
      axis: null,
      layout: null,
      apartmentTypeDetail: null,
      products: [],
    }));
  }, []);

  const handleBuildingSelect = useCallback((bld: NonNullable<FurnitureBuilding>) => {
    setSelections((prev) => ({
      ...prev,
      building: bld,
      floor: null,
      axis: null,
      layout: null,
      apartmentTypeDetail: null,
      products: [],
    }));
  }, []);

  const handleFloorAxisSelect = useCallback(
    async (floor: number, axis: number): Promise<FurnitureLayout | null> => {
      const currentBuilding = building || selections.building;
      if (!currentBuilding) return null;

      try {
        const layout = await furnitureAPI.getLayoutByAxis(currentBuilding.code, axis);
        if (!layout) {
          return null;
        }

        setSelections((prev) => ({
          ...prev,
          floor,
          axis,
          layout,
          apartmentTypeDetail: null,
          products: [],
        }));
        return layout;
      } catch {
        return null;
      }
    },
    [building, selections.building]
  );

  const handleApartmentTypeSelect = useCallback((apt: NonNullable<FurnitureApartmentType>) => {
    setSelections((prev) => ({
      ...prev,
      apartmentTypeDetail: apt,
      products: [],
    }));
  }, []);

  const handleProductSelect = useCallback((
    productBaseId: string, 
    productName: string, 
    variant: ProductVariantForLanding, 
    allowFitIn: boolean
  ) => {
    setSelections((prev) => {
      const existingIndex = prev.products.findIndex((p) => p.productBaseId === productBaseId);
      if (existingIndex >= 0) {
        // Update existing selection with new variant
        const updated = [...prev.products];
        updated[existingIndex] = {
          ...updated[existingIndex],
          variant,
        };
        return { ...prev, products: updated };
      }
      // Add new product selection
      const newProduct: SelectedProduct = {
        productBaseId,
        productName,
        variant,
        quantity: 1,
        fitInSelected: false,
        allowFitIn,
      };
      return {
        ...prev,
        products: [...prev.products, newProduct],
      };
    });
  }, []);

  const handleProductRemove = useCallback((productBaseId: string) => {
    setSelections((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.productBaseId !== productBaseId),
    }));
  }, []);

  const handleProductQuantityChange = useCallback((productBaseId: string, quantity: number) => {
    const validQuantity = Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, quantity));
    setSelections((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.productBaseId === productBaseId ? { ...p, quantity: validQuantity } : p
      ),
    }));
  }, []);

  const handleFitInToggle = useCallback((productBaseId: string) => {
    setSelections((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.productBaseId === productBaseId ? { ...p, fitInSelected: !p.fitInSelected } : p
      ),
    }));
  }, []);

  const setFloor = useCallback((floor: number | null) => {
    setSelections((prev) => ({ ...prev, floor }));
  }, []);

  const setAxis = useCallback((axis: number | null) => {
    setSelections((prev) => ({ ...prev, axis }));
  }, []);

  const resetSelections = useCallback(() => {
    setSelections(initialSelections);
  }, []);

  return {
    selections,
    handleDeveloperSelect,
    handleProjectSelect,
    handleBuildingSelect,
    handleFloorAxisSelect,
    handleApartmentTypeSelect,
    handleProductSelect,
    handleProductRemove,
    handleProductQuantityChange,
    handleFitInToggle,
    setFloor,
    setAxis,
    resetSelections,
  };
}
