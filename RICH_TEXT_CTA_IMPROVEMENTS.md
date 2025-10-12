# 🎨 Rich Text & CTA Section Improvements

## Tổng quan

Document này mô tả các cải tiến về giao diện và chức năng cho:
1. **Rich Text Section** - Tối ưu styling theo design system của dự án
2. **CALL_TO_ACTION Section** - Fix preview trong Admin Panel

---

## 1. ✨ Rich Text Section - Tối ưu giao diện

### Vấn đề cũ
- Giao diện đơn giản, không có background
- Không có border, shadow
- Typography không theo design system
- Thiếu styling cho các HTML elements (h1-h6, ul, ol, blockquote, code, etc.)

### Cải tiến mới

#### Container Style
```tsx
// Background với gradient và blur effect
background: 'linear-gradient(135deg, rgba(26, 27, 30, 0.6) 0%, rgba(19, 19, 22, 0.4) 100%)'
backdropFilter: 'blur(20px)'
border: '1px solid rgba(245, 211, 147, 0.1)'
borderRadius: 16px
padding: '48px 40px'
boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
```

#### Typography Styling
- **Headings (h1-h4):**
  - Font family: `Playfair Display` (serif)
  - Color: `#F5D393` (primary color)
  - Font weight: 700
  - Responsive sizes (h1: 36px → 28px mobile)

- **Paragraphs:**
  - Line height: 1.8
  - Margin bottom: 20px
  - Color: `rgba(255,255,255,0.85)`

- **Lists (ul, ol):**
  - Margin: 20px 0
  - Padding left: 24px
  - List items margin: 12px

- **Links:**
  - Color: Primary color
  - Border bottom animation on hover
  - Smooth transition

- **Blockquotes:**
  - Border left: 4px solid primary
  - Padding left: 20px
  - Italic style
  - Muted color

- **Code blocks:**
  - Inline code: Dark background, primary color
  - Code blocks: Darker background, rounded corners
  - Monospace font

- **Images:**
  - Max width: 100%
  - Border radius: 12px
  - Box shadow for depth
  - Margin: 24px 0

- **Horizontal rules:**
  - Gradient line effect
  - Margin: 40px 0

### File thay đổi
- `landing/src/app/sections/render.tsx` - Case `RICH_TEXT`

---

## 2. 🔧 CALL_TO_ACTION Section - Fix Preview

### Vấn đề cũ
❌ Preview không hiển thị trong Admin Panel khi edit CALL_TO_ACTION section

**Nguyên nhân:**
- Admin Panel dùng section type `CTA` trong preview
- Database và Landing dùng `CALL_TO_ACTION`
- Không có case `CALL_TO_ACTION` trong `renderPreview()`

### Cải tiến mới

#### 1. Preview Rendering
Thêm case `CALL_TO_ACTION` vào `renderPreview()`:

```tsx
case 'CTA':
case 'CALL_TO_ACTION':
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: 60, 
      background: 'linear-gradient(135deg, rgba(245, 211, 147, 0.15) 0%, rgba(239, 182, 121, 0.1) 100%)',
      borderRadius: 16,
      border: '1px solid rgba(245, 211, 147, 0.2)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(245, 211, 147, 0.1) 1px, transparent 0)',
        backgroundSize: '32px 32px',
        opacity: 0.5,
      }} />
      
      <div style={{ position: 'relative' }}>
        {/* Title with Playfair Display font */}
        {data.title && (
          <h2 style={{ 
            fontSize: 36, 
            fontWeight: 700, 
            color: '#F5D393',
            fontFamily: 'Playfair Display, serif',
          }}>
            {data.title}
          </h2>
        )}
        
        {/* Subtitle */}
        {data.subtitle && (
          <p style={{ 
            fontSize: 18, 
            color: 'rgba(255,255,255,0.7)',
            maxWidth: 600,
            margin: '0 auto 32px',
          }}>
            {data.subtitle}
          </p>
        )}
        
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          {/* Primary Button */}
          {data.primaryButton?.text && (
            <button style={{ 
              padding: '16px 40px', 
              background: 'linear-gradient(135deg, #F5D393, #EFB679)',
              color: '#111', 
              border: 'none', 
              borderRadius: 12, 
              fontSize: 16, 
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(245, 211, 147, 0.3)',
            }}>
              {data.primaryButton.text}
            </button>
          )}
          
          {/* Secondary Button */}
          {data.secondaryButton?.text && (
            <button style={{ 
              padding: '16px 40px', 
              background: 'transparent',
              color: '#F5D393', 
              border: '2px solid #F5D393', 
              borderRadius: 12, 
              fontSize: 16, 
              fontWeight: 700,
            }}>
              {data.secondaryButton.text}
            </button>
          )}
        </div>
      </div>
    </div>
  );
```

