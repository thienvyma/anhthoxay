# 🚨 Quick Fix Guide: Admin Issues

## ❌ Không Lưu Được Section Mới

### ✅ ĐÃ FIX!
**Vấn đề:** Missing `HERO_SIMPLE` trong backend schema  
**Status:** ✅ Fixed trong commit này

### 🔍 Nếu Vẫn Lỗi:

**1. Kiểm tra Console (F12)**
```
Có error gì? → Copy và report
```

**2. Kiểm tra Backend**
```bash
# Backend phải chạy ở port 4202
curl http://localhost:4202/health
```

**3. Restart Services**
```bash
# Stop tất cả (Ctrl+C)
# Restart backend
cd api && npm run dev

# Restart admin (terminal khác)
cd admin && npm run dev
```

**4. Clear Cache**
```
Ctrl+Shift+R (hard refresh)
hoặc Clear browser cache
```

---

## ❌ Không Login Được

**1. Check credentials**
```
Email: admin@example.com
Password: admin123
```

**2. Reset database**
```bash
cd infra
rm -f prisma/dev.db
npx prisma migrate dev
npm run seed
```

---

## ❌ Upload Ảnh Lỗi

**1. Check file size**
```
Max: 10MB
Formats: jpg, png, gif, webp
```

**2. Check backend logs**
```
Terminal chạy backend có error gì?
```

---

## ❌ Preview Không Cập Nhật

**1. Hard refresh preview**
```
Click vào iframe preview → Ctrl+Shift+R
```

**2. Restart landing**
```bash
cd landing && npm run dev
```

---

## 🆘 Emergency Reset

```bash
# 1. Stop all services (Ctrl+C)

# 2. Clean database
cd infra
rm -f prisma/dev.db
npx prisma migrate dev
npm run seed

# 3. Clear node_modules (if needed)
cd ..
rm -rf api/node_modules admin/node_modules landing/node_modules
npm install

# 4. Restart everything
npm run dev:all
```

---

## 📞 Still Having Issues?

**Provide:**
1. Screenshot of error
2. Console logs (F12 → Console tab)
3. Network tab (F12 → Network tab)
4. Steps to reproduce

**Check:**
- `TROUBLESHOOTING_SECTIONS.md` - Detailed guide
- `SECTION_SAVE_FIX_SUMMARY.md` - Recent fixes

---

## ✅ Health Check

```bash
# Backend
curl http://localhost:4202/health
# Should return: {"ok":true}

# Admin
curl http://localhost:3001
# Should return HTML

# Landing
curl http://localhost:3000
# Should return HTML
```

---

**Last Updated:** 2025-10-12  
**Version:** 1.0.0

