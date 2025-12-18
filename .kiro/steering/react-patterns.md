---
inclusion: fileMatch
fileMatchPattern: "{landing,admin}/**/*.tsx"
---

# ⚛️ React Development Patterns

## Component File Structure
```tsx
// 1. Imports
import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';

// 2. Types/Interfaces
interface Props {
  data: ItemData;
  onUpdate: (id: string, data: Partial<ItemData>) => void;
}

interface ItemData {
  id: string;
  name: string;
}

// 3. Component
export const MyComponent = memo(function MyComponent({ data, onUpdate }: Props) {
  // 3a. State
  const [isLoading, setIsLoading] = useState(false);
  
  // 3b. Callbacks
  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      await onUpdate(data.id, { name: 'New Name' });
    } finally {
      setIsLoading(false);
    }
  }, [data.id, onUpdate]);
  
  // 3c. Render
  return (
    <div>
      {isLoading ? <Spinner /> : <Content />}
    </div>
  );
});
```

## State Patterns

### Loading + Error + Data
```tsx
const [state, setState] = useState<{
  data: Item[] | null;
  loading: boolean;
  error: string | null;
}>({
  data: null,
  loading: true,
  error: null,
});

// Fetch
useEffect(() => {
  const load = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: 'Failed to load' });
    }
  };
  load();
}, []);
```

### Form State
```tsx
const [form, setForm] = useState({
  name: '',
  email: '',
  phone: '',
});

const updateField = useCallback((field: keyof typeof form, value: string) => {
  setForm(prev => ({ ...prev, [field]: value }));
}, []);

// Usage
<input 
  value={form.name}
  onChange={(e) => updateField('name', e.target.value)}
/>
```

## Event Handlers

### Prevent Default
```tsx
const handleSubmit = useCallback((e: React.FormEvent) => {
  e.preventDefault();
  // submit logic
}, []);
```

### Stop Propagation (Modal/Dropdown)
```tsx
const handleModalClick = useCallback((e: React.MouseEvent) => {
  e.stopPropagation(); // Prevent closing when clicking inside
}, []);
```

## Conditional Rendering
```tsx
// ✅ ĐÚNG
{isLoading && <Spinner />}
{error && <ErrorMessage>{error}</ErrorMessage>}
{data && <DataList items={data} />}

// ❌ SAI - Render 0 thay vì nothing
{items.length && <List items={items} />}

// ✅ FIX
{items.length > 0 && <List items={items} />}
```

## Lists with Keys
```tsx
// ✅ ĐÚNG - Unique stable key
{items.map(item => (
  <Item key={item.id} data={item} />
))}

// ❌ SAI - Index as key (causes issues with reordering)
{items.map((item, index) => (
  <Item key={index} data={item} />
))}
```

## API Calls Pattern
```tsx
// ✅ ĐÚNG - Import từ @app/shared (centralized config)
import { API_URL } from '@app/shared';

async function fetchItems(): Promise<Item[]> {
  const res = await fetch(`${API_URL}/items`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

// ❌ SAI - Không gọi import.meta.env trực tiếp
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4202';

// With credentials (for auth)
async function fetchProtected(endpoint: string) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include', // Send cookies
  });
  if (res.status === 401) {
    // Redirect to login
    window.location.href = '/login';
    return;
  }
  return res.json();
}
```

## Error Boundaries
```tsx
// Import ErrorBoundary từ @app/ui
import { ErrorBoundary } from '@app/ui';

// Wrap routes hoặc components có thể crash
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// Với custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <MyComponent />
</ErrorBoundary>

// LƯU Ý: ErrorBoundary chỉ bắt render errors
// Async errors (fetch, event handlers) cần try-catch riêng
```

## Animation (Framer Motion)
```tsx
// ✅ ĐÚNG - Simple, performant
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>

// ❌ TRÁNH - Complex animations on mobile
// Use useReducedMotion hook
const shouldReduce = useReducedMotion();
const variants = shouldReduce 
  ? {} 
  : { initial: { opacity: 0 }, animate: { opacity: 1 } };
```
