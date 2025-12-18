---
inclusion: manual
---

# ⚠️ Common Mistakes - Lỗi thường gặp khi Vibe Code

> **Note**: Tham khảo file này khi gặp lỗi hoặc cần debug. Xem `cursor-rules.md` cho rules chính.

## 🔴 TOP 10 LỖI NGHIÊM TRỌNG

### 1. Import sai path
```tsx
// ❌ SAI
import { tokens } from '../../../packages/shared';
import { Button } from 'admin/src/components/Button';

// ✅ ĐÚNG
import { tokens } from '@app/shared';
// Không import cross-app!
```

### 2. Quên await async function
```tsx
// ❌ SAI - Promise không được resolve
const data = fetchData();
console.log(data); // Promise { <pending> }

// ✅ ĐÚNG
const data = await fetchData();
```

### 3. Mutate state trực tiếp
```tsx
// ❌ SAI - React không detect change
items.push(newItem);
setItems(items);

// ✅ ĐÚNG
setItems([...items, newItem]);
// hoặc
setItems(prev => [...prev, newItem]);
```

### 4. useEffect infinite loop
```tsx
// ❌ SAI - Chạy vô hạn
useEffect(() => {
  setData(fetchData());
}); // Thiếu dependency array!

// ❌ SAI - Object/Array trong deps
useEffect(() => {
  doSomething(options);
}, [options]); // options = {} tạo mới mỗi render

// ✅ ĐÚNG
const options = useMemo(() => ({ key: value }), [value]);
useEffect(() => {
  doSomething(options);
}, [options]);
```

### 5. Không handle loading/error states
```tsx
// ❌ SAI - Crash khi data null
return <div>{data.items.map(...)}</div>;

// ✅ ĐÚNG
if (loading) return <Spinner />;
if (error) return <Error message={error} />;
if (!data) return null;
return <div>{data.items.map(...)}</div>;
```

### 6. Key prop sai
```tsx
// ❌ SAI - Index as key
{items.map((item, i) => <Item key={i} />)}

// ❌ SAI - Không có key
{items.map(item => <Item />)}

// ✅ ĐÚNG
{items.map(item => <Item key={item.id} />)}
```

### 7. Event handler trong JSX
```tsx
// ❌ SAI - Tạo function mới mỗi render
<button onClick={() => handleClick(item.id)}>

// ✅ TỐT HƠN - Với useCallback
const handleItemClick = useCallback((id: string) => {
  // logic
}, []);

<button onClick={() => handleItemClick(item.id)}>
```

### 8. Fetch trong render
```tsx
// ❌ SAI - Fetch mỗi render
function Component() {
  const data = fetch('/api/data'); // WRONG!
  return <div>{data}</div>;
}

// ✅ ĐÚNG - Fetch trong useEffect
function Component() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);
  return <div>{data}</div>;
}
```

### 9. Không validate API input
```ts
// ❌ SAI - Trust user input
app.post('/items', async (c) => {
  const body = await c.req.json();
  await prisma.item.create({ data: body }); // Dangerous!
});

// ✅ ĐÚNG - Validate với Zod
app.post('/items', async (c) => {
  const body = await c.req.json();
  const validated = ItemSchema.parse(body);
  await prisma.item.create({ data: validated });
});
```

### 10. Hardcode values
```tsx
// ❌ SAI - Hardcode URL
fetch('http://localhost:4202/api/items');

// ❌ SAI - Gọi import.meta.env trực tiếp
const API_URL = import.meta.env.VITE_API_URL;

// ✅ ĐÚNG - Import từ @app/shared (centralized config)
import { API_URL } from '@app/shared';
fetch(`${API_URL}/api/items`);

// API keys should be in .env and server-side only
```

### 11. Không dùng Error Boundaries
```tsx
// ❌ SAI - Crash toàn app khi component lỗi
<Routes>
  <Route path="/" element={<HomePage />} />
</Routes>

// ✅ ĐÚNG - Wrap với ErrorBoundary
import { ErrorBoundary } from '@app/ui';

<ErrorBoundary>
  <Routes>
    <Route path="/" element={<HomePage />} />
  </Routes>
</ErrorBoundary>

// LƯU Ý: ErrorBoundary chỉ bắt render errors
// Async errors (fetch, event handlers) cần try-catch riêng
```

## 🟡 LỖI THƯỜNG GẶP KHÁC

### CSS/Styling
```tsx
// ❌ SAI - String thay vì number
style={{ padding: '16' }}

// ✅ ĐÚNG
style={{ padding: 16 }}
style={{ padding: '16px' }}
```

