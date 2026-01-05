# Requirements Document

## Introduction

Chuyển đổi Admin Dashboard từ Dark Mode sang Light Mode hoàn toàn. Mục tiêu là tạo giao diện sáng, clean, chuyên nghiệp, dễ nhìn hơn cho người dùng admin. Việc chuyển đổi cần đảm bảo tính nhất quán trên toàn bộ ứng dụng, từ Layout, Components đến tất cả các Pages.

**Phạm vi ảnh hưởng (đã phân tích):**
- 20+ page folders với 70+ component files
- 25+ shared components trong `admin/src/app/components/`
- 10+ responsive components trong `admin/src/components/responsive/`
- CSS files: `styles.css`, `variables.css`, `responsive.css`
- Design tokens tại `packages/shared/src/index.ts`

**Vấn đề hardcode hiện tại (cần refactor):**
- `rgba(255,255,255,0.03)`, `rgba(255,255,255,0.05)`, `rgba(255,255,255,0.1)` - dùng cho backgrounds
- `rgba(0,0,0,0.2)`, `rgba(0,0,0,0.3)`, `rgba(0,0,0,0.7)` - dùng cho overlays và backgrounds
- Hardcode hex colors: `#10B981`, `#EF4444`, `#ef4444`, `#f87171`, `#93c5fd`, `#a7f3d0`
- Hardcode backgrounds: `#fff`, `#f5f5f5`, `#0b0c0f`, `#111`
- Inline styles với colors không qua tokens

## Glossary

