# 🛠️ Dev Console & Firebase Usage — Complete Reference

> **Lucy Garden — Developer Operations Manual**
> Firebase usage breakdown, storage projections, daily operations cost, and dev console guide.

---

## 📊 Firebase Usage — Full Breakdown (All Users)

### Free Tier Limits (Spark Plan — per day)
| Resource | Daily Limit | Monthly Limit |
|----------|------------|---------------|
| Reads | 50,000 | 1,500,000 |
| Writes | 20,000 | 600,000 |
| Deletes | 20,000 | 600,000 |
| Storage | 1 GB total | 1 GB total |
| Bandwidth | 10 GB/month | 10 GB/month |

---

### 👥 Retailers (60 users) — Daily Reads

| Action | Reads per user | × 60 users | Total |
|--------|---------------|-----------|-------|
| Login verification (getDoc users) | 2 | × 60 | 120 |
| Home page (orders, settings, balance) | 4 | × 60 | 240 |
| PlaceOrder (products, settings, groups) | 3 | × 60 | 180 |
| TrackOrder (query orders by phone+date) | 2 | × 60 | 120 |
| MyLedger (query ledger by retailerId) | 2 | × 60 | 120 |
| PriceList (products) | 1 | × 60 | 60 |
| Profile (getDoc user) | 1 | × 60 | 60 |
| Settings page | 1 | × 60 | 60 |
| Session verify per page | 1 | × 60 | 60 |
| Feature flags (onSnapshot) | 1 | × 60 | 60 |
| **RETAILER READS TOTAL** | **18/user** | | **1,080/day** |

### 👥 Retailers — Daily Writes

| Action | Writes per user | × 60 users | Total |
|--------|----------------|-----------|-------|
| Place Order (addDoc orders) | 1 | × 60 | 60 |
| Place Order (addDoc order_history) | 1 | × 60 | 60 |
| Login session update (updateDoc users) | 1 | × 60 | 60 |
| Settings change (dark mode, font) | 0.5 | × 60 | 30 |
| Support ticket (occasional) | 0.1 | × 60 | 6 |
| App rating (first time only) | 0.02 | × 60 | 1 |
| **RETAILER WRITES TOTAL** | **~3.6/user** | | **~217/day** |

---

### 👨‍💼 Admin (1 user, heavy daily usage) — Daily Reads

| Action | Reads |
|--------|-------|
| Login verify | 2 |
| Dashboard (orders, users, settings) | 5 |
| Daily Ledger load (orders, users, products, groups, areas, stock, company) | 8 |
| Daily Ledger refresh (2-3 times during day) | 16 |
| Dispatch modal (getDoc order + balance) × 50 orders | 50 |
| Deliver modal (getDoc order + balance + ledger) × 50 orders | 50 |
| Retailers page (all users query) | 2 |
| Inventory page (products) | 2 |
| Ledger page (retailer list + entries) | 3 |
| Company Order page | 2 |
| Support Tickets | 2 |
| Sessions page | 1 |
| Settings page | 1 |
| **ADMIN READS TOTAL** | **145/day** |

### 👨‍💼 Admin — Daily Writes

| Action | Writes |
|--------|--------|
| Dispatch orders (updateDoc orders × 50) | 50 |
| Dispatch sync to order_history (× 50) | 50 |
| Deliver orders (updateDoc × 50) | 50 |
| Deliver sync to order_history (× 50) | 50 |
| Ledger debit entries on delivery (addDoc × 50) | 50 |
| Balance update on delivery (setDoc × 50) | 50 |
| Payment collection credit entries (~20) | 20 |
| Retailer add/edit | 2 |
| Product price update | 1 |
| Company order save | 1 |
| Daily stock save | 1 |
| Settings changes | 2 |
| Ticket replies | 3 |
| Session/login updates | 2 |
| Announcement | 1 |
| **ADMIN WRITES TOTAL** | **333/day** |

---

### 🛠️ Developer — Daily Reads/Writes

| Action | Reads | Writes |
|--------|-------|--------|
| Dev console browsing (various pages) | 50 | — |
| Heartbeat (2 min interval × 4 hours) | — | 120 |
| Session tracking | 5 | 20 |
| Occasional fixes (doc editor, orders) | 15 | 20 |
| **DEVELOPER TOTAL** | **70/day** | **160/day** |

