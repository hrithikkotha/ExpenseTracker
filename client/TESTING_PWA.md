# PWA Testing Guide

Quick guide to test all PWA features.

---

## Prerequisites

```bash
cd client
npm install
npm run build
npm run preview
```

Open: `http://localhost:4173`

---

## Test 1: Installation

### Desktop (Chrome/Edge)

1. Visit app
2. Look for install icon in address bar (⊕)
3. OR see install banner (top-right)
4. Click "Install"
5. App opens in standalone window
6. ✅ Check: App in Start Menu / Applications

### Android (Chrome)

1. Visit app
2. See "Add to Home Screen" banner (bottom)
3. Tap "Install"
4. ✅ Check: App icon on home screen
5. ✅ Check: Opens fullscreen (no browser UI)

### iOS (Safari)

1. Visit app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Confirm
5. ✅ Check: App icon on home screen

---

## Test 2: Offline Mode

### Setup
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers**
4. Check **Offline** checkbox

### Test Viewing Data
1. ✅ Dashboard loads
2. ✅ Transactions list loads
3. ✅ Calendar loads
4. ✅ Accounts load
5. ✅ Charts render

### Test Creating Transaction
1. Click "+" button
2. Fill form (amount, purpose, account, date)
3. Click "Add Expense"
4. ✅ Transaction appears immediately
5. ✅ Orange "Offline" badge shows in header
6. ✅ Blue banner shows "N changes pending sync"

---

## Test 3: Background Sync

### Test Auto-Sync
1. (Still offline) Create 3 transactions
2. ✅ All 3 appear in UI instantly
3. ✅ Banner shows "3 changes pending sync"
4. Uncheck **Offline** (go online)
5. ✅ Yellow banner shows "Syncing 3 items..."
6. Wait 2-5 seconds
7. ✅ Green banner shows "Back online" (auto-hides after 3s)
8. ✅ Pending count becomes 0
9. Refresh page
10. ✅ Transactions still there (synced to server)

### Test Manual Sync
1. Go offline
2. Create 2 transactions
3. Go online
4. Click "Sync Now" button in blue banner
5. ✅ Immediately starts syncing
6. ✅ Success: Pending count becomes 0

---

## Test 4: Network Status Banner

### Offline State
1. Go offline
2. ✅ Red banner: "You're offline • N changes pending"

### Syncing State
1. Go online with pending items
2. ✅ Yellow banner: "Syncing N items..." (with spinner)

### Pending State
1. (Online) If sync hasn't started automatically
2. ✅ Blue banner: "N changes pending sync" + "Sync Now" button

### Back Online State
1. Come back online (no pending items)
2. ✅ Green banner: "Back online" (auto-hides after 3 seconds)

---

## Test 5: Update Mechanism

### Trigger Update
1. Make a small code change (e.g., change a text)
2. Build: `npm run build`
3. Keep old app open
4. Visit new build in incognito: `http://localhost:4173`
5. ✅ Old app shows: "A new version is available!"
6. Click "Update"
7. ✅ App reloads with new version

---

## Test 6: Install Prompt

### Desktop
1. Visit app (not yet installed)
2. ✅ Banner appears top-right
3. ✅ Shows app icon, title, description
4. Click "Not Now"
5. ✅ Banner dismisses
6. Refresh page
7. ✅ Banner doesn't show (7-day cooldown)
8. Clear localStorage: `localStorage.removeItem('pwa-install-dismissed')`
9. Refresh
10. ✅ Banner appears again

### Mobile
1. Visit app on mobile
2. ✅ Banner appears bottom (above nav)
3. ✅ Shows app icon, title
4. Click X to dismiss
5. ✅ Banner dismisses

---

## Test 7: Service Worker Cache

### Check Cache
1. Open DevTools → Application → Cache Storage
2. ✅ See `workbox-precache-v2-...` cache
3. ✅ Contains: index.html, CSS, JS, fonts
4. ✅ See `api-cache`
5. ✅ Contains: recent API responses

### Test Cache First
1. Visit app
2. Go offline
3. ✅ All static assets load (HTML, CSS, JS)
4. ✅ Images load (if previously cached)

### Test Network First
1. Visit app (online)
2. Go to Transactions page (loads from server)
3. Go offline
4. ✅ Transactions still visible (from cache)
5. ✅ Data is recent (not stale)

---

## Test 8: IndexedDB Storage

### Check Database
1. DevTools → Application → IndexedDB
2. ✅ See `ExpenseTrackerDB` database
3. ✅ Tables: transactions, accounts, budgets, syncQueue, metadata

### Check Transactions Table
1. Create transaction offline
2. Expand `transactions` table
3. ✅ See transaction with `syncStatus: 'pending'`
4. ✅ Has `localOnly: true`

### Check Sync Queue
1. Expand `syncQueue` table
2. ✅ See queue item
3. ✅ Has `status: 'pending'`
4. ✅ Has `operation: 'CREATE'`
5. ✅ Has `endpoint: '/api/v1/transactions'`

### After Sync
1. Go online, wait for sync
2. Refresh IndexedDB
3. ✅ `syncQueue` is empty
4. ✅ Transaction has `syncStatus: 'synced'`
5. ✅ Transaction has `serverId` from server

---

## Test 9: Manifest Validation

