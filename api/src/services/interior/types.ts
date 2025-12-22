// ============================================
// DEVELOPER TYPES
// ============================================

export interface InteriorDeveloperWithCount {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  order: number;
  isActive: boolean;
  developmentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DEVELOPMENT TYPES
// ============================================

export interface InteriorDevelopmentWithRelations {
  id: string;
  developerId: string;
  developer?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  name: string;
  code: string;
  slug: string;
  address: string | null;
  district: string | null;
  city: string | null;
  description: string | null;
  thumbnail: string | null;
  images: string[];
  totalBuildings: number | null;
  totalUnits: number | null;
  startYear: number | null;
  completionYear: number | null;
  order: number;
  isActive: boolean;
  buildingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// BUILDING TYPES
// ============================================

export interface SpecialFloor {
  floor: number;
  type: 'PENTHOUSE' | 'DUPLEX' | 'SHOPHOUSE' | 'COMMERCIAL';
  note?: string;
}

export interface InteriorBuildingWithRelations {
  id: string;
  developmentId: string;
  development?: {
    id: string;
    name: string;
    code: string;
    developer?: {
      id: string;
      name: string;
    };
  };
  name: string;
  code: string;
  totalFloors: number;
  startFloor: number;
  endFloor: number | null;
  axisLabels: string[];
  unitsPerFloor: number;
  unitCodeFormat: string;
  specialFloors: SpecialFloor[];
  thumbnail: string | null;
  floorPlanImage: string | null;
  order: number;
  isActive: boolean;
  unitCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// BUILDING UNIT TYPES
// ============================================

export type UnitType = 'STUDIO' | '1PN' | '2PN' | '3PN' | '4PN' | 'PENTHOUSE' | 'DUPLEX' | 'SHOPHOUSE';
export type UnitPosition = 'CORNER' | 'EDGE' | 'MIDDLE';
export type UnitDirection = 'ĐÔNG' | 'TÂY' | 'NAM' | 'BẮC' | 'ĐÔNG_NAM' | 'ĐÔNG_BẮC' | 'TÂY_NAM' | 'TÂY_BẮC';
export type UnitView = 'VIEW_POOL' | 'VIEW_PARK' | 'VIEW_CITY' | 'VIEW_RIVER';

export interface InteriorBuildingUnitWithRelations {
  id: string;
  buildingId: string;
  building?: {
    id: string;
    name: string;
    code: string;
    unitCodeFormat: string;
    development?: {
      id: string;
      name: string;
      code: string;
    };
  };
  axis: string;
  unitType: UnitType;
  bedrooms: number;
  bathrooms: number;
  position: UnitPosition;
  direction: UnitDirection | null;
  view: UnitView | null;
  floorStart: number;
  floorEnd: number | null;
  layoutId: string;
  layout?: InteriorUnitLayoutBasic;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// LAYOUT TYPES
// ============================================

export type RoomType = 
  | 'LIVING' 
  | 'BEDROOM' 
  | 'BEDROOM_MASTER' 
  | 'KITCHEN' 
  | 'BATHROOM' 
  | 'BATHROOM_ENSUITE' 
  | 'BALCONY' 
  | 'TERRACE' 
  | 'STORAGE' 
  | 'DINING' 
  | 'OTHER';

export interface LayoutRoom {
  name: string;
  area: number;
  type: RoomType;
}

export interface InteriorUnitLayoutBasic {
  id: string;
  name: string;
  code: string;
  unitType: UnitType;
  bedrooms: number;
  bathrooms: number;
  grossArea: number;
  netArea: number;
}

export interface InteriorUnitLayoutWithRelations {
  id: string;
  name: string;
  code: string;
  unitType: UnitType;
  bedrooms: number;
  bathrooms: number;
  grossArea: number;
  netArea: number;
  carpetArea: number | null;
  balconyArea: number | null;
  terraceArea: number | null;
  rooms: LayoutRoom[];
  layoutImage: string | null;
  layout3DImage: string | null;
  dimensionImage: string | null;
  description: string | null;
  highlights: string[];
  isActive: boolean;
  packageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// PACKAGE TYPES
// ============================================

export interface PackageItem {
  name: string;
  brand?: string | null;
  material?: string | null;
  qty: number;
  price: number;
}

export interface PackageRoomItems {
  room: string;
  items: PackageItem[];
}

export interface InteriorPackageWithRelations {
  id: string;
  layoutId: string;
  layout?: InteriorUnitLayoutBasic;
  name: string;
  code: string;
  tier: number;
  description: string | null;
  shortDescription: string | null;
  basePrice: number;
  pricePerSqm: number | null;
  thumbnail: string | null;
  images: string[];
  video360Url: string | null;
  items: PackageRoomItems[];
  totalItems: number;
  totalItemsPrice: number;
  warrantyMonths: number | null;
  installationDays: number | null;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SURCHARGE TYPES
// ============================================

export type SurchargeType = 'FIXED' | 'PERCENTAGE' | 'PER_FLOOR' | 'PER_SQM' | 'CONDITIONAL';

export interface SurchargeConditions {
  minFloor?: number | null;
  maxFloor?: number | null;
  minArea?: number | null;
  maxArea?: number | null;
  unitTypes?: UnitType[] | null;
  positions?: UnitPosition[] | null;
  buildings?: string[] | null;
  developments?: string[] | null;
}

export interface InteriorSurchargeWithConditions {
  id: string;
  name: string;
  code: string;
  type: SurchargeType;
  value: number;
  conditions: SurchargeConditions | null;
  description: string | null;
  isAutoApply: boolean;
  isOptional: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// QUOTE TYPES
// ============================================

export type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface AppliedSurcharge {
  name: string;
  amount: number;
}

export interface QuoteCalculationResult {
  unitInfo: {
    developmentName: string;
    buildingName: string;
    unitCode: string;
    floor: number;
    axis: string;
    unitType: UnitType;
    position: UnitPosition;
    direction: UnitDirection | null;
  };
  layoutInfo: {
    name: string;
    grossArea: number;
    netArea: number;
    rooms: LayoutRoom[];
  };
  packageInfo: {
    id: string;
    name: string;
    tier: number;
    basePrice: number;
    items: PackageRoomItems[];
  };
  priceBreakdown: {
    packagePrice: number;
    laborCost: number;
    surcharges: AppliedSurcharge[];
    surchargesTotal: number;
    managementFee: number;
    contingency: number;
    subtotal: number;
    vatAmount: number;
    discount: number;
    grandTotal: number;
    pricePerSqm: number;
  };
  validUntil: Date;
}

export interface InteriorQuoteWithRelations {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  developmentName: string;
  buildingName: string;
  unitCode: string;
  floor: number;
  axis: string;
  unitType: UnitType;
  layoutName: string;
  grossArea: number;
  netArea: number;
  packageId: string;
  package?: InteriorPackageWithRelations;
  packageName: string;
  packageTier: number;
  packagePrice: number;
  laborCost: number;
  surcharges: AppliedSurcharge[];
  surchargesTotal: number;
  managementFee: number;
  contingency: number;
  subtotal: number;
  vatAmount: number;
  discount: number;
  grandTotal: number;
  pricePerSqm: number | null;
  status: QuoteStatus;
  validUntil: Date | null;
  notes: string | null;
  internalNotes: string | null;
  sentAt: Date | null;
  viewedAt: Date | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListOptions {
  page?: number;
  limit?: number;
}
