import { z } from 'zod';

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const UnitType = z.enum([
  'STUDIO',
  '1PN',
  '2PN',
  '3PN',
  '4PN',
  'PENTHOUSE',
  'DUPLEX',
  'SHOPHOUSE',
]);

export const UnitPosition = z.enum(['CORNER', 'EDGE', 'MIDDLE']);

export const UnitDirection = z.enum([
  'ĐÔNG',
  'TÂY',
  'NAM',
  'BẮC',
  'ĐÔNG_NAM',
  'ĐÔNG_BẮC',
  'TÂY_NAM',
  'TÂY_BẮC',
]);

export const UnitView = z.enum([
  'VIEW_POOL',
  'VIEW_PARK',
  'VIEW_CITY',
  'VIEW_RIVER',
]);

export const SurchargeType = z.enum([
  'FIXED',
  'PERCENTAGE',
  'PER_FLOOR',
  'PER_SQM',
  'CONDITIONAL',
]);

export const FeeType = z.enum(['FIXED', 'PERCENTAGE']);

export const QuoteStatus = z.enum([
  'DRAFT',
  'SENT',
  'VIEWED',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
]);

export const SpecialFloorType = z.enum([
  'PENTHOUSE',
  'DUPLEX',
  'SHOPHOUSE',
  'COMMERCIAL',
]);

export const RoomType = z.enum([
  'LIVING',
  'BEDROOM',
  'BEDROOM_MASTER',
  'KITCHEN',
  'BATHROOM',
  'BATHROOM_ENSUITE',
  'BALCONY',
  'TERRACE',
  'STORAGE',
  'DINING',
  'OTHER',
]);

// ============================================
// DEVELOPER SCHEMAS
// ============================================

export const CreateDeveloperSchema = z.object({
  name: z.string().min(1, 'Tên chủ đầu tư là bắt buộc').max(200),
  logo: z.string().url().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  website: z.string().url().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateDeveloperSchema = CreateDeveloperSchema.partial();

export const ReorderDevelopersSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    })
  ),
});

// ============================================
// DEVELOPMENT SCHEMAS
// ============================================