### TypeScript
```tsx
// ❌ SAI - Ignore errors
// @ts-ignore
const x = something.property;

// ✅ ĐÚNG - Fix the type
const x = (something as SomeType).property;
// hoặc
if ('property' in something) {
  const x = something.property;
}
```

### Prisma
```ts
// ❌ SAI - Quên generate sau khi sửa schema
// Error: Unknown field 'newField'

// ✅ ĐÚNG - Chạy generate
// pnpm db:generate
// pnpm db:push
```

## 🔐 JWT AUTH MISTAKES

### 11. Không handle token expiry
```tsx
// ❌ SAI - Không refresh token khi expired
const response = await fetch('/api/data', {
  headers: { Authorization: `Bearer ${token}` }
});

// ✅ ĐÚNG - Auto refresh với interceptor (xem admin/src/app/api.ts)
// API client tự động refresh token khi nhận 401
```

### 12. Lưu token không an toàn
```tsx
// ❌ SAI - Lưu trong localStorage (XSS vulnerable)
localStorage.setItem('token', accessToken);

// ✅ ĐÚNG - Dùng memory store với refresh token
// Xem admin/src/app/store.ts
```

### 13. Không gửi session ID khi logout
```tsx
// ❌ SAI - Logout không revoke session
await fetch('/api/auth/logout', { method: 'POST' });

// ✅ ĐÚNG - Gửi session ID để revoke đúng session
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Session-Id': sessionId
  }
});
```

### 14. Không handle token reuse detection
```tsx
// Khi nhận error AUTH_TOKEN_REUSED → Security breach!
// ✅ ĐÚNG - Force logout và thông báo user
if (error.code === 'AUTH_TOKEN_REUSED') {
  clearAllTokens();
  showSecurityAlert('Phát hiện đăng nhập bất thường. Vui lòng đăng nhập lại.');
  redirectToLogin();
}
```

## 🧪 TEST/LINT MISTAKES

### 15. Chạy sai command để kiểm tra lỗi
```bash
# ❌ SAI - `test` chỉ chạy unit tests, KHÔNG kiểm tra lint/type errors
pnpm nx run api:test

# ✅ ĐÚNG - Chạy ĐỦ 3 targets để kiểm tra toàn diện
pnpm nx run-many --target=lint --all      # ESLint errors/warnings
pnpm nx run-many --target=typecheck --all # TypeScript errors
pnpm nx run-many --target=test --all      # Unit tests (optional)
```

### 16. Unused variables/imports
```tsx
// ❌ SAI - ESLint warning: 'AnimatePresence' is defined but never used
import { motion, AnimatePresence } from 'framer-motion';

// ✅ ĐÚNG - Chỉ import những gì dùng
import { motion } from 'framer-motion';
```

### 17. Empty catch blocks
```ts
// ❌ SAI - ESLint error: Unexpected empty arrow function
.catch(() => {});

// ✅ ĐÚNG - Log hoặc handle error
.catch((error) => {
  console.debug('Operation skipped:', error);
});
```

### 18. Unused function parameters
```tsx
// ❌ SAI - ESLint warning: 'err' is defined but never used
} catch (err) {
  onError('Lỗi xảy ra');
}

// ✅ ĐÚNG - Bỏ tên biến hoặc sử dụng nó
} catch {
  onError('Lỗi xảy ra');
}
// hoặc
} catch (error) {
  onError(error instanceof Error ? error.message : 'Lỗi xảy ra');
}
```

### 19. Unused component props
```tsx
// ❌ SAI - ESLint warning: 'leadId' is defined but never used
function NotesEditor({ leadId, initialNotes, onSave }: Props) {
  // leadId không được dùng trong component
}

// ✅ ĐÚNG - Bỏ prop không dùng
function NotesEditor({ initialNotes, onSave }: Props) {
  // ...
}
```

## 🧪 CHECKLIST TRƯỚC KHI COMMIT

- [ ] `pnpm nx run-many --target=lint --all` → 0 errors, 0 warnings
- [ ] `pnpm nx run-many --target=typecheck --all` → 0 errors
- [ ] `pnpm nx run-many --target=test --all` → All tests pass (nếu có tests)
- [ ] Không có console.log debug
- [ ] Đã test trên browser
- [ ] API endpoints hoạt động
- [ ] Mobile responsive OK
- [ ] Loading states hiển thị
- [ ] Error handling đầy đủ
- [ ] Auth endpoints có middleware đúng
- [ ] Sensitive data không bị log
