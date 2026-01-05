---
inclusion: fileMatch
fileMatchPattern: "{landing,admin,portal}/**/*.{tsx,css}"
---

# 🎨 UI & Style Patterns

## 🎯 NGUỒN SỰ THẬT: `@app/shared` tokens

**BẮT BUỘC** import tokens từ `@app/shared` - KHÔNG hardcode màu sắc, font, spacing.

```tsx
// ✅ ĐÚNG
import { tokens } from '@app/shared';

style={{ color: tokens.color.primary }}
style={{ background: tokens.color.surface }}
style={{ borderRadius: tokens.radius.md }}

// ❌ SAI - Hardcode màu
style={{ color: '#F5D393' }}
style={{ background: '#131316' }}

// ❌ SAI - Dùng gradient
style={{ background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})` }}
```

## 🎨 Design Tokens Reference

### Colors (Updated - Sáng hơn, contrast tốt)
```ts
tokens.color = {
  // Backgrounds - sáng hơn, dễ nhìn
  background: '#1A1A1D',     // Main background
  surface: '#232328',        // Cards, modals, sidebar, header
  surfaceHover: '#2D2D33',   // Hover states
  surfaceAlt: '#28282E',     // Alternative surface for nested cards
  
  // Brand
  primary: '#F5D393',        // Primary gold
  secondary: '#C7A775',      // Secondary gold
  accent: '#EFB679',         // Accent orange
  
  // Text - contrast tốt hơn
  text: '#F5F5F5',           // Primary text
  textMuted: '#B0B0B8',      // Secondary text
  muted: '#8A8A94',          // Muted text
  
  // Borders - sáng hơn
  border: '#404048',         // Default border
  borderHover: '#5A5A64',    // Hover border
  borderLight: '#4A4A52',    // Light border
  
  // Status
  success: '#34D399',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
}
```

### Typography
```ts
tokens.font = {
  display: 'Playfair Display, serif',  // Headings, logo
  sans: 'Inter, ui-sans-serif, ...',   // Body text
  mono: 'ui-monospace, ...',           // Code
  
  size: {
    display: '64px',
    h1: '48px',
    h2: '36px',
    h3: '28px',
    body: '16px',
    caption: '12px',
    // Aliases
    xs: '12px', sm: '14px', base: '16px',
    lg: '18px', xl: '20px', '2xl': '24px',
  },
  
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
}
```

### Spacing & Radius
```ts
tokens.space = {
  xs: '4px', sm: '8px', md: '16px',
  lg: '24px', xl: '40px', '2xl': '64px',
}

tokens.radius = {
  sm: '6px', md: '12px', lg: '20px',
  xl: '24px', pill: '999px',
}
```

### Shadows
```ts
tokens.shadow = {
  sm: '0 2px 8px rgba(0,0,0,0.25)',
  md: '0 6px 24px rgba(0,0,0,0.35)',
  lg: '0 12px 44px rgba(0,0,0,0.45)',
  glow: '0 0 24px rgba(245, 211, 147, 0.3)',
}
```

## 🧩 Component Patterns

### Button Styles (NO GRADIENT)
```tsx
// Primary Button (CTA) - Solid color, no gradient
<motion.button
  whileHover={{ opacity: 0.9 }}
  whileTap={{ scale: 0.98 }}
  style={{
    background: tokens.color.primary,
    color: '#111',
    padding: '10px 18px',
    borderRadius: tokens.radius.md,
    fontWeight: 500,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
  }}
>

// Secondary Button
<motion.button
  style={{
    background: tokens.color.surfaceHover,
    border: `1px solid ${tokens.color.border}`,
    color: tokens.color.text,
    padding: '10px 18px',
    borderRadius: tokens.radius.md,
  }}
>

// Icon Button
<motion.button
  whileHover={{ opacity: 0.8 }}
  whileTap={{ scale: 0.95 }}
  style={{
    padding: 8,
    background: tokens.color.surfaceHover,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.sm,
    color: tokens.color.primary,
    cursor: 'pointer',
  }}
>
```

### Icon Box Pattern (NO GRADIENT)
```tsx
// Icon box với background nhạt
<div
  style={{
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    background: `${tokens.color.primary}15`, // 15% opacity
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.color.primary,
    fontSize: 20,
  }}
>
  <i className="ri-settings-line" />
</div>
```

### Card/Surface Pattern
```tsx
<div style={{
  background: tokens.color.surface,
  borderRadius: tokens.radius.lg,
  border: `1px solid ${tokens.color.border}`,
  padding: 24,
}}>
```

### Modal Pattern
```tsx
// Overlay
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  onClick={onClose}
  style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 9998,
  }}
/>

// Modal Content
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  style={{
    width: 'min(500px, 100%)',
    background: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    border: `1px solid ${tokens.color.border}`,
  }}
