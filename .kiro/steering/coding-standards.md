---
inclusion: manual
---

# 🛡️ Coding Standards - Tránh lỗi Vibe Code

> **Note**: File này chứa chi tiết standards. Xem `cursor-rules.md` cho rules chính.

## 🔴 CRITICAL RULES - PHẢI TUÂN THỦ

### 1. KHÔNG BAO GIỜ
- ❌ Tạo file mới mà không kiểm tra file đã tồn tại
- ❌ Xóa code mà không hiểu nó làm gì
- ❌ Copy-paste code mà không điều chỉnh imports
- ❌ Bỏ qua TypeScript/ESLint errors
- ❌ Commit code có console.log debug
- ❌ Hardcode API URLs, secrets, credentials

### 2. LUÔN LUÔN
- ✅ Đọc file trước khi sửa
- ✅ Kiểm tra imports sau khi thêm code mới
- ✅ Test API endpoint sau khi tạo
- ✅ Chạy type-check trước khi hoàn thành
- ✅ Giữ consistency với code hiện có

## 📝 React/TypeScript Standards

### Component Structure
```tsx
// ✅ ĐÚNG
import { memo, useCallback, useMemo } from 'react';

interface Props {
  title: string;
  onAction: (id: string) => void;
}

export const MyComponent = memo(function MyComponent({ title, onAction }: Props) {
  const handleClick = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);

  return <div onClick={() => handleClick('1')}>{title}</div>;
});
```

### State Management
```tsx
// ✅ ĐÚNG - Dùng functional update khi state phụ thuộc previous
setItems(prev => [...prev, newItem]);

// ❌ SAI - Race condition
setItems([...items, newItem]);
```

### useEffect Dependencies
```tsx
// ✅ ĐÚNG - Đầy đủ dependencies
useEffect(() => {
  fetchData(userId);
}, [userId, fetchData]);

// ❌ SAI - Thiếu dependencies
useEffect(() => {
  fetchData(userId);
}, []); // ESLint warning!
```

## 🔌 API Standards (Hono)

### Route Handler
```ts
// ✅ ĐÚNG
app.post('/items', async (c) => {
  try {
    const body = await c.req.json();
    const validated = ItemSchema.parse(body);
    const result = await prisma.item.create({ data: validated });
    return c.json(result, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    console.error('Create item error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
```

### Zod Schema
```ts
// ✅ ĐÚNG - Schema rõ ràng
const ItemSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  categoryId: z.string().cuid().optional(),
});

type Item = z.infer<typeof ItemSchema>;
```

## 🗄️ Prisma Standards

### Query với Relations
```ts
// ✅ ĐÚNG - Include relations khi cần
const post = await prisma.blogPost.findUnique({
  where: { id },
  include: {
    category: true,
    author: { select: { name: true, email: true } },
  },
});

// ❌ SAI - N+1 query problem
const posts = await prisma.blogPost.findMany();
for (const post of posts) {
  post.category = await prisma.blogCategory.findUnique({ where: { id: post.categoryId } });
}
```

### Transaction
```ts
// ✅ ĐÚNG - Dùng transaction cho multiple operations
await prisma.$transaction([
  prisma.item.delete({ where: { id } }),
  prisma.log.create({ data: { action: 'DELETE', itemId: id } }),
]);
```

## 🎨 CSS/Styling Standards

### Inline Styles (cho dự án này)
```tsx
// ✅ ĐÚNG - Consistent với tokens
import { tokens } from '@app/shared';

<div style={{
  background: tokens.color.background,
  borderRadius: tokens.radius.md,
  padding: '16px',
}}>
```

### Responsive
```tsx
// ✅ ĐÚNG - Mobile-first
fontSize: 'clamp(14px, 2vw, 18px)',
padding: 'clamp(12px, 3vw, 24px)',
```

## 🧪 Testing Checklist

Trước khi hoàn thành feature:
- [ ] API endpoint trả về đúng status code
- [ ] Form validation hoạt động
- [ ] Error states được handle
- [ ] Loading states hiển thị
- [ ] Mobile responsive OK
- [ ] Không có console errors
