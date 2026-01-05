# Requirements Document

## Introduction

Hoàn thiện việc chuyển đổi Admin App sang Light Mode bằng cách fix tất cả các hardcoded colors, dark mode patterns, và đảm bảo tính đồng nhất UI trên toàn bộ codebase. Spec này tiếp nối từ `admin-light-mode-cleanup` và xử lý các vấn đề còn sót lại được phát hiện qua audit toàn diện.

## Glossary

- **Admin App**: Ứng dụng quản trị tại `admin/src/`
- **adminTokens**: Design tokens cho light mode được định nghĩa tại `packages/shared/src/adminTokens.ts`
- **tokens**: Re-export của adminTokens tại `admin/src/theme/index.ts`
- **Hardcoded Color**: Màu sắc được viết trực tiếp (VD: `#F5D393`) thay vì dùng tokens
- **Dark Mode Pattern**: Các màu nền tối như `#131316`, `#1a1a1a`, `#27272A`
- **Glass Effect**: Pattern dùng `rgba()` với backdrop-filter blur
- **Preview Component**: Component hiển thị preview nội dung cho landing page (dark theme)

## Requirements

### Requirement 1

**User Story:** As an admin user, I want the BiddingSettingsPage tabs to use consistent light mode styling, so that the UI looks professional and matches the rest of the admin app.

#### Acceptance Criteria

1. WHEN the GeneralSettingsTab renders THEN the system SHALL use `tokens.color.surfaceAlt` for glass background instead of `rgba(12,12,16,0.7)`
2. WHEN the ServiceFeesTab renders THEN the system SHALL use `tokens.color.surfaceAlt` for glass background instead of `rgba(12,12,16,0.7)`
3. WHEN any checkbox or radio button container renders THEN the system SHALL use `tokens.color.border` for borders instead of hardcoded values

### Requirement 2

**User Story:** As an admin user, I want the TemplatePicker component to use light mode styling, so that it matches the admin app theme instead of using dark Tailwind classes.

#### Acceptance Criteria

1. WHEN the TemplatePicker modal renders THEN the system SHALL use inline styles with tokens instead of Tailwind dark classes (`bg-gray-800`, `bg-gray-900`)
2. WHEN the TemplatePicker modal background renders THEN the system SHALL use `tokens.color.overlay` for the backdrop
3. WHEN the TemplatePicker content renders THEN the system SHALL use `tokens.color.surface` for the modal background
4. WHEN the TemplatePicker text renders THEN the system SHALL use `tokens.color.text` and `tokens.color.muted` for text colors

### Requirement 3

**User Story:** As an admin user, I want all button text colors to use tokens consistently, so that buttons are readable on light backgrounds.

#### Acceptance Criteria

1. WHEN a danger button renders THEN the system SHALL use appropriate contrast color from tokens instead of hardcoded `#fff`
2. WHEN action buttons in tables render THEN the system SHALL use `tokens.color.text` or appropriate token for text color
3. WHEN primary buttons with light background render THEN the system SHALL use `#111` or dark color for text contrast

### Requirement 4

**User Story:** As an admin user, I want avatar placeholders and icon containers to use consistent light mode colors, so that they are visible on light backgrounds.

#### Acceptance Criteria

1. WHEN a user avatar placeholder renders THEN the system SHALL use `tokens.color.text` for text color instead of `#fff`
2. WHEN icon containers with colored backgrounds render THEN the system SHALL use appropriate contrast colors based on background

### Requirement 5

**User Story:** As an admin user, I want the SectionEditor preview components to clearly indicate they are previewing dark-themed landing page content, so that I understand the context.

#### Acceptance Criteria

1. WHEN MarketplacePreview renders THEN the system SHALL maintain dark theme styling as it previews landing page content
2. WHEN FooterSocialPreview renders THEN the system SHALL maintain dark theme styling as it previews landing page content
3. WHEN preview components render THEN the system SHALL have a visual indicator or wrapper showing this is a preview of dark-themed content

### Requirement 6

**User Story:** As an admin user, I want all hardcoded brand colors to be replaced with tokens, so that the theme can be easily maintained and updated.

#### Acceptance Criteria

1. WHEN any component uses `#F5D393` THEN the system SHALL replace it with `tokens.color.primary`
2. WHEN any component uses `#EFB679` THEN the system SHALL replace it with `tokens.color.accent`
3. WHEN any component uses `#C7A775` THEN the system SHALL replace it with `tokens.color.secondary`
4. WHEN any component uses `#B8860B` THEN the system SHALL replace it with `tokens.color.primaryDark`

### Requirement 7

**User Story:** As an admin user, I want all status colors to use tokens consistently, so that status indicators are clear and maintainable.

#### Acceptance Criteria

1. WHEN success status renders THEN the system SHALL use `tokens.color.success` and `tokens.color.successBg`
2. WHEN error status renders THEN the system SHALL use `tokens.color.error` and `tokens.color.errorBg`
3. WHEN warning status renders THEN the system SHALL use `tokens.color.warning` and `tokens.color.warningBg`
4. WHEN info status renders THEN the system SHALL use `tokens.color.info` and `tokens.color.infoBg`

### Requirement 8

**User Story:** As an admin user, I want the VisualBlockEditor to use tokens for all styling, so that the editor matches the light mode theme.

#### Acceptance Criteria

1. WHEN block editor containers render THEN the system SHALL use `tokens.color.surfaceAlt` instead of `rgba(0,0,0,0.1)`
2. WHEN decorative elements render THEN the system SHALL use tokens with opacity modifiers instead of hardcoded rgba values
3. WHEN gradient backgrounds are necessary THEN the system SHALL use `tokens.color.primary` and `tokens.color.accent` for gradient colors

### Requirement 9

**User Story:** As an admin user, I want the MarkdownEditor to use light mode styling, so that the editor is readable and consistent.

#### Acceptance Criteria

1. WHEN blockquote styling renders THEN the system SHALL use `tokens.color.primary` for border and `tokens.color.textMuted` for text
2. WHEN code blocks render THEN the system SHALL use `tokens.color.surfaceAlt` for background

### Requirement 10

**User Story:** As a developer, I want the codebase to pass lint and typecheck without errors after all changes, so that the code quality is maintained.

#### Acceptance Criteria

1. WHEN running `pnpm nx run-many --target=lint --all` THEN the system SHALL report 0 errors and 0 warnings
2. WHEN running `pnpm nx run-many --target=typecheck --all` THEN the system SHALL report 0 errors
