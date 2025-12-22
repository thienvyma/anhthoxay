/**
 * Interior Wizard Types
 * 
 * NOTE: Field names MUST match API response (DB schema)
 * - logo (not logoUrl)
 * - thumbnail (not thumbnailUrl)
 * - layoutImage (not image2dUrl)
 * - rooms (not roomBreakdown)
 * - tier: number (1-4, not string)
 */

export interface WizardStep {
  id: number;
  label: string;
  shortLabel: string;
}

export interface Developer {
  id: string;
  name: string;
  slug: string;
  logo?: string;           // DB field name (was logoUrl)
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  order?: number;
  isActive?: boolean;
}

export interface Development {
  id: string;
  name: string;
  code: string;
  slug: string;
  developerId: string;
  thumbnail?: string;      // DB field name (was thumbnailUrl)
  images?: string[];       // JSON array in DB
  address?: string;
  district?: string;
  city?: string;
  description?: string;
  totalBuildings?: number;
  totalUnits?: number;
  startYear?: number;
  completionYear?: number;
  order?: number;
  isActive?: boolean;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  developmentId: string;
  totalFloors: number;
  startFloor: number;
  endFloor?: number;
  axisLabels: string[];    // Parsed from JSON
  unitsPerFloor: number;
  unitCodeFormat: string;
  specialFloors?: SpecialFloor[];
  thumbnail?: string;
  floorPlanImage?: string; // DB field name (was floorPlanUrl)
  order?: number;
  isActive?: boolean;
}

export interface SpecialFloor {
  floor: number;
  type: string;
  note?: string;
}

export interface BuildingUnit {
  id: string;
  buildingId: string;
  layoutId: string;
  code?: string;           // Generated from format
  floor?: number;          // Selected floor
  axis: string;
  unitType: string;
  bedrooms: number;
  bathrooms: number;
  position?: string;       // CORNER, EDGE, MIDDLE
  direction?: string;
  view?: string;
  floorStart?: number;
  floorEnd?: number;
  isActive?: boolean;
}

export interface LayoutRoom {
  name: string;
  area: number;
  type: string;            // DB field name (was roomType)
}

export interface Layout {
  id: string;
  name: string;
  code: string;
  unitType: string;
  bedrooms: number;
  bathrooms: number;
  grossArea: number;
  netArea: number;
  carpetArea?: number;
  balconyArea?: number;
  terraceArea?: number;
  rooms: LayoutRoom[];     // DB field name (was roomBreakdown), parsed from JSON
  layoutImage?: string;    // DB field name (was image2dUrl)
  layout3DImage?: string;  // DB field name (was image3dUrl)
  dimensionImage?: string; // DB field name (was dimensionsUrl)
  description?: string;
  highlights?: string[];   // Parsed from JSON
  isActive?: boolean;
}

// Keep old name as alias for backward compatibility
export type RoomBreakdown = LayoutRoom;

export interface PackageItem {
  name: string;
  brand?: string;
  material?: string;
  qty: number;
  price: number;
}

export interface PackageRoomItems {
  room: string;
  items: PackageItem[];
}

export interface Package {
  id: string;
  layoutId: string;
  name: string;
  code: string;
  tier: number;            // DB type: 1=Basic, 2=Standard, 3=Premium, 4=Luxury (was string)
  basePrice: number;
  pricePerSqm?: number;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;      // DB field name (was thumbnailUrl)
  images?: string[];       // DB field name (was galleryUrls), parsed from JSON
  video360Url?: string;
  isFeatured: boolean;
  totalItems?: number;     // DB field name (was itemsCount)
  totalItemsPrice?: number;
  items?: PackageRoomItems[]; // Parsed from JSON
  warrantyMonths?: number;
  installationDays?: number;
  order?: number;
  isActive?: boolean;
}

export interface QuoteResult {
  id?: string;
  code?: string;
  unitInfo: {
    developer: string;
    development: string;
    building: string;
    unitCode: string;
    unitType: string;
    bedrooms: number;
    bathrooms: number;
    grossArea: number;
    netArea: number;
  };
  packageInfo: {
    name: string;
    tier: number;          // DB type: number (1-4)
    basePrice: number;
  };
  breakdown: {
    packagePrice: number;
    laborCost: number;
    surcharges: Array<{
      name: string;
      type: 'FIXED' | 'PERCENTAGE';
      value: number;
      amount: number;
    }>;
    managementFee: number;
    contingency: number;
    subtotal: number;
    vat: number;
    discount: number;
    grandTotal: number;
    pricePerSqm: number;
  };
  validUntil?: string;
}

export interface WizardState {
  currentStep: number;
  direction: number;
  developer: Developer | null;
  development: Development | null;
  building: Building | null;
  unit: BuildingUnit | null;
  layout: Layout | null;
  package: Package | null;
  quote: QuoteResult | null;
}

// Furniture types for custom selection
export interface FurnitureCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  roomTypes?: string[];
  order?: number;
  isActive?: boolean;
}

export interface FurnitureDimensions {
  width: number;
  height: number;
  depth: number;
  unit: string;
}

export interface FurnitureItem {
  id: string;
  categoryId: string;
  name: string;
  sku: string;
  brand?: string;
  material?: string;
  color?: string;
  dimensions?: FurnitureDimensions;
  thumbnail?: string;
  images?: string[];
  price: number;
  costPrice?: number;
  warrantyMonths?: number;
  description?: string;
  specifications?: string;
  order?: number;
  isActive?: boolean;
}

export interface CustomSelectionItem {
  item: FurnitureItem;
  qty: number;
}

export interface CustomSelection {
  items: CustomSelectionItem[];
  totalPrice: number;
  totalItems: number;
}

// Helper to convert tier number to label
export function getTierLabel(tier: number): string {
  const labels: Record<number, string> = {
    1: 'Cơ Bản',
    2: 'Tiêu Chuẩn',
    3: 'Cao Cấp',
    4: 'Sang Trọng',
  };
  return labels[tier] || 'Cơ Bản';
}

// Helper to convert tier number to English label
export function getTierLabelEn(tier: number): string {
  const labels: Record<number, string> = {
    1: 'Basic',
    2: 'Standard',
    3: 'Premium',
    4: 'Luxury',
  };
  return labels[tier] || 'Basic';
}