#### 2. Form Fields
Update form để match với data structure mới:

```tsx
case 'CTA':
case 'CALL_TO_ACTION':
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <Input 
        label="Title" 
        value={data.title || ''} 
        onChange={(v) => updateField('title', v)} 
        placeholder="Ready to Get Started?"
        required 
        fullWidth 
      />
      
      {/* Subtitle */}
      <TextArea 
        label="Subtitle" 
        value={data.subtitle || ''} 
        onChange={(v) => updateField('subtitle', v)} 
        placeholder="Join thousands of satisfied customers today"
        fullWidth 
      />

      {/* Primary Button Section */}
      <div style={{
        background: 'rgba(245, 211, 147, 0.05)',
        border: '1px solid rgba(245, 211, 147, 0.2)',
        borderRadius: 8,
        padding: 16,
      }}>
        <label>Primary Button</label>
        <Input 
          label="Button Text" 
          value={data.primaryButton?.text || ''} 
          onChange={(v) => updateField('primaryButton.text', v)} 
          placeholder="Get Started" 
        />
        <Input 
          label="Button Link" 
          value={data.primaryButton?.link || ''} 
          onChange={(v) => updateField('primaryButton.link', v)} 
          placeholder="/signup" 
        />
      </div>

      {/* Secondary Button Section */}
      <div style={{
        background: 'rgba(100, 116, 139, 0.05)',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        borderRadius: 8,
        padding: 16,
      }}>
        <label>Secondary Button (Optional)</label>
        <Input 
          label="Button Text" 
          value={data.secondaryButton?.text || ''} 
          onChange={(v) => updateField('secondaryButton.text', v)} 
          placeholder="Learn More" 
        />
        <Input 
          label="Button Link" 
          value={data.secondaryButton?.link || ''} 
          onChange={(v) => updateField('secondaryButton.link', v)} 
          placeholder="/about" 
        />
      </div>

      {/* Background Image (Optional) */}
      <ImagePicker
        label="Background Image (Optional)"
        value={data.backgroundImage || ''}
        onChange={(url) => updateField('backgroundImage', url)}
        onPick={() => onImagePick('backgroundImage')}
        onRemove={() => updateField('backgroundImage', '')}
      />
    </div>
  );
```

#### 3. Default Data
Update default data khi tạo section mới:

```tsx
case 'CTA':
case 'CALL_TO_ACTION':
  return {
    title: 'Ready to Experience Our Cuisine?',
    subtitle: 'Book a table now and taste the difference',
    primaryButton: { 
      text: 'Make a Reservation', 
      link: '/reservations' 
    },
    secondaryButton: { 
      text: 'View Menu', 
      link: '/menu' 
    },
  };
```

#### 4. Type Definitions
Thêm `CALL_TO_ACTION` vào types:

```tsx
// admin/src/app/types.ts
export type SectionKind = 
  | 'HERO'
  | 'HERO_SIMPLE'
  | 'GALLERY'
  | 'FEATURED_MENU'
  | 'TESTIMONIALS'
  | 'CTA'
  | 'CALL_TO_ACTION'  // ✅ Added
  | 'RICH_TEXT'
  | 'BANNER'
  | 'STATS'
  // ... other types
```

#### 5. Icon & Description Mapping
```tsx
// Icon mapping
const icons: Record<SectionKind, string> = {
  CTA: 'ri-megaphone-fill',
  CALL_TO_ACTION: 'ri-megaphone-fill',  // ✅ Added
  // ... other icons
};

// Description mapping
const descriptions: Record<SectionKind, string> = {
  CTA: 'Call-to-action section to drive conversions',
  CALL_TO_ACTION: 'Call-to-action section with primary and secondary buttons',  // ✅ Added
  // ... other descriptions
};
```

### Files thay đổi
- `admin/src/app/components/SectionEditor.tsx`
  - `renderPreview()` - Thêm case `CALL_TO_ACTION`
  - `renderFormFields()` - Update form fields
  - `getDefaultData()` - Update default data
  - `getSectionIcon()` - Thêm icon mapping
  - `getSectionDescription()` - Thêm description
- `admin/src/app/types.ts` - Thêm `CALL_TO_ACTION` type

---

## 📊 Kết quả

### Before
- ❌ Rich Text section có giao diện đơn giản, không đẹp
- ❌ CALL_TO_ACTION preview không hiển thị trong Admin
- ❌ Form fields không match với data structure

### After
- ✅ Rich Text section có giao diện đẹp, theo design system
- ✅ Typography styling đầy đủ cho tất cả HTML elements
- ✅ CALL_TO_ACTION preview hiển thị đúng trong Admin
- ✅ Form fields match với data structure (primaryButton, secondaryButton)
- ✅ Default data đầy đủ khi tạo section mới
- ✅ Type definitions đầy đủ

