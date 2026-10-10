# PusakaFC26 — Project Worklog

## Project Status Assessment

**Status: ✅ Core feature-complete and verified via agent-browser.**

PusakaFC26 is a full-stack jersey registration system built with Next.js 16
(App Router), Prisma (SQLite locally / PostgreSQL-ready for Railway), Plus
Jakarta Sans, and Lucide React icons. All specified public and admin flows are
implemented, lint-clean, and browser-verified.

## Tech & Architecture Decisions

- **Database**: Local dev uses SQLite (env constraint). Schema uses `String`
  fields for enum-like values (Gender/Sleeve/Size) with strict app-layer
  validation (`src/lib/validations.ts`). The same schema works on PostgreSQL
  for Railway with zero code changes; enums can be added later if desired.
- **Custom UI**: `CustomDropdown` (fade+scale, full keyboard nav ↑↓/Enter/Esc/
  Home/End, ARIA `listbox`/`option`/`aria-activedescendant`), `CustomCheckbox`
  (smooth SVG check stroke animation), custom scrollbar (WebKit + Firefox
  `scrollbar-width`). No third-party component libs for these.
- **Design tokens**: Neutral warm-gray palette + emerald brand accent. Gender
  badges use teal (Pria) / rose (Wanita) with **text labels** (not color-only).
- **Admin auth**: HMAC-signed httpOnly cookie session. Rate limiting per IP
  stored in `AdminLoginAttempt` table (5 fails → 15-min lock).
- **Duplicate validation**: Client cache (fetched once, indexed into Sets) for
  real-time checks + server-side explicit checks + Prisma unique constraints
  (race-condition safety net).

## Completed Work

### Foundation
- Prisma schema (`prisma/schema.prisma`): `JerseyOrder` + `AdminLoginAttempt`.
- `src/lib/validations.ts`: zod schemas, enum types/labels, type guards.
- `src/lib/auth.ts`: session tokens, cookie helpers, rate limiting, IP extraction.
- `src/lib/constants.ts`: app name, super admin contact (Alfiz Ilham, 0852-1389-6460), admin config.
- `src/app/layout.tsx`: Plus Jakarta Sans via next/font.
- `src/app/globals.css`: design tokens, custom scrollbar, splash/skeleton/toast/
  dropdown/checkbox/sidebar animations, `.jc-input`, `.jc-focus`, reduced-motion.

### Public App (`/`)
- **Splash** (`Splash.tsx`): logo scale 0.3→1 + fade-in (~800ms), fade-out.
- **Skeleton** (`Skeleton.tsx`): shimmer, min 400ms display via `Promise.all`.
- **TopBar** (`TopBar.tsx`): sticky, logo + name + hamburger.
- **Sidebar** (`Sidebar.tsx`): slide-in, nav links, disabled "Lihat Detail Data"
  (lock), sticky Information submenu (About/Privacy/Terms/Super Admin Contact).
- **RegistrationForm** (Page 1): all 6 fields in order + custom dropdowns, real-time
  validation, disabled-submit-when-invalid, double-submit prevention, success toast
  (slide-in top, 3s auto-dismiss), form reset, WhatsApp correction note.
- **UsedNumbersList** (Page 2): combined read-only list, gender text badges, summary
  cards, search.
- **InformationPanel** + **Modal**: About/Privacy/Terms/Super Admin Contact content.
- **Toast** (`Toast.tsx`): context provider, aria-live, slide-in/out.

### API Routes
- `POST/GET /api/orders` — public create + used-entries list.
- `POST /api/admin/login` — password login + rate limiting.
- `POST /api/admin/logout`.
- `GET /api/admin/session`.
- `GET/PUT/DELETE /api/admin/orders` — search/filter/pagination, edit, delete.
- `GET /api/admin/stats` — dashboard counts.
- `GET /api/admin/export?format=xlsx|json` — 2-sheet xlsx (Pria/Wanita) + json.

### Admin Panel (`/admin`)
- `AdminLogin`: password form, show/hide, lockout feedback, back-to-home.
- `AdminDashboard`: 3 summary cards, export buttons, data table with search +
  custom-checkbox gender filter + pagination (20/page), edit modal (saves
  directly), delete confirmation modal.

## Verification Results (agent-browser)

All golden-path flows verified end-to-end in the browser:
- ✅ Splash → skeleton → form transition.
- ✅ Custom dropdown opens with ARIA listbox + options.
- ✅ Full form fill + submit → success toast + form reset.
- ✅ Real-time duplicate detection (name + number) "sudah dipakai".
- ✅ Sidebar nav + disabled "Lihat Detail Data" + Information submenu.
- ✅ Page 2 shows entry with gender text badge.
- ✅ Admin login → dashboard (3 cards + table + export).
- ✅ Edit modal saves directly; delete shows confirmation modal.
- ✅ Rate limiting: 5 fails → 15-min lock with countdown.
- ✅ Export: xlsx has exactly 2 sheets (Pria/Wanita); json valid.
- ✅ Super Admin Contact modal shows Alfiz Ilham + 0852-1389-6460.
- ✅ No console errors; lint clean (`bun run lint` passes).

## Unresolved Issues / Risks / Next-Phase Priorities

- **PostgreSQL migration**: schema uses String fields (works on both SQLite and
  Postgres). For Railway Postgres, optionally convert to native enums + run
  `prisma migrate`. Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` env vars.
- **Admin rate-limit storage**: currently in DB (works across instances). Could
  add Redis for higher-volume deployments.
- **Potential enhancements** (for future rounds):
  - Dark mode toggle (CSS variables already defined for `.dark`).
  - Animated count-up for dashboard stats.
  - CSV export option in addition to xlsx/json.
  - Server-side pagination cursor for very large datasets.
  - Audit log of admin edits/deletes.
  - PWA / offline support for the public form.
