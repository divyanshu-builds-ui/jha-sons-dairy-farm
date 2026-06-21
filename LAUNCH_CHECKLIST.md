# Lucy Garden — Production Launch Checklist

> Follow this checklist before going live with real retailers.

---

## 1. Database Cleanup (Manual — Firebase Console)

- [ ] Delete test/fake retailers from `users` collection (keep only real ones + admin + dev)
- [ ] Delete test orders from `orders` collection
- [ ] Delete test ledger entries from `ledger` collection
- [ ] Delete test support tickets from `support_tickets`
- [ ] Clear `app_errors` collection (fresh start)
- [ ] Clear `audit_log` collection (fresh start)
- [ ] Clear `app_ratings` collection
- [ ] Verify `settings/app` document has correct values:
  - `orderStart`: 12 (or your preferred time)
  - `orderEnd`: 16 (or your preferred time)
  - `maintenance`: false
  - `sessionTimeout`: 24
  - `minOrderAmount`: 100
  - `maxOrderItems`: 50
  - `allowModify`: true
  - `defaultPin`: "1234"
  - `autoCleanup`: true
- [ ] Verify `settings/devAccess` has `pin` field set
- [ ] Verify `settings/featureFlags` — all features ON

---

## 2. Security Verification

- [x] Firestore rules deployed with validation (done)
- [ ] `.env` file has production Firebase keys (not dev project)
- [ ] Dev phone (8051725780) PIN is strong (not 0000 in production)
- [ ] Emergency console PIN changed from default 0000
- [ ] `seed.js` file — DO NOT run on production database
- [ ] Verify no API keys exposed in public code (check git history)

---

## 3. Products Setup

- [ ] All real products added with correct prices
- [ ] Product groups set correctly (affects PDF column order)
- [ ] Seasonal products marked correctly
- [ ] No test products remaining

---

## 4. Retailers Setup

- [ ] All real retailers added with correct:
  - Name
  - Phone (10 digits)
  - Shop name
  - Area
  - PIN (tell them their PIN)
- [ ] No `id: LG-RET-xxx` field in any retailer (run "Remove LG-RET IDs" task)
- [ ] Areas created in Areas page

---

## 5. Functional Testing

### Order Flow
- [ ] Retailer can login with phone + PIN
- [ ] Products load on order page
- [ ] Can add items to cart
- [ ] Checkout shows correct total
- [ ] Order places successfully
- [ ] Order shows in Track page (status: Confirmed)
- [ ] Admin can see order in Daily Ledger
- [ ] Admin can Dispatch (edit quantities if needed)
- [ ] Admin can Deliver (enter payment)
- [ ] Retailer sees status change (Confirmed → Dispatched → Delivered)
- [ ] PDF invoice downloads correctly

### Ledger
- [ ] Retailer ledger shows correct opening/closing balance
- [ ] Admin ledger shows correct entries
- [ ] Payment collection works
- [ ] PDF statement downloads

### Sessions
- [ ] Wrong PIN 5 times → account locks
- [ ] Admin can unblock from Sessions page
- [ ] Login on new device → old session terminated (retailers)
- [ ] Admin can login on multiple devices simultaneously
- [ ] Session expires after timeout

### Other
- [ ] Support ticket creation works
- [ ] Dark mode toggle works
- [ ] PWA install works (Add to Home Screen)
- [ ] Offline banner shows when internet off
- [ ] App works after coming back online

---

## 6. Dev Console Verification

- [ ] React Dev Console (`/dev`) — all 20 pages load
- [ ] Emergency Console (`/dev-console/`) — all 6 tabs work
- [ ] Backup creates successfully
- [ ] Feature flags toggle works
- [ ] Error logs capture errors
- [ ] Maintenance mode blocks retailers

---

## 7. Deployment

- [ ] `npm run build` — no errors
- [ ] Deploy to Vercel/Firebase Hosting
- [ ] Verify custom domain (lucygarden.in) loads
- [ ] HTTPS working (green lock in browser)
- [ ] Service Worker registered (PWA installable)
- [ ] Test on real phone (Android + iPhone if possible)

---

## 8. Post-Launch (First Week)

- [ ] Monitor Error Logs daily
- [ ] Check Usage & Limits in Deploy Info
- [ ] Get feedback from 2-3 retailers
- [ ] Fix any reported issues immediately
- [ ] Take backup daily for first week
- [ ] Monitor sessions — are retailers logging in?

---

## Emergency Contacts

| Role | Name | Phone |
|------|------|-------|
| Developer | Divyanshu Gupta | 8051725780 |
| Admin/Owner | Lal Babu Gupta | 9470248156 |
| Support | — | 9939079107 |

---

*Created: June 2026*
