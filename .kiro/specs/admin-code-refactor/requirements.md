# Requirements Document

## Introduction

Refactor các file lớn trong Admin app để cải thiện maintainability, readability và tuân thủ cấu trúc dự án đã thiết lập. Mục tiêu là tách các file >500 lines thành các components nhỏ hơn, có tổ chức theo folder structure nhất quán.

## Glossary

- **Page**: Component chính đại diện cho một route trong admin app
- **Tab**: Component con của Page, hiển thị trong tab navigation
- **Modal**: Component popup/dialog
- **Table**: Component hiển thị danh sách dữ liệu
- **Form**: Component nhập liệu
- **Folder-based structure**: Cấu trúc tổ chức code theo folder với index.tsx, types.ts, và các components con

## Requirements

### Requirement 1: Refactor LeadsPage

**User Story:** As a developer, I want LeadsPage to follow folder-based structure, so that the code is easier to maintain and extend.

#### Acceptance Criteria

1. WHEN refactoring LeadsPage THEN the system SHALL create a `LeadsPage/` folder with `index.tsx` as the main entry point
2. WHEN refactoring LeadsPage THEN the system SHALL extract `QuoteDataDisplay` component into `LeadsPage/components/QuoteDataDisplay.tsx`
3. WHEN refactoring LeadsPage THEN the system SHALL extract `NotesEditor` component into `LeadsPage/components/NotesEditor.tsx`
4. WHEN refactoring LeadsPage THEN the system SHALL extract `StatusHistory` component into `LeadsPage/components/StatusHistory.tsx`
5. WHEN refactoring LeadsPage THEN the system SHALL extract `FurnitureQuotationHistory` component into `LeadsPage/components/FurnitureQuotationHistory.tsx`
6. WHEN refactoring LeadsPage THEN the system SHALL extract `LeadDetailModal` component into `LeadsPage/components/LeadDetailModal.tsx`
7. WHEN refactoring LeadsPage THEN the system SHALL create `LeadsPage/types.ts` for shared type definitions
8. WHEN refactoring is complete THEN the main `index.tsx` file SHALL be under 400 lines

### Requirement 2: Refactor UsersPage

**User Story:** As a developer, I want UsersPage to follow folder-based structure, so that the code is easier to maintain and extend.

#### Acceptance Criteria

1. WHEN refactoring UsersPage THEN the system SHALL create a `UsersPage/` folder with `index.tsx` as the main entry point
2. WHEN refactoring UsersPage THEN the system SHALL extract `UserTable` component into `UsersPage/components/UserTable.tsx`
3. WHEN refactoring UsersPage THEN the system SHALL extract `CreateUserModal` component into `UsersPage/components/CreateUserModal.tsx`
4. WHEN refactoring UsersPage THEN the system SHALL extract `EditUserModal` component into `UsersPage/components/EditUserModal.tsx`
5. WHEN refactoring UsersPage THEN the system SHALL extract `SessionsModal` component into `UsersPage/components/SessionsModal.tsx`
6. WHEN refactoring UsersPage THEN the system SHALL create `UsersPage/types.ts` for shared type definitions
7. WHEN refactoring is complete THEN the main `index.tsx` file SHALL be under 300 lines

### Requirement 3: Refactor SectionEditor Forms

**User Story:** As a developer, I want SectionEditor forms to be organized by section type, so that adding new section types is easier.

#### Acceptance Criteria

1. WHEN refactoring SectionEditor THEN the system SHALL create a `forms/` subfolder inside `SectionEditor/`
2. WHEN refactoring SectionEditor THEN the system SHALL extract each section form into its own file (e.g., `forms/HeroForm.tsx`, `forms/CTAForm.tsx`)
3. WHEN refactoring SectionEditor THEN the system SHALL create `forms/index.tsx` that exports a `renderFormFields` function
4. WHEN refactoring SectionEditor THEN the system SHALL extract shared form components (`InfoBanner`, `ImageSection`, `ArraySection`, etc.) into `forms/shared/`
5. WHEN refactoring is complete THEN each form file SHALL be under 200 lines
6. WHEN refactoring is complete THEN the original `forms.tsx` SHALL be replaced by the new folder structure

### Requirement 4: Refactor SectionEditor Previews

