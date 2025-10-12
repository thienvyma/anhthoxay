# 📋 PORT & ROUTING CONFIGURATION AUDIT

**Date**: October 12, 2025  
**Purpose**: Comprehensive analysis before making port and routing changes

---

## 🎯 USER REQUIREMENTS

### **Task 1: Change Ports**
- **Landing**: 4203 → **4200**
- **Admin**: 4200 → **4201**  
- **API**: 4202 → **4202** (no change)

### **Task 2: Fix Hash Routing**
- **Current**: `http://localhost:4203/#/gallery`
- **Desired**: `http://localhost:4203/gallery`
- **Issue**: Why using `#` (HashRouter) instead of clean URLs (BrowserRouter)?

---

## 📊 CURRENT PORT CONFIGURATION

### **1. API Server** (Port 4202)

**File**: `api/src/main.ts` (Line 1306-1308)
```typescript
const port = Number(process.env.PORT) || 4202;
serve({ fetch: app.fetch, port });
console.log(`API server listening on http://localhost:${port}`);
```

**CORS Configuration** (Line 48):
```typescript
app.use('*', cors({ 
  origin: ['http://localhost:4200', 'http://localhost:4201', 'http://localhost:4203'], 
  allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'], 
  credentials: true 
}));
```

**Status**: ✅ **API port is correct (4202)**, but CORS needs update after port changes!

---

### **2. Landing App** (Currently Port 4203)

**File**: `landing/vite.config.ts` (Lines 11-23)
```typescript
server: {
  port: 4203,  // ← Need to change to 4200
  host: 'localhost',
  strictPort: true,
  fs: {
    allow: [__dirname, path.resolve(__dirname, '..'), path.resolve(__dirname, '..', '..')],
  },
},
preview: {
  port: 4203,  // ← Need to change to 4200
  host: 'localhost',
},
```

**Status**: ❌ **Needs change: 4203 → 4200**

---

### **3. Admin App** (Currently Port 4200)

**File**: `admin/vite.config.ts` (Lines 11-22)
```typescript
server: {
  port: 4200,  // ← Need to change to 4201
  host: 'localhost',
  strictPort: true,
  fs: {
    allow: [__dirname, path.resolve(__dirname, '..'), path.resolve(__dirname, '..', '..')],
  },
},
preview: {
  port: 4200,  // ← Need to change to 4201
  host: 'localhost',
},
```

**Status**: ❌ **Needs change: 4200 → 4201**

---

## 🔗 API CONNECTION MAPPING

### **Landing App → API Connections**

#### **1. Main API Client** (`landing/src/app/api.ts` - Line 6)
```typescript
const API_BASE = 'http://localhost:4202';
```
**Status**: ✅ Already correct!

#### **2. Image URL Utility** (`landing/src/app/utils/imageUrl.ts` - Lines 16, 22)
```typescript
const API_URL = 'http://localhost:4202';
return `${API_URL}${url}`;
```
**Status**: ✅ Already correct!

#### **3. Direct Fetch Calls** (Multiple files)

**File**: `landing/src/app/app.tsx` (Line 155)
```typescript
fetch('http://localhost:4202/pages/home')
```

**File**: `landing/src/app/pages/MenuPage.tsx` (Line 47)
```typescript
queryFn: () => fetch('http://localhost:4202/menu-categories').then(r => r.json()),
```

**Files with hardcoded `http://localhost:4202`**:
- `landing/src/app/pages/GalleryPage.tsx` (Line 76)
- `landing/src/app/sections/Gallery.tsx` (Line 71)
- `landing/src/app/sections/FeaturedBlogPosts.tsx` (Line 50)
- `landing/src/app/sections/FeaturedMenu.tsx` (Line 87)
- `landing/src/app/sections/GallerySlideshow.tsx` (Line 79)
- `landing/src/app/sections/EnhancedHero.tsx` (Line 42)
- `landing/src/app/components/Footer.tsx` (Line 122)
- `landing/src/app/components/Header.tsx` (Line 113)
- `landing/src/app/pages/SpecialOffersPage.tsx` (Line 193)

**Status**: ✅ All use correct API port (4202), **no changes needed**!