### Check Manifest
1. DevTools → Application → Manifest
2. ✅ No errors
3. ✅ Name: "Expense Tracker"
4. ✅ Short name: "Expense"
5. ✅ Display: "standalone"
6. ✅ Theme color: "#6366f1"
7. ✅ Icons: 192x192, 512x512
8. ✅ All icons have green checkmarks

---

## Test 10: Performance

### First Load (Cold)
1. Clear cache and hard refresh (Ctrl+Shift+R)
2. Open Network tab
3. ✅ Page loads in ~2-3 seconds

### Repeat Visit (Warm)
1. Refresh normally (F5)
2. ✅ Page loads in ~500ms (from cache!)
3. Check Network tab
4. ✅ Most assets loaded from "ServiceWorker"

### Offline Load
1. Go offline
2. Refresh
3. ✅ Page loads **instantly** (100% cached)

---

## Test 11: Storage Quota

### Check Usage
1. Open DevTools console
2. Run:
```javascript
navigator.storage.estimate().then(est => {
  console.log(`Used: ${Math.round(est.usage / 1024 / 1024)}MB`);
  console.log(`Quota: ${Math.round(est.quota / 1024 / 1024)}MB`);
  console.log(`Percent: ${Math.round(est.usage / est.quota * 100)}%`);
});
```
3. ✅ Usage is reasonable (< 10MB typically)

---

## Test 12: Error Handling

### Network Error
1. Go offline
2. Try to create transaction
3. ✅ Transaction created locally
4. ✅ No error shown to user
5. ✅ Pending indicator appears

### Sync Error (Auth)
1. Clear access token: `localStorage.clear()`
2. Go online
3. ✅ Sync fails
4. ✅ Red banner: "Sync failed • 1 item could not be synced"
5. ✅ Item stays in queue
6. Login again
7. ✅ Auto-retries and succeeds

---

## Test 13: Cross-Device Sync

### Device A (Phone)
1. Create transaction offline
2. ✅ Shows "Pending sync"
3. Go online
4. ✅ Auto-syncs

### Device B (Desktop)
1. Refresh page
2. ✅ See transaction created on phone
3. ✅ Data is synchronized

---

## Test 14: Multiple Tabs

### Tab 1
1. Go offline
2. Create 2 transactions

### Tab 2
1. (Same app, different tab)
2. ✅ Pending count updates
3. ✅ Banner shows correct count

### Both Tabs
1. Go online
2. ✅ Both tabs show syncing
3. ✅ Only syncs once (no duplicates)

---

## Test 15: Browser Compatibility

### Chrome ✅
- [x] Install works
- [x] Offline works
- [x] Background sync works
- [x] All features work

### Edge ✅
- [x] Install works
- [x] Offline works
- [x] Background sync works
- [x] All features work

### Firefox ✅
- [x] Install works
- [x] Offline works
- [x] Background sync works
- [x] All features work

### Safari (macOS) ⚠️
- [x] Install works
- [x] Offline works
- [ ] Background sync limited
- [x] Most features work

### Safari (iOS) ⚠️
- [x] Manual install works
- [x] Offline works
- [ ] Background sync not supported
- [ ] Install prompt not supported

---

## Common Issues

### Issue: Service Worker Not Registering
**Check**:
- Running on HTTPS (or localhost)
- No console errors
- Service worker file is accessible

**Fix**:
```bash
# Clear cache
# Unregister old service workers in DevTools
# Hard refresh
```

### Issue: Install Prompt Not Showing
**Check**:
- Not already installed
- Not dismissed recently
- Manifest accessible

**Fix**:
```javascript
localStorage.removeItem('pwa-install-dismissed');
// Refresh page
```

### Issue: Sync Not Working
**Check**:
- Online
- Auth token valid
- Sync queue has items

**Debug**:
```javascript
// Check sync queue
import { getSyncQueueStats } from '@/pwa/sync/syncQueue';
const stats = await getSyncQueueStats();
console.log(stats);

// Manual sync
import { syncPendingData } from '@/pwa/sync/backgroundSync';
await syncPendingData();
```

---

## Automated Testing Commands

```bash
# Type checking
npm run typecheck

# Build
npm run build

# Preview production
npm run preview

# Lint
npm run lint
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Generate custom app icons (see `public/ICONS_README.md`)
- [ ] Test on real devices (Android, iOS)
- [ ] Test offline mode thoroughly
- [ ] Test background sync
- [ ] Test install flow
- [ ] Test update mechanism
- [ ] Verify HTTPS is enabled
- [ ] Check manifest is accessible
- [ ] Test on multiple browsers
- [ ] Monitor storage usage
- [ ] Check console for errors
- [ ] Test cross-device sync
- [ ] Verify network status indicators
- [ ] Test with slow 3G connection
- [ ] Check performance metrics

---

## Success Criteria

✅ **All tests pass**  
✅ **No console errors**  
✅ **Lighthouse PWA score > 90**  
✅ **Works offline seamlessly**  
✅ **Auto-sync on reconnection**  
✅ **Installable on all platforms**  
✅ **Fast repeat visits (< 1s)**  
✅ **Update mechanism works**  
✅ **Network status accurate**  
✅ **No data loss offline**  

---

**Happy Testing! 🚀**