**User Story:** As a developer, I want SectionEditor previews to be organized by section type, so that adding new section types is easier.

#### Acceptance Criteria

1. WHEN refactoring SectionEditor THEN the system SHALL create a `previews/` subfolder inside `SectionEditor/`
2. WHEN refactoring SectionEditor THEN the system SHALL extract each section preview into its own file (e.g., `previews/HeroPreview.tsx`, `previews/CTAPreview.tsx`)
3. WHEN refactoring SectionEditor THEN the system SHALL create `previews/index.tsx` that exports a `renderPreview` function
4. WHEN refactoring is complete THEN each preview file SHALL be under 150 lines
5. WHEN refactoring is complete THEN the original `previews.tsx` SHALL be replaced by the new folder structure

### Requirement 5: Refactor SettingsPage LayoutTab

**User Story:** As a developer, I want LayoutTab to be split into smaller components, so that header and footer editing are easier to maintain.

#### Acceptance Criteria

1. WHEN refactoring LayoutTab THEN the system SHALL extract `HeaderEditor` component into `SettingsPage/components/HeaderEditor.tsx`
2. WHEN refactoring LayoutTab THEN the system SHALL extract `FooterEditor` component into `SettingsPage/components/FooterEditor.tsx`
3. WHEN refactoring LayoutTab THEN the system SHALL extract `NavigationEditor` component into `SettingsPage/components/NavigationEditor.tsx`
4. WHEN refactoring is complete THEN the main `LayoutTab.tsx` file SHALL be under 400 lines

### Requirement 6: Refactor FurniturePage Tabs

**User Story:** As a developer, I want FurniturePage tabs to have smaller, focused components, so that the code is easier to understand.

#### Acceptance Criteria

1. WHEN refactoring CatalogTab THEN the system SHALL extract `CategoryList` component into `FurniturePage/components/CategoryList.tsx`
2. WHEN refactoring CatalogTab THEN the system SHALL extract `ProductGrid` component into `FurniturePage/components/ProductGrid.tsx`
3. WHEN refactoring CatalogTab THEN the system SHALL extract `CategoryForm` and `ProductForm` modals into separate files
4. WHEN refactoring ComboTab THEN the system SHALL extract `ComboTable` component into `FurniturePage/components/ComboTable.tsx`
5. WHEN refactoring ComboTab THEN the system SHALL extract `ComboForm` modal into `FurniturePage/components/ComboForm.tsx`
6. WHEN refactoring is complete THEN each Tab file SHALL be under 500 lines

### Requirement 7: Refactor Landing FurnitureQuote

**User Story:** As a developer, I want FurnitureQuote section to have smaller, reusable components, so that the wizard flow is easier to maintain.

#### Acceptance Criteria

1. WHEN refactoring FurnitureQuote THEN the system SHALL extract `SelectionCard` component into `FurnitureQuote/components/SelectionCard.tsx`
2. WHEN refactoring FurnitureQuote THEN the system SHALL extract `NavigationButtons` component into `FurnitureQuote/components/NavigationButtons.tsx`
3. WHEN refactoring FurnitureQuote THEN the system SHALL extract `StepIndicator` component into `FurnitureQuote/components/StepIndicator.tsx`
4. WHEN refactoring FurnitureQuote THEN the system SHALL create `FurnitureQuote/types.ts` for shared type definitions
5. WHEN refactoring is complete THEN the main `index.tsx` file SHALL be under 600 lines

### Requirement 8: Code Quality Standards

**User Story:** As a developer, I want all refactored code to maintain existing functionality and pass all quality checks.

#### Acceptance Criteria

1. WHEN refactoring any file THEN the system SHALL maintain all existing functionality without breaking changes
2. WHEN refactoring any file THEN the system SHALL pass lint checks with 0 errors and 0 warnings
3. WHEN refactoring any file THEN the system SHALL pass TypeScript type checks with 0 errors
4. WHEN refactoring any file THEN the system SHALL use `tokens` from `@app/shared` for all styling
5. WHEN refactoring any file THEN the system SHALL use Remix Icon (`ri-*`) for all icons
6. WHEN refactoring any file THEN the system SHALL follow existing naming conventions (PascalCase for components, camelCase for functions)