---

### **Admin App → API Connections**

#### **1. Main API Client** (`admin/src/app/api.ts` - Line 2)
```typescript
const API_BASE = 'http://localhost:4202';
```
**Status**: ✅ Already correct!

#### **2. Direct Fetch Calls** (Multiple files)

**Files with hardcoded `http://localhost:4202`**:
- `admin/src/app/pages/SettingsPage.tsx` (Lines 98, 114, 177, 202, 269, 352, 485, 1836, 1905)
- `admin/src/app/pages/MenuPage.tsx` (Lines 177, 424, 553, 959)
- `admin/src/app/pages/MediaPage.tsx` (Lines 93, 121, 133, 428, 583, 750)
- `admin/src/app/SectionList.tsx` (Lines 20, 38, 78)
- `admin/src/app/SectionInspector.tsx` (Lines 36, 119)
- `admin/src/app/MediaUpload.tsx` (Line 16)
- `admin/src/app/forms/SectionForms.tsx` (Lines 40, 77, 116)
- `admin/src/app/components/ImagePickerModal.tsx` (Line 9)

**Status**: ✅ All use correct API port (4202), **no changes needed**!

---

### **Admin App → Landing App References**

**Files referencing Landing port (4200)**:
- `admin/src/app/pages/PagesPage.tsx` (Line 286)
  ```typescript
  onClick={() => window.open(`http://localhost:4200/#/${page.slug}`, '_blank')}
  ```
  **Status**: ❌ **Needs update after landing port changes!**

- `admin/src/app/pages/SectionsPage.tsx` (Line 338)
  ```typescript
  src="http://localhost:4200"
  ```
  **Status**: ❌ **Needs update: 4200 → 4200 (landing's new port)**

- `admin/src/app/pages/LivePreviewPage.tsx` (Lines 45, 104, 162, 180)
  ```typescript
  src="http://localhost:4200"
  window.open('http://localhost:4200', '_blank')
  ```
  **Status**: ❌ **Needs update: 4200 → 4200 (landing's new port)**

- `admin/src/app/components/Layout.tsx` (Line 371)
  ```typescript
  href="http://localhost:4200"
  ```
  **Status**: ❌ **Needs update: 4200 → 4200 (landing's new port)**

**Wait!** Admin currently references `4200`, and landing will **become** 4200, so these are actually **correct**! ✅

---

## 🗄️ DATABASE CONFIGURATION

**File**: `infra/prisma/schema.prisma` (Line 3)
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**File**: `env.example` (Line 2)
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restaurant_dev?schema=public"
```

**File**: `api/src/main.ts` (Lines 16-38)
```typescript
// Load .env from project root
function findProjectRoot(startPath: string): string {
  let currentPath = startPath;
  while (currentPath !== path.dirname(currentPath)) {
    if (fs.existsSync(path.join(currentPath, '.env')) || 
        fs.existsSync(path.join(currentPath, 'infra', 'prisma', 'schema.prisma'))) {
      return currentPath;
    }
  }
  return startPath;
}

const projectRoot = findProjectRoot(process.cwd());
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
}
```

**Status**: ✅ **Database connection is independent of app ports!** No changes needed.

---

## 🔀 ROUTING ANALYSIS - WHY HASH ROUTING?

### **Landing App Routing**

**File**: `landing/src/app/app.tsx` (Lines 42-48)
```typescript
const [route, setRoute] = useState<RouteType>(() => {
  const h = window.location.hash.replace('#/', '');
  if (h === 'menu' || h === 'about' || h === 'gallery' || h === 'contact' || h === 'blog') return h;
  if (h.startsWith('blog/')) return 'blog';
  if (h === 'test-hover') return 'test-hover';
  return 'home';
});
```

**Hash Change Listener** (Lines 92-99):
```typescript
useEffect(() => {
  const onHashChange = () => {
    const h = window.location.hash.replace('#/', '');
    // ... parse hash and update route
  };
  window.addEventListener('hashchange', onHashChange);
  return () => window.removeEventListener('hashchange', onHashChange);
}, []);
```

