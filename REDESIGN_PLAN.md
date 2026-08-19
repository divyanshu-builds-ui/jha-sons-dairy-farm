# Lucy Garden — Design Redesign & Performance Plan

## Goal
Migrate from current blue/mint/dark theme to a **warm neutral + deep navy** design system, and improve performance.

---

## New Design System (Reference)

### Color Palette
```css
/* Backgrounds */
--color-background: #f8f7f4;
--color-surface: #ffffff;
--color-border: #e2e0db;
--color-border-strong: #c8c5be;

/* Text */
--color-text-primary: #1a1917;
--color-text-secondary: #6b6860;
--color-text-muted: #9c9890;

/* Accent — deep navy */
--color-accent: #1e3a5f;
--color-accent-hover: #162d4a;
--color-accent-light: #e8eef5;

/* Status */
--color-success: #166534;  bg: #f0fdf4
--color-warning: #92400e;  bg: #fffbeb
--color-error:   #991b1b;  bg: #fef2f2
```

### Typography
- Primary: `Inter` (already installed ✅)
- Mono: `JetBrains Mono` — add for numbers/formulas
- `-webkit-font-smoothing: antialiased` — already set ✅
- Font sizes: 12–14px dense, proper line-height

### Border Radius
- Small: `4px` — inputs, badges
- Medium: `6px` — buttons, cards
- Large: `8px` — modals, panels
> Currently using `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-3xl` (24px) — all need to come down

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 2px 8px 0 rgb(0 0 0 / 0.08);
```
> Currently using heavy colored shadows — simplify to neutral

---

## Files to Change

### Phase 1 — Foundation (Design Tokens)
| File | Change |
|------|--------|
| `tailwind.config.js` | Replace `royal`/`mint` colors with `navy` + `warm` neutrals. Add `JetBrains Mono`. Update shadows & border radius. |
| `src/index.css` | Update CSS variables, body bg, base font size (14px), scrollbar colors, component classes (`.card`, `.btn-primary`, `.input-field`) |

### Phase 2 — Layout Components
| File | Change |
|------|--------|
| `src/components/layout/RetailerLayout.js` | Update sidebar, header, bottom nav colors from `royal-*`/`mint-*` to `navy-*`/warm neutrals. Reduce border radius. |
| `src/components/layout/AdminLayout.js` | Same treatment |
| `src/components/layout/DeveloperLayout.js` | Same treatment |

### Phase 3 — Shared Components
| File | Change |
|------|--------|
| `src/components/LoadingSkeleton.js` | Warm neutral shimmer |
| `src/components/ConfirmModal.js` | Smaller radius, navy accent |
| `src/components/SplashScreen.js` | Warm bg, navy branding |
| `src/components/WelcomePopup.js` | Warm surface |
| `src/components/TopProgressBar.js` | Navy color |
| `src/components/PaymentBlock.js` | Navy accent |

### Phase 4 — Retailer Pages
| File | Key Changes |
|------|-------------|
| `pages/retailer/Home.js` | Welcome card gradient → navy, quick action cards → warm surface, status badges → new palette |
| `pages/retailer/PlaceOrder.js` | Input fields → 4px radius, buttons → navy |
| `pages/retailer/Checkout.js` | Summary card → warm surface |
| `pages/retailer/OrderHistory.js` | List items → warm borders |
| `pages/retailer/MyLedger.js` | Debit/credit colors → new status palette |
| `pages/retailer/TrackOrder.js` | Status timeline → new colors |
| `pages/retailer/PriceList.js` | Table → warm surface |
| `pages/retailer/Profile.js` | Form inputs → 4px radius |
| `pages/retailer/Settings.js` | Toggle/switch → navy |
| `pages/retailer/Support.js` | Cards → warm |
| `pages/retailer/Guide.js` | Info cards → warm |
| `pages/retailer/About.js` | Branding → navy |

### Phase 5 — Admin Pages
| File | Key Changes |
|------|-------------|
| `pages/admin/Dashboard.js` | Welcome banner → navy, stat cards → warm, donut chart → navy/warm |
| `pages/admin/DailyLedger.js` | Table → warm surface |
| `pages/admin/Ledger.js` | Balance cards → new status colors |
| `pages/admin/Retailers.js` | List → warm |
| `pages/admin/Inventory.js` | Cards → warm |
| `pages/admin/PlaceOrder.js` | Form → 4px inputs |
| `pages/admin/OrderDetail.js` | Status → new palette |
| `pages/admin/Settings.js` | Form → warm |
| `pages/admin/Announcements.js` | Cards → warm |
| `pages/admin/CompanyOrder.js` | Form → warm |
| `pages/admin/Sessions.js` | Table → warm |
| `pages/admin/SupportTickets.js` | Cards → warm |
| `pages/admin/DevPanel.js` | Minimal changes |

### Phase 6 — Performance
| Area | Action |
|------|--------|
| `framer-motion` | Audit all pages — remove unnecessary `motion.div` wrappers, keep only meaningful animations |
| `useCache` hook | Already exists ✅ — verify TTL values are optimal |
| `content-visibility` | Already in index.css ✅ — verify it's working |
| Font loading | Switch Google Fonts to `display=swap` + add `JetBrains Mono` |
| Image optimization | Logo already small ✅ |
| Bundle | Remove unused `framer-motion` variants where static would do |
| `cachedGetDoc` / `cachedGetDocs` | Already used ✅ |

---

## Execution Order

```
Step 1 → tailwind.config.js          (tokens foundation)
Step 2 → src/index.css               (CSS variables + component classes)
Step 3 → RetailerLayout.js           (main shell)
Step 4 → AdminLayout.js + DevLayout  (admin shell)
Step 5 → Shared components           (LoadingSkeleton, ConfirmModal, etc.)
Step 6 → Retailer pages              (Home first, then rest)
Step 7 → Admin pages                 (Dashboard first, then rest)
Step 8 → Performance audit           (framer-motion cleanup)
```

---

## Color Mapping (Old → New)

| Old Class | New Class / Value |
|-----------|-------------------|
| `bg-[#f8fafc]` | `bg-[#f8f7f4]` |
| `bg-white` | `bg-white` (surface) ✅ |
| `royal-600`, `royal-700` | `navy-600`, `navy-700` |
| `royal-50` | `bg-[#e8eef5]` |
| `mint-500`, `mint-600` | `success-*` or `green-700` |
| `text-gray-800` | `text-[#1a1917]` |
| `text-gray-400` | `text-[#9c9890]` |
| `border-gray-100` | `border-[#e2e0db]` |
| `rounded-2xl` | `rounded-lg` (8px) |
| `rounded-xl` | `rounded-md` (6px) |
| `rounded-3xl` | `rounded-lg` (8px) |
| `shadow-float`, `shadow-card` | `shadow-sm`, `shadow-md` |
| gradient headers | flat navy `bg-[#1e3a5f]` |

## Color Usage Rules

### Primary Accent — Navy `#1e3a5f`
- Buttons (btn-primary), active nav items, table headers
- CTAs, focus rings, active states

### Status Colors — ONLY for data context
| Color | Use Case |
|-------|----------|
| 🔴 Red `#991b1b` | Due amount, error, cancelled, blocked |
| 🟢 Green `#166534` | Paid, delivered, success, streak |
| 🟡 Amber `#92400e` | Pending, warning, order window closed |
| 🔵 Blue `#1e40af` | Dispatched, in transit, info banners |

### Warm Neutrals — everything else
- Page bg, card bg, borders, body text, labels
- No color decoration on cards or sections

### Rules
1. Color only for DATA — not decoration
2. Numbers/amounts → `font-mono` + status color
3. Icons → colored only when conveying status
4. Card backgrounds → always white/warm, never colored
5. Gradients → only Login left panel, nowhere else
6. Max 2 colors visible on any single screen at once

---


```js
navy: {
  950: '#0d1f35',
  900: '#122540',
  800: '#162d4a',
  700: '#1e3a5f',   // primary accent
  600: '#254d7a',
  500: '#2e6095',
  400: '#4a7fb0',
  300: '#7aaacb',
  200: '#b0cfe3',
  100: '#d8e8f2',
  50:  '#e8eef5',   // accent light
},
warm: {
  50:  '#f8f7f4',   // page bg
  100: '#f0ede8',
  200: '#e2e0db',   // border
  300: '#c8c5be',   // border strong
  400: '#9c9890',   // muted text
  500: '#6b6860',   // secondary text
  600: '#4a4845',
  700: '#2e2d2b',
  800: '#1a1917',   // primary text
  900: '#0f0e0d',
}
```

---

## Notes
- Dark mode: Keep existing dark mode support, just update dark: values to match warm palette
- No breaking changes to logic/data — only visual/CSS changes
- Test on mobile (375px) and desktop (1280px) after each phase
- `JetBrains Mono` — use for: prices (₹), quantities, order IDs, ledger numbers