export const CreateDevelopmentSchema = z.object({
  developerId: z.string().min(1, 'Chủ đầu tư là bắt buộc'),
  name: z.string().min(1, 'Tên dự án là bắt buộc').max(200),
  code: z.string().min(1, 'Mã dự án là bắt buộc').max(50),
  address: z.string().max(500).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional().nullable(),
  totalBuildings: z.number().int().min(0).optional().nullable(),
  totalUnits: z.number().int().min(0).optional().nullable(),
  startYear: z.number().int().min(1900).max(2100).optional().nullable(),
  completionYear: z.number().int().min(1900).max(2100).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateDevelopmentSchema = CreateDevelopmentSchema.partial().omit({
  developerId: true,
});

export const ListDevelopmentsQuerySchema = z.object({
  developerId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ============================================
// BUILDING SCHEMAS
// ============================================

export const SpecialFloorSchema = z.object({
  floor: z.number().int(),
  type: SpecialFloorType,
  note: z.string().optional(),
});

export const CreateBuildingSchema = z.object({
  developmentId: z.string().min(1, 'Dự án là bắt buộc'),
  name: z.string().min(1, 'Tên tòa nhà là bắt buộc').max(100),
  code: z.string().min(1, 'Mã tòa nhà là bắt buộc').max(20),
  totalFloors: z.number().int().min(1, 'Số tầng phải >= 1').max(200),
  startFloor: z.number().int().min(-10).max(200).optional().default(1),
  endFloor: z.number().int().min(-10).max(200).optional().nullable(),
  axisLabels: z.array(z.string().min(1).max(10)).min(1, 'Phải có ít nhất 1 trục'),
  unitsPerFloor: z.number().int().min(1),
  unitCodeFormat: z.string().optional().default('{building}.{floor}.{axis}'),
  specialFloors: z.array(SpecialFloorSchema).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  floorPlanImage: z.string().url().optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateBuildingSchema = CreateBuildingSchema.partial().omit({
  developmentId: true,
});

export const ListBuildingsQuerySchema = z.object({
  developmentId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});


// ============================================
// BUILDING UNIT SCHEMAS
// ============================================

export const CreateBuildingUnitSchema = z.object({
  buildingId: z.string().min(1, 'Tòa nhà là bắt buộc'),
  axis: z.string().min(1, 'Trục là bắt buộc').max(10),
  unitType: UnitType,
  bedrooms: z.number().int().min(0).max(10),
  bathrooms: z.number().int().min(1).max(10).optional().default(1),
  position: UnitPosition.optional().default('MIDDLE'),
  direction: UnitDirection.optional().nullable(),
  view: UnitView.optional().nullable(),
  floorStart: z.number().int().min(-10).max(200).optional().default(1),
  floorEnd: z.number().int().min(-10).max(200).optional().nullable(),
  layoutId: z.string().min(1, 'Layout là bắt buộc'),
  notes: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const UpdateBuildingUnitSchema = CreateBuildingUnitSchema.partial().omit({
  buildingId: true,
});

export const BulkImportUnitsSchema = z.object({
  buildingId: z.string().min(1),
  units: z.array(
    z.object({
      axis: z.string().min(1).max(10),
      unitType: UnitType,
      bedrooms: z.number().int().min(0).max(10),
      bathrooms: z.number().int().min(1).max(10).optional(),
      position: UnitPosition.optional(),
      direction: UnitDirection.optional().nullable(),
      view: UnitView.optional().nullable(),
      floorStart: z.number().int().optional(),
      floorEnd: z.number().int().optional().nullable(),
      layoutCode: z.string().min(1), // Will be resolved to layoutId
      notes: z.string().optional().nullable(),
    })
  ),
});

// ============================================
// LAYOUT SCHEMAS
// ============================================

export const LayoutRoomSchema = z.object({
  name: z.string().min(1, 'Tên phòng là bắt buộc').max(100),
  area: z.number().min(0, 'Diện tích phải >= 0'),
  type: RoomType,
});

export const CreateLayoutSchema = z.object({
  name: z.string().min(1, 'Tên layout là bắt buộc').max(200),
  code: z.string().min(1, 'Mã layout là bắt buộc').max(50),
  unitType: UnitType,
  bedrooms: z.number().int().min(0).max(10),
  bathrooms: z.number().int().min(1).max(10).optional().default(1),
  grossArea: z.number().min(1, 'Diện tích tim tường phải > 0'),
  netArea: z.number().min(1, 'Diện tích thông thủy phải > 0'),
  carpetArea: z.number().min(0).optional().nullable(),
  balconyArea: z.number().min(0).optional().nullable(),
  terraceArea: z.number().min(0).optional().nullable(),
  rooms: z.array(LayoutRoomSchema).min(1, 'Phải có ít nhất 1 phòng'),
  layoutImage: z.string().url().optional().nullable(),
  layout3DImage: z.string().url().optional().nullable(),
  dimensionImage: z.string().url().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  highlights: z.array(z.string().max(100)).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const UpdateLayoutSchema = CreateLayoutSchema.partial();

export const CloneLayoutSchema = z.object({
  newCode: z.string().min(1, 'Mã layout mới là bắt buộc').max(50),
  newName: z.string().min(1, 'Tên layout mới là bắt buộc').max(200),
});

export const ListLayoutsQuerySchema = z.object({
  unitType: UnitType.optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ============================================
// PACKAGE SCHEMAS
// ============================================

export const PackageItemSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc').max(200),
  brand: z.string().max(100).optional().nullable(),
  material: z.string().max(200).optional().nullable(),
  qty: z.number().int().min(1, 'Số lượng phải >= 1'),
  price: z.number().min(0, 'Giá phải >= 0'),
});

export const PackageRoomItemsSchema = z.object({
  room: z.string().min(1, 'Tên phòng là bắt buộc').max(100),
  items: z.array(PackageItemSchema),
});

export const CreatePackageSchema = z.object({
  layoutId: z.string().min(1, 'Layout là bắt buộc'),
  name: z.string().min(1, 'Tên gói là bắt buộc').max(200),
  code: z.string().min(1, 'Mã gói là bắt buộc').max(50),
  tier: z.number().int().min(1).max(4).optional().default(1),
  description: z.string().max(5000).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  basePrice: z.number().min(0, 'Giá cơ bản phải >= 0'),
  pricePerSqm: z.number().min(0).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional().nullable(),
  video360Url: z.string().url().optional().nullable(),
  items: z.array(PackageRoomItemsSchema).min(1, 'Phải có ít nhất 1 phòng'),
  warrantyMonths: z.number().int().min(0).optional().nullable(),
  installationDays: z.number().int().min(0).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const UpdatePackageSchema = CreatePackageSchema.partial().omit({
  layoutId: true,
});

export const ClonePackageSchema = z.object({
  targetLayoutId: z.string().min(1, 'Layout đích là bắt buộc'),
  newCode: z.string().min(1, 'Mã gói mới là bắt buộc').max(50),
  newName: z.string().min(1, 'Tên gói mới là bắt buộc').max(200),
  priceAdjustment: z.number().optional().default(0), // Percentage adjustment
});

export const ListPackagesQuerySchema = z.object({
  layoutId: z.string().optional(),
  tier: z.coerce.number().int().min(1).max(4).optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ============================================
// FURNITURE CATALOG SCHEMAS
// ============================================

export const CreateFurnitureCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục là bắt buộc').max(100),
  icon: z.string().max(50).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().optional().nullable(),
  roomTypes: z.array(z.string()).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateFurnitureCategorySchema = CreateFurnitureCategorySchema.partial();

export const FurnitureDimensionsSchema = z.object({
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  depth: z.number().min(0).optional(),
  unit: z.enum(['cm', 'mm', 'm']).optional().default('cm'),
});

export const CreateFurnitureItemSchema = z.object({
  categoryId: z.string().min(1, 'Danh mục là bắt buộc'),
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc').max(200),
  sku: z.string().max(50).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  origin: z.string().max(100).optional().nullable(),
  material: z.string().max(200).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  dimensions: FurnitureDimensionsSchema.optional().nullable(),
  weight: z.number().min(0).optional().nullable(),
  price: z.number().min(0, 'Giá phải >= 0'),
  costPrice: z.number().min(0).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  features: z.array(z.string().max(200)).optional().nullable(),
  warrantyMonths: z.number().int().min(0).optional().nullable(),
  inStock: z.boolean().optional(),
  stockQty: z.number().int().min(0).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateFurnitureItemSchema = CreateFurnitureItemSchema.partial().omit({
  categoryId: true,
});

export const ListFurnitureItemsQuerySchema = z.object({
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});


// ============================================
// SURCHARGE SCHEMAS
// ============================================

export const SurchargeConditionsSchema = z.object({
  minFloor: z.number().int().optional().nullable(),
  maxFloor: z.number().int().optional().nullable(),
  minArea: z.number().min(0).optional().nullable(),
  maxArea: z.number().min(0).optional().nullable(),
  unitTypes: z.array(UnitType).optional().nullable(),
  positions: z.array(UnitPosition).optional().nullable(),
  buildings: z.array(z.string()).optional().nullable(),
  developments: z.array(z.string()).optional().nullable(),
});

export const CreateSurchargeSchema = z.object({
  name: z.string().min(1, 'Tên phụ phí là bắt buộc').max(200),
  code: z.string().min(1, 'Mã phụ phí là bắt buộc').max(50),
  type: SurchargeType,
  value: z.number().min(0, 'Giá trị phải >= 0'),
  conditions: SurchargeConditionsSchema.optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  isAutoApply: z.boolean().optional(),
  isOptional: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSurchargeSchema = CreateSurchargeSchema.partial();

export const TestSurchargeSchema = z.object({
  surchargeId: z.string().min(1),
  testData: z.object({
    floor: z.number().int().optional(),
    area: z.number().min(0).optional(),
    unitType: UnitType.optional(),
    position: UnitPosition.optional(),
    buildingId: z.string().optional(),
    developmentId: z.string().optional(),
  }),
});

// ============================================
// QUOTE SETTINGS SCHEMAS
// ============================================

export const UpdateQuoteSettingsSchema = z.object({
  laborCostPerSqm: z.number().min(0).optional(),
  laborCostMin: z.number().min(0).optional().nullable(),
  laborCostMax: z.number().min(0).optional().nullable(),
  managementFeeType: FeeType.optional(),
  managementFeeValue: z.number().min(0).optional(),
  contingencyType: FeeType.optional(),
  contingencyValue: z.number().min(0).optional(),
  vatEnabled: z.boolean().optional(),
  vatPercent: z.number().min(0).max(100).optional(),
  maxDiscountPercent: z.number().min(0).max(100).optional().nullable(),
  quoteValidityDays: z.number().int().min(1).max(365).optional(),
  customFormula: z.string().max(1000).optional().nullable(),
  showItemBreakdown: z.boolean().optional(),
  showRoomBreakdown: z.boolean().optional(),
  showPricePerSqm: z.boolean().optional(),
  companyName: z.string().max(200).optional().nullable(),
  companyPhone: z.string().max(20).optional().nullable(),
  companyEmail: z.string().email().optional().nullable(),
  companyAddress: z.string().max(500).optional().nullable(),
});

// ============================================
// ROOM TYPE SCHEMAS
// ============================================

export const CreateRoomTypeSchema = z.object({
  code: z.string().min(1, 'Mã loại phòng là bắt buộc').max(50),
  name: z.string().min(1, 'Tên loại phòng là bắt buộc').max(100),
  nameEn: z.string().max(100).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  defaultCategories: z.array(z.string()).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateRoomTypeSchema = CreateRoomTypeSchema.partial();

export const ReorderRoomTypesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    })
  ),
});

// ============================================
// QUOTE CALCULATION SCHEMAS
// ============================================

export const CalculateQuoteSchema = z.object({
  buildingUnitId: z.string().min(1, 'Căn hộ là bắt buộc'),
  floor: z.number().int().min(-10).max(200),
  packageId: z.string().min(1, 'Gói nội thất là bắt buộc'),
  discount: z.number().min(0).max(100).optional().default(0),
});

export const SaveQuoteSchema = z.object({
  buildingUnitId: z.string().min(1, 'Căn hộ là bắt buộc'),
  floor: z.number().int().min(-10).max(200),
  packageId: z.string().min(1, 'Gói nội thất là bắt buộc'),
  discount: z.number().min(0).max(100).optional().default(0),
  customerName: z.string().min(1, 'Tên khách hàng là bắt buộc').max(200),
  customerPhone: z.string().min(1, 'Số điện thoại là bắt buộc').max(20),
  customerEmail: z.string().email().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const ListQuotesQuerySchema = z.object({
  status: QuoteStatus.optional(),
  developmentName: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const UpdateQuoteStatusSchema = z.object({
  status: QuoteStatus,
  internalNotes: z.string().max(2000).optional().nullable(),
  rejectionReason: z.string().max(1000).optional().nullable(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateDeveloperInput = z.infer<typeof CreateDeveloperSchema>;
export type UpdateDeveloperInput = z.infer<typeof UpdateDeveloperSchema>;
export type CreateDevelopmentInput = z.infer<typeof CreateDevelopmentSchema>;
export type UpdateDevelopmentInput = z.infer<typeof UpdateDevelopmentSchema>;
export type CreateBuildingInput = z.infer<typeof CreateBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof UpdateBuildingSchema>;
export type CreateBuildingUnitInput = z.infer<typeof CreateBuildingUnitSchema>;
export type UpdateBuildingUnitInput = z.infer<typeof UpdateBuildingUnitSchema>;
export type CreateLayoutInput = z.infer<typeof CreateLayoutSchema>;
export type UpdateLayoutInput = z.infer<typeof UpdateLayoutSchema>;
export type CreatePackageInput = z.infer<typeof CreatePackageSchema>;
export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>;
export type CreateFurnitureCategoryInput = z.infer<typeof CreateFurnitureCategorySchema>;
export type UpdateFurnitureCategoryInput = z.infer<typeof UpdateFurnitureCategorySchema>;
export type CreateFurnitureItemInput = z.infer<typeof CreateFurnitureItemSchema>;
export type UpdateFurnitureItemInput = z.infer<typeof UpdateFurnitureItemSchema>;
export type CreateSurchargeInput = z.infer<typeof CreateSurchargeSchema>;
export type UpdateSurchargeInput = z.infer<typeof UpdateSurchargeSchema>;
export type UpdateQuoteSettingsInput = z.infer<typeof UpdateQuoteSettingsSchema>;
export type CreateRoomTypeInput = z.infer<typeof CreateRoomTypeSchema>;
export type UpdateRoomTypeInput = z.infer<typeof UpdateRoomTypeSchema>;
export type CalculateQuoteInput = z.infer<typeof CalculateQuoteSchema>;
export type SaveQuoteInput = z.infer<typeof SaveQuoteSchema>;
export type UpdateQuoteStatusInput = z.infer<typeof UpdateQuoteStatusSchema>;
export type LayoutRoom = z.infer<typeof LayoutRoomSchema>;
export type PackageItem = z.infer<typeof PackageItemSchema>;
export type PackageRoomItems = z.infer<typeof PackageRoomItemsSchema>;
export type SurchargeConditions = z.infer<typeof SurchargeConditionsSchema>;
export type FurnitureDimensions = z.infer<typeof FurnitureDimensionsSchema>;
