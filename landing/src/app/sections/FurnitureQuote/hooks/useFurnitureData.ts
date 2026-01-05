/**
 * useFurnitureData Hook
 * Fetches and manages furniture data (developers, projects, buildings, etc.)
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.1, 3.2**
 */

import { useState, useEffect } from 'react';
import {
  furnitureAPI,
  FurnitureDeveloper,
  FurnitureProject,
  FurnitureBuilding,
  FurnitureApartmentType,
  FurnitureCategory,
  FurnitureFee,
  ProductBaseGroup,
} from '../../../api/furniture';
import type { Selections } from '../types';

export interface FurnitureDataState {
  developers: FurnitureDeveloper[];
  projects: FurnitureProject[];
  buildings: FurnitureBuilding[];
  apartmentTypes: FurnitureApartmentType[];
  categories: FurnitureCategory[];
  productGroups: ProductBaseGroup[];
  fees: FurnitureFee[];
  fitInFee: FurnitureFee | null;
  loading: boolean;
  error: string | null;
}

export function useFurnitureData(selections: Selections): FurnitureDataState {
  const [developers, setDevelopers] = useState<FurnitureDeveloper[]>([]);
  const [projects, setProjects] = useState<FurnitureProject[]>([]);
  const [buildings, setBuildings] = useState<FurnitureBuilding[]>([]);
  const [apartmentTypes, setApartmentTypes] = useState<FurnitureApartmentType[]>([]);
  const [categories, setCategories] = useState<FurnitureCategory[]>([]);
  const [productGroups, setProductGroups] = useState<ProductBaseGroup[]>([]);
  const [fees, setFees] = useState<FurnitureFee[]>([]);
  const [fitInFee, setFitInFee] = useState<FurnitureFee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial developers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const devs = await furnitureAPI.getDevelopers();
        setDevelopers(devs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch projects when developer changes
  useEffect(() => {
    if (selections.developer) {
      furnitureAPI.getProjects(selections.developer.id).then(setProjects).catch(console.error);
    } else {
      setProjects([]);
    }
  }, [selections.developer]);

  // Fetch buildings when project changes
  useEffect(() => {
    if (selections.project) {
      furnitureAPI.getBuildings(selections.project.id).then(setBuildings).catch(console.error);
    } else {
      setBuildings([]);
    }
  }, [selections.project]);

  // Fetch apartment types when layout is determined
  useEffect(() => {
    if (selections.layout && selections.building) {
      furnitureAPI
        .getApartmentTypes(selections.building.code, selections.layout.apartmentType)
        .then(setApartmentTypes)
        .catch(console.error);
    } else {
      setApartmentTypes([]);
    }
  }, [selections.layout, selections.building]);

  // Fetch products and categories for custom selection
  useEffect(() => {
    if (selections.apartmentTypeDetail && selections.project && selections.building) {
      // Fetch categories
      furnitureAPI.getCategories().then(setCategories).catch(console.error);
      
      // Fetch products filtered by apartment mapping
      furnitureAPI.getProductsGrouped({
        projectName: selections.project.name,
        buildingCode: selections.building.code,
        apartmentType: selections.apartmentTypeDetail.apartmentType,
      })
        .then((response) => {
          setProductGroups(response.products);
        })
        .catch(console.error);
    }
  }, [selections.apartmentTypeDetail, selections.project, selections.building]);

  // Fetch fees
  useEffect(() => {
    if (selections.apartmentTypeDetail) {
      furnitureAPI.getFees()
        .then((allFees) => {
          setFees(allFees);
          const fitIn = allFees.find(f => f.code === 'FIT_IN');
          setFitInFee(fitIn || null);
        })
        .catch(console.error);
    }
  }, [selections.apartmentTypeDetail]);

  return {
    developers,
    projects,
    buildings,
    apartmentTypes,
    categories,
    productGroups,
    fees,
    fitInFee,
    loading,
    error,
  };
}
