// Shared types for Pricing Config
export interface MaterialCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  order: number;
  isActive: boolean;
  _count?: { materials: number };
}

export interface Material {
  id: string;
  name: string;
  categoryId: string;
  category: MaterialCategory;
  imageUrl: string | null;
  price: number;
  unit: string | null;
  description: string | null;
  isActive: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  coefficient: number;
  materialCategoryIds: string[];
  formulaId: string | null;
  order: number;
  isActive: boolean;
}

export interface UnitPrice {
  id: string;
  category: string;
  name: string;
  price: number;
  tag: string;
  unit: string;
  description: string | null;
  isActive: boolean;
}

export interface Formula {
  id: string;
  name: string;
  expression: string;
  description: string | null;
  isActive: boolean;
}

export type TabType = 'service-categories' | 'unit-prices' | 'materials' | 'formulas';

// Re-export API_URL from shared for convenience
export { API_URL } from '@app/shared';

export const UNIT_PRICE_CATEGORIES = ['Nhân công', 'Vật liệu', 'Thiết bị', 'Khác'];

export interface TabProps {
  onRefresh: () => void;
}

export interface ServiceCategoriesTabProps extends TabProps {
  categories: ServiceCategory[];
  formulas: Formula[];
  materialCategories: MaterialCategory[];
}

export interface UnitPricesTabProps extends TabProps {
  unitPrices: UnitPrice[];
}

export interface MaterialsTabProps extends TabProps {
  materials: Material[];
  categories: MaterialCategory[];
}

export interface FormulasTabProps extends TabProps {
  formulas: Formula[];
  unitPrices: UnitPrice[];
}