**Navigation** (Lines 107-113):
```typescript
function navigate(newRoute: RouteType, slug?: string) {
  if (newRoute === 'blog' && slug) {
    window.location.hash = `#/blog/${slug}`;
    setBlogSlug(slug);
  } else {
    window.location.hash = `#/${newRoute}`;
  }
  setRoute(newRoute);
}
```

**Status**: ❌ **Using manual HashRouter implementation!**

---

### **Admin App Routing**

**File**: `admin/src/app/app.tsx` (Lines 21-51)
```typescript
function parseHash(): { route: RouteType; slug?: string } {
  const hash = window.location.hash.replace('#/', '');
  if (!hash || hash === 'dashboard') return { route: 'dashboard' };
  
  const [routePart, slugPart] = hash.split('/');
  const validRoutes: RouteType[] = [
    'dashboard', 'pages', 'sections', 'menu', 'media', 
    'reservations', 'preview', 'offers', 'blog-categories', 
    'blog-posts', 'settings'
  ];
  
  if (validRoutes.includes(routePart as RouteType)) {
    return { 
      route: routePart as RouteType, 
      slug: slugPart || (routePart === 'sections' ? 'home' : undefined)
    };
  }
  
  return { route: 'dashboard' };
}

function updateHash(newRoute: RouteType, slug?: string) {
  if (slug) {
    window.location.hash = `#/${newRoute}/${slug}`;
  } else {
    window.location.hash = `#/${newRoute}`;
  }
}
```

**Status**: ❌ **Using manual HashRouter implementation!**

---

### **Why HashRouter? Analysis**

#### **Advantages of Current HashRouter**:
1. ✅ **No server configuration needed** - Works on any static host
2. ✅ **No 404 errors** - All routes handled client-side
3. ✅ **Simple deployment** - Just upload dist folder
4. ✅ **Works with GitHub Pages, Netlify, etc.** - No rewrites needed

#### **Disadvantages of HashRouter**:
1. ❌ **Ugly URLs** - `/#/gallery` instead of `/gallery`
2. ❌ **SEO issues** - Search engines may not index properly
3. ❌ **No SSR support** - Can't pre-render pages
4. ❌ **Analytics issues** - Some tools don't track hash changes

#### **To Switch to BrowserRouter, Need**:
1. **Server-side rewrites** - All routes → `index.html`
2. **Vite config update** - Add `historyApiFallback`
3. **Production server config** - Nginx/Apache rewrites
4. **Update all navigation logic** - Remove hash handling

---

## 📋 CHANGE IMPACT ANALYSIS

### **Port Changes Impact**

| Change | Files Affected | Risk Level | Notes |
|--------|----------------|------------|-------|
| **Landing: 4203 → 4200** | 1 file (vite.config) | 🟢 Low | No API calls affected |
| **Admin: 4200 → 4201** | 1 file (vite.config) | 🟢 Low | No API calls affected |
| **API CORS update** | 1 file (main.ts) | 🟡 Medium | Must update CORS origins |
| **Admin → Landing refs** | 5 files | 🟢 Low | Already reference 4200 (correct!) |

### **Routing Change Impact**

| Change | Files Affected | Risk Level | Notes |
|--------|----------------|------------|-------|
| **Landing: Hash → Browser** | 3+ files | 🔴 High | Major refactor needed |
| **Admin: Hash → Browser** | 3+ files | 🔴 High | Major refactor needed |
| **Server config** | New files | 🔴 High | Need rewrites for production |
| **SEO/Analytics** | Multiple | 🟡 Medium | Need to update tracking |

---

## ✅ RECOMMENDATION

### **Port Changes: SAFE TO PROCEED** 🟢

**Changes needed**:
1. ✅ `landing/vite.config.ts` - Change port 4203 → 4200
2. ✅ `admin/vite.config.ts` - Change port 4200 → 4201
3. ✅ `api/src/main.ts` - Update CORS: Remove 4203, keep 4200 & 4201

**Risk**: 🟢 **LOW** - Simple config changes, no code logic affected

---

### **Routing Changes: NEEDS CAREFUL CONSIDERATION** 🟡

**Current HashRouter is INTENTIONAL, not a bug!**