---

### ⚙️ System (Automatic) — Daily Reads/Writes

| Action | Reads | Writes |
|--------|-------|--------|
| Usage tracker sync (every 5 min per active session) | 2 | 20 |
| Auto-cleanup check (1/day, scans errors+audit) | 7 | 5 |
| Feature flags listener (onSnapshot connections) | 5 | — |
| Maintenance mode check (cached 5 min) | 2 | — |
| Error boundary logging (auto on crashes) | 3 | 3 |
| Audit log entries (auto on admin actions) | — | 20 |
| **SYSTEM TOTAL** | **19/day** | **48/day** |

---

### 📄 PDF Generation — Firebase Cost

| PDF Type | Extra Reads | Extra Writes | Why |
|----------|-------------|--------------|-----|
| Daily Sheet PDF | **0** | **0** | Uses data already loaded on Daily Ledger page |
| Seasonal PDF | **0** | **0** | Same page data in browser memory |
| Dispatch Slip (retailer) | **0** | **0** | Track page order data already loaded |
| Final Invoice (retailer) | **0** | **0** | Same — order in memory |
| Rate Card PDF | **0** | **0** | PriceList page products already fetched |
| Payment Receipt PDF | **0** | **0** | Deliver modal data in memory |
| Admin Report PDF | **0** | **0** | Dashboard stats already loaded |
| **PDF TOTAL** | **0** | **0** | jsPDF runs client-side, no Firebase calls |

> **Note:** PDF generation happens entirely in the browser using jsPDF library. Data is fetched ONCE when page loads — PDF button reuses that same data from memory. Even generating PDF 10 times = 0 extra reads.

---

## 📈 Grand Total — Daily Firebase Usage

| Source | Reads/day | Writes/day |
|--------|-----------|------------|
| Retailers (60) | 1,080 | 217 |
| Admin (1) | 145 | 333 |
| Developer | 70 | 160 |
| System/Auto | 19 | 48 |
| PDF Generation | 0 | 0 |
| **GRAND TOTAL** | **1,314** | **758** |
| **Free Tier Limit** | **50,000** | **20,000** |
| **Usage %** | **2.6%** | **3.8%** |
| **Remaining** | **48,686** | **19,242** |

---

## 🔧 Optimizations Already Applied (Why reads are low)

| Optimization | Reads Saved/day | How |
|-------------|----------------|-----|
| IndexedDB Persistence | ~3,000-5,000 | Reads from local cache first, only syncs changes |
| Session Cache (10 min TTL) | ~500 | Static docs (settings, products) cached in memory |
| Query limits | ~1,000 | `limit(20)`, `limit(500)` prevents full collection scans |
| Cached maintenance check (5 min) | ~200 | Doesn't hit Firebase on every page nav |
| onSnapshot (feature flags) | ~300 | Single connection instead of polling |

**Before optimization:** ~8,000-10,000 reads/day (~50% of free tier)
**After optimization:** ~1,314 reads/day (~2.6% of free tier)
**Saved:** ~85% reduction in reads

---

## 💾 Data Storage — What's Stored & How Long

### Per-Document Size Estimates

| Collection | Avg doc size | What's inside |
|-----------|-------------|---------------|
| orders | ~600 bytes | phone, items[], total, status, dates, actualItems, _appKey |
| order_history | ~550 bytes | phone, items[], total, orderId, status, dates |
| ledger | ~350 bytes | retailerId, retailer, amount, type, note, date, _appKey |
| users | ~500 bytes | name, phone, role, pin, area, shop, session, device, _appKey |
| products | ~350 bytes | name, price, unit, type, group, label, active, _appKey |
| retailer_balances | ~200 bytes | balance, updatedAt, _appKey |
| settings | ~1,000 bytes | various config objects |
| support_tickets | ~800 bytes | phone, subject, message, messages[], status |
| app_errors | ~600 bytes | message, stack, url, user, timestamp, severity |
| audit_log | ~300 bytes | action, description, performedBy, timestamp |
| company_orders | ~2,000 bytes | items{} for all products |
| daily_stock | ~2,000 bytes | items{} received stock |

