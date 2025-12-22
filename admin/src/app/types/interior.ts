// Interior Module Types - ANH THỢ XÂY Admin Dashboard
// Types for Interior Quote Module entities

// ========== ENUMS ==========

export type UnitType = 'STUDIO' | '1PN' | '2PN' | '3PN' | '4PN' | 'PENTHOUSE' | 'DUPLEX' | 'SHOPHOUSE';

export type UnitPosition = 'CORNER' | 'EDGE' | 'MIDDLE';

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

export type SurchargeType = 'FIXED' | 'PERCENTAGE' | 'PER_FLOOR' | 'PER_SQM' | 'CONDITIONAL';

export type InteriorFeeType = 'FIXED' | 'PERCENTAGE';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type SpecialFloorType = 'PENTHOUSE' | 'DUPLEX' | 'SHOPHOUSE' | 'COMMERCIAL';

// ========== DEVELOPER ==========

export interface InteriorDeveloper {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  order: number;
  isActive: boolean;
  developmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeveloperInput {
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateDeveloperInput extends Partial<CreateDeveloperInput> {
  order?: number;
}

// ========== DEVELOPMENT ==========

export interface InteriorDevelopment {
  id: string;
  developerId: string;
  developer?: InteriorDeveloper;
  name: string;
  code: string;
  slug: string;
  address?: string;
  district?: string;
  city?: string;
  description?: string;
  thumbnail?: string;
  images?: string[];
  totalBuildings?: number;
  totalUnits?: number;
  startYear?: number;
  completionYear?: number;
  order: number;
  isActive: boolean;
  buildingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDevelopmentInput {
  developerId: string;
  name: string;
  code: string;
  address?: string;
  district?: string;
  city?: string;
  description?: string;
  thumbnail?: string;
  images?: string[];
  totalBuildings?: number;
  totalUnits?: number;
  startYear?: number;
  completionYear?: number;
  isActive?: boolean;
}

export interface UpdateDevelopmentInput extends Partial<CreateDevelopmentInput> {
  order?: number;
}


// ========== BUILDING ==========

export interface SpecialFloor {
  floor: number;
  type: SpecialFloorType;
  note?: string;
}

export interface InteriorBuilding {
  id: string;
  developmentId: string;
  development?: InteriorDevelopment;
  name: string;
  code: string;
  totalFloors: number;
  startFloor: number;
  endFloor?: number;
  axisLabels: string[];
  unitsPerFloor: number;
  unitCodeFormat: string;
  specialFloors?: SpecialFloor[];
  thumbnail?: string;
  floorPlanImage?: string;
  order: number;
  isActive: boolean;
  unitCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildingInput {
  developmentId: string;
  name: string;
  code: string;
  totalFloors: number;
  startFloor?: number;
  endFloor?: number;
  axisLabels: string[];
  unitsPerFloor: number;
  unitCodeFormat?: string;
  specialFloors?: SpecialFloor[];
  thumbnail?: string;
  floorPlanImage?: string;
  isActive?: boolean;
}

export interface UpdateBuildingInput extends Partial<CreateBuildingInput> {
  order?: number;
}

// ========== BUILDING UNIT ==========

export interface InteriorBuildingUnit {
  id: string;
  buildingId: string;
  building?: InteriorBuilding;
  axis: string;
  unitType: UnitType;
  bedrooms: number;
  bathrooms: number;
  position: UnitPosition;
  direction?: string;
  view?: string;
  floorStart: number;
  floorEnd?: number;
  layoutId: string;
  layout?: InteriorUnitLayout;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildingUnitInput {
  buildingId: string;
  axis: string;
  unitType: UnitType;
  bedrooms: number;
  bathrooms?: number;
  position?: UnitPosition;
  direction?: string;
  view?: string;
  floorStart?: number;
  floorEnd?: number;
  layoutId: string;
  notes?: string;
  isActive?: boolean;
}

export type UpdateBuildingUnitInput = Partial<Omit<CreateBuildingUnitInput, 'buildingId'>>;

// ========== LAYOUT ==========

export interface LayoutRoom {
  name: string;
  area: number;
  type: RoomType;
}

export interface InteriorUnitLayout {
  id: string;
  name: string;
  code: string;
  unitType: UnitType;
  bedrooms: number;
  bathrooms: number;
  grossArea: number;
  netArea: number;
  carpetArea?: number;
  balconyArea?: number;
  terraceArea?: number;
  rooms: LayoutRoom[];
  layoutImage?: string;
  layout3DImage?: string;
  dimensionImage?: string;
  description?: string;
  highlights?: string[];
  isActive: boolean;
  packageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLayoutInput {
  name: string;
  code: string;
  unitType: UnitType;
  bedrooms: number;
  bathrooms?: number;
  grossArea: number;
  netArea: number;
  carpetArea?: number;
  balconyArea?: number;
  terraceArea?: number;
  rooms?: LayoutRoom[];
  layoutImage?: string;
  layout3DImage?: string;
  dimensionImage?: string;
  description?: string;
  highlights?: string[];
  isActive?: boolean;
}

export type UpdateLayoutInput = Partial<CreateLayoutInput>;

// ========== PACKAGE ==========

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

export interface InteriorPackage {
  id: string;
  layoutId: string;
  layout?: InteriorUnitLayout;
  name: string;
  code: string;
  tier: 1 | 2 | 3 | 4;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  pricePerSqm?: number;
  thumbnail?: string;
  images?: string[];
  video360Url?: string;
  items: PackageRoomItems[];
  totalItems?: number;
  totalItemsPrice?: number;
  warrantyMonths?: number;
  installationDays?: number;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageInput {
  layoutId: string;
  name: string;
  code: string;
  tier?: 1 | 2 | 3 | 4;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  pricePerSqm?: number;
  thumbnail?: string;
  images?: string[];
  video360Url?: string;
  items?: PackageRoomItems[];
  warrantyMonths?: number;
  installationDays?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdatePackageInput extends Partial<Omit<CreatePackageInput, 'layoutId'>> {
  order?: number;
}


// ========== SURCHARGE ==========

export interface SurchargeConditions {
  minFloor?: number;
  maxFloor?: number;
  minArea?: number;
  maxArea?: number;
  unitTypes?: UnitType[];
  positions?: UnitPosition[];
  buildings?: string[];
  developments?: string[];
}

export interface InteriorSurcharge {
  id: string;
  name: string;
  code: string;
  type: SurchargeType;
  value: number;
  conditions?: SurchargeConditions;
  description?: string;
  isAutoApply: boolean;
  isOptional: boolean;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSurchargeInput {
  name: string;
  code: string;
  type: SurchargeType;
  value: number;
  conditions?: SurchargeConditions;
  description?: string;
  isAutoApply?: boolean;
  isOptional?: boolean;
  isActive?: boolean;
}

export interface UpdateSurchargeInput extends Partial<CreateSurchargeInput> {
  order?: number;
}

// ========== QUOTE SETTINGS ==========

export interface InteriorQuoteSettings {
  id: string;
  laborCostPerSqm: number;
  laborCostMin?: number;
  laborCostMax?: number;
  managementFeeType: InteriorFeeType;
  managementFeeValue: number;
  contingencyType: InteriorFeeType;
  contingencyValue: number;
  vatEnabled: boolean;
  vatPercent: number;
  maxDiscountPercent?: number;
  quoteValidityDays: number;
  customFormula?: string;
  showItemBreakdown: boolean;
  showRoomBreakdown: boolean;
  showPricePerSqm: boolean;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateQuoteSettingsInput {
  laborCostPerSqm?: number;
  laborCostMin?: number;
  laborCostMax?: number;
  managementFeeType?: InteriorFeeType;
  managementFeeValue?: number;
  contingencyType?: InteriorFeeType;
  contingencyValue?: number;
  vatEnabled?: boolean;
  vatPercent?: number;
  maxDiscountPercent?: number;
  quoteValidityDays?: number;
  customFormula?: string;
  showItemBreakdown?: boolean;
  showRoomBreakdown?: boolean;
  showPricePerSqm?: boolean;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
}

// ========== ROOM TYPE ==========

export interface InteriorRoomType {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  icon?: string;
  description?: string;
  defaultCategories?: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomTypeInput {
  code: string;
  name: string;
  nameEn?: string;
  icon?: string;
  description?: string;
  defaultCategories?: string[];
  isActive?: boolean;
}

export interface UpdateRoomTypeInput extends Partial<CreateRoomTypeInput> {
  order?: number;
}

// ========== FURNITURE ==========

export interface InteriorFurnitureCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  parentId?: string;
  parent?: InteriorFurnitureCategory;
  children?: InteriorFurnitureCategory[];
  roomTypes?: string[];
  order: number;
  isActive: boolean;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFurnitureCategoryInput {
  name: string;
  icon?: string;
  description?: string;
  parentId?: string;
  roomTypes?: string[];
  isActive?: boolean;
}

export interface UpdateFurnitureCategoryInput extends Partial<CreateFurnitureCategoryInput> {
  order?: number;
}

export interface FurnitureDimensions {
  width?: number;
  height?: number;
  depth?: number;
  unit?: string;
}

export interface InteriorFurnitureItem {
  id: string;
  categoryId: string;
  category?: InteriorFurnitureCategory;
  name: string;
  sku?: string;
  brand?: string;
  origin?: string;
  material?: string;
  color?: string;
  dimensions?: FurnitureDimensions;
  weight?: number;
  price: number;
  costPrice?: number;
  thumbnail?: string;
  images?: string[];
  description?: string;
  features?: string[];
  warrantyMonths?: number;
  inStock: boolean;
  stockQty?: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFurnitureItemInput {
  categoryId: string;
  name: string;
  sku?: string;
  brand?: string;
  origin?: string;
  material?: string;
  color?: string;
  dimensions?: FurnitureDimensions;
  weight?: number;
  price: number;
  costPrice?: number;
  thumbnail?: string;
  images?: string[];
  description?: string;
  features?: string[];
  warrantyMonths?: number;
  inStock?: boolean;
  stockQty?: number;
  isActive?: boolean;
}

export interface UpdateFurnitureItemInput extends Partial<Omit<CreateFurnitureItemInput, 'categoryId'>> {
  categoryId?: string;
  order?: number;
}

// ========== QUOTE ==========

export interface AppliedSurcharge {
  name: string;
  amount: number;
}

export interface InteriorQuote {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
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
  package?: InteriorPackage;
  packageName: string;
  packageTier: number;
  packagePrice: number;
  laborCost: number;
  surcharges?: AppliedSurcharge[];
  surchargesTotal: number;
  managementFee: number;
  contingency: number;
  subtotal: number;
  vatAmount: number;
  discount: number;
  grandTotal: number;
  pricePerSqm?: number;
  status: QuoteStatus;
  validUntil?: string;
  notes?: string;
  internalNotes?: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteListItem {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  developmentName: string;
  buildingName: string;
  unitCode: string;
  packageName: string;
  grandTotal: number;
  status: QuoteStatus;
  createdAt: string;
}

// ========== PAGINATION ==========

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