---

## 🎨 Design Tokens sử dụng

### Colors
- **Primary:** `#F5D393` (Gold)
- **Text:** `rgba(255,255,255,0.85)` (White with opacity)
- **Muted:** `rgba(255,255,255,0.7)` (Lighter white)
- **Background:** Dark gradient với blur effect

### Typography
- **Headings:** Playfair Display (serif)
- **Body:** Default system font
- **Code:** Courier New (monospace)

### Spacing
- **Container padding:** 48px 40px
- **Section margin:** 80px auto
- **Element spacing:** 12-32px

### Effects
- **Backdrop filter:** blur(20px)
- **Border radius:** 12-16px
- **Box shadow:** 0 10px 40px rgba(0,0,0,0.3)

---

## 🚀 Cách test

### 1. Test Rich Text Section
1. Mở `http://localhost:4200/#/about`
2. Kiểm tra sections "Our Story" và "Our Values"
3. Verify:
   - ✅ Background có gradient và blur
   - ✅ Border và shadow đẹp
   - ✅ Headings dùng Playfair Display font
   - ✅ Headings có màu gold (#F5D393)
   - ✅ Lists có styling đúng
   - ✅ Strong text trong lists có màu primary

### 2. Test CALL_TO_ACTION Preview
1. Mở Admin Panel: `http://localhost:4201`
2. Vào Pages → About
3. Click Edit trên section "Ready to Experience Our Cuisine?"
4. Verify:
   - ✅ Preview hiển thị đúng bên phải
   - ✅ Title, subtitle hiển thị
   - ✅ 2 buttons hiển thị (primary + secondary)
   - ✅ Background có pattern effect
   - ✅ Form fields có 2 sections riêng cho 2 buttons

### 3. Test tạo CALL_TO_ACTION mới
1. Trong Admin Panel, vào Pages → About
2. Click "Add Section" → Chọn "CALL_TO_ACTION"
3. Verify:
   - ✅ Form hiển thị đầy đủ fields
   - ✅ Default data được fill sẵn
   - ✅ Preview hiển thị ngay
   - ✅ Có thể edit title, subtitle, buttons
   - ✅ Có thể upload background image

---

## 📁 Files đã thay đổi

### Landing (Frontend)
1. **`landing/src/app/sections/render.tsx`**
   - Tối ưu case `RICH_TEXT` với styling đầy đủ
   - Thêm 150+ lines CSS cho typography

### Admin Panel
2. **`admin/src/app/components/SectionEditor.tsx`**
   - Thêm case `CALL_TO_ACTION` vào `renderPreview()`
   - Update `renderFormFields()` cho CALL_TO_ACTION
   - Update `getDefaultData()` cho CALL_TO_ACTION
   - Thêm icon và description mapping

3. **`admin/src/app/types.ts`**
   - Thêm `CALL_TO_ACTION` vào `SectionKind` type

---

## 💡 Best Practices

### Rich Text Styling
- Dùng CSS-in-JS với scoped class names
- Responsive typography với media queries
- Consistent spacing và colors theo design system
- Accessibility: good contrast ratios

### Section Preview
- Luôn handle cả aliases (CTA và CALL_TO_ACTION)
- Preview phải match với actual rendering trong landing
- Sử dụng design tokens để consistent styling
- Error handling cho missing data

### Form Fields
- Group related fields (primary button, secondary button)
- Visual distinction với background colors
- Clear labels và placeholders
- Optional fields được đánh dấu rõ ràng

---

## 🔄 Tương thích

### Backward Compatibility
- ✅ Sections cũ vẫn hoạt động bình thường
- ✅ Hỗ trợ cả `CTA` và `CALL_TO_ACTION` types
- ✅ Landing vẫn render đúng sections cũ
- ✅ Admin vẫn edit được sections cũ

### Data Migration
Không cần migration vì:
- Landing đã support cả 2 types (`CTA` và `CALL_TO_ACTION`)
- Admin đã support cả 2 types
- Database không thay đổi schema

---

## 📝 Notes

- Rich Text section hỗ trợ cả HTML (`html` field) và Markdown (`content` field)
- CALL_TO_ACTION có thể có 1 hoặc 2 buttons (secondary button optional)
- Background image cho CTA section là optional
- Tất cả styling đều responsive (mobile-friendly)

---

## ✅ Checklist

- [x] Tối ưu Rich Text section styling
- [x] Fix CALL_TO_ACTION preview trong Admin
- [x] Update form fields cho CALL_TO_ACTION
- [x] Update default data
- [x] Update type definitions
- [x] Update icon và description mappings
- [x] Test Rich Text trên About page
- [x] Test CALL_TO_ACTION preview trong Admin
- [x] Verify backward compatibility
- [x] Document tất cả changes