- **Admin Dashboard**: Ứng dụng quản trị tại `admin/` chạy trên port 4201
- **Design Tokens**: Hệ thống biến thiết kế tập trung tại `@app/shared` (colors, spacing, typography, etc.)
- **Light Mode**: Giao diện sáng với background trắng/xám nhạt, text đen/xám đậm
- **Dark Mode**: Giao diện tối hiện tại với background đen/xám đậm, text trắng/xám nhạt
- **Surface**: Màu nền cho cards, modals, sidebar, header
- **Primary Color**: Màu chủ đạo của brand (#F5D393 - gold) - cần điều chỉnh cho light mode
- **Tokens**: Object chứa design tokens từ `@app/shared`
- **adminTokens**: Tokens riêng cho admin app (light mode) - sẽ được tạo mới
- **Glass Effect**: Hiệu ứng kính mờ với rgba - cần thay thế bằng solid colors
- **Overlay**: Lớp phủ mờ cho modals - giữ nguyên rgba(0,0,0,0.5)

## Requirements

### Requirement 1

**User Story:** As an admin user, I want a light-themed dashboard, so that the interface is easier to read and less straining on my eyes during long work sessions.

#### Acceptance Criteria

1. WHEN the admin dashboard loads THEN the system SHALL display a light background (#F8F9FA or similar) instead of dark background
2. WHEN viewing any card or surface element THEN the system SHALL display white (#FFFFFF) background with subtle shadow
3. WHEN reading text content THEN the system SHALL display dark text (#1A1A1D for primary, #6B7280 for muted) with high contrast
4. WHEN viewing borders THEN the system SHALL display light gray borders (#E5E7EB) that are visible but not harsh
5. WHEN interacting with hover states THEN the system SHALL display subtle gray hover effects (#F3F4F6)

### Requirement 2

**User Story:** As a developer, I want centralized light mode tokens, so that I can maintain consistent styling across all components.

#### Acceptance Criteria

1. WHEN importing tokens from @app/shared THEN the system SHALL provide light mode color values for admin app
2. WHEN updating design tokens THEN the system SHALL preserve the existing token structure (color, font, space, radius, shadow, motion, zIndex)
3. WHEN using tokens in components THEN the system SHALL apply light mode colors without requiring component code changes
4. WHEN the primary brand color is used THEN the system SHALL maintain #F5D393 (gold) as the primary accent color
5. WHEN status colors are used THEN the system SHALL maintain existing success (#34D399), warning (#F59E0B), error (#EF4444), info (#3B82F6) colors

### Requirement 3

**User Story:** As an admin user, I want the sidebar and header to match the light theme, so that the navigation feels cohesive with the rest of the dashboard.

#### Acceptance Criteria

1. WHEN viewing the sidebar THEN the system SHALL display white background with light border
2. WHEN viewing active menu items THEN the system SHALL display primary color highlight with appropriate contrast
3. WHEN viewing the header/top bar THEN the system SHALL display white background with bottom border shadow
4. WHEN viewing user info section THEN the system SHALL display readable text with proper contrast
5. WHEN hovering over menu items THEN the system SHALL display subtle gray hover background

### Requirement 4

**User Story:** As an admin user, I want all form inputs and controls to be clearly visible, so that I can easily interact with the dashboard.

#### Acceptance Criteria

1. WHEN viewing input fields THEN the system SHALL display white background with gray border
2. WHEN focusing on input fields THEN the system SHALL display primary color border highlight
3. WHEN viewing select dropdowns THEN the system SHALL display white background with visible dropdown arrow
4. WHEN viewing buttons THEN the system SHALL display appropriate contrast (primary button with dark text, secondary with dark text on light bg)
5. WHEN viewing disabled states THEN the system SHALL display muted colors with reduced opacity

### Requirement 5

**User Story:** As an admin user, I want tables and data displays to be easy to scan, so that I can quickly find information.

#### Acceptance Criteria

1. WHEN viewing table headers THEN the system SHALL display light gray background (#F9FAFB) with dark text
2. WHEN viewing table rows THEN the system SHALL display white background with subtle row borders
3. WHEN hovering over table rows THEN the system SHALL display light gray hover background
4. WHEN viewing selected rows THEN the system SHALL display light primary color background
5. WHEN viewing empty states THEN the system SHALL display muted text on light background

### Requirement 6

**User Story:** As an admin user, I want modals and overlays to be clearly visible, so that I can focus on the modal content.

#### Acceptance Criteria

1. WHEN a modal opens THEN the system SHALL display semi-transparent dark overlay (rgba(0,0,0,0.5))
2. WHEN viewing modal content THEN the system SHALL display white background with subtle shadow
3. WHEN viewing modal headers THEN the system SHALL display white background with bottom border
4. WHEN viewing confirm/delete modals THEN the system SHALL display appropriate warning colors with light backgrounds

### Requirement 7

**User Story:** As an admin user, I want toast notifications to be visible, so that I can see feedback messages clearly.

#### Acceptance Criteria

1. WHEN a success toast appears THEN the system SHALL display light green background with dark text
2. WHEN an error toast appears THEN the system SHALL display light red background with dark text
3. WHEN a warning toast appears THEN the system SHALL display light yellow background with dark text
4. WHEN an info toast appears THEN the system SHALL display light blue background with dark text

### Requirement 8

**User Story:** As an admin user, I want the login page to match the light theme, so that the experience is consistent from login to dashboard.

#### Acceptance Criteria

1. WHEN viewing the login page THEN the system SHALL display light background
2. WHEN viewing the login card THEN the system SHALL display white background with shadow
3. WHEN viewing the logo area THEN the system SHALL display primary color with appropriate contrast
4. WHEN viewing demo credentials info THEN the system SHALL display light primary tinted background

### Requirement 9

**User Story:** As an admin user, I want charts and data visualizations to be readable, so that I can understand dashboard metrics.

#### Acceptance Criteria

1. WHEN viewing charts THEN the system SHALL display on white/light background
2. WHEN viewing chart legends THEN the system SHALL display dark text for readability
3. WHEN viewing chart grid lines THEN the system SHALL display subtle gray lines
4. WHEN viewing chart tooltips THEN the system SHALL display white background with shadow

### Requirement 10

**User Story:** As a developer, I want CSS variables updated for light mode, so that global styles are consistent.

#### Acceptance Criteria

1. WHEN the admin app loads THEN the system SHALL apply light mode CSS variables in styles.css
2. WHEN the admin app loads THEN the system SHALL apply light mode CSS variables in variables.css
3. WHEN scrollbars are displayed THEN the system SHALL display light-themed scrollbars
4. WHEN selection is made THEN the system SHALL display appropriate selection colors

### Requirement 11

**User Story:** As a developer, I want all hardcoded colors refactored to use tokens, so that the codebase is maintainable and consistent.

#### Acceptance Criteria

1. WHEN using glass effect backgrounds THEN the system SHALL use `tokens.color.surfaceAlt` instead of `rgba(255,255,255,0.03)`
2. WHEN using hover backgrounds THEN the system SHALL use `tokens.color.surfaceHover` instead of `rgba(255,255,255,0.05)`
3. WHEN using input backgrounds THEN the system SHALL use `tokens.color.inputBg` instead of `rgba(0,0,0,0.2)` or `rgba(0,0,0,0.3)`
4. WHEN using overlay backgrounds THEN the system SHALL use `tokens.color.overlay` (rgba(0,0,0,0.5)) for modals
5. WHEN using status colors THEN the system SHALL use `tokens.color.success`, `tokens.color.error`, `tokens.color.warning`, `tokens.color.info` instead of hardcoded hex values

### Requirement 12

**User Story:** As a developer, I want admin-specific tokens separated from shared tokens, so that admin light mode does not affect landing page dark mode.

#### Acceptance Criteria

1. WHEN importing tokens for admin THEN the system SHALL provide `adminTokens` object with light mode colors
2. WHEN importing tokens for landing/portal THEN the system SHALL continue using existing dark mode tokens
3. WHEN admin tokens are updated THEN the system SHALL not affect other apps in the monorepo
4. WHEN using admin tokens THEN the system SHALL maintain the same token structure (color, font, space, radius, shadow, motion, zIndex)

### Requirement 13

**User Story:** As a developer, I want preview components to use appropriate colors, so that section previews are readable.

#### Acceptance Criteria

1. WHEN viewing section previews THEN the system SHALL display white backgrounds for preview content
2. WHEN viewing preview text THEN the system SHALL display dark text (#111 or similar) for readability
3. WHEN viewing preview borders THEN the system SHALL display light gray borders (#e5e7eb)
4. WHEN viewing preview placeholders THEN the system SHALL display appropriate gray backgrounds

### Requirement 14

**User Story:** As an admin user, I want the primary brand color adjusted for light mode, so that it has proper contrast on white backgrounds.

#### Acceptance Criteria

1. WHEN using primary color on light backgrounds THEN the system SHALL use a darker gold shade (#B8860B or similar) for better contrast
2. WHEN using primary color for text THEN the system SHALL ensure WCAG AA contrast ratio (4.5:1 minimum)
3. WHEN using primary color for icons THEN the system SHALL maintain visual prominence
4. WHEN using primary color for buttons THEN the system SHALL use the original gold (#F5D393) with dark text (#111)
