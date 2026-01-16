# 🔥 Firebase Configuration - NỘI THẤT NHANH

## 📋 Project Info

- **Project ID**: `noithatnhanh-f8f72`
- **Account**: `thienvyma@gmail.com`
- **Region**: `asia-southeast1` (Singapore)

## 🚀 Quick Start

### Prerequisites
```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Deploy Commands

```bash
# Navigate to firebase folder
cd infra/firebase

# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting:landing
firebase deploy --only hosting:admin
firebase deploy --only hosting:portal
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

### Local Development with Emulators

```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only auth,firestore,storage

# Emulator UI: http://localhost:4000
```

## 📁 File Structure

```
infra/firebase/
├── firebase.json           # Main config (hosting, functions, emulators)
├── .firebaserc             # Project aliases and hosting targets
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore composite indexes
├── storage.rules           # Storage security rules
├── functions/              # Cloud Functions (Phase 9)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
└── README.md               # This file
```

## 🌐 Hosting Targets

| Target | Site ID | URL |
|--------|---------|-----|
| landing | noithatnhanh-landing | https://noithatnhanh-landing.web.app |
| admin | noithatnhanh-admin | https://noithatnhanh-admin.web.app |
| portal | noithatnhanh-portal | https://noithatnhanh-portal.web.app |

### Setup Hosting Targets (First Time)

```bash
# Create hosting sites
firebase hosting:sites:create noithatnhanh-landing
firebase hosting:sites:create noithatnhanh-admin
firebase hosting:sites:create noithatnhanh-portal

# Apply targets (already configured in .firebaserc)
firebase target:apply hosting landing noithatnhanh-landing
firebase target:apply hosting admin noithatnhanh-admin
firebase target:apply hosting portal noithatnhanh-portal
```

## 🔐 Security Rules

### Firestore Rules Summary

| Collection | Public Read | Auth Read | Auth Write | Admin Only |
|------------|-------------|-----------|------------|------------|
| users | ❌ | Own only | Own only | Full |
| pages, blogPosts | ✅ (published) | ✅ | ❌ | Full |
| leads | ❌ | ❌ | Create only | Full |
| projects | ✅ (OPEN) | Own/Contractor | Own | Full |
| escrows, fees | ❌ | Participants | ❌ | Full |
| conversations | ❌ | Participants | Participants | Full |

### Storage Rules Summary

| Path | Public Read | Auth Write | Notes |
|------|-------------|------------|-------|
| /media/*, /blog/*, /gallery/* | ✅ | Manager+ | Public assets |
| /portfolio/{userId}/* | ✅ | Owner | Contractor portfolio |
| /documents/{userId}/* | ❌ | Owner | Private documents |
| /avatars/{userId}/* | ✅ | Owner | User avatars |

## 🧪 Emulator Ports

| Service | Port |
|---------|------|
| Auth | 9099 |
| Functions | 5001 |
| Firestore | 8080 |
| Storage | 9199 |
| Emulator UI | 4000 |

### Connect to Emulators in Code

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const app = initializeApp(firebaseConfig);

if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(getFirestore(app), 'localhost', 8080);
  connectAuthEmulator(getAuth(app), 'http://localhost:9099');
  connectStorageEmulator(getStorage(app), 'localhost', 9199);
}
```

## 📊 Indexes

Composite indexes are defined in `firestore.indexes.json` for:
- Leads (status + createdAt, source + createdAt)
- Blog posts (status + publishedAt, categoryId + publishedAt)
- Projects (status + createdAt, ownerId + createdAt, regionId + status + createdAt)
- Bids (contractorId + createdAt, status + createdAt)
- And more...

## 🔄 CI/CD

### GitHub Actions (Example)

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build apps
        run: |
          pnpm nx build landing
          pnpm nx build admin
          pnpm nx build portal
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: noithatnhanh-f8f72
```

## 📝 Notes

- **Blaze Plan Required**: Functions require Blaze (pay-as-you-go) plan
- **Free Tier**: Hosting, Firestore, Storage, Auth all have generous free tiers
- **Region**: All services should be in `asia-southeast1` for best latency

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/project/noithatnhanh-f8f72)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Hono Firebase Adapter](https://hono.dev/docs/getting-started/firebase)
