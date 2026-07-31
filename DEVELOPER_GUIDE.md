# Lucy Garden — Developer Guide
### Version 02.10.01.01 | Last Updated: 31 July 2026 | Author: Divyanshu Gupta

> Yeh guide is liye likhi gayi hai taaki koi bhi developer — chahe project pehli baar dekh raha ho — kuch bhi change, add, ya debug kar sake bina kisi confusion ke. Har file, har function, har Firebase field yahan documented hai.

---

## Table of Contents

### 1. Project Overview & Architecture
`src/utils/config.js` · `.env` · `src/index.js` · `src/index.css` · `firebase.json`

| Section | Kya milega |
|---------|------------|
| [1.1 Big Picture — App Flow](#11-big-picture--app-kaise-kaam-karta-hai) | Architecture diagram, no-backend explanation |
| [1.2 Tech Stack](#12-tech-stack--exact-versions) | Exact package versions |
| [1.3 Folder Structure](#13-folder-structure--har-folder-ka-kaam) | Poora file tree with har file ka kaam |
| [1.4 `config.js` — Central Config](#14-file-srcutilsconfigjs--central-configuration) | version, appName, phone — kahan-kahan use hota hai |
| [1.5 `.env` — Firebase Keys](#15-file-env--firebase-secret-keys) | Keys format, kahan milti hain, project switch karna |
| [1.6 `index.js` — Entry Point](#16-file-srcindexjs--entry-point) | RootErrorBoundary wrap |
| [1.7 `index.css` — Global Styles](#17-file-srcindexcss--global-styles) | Tailwind, font-size classes, shimmer animation |
| [1.8 Build & Deploy Workflow](#18-build--deploy-workflow) | npm start / build / deploy, Firebase rules deploy |
| [1.9 `firebase.json` — Hosting Config](#19-firebasejson--hosting-config) | SPA rewrites kyon zaroori hain |
| [1.10 Complete File Count](#110-complete-file-count) | 102 files ka breakdown |

---

### 2. App.js — Brain of the App
`src/App.js` — routing, session verification, splash, maintenance, blocked user

| Section | Kya milega |
|---------|------------|
| [2.1 File Structure](#21-file-ka-structure--ek-nazar-mein) | LoginSuccess, MaintenancePage, AppContent, App() |
| [2.2 DEV_PHONE Constant](#22-constants--sabse-pehle-jaano) | 2 jagah hai, kya karta hai, kaise change karo |
| [2.3 State Variables](#23-state-variables) | user, loading, splashDone, maintenance, siteBlock |
| [2.4 Splash Screen Logic](#24-splash-screen-logic) | Launch period, duration, App.js vs SplashScreen.js |
| [2.5 Maintenance & siteBlock](#25-maintenance--siteblock-check) | Firebase flags, cache TTL, PaymentBlock |
| [2.6 `verifyUser()` — 12-Step Flow](#26-verifyuser--session-verification-sabse-important-function) | Per-tab isolation, offline behavior, verify cache |
| [2.7 Session Monitoring — Polling](#27-session-monitoring--polling-every-2-minutes) | Kyon polling, onSnapshot nahi |
| [2.8 Session Expiry Check](#28-session-expiry-check-every-5-minutes) | Har 5 min check |
| [2.9 `handleLogin()` — Success Flow](#29-handlelogin--login-success-flow) | Double-login prevention, animation, device update |
| [2.10 Router — Complete Route Map](#210-router--usememo-mein-kyon-hai) | Retailer (14) + Admin (12) + Dev (21) routes table |
| [2.11 Blocked Retailer Router](#211-blocked-retailer--alag-router) | Alag router kyon, block/unblock kaise |
| [2.12 Final Render Logic](#212-final-render-logic--kya-dikhega) | Decision tree — kya dikhega kab |
| [2.13 Naya Page Add Karna](#213-naya-page-add-karna--exact-4-steps) | Exact 4 steps with code |
| [2.14 `App()` Root Export](#214-app--root-export) | ConfirmProvider + FeatureFlagProvider wrap order |

---

### 3. Firebase Service & Data Layer
`src/services/firebase.js` · `src/utils/usageTracker.js` · `src/utils/autoCleanup.js` · `src/services/errorLogger.js`

| Section | Kya milega |
|---------|------------|
| [3.1 `firebase.js` — Connection + Wrappers + Cache](#31-file-srcservicesfirebasejs--connection--wrappers--cache) | Initialization, offline persistence disabled kyon |
| [3.2 APP_WRITE_KEY](#32-app_write_key--write-authorization) | Write authorization, har write mein auto-add |
| [3.3 Usage Tracking — `_track()`](#33-usage-tracking--_track-function) | Kaunse operations tracked hain, kaunse nahi |
| [3.4 Cache System](#34-cache-system--complete-reference) | cachedGetDoc, cachedGetDocs, getCachedDocs, invalidateCache, TTL reference |
| [3.5 Exported Functions](#35-exported-functions--complete-list) | writeBatch, serverTimestamp, onSnapshot — kab kya use karo |
| [3.6 `usageTracker.js`](#36-file-srcutilsusagetrackerjs--firestore-usage-counter) | Local counter → Firebase sync, 10 min interval |
| [3.7 `autoCleanup.js`](#37-file-srcutilsautocleanupjs--daily-data-cleanup) | Kab chalta hai, cleanup targets, kabhi delete nahi hota |
| [3.8 `errorLogger.js`](#38-file-srcserviceserrorloggerjs--global-error-tracking) | 3 global listeners, deduplication, 12 known patterns |
| [3.9 Firebase Collections](#39-firebase-collections--complete-reference) | 16 collections + settings documents + field details |
| [3.10 Firebase Console Direct Edit](#310-firebase-console--direct-data-edit-karna) | Common operations table |

---

### 4. Authentication & Session System
`src/pages/Login.js` — phone + PIN login, lockout, session creation, roles

| Section | Kya milega |
|---------|------------|
| [4.1 Login Page Layout](#41-login-page--layout) | Desktop 2-panel vs mobile, keyboard support, NumPad |
| [4.2 Login Steps — 3 States](#42-login-steps--3-states) | phone → pin → conflict |
| [4.3 Lockout Constants](#43-constants--lockout-system) | PHONE_MAX, PIN_MAX, tier arrays |
| [4.4 Phone Step — Flow & Lockout](#44-phone-step--kaise-kaam-karta-hai) | Phone cache, handlePhoneSubmit flow, lockout tiers table |
| [4.5 PIN Step — Flow & Lockout](#45-pin-step--kaise-kaam-karta-hai) | handlePinSubmit flow, handleWrongPin, Firebase fields updated |
| [4.6 `createSession()`](#46-createsession--session-banao) | sessionId generation, dev 4h vs normal 24h, admin sessions array |
| [4.7 Session Conflict](#47-session-conflict--step-conflict) | Kab dikhta hai, Terminate & Login |
| [4.8 Recent Phones](#48-recent-phones--quick-login) | Max 3, masked display |
| [4.9 Three User Roles Comparison](#49-three-user-roles--complete-comparison) | 11 features compare kiye |
| [4.10 DEV_PHONE Special Behavior](#410-dev_phone-special-behavior--summary) | Login.js + App.js mein kya alag hota hai |
| [4.11 Dev PIN — `settings/devAccess`](#411-dev-pin--settingsdevaccess) | 2 jagah use hota hai, change karna |
| [4.12 localStorage Keys — Complete Reference](#412-localstorage-keys--complete-reference) | Sabhi lg_ keys — kab set, kab clear |
| [4.13 Force Logout](#413-force-logout--kya-hota-hai) | Firebase mein kya hota hai, max wait time |

---

### 5. Layouts & Navigation
`src/components/layout/RetailerLayout.js` · `AdminLayout.js` · `DeveloperLayout.js`

| Section | Kya milega |
|---------|------------|
| [5.1 RetailerLayout.js](#51-file-srccomponentslayoutretailerlayoutjs) | navItems, bottomNav, moreLinks arrays, sidebar collapse, banner system, pull-to-refresh, logout |
| [5.2 AdminLayout.js](#52-file-srccomponentslayoutadminlayoutjs) | sidebarLinks, Dev Panel button, dev verification check |
| [5.3 DeveloperLayout.js](#53-file-srccomponentslayoutdeveloperlayoutjs) | PIN gate (1hr session, 5 attempts nuclear), devLinks array, green theme |
| [5.4 Teeno Layouts Comparison](#54-teeno-layouts-ka-comparison) | 11 features compare kiye |
| [5.5 Common Changes Quick Reference](#55-common-changes--quick-reference) | Nav arrays, gradients, PIN timeout, developer name |

---

### 6. Retailer Pages — `src/pages/retailer/`
15 screens — Home, PlaceOrder, Checkout, TrackOrder, OrderHistory, MyLedger, PriceList, Profile, Settings, Support, Guide, About, PrivacyPolicy, Terms, Blocked

| Section | Kya milega |
|---------|------------|
| [6.1 `Home.js`](#61-homejs--retailer-dashboard-) | useCache hook, balance from ledger, daily rotating content, streak logic, status colors |
| [6.2 `PlaceOrder.js`](#62-placeorderjs--product-selection-order) | Order window check (overnight support), re-order, max items, seasonal flag, cart bar |
| [6.3 `Checkout.js`](#63-checkoutjs--order-confirmation-checkout) | Duplicate check 4 states, replace order flow, order document fields, success screen |
| [6.4 `TrackOrder.js`](#64-trackorderjs--order-tracking-track) | onSnapshot real-time, actualItems vs items, progress timeline, Dispatch Slip vs Invoice PDF |
| [6.5 `Settings.js`](#65-settingsjs--retailer-settings-settings) | PIN change 3-step modal, rate app duplicate check, install button, clear cache |
| [6.6 Baaki 10 Pages](#66-baaki-retailer-pages--quick-reference) | OrderHistory, MyLedger, PriceList, Profile, Support, Guide, About, Privacy, Terms, Blocked |

---

### 7. Admin Pages — `src/pages/admin/`
13 screens — Dashboard, DailyLedger, Retailers, Inventory, Ledger, CompanyOrder, Settings, Sessions, SupportTickets, Announcements, PlaceOrder, OrderDetail, DevPanel

| Section | Kya milega |
|---------|------------|
| [7.1 `Dashboard.js`](#71-dashboardjs--admin-home-admin) | Data sources, balance from ledger, SVG donut chart, Report PDF, top defaulters |
| [7.2 `DailyLedger.js`](#72-dailyledgerjs--daily-order-sheet-admindaily-ledger) | Default date, parseToGrams sorting, 5 order actions, dispatch/deliver modals, bulk dispatch, Daily PDF, Seasonal PDF, CSV, stock banner, receipt PDF |
| [7.3 Baaki 11 Pages](#73-baaki-admin-pages--quick-reference) | Retailers, Inventory (product fields + groups), Ledger, CompanyOrder, Settings (fields table), Sessions, SupportTickets, Announcements, PlaceOrder, OrderDetail, DevPanel |

---

### 8. Developer Pages — `src/pages/dev/`
21 tools — sirf DEV_PHONE access kar sakta hai

| Section | Kya milega |
|---------|------------|
| [8.1 `ErrorLogs.js`](#81-errorlogsjs--crash-logs-deverrors) | Filter system, expanded view, suggested fix, severity colors |
| [8.2 `FeatureFlags.js`](#82-featureflagsjs--feature-toggles-devflags) | 20 flags table, toggle behavior, `!== false` pattern |
| [8.3 `DatabaseCleanup.js`](#83-databasecleanupjs--delete-old-data-devcleanup) | 4 cleanup cards, auto-cleanup toggle, estimated savings, cleanup log |
| [8.4 `BackupRestore.js`](#84-backuprestorejs--database-backup-devbackup) | 3 backup methods (local/file/cloud), restore process (destructive), double confirm |
| [8.5 `ScheduledTasks.js`](#85-scheduledtasksjs--maintenance-jobs-devtasks) | 6 actions table, Run Now real operations, task config |
| [8.6 `ConfigDiff.js`](#86-configdiffjs--config-comparison-devconfig-diff) | Default values hardcoded, diff display, copy JSON |
| [8.7 `DocEditor.js`](#87-doceditorjs--database-editor-deveditor) | 17 collections, 4 find methods, bulk delete, JSON editor warning |
| [8.8 `BulkUpdate.js`](#88-bulkupdatejs--bulk-field-update-devbulk-update) | 3-step process, auto type detection, preview |
| [8.9 `MonthlyReport.js`](#89-monthlyreportjs--monthly-report-devreport) | 6 collections, report sections, WhatsApp copy |
| [8.10 Baaki 11 Pages](#810-baaki-dev-pages--quick-reference) | UserSessions, OrderAnalytics, RetailerActivity, DeployInfo, Announcements, AuditLog, AppRatings, DataExport, ApiResponseMonitor, OrderManager, DevGuide |

---

### 9. Shared Components — `src/components/`
10 reusable UI pieces

| Section | Kya milega |
|---------|------------|
| [9.1 `ConfirmModal.js`](#91-confirmmodaljs--confirmation-popup) | Promise-based architecture, useConfirm() usage, 6 types table, internal state |
| [9.2 `ErrorBoundary.js`](#92-errorboundaryjs--crash-protection-3-levels) | 3 boundaries comparison, recovery UIs, Firebase logging fields |
| [9.3 `AppFooter.js`](#93-appfooterjs--responsive-footer) | type prop, desktop 3-column, mobile minimal, APP_CONFIG fields |
| [9.4 `WelcomePopup.js`](#94-welcomepopupjs--first-time-onboarding) | Double check (localStorage + Firebase), 3 slides, rating duplicate check, markDone() |
| [9.5 `LoadingSkeleton.js`](#95-loadingskeletonjs--loading-placeholders) | 5 exports, 400ms delay kyon, usage pattern |
| [9.6 `TopProgressBar.js`](#96-topprogressbarjs--page-transition-bar) | Module-level functions, dynamic import kyon, PageLoader Suspense fallback |
| [9.7 `OfflineBanner.js`](#97-offlinebannerjs--no-internet-warning) | 2 event listeners, offline vs back-online states |
| [9.8 `InstallPrompt.js`](#98-installpromptjs--pwa-install-banner) | beforeinstallprompt, window.__lgInstallPrompt global, dismiss key |
| [9.9 `PaymentBlock.js`](#99-paymentblockjs--service-suspended-screen) | siteBlock config, GenericBlockView vs AdminBlockView, developer payment system |

---

### 10. Hooks & Context
`src/hooks/` · `src/context/`

| Section | Kya milega |
|---------|------------|
| [10.1 `useDarkMode.js`](#101-usedarkmodejs--darklight-mode) | `<html>` pe dark class, localStorage key, usage |
| [10.2 `useFontSize.js`](#102-usefontsizejs--font-size-preference) | 3 sizes, class add/remove logic, usage with buttons |
| [10.3 `useBottomSheet.js`](#103-usebottomsheetjs--swipe-to-dismiss-gesture) | sheetRef + handleProps usage, touch gesture logic, dismiss conditions, iOS animation |
| [10.4 `usePullToRefresh.js`](#104-usepulltorefreshjs--pull-to-refresh-gesture) | 4 constants, activation conditions, pull distance calculation, data-no-pull attribute |
| [10.5 `useCache.js`](#105-usecachejs--in-memory-data-cache) | Module-level cache, stale-while-revalidate behavior table, clearCache() |
| [10.6 `useLiveData.js`](#106-uselivedatajs--firebase-query-cache-hook) | Instant cache load, fetch strategy, useLiveData vs usePageData |
| [10.7 `FeatureFlags.js` Context](#107-featureflagsjs-context--real-time-feature-toggle) | 20 default flags, 5 min cache, `!== false` pattern kyon, kab reflect hote hain |
| [10.8 Hooks Summary Table](#108-hooks-summary--quick-reference) | Sabhi 9 hooks/context ek jagah |

---

### 11. Firestore Rules & Security
`firestore.rules` — per-collection validation, APP_WRITE_KEY, security architecture

| Section | Kya milega |
|---------|------------|
| [11.1 Rules Deploy Karna](#111-rules-deploy-karna) | Command, turant effective |
| [11.2 APP_WRITE_KEY System](#112-app_write_key--write-authorization-system) | isApp / isAppUpdate / isAppDelete ka fark |
| [11.3 Per-Collection Rules](#113-per-collection-rules--complete-reference) | users, orders, products, ledger, app_errors (open kyon), app_ratings (immutable), audit_log (immutable), backups (no update) |
| [11.4 Deny-All Fallback](#114-deny-all-fallback) | Kyon zaroori hai |
| [11.5 Complete Rules Summary Table](#115-complete-rules-summary-table) | 18 collections ek jagah |
| [11.6 Naya Collection Add Karna](#116-naya-collection-add-karna) | Template + 3 steps |
| [11.7 Security Architecture](#117-security-architecture--complete-overview) | 9 security layers table, 3 limitations |
| [11.8 Common Security Operations](#118-common-security-operations) | Admin role, dev PIN, block/unblock, session clear, API keys rotate |
| [11.9 Firestore Rules Testing](#119-firestore-rules-testing) | Rules Playground, local emulator |

---

### 12. Config Files, Dev Console & Quick Reference
`tailwind.config.js` · `package.json` · `manifest.json` · `public/dev-console/`

| Section | Kya milega |
|---------|------------|
| [12.1 `tailwind.config.js`](#121-tailwindconfigjs--custom-design-system) | royal + mint colors (hex table), custom shadows, animations, fonts, dark mode |
| [12.2 `package.json`](#122-packagejson--dependencies--scripts) | Exact versions, npm scripts |
| [12.3 `manifest.json` — PWA](#123-publicmanifestjson--pwa-configuration) | App shortcuts (long press), common changes |
| [12.4 Other Root Config Files](#124-other-root-config-files) | firebase.json, .firebaserc, vercel.json, postcss, .gitignore |
| [12.5 Standalone Dev Console](#125-standalone-dev-console--publicdev-console) | Kab use karo, file structure, React vs Dev Console comparison, auth (no permanent block), session tracking, hardcoded keys warning, 12 tabs |
| [12.6 PWA Files](#126-pwa-files) | manifest, sw.js, icons |
| [12.7 Master Cheat Sheet](#127-master-cheat-sheet--common-tasks) | Text/color/icon change, naya page, version, DEV_PHONE |
| [12.8 Troubleshooting](#128-troubleshooting--common-problems) | 15 common problems with fix |
| [12.9 Deployment Checklist](#129-deployment-checklist) | Pehli baar, update, Vercel |
| [12.10 Emergency Procedures](#1210-emergency-procedures) | App down, turant logout, database restore, maintenance stuck |

---

# Project Overview & Architecture

## 1.1 Big Picture — App Kaise Kaam Karta Hai

```
User opens app (phone/browser)
          │
          ▼
    public/index.html
    <div id="root">
          │
          ▼
    src/index.js
    RootErrorBoundary wraps everything
    renders <App />
          │
          ▼
    src/App.js
    ┌─────────────────────────────────────┐
    │  1. Splash screen (1.5s or 3.2s)   │
    │  2. Read localStorage for user      │
    │  3. Verify session with Firebase    │
    │  4. Check maintenance / siteBlock   │
    │  5. Route based on role             │
    └─────────────────────────────────────┘
          │
    ┌─────┴──────┐
    │            │
  No user     User found
    │            │
  Login.js    Check role
              │
    ┌─────────┼──────────┐
    │         │          │
retailer    admin      developer
    │         │          │
RetailerLayout AdminLayout DeveloperLayout
    │         │          │
  Pages     Pages      Dev Tools
    │         │          │
    └─────────┴──────────┘
              │
              ▼
    src/services/firebase.js
    Firestore (Google Cloud)
    — No backend server —
    React talks directly to Firebase
```

**Sabse important baat:** Koi backend server nahi hai. React app seedha Firebase Firestore se baat karta hai. Iska matlab hai:
- Koi Node.js server nahi
- Koi API endpoints nahi
- Sab kuch client-side hai
- Security sirf Firestore Rules se aati hai

---

## 1.2 Tech Stack — Exact Versions

| Package | Version | Kaam |
|---------|---------|------|
| `react` | 18.x | UI framework |
| `react-dom` | 18.x | DOM rendering |
| `react-router-dom` | 6.x | Page routing (createBrowserRouter) |
| `firebase` | 10.x | Database (Firestore) |
| `framer-motion` | 11.x | Animations (LazyMotion for performance) |
| `tailwindcss` | 3.x | Utility CSS classes |
| `lucide-react` | latest | Icons (500+ icons available) |
| `jspdf` | latest | PDF generation (TrackOrder, DailyLedger, PriceList) |
| `postcss` | 8.x | CSS processing (Tailwind ke liye zaroori) |
| `autoprefixer` | 10.x | CSS vendor prefixes |

**Versions check karne ke liye:**
```
package.json file mein "dependencies" section dekho
```

---

## 1.3 Folder Structure — Har Folder Ka Kaam

```
Lucy-Garden-main/
│
├── public/                     ← Static files — build mein as-is copy hote hain
│   ├── index.html              ← Single HTML file — <div id="root"> yahan hai
│   ├── manifest.json           ← PWA config (app name, icons, theme)
│   ├── sw.js                   ← Service Worker (offline caching)
│   ├── logo192.png             ← App icon (small — home screen)
│   ├── logo512.png             ← App icon (large — splash screen)
│   ├── apple-touch-icon.png    ← iOS home screen icon
│   ├── og-image.png            ← Social media share preview
│   ├── robots.txt              ← Search engine crawl rules
│   ├── sitemap.xml             ← SEO sitemap
│   ├── 404.html                ← Custom 404 page
│   └── dev-console/            ← Emergency standalone console (no React needed)
│       ├── index.html
│       ├── guide.html
│       ├── css/styles.css
│       └── js/
│           ├── app.js
│           ├── auth.js
│           ├── firebase.js
│           ├── utils.js
│           └── tabs/           ← backup, errors, flags, health, maintenance, sessions
│
├── src/                        ← Saara React code yahan hai
│   ├── index.js                ← Entry point — App ko HTML mein render karta hai
│   ├── index.css               ← Global styles (Tailwind import + custom classes)
│   ├── App.js                  ← Root component — routing, session, maintenance
│   │
│   ├── assets/
│   │   └── logo.png            ← App logo (Login page, SplashScreen mein use hota hai)
│   │
│   ├── components/             ← Reusable UI pieces
│   │   ├── layout/
│   │   │   ├── RetailerLayout.js   ← Retailer ka shell (header + nav + footer)
│   │   │   ├── AdminLayout.js      ← Admin ka shell
│   │   │   └── DeveloperLayout.js  ← Dev ka shell (PIN gate included)
│   │   ├── AppFooter.js
│   │   ├── ConfirmModal.js
│   │   ├── ErrorBoundary.js
│   │   ├── InstallPrompt.js
│   │   ├── LoadingSkeleton.js
│   │   ├── OfflineBanner.js
│   │   ├── PaymentBlock.js
│   │   ├── SplashScreen.js
│   │   ├── TopProgressBar.js
│   │   └── WelcomePopup.js
│   │
│   ├── context/
│   │   └── FeatureFlags.js     ← Real-time feature toggle system
│   │
│   ├── hooks/                  ← Custom React hooks
│   │   ├── useBottomSheet.js   ← Swipe-to-dismiss gesture
│   │   ├── useCache.js         ← Data caching hook
│   │   ├── useDarkMode.js      ← Dark/light mode
│   │   ├── useFontSize.js      ← Font size preference
│   │   ├── useLiveData.js      ← Real-time data hook
│   │   └── usePullToRefresh.js ← Pull-to-refresh gesture
│   │
│   ├── pages/
│   │   ├── Login.js            ← Login page (phone + PIN)
│   │   ├── NotFound.js         ← 404 page
│   │   ├── retailer/           ← 15 retailer screens
│   │   ├── admin/              ← 13 admin screens
│   │   └── dev/                ← 21 developer tool screens
│   │
│   ├── services/
│   │   ├── firebase.js         ← Firebase connection + tracked wrappers + cache
│   │   └── errorLogger.js      ← Global error tracking service
│   │
│   └── utils/
│       ├── autoCleanup.js      ← Daily data cleanup
│       ├── config.js           ← App identity (version, name, phone)
│       ├── date.js             ← Date formatting helpers
│       ├── pdfHelper.js        ← PDF generation utilities
│       ├── price.js            ← Currency formatting
│       ├── session.js          ← Session utility functions
│       └── usageTracker.js     ← Firestore read/write counter
│
├── .env                        ← Firebase API keys (NEVER commit to git)
├── .firebaserc                 ← Firebase project ID link
├── .gitignore                  ← node_modules, .env, build — git mein nahi jaate
├── firebase.json               ← Firebase Hosting config (SPA rewrites)
├── firestore.rules             ← Firestore security rules
├── package.json                ← Dependencies + npm scripts
├── postcss.config.js           ← CSS processing config (mat chhuo)
├── tailwind.config.js          ← Custom colors (royal, mint) + animations
└── vercel.json                 ← Vercel hosting config (SPA rewrites)
```

---

## 1.4 File: `src/utils/config.js` — Central Configuration

**Yeh file sabse pehle edit karo** jab bhi app identity change karni ho. Yahan se data poori app mein automatically propagate hota hai.

```js
export const APP_CONFIG = {
  version: '02.10.01.01',       // ← Sirf yahan change karo, sab jagah update ho jaayega
  appName: 'Lucy Garden',     // ← App ka naam
  tagline: 'Fresh Dairy Supply', // ← Tagline
  developer: {
    name: 'Divyanshu Gupta',
    portfolio: 'https://portfolio-divyanshu-git.vercel.app',
  },
  phone: '9939079107',        // ← Shop ka phone number (footer + About page)
};
```

**Yeh data kahan-kahan dikhta hai:**

| Field | Kahan use hota hai |
|-------|--------------------|
| `version` | DevPanel, DeployInfo, Settings (retailer + admin), AppFooter |
| `appName` | Login page title, SplashScreen, AppFooter, About page |
| `tagline` | Login subtitle, AppFooter, About page |
| `developer.name` | Login page credit, About page, AppFooter |
| `developer.portfolio` | About page link |
| `phone` | AppFooter, About page, Terms, PrivacyPolicy |

> **Note:** Support page ka phone number `APP_CONFIG.phone` se nahi aata — woh Firebase `settings/app.shopPhone` se aata hai. Dono jagah update karo.

---

## 1.5 File: `.env` — Firebase Secret Keys

Project root mein hoti hai. **Kabhi bhi git mein commit mat karo** (`.gitignore` mein already listed hai).

```env
REACT_APP_FIREBASE_API_KEY=<tumhara_api_key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=<project_id>
REACT_APP_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<sender_id>
REACT_APP_FIREBASE_APP_ID=<app_id>
```

**Yeh keys kahan milti hain:**
1. Firebase Console → Project Settings → General → Your apps → Web app
2. "Firebase SDK snippet" → Config option select karo

**Agar `.env` missing ho toh:**
- App start nahi hoga
- Console mein error: `Firebase: Error (auth/invalid-api-key)`
- Fix: `.env` file banao project root mein, upar wale format mein keys daalo

**Firebase project switch karna ho toh:**
1. Naye project ki keys `.env` mein daalo
2. `.firebaserc` mein project ID update karo
3. `firebase deploy` se naye project pe deploy karo

---

## 1.6 File: `src/index.js` — Entry Point

```
Kaam: App ko HTML mein render karta hai
Edit karne ki zaroorat: Kabhi nahi (almost)
```

Yeh file sirf 3 kaam karta hai:
1. `RootErrorBoundary` import karta hai (fatal crashes pakadta hai)
2. `<App />` ko `RootErrorBoundary` mein wrap karta hai
3. `document.getElementById('root')` mein render karta hai

`public/index.html` mein `<div id="root"></div>` hai — yahan saari React app inject hoti hai.

---

## 1.7 File: `src/index.css` — Global Styles

Tailwind CSS import karta hai aur kuch custom classes define karta hai.

**Kya hai isme:**

| Section | Kya karta hai |
|---------|---------------|
| `@tailwind base/components/utilities` | Tailwind ka core — mat hatao |
| Custom scrollbar styles | Browser scrollbar ko thin aur styled banata hai |
| `.font-small`, `.font-normal`, `.font-large` | Font size classes — `useFontSize` hook inhe `<html>` pe apply karta hai |
| `dark:` base styles | Dark mode background/text defaults |
| `@keyframes shimmer` | Loading skeleton ka light-sweep animation |

**Kab edit karo:** Sirf tab jab global CSS change karni ho. Zyaadatar styling Tailwind classes se directly components mein hoti hai.

---

## 1.8 Build & Deploy Workflow

### Local Development
```bash
npm start
# App chalta hai: http://localhost:3000
# Hot reload — file save karo, browser automatically update hoga
# .env file zaroori hai
```

### Production Build
```bash
npm run build
# build/ folder create hota hai
# Saari files minified + optimized hoti hain
# Yeh folder deploy hota hai (src/ nahi)
```

### Firebase Hosting Deploy
```bash
npm run deploy
# = npm run build + firebase deploy
# firebase.json mein public: "build" set hai
# Sabhi URLs /index.html pe redirect hote hain (SPA config)
```

### Vercel Deploy
```
Vercel pe auto-deploy hota hai jab GitHub pe push karo
vercel.json mein SPA rewrites configured hain
Environment variables Vercel dashboard mein set karo (.env nahi)
```

### Firebase Rules Deploy (alag se)
```bash
firebase deploy --only firestore:rules
# Sirf rules update karta hai, app rebuild nahi karta
```

---

## 1.9 `firebase.json` — Hosting Config

```json
{
  "hosting": {
    "public": "build",
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

**`rewrites` kyon zaroori hai:** React Router client-side routing use karta hai. Agar user directly `/admin/retailers` URL open kare, Firebase server ko pata nahi yeh route kya hai — woh 404 dega. Rewrite rule kehta hai: "koi bhi URL aaye, `index.html` serve karo, React Router handle karega."

---

## 1.10 Complete File Count

| Category | Files |
|----------|-------|
| Core (App, index, css) | 3 |
| Login + NotFound | 2 |
| Retailer Pages | 15 |
| Admin Pages | 13 |
| Developer Pages | 21 |
| Layouts | 3 |
| Shared Components | 10 |
| Services | 2 |
| Context | 1 |
| Hooks | 6 |
| Utils | 7 |
| Root config files | 9 |
| Standalone Dev Console | 10 |
| **Total** | **102 files** |

---

# App.js — Brain of the App

**File:** `src/App.js`
**Size:** ~350 lines
**Kab edit karo:** Naya page add karna ho, splash duration change karni ho, dev phone change karna ho, ya routing mein kuch add/remove karna ho.

---

## 2.1 File Ka Structure — Ek Nazar Mein

```
App.js
│
├── Imports (React, Router, Firebase, Components, Pages)
│
├── LoginSuccess()          ← Login ke baad ka success animation overlay
├── MaintenancePage()       ← Retailers ko dikhta hai jab maintenance ON ho
│
├── AppContent()            ← Saari logic yahan hai
│   ├── State variables
│   ├── useEffect: Splash timer
│   ├── useEffect: Maintenance + siteBlock check
│   ├── verifyUser()        ← Session verification (sabse important function)
│   ├── useEffect: Session monitoring (polling every 2 min)
│   ├── useEffect: Session expiry check (every 5 min)
│   ├── handleLogin()       ← Login success ke baad call hota hai
│   ├── router (useMemo)    ← Saare routes yahan define hain
│   └── Return JSX          ← Kya render hoga decide karta hai
│
└── App()                   ← Root export — ConfirmProvider + FeatureFlagProvider wrap
```

---

## 2.2 Constants — Sabse Pehle Jaano

### `DEV_PHONE`
```js
// AppContent() ke andar, line ~170
const DEV_PHONE = '8051725780';
```

**Yeh constant 2 jagah hai:**
1. `src/App.js` — `AppContent()` function ke andar
2. `src/pages/Login.js` — `Login()` function ke andar

**Dono jagah change karna zaroori hai** agar developer phone badalna ho. Ek jagah change kiya toh app inconsistent behave karega.

**Yeh constant kya karta hai:**
- Session verification skip karta hai (Firebase check nahi hota)
- Maintenance mode bypass karta hai
- siteBlock bypass karta hai
- Admin panel access deta hai
- Dev tools access deta hai
- `router` mein `isDev = user.phone === '8051725780'` check hota hai

---

## 2.3 State Variables

```js
const [user, setUser] = useState(null);
// null = logged out, object = logged in user data

const [loading, setLoading] = useState(true);
// true = session verify ho rahi hai, false = done

const [splashDone, setSplashDone] = useState(false);
// false = splash screen dikha raha hai

const [loginSuccess, setLoginSuccess] = useState(null);
// null = no animation, { name, role } = show success overlay

const [maintenance, setMaintenance] = useState(false);
// true = retailers ko maintenance page dikhao

const [siteBlock, setSiteBlock] = useState(null);
// null = normal, object = PaymentBlock dikhao (developer ka payment pending)
```

---

## 2.4 Splash Screen Logic

```js
useEffect(() => {
  const launch = new Date('2026-06-01T00:00:00');
  const diff = (new Date() - launch) / (1000 * 60 * 60 * 24);
  const isLaunch = diff >= 0 && diff <= 7;
  const timer = setTimeout(() => setSplashDone(true), isLaunch ? 3200 : 1500);
  return () => clearTimeout(timer);
}, []);
```

**Yeh kya karta hai:**
- App.js mein launch date `2026-06-01` hardcoded hai
- Agar aaj ki date launch ke 0-7 din ke andar hai → 3200ms (3.2 seconds) splash
- Agar 7 din baad hai → 1500ms (1.5 seconds) splash

**SplashScreen.js mein alag logic hai:**
- `SplashScreen.js` mein launch date `2026-06-02` hai aur period **30 days** hai
- Woh decide karta hai `LaunchSplash` (animated, premium) ya `NormalSplash` (minimal) dikhana hai
- App.js sirf duration control karta hai, SplashScreen.js visual decide karta hai

**Common changes:**

| Kya change karna hai | Kahan |
|----------------------|-------|
| Splash duration (normal) | `App.js` → `1500` change karo (milliseconds) |
| Splash duration (launch) | `App.js` → `3200` change karo |
| Launch period (kitne din premium) | `SplashScreen.js` → `diff <= 30` mein 30 change karo |
| Launch date | `App.js` → `'2026-06-01T00:00:00'` aur `SplashScreen.js` → `LAUNCH_DATE = '2026-06-02'` |
| Logo | `src/assets/logo.png` replace karo |

---

## 2.5 Maintenance & siteBlock Check

```js
useEffect(() => {
  const checkSettings = async () => {
    const snap = await cachedGetDoc(doc(db, 'settings', 'app'), 5 * 60 * 1000);
    if (snap.exists()) {
      const data = snap.data();
      setMaintenance(data.maintenance || false);
      setSiteBlock(data.siteBlock?.enabled ? data.siteBlock : null);
    }
  };
  checkSettings();
}, []);
```

**`maintenance` flag:**
- Firebase `settings/app.maintenance = true` → retailers ko `MaintenancePage` dikhta hai
- Admin aur Developer bypass karte hain
- Toggle karne ka fastest tarika: Admin Settings → Maintenance toggle

**`siteBlock` flag:**
- Firebase `settings/app.siteBlock.enabled = true` → `PaymentBlock` component dikhta hai
- Yeh developer ka payment system hai — agar developer ka payment pending ho toh admin ko payment page dikhta hai
- Developer (DEV_PHONE) bypass karta hai
- `siteBlock` object mein: `title`, `message`, `contact`, `invoice`, `upi`, `showPayment` fields hote hain

**Cache:** `cachedGetDoc` 5 minute cache use karta hai — matlab app open karne ke 5 minute baad tak naya Firebase read nahi hoga settings ke liye.

---

## 2.6 `verifyUser()` — Session Verification (Sabse Important Function)

Yeh function decide karta hai ki user logged in hai ya nahi. App open hone par ek baar chalta hai.

### Step-by-step flow:

```
Step 1: sessionStorage se 'lg_active_phone' padho
        ↓
Step 2: localStorage se 'lg_user_{phone}' padho
        Agar nahi mila → purana 'lg_user' key try karo (backward compatibility)
        ↓
Step 3: Agar koi data nahi → loading = false, Login dikhao
        ↓
Step 4: JSON parse karo, phone check karo
        ↓
Step 5: DEV_PHONE check
        → Agar dev hai → sessionExpiry check karo locally
        → Agar expired → clear karo, Login dikhao
        → Agar valid → setUser(), done (Firebase check skip)
        ↓
Step 6: Session verify cache check (1 hour TTL)
        → Agar last verify 1 hour se kam pehle tha → Firebase call skip
        → Agar sessionExpiry bhi valid hai → setUser(), done
        ↓
Step 7: Firebase se user document padho (users/{phone})
        ↓
Step 8: Document exist nahi karta → clear localStorage, Login dikhao
        ↓
Step 9: Role check — agar retailer hai:
        → activeSession match karo (stored sessionId vs Firebase sessionId)
        → Agar match nahi → doosre device pe login hua → clear, Login dikhao
        ↓
Step 10: sessionExpiry check
         → Agar expired → clear, Login dikhao
         ↓
Step 11: Verified user object banao, localStorage update karo
         setUser(verifiedUser), done
         ↓
Step 12: Background mein lastLogin, deviceInfo update karo Firebase mein
```

### Per-tab Session Isolation

```js
const activePhone = sessionStorage.getItem('lg_active_phone');
const saved = activePhone
  ? localStorage.getItem(`lg_user_${activePhone}`)
  : localStorage.getItem('lg_last_login')
    ? localStorage.getItem(`lg_user_${localStorage.getItem('lg_last_login')}`)
    : null;
```

**Kyon hai yeh:**
- Ek browser mein multiple tabs ho sakti hain
- Tab A mein retailer logged in, Tab B mein admin logged in
- `sessionStorage` tab-specific hota hai (tab band karo → clear)
- `localStorage` sab tabs mein share hota hai
- `lg_active_phone` sessionStorage mein store hota hai → har tab apna user track karta hai

**localStorage keys:**

| Key | Kya store hota hai | Kab set hota hai |
|-----|--------------------|------------------|
| `lg_user_{phone}` | Full user object | Login + verify pe |
| `lg_user` | Same user object (backward compat) | Login + verify pe |
| `lg_last_login` | Last logged in phone number | Login pe |
| `lg_last_verify_{phone}` | Timestamp of last Firebase verify | Verify ke baad |

**sessionStorage keys:**

| Key | Kya store hota hai |
|-----|--------------------|
| `lg_active_phone` | Is tab mein active user ka phone |
| `lg_dev_verified` | Dev PIN verification (DeveloperLayout use karta hai) |
| `lg_last_login_time` | Double-login prevention timestamp |

### Offline Behavior

```js
} catch (err) {
  // Firebase unreachable — check expiry locally
  if (parsed.sessionExpiry && new Date(parsed.sessionExpiry) < new Date()) {
    localStorage.removeItem(`lg_user_${parsed.phone}`);
  } else {
    setUser(parsed); // offline mein bhi kaam karta hai
  }
}
```

Agar Firebase down ho ya internet nahi ho → app locally stored session se kaam karta hai jab tak session expire na ho.

---

## 2.7 Session Monitoring — Polling (Every 2 Minutes)

```js
useEffect(() => {
  if (!user?.phone || !user?.sessionId) return;
  if (user.phone === DEV_PHONE) return;  // dev skip
  if (user.role === 'admin') return;     // admin skip

  const checkSession = async () => {
    const snap = await getDoc(doc(db, 'users', user.phone));
    const data = snap.data();
    if (data.activeSession && data.activeSession !== user.sessionId) {
      // Doosre device pe login hua — is device ko logout karo
      localStorage.removeItem(`lg_user_${user.phone}`);
      localStorage.removeItem('lg_user');
      sessionStorage.removeItem('lg_active_phone');
      window.location.reload();
    }
  };

  checkSession(); // turant ek baar
  const id = setInterval(checkSession, 2 * 60 * 1000); // phir har 2 min
  return () => clearInterval(id);
}, [user?.phone, user?.sessionId]);
```

**Kyon polling hai, real-time `onSnapshot` nahi:**
- `onSnapshot` continuous connection rakhta hai → Firebase reads zyada hote hain
- Polling (2 min interval) → sirf tab read hota hai jab check karna ho
- Free tier mein reads bachte hain

**Kisko apply hota hai:** Sirf retailers ko. Admin aur Developer multi-device login kar sakte hain.

---

## 2.8 Session Expiry Check (Every 5 Minutes)

```js
useEffect(() => {
  if (!user) return;
  const check = () => {
    const phone = sessionStorage.getItem('lg_active_phone');
    const saved = localStorage.getItem(`lg_user_${phone}`);
    const { sessionExpiry } = JSON.parse(saved);
    if (sessionExpiry && new Date(sessionExpiry) < new Date()) {
      // Session expire ho gaya — logout
      localStorage.removeItem(`lg_user_${phone}`);
      localStorage.removeItem('lg_user');
      sessionStorage.removeItem('lg_active_phone');
      window.location.reload();
    }
  };
  const id = setInterval(check, 5 * 60 * 1000);
  return () => clearInterval(id);
}, [user]);
```

Session timeout Admin Settings mein set hota hai (`settings/app.sessionTimeout`, default 24 hours). Yeh check har 5 minute mein run hota hai.

---

## 2.9 `handleLogin()` — Login Success Flow

```js
const handleLogin = useCallback(async (u) => {
  // Double-login prevention (3 second debounce)
  const lastLoginTime = parseInt(sessionStorage.getItem('lg_last_login_time') || '0');
  if (Date.now() - lastLoginTime < 3000) return;
  sessionStorage.setItem('lg_last_login_time', String(Date.now()));

  // 1. Success animation dikhao
  setLoginSuccess({ name: u.name || '', role: u.role || 'retailer' });

  // 2. 1.8 seconds baad animation hatao, user set karo
  setTimeout(() => {
    setLoginSuccess(null);
    setUser(u);
  }, 1800);

  // 3. Background mein device info update karo
  await updateDoc(doc(db, 'users', u.phone), {
    lastLogin: new Date().toISOString(),
    deviceInfo: ua.slice(0, 200),
    lastLoginDevice: parseDevice(ua),
  });
}, []);
```

**`LoginSuccess` component:** Dark blue overlay (`#0f172a`) pe animated checkmark + "Welcome, [Name]" text. 1.8 seconds dikha ke automatically hat jaata hai.

---

## 2.10 Router — `useMemo` Mein Kyon Hai

```js
const router = useMemo(() => {
  if (!user) return null;
  // ... routes define karo
}, [user?.role, user?.phone]);
```

**Kyon `useMemo`:** Router sirf tab recreate hota hai jab `user.role` ya `user.phone` change ho. Agar har render pe router recreate ho toh page flicker hoga aur performance kharab hogi.

### Complete Route Map

**Retailer Routes (`/`):**

| Path | Component | File |
|------|-----------|------|
| `/` | RetailerHome | `pages/retailer/Home.js` |
| `/order` | PlaceOrder | `pages/retailer/PlaceOrder.js` |
| `/checkout` | Checkout | `pages/retailer/Checkout.js` |
| `/track` | TrackOrder | `pages/retailer/TrackOrder.js` |
| `/history` | OrderHistory | `pages/retailer/OrderHistory.js` |
| `/my-ledger` | MyLedger | `pages/retailer/MyLedger.js` |
| `/profile` | RetailerProfile | `pages/retailer/Profile.js` |
| `/support` | Support | `pages/retailer/Support.js` |
| `/settings` | Settings | `pages/retailer/Settings.js` |
| `/prices` | PriceList | `pages/retailer/PriceList.js` |
| `/about` | About | `pages/retailer/About.js` |
| `/privacy` | PrivacyPolicy | `pages/retailer/PrivacyPolicy.js` |
| `/terms` | Terms | `pages/retailer/Terms.js` |
| `/guide` | Guide | `pages/retailer/Guide.js` |

**Admin Routes (`/admin`):** Admin aur Developer dono access kar sakte hain.

| Path | Component | File |
|------|-----------|------|
| `/admin` | AdminDashboard | `pages/admin/Dashboard.js` |
| `/admin/retailers` | AdminRetailers | `pages/admin/Retailers.js` |
| `/admin/orders/:id` | OrderDetail | `pages/admin/OrderDetail.js` |
| `/admin/inventory` | AdminInventory | `pages/admin/Inventory.js` |
| `/admin/ledger` | AdminLedger | `pages/admin/Ledger.js` |
| `/admin/settings` | AdminSettings | `pages/admin/Settings.js` |
| `/admin/daily-ledger` | DailyLedger | `pages/admin/DailyLedger.js` |
| `/admin/company-order` | CompanyOrder | `pages/admin/CompanyOrder.js` |
| `/admin/support` | SupportTickets | `pages/admin/SupportTickets.js` |
| `/admin/sessions` | AdminSessions | `pages/admin/Sessions.js` |
| `/admin/announcements` | AdminAnnouncements | `pages/admin/Announcements.js` |
| `/admin/place-order` | AdminPlaceOrder | `pages/admin/PlaceOrder.js` |

**Developer Routes (`/dev`):** Sirf DEV_PHONE access kar sakta hai.

| Path | Component | File |
|------|-----------|------|
| `/dev` | DevPanel | `pages/admin/DevPanel.js` |
| `/dev/errors` | ErrorLogs | `pages/dev/ErrorLogs.js` |
| `/dev/sessions` | UserSessions | `pages/dev/UserSessions.js` |
| `/dev/analytics` | OrderAnalytics | `pages/dev/OrderAnalytics.js` |
| `/dev/order-manager` | OrderManager | `pages/dev/OrderManager.js` |
| `/dev/activity` | RetailerActivity | `pages/dev/RetailerActivity.js` |
| `/dev/deploy` | DeployInfo | `pages/dev/DeployInfo.js` |
| `/dev/announce` | Announcements | `pages/dev/Announcements.js` |
| `/dev/cleanup` | DatabaseCleanup | `pages/dev/DatabaseCleanup.js` |
| `/dev/flags` | FeatureFlags | `pages/dev/FeatureFlags.js` |
| `/dev/audit` | AuditLog | `pages/dev/AuditLog.js` |
| `/dev/ratings` | AppRatings | `pages/dev/AppRatings.js` |
| `/dev/export` | DataExport | `pages/dev/DataExport.js` |
| `/dev/backup` | BackupRestore | `pages/dev/BackupRestore.js` |
| `/dev/api-monitor` | ApiResponseMonitor | `pages/dev/ApiResponseMonitor.js` |
| `/dev/tasks` | ScheduledTasks | `pages/dev/ScheduledTasks.js` |
| `/dev/config-diff` | ConfigDiff | `pages/dev/ConfigDiff.js` |
| `/dev/editor` | DocEditor | `pages/dev/DocEditor.js` |
| `/dev/bulk-update` | BulkUpdate | `pages/dev/BulkUpdate.js` |
| `/dev/report` | MonthlyReport | `pages/dev/MonthlyReport.js` |
| `/dev/guide` | DevGuide | `pages/dev/DevGuide.js` |

---

## 2.11 Blocked Retailer — Alag Router

```js
if (user.role === 'retailer' && user.blocked && user.phone !== DEV_PHONE) {
  const blockedRouter = createBrowserRouter([
    {
      path: '/',
      element: <AppErrorBoundary><RetailerLayout /></AppErrorBoundary>,
      children: [
        { index: true, element: <Blocked /> },
        { path: 'support', element: <Support /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ]);
  // render blockedRouter
}
```

**Kyon alag router:** Blocked retailer sirf 2 pages dekh sakta hai — `Blocked` page aur `Support` page. Baaki sabhi routes `/` pe redirect ho jaate hain. Agar main router use karo toh retailer manually URL type karke kisi bhi page pe ja sakta hai.

**`blocked: true` kaise set hota hai:**
- Login mein 20+ baar galat PIN → automatic block
- Admin → Sessions → user → "Block" button

**Unblock kaise karo:**
- Admin → Sessions → user → "Unblock" button
- Ya Firebase Console → `users/{phone}` → `blocked` field delete karo

---

## 2.12 Final Render Logic — Kya Dikhega

```
loading === true  OR  splashDone === false
    → SplashScreen dikhao

user === null
    → Login page + loginSuccess overlay (agar animation chal rahi ho)
    → InstallPrompt + OfflineBanner

siteBlock !== null  AND  user.phone !== DEV_PHONE
    → PaymentBlock dikhao (developer ka payment pending)

maintenance === true  AND  user.role === 'retailer'  AND  user.phone !== DEV_PHONE
    → MaintenancePage dikhao

user.role === 'retailer'  AND  user.blocked === true  AND  user.phone !== DEV_PHONE
    → Blocked router (sirf Blocked + Support pages)

Baaki sab cases:
    → Normal router (TopProgressBar + RouterProvider + InstallPrompt + OfflineBanner)
    → Agar retailer hai → WelcomePopup bhi render hoga
```

---

## 2.13 Naya Page Add Karna — Exact 4 Steps

**Example: `/admin/reports` pe naya "Reports" page add karna**

**Step 1 — File banao:**
```
src/pages/admin/Reports.js banao
Basic React component likho:
export default function Reports() {
  return <div>Reports Page</div>;
}
```

**Step 2 — App.js mein lazy import add karo** (top pe baaki lazy imports ke saath):
```js
const Reports = lazy(() => import('./pages/admin/Reports'));
```

**Step 3 — App.js mein route add karo** (admin children array mein):
```js
{ path: 'reports', element: <Reports /> },
```

**Step 4 — Layout mein nav link add karo** (`src/components/layout/AdminLayout.js`):
```js
// sidebarLinks array mein add karo:
{ label: 'Reports', path: '/admin/reports', icon: FileText },
```

**Retailer page ke liye:** Same steps, sirf `pages/retailer/` folder use karo aur `RetailerLayout.js` mein `navItems` array mein add karo.

**Dev page ke liye:** Same steps, `pages/dev/` folder, `DeveloperLayout.js` mein `devLinks` array.

---

## 2.14 `App()` — Root Export

```js
export default function App() {
  return (
    <ConfirmProvider>
      <FeatureFlagProvider>
        <AppContent />
      </FeatureFlagProvider>
    </ConfirmProvider>
  );
}
```

**`ConfirmProvider`:** Poori app mein `useConfirm()` hook available karta hai. Iske bahar koi bhi component confirm modal nahi dikha sakta.

**`FeatureFlagProvider`:** Firebase `settings/featureFlags` ko real-time listen karta hai. Poori app mein `useFlags()` hook available karta hai.

**Order matter karta hai:** `ConfirmProvider` bahar hai kyunki `FeatureFlagProvider` ke andar bhi confirm modal use ho sakta hai.

---

# Firebase Service & Data Layer

## 3.1 File: `src/services/firebase.js` — Connection + Wrappers + Cache

Yeh file poori app ki data layer hai. Har page yahan se import karta hai. Directly Firestore SDK use karne ki jagah yeh file wrapped versions export karti hai jo usage tracking aur caching automatically handle karte hain.

### Initialization

```js
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

Saari values `.env` file se aati hain. Agar koi bhi value missing ho → Firebase initialize nahi hoga → app crash.

### Offline Persistence (Disabled — Kyon)

```js
// enableIndexedDbPersistence(db).catch(() => {});  ← commented out
```

Yeh feature enable karne se app offline bhi kaam karta — data IndexedDB mein cache hota. **Disabled kyon hai:** Fresh install pe (jab koi cache nahi hota) yeh "client is offline" error deta tha even when online. Isliye disable rakha gaya.

---

## 3.2 `APP_WRITE_KEY` — Write Authorization

```js
const APP_WRITE_KEY = 'LG_2026_dG7xPmKv9Q';
```

Har write operation mein yeh key automatically add hoti hai:

```js
const _addDoc = async (colRef, data) => {
  _track('writes');
  return addDoc(colRef, { ...data, _appKey: APP_WRITE_KEY });
};
```

**Kaam:** Firestore rules mein verify ho sakta hai ki write sirf official app se aa rahi hai, kisi third-party tool se nahi. Abhi rules mein enforce nahi hai lekin future security ke liye rakha gaya hai.

---

## 3.3 Usage Tracking — `_track()` Function

```js
const _track = (type) => {
  try {
    const key = 'lg_usage_today';
    const today = new Date().toISOString().split('T')[0];
    let stored = JSON.parse(localStorage.getItem(key) || '{}');
    if (stored.date !== today) {
      stored = { reads: 0, writes: 0, deletes: 0, date: today };
    }
    stored[type] = (stored[type] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(stored));
  } catch {}
};
```

**Kya karta hai:** Har Firestore operation pe localStorage mein counter increment karta hai. Yeh counter `usageTracker.js` Firebase pe sync karta hai.

**Tracked operations:**

| Function | Type | Kab call hota hai |
|----------|------|-------------------|
| `getDoc()` | `reads` | Single document read |
| `getDocs()` | `reads` | Collection/query read |
| `addDoc()` | `writes` | Naya document create |
| `setDoc()` | `writes` | Document create ya overwrite |
| `updateDoc()` | `writes` | Existing document update |
| `deleteDoc()` | `deletes` | Document delete |

**Note:** `onSnapshot`, `collection`, `doc`, `query`, `where`, `orderBy` — yeh tracked nahi hain kyunki yeh sirf references banate hain, actual reads nahi karte.

---

## 3.4 Cache System — Complete Reference

Firebase reads costly hain (free tier mein limit hai). Cache system reads bachata hai.

### `cachedGetDoc` — Single Document Cache

```js
const _cache = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const cachedGetDoc = async (docRef, ttl = CACHE_TTL) => {
  const key = docRef.path;           // e.g. "settings/app"
  const cached = _cache[key];
  if (cached && Date.now() - cached.ts < ttl) return cached.snap; // cache hit
  const snap = await _getDoc(docRef);
  _cache[key] = { snap, ts: Date.now() };                         // cache store
  return snap;
};
```

**Usage example:**
```js
// 5 minute cache ke saath settings padho
const snap = await cachedGetDoc(doc(db, 'settings', 'app'), 5 * 60 * 1000);
```

**Kahan use hota hai:** App.js mein maintenance check, settings read karne ke liye.

### `cachedGetDocs` — Collection Query Cache

```js
export const cachedGetDocs = async (queryRef, cacheKey, ttl = CACHE_TTL) => {
  const cached = _cache[cacheKey];
  if (cached && Date.now() - cached.ts < ttl) return cached.snap;
  const snap = await _getDocs(queryRef);
  _cache[cacheKey] = { snap, ts: Date.now() };
  return snap;
};
```

**Usage example:**
```js
const snap = await cachedGetDocs(
  query(collection(db, 'products'), where('active', '==', true)),
  'products_active',   // ← unique cache key
  10 * 60 * 1000       // ← 10 min TTL
);
```

### `getCachedDocs` — Synchronous Cache Read

```js
export const getCachedDocs = (cacheKey) => {
  const cached = _cache[cacheKey];
  if (cached) return cached.snap;
  return null;
};
```

**Kab use karo:** Jab stale data instantly dikhana ho aur background mein fresh data fetch karna ho (stale-while-revalidate pattern).

### `invalidateCache` — Cache Clear Karna

```js
export const invalidateCache = (path) => {
  if (path) delete _cache[path];           // specific key clear
  else Object.keys(_cache).forEach(k => delete _cache[k]); // sab clear
};

export const invalidateCachePrefix = (prefix) => {
  Object.keys(_cache).filter(k => k.startsWith(prefix)).forEach(k => delete _cache[k]);
};
```

**Kab use karo:** Jab data write karo toh related cache invalidate karo taaki next read fresh data laye.

```js
// Example: product update ke baad cache clear karo
await updateDoc(doc(db, 'products', productId), { price: newPrice });
invalidateCachePrefix('products'); // sab products cache clear
```

### Cache TTL Reference

| Data Type | Recommended TTL | Kyon |
|-----------|----------------|------|
| `settings/app` | 5 minutes | Maintenance toggle fast reflect ho |
| `products` | 10 minutes | Products rarely change |
| `users` | 1 hour | User data stable hota hai |
| `settings/featureFlags` | Real-time (`onSnapshot`) | Instant toggle chahiye |
| `orders` | No cache | Har baar fresh chahiye |

---

## 3.5 Exported Functions — Complete List

```js
export {
  collection,      // Collection reference banao
  doc,             // Document reference banao
  getDoc,          // Single doc read (tracked)
  getDocs,         // Query/collection read (tracked)
  addDoc,          // Naya doc create (tracked + APP_WRITE_KEY)
  setDoc,          // Doc create/overwrite (tracked + APP_WRITE_KEY)
  updateDoc,       // Doc update (tracked + APP_WRITE_KEY)
  deleteDoc,       // Doc delete (tracked)
  query,           // Query builder
  where,           // Filter condition
  orderBy,         // Sort condition
  limit,           // Result limit
  onSnapshot,      // Real-time listener (NOT tracked — continuous)
  serverTimestamp, // Firebase server time
  arrayUnion,      // Array field mein add karo
  writeBatch,      // Multiple writes ek saath
  deleteField,     // Field remove karo
};
```

**`writeBatch` kab use karo:** Jab multiple documents ek saath update karne ho aur atomicity chahiye (ya sab ho ya kuch nahi). Example: order place karna — order create + balance update + ledger entry — teeno ek saath.

**`serverTimestamp()` vs `new Date().toISOString()`:**
- `serverTimestamp()` → Firebase server ka time use karta hai (timezone issues nahi)
- `new Date().toISOString()` → Client ka time use karta hai (fast, offline bhi kaam karta hai)
- Is app mein dono use hote hain — critical timestamps ke liye `serverTimestamp()` better hai

---

## 3.6 File: `src/utils/usageTracker.js` — Firestore Usage Counter

### Kaise Kaam Karta Hai

```
firebase.js → _track('reads') → localStorage 'lg_usage_today' update
                                        ↓
                              har 10 minute mein
                                        ↓
                         syncUsageToFirebase() call
                                        ↓
                    Firebase 'settings/usage_YYYY-MM-DD' update
                                        ↓
                         local counter reset to 0
```

### `getUsageLocal()` — Local Counter Padho

```js
export function getUsageLocal() {
  const stored = JSON.parse(localStorage.getItem('lg_usage_today') || '{}');
  if (stored.date !== getTodayKey()) return { reads: 0, writes: 0, deletes: 0, date: today };
  return stored;
}
```

Agar stored date aaj ki nahi → fresh counter return karo (din badal gaya).

### `syncUsageToFirebase()` — Firebase Pe Push Karo

```js
export async function syncUsageToFirebase() {
  const local = getUsageLocal();
  if (local.reads === 0 && local.writes === 0 && local.deletes === 0) return; // kuch nahi hua

  const docRef = doc(db, 'settings', 'usage_' + local.date);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    // Existing counts mein add karo (multiple devices/tabs)
    await setDoc(docRef, {
      reads:   (prev.reads   || 0) + local.reads,
      writes:  (prev.writes  || 0) + local.writes,
      deletes: (prev.deletes || 0) + local.deletes,
      date:    local.date,
      lastSync: new Date().toISOString(),
    });
  } else {
    await setDoc(docRef, { ...local, lastSync: new Date().toISOString() });
  }

  // Sync ke baad local reset
  localStorage.setItem('lg_usage_today', JSON.stringify({ reads: 0, writes: 0, deletes: 0, date: today }));
}
```

### `initUsageTracking()` — App Start Pe Call Hota Hai

```js
export function initUsageTracking() {
  if (syncInterval) return; // double init prevent
  syncInterval = setInterval(syncUsageToFirebase, 10 * 60 * 1000); // har 10 min
  window.addEventListener('beforeunload', () => syncUsageToFirebase()); // page close pe
}
```

**App.js mein call:** `initUsageTracking()` — file ke top level pe, component ke bahar.

**Firebase document format:**
```json
// settings/usage_2026-06-15
{
  "reads": 342,
  "writes": 28,
  "deletes": 5,
  "date": "2026-06-15",
  "lastSync": "2026-06-15T14:30:00.000Z"
}
```

**Sync interval:** Pehle 5 min tha, ab 10 min hai — reads bachane ke liye.

---

## 3.7 File: `src/utils/autoCleanup.js` — Daily Data Cleanup

### Kab Chalta Hai

```js
export async function runAutoCleanup() {
  const lastRun = localStorage.getItem('lg_last_cleanup');
  const today = new Date().toDateString();
  if (lastRun === today) return; // aaj already chala → skip
  // ...
}
```

`App.js` ke top level pe `runAutoCleanup()` call hota hai. `localStorage` mein `lg_last_cleanup` check karta hai — agar aaj ki date match kare toh skip. Matlab din mein sirf ek baar chalta hai.

### Retailers Ke Liye Skip

```js
const user = JSON.parse(saved);
if (user.role === 'retailer') {
  localStorage.setItem(CLEANUP_KEY, today);
  return; // retailers cleanup nahi karte — hundreds of reads bachte hain
}
```

Cleanup sirf admin/developer ke liye chalta hai. Retailer ke app open karne pe cleanup nahi hoga.

### `settings/app.autoCleanup` Check

```js
const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
if (settingsDoc.data().autoCleanup === false) {
  localStorage.setItem(CLEANUP_KEY, today);
  return; // admin ne disable kiya hai
}
```

Admin Settings mein "Auto Cleanup" toggle OFF karo → cleanup nahi chalega.

### Cleanup Targets — Kya Delete Hota Hai

| Collection | Date Field | Max Age | Max Docs | Notes |
|-----------|------------|---------|----------|-------|
| `order_history` | `createdAt` | 1 year | — | Archived orders |
| `company_orders` | `updatedAt` | 1 year | — | Daily company summaries |
| `daily_stock` | `updatedAt` | 1 year | — | Daily stock records |
| `app_errors` | `timestamp` | 7 days | 50 | Error logs |
| `audit_log` | `timestamp` | 1 year | — | Action history |

### `maxDocs` Logic — `app_errors` Ke Liye

```js
if (target.maxDocs && snap.docs.length > target.maxDocs && toDelete.length === 0) {
  // Age se purane nahi hain lekin count limit exceed ho rahi hai
  // Oldest documents delete karo
  const sorted = snap.docs.sort((a, b) => a.ts.localeCompare(b.ts));
  toDelete = sorted.slice(0, snap.docs.length - target.maxDocs);
}
```

`app_errors` ke liye: 7 din se purane delete karo. Agar 7 din se purane nahi hain lekin 50 se zyada hain → oldest delete karo taaki 50 limit maintain ho.

### Kabhi Delete Nahi Hota

```
ledger          ← Permanent financial record (NEVER auto-cleaned)
orders          ← 1 year minimum (history/ledger reference ke liye)
users           ← User accounts
products        ← Product catalog
settings        ← App configuration
retailer_balances ← Current balances
```

### Batch Delete — Max 100 Per Run

```js
const deleteSlice = toDelete.slice(0, 100); // max 100 per collection per run
deleteSlice.forEach(d => batch.delete(d.ref));
await batch.commit();
```

Ek baar mein 100 se zyada delete nahi hota — long-running operations prevent karne ke liye.

### Audit Log Entry

```js
if (totalDeleted > 0) {
  await addDoc(collection(db, 'audit_log'), {
    action: 'auto_cleanup',
    description: `Deleted ${totalDeleted} documents older than 1 year`,
    performedBy: 'system',
    timestamp: new Date().toISOString(),
  });
}
```

Agar kuch delete hua → `audit_log` mein entry banti hai. Yeh `/dev/audit` pe dikhti hai.

---

## 3.8 File: `src/services/errorLogger.js` — Global Error Tracking

### `initErrorTracking()` — 3 Global Listeners

App.js ke top level pe call hota hai. Teen listeners set up karta hai:

**Listener 1 — Unhandled JS Errors:**
```js
window.addEventListener('error', (event) => {
  if (event.message?.includes('ResizeObserver')) return; // harmless, skip
  logError({ message: event.message, stack: `${event.filename}:${event.lineno}:${event.colno}` }, 'window.onerror');
});
```

**Listener 2 — Unhandled Promise Rejections:**
```js
window.addEventListener('unhandledrejection', (event) => {
  logError({ message: error?.message || String(error), stack: error?.stack || '' }, 'unhandledrejection');
});
```

**Listener 3 — console.error Interceptor:**
```js
const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError.apply(console, args); // original bhi call karo
  // React dev warnings skip karo
  if (/Warning:|React does not recognize|validateDOMNesting/i.test(msg)) return;
  // Actual errors log karo
  if (/error|Error|failed|Failed|crash|Cannot|TypeError/i.test(msg)) {
    logError({ message: msg.slice(0, 500), stack: ... }, 'console.error');
  }
};
```

### `logError()` — Error Firebase Pe Save Karna

```js
export const logError = async (error, context = '') => {
  const msg = error.message || String(error);

  // Deduplication: same error 5 min mein dobara log nahi hoga
  const key = msg.slice(0, 80);
  const lastLogged = recentErrors.get(key);
  if (lastLogged && Date.now() - lastLogged < 5 * 60 * 1000) return;
  recentErrors.set(key, Date.now());

  await addDoc(collection(db, 'app_errors'), {
    message:   msg,
    stack:     error.stack || '',
    context,                              // 'window.onerror' / 'unhandledrejection' / 'console.error'
    url:       window.location.href,
    userAgent: navigator.userAgent.slice(0, 150),
    timestamp: new Date().toISOString(),
    user:      JSON.parse(localStorage.getItem('lg_user') || '{}').phone || 'unknown',
    severity:  getSeverity(msg),
  });
};
```

### Severity Classification

```js
const getSeverity = (msg) => {
  if (/ResizeObserver|Non-Error/i.test(msg))        return 'low';
  if (/ChunkLoad|Network/i.test(msg))               return 'medium';
  if (/permission|quota|Maximum update/i.test(msg)) return 'high';
  return 'medium';
};
```

| Severity | Pattern | Matlab |
|----------|---------|--------|
| `low` | ResizeObserver, Non-Error | Harmless browser warnings |
| `medium` | ChunkLoad, Network, everything else | Normal errors |
| `high` | permission-denied, quota-exceeded, infinite re-render | Serious issues |

### `getErrorSolution()` — 12 Known Patterns

```js
export const getErrorSolution = (errorMessage) => {
  for (const entry of ERROR_SOLUTIONS) {
    if (entry.pattern.test(errorMessage)) {
      return { title: entry.title, solution: entry.solution };
    }
  }
  return { title: 'Unknown Error', solution: 'Check stack trace...' };
};
```

| Error Pattern | Solution |
|---------------|----------|
| `Firebase.*permission-denied` | Firestore rules check karo |
| `Firebase.*not-found` | Document path verify karo |
| `Firebase.*unavailable` | Internet + Firebase status check |
| `Firebase.*quota-exceeded` | Blaze plan upgrade ya reads reduce karo |
| `ChunkLoadError\|Loading chunk` | Force reload (Ctrl+Shift+R) |
| `Network Error\|Failed to fetch` | Internet + CORS check |
| `Cannot read properties of (undefined\|null)` | Optional chaining `?.` add karo |
| `Maximum update depth exceeded` | useEffect dependencies fix karo |
| `Objects are not valid as a React child` | Object directly render mat karo |
| `ResizeObserver loop` | Harmless — ignore karo |
| `QUOTA_BYTES\|storage.*quota` | localStorage clear karo |
| `timeout\|ETIMEDOUT` | Retry logic add karo |

### Other Exported Functions

| Function | Kya karta hai |
|----------|---------------|
| `getErrors()` | `app_errors` se max 50 errors fetch karo (timestamp desc) |
| `clearErrors()` | Saare errors batch delete karo (500 per batch) |
| `resolveError(id)` | Single error ko `resolved: true` mark karo |

---

## 3.9 Firebase Collections — Complete Reference

### Main Collections

| Collection | Purpose | Key Fields |
|-----------|---------|------------|
| `users` | Sabhi user accounts | `phone`, `name`, `role`, `pin`, `area`, `shop`, `lastLogin`, `lastLoginDevice`, `deviceInfo`, `activeSession`, `sessionExpiry`, `blocked` |
| `orders` | Har order | `phone`, `items[]`, `total`, `status`, `date`, `timestamp`, `actualItems[]`, `actualTotal` |
| `products` | Product catalog | `name`, `price`, `unit`, `type`, `group`, `label`, `active` |
| `ledger` | Payment entries | `retailerId`, `amount`, `type` ('debit'/'credit'), `date`, `note` |
| `retailer_balances` | Current due per retailer | `balance` (number) |
| `support_tickets` | Help tickets | `phone`, `subject`, `message`, `status`, `messages[]`, `timestamp` |
| `announcements` | Banner history | `message`, `type`, `target`, `expiresAt`, `createdAt` |
| `notifications` | Notification history | `message`, `type`, `target`, `createdAt`, `sentBy` |
| `app_errors` | Crash logs | `message`, `stack`, `context`, `url`, `user`, `timestamp`, `severity` |
| `app_ratings` | User ratings | `phone`, `name`, `rating` (1-5), `createdAt`, `device` |
| `audit_log` | Action history | `action`, `description`, `target`, `performedBy`, `timestamp` |
| `company_orders` | Company level orders per date | `items`, `date`, `updatedAt` |
| `daily_stock` | Stock received per date | `items`, `date`, `updatedAt` |
| `backups` | Database snapshots | `data` (JSON string), `createdAt`, `collections[]`, `docCount` |
| `scheduled_tasks` | Maintenance job configs | `name`, `schedule`, `action`, `enabled`, `lastRun`, `lastResult` |
| `order_history` | Archived old orders | `phone`, `items`, `total`, `createdAt` |

### `settings` Collection — Har Document

| Document ID | Purpose | Key Fields |
|------------|---------|------------|
| `app` | Main app config | `maintenance`, `orderStart`, `orderEnd`, `deliveryStart`, `deliveryEnd`, `shopPhone`, `sessionTimeout`, `minOrderAmount`, `maxOrderItems`, `allowModify`, `defaultPin`, `autoCleanup`, `siteBlock` |
| `banner` | Active announcement | `active`, `message`, `type`, `target`, `expiresAt`, `createdAt` |
| `featureFlags` | Feature toggles | `seasonalProducts`, `supportTickets`, `orderHistory`, `ledgerView`, `darkMode`, `pdfInvoice`, `duplicateOrderCheck`, `balanceWarning`, `companyOrder`, `bulkPriceUpdate` |
| `areas` | Delivery area names | `areas[]` |
| `productGroups` | Product group definitions | `daily[]`, `seasonal[]`, `codes{}` |
| `devAccess` | Developer PIN | `pin` (string, default `"0000"`) |
| `usage_YYYY-MM-DD` | Daily Firestore usage | `reads`, `writes`, `deletes`, `date`, `lastSync` |

### `orders` Document — Field Detail

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `phone` | string | `"9876543210"` | Retailer ka phone |
| `items` | array | `[{name, qty, price, total}]` | Original ordered items |
| `total` | number | `450` | Original total |
| `status` | string | `"pending"` | pending → confirmed → dispatched → delivered / cancelled / returned |
| `date` | string | `"2026-06-16"` | Delivery date (tomorrow) |
| `timestamp` | string (ISO) | `"2026-06-15T14:30:00Z"` | Order placed time |
| `actualItems` | array | `[{name, qty, price, total}]` | Admin-edited quantities (optional) |
| `actualTotal` | number | `420` | Actual total after edit (optional) |

### `users` Document — Field Detail

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `phone` | string | `"9876543210"` | Document ID bhi yahi hai |
| `name` | string | `"Ramesh Kumar"` | — |
| `role` | string | `"retailer"` | `"retailer"` / `"admin"` |
| `pin` | string | `"1234"` | 4-digit PIN |
| `shop` | string | `"Ramesh Dairy"` | Shop name |
| `area` | string | `"Sector 5"` | Delivery area |
| `activeSession` | string | `"uuid-..."` | Current session ID |
| `sessionExpiry` | string (ISO) | `"2026-06-17T..."` | Session expiry time |
| `lastLogin` | string (ISO) | `"2026-06-15T..."` | Last login timestamp |
| `lastLoginDevice` | string | `"Android"` | Parsed device type |
| `deviceInfo` | string | `"Mozilla/5.0..."` | User agent (max 200 chars) |
| `blocked` | boolean | `false` | `true` = login rejected |

---

## 3.10 Firebase Console — Direct Data Edit Karna

Kabhi kabhi code ke bina directly Firebase mein data change karna padta hai. Yahan kaise:

**Firebase Console URL:** `console.firebase.google.com`

**Common direct edits:**

| Kya karna hai | Path | Field |
|---------------|------|-------|
| Maintenance ON/OFF | `settings/app` | `maintenance: true/false` |
| Dev PIN change | `settings/devAccess` | `pin: "newpin"` |
| User block/unblock | `users/{phone}` | `blocked: true/false` delete karo |
| Admin role dena | `users/{phone}` | `role: "admin"` |
| Session force clear | `users/{phone}` | `activeSession: ""` |
| Feature flag toggle | `settings/featureFlags` | Flag name: `true/false` |
| Shop phone change | `settings/app` | `shopPhone: "newphone"` |

---

---

# Authentication & Session System

**File:** `src/pages/Login.js`
**Kab edit karo:** Login UI change karni ho, lockout thresholds change karne ho, session duration change karni ho, ya DEV_PHONE change karna ho.

---

## 4.1 Login Page — Layout

Desktop aur mobile pe alag layout hai:

```
Desktop (lg: breakpoint se bada):
┌─────────────────────┬──────────────────────┐
│   LEFT PANEL        │   RIGHT PANEL        │
│   bg-[#0f172a]      │   bg-white           │
│   44% width         │   flex-1             │
│                     │                      │
│   Logo + Name       │   Form area          │
│   "Simple.          │   (Phone step /      │
│    Secure.          │    PIN step /        │
│    Reliable."       │    Conflict step)    │
│                     │                      │
│   Version + Credit  │                      │
└─────────────────────┴──────────────────────┘

Mobile:
┌──────────────────────┐
│  Dark header         │  ← Sirf phone step pe dikhta hai
│  Logo + Name         │
├──────────────────────┤
│  bg-[#f8fafc]        │
│  Form area           │
│  NumPad (3x4 grid)   │  ← Mobile pe keyboard nahi, NumPad hai
└──────────────────────┘
```

**Desktop pe keyboard support:** Phone step aur PIN step dono pe `keydown` listener hai — type karo aur Enter dabao.

**Mobile pe NumPad:** Long press on backspace → poora clear ho jaata hai (500ms hold).

---

## 4.2 Login Steps — 3 States

```js
const [step, setStep] = useState('phone'); // 'phone' | 'pin' | 'conflict'
```

| Step | Kab dikhta hai | Kya hota hai |
|------|----------------|--------------|
| `phone` | App open hone pe | 10-digit phone number enter karo |
| `pin` | Valid phone ke baad | 4-digit PIN enter karo |
| `conflict` | Active session detect hone pe (retailers only) | Purana session terminate karo ya cancel |

---

## 4.3 Constants — Lockout System

```js
const DEV_PHONE = '8051725780';

// Phone step lockout
const PHONE_MAX = 3;                    // 3 galat phone → lock
const PHONE_TIERS = [120, 600, -1];     // 2min, 10min, permanent

// PIN step lockout
const PIN_MAX = 5;                      // 5 galat PIN → lock
const PIN_TIERS = [60, 300, 1800, -1];  // 1min, 5min, 30min, permanent
```

---

## 4.4 Phone Step — Kaise Kaam Karta Hai

### Phone Verification Cache

```js
const PHONE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

Agar same phone number 5 minute mein dobara enter kiya → Firebase read skip, seedha PIN step pe jaao. Yeh reads bachata hai.

**Cache localStorage key:** `lg_phone_cache` → `{ phone, ts }`

### `handlePhoneSubmit()` — Flow

```
Phone enter kiya → Continue dabaya
        ↓
Phone 10 digits hai? Nahi → return
        ↓
Phone lock active hai? Haan → error dikhao
        ↓
DEV_PHONE hai? Haan → seedha PIN step (no Firebase)
        ↓
Phone cache mein hai? Haan → seedha PIN step (no Firebase)
        ↓
Firebase: users/{phone} document exist karta hai?
        ↓
    Nahi → phoneAttempts++ → lock check → error
    Haan → phone cache set karo → PIN step
```

### Phone Lockout Tiers

| Galat attempts | Lock duration | Tier |
|----------------|---------------|------|
| 3 | 2 minutes | 1 |
| 3 aur (tier 2) | 10 minutes | 2 |
| 3 aur (tier 3) | Permanent block | 3 |

**localStorage key:** `lg_phone_lock` → `{ until, count, tier }`

**Permanent block (`until === -1`):** Device se koi bhi phone number try nahi ho sakta. Admin se contact karna padega.

---

## 4.5 PIN Step — Kaise Kaam Karta Hai

### `handlePinSubmit()` — Flow

```
PIN enter kiya → Verify dabaya
        ↓
PIN 4 digits hai? Nahi → return
        ↓
Account blocked hai? Haan → error
        ↓
PIN lock active hai? Haan → error
        ↓
DEV_PHONE hai?
    Haan → PIN === '0000'? Nahi → handleWrongPin()
           Haan → resetPinAttempts() → createSession(dev user)
        ↓
Firebase: users/{phone} padho
        ↓
data.blocked === true?
    Haan + wrong PIN → handleWrongPin()
    Haan + correct PIN → createSession() (blocked user bhi login kar sakta hai support ke liye)
        ↓
PIN match karta hai? Nahi → handleWrongPin()
        ↓
Admin role hai? Haan → seedha createSession() (no conflict check)
        ↓
Active session exist karta hai aur expire nahi hua?
    Haan → step = 'conflict', pendingUser set karo
    Nahi → createSession()
```

### `handleWrongPin()` — Lockout Logic

```js
const handleWrongPin = async () => {
  const newAttempts = pinAttempts + 1;
  clearPhoneCache(); // security ke liye phone cache clear

  if (newAttempts >= PIN_MAX) {
    const newTier = pinLockTier + 1;
    const duration = PIN_TIERS[Math.min(newTier - 1, PIN_TIERS.length - 1)];

    if (duration === -1) {
      // Permanent block
      setPinBlocked(true);
      await updateDoc(doc(db, 'users', phone), {
        blocked: true,
        blockedAt: new Date().toISOString(),
        blockReason: 'Too many wrong PIN attempts',
        loginAttempts: 0,
        lockTier: newTier,
      });
    } else {
      // Temporary lock
      const until = Date.now() + duration * 1000;
      setPinLockUntil(until);
      await updateDoc(doc(db, 'users', phone), {
        loginAttempts: 0,
        lockUntil: new Date(until).toISOString(),
        lockTier: newTier,
      });
    }
  } else {
    // Sirf count update karo
    await updateDoc(doc(db, 'users', phone), { loginAttempts: newAttempts, lockTier: pinLockTier });
  }
};
```

### PIN Lockout Tiers

| Galat attempts | Lock duration | Tier |
|----------------|---------------|------|
| 5 | 1 minute | 1 |
| 5 aur (tier 2) | 5 minutes | 2 |
| 5 aur (tier 3) | 30 minutes | 3 |
| 5 aur (tier 4) | Permanent block | 4 |

**Permanent block:** `users/{phone}.blocked = true` Firebase mein set hota hai. Sirf Admin → Sessions → Unblock se theek hoga.

**Firebase fields updated on wrong PIN:**

| Field | Type | Kya store hota hai |
|-------|------|-------------------|
| `loginAttempts` | number | Current attempt count |
| `lockUntil` | string (ISO) | Lock expiry time |
| `lockTier` | number | Current tier (1-4) |
| `blocked` | boolean | Permanent block flag |
| `blockedAt` | string (ISO) | Block timestamp |
| `blockReason` | string | Reason text |

---

## 4.6 `createSession()` — Session Banao

```js
const createSession = async (userData) => {
  const sessionId = generateSessionId(); // `${Date.now()}-${random}`
  const isDev = userData.phone === DEV_PHONE;

  // Session timeout Firebase se padho (default 24 hours)
  let timeoutHours = 24;
  const s = await getDoc(doc(db, 'settings', 'app'));
  if (s.exists() && s.data().sessionTimeout) timeoutHours = s.data().sessionTimeout;

  // Dev ka session sirf 4 hours (shorter for security)
  const sessionExpiry = new Date(Date.now() + (isDev ? 4 : timeoutHours) * 3600000).toISOString();

  // Recent phones list update karo (max 3)
  saveRecent(userData.phone, userData.name);

  // Firebase update
  await updateDoc(doc(db, 'users', userData.phone), {
    activeSession: sessionId,
    sessionExpiry,
    lastLogin: new Date().toISOString(),
    lastDevice: ua.slice(0, 100),
    // Admin ke liye sessions array mein bhi add karo (multi-device tracking)
    ...(role === 'admin' && { sessions: arrayUnion({ sessionId, device, browser, os, loginAt, expiresAt }) }),
  });

  // localStorage mein save karo
  const sessionData = { ...userData, sessionId, sessionExpiry };
  localStorage.setItem(`lg_user_${userData.phone}`, JSON.stringify(sessionData));
  localStorage.setItem('lg_user', JSON.stringify(sessionData));       // backward compat
  localStorage.setItem('lg_last_login', userData.phone);
  sessionStorage.setItem('lg_active_phone', userData.phone);

  onLogin(sessionData); // App.js ka handleLogin() call hota hai
};
```

**Dev session 4 hours kyon:** Developer ka session shorter rakha gaya security ke liye — agar koi dev phone pe access kar le toh zyada der tak active na rahe.

**Admin sessions array:** Admin ke liye har login ek entry `sessions[]` array mein add hoti hai — device, browser, OS, login time sab track hota hai. Yeh Admin Sessions page pe dikhta hai.

**`generateSessionId()`:**
```js
const generateSessionId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
// Example: "1718456789123-k7m2xp9q"
```

---

## 4.7 Session Conflict — Step `'conflict'`

```js
// Retailers only — admin skip karta hai
if (data.activeSession && data.sessionExpiry && new Date(data.sessionExpiry) > new Date()) {
  setPendingUser({ ...data, phone });
  setStep('conflict');
  return;
}
```

**Conflict screen dikhta hai jab:**
- Retailer ka `activeSession` Firebase mein exist karta hai
- `sessionExpiry` abhi expire nahi hua
- Matlab koi aur device pe already logged in hai

**Options:**
- "Cancel" → phone step pe wapas jaao
- "Terminate & Login" → `terminateAndLogin()` → `createSession(pendingUser)` → naya session create, purana overwrite

**Admin ke liye conflict nahi:** Admin multi-device login kar sakta hai. `createSession()` directly call hota hai.

---

## 4.8 Recent Phones — Quick Login

```js
const getRecent = () => JSON.parse(localStorage.getItem('lg_recent_phones') || '[]');
const saveRecent = (ph, name) => {
  const list = getRecent().filter(r => r.phone !== ph); // duplicate remove
  list.unshift({ phone: ph, name: name || '' });        // top pe add
  localStorage.setItem('lg_recent_phones', JSON.stringify(list.slice(0, 3))); // max 3
};
```

**Phone step pe dikhta hai** jab phone input empty ho aur recent list mein entries hon. Click karo → phone field fill ho jaata hai.

**Security:** Phone number masked dikhta hai: `+91 ••••• 43210` (last 5 digits only).

---

## 4.9 Three User Roles — Complete Comparison

| Feature | Retailer | Admin | Developer |
|---------|----------|-------|-----------|
| Role value | `"retailer"` | `"admin"` | `"admin"` (phone se identify) |
| Home URL | `/` | `/admin` | `/dev` |
| Multi-device login | ❌ (conflict screen) | ✅ | ✅ |
| Session monitored | ✅ (polling 2 min) | ❌ | ❌ |
| Maintenance blocks | ✅ | ❌ | ❌ |
| siteBlock blocks | ✅ | ✅ | ❌ |
| Dev tools access | ❌ | ❌ | ✅ |
| Admin panel access | ❌ | ✅ | ✅ |
| PIN checked against | `users/{phone}.pin` | `users/{phone}.pin` | `settings/devAccess.pin` |
| Session duration | `settings/app.sessionTimeout` (default 24h) | Same | 4 hours (hardcoded) |
| Blocked by wrong PIN | ✅ | ✅ | ❌ (DEV_PHONE skip) |

**Admin role kaise assign karo:**
1. Firebase Console → Firestore → `users` collection
2. Admin ka phone document open karo (ya banao)
3. `role` field → `"admin"` set karo

---

## 4.10 DEV_PHONE Special Behavior — Summary

```js
const DEV_PHONE = '8051725780'; // Login.js mein
const DEV_PHONE = '8051725780'; // App.js mein bhi — dono same hone chahiye
```

**Login.js mein:**
- Phone step: Firebase check skip, seedha PIN step
- PIN step: `settings/devAccess.pin` se check (default `"0000"`)
- Wrong PIN pe lockout nahi hota
- Session 4 hours ka

**App.js mein:**
- `verifyUser()`: Firebase session check skip
- Maintenance bypass
- siteBlock bypass
- `isDev = user.phone === '8051725780'` → dev routes access

**DEV_PHONE change karne ke steps:**
1. `src/pages/Login.js` → `const DEV_PHONE = '8051725780'` update karo
2. `src/App.js` → `const DEV_PHONE = '8051725780'` update karo
3. Firebase Console → `settings/devAccess` → `pin` field set karo naye dev ke liye
4. Rebuild aur deploy karo

---

## 4.11 Dev PIN — `settings/devAccess`

```
Firebase path: settings/devAccess
Field: pin (string)
Default: "0000"
```

**Yeh PIN 2 jagah use hota hai:**
1. `Login.js` — DEV_PHONE ka PIN verify karne ke liye
2. `DeveloperLayout.js` — Dev tools access karne se pehle PIN gate

**Dev PIN change karna:**
- Firebase Console → `settings/devAccess` → `pin` field edit karo
- Koi rebuild nahi chahiye — real-time change hota hai

---

## 4.12 localStorage Keys — Complete Reference

| Key | Kya store hota hai | Kab set hota hai | Kab clear hota hai |
|-----|--------------------|------------------|-------------------|
| `lg_user_{phone}` | Full user + session object | Login / verify | Logout / session expire |
| `lg_user` | Same (backward compat) | Login / verify | Logout / session expire |
| `lg_last_login` | Last logged in phone | Login | Kabhi nahi (persistent) |
| `lg_last_verify_{phone}` | Last Firebase verify timestamp | verifyUser() | Kabhi nahi |
| `lg_recent_phones` | Last 3 logged in phones + names | Login | Kabhi nahi (persistent) |
| `lg_phone_lock` | Phone lockout state | Wrong phone | Lock expire pe |
| `lg_phone_cache` | Valid phone cache | Successful phone verify | 5 min TTL / wrong PIN |
| `lg_usage_today` | Firestore read/write counts | Every operation | Daily reset |
| `lg_last_cleanup` | Last cleanup date | runAutoCleanup() | Kabhi nahi |
| `lg_darkmode` | Dark mode preference | Toggle | Kabhi nahi |
| `lg_font_size` | Font size preference | Toggle | Kabhi nahi |
| `lg_welcome_shown` | WelcomePopup shown flag | After popup | Kabhi nahi |

| sessionStorage Key | Kya store hota hai | Tab-specific |
|--------------------|--------------------|--------------|
| `lg_active_phone` | Is tab ka active user | ✅ |
| `lg_dev_verified` | Dev PIN verification + expiry | ✅ |
| `lg_last_login_time` | Double-login prevention | ✅ |

---

## 4.13 Force Logout — Kya Hota Hai

**Admin → Sessions → Force Logout:**
```js
// Firebase mein:
await updateDoc(doc(db, 'users', phone), {
  activeSession: '',
  sessionExpiry: '',
});
```

**User ke device pe kya hota hai:**
- App.js ka polling check (har 2 min) detect karta hai ki `activeSession` change ho gaya
- `localStorage.removeItem()` → `window.location.reload()`
- User Login page pe aa jaata hai

**Maximum wait time:** 2 minutes (polling interval). Agar turant logout chahiye → user ka internet band karo ya Firebase Console se directly `activeSession` empty karo.

**"Force Logout All" button:**
- Saare retailers ke `activeSession` aur `sessionExpiry` empty karta hai
- Batch operation — ek baar mein sab

---



---

# Layouts & Navigation

Teen layout files hain jo app ka bahari dhaacha (shell) provide karti hain. Har layout mein header, sidebar, bottom navigation, aur footer hota hai. Inner page content `<Outlet />` ke through render hota hai.

---

## 5.1 File: `src/components/layout/RetailerLayout.js`

**Retailer ka poora shell.** Yeh file tab load hoti hai jab koi retailer login karta hai.

### Navigation Arrays — Yahan Se Links Control Hote Hain

```js
// Desktop sidebar + "More" sheet mein dikhne wale links
const navItems = [
  { to: '/',          label: 'Home',         Icon: Home,        end: true },
  { to: '/order',     label: 'Place Order',  Icon: ShoppingCart },
  { to: '/track',     label: 'My Orders',    Icon: Package },
  { to: '/history',   label: 'Order History',Icon: History },
  { to: '/prices',    label: 'Price List',   Icon: IndianRupee },
  { to: '/my-ledger', label: 'My Ledger',    Icon: BookOpen,    flag: 'ledgerView' },
  { to: '/profile',   label: 'Profile',      Icon: User },
  { to: '/settings',  label: 'Settings',     Icon: Settings },
  { to: '/support',   label: 'Support',      Icon: Headphones,  flag: 'supportTickets' },
  { to: '/guide',     label: 'User Guide',   Icon: GraduationCap },
];

// Mobile bottom nav (hamesha visible — scroll pe hide/show hota hai)
const bottomNav = [
  { to: '/',          label: 'Home',   Icon: Home,         end: true },
  { to: '/order',     label: 'Order',  Icon: ShoppingCart },
  { to: '/track',     label: 'Track',  Icon: Package },
  { to: '/prices',    label: 'Prices', Icon: IndianRupee },
  { to: '/my-ledger', label: 'Ledger', Icon: BookOpen,     flag: 'ledgerView' },
];

// "More" bottom sheet ke links
const moreLinks = [
  { to: '/history',  label: 'Order History', Icon: History },
  { to: '/profile',  label: 'Profile',       Icon: User },
  { to: '/settings', label: 'Settings',      Icon: Settings },
  { to: '/support',  label: 'Support',       Icon: Headphones, flag: 'supportTickets' },
  { to: '/guide',    label: 'User Guide',    Icon: GraduationCap },
];
```

**Nav link add/remove karna:** Upar wale arrays mein entry add ya remove karo. Icon `lucide-react` se import karo.

**`flag` property:** Agar kisi link mein `flag: 'ledgerView'` ho toh woh link sirf tab dikhega jab Firebase `settings/featureFlags.ledgerView !== false` ho. Feature flag OFF karo → link gayab.

### Desktop Sidebar — Collapsible

```
Mouse hover → sidebar 68px se 260px ho jaata hai (smooth transition)
Mouse leave → wapas 68px
```

- Collapsed state (68px): Sirf icons dikhte hain, labels hidden
- Expanded state (260px): Icons + labels + active dot
- Active link: `bg-gradient-to-r from-royal-600 to-royal-700` (blue gradient)
- User card + Logout button sidebar ke bottom mein

**Sidebar background change karna:**
```
bg-white dark:bg-[#0a0a0a] border-r border-gray-100
```

### Mobile Header

```
bg-gradient-to-r from-royal-700 via-royal-600 to-mint-700
```

Header mein: Logo + App name + current page title + Font size buttons + Dark mode toggle

**Header gradient change karna:** Upar wali class dhundho aur colors badlo.

### Mobile Bottom Nav — Scroll Behavior

```js
// Scroll down → nav hide hota hai
// Scroll up → nav wapas aata hai
setNavHidden(y > lastY && y > 60);
```

Bottom nav `translate-y-full` se hide hota hai — smooth slide down animation.

**Active link indicator:** `layoutId="bottomNavPill"` — framer-motion ka shared layout animation. Active tab pe blue pill background slide karta hai.

### Announcement Banner System

```js
// Firebase se banner fetch karo (10 min cache)
const snap = await cachedGetDoc(doc(db, 'settings', 'banner'), 10 * 60 * 1000);

// Conditions jab banner dikhega:
// 1. data.active === true
// 2. data.message exist karta hai
// 3. data.expiresAt nahi guzra
// 4. data.target === 'all' OR 'retailers'
// 5. User ne is banner ko dismiss nahi kiya (lg_banner_dismissed !== data.createdAt)
```

**Banner types aur colors:**

| Type | Background | Border | Icon |
|------|-----------|--------|------|
| `urgent` | `bg-red-50` | `border-red-200` | AlertCircle (red) |
| `warning` | `bg-amber-50` | `border-amber-200` | AlertTriangle (amber) |
| `success` | `bg-mint-50` | `border-mint-200` | CheckCircle2 (green) |
| `info` | `bg-blue-50` | `border-blue-200` | Info (blue) |

**Dismiss:** X button dabao → `lg_banner_dismissed` localStorage mein `banner.createdAt` save hota hai. Dobara wahi banner nahi dikhega.

### Pull-to-Refresh

```js
const { pulling, pullDistance, threshold } = usePullToRefresh();
// threshold = 80px
// pulling = true jab user pull kar raha ho
// pullDistance = kitna pull kiya (px mein)
```

Pull indicator: Ek circle jo pull ke saath rotate hota hai. 80px se zyada pull karo → green ho jaata hai → release karo → page reload.

### Page Transition

```js
useEffect(() => {
  import('../TopProgressBar').then(m => {
    m.triggerProgress();
    setTimeout(m.stopProgress, 300);
  });
}, [location.pathname]);
```

Har route change pe top progress bar animate hota hai.

### Logout Flow

```js
const handleLogout = async () => {
  const ok = await confirm({ title: 'Logout', type: 'logout' });
  if (ok) {
    localStorage.removeItem(`lg_user_${phone}`);
    localStorage.removeItem(`lg_last_verify_${phone}`);
    localStorage.removeItem('lg_user');
    sessionStorage.removeItem('lg_active_phone');
    window.location.reload();
  }
};
```

---

## 5.2 File: `src/components/layout/AdminLayout.js`

**Admin ka shell.** RetailerLayout se kaafi similar hai lekin dark sidebar aur admin-specific links hain.

### Navigation Arrays

```js
const sidebarLinks = [
  { to: '/admin',                label: 'Dashboard',    Icon: LayoutDashboard, end: true },
  { to: '/admin/retailers',      label: 'Retailers',    Icon: Users },
  { to: '/admin/daily-ledger',   label: 'Daily Sheet',  Icon: ShoppingBag },
  { to: '/admin/company-order',  label: 'Company Order',Icon: Truck },
  { to: '/admin/inventory',      label: 'Inventory',    Icon: Warehouse },
  { to: '/admin/ledger',         label: 'Ledger',       Icon: BookOpen },
  { to: '/admin/support',        label: 'Tickets',      Icon: Headphones },
  { to: '/admin/place-order',    label: 'Place Order',  Icon: ClipboardList },
  { to: '/admin/announcements',  label: 'Announcements',Icon: Megaphone },
  { to: '/admin/settings',       label: 'Settings',     Icon: Settings },
];

const bottomNavLinks = [
  { to: '/admin',               label: 'Home',    Icon: LayoutDashboard, end: true },
  { to: '/admin/daily-ledger',  label: 'Daily',   Icon: ShoppingBag },
  { to: '/admin/company-order', label: 'Company', Icon: Truck },
  { to: '/admin/ledger',        label: 'Ledger',  Icon: BookOpen },
];
```

### Sidebar Theme

```
bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a]
```

Dark navy gradient. Active link: `from-royal-600/90 to-royal-700/90`.

**Sidebar background change karna:** Upar wali gradient classes dhundho.

### Dev Panel Button

```js
const isDev = JSON.parse(localStorage.getItem('lg_user') || '{}').phone === '8051725780';

// Sidebar mein (expanded state):
{isDev && sidebarExpanded && (
  <button onClick={() => { window.location.href = '/dev'; }}>
    <Code size={15} /> Dev Panel
  </button>
)}

// More sheet mein (mobile):
{isDev && (
  <button onClick={() => { window.location.href = '/dev'; }}>
    Dev Panel
  </button>
)}
```

Sirf DEV_PHONE wale user ko dikhta hai. Green color (`bg-green-500/10 border-green-500/20 text-green-400`).

### Dev Verification Check

```js
useEffect(() => {
  if (isDev) {
    const stored = sessionStorage.getItem('lg_dev_verified');
    if (!stored || JSON.parse(stored).expiry <= Date.now()) {
      window.location.href = '/dev'; // PIN gate pe bhejo
    }
  }
}, [isDev]);
```

Agar developer admin panel access kare bina dev PIN verify kiye → `/dev` pe redirect. Wahan PIN gate hai. PIN verify hone ke baad `lg_dev_verified` sessionStorage mein save hota hai, phir admin panel access milta hai.

### Banner System

RetailerLayout jaisa hi — lekin `data.target === 'all' OR 'admin'` check hota hai (retailers wala nahi).

---

## 5.3 File: `src/components/layout/DeveloperLayout.js`

**Developer ka shell.** Isme PIN gate built-in hai — pehle PIN verify karo, phir dev tools access karo.

### PIN Gate — `DeveloperLayout` Component

```js
const DEV_SESSION_KEY = 'lg_dev_verified';
const DEV_SESSION_DURATION = 60 * 60 * 1000; // 1 hour

// App open pe check:
const stored = sessionStorage.getItem(DEV_SESSION_KEY);
if (stored) {
  const { expiry } = JSON.parse(stored);
  if (expiry > Date.now()) {
    setDevVerified(true); // session valid hai — PIN skip
    return;
  }
  sessionStorage.removeItem(DEV_SESSION_KEY); // expired — PIN maango
}

// Firebase se PIN load karo
const snap = await getDoc(doc(db, 'settings', 'devAccess'));
setCorrectPin(snap.data().pin || '0000');
```

**PIN verify hone ke baad:**
```js
sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify({
  expiry: Date.now() + DEV_SESSION_DURATION // 1 hour
}));
setDevVerified(true);
```

**5 galat attempts → nuclear option:**
```js
if (newAttempts >= 5) {
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload(); // poora logout
}
```

**PIN gate UI:** Dark screen (`#0a0a0a`), green shield icon, 4 PIN dots, 3x4 numpad.

**PIN timeout change karna:** `DEV_SESSION_DURATION` constant — milliseconds mein.

### `DevLayoutInner` — Actual Layout

PIN verify hone ke baad `<DevLayoutInner />` render hota hai.

### Navigation Arrays

```js
const devLinks = [
  { to: '/dev',              label: 'Dev Panel',       Icon: Server,      end: true },
  { to: '/dev/errors',       label: 'Error Logs',      Icon: Bug },
  { to: '/dev/sessions',     label: 'Sessions',        Icon: Radio },
  { to: '/dev/analytics',    label: 'Analytics',       Icon: BarChart3 },
  { to: '/dev/order-manager',label: 'Order Manager',   Icon: PackageSearch },
  { to: '/dev/activity',     label: 'Retailer Activity',Icon: UserCheck },
  { to: '/dev/deploy',       label: 'Deploy Info',     Icon: Rocket },
  { to: '/dev/announce',     label: 'Announcements',   Icon: Megaphone },
  { to: '/dev/cleanup',      label: 'DB Cleanup',      Icon: Database },
  { to: '/dev/flags',        label: 'Feature Flags',   Icon: Flag },
  { to: '/dev/audit',        label: 'Audit Log',       Icon: ScrollText },
  { to: '/dev/ratings',      label: 'App Ratings',     Icon: Star },
  { to: '/dev/export',       label: 'Data Export',     Icon: Download },
  { to: '/dev/backup',       label: 'Backup & Restore',Icon: HardDrive },
  { to: '/dev/api-monitor',  label: 'API Monitor',     Icon: Wifi },
  { to: '/dev/tasks',        label: 'Scheduled Tasks', Icon: Clock },
  { to: '/dev/config-diff',  label: 'Config Diff',     Icon: GitCompare },
  { to: '/dev/editor',       label: 'Doc Editor',      Icon: FileEdit },
  { to: '/dev/bulk-update',  label: 'Bulk Update',     Icon: Layers },
  { to: '/dev/report',       label: 'Monthly Report',  Icon: FileText },
  { to: '/dev/guide',        label: 'Dev Guide',       Icon: BookOpen },
];

// Mobile bottom nav (4 links + More)
const bottomNavLinks = [
  { to: '/dev',           label: 'Health',   Icon: Server,   end: true },
  { to: '/dev/errors',    label: 'Errors',   Icon: Bug },
  { to: '/dev/sessions',  label: 'Sessions', Icon: Radio },
  { to: '/dev/analytics', label: 'Analytics',Icon: BarChart3 },
];
```

**Naya dev tool add karna:**
1. `devLinks` array mein entry add karo
2. `moreLinks` array mein bhi add karo (mobile ke liye)
3. `App.js` mein lazy import + route add karo
4. `src/pages/dev/` mein file banao

### Visual Theme

```
Background:     #0a0a0a (near black)
Sidebar:        from-[#0f0f0f] via-[#141414] to-[#0a0a0a]
Sidebar border: border-green-900/30
Active link:    from-green-600/90 to-emerald-700/90
Accent color:   green-500 / emerald-700
"Live" dot:     animate-pulse bg-green-500
```

### "Open Admin Panel" Button

Sidebar ke bottom mein ek button hai jo `/admin` pe navigate karta hai (`window.location.href` — full page navigation, React Router nahi).

### Logout

```js
if (ok) {
  localStorage.clear(); // poora clear — dev ka
  window.location.reload();
}
```

Dev logout pe `localStorage.clear()` — sirf dev ka data clear hota hai.

---

## 5.4 Teeno Layouts Ka Comparison

| Feature | RetailerLayout | AdminLayout | DeveloperLayout |
|---------|---------------|-------------|-----------------|
| Sidebar background | White / dark | Dark navy | Near black |
| Accent color | Royal blue | Royal blue | Green |
| Sidebar width | 68px → 260px (hover) | 68px → 260px (hover) | 260px (fixed) |
| Banner system | ✅ (retailers/all) | ✅ (admin/all) | ❌ |
| Feature flags | ✅ (nav links) | ❌ | ❌ |
| PIN gate | ❌ | ❌ | ✅ (1 hour session) |
| Pull-to-refresh | ✅ | ✅ | ✅ |
| Dark mode toggle | ✅ | ✅ | ❌ |
| Font size toggle | ✅ | ✅ | ❌ |
| AppFooter | ✅ | ✅ | ❌ |
| Dev Panel button | ❌ | ✅ (dev only) | — |

---

## 5.5 Common Changes — Quick Reference

| Kya change karna hai | Kahan |
|----------------------|-------|
| Retailer nav link add/remove | `RetailerLayout.js` → `navItems` array |
| Retailer bottom nav change | `RetailerLayout.js` → `bottomNav` array |
| Retailer "More" sheet links | `RetailerLayout.js` → `moreLinks` array |
| Admin sidebar links | `AdminLayout.js` → `sidebarLinks` array |
| Admin bottom nav | `AdminLayout.js` → `bottomNavLinks` array |
| Dev tools sidebar | `DeveloperLayout.js` → `devLinks` array |
| Dev tools "More" sheet | `DeveloperLayout.js` → `moreLinks` array |
| Retailer header gradient | `RetailerLayout.js` → `from-royal-700 via-royal-600 to-mint-700` |
| Admin sidebar color | `AdminLayout.js` → `from-[#0f172a] via-[#1e293b] to-[#0f172a]` |
| Dev PIN timeout | `DeveloperLayout.js` → `DEV_SESSION_DURATION` |
| Developer name in sidebar | `DeveloperLayout.js` → `Divyanshu Gupta` text dhundho |
| Banner dismiss behavior | `lg_banner_dismissed` localStorage key |

---

# Retailer Pages

Sabhi files `src/pages/retailer/` mein hain. Yeh woh screens hain jo shop owner login karne ke baad dekhta hai.

---

## 6.1 `Home.js` — Retailer Dashboard (`/`)

### Data Fetching — `useCache` Hook

```js
const { data: homeData, loading } = useCache(`home_${user.phone}`, async () => {
  // Ek hi call mein sab fetch hota hai:
  // 1. settings/app — delivery/order timing
  // 2. ledger — balance calculate karo (source of truth)
  // 3. orders (last 30) — today's order, recent list, streak, monthly stats
}, [user.phone]);
```

Cache key `home_{phone}` hai — agar same phone ka data cache mein ho toh Firebase call nahi hoga.

### Balance Calculation

```js
// retailer_balances collection se nahi — ledger se calculate hota hai
const ledgerEntries = ledgerSnap.docs.map(d => d.data());
balance = ledgerEntries.reduce((sum, e) => {
  if (e.type === 'debit')  return sum + (e.amount || 0);  // order placed
  return sum - (e.amount || 0);                           // payment received
}, 0);
```

### Daily Rotating Content

```js
const getDayIndex = (arrLength) => {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + d.getMonth() * 32 + d.getDate();
  return seed % arrLength;
};
```

Har din alag greeting, tip, aur welcome card gradient dikhta hai — deterministic (same device pe same din same content).

| Array | Size | Kya dikhta hai |
|-------|------|----------------|
| `GREETINGS` | 28 | Welcome card ke neeche tagline |
| `DAILY_TIPS` | 31 | Amber tip card |
| `GRADIENTS` | 15 | Welcome card ka background gradient |

### Order Streak

```js
// Last 30 din mein consecutive order days count karo
for (let i = 0; i < 30; i++) {
  if (allOrders.some(o => o.date === dateStr && o.status !== 'Cancelled')) streakCount++;
  else if (i > 0) break; // streak toot gayi
}
```

2+ din streak ho toh welcome card pe flame icon + "X day streak" badge dikhta hai.

### Status Colors

| Status | Text Color | Background |
|--------|-----------|------------|
| Pending | `text-amber-700` | `bg-amber-50` |
| Confirmed | `text-royal-700` | `bg-royal-50` |
| Dispatched | `text-blue-700` | `bg-blue-50` |
| Delivered | `text-mint-700` | `bg-mint-50` |
| Cancelled | `text-red-700` | `bg-red-50` |
| Returned | `text-gray-700` | `bg-gray-50` |

**Common changes:**

| Kya | Kahan |
|-----|-------|
| Welcome card gradient | `GRADIENTS` array mein naya gradient add karo |
| Greeting text | `GREETINGS` array |
| Daily tip | `DAILY_TIPS` array |
| Delivery schedule text | `timing` object se aata hai — Firebase `settings/app` se |
| "Udhaar" label | Search `Udhaar` |

---

## 6.2 `PlaceOrder.js` — Product Selection (`/order`)

### Order Window Check

```js
const start = d.orderStart ?? 12;  // default 12 PM
const end   = d.orderEnd   ?? 16;  // default 4 PM

// Overnight window support (e.g. 10 PM to 2 AM)
if (end <= start) {
  setCutoffPassed(!(hour >= start || hour < end));
} else {
  setCutoffPassed(hour < start || hour >= end);
}
```

`orderStart = -1` ya `orderEnd = -1` → order window hamesha open (no restriction).

Window band ho → poora page block ho jaata hai, sirf "View Price List" button dikhta hai.

### Re-order Feature

```js
const reorder = localStorage.getItem('lg_reorder');
if (reorder) {
  const items = JSON.parse(reorder);
  items.forEach(item => {
    const match = prods.find(p => p.name === item.name);
    if (match) qtyMap[match.id] = Number(item.qty) || 0;
  });
  localStorage.removeItem('lg_reorder');
}
```

Order History page se "Re-order" dabao → `lg_reorder` localStorage mein set hota hai → PlaceOrder page pe quantities pre-fill ho jaati hain.

### Max Items Limit

```js
const increment = (id) => {
  const currentCount = Object.keys(prev).filter(k => prev[k] > 0).length;
  const isNew = !prev[id] || prev[id] === 0;
  if (isNew && maxOrderItems > 0 && currentCount >= maxOrderItems) {
    setToast(`Max ${maxOrderItems} items allowed per order`);
    return prev; // naya item add nahi hoga
  }
  // ...
};
```

`settings/app.maxOrderItems = 0` → no limit. Koi bhi positive number → us se zyada unique products nahi add ho sakte.

### Seasonal Products

```js
const seasonalProducts = flags.seasonalProducts !== false
  ? products.filter(p => p.type === 'seasonal')
  : [];
```

`settings/featureFlags.seasonalProducts = false` → seasonal section gayab.

### Cart Bar

Cart mein koi item ho → bottom pe floating gradient bar dikhta hai:
- Item count + total amount
- "Checkout →" button
- `from-royal-700 via-royal-600 to-mint-700` gradient
- Order window band ho → gray disabled state

**Common changes:**

| Kya | Kahan |
|-----|-------|
| "Daily Products" header | Search `Daily Products` |
| "Seasonal Products" header | Search `Seasonal Products` |
| Cart bar gradient | Search `from-royal-700 via-royal-600 to-mint-700` near cart |
| Search placeholder | Search `Search products...` |
| Price disclaimer text | Search `Prices may change without prior notice` |

---

## 6.3 `Checkout.js` — Order Confirmation (`/checkout`)

### Cart Data

```js
const cartItems = JSON.parse(localStorage.getItem('lg_cart') || '[]');
```

PlaceOrder page `lg_cart` localStorage mein save karta hai. Checkout page wahan se padhta hai.

### Duplicate Order Check — 4 States

```js
// Tomorrow ki date ke orders check karo
const dupSnap = await getDocs(query(collection(db, 'orders'),
  where('phone', '==', user.phone),
  where('date', '==', tomorrowStr)
));

if (existData.status === 'Dispatched' || existData.status === 'Delivered')
  setDuplicateWarning('dispatched');
else if (existData.status === 'Cancelled')
  setDuplicateWarning('cancelled');
else if (existData.status === 'Returned')
  setDuplicateWarning('returned');
else
  setDuplicateWarning('pending');
```

| State | Kya dikhta hai |
|-------|----------------|
| `pending` | "Already have an order" + Replace button (agar `allowModify = true`) |
| `dispatched` | "Order already dispatched" + Call button only |
| `cancelled` | "Order was cancelled" + Call button only |
| `returned` | "Order was returned" + Call button only |

**Replace Order flow:**
1. Confirm modal dikhao
2. Existing order ke items + total update karo (`updateDoc`)
3. `order_history` mein bhi sync karo
4. Success animation

### Order Create Flow

```js
// 1. orders collection mein save karo
const orderRef = await addDoc(collection(db, 'orders'), orderData);

// 2. order_history mein permanent snapshot save karo
await addDoc(collection(db, 'order_history'), {
  ...orderData,
  orderId: orderRef.id,
  historyCreatedAt: new Date().toISOString(),
});

// 3. Cart clear karo
localStorage.removeItem('lg_cart');

// 4. Success animation dikhao → 3 sec baad /track pe navigate
setSuccess(true);
setTimeout(() => navigate('/track'), 3000);
```

**Order document fields:**

| Field | Value |
|-------|-------|
| `retailerId` | user.phone |
| `retailer` | user.name |
| `phone` | user.phone |
| `area` | user.area |
| `items` | `[{name, qty: "2 pkt", price: 60, unitPrice: 30}]` |
| `total` | cartTotal |
| `status` | `"Confirmed"` |
| `date` | Tomorrow's date (en-IN format) |
| `time` | Current time (12-hour format) |
| `orderedAt` | ISO string |
| `createdAt` | ISO string |

### Success Screen

Dark blue full-screen overlay (`from-royal-900 via-royal-800 to-royal-700`) + confetti particles (24 colored squares) + pulse rings + animated checkmark + "Order Placed!" text.

**Common changes:**

| Kya | Kahan |
|-----|-------|
| "Place Order" button gradient | Search `from-royal-700 via-royal-600 to-mint-700` |
| "Order Placed!" text | Search `Order Placed!` |
| "Delivery tomorrow morning" | Search `Delivery tomorrow morning` |
| Min order warning | `minOrderAmount` — Firebase `settings/app.minOrderAmount` |

---

## 6.4 `TrackOrder.js` — Order Tracking (`/track`)

### Real-time Listener

```js
const q = query(collection(db, 'orders'), where('phone', '==', user.phone));
const unsub = onSnapshot(q, (snap) => {
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  // Latest date ke active orders dikhao
  const latestDate = all[0].date;
  const active = dateOrders.filter(o => o.status !== 'Cancelled' && o.status !== 'Returned');
  setOrders(active.length > 0 ? [active[0]] : [dateOrders[0]]);
});
```

`onSnapshot` use hota hai — koi bhi status change hone pe page automatically update hota hai bina refresh ke.

### `actualItems` vs `items`

```js
// Admin ne quantities edit ki hain toh actualItems use karo
const items = (status === 'Delivered' || status === 'Dispatched') && o.actualItems
  ? o.actualItems
  : o.items;
```

Admin dispatch karte waqt actual quantities enter kar sakta hai. Delivered/Dispatched orders mein `actualItems` aur `actualTotal` use hote hain.

### Order Progress Timeline

```
Confirmed ──────── Dispatched ──────── Delivered
    ●                   ●                   ●
```

Animated gradient line jo current step tak fill hoti hai. Current step pe pulse animation.

### PDF Downloads

**Dispatch Slip** (blue, `#0136e4`) — sirf Dispatched status pe:
- Header: "DISPATCH SLIP" + "ON THE WAY" badge
- Customer box: "Deliver To:"
- Footer note: *"Quantities may be adjusted upon delivery"*
- File: `LG_DispatchSlip_DATE_NAME.pdf`

**Final Invoice** (green, `#17a966`) — sirf Delivered status pe:
- Header: "FINAL INVOICE" + "DELIVERED" badge
- Customer box: "Bill To:"
- Delivery timestamp shown
- Footer: "Thank you for your order!"
- File: `LG_Invoice_DATE_NAME.pdf`

**Common changes:**

| Kya | Kahan |
|-----|-------|
| Dispatch Slip color | `downloadDispatchSlipPDF` → `setFillColor(1, 54, 228)` |
| Invoice color | `downloadInvoicePDF` → `setFillColor(23, 169, 102)` |
| Dispatch Slip note | Search `Quantities may be adjusted` |
| Invoice thank you | Search `Thank you for your order` |
| Cancel button | Sirf Pending/Confirmed status pe dikhta hai |

---

## 6.5 `Settings.js` — Retailer Settings (`/settings`)

### Sections

| Section | Kya hai |
|---------|---------|
| Appearance | Dark mode toggle |
| Display | Font size (Small/Normal/Large) |
| Security | Change PIN (3-step modal) |
| Feedback | Rate app (1-5 stars) |
| Install App | PWA install button (sirf tab dikhta hai jab standalone nahi) |
| About | Developer name + version + portfolio link |
| More | About, Privacy, Terms, Share App, Clear Cache |

### PIN Change — `PinModal` Component

3-step flow, har step pe 4-dot display + numpad:

```
Step 1 (current): Current PIN verify karo → Firebase se check
Step 2 (new):     Naya PIN enter karo → validation:
                  - Same as old PIN? → reject
                  - All same digits (1111)? → reject
                  - Sequential (1234/9876)? → reject
Step 3 (confirm): Naya PIN dobara enter karo → match check → Firebase update
```

**Progressive lockout (PIN change mein bhi):**
- 3 galat → 60 seconds lock
- 3 aur → 5 minutes lock
- 3 aur → force logout (suspicious activity)

**localStorage key:** `lg_changepin_lock` → `{ until, count, tier }`

### Rate App — `RateApp` Component

```js
// Duplicate check — ek phone se sirf ek rating
const existSnap = await getDocs(query(collection(db, 'app_ratings'), where('phone', '==', user.phone)));
if (!existSnap.empty) { showToast('You have already rated!', 'error'); return; }

// Rating save karo
await addDoc(collection(db, 'app_ratings'), {
  phone, name, rating, createdAt: new Date(), device: navigator.userAgent
});
```

### Install App Button

```js
// Sirf tab dikhta hai jab app standalone mode mein nahi hai
{!window.matchMedia('(display-mode: standalone)').matches && (
  <button onClick={async () => {
    if (window.__lgInstallPrompt) {
      window.__lgInstallPrompt.prompt();
    } else {
      showToast('Tap 3-dot menu (⋮) → Add to Home Screen', 'error');
    }
  }}>
    Install App
  </button>
)}
```

### Clear Cache Button

```js
localStorage.removeItem('lg_banner_dismissed');
localStorage.removeItem('lg_reorder');
showToast('Cache cleared!');
```

Sirf banner dismiss state aur reorder data clear hota hai — user session safe rehta hai.

---

## 6.6 Baaki Retailer Pages — Quick Reference

### `OrderHistory.js` — Past Orders (`/history`)

- `orders` collection se phone filter karke saare orders fetch karo
- Har entry: date, item count, total, status badge
- Click → expand karke items dekho
- "Re-order" button → `lg_reorder` localStorage mein set karo → `/order` pe navigate
- Pull-to-refresh supported

### `MyLedger.js` — Payment History (`/my-ledger`)

- `ledger` collection se retailer ke entries fetch karo
- Current balance top pe (red = due, green = clear)
- Date range filter (From - To)
- Table: Date, Opening Balance, Debit (orders), Credit (payments), Closing Balance
- Sirf tab visible jab `featureFlags.ledgerView !== false`

### `PriceList.js` — Product Prices (`/prices`)

- `products` collection se active products fetch karo
- Search bar
- Daily / Seasonal grouping
- "Download Price List" → jsPDF se formatted PDF
- PDF: Dark header + table (#, Product, Unit, Price) + alternating rows

### `Profile.js` — User Profile (`/profile`)

- Saara data localStorage `lg_user` se (read-only)
- Avatar: name ka pehla letter, colored circle
- Name, Phone (+91 format), Shop, Area
- Last login time + device
- Order stats: `orders` collection se total count + total spent

### `Support.js` — Help & Tickets (`/support`)

- `support_tickets` collection
- 2 tabs: "New Ticket" / "My Tickets"
- Subject options: Delivery Issue, Payment Query, Product Quality, Order Issue, App Issue, Other
- Reply → status auto "In Progress"
- WhatsApp + Call buttons (`settings/app.shopPhone` se number)
- Sirf tab visible jab `featureFlags.supportTickets !== false`

### `Guide.js` — User Guide (`/guide`)

- Poora content hardcoded (no Firebase)
- Accordion sections: Install App, Place Order, Track Order, View Ledger, Raise Support, Order History
- FAQ section

### `About.js` — About Page (`/about`)

- `APP_CONFIG` se: version, appName, tagline, developer.name, developer.portfolio, phone
- About Us, Mission, What We Offer, Contact info

### `PrivacyPolicy.js` — Privacy Policy (`/privacy`)

- 8 sections: data collection, usage, storage, cookies, rights
- Phone: `APP_CONFIG.phone`
- "Last updated" date auto-generated

### `Terms.js` — Terms & Conditions (`/terms`)

- 11 sections: acceptance, accounts, orders, delivery, pricing, ledger, termination
- `APP_CONFIG` se data

### `Blocked.js` — Blocked Account (`/`)

- Sirf tab dikhta hai jab `user.blocked === true`
- Blocked retailer sirf yeh page aur Support page dekh sakta hai
- Admin se contact karne ka option
- Unblock: Admin → Sessions → Unblock

---

# Admin Pages

Sabhi files `src/pages/admin/` mein hain. Admin aur Developer dono access kar sakte hain.

---

## 7.1 `Dashboard.js` — Admin Home (`/admin`)

### Data Sources

```js
// 5 min cache ke saath
const usersSnap    = await cachedGetDocs(query(users, where('role','==','retailer')), 'dash_users', 5*60*1000);
const allLedger    = await cachedGetDocs(collection(db,'ledger'), 'dash_ledger', 3*60*1000);

// Fresh (no cache)
const ordersSnap   = await getDocs(query(orders, where('date','==', today)));
const ledgerSnap   = await getDocs(query(ledger, where('type','==','credit'), where('date','==',today)));
```

### Balance Calculation

```js
// retailer_balances se nahi — ledger se calculate hota hai (source of truth)
const dueByRetailer = {};
allLedgerEntries.forEach(e => {
  if (e.type === 'debit')  dueByRetailer[e.retailerId] += e.amount;
  else                     dueByRetailer[e.retailerId] -= e.amount;
});
const totalUdhaar = Object.values(dueByRetailer).reduce((s,v) => s + Math.max(0,v), 0);
```

### Donut Chart — SVG

```
SVG viewBox: 0 0 100 100
Circle radius: 40
StrokeWidth: 10
Delivered arc:  stroke-mint-500  (animated strokeDashoffset)
Pending arc:    stroke-amber-400 (positioned after delivered arc)
Center text:    percentage + "complete"
```

Hamesha visible — 0 orders pe bhi empty ring dikhta hai (0%).

**Donut colors change karna:**
- Delivered: `stroke-mint-500` class dhundho
- Pending: `stroke-amber-400` class dhundho

### Report PDF — "Daily Business Report"

4 sections:
1. **KPI Cards** (4 cards): Total Orders, Order Value, Collected, Pending Dues
2. **Delivery Progress Bar**: animated fill bar with percentage
3. **Business Overview Strip**: Retailers count, Pending orders, Total due, Overdue count
4. **Product Demand Table**: product name + qty
5. **Top Defaulters Table**: name, phone, due amount (red)

File name: `LG_Report_DATE.pdf`

### Top Defaulters

```js
const defaultersList = Object.entries(dueByRetailer)
  .filter(([, bal]) => bal > 0)
  .sort((a, b) => b[1] - a[1])
  .map(([id, balance]) => ({ id, balance, name: nameMap[id], phone: id }));

setDefaulters(defaultersList.slice(0, 6)); // top 6 only
setOverdueCount(defaultersList.filter(d => d.balance > 5000).length);
```

WhatsApp button: pre-filled message with retailer name + balance amount.

**Common changes:**

| Kya | Kahan |
|-----|-------|
| Overdue threshold (>5K) | Search `> 5000` |
| Top defaulters count | `slice(0, 6)` |
| Welcome banner gradient | Search `from-[#0f172a] via-[#1e293b]` |
| Report PDF header | Search `DAILY BUSINESS REPORT` |

---

## 7.2 `DailyLedger.js` — Daily Order Sheet (`/admin/daily-ledger`)

**Sabse zyada use hone wala admin page.** Har din yahan se orders dispatch aur deliver hote hain.

### Default Date

```js
const [date, setDate] = useState(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${...}-${...}`;
});
```

Page open hone pe default date **kal** hoti hai — kyunki orders kal ke liye place hote hain.

### Product Groups — `PRODUCT_GROUPS` Array

```js
// Firebase settings/productGroups se group order aata hai
// Products us order mein sort hote hain
// Har group ke andar products size ke hisaab se sort hote hain (parseToGrams)

const parseToGrams = (p) => {
  const lbl = (p.label || p.name || '').toLowerCase();
  if (/kg/.test(lbl))  return num * 1000;
  if (/ltr|l$/.test(lbl)) return num * 1000;
  if (/ml/.test(lbl))  return num;
  if (/g$|gm/.test(lbl)) return num;
  if (/half|hf/.test(lbl)) return 500;
  if (/full|fl/.test(lbl)) return 1000;
  return p.price || 0; // fallback
};
```

Table ke end mein 3 blank columns automatically add hote hain — driver ke liye extra items likhne ke liye.

### Order Actions — Complete Reference

| Action | Button Color | Kab available | Kya karta hai |
|--------|-------------|---------------|---------------|
| Dispatch | `bg-mint-600` (green) | Pending/Confirmed | Status → Dispatched, actualItems save |
| Deliver | `bg-blue-600` (blue) | Dispatched | Status → Delivered, ledger entry, balance update |
| Cancel | `bg-red-50 text-red-500` | Pending/Confirmed | Status → Cancelled |
| Return | `bg-amber-50 text-amber-600` | Dispatched | Status → Returned |
| Undo Dispatch | `bg-gray-100 text-gray-500` | Dispatched | Status → Confirmed, actualItems null |

### Dispatch Modal — Quantity Edit

```
Dispatch karte waqt:
- Ordered qty dikhti hai (read-only)
- Actual qty edit kar sakte hain
- Extra items add kar sakte hain (on-spot delivery)
- Agar qty change ki → confirmation screen dikhta hai
- formTotal = actual qty × unit price
```

**Extra Items:** "Add Extra Item" button → product search → select → actual qty enter karo. Yeh items `extra: true` flag ke saath save hote hain.

### Deliver Modal — Payment Collection

```
Deliver karte waqt:
- Items list (read-only, actualItems se)
- Actual total dikhta hai
- Payment input: max = previous due + actual total
- Payment > 0 → ledger mein credit entry
- Actual total → ledger mein debit entry
- Balance update: curBal + actualTotal - payment
```

**Ledger entries on delivery:**
- Daily items → `type: 'debit', note: 'Delivery'`
- Seasonal items → `type: 'debit', note: 'Seasonal'`
- Payment → `type: 'credit', note: 'Payment collected on delivery'`

### Bulk Dispatch

```js
// Pending/Confirmed orders wale retailers
const pendingOrders = retailers.filter(ret => {
  const oData = orderMap[ret.phone];
  return oData && (oData.status === 'Pending' || oData.status === 'Confirmed');
});
```

Review modal dikhta hai — har retailer ke items edit kar sakte hain. Confirm → sab ek saath dispatch.

Progress bar: `{done}/{total} dispatched`

### PDFs

**Daily PDF** (A4 Landscape):
- Header: "LUCY GARDEN" + area + date
- Table: SI, Retailer, product columns (group headers + label sub-headers), Total, Paid, Sign
- Total row at bottom
- 5 blank rows for extra retailers
- Driver sign + total collected section
- File: `LG_{Area}_{Date}.pdf`

**Seasonal PDF** (A4 Portrait) — sirf tab jab seasonal orders hon:
- Header: "LUCY GARDEN" + "Seasonal Orders"
- Per retailer block: name + phone + grouped items
- Product totals section
- Grand total
- File: `LG_Seasonal_{Area}_{Date}.pdf`

**Excel/CSV:**
- All retailers × all products (daily + seasonal)
- Daily Total, Seasonal Total, Grand Total columns
- File: `DailySheet_{date}.csv`

### Stock Status Banner

```js
// daily_stock/{dateId} aur company_orders/{dateId} compare karo
const shortages = companyOrderData entries where received < ordered;
const excess    = companyOrderData entries where received > ordered;
```

- Sab match → green "Stock received — all matched"
- Shortages/excess → amber banner with per-product details

### Pagination

```js
const PAGE_SIZE = 15; // 15 retailers per page
```

Daily table aur Seasonal table dono ke alag pagination hain.

### Receipt PDF

Payment collect karne ke baad popup dikhta hai:
- "Receipt" button → 80mm thermal receipt PDF download
- Fields: retailer name, phone, amount, note, previous due, balance after
- File: `LG_Receipt_{Name}_{Date}.pdf`

**Common changes:**

| Kya | Kahan |
|-----|-------|
| Default date | `useState` initializer — `tomorrow` calculation |
| Page size | `PAGE_SIZE = 15` |
| Dispatch button color | `bg-mint-600` |
| Deliver button color | `bg-blue-600` |
| Blank rows in PDF | `for (let b = 0; b < 5; b++)` — 5 change karo |
| Overdue threshold | Search `> 5000` |

---

## 7.3 Baaki Admin Pages — Quick Reference

### `Retailers.js` — Manage Retailers (`/admin/retailers`)

- `users` collection (role = retailer) + `retailer_balances`
- Search by name, phone, area
- Retailer card: name, area, balance badge (red = due, green = "Clear")
- Click → detail modal: all fields + edit mode + order history + delete
- **Phone change:** Transfers all data (orders, ledger, balance) to new phone document
- **Delete:** Removes user + all associated data (orders, ledger, balance)
- New retailer default PIN: `settings/app.defaultPin`

### `Inventory.js` — Product Management (`/admin/inventory`)

**Product fields:**

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `name` | string | "Toned Milk 500ml" | — |
| `price` | number | 30 | Per unit |
| `unit` | string | "pkt" | pkt/kg/ltr/jar/bkt/tin/pcs/box/cup |
| `type` | string | "daily" | "daily" / "seasonal" |
| `group` | string | "TM" | Group name |
| `label` | string | "500ml" | Max 4 chars — PDF column header |
| `active` | boolean | true | false = hidden |

**Product Groups** (`settings/productGroups`):
```json
{
  "daily":    ["TM", "SM", "LITE DAHI", "PREMIUM DAHI"],
  "seasonal": ["SWEETS", "DRINKS"],
  "codes":    { "LITE DAHI": "LD", "PREMIUM DAHI": "PD" }
}
```

- Group name: max 20 chars (UI mein dikhta hai)
- PDF Code: optional, 2-5 chars (PDF headers mein dikhta hai)
- Group order = column order in Daily Sheet PDF
- Daily max 20 products limit

**Bulk Price Update:** Group select karo → percentage increase/decrease → sab products update.

### `Ledger.js` — Payment Ledger (`/admin/ledger`)

- Retailer dropdown se select karo
- Date range filter
- "Collect" button → payment modal → `ledger` mein credit entry + `retailer_balances` update
- "Set Bal" button → balance override (initial setup ke liye)
- "Print" button → ledger PDF
- Pagination: 10/25/50/100 per page
- Table: SI, Date, Opening, Product Amt, Seasonal Amt, Deposit, Closing

### `CompanyOrder.js` — Company Level Summary (`/admin/company-order`)

- Date picker
- Sabhi retailers ke orders combine karke product-wise totals
- Area-wise breakdown
- "Stock Received" input → `daily_stock/{dateId}` mein save
- PDF export
- Data: `orders` collection + `company_orders/{dateId}` + `daily_stock/{dateId}`

### `Settings.js` — Admin Settings (`/admin/settings`)

**`settings/app` fields:**

| Field | Default | Kya control karta hai |
|-------|---------|-----------------------|
| `maintenance` | false | Retailers ko block karta hai |
| `orderStart` | 12 | Order window start hour (0-23, -1 = no limit) |
| `orderEnd` | 16 | Order window end hour |
| `deliveryStart` | 6 | Delivery window start |
| `deliveryEnd` | 12 | Delivery window end |
| `shopPhone` | "9939079107" | Retailers ko dikhne wala contact |
| `sessionTimeout` | 24 | Hours before auto-logout |
| `minOrderAmount` | 0 | Minimum order (0 = no limit) |
| `maxOrderItems` | 0 | Max unique products (0 = no limit) |
| `allowModify` | true | Retailers replace order kar sakte hain |
| `defaultPin` | "1234" | Naye retailer ka default PIN |
| `autoCleanup` | true | Daily auto-cleanup |

### `Sessions.js` — Session Management (`/admin/sessions`)

- Stats: Active / Inactive / Never Logged counts
- Search by name, phone, area
- Per user: status dot, name, role badge, BLOCKED badge, device, browser, last login
- **Force Logout:** `activeSession: ''` + `sessionExpiry: ''` → user 2 min mein logout
- **Unblock:** `blocked` field delete karo
- **Reset PIN:** Default PIN se replace karo
- **Force Logout All:** Saare retailers batch mein logout

### `SupportTickets.js` — Ticket Management (`/admin/support`)

- Stats: All / Open / In Progress / Resolved
- Filter by status + search
- Pagination: 10 per page
- Status flow: Open → In Progress → Resolved (forward only)
- Reply → auto "In Progress"
- Reply saves to `messages[]` array inside ticket document

### `Announcements.js` — Admin Announcements (`/admin/announcements`)

- Retailers aur admins ko banner bhejo
- Types: Info, Warning, Success, Urgent
- Targets: All, Retailers, Admin
- Expiry: 1hr, 6hr, 12hr, 24hr, 3 days, 7 days
- `settings/banner` update karta hai (live display) + `announcements` collection (history)

### `PlaceOrder.js` — Admin Order Place (`/admin/place-order`)

- Admin kisi bhi retailer ke liye order place kar sakta hai
- Retailer select karo → products select karo → place
- Same flow as retailer PlaceOrder but admin ke liye

### `OrderDetail.js` — Single Order (`/admin/orders/:id`)

- Full order details: retailer, phone, date, time, status
- Items list with quantities and prices
- Status timeline
- Action buttons based on current status

### `DevPanel.js` — App Health (`/dev` route pe)

- Firebase connection test (response time in ms)
- Stats: Retailers, Orders, Products, Tickets, Ledger entries
- Quick Actions: Toggle Maintenance, Force Reload, Clear Cache, Ping Firebase
- Console log (green/red text)
- App Info: version, React version, screen size, memory
- Note: File `pages/admin/DevPanel.js` mein hai lekin route `/dev` pe hai

---

# Developer Pages

Sabhi files `src/pages/dev/` mein hain (sirf `DevPanel.js` jo `pages/admin/` mein hai). Sirf DEV_PHONE access kar sakta hai.

---

## 8.1 `ErrorLogs.js` — Crash Logs (`/dev/errors`)

### Data Flow

```js
// errorLogger.js se fetch karta hai
const errors = await getErrors(); // max 50, timestamp desc
```

### Filter System

```js
const [errorFilter, setErrorFilter] = useState('unresolved'); // all | unresolved | resolved
```

3 filter buttons: Unresolved (default), Resolved, All — count badge har button pe.

### Error Card — Expanded View

Click karo → expand hota hai:
- Error message (red monospace)
- Stack trace (scrollable, max 150px)
- Context, User phone, URL
- **Suggested Fix** — green box, `getErrorSolution()` se match hota hai

### Actions

| Button | Kya karta hai |
|--------|---------------|
| Resolve | `resolveError(id)` → `resolved: true` Firebase mein |
| Refresh | `getErrors()` dobara call |
| Clear All | `clearErrors()` → batch delete, `critical` confirm modal |

### Severity Badge Colors

| Severity | Background | Text |
|----------|-----------|------|
| `high` | `bg-red-900/50` | `text-red-400` |
| `medium` | `bg-amber-900/50` | `text-amber-400` |
| `low` | `bg-gray-800` | `text-gray-400` |

---

## 8.2 `FeatureFlags.js` — Feature Toggles (`/dev/flags`)

### 20 Available Flags

| Flag Key | Label | Kya control karta hai |
|----------|-------|----------------------|
| `seasonalProducts` | Seasonal Products | PlaceOrder mein seasonal section |
| `supportTickets` | Support Tickets | Retailer support page access |
| `orderHistory` | Order History | Order history page |
| `ledgerView` | Retailer Ledger | Ledger page + nav link |
| `darkMode` | Dark Mode | Dark mode toggle visibility |
| `pdfInvoice` | PDF Invoice | TrackOrder pe PDF download buttons |
| `duplicateOrderCheck` | Duplicate Order Check | Checkout pe duplicate warning |
| `balanceWarning` | Balance Warning | PlaceOrder pe due warning |
| `companyOrder` | Company Order | Admin company order page |
| `bulkPriceUpdate` | Bulk Price Update | Inventory mein bulk price button |
| `cancelOrder` | Cancel Order | Retailer order cancel button |
| `priceList` | Price List | Price list page + PDF |
| `pullToRefresh` | Pull to Refresh | Mobile pull gesture |
| `welcomePopup` | Welcome Popup | First login onboarding |
| `installPrompt` | Install Prompt | PWA install banner |
| `orderPlacement` | Order Placement | Sabhi ordering block karo |
| `rateCard` | Rate Card PDF | Price list PDF download |
| `announcements` | Announcements | Banner system |
| `autoCleanup` | Auto Cleanup | Daily data cleanup |
| `usageTracking` | Usage Tracking | Firestore read/write tracking |

### Toggle Behavior

```js
const toggle = async (key) => {
  const newVal = !flags[key];
  // Confirm modal dikhao
  const ok = await confirm({ ... type: 'warning' });
  if (!ok) return;
  // Immediately update Firebase
  await setDoc(doc(db, 'settings', 'featureFlags'), { ...newFlags, updatedAt: new Date().toISOString() });
};
```

Har toggle pe confirm modal aata hai. Firebase immediately update hota hai — koi "Save" button nahi chahiye individual toggles ke liye.

**`!== false` pattern:** Components mein `flags.seasonalProducts !== false` check hota hai — agar flag exist nahi karta toh `undefined` return hota hai jo `!== false` se `true` treat hota hai. Matlab naya flag add karo toh default enabled hoga.

---

## 8.3 `DatabaseCleanup.js` — Delete Old Data (`/dev/cleanup`)

### Cleanup Cards — 4 Types

| Card | Collection | Criteria | Age |
|------|-----------|----------|-----|
| Old Delivered Orders | `orders` | status = Delivered | 90+ days |
| Old Ledger Entries | `ledger` | any entry | 90+ days |
| Resolved Tickets | `support_tickets` | status = Resolved | 30+ days |
| Error Logs | `app_errors` | all | any age |

### Auto Cleanup Toggle

```js
// settings/app.autoCleanup = false → daily cleanup nahi chalega
await setDoc(doc(db, 'settings', 'app'), { autoCleanup: newVal }, { merge: true });
```

### Manual Cleanup

```js
// lg_last_cleanup localStorage key remove karo → runAutoCleanup() force run hoga
localStorage.removeItem('lg_last_cleanup');
await runAutoCleanup();
```

### Estimated Savings Card

Agar deletable documents hain toh dikhta hai:
- Documents freed count
- Storage saved (~0.5 KB per doc estimate)
- Reads/day saved (~2 reads per doc estimate)
- DB reduction percentage

### Cleanup Log

Console-style output — green (success), red (error), amber (warn), gray (info). Max 30 entries. "Clear" button.

---

## 8.4 `BackupRestore.js` — Database Backup (`/dev/backup`)

### Collections Backed Up

```js
const BACKUP_COLLECTIONS = [
  'users', 'products', 'settings', 'retailer_balances',
  'ledger', 'orders', 'order_history', 'support_tickets'
];
```

### 3 Backup Methods

**1. Local Download (Safest):**
```js
// Sab collections fetch karo → JSON file download
const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
a.download = `LG_Backup_${date}.json`;
```
Firebase down ho toh bhi kaam karta hai. File device pe save hoti hai.

**2. Restore from File:**
```js
// File picker → JSON parse → double confirm → clean + restore
input.type = 'file'; input.accept = '.json';
```
Double confirmation: pehle "Yes, Restore" phir "DO IT".

**3. Cloud Backup:**
```js
// Firestore ke 'backups' collection mein save karo
await setDoc(doc(db, 'backups', `backup_${Date.now()}`), {
  data: JSON.stringify(data), // JSON string as single field
  createdAt, collections, docCount
});
```

### Restore Process — Destructive

```
Phase 1 (Cleaning):
  Existing documents delete karo (500 per batch)
        ↓
Phase 2 (Restoring):
  Backup data write karo (doc by doc)
        ↓
Progress bar: done/total
```

**Warning:** Restore karne se pehle existing data POORA delete hota hai. Agar restore fail ho toh data loss ho sakta hai. Isliye pehle local download karo.

### Cloud Backup List

Har backup mein: timestamp, doc count, Restore button, Download button, Delete button.

---

## 8.5 `ScheduledTasks.js` — Maintenance Jobs (`/dev/tasks`)

### Available Actions — 6

| Action | Kya karta hai | Kya delete/update hota hai |
|--------|---------------|---------------------------|
| `cleanup_errors` | Resolved + 30 din purane errors delete | `app_errors` |
| `cleanup_old_orders` | 1 saal purane orders delete | `orders` (ledger kabhi nahi) |
| `reset_usage` | Aaj ka usage counter reset | `settings/usage_YYYY-MM-DD` |
| `sync_balances` | Ledger se balance recalculate | `retailer_balances` |
| `clear_expired_sessions` | Expired sessions clear | `users` (activeSession, sessionExpiry) |
| `remove_retailer_ids` | Purane `LG-RET-xxx` IDs remove | `users` (id field) |

### "Run Now" — Real Operations

```js
const runNow = async (task) => {
  const ok = await confirm({ message: 'This will perform real operations.', type: 'warning' });
  if (!ok) return;
  const result = await executeAction(task.action); // ACTUAL execution
  await updateDoc(doc(db, 'scheduled_tasks', task.id), {
    lastRun: new Date().toISOString(),
    status: 'completed',
    lastResult: `Deleted: ${result.deleted}, Updated: ${result.updated}`
  });
};
```

**Important:** "Run Now" simulation nahi hai — real data operations hote hain. Confirm karne ke baad data delete/update ho jaata hai.

### Task Config

```js
// scheduled_tasks collection mein save hota hai
{
  name: 'Weekly Error Cleanup',
  schedule: 'weekly',        // hourly | daily | weekly
  action: 'cleanup_errors',
  enabled: true,
  lastRun: '2026-07-31T...',
  status: 'completed',
  lastResult: 'Deleted: 12, Updated: 0'
}
```

**Note:** Tasks automatically nahi chalte — yeh sirf manual trigger system hai. "Schedule" field sirf informational hai.

---

## 8.6 `ConfigDiff.js` — Config Comparison (`/dev/config-diff`)

### Default Values (Hardcoded)

```js
const DEFAULT_CONFIG = {
  maintenance: false, orderStart: 12, orderEnd: 16,
  sessionTimeout: 24, minOrderAmount: 100, maxOrderItems: 50,
  allowModify: true, defaultPin: '1234',
};

const DEFAULT_FLAGS = {
  seasonalProducts: true, supportTickets: true, orderHistory: true,
  ledgerView: true, darkMode: true, pdfInvoice: true,
  duplicateOrderCheck: true, balanceWarning: true,
  companyOrder: true, bulkPriceUpdate: true,
};
```

### Diff Display

```
Key          Default (strikethrough)    Current (green)
orderStart   ~~12~~                     9
maxOrderItems ~~50~~                    20
```

### Copy Button

Poora live config JSON clipboard mein copy hota hai — Firebase Console mein manually check karne ki zaroorat nahi.

---

## 8.7 `DocEditor.js` — Database Editor (`/dev/editor`)

**Sabse powerful aur dangerous dev tool.** Kisi bhi collection ka koi bhi document directly edit, delete, ya search kar sakte hain.

### Supported Collections — 17

```js
const COLLECTIONS = [
  'orders', 'order_history', 'users', 'products', 'ledger',
  'retailer_balances', 'settings', 'support_tickets', 'announcements',
  'app_errors', 'app_ratings', 'audit_log', 'company_orders',
  'daily_stock', 'scheduled_tasks', 'backups', 'notifications'
];
```

### 4 Ways to Find Documents

| Method | Kaise | Kab use karo |
|--------|-------|-------------|
| Load All | "Load All" button | Poori collection dekhni ho |
| Search by Field | Field + Value input | Specific filter chahiye |
| Fetch by Date | Date picker | Orders/ledger date se filter |
| Fetch by ID | Document ID input | Exact document chahiye |

### Bulk Operations

```js
// Select All / Deselect All
// Selected documents bulk delete
// Progress bar: done/total
```

### JSON Editor

Document select karo → JSON textarea mein edit karo → Save:
```js
let parsed;
try { parsed = JSON.parse(editData); }
catch { setMsg('Invalid JSON'); return; }
await setDoc(doc(db, selectedCol, docId), parsed);
```

**Warning:** `setDoc` use hota hai — poora document overwrite hota hai. Agar koi field miss karo toh woh delete ho jaayega.

---

## 8.8 `BulkUpdate.js` — Bulk Field Update (`/dev/bulk-update`)

### 3-Step Process

```
Step 1: Collection select karo
        ↓
Step 2: Filter — field + value se matching docs dhundho
        (ya "All Docs" se poori collection)
        ↓
Step 3: Update field — field name + new value
        → Auto type detection (true/false/number/string)
        → JSON checkbox agar array/object value ho
        → Confirm → update all matched docs
```

### Auto Type Detection

```js
if (updateValue === 'true')  parsedValue = true;
else if (updateValue === 'false') parsedValue = false;
else if (!isNaN(updateValue)) parsedValue = Number(updateValue);
else parsedValue = updateValue; // string
```

### Preview

Update field enter karne ke baad pehle doc ka current value dikhta hai — galti se galat field update karne se bachata hai.

### Supported Collections — 9

```js
['orders', 'order_history', 'users', 'products', 'ledger',
 'retailer_balances', 'support_tickets', 'company_orders', 'daily_stock']
```

---

## 8.9 `MonthlyReport.js` — Monthly Report (`/dev/report`)

### Report Data — 6 Collections

```js
const [ordersSnap, usersSnap, ledgerSnap, errorsSnap, ticketsSnap, balSnap] = await Promise.all([
  getDocs(collection(db, 'orders')),
  getDocs(query(users, where('role', '==', 'retailer'))),
  getDocs(collection(db, 'ledger')),
  getDocs(collection(db, 'app_errors')),
  getDocs(collection(db, 'support_tickets')),
  getDocs(collection(db, 'retailer_balances')),
]);
```

### Report Sections

| Section | Metrics |
|---------|---------|
| Retailers | Total, Active (ordered this month), Inactive |
| Orders | Total, Delivered, Cancelled, Returned, Avg per day |
| Revenue | Total revenue, Collected, Avg order value |
| Dues | Total pending, Retailers with dues |
| System | App errors count, Tickets (open count) |

### Output Formats

**Copy for WhatsApp:** Formatted text with emojis — seedha WhatsApp pe paste karo client ko bhejne ke liye.

**Download .txt:** Same text file download.

**Raw preview:** Page pe hi dikhta hai.

---

## 8.10 Baaki Dev Pages — Quick Reference

### `UserSessions.js` — Active Users (`/dev/sessions`)

- `users` collection se sabhi users
- Green dot (active) / gray dot (inactive) — `sessionExpiry` se determine
- Stats: Active / Inactive / Never Logged In
- Force Logout: `activeSession: ''` + `sessionExpiry: ''`
- Force Logout All: Batch operation

### `OrderAnalytics.js` — Order Statistics (`/dev/analytics`)

- Period filter: Today / 7 Days / 30 Days / 90 Days
- Stats: Today's orders, Avg order value, Total revenue, Unique products
- Status breakdown: Pending / Confirmed / Dispatched / Delivered counts
- Daily trend bar chart
- Peak hours chart
- Top 10 products chart

### `RetailerActivity.js` — Who's Active (`/dev/activity`)

- Filter: Active / Inactive / Never / All
- Color coding:
  - Green: last 7 days mein order
  - Amber: 7-30 days
  - Red: 30+ days
  - Gray: kabhi order nahi kiya
- Per retailer: last order X days ago, this week, 30-day, total spent

### `DeployInfo.js` — Version & Performance (`/dev/deploy`)

- Version card (from `APP_CONFIG.version`)
- Build info: React version, environment, Firebase project ID
- Service Worker status
- Performance metrics: page load, DOM ready, FCP, transfer size
- Device info: screen, memory, CPU cores, connection type
- Deploy checklist: HTTPS, SW, Manifest, Icons
- "Force Update" button: SW unregister + cache clear + reload

### `Announcements.js` — Send Banners (`/dev/announce`)

- Active banner status (green "LIVE" badge)
- "Hide Banner" button
- Form: message, type (info/warning/success/urgent), target (all/retailers/admin), expiry
- History list with delete
- Saves to `settings/banner` (live) + `announcements` collection (history)

### `AuditLog.js` — Action History (`/dev/audit`)

- Total actions count
- Filter by action type
- Each entry: icon, description, who did it, target, time ago
- Clear All (with confirmation)
- Action types: `order_status`, `payment`, `retailer_edit`, `retailer_delete`, `settings_change`, `maintenance`, `auto_cleanup`

### `AppRatings.js` — User Ratings (`/dev/ratings`)

- Average rating (big gradient card)
- Star distribution (5★ to 1★ with animated bars)
- Individual ratings: name, phone, stars, date, device
- Delete single rating
- Clear All ratings

### `DataExport.js` — Export Data (`/dev/export`)

- Format: JSON / CSV
- 10 collections checkboxes
- Select All / Deselect All
- Export → file download

### `ApiResponseMonitor.js` — Latency Tester (`/dev/api-monitor`)

- "Test All" → 6 Firestore endpoints ping
- Results: endpoint, type (read/write), response time ms
- Color: green (<200ms), amber (200-500ms), red (>500ms)
- Summary: avg latency, slowest endpoint, error count
- Test history (last 10 runs)

### `OrderManager.js` — Order Manager (`/dev/order-manager`)

- Admin-level order management
- Filter by date, retailer, status
- Bulk status updates
- Direct order edit capability

### `DevGuide.js` — Dev Documentation (`/dev/guide`)

- In-app version of this guide
- All 21 dev tools documented
- Search bar
- Quick reference table
- FAQ + Emergency procedures
- Hardcoded content (no Firebase)

---

# Shared Components

Sabhi files `src/components/` mein hain. Yeh reusable UI pieces hain jo multiple pages mein use hote hain.

---

## 9.1 `ConfirmModal.js` — Confirmation Popup

### Architecture — Promise-Based

```js
// App.js mein ConfirmProvider poori app wrap karta hai
export default function App() {
  return (
    <ConfirmProvider>
      <FeatureFlagProvider>
        <AppContent />
      </FeatureFlagProvider>
    </ConfirmProvider>
  );
}
```

`ConfirmProvider` React Context use karta hai. Andar `confirm` function ek Promise return karta hai — `true` agar user ne confirm kiya, `false` agar cancel kiya.

### `useConfirm()` — Kisi Bhi Component Mein Use Karo

```js
import { useConfirm } from '../components/ConfirmModal';

const confirm = useConfirm();

// Kisi bhi async function mein:
const ok = await confirm({
  title: 'Delete Retailer',
  message: 'Yeh action undo nahi ho sakta. Saara data delete ho jaayega.',
  confirmText: 'Delete',
  cancelText: 'Cancel',  // optional — default: 'Cancel'
  type: 'danger'
});

if (ok) {
  // user ne confirm kiya — proceed
}
// ok === false → user ne cancel kiya
```

### 6 Types — Icons aur Colors

| Type | Icon | Confirm Button | Kab use karo |
|------|------|---------------|-------------|
| `danger` | Trash (red) | Red gradient | Delete actions |
| `warning` | AlertTriangle (amber) | Amber gradient | Risky changes |
| `logout` | LogOut (red) | Red gradient | Logout confirmation |
| `info` | Info (blue) | Royal blue gradient | Save/confirm actions |
| `success` | CheckCircle2 (green) | Green gradient | Positive confirmations |
| `critical` | ShieldAlert (dark red) | Dark red gradient | Irreversible actions (backup restore, bulk delete) |

### Visual Design

```
Background: bg-gray-900 (dark — hamesha dark theme)
Border: border-gray-700
Backdrop: bg-black/70 backdrop-blur-sm
z-index: 200 (sabse upar)
Max width: max-w-sm (380px)
```

Icon pe spring animation hoti hai — enter hone pe scale + rotate se aata hai.

### Internal State

```js
const [state, setState] = useState({
  isOpen: false,
  title: '', message: '', confirmText: '', cancelText: '',
  type: 'warning',
  resolve: null  // Promise resolver
});

const confirm = useCallback(({ title, message, confirmText, cancelText, type }) => {
  return new Promise(resolve => {
    setState({ isOpen: true, ..., resolve });
  });
}, []);

const handleConfirm = () => { state.resolve?.(true);  setState(s => ({ ...s, isOpen: false })); };
const handleCancel  = () => { state.resolve?.(false); setState(s => ({ ...s, isOpen: false })); };
```

---

## 9.2 `ErrorBoundary.js` — Crash Protection (3 Levels)

React class components hain — function components mein error boundaries nahi bana sakte.

### 3 Boundaries — Kab Kaunsa

| Boundary | File mein | Wraps | Severity | Recovery UI |
|----------|-----------|-------|----------|-------------|
| `RootErrorBoundary` | `index.js` | Poori app | `critical` | Plain HTML (no React/Tailwind) |
| `AppErrorBoundary` | `App.js` | RetailerLayout, AdminLayout | `high` | Styled React UI |
| `DevErrorBoundary` | `App.js` | DeveloperLayout | `medium` | Dark themed minimal |

**Kyon 3 levels:**
- Agar ek page crash kare → `AppErrorBoundary` pakadta hai, sidebar/header visible rehta hai
- Agar layout crash kare → `RootErrorBoundary` pakadta hai, basic HTML dikhta hai (React bhi nahi chahiye)
- Dev console ka crash main app ko affect nahi karta

### `RootErrorBoundary` — Recovery UI

```
Plain HTML + inline styles (Tailwind nahi — kyunki CSS bhi load nahi hua hoga)
Background: #f9fafb
Red circle icon
"App Crashed" heading
"Reload App" button → window.location.reload()
"Clear Data & Restart" button → localStorage.clear() + redirect to /
"Error logged automatically" text
```

### `AppErrorBoundary` — Recovery UI

```
Tailwind classes use hoti hain
Red X circle icon
"Something went wrong" heading
"Your data is safe" message
Developer ke liye: collapsible error details (error message + URL)
3 buttons:
  - "Reload App" (royal blue)
  - "Go to Home" (gray)
  - "Open Dev Console" (green) — sirf DEV_PHONE ko dikhta hai
"Error has been logged automatically" footer
```

### `DevErrorBoundary` — Recovery UI

```
Dark bg-gray-900
Red circle icon
"Dev Console Crashed" heading
Error message in red monospace box
"Reload" button (green)
```

### Firebase Logging — Har Boundary

Sabhi boundaries `componentDidCatch` mein Firebase `app_errors` collection mein log karte hain:

| Field | `RootErrorBoundary` | `AppErrorBoundary` | `DevErrorBoundary` |
|-------|--------------------|--------------------|-------------------|
| `type` | `'root_crash'` | `'crash'` | `'dev_crash'` |
| `severity` | `'critical'` | `'high'` | `'medium'` |
| `message` | error.message | error.message | error.message |
| `stack` | error.stack | error.stack | error.stack |
| `componentStack` | errorInfo.componentStack | errorInfo.componentStack | errorInfo.componentStack |
| `url` | window.location.href | window.location.href | window.location.href |
| `user` | localStorage se phone | localStorage se phone | `'8051725780'` |

---

## 9.3 `AppFooter.js` — Responsive Footer

### Props

```js
<AppFooter type="retailer" />  // ya "admin"
```

`type` prop se quick links decide hote hain.

### Desktop Layout (3 columns, `lg:` breakpoint se)

```
Column 1 (Brand):
  APP_CONFIG.appName + tagline
  "Fresh dairy delivered daily. Trusted by 50+ retailers in Madhubani."

Column 2 (Links):
  Retailer: About, Privacy Policy, Terms, Support
  Admin: Settings, Tickets

Column 3 (Developer):
  APP_CONFIG.developer.name
  "Full-Stack Developer"
  "View Portfolio →" link
```

### Mobile Layout

```
Minimal centered:
  "Made with ☕ & ❤️ by [developer.name]"
  "© 2026 Lucy Garden · v2.10.2.0"
  pb-24 (bottom nav ke upar space)
```

### Data Sources

Saara content `APP_CONFIG` se aata hai — `config.js` update karo, footer automatically update ho jaata hai.

| Field | Kahan dikhta hai |
|-------|-----------------|
| `appName` | Brand column |
| `tagline` | Brand column subtitle |
| `phone` | Contact column (tel + WhatsApp link) |
| `developer.name` | Developer column + mobile credit |
| `developer.portfolio` | Portfolio link |
| `version` | Mobile footer |

---

## 9.4 `WelcomePopup.js` — First-Time Onboarding

### Kab Dikhta Hai

```js
const STORAGE_KEY = 'lg_welcome_done';

useEffect(() => {
  if (localStorage.getItem(STORAGE_KEY)) return; // already shown
  if (!user.phone) return;

  // Firebase bhi check karo (cache clear hone ke baad bhi na dikhe)
  const snap = await getDoc(doc(db, 'users', user.phone));
  if (snap.data().welcomeDone) {
    localStorage.setItem(STORAGE_KEY, 'true');
    return;
  }

  // 2 second delay ke baad show karo
  setTimeout(() => setShow(true), 2000);
}, []);
```

**Double check:** localStorage + Firebase `users/{phone}.welcomeDone` — agar user cache clear kare toh bhi dobara nahi dikhega.

**Sirf retailers ke liye:** App.js mein `{user.role === 'retailer' && <WelcomePopup />}` — admin/dev ko nahi dikhta.

### 3 Slides

| Slide | Icon | Gradient | Action | Skip |
|-------|------|----------|--------|------|
| 0 | Rocket (blue) | royal → mint | "Install Now" → PWA prompt | "Not now" |
| 1 | GraduationCap (amber) | amber → red | "View Guide" → `/guide` | "I'll explore myself" |
| 2 | Star (purple) | purple → rose | "Submit Rating" → Firebase | "Maybe later" |

### Step Indicator

```
3 dots — active dot wide (w-6), completed dot small green (w-1.5), upcoming dot gray (w-1.5)
```

### Rating Submission

```js
// Duplicate check pehle
const existing = await getDocs(query(app_ratings, where('phone', '==', user.phone)));
if (!existing.empty) { setRatingSubmitted(true); return; }

// Save karo
await addDoc(collection(db, 'app_ratings'), {
  phone, name, rating, createdAt: new Date(), device: navigator.userAgent
});
```

### `markDone()` — Popup Band Karna

```js
const markDone = async () => {
  setShow(false);
  localStorage.setItem(STORAGE_KEY, 'true');
  // Firebase mein bhi save karo
  await updateDoc(doc(db, 'users', user.phone), { welcomeDone: true });
};
```

Dismiss nahi ho sakta accidentally — koi outside-click close nahi hai. User ko ya complete karna hoga ya skip karna hoga.

---

## 9.5 `LoadingSkeleton.js` — Loading Placeholders

### Available Exports

```js
export function DashboardSkeleton() { return <DelayedSpinner />; }
export function TableSkeleton()     { return <DelayedSpinner />; }
export function CardsSkeleton()     { return <DelayedSpinner />; }
export function ProfileSkeleton()   { return <DelayedSpinner />; }
export function OrderSkeleton()     { return <DelayedSpinner />; }
export default function LoadingSkeleton() { return <DelayedSpinner />; }
```

### `DelayedSpinner` — 400ms Delay

```js
function DelayedSpinner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 400);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  // ...spinner
}
```

**400ms delay kyon:** Agar data jaldi load ho jaaye (cache hit) toh spinner flash nahi karta — better UX.

### Usage Pattern

```js
if (loading) return <TableSkeleton />;
return <ActualContent />;
```

### Visual

Thin spinning circle — `border-t-royal-600` (blue top arc) on `border-gray-200` base. Dark mode: `border-t-royal-400` on `border-[#333333]`.

---

## 9.6 `TopProgressBar.js` — Page Transition Bar

### Module-Level Functions

```js
let showProgress = () => {};
let hideProgress = () => {};

export function triggerProgress() { showProgress(); }
export function stopProgress()    { hideProgress(); }
```

Yeh module-level variables hain — component mount hone ke baad `useEffect` mein actual setters assign hote hain. Isse koi bhi file import karke call kar sakta hai bina React context ke.

### Layouts Mein Usage

```js
// Har layout mein — route change pe
useEffect(() => {
  import('../TopProgressBar').then(m => {
    m.triggerProgress();
    setTimeout(m.stopProgress, 300);
  });
}, [location.pathname]);
```

Dynamic import use hota hai — circular dependency avoid karne ke liye.

### Visual

```
Position: fixed top-0 left-0 right-0
Height: 3px
z-index: 9999 (sabse upar)
Gradient: from-royal-500 via-mint-500 to-royal-500
Animation: 0% → 60% → 80% → 90% (2 seconds, easeOut)
```

Bar 90% tak jaata hai — 100% nahi — kyunki actual load time unknown hai. `stopProgress()` call hone pe fade out hota hai.

### `PageLoader` — Suspense Fallback

```js
export function PageLoader() {
  useEffect(() => {
    triggerProgress();
    return () => stopProgress();
  }, []);
  return (
    // Skeleton UI — gray rectangles with animate-pulse
  );
}
```

Lazy-loaded pages ke liye Suspense fallback. Progress bar bhi trigger karta hai.

---

## 9.7 `OfflineBanner.js` — No Internet Warning

### Event Listeners

```js
const goOffline = () => { setIsOffline(true); setShowBack(false); };
const goOnline  = () => { setShowBack(true); setTimeout(() => setShowBack(false), 3000); setIsOffline(false); };

window.addEventListener('offline', goOffline);
window.addEventListener('online',  goOnline);
```

### 2 States

**Offline:**
```
Red gradient banner (from-red-600 to-red-500)
WifiOff icon + "No Internet Connection"
Reload button
Slides down from top (y: -60 → 0)
```

**Back Online:**
```
Green banner (from-mint-600 to-mint-500)
"✓ Back Online"
3 seconds ke baad automatically hide
```

**Initial state:** `useState(!navigator.onLine)` — agar page load pe already offline ho toh turant dikhta hai.

---

## 9.8 `InstallPrompt.js` — PWA Install Banner

### Service Worker Registration

```js
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  // ...
}, []);
```

App load hone pe service worker register hota hai — offline caching ke liye.

### `beforeinstallprompt` Event

```js
const handler = (e) => {
  e.preventDefault();           // Browser ka default prompt rokta hai
  setDeferredPrompt(e);
  window.__lgInstallPrompt = e; // Global variable — Settings page bhi use karta hai
  const dismissed = localStorage.getItem('lg_install_dismissed');
  if (!dismissed) {
    setTimeout(() => setShow(true), 3000); // 3 sec delay
  }
};
window.addEventListener('beforeinstallprompt', handler);
```

**`window.__lgInstallPrompt`:** Global variable mein store kiya jaata hai taaki Settings page ka "Install App" button bhi same event use kar sake.

### Install Flow

```js
const handleInstall = async () => {
  deferredPrompt.prompt();                    // Browser ka native install dialog
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    setShow(false);
    setDeferredPrompt(null);
  }
  // 'dismissed' → banner wapas aa sakta hai
};
```

### Dismiss

```js
const handleDismiss = () => {
  setShow(false);
  localStorage.setItem('lg_install_dismissed', 'true'); // Dobara nahi dikhega
};
```

**localStorage key:** `lg_install_dismissed` — ek baar dismiss karo, hamesha ke liye band.

### Position

```
Mobile: bottom-24 (bottom nav ke upar)
Desktop: bottom-6
Max width: max-w-sm, centered
```

---

## 9.9 `PaymentBlock.js` — Service Suspended Screen

### Kab Dikhta Hai

App.js mein:
```js
if (siteBlock && user.phone !== DEV_PHONE) return <PaymentBlock config={siteBlock} userRole={user.role} />;
```

Firebase `settings/app.siteBlock.enabled = true` hone pe. Developer bypass karta hai.

### 2 Views

**`GenericBlockView`** — Retailers aur normal users ke liye:
```
Plain HTML + inline styles (no Tailwind)
"सेवा निलंबित" heading (Hindi)
"Suspended" badge
Contact card with phone number
```

**`AdminBlockView`** — Admin ke liye (`userRole === 'admin'`):
```
"Payment Required" badge
Invoice details: amount due, invoice number, project, total, paid
Payment details: UPI ID, name, account, IFSC
Developer contact with "Call →" link
"भुगतान के बाद 1 घंटे में सेवा बहाल हो जाएगी" footer
```

### `siteBlock` Config Object

```js
// Firebase settings/app.siteBlock:
{
  enabled: true,
  title: 'Service Suspended',
  message: 'बकाया भुगतान के कारण...',
  contact: { name: 'Divyanshu Gupta', phone: '8051725780' },
  invoice: { number: 'INV-001', project: 'Lucy Garden', total: 15000, paid: 5000, due: 10000 },
  upi: { id: 'divyanshu@upi', name: 'Divyanshu Gupta', account: '...', ifsc: '...' },
  showPayment: true
}
```

**Yeh developer ka payment system hai** — agar client (Lucy Garden owner) ne developer ka payment nahi kiya toh developer Firebase se yeh flag enable kar sakta hai. Admin ko payment page dikhega, retailers ko generic "suspended" page.

---

# Hooks & Context

Custom React hooks `src/hooks/` mein hain, context `src/context/` mein.

---

## 10.1 `useDarkMode.js` — Dark/Light Mode

**File:** `src/hooks/useDarkMode.js`

```js
export default function useDarkMode() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('lg_darkmode') === 'true');

  useEffect(() => {
    const root = document.documentElement; // <html> element
    if (isDark) root.classList.add('dark');
    else        root.classList.remove('dark');
    localStorage.setItem('lg_darkmode', isDark);
  }, [isDark]);

  const toggleDark = () => setIsDark(prev => !prev);
  return [isDark, toggleDark];
}
```

### Kaise Kaam Karta Hai

1. Mount pe `localStorage.getItem('lg_darkmode')` padho — `'true'` string hai toh dark mode ON
2. `isDark` change hone pe `<html>` element pe `dark` class add/remove karo
3. Tailwind `dark:` prefix wali classes automatically apply ho jaati hain
4. Preference localStorage mein save hoti hai — page reload ke baad bhi yaad rehta hai

### Usage

```js
const [isDark, toggleDark] = useDarkMode();
// isDark = boolean
// toggleDark = function — call karo toggle karne ke liye

<button onClick={toggleDark}>
  {isDark ? <Sun /> : <Moon />}
</button>
```

**Kahan use hota hai:** RetailerLayout, AdminLayout (header mein toggle button)

**localStorage key:** `lg_darkmode` → `'true'` ya `'false'`

---

## 10.2 `useFontSize.js` — Font Size Preference

**File:** `src/hooks/useFontSize.js`

```js
const SIZES  = ['font-small', 'font-normal', 'font-large'];
const LABELS = ['Small', 'Normal', 'Large'];

export function useFontSize() {
  const [size, setSize] = useState(() => localStorage.getItem('lg_font_size') || 'font-normal');

  useEffect(() => {
    document.documentElement.classList.remove(...SIZES); // pehle sab remove karo
    if (size !== 'font-normal') document.documentElement.classList.add(size); // phir current add karo
    localStorage.setItem('lg_font_size', size);
  }, [size]);

  return { size, setSize, SIZES, LABELS };
}
```

### Kaise Kaam Karta Hai

1. Mount pe localStorage se saved size padho (default: `'font-normal'`)
2. `size` change hone pe `<html>` se sabhi size classes remove karo, phir current add karo
3. `font-normal` ke liye koi class add nahi hoti — yeh default CSS size hai
4. `index.css` mein yeh classes define hain jo base font size scale karti hain

### Usage

```js
const { size, setSize, SIZES, LABELS } = useFontSize();
// size = 'font-small' | 'font-normal' | 'font-large'
// setSize = function
// SIZES = ['font-small', 'font-normal', 'font-large']
// LABELS = ['Small', 'Normal', 'Large']

// Buttons render karne ke liye:
{SIZES.map((s, i) => (
  <button key={s} onClick={() => setFontSize(s)}
    className={fontSize === s ? 'active' : ''}>
    {LABELS[i]}
  </button>
))}
```

**Kahan use hota hai:** RetailerLayout, AdminLayout (header mein S/N/L buttons), Settings pages

**localStorage key:** `lg_font_size` → `'font-small'` / `'font-normal'` / `'font-large'`

---

## 10.3 `useBottomSheet.js` — Swipe-to-Dismiss Gesture

**File:** `src/hooks/useBottomSheet.js`

### Usage

```js
const { sheetRef, handleProps, close } = useBottomSheet(onClose);

// Sheet container pe ref lagao:
<div ref={sheetRef}>
  {/* Drag handle pe handleProps spread karo: */}
  <div {...handleProps} className="drag-handle">
    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
  </div>
  {/* Sheet content */}
</div>
```

### Touch Gesture Logic

```
onTouchStart:
  startY = touch.clientY
  isDragging = true
  sheet.style.transition = 'none'  ← smooth drag ke liye animation off

onTouchMove:
  diff = currentY - startY
  agar diff > 0 (neeche drag):
    sheet.style.transform = `translateY(${diff}px)`

onTouchEnd:
  diff = endY - startY
  sheetHeight = sheet.offsetHeight

  Dismiss conditions (koi bhi ek):
    diff > sheetHeight * 0.3  (30% se zyada drag)
    diff > 100px

  Agar dismiss:
    sheet.style.transform = 'translateY(100%)'
    setTimeout(onClose, 280)  ← animation complete hone do

  Agar nahi:
    sheet.style.transform = 'translateY(0)'  ← wapas snap
```

### `close()` — Programmatic Close

```js
const close = useCallback(() => {
  const sheet = sheetRef.current;
  sheet.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
  sheet.style.transform = 'translateY(100%)';
  setTimeout(onClose, 280);
}, [onClose]);
```

Animation: `cubic-bezier(0.32, 0.72, 0, 1)` — iOS-style spring feel. 280ms duration.

**Kahan use hota hai:** RetailerLayout, AdminLayout, DeveloperLayout — sabhi "More" bottom sheets

---

## 10.4 `usePullToRefresh.js` — Pull-to-Refresh Gesture

**File:** `src/hooks/usePullToRefresh.js`

### Configuration Constants

```js
const THRESHOLD  = 80;   // px — itna pull karo toh refresh trigger
const DEAD_ZONE  = 50;   // px — pehle 50px ignore (scroll se distinguish)
const DAMPENING  = 0.4;  // pull feel heavy karta hai (40% of actual drag)
const MAX_PULL   = 160;  // px — visual cap (zyada nahi jaata)
```

### Activation Conditions

```js
const onTouchStart = (e) => {
  if (window.scrollY > 0) return;  // sirf top pe activate hota hai
  if (el.closest('[data-no-pull]')) return;  // opt-out attribute
  if (el.closest('.overflow-y-auto')) return;  // scrollable containers skip
  if (el.closest('.overflow-x-auto')) return;
  startY = e.touches[0].clientY;
  isPulling = true;
};
```

### Pull Distance Calculation

```js
const onTouchMove = (e) => {
  const diff = currentY - startY;
  if (diff > DEAD_ZONE) {
    const activeDiff = diff - DEAD_ZONE;  // dead zone subtract karo
    const dist = Math.min(activeDiff * DAMPENING, MAX_PULL);  // dampen + cap
    setPullDistance(dist);
    setPulling(true);
    e.preventDefault();  // scroll prevent karo
  }
};
```

### Trigger Logic

```js
const onTouchEnd = () => {
  if (pullRef.current >= THRESHOLD) {
    // Threshold reach hua → refresh
    setTimeout(() => {
      refreshFn();  // onRefresh callback ya window.location.reload()
      setPulling(false);
      setPullDistance(0);
    }, 100);
  } else {
    // Threshold nahi reach hua → snap back
    setPulling(false);
    setPullDistance(0);
  }
};
```

### Usage

```js
const { pulling, pullDistance, threshold } = usePullToRefresh(onRefresh);
// pulling = boolean (true jab user pull kar raha ho)
// pullDistance = number (0 to 160px)
// threshold = 80 (constant)

// Visual indicator:
{pulling && (
  <div style={{ height: pullDistance }}>
    <div style={{ transform: `rotate(${pullDistance * 3}deg)` }}>
      ↓
    </div>
  </div>
)}
```

**`requestAnimationFrame` use:** `setPullDistance` direct call nahi hota — `requestAnimationFrame` mein wrap hota hai taaki UI thread block na ho.

**`data-no-pull` attribute:** Kisi element pe yeh attribute lagao toh us element ke andar pull-to-refresh activate nahi hoga.

**Kahan use hota hai:** RetailerLayout, AdminLayout, DeveloperLayout

---

## 10.5 `useCache.js` — In-Memory Data Cache

**File:** `src/hooks/useCache.js`

### Stale-While-Revalidate Pattern

```js
const cache = {}; // module-level — session bhar persist karta hai

export function useCache(key, fetchFn, deps = []) {
  const [data, setData] = useState(cache[key]?.data ?? null);
  const [loading, setLoading] = useState(!cache[key]); // cache hai toh loading false

  useEffect(() => {
    const load = async () => {
      if (!cache[key]) setLoading(true); // pehli baar → loading show karo

      const result = await fetchRef.current();
      cache[key] = { data: result, ts: Date.now() };
      setData(result);
      setLoading(false);
    };
    load();
  }, deps);

  return { data, loading, refresh };
}
```

### Behavior

| Scenario | `loading` | `data` |
|----------|-----------|--------|
| Pehli baar (no cache) | `true` → skeleton dikhta hai | `null` → phir fetched data |
| Wapas aao (cache hai) | `false` → skeleton nahi | Cached data instantly |
| Background revalidate | `false` (silent) | Pehle cached, phir fresh |

### Usage

```js
const { data: homeData, loading } = useCache(
  `home_${user.phone}`,  // unique cache key
  async () => {
    // Firebase calls yahan
    return { balance, orders, ... };
  },
  [user.phone]  // deps — phone change hone pe re-fetch
);
```

### `clearCache()`

```js
export function clearCache(key) {
  if (key) delete cache[key];           // specific key
  else Object.keys(cache).forEach(k => delete cache[k]); // sab
}
```

**Kahan use hota hai:** `Home.js` (retailer dashboard) — ek hi call mein sab data fetch karta hai

---

## 10.6 `useLiveData.js` — Firebase Query Cache Hook

**File:** `src/hooks/useLiveData.js`

### `useLiveData` — Stale-While-Revalidate for Queries

```js
export function useLiveData(queryFn, cacheKey, options = {}) {
  const { ttl = 3 * 60 * 1000, enabled = true } = options;

  const [docs, setDocs] = useState(() => {
    // Mount pe instantly cache se load karo
    const cached = getCachedDocs(cacheKey);
    return cached ? cached.docs.map(d => ({ id: d.id, ...d.data() })) : null;
  });
  const [loading, setLoading] = useState(!getCachedDocs(cacheKey));
  // ...
}
```

### Fetch Strategy

```js
useEffect(() => {
  const cached = getCachedDocs(cacheKey);
  if (cached) {
    fetch(true);  // silent = true → loading false, background refresh
  } else {
    fetch(false); // silent = false → loading true, show skeleton
  }
}, [cacheKey, enabled]);
```

### Usage

```js
const { data, loading, error, refresh } = useLiveData(
  () => query(collection(db, 'orders'), where('phone', '==', phone)),
  `orders_${phone}`,
  { ttl: 2 * 60 * 1000 }
);
// data = array of documents (id included)
// loading = boolean
// refresh = function to force re-fetch
```

### `usePageData` — Simple Cached Fetch

```js
export function usePageData(fetchFn, deps = [], ttl = 10 * 60 * 1000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Simple fetch, no background revalidation
}
```

**`useLiveData` vs `usePageData`:**
- `useLiveData` — frequently changing data (orders, ledger) — stale-while-revalidate
- `usePageData` — stable data (products, settings) — simple fetch with loading

---

## 10.7 `FeatureFlags.js` (Context) — Real-Time Feature Toggle

**File:** `src/context/FeatureFlags.js`

### Provider Setup

```js
// App.js mein:
<FeatureFlagProvider>
  <AppContent />
</FeatureFlagProvider>
```

### Default Values (Hardcoded)

```js
const [flags, setFlags] = useState({
  seasonalProducts: true,
  supportTickets: true,
  orderHistory: true,
  ledgerView: true,
  darkMode: true,
  pdfInvoice: true,
  duplicateOrderCheck: true,
  balanceWarning: true,
  companyOrder: true,
  bulkPriceUpdate: true,
  cancelOrder: true,
  priceList: true,
  pullToRefresh: true,
  welcomePopup: true,
  installPrompt: true,
  orderPlacement: true,
  rateCard: true,
  announcements: true,
  autoCleanup: true,
  usageTracking: true,
});
```

Agar Firebase se fetch fail ho ya flag exist na kare → default `true` values use hoti hain.

### Firebase Fetch

```js
useEffect(() => {
  const fetchFlags = async () => {
    const snap = await cachedGetDoc(doc(db, 'settings', 'featureFlags'), 5 * 60 * 1000);
    if (snap.exists()) setFlags(prev => ({ ...prev, ...snap.data() }));
    // spread: default values override hoti hain, naye flags add hote hain
  };
  fetchFlags();
}, []);
```

**5 minute cache:** Flags har 5 minute mein ek baar Firebase se fetch hote hain. Real-time `onSnapshot` nahi — reads bachane ke liye.

**`{ ...prev, ...snap.data() }`:** Pehle defaults, phir Firebase values override karo. Agar Firebase mein koi flag nahi hai toh default `true` rehta hai.

### `useFlags()` Hook

```js
export const useFlags = () => useContext(FeatureFlagContext);
```

### Usage Pattern — `!== false`

```js
import { useFlags } from '../../context/FeatureFlags';

const flags = useFlags();

// SAHI tarika:
if (flags.seasonalProducts !== false) {
  // show seasonal products
}

// GALAT tarika:
if (flags.seasonalProducts === true) {
  // yeh kaam nahi karega agar flag undefined ho
}
```

**Kyon `!== false`:** Agar flag Firebase mein exist nahi karta toh `flags.seasonalProducts` → `undefined`. `undefined !== false` → `true` → feature enabled. Yeh default-enabled behavior ensure karta hai.

### Flags Kab Reflect Hote Hain

Developer `/dev/flags` pe toggle karta hai → Firebase update hota hai → **next page load pe** (5 min cache ke baad) users ko reflect hoga. Real-time nahi hai — agar turant chahiye toh user page reload kare.

---

## 10.8 Hooks Summary — Quick Reference

| Hook | File | Returns | Kahan use hota hai |
|------|------|---------|-------------------|
| `useDarkMode` | `hooks/useDarkMode.js` | `[isDark, toggleDark]` | RetailerLayout, AdminLayout |
| `useFontSize` | `hooks/useFontSize.js` | `{ size, setSize, SIZES, LABELS }` | RetailerLayout, AdminLayout, Settings |
| `useBottomSheet` | `hooks/useBottomSheet.js` | `{ sheetRef, handleProps, close }` | Sabhi 3 layouts (More sheet) |
| `usePullToRefresh` | `hooks/usePullToRefresh.js` | `{ pulling, pullDistance, threshold }` | Sabhi 3 layouts |
| `useCache` | `hooks/useCache.js` | `{ data, loading, refresh }` | Home.js (retailer) |
| `useLiveData` | `hooks/useLiveData.js` | `{ data, loading, error, refresh }` | Various pages |
| `usePageData` | `hooks/useLiveData.js` | `{ data, loading }` | Various pages |
| `useFlags` | `context/FeatureFlags.js` | `flags` object | Nav links, feature-gated sections |
| `useConfirm` | `components/ConfirmModal.js` | `confirm` function | Har destructive action |

---

# Firestore Rules & Security

**File:** `firestore.rules` (project root mein)

---

## 11.1 Rules Deploy Karna

```bash
# Sirf rules update karo — app rebuild nahi hoga
firebase deploy --only firestore:rules

# Verify karo Firebase Console mein:
# Firestore → Rules → tab mein current rules dikhti hain
```

Rules change karne ke baad **turant** effective hoti hain — koi app rebuild nahi chahiye.

---

## 11.2 `APP_WRITE_KEY` — Write Authorization System

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isApp() {
      return request.resource.data._appKey == 'LG_2026_dG7xPmKv9Q';
    }

    function isAppUpdate() {
      return request.resource.data._appKey == 'LG_2026_dG7xPmKv9Q';
    }

    function isAppDelete() {
      return resource.data._appKey == 'LG_2026_dG7xPmKv9Q';
    }
  }
}
```

**Kya karta hai:** Har write operation mein `_appKey` field check hota hai. `firebase.js` mein wrapped functions automatically yeh key add karte hain:

```js
// firebase.js mein:
const APP_WRITE_KEY = 'LG_2026_dG7xPmKv9Q';
const _addDoc = async (colRef, data) => addDoc(colRef, { ...data, _appKey: APP_WRITE_KEY });
```

**3 functions ka fark:**

| Function | Kab use hota hai | Kya check karta hai |
|----------|-----------------|---------------------|
| `isApp()` | `create` operations | `request.resource.data._appKey` — naya data |
| `isAppUpdate()` | `update` operations | `request.resource.data._appKey` — updated data |
| `isAppDelete()` | `delete` operations | `resource.data._appKey` — existing doc ka data |

---

## 11.3 Per-Collection Rules — Complete Reference

### `users` Collection

```js
match /users/{phone} {
  allow read: if true;
  allow create: if isApp()
                && request.resource.data.keys().hasAll(['name', 'phone', 'role', 'pin'])
                && request.resource.data.role in ['retailer', 'admin']
                && request.resource.data.phone.size() == 10;
  allow update: if isAppUpdate();
  allow delete: if isAppDelete();
}
```

**Create validation:**
- Required fields: `name`, `phone`, `role`, `pin`
- `role` sirf `'retailer'` ya `'admin'` ho sakta hai
- `phone` exactly 10 characters hona chahiye

### `orders` Collection

```js
match /orders/{orderId} {
  allow read: if true;
  allow create: if isApp()
                && request.resource.data.keys().hasAll(['phone', 'items', 'total', 'status'])
                && request.resource.data.phone.size() == 10
                && request.resource.data.total >= 0;
  allow update: if isAppUpdate();
  allow delete: if isAppDelete();
}
```

**Create validation:**
- Required: `phone`, `items`, `total`, `status`
- `phone` 10 digits
- `total` negative nahi ho sakta

### `products` Collection

```js
match /products/{productId} {
  allow read: if true;
  allow create: if isApp()
                && request.resource.data.keys().hasAll(['name', 'price'])
                && request.resource.data.price >= 0;
  allow update: if isAppUpdate()
                && request.resource.data.price >= 0;  // update mein bhi price check
  allow delete: if isAppDelete();
}
```

**Update mein bhi price validation** — price negative nahi ho sakta update ke baad bhi.

### `ledger` Collection

```js
match /ledger/{entryId} {
  allow read: if true;
  allow create: if isApp()
                && request.resource.data.keys().hasAll(['retailerId', 'amount', 'type'])
                && request.resource.data.type in ['debit', 'credit']
                && request.resource.data.amount >= 0;
  allow update: if isAppUpdate();
  allow delete: if isAppDelete();
}
```

**Create validation:**
- Required: `retailerId`, `amount`, `type`
- `type` sirf `'debit'` ya `'credit'`
- `amount` negative nahi

### `support_tickets` Collection

```js
match /support_tickets/{ticketId} {
  allow read: if true;
  allow create: if isApp()
                && request.resource.data.keys().hasAll(['phone', 'subject', 'message'])
                && request.resource.data.phone.size() == 10;
  allow update: if isAppUpdate();
  allow delete: if isAppDelete();
}
```

### `announcements` Collection

```js
match /announcements/{announcementId} {
  allow read: if true;
  allow create: if isApp()
                && request.resource.data.keys().hasAll(['message', 'type'])
                && request.resource.data.type in ['info', 'warning', 'success', 'urgent'];
  allow update: if isAppUpdate();
  allow delete: if isAppDelete();
}
```

**Type validation:** Sirf 4 valid types — `info`, `warning`, `success`, `urgent`.

### `app_errors` Collection — Special Case

```js
match /app_errors/{errorId} {
  allow read:   if true;
  allow create: if true;  // ← koi validation nahi
  allow update: if true;
  allow delete: if true;
}
```

**Kyon open hai:** Error logging crash ke waqt hota hai — agar `_appKey` check fail ho toh error log bhi nahi ho paayega. Isliye yeh collection fully open rakhi gayi hai.

### `app_ratings` Collection — Immutable

```js
match /app_ratings/{ratingId} {
  allow read: if true;
  allow create: if isApp()
                && request.resource.data.keys().hasAll(['phone', 'rating'])
                && request.resource.data.rating >= 1
                && request.resource.data.rating <= 5;
  allow update: if false;  // ← update allowed nahi
  allow delete: if isAppDelete();
}
```

**`update: if false`:** Rating ek baar submit hone ke baad change nahi ho sakti. Sirf delete kar sakte hain (developer ke liye).

**Create validation:** `rating` 1 se 5 ke beech hona chahiye.

### `audit_log` Collection — Immutable

```js
match /audit_log/{logId} {
  allow read: if true;
  allow create: if isApp()
                && request.resource.data.keys().hasAll(['action', 'performedBy']);
  allow update: if false;  // ← audit trail tamper-proof
  allow delete: if isAppDelete();
}
```

**`update: if false`:** Audit log entries change nahi ho sakti — integrity maintain hoti hai.

### `backups` Collection — No Update

```js
match /backups/{backupId} {
  allow read: if true;
  allow create: if isApp();
  allow update: if false;  // ← backup overwrite nahi ho sakta
  allow delete: if isAppDelete();
}
```

Backup create hone ke baad update nahi ho sakta — sirf delete ya naya create.

### Remaining Collections — Standard Rules

Yeh collections standard `isApp()` / `isAppUpdate()` / `isAppDelete()` use karte hain, koi extra validation nahi:

| Collection | Notes |
|-----------|-------|
| `retailer_balances` | Balance updates frequent hain |
| `settings` | Admin settings, feature flags, etc. |
| `company_orders` | Daily company order data |
| `daily_stock` | Stock received per day |
| `notifications` | Push notification history |
| `scheduled_tasks` | Task configs |
| `order_history` | Required: `phone`, `items`, `total` |

---

## 11.4 Deny-All Fallback

```js
// Sabse last mein — koi bhi unlisted collection block
match /{document=**} {
  allow read, write: if false;
}
```

**Kyon zaroori hai:** Agar koi naya collection Firebase Console se manually banao aur rules mein add karna bhool jaao — yeh rule ensure karta hai ki woh collection accessible nahi hoga. Security by default.

---

## 11.5 Complete Rules Summary Table

| Collection | Read | Create Validation | Update | Delete |
|-----------|------|-------------------|--------|--------|
| `users` | Open | name, phone, role, pin required; role in [retailer,admin]; phone 10 digits | `isAppUpdate()` | `isAppDelete()` |
| `orders` | Open | phone, items, total, status required; phone 10 digits; total ≥ 0 | `isAppUpdate()` | `isAppDelete()` |
| `products` | Open | name, price required; price ≥ 0 | `isAppUpdate()` + price ≥ 0 | `isAppDelete()` |
| `ledger` | Open | retailerId, amount, type required; type in [debit,credit]; amount ≥ 0 | `isAppUpdate()` | `isAppDelete()` |
| `retailer_balances` | Open | `isApp()` | `isAppUpdate()` | `isAppDelete()` |
| `settings` | Open | `isApp()` | `isAppUpdate()` | `isAppDelete()` |
| `support_tickets` | Open | phone, subject, message required; phone 10 digits | `isAppUpdate()` | `isAppDelete()` |
| `announcements` | Open | message, type required; type in [info,warning,success,urgent] | `isAppUpdate()` | `isAppDelete()` |
| `app_errors` | Open | **None** (fully open) | Open | Open |
| `app_ratings` | Open | phone, rating required; rating 1-5 | **DENIED** | `isAppDelete()` |
| `audit_log` | Open | action, performedBy required | **DENIED** | `isAppDelete()` |
| `company_orders` | Open | `isApp()` | `isAppUpdate()` | `isAppDelete()` |
| `daily_stock` | Open | `isApp()` | `isAppUpdate()` | `isAppDelete()` |
| `backups` | Open | `isApp()` | **DENIED** | `isAppDelete()` |
| `notifications` | Open | `isApp()` | `isAppUpdate()` | `isAppDelete()` |
| `scheduled_tasks` | Open | `isApp()` | `isAppUpdate()` | `isAppDelete()` |
| `order_history` | Open | phone, items, total required | `isAppUpdate()` | `isAppDelete()` |
| **Everything else** | **DENIED** | **DENIED** | **DENIED** | **DENIED** |

---

## 11.6 Naya Collection Add Karna

Agar naya collection banao toh rules mein add karna zaroori hai, warna deny-all fallback block kar dega.

**Template:**
```js
// firestore.rules mein add karo:
match /new_collection/{docId} {
  allow read: if true;
  allow create: if isApp()
                && request.resource.data.keys().hasAll(['required_field1', 'required_field2']);
  allow update: if isAppUpdate();
  allow delete: if isAppDelete();
}
```

**Steps:**
1. `firestore.rules` mein rule add karo
2. `firebase deploy --only firestore:rules` run karo
3. App mein collection use karo

---

## 11.7 Security Architecture — Complete Overview

### Client-Side PIN Authentication

```
⚠️ Important: Yeh app client-side PIN verification use karta hai.
PIN Firestore mein stored hai aur client compare karta hai.
Yeh internal business tool ke liye suitable hai — public-facing apps ke liye nahi.
```

### Security Layers

| Layer | Implementation | Kya protect karta hai |
|-------|---------------|----------------------|
| `APP_WRITE_KEY` | Har write mein `_appKey` field | Third-party tools se unauthorized writes |
| Firestore Rules | Field validation + type checks | Invalid data structure |
| Deny-all fallback | `/{document=**}` rule | Unlisted collections |
| Progressive lockout | Login.js mein | Brute force PIN attacks |
| Session management | `activeSession` + `sessionExpiry` | Session hijacking |
| Single-device enforcement | Retailers only | Concurrent session abuse |
| Account blocking | `blocked: true` field | Repeated wrong PIN |
| Dev PIN gate | `DeveloperLayout.js` | Unauthorized dev tools access |
| `.env` file | `.gitignore` mein | API key exposure |

### Security Limitations — Jaanna Zaroori Hai

**1. Open Read Access:**
```
Sabhi collections mein read: if true
Matlab: Firebase config jaanne wala koi bhi data read kar sakta hai
Mitigation: .env file kabhi public nahi honi chahiye
```

**2. Client-Side PIN:**
```
PIN Firestore mein plain text stored hai
Client compare karta hai — server-side verification nahi
Mitigation: Progressive lockout + account blocking
```

**3. Hardcoded DEV_PHONE:**
```
Developer phone number code mein hardcoded hai
Change karne ke liye rebuild + redeploy zaroori hai
Mitigation: Sirf trusted developer ke paas codebase access ho
```

---

## 11.8 Common Security Operations

### Admin Role Assign Karna

```
Firebase Console → Firestore → users → {phone document}
role field → "admin" set karo
```

Koi rebuild nahi chahiye — next login pe admin panel access milega.

### Dev PIN Change Karna

```
Firebase Console → Firestore → settings → devAccess
pin field → naya PIN set karo (string, e.g. "9876")
```

Real-time change — koi rebuild nahi chahiye.

### User Block/Unblock Karna

```
Block:   users/{phone} → blocked: true set karo
Unblock: users/{phone} → blocked field delete karo
         ya Admin → Sessions → Unblock button
```

### Emergency Session Clear

```
Kisi ek user ka:
  users/{phone} → activeSession: "" + sessionExpiry: ""

Sabhi users ka:
  Admin → Sessions → Force Logout All
  ya Dev Console → Sessions tab → Logout All
```

### API Keys Rotate Karna (Firebase Project Switch)

```
1. Firebase Console → naya project banao ya existing mein naye keys generate karo
2. .env file update karo (saari 6 values)
3. .firebaserc mein project ID update karo
4. npm run deploy
5. Vercel pe bhi environment variables update karo
```

---

## 11.9 Firestore Rules Testing

Firebase Console mein rules test kar sakte hain bina deploy kiye:

```
Firebase Console → Firestore → Rules → Rules Playground
```

**Test karne ke liye:**
- Operation: get / list / create / update / delete
- Collection path: e.g. `users/9876543210`
- Data: JSON object jo request mein hoga
- Result: Allow ya Deny

**Local testing (optional):**
```bash
# Firebase Emulator Suite
firebase emulators:start --only firestore
# localhost:8080 pe Firestore emulator chalta hai
# Rules locally test kar sakte hain
```

---

# Config Files, Dev Console & Quick Reference

## 12.1 `tailwind.config.js` — Custom Design System

### Custom Colors

**`royal` — Brand Primary (Deep Blue)**

| Shade | Hex | Kahan use hota hai |
|-------|-----|-------------------|
| `royal-950` | `#001a6e` | Login background |
| `royal-900` | `#002299` | Dark backgrounds |
| `royal-800` | `#0030b8` | Dark gradients |
| `royal-700` | `#0136e4` | Primary buttons, active states |
| `royal-600` | `#1a4ff0` | Hover states |
| `royal-500` | `#3366f5` | Progress bars |
| `royal-400` | `#5c85f7` | Dark mode accents |
| `royal-300` | `#85a3fa` | Light accents |
| `royal-200` | `#adc2fc` | Borders |
| `royal-100` | `#d6e0fe` | Light backgrounds |
| `royal-50` | `#eef2ff` | Hover backgrounds |

**`mint` — Brand Secondary (Fresh Green)**

| Shade | Hex | Kahan use hota hai |
|-------|-----|-------------------|
| `mint-900` | `#0a6b3f` | Dark green backgrounds |
| `mint-800` | `#0f8a52` | Dark gradients |
| `mint-700` | `#17a966` | Invoice PDF header, success states |
| `mint-600` | `#22c77a` | Dispatch button, success badges |
| `mint-500` | `#33de92` | Donut chart delivered arc |
| `mint-400` | `#5ce6a8` | Active nav dots |
| `mint-300` | `#85edbf` | Light accents |
| `mint-200` | `#adf4d5` | Borders |
| `mint-100` | `#d6faeb` | Light backgrounds |
| `mint-50` | `#edfdf5` | Hover backgrounds |

### Custom Shadows

```js
boxShadow: {
  'card':       '0 1px 3px rgba(1,54,228,0.04), 0 4px 16px rgba(1,54,228,0.04)',
  'card-hover': '0 8px 24px rgba(1,54,228,0.08), 0 2px 8px rgba(1,54,228,0.04)',
  'float':      '0 12px 40px rgba(1,54,228,0.15)',
  'glow':       '0 0 20px rgba(51,222,146,0.3)',
}
```

| Class | Kab use hota hai |
|-------|-----------------|
| `shadow-card` | Default card elevation |
| `shadow-card-hover` | Card on hover |
| `shadow-float` | Floating elements (cart bar, bottom nav) |
| `shadow-glow` | Active indicators (green dots) |

### Custom Animations

```js
animation: {
  'fade-in': 'fadeIn 0.4s ease-out',
  'slide-up': 'slideUp 0.3s ease-out',
  'gradient': 'gradient 8s ease infinite',
}
```

| Class | Effect |
|-------|--------|
| `animate-fade-in` | Opacity 0 → 1 (0.4s) |
| `animate-slide-up` | Opacity 0 + Y 10px → normal (0.3s) |
| `animate-gradient` | Background position shift (8s loop) |

### Fonts

```js
fontFamily: {
  sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
}
```

### Dark Mode

```js
darkMode: 'class'
```

`<html>` element pe `dark` class hone pe `dark:` prefix wali classes activate hoti hain. `useDarkMode` hook yeh class manage karta hai.

---

## 12.2 `package.json` — Dependencies & Scripts

### Exact Versions

```json
{
  "dependencies": {
    "firebase":         "^10.7.0",
    "framer-motion":    "^12.38.0",
    "jspdf":            "^4.2.1",
    "lucide-react":     "^1.14.0",
    "react":            "^18.2.0",
    "react-dom":        "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-scripts":    "5.0.1"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.0",
    "postcss":      "^8.4.0",
    "tailwindcss":  "^3.4.0"
  }
}
```

### NPM Scripts

| Command | Kya karta hai |
|---------|---------------|
| `npm start` | Dev server `localhost:3000` — hot reload |
| `npm run build` | Production build → `build/` folder |
| `npm run deploy` | `npm run build` + `firebase deploy` |

**Note:** `package.json` mein version `2.10.1.0` hai — yeh manually update nahi hua. App version `src/utils/config.js` se aata hai, `package.json` se nahi.

---

## 12.3 `public/manifest.json` — PWA Configuration

```json
{
  "short_name": "Lucy Garden",
  "name": "Lucy Garden — Fresh Dairy Supply | Madhubani",
  "display": "standalone",
  "theme_color": "#0136e4",
  "background_color": "#f8fafc",
  "start_url": "/?source=pwa",
  "orientation": "portrait",
  "lang": "en-IN"
}
```

### App Shortcuts (Home Screen Long Press)

```json
"shortcuts": [
  { "name": "Place Order", "url": "/order?source=shortcut" },
  { "name": "Track Order", "url": "/track?source=shortcut" },
  { "name": "My Ledger",   "url": "/ledger?source=shortcut" }
]
```

Android pe app icon long press karo → 3 shortcuts dikhte hain.

### Common Changes

| Kya | Field |
|-----|-------|
| App name (home screen) | `short_name` |
| Full app name | `name` |
| Theme color (browser bar) | `theme_color` |
| Splash background | `background_color` |
| Start page | `start_url` |

---

## 12.4 Other Root Config Files

| File | Kaam | Kab edit karo |
|------|------|---------------|
| `firebase.json` | Hosting config — SPA rewrites, public folder = "build" | Firebase project change karo |
| `.firebaserc` | Firebase project ID link | Project switch karo |
| `vercel.json` | Vercel SPA rewrites | Vercel pe deploy karo |
| `postcss.config.js` | CSS processing (Tailwind ke liye) | Kabhi nahi |
| `.gitignore` | `node_modules`, `.env`, `build` git mein nahi jaate | Naya sensitive file add karo |
| `firestore.rules` | Firestore security rules | Collection add/change karo |

---

## 12.5 Standalone Dev Console — `public/dev-console/`

**URL:** `yourdomain.com/dev-console/`

Yeh ek completely independent emergency tool hai — plain HTML/CSS/JS, koi React nahi, koi build step nahi.

### Kab Use Karo

- Main React app crash ho gayi / white screen aa raha hai
- Maintenance mode toggle karna hai lekin admin panel accessible nahi
- Firebase directly access karna hai bina app ke
- Emergency mein users force logout karne hain

### File Structure

```
public/dev-console/
├── index.html          ← Main page
├── guide.html          ← Usage guide
├── css/
│   └── styles.css      ← Dark theme styling
└── js/
    ├── firebase.js     ← Firebase CDN connection (hardcoded keys)
    ├── auth.js         ← PIN authentication + session tracking
    ├── app.js          ← Tab navigation, Firebase status
    ├── utils.js        ← Helper functions
    └── tabs/
        ├── health.js       ← Firebase ping, system status
        ├── errors.js       ← Error logs view/clear
        ├── sessions.js     ← User sessions, force logout
        ├── flags.js        ← Feature flags toggle
        ├── maintenance.js  ← Maintenance mode toggle
        └── backup.js       ← Backup create/restore
```

### React App vs Dev Console — Differences

| Feature | React App (`/dev`) | Dev Console (`/dev-console/`) |
|---------|-------------------|-------------------------------|
| React required | ✅ | ❌ (plain HTML) |
| Build step | ✅ | ❌ |
| Works if app crashes | ❌ | ✅ |
| Number of tools | 21 pages | 12 tabs |
| Full analytics | ✅ | ❌ (basic only) |
| Auto-refresh | ❌ | ✅ (30 sec) |
| Session tracking | Basic | Full (heartbeat, device info) |

### Authentication — `auth.js`

```js
// Same PIN as React dev tools — settings/devAccess.pin
// Fallback: '0000'
let correctPin = '0000';
loadPin(); // Firebase se fetch karo

// Progressive lockout (React app se alag — NO permanent block)
const DEV_LOCKOUT_TIERS = [60, 300, 1800, 7200]; // 1min, 5min, 30min, 2hr
```

**React app se fark:** React app mein 5 galat attempts → permanent block + localStorage clear. Dev Console mein max 2 hours lock — permanent block nahi (emergency tool hai, permanently block nahi hona chahiye).

### Session Tracking

```js
// Login pe Firebase mein log karo
await db.collection('settings').doc('devAccess').set({
  sessions: arrayUnion({
    sessionId, action: 'login',
    device, browser, os, ua,
    loginAt, lastActive, active: true
  })
}, { merge: true });

// Har 2 minute mein heartbeat
setInterval(updateHeartbeat, 2 * 60 * 1000);

// Page load pe stale sessions clean karo (1 hour se purane)
setTimeout(cleanStaleSessions, 5000);
```

### Firebase Connection — `firebase.js`

```js
// CDN se Firebase load hota hai (React bundle nahi)
firebase.initializeApp({
  apiKey: "...",  // HARDCODED — .env nahi hai yahan
  projectId: "lucy-garden",
  // ...
});
const db = firebase.firestore();
```

**Important:** Dev console mein Firebase keys hardcoded hain — `.env` file nahi hai. Agar Firebase project change karo toh `public/dev-console/js/firebase.js` manually update karna hoga.

### Available Tabs — 12

| Tab | Kya karta hai |
|-----|---------------|
| `health` | Firebase ping, response time, system status |
| `errors` | `app_errors` view + clear |
| `sessions` | Active users, force logout |
| `orders` | Orders browse + status update |
| `retailers` | Retailers list |
| `tickets` | Support tickets |
| `flags` | Feature flags toggle |
| `backup` | Backup create/restore |
| `usage` | Firebase read/write stats |
| `editor` | Document editor (browse/edit/delete) |
| `bulk` | Bulk field update |
| `maintenance` | Maintenance mode toggle |

### Dev Console Update Karna

```
public/ folder mein plain files hain — build process nahi
Seedha edit karo → deploy karo → live ho jaata hai
firebase deploy se automatically deploy hota hai
```

---

## 12.6 PWA Files

| File | Purpose |
|------|---------|
| `public/manifest.json` | App name, icons, theme, shortcuts |
| `public/sw.js` | Service Worker — offline caching |
| `public/logo192.png` | App icon (home screen, small) |
| `public/logo512.png` | App icon (splash screen, large) |
| `public/apple-touch-icon.png` | iOS home screen icon |
| `public/og-image.png` | Social media share preview |

---

## 12.7 Master Cheat Sheet — Common Tasks

### Kuch Bhi Text Change Karna

```
1. Identify karo kaunsa page dikhta hai (route table Part 2 mein)
2. File open karo
3. Ctrl+F se exact text dhundho
4. Change karo → save karo
5. Dev mode mein auto-refresh hoga
```

### Koi Bhi Color Change Karna

```
Tailwind classes dhundho:
  bg-royal-700    → background color
  text-mint-600   → text color
  border-royal-200 → border color
  from-royal-700 to-mint-600 → gradient

Change karo:
  bg-royal-700 → bg-blue-600 (standard Tailwind)
  ya custom hex: bg-[#1234ab]
```

### Koi Bhi Icon Change Karna

```
1. lucide.dev/icons pe jaao → icon dhundho
2. File ke top pe import dhundho:
   import { OldIcon } from 'lucide-react'
3. Change karo:
   import { NewIcon } from 'lucide-react'
4. JSX mein replace karo:
   <OldIcon → <NewIcon
```

### Naya Page Add Karna

```
1. src/pages/{role}/NewPage.js banao
2. App.js mein lazy import add karo:
   const NewPage = lazy(() => import('./pages/{role}/NewPage'));
3. App.js mein route add karo:
   { path: 'new-page', element: <NewPage /> }
4. Layout file mein nav link add karo:
   { to: '/{role}/new-page', label: 'New Page', Icon: SomeIcon }
```

### Version Change Karna

```
src/utils/config.js → version: '2.10.2.0' → naya version
Sab jagah automatically update ho jaata hai
```

### Developer Phone Change Karna

```
src/App.js → const DEV_PHONE = '8051725780'
src/pages/Login.js → const DEV_PHONE = '8051725780'
Dono jagah same number hona chahiye
Rebuild + deploy karo
```

---

## 12.8 Troubleshooting — Common Problems

| Problem | Pehle Check Karo | Fix |
|---------|-----------------|-----|
| White screen / app nahi khulta | Browser Console (F12) | `/dev/errors` ya Firebase status |
| "Permission denied" error | Firestore rules | `firestore.rules` mein collection add karo |
| Data nahi dikh raha | Firebase Console → Firestore | Collection/document exist karta hai? |
| Login nahi ho raha | `users` collection | Phone document exist karta hai? PIN sahi hai? |
| Orders place nahi ho rahe | `settings/app` | `orderStart` aur `orderEnd` check karo |
| App stuck loading | Browser cache | Hard refresh (Ctrl+Shift+R) ya cache clear |
| Maintenance page aa raha hai | `settings/app.maintenance` | `false` set karo |
| Features nahi dikh rahe | `settings/featureFlags` | Flag value check karo |
| Session baar baar expire ho raha hai | `settings/app.sessionTimeout` | Hours value badhao |
| User blocked hai | `users/{phone}.blocked` | Admin Sessions → Unblock |
| PDF download nahi ho raha | `featureFlags.pdfInvoice` | Flag `true` karo |
| Banner nahi dikh raha | `settings/banner` | `active: true` aur `expiresAt` check karo |
| Dev console accessible nahi | `settings/devAccess.pin` | PIN check karo |
| Build fail ho raha hai | `npm run build` output | Console error dekho |
| Firebase quota exceed | Firebase Console → Usage | Cleanup karo ya Blaze plan lo |

---

## 12.9 Deployment Checklist

### Pehli Baar Deploy Karna

```
1. Firebase project banao → Console.firebase.google.com
2. .env file banao → Firebase keys daalo
3. npm install
4. Firestore rules deploy karo:
   firebase deploy --only firestore:rules
5. App deploy karo:
   npm run deploy
6. Firebase Console → Hosting → URL check karo
```

### Update Deploy Karna

```
1. Code changes karo
2. config.js mein version bump karo
3. npm run deploy
4. Verify karo: deployed URL pe version check karo
```

### Vercel Pe Deploy Karna

```
1. GitHub pe push karo
2. Vercel auto-deploy hoga
3. Environment variables Vercel dashboard mein set karo:
   REACT_APP_FIREBASE_API_KEY
   REACT_APP_FIREBASE_AUTH_DOMAIN
   REACT_APP_FIREBASE_PROJECT_ID
   REACT_APP_FIREBASE_STORAGE_BUCKET
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID
   REACT_APP_FIREBASE_APP_ID
```

---

## 12.10 Emergency Procedures

### App Completely Down Hai

```
1. Dev Console kholo: yourdomain.com/dev-console/
2. Health tab → Firebase status check karo
3. Maintenance tab → maintenance OFF karo
4. Errors tab → recent crashes dekho
5. Agar Firebase down hai → status.firebase.google.com check karo
```

### Kisi User Ko Turant Logout Karna

```
Option 1 (fastest): Firebase Console
  → users/{phone} → activeSession: "" set karo
  → User 2 min mein logout ho jaayega

Option 2: Admin → Sessions → Force Logout

Option 3: Dev Console → Sessions tab → Force Logout
```

### Database Corrupt Ho Gayi

```
1. Pehle backup download karo (agar possible ho):
   /dev/backup → Download button
2. Backup file se restore karo:
   /dev/backup → Restore File → JSON file select karo
3. Double confirmation ke baad restore hoga
```

### Galti Se Data Delete Ho Gaya

```
Agar backup tha:
  /dev/backup → Cloud backup se restore karo

Agar backup nahi tha:
  Firebase Console → Firestore → deleted collection dhundho
  (Firestore mein deleted data recover nahi hota)
  Lesson: Regular backups lo
```

### Maintenance Mode Mein Phans Gaye (Admin Bhi Nahi Dekh Pa Raha)

```
Admin maintenance se block nahi hota — seedha /admin jaao
Ya Firebase Console → settings/app → maintenance: false
Ya Dev Console → Maintenance tab → Toggle OFF
```

---

*Lucy Garden Developer Guide — Version 02.10.01.01 | 31 July 2026 | Divyanshu Gupta*
