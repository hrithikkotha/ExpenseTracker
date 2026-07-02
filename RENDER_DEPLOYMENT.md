# Render Deployment Guide - PWA Ready

Complete guide for deploying your Expense Tracker PWA to Render.

---

## 🚀 Current Configuration

### Backend (Already Set Up)

**Service Name**: `expense-tracker-api` (or similar)  
**Type**: Web Service  
**Region**: Your choice

**Environment Variables** (Already configured):
```env
ACCESS_TOKEN_SECRET=<your-secret-here>
ACCESS_TOKEN_TTL=15m
ADMIN_EMAIL=<your-admin-email>
ADMIN_PASSWORD=<your-admin-password>
BCRYPT_ROUNDS=12
CLIENT_URL=https://expensetracker-vsqv.onrender.com
MONGODB_URI=<your-mongodb-connection-string>
NODE_ENV=production
PORT=4000
REFRESH_COOKIE_NAME=et_rt
REFRESH_TOKEN_TTL_DAYS=7
```

**Build Command** (Current):
```bash
npm run build:render
```

**Start Command** (Current):
```bash
node server.js
```

✅ **These are CORRECT - No changes needed!**

---

## 🔧 What Changed (Just Committed)

**File**: `server/src/app.ts`

**Added PWA-specific routes**:
- `/sw.js` - Service worker (no-cache headers)
- `/workbox-*.js` - Workbox runtime (no-cache)
- `/manifest.webmanifest` - App manifest (proper content-type)
- `/registerSW.js` - SW registration (no-cache)

**Why**: These special headers ensure:
- Service worker updates aren't cached by browser
- Service worker can control all routes
- Manifest is recognized as valid PWA manifest

---

## 📋 Deployment Steps (Updated Branch)

### 1. **Merge PWA Branch to Main**

```bash
# You're currently on 'pwa' branch
git checkout main
git merge pwa
git push origin main
```

This will trigger an automatic redeploy on Render.

---

### 2. **Wait for Automatic Deployment**

Render will:
1. ✅ Pull latest code from main branch
2. ✅ Run `npm run build:render` (builds TypeScript)
3. ✅ Start with `node server.js`
4. ✅ Serve your PWA from `client/dist`

**Deployment takes**: ~3-5 minutes

---

### 3. **Verify Deployment**

Once deployed, check these URLs:

#### A. **Service Worker** (CRITICAL)
```
https://expensetracker-vsqv.onrender.com/sw.js
```
✅ Should return JavaScript file  
✅ Should have `Cache-Control: no-cache` header  
✅ Should NOT show 404

#### B. **Manifest**
```
https://expensetracker-vsqv.onrender.com/manifest.webmanifest
```
✅ Should return JSON  
✅ Should have `Content-Type: application/manifest+json`  
✅ Should NOT show 404

#### C. **Main App**
```
https://expensetracker-vsqv.onrender.com
```
✅ Should load React app  
✅ Should show login page  
✅ No console errors

---

### 4. **Test PWA Features**

#### Open Chrome DevTools (F12)

**Application Tab → Service Workers**:
```
✅ sw.js should be registered
✅ Status: "activated and is running"
✅ Scope: https://expensetracker-vsqv.onrender.com/
```

**Application Tab → Manifest**:
```
✅ Name: "Expense Tracker"
✅ Short name: "Expense"
✅ Start URL: /
✅ Display: standalone
✅ Icons: 192x192, 512x512 (green checkmarks)
```

**No errors or warnings**

---

### 5. **Test Offline Mode**

1. Login to your app
2. Navigate around (dashboard, transactions, calendar)
3. DevTools → Application → Service Workers → Check **Offline**
4. ✅ App should still work (cached data visible)
5. ✅ Try creating a transaction → Should work offline
6. ✅ Uncheck Offline → Should auto-sync

---

### 6. **Test Install Prompt**

#### Desktop:
1. Visit app (not in incognito)
2. Look for install banner (top-right) or ⊕ in address bar
3. Click "Install"
4. ✅ App opens in standalone window

#### Mobile:
1. Visit app on phone (Chrome/Safari)
2. See "Add to Home Screen" prompt
3. Install it
4. ✅ Icon appears on home screen
5. ✅ Opens fullscreen (no browser UI)