### Daily Growth

| Collection | New docs/day | KB/day | Auto-cleanup? |
|-----------|-------------|--------|---------------|
| orders | +50 | 29.3 KB | ❌ Never (permanent hisaab) |
| order_history | +50 | 26.9 KB | ❌ Never |
| ledger | +60 | 20.5 KB | ❌ Never (permanent hisaab) |
| audit_log | +20 | 5.9 KB | ✅ Deleted after 1 year |
| app_errors | +3 | 1.8 KB | ✅ Deleted after 7 days |
| company_orders | +1 | 2.0 KB | ❌ Never |
| daily_stock | +1 | 2.0 KB | ❌ Never |
| **DAILY TOTAL** | **+185 docs** | **88 KB/day** | |

### Storage Projections

| Timeline | Total Storage | Free Tier Used% |
|----------|--------------|-----------------|
| 1 month | 2.7 MB | 0.26% |
| 6 months | 15.6 MB | 1.5% |
| 1 year | 31.5 MB | 3.1% |
| 2 years | 63.0 MB | 6.2% |
| 3 years | 94.4 MB | 9.2% |
| 5 years | 157.3 MB | 15.4% |
| 10 years | 314 MB | 30.7% |
| **33 years** | **1,024 MB** | **100% (FULL)** |

### What NEVER gets deleted (permanent record):
- ✅ **Orders** — har order ka record permanent
- ✅ **Order History** — archive permanent
- ✅ **Ledger** — hisaab kitaab permanent (debit/credit entries)
- ✅ **Retailer Balances** — current dues (overwritten, not growing)
- ✅ **Users** — accounts permanent
- ✅ **Products** — catalog permanent

### What gets auto-cleaned:
- 🧹 **app_errors** — deleted after 7 days
- 🧹 **audit_log** — deleted after 1 year

---

## 📐 Scaling Capacity

| Retailers | Daily Reads | Daily Writes | Reads Used% | Writes Used% |
|-----------|------------|-------------|-------------|--------------|
| 60 (current) | 1,314 | 758 | 2.6% | 3.8% |
| 100 | 2,100 | 1,100 | 4.2% | 5.5% |
| 200 | 4,000 | 2,000 | 8.0% | 10% |
| 500 | 9,800 | 4,800 | 19.6% | 24% |
| 1,000 | 19,400 | 9,500 | 38.8% | 47.5% |
| 2,000 | 38,600 | 18,800 | 77.2% | 94% ⚠️ |
| **2,100+** | **LIMIT** | **LIMIT** | **100%** | **100%** |

**Current capacity: up to ~2,000 retailers on free tier.**

---

## 🔒 Security — `_appKey` Impact on Usage

| Metric | Extra cost | Explanation |
|--------|-----------|-------------|
| Reads | **0 extra** | Key check happens in Firestore rules (server-side, free) |
| Writes | **0 extra** | Key piggybacks on existing write (same operation) |
| Storage | **+35 bytes/doc** | ~2.74 MB/year extra (0.27% of 1GB) |
| Bandwidth | **Negligible** | 35 bytes per response extra |

---

## 💰 Cost Summary

| Service | Cost | Status |
|---------|------|--------|
| Firestore Reads | FREE | Using 2.6% of 50K/day |
| Firestore Writes | FREE | Using 3.8% of 20K/day |
| Firestore Storage | FREE | Using 3.1% of 1GB (after 1 year) |
| Vercel Hosting | FREE | Hobby plan |
| SSL/HTTPS | FREE | Auto via Vercel |
| Domain (lucygarden.in) | ₹899/year | Client pays (GoDaddy) |
| Backup Project (lucy-garden-backup) | FREE | Separate Spark plan |
| **TOTAL MONTHLY COST** | **₹0** | Free tier handles everything |

### When will you need to pay?
- **2,000+ retailers daily** → Blaze plan needed (~₹50-150/month)
- **Storage > 1GB** → ~33 years away at current growth
- **Practically:** FREE for 5+ years minimum

---

## 📱 Dev Console — Quick Reference

### Two Consoles

