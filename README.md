# Lucy Garden — Technical Documentation
### Version 2.10.1.1 | Last Updated: 31 July 2026 | Built by Divyanshu Gupta

> Dairy supply management PWA — retailers daily orders place karte hain, admin dispatch aur payment manage karta hai, developer tools se poora system monitor hota hai.

---

## Table of Contents

| # | Section | Kya milega |
|---|---------|------------|
| 1 | [Project Overview & Tech Stack](#1-project-overview--tech-stack) | Architecture, dependencies, 3 user roles |
| 2 | [Folder & File Structure](#2-folder--file-structure) | Poora file tree with har file ka kaam |
| 3 | [Pages & Features](#3-pages--features) | Retailer, Admin, Developer — har page documented |
| 4 | [Data Layer — Firebase & Collections](#4-data-layer--firebase--collections) | Collections, fields, data flow |
| 5 | [Security, Rules & Sessions](#5-security-rules--sessions) | Firestore rules, lockout, roles, session system |
| 6 | [Setup, Deploy & Troubleshooting](#6-setup-deploy--troubleshooting) | Local setup, commands, deployment, common fixes |

---

## 1. Project Overview & Tech Stack

### Architecture

Yeh app **frontend-only** hai — koi backend server nahi, koi Node.js/Express nahi. React app seedha Firebase Firestore se baat karta hai.

```
User ka phone/browser
        ↓
React App (src/)
        ↓
firebase.js — tracked wrappers
        ↓
Firebase Firestore (Google Cloud)
```

### Tech Stack

| Package | Version | Kaam |
|---------|---------|------|
| `react` | 18.2.0 | UI framework |
| `react-router-dom` | 6.20.0 | Page routing |
| `firebase` | 10.7.0 | Database (Firestore) |
| `framer-motion` | 12.38.0 | Animations |
| `tailwindcss` | 3.4.0 | Styling |
| `lucide-react` | 1.14.0 | Icons |
| `jspdf` | 4.2.1 | PDF generation |

### 3 User Roles

| Role | Login | Home | Access |
|------|-------|------|--------|
| **Retailer** | Phone + PIN | `/` | Orders, tracking, ledger, support |
| **Admin** | Phone + PIN (`role: 'admin'` in Firebase) | `/admin` | Full business management |
| **Developer** | `8051725780` + PIN | `/dev` | Admin + 21 dev tools |

### Custom Colors (Tailwind)

| Color | Shades | Use |
|-------|--------|-----|
| `royal` | 50–950 | Brand blue — buttons, headers, active states |
| `mint` | 50–900 | Brand green — success, delivery, accents |

---

## 2. Folder & File Structure

```
Lucy-Garden/
│
├── public/
│   ├── index.html              ← Single HTML page — React yahan inject hota hai
│   ├── manifest.json           ← PWA config (name, icons, shortcuts, theme)
│   ├── sw.js                   ← Service Worker — offline caching
│   ├── logo192.png             ← App icon (home screen)
│   ├── logo512.png             ← App icon (splash)
│   ├── apple-touch-icon.png    ← iOS icon
│   ├── og-image.png            ← Social media preview
│   ├── robots.txt              ← SEO crawl rules
│   ├── sitemap.xml             ← SEO sitemap
│   ├── 404.html                ← Custom 404
│   └── dev-console/            ← Emergency standalone console (no React needed)
│       ├── index.html
│       ├── guide.html
│       ├── css/styles.css
│       └── js/
│           ├── app.js          ← Tab navigation, Firebase status
│           ├── auth.js         ← PIN auth + session tracking + heartbeat
│           ├── firebase.js     ← Firebase CDN (keys hardcoded here)
│           ├── utils.js        ← Helper functions
│           └── tabs/
│               ├── health.js       ← Firebase ping, system status
│               ├── errors.js       ← Error logs view/clear
│               ├── sessions.js     ← Users, force logout
│               ├── flags.js        ← Feature flags toggle
│               ├── maintenance.js  ← Maintenance mode toggle
│               └── backup.js       ← Backup create/restore
│
├── src/
│   ├── App.js                  ← Brain — routing, session verify, maintenance, splash
│   ├── index.js                ← Entry point — RootErrorBoundary + render
│   ├── index.css               ← Tailwind import + font-size classes + shimmer
│   │
│   ├── assets/
│   │   └── logo.png            ← App logo
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── RetailerLayout.js   ← Retailer shell (sidebar, bottom nav, banner)
│   │   │   ├── AdminLayout.js      ← Admin shell (dark sidebar, Dev Panel button)
│   │   │   └── DeveloperLayout.js  ← Dev shell (PIN gate, green theme)
│   │   ├── AppFooter.js        ← Responsive footer (retailer/admin mode)
│   │   ├── ConfirmModal.js     ← Promise-based confirm popup (6 types)
│   │   ├── ErrorBoundary.js    ← 3-level crash protection (Root/App/Dev)
│   │   ├── InstallPrompt.js    ← PWA install banner
│   │   ├── LoadingSkeleton.js  ← Delayed spinner (400ms) — 5 variants
│   │   ├── OfflineBanner.js    ← No internet warning bar
│   │   ├── PaymentBlock.js     ← Service suspended screen (developer payment)
│   │   ├── SplashScreen.js     ← Launch splash (premium 30d) + normal
│   │   ├── TopProgressBar.js   ← Page transition bar + PageLoader
│   │   └── WelcomePopup.js     ← First-time onboarding (3 slides)
│   │
│   ├── context/
│   │   └── FeatureFlags.js     ← Real-time feature toggle context
│   │
│   ├── hooks/
│   │   ├── useBottomSheet.js   ← Swipe-to-dismiss gesture
│   │   ├── useCache.js         ← In-memory stale-while-revalidate cache
│   │   ├── useDarkMode.js      ← Dark/light mode
│   │   ├── useFontSize.js      ← Font size (Small/Normal/Large)
│   │   ├── useLiveData.js      ← Firebase query cache hook
│   │   └── usePullToRefresh.js ← Pull-to-refresh gesture
│   │
│   ├── pages/
│   │   ├── Login.js            ← Phone + PIN login (lockout, session conflict)
│   │   ├── NotFound.js         ← 404 page
│   │   ├── retailer/           ← 15 retailer screens
│   │   ├── admin/              ← 13 admin screens
│   │   └── dev/                ← 21 developer tool screens
│   │
│   ├── services/
│   │   ├── firebase.js         ← Firebase init + tracked wrappers + cache system
│   │   └── errorLogger.js      ← Global error capture + solution matching
│   │
│   └── utils/
│       ├── autoCleanup.js      ← Daily data cleanup (runs once/day on app load)
│       ├── config.js           ← Central config (version, name, phone, developer)
│       ├── date.js             ← Date formatting helpers
│       ├── pdfHelper.js        ← jsPDF helpers (Hindi font, drawText)
│       ├── price.js            ← ₹ currency formatting
│       ├── session.js          ← Session utility functions
│       └── usageTracker.js     ← Firestore read/write counter (syncs every 10 min)
│
├── .env                        ← Firebase API keys (NEVER commit to git)
├── .firebaserc                 ← Firebase project ID
├── .gitignore                  ← node_modules, .env, build excluded
├── firebase.json               ← Hosting config (SPA rewrites, public: "build")
├── firestore.rules             ← Security rules (per-collection validation)
├── package.json                ← Dependencies + npm scripts
├── postcss.config.js           ← CSS processing (Tailwind ke liye — mat chhuo)
├── tailwind.config.js          ← Custom colors (royal, mint), shadows, animations
└── vercel.json                 ← Vercel SPA rewrites
```

---

## 3. Pages & Features

### Retailer Pages (`src/pages/retailer/`)

| File | Route | Kya dikhta hai |
|------|-------|----------------|
| `Home.js` | `/` | Dashboard — balance, today's order, monthly stats, streak, daily tip, delivery schedule |
| `PlaceOrder.js` | `/order` | Products list with +/- buttons — order window check, max items limit, seasonal flag, cart bar |
| `Checkout.js` | `/checkout` | Order review — duplicate check (4 states), min order, replace order, success animation |
| `TrackOrder.js` | `/track` | Real-time order status — progress timeline, Dispatch Slip PDF (blue), Invoice PDF (green), cancel button |
| `OrderHistory.js` | `/history` | Past orders — expand for items, re-order button |
| `MyLedger.js` | `/my-ledger` | Payment history — balance, date filter, debit/credit table |
| `PriceList.js` | `/prices` | Product prices — search, daily/seasonal groups, PDF rate card download |
| `Profile.js` | `/profile` | Read-only profile — name, shop, area, last login device |
| `Settings.js` | `/settings` | Dark mode, font size, PIN change (3-step), rate app, install app, clear cache |
| `Support.js` | `/support` | Raise ticket, view tickets, reply — WhatsApp/Call buttons |
| `Guide.js` | `/guide` | Step-by-step user guide — accordion, FAQ (hardcoded) |
| `About.js` | `/about` | About Lucy Garden — reads from `config.js` |
| `PrivacyPolicy.js` | `/privacy` | Privacy policy (8 sections) |
| `Terms.js` | `/terms` | Terms & conditions (11 sections) |
| `Blocked.js` | `/` | Blocked account screen — sirf Support page access |

**Feature flags jo retailer pages control karte hain:**

| Flag | Kya control karta hai |
|------|-----------------------|
| `seasonalProducts` | PlaceOrder mein seasonal section |
| `supportTickets` | Support page + nav link |
| `ledgerView` | MyLedger page + nav link |
| `pdfInvoice` | TrackOrder pe PDF buttons |
| `duplicateOrderCheck` | Checkout pe duplicate warning |
| `balanceWarning` | PlaceOrder pe due warning |
| `cancelOrder` | TrackOrder pe cancel button |
| `orderPlacement` | Sabhi ordering block karo |

---

### Admin Pages (`src/pages/admin/`)

| File | Route | Kya dikhta hai |
|------|-------|----------------|
| `Dashboard.js` | `/admin` | Stats cards, animated SVG donut chart (delivered/pending), top defaulters with WhatsApp, product demand, Report PDF |
| `DailyLedger.js` | `/admin/daily-ledger` | **Main daily work page** — retailers × products table, Dispatch/Deliver/Cancel/Return/Undo actions, Bulk Dispatch, Daily PDF (landscape), Seasonal PDF, CSV export, stock status banner, receipt PDF |
| `Retailers.js` | `/admin/retailers` | Add/edit/delete retailers — phone change (data transfer), balance badge, default PIN |
| `Inventory.js` | `/admin/inventory` | Products CRUD — groups system (name + PDF code), label (max 4 chars), bulk price update, daily max 20 limit |
| `Ledger.js` | `/admin/ledger` | Retailer ledger — collect payment, set balance, PDF, pagination (10/25/50/100) |
| `CompanyOrder.js` | `/admin/company-order` | Company-level daily summary — stock received input, area breakdown, PDF |
| `Settings.js` | `/admin/settings` | Order window, delivery window, session timeout, min order, max items, maintenance toggle, default PIN |
| `Sessions.js` | `/admin/sessions` | Active users — force logout, unblock, reset PIN, Force Logout All |
| `SupportTickets.js` | `/admin/support` | Tickets — status flow (Open → In Progress → Resolved), reply, search, pagination |
| `Announcements.js` | `/admin/announcements` | Send banners — type, target, expiry |
| `PlaceOrder.js` | `/admin/place-order` | Admin kisi bhi retailer ke liye order place kare |
| `OrderDetail.js` | `/admin/orders/:id` | Single order — status timeline, items, action buttons |
| `DevPanel.js` | `/dev` | App health — Firebase ping, stats, quick actions, console log |

**`settings/app` ke important fields:**

| Field | Default | Kya control karta hai |
|-------|---------|-----------------------|
| `maintenance` | false | Retailers ko block karta hai |
| `orderStart` | 12 | Order window start (hour, -1 = no limit) |
| `orderEnd` | 16 | Order window end |
| `sessionTimeout` | 24 | Hours before auto-logout |
| `minOrderAmount` | 0 | Minimum order amount (0 = no limit) |
| `maxOrderItems` | 0 | Max unique products per order (0 = no limit) |
| `allowModify` | true | Retailers replace order kar sakte hain |
| `defaultPin` | "1234" | Naye retailer ka default PIN |
| `shopPhone` | "9939079107" | Retailers ko dikhne wala contact number |

---

### Developer Pages (`src/pages/dev/`)

| File | Route | Kya karta hai |
|------|-------|---------------|
| `ErrorLogs.js` | `/dev/errors` | Crash logs — severity filter, stack trace, suggested fix, resolve/clear |
| `UserSessions.js` | `/dev/sessions` | Active users — force logout single/all |
| `OrderAnalytics.js` | `/dev/analytics` | Order trends — period filter, status breakdown, daily/hourly/product charts |
| `OrderManager.js` | `/dev/order-manager` | Orders browse + bulk status update |
| `RetailerActivity.js` | `/dev/activity` | Active/inactive retailers — color coded (green/amber/red/gray) |
| `DeployInfo.js` | `/dev/deploy` | Version, performance metrics, PWA status, Force Update button |
| `Announcements.js` | `/dev/announce` | Send banners — type, target, expiry, history |
| `DatabaseCleanup.js` | `/dev/cleanup` | Delete old data — 4 cleanup cards, auto-cleanup toggle, estimated savings |
| `FeatureFlags.js` | `/dev/flags` | 20 flags toggle — confirm modal, instant Firebase save |
| `AuditLog.js` | `/dev/audit` | Action history — filter by type, clear all |
| `AppRatings.js` | `/dev/ratings` | User ratings — star distribution, delete |
| `DataExport.js` | `/dev/export` | Export collections — JSON/CSV, select all |
| `BackupRestore.js` | `/dev/backup` | Local download + cloud backup + restore from file — double confirm |
| `ApiResponseMonitor.js` | `/dev/api-monitor` | Firebase latency — 6 endpoints, color coded, test history |
| `ScheduledTasks.js` | `/dev/tasks` | Maintenance jobs — 6 actions, Run Now (real operations) |
| `ConfigDiff.js` | `/dev/config-diff` | Live config vs defaults — diff display, copy JSON |
| `DocEditor.js` | `/dev/editor` | Database editor — browse/search/edit/delete any document |
| `BulkUpdate.js` | `/dev/bulk-update` | Bulk field update — filter → update all matched docs |
| `MonthlyReport.js` | `/dev/report` | Monthly summary — copy for WhatsApp, download .txt |
| `DevGuide.js` | `/dev/guide` | In-app developer documentation |

---

### Shared Components (`src/components/`)

| File | Kya karta hai |
|------|---------------|
| `ConfirmModal.js` | Promise-based confirm popup — `await confirm({ title, message, type })` — 6 types: danger/warning/logout/info/success/critical |
| `ErrorBoundary.js` | 3 levels — `RootErrorBoundary` (plain HTML, critical), `AppErrorBoundary` (styled React, high), `DevErrorBoundary` (dark, medium) — sabhi Firebase mein log karte hain |
| `AppFooter.js` | Desktop 3-column + mobile minimal — `type="retailer"` ya `"admin"` prop |
| `WelcomePopup.js` | First login pe 3 slides — Install App → User Guide → Rate Us — localStorage + Firebase double check |
| `SplashScreen.js` | Launch period (30 days) mein premium animated, baad mein minimal |
| `InstallPrompt.js` | `beforeinstallprompt` capture — `window.__lgInstallPrompt` global variable |
| `LoadingSkeleton.js` | 400ms delay ke baad spinner — DashboardSkeleton, TableSkeleton, OrderSkeleton, etc. |
| `TopProgressBar.js` | `triggerProgress()` / `stopProgress()` — module-level functions, `PageLoader` Suspense fallback |
| `OfflineBanner.js` | Offline → red bar, back online → green bar (3 sec auto-hide) |
| `PaymentBlock.js` | `siteBlock` flag se trigger — retailers ko generic, admin ko payment details |

---

## 4. Data Layer — Firebase & Collections

### `src/services/firebase.js` — Kaise Kaam Karta Hai

Yeh file seedha Firestore SDK use nahi karta — wrapped functions export karta hai jo:
1. Har operation pe `localStorage` mein usage counter increment karte hain
2. Har write mein `_appKey: 'LG_2026_dG7xPmKv9Q'` automatically add karte hain
3. Cache system provide karte hain (`cachedGetDoc`, `cachedGetDocs`)

```js
// Kisi bhi page mein import karo:
import { db, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
         collection, query, where, orderBy, onSnapshot,
         cachedGetDoc, cachedGetDocs, invalidateCache } from '../services/firebase';
```

**Cache functions:**

| Function | Kab use karo |
|----------|-------------|
| `cachedGetDoc(docRef, ttl)` | Single document — settings, user data |
| `cachedGetDocs(queryRef, key, ttl)` | Collection query — products, retailers |
| `invalidateCache(path)` | Write ke baad related cache clear karo |
| `invalidateCachePrefix(prefix)` | Prefix se matching sab keys clear |

---

### Firebase Collections — Complete Reference

| Collection | Purpose | Key Fields |
|-----------|---------|------------|
| `users` | Sabhi accounts | `phone`, `name`, `role`, `pin`, `area`, `shop`, `activeSession`, `sessionExpiry`, `blocked`, `loginAttempts`, `lockUntil`, `lockTier` |
| `orders` | Har order | `phone`, `items[]`, `total`, `status`, `date`, `actualItems[]`, `actualTotal`, `dispatchedAt`, `deliveredAt`, `cancelledAt` |
| `products` | Product catalog | `name`, `price`, `unit`, `type` (daily/seasonal), `group`, `label` (max 4 chars), `active` |
| `ledger` | Payment entries | `retailerId`, `amount`, `type` (debit/credit), `date`, `note`, `createdAt` |
| `retailer_balances` | Current dues | `balance` (number) |
| `support_tickets` | Help tickets | `phone`, `subject`, `message`, `status`, `messages[]` |
| `announcements` | Banner history | `message`, `type`, `target`, `expiresAt`, `createdAt` |
| `app_errors` | Crash logs | `message`, `stack`, `url`, `user`, `timestamp`, `severity`, `context` |
| `app_ratings` | User ratings | `phone`, `name`, `rating` (1–5), `createdAt`, `device` |
| `audit_log` | Action history | `action`, `description`, `performedBy`, `timestamp` |
| `company_orders` | Company daily orders | `items`, `date`, `updatedAt` |
| `daily_stock` | Stock received | `items`, `date`, `updatedAt` |
| `backups` | DB snapshots | `data` (JSON string), `createdAt`, `collections[]`, `docCount` |
| `scheduled_tasks` | Maintenance jobs | `name`, `schedule`, `action`, `enabled`, `lastRun`, `lastResult` |
| `order_history` | Archived orders | `phone`, `items`, `total`, `orderId`, `createdAt` |
| `notifications` | Notification history | `message`, `type`, `target`, `createdAt` |

### `settings` Collection — Documents

| Document ID | Key Fields |
|------------|------------|
| `app` | `maintenance`, `orderStart`, `orderEnd`, `deliveryStart`, `deliveryEnd`, `shopPhone`, `sessionTimeout`, `minOrderAmount`, `maxOrderItems`, `allowModify`, `defaultPin`, `autoCleanup`, `siteBlock` |
| `banner` | `active`, `message`, `type`, `target`, `expiresAt`, `createdAt` |
| `featureFlags` | 20 flags — `seasonalProducts`, `supportTickets`, `ledgerView`, `pdfInvoice`, `orderPlacement`, etc. |
| `areas` | `areas[]` — delivery area names |
| `productGroups` | `daily[]`, `seasonal[]`, `codes{}` — group order + PDF codes |
| `devAccess` | `pin` (string) — developer PIN |
| `usage_YYYY-MM-DD` | `reads`, `writes`, `deletes`, `date`, `lastSync` |

### Order Status Flow

```
Confirmed → Dispatched → Delivered
    ↓              ↓
Cancelled       Returned
```

### Balance Calculation

Balance `retailer_balances` collection se nahi — `ledger` collection se calculate hota hai (source of truth):

```js
balance = ledgerEntries.reduce((sum, e) => {
  if (e.type === 'debit')  return sum + e.amount;  // order placed
  return sum - e.amount;                            // payment received
}, 0);
```

### Data Flow Diagram

```
Retailer places order
        ↓
Checkout.js → addDoc('orders', orderData)
           → addDoc('order_history', snapshot)
        ↓
Admin opens DailyLedger
        ↓
Dispatch → updateDoc('orders', { status: 'Dispatched', actualItems, actualTotal })
        ↓
Deliver → updateDoc('orders', { status: 'Delivered' })
       → addDoc('ledger', { type: 'debit', amount: actualTotal })
       → addDoc('ledger', { type: 'credit', amount: payment })  ← agar payment ho
       → setDoc('retailer_balances', { balance: updated })
```

---

## 5. Security, Rules & Sessions

### Authentication Flow

```
Phone enter karo
        ↓
Firebase: users/{phone} exist karta hai?
        ↓ (haan)
PIN enter karo → users/{phone}.pin se compare
        ↓ (match)
createSession() → sessionId generate, Firebase update, localStorage save
        ↓
App.js verifyUser() → har app open pe session verify
```

**DEV_PHONE (`8051725780`) special behavior:**
- Phone step: Firebase check skip
- PIN: `settings/devAccess.pin` se check (default `0000`)
- Session: 4 hours (normal users ke liye `settings/app.sessionTimeout`)
- Maintenance/siteBlock bypass

**DEV_PHONE 2 jagah hardcoded hai — dono update karo:**
- `src/App.js` → `const DEV_PHONE = '8051725780'`
- `src/pages/Login.js` → `const DEV_PHONE = '8051725780'`

---

### Progressive Lockout System

**Phone step:**

| Galat attempts | Lock |
|----------------|------|
| 3 | 2 minutes |
| 3 aur | 10 minutes |
| 3 aur | Permanent (device block) |

**PIN step:**

| Galat attempts | Lock |
|----------------|------|
| 5 | 1 minute |
| 5 aur | 5 minutes |
| 5 aur | 30 minutes |
| 5 aur | Permanent (`users/{phone}.blocked = true`) |

Permanent block → Admin → Sessions → Unblock se theek hoga.

---

### Session System

**localStorage keys:**

| Key | Kya store hota hai |
|-----|--------------------|
| `lg_user_{phone}` | Full user + session object |
| `lg_user` | Same (backward compat) |
| `lg_last_login` | Last logged in phone |
| `lg_recent_phones` | Last 3 phones (quick login) |
| `lg_darkmode` | Dark mode preference |
| `lg_font_size` | Font size preference |

**sessionStorage keys (tab-specific):**

| Key | Kya store hota hai |
|-----|--------------------|
| `lg_active_phone` | Is tab ka active user |
| `lg_dev_verified` | Dev PIN verification + expiry (1 hour) |

**Session monitoring:**
- Retailers: polling har 2 min — agar `activeSession` change ho toh logout
- Admin: multi-device allowed — koi monitoring nahi
- Developer: sirf `sessionExpiry` check

---

### Firestore Rules — Summary

**`APP_WRITE_KEY`:** Har write mein `_appKey: 'LG_2026_dG7xPmKv9Q'` check hota hai — `firebase.js` automatically add karta hai.

**Per-collection rules:**

| Collection | Create Validation | Update | Delete | Special |
|-----------|-------------------|--------|--------|---------|
| `users` | name, phone, role, pin required; role in [retailer,admin]; phone 10 digits | ✅ | ✅ | — |
| `orders` | phone, items, total, status required; total ≥ 0 | ✅ | ✅ | — |
| `products` | name, price required; price ≥ 0 | ✅ (price ≥ 0) | ✅ | — |
| `ledger` | retailerId, amount, type required; type in [debit,credit]; amount ≥ 0 | ✅ | ✅ | — |
| `app_errors` | None (fully open) | ✅ | ✅ | Crash logging ke liye open |
| `app_ratings` | phone, rating required; rating 1–5 | ❌ DENIED | ✅ | Immutable ratings |
| `audit_log` | action, performedBy required | ❌ DENIED | ✅ | Tamper-proof log |
| `backups` | `isApp()` | ❌ DENIED | ✅ | Backup overwrite nahi |
| Everything else | ❌ DENIED | ❌ DENIED | ❌ DENIED | Deny-all fallback |

**Rules deploy karna:**
```bash
firebase deploy --only firestore:rules
```

---

### Security Limitations (Jaanna Zaroori Hai)

1. **Open read access** — sabhi collections mein `read: if true` — Firebase config jaanne wala data read kar sakta hai. `.env` file kabhi public nahi honi chahiye.

2. **Client-side PIN** — PIN Firestore mein plain text stored hai, client compare karta hai. Internal business tool ke liye suitable hai.

3. **Hardcoded DEV_PHONE** — change karne ke liye rebuild + redeploy zaroori hai.

---

### Common Security Operations

| Kya karna hai | Kahan |
|---------------|-------|
| Admin role dena | Firebase Console → `users/{phone}` → `role: "admin"` |
| Dev PIN change | Firebase Console → `settings/devAccess` → `pin: "newpin"` |
| User unblock | Admin → Sessions → Unblock |
| Session force clear | `users/{phone}` → `activeSession: ""` |
| Maintenance ON/OFF | Admin Settings → toggle / Firebase `settings/app.maintenance` |
| Feature flag toggle | `/dev/flags` page |
| API keys rotate | `.env` update + `.firebaserc` update + redeploy |

---

## 6. Setup, Deploy & Troubleshooting

### Local Setup

```bash
# 1. Dependencies install karo
npm install

# 2. .env file banao project root mein
REACT_APP_FIREBASE_API_KEY=<key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=<project_id>
REACT_APP_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<sender_id>
REACT_APP_FIREBASE_APP_ID=<app_id>

# 3. App start karo
npm start
# → http://localhost:3000
```

**.env keys kahan milti hain:** Firebase Console → Project Settings → General → Your apps → Web app → Config

---

### NPM Commands

| Command | Kya karta hai |
|---------|---------------|
| `npm start` | Dev server `localhost:3000` — hot reload |
| `npm run build` | Production build → `build/` folder |
| `npm run deploy` | Build + Firebase Hosting deploy |
| `firebase deploy --only firestore:rules` | Sirf rules update (no rebuild) |

---

### Deployment

**Firebase Hosting:**
```bash
npm run deploy
# = npm run build + firebase deploy
# firebase.json mein public: "build" + SPA rewrites configured hain
```

**Vercel:**
```
GitHub pe push karo → auto-deploy
Environment variables Vercel dashboard mein set karo (.env nahi)
vercel.json mein SPA rewrites configured hain
```

**Version update karna:**
```
src/utils/config.js → version: 'X.X.X.X'
Sab jagah automatically update ho jaata hai
```

---

### Troubleshooting

| Problem | Check | Fix |
|---------|-------|-----|
| White screen / app crash | Browser Console (F12) | `/dev/errors` ya Firebase status check |
| "Permission denied" | Firestore rules | `firestore.rules` mein collection add karo, redeploy |
| Data nahi dikh raha | Firebase Console → Firestore | Collection/document exist karta hai? |
| Login nahi ho raha | `users` collection | Phone document exist karta hai? PIN sahi hai? |
| Orders place nahi ho rahe | `settings/app` | `orderStart` aur `orderEnd` check karo |
| App stuck loading | Browser cache | Hard refresh (Ctrl+Shift+R) |
| Maintenance page aa raha hai | `settings/app.maintenance` | `false` set karo |
| Features nahi dikh rahe | `settings/featureFlags` | Flag value check karo |
| Session baar baar expire | `settings/app.sessionTimeout` | Hours value badhao |
| User blocked | `users/{phone}.blocked` | Admin → Sessions → Unblock |
| Firebase quota exceed | Firebase Console → Usage | `/dev/cleanup` se data delete karo |
| Build fail | `npm run build` output | Console error dekho |

---

### Emergency Procedures

**App completely down:**
```
1. yourdomain.com/dev-console/ kholo (React nahi chahiye)
2. Health tab → Firebase status check
3. Maintenance tab → maintenance OFF karo
4. Errors tab → recent crashes dekho
```

**Kisi user ko turant logout karna:**
```
Option 1 (fastest): Firebase Console → users/{phone} → activeSession: ""
Option 2: Admin → Sessions → Force Logout
Option 3: Dev Console → Sessions tab
```

**Database restore karna:**
```
/dev/backup → Restore File → JSON file select karo → double confirm
```

**Maintenance mode mein phans gaye:**
```
Admin maintenance se block nahi hota — seedha /admin jaao
Ya Firebase Console → settings/app → maintenance: false
Ya Dev Console → Maintenance tab
```

---

### Additional Documentation

| Document | Kya hai |
|----------|---------|
| `DEVELOPER_GUIDE.md` | Har file, har function, har Firebase field documented — kuch bhi change karna ho toh yahan dekho |
| `firestore.rules` | Security rules — per-collection validation |
| `/dev/guide` (in-app) | Developer tools guide — 21 tools documented |
| `/dev-console/guide.html` | Emergency console guide — React crash hone pe bhi accessible |

---

*Built by Divyanshu Gupta | Version 2.10.1.1 | 31 July 2026*
