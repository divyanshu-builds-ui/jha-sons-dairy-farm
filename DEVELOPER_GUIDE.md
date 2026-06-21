# Developer Guide — Lucy Garden v2.2.0

> Quick reference for every file, component, and feature in the Lucy Garden dairy supply management app.
> Written in plain English. No prior coding knowledge needed to make changes.

---

## Table of Contents

| Part | Section | What's Covered |
|------|---------|----------------|
| 1 | [Core Architecture](#part-1--core-architecture) | App.js, index.js, firebase.js, config.js, .env |
| 2 | [Layouts & Navigation](#part-2--layouts--navigation) | RetailerLayout, AdminLayout, DeveloperLayout |
| 3 | [Login & Authentication](#part-3--login--authentication) | Login.js, session system, PIN gate |
| 4 | [Retailer Pages](#part-4--retailer-pages) | All 14 retailer screens |
| 5 | [Admin Pages](#part-5--admin-pages) | All 13 admin screens |
| 6 | [Developer Pages](#part-6--developer-pages) | All 19 dev tool screens |
| 7 | [Shared Components](#part-7--shared-components) | Modals, footers, banners, skeletons, splash |
| 8 | [Hooks & Context](#part-8--hooks--context) | Dark mode, font size, pull-to-refresh, bottom sheet, feature flags |
| 9 | [Services & Utilities](#part-9--services--utilities) | Error logger, usage tracker, auto cleanup, PDF, price, date |
| 10 | [Firebase & Security](#part-10--firebase--security) | Firestore rules, collections, settings document |
| 11 | [Standalone Dev Console](#part-11--standalone-dev-console) | public/dev-console/ emergency tool |
| 12 | [Config Files & Quick Reference](#part-12--config-files--quick-reference) | package.json, tailwind, cheat sheets |

---

## Part 1 — Core Architecture

### How the app works (big picture)

```
User opens app on phone/browser
        ↓
index.js renders <App /> into public/index.html
        ↓
App.js checks: Is user logged in? (localStorage)
        ↓
    NO → Show Login page
    YES → Check role (retailer / admin / developer)
        ↓
Route to correct layout + pages
        ↓
Pages call firebase.js to read/write data
        ↓
Firebase Firestore (Google cloud) stores everything
```

There is NO backend server. The React app talks directly to Firebase.

---

### File: `src/index.js` — Entry Point

This file starts the entire app. It renders the root React component into the HTML page.

```
What it does:
- Imports App.js
- Wraps it in RootErrorBoundary (catches fatal crashes)
- Renders into <div id="root"> in public/index.html
```

You will never need to edit this file.

---

### File: `src/App.js` — The Brain

This is the most important file. It decides what the user sees.

**What it does:**
1. Shows splash screen for 1.5 seconds (3.2s during first week after launch)
2. Checks if user is logged in (reads `lg_user` from localStorage)
3. Verifies session with Firebase (is it still valid? expired? killed from another device?)
4. Listens for maintenance mode in real-time
5. Routes to correct layout based on role

**Key constants:**
| Name | Value | Purpose |
|------|-------|---------|
| `DEV_PHONE` | `'8051725780'` | Developer's phone number — bypass Firebase checks |

**Initialization (runs once on app start):**
| Function | What it does |
|----------|-------------|
| `initErrorTracking()` | Starts listening for JS errors and logging them to Firebase |
| `runAutoCleanup()` | Deletes old data (errors 7 days, others 1 year) — runs once per day |
| `initUsageTracking()` | Counts Firestore reads/writes locally, syncs every 5 minutes |

**Session verification flow:**
1. Read `lg_user` from localStorage
2. If phone is DEV_PHONE → skip Firebase check, trust local data
3. Otherwise → fetch user doc from `users/{phone}` in Firestore
4. Check `activeSession` matches stored sessionId (retailers only — admin skips this)
5. Check `sessionExpiry` hasn't passed
6. If anything fails → clear localStorage, show Login

**Real-time listeners:**
| Listener | Purpose |
|----------|---------|
| `settings/app` → `maintenance` field | If true, show MaintenancePage to retailers |
| `users/{phone}` → `activeSession` field | If changed, kick retailer out (another device logged in) |

**Route structure:**

| URL Pattern | Layout | Role Required |
|-------------|--------|---------------|
| `/` and sub-routes | RetailerLayout | retailer |
| `/admin` and sub-routes | AdminLayout | admin or dev |
| `/dev` and sub-routes | DeveloperLayout | dev only |
| `*` (anything else) | — | Shows NotFound page |

**Full route list:**

Retailer routes (inside `/`):
| Path | Component | Page |
|------|-----------|------|
| `/` | RetailerHome | Dashboard |
| `/order` | PlaceOrder | Product selection |
| `/checkout` | Checkout | Order confirmation |
| `/track` | TrackOrder | Today's order status |
| `/history` | OrderHistory | Past orders |
| `/my-ledger` | MyLedger | Payment history |
| `/profile` | RetailerProfile | User info |
| `/support` | Support | Help tickets |
| `/settings` | Settings | Preferences |
| `/prices` | PriceList | All product prices |
| `/about` | About | About company |
| `/privacy` | PrivacyPolicy | Privacy policy |
| `/terms` | Terms | T&C |
| `/guide` | Guide | User guide |
| `/blocked` | Blocked | Account suspended page (only for blocked users) |

Admin routes (inside `/admin`):
| Path | Component | Page |
|------|-----------|------|
| `/admin` | AdminDashboard | Home |
| `/admin/retailers` | AdminRetailers | Manage retailers |
| `/admin/orders/:id` | OrderDetail | Single order |
| `/admin/inventory` | AdminInventory | Products CRUD |
| `/admin/ledger` | AdminLedger | Payment ledger |
| `/admin/settings` | AdminSettings | Business config |
| `/admin/areas` | Areas | Delivery areas |
| `/admin/daily-ledger` | DailyLedger | Daily order sheet |
| `/admin/company-order` | CompanyOrder | Company summary |
| `/admin/support` | SupportTickets | Ticket management |
| `/admin/sessions` | AdminSessions | User sessions |
| `/admin/guide` | AdminGuide | Admin guide |

Developer routes (inside `/dev`):
| Path | Component | Page |
|------|-----------|------|
| `/dev` | DevPanel | Health dashboard |
| `/dev/errors` | ErrorLogs | Crash logs |
| `/dev/sessions` | UserSessions | Active users |
| `/dev/analytics` | OrderAnalytics | Order stats |
| `/dev/activity` | RetailerActivity | Who's active |
| `/dev/deploy` | DeployInfo | Version & performance |
| `/dev/announce` | Announcements | Send banners |
| `/dev/cleanup` | DatabaseCleanup | Delete old data |
| `/dev/flags` | FeatureFlags | Toggle features |
| `/dev/audit` | AuditLog | Action history |
| `/dev/ratings` | AppRatings | User ratings |
| `/dev/revenue` | RevenueDashboard | Revenue charts |
| `/dev/notifications` | NotificationCenter | Live notifications |
| `/dev/export` | DataExport | Export data |
| `/dev/backup` | BackupRestore | Backup & restore |
| `/dev/api-monitor` | ApiResponseMonitor | Latency tester |
| `/dev/realtime` | RealtimeDashboard | Live feed |
| `/dev/tasks` | ScheduledTasks | Maintenance jobs |
| `/dev/config-diff` | ConfigDiff | Config comparison |
| `/dev/guide` | DevGuide | Dev documentation |

**Common changes:**
| What you want to change | Where |
|--------------------------|-------|
| Splash screen duration | Line with `setTimeout(() => setSplashDone(true), 1500)` — change 1500 (milliseconds) |
| Developer phone number | `const DEV_PHONE = '8051725780'` |
| Maintenance page phone | Search `tel:+919939079107` |
| Add a new page | 1) Create file in pages/ folder, 2) Import with `lazy()` at top, 3) Add route in router |

---

### File: `src/services/firebase.js` — Database Connection

Connects the app to Firebase (Google's cloud database). Every page imports from here.

**What it does:**
1. Reads API keys from `.env` file
2. Initializes Firebase app
3. Creates Firestore database connection
4. Wraps all read/write functions with a usage counter (tracks operations locally)
5. Exports everything that pages need

**Exported functions:**
| Function | What it does | Tracked as |
|----------|-------------|------------|
| `getDoc()` | Read one document | read |
| `getDocs()` | Read multiple documents | read |
| `addDoc()` | Create new document | write |
| `setDoc()` | Create or overwrite document | write |
| `updateDoc()` | Update existing document | write |
| `deleteDoc()` | Delete a document | delete |
| `collection()` | Reference to a collection | — |
| `doc()` | Reference to a document | — |
| `query()` | Build a query | — |
| `where()` | Filter condition | — |
| `orderBy()` | Sort condition | — |
| `onSnapshot()` | Real-time listener | — |
| `serverTimestamp()` | Firebase server time | — |
| `arrayUnion()` | Add to array field | — |
| `writeBatch()` | Batch multiple writes | — |
| `deleteField()` | Remove a field | — |

**Usage tracking:** Every read/write/delete increments a counter in localStorage (`lg_usage_today`). This is synced to Firebase every 5 minutes by `usageTracker.js`.

**Never change this file** unless you're switching Firebase projects or adding new Firestore functions.

---

### File: `src/utils/config.js` — Central Configuration

Single source of truth for app identity. Every page reads from here.

```js
export const APP_CONFIG = {
  version: '2.2.0',
  appName: 'Lucy Garden',
  tagline: 'Fresh Dairy Supply',
  developer: {
    name: 'Divyanshu Gupta',
    portfolio: 'https://portfolio-divyanshu-git.vercel.app',
  },
  phone: '9939079107',
};
```

**Where this data appears:**
- Retailer Settings → About section
- Retailer About page
- Admin Settings page
- DevPanel (App Health)
- DeployInfo page
- DeveloperLayout header
- AppFooter (all pages)

**To change version:** Edit ONLY `version: '2.1.0'` here. All pages auto-update.

**To change shop phone:** Edit `phone: '9939079107'` here. Footer and About pages update automatically. (Support page reads from Firebase `settings/app.shopPhone` separately.)

---

### File: `.env` — Secret Keys

Contains Firebase API credentials. Located in project root.

```
REACT_APP_FIREBASE_API_KEY=<api_key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<auth_domain>
REACT_APP_FIREBASE_PROJECT_ID=<project_id>
REACT_APP_FIREBASE_STORAGE_BUCKET=<storage_bucket>
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<sender_id>
REACT_APP_FIREBASE_APP_ID=<app_id>
```

**Rules:**
- NEVER share this file publicly
- NEVER commit to GitHub (already in .gitignore)
- If you switch Firebase projects, update these values
- App won't work without this file

---

### File: `src/index.css` — Global Styles

Imports Tailwind CSS and defines global styles.

```
What it includes:
- Tailwind base, components, utilities
- Custom scrollbar styles
- Font size classes (font-small, font-normal, font-large)
- Dark mode base styles
- Shimmer animation keyframe for loading skeletons
```

You rarely need to edit this. Most styling is done with Tailwind classes directly in components.

---

*End of Part 1. Next: Part 2 — Layouts & Navigation*



---

## Part 2 — Layouts & Navigation

Layouts are wrapper components that stay visible while the inner page content changes. They provide the shell — header, sidebar, bottom navigation, and footer.

---

### File: `src/components/layout/RetailerLayout.js` — Retailer Shell

**What it provides:**
- Desktop: Left sidebar (260px) with all nav links + main content area
- Mobile: Top gradient header + bottom floating nav bar + "More" bottom sheet
- Real-time announcement banner (from Firebase `settings/banner`)
- Pull-to-refresh gesture support
- Dark mode and font size toggles in header
- Logout with confirmation modal

**Sidebar links (desktop — also used in mobile "More" sheet):**
| Label | Route | Icon | Feature Flag |
|-------|-------|------|-------------|
| Home | `/` | Home | — |
| Place Order | `/order` | ShoppingCart | — |
| My Orders | `/track` | Package | — |
| Order History | `/history` | History | — |
| Price List | `/prices` | IndianRupee | — |
| My Ledger | `/my-ledger` | BookOpen | `ledgerView` |
| Profile | `/profile` | User | — |
| Settings | `/settings` | Settings | — |
| Support | `/support` | Headphones | `supportTickets` |
| User Guide | `/guide` | GraduationCap | — |

**Bottom nav (mobile — always visible):**
| Button | Route | Icon |
|--------|-------|------|
| Home | `/` | Home |
| Order | `/order` | ShoppingCart |
| Track | `/track` | Package |
| Prices | `/prices` | IndianRupee |
| Ledger | `/my-ledger` | BookOpen |
| More | (opens bottom sheet) | MoreHorizontal |

**Feature flags:** If a link has a `flag` property (like `ledgerView` or `supportTickets`), it only shows when that flag is not set to `false` in Firebase `settings/featureFlags`.

**Announcement banner:**
- Listens to `settings/banner` document in real-time
- Shows if: `active` is true, `message` exists, not expired, target includes 'retailers' or 'all'
- Types: `urgent` (red), `warning` (amber), `success` (green), `info` (blue)
- Dismissible — stores dismissed banner ID in localStorage

**Key behaviors:**
- Bottom nav hides when scrolling down, reappears when scrolling up
- Header gets shadow when scrolled
- Page transitions trigger TopProgressBar animation
- Content wrapped in Suspense (shows skeleton while lazy page loads)
- Footer component rendered after main content

**Common changes:**
| What | Where to look |
|------|---------------|
| Add/remove nav link | `navItems` array at top of file |
| Change bottom nav buttons | `bottomNav` array |
| Change "More" sheet links | `moreLinks` array |
| Header gradient color | Search `from-royal-700 via-royal-600 to-mint-700` |
| Logo | Replace `src/assets/logo.png` |
| Banner colors | Search `banner.type === 'urgent'` block |

---

### File: `src/components/layout/AdminLayout.js` — Admin Shell

**What it provides:**
- Desktop: Dark sidebar (`#0f172a`) with nav + main content
- Mobile: Dark header + bottom nav + "More" bottom sheet
- "Dev Panel" button in sidebar (only visible to developer phone)
- Same banner system as RetailerLayout
- Pull-to-refresh, dark mode, font size

**Sidebar links:**
| Label | Route | Icon |
|-------|-------|------|
| Dashboard | `/admin` | LayoutDashboard |
| Retailers | `/admin/retailers` | Users |
| Daily Sheet | `/admin/daily-ledger` | ShoppingBag |
| Company Order | `/admin/company-order` | Truck |
| Inventory | `/admin/inventory` | Warehouse |
| Ledger | `/admin/ledger` | BookOpen |
| Areas | `/admin/areas` | MapPin |
| Tickets | `/admin/support` | Headphones |
| Settings | `/admin/settings` | Settings |
| Guide | `/admin/guide` | GraduationCap |

**Bottom nav (mobile):**
| Button | Route |
|--------|-------|
| Home | `/admin` |
| Daily | `/admin/daily-ledger` |
| Company | `/admin/company-order` |
| Ledger | `/admin/ledger` |
| More | (opens sheet) |

**Dev Panel access:** If logged-in phone is `8051725780`, a green "Dev Panel" button appears at bottom of sidebar. It navigates to `/dev` using full page navigation (`window.location.href`).

**Dev verification:** When a developer accesses admin panel, it checks `sessionStorage` for `lg_dev_verified`. If missing or expired, redirects to `/dev` (forces PIN re-entry).

**Common changes:**
| What | Where |
|------|-------|
| Sidebar links | `sidebarLinks` array |
| Bottom nav | `bottomNavLinks` array |
| Sidebar background | Search `from-[#0f172a] via-[#1e293b] to-[#0f172a]` |
| "Admin Console" label | Search `Admin Console` |
| User card name | Reads from `localStorage lg_user → name` |

---

### File: `src/components/layout/DeveloperLayout.js` — Developer Shell

**What it provides:**
- PIN gate (must enter developer PIN before accessing any dev page)
- Desktop: Black/green sidebar with all 20 dev tool links
- Mobile: Minimal dark header with "Live" indicator + bottom nav
- "Open Admin Panel" button in sidebar
- No banner system (dev doesn't need announcements)

**PIN Gate (shown first):**
- Checks `sessionStorage` for `lg_dev_verified` with valid expiry
- If not found → shows dark PIN entry screen with numpad
- PIN loaded from Firebase `settings/devAccess.pin` (fallback: `0000`)
- Session lasts 1 hour (`DEV_SESSION_DURATION = 60 * 60 * 1000`)
- 5 wrong attempts → force logout (clears all storage, reloads)
- After verification, stores `{ expiry: timestamp }` in sessionStorage

**Sidebar links (all 20 dev tools):**
| Label | Route | Icon |
|-------|-------|------|
| Dev Panel | `/dev` | Server |
| Error Logs | `/dev/errors` | Bug |
| Sessions | `/dev/sessions` | Radio |
| Analytics | `/dev/analytics` | BarChart3 |
| Retailer Activity | `/dev/activity` | UserCheck |
| Deploy Info | `/dev/deploy` | Rocket |
| Announcements | `/dev/announce` | Megaphone |
| DB Cleanup | `/dev/cleanup` | Database |
| Feature Flags | `/dev/flags` | Flag |
| Audit Log | `/dev/audit` | ScrollText |
| App Ratings | `/dev/ratings` | Star |
| Revenue | `/dev/revenue` | IndianRupee |
| Notifications | `/dev/notifications` | Bell |
| Data Export | `/dev/export` | Download |
| Backup & Restore | `/dev/backup` | HardDrive |
| API Monitor | `/dev/api-monitor` | Wifi |
| Real-time | `/dev/realtime` | Zap |
| Scheduled Tasks | `/dev/tasks` | Clock |
| Config Diff | `/dev/config-diff` | GitCompare |
| Dev Guide | `/dev/guide` | BookOpen |

**Bottom nav (mobile):**
| Button | Route |
|--------|-------|
| Health | `/dev` |
| Errors | `/dev/errors` |
| Sessions | `/dev/sessions` |
| Analytics | `/dev/analytics` |
| More | (opens sheet with remaining 16 tools) |

**Visual theme:**
- Background: `#0a0a0a` (near black)
- Sidebar: gradient from `#0f0f0f` to `#0a0a0a`
- Accent: green-500 / emerald-700
- Active link: green gradient
- "Live" pulse dot in header

**Common changes:**
| What | Where |
|------|-------|
| Dev tool links | `devLinks` array |
| "More" sheet links | `moreLinks` array |
| Sidebar theme | Search `from-[#0f0f0f]` |
| Developer name | Search `Divyanshu Gupta` |
| PIN timeout | `DEV_SESSION_DURATION` constant (milliseconds) |
| Add new dev page | Add to `devLinks` array + create page + add route in App.js |

---

*End of Part 2. Next: Part 3 — Login & Authentication*



---

## Part 3 — Login & Authentication

---

### File: `src/pages/Login.js` — Login Page

**When it shows:** When no user is logged in (no `lg_user` in localStorage).

**Two-step login flow:**
1. **Step 1 — Phone number:** User enters 10-digit phone number → "Continue" button
2. **Step 2 — PIN entry:** 4-dot PIN display + numpad (1-9, 0, backspace)

**How authentication works:**
1. User enters phone → checks if document exists in `users/{phone}` collection
2. If phone is `DEV_PHONE` (8051725780) → special dev flow (checks Firebase `settings/devAccess.pin`)
3. If phone not found → error "Account not found"
4. If phone found → show PIN screen
5. User enters 4-digit PIN → compared with `pin` field in user document
6. If wrong → error + lockout counter
7. If correct → create session, save to localStorage + Firebase

**Session creation (on successful login):**
- Generates unique `sessionId` using `crypto.randomUUID()` or timestamp fallback
- Calculates `sessionExpiry` based on `settings/app.sessionTimeout` (default 24 hours)
- Saves to Firebase `users/{phone}`: `activeSession`, `sessionExpiry`
- Saves to localStorage as `lg_user`: full user object + sessionId + sessionExpiry
- Updates `lastLogin`, `deviceInfo`, `lastLoginDevice` in Firebase

**Session conflict (retailers only):**
- If user already has an active session on another device → shows "Active Session Detected" popup
- Options: "Terminate & Login" (kills old session, starts new) or "Cancel"
- Admin users SKIP this check — multi-device login allowed

**Progressive lockout system:**
| Wrong attempts | Lockout duration |
|----------------|-----------------|
| 5 | 60 seconds |
| 10 | 5 minutes |
| 15 | 30 minutes |
| 20+ | Permanent block |

- Blocked accounts show error and can only be unblocked from Admin Sessions page
- `blocked: true` field set in Firebase user document

**Developer login special case:**
- Phone `8051725780` → PIN checked against `settings/devAccess.pin` (not user document)
- No session conflict check
- Session created with dev role
- After login, still must pass DeveloperLayout's PIN gate to access dev tools

**Key UI elements:**
| Element | Description |
|---------|-------------|
| Background | Dark blue gradient (`from-royal-950 via-royal-900 to-royal-800`) |
| Logo | `src/assets/logo.png` — top center |
| "Lucy Garden" title | White, bold |
| "Fresh Dairy Supply" subtitle | Mint-400 color |
| "+91" prefix | Before phone input |
| PIN dots | 4 circles — filled with gradient when digit entered |
| Numpad | 3x4 grid (1-9, empty, 0, backspace) |
| "Verifying..." | Spinner shown during Firebase check |
| Developer credit | Bottom: "Developed with ♥ by Divyanshu Gupta" |

**Common changes:**
| What | Where |
|------|-------|
| Logo | Replace `src/assets/logo.png` |
| "Lucy Garden" text | Search `>Lucy Garden<` |
| "Fresh Dairy Supply" text | Line after logo |
| Background color | Search `from-royal-950 via-royal-900 to-royal-800` |
| Developer phone | `const DEV_PHONE = '8051725780'` (also in App.js) |
| "+91" prefix | Search `+91` |
| Continue button color | Search `from-royal-700 via-royal-600 to-mint-700` |
| Developer credit text | Search `Developed with` |

---

### Three User Roles

| Role | How assigned | Home URL | Access |
|------|-------------|----------|--------|
| Retailer | `role: 'retailer'` in Firebase `users/{phone}` | `/` | Order, track, ledger, support |
| Admin | `role: 'admin'` in Firebase `users/{phone}` | `/admin` | Full business management |
| Developer | Phone is `8051725780` | `/dev` | Everything + dev tools |

**Key differences:**
| Feature | Retailer | Admin | Developer |
|---------|----------|-------|-----------|
| Multi-device login | No (kicks old session) | Yes | Yes |
| Maintenance mode blocks | Yes | No | No |
| Session monitored in real-time | Yes | No | No (uses dev PIN gate instead) |
| Can access admin panel | No | Yes | Yes |
| Can access dev tools | No | No | Yes |

---

### Session System Technical Details

**localStorage key:** `lg_user`

**Stored object:**
```json
{
  "phone": "9876543210",
  "name": "Retailer Name",
  "role": "retailer",
  "shop": "Shop Name",
  "area": "Area Name",
  "pin": "1234",
  "sessionId": "uuid-string",
  "sessionExpiry": "2026-06-16T10:30:00.000Z"
}
```

**Firebase user document fields (session-related):**
| Field | Type | Purpose |
|-------|------|---------|
| `activeSession` | string | Current session UUID |
| `sessionExpiry` | string (ISO) | When session expires |
| `lastLogin` | string (ISO) | Last login timestamp |
| `deviceInfo` | string | User agent (max 200 chars) |
| `lastLoginDevice` | string | Parsed: "Android", "iPhone", "Windows PC", etc. |
| `blocked` | boolean | If true, login rejected |

**Session expiry check:** Runs every 5 minutes via `setInterval` in App.js. If expired → clears localStorage, reloads page.

**Real-time session kick (retailers only):** App.js uses `onSnapshot` on `users/{phone}`. If `activeSession` changes to a different value → another device logged in → clear localStorage and reload.

---

*End of Part 3. Next: Part 4 — Retailer Pages*



---

## Part 4 — Retailer Pages

All files in `src/pages/retailer/`. These are what shop owners see after login.

---

### File: `Home.js` — Retailer Dashboard (`/`)

**What it shows:**
- Welcome card with greeting ("Good Morning, [Name]!") + shop name
- Due amount box (red) with "View Ledger" link
- Quick action buttons: "New Order" + "My Ledger"
- Today's order status card (or "No order placed yet — Tap to place order")
- This month stats: Orders count, Purchased amount, Paid amount
- Recent orders list (last 4 orders)
- Delivery schedule info ("6 AM - 12 PM delivery, 12-4 PM order window")
- Balance cards: "Udhaar" (due) + "Last Payment"

**Data sources:**
- User info: localStorage `lg_user`
- Balance: `retailer_balances/{phone}`
- Today's order: `orders` collection filtered by phone + today's date
- Monthly stats: `orders` + `ledger` for current month
- Recent orders: last 4 from `orders` by phone

**Common changes:**
| What | Where |
|------|-------|
| Greeting text | `getGreeting()` function — returns morning/afternoon/evening |
| Welcome card gradient | Search `from-royal-800 via-royal-700 to-royal-600` |
| Delivery schedule times | Search `6:00 AM` and `12:00 PM` |
| "Udhaar" text | Search `Udhaar` |

---

### File: `PlaceOrder.js` — Product Selection (`/order`)

**What it shows:**
- Search bar for products
- Cutoff banner (amber) if outside order window: "Order window: 12 PM - 4 PM only"
- Due warning (red) if previous balance exists
- Daily Products section (dark header) with product rows
- Seasonal Products section (amber header) — only if `seasonalProducts` flag is not false
- Each product row: name, price per unit, +/- buttons, quantity input
- Floating cart bar at bottom: item count + total + "Checkout →" button

**Order rules enforced here:**
| Rule | Source | Behavior |
|------|--------|----------|
| Order window | `settings/app.orderStart` and `orderEnd` | Outside window → "Closed" button, can't proceed |
| Max items per order | `settings/app.maxOrderItems` | + button disabled when limit reached, shows toast |

**Data sources:**
- Products: `products` collection (filtered by `active: true`)
- Settings: `settings/app` (orderStart, orderEnd, maxOrderItems)
- Balance: `retailer_balances/{phone}`
- Feature flags: `settings/featureFlags.seasonalProducts`

**Common changes:**
| What | Where |
|------|-------|
| Search placeholder | Search `Search products` |
| Cutoff message | Search `Order window:` |
| Cart button color | Search `from-royal-700 via-royal-600 to-mint-700` near Checkout |
| +/- button colors | `bg-red-50` (minus), `bg-royal-50` (plus) |
| "Daily Products" header text | Search `Daily Products` |
| "Seasonal Products" header | Search `Seasonal Products` |

---

### File: `Checkout.js` — Order Confirmation (`/checkout`)

**What it shows:**
- Back button + "Checkout" heading
- Order items list (name, qty, price per item, total per item)
- Bill summary: Order total + Previous due + Total due
- Duplicate order warning (if already ordered for tomorrow)
- "Place Order" button
- Success screen after placing (full page green animation)

**Order rules enforced here:**
| Rule | Source | Behavior |
|------|--------|----------|
| Min order amount | `settings/app.minOrderAmount` | Warning banner + disabled Place Order button |
| Allow modify | `settings/app.allowModify` | If false + duplicate exists → hides "Replace Order", shows "Contact admin" |
| Duplicate check | `orders` where phone + tomorrow date | Shows warning with option to "Add to Existing Order" |

**What happens on "Place Order":**
1. Creates document in `orders` collection with: phone, items, total, status='pending', date (tomorrow), timestamp
2. Updates `retailer_balances/{phone}` — adds order amount to balance
3. Creates `ledger` entry (debit)
4. Shows success animation
5. Navigates to track page after 2 seconds

**Common changes:**
| What | Where |
|------|-------|
| "Place Order" button color | Search `from-royal-700 via-royal-600 to-mint-700` |
| Success message | Search `Order Placed` |
| "Delivery tomorrow morning" text | After success heading |
| Duplicate warning text | Search `already have an order` |

---

### File: `TrackOrder.js` — Order Tracking (`/track`)

**What it shows:**
- Date picker (select date to view order)
- Status badge: Pending (amber) → Dispatched (blue) → Delivered (green)
- **"Dispatch Slip"** download button (blue gradient) — only when Dispatched
- **"Invoice"** download button (green gradient) — only when Delivered
- Cancel Order button (red) — only when Confirmed/Pending (before dispatch)
- Order total card + item count
- Product cards grid (small cards with quantity)
- Full order details list (name, qty, rate, amount)
- "No order on this date" empty state

**Two separate PDF designs (generated with jsPDF):**

| PDF | Status | Theme | Header Color | Key Differences |
|-----|--------|-------|-------------|------------------|
| Dispatch Slip | Dispatched | Blue (royal-700: #0136e4) | Dark blue band | "ON THE WAY" badge, "Deliver To:" box, italic note: *"Quantities may be adjusted upon delivery"* |
| Final Invoice | Delivered | Green (mint-700: #17a966) | Green band | "DELIVERED" badge, "Bill To:" box, delivery timestamp shown, "Thank you for your order!" note |

**Both PDFs share:**
- "LUCY GARDEN" heading + shop phone
- Customer info box (name, phone, shop)
- Items table: #, Item, Qty, Rate, Amt (alternating row colors matching theme)
- Total row (same color as header)
- Footer with generation timestamp

**Data logic:** If `actualItems`/`actualTotal` exist (admin edited quantities) → uses those. Otherwise uses original `items`/`total`.

**File names:** `LG_DispatchSlip_DATE_NAME.pdf` and `LG_Invoice_DATE_NAME.pdf`

**Data source:** `orders` collection filtered by phone + selected date

**Common changes:**
| What | Where |
|------|-------|
| Dispatch Slip colors | `downloadDispatchSlipPDF` function — search `setFillColor(1, 54, 228)` |
| Invoice colors | `downloadInvoicePDF` function — search `setFillColor(23, 169, 102)` |
| Dispatch Slip note text | Search `Quantities may be adjusted` |
| Invoice thank you text | Search `Thank you for your order` |
| Dispatch button color | Search `from-blue-700 to-blue-600` |
| Invoice button color | Search `from-mint-700 to-mint-600` |
| Status badge colors | `statusConfig` object |

---

### File: `OrderHistory.js` — Past Orders (`/history`)

**What it shows:**
- List of all past orders for this retailer
- Each entry: date, item count, total amount, status badge
- Click to expand and see item details
- Pull-to-refresh supported

**Data source:** `orders` collection filtered by phone, ordered by date descending

---

### File: `MyLedger.js` — Payment History (`/my-ledger`)

**What it shows:**
- Current balance (due amount) at top
- Date range filter (From - To)
- Ledger table: Date, Opening Balance, Debit (orders), Credit (payments), Closing Balance
- Each row shows daily financial movement
- Color coded: red for due, green for paid/credit

**Data sources:**
- Balance: `retailer_balances/{phone}`
- Ledger entries: `ledger` collection filtered by retailerId + date range

**Only visible if** `ledgerView` feature flag is not false.

---

### File: `PriceList.js` — Product Prices (`/prices`)

**What it shows:**
- Search bar
- Products grouped by type (Daily / Seasonal)
- Sub-groups with colored headers (product groups from Firebase)
- Each product: name, unit, price
- "Download Price List" button → generates formatted PDF

**PDF contains:**
- Dark header with "LUCY GARDEN" + "PRICE LIST" + date
- Table: #, Product, Unit, Price
- Alternating row colors
- Footer with generation timestamp

**Data source:** `products` collection (all active products)

---

### File: `Profile.js` — User Profile (`/profile`)

**What it shows:**
- Avatar (first letter of name in colored circle)
- Name, Phone (+91 format), Shop name, Area
- Last login time + device
- Order stats: total orders, total spent
- All fields are READ-ONLY (admin changes them)

**Data sources:**
- User info: localStorage `lg_user`
- Stats: `orders` collection filtered by phone

---

### File: `Settings.js` — Retailer Settings (`/settings`)

**What it shows:**
- Dark mode toggle
- Font size selector (Small / Normal / Large)
- Change PIN section (current PIN → new PIN → confirm new PIN)
- Install App button (shows PWA install prompt)
- About section: version, developer name, location

**PIN change flow:**
1. Enter current PIN → validate against Firebase
2. Enter new PIN (4 digits)
3. Confirm new PIN
4. Update `pin` field in `users/{phone}`

**Common changes:**
| What | Where |
|------|-------|
| Version number | Reads from `APP_CONFIG.version` (config.js) |
| Developer name | Reads from `APP_CONFIG.developer.name` |
| Location text | Search for address text |

---

### File: `Support.js` — Help & Tickets (`/support`)

**What it shows:**
- Header card with "How can we help?" text
- Two tabs: "New Ticket" / "My Tickets"
- New Ticket: subject dropdown + message textarea + Submit button
- Success screen after submission
- My Tickets: list with subject, date, status badge, message thread
- Reply input on each open ticket
- WhatsApp button + Call button (uses `shopPhone` from Firebase settings)
- Schedule info section

**Only visible if** `supportTickets` feature flag is not false.

**Data source:** `support_tickets` collection filtered by phone

**Subject options:** Delivery Issue, Payment Query, Product Quality, Order Issue, App Issue, Other

---

### File: `Guide.js` — User Guide (`/guide`)

**What it shows:**
- Accordion-style step-by-step guide
- Sections: Install App, Place Order, Track Order, View Ledger, Raise Support, Order History
- Each section expandable with numbered steps
- FAQ section at bottom

All content is hardcoded text (no Firebase dependency).

---

### File: `About.js` — About Page (`/about`)

**What it shows:**
- App name + tagline + version (from `APP_CONFIG`)
- About Us section
- Our Mission section
- What We Offer (bullet list)
- Contact info (phone + delivery hours)
- Developer credit with portfolio link

---

### File: `PrivacyPolicy.js` — Privacy Policy (`/privacy`)

**What it shows:**
- 8 sections covering data collection, usage, storage, cookies, rights
- Phone number from `APP_CONFIG.phone`
- Auto-generated "last updated" date

---

### File: `Terms.js` — Terms & Conditions (`/terms`)

**What it shows:**
- 11 sections covering acceptance, accounts, orders, delivery, pricing, ledger, termination
- All text reads from `APP_CONFIG`
- Auto-generated "last updated" date

---

*End of Part 4. Next: Part 5 — Admin Pages*



---

## Part 5 — Admin Pages

All files in `src/pages/admin/`. Accessible by admin role and developer.

---

### File: `Dashboard.js` — Admin Home (`/admin`)

**What it shows:**
- Greeting with owner name (dynamically from localStorage)
- Today's stats cards: Total Orders, Delivered, Order Value, Collected
- **Premium Donut Ring Chart** — animated SVG delivery progress (always visible)
  - Mint-500 arc = delivered orders
  - Amber-400 arc = pending orders
  - Center: bold percentage + "complete" label
  - Right side: breakdown stats with mini progress bars + total count
  - **Always visible** — shows 0% empty ring when no orders (never hidden)
- Pending Dues cards: Total Udhaar + Overdue (>5K)
- Quick action buttons: Daily Sheet, Ledger, Retailers, **Report PDF download**
- Product Demand summary (today's top ordered products)
- Top Defaulters with WhatsApp reminder buttons

**Report PDF ("Daily Business Report"):**
- Dark header band with "LUCY GARDEN" + "DAILY BUSINESS REPORT" + date
- Summary cards row: Orders, Order Value, Collected, Pending Due
- Overview box: Total Retailers, Total Pending, Overdue count
- Delivery progress bar (if orders exist)
- Product Demand table
- Top Defaulters table (name, phone, due amount in red)
- Confidential footer

**Data sources:**
- Today's orders: `orders` where date = today
- Retailer count: `users` where role = 'retailer'
- Balances: `retailer_balances` collection
- Collections: `ledger` where type = 'credit' and date = today

**Common changes:**
| What | Where |
|------|-------|
| Donut chart colors | Search `stroke-mint-500` (delivered) and `stroke-amber-400` (pending) |
| Donut size | `w-28 h-28` on the container div |
| Report PDF header | Search `DAILY BUSINESS REPORT` |
| Greeting logic | `getGreeting()` function |
| Quick action icons | In the `grid grid-cols-3` section |

---

### File: `DailyLedger.js` — Daily Order Sheet (`/admin/daily-ledger`)

**The most-used admin page.** Shows all retailer orders for a selected date in table format.

**What it shows:**
- Date picker + Area dropdown filter + Search input + Refresh button
- Daily PDF button (black) + Seasonal PDF button (amber, only when seasonal orders exist) + Excel/CSV button (green)
- **"Dispatch All (X)"** button — bulk dispatch all pending orders in one click
- Main table: retailer name rows × product quantity columns
- Table headers show `GROUP NAME (CODE)` format
- Products sorted by size (parseToGrams) within each group column
- Per-row actions: Dispatch (green) / Deliver (blue) / Cancel (red X) / Return (amber) / Undo (gray)
- Seasonal products table (separate, if applicable)
- Status indicators: "✓ Done", "Cancelled", "Returned"

**Order actions:**
| Action | When available | What it does |
|--------|---------------|-------------|
| Dispatch | Pending/Confirmed orders | Sets status to Dispatched, saves actual quantities |
| Deliver | Dispatched orders | Sets Delivered, collects payment, updates ledger |
| Cancel | Pending/Confirmed orders | Sets Cancelled with timestamp |
| Return | Dispatched orders | Sets Returned (stock back) |
| Undo Dispatch | Dispatched orders | Reverts to Confirmed, removes dispatch data |
| Bulk Dispatch | Multiple pending orders | Dispatches all with ordered qty |

**Daily PDF:** A4 Landscape grid — group codes as headers, products sorted by size, retailer rows.

**Seasonal PDF:** A4 Portrait list format — each retailer as a block with grouped items inline. Only generates when seasonal orders exist.

**Common changes:**
| What | Where |
|------|-------|
| PDF button | Search `PDF` |
| Table header color | `bg-[#0f172a]` |
| Dispatch button color | `bg-mint-600` or similar green |
| Deliver button color | `bg-blue-600` |
| "✓ Done" text | Search `✓ Done` |

---

### File: `Retailers.js` — Manage Retailers (`/admin/retailers`)

**What it shows:**
- Search bar (name, phone, area)
- "Add" button (gradient blue)
- Retailer cards grid: name, area, balance badge (red=due, green="Clear")
- Click card → detail modal with full info
- Detail modal: all fields + edit mode + order history + delete

**Features:**
- Edit retailer: name, shop, area, PIN, phone
- Phone change: transfers all data (orders, ledger, balance) to new phone document
- Delete: with confirmation, removes all associated data
- Shows last login date + device under name
- New retailer gets default PIN from `settings/app.defaultPin`

**Data sources:**
- Users: `users` collection where role = 'retailer'
- Balances: `retailer_balances` collection

**Common changes:**
| What | Where |
|------|-------|
| "Add" button color | Search `from-royal-700 via-royal-600 to-mint-700` |
| "Clear" badge | `text-mint-600 bg-mint-50` |
| Due badge | `text-red-500 bg-red-50` |
| Delete button | `text-red-600 bg-red-50 border-red-200` |

---

### File: `Inventory.js` — Product Management (`/admin/inventory`)

**What it shows:**
- Search bar + "Add Product" button (blue) + "Bulk Price" button (amber) + "Groups" button
- Product count badge: `12/20 daily • 8 seasonal`
- Daily Products table: SI, Name, Group (with PDF Code), Label, Price, Unit, Actions
- Seasonal Products table (amber header)
- Edit/Hide buttons per product
- Add/Edit modal: Name, Price, Unit, Type (Daily/Seasonal), Group, Label (max 4 chars)
- Bulk Price modal: select group + percentage increase/decrease
- **Manage Groups modal:** Scrollable group list with inline code editing + Add New Group form (name + optional PDF Code)

**Product document fields:**
| Field | Type | Example |
|-------|------|---------|
| `name` | string | "Toned Milk 500ml" |
| `price` | number | 30 |
| `unit` | string | "pkt" / "kg" / "ltr" / "jar" / "bkt" / "tin" / "pcs" / "box" / "cup" |
| `type` | string | "daily" / "seasonal" |
| `group` | string | "TM" / "SM" / "PREMIUM DAHI" |
| `label` | string | Max 4 chars — PDF column header (e.g. "1L", "Half", "200g") |
| `active` | boolean | true/false (hidden products have active=false) |

**Product Groups (Firebase `settings/productGroups`):**
```json
{
  "daily": ["TM", "SM", "LITE DAHI", "PREMIUM DAHI", "PANEER", "GHEE"],
  "seasonal": ["SWEETS", "DRINKS"],
  "codes": { "LITE DAHI": "LD", "PREMIUM DAHI": "PD", "PANEER": "PNR" }
}
```
- Group Name: max 20 chars (shown in app UI)
- PDF Code: optional, 2-5 chars (shown in PDF headers + Daily Sheet UI)
- Order of groups = column order in Daily Sheet PDF
- Products within each group sorted by size (label parsed to grams)

**Limits:** Daily max 20 products. Seasonal unlimited (list-style PDF).

**Common changes:**
| What | Where |
|------|-------|
| Product limit | `handleSave` function → `length >= 20` check |
| Label max length | `maxLength={4}` on label input |
| Group name max | `maxLength={20}` on group name input |
| Code max | `maxLength={5}` on code input |
| Unit options | Search `<option value="pkt">` |
| Table header | `bg-[#0f172a]` |

---

### File: `Ledger.js` — Payment Ledger (`/admin/ledger`)

**What it shows:**
- Retailer search/select dropdown
- Date range filter (From - To)
- "Collect" button (green) — collect payment modal
- "Set Bal" button (amber) — override balance
- "Print" button (black) — download ledger PDF
- Per-page dropdown (10/25/50/100)
- Selected retailer info card
- Opening/Closing balance badges
- Ledger table: SI, Date, Opening, Product Amt, Seasonal Amt, Deposit, Closing
- Pagination

**Collect Payment modal:**
- Amount input + Note field
- Shows remaining due after collection
- Creates credit entry in `ledger`
- Updates `retailer_balances/{phone}`
- Logs to `audit_log`

**Set Balance modal:**
- Overrides current balance (one-time correction)
- Useful for initial setup or corrections

---

### File: `CompanyOrder.js` — Company Level Summary (`/admin/company-order`)

**What it shows:**
- Date picker
- Total company order for the day (all retailers combined)
- Product-wise total quantities
- Area-wise breakdown
- PDF export option
- "Stock Received" input (admin enters actual stock received from company)

**Data sources:**
- Orders for selected date
- `company_orders/{date}` document (if stock saved)
- `daily_stock/{date}` document

---

### File: `Areas.js` — Delivery Area Management (`/admin/areas`)

**What it shows:**
- List of all delivery areas
- Add new area: text input + Add button
- Delete area: X button with confirmation
- Area names used when adding retailers and filtering daily sheet

**Data source:** `settings/areas` document (array of area names)

---

### File: `Settings.js` — Admin Settings (`/admin/settings`)

**Layout:** 2-column grid on desktop, single column on mobile.

**Left column:**
| Section | Contents |
|---------|----------|
| Preferences | Dark mode toggle, Font size selector |
| Security | Change PIN, Maintenance mode toggle |
| Tools | Link to Active Sessions, Link to Retailers |

**Right column:**
| Section | Contents |
|---------|----------|
| Business Settings | Order window (start/end hour), Delivery window, Shop phone, Session timeout |
| Order Rules | Min order amount, Max items per order, Allow modify toggle, Default PIN |
| About | Version, Developer, Location |

**Settings saved to Firebase `settings/app`:**
| Field | Default | What it controls |
|-------|---------|-----------------|
| `maintenance` | false | Blocks retailers from accessing app |
| `orderStart` | 12 | Hour when order window opens (0-23, -1 = no limit) |
| `orderEnd` | 16 | Hour when order window closes |
| `deliveryStart` | 6 | Delivery window start |
| `deliveryEnd` | 12 | Delivery window end |
| `shopPhone` | "9939079107" | Contact number shown to retailers |
| `sessionTimeout` | 24 | Hours before auto-logout |
| `minOrderAmount` | 0 | Minimum ₹ for order (0 = no limit) |
| `maxOrderItems` | 0 | Max products per order (0 = no limit) |
| `allowModify` | true | Can retailers replace existing orders |
| `defaultPin` | "1234" | PIN assigned to new retailer accounts |
| `autoCleanup` | true | Auto-delete old data daily |

**Confirmation modals on:** Save Settings, Maintenance Toggle

---

### File: `Sessions.js` — Session Management (`/admin/sessions`)

**What it shows:**
- Stats: Active / Inactive / Never Logged counts
- Search by name, phone, area
- User list: status dot, name, role badge, BLOCKED badge, device, browser, last login time
- Actions per user: Force Logout, Unblock (if blocked), Reset PIN (to default)
- "Force Logout All" button for emergency bulk logout

**Accessed from:** Admin Settings → Tools → Active Sessions (not in main sidebar)

**What "Force Logout" does:**
- Clears `activeSession` and `sessionExpiry` in Firebase user document
- User's app will detect change via onSnapshot and reload → showing Login screen

---

### File: `SupportTickets.js` — Ticket Management (`/admin/support`)

**What it shows:**
- Stats cards: All / Open / In Progress / Resolved counts
- Filter buttons by status
- Search by retailer name, phone, or subject
- Pagination: 10 tickets per page with Prev/Next
- Ticket cards: retailer name, phone, subject, message, date, status badge
- Click → detail modal with full message thread + reply input
- Status buttons: Open → In Progress → Resolved (forward only, no going back)

**Status flow:**
- Reply auto-sets status to "In Progress"
- Loading spinner during status change
- Reply saves to `messages[]` array inside ticket document

---

### File: `OrderDetail.js` — Single Order View (`/admin/orders/:id`)

**What it shows:**
- Full order details: retailer name, phone, date, time, status
- Items list with quantities and prices
- Status timeline visualization
- Action buttons: Dispatch / Deliver (based on current status)

---

### File: `Guide.js` — Admin Guide (`/admin/guide`)

**What it shows:**
- Complete admin panel guide in accordion format
- Sections: Dashboard, Daily Sheet, Retailers, Inventory, Ledger, Company Order, Areas, Tickets, Sessions, Settings
- Each section with numbered step-by-step instructions
- FAQ section at bottom

All content is hardcoded (no Firebase dependency).

---

### File: `DevPanel.js` — App Health Monitor (`/admin/dev` or accessed from `/dev`)

**Note:** This file lives in `pages/admin/` but is actually the developer's home page (routed at `/dev`).

**What it shows:**
- System status: Firebase connection (response time in ms), Network status, Maintenance status
- Stats grid: Retailers count, Orders count, Products count, Tickets count, Ledger entries, Response time
- Quick Actions: Toggle Maintenance, Force Reload, Clear Cache, Ping Firebase
- Console log (green/red text showing actions taken)
- App Info: version, React version, screen size, memory

---

*End of Part 5. Next: Part 6 — Developer Pages*



---

## Part 6 — Developer Pages

All files in `src/pages/dev/`. Only accessible by developer (phone `8051725780`). These are monitoring, analytics, and management tools.

---

### File: `ErrorLogs.js` — Crash Logs (`/dev/errors`)

**What it shows:**
- Severity stats bar: High / Medium / Low counts
- Error list (most recent first), each expandable
- Expanded view: Error message, Stack trace, Context, User phone, URL, Timestamp
- **Suggested Fix** — green box with solution matched from known patterns
- Refresh button + "Clear All" button (with confirmation)

**Data source:** `app_errors` collection, ordered by timestamp descending

**Solution matching:** Uses `errorLogger.js` → `getErrorSolution()` to match error message against regex patterns and show fix suggestions.

---

### File: `UserSessions.js` — Active Users (`/dev/sessions`)

**What it shows:**
- Stats: Active / Inactive / Never Logged In counts
- User list with green dot (active) or gray dot (inactive)
- Each user: name, phone, area, last login time, device type, browser
- **Force Logout** button (red) — terminates single user session
- **"Force Logout All"** button — emergency logout of all users

**What Force Logout does:** Sets `activeSession` to empty string in Firebase. The user's app detects change via onSnapshot → clears localStorage → shows Login.

---

### File: `OrderAnalytics.js` — Order Statistics (`/dev/analytics`)

**What it shows:**
- Period filter: Today / 7 Days / 30 Days / 90 Days
- Stats cards: Today's orders, Average order value, Total revenue, Unique products ordered
- Status breakdown: Pending / Confirmed / Dispatched / Delivered counts
- Daily trend bar chart (orders per day)
- Peak hours bar chart (which hours get most orders)
- Top 10 products bar chart (most ordered products)

**Data source:** `orders` collection filtered by selected period

---

### File: `RetailerActivity.js` — Who's Active (`/dev/activity`)

**What it shows:**
- Filter tabs: Active / Inactive / Never / All
- Each retailer: status colored dot, name, phone, area
- Stats per retailer: last order X days ago, this week orders, 30-day orders, total spent
- Color coding: Green = active (ordered in last 7 days), Amber = slowing (7-30 days), Red = inactive (30+ days), Gray = never ordered

**Data sources:** `users` + `orders` collections

---

### File: `DeployInfo.js` — Version & Performance (`/dev/deploy`)

**What it shows:**
- Version card (big "v2.0.0" — reads from `APP_CONFIG.version`)
- Build info: React version, build date, environment, Firebase project ID
- Service Worker status (registered/not registered, PWA installable)
- Performance metrics: page load time, DOM ready, First Contentful Paint, transfer size
- Device info: screen resolution, pixel ratio, memory, CPU cores, connection type
- Deploy checklist: HTTPS, Service Worker, Manifest, Icons — each with check/cross
- "Force Update" button (unregisters service worker + clears cache + reloads)

---

### File: `Announcements.js` — Send Banners (`/dev/announce`)

**What it shows:**
- Active banner status (green "LIVE" badge if banner is currently showing)
- "Hide Banner" button (eye-off icon) — disables current banner
- New announcement form: message textarea, type dropdown, target dropdown, expiry dropdown
- Send button
- History list (past announcements) with delete option

**Types:** Info (blue), Warning (amber), Success (green), Urgent (red)
**Targets:** All Users, Retailers Only, Admin Only
**Expiry options:** 1hr, 6hr, 12hr, 24hr, 3 days, 7 days

**How it works:** Saves to both `announcements` collection (history) and `settings/banner` document (active display). Layouts listen to `settings/banner` in real-time.

---

### File: `DatabaseCleanup.js` — Delete Old Data (`/dev/cleanup`)

**What it shows:**
- Warning banner (amber): "Deleted data cannot be recovered"
- Auto-cleanup toggle (enable/disable automatic daily cleanup)
- 4 cleanup cards:
  - Old Delivered Orders (90+ days)
  - Old Ledger Entries (90+ days)
  - Resolved Tickets (30+ days)
  - Error Logs (all)
- Each card: total doc count, deletable count, "Delete" button with progress bar
- Cleanup log (console-style output)

**Important:** `ledger` collection is NEVER auto-cleaned. Only manual cleanup targets resolved tickets and old orders.

---

### File: `FeatureFlags.js` — Toggle Features (`/dev/flags`)

**What it shows:**
- Enabled / Disabled count stats
- Info banner explaining what flags do
- List of all flags with toggle switches
- Toggle = instant save to Firebase (no save button needed)
- "OFF" badge on disabled flags

**Available flags and what they control:**
| Flag | Controls |
|------|----------|
| `seasonalProducts` | Seasonal section in PlaceOrder page |
| `supportTickets` | Support link in retailer navigation |
| `orderHistory` | Order history page access |
| `ledgerView` | Ledger link in retailer navigation |
| `darkMode` | Dark mode toggle visibility |
| `pdfInvoice` | PDF download button on TrackOrder |
| `duplicateOrderCheck` | Duplicate order warning on Checkout |
| `balanceWarning` | Due warning on PlaceOrder page |
| `companyOrder` | Company order page in admin |
| `bulkPriceUpdate` | Bulk price button in Inventory |

**Data source:** `settings/featureFlags` document. Changes reflect instantly everywhere via `onSnapshot` in FeatureFlags context.

---

### File: `AuditLog.js` — Action History (`/dev/audit`)

**What it shows:**
- Total actions count
- Filter by action type dropdown
- Each entry: colored icon, description, who did it, target, time ago, expandable details
- "Clear All" button (with confirmation)

**Action types logged:**
| Type | Color | When |
|------|-------|------|
| `order_status` | Blue | Order dispatched/delivered |
| `payment` | Green | Payment collected |
| `retailer_edit` | Purple | Retailer info changed |
| `retailer_delete` | Red | Retailer removed |
| `settings_change` | Amber | Settings updated |
| `maintenance` | Red | Maintenance toggled |
| `auto_cleanup` | Gray | System cleanup ran |

---

### File: `AppRatings.js` — User Ratings (`/dev/ratings`)

**What it shows:**
- Average rating (big gradient card with star display)
- Total reviews count
- Star distribution chart (5★ to 1★ with animated bars showing percentage)
- Individual ratings list: name, phone, star count, date, device
- Delete single rating button (with confirmation)
- "Clear All Ratings" button (with confirmation)

**Data source:** `app_ratings` collection (created by WelcomePopup on first login)

---

### File: `RevenueDashboard.js` — Revenue Charts (`/dev/revenue`)

**What it shows:**
- 3 stat cards: Today's revenue / Last 7 days / Last 30 days
- Daily revenue bar chart (last 30 days, bars colored by amount)
- Hover on bar → shows exact amount + date
- Summary: total orders in period, average order value, average daily revenue

**Data source:** `orders` collection (delivered orders with totals)

---

### File: `NotificationCenter.js` — Live Notifications (`/dev/notifications`)

**What it shows:**
- Compose section: message textarea + target selector (all/retailers/admin) + type (info/warning/success/urgent)
- "Send" button
- "Clear Active Banner" button — removes banner for all users
- Sent history list with timestamp and delete option

**How it works:**
- Send → saves to `notifications` collection (history) + updates `settings/banner` (live display)
- Clear → sets `settings/banner.active` to false
- Auto-expires after 24 hours by default

---

### File: `DataExport.js` — Export Data (`/dev/export`)

**What it shows:**
- Format selector: JSON or CSV
- Collection checkboxes (10 collections available)
- "Select All" / "Deselect All" buttons
- "Export" button → downloads file

**Available collections for export:**
users, orders, products, ledger, retailer_balances, support_tickets, announcements, app_errors, audit_log, app_ratings

---

### File: `BackupRestore.js` — Database Backup (`/dev/backup`)

**What it shows:**
- "Create Backup" button — snapshots critical collections
- Backup list with: timestamp, document count, size indicator
- "Restore" button per backup — DOUBLE confirmation required (type "RESTORE" to confirm)
- Progress bar during restore operation
- "Delete" button to remove old backups

**Collections backed up:** users, products, settings, retailer_balances, ledger, orders

**Restore behavior:** CLEANS target collections first, then writes all backup data. This is destructive — hence double confirmation.

**Storage:** Backups saved as JSON string in `backups` collection documents.

---

### File: `ApiResponseMonitor.js` — Latency Tester (`/dev/api-monitor`)

**What it shows:**
- "Test All" button — pings 6 Firestore endpoints and measures response time
- Results table: endpoint name, type (read/write), response time in ms
- Color coding: green (<200ms), amber (200-500ms), red (>500ms)
- Summary: average latency, slowest endpoint, error count
- Test history (last 10 runs with timestamps)

**Endpoints tested:** users, orders, products, settings, support_tickets, ledger (one read query each)

---

### File: `ConfigDiff.js` — Config Comparison (`/dev/config-diff`)

**What it shows:**
- Total differences count badge (green = all defaults, amber = has changes)
- App Settings section: shows each changed key with default value (strikethrough) vs current value
- Feature Flags section: same format
- "Copy" button — copies full live config as raw JSON to clipboard
- Raw JSON view at bottom

**Purpose:** Quickly see what admin has changed from default values without going to Firebase Console.

---

### File: `RealtimeDashboard.js` — Live Feed (`/dev/realtime`)

**What it shows:**
- Uses Firestore `onSnapshot` — data updates WITHOUT page refresh
- Live stats: active users count, today's orders, today's revenue, connection status
- Recent orders feed (last 8 orders) with retailer name, items, amount, status
- Connection indicator: green "Live" / red "Disconnected"
- Pulse animation on cards when new data arrives

**How it works:** Sets up `onSnapshot` listeners on `orders` and `users` collections. Updates UI instantly when any change happens in Firebase.

---

### File: `ScheduledTasks.js` — Maintenance Jobs (`/dev/tasks`)

**What it shows:**
- "+" button to create new task
- Task list: name, schedule description, enabled/disabled toggle, last run time, result
- "Run Now" button per task — executes immediately

**Available task actions:**
| Action | What it does |
|--------|-------------|
| Cleanup errors | Deletes `app_errors` older than 7 days |
| Cleanup old orders | Deletes `order_history` older than 1 year |
| Reset usage | Resets today's usage counter |
| Sync balances | Recalculates all retailer balances from ledger |
| Clear expired sessions | Removes expired `activeSession` from users |
| Remove retailer IDs | Cleans up orphaned references |

**Warning:** "Run Now" performs REAL operations — not simulation. Data will be permanently deleted.

**Storage:** Task configs saved in `scheduled_tasks` collection.

---

### File: `DevGuide.js` — Developer Documentation (`/dev/guide`)

**What it shows:**
- All 19 dev tools documented with expandable accordion sections
- Each section: icon, title, description, step-by-step usage, pro tip, route link
- Search bar to filter tools by name
- Quick reference table
- FAQ section (10 common questions)
- Emergency procedures (what to do if app crashes, Firebase down, etc.)

All content is hardcoded. This is the in-app version of this guide.

---

*End of Part 6. Next: Part 7 — Shared Components*



---

## Part 7 — Shared Components

All files in `src/components/`. Reusable UI pieces used across multiple pages.

---

### File: `ConfirmModal.js` — Confirmation Popup

**When it appears:** Before any destructive or important action — delete, logout, status change, payment collection, maintenance toggle, etc.

**How to use in any component:**
```js
import { useConfirm } from '../components/ConfirmModal';

const confirm = useConfirm();
const ok = await confirm({
  title: 'Delete Retailer',
  message: 'This cannot be undone. All data will be lost.',
  confirmText: 'Delete',
  cancelText: 'Cancel',  // optional, defaults to "Cancel"
  type: 'danger'
});
if (ok) { /* proceed with action */ }
```

**Available types:**
| Type | Icon | Button Color | Use Case |
|------|------|-------------|----------|
| `danger` | Trash | Red gradient | Delete actions |
| `warning` | AlertTriangle | Amber gradient | Risky changes |
| `logout` | LogOut | Red gradient | Logout confirmation |
| `info` | Info | Blue gradient | Save/confirm actions |
| `success` | CheckCircle | Green gradient | Positive confirmations |
| `critical` | ShieldAlert | Dark red gradient | Irreversible actions (backup restore, etc.) |

**Visual design:**
- Always dark themed (`bg-gray-900`)
- Backdrop blur + semi-transparent black overlay
- Spring animation on icon
- z-index: 200 (above everything)

**Architecture:** Uses React Context (`ConfirmProvider` wraps entire app in App.js). The `useConfirm` hook returns a function that creates a Promise — resolves `true` on confirm, `false` on cancel.

---

### File: `ErrorBoundary.js` — Crash Protection (3 levels)

Three separate React error boundary classes, each catching crashes at different depths.

| Boundary | Wraps | Severity | Recovery UI |
|----------|-------|----------|-------------|
| `RootErrorBoundary` | Entire app (in index.js) | Critical | Minimal inline HTML — "App Crashed" + Reload + Clear Data buttons |
| `AppErrorBoundary` | Inside layouts (around RetailerLayout, AdminLayout) | High | Styled React UI — Reload + Go Home + Dev Console button (dev only) |
| `DevErrorBoundary` | DeveloperLayout only | Medium | Dark themed — error message + Reload button |

**All boundaries auto-log to Firebase `app_errors` collection with:**
- `message` — error text
- `stack` — stack trace
- `componentStack` — React component tree
- `url` — current page URL
- `user` — phone number from localStorage
- `timestamp` — ISO string
- `type` — 'root_crash', 'crash', or 'dev_crash'
- `severity` — 'critical', 'high', or 'medium'

**Why 3 levels:**
- If a page crashes → AppErrorBoundary catches it, sidebar/header stay visible
- If layout itself crashes → RootErrorBoundary catches, shows basic HTML (no React needed)
- Dev console has its own boundary to not affect main app

---

### File: `AppFooter.js` — Responsive Footer

**Appears on:** Every page (rendered inside layouts after main content area).

**Desktop layout (3 columns):**
| Column 1 | Column 2 | Column 3 |
|-----------|----------|----------|
| Brand name + tagline | Quick links (different for retailer vs admin) | Contact info + delivery hours |

**Mobile layout:** Compact centered — brand + developer credit only.

**Data sources:** All text reads from `APP_CONFIG` in config.js (name, tagline, phone, developer name, version).

**Props:** `type` — either `"retailer"` or `"admin"` (determines which quick links to show)

---

### File: `SplashScreen.js` — App Loading Screen

**When it shows:** On every app open, while session is being verified.

**Two modes:**
| Mode | When | Duration | Visual |
|------|------|----------|--------|
| Premium (animated) | First 7 days after launch date (June 1, 2026) | 3.2 seconds | Full animation with logo, particles, gradient shifts |
| Normal (minimal) | After 7 days | 1.5 seconds | Simple logo + spinner |

**Switching logic:** Calculates days since `2026-06-01`. If within 7 days → premium. Otherwise → normal. Controlled in App.js `useEffect`.

**Common changes:**
| What | Where |
|------|-------|
| Launch date | App.js: `new Date('2026-06-01T00:00:00')` |
| Normal duration | App.js: `1500` (milliseconds) |
| Premium duration | App.js: `3200` (milliseconds) |
| Logo | `src/assets/logo.png` |

---

### File: `InstallPrompt.js` — PWA Install Banner

**When it shows:** When browser fires `beforeinstallprompt` event (user hasn't installed the app yet).

**What it does:**
- Captures the browser install event on `window.__lgInstallPrompt`
- Shows a banner/button prompting user to install
- On click → triggers the native browser install dialog
- After install → hides the banner

**Used by:** RetailerLayout (shows banner), Settings page (has "Install App" button that uses same stored event).

---

### File: `WelcomePopup.js` — First-Time Onboarding

**When it shows:** 2 seconds after first login (checks localStorage flag `lg_welcome_shown`).

**Only for retailers** (checked in App.js — only rendered when `user.role === 'retailer'`).

**3 slides:**
| Slide | Content | Action |
|-------|---------|--------|
| 1 | Install App | Shows install button (triggers PWA prompt) |
| 2 | User Guide | Link to `/guide` page |
| 3 | Rate Us | 5-star rating selector, saves to `app_ratings` collection |

**Behavior:**
- Cannot be accidentally dismissed (no outside-click close)
- Must either complete all slides or click "Skip"
- Sets `lg_welcome_shown: true` in localStorage
- Rating saved with: phone, name, rating (1-5), createdAt, device info

---

### File: `LoadingSkeleton.js` — Shimmer Placeholders

**When it shows:** While data is loading from Firebase.

**Available skeleton components:**
| Component | Used for |
|-----------|----------|
| `TableSkeleton` | Table-heavy pages (DailyLedger, Ledger) |
| `CardsSkeleton` | Card grid pages (Retailers, Inventory) |
| `DashboardSkeleton` | Dashboard pages |
| `OrderSkeleton` | Order-related pages |

**Usage:** `if (loading) return <TableSkeleton />;`

**Visual:** Gray rounded rectangles with shimmer animation (light sweep effect).

---

### File: `TopProgressBar.js` — Page Transition Bar

**What it does:** Shows a thin animated gradient bar at the top of the page during navigation (like YouTube's red loading bar).

**Exported functions:**
| Function | Purpose |
|----------|---------|
| `triggerProgress()` | Start showing the bar |
| `stopProgress()` | Hide the bar |

**Also exports:** `PageLoader` component — used as Suspense fallback, shows skeleton + triggers progress bar.

**How layouts use it:** On every `location.pathname` change, layout imports this module dynamically and calls `triggerProgress()` → `stopProgress()` after 300ms.

---

### File: `OfflineBanner.js` — No Internet Warning

**When it shows:** When browser goes offline (listens to `navigator.onLine` and online/offline events).

**Visual:** Fixed bar at top of screen with warning icon + "You're offline" message. Disappears when connection returns.

---

*End of Part 7. Next: Part 8 — Hooks & Context*



---

## Part 8 — Hooks & Context

Custom React hooks (in `src/hooks/`) and context providers (in `src/context/`).

---

### File: `src/hooks/useDarkMode.js` — Dark/Light Mode

**What it does:** Manages dark mode toggle. Saves preference to localStorage, applies `dark` class to `<html>` element.

**Usage:**
```js
const [isDark, toggleDark] = useDarkMode();
// isDark = boolean (true if dark mode active)
// toggleDark = function to flip the mode
```

**How it works:**
1. Reads `lg_darkmode` from localStorage on mount
2. When changed: adds/removes `dark` class on `document.documentElement`
3. Tailwind CSS picks up `dark:` prefixed classes automatically

**Used by:** RetailerLayout, AdminLayout (header toggle buttons), Settings pages

---

### File: `src/hooks/useFontSize.js` — Font Size Preference

**What it does:** Manages Small/Normal/Large font size. Applies CSS class to `<html>` element.

**Usage:**
```js
const { size, setSize, SIZES, LABELS } = useFontSize();
// size = 'font-small' | 'font-normal' | 'font-large'
// setSize = function to change size
// SIZES = ['font-small', 'font-normal', 'font-large']
// LABELS = ['Small', 'Normal', 'Large']
```

**How it works:**
1. Reads `lg_font_size` from localStorage
2. Removes all size classes from `<html>`, adds current one
3. CSS in `index.css` defines what each class does (scaling base font size)

**Used by:** RetailerLayout, AdminLayout (header font size buttons)

---

### File: `src/hooks/useBottomSheet.js` — Swipe-to-Dismiss Gesture

**What it does:** Handles touch drag gestures on mobile bottom sheets. User can swipe down to close.

**Usage:**
```js
const { sheetRef, handleProps, close } = useBottomSheet(onClose);
// sheetRef = attach to the sheet container div
// handleProps = spread onto the drag handle area (onTouchStart, onTouchMove, onTouchEnd)
// close = programmatic close (with slide-down animation)

<div ref={sheetRef}>
  <div {...handleProps}>Drag Handle</div>
  Content here
</div>
```

**Dismiss conditions (either triggers close):**
- Drag distance > 30% of sheet height
- Drag distance > 100px

**Animation:** Uses CSS `transform: translateY()` with cubic-bezier timing. 280ms slide-down before calling `onClose`.

**Used by:** RetailerLayout, AdminLayout, DeveloperLayout (all "More" bottom sheets)

---

### File: `src/hooks/usePullToRefresh.js` — Pull-to-Refresh

**What it does:** Detects pull-down gesture on mobile when at top of page. Shows visual indicator and triggers refresh.

**Usage:**
```js
const { pulling, pullDistance, threshold } = usePullToRefresh(onRefresh);
// pulling = boolean (true when user is pulling)
// pullDistance = number (how far pulled, in px)
// threshold = 80 (px needed to trigger refresh)
// onRefresh = optional callback (defaults to page reload)
```

**Configuration:**
| Setting | Value |
|---------|-------|
| Threshold | 80px (must pull this far to trigger) |
| Dampening | 0.4x (pull feels heavier as you drag) |
| Max distance | 120px (visual cap) |

**How it works:**
1. Listens to touchstart/move/end on document
2. Only activates when `window.scrollY === 0` (at top of page)
3. If pull exceeds threshold on release → calls `onRefresh` or reloads page
4. If pull is less → snaps back

**Used by:** All three layouts (RetailerLayout, AdminLayout, DeveloperLayout)

---

### File: `src/context/FeatureFlags.js` — Real-Time Feature Toggle System

**What it does:** Provides feature flag values to the entire app via React Context. Listens to Firebase in real-time — when developer toggles a flag, it reflects instantly everywhere without page refresh.

**Provider setup (in App.js):**
```js
<FeatureFlagProvider>
  <AppContent />
</FeatureFlagProvider>
```

**Usage in any component:**
```js
import { useFlags } from '../../context/FeatureFlags';

const flags = useFlags();
if (flags.seasonalProducts !== false) {
  // show seasonal products section
}
```

**How it works:**
1. Sets up `onSnapshot` listener on `settings/featureFlags` document
2. Stores all flag values in context state
3. Any component using `useFlags()` re-renders when flags change
4. Default behavior: if a flag doesn't exist → treated as `true` (enabled)

**Important pattern:** Always check `!== false` (not `=== true`) because undefined flags should be treated as enabled by default.

**Firebase document:** `settings/featureFlags`
```json
{
  "seasonalProducts": true,
  "supportTickets": true,
  "orderHistory": true,
  "ledgerView": true,
  "darkMode": true,
  "pdfInvoice": true,
  "duplicateOrderCheck": true,
  "balanceWarning": true,
  "companyOrder": true,
  "bulkPriceUpdate": true
}
```

---

*End of Part 8. Next: Part 9 — Services & Utilities*



---

## Part 9 — Services & Utilities

Files in `src/services/` and `src/utils/`.

---

### File: `src/services/errorLogger.js` — Error Tracking Service

**What it does:** Automatically catches all app crashes (JS errors, unhandled promise rejections, console.error) and logs them to Firebase. Also provides solution matching for known error patterns.

**Exported functions:**
| Function | Purpose |
|----------|---------|
| `initErrorTracking()` | Called once in App.js — sets up global listeners |
| `logError(error, context)` | Manually log an error |
| `getErrors()` | Fetch all errors from Firebase (max 50) |
| `clearErrors()` | Delete all error logs (batch delete) |
| `resolveError(errorId)` | Mark single error as resolved |
| `getErrorSolution(message)` | Match error against known patterns, return fix |

**Error listeners (set up by initErrorTracking):**
1. `window.addEventListener('error')` — catches unhandled JS errors
2. `window.addEventListener('unhandledrejection')` — catches failed promises
3. `console.error` interceptor — catches React errors and component crashes

**Deduplication:** Same error won't be logged twice within 5 minutes (prevents spam from recurring errors).

**Severity classification:**
| Pattern | Severity |
|---------|----------|
| ResizeObserver, Non-Error | low |
| ChunkLoad, Network | medium |
| permission, quota, Maximum update | high |
| Everything else | medium |

**Known error patterns with solutions (12 patterns):**
| Error Pattern | Solution |
|---------------|----------|
| Firebase permission-denied | Check Firestore rules |
| Firebase not-found | Verify document path |
| Firebase unavailable | Check internet, Firebase status |
| Firebase quota-exceeded | Upgrade plan or reduce operations |
| ChunkLoadError | Force reload (Ctrl+Shift+R) |
| Network Error | Check internet |
| Cannot read properties of null/undefined | Add optional chaining (?.) |
| Maximum update depth exceeded | Fix useEffect dependencies |
| Objects are not valid as React child | Don't render objects directly |
| ResizeObserver loop | Harmless — ignore |
| LocalStorage quota | Clear old localStorage data |
| Timeout | Add retry logic |

**Firebase collection:** `app_errors` — max 50 documents kept (auto-cleanup deletes older ones daily).

---

### File: `src/utils/autoCleanup.js` — Automatic Data Cleanup

**What it does:** Runs once per day on app load. Deletes old data to keep Firebase within free tier limits.

**When it runs:** Called in App.js at startup via `runAutoCleanup()`. Checks localStorage `lg_last_cleanup` — if today's date matches, skips.

**Respects settings:** If `settings/app.autoCleanup` is `false`, does nothing (admin can disable it).

**Cleanup targets:**
| Collection | Date Field | Max Age | Max Docs |
|-----------|------------|---------|----------|
| `app_errors` | `timestamp` | 7 days | 50 |
| `order_history` | `createdAt` | 1 year | — |
| `company_orders` | `updatedAt` | 1 year | — |
| `daily_stock` | `updatedAt` | 1 year | — |
| `audit_log` | `timestamp` | 1 year | — |

**Never cleaned:** `ledger` (permanent financial record), `orders` (kept for reference), `users`, `products`, `settings`

**Batch limit:** Max 100 documents deleted per collection per run (prevents long-running operations).

**Logging:** If any documents deleted → creates entry in `audit_log`: `action: 'auto_cleanup'`

---

### File: `src/utils/usageTracker.js` — Firestore Usage Tracking

**What it does:** Counts how many Firestore reads, writes, and deletes the app performs. Syncs to Firebase periodically.

**How it works:**
1. `firebase.js` wraps all Firestore functions → each call increments counter in localStorage (`lg_usage_today`)
2. Every 5 minutes, `syncUsageToFirebase()` pushes local counts to `settings/usage_YYYY-MM-DD` document
3. After sync, local counters reset to 0
4. Also syncs on `beforeunload` (page close/refresh)

**Exported functions:**
| Function | Purpose |
|----------|---------|
| `getUsageLocal()` | Get today's local read/write/delete counts |
| `syncUsageToFirebase()` | Push counts to Firebase + reset local |
| `initUsageTracking()` | Start 5-minute interval + beforeunload listener |

**Firebase document:** `settings/usage_2026-06-15` (one per day)
```json
{
  "reads": 342,
  "writes": 28,
  "deletes": 5,
  "date": "2026-06-15",
  "lastSync": "2026-06-15T14:30:00.000Z"
}
```

**Purpose:** Helps developer monitor Firebase free tier usage and detect anomalies.

---

### File: `src/utils/config.js` — Central Configuration

Already documented in Part 1. Single source for version, name, tagline, developer info, phone.

---

### File: `src/utils/price.js` — Price Formatting

**What it does:** Formats numbers as Indian Rupee currency.

**Usage:** `formatPrice(1250)` → `"₹1,250.00"`

**To change:**
- Currency symbol: search for `₹`
- Decimal places: look for `.toFixed` or `toLocaleString` options

---

### File: `src/utils/date.js` — Date Formatting

**What it does:** Helper functions for date formatting used across the app.

**Common functions:**
- Format date as "15 Jun 2026"
- Format time as "2:30 PM"
- Get today's date string
- Get tomorrow's date string
- Calculate "X days ago" text

---

### File: `src/utils/deliveryPdf.js` — PDF Generation for Delivery Sheets

**What it does:** Generates the daily delivery sheet PDF (used by DailyLedger admin page).

**Uses:** jsPDF library

**PDF layout:**
- Header with "LUCY GARDEN" + date
- Table with retailer names as rows, products as columns
- Quantity values in cells
- Totals row at bottom
- Area-wise grouping if applicable

---

*End of Part 9. Next: Part 10 — Firebase & Security*



---

## Part 10 — Firebase & Security

---

### Firebase Collections (Complete Reference)

| Collection | Purpose | Key Fields |
|-----------|---------|------------|
| `users` | All user accounts | phone, name, role, pin, area, shop, lastLogin, lastLoginDevice, deviceInfo, activeSession, sessionExpiry, blocked |
| `orders` | Every order placed | phone, items[], total, status, date, timestamp, actualItems[], actualTotal |
| `products` | Product catalog | name, price, unit, type, group, label, active |
| `ledger` | Payment entries (debit/credit) | retailerId, amount, type ('debit'/'credit'), date, note |
| `retailer_balances` | Current due amount per retailer | balance (number) |
| `settings` | App configuration (multiple docs) | See below |
| `productGroups` | Group definitions | daily[], seasonal[], codes{} |
| `support_tickets` | Help tickets | phone, subject, message, status, messages[], timestamp |
| `announcements` | Banner history | message, type, target, expiresAt, createdAt |
| `notifications` | Notification history | message, type, target, createdAt, sentBy |
| `app_errors` | Crash logs | message, stack, componentStack, url, user, timestamp, type, severity |
| `app_ratings` | User ratings | phone, name, rating (1-5), createdAt, device |
| `audit_log` | Action history | action, description, target, performedBy, timestamp |
| `company_orders` | Company level orders per date | items, date, updatedAt |
| `daily_stock` | Stock received per date | items, date, updatedAt |
| `backups` | Database snapshots | data (JSON string), createdAt, collections[], docCount |
| `scheduled_tasks` | Maintenance job configs | name, schedule, action, enabled, lastRun, status, lastResult |
| `order_history` | Archived/old orders | phone, items, total, createdAt |

---

### Settings Collection (Multiple Documents)

The `settings` collection has several documents:

| Document ID | Purpose | Key Fields |
|------------|---------|------------|
| `app` | Main app configuration | maintenance, orderStart, orderEnd, deliveryStart, deliveryEnd, shopPhone, sessionTimeout, minOrderAmount, maxOrderItems, allowModify, defaultPin, autoCleanup |
| `banner` | Currently active announcement | active, message, type, target, expiresAt, createdAt |
| `featureFlags` | Feature toggles | seasonalProducts, supportTickets, orderHistory, ledgerView, darkMode, pdfInvoice, duplicateOrderCheck, balanceWarning, companyOrder, bulkPriceUpdate |
| `areas` | Delivery area names | areas[] (array of strings) |
| `productGroups` | Product group definitions | daily[] (array), seasonal[] (array), codes{} (map of group→code) |
| `devAccess` | Developer PIN | pin (string, default "0000") |
| `usage_YYYY-MM-DD` | Daily Firestore usage | reads, writes, deletes, date, lastSync |

---

### Firestore Security Rules (`firestore.rules`)

Located in project root. Deploy with: `firebase deploy --only firestore:rules`

**Rule philosophy:**
- All collections have explicit rules
- `create` operations validate required fields
- `read` is open (all authenticated via app)
- Unknown collections are denied by default (deny-all fallback)

**Per-collection rules summary:**

| Collection | Read | Create Validation | Update | Delete |
|-----------|------|-------------------|--------|--------|
| `users` | open | Must have: name, phone, role, pin. Role must be 'retailer' or 'admin'. Phone must be 10 digits | Role must stay valid | open |
| `orders` | open | Must have: phone, items, total, status. Phone 10 digits. Total >= 0 | open | open |
| `products` | open | Must have: name, price. Price >= 0 | Price >= 0 | open |
| `ledger` | open | Must have: retailerId, amount, type. Type must be 'debit' or 'credit'. Amount >= 0 | open | open |
| `retailer_balances` | open | open | open | open |
| `settings` | open | open | open | open |
| `support_tickets` | open | Must have: phone, subject, message. Phone 10 digits | open | open |
| `announcements` | open | Must have: message, type. Type in [info, warning, success, urgent] | open | open |
| `app_errors` | open | open | open | open |
| `app_ratings` | open | Must have: phone, rating. Rating 1-5 | NOT allowed (immutable) | open |
| `audit_log` | open | Must have: action, performedBy | NOT allowed (immutable) | open |
| `company_orders` | open | open | open | open |
| `daily_stock` | open | open | open | open |
| `backups` | open | open | open | open |
| `notifications` | open | open | open | open |
| `scheduled_tasks` | open | open | open | open |
| `order_history` | open | Must have: phone, items, total | open | open |
| Everything else | DENIED | DENIED | DENIED | DENIED |

---

### Security Measures

| Security Feature | Implementation |
|-----------------|----------------|
| API keys in `.env` | Never committed to git (.gitignore) |
| Developer access | Hardcoded phone `8051725780` |
| Dev PIN gate | Separate PIN checked before accessing dev tools (Firebase `settings/devAccess.pin`) |
| Session timeout | Configurable (default 24h), checked every 5 minutes |
| Single-device enforcement | Retailers only — new login terminates old session |
| Progressive lockout | 5→10→15→20 wrong PINs = 60s→5min→30min→permanent block |
| Account blocking | `blocked: true` in user document, only unblockable from admin |
| Real-time session monitoring | onSnapshot detects if session killed from another device |
| Device tracking | Browser/OS info logged on every login |
| Error auto-logging | All crashes saved with user context for debugging |
| Field validation | Firestore rules validate required fields on create |
| Deny-all fallback | Unknown collections cannot be read or written |

---

### Important Security Notes

1. **No server-side authentication** — This app uses client-side PIN verification. The PIN is stored in Firestore and checked by comparing values. This is suitable for an internal business tool but NOT for public-facing apps.

2. **Firestore rules are permissive** — Read access is open on all collections. This means anyone with the Firebase config could read data. The security relies on the config being in `.env` and not exposed publicly.

3. **Developer phone is hardcoded** — Changing the developer requires editing `DEV_PHONE` in both `App.js` and `Login.js`, plus rebuilding.

4. **Admin role is database-driven** — Set `role: 'admin'` in the user's Firebase document to grant admin access.

---

*End of Part 10. Next: Part 11 — Standalone Dev Console*



---

## Part 11 — Standalone Dev Console

Location: `public/dev-console/`
URL: `yourdomain.com/dev-console/`

---

### What is this?

A completely independent emergency console that works even if the main React app is crashed, broken, or in maintenance mode. It uses plain HTML/CSS/JS with Firebase CDN (no React, no build step needed).

**When to use:**
- Main app shows white screen / won't load
- Need to toggle maintenance mode but can't access admin panel
- Need to force-logout users without the React app
- Need to check error logs when app is down

---

### File Structure

```
public/dev-console/
├── index.html          ← Main page (loads all JS modules)
├── guide.html          ← Usage guide page
├── css/
│   └── styles.css      ← All styling (dark theme)
└── js/
    ├── app.js          ← Main app logic, tab switching
    ├── auth.js         ← PIN authentication (same PIN as dev tools)
    ├── firebase.js     ← Firebase CDN connection (loads Firebase from CDN URLs)
    ├── utils.js        ← Helper functions (formatDate, etc.)
    └── tabs/
        ├── backup.js       ← Backup tab (create/download backups)
        ├── errors.js       ← Error logs tab (view/clear crashes)
        ├── flags.js        ← Feature flags tab (toggle on/off)
        ├── health.js       ← Health check tab (ping Firebase, check status)
        ├── maintenance.js  ← Maintenance toggle tab
        └── sessions.js     ← Sessions tab (view/force-logout users)
```

---

### Key Differences from React Dev Tools

| Feature | React App (`/dev`) | Standalone (`/dev-console/`) |
|---------|-------------------|------------------------------|
| Requires React to work | Yes | No |
| Number of tools | 19 pages | 6 tabs |
| Build step needed | Yes (npm run build) | No (plain files) |
| Works if app crashes | No | Yes |
| Full analytics | Yes | No (basic only) |
| Auto-refresh | No | Yes (every 30 seconds) |

---

### Authentication

- Same PIN as React dev tools (from Firebase `settings/devAccess.pin`, fallback `0000`)
- Stores session in sessionStorage
- No progressive lockout (simpler security for emergency tool)

---

### Visual Theme

- Background: `#0f172a` (dark navy)
- Accent: `#10b981` (emerald green)
- Text: white/gray
- Cards: dark with green borders

---

### Quick Actions (always visible on all tabs)

| Button | What it does |
|--------|-------------|
| Logout All | Sets all users' `activeSession` to empty |
| Toggle Maintenance | Flips `settings/app.maintenance` |
| Clear Sessions | Removes `activeSession` + `sessionExpiry` from all users |
| Export Errors (JSON) | Downloads all `app_errors` as JSON file |
| Export Sessions (CSV) | Downloads user session data as CSV |

---

### How to Update

Since these are plain HTML/CSS/JS files in the `public/` folder:
1. Edit the files directly
2. They get deployed as-is (no build processing)
3. Firebase config is hardcoded in `js/firebase.js` — update if Firebase project changes

---

### `guide.html` — Usage Guide

A standalone HTML page documenting how to use the emergency console. Accessible at `/dev-console/guide.html`. Contains step-by-step instructions for each tab.

---

*End of Part 11. Next: Part 12 — Config Files & Quick Reference*



---

## Part 12 — Config Files & Quick Reference

---

### Root Config Files

| File | Purpose |
|------|---------|
| `package.json` | Project config — name ("lucy-garden"), dependencies, scripts |
| `tailwind.config.js` | Custom Tailwind colors (royal, mint), fonts, shadows, animations |
| `postcss.config.js` | CSS processing (required by Tailwind, don't touch) |
| `firebase.json` | Firebase Hosting config — rewrites all URLs to index.html (SPA), public folder = "build" |
| `.firebaserc` | Firebase project ID link |
| `vercel.json` | Vercel hosting config — SPA rewrites |
| `firestore.rules` | Security rules for all collections |
| `seed.js` | Script to add sample/test data to Firebase |
| `.gitignore` | Files NOT uploaded to git: node_modules, .env, build |

---

### Tailwind Custom Colors

Defined in `tailwind.config.js`:

| Color | Range | Looks Like | Usage |
|-------|-------|-----------|-------|
| `royal` | 50-950 | Deep blue | Brand primary — buttons, headers, active states |
| `mint` | 50-900 | Fresh green | Brand secondary — success, accents, badges |

**Common Tailwind classes used:**
| Class Pattern | Meaning |
|--------------|---------|
| `bg-royal-700` | Background: dark blue |
| `text-mint-500` | Text: green |
| `border-royal-200` | Border: light blue |
| `from-royal-700 to-mint-600` | Gradient: blue → green |
| `dark:bg-gray-900` | Dark mode background |
| `shadow-card` | Custom card shadow (subtle blue tint) |
| `shadow-glow` | Green glow effect |

---

### Custom Shadows

| Name | When used |
|------|-----------|
| `shadow-card` | Default card elevation |
| `shadow-card-hover` | Card on hover |
| `shadow-float` | Floating elements (FAB, bottom bar) |
| `shadow-glow` | Active indicators (green dots) |

---

### Custom Animations

| Name | What it does |
|------|-------------|
| `animate-fade-in` | Fade in over 0.4s |
| `animate-slide-up` | Slide up + fade in over 0.3s |
| `animate-gradient` | Slow background gradient shift (8s loop) |

---

### NPM Scripts

| Command | What it does |
|---------|-------------|
| `npm start` | Run locally at http://localhost:3000 (hot reload) |
| `npm run build` | Create production build in `build/` folder |
| `npm run deploy` | Build + deploy to Firebase Hosting |

---

### Dependencies (key packages)

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.x | UI framework |
| react-router-dom | 6.x | Page routing |
| firebase | 10.x | Database connection |
| framer-motion | 11.x | Animations and transitions |
| tailwindcss | 3.x | Utility-first CSS |
| lucide-react | latest | Icon library |
| jspdf | latest | PDF generation |

---

### PWA Files (Progressive Web App)

| File | Purpose |
|------|---------|
| `public/manifest.json` | App name, icons, theme color, display mode (standalone) |
| `public/sw.js` | Service Worker — caching for offline support |
| `public/logo192.png` | App icon (home screen, small) |
| `public/logo512.png` | App icon (splash screen, large) |
| `public/apple-touch-icon.png` | iOS home screen icon |

---

### SEO Files

| File | Purpose |
|------|---------|
| `public/robots.txt` | Tells search engines what to crawl |
| `public/sitemap.xml` | Site map for search engines |
| `public/og-image.png` | Social media share preview image |

---

### Complete File Count

| Category | Count |
|----------|-------|
| Core (App, index, css) | 3 |
| Login + NotFound | 2 |
| Retailer Pages | 14 |
| Admin Pages | 13 |
| Developer Pages | 19 |
| Layouts | 3 |
| Shared Components | 8 |
| Services | 2 |
| Context | 1 |
| Hooks | 4 |
| Utils | 6 |
| Config files (root) | 9 |
| Standalone Dev Console | 10 files (modular) |
| **Total** | **94 files** |

---

## Quick Reference — How to Change Common Things

### Change any text on screen:
1. Identify which page shows that text (use route table from Part 1)
2. Open the file in your editor
3. Press Ctrl+F and search for the exact text
4. Change it and save — app auto-refreshes in dev mode

### Change any color:
1. Find the element in the file
2. Look for classes starting with: `bg-` (background), `text-` (text), `border-` (border)
3. Change the color: `bg-royal-700` → `bg-blue-600` or `bg-red-500`
4. For gradients: change `from-`, `via-`, `to-` values

### Change any icon:
1. Go to https://lucide.dev/icons and find the icon you want
2. At top of the file, find the import: `import { OldIcon } from 'lucide-react'`
3. Change to: `import { NewIcon } from 'lucide-react'`
4. Replace `<OldIcon` with `<NewIcon` where it's used

### Add a new page:
1. Create file in `src/pages/retailer/`, `admin/`, or `dev/`
2. In `src/App.js`: add lazy import at top
3. In `src/App.js`: add route in the correct section
4. In the layout file: add link to navigation array

### Change the version:
1. Edit `src/utils/config.js` → `version: '2.0.0'` — change to new version
2. All pages auto-update (they read from this file)
3. Also update `public/dev-console/` manually if needed

### Change developer phone:
1. `src/App.js` → `const DEV_PHONE = '8051725780'`
2. `src/pages/Login.js` → `const DEV_PHONE = '8051725780'`
3. Rebuild and deploy

### Toggle maintenance mode:
- Fastest: Admin Settings → Maintenance toggle
- Alternative: Firebase Console → `settings/app` → set `maintenance: true/false`
- Emergency: Use standalone dev console at `/dev-console/`

### Block/unblock a user:
- Admin → Sessions page → find user → click "Unblock"
- Or in Firebase Console: `users/{phone}` → delete `blocked` field

### Reset a retailer's PIN:
- Admin → Retailers → click retailer → Edit → change PIN field → Save
- Or Admin → Sessions → find user → "Reset PIN" (resets to default PIN)

---

## Troubleshooting Quick Guide

| Problem | Check | Fix |
|---------|-------|-----|
| White screen / app won't load | Browser Console (F12) | Check `/dev/errors` or Firebase status |
| "Permission denied" | Firestore rules | Add missing collection to `firestore.rules` |
| Data not showing | Firebase Console → Firestore | Verify collection/document exists |
| Login not working | `users` collection | Check phone document exists with correct PIN |
| Orders not placing | `settings/app` | Check `orderStart` and `orderEnd` values |
| App stuck loading | Clear browser cache | Or check Firebase quota in Console |
| Maintenance page showing | `settings/app.maintenance` | Set to `false` |
| Features not toggling | `settings/featureFlags` | Check flag values in Firebase |
| Session keeps expiring | `settings/app.sessionTimeout` | Increase hours value |
| User blocked | `users/{phone}.blocked` | Use Admin Sessions → Unblock |

---

## Master Cheat Sheet

| Scenario | Go to | Action |
|----------|-------|--------|
| "Change button color" | That page's file | Find `bg-` class, change color |
| "Change text" | That page's file | Ctrl+F the text, edit |
| "Change icon" | That page's file | Import new icon from lucide-react |
| "Turn off a feature" | `/dev/flags` | Toggle the flag OFF |
| "Add new product" | Admin → Inventory | Use the UI |
| "Add new retailer" | Admin → Retailers | Use the UI |
| "Site is down for users" | `/dev` → Maintenance OFF | Toggle it |
| "Send message to all" | `/dev/announce` | Type + Send |
| "User can't login" | Admin → Sessions | Check if blocked, reset PIN |
| "App is crashing" | `/dev/errors` | See error + suggested fix |
| "Delete old data" | `/dev/cleanup` | Select + Delete |
| "How many orders today" | `/dev/analytics` | Check stats |
| "Who's active" | `/dev/activity` | See retailer list |
| "Force someone offline" | `/dev/sessions` | Force Logout |
| "Check app version" | `/dev/deploy` | Shows version + build info |
| "Change logo" | `src/assets/logo.png` | Replace the file |
| "Change shop phone" | Admin → Settings | Edit Shop Phone field |
| "Change order timing" | Admin → Settings | Edit Order Window |
| "Backup the database" | `/dev/backup` | Create Backup |
| "Check Firebase speed" | `/dev/api-monitor` | Run test |

---

*Built by Divyanshu Gupta | Last updated: June 2026 | Version 2.2.0*

