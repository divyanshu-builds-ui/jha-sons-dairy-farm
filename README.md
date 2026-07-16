# 🥛 Lucy Garden — Technical Documentation

> **Fresh Dairy Supply Management System**
> A complete order management PWA for Lucy Garden dairy business — connecting retailers with the admin for daily orders, deliveries, payments, and ledger tracking.

---

## 1. 📋 Project Overview & Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | The entire website/app UI |
| **Styling** | Tailwind CSS | All colors, layouts, buttons, spacing |
| **Animations** | Framer Motion | Smooth transitions, page animations |
| **Icons** | Lucide React | All icons (search, cart, settings etc.) |
| **Database** | Firebase Firestore | Stores all data (orders, users, products, ledger) |
| **Hosting** | Firebase Hosting / Vercel | Website is live here |
| **PDF Generation** | jsPDF | Invoice & daily sheet PDF downloads |
| **PWA** | Service Worker | App can be installed on phone like native app |

### ⚠️ Important: There is NO separate backend/Node.js server
This project is **frontend-only**. It talks directly to Firebase (Google's cloud database). No Express, no Node server, no API routes.

---

## 2. 📁 Complete Folder & File Tree

```
lucy-garden/
├── public/                     ← Static files (favicon, manifest for PWA)
│   ├── dev-console/            ← 🚨 Standalone emergency dev console (modular)
│   │   ├── index.html          ← Dev console entry page
│   │   ├── guide.html          ← Dev console usage guide
│   │   ├── css/
│   │   │   └── styles.css      ← Dev console styling
│   │   └── js/
│   │       ├── app.js          ← Main app logic
│   │       ├── auth.js         ← PIN authentication
│   │       ├── firebase.js     ← Firebase CDN connection
│   │       ├── utils.js        ← Helper functions
│   │       └── tabs/
│   │           ├── backup.js   ← Backup tab logic
│   │           ├── errors.js   ← Error logs tab
│   │           ├── flags.js    ← Feature flags tab
│   │           ├── health.js   ← Health check tab
│   │           ├── maintenance.js ← Maintenance toggle tab
│   │           └── sessions.js ← Sessions tab
│   ├── index.html              ← The single HTML page (React injects into this)
│   ├── manifest.json           ← PWA config (app name, icons, theme)
│   ├── sw.js                   ← Service Worker (offline support)
│   ├── favicon.ico             ← Browser tab icon
│   ├── apple-touch-icon.png    ← iOS home screen icon
│   ├── logo192.png             ← App icon (small)
│   ├── logo512.png             ← App icon (large)
│   ├── og-image.png            ← Social media share image
│   ├── robots.txt              ← SEO: tells Google what to index
│   ├── sitemap.xml             ← SEO: site map for search engines
│   └── 404.html                ← Shown when page not found (hosting)
│
├── src/                        ← ALL the actual code lives here
│   ├── App.js                  ← 🧠 BRAIN of the app (routing, auth, maintenance)
│   ├── index.js                ← Entry point (renders App into HTML)
│   ├── index.css               ← Global CSS + Tailwind imports
│   │
│   ├── assets/                 ← Images
│   │   └── logo.png            ← Lucy Garden logo
│   │
│   ├── components/             ← Reusable UI pieces
│   │   ├── layout/
│   │   │   ├── RetailerLayout.js   ← Retailer app shell (header, bottom nav, sidebar)
│   │   │   ├── AdminLayout.js      ← Admin app shell (sidebar, header)
│   │   │   └── DeveloperLayout.js  ← Developer console shell (dark green theme)
│   │   ├── AppFooter.js        ← Responsive footer (desktop + mobile, retailer/admin)
│   │   ├── ConfirmModal.js     ← "Are you sure?" popup used everywhere
│   │   ├── ErrorBoundary.js    ← Root/App/Dev crash catchers (auto-logs to Firebase)
│   │   ├── InstallPrompt.js    ← "Install App" banner for PWA
│   │   ├── LoadingSkeleton.js  ← Gray shimmer loading placeholders
│   │   ├── OfflineBanner.js    ← "You're offline" warning bar
│   │   ├── SplashScreen.js     ← Loading screen (premium launch + normal mode)
│   │   ├── TopProgressBar.js   ← Thin animated progress bar on page transitions
│   │   └── WelcomePopup.js     ← First-time onboarding (Install + Guide + Rating)
│   │
│   ├── context/                ← Shared state across all pages
│   │   └── FeatureFlags.js     ← Real-time feature ON/OFF system
│   │
│   ├── hooks/                  ← Custom React hooks
│   │   ├── useBottomSheet.js   ← Swipe-to-dismiss bottom sheet gesture logic
│   │   ├── useDarkMode.js      ← Dark/Light mode toggle logic
│   │   ├── useFontSize.js      ← Font size preference (Small/Normal/Large)
│   │   └── usePullToRefresh.js ← Pull-to-refresh gesture for mobile
│   │
│   ├── pages/                  ← All screens/pages
│   │   ├── Login.js            ← Login page (phone + PIN)
│   │   ├── NotFound.js         ← 404 page
│   │   │
│   │   ├── retailer/           ← Pages for shop owners
│   │   │   ├── About.js        ← About Lucy Garden page
│   │   │   ├── Checkout.js     ← Order review + confirm
│   │   │   ├── Guide.js        ← User Guide (step-by-step how to use app)
│   │   │   ├── Home.js         ← Retailer dashboard/home
│   │   │   ├── MyLedger.js     ← Product-wise daily breakdown (read-only)
│   │   │   ├── OrderHistory.js ← Past orders list
│   │   │   ├── PlaceOrder.js   ← Product list + quantity selection
│   │   │   ├── PriceList.js    ← View all product prices + download PDF rate card
│   │   │   ├── PrivacyPolicy.js ← Privacy policy page
│   │   │   ├── Profile.js      ← Retailer profile info
│   │   │   ├── Settings.js     ← Dark mode, PIN change, Install App button
│   │   │   ├── Support.js      ← Raise support ticket + chat
│   │   │   ├── Terms.js        ← Terms & conditions page
│   │   │   └── TrackOrder.js   ← Today's order status + PDF invoice
│   │   │
│   │   ├── admin/              ← Pages for business owner (admin)
│   │   │   ├── Announcements.js ← Send banners to users
│   │   │   ├── CompanyOrder.js ← Company-level order summary
│   │   │   ├── DailyLedger.js  ← Daily order sheet + dispatch/deliver + bulk dispatch
│   │   │   ├── Dashboard.js    ← Admin home (stats, overview, FAB quick actions)
│   │   │   ├── DevPanel.js     ← App health monitor (dev only)
│   │   │   ├── Inventory.js    ← Products list (add/edit/delete/price)
│   │   │   ├── Ledger.js       ← Retailer summary + product-wise breakdown + entries + collect/set balance
│   │   │   ├── OrderDetail.js  ← Single order detail + timeline + edit items
│   │   │   ├── PlaceOrder.js   ← Place/edit order on behalf of retailer
│   │   │   ├── Retailers.js    ← Manage retailers + performance score
│   │   │   ├── Sessions.js     ← Active sessions monitor + force logout/unblock
│   │   │   ├── Settings.js     ← 2-col layout: timing, rules, maintenance, tools
│   │   │   └── SupportTickets.js ← View/reply tickets + pagination + search
│   │   │
│   │   └── dev/                ← Developer-only tools (19 pages)
│   │       ├── Announcements.js      ← Send banners to all users
│   │       ├── ApiResponseMonitor.js ← Firebase query latency tester
│   │       ├── AppRatings.js         ← User ratings, average, distribution
│   │       ├── AuditLog.js           ← Action history log
│   │       ├── BackupRestore.js      ← Database snapshot + restore
│   │       ├── ConfigDiff.js         ← Live config vs defaults comparison
│   │       ├── DatabaseCleanup.js    ← Delete old data
│   │       ├── DataExport.js         ← Export collections as JSON/CSV
│   │       ├── DeployInfo.js         ← Version, performance, PWA status
│   │       ├── DevGuide.js           ← Complete dev tools guide + FAQ
│   │       ├── ErrorLogs.js          ← App crash logs + fix suggestions
│   │       ├── FeatureFlags.js       ← Toggle features ON/OFF
│   │       ├── NotificationCenter.js ← Send live banners + history
│   │       ├── OrderAnalytics.js     ← Order trends, peak hours
│   │       ├── RealtimeDashboard.js  ← Live orders/users via onSnapshot
│   │       ├── RetailerActivity.js   ← Active/inactive retailers
│   │       ├── RevenueDashboard.js   ← Revenue charts (today/week/month)
│   │       ├── ScheduledTasks.js     ← Automated maintenance jobs
│   │       └── UserSessions.js       ← Active users + force logout
│   │
│   ├── services/               ← Backend connections
│   │   ├── firebase.js         ← 🔥 Firebase connection + all DB functions
│   │   └── errorLogger.js      ← Error capture + solution matching
│   │
│   └── utils/                  ← Helper functions
│       ├── autoCleanup.js      ← Auto-delete old data on app load (daily)
│       ├── config.js           ← 🎯 Central app config (version, name, developer)
│       ├── date.js             ← Date formatting helpers
│       ├── deliveryPdf.js      ← PDF generation for delivery sheets
│       ├── price.js            ← Format ₹ prices
│       └── usageTracker.js     ← Track Firestore reads/writes, sync to Firebase
│
├── .env                        ← 🔑 SECRET: Firebase API keys (never share!)
├── package.json                ← Project config + dependencies list
├── tailwind.config.js          ← Tailwind CSS customization (colors, fonts)
├── postcss.config.js           ← CSS processing config
├── firebase.json               ← Firebase hosting config
├── firestore.rules             ← 🔒 Firestore security rules (per-collection)
├── .firebaserc                 ← Firebase project ID link
├── vercel.json                 ← Vercel hosting config (redirects)
├── seed.js                     ← Script to add sample data to Firebase
└── .gitignore                  ← Files to NOT upload to GitHub
```

---

## 3. 🗂️ File-by-File Explanation (Simple Language)

### 🧠 Core Files (Most Important)

| File | What it does (in simple words) |
|------|-------------------------------|
| `src/App.js` | **The boss file.** Decides which page to show based on who's logged in (retailer/admin/developer). Handles login verification, maintenance mode, and all routing. |
| `src/index.js` | Starts the app. Puts React into the HTML page. You never need to touch this. |
| `src/index.css` | All base styling. Imports Tailwind CSS. |
| `.env` | **SECRET FILE.** Contains Firebase passwords/keys. Never share or upload this. |

### 🔥 Firebase Connection

| File | What it does |
|------|-------------|
| `src/services/firebase.js` | **Connects to Firebase database.** All read/write operations (get orders, save users, etc.) come from here. Every page imports from this file. |

### 🎨 Layouts (App Shells)

| File | What it does |
|------|-------------|
| `RetailerLayout.js` | The frame around retailer pages — header with logo, bottom navigation bar (Home, Order, Track, Ledger, Me), sidebar menu, announcement banner |
| `AdminLayout.js` | The frame around admin pages — dark sidebar with all admin links, top header, mobile bottom nav |
| `DeveloperLayout.js` | The frame around developer pages — black/green hacker theme, dev tools sidebar |

### 🛒 Retailer Pages (14 pages)

| File | What the retailer sees |
|------|----------------------|
| `PlaceOrder.js` | List of all products with +/- buttons to select quantity. Search bar. Cart total at bottom. **Max items limit enforced.** |
| `Checkout.js` | Review order, see total + previous dues, confirm button. Duplicate order warning. **Min order amount enforced. Modify toggle respected.** |
| `TrackOrder.js` | Today's order status (Pending → Dispatched → Delivered). **Dispatch Slip PDF (blue)** on dispatch, **Final Invoice PDF (green)** on delivery. Cancel order before dispatch. |
| `Home.js` | Dashboard with quick stats and shortcuts. |
| `MyLedger.js` | Product-wise daily breakdown — same DailyLedger-style responsive table with sticky Date column, product quantities, TOTAL/PAID/DUE columns. Read-only for retailers. |
| `PriceList.js` | **View all product prices** grouped by daily/seasonal. Search + **Download PDF rate card** with formatted table. |
| `Support.js` | Raise a ticket, view ticket status, reply to admin. WhatsApp/Call buttons. |
| `Settings.js` | Dark mode toggle, change PIN, font size, **Install App button**. |
| `Profile.js` | View profile info (name, phone, shop, area). **Last login time + device shown.** |
| `Guide.js` | **User Guide** — step-by-step instructions: Install, Order, Track, Ledger, Support, History. Accordion style with FAQ. |
| `About.js` | About Lucy Garden — mission, offerings, contact info. Reads from config.js. |
| `PrivacyPolicy.js` | Full privacy policy page (data collection, storage, rights). |
| `Terms.js` | Terms & conditions (orders, delivery, payment, ledger, termination). |
| `OrderHistory.js` | Past orders list. |

### 👨‍💼 Admin Pages

| File | What the admin sees |
|------|-------------------|
| `Dashboard.js` | Overview — today's orders, revenue, pending deliveries. Donut chart. Report PDF. Quick Actions FAB (mobile). |
| `PlaceOrder.js` | Place/edit order on behalf of retailer. Area filter, search, date picker, duplicate check, quick re-order, edit existing order inline. |
| `DailyLedger.js` | Main daily work page. All retailers + orders in table. Dispatch/Deliver. Bulk Dispatch. Past date actions enabled. PDF export. |
| `Retailers.js` | Add/Edit/Delete retailers. Block/Unblock. Performance Score (frequency, reliability, payment). Area management. |
| `Inventory.js` | Add/Edit/Delete products. Set prices. Bulk price update. |
| `Ledger.js` | Retailer ledger — **Summary view** (product-wise daily breakdown table like DailySheet, with Date rows instead of Retailer rows) + **All Entries view** (edit/delete individual entries). Collect payment with date picker. Set opening balance. Daily PDF + Seasonal PDF + Excel export. DailyLedger-style responsive tables with sticky columns. |
| `OrderDetail.js` | Single order — timeline (Placed→Confirmed→Dispatched→Delivered), edit items, retailer info, due warning. |
| `CompanyOrder.js` | Company-level order summary for the day. |
| `Announcements.js` | Send banners to users. |
| `Settings.js` | Order/delivery window, session timeout, min order, max items, maintenance mode. |
| `Sessions.js` | Monitor active sessions, force logout, unblock accounts. |
| `SupportTickets.js` | View all retailer tickets, reply, change status. Pagination + search. |

### 🛠️ Developer Pages (19 pages)

| File | What the developer sees |
|------|------------------------|
| `DevPanel.js` | App health — Firebase status, response time, stats, quick actions. |
| `ErrorLogs.js` | All app crashes with error message, stack trace, and suggested fix. |
| `UserSessions.js` | Who's logged in right now. Force logout anyone. |
| `OrderAnalytics.js` | Order trends, peak hours, top products, revenue charts. |
| `RetailerActivity.js` | Which retailers are active, slowing down, or inactive. |
| `DeployInfo.js` | App version, build info, performance metrics, PWA status. |
| `Announcements.js` | Send banner messages to all retailers instantly. |
| `DatabaseCleanup.js` | Delete old orders/ledger/tickets to keep database clean. |
| `FeatureFlags.js` | Toggle app features ON/OFF without code changes. |
| `AuditLog.js` | History of all admin actions (who did what, when). |
| `AppRatings.js` | View all user ratings, average, distribution, delete ratings. |
| `ApiResponseMonitor.js` | **Firebase query latency tester** — pings all endpoints, shows avg/max/errors, color-coded, test history. |
| `BackupRestore.js` | **Database snapshot & restore** — backup critical collections, restore with double-confirm, progress bar. |
| `ConfigDiff.js` | **Live config vs defaults** — shows what settings have been changed from default values. Copy raw JSON. |
| `DataExport.js` | **Export collections** as JSON or CSV file. Select specific collections or all. |
| `DevGuide.js` | **Complete developer guide** — all 19 tools documented with steps, tips, FAQ, emergency procedures. |
| `NotificationCenter.js` | **Send live banners** to users + clear active banner + notification history. |
| `RealtimeDashboard.js` | **Live data feed** — active users, today's orders/revenue via onSnapshot. Pulse animation on updates. |
| `RevenueDashboard.js` | **Revenue charts** — today/7-day/30-day totals, daily bar chart, avg order value. |
| `ScheduledTasks.js` | **Automated maintenance jobs** — create tasks, run manually, cleanup errors/orders/sessions. |

### 🧩 Shared Components

| File | What it does |
|------|-------------|
| `ConfirmModal.js` | "Are you sure?" popup — 6 types (danger/warning/logout/info/success/critical). Always dark themed. Used on ALL sensitive dev actions. Backdrop blur, spring animations. |
| `ErrorBoundary.js` | **3 error boundaries:** RootErrorBoundary (catches everything, minimal HTML), AppErrorBoundary (inside layouts, shows reload/home/dev buttons), DevErrorBoundary (dev console specific). All auto-log to Firebase `app_errors`. |
| `AppFooter.js` | **Responsive footer** — desktop (3-column: brand, quick links, info) + mobile (compact centered). Supports retailer/admin mode. Reads from config.js. |
| `TopProgressBar.js` | **Thin animated progress bar** at top during page transitions. Exports triggerProgress/stopProgress. Includes PageLoader skeleton component. |
| `LoadingSkeleton.js` | Gray shimmer boxes shown while data loads. |
| `SplashScreen.js` | Loading screen — **premium animated version for first 7 days after launch**, then normal minimal splash. Auto-switches based on launch date. |
| `InstallPrompt.js` | "Add to Home Screen" banner for mobile users. Stores event on `window.__lgInstallPrompt` for reuse. |
| `WelcomePopup.js` | **First-time onboarding popup** — 3 slides: Install App → User Guide → Rate Us (⭐). Shows 2 sec after first login. Rating saved to Firebase `app_ratings` collection. Cannot be accidentally dismissed. |
| `OfflineBanner.js` | "No internet" warning bar. |

### 🔧 Utilities, Hooks & Services

| File | What it does |
|------|-------------|
| `errorLogger.js` | Catches all app crashes automatically. Stores in Firebase. Matches errors with solutions. |
| `config.js` | **🎯 Central config** — app version (`2.10.0`), name, tagline, developer info, phone. Single source of truth. |
| `autoCleanup.js` | **Auto-cleanup on app load** — runs once/day, deletes old errors (7d), old orders/audit (1yr). Respects `autoCleanup` setting. Logs to audit_log. |
| `usageTracker.js` | **Tracks Firestore usage** (reads/writes/deletes) locally, syncs to Firebase every 5 min + on page unload. |
| `price.js` | Formats numbers as ₹ prices (e.g., ₹1,250.00) |
| `date.js` | Date formatting helpers |
| `deliveryPdf.js` | Generates delivery sheet PDFs |
| `useDarkMode.js` | Hook that manages dark/light mode preference |
| `useFontSize.js` | Hook for font size preference (Small/Normal/Large). Adds CSS class to `<html>`. |
| `useBottomSheet.js` | Hook for swipe-to-dismiss bottom sheet gesture (touch drag + velocity threshold). |
| `usePullToRefresh.js` | Hook for pull-to-refresh on mobile (threshold 80px, 0.4x dampening). |
| `FeatureFlags.js` (context) | Real-time listener — when developer toggles a feature, it instantly reflects everywhere |

---

## 4. 🔄 Data Flow (How Everything Connects)

```
┌─────────────────────────────────────────────────────┐
│                    USER'S PHONE                       │
│                                                       │
│  React App (RetailerLayout / AdminLayout)            │
│       ↓                                               │
│  Page Component (e.g., PlaceOrder.js)                │
│       ↓                                               │
│  firebase.js → getDocs() / addDoc() / updateDoc()   │
│       ↓                                               │
└───────┼───────────────────────────────────────────────┘
        │ (Internet)
        ↓
┌─────────────────────────────────────────────────────┐
│              FIREBASE FIRESTORE (Cloud)               │
│                                                       │
│  Collections:                                         │
│  ├── users          (all retailers + admin accounts) │
│  ├── orders         (all orders ever placed)         │
│  ├── products       (product catalog + prices)       │
│  ├── ledger         (payment entries)                │
│  ├── retailer_balances (current dues)                │
│  ├── support_tickets (help tickets)                  │
│  ├── settings       (app config, banner, flags)      │
│  ├── announcements  (banner history)                 │
│  ├── app_errors     (crash logs)                     │
│  ├── app_ratings    (user ratings)                   │
│  ├── audit_log      (action history)                 │
│  ├── company_orders (company level orders)           │
│  ├── daily_stock    (daily stock data)               │
│  ├── notifications  (notification history)           │
│  ├── backups        (database snapshots)             │
│  ├── scheduled_tasks (maintenance job configs)       │
│  └── order_history  (archived orders)                │
└─────────────────────────────────────────────────────┘
```

**Simple explanation:**
1. User opens app on phone
2. React shows the correct page
3. Page needs data → calls Firebase directly (no middleman server)
4. Firebase returns data → React displays it
5. User does action (place order) → React writes to Firebase
6. Real-time listeners (onSnapshot) → changes appear instantly on other devices

---

## 5. 💻 Local Setup & Commands

### Prerequisites
- Node.js installed (v16 or higher)
- Git installed
- A code editor (VS Code recommended)

### Step-by-step:

```bash
# 1. Clone the project
git clone https://github.com/divyanshu-builds-ui/Lucy-Garden.git
cd Lucy-Garden

# 2. Install all dependencies
npm install

# 3. Create .env file with Firebase keys
# (Ask developer for the .env file — NEVER commit this)

# 4. Start the app locally
npm start

# App will open at http://localhost:3000
```

### Available Commands:

| Command | What it does |
|---------|-------------|
| `npm start` | Runs app locally for testing (http://localhost:3000) |
| `npm run build` | Creates production-ready files for hosting |
| `npm run deploy` | Builds + deploys to Firebase Hosting |

---

## 6. 🌐 Deployment & Hosting

| What | Where | How to update |
|------|-------|---------------|
| **Website** | Firebase Hosting OR Vercel | Managed by developer — auto-deploys on git push |
| **Database** | Firebase Firestore | Automatic — no deployment needed |
| **Domain** | Custom domain (if configured) | Firebase Console → Hosting → Custom Domain |

### To deploy a new version:
```bash
git add -A
git commit -m "your change description"
git push
# If auto-deploy is set up, it goes live automatically
# Otherwise: npm run deploy
```

---

## 7. 🚨 Troubleshooting Guide

### If the website crashes or shows error:

| Problem | Where to check | Solution |
|---------|---------------|----------|
| **White screen / app won't load** | Browser Console (F12 → Console tab) | Usually a JavaScript error. Check DevPanel → Error Logs |
| **"Permission denied" error** | Firebase Console → Firestore → Rules | A collection is missing from rules. Add it. |
| **Data not showing** | Firebase Console → Firestore → Data | Check if the collection/document exists |
| **Login not working** | Check `users` collection in Firebase | Verify phone number document exists with correct PIN |
| **Orders not placing** | Check `settings/app` document | Verify `orderStart` and `orderEnd` values (12-16) |
| **App stuck on loading** | Clear browser cache / localStorage | Or check Firebase project quota |
| **Maintenance page showing** | Firebase → `settings/app` → `maintenance` field | Set to `false` |
| **Features not toggling** | Firebase → `settings/featureFlags` | Check the flag values |

### Developer Panel (fastest way):
1. Login with developer phone (8051725780, PIN: 0000)
2. Go to `/dev/errors` — see all crashes with solutions
3. Go to `/dev` — check Firebase connection status
4. Go to `/dev/sessions` — see if users can login

### Firebase Console (for data issues):
1. Go to https://console.firebase.google.com
2. Select "Lucy Garden" project
3. Firestore Database → Browse collections
4. Check if data exists and is correct

---

## 8. 🔐 Security Notes

- `.env` file contains all Firebase API keys — **NEVER share publicly**
- Developer access is hardcoded to phone `8051725780`
- Admin access requires `role: 'admin'` in Firebase `users` collection
- **Firestore rules are per-collection** — proper validation on create (required fields checked), deny-all fallback for unknown collections
- `firestore.rules` file in project root — deploy with `firebase deploy --only firestore:rules`
- Session timeout is configurable (default 24 hours) via Admin Settings
- **Retailers:** One device login only — logging in elsewhere terminates previous session
- **Admin:** Multi-device login allowed — can use phone + laptop simultaneously
- Progressive lockout: 5 wrong PINs → 60s lock → 5min → 30min → permanent block
- Blocked accounts can be unblocked from Admin Sessions page
- Device info (browser, OS) tracked on every login
- **ErrorBoundary** auto-logs all crashes to Firebase (root, app, dev levels)
- **Auto-cleanup** runs daily — deletes old errors (7d) and old data (1yr) to stay within free tier

---

## 9. 📱 Three User Roles

| Role | Login | Home URL | What they can do |
|------|-------|----------|-----------------|
| **Retailer** | Phone + PIN | `/` | Place orders, track, view ledger, support |
| **Admin** | Phone + PIN (role: admin in Firebase) | `/admin` | Manage everything — orders, retailers, inventory, payments |
| **Developer** | 8051725780 + PIN 0000 | `/dev` | All admin access + dev tools, error logs, analytics, feature flags |

---

## 10. 📊 Firebase Collections Reference

| Collection | What's stored | Key fields |
|-----------|--------------|------------|
| `users` | All user accounts | phone, name, role, pin, area, shop, lastLogin, lastLoginDevice, deviceInfo, activeSession, sessionExpiry, blocked |
| `orders` | Every order | phone, items, total, status, date, actualItems, actualTotal, placedBy, modified, modifiedAt, modifiedBy, dispatchedAt, deliveredAt, cancelledAt, cancelledBy |
| `products` | Product catalog | name, price, unit, type, group, active |
| `ledger` | Payment entries | retailerId, retailer, amount, type (debit/credit/opening), note, date, createdAt |
| `retailer_balances` | Current dues | balance |
| `settings` | App configuration | app (maintenance, orderStart/End, sessionTimeout, minOrderAmount, maxOrderItems, allowModify, defaultPin), banner, featureFlags, productGroups (daily[], seasonal[], codes{}), usage_[date] |
| `support_tickets` | Help tickets | phone, subject, message, status, messages[] |
| `announcements` | Banner history | message, type, target, expiresAt |
| `notifications` | Notification history | message, type, target, createdAt, sentBy |
| `app_errors` | Crash logs | message, stack, componentStack, url, user, timestamp, type, severity |
| `app_ratings` | User ratings | phone, name, rating (1-5), createdAt, device |
| `audit_log` | Action history | action, description, target, performedBy, timestamp |
| `company_orders` | Company level orders | items, date |
| `daily_stock` | Daily stock received | items, date |
| `backups` | Database snapshots | data (JSON string), createdAt, collections, docCount |
| `scheduled_tasks` | Maintenance jobs | name, schedule, action, enabled, lastRun, status, lastResult |
| `order_history` | Archived orders | phone, items, total, createdAt |

---

*Built with ♥ by Divyanshu Gupta*
*Last updated: July 2026 | Version 2.10.0*

---

## 11. 🆕 Version History

### v2.10.0 (Latest)

| Feature | Description |
|---------|-------------|
| **Ledger Redesign** | Complete rewrite — now shows product-wise daily breakdown (DailySheet-style table) with Date rows, product quantity columns, TOTAL/PAID/DUE. Replaces old simple ledger. |
| **Summary Page Removed** | Summary merged into Ledger. Single page handles everything — no more separate Summary route. |
| **DailyLedger-style PDF** | Ledger PDF now matches DailySheet design — row height 11mm, bigger fonts, proper header with product groups, PAID/DUE columns. Hindi name support via canvas rendering. |
| **Seasonal PDF** | Separate seasonal product PDF with same DailyLedger-style design. |
| **Excel Export Improved** | Proper CSV with BOM (Hindi support), quoted values, group headers, retailer info rows, empty cells instead of 0. |
| **Summary/All Entries Toggle** | Ledger page has two views — Summary (product tables) and All Entries (edit/delete individual ledger entries). |
| **Date Picker in Modals** | Collect Payment and Set Balance modals now have date picker for backdated entries. |
| **Collect/Set Bal Separated** | Payment buttons moved to right side, separated from PDF/Excel buttons for cleaner UI. |
| **Retailer MyLedger Redesign** | Retailer-side ledger now shows same product-wise breakdown table (read-only, no edit/delete). |
| **Responsive Tables** | All tables use DailyLedger-style sticky columns, shadows, hover effects, proper font sizes. |
| **PDF Black Box Fix** | Fixed jsPDF fillColor/drawColor state leaking between cells causing black boxes in PAID/DUE columns. |
| **Hindi PDF Footer Fix** | Footer text with Hindi retailer names now renders correctly using canvas-based drawText helper. |

### v2.8.0

| Feature | Description |
|---------|-------------|
| **Admin Place Order** | `/admin/place-order` — Admin can place order on behalf of any retailer. Area filter, retailer search (name/phone/shop), balance badge, date picker (tomorrow to +7 days), duplicate order check, quick re-order (last order pre-fill), clear cart, error toast. |
| **Edit Existing Order** | When duplicate order exists, admin can click "Edit Existing Order" to pre-fill quantities and update the order directly — no new order created. |
| **Order Timeline** | OrderDetail page shows visual journey: Placed → Confirmed → Dispatched → Delivered with timestamps and colored status dots. |
| **Order Edit in OrderDetail** | Admin can edit item quantities and remove items from any non-delivered order. |
| **Retailer Performance Score** | Retailers page — click any retailer to see score /100. Breakdown: Frequency (orders/month), Reliability (cancel rate), Payment (due amount). Labels: Excellent/Good/Needs Attention. |
| **Ledger: All Entries View** | New "All Entries" tab — see every individual ledger entry with edit (amount/note/type) and delete buttons. |
| **Ledger: Date Picker** | Collect Payment and Set Balance modals now have date picker — admin can add entries for past dates. |
| **Past Date Actions** | DailyLedger no longer read-only for past dates. Admin can dispatch/deliver orders from any date. |
| **Quick Actions FAB** | Dashboard floating button (mobile only) — quick access to Place Order, Daily Sheet, Ledger. |
| **Scroll Lock on Modals** | All modals (Retailers, DailyLedger, Ledger) lock body scroll when open. |
| **Opening Balance Fix** | Balance calculation now uses `date` field (not `createdAt`) for proper opening balance display. |
| **Due Badge Always Visible** | Ledger area tabs show due count badges even when retailer is selected. |
| **Sidebar + Nav Integration** | Place Order added to admin sidebar and mobile More menu. |

### v2.7.0

| Feature | Description |
|---------|-------------|
| **Due from Ledger** | All balance/due calculations use ledger collection as source of truth (not retailer_balances). |
| **Collapsible Sidebar** | Admin desktop sidebar collapses to icons on hover-out, expands on hover. |
| **Overnight Order Window** | Supports order windows that span midnight (e.g., 8PM to 2AM). |
| **Pull-to-Refresh Redesign** | New animated pull indicator with rotation and color change at threshold. |
| **Faster Transitions** | Page transitions reduced to 0.1s opacity fade. No heavy mount animations. |

---

## 📖 Additional Documentation

| Document | What it contains |
|----------|------------------|
| [README.md](README.md) | Project overview, tech stack, setup, deployment (you are here) |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | **Line-by-line file mapping** — every button, color, text kahan hai, kaise change kare. 70+ files documented. |
| [firestore.rules](firestore.rules) | **Firestore security rules** — per-collection validation, deny-all fallback. |
| `/dev/guide` (in-app) | **Developer Guide** — all 19 dev tools documented with steps, tips, FAQ, emergency procedures. |
| `/dev-console/guide.html` | **Standalone dev console guide** — accessible even if React app crashes. |

### How to read DEVELOPER_GUIDE:
1. **GitHub pe:** Directly click karo — formatted dikhega
2. **PDF chahiye:** GitHub pe file kholo → `Ctrl+P` → "Save as PDF"
3. **Phone pe:** GitHub app ya browser se padho

---