>
```

### Input Pattern
```tsx
<input
  style={{
    width: '100%',
    padding: '10px 12px',
    borderRadius: tokens.radius.md,
    border: `1px solid ${tokens.color.border}`,
    background: tokens.color.background,
    color: tokens.color.text,
    fontSize: 14,
    outline: 'none',
  }}
  onFocus={(e) => e.target.style.borderColor = tokens.color.primary}
  onBlur={(e) => e.target.style.borderColor = tokens.color.border}
/>
```

### Table Pattern
```tsx
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
      <th style={{
        padding: '12px 16px',
        textAlign: 'left',
        color: tokens.color.muted,
        fontSize: 13,
        fontWeight: 500,
      }}>Header</th>
    </tr>
  </thead>
  <tbody>
    <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
      <td style={{ padding: '12px 16px', color: tokens.color.text }}>
        Content
      </td>
    </tr>
  </tbody>
</table>
```

### Status Badge Pattern
```tsx
const STATUS_COLORS = {
  success: '#34D399',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

<span style={{
  padding: '4px 10px',
  borderRadius: tokens.radius.sm,
  background: `${STATUS_COLORS.success}20`,
  color: STATUS_COLORS.success,
  fontSize: 12,
  fontWeight: 600,
}}>
  Active
</span>
```

## 🎬 Animation Patterns (Framer Motion)

### Hover Effects
```tsx
// Scale on hover
<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

// Slide on hover
<motion.div whileHover={{ x: 4 }}>

// Combined
<motion.div whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }}>
```

### Page Transitions
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

### Loading Spinner
```tsx
<motion.i
  className="ri-loader-4-line"
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
  style={{ fontSize: 32 }}
/>
```

### AnimatePresence for Modals
```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Modal content */}
    </motion.div>
  )}
</AnimatePresence>
```

## 📱 Responsive Patterns

### CSS Classes
```css
/* Desktop only */
.desktop-only { display: inline; }
@media (max-width: 640px) {
  .desktop-only { display: none; }
}

/* Mobile only */
.mobile-only { display: none !important; }
@media (max-width: 768px) {
  .mobile-only { display: block !important; }
  .mobile-only-flex { display: flex !important; }
}
```

### Responsive Values
```tsx
// Use clamp for responsive sizing
fontSize: 'clamp(14px, 2vw, 18px)'
padding: 'clamp(12px, 3vw, 24px)'
gap: 'clamp(16px, 4vw, 32px)'

// Grid responsive
gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))'
```

## 🔤 Icon System: Remix Icon

**LUÔN** dùng Remix Icon (`ri-*` classes):

```tsx
// Common icons
<i className="ri-home-line" />        // Home
<i className="ri-user-line" />        // User
<i className="ri-settings-3-line" />  // Settings
<i className="ri-edit-line" />        // Edit
<i className="ri-delete-bin-line" />  // Delete
<i className="ri-close-line" />       // Close
<i className="ri-check-line" />       // Check
<i className="ri-arrow-left-line" />  // Back
<i className="ri-loader-4-line" />    // Loading
<i className="ri-external-link-line" /> // External link

// Filled variants
<i className="ri-home-fill" />
<i className="ri-user-fill" />
```

## 🚫 KHÔNG BAO GIỜ

- ❌ Hardcode màu sắc (`#F5D393`, `#131316`, etc.)
- ❌ Dùng inline colors thay vì tokens
- ❌ Tạo CSS variables mới trùng với tokens
- ❌ Dùng icon library khác (FontAwesome, etc.)
- ❌ **Dùng gradient** (`linear-gradient`) cho backgrounds
- ❌ Dùng `rgba(12,12,16,0.7)` hoặc backdrop-filter blur
- ❌ Dùng boxShadow glow effects

## ✅ LUÔN LÀM

- ✅ Import `tokens` từ `@app/shared`
- ✅ Dùng tokens cho tất cả colors, spacing, radius
- ✅ Dùng Framer Motion cho animations (nhẹ nhàng)
- ✅ Dùng Remix Icon (`ri-*`)
- ✅ Follow responsive patterns với clamp()
- ✅ **Dùng solid colors** thay vì gradient
- ✅ **Dùng `${tokens.color.primary}15`** cho icon backgrounds (15% opacity)
- ✅ **Thống nhất** background giữa các sections (dùng `tokens.color.surface`)

## 📁 Portal CSS Variables (Bổ sung)

Portal app có thêm CSS variables cho dark/light mode:

```css
/* portal/src/styles/variables.css */
:root {
  --bg-primary: #0b0c0f;
  --bg-secondary: #131316;
  --text-primary: #f0f2f5;
  --primary: #f5d393;
  /* ... */
}

.light {
  --bg-primary: #ffffff;
  --primary: #b8860b;
  /* ... */
}
```

Khi code Portal, có thể dùng CSS variables cho theme switching:
```tsx
style={{ background: 'var(--bg-primary)' }}
```

Nhưng **ưu tiên** dùng tokens khi không cần theme switching.
