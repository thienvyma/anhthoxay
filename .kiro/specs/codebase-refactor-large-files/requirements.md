# Requirements Document

## Introduction

Codebase hiện tại có nhiều file quá dài (>500 lines), gây khó maintain, khó test, và vi phạm Single Responsibility Principle. Spec này định nghĩa yêu cầu refactor các file lớn thành modules nhỏ hơn, dễ quản lý hơn.

## Glossary

- **Block**: Đơn vị nội dung trong VisualBlockEditor (heading, paragraph, list, etc.)
- **Step**: Bước trong wizard FurnitureQuote (chọn developer, project, building, etc.)
- **Endpoint Group**: Nhóm API endpoints theo domain (leads, blog, projects, etc.)
- **Re-export**: Pattern export từ index.ts để giữ backward compatibility

## Requirements

### Requirement 1: Refactor VisualBlockEditor (1589 lines)

**User Story:** As a developer, I want VisualBlockEditor to be split into smaller modules, so that I can maintain and test each block type independently.

#### Acceptance Criteria

1. WHEN the VisualBlockEditor folder is created THEN the system SHALL contain separate files for types, constants, utils, and main component
2. WHEN a block type is rendered THEN the system SHALL use a dedicated component from the blocks/ folder
3. WHEN importing VisualBlockEditor from external files THEN the system SHALL maintain backward compatibility via re-exports
4. WHEN the refactor is complete THEN the main index.tsx SHALL contain less than 300 lines
5. WHEN the refactor is complete THEN each block component SHALL contain less than 150 lines

### Requirement 2: Refactor ApiKeyDetailPanel (1138 lines)

**User Story:** As a developer, I want ApiKeyDetailPanel to be split into logical sections, so that I can modify each section without affecting others.

#### Acceptance Criteria

1. WHEN the ApiKeyDetailPanel folder is created THEN the system SHALL contain separate files for InfoSection, UsageStats, UsageLogs, and EndpointGroups
2. WHEN utility functions are extracted THEN the system SHALL place them in a dedicated utils.ts file
3. WHEN the refactor is complete THEN the main index.tsx SHALL contain less than 250 lines
4. WHEN the refactor is complete THEN each section component SHALL contain less than 200 lines

### Requirement 3: Refactor FurnitureQuote (1820 lines)

**User Story:** As a developer, I want FurnitureQuote to use custom hooks and step components, so that I can manage state and UI separately.

#### Acceptance Criteria

1. WHEN data fetching logic is extracted THEN the system SHALL create useFurnitureData hook
2. WHEN selection state is extracted THEN the system SHALL create useSelections hook
3. WHEN quotation logic is extracted THEN the system SHALL create useQuotation hook
4. WHEN step UI is extracted THEN the system SHALL create separate components in steps/ folder
5. WHEN the refactor is complete THEN the main index.tsx SHALL contain less than 350 lines
6. WHEN the refactor is complete THEN each step component SHALL contain less than 200 lines

### Requirement 4: Refactor RichTextSection (1024 lines)

**User Story:** As a developer, I want RichTextSection to have separate block renderers, so that I can add new block types easily.

#### Acceptance Criteria

1. WHEN the RichTextSection folder is created THEN the system SHALL contain separate files for types, utils, and BlockRenderer
2. WHEN a block type is rendered THEN the system SHALL use a dedicated component from the blocks/ folder
3. WHEN the refactor is complete THEN the main index.tsx SHALL contain less than 200 lines
4. WHEN the refactor is complete THEN each block component SHALL contain less than 100 lines

### Requirement 5: Refactor external-api.routes.ts (2076 lines)

**User Story:** As a developer, I want external API routes to be split by domain, so that I can find and modify endpoints quickly.

#### Acceptance Criteria

1. WHEN the external-api folder is created THEN the system SHALL contain separate route files for each domain (leads, blog, projects, contractors, reports, pricing, furniture, media, settings)
2. WHEN schemas are extracted THEN the system SHALL place them in a dedicated schemas.ts file
3. WHEN the main router is created THEN the system SHALL mount all sub-routes correctly
4. WHEN importing createExternalApiRoutes from main.ts THEN the system SHALL maintain backward compatibility
5. WHEN the refactor is complete THEN the main index.ts SHALL contain less than 100 lines
6. WHEN the refactor is complete THEN each route file SHALL contain less than 300 lines

### Requirement 6: Refactor Layout.tsx (901 lines)

**User Story:** As a developer, I want Layout to be split into Sidebar, Header, and MenuItem components, so that I can modify navigation independently.

#### Acceptance Criteria

1. WHEN the Layout folder is created THEN the system SHALL contain separate files for Sidebar, Header, MenuItem, and DropdownMenu
2. WHEN navigation logic is extracted THEN the system SHALL create useNavigation hook
3. WHEN menu configuration is extracted THEN the system SHALL place it in constants.ts
4. WHEN the refactor is complete THEN the main index.tsx SHALL contain less than 200 lines
5. WHEN the refactor is complete THEN each component SHALL contain less than 250 lines

### Requirement 7: Refactor project.service.ts (978 lines)

**User Story:** As a developer, I want ProjectService to be split by responsibility, so that I can test CRUD, status transitions, and queries separately.

#### Acceptance Criteria

1. WHEN the project folder is created THEN the system SHALL contain separate files for crud, status, and query services
2. WHEN types are extracted THEN the system SHALL place them in types.ts
3. WHEN constants are extracted THEN the system SHALL place PROJECT_STATUS_TRANSITIONS in constants.ts
4. WHEN the refactor is complete THEN each service file SHALL contain less than 300 lines
5. WHEN importing ProjectService THEN the system SHALL maintain backward compatibility via re-exports

### Requirement 8: Refactor furniture.routes.ts (935 lines)

**User Story:** As a developer, I want furniture routes to be split by entity, so that I can find and modify endpoints quickly.

#### Acceptance Criteria

1. WHEN the furniture routes folder is created THEN the system SHALL contain separate route files for category, product, quotation, developer, layout, and admin
2. WHEN the main router is created THEN the system SHALL mount all sub-routes correctly
3. WHEN the refactor is complete THEN the main index.ts SHALL contain less than 100 lines
4. WHEN the refactor is complete THEN each route file SHALL contain less than 200 lines

## Constraints

- THE system SHALL NOT change public API/interfaces
- THE system SHALL maintain backward compatibility via re-exports from index.ts
- THE system SHALL NOT introduce breaking changes for existing functionality
- THE system SHALL follow existing patterns trong codebase
- THE system SHALL pass lint + typecheck with 0 errors, 0 warnings after refactor

## Success Criteria

- Tất cả files trong Phase 1 (REQ 1-5) < 400 lines
- Tất cả files trong Phase 2 (REQ 6-8) < 500 lines
- Lint + Typecheck pass (0 errors, 0 warnings)
- Existing tests vẫn pass
- Manual testing confirms no regression