| | React Console | Standalone Console |
|--|---------------|-------------------|
| URL | `/dev` | `/dev-console/` |
| Needs React | Yes | No (plain HTML/JS) |
| Use when | Daily normal use | React app crashed |
| Pages | 20 pages | 12 tabs |
| UI | Premium (Tailwind + Framer) | Simple (vanilla CSS) |

### Standalone Console Tabs (12)

| Tab | Purpose | Daily? |
|-----|---------|--------|
| Health | System status + dev sessions | ✅ Morning check |
| Errors | Crash logs + fixes | ✅ Check daily |
| Sessions | User sessions + unblock | ✅ If complaints |
| Orders | Order lookup + status change | ✅ Fixes |
| Retailers | User lookup + balance fix | ✅ Fixes |
| Tickets | Support tickets + reply | ✅ Reply daily |
| Flags | Feature ON/OFF | When needed |
| Backup | Download + cloud backup | Weekly |
| Usage | Firebase reads/writes stats | Weekly check |
| Editor | Raw document edit | When needed |
| Bulk | Mass update field | Rare |
| Maintenance | App ON/OFF + emergency | Emergency only |

### React Console Extra Pages (not in standalone)

| Page | Route | Purpose |
|------|-------|---------|
| Order Manager | `/dev/order-manager` | Same as standalone Orders tab |
| Analytics | `/dev/analytics` | Order trends, revenue charts |
| Retailer Activity | `/dev/activity` | Active/inactive retailers |
| Deploy Info | `/dev/deploy` | Version, Vercel, Firebase usage bars |
| Announcements | `/dev/announce` | Send banners |
| DB Cleanup | `/dev/cleanup` | Manual old data delete |
| Audit Log | `/dev/audit` | Action history |
| App Ratings | `/dev/ratings` | User ratings |
| Data Export | `/dev/export` | Download as JSON/CSV |
| API Monitor | `/dev/api-monitor` | Latency tester |
| Scheduled Tasks | `/dev/tasks` | Auto jobs |
| Config Diff | `/dev/config-diff` | Settings vs defaults |
| Monthly Report | `/dev/report` | Summary PDF |
| Dev Guide | `/dev/guide` | In-app docs |

---

## 🚨 Common Fixes (Quick Reference)

| Problem | Where to fix | Steps |
|---------|-------------|-------|
| Retailer can't login | Sessions tab | Check blocked → Unblock / Reset PIN |
| Order wrong status | Orders tab | Search → Change status |
| Cancel order wapas chahiye | Orders tab | Cancelled → Confirmed |
| Balance galat | Retailers tab | Search → Edit Balance |
| App slow / not loading | Health tab | Check Firebase connection |
| Feature broken | Flags tab | Disable that feature |
| Users complaining | Tickets tab | Read + Reply |
| Need offline | Maintenance tab | Toggle ON |
| Data loss fear | Backup tab | Download JSON + Cloud backup |
| Too many reads | Usage tab | Check which day spiked |

---

## 📅 Maintenance Routine

### Daily (2 min)
- Health tab → Green? Good
- Errors → Any new unresolved?
- Tickets → Any open? Reply

### Weekly (5 min)
- Usage tab → All bars green?
- Backup → Download JSON + Cloud backup
- Sessions → Any stale/blocked users?

### Monthly (10 min)
- Usage trends → Growing too fast?
- DB Cleanup → Run if needed
- Check app_errors count
- Verify auto-cleanup ran

---

## 🔑 Key Rotation Schedule (Every 3-6 months)

Files to update:
1. `src/services/firebase.js` → `APP_WRITE_KEY`
2. `public/dev-console/js/firebase.js` → `APP_WRITE_KEY`
3. `firestore.rules` → `isApp()` function string
4. `public/dev-console/js/tabs/backup.js` → `BACKUP_SECRET`
5. Backup project Firestore Rules → `_auth` string

Deploy: `firebase deploy --only firestore:rules`

---

## 🆘 Emergency Contacts

| What | Where |
|------|-------|
| Firebase Console | https://console.firebase.google.com → lucy-garden |
| Backup Project | https://console.firebase.google.com → lucy-garden-backup |
| Vercel Dashboard | https://vercel.com |
| Standalone Console | https://lucygarden.in/dev-console/ |

---

*Last updated: June 2026 | v2.4.0*
*PRIVATE — Developer reference only. Do not share with client.*