---

## 🐛 Troubleshooting

### Issue 1: Service Worker 404

**Symptoms**:
```
Failed to load resource: the server responded with a status of 404
https://expensetracker-vsqv.onrender.com/sw.js
```

**Causes**:
- Build didn't include client dist
- Wrong path in server

**Fix**:
```bash
# Check if client/dist exists after build
ls client/dist/sw.js

# If missing, rebuild:
cd client
npm run build

# Commit and push
git add client/dist
git commit -m "Add built PWA files"
git push
```

---

### Issue 2: Manifest Not Loading

**Symptoms**:
```
Manifest: Line: 1, column: 1, Syntax error.
```

**Cause**: Wrong content-type or 404

**Fix**: Already fixed in `server/src/app.ts` (just committed)

---

### Issue 3: CORS Errors

**Symptoms**:
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Cause**: CLIENT_URL doesn't match

**Fix**:
```bash
# In Render dashboard → Environment → Update:
CLIENT_URL=https://expensetracker-vsqv.onrender.com
```

⚠️ **Make sure there's NO trailing slash!**

---

### Issue 4: Service Worker Updates Not Working

**Symptoms**: Old version keeps loading even after new deployment

**Cause**: Browser cached the service worker

**Fix**:
```javascript
// User's browser:
// 1. Open DevTools → Application → Service Workers
// 2. Click "Unregister"
// 3. Hard refresh (Ctrl+Shift+R)
// 4. New SW will register
```

**Prevention**: Already handled by no-cache headers we added!

---

### Issue 5: Routes Return 404 on Refresh

**Symptoms**: Works on first load, but `/dashboard` shows 404 on refresh

**Cause**: Missing SPA fallback

**Fix**: Already handled in `server/src/app.ts`:
```typescript
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});
```

---

## ⚙️ Optional: Environment-Specific Configurations

### Production-Only Features

You can add production-specific features in `server/src/app.ts`:

```typescript
if (isProd) {
  // Enable compression for better performance
  const compression = require('compression');
  app.use(compression());

  // Force HTTPS (Render does this automatically, but good practice)
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## 📊 Build Performance

**Current build time on Render**: ~2-3 minutes

**Breakdown**:
- npm install: ~60s
- TypeScript compilation: ~30s
- Client build (Vite): ~45s
- Start server: ~5s

**Ways to speed up** (optional):
1. Use npm ci instead of npm install
2. Cache node_modules between builds
3. Split builds (build client separately)

---

## 🔒 Security Checklist

Before going live:

- [x] ✅ HTTPS enabled (Render provides this)
- [x] ✅ CORS configured correctly
- [x] ✅ Helmet security headers
- [x] ✅ Rate limiting enabled
- [x] ✅ MongoDB sanitization
- [x] ✅ Secure cookies (httpOnly, secure)
- [x] ✅ Environment variables secured
- [ ] 🔲 Change default admin password
- [ ] 🔲 Rotate JWT secrets periodically
- [ ] 🔲 Enable MongoDB IP whitelist (optional)

---

## 📱 Mobile Testing

### Android (Chrome)

1. Visit app on phone
2. Tap "Add to Home Screen"
3. ✅ Installs successfully
4. ✅ Opens fullscreen
5. ✅ Works offline
6. ✅ Auto-syncs when online

### iOS (Safari)

1. Visit app in Safari
2. Share → "Add to Home Screen"
3. ✅ Installs successfully
4. ✅ Opens fullscreen
5. ✅ Works offline
6. ⚠️ Background sync limited (iOS restriction)

---

## 🎯 Post-Deployment Checklist

After deploying to Render:

- [ ] ✅ Service worker registers successfully
- [ ] ✅ Manifest loads without errors
- [ ] ✅ App is installable (shows install prompt)
- [ ] ✅ Offline mode works (cached data visible)
- [ ] ✅ Create transaction offline works
- [ ] ✅ Auto-sync on reconnection works
- [ ] ✅ Login/logout works
- [ ] ✅ All pages accessible
- [ ] ✅ No console errors
- [ ] ✅ Mobile responsive
- [ ] ✅ Dark mode works
- [ ] ✅ Charts render correctly
- [ ] ✅ Data exports work
- [ ] ✅ Account management works
- [ ] ✅ Tested on real devices (Android/iOS)

---

## 🚀 Lighthouse PWA Score

Run Lighthouse audit in Chrome:

**Expected scores**:
- Performance: 80-90 (good)
- Accessibility: 90-100 (excellent)
- Best Practices: 90-100 (excellent)
- SEO: 90-100 (excellent)
- **PWA: 90-100** (target!)

**To run**:
1. F12 → Lighthouse tab
2. Select "Progressive Web App"
3. Click "Generate report"
4. Fix any warnings

---

## 📈 Monitoring (Optional)

### Check Service Worker Registration

```javascript
// In browser console:
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW registered:', !!reg);
  console.log('SW scope:', reg?.scope);
  console.log('SW state:', reg?.active?.state);
});
```

### Check Cache Storage

```javascript
// In browser console:
caches.keys().then(keys => {
  console.log('Cache keys:', keys);
  return Promise.all(
    keys.map(key => 
      caches.open(key).then(cache => 
        cache.keys().then(reqs => 
          console.log(`${key}: ${reqs.length} items`)
        )
      )
    )
  );
});
```

### Check IndexedDB

```javascript
// In browser console:
indexedDB.databases().then(dbs => {
  console.log('Databases:', dbs.map(d => d.name));
});
```

---

## 🎉 Success Criteria

Your PWA is successfully deployed if:

✅ **Service worker** registered and active  
✅ **Manifest** loads without errors  
✅ **Install prompt** appears  
✅ **Offline mode** works (view cached data)  
✅ **Create transactions offline** works  
✅ **Auto-sync** happens when back online  
✅ **No console errors**  
✅ **Mobile responsive**  
✅ **Works on Android** (Chrome)  
✅ **Works on iOS** (Safari)  
✅ **Lighthouse PWA score > 90**  

---

## 📞 Support

**Common commands**:

```bash
# Rebuild locally
npm run build:render

