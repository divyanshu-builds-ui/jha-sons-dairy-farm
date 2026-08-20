# Jha & Sons Dairy Farm

Public promotional website for Jha & Sons Dairy Farm, Kaluahi, Madhubani, Bihar.

## What this is

- Public-facing marketing website (no login, no admin panel)
- Milk products showcase
- Customer schemes & offers
- Gau Seva / cow welfare section
- Contact & delivery enquiry form (demo mode)

## Tech Stack

- React 18
- React Router v6
- Tailwind CSS
- Framer Motion
- Lucide Icons

## Setup

1. Clone the repo
2. `npm install`
3. `npm start`

## Deploy

```
npm run build
```

## Repository

**Correct repo:** https://github.com/divyanshu-builds-ui/jha-sons-dairy-farm.git

```
git remote add origin https://github.com/divyanshu-builds-ui/jha-sons-dairy-farm.git
git push origin dev
```

> ⚠️ Do NOT push to `Lucy-Garden` repo — that is a different project.

## Brand Config

All business name, contact, and brand values are in:

```
src/utils/config.js
```

Edit that file — changes reflect everywhere automatically.

---

## Design System

### Style

**Type 2 — Warm Premium / Artisan**
Clean, trustworthy, local business feel. No harsh colors, no gradients on text, no neon. Warm and grounded.

### Color Palette — Combo C

| Token | Hex | Usage |
|---|---|---|
| `olive-700` | `#3d5a3e` | Primary — buttons, active nav, headings accent |
| `olive-800` | `#2d4428` | Dark sections background |
| `gold-600` | `#c9a84c` | Accent — badges, highlights, step numbers |
| `sand-50` | `#fafaf7` | Page background |
| `sand-25` | `#fdfcf9` | Card background |
| `sand-950` | `#1c1917` | Footer background |
| `sand-700` | `#57534e` | Body text |
| `sand-400` | `#c8c4be` | Muted / placeholder text |

> **Orange is explicitly rejected** — too harsh for this brand.

### Component Classes (src/index.css)

| Class | Usage |
|---|---|
| `.btn-primary` | Main CTA button — olive bg |
| `.btn-primary-lg` | Large version |
| `.btn-outline` | Secondary button — olive border |
| `.btn-outline-lg` | Large version |
| `.btn-ghost` | Subtle button — no border by default |
| `.btn-whatsapp` | WhatsApp green button |
| `.btn-whatsapp-lg` | Large version |
| `.card` | White card with border and shadow |
| `.container-site` | Max-width centered container |
| `.section-pad` | Consistent vertical section padding |
| `.label-tag` | Small uppercase section label |
| `.heading-xl/lg/md/sm` | Heading scale |
| `.body-lg/md/sm` | Body text scale |
| `.badge-green/gold/olive/sand` | Inline status badges |

### WhatsApp Icon

Always use the official WhatsApp SVG path — **never** use Lucide's `MessageCircle` or any other icon.
The SVG path is defined inline in each component that needs it.

### Logo

Placeholder SVG in `src/assets/Logo.js` — olive green (`#3d5a3e`) background, "J&S" text.
When real logo is ready, only update that one file.

---

Built by [Makeward](https://makeward.in)
