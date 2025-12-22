# Requirements Document

## Introduction

Chuẩn hóa codebase Portal app để đảm bảo tính nhất quán với các phần khác của dự án (admin, landing). Tập trung vào việc refactor inline styles sang CSS classes/variables, tạo barrel exports, và thống nhất export patterns.

## Glossary

- **Portal**: Ứng dụng web cho homeowner và contractor, chạy trên port 4203
- **CSS Variables**: Biến CSS được định nghĩa trong `variables.css` để tái sử dụng màu sắc và giá trị
- **Barrel Export**: File `index.ts` re-export tất cả modules từ một thư mục
- **Inline Styles**: Styles được viết trực tiếp trong JSX thay vì CSS classes
- **Hardcoded Colors**: Màu sắc được viết trực tiếp (ví dụ: `#e4e7ec`) thay vì dùng CSS variables

## Requirements

### Requirement 1

**User Story:** As a developer, I want consistent CSS styling patterns across the portal codebase, so that the code is maintainable and follows project standards.

#### Acceptance Criteria

1. WHEN a component uses color values THEN the Portal SHALL use CSS variables from `variables.css` instead of hardcoded hex colors
2. WHEN a component has repeated styling patterns THEN the Portal SHALL use CSS classes instead of inline styles
3. WHEN inline styles are necessary for dynamic values THEN the Portal SHALL reference CSS variables using `var(--variable-name)` syntax
4. IF a hardcoded color is found in inline styles THEN the Portal SHALL replace it with the corresponding CSS variable

### Requirement 2

**User Story:** As a developer, I want organized module exports, so that imports are clean and consistent across the codebase.

#### Acceptance Criteria

1. WHEN importing from `pages/` directory THEN the Portal SHALL provide a barrel export file (`index.ts`)
2. WHEN importing from `contexts/` directory THEN the Portal SHALL provide a barrel export file (`index.ts`)
3. WHEN exporting components THEN the Portal SHALL use named exports consistently
4. WHEN a barrel export is created THEN the Portal SHALL re-export all public modules from that directory

### Requirement 3

**User Story:** As a developer, I want the portal codebase to follow the same patterns as admin app, so that the project maintains consistency.

#### Acceptance Criteria

1. WHEN comparing portal and admin API client patterns THEN the Portal SHALL follow the same token storage and refresh patterns
2. WHEN comparing portal and admin component structure THEN the Portal SHALL follow the same directory organization
3. WHEN comparing portal and admin CSS patterns THEN the Portal SHALL use CSS modules or CSS classes consistently

### Requirement 4

**User Story:** As a developer, I want to identify and fix all hardcoded colors in portal pages, so that theming works correctly.

#### Acceptance Criteria

1. WHEN `LoginPage.tsx` is rendered THEN the Portal SHALL use CSS variables for all color values
2. WHEN `DashboardPage.tsx` (homeowner) is rendered THEN the Portal SHALL use CSS variables for all color values
3. WHEN `DashboardPage.tsx` (contractor) is rendered THEN the Portal SHALL use CSS variables for all color values
4. WHEN `ProjectsPage.tsx` is rendered THEN the Portal SHALL use CSS variables for all color values
5. WHEN `MarketplacePage.tsx` is rendered THEN the Portal SHALL use CSS variables for all color values