**Reasons to KEEP HashRouter**:
- ✅ Simple deployment (no server config)
- ✅ Works on any static host
- ✅ No 404 errors
- ✅ Already working perfectly

**Reasons to SWITCH to BrowserRouter**:
- ✅ Clean URLs (better UX)
- ✅ Better SEO
- ✅ Professional appearance
- ✅ Better analytics

**If switching to BrowserRouter**:
1. Need to refactor 6+ files (landing + admin)
2. Need server rewrites (Vite dev + production)
3. Need to test all navigation flows
4. Need to update deployment config

**Recommendation**: 
- **For development**: Can keep HashRouter (works fine)
- **For production**: Switch to BrowserRouter (better SEO/UX)
- **Best approach**: Make it configurable via env variable!

---

## 🎯 PROPOSED CHANGES

### **Phase 1: Port Changes (SAFE)** ✅

1. Update `landing/vite.config.ts`: 4203 → 4200
2. Update `admin/vite.config.ts`: 4200 → 4201
3. Update `api/src/main.ts` CORS: `['http://localhost:4200', 'http://localhost:4201']`
4. Test all apps start correctly
5. Test API connections work

**Estimated time**: 10 minutes  
**Risk**: 🟢 Low

---

### **Phase 2: Routing Changes (COMPLEX)** ⚠️

**Option A: Keep HashRouter** (Recommended for now)
- ✅ No changes needed
- ✅ Everything works
- ✅ Zero risk
- ❌ URLs have `#`

**Option B: Switch to BrowserRouter** (Better long-term)
- ✅ Clean URLs
- ✅ Better SEO
- ❌ Requires refactoring
- ❌ Needs server config
- ❌ Higher risk

**Recommendation**: 
1. **Do port changes first** (Phase 1)
2. **Test thoroughly**
3. **Then decide** on routing changes (Phase 2)
4. If switching routing, do it as **separate task**

---

## 📝 FILES TO MODIFY (Port Changes Only)

### **Must Change**:
1. ✅ `landing/vite.config.ts` (Lines 12, 21)
2. ✅ `admin/vite.config.ts` (Lines 12, 20)
3. ✅ `api/src/main.ts` (Line 48 - CORS)

### **No Changes Needed**:
- ✅ All API client files (already use 4202)
- ✅ All image URL utilities (already use 4202)
- ✅ Database config (independent of ports)
- ✅ Admin → Landing references (will be correct after change)

---

## 🧪 TESTING CHECKLIST (After Port Changes)

### **1. Start All Services**:
```bash
pnpm dev:api      # Should start on 4202
pnpm dev:landing  # Should start on 4200
pnpm dev:admin    # Should start on 4201
```

### **2. Test Landing (http://localhost:4200)**:
- [ ] Homepage loads
- [ ] Navigate to Gallery
- [ ] Navigate to Menu
- [ ] Navigate to Blog
- [ ] Images load correctly
- [ ] API calls work (check Network tab)

### **3. Test Admin (http://localhost:4201)**:
- [ ] Login works
- [ ] Dashboard loads
- [ ] Pages management works
- [ ] Media upload works
- [ ] Preview button opens landing (http://localhost:4200)
- [ ] API calls work (check Network tab)

### **4. Test API (http://localhost:4202)**:
- [ ] Health check: `curl http://localhost:4202/health`
- [ ] CORS works from landing (4200)
- [ ] CORS works from admin (4201)
- [ ] Database queries work

---

## 🎉 CONCLUSION

**Port Changes**: ✅ **READY TO PROCEED**
- Simple config changes
- Low risk
- Clear impact
- Easy to test

**Routing Changes**: ⚠️ **NEEDS DISCUSSION**
- Current HashRouter is intentional
- Works perfectly for development
- BrowserRouter better for production
- Should be separate task

**Next Steps**:
1. User confirms: Do port changes only? Or also routing?
2. If only ports: Proceed with Phase 1 (10 minutes)
3. If routing too: Need detailed plan for Phase 2 (2-3 hours)

---

**Date**: October 12, 2025  
**Status**: ✅ **AUDIT COMPLETE - AWAITING USER DECISION**