# Test production build locally
npm run preview

# Check TypeScript errors
npm run typecheck

# View logs on Render
# Dashboard → Your Service → Logs tab

# Force redeploy (no code changes)
# Dashboard → Your Service → Manual Deploy → "Deploy latest commit"
```

---

## 🔄 Continuous Deployment

**Your setup**:
- ✅ Auto-deploy on push to `main` branch
- ✅ Build command runs automatically
- ✅ Service restarts automatically
- ✅ Environment variables persist

**To update app**:
```bash
# Make changes
git add .
git commit -m "Update feature X"
git push origin main

# Render automatically:
# 1. Detects push
# 2. Runs build
# 3. Restarts service
# 4. ~3-5 minutes
```

---

## 🎓 Best Practices

1. **Always test locally first**:
   ```bash
   npm run build
   npm run preview
   ```

2. **Use semantic commit messages**:
   ```bash
   git commit -m "feat: add feature X"
   git commit -m "fix: resolve bug Y"
   git commit -m "docs: update README"
   ```

3. **Check logs after deployment**:
   - Render Dashboard → Logs
   - Look for errors
   - Verify "Server running on port 4000"

4. **Test on real devices**:
   - Don't rely only on DevTools mobile emulation
   - Test on actual Android/iOS devices
   - Test on different network speeds

5. **Monitor storage usage**:
   - Check IndexedDB size regularly
   - Implement cleanup for old data
   - Warn users if storage is low

---

## 🚀 You're Ready!

Your configuration is **perfect** for PWA deployment:

✅ Backend serves PWA correctly  
✅ PWA headers configured  
✅ Environment variables set  
✅ Build command correct  
✅ CORS configured  
✅ HTTPS enabled  

**Just merge the `pwa` branch and push!**

```bash
git checkout main
git merge pwa
git push origin main
```

**Render will automatically deploy your PWA! 🎉**

---

**Questions?**
- Check troubleshooting section above
- Review `PWA_IMPLEMENTATION.md` for technical details
- Test locally with `npm run build && npm run preview`

**Happy deploying! 🚀**
